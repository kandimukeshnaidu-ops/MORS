-- ==============================================================================
-- MORS 2.0 Database Migration: 20261112000034_mors2_phase1_rating_domain_and_rls_fixes.sql
-- Phase 1: Multi-Dimensional Rating Domain, RLS Hardening & Public Pool Trigger
-- ==============================================================================

-- 1. Extend food_experiences with Multi-Dimensional Restaurant Review fields
ALTER TABLE public.food_experiences
  ADD COLUMN IF NOT EXISTS place_rating_overall smallint CHECK (place_rating_overall IS NULL OR (place_rating_overall >= 1 AND place_rating_overall <= 10)),
  ADD COLUMN IF NOT EXISTS place_rating_food smallint CHECK (place_rating_food IS NULL OR (place_rating_food >= 1 AND place_rating_food <= 10)),
  ADD COLUMN IF NOT EXISTS place_rating_value smallint CHECK (place_rating_value IS NULL OR (place_rating_value >= 1 AND place_rating_value <= 10)),
  ADD COLUMN IF NOT EXISTS place_rating_ambience smallint CHECK (place_rating_ambience IS NULL OR (place_rating_ambience >= 1 AND place_rating_ambience <= 10)),
  ADD COLUMN IF NOT EXISTS place_rating_service smallint CHECK (place_rating_service IS NULL OR (place_rating_service >= 1 AND place_rating_service <= 10)),
  ADD COLUMN IF NOT EXISTS place_rating_hygiene smallint CHECK (place_rating_hygiene IS NULL OR (place_rating_hygiene >= 1 AND place_rating_hygiene <= 10)),
  ADD COLUMN IF NOT EXISTS dining_context text CHECK (dining_context IS NULL OR dining_context IN ('dine_in', 'takeaway', 'street_stall')),
  ADD COLUMN IF NOT EXISTS would_return boolean;

-- Invariant constraint: Restaurant review fields can only exist when place_id IS NOT NULL
ALTER TABLE public.food_experiences
  DROP CONSTRAINT IF EXISTS check_place_ratings_require_place;

ALTER TABLE public.food_experiences
  ADD CONSTRAINT check_place_ratings_require_place CHECK (
    place_id IS NOT NULL OR (
      place_rating_overall IS NULL AND
      place_rating_food IS NULL AND
      place_rating_value IS NULL AND
      place_rating_ambience IS NULL AND
      place_rating_service IS NULL AND
      place_rating_hygiene IS NULL AND
      dining_context IS NULL AND
      would_return IS NULL
    )
  );

-- 2. Extend experience_dishes with Dish Sub-Ratings & Pricing Metadata
ALTER TABLE public.experience_dishes
  ADD COLUMN IF NOT EXISTS taste_rating smallint CHECK (taste_rating IS NULL OR (taste_rating >= 1 AND taste_rating <= 10)),
  ADD COLUMN IF NOT EXISTS portion_rating smallint CHECK (portion_rating IS NULL OR (portion_rating >= 1 AND portion_rating <= 10)),
  ADD COLUMN IF NOT EXISTS value_rating smallint CHECK (value_rating IS NULL OR (value_rating >= 1 AND value_rating <= 10)),
  ADD COLUMN IF NOT EXISTS price_amount numeric(10,2) CHECK (price_amount IS NULL OR price_amount >= 0),
  ADD COLUMN IF NOT EXISTS dietary_tag text CHECK (dietary_tag IS NULL OR dietary_tag IN ('veg', 'egg', 'non_veg')),
  ADD COLUMN IF NOT EXISTS spice_level smallint CHECK (spice_level IS NULL OR (spice_level >= 1 AND spice_level <= 4));

-- 3. Extend place_public_stats with public_rating_count and 5-dimension metrics
ALTER TABLE public.place_public_stats
  ADD COLUMN IF NOT EXISTS public_rating_count bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS food_quality_avg numeric(4,2),
  ADD COLUMN IF NOT EXISTS food_quality_count bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS value_for_money_avg numeric(4,2),
  ADD COLUMN IF NOT EXISTS value_for_money_count bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ambience_avg numeric(4,2),
  ADD COLUMN IF NOT EXISTS ambience_count bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS service_avg numeric(4,2),
  ADD COLUMN IF NOT EXISTS service_count bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hygiene_avg numeric(4,2),
  ADD COLUMN IF NOT EXISTS hygiene_count bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS would_return_pct numeric(5,2);

-- 4. Extend dish_public_stats with dish sub-dimension metrics
ALTER TABLE public.dish_public_stats
  ADD COLUMN IF NOT EXISTS taste_avg numeric(4,2),
  ADD COLUMN IF NOT EXISTS portion_avg numeric(4,2),
  ADD COLUMN IF NOT EXISTS value_avg numeric(4,2);

