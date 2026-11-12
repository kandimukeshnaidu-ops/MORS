-- MORS 2.0: Phase 6 Migration — Social Experience Upgrade & Curated Taste Discovery
-- Migration: 20261112000039_mors2_phase6_social_experience_upgrade.sql

-- 1. Fix get_suggested_profiles (citext to text casting & exclusion of blocked users)
CREATE OR REPLACE FUNCTION public.get_suggested_profiles(p_limit integer DEFAULT 5)
RETURNS TABLE (
  id uuid,
  username text,
  display_name text,
  avatar_path text,
  bio text,
  experiences_count integer,
  followers_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_viewer_id uuid;
BEGIN
  v_viewer_id := (SELECT auth.uid());

  RETURN QUERY
  SELECT
    p.id,
    p.username::text,
    p.display_name,
    p.avatar_path,
    p.bio,
    p.experiences_count,
    p.followers_count
  FROM public.profiles p
  WHERE NOT p.is_private
    AND p.discoverable = true
    AND p.deletion_requested_at IS NULL
    AND p.deletion_pending_at IS NULL
    AND (v_viewer_id IS NULL OR (
      p.id <> v_viewer_id
      AND NOT public.is_blocked_between(v_viewer_id, p.id)
      AND NOT EXISTS (
        SELECT 1 FROM public.follows f
        WHERE f.follower_id = v_viewer_id AND f.following_id = p.id
      )
    ))
  ORDER BY p.experiences_count DESC, p.followers_count DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_suggested_profiles(integer) TO anon, authenticated;

-- 2. Taste-Aligned Connections Engine (Pure consensus on mutual public high-rated dishes & cuisines)
CREATE OR REPLACE FUNCTION public.get_taste_aligned_profiles(p_limit integer DEFAULT 5)
RETURNS TABLE (
  id uuid,
  username text,
  display_name text,
  avatar_path text,
  bio text,
  shared_cuisine text,
  shared_high_rated_dishes bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_viewer_id uuid;
BEGIN
  v_viewer_id := (SELECT auth.uid());
  IF v_viewer_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH viewer_high_dishes AS (
    SELECT DISTINCT ed.dish_id, fe.cuisine
    FROM public.experience_dishes ed
    JOIN public.food_experiences fe ON fe.id = ed.experience_id
    WHERE fe.user_id = v_viewer_id
      AND fe.status = 'published'
      AND ed.dish_id IS NOT NULL
      AND (ed.rating >= 8 OR fe.overall_rating >= 8)
  ),
  candidate_matches AS (
    SELECT
      p.id AS candidate_id,
      p.username::text AS c_username,
      p.display_name AS c_display_name,
      p.avatar_path AS c_avatar_path,
      p.bio AS c_bio,
      vhd.cuisine AS match_cuisine,
      count(DISTINCT ed2.dish_id) AS mutual_dishes_count
    FROM viewer_high_dishes vhd
    JOIN public.experience_dishes ed2 ON ed2.dish_id = vhd.dish_id
    JOIN public.food_experiences fe2 ON fe2.id = ed2.experience_id
    JOIN public.profiles p ON p.id = fe2.user_id
    WHERE fe2.user_id <> v_viewer_id
      AND fe2.status = 'published'
      AND fe2.visibility = 'public'
      AND p.is_private = false
      AND p.discoverable = true
      AND p.deletion_requested_at IS NULL
      AND p.deletion_pending_at IS NULL
      AND (ed2.rating >= 8 OR fe2.overall_rating >= 8)
      AND NOT public.is_blocked_between(v_viewer_id, p.id)
      AND NOT EXISTS (
        SELECT 1 FROM public.follows f
        WHERE f.follower_id = v_viewer_id AND f.following_id = p.id
      )
    GROUP BY p.id, p.username, p.display_name, p.avatar_path, p.bio, vhd.cuisine
  )
  SELECT
    cm.candidate_id,
    cm.c_username,
    cm.c_display_name,
    cm.c_avatar_path,
    cm.c_bio,
    cm.match_cuisine,
    cm.mutual_dishes_count
  FROM candidate_matches cm
  ORDER BY cm.mutual_dishes_count DESC, cm.c_username ASC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_taste_aligned_profiles(integer) TO authenticated;

-- 3. Unified Fast Home Feed RPC (Eliminates N+1 client queries and embeds engagement stats)
CREATE OR REPLACE FUNCTION public.get_home_feed_v2(
  p_cursor_published_at timestamptz DEFAULT NULL,
  p_cursor_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 15
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_viewer_id uuid;
  v_items jsonb := '[]'::jsonb;
  v_next_cursor jsonb := NULL;
BEGIN
  v_viewer_id := (SELECT auth.uid());

  WITH eligible_experiences AS (
    SELECT
      fe.id,
      fe.user_id,
      fe.title,
      fe.category_slug,
      fe.cuisine,
      fe.eaten_at,
      fe.published_at,
      fe.visibility,
      fe.overall_rating,
      fe.description,
      fe.place_id
    FROM public.food_experiences fe
    WHERE fe.status = 'published'
      AND fe.published_at IS NOT NULL
      AND public.can_view_experience(v_viewer_id, fe.id)
      AND (
        -- If viewer authenticated: own posts OR posts of accepted followed users
        (v_viewer_id IS NOT NULL AND (
          fe.user_id = v_viewer_id
          OR EXISTS (
            SELECT 1 FROM public.follows f
            WHERE f.follower_id = v_viewer_id
              AND f.following_id = fe.user_id
              AND f.status = 'accepted'
          )
        ))
        OR
        -- If unauthenticated: public pool only
        (v_viewer_id IS NULL AND fe.visibility = 'public' AND NOT EXISTS (
          SELECT 1 FROM public.profiles p WHERE p.id = fe.user_id AND p.is_private
        ))
      )
      -- Keyset pagination
      AND (
        p_cursor_published_at IS NULL
        OR (fe.published_at < p_cursor_published_at)
        OR (fe.published_at = p_cursor_published_at AND fe.id < p_cursor_id)
      )
    ORDER BY fe.published_at DESC, fe.id DESC
    LIMIT (p_limit + 1)
  ),
  aggregated_feed AS (
    SELECT
      ee.id,
      ee.title,
      ee.category_slug,
      ee.cuisine,
      ee.eaten_at,
      ee.published_at,
      ee.visibility,
      ee.overall_rating,
      ee.description,
      -- Author
      jsonb_build_object(
        'id', pr.id,
        'username', pr.username::text,
        'display_name', pr.display_name,
        'avatar_path', pr.avatar_path
      ) AS author,
      -- Place
      CASE
        WHEN pl.id IS NOT NULL THEN jsonb_build_object(
          'id', pl.id,
          'name', pl.name,
          'city', pl.city
        )
        ELSE NULL
      END AS place,
      -- Dishes
      COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object(
            'display_name', ed.display_name,
            'rating', ed.rating,
            'taste_rating', ed.taste_rating
          ) ORDER BY ed.position ASC
        )
        FROM public.experience_dishes ed
        WHERE ed.experience_id = ee.id
      ), '[]'::jsonb) AS dishes,
      -- Primary photo
      (
        SELECT ep.storage_path
        FROM public.experience_photos ep
        WHERE ep.experience_id = ee.id
        ORDER BY ep.position ASC
        LIMIT 1
      ) AS primary_photo_path,
      -- Like count & Viewer like state
      (SELECT count(*)::int FROM public.experience_likes el WHERE el.experience_id = ee.id) AS likes_count,
      (SELECT count(*)::int FROM public.experience_comments ec WHERE ec.experience_id = ee.id) AS comments_count,
      (v_viewer_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.experience_likes el WHERE el.experience_id = ee.id AND el.user_id = v_viewer_id
      )) AS is_liked_by_viewer
    FROM eligible_experiences ee
    JOIN public.profiles pr ON pr.id = ee.user_id
    LEFT JOIN public.places pl ON pl.id = ee.place_id
    ORDER BY ee.published_at DESC, ee.id DESC
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', af.id,
      'title', af.title,
      'category_slug', af.category_slug,
      'cuisine', af.cuisine,
      'eaten_at', af.eaten_at,
      'published_at', af.published_at,
      'visibility', af.visibility,
      'overall_rating', af.overall_rating,
      'description', af.description,
      'author', af.author,
      'place', af.place,
      'dishes', af.dishes,
      'primary_photo_path', af.primary_photo_path,
      'likes_count', af.likes_count,
      'comments_count', af.comments_count,
      'is_liked_by_viewer', af.is_liked_by_viewer
    )
  )
  INTO v_items
  FROM aggregated_feed af;

  IF v_items IS NULL THEN
    v_items := '[]'::jsonb;
  END IF;

  -- Determine next cursor if more rows exist
  IF jsonb_array_length(v_items) > p_limit THEN
    v_next_cursor := jsonb_build_object(
      'published_at', v_items->(p_limit - 1)->>'published_at',
      'id', v_items->(p_limit - 1)->>'id'
    );
    -- Slice items to p_limit
    SELECT jsonb_agg(elem)
    INTO v_items
    FROM (
      SELECT elem
      FROM jsonb_array_elements(v_items) WITH ORDINALITY arr(elem, idx)
      WHERE idx <= p_limit
    ) sub;
  END IF;

  RETURN jsonb_build_object(
    'items', v_items,
    'next_cursor', v_next_cursor
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_home_feed_v2(timestamptz, uuid, integer) TO anon, authenticated;

-- 4. Fix convert_plan_to_meal_drafts (Column name & required display_name / category_slug)
CREATE OR REPLACE FUNCTION public.convert_plan_to_meal_drafts(p_plan_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller UUID := (SELECT auth.uid());
  v_plan RECORD;
  v_member RECORD;
  v_draft_id UUID;
  v_count INT := 0;
  v_target_dish_id UUID;
  v_target_dish_name TEXT := 'Planned Dish';
  v_target_place_id UUID;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT p.*, c.user_id AS coll_owner_id
  INTO v_plan
  FROM public.plans p
  JOIN public.collections c ON c.id = p.collection_id
  WHERE p.id = p_plan_id;

  IF v_plan.id IS NULL THEN
    RAISE EXCEPTION 'Plan not found';
  END IF;

  -- Ensure caller is owner or accepted editor/member
  IF v_plan.coll_owner_id != v_caller AND NOT EXISTS (
    SELECT 1 FROM public.collection_members cm
    WHERE cm.collection_id = v_plan.collection_id AND cm.user_id = v_caller AND cm.status = 'accepted'
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Check candidate item if decided
  IF v_plan.decided_item_id IS NOT NULL THEN
    SELECT ci.dish_id, ci.place_id, COALESCE(d.name, 'Planned Dish')
    INTO v_target_dish_id, v_target_place_id, v_target_dish_name
    FROM public.collection_items ci
    LEFT JOIN public.dishes d ON d.id = ci.dish_id
    WHERE ci.id = v_plan.decided_item_id;
  END IF;

  -- Create private meal draft for collection owner and accepted members
  FOR v_member IN (
    SELECT v_plan.coll_owner_id AS uid
    UNION
    SELECT cm.user_id AS uid
    FROM public.collection_members cm
    WHERE cm.collection_id = v_plan.collection_id AND cm.status = 'accepted'
  ) LOOP
    v_draft_id := gen_random_uuid();
    INSERT INTO public.food_experiences (
      id,
      user_id,
      title,
      category_slug,
      eaten_at,
      status,
      visibility,
      place_id
    ) VALUES (
      v_draft_id,
      v_member.uid,
      v_plan.title,
      'restaurant',
      COALESCE(v_plan.planned_for, now()),
      'draft',
      'private',
      v_target_place_id
    );

    IF v_target_dish_id IS NOT NULL THEN
      INSERT INTO public.experience_dishes (
        experience_id,
        dish_id,
        display_name,
        position
      ) VALUES (
        v_draft_id,
        v_target_dish_id,
        v_target_dish_name,
        0
      );
    END IF;

    v_count := v_count + 1;
  END LOOP;

  -- Update plan status
  UPDATE public.plans
  SET status = 'completed', updated_at = now()
  WHERE id = p_plan_id;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.convert_plan_to_meal_drafts(UUID) TO authenticated;