-- 5. Fix RLS on public.dishes and public.places (BUG-01: Non-Negotiable #11 Creator Isolation)
DROP POLICY IF EXISTS "Dishes readable by everyone" ON public.dishes;
DROP POLICY IF EXISTS "dishes_select_policy" ON public.dishes;
CREATE POLICY "dishes_select_policy" ON public.dishes
  FOR SELECT
  USING (
    is_listed = true
    OR created_by = (SELECT auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "Places readable by everyone" ON public.places;
DROP POLICY IF EXISTS "places_select_policy" ON public.places;
CREATE POLICY "places_select_policy" ON public.places
  FOR SELECT
  USING (
    is_listed = true
    OR created_by = (SELECT auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

-- 6. Update search_all, find_similar_dishes, and find_similar_places to enforce unlisted isolation
CREATE OR REPLACE FUNCTION public.search_all(
    p_query text,
    p_types text[] DEFAULT NULL,
    p_city text DEFAULT NULL,
    p_limit integer DEFAULT 25
)
RETURNS TABLE (
    result_type text,
    id text,
    title text,
    subtitle text,
    photo_url text,
    url text,
    score double precision
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    clean_q text;
    viewer_uuid uuid;
BEGIN
    clean_q := trim(p_query);
    IF clean_q = '' OR clean_q IS NULL THEN
        RETURN;
    END IF;

    viewer_uuid := auth.uid();

    RETURN QUERY
    WITH combined_results AS (
        -- A. Canonical Dishes (Filtered for listed OR creator)
        SELECT
            'dish'::text AS r_type,
            d.id::text AS r_id,
            d.name::text AS r_title,
            COALESCE(d.cuisine, 'Dish')::text AS r_subtitle,
            NULL::text AS r_photo,
            ('/dish/' || d.slug)::text AS r_url,
            GREATEST(
                extensions.similarity(d.name, clean_q),
                extensions.similarity(d.normalized_name, lower(clean_q)),
                CASE WHEN d.name ILIKE '%' || clean_q || '%' THEN 0.8 ELSE 0.0 END
            )::double precision AS r_score
        FROM public.dishes d
        WHERE (p_types IS NULL OR 'dish' = ANY(p_types))
          AND (d.is_listed = true OR (viewer_uuid IS NOT NULL AND d.created_by = viewer_uuid))
          AND (
              d.name ILIKE '%' || clean_q || '%' OR
              d.normalized_name % lower(clean_q) OR
              extensions.similarity(d.name, clean_q) > 0.25
          )

        UNION ALL

        -- B. Dining Places / Venues (Filtered for listed OR creator)
        SELECT
            'place'::text AS r_type,
            pl.id::text AS r_id,
            pl.name::text AS r_title,
            COALESCE(pl.city, 'Dining Venue')::text AS r_subtitle,
            NULL::text AS r_photo,
            ('/place/' || pl.id)::text AS r_url,
            GREATEST(
                extensions.similarity(pl.name, clean_q),
                extensions.similarity(pl.normalized_name, lower(clean_q)),
                CASE WHEN pl.name ILIKE '%' || clean_q || '%' THEN 0.8 ELSE 0.0 END
            )::double precision AS r_score
        FROM public.places pl
        WHERE (p_types IS NULL OR 'place' = ANY(p_types))
          AND (pl.is_listed = true OR (viewer_uuid IS NOT NULL AND pl.created_by = viewer_uuid))
          AND (p_city IS NULL OR pl.city ILIKE '%' || p_city || '%')
          AND (
              pl.name ILIKE '%' || clean_q || '%' OR
              pl.normalized_name % lower(clean_q) OR
              extensions.similarity(pl.name, clean_q) > 0.25
          )

        UNION ALL

        -- C. Discoverable Users / Profiles
        SELECT
            'user'::text AS r_type,
            pr.id::text AS r_id,
            pr.username::text AS r_title,
            pr.display_name::text AS r_subtitle,
            pr.avatar_path::text AS r_photo,
            ('/u/' || pr.username)::text AS r_url,
            GREATEST(
                extensions.similarity(pr.username, clean_q),
                COALESCE(extensions.similarity(pr.display_name, clean_q), 0.0),
                CASE WHEN pr.username ILIKE '%' || clean_q || '%' THEN 0.85 ELSE 0.0 END
            )::double precision AS r_score
        FROM public.profiles pr
        WHERE (p_types IS NULL OR 'user' = ANY(p_types))
          AND pr.discoverable = true
          AND (viewer_uuid IS NULL OR NOT public.is_blocked_bidirectional(viewer_uuid, pr.id))
          AND (
              pr.username ILIKE '%' || clean_q || '%' OR
              (pr.display_name IS NOT NULL AND pr.display_name ILIKE '%' || clean_q || '%') OR
              pr.username % clean_q OR
              extensions.similarity(pr.username, clean_q) > 0.25
          )

        UNION ALL

        -- D. Food Experiences (Strictly viewer-permitted)
        SELECT
            'experience'::text AS r_type,
            fe.id::text AS r_id,
            COALESCE(fe.title, 'Food Experience')::text AS r_title,
            COALESCE(fe.cuisine, 'Journal Entry')::text AS r_subtitle,
            NULL::text AS r_photo,
            ('/e/' || fe.id)::text AS r_url,
            GREATEST(
                COALESCE(extensions.similarity(fe.title, clean_q), 0.0),
                CASE WHEN fe.title ILIKE '%' || clean_q || '%' THEN 0.75 ELSE 0.0 END,
                CASE WHEN fe.description ILIKE '%' || clean_q || '%' THEN 0.6 ELSE 0.0 END
            )::double precision AS r_score
        FROM public.food_experiences fe
        WHERE (p_types IS NULL OR 'experience' = ANY(p_types))
          AND public.can_view_experience(viewer_uuid, fe.id)
          AND (
              fe.title ILIKE '%' || clean_q || '%' OR
              (fe.description IS NOT NULL AND fe.description ILIKE '%' || clean_q || '%') OR
              (fe.title IS NOT NULL AND extensions.similarity(fe.title, clean_q) > 0.25)
          )

        UNION ALL

        -- E. Public Collections
        SELECT
            'collection'::text AS r_type,
            col.id::text AS r_id,
            col.name::text AS r_title,
            (col.items_count || ' items')::text AS r_subtitle,
            col.cover_photo_path::text AS r_photo,
            ('/c/' || col.id)::text AS r_url,
            GREATEST(
                extensions.similarity(col.name, clean_q),
                CASE WHEN col.name ILIKE '%' || clean_q || '%' THEN 0.8 ELSE 0.0 END
            )::double precision AS r_score
        FROM public.collections col
        WHERE (p_types IS NULL OR 'collection' = ANY(p_types))
          AND col.visibility = 'public'
          AND public.can_view_collection(viewer_uuid, col.id)
          AND (
              col.name ILIKE '%' || clean_q || '%' OR
              (col.description IS NOT NULL AND col.description ILIKE '%' || clean_q || '%') OR
              extensions.similarity(col.name, clean_q) > 0.25
          )
    )
    SELECT
        r_type,
        r_id,
        r_title,
        r_subtitle,
        r_photo,
        r_url,
        r_score
    FROM combined_results
    ORDER BY r_score DESC, r_title ASC
    LIMIT p_limit;
END;
$$;

CREATE OR REPLACE FUNCTION public.find_similar_dishes(
  p_name text,
  p_threshold real DEFAULT 0.3
)
RETURNS TABLE (
  dish_id uuid,
  name text,
  slug text,
  similarity real
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_normalized text;
  v_viewer_uuid uuid := (SELECT auth.uid());
BEGIN
  v_normalized := lower(regexp_replace(p_name, '[^a-zA-Z0-9]', '', 'g'));

  RETURN QUERY
  SELECT
    d.id AS dish_id,
    d.name,
    d.slug,
    extensions.similarity(d.normalized_name, v_normalized) AS similarity
  FROM public.dishes d
  WHERE d.merged_into_id IS NULL
    AND (d.is_listed = true OR (v_viewer_uuid IS NOT NULL AND d.created_by = v_viewer_uuid))
    AND extensions.similarity(d.normalized_name, v_normalized) >= p_threshold
  ORDER BY similarity DESC
  LIMIT 5;
END;
$$;

CREATE OR REPLACE FUNCTION public.find_similar_places(
  p_name text,
  p_city text DEFAULT NULL,
  p_threshold real DEFAULT 0.3
)
RETURNS TABLE (
  place_id uuid,
  name text,
  city text,
  similarity real
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_normalized text;
  v_viewer_uuid uuid := (SELECT auth.uid());
BEGIN
  v_normalized := lower(regexp_replace(p_name, '[^a-zA-Z0-9]', '', 'g'));

  RETURN QUERY
  SELECT
    pl.id AS place_id,
    pl.name,
    pl.city,
    extensions.similarity(pl.normalized_name, v_normalized) AS similarity
  FROM public.places pl
  WHERE pl.merged_into_id IS NULL
    AND (pl.is_listed = true OR (v_viewer_uuid IS NOT NULL AND pl.created_by = v_viewer_uuid))
    AND extensions.similarity(pl.normalized_name, v_normalized) >= p_threshold
    AND (p_city IS NULL OR pl.city ILIKE ('%' || p_city || '%'))
  ORDER BY similarity DESC
  LIMIT 5;
END;
$$;

-- 7. Update recompute_dish_stats and recompute_place_stats with Sub-Dimensions
CREATE OR REPLACE FUNCTION public.recompute_dish_stats(p_dish_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_exp_cnt integer := 0;
  v_rat_cnt integer := 0;
  v_rat_avg numeric(4,2) := NULL;
  v_taste_avg numeric(4,2) := NULL;
  v_portion_avg numeric(4,2) := NULL;
  v_val_avg numeric(4,2) := NULL;
BEGIN
  IF p_dish_id IS NULL THEN RETURN; END IF;

  SELECT
    count(DISTINCT fe.id)::int,
    count(ed.rating)::int,
    round(avg(ed.rating)::numeric, 2),
    round(avg(ed.taste_rating)::numeric, 2),
    round(avg(ed.portion_rating)::numeric, 2),
    round(avg(ed.value_rating)::numeric, 2)
  INTO v_exp_cnt, v_rat_cnt, v_rat_avg, v_taste_avg, v_portion_avg, v_val_avg
  FROM public.experience_dishes ed
  JOIN public.food_experiences fe ON ed.experience_id = fe.id
  JOIN public.profiles p ON fe.user_id = p.id
  WHERE ed.dish_id = p_dish_id
    AND fe.status = 'published'
    AND fe.visibility = 'public'
    AND p.is_private = false
    AND p.discoverable = true
    AND p.deletion_requested_at IS NULL
    AND p.deletion_pending_at IS NULL;

  INSERT INTO public.dish_public_stats (
    dish_id,
    public_experience_count,
    public_rating_count,
    public_rating_avg,
    taste_avg,
    portion_avg,
    value_avg
  )
  VALUES (
    p_dish_id,
    v_exp_cnt,
    v_rat_cnt,
    v_rat_avg,
    v_taste_avg,
    v_portion_avg,
    v_val_avg
  )
  ON CONFLICT (dish_id) DO UPDATE
  SET public_experience_count = EXCLUDED.public_experience_count,
      public_rating_count = EXCLUDED.public_rating_count,
      public_rating_avg = EXCLUDED.public_rating_avg,
      taste_avg = EXCLUDED.taste_avg,
      portion_avg = EXCLUDED.portion_avg,
      value_avg = EXCLUDED.value_avg;
END;
$$;

CREATE OR REPLACE FUNCTION public.recompute_place_stats(p_place_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_exp_cnt integer := 0;
  v_rat_cnt bigint := 0;
  v_rat_avg numeric(4,2) := NULL;
  v_food_avg numeric(4,2) := NULL;
  v_food_cnt bigint := 0;
  v_val_avg numeric(4,2) := NULL;
  v_val_cnt bigint := 0;
  v_amb_avg numeric(4,2) := NULL;
  v_amb_cnt bigint := 0;
  v_srv_avg numeric(4,2) := NULL;
  v_srv_cnt bigint := 0;
  v_hyg_avg numeric(4,2) := NULL;
  v_hyg_cnt bigint := 0;
  v_return_pct numeric(5,2) := NULL;
BEGIN
  IF p_place_id IS NULL THEN RETURN; END IF;

  SELECT
    count(DISTINCT fe.id)::int,
    count(COALESCE(fe.place_rating_overall, fe.overall_rating))::bigint,
    round(avg(COALESCE(fe.place_rating_overall, fe.overall_rating))::numeric, 2),
    round(avg(fe.place_rating_food)::numeric, 2),
    count(fe.place_rating_food)::bigint,
    round(avg(fe.place_rating_value)::numeric, 2),
    count(fe.place_rating_value)::bigint,
    round(avg(fe.place_rating_ambience)::numeric, 2),
    count(fe.place_rating_ambience)::bigint,
    round(avg(fe.place_rating_service)::numeric, 2),
    count(fe.place_rating_service)::bigint,
    round(avg(fe.place_rating_hygiene)::numeric, 2),
    count(fe.place_rating_hygiene)::bigint,
    round((count(*) FILTER (WHERE fe.would_return = true)::numeric / NULLIF(count(*) FILTER (WHERE fe.would_return IS NOT NULL), 0)) * 100, 2)
  INTO
    v_exp_cnt,
    v_rat_cnt,
    v_rat_avg,
    v_food_avg,
    v_food_cnt,
    v_val_avg,
    v_val_cnt,
    v_amb_avg,
    v_amb_cnt,
    v_srv_avg,
    v_srv_cnt,
    v_hyg_avg,
    v_hyg_cnt,
    v_return_pct
  FROM public.food_experiences fe
  JOIN public.profiles p ON fe.user_id = p.id
  WHERE fe.place_id = p_place_id
    AND fe.status = 'published'
    AND fe.visibility = 'public'
    AND p.is_private = false
    AND p.discoverable = true
    AND p.deletion_requested_at IS NULL
    AND p.deletion_pending_at IS NULL;

  INSERT INTO public.place_public_stats (
    place_id,
    public_experience_count,
    public_rating_count,
    public_rating_avg,
    food_quality_avg,
    food_quality_count,
    value_for_money_avg,
    value_for_money_count,
    ambience_avg,
    ambience_count,
    service_avg,
    service_count,
    hygiene_avg,
    hygiene_count,
    would_return_pct
  )
  VALUES (
    p_place_id,
    v_exp_cnt,
    v_rat_cnt,
    v_rat_avg,
    v_food_avg,
    v_food_cnt,
    v_val_avg,
    v_val_cnt,
    v_amb_avg,
    v_amb_cnt,
    v_srv_avg,
    v_srv_cnt,
    v_hyg_avg,
    v_hyg_cnt,
    v_return_pct
  )
  ON CONFLICT (place_id) DO UPDATE
  SET public_experience_count = EXCLUDED.public_experience_count,
      public_rating_count = EXCLUDED.public_rating_count,
      public_rating_avg = EXCLUDED.public_rating_avg,
      food_quality_avg = EXCLUDED.food_quality_avg,
      food_quality_count = EXCLUDED.food_quality_count,
      value_for_money_avg = EXCLUDED.value_for_money_avg,
      value_for_money_count = EXCLUDED.value_for_money_count,
      ambience_avg = EXCLUDED.ambience_avg,
      ambience_count = EXCLUDED.ambience_count,
      service_avg = EXCLUDED.service_avg,
      service_count = EXCLUDED.service_count,
      hygiene_avg = EXCLUDED.hygiene_avg,
      hygiene_count = EXCLUDED.hygiene_count,
      would_return_pct = EXCLUDED.would_return_pct;
END;
$$;

-- 8. Fix BUG-04 in recompute_user_stats (AVG(fe.overall_rating))
CREATE OR REPLACE FUNCTION public.recompute_user_stats(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_owner_data JSONB;
  v_public_data JSONB;
  v_is_profile_public BOOLEAN;
  v_is_pending_del BOOLEAN;
BEGIN
  SELECT is_private = false, (deletion_pending_at IS NOT NULL OR deletion_requested_at IS NOT NULL)
  INTO v_is_profile_public, v_is_pending_del
  FROM public.profiles
  WHERE id = p_user_id;

  -- 1. Owner Stats (All published entries of user)
  SELECT jsonb_build_object(
    'total_experiences', COALESCE(COUNT(DISTINCT fe.id), 0),
    'distinct_dishes', COALESCE(COUNT(DISTINCT ed.dish_id), 0),
    'distinct_places', COALESCE(COUNT(DISTINCT fe.place_id), 0),
    'avg_rating', ROUND(AVG(fe.overall_rating)::numeric, 1)
  )
  INTO v_owner_data
  FROM public.food_experiences fe
  LEFT JOIN public.experience_dishes ed ON ed.experience_id = fe.id
  WHERE fe.user_id = p_user_id
    AND fe.status = 'published';

  INSERT INTO public.user_stats_owner (user_id, period, data, computed_at)
  VALUES (p_user_id, 'all_time', COALESCE(v_owner_data, '{}'::jsonb), now())
  ON CONFLICT (user_id, period)
  DO UPDATE SET data = EXCLUDED.data, computed_at = EXCLUDED.computed_at;

  -- 2. Public Stats (Only public-pool entries, strictly if profile is public & not pending deletion)
  IF v_is_profile_public AND NOT v_is_pending_del THEN
    SELECT jsonb_build_object(
      'total_experiences', COALESCE(COUNT(DISTINCT fe.id), 0),
      'distinct_dishes', COALESCE(COUNT(DISTINCT ed.dish_id), 0),
      'distinct_places', COALESCE(COUNT(DISTINCT fe.place_id), 0),
      'avg_rating', ROUND(AVG(fe.overall_rating)::numeric, 1)
    )
    INTO v_public_data
    FROM public.food_experiences fe
    LEFT JOIN public.experience_dishes ed ON ed.experience_id = fe.id
    WHERE fe.user_id = p_user_id
      AND fe.status = 'published'
      AND fe.visibility = 'public';

    INSERT INTO public.user_stats_public (user_id, period, data, computed_at)
    VALUES (p_user_id, 'all_time', COALESCE(v_public_data, '{}'::jsonb), now())
    ON CONFLICT (user_id, period)
    DO UPDATE SET data = EXCLUDED.data, computed_at = EXCLUDED.computed_at;
  ELSE
    DELETE FROM public.user_stats_public WHERE user_id = p_user_id;
  END IF;
END;
$$;

-- 9. Fix BUG-02: Public-Pool Profile State Trigger
CREATE OR REPLACE FUNCTION public.handle_profile_public_pool_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_dish_id UUID;
  v_place_id UUID;
BEGIN
  IF (OLD.is_private IS DISTINCT FROM NEW.is_private)
     OR (OLD.discoverable IS DISTINCT FROM NEW.discoverable)
     OR (OLD.deletion_requested_at IS DISTINCT FROM NEW.deletion_requested_at)
     OR (OLD.deletion_pending_at IS DISTINCT FROM NEW.deletion_pending_at) THEN

    -- Recompute all places visited by this user
    FOR v_place_id IN
      SELECT DISTINCT fe.place_id
      FROM public.food_experiences fe
      WHERE fe.user_id = NEW.id AND fe.place_id IS NOT NULL
    LOOP
      PERFORM public.recompute_place_stats(v_place_id);
    END LOOP;

    -- Recompute all dishes logged by this user
    FOR v_dish_id IN
      SELECT DISTINCT ed.dish_id
      FROM public.experience_dishes ed
      JOIN public.food_experiences fe ON fe.id = ed.experience_id
      WHERE fe.user_id = NEW.id AND ed.dish_id IS NOT NULL
    LOOP
      PERFORM public.recompute_dish_stats(v_dish_id);
    END LOOP;

    -- Also refresh user's public taste stats
    PERFORM public.recompute_user_stats(NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_public_pool_change ON public.profiles;
CREATE TRIGGER on_profile_public_pool_change
  AFTER UPDATE OF is_private, discoverable, deletion_requested_at, deletion_pending_at
  ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_profile_public_pool_change();

-- 10. Update CREATE_EXPERIENCE RPC with Restaurant and Dish sub-dimensions
CREATE OR REPLACE FUNCTION public.create_experience(payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_user_tz text;
  v_client_request_id uuid;
  v_existing_id uuid;
  v_experience_id uuid;
  v_dish record;
  v_photo record;
  v_status public.experience_status_t;
  v_visibility public.visibility_t;
  v_published_at timestamptz := NULL;
  v_eaten_at timestamptz;
  v_eaten_date date;
  v_overall_rating smallint;
  v_place_id uuid;
  v_dishes jsonb;
  v_photos jsonb;
BEGIN
  v_user_id := (SELECT auth.uid());
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to create a food experience';
  END IF;

  -- Idempotency check via client_request_id
  IF payload ? 'client_request_id' AND (payload->>'client_request_id') IS NOT NULL THEN
    v_client_request_id := (payload->>'client_request_id')::uuid;
    SELECT id INTO v_existing_id
    FROM public.food_experiences
    WHERE user_id = v_user_id AND client_request_id = v_client_request_id;

    IF v_existing_id IS NOT NULL THEN
      RETURN v_existing_id;
    END IF;
  END IF;

  -- User Timezone
  SELECT timezone INTO v_user_tz
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_user_tz IS NULL THEN
    v_user_tz := 'Asia/Kolkata';
  END IF;

  -- Validate Category
  IF payload->>'category_slug' IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.food_categories WHERE slug = payload->>'category_slug'
  ) THEN
    RAISE EXCEPTION 'Invalid or missing category_slug: %', payload->>'category_slug';
  END IF;

  -- Validate Status & Visibility
  v_status := coalesce((payload->>'status')::public.experience_status_t, 'draft'::public.experience_status_t);
  v_visibility := coalesce((payload->>'visibility')::public.visibility_t, 'public'::public.visibility_t);

  IF v_status = 'published'::public.experience_status_t THEN
    v_published_at := now();
  END IF;

  v_eaten_at := coalesce((payload->>'eaten_at')::timestamptz, now());
  v_eaten_date := (v_eaten_at AT TIME ZONE v_user_tz)::date;

  IF payload ? 'overall_rating' AND (payload->>'overall_rating') IS NOT NULL THEN
    v_overall_rating := (payload->>'overall_rating')::smallint;
    IF v_overall_rating < 1 OR v_overall_rating > 10 THEN
      RAISE EXCEPTION 'Overall rating must be between 1 and 10';
    END IF;
  END IF;

  IF payload ? 'place_id' AND (payload->>'place_id') IS NOT NULL THEN
    v_place_id := (payload->>'place_id')::uuid;
  END IF;

  v_dishes := payload->'dishes';
  IF v_dishes IS NULL OR jsonb_array_length(v_dishes) = 0 THEN
    RAISE EXCEPTION 'A food experience must contain at least one dish';
  END IF;

  -- Insert Parent Experience
  INSERT INTO public.food_experiences (
    user_id,
    client_request_id,
    title,
    category_slug,
    eaten_at,
    eaten_date,
    published_at,
    status,
    visibility,
    overall_rating,
    place_rating_overall,
    place_rating_food,
    place_rating_value,
    place_rating_ambience,
    place_rating_service,
    place_rating_hygiene,
    dining_context,
    would_return,
    description,
    place_id,
    price_amount,
    price_currency,
    cuisine,
    tags
  ) VALUES (
    v_user_id,
    v_client_request_id,
    payload->>'title',
    payload->>'category_slug',
    v_eaten_at,
    v_eaten_date,
    v_published_at,
    v_status,
    v_visibility,
    v_overall_rating,
    CASE WHEN v_place_id IS NOT NULL AND payload ? 'place_rating_overall' THEN (payload->>'place_rating_overall')::smallint ELSE NULL END,
    CASE WHEN v_place_id IS NOT NULL AND payload ? 'place_rating_food' THEN (payload->>'place_rating_food')::smallint ELSE NULL END,
    CASE WHEN v_place_id IS NOT NULL AND payload ? 'place_rating_value' THEN (payload->>'place_rating_value')::smallint ELSE NULL END,
    CASE WHEN v_place_id IS NOT NULL AND payload ? 'place_rating_ambience' THEN (payload->>'place_rating_ambience')::smallint ELSE NULL END,
    CASE WHEN v_place_id IS NOT NULL AND payload ? 'place_rating_service' THEN (payload->>'place_rating_service')::smallint ELSE NULL END,
    CASE WHEN v_place_id IS NOT NULL AND payload ? 'place_rating_hygiene' THEN (payload->>'place_rating_hygiene')::smallint ELSE NULL END,
    CASE WHEN v_place_id IS NOT NULL AND payload ? 'dining_context' THEN payload->>'dining_context' ELSE NULL END,
    CASE WHEN v_place_id IS NOT NULL AND payload ? 'would_return' THEN (payload->>'would_return')::boolean ELSE NULL END,
    payload->>'description',
    v_place_id,
    (payload->>'price_amount')::numeric,
    coalesce(payload->>'price_currency', 'INR'),
    payload->>'cuisine',
    CASE
      WHEN payload ? 'tags' AND jsonb_typeof(payload->'tags') = 'array'
      THEN (SELECT coalesce(array_agg(elem::text), '{}'::text[]) FROM jsonb_array_elements_text(payload->'tags') elem)
      ELSE '{}'::text[]
    END
  )
  RETURNING id INTO v_experience_id;

  -- Insert Dishes
  FOR v_dish IN SELECT * FROM jsonb_to_recordset(v_dishes) AS x(
    dish_id uuid,
    display_name text,
    position integer,
    rating smallint,
    taste_rating smallint,
    portion_rating smallint,
    value_rating smallint,
    price_amount numeric,
    dietary_tag text,
    spice_level smallint,
    note text
  ) LOOP
    IF v_dish.display_name IS NULL OR length(trim(v_dish.display_name)) = 0 THEN
      RAISE EXCEPTION 'Every dish must have a non-empty display_name';
    END IF;

    IF v_dish.rating IS NOT NULL AND (v_dish.rating < 1 OR v_dish.rating > 10) THEN
      RAISE EXCEPTION 'Dish rating must be between 1 and 10';
    END IF;

    INSERT INTO public.experience_dishes (
      experience_id,
      dish_id,
      display_name,
      position,
      rating,
      taste_rating,
      portion_rating,
      value_rating,
      price_amount,
      dietary_tag,
      spice_level,
      note
    ) VALUES (
      v_experience_id,
      v_dish.dish_id,
      v_dish.display_name,
      coalesce(v_dish.position, 0),
      v_dish.rating,
      v_dish.taste_rating,
      v_dish.portion_rating,
      v_dish.value_rating,
      v_dish.price_amount,
      v_dish.dietary_tag,
      v_dish.spice_level,
      v_dish.note
    );
  END LOOP;

  -- Insert Photos (if any, max 10)
  v_photos := payload->'photos';
  IF v_photos IS NOT NULL AND jsonb_array_length(v_photos) > 0 THEN
    IF jsonb_array_length(v_photos) > 10 THEN
      RAISE EXCEPTION 'Cannot exceed maximum of 10 photos per experience';
    END IF;

    FOR v_photo IN SELECT * FROM jsonb_to_recordset(v_photos) AS y(
      storage_path text,
      width integer,
      height integer,
      blurhash text,
      alt_text text,
      position integer
    ) LOOP
      INSERT INTO public.experience_photos (
        experience_id,
        storage_path,
        width,
        height,
        blurhash,
        alt_text,
        position
      ) VALUES (
        v_experience_id,
        v_photo.storage_path,
        coalesce(v_photo.width, 0),
        coalesce(v_photo.height, 0),
        v_photo.blurhash,
        v_photo.alt_text,
        coalesce(v_photo.position, 0)
      );
    END LOOP;
  END IF;

  -- Increment user's experience counter if published & public
  IF v_status = 'published'::public.experience_status_t AND v_visibility = 'public'::public.visibility_t THEN
    UPDATE public.profiles
    SET experiences_count = experiences_count + 1
    WHERE id = v_user_id;
  END IF;

  RETURN v_experience_id;
END;
$$;

-- 11. Update UPDATE_EXPERIENCE RPC with Restaurant and Dish sub-dimensions
CREATE OR REPLACE FUNCTION public.update_experience(
  p_experience_id uuid,
  payload jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_existing_exp record;
  v_dish record;
  v_dishes jsonb;
  v_new_status public.experience_status_t;
  v_new_visibility public.visibility_t;
  v_published_at timestamptz;
  v_place_id uuid;
BEGIN
  v_user_id := (SELECT auth.uid());
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_existing_exp
  FROM public.food_experiences
  WHERE id = p_experience_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Experience not found or you do not have permission to modify it';
  END IF;

  v_new_status := coalesce((payload->>'status')::public.experience_status_t, v_existing_exp.status);
  v_new_visibility := coalesce((payload->>'visibility')::public.visibility_t, v_existing_exp.visibility);

  v_published_at := v_existing_exp.published_at;
  IF v_published_at IS NULL AND v_new_status = 'published'::public.experience_status_t THEN
    v_published_at := now();
  END IF;

  v_place_id := CASE
    WHEN payload ? 'place_id' THEN (payload->>'place_id')::uuid
    ELSE v_existing_exp.place_id
  END;

  UPDATE public.food_experiences
  SET
    title = coalesce(payload->>'title', title),
    category_slug = coalesce(payload->>'category_slug', category_slug),
    eaten_at = coalesce((payload->>'eaten_at')::timestamptz, eaten_at),
    published_at = v_published_at,
    status = v_new_status,
    visibility = v_new_visibility,
    overall_rating = CASE
      WHEN payload ? 'overall_rating' THEN (payload->>'overall_rating')::smallint
      ELSE overall_rating
    END,
    place_rating_overall = CASE
      WHEN v_place_id IS NULL THEN NULL
      WHEN payload ? 'place_rating_overall' THEN (payload->>'place_rating_overall')::smallint
      ELSE place_rating_overall
    END,
    place_rating_food = CASE
      WHEN v_place_id IS NULL THEN NULL
      WHEN payload ? 'place_rating_food' THEN (payload->>'place_rating_food')::smallint
      ELSE place_rating_food
    END,
    place_rating_value = CASE
      WHEN v_place_id IS NULL THEN NULL
      WHEN payload ? 'place_rating_value' THEN (payload->>'place_rating_value')::smallint
      ELSE place_rating_value
    END,
    place_rating_ambience = CASE
      WHEN v_place_id IS NULL THEN NULL
      WHEN payload ? 'place_rating_ambience' THEN (payload->>'place_rating_ambience')::smallint
      ELSE place_rating_ambience
    END,
    place_rating_service = CASE
      WHEN v_place_id IS NULL THEN NULL
      WHEN payload ? 'place_rating_service' THEN (payload->>'place_rating_service')::smallint
      ELSE place_rating_service
    END,
    place_rating_hygiene = CASE
      WHEN v_place_id IS NULL THEN NULL
      WHEN payload ? 'place_rating_hygiene' THEN (payload->>'place_rating_hygiene')::smallint
      ELSE place_rating_hygiene
    END,
    dining_context = CASE
      WHEN v_place_id IS NULL THEN NULL
      WHEN payload ? 'dining_context' THEN payload->>'dining_context'
      ELSE dining_context
    END,
    would_return = CASE
      WHEN v_place_id IS NULL THEN NULL
      WHEN payload ? 'would_return' THEN (payload->>'would_return')::boolean
      ELSE would_return
    END,
    description = coalesce(payload->>'description', description),
    place_id = v_place_id,
    price_amount = CASE
      WHEN payload ? 'price_amount' THEN (payload->>'price_amount')::numeric
      ELSE price_amount
    END,
    cuisine = coalesce(payload->>'cuisine', cuisine),
    updated_at = now()
  WHERE id = p_experience_id;

  v_dishes := payload->'dishes';
  IF v_dishes IS NOT NULL AND jsonb_array_length(v_dishes) > 0 THEN
    DELETE FROM public.experience_dishes WHERE experience_id = p_experience_id;

    FOR v_dish IN SELECT * FROM jsonb_to_recordset(v_dishes) AS x(
      dish_id uuid,
      display_name text,
      position integer,
      rating smallint,
      taste_rating smallint,
      portion_rating smallint,
      value_rating smallint,
      price_amount numeric,
      dietary_tag text,
      spice_level smallint,
      note text
    ) LOOP
      IF v_dish.display_name IS NULL OR length(trim(v_dish.display_name)) = 0 THEN
        RAISE EXCEPTION 'Every dish must have a non-empty display_name';
      END IF;

      INSERT INTO public.experience_dishes (
        experience_id,
        dish_id,
        display_name,
        position,
        rating,
        taste_rating,
        portion_rating,
        value_rating,
        price_amount,
        dietary_tag,
        spice_level,
        note
      ) VALUES (
        p_experience_id,
        v_dish.dish_id,
        v_dish.display_name,
        coalesce(v_dish.position, 0),
        v_dish.rating,
        v_dish.taste_rating,
        v_dish.portion_rating,
        v_dish.value_rating,
        v_dish.price_amount,
        v_dish.dietary_tag,
        v_dish.spice_level,
        v_dish.note
      );
    END LOOP;
  END IF;

  RETURN true;
END;
$$;

-- 12. Run recompute_all_stats to backfill place_public_stats and dish_public_stats
DO $$
BEGIN
  PERFORM public.recompute_all_stats();
END $$;
