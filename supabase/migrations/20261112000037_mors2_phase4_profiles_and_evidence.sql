-- Migration: MORS 2.0 Phase 4 - Restaurant & Canonical Dish Profiles
-- RPCs: get_place_profile, get_dish_profile
-- Strict public-pool enforcement, 5-dimension scorecard, 3-dimension scorecard,
-- "What to Order Here", "Where to Eat This Dish", and regional ranking context.

-- 0. Extend dish_public_stats with dimension counts
ALTER TABLE public.dish_public_stats
  ADD COLUMN IF NOT EXISTS taste_count bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS portion_count bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS value_count bigint NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.recompute_dish_stats(p_dish_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_exp_count integer;
  v_rating_count integer;
  v_rating_avg numeric(4,2);
  v_taste_avg numeric(4,2);
  v_taste_count bigint;
  v_portion_avg numeric(4,2);
  v_portion_count bigint;
  v_value_avg numeric(4,2);
  v_value_count bigint;
BEGIN
  SELECT
    COUNT(DISTINCT fe.id)::int,
    COUNT(ed.rating)::int,
    ROUND(AVG(ed.rating)::numeric, 2),
    ROUND(AVG(ed.taste_rating)::numeric, 2),
    COUNT(ed.taste_rating)::bigint,
    ROUND(AVG(ed.portion_rating)::numeric, 2),
    COUNT(ed.portion_rating)::bigint,
    ROUND(AVG(ed.value_rating)::numeric, 2),
    COUNT(ed.value_rating)::bigint
  INTO
    v_exp_count,
    v_rating_count,
    v_rating_avg,
    v_taste_avg,
    v_taste_count,
    v_portion_avg,
    v_portion_count,
    v_value_avg,
    v_value_count
  FROM public.experience_dishes ed
  JOIN public.food_experiences fe ON fe.id = ed.experience_id
  JOIN public.profiles pr ON pr.id = fe.user_id
  WHERE ed.dish_id = p_dish_id
    AND fe.status = 'published'
    AND fe.visibility = 'public'
    AND pr.is_private = false
    AND pr.discoverable = true
    AND pr.deletion_requested_at IS NULL
    AND pr.deletion_pending_at IS NULL;

  INSERT INTO public.dish_public_stats (
    dish_id,
    public_experience_count,
    public_rating_count,
    public_rating_avg,
    taste_avg,
    taste_count,
    portion_avg,
    portion_count,
    value_avg,
    value_count
  ) VALUES (
    p_dish_id,
    COALESCE(v_exp_count, 0),
    COALESCE(v_rating_count, 0),
    v_rating_avg,
    v_taste_avg,
    COALESCE(v_taste_count, 0),
    v_portion_avg,
    COALESCE(v_portion_count, 0),
    v_value_avg,
    COALESCE(v_value_count, 0)
  )
  ON CONFLICT (dish_id)
  DO UPDATE SET
    public_experience_count = EXCLUDED.public_experience_count,
    public_rating_count = EXCLUDED.public_rating_count,
    public_rating_avg = EXCLUDED.public_rating_avg,
    taste_avg = EXCLUDED.taste_avg,
    taste_count = EXCLUDED.taste_count,
    portion_avg = EXCLUDED.portion_avg,
    portion_count = EXCLUDED.portion_count,
    value_avg = EXCLUDED.value_avg,
    value_count = EXCLUDED.value_count;
END;
$$;

-- 1. Tighten get_explore_trending with complete public-pool criteria (BUG-03 fix)
CREATE OR REPLACE FUNCTION public.get_explore_trending(p_limit integer DEFAULT 20)
RETURNS TABLE (
    id text,
    title text,
    eaten_at timestamptz,
    overall_rating smallint,
    cuisine text,
    author_id text,
    author_username text,
    author_display_name text,
    author_avatar_path text,
    likes_count integer,
    comments_count integer,
    primary_photo_path text,
    trending_score double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    viewer_uuid uuid;
BEGIN
    viewer_uuid := (SELECT auth.uid());

    RETURN QUERY
    WITH public_pool AS (
        SELECT
            fe.id,
            fe.title,
            fe.eaten_at,
            fe.overall_rating,
            fe.cuisine,
            fe.user_id,
            pr.username,
            pr.display_name,
            pr.avatar_path,
            (SELECT count(*)::int FROM public.experience_likes el WHERE el.experience_id = fe.id) AS l_cnt,
            (SELECT count(*)::int FROM public.experience_comments ec WHERE ec.experience_id = fe.id) AS c_cnt,
            (
                SELECT ep.storage_path
                FROM public.experience_photos ep
                WHERE ep.experience_id = fe.id
                ORDER BY ep.position ASC
                LIMIT 1
            ) AS photo_path
        FROM public.food_experiences fe
        JOIN public.profiles pr ON pr.id = fe.user_id
        WHERE fe.status = 'published'
          AND fe.visibility = 'public'
          AND pr.is_private = false
          AND pr.discoverable = true
          AND pr.deletion_requested_at IS NULL
          AND pr.deletion_pending_at IS NULL
          AND (viewer_uuid IS NULL OR NOT public.is_blocked_bidirectional(viewer_uuid, pr.id))
    )
    SELECT
        pp.id::text,
        pp.title,
        pp.eaten_at,
        pp.overall_rating,
        pp.cuisine,
        pp.user_id::text,
        pp.username::text,
        pp.display_name,
        pp.avatar_path,
        pp.l_cnt,
        pp.c_cnt,
        pp.photo_path,
        (
            (pp.l_cnt * 2.0 + pp.c_cnt * 3.0 + 1.0) /
            POWER((EXTRACT(EPOCH FROM (now() - pp.eaten_at)) / 3600.0) + 2.0, 1.25)
        )::double precision AS t_score
    FROM public_pool pp
    ORDER BY t_score DESC, pp.eaten_at DESC
    LIMIT p_limit;
END;
$$;

-- 2. Restaurant / Branch Profile RPC: get_place_profile
CREATE OR REPLACE FUNCTION public.get_place_profile(
    p_place_id uuid,
    p_viewer_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_place record;
    v_parent_place jsonb := NULL;
    v_branches jsonb;
    v_stats jsonb;
    v_ranking jsonb := jsonb_build_object('city', null, 'rank', null, 'bayesian_score', null, 'is_ranked', false);
    v_dishes_logged jsonb := '[]'::jsonb;
    v_viewer_personal jsonb := null;
    v_recent_experiences jsonb := '[]'::jsonb;
    v_viewer uuid;
    v_rank_row record;
BEGIN
    v_viewer := COALESCE(p_viewer_id, (SELECT auth.uid()));

    -- 1. Fetch place record
    SELECT * INTO v_place FROM public.places WHERE id = p_place_id;
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    -- Follow canonical redirect if merged
    IF v_place.merged_into_id IS NOT NULL THEN
        SELECT * INTO v_place FROM public.places WHERE id = v_place.merged_into_id;
        IF NOT FOUND THEN
            RETURN NULL;
        END IF;
    END IF;

    -- Check listing permission (unlisted only visible to creator)
    IF NOT v_place.is_listed AND (v_viewer IS NULL OR v_viewer <> v_place.created_by) THEN
        RETURN NULL;
    END IF;

    -- 2. Parent place info (if this is a branch)
    IF v_place.parent_place_id IS NOT NULL THEN
        SELECT jsonb_build_object('id', id, 'name', name)
        INTO v_parent_place
        FROM public.places
        WHERE id = v_place.parent_place_id;
    END IF;

    -- 3. Sibling branches (or child branches)
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', b.id,
        'name', b.name,
        'city', b.city
    ) ORDER BY b.name ASC), '[]'::jsonb)
    INTO v_branches
    FROM public.places b
    WHERE b.parent_place_id = v_place.id
       OR (v_place.parent_place_id IS NOT NULL AND b.parent_place_id = v_place.parent_place_id AND b.id <> v_place.id);

    -- 4. Public stats with 5 dimensions
    SELECT jsonb_build_object(
        'public_experience_count', COALESCE(s.public_experience_count, 0),
        'public_rating_count', COALESCE(s.public_rating_count, 0),
        'public_rating_avg', CASE WHEN s.public_rating_avg IS NOT NULL THEN ROUND(s.public_rating_avg::numeric, 1) ELSE NULL END,
        'food_quality_avg', CASE WHEN s.food_quality_avg IS NOT NULL THEN ROUND(s.food_quality_avg::numeric, 1) ELSE NULL END,
        'food_quality_count', COALESCE(s.food_quality_count, 0),
        'value_for_money_avg', CASE WHEN s.value_for_money_avg IS NOT NULL THEN ROUND(s.value_for_money_avg::numeric, 1) ELSE NULL END,
        'value_for_money_count', COALESCE(s.value_for_money_count, 0),
        'ambience_avg', CASE WHEN s.ambience_avg IS NOT NULL THEN ROUND(s.ambience_avg::numeric, 1) ELSE NULL END,
        'ambience_count', COALESCE(s.ambience_count, 0),
        'service_avg', CASE WHEN s.service_avg IS NOT NULL THEN ROUND(s.service_avg::numeric, 1) ELSE NULL END,
        'service_count', COALESCE(s.service_count, 0),
        'hygiene_avg', CASE WHEN s.hygiene_avg IS NOT NULL THEN ROUND(s.hygiene_avg::numeric, 1) ELSE NULL END,
        'hygiene_count', COALESCE(s.hygiene_count, 0)
    )
    INTO v_stats
    FROM public.place_public_stats s
    WHERE s.place_id = v_place.id;

    IF v_stats IS NULL THEN
        v_stats := jsonb_build_object(
            'public_experience_count', 0,
            'public_rating_count', 0,
            'public_rating_avg', null,
            'food_quality_avg', null,
            'food_quality_count', 0,
            'value_for_money_avg', null,
            'value_for_money_count', 0,
            'ambience_avg', null,
            'ambience_count', 0,
            'service_avg', null,
            'service_count', 0,
            'hygiene_avg', null,
            'hygiene_count', 0
        );
    END IF;

    -- 5. Regional ranking context (from Phase 3 ranking engine)
    IF v_place.city IS NOT NULL AND length(trim(v_place.city)) > 0 THEN
        SELECT r.rank_position, r.bayesian_score, r.is_ranked
        INTO v_rank_row
        FROM public.get_regional_restaurant_rankings(p_city => v_place.city, p_limit => 50) r
        WHERE r.id = v_place.id
        LIMIT 1;

        IF FOUND THEN
            v_ranking := jsonb_build_object(
                'city', v_place.city,
                'rank', v_rank_row.rank_position,
                'bayesian_score', v_rank_row.bayesian_score,
                'is_ranked', v_rank_row.is_ranked
            );
        ELSE
            v_ranking := jsonb_build_object(
                'city', v_place.city,
                'rank', null,
                'bayesian_score', null,
                'is_ranked', false
            );
        END IF;
    END IF;

    -- 6. "What to Order Here": Canonical dishes logged at this branch
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'dish_id', d.id,
        'dish_name', d.name,
        'dish_slug', d.slug,
        'cuisine', d.cuisine,
        'times_logged', dl.times_logged,
        'dish_rating_count', dl.dish_rating_count,
        'local_dish_rating_avg', dl.local_dish_rating_avg,
        'taste_avg', CASE WHEN dps.taste_avg IS NOT NULL THEN ROUND(dps.taste_avg::numeric, 1) ELSE NULL END
    )), '[]'::jsonb)
    INTO v_dishes_logged
    FROM (
        SELECT
            ed.dish_id,
            COUNT(DISTINCT fe.id)::int AS times_logged,
            COUNT(ed.rating)::int AS dish_rating_count,
            ROUND(AVG(ed.rating)::numeric, 1) AS local_dish_rating_avg
        FROM public.experience_dishes ed
        JOIN public.food_experiences fe ON fe.id = ed.experience_id
        JOIN public.profiles pr ON pr.id = fe.user_id
        WHERE fe.place_id = v_place.id
          AND fe.status = 'published'
          AND fe.visibility = 'public'
          AND pr.is_private = false
          AND pr.discoverable = true
          AND pr.deletion_requested_at IS NULL
          AND pr.deletion_pending_at IS NULL
          AND (v_viewer IS NULL OR NOT public.is_blocked_bidirectional(v_viewer, pr.id))
        GROUP BY ed.dish_id
        ORDER BY times_logged DESC, local_dish_rating_avg DESC NULLS LAST
        LIMIT 10
    ) dl
    JOIN public.dishes d ON d.id = dl.dish_id
    LEFT JOIN public.dish_public_stats dps ON dps.dish_id = d.id
    WHERE d.is_listed = true;

    -- 7. Viewer personal visit history
    IF v_viewer IS NOT NULL THEN
        SELECT jsonb_build_object(
            'visit_count', COUNT(fe.id)::int,
            'latest_rating', (
                SELECT fe2.overall_rating
                FROM public.food_experiences fe2
                WHERE fe2.place_id = v_place.id
                  AND fe2.user_id = v_viewer
                  AND fe2.overall_rating IS NOT NULL
                ORDER BY fe2.eaten_at DESC
                LIMIT 1
            )
        )
        INTO v_viewer_personal
        FROM public.food_experiences fe
        WHERE fe.place_id = v_place.id
          AND fe.user_id = v_viewer;
    END IF;

    -- 8. Recent public experiences at this place (Strict Public Pool)
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', re.id,
        'title', re.title,
        'eaten_at', re.eaten_at,
        'overall_rating', re.overall_rating,
        'place_rating_overall', re.place_rating_overall,
        'place_rating_food', re.place_rating_food,
        'place_rating_value', re.place_rating_value,
        'place_rating_ambience', re.place_rating_ambience,
        'place_rating_service', re.place_rating_service,
        'place_rating_hygiene', re.place_rating_hygiene,
        'dining_context', re.dining_context,
        'would_return', re.would_return,
        'description', re.description,
        'author', jsonb_build_object(
            'id', re.user_id,
            'username', re.username,
            'display_name', re.display_name,
            'avatar_path', re.avatar_path
        ),
        'dishes_summary', (
            SELECT string_agg(ed.display_name, ', ' ORDER BY ed.position ASC)
            FROM public.experience_dishes ed
            WHERE ed.experience_id = re.id
        ),
        'primary_photo_path', (
            SELECT ep.storage_path
            FROM public.experience_photos ep
            WHERE ep.experience_id = re.id
            ORDER BY ep.position ASC
            LIMIT 1
        )
    )), '[]'::jsonb)
    INTO v_recent_experiences
    FROM (
        SELECT
            fe.id,
            fe.title,
            fe.eaten_at,
            fe.overall_rating,
            fe.place_rating_overall,
            fe.place_rating_food,
            fe.place_rating_value,
            fe.place_rating_ambience,
            fe.place_rating_service,
            fe.place_rating_hygiene,
            fe.dining_context,
            fe.would_return,
            fe.description,
            fe.user_id,
            pr.username,
            pr.display_name,
            pr.avatar_path
        FROM public.food_experiences fe
        JOIN public.profiles pr ON pr.id = fe.user_id
        WHERE fe.place_id = v_place.id
          AND fe.status = 'published'
          AND fe.visibility = 'public'
          AND pr.is_private = false
          AND pr.discoverable = true
          AND pr.deletion_requested_at IS NULL
          AND pr.deletion_pending_at IS NULL
          AND (v_viewer IS NULL OR NOT public.is_blocked_bidirectional(v_viewer, pr.id))
        ORDER BY fe.eaten_at DESC
        LIMIT 10
    ) re;

    -- Return comprehensive profile payload
    RETURN jsonb_build_object(
        'place', jsonb_build_object(
            'id', v_place.id,
            'name', v_place.name,
            'city', v_place.city,
            'address', v_place.address,
            'parent_place', v_parent_place,
            'branches', v_branches
        ),
        'stats', v_stats,
        'ranking', v_ranking,
        'dishes_logged', v_dishes_logged,
        'viewer_personal', v_viewer_personal,
        'recent_experiences', v_recent_experiences
    );
END;
$$;

-- 3. Canonical Dish Profile RPC: get_dish_profile
CREATE OR REPLACE FUNCTION public.get_dish_profile(
    p_slug text,
    p_viewer_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_dish record;
    v_translations jsonb := '[]'::jsonb;
    v_stats jsonb;
    v_ranking jsonb := jsonb_build_object('region', 'Hyderabad', 'rank', null, 'bayesian_score', null, 'is_ranked', false);
    v_places_logged jsonb := '[]'::jsonb;
    v_viewer_personal jsonb := null;
    v_recent_experiences jsonb := '[]'::jsonb;
    v_viewer uuid;
    v_rank_row record;
BEGIN
    v_viewer := COALESCE(p_viewer_id, (SELECT auth.uid()));

    -- 1. Fetch dish record
    SELECT * INTO v_dish FROM public.dishes WHERE slug = p_slug;
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    -- Follow canonical redirect if merged
    IF v_dish.merged_into_id IS NOT NULL THEN
        SELECT * INTO v_dish FROM public.dishes WHERE id = v_dish.merged_into_id;
        IF NOT FOUND THEN
            RETURN NULL;
        END IF;
    END IF;

    -- Check listing permission (unlisted only visible to creator)
    IF NOT v_dish.is_listed AND (v_viewer IS NULL OR v_viewer <> v_dish.created_by) THEN
        RETURN NULL;
    END IF;

    -- 2. Fetch translations
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'locale', dt.locale,
        'name', dt.name
    )), '[]'::jsonb)
    INTO v_translations
    FROM public.dish_translations dt
    WHERE dt.dish_id = v_dish.id;

    -- 3. Public stats with 3 dimensions (taste, portion, value)
    SELECT jsonb_build_object(
        'public_experience_count', COALESCE(s.public_experience_count, 0),
        'public_rating_count', COALESCE(s.public_rating_count, 0),
        'public_rating_avg', CASE WHEN s.public_rating_avg IS NOT NULL THEN ROUND(s.public_rating_avg::numeric, 1) ELSE NULL END,
        'taste_avg', CASE WHEN s.taste_avg IS NOT NULL THEN ROUND(s.taste_avg::numeric, 1) ELSE NULL END,
        'taste_count', COALESCE(s.taste_count, 0),
        'portion_avg', CASE WHEN s.portion_avg IS NOT NULL THEN ROUND(s.portion_avg::numeric, 1) ELSE NULL END,
        'portion_count', COALESCE(s.portion_count, 0),
        'value_avg', CASE WHEN s.value_avg IS NOT NULL THEN ROUND(s.value_avg::numeric, 1) ELSE NULL END,
        'value_count', COALESCE(s.value_count, 0)
    )
    INTO v_stats
    FROM public.dish_public_stats s
    WHERE s.dish_id = v_dish.id;

    IF v_stats IS NULL THEN
        v_stats := jsonb_build_object(
            'public_experience_count', 0,
            'public_rating_count', 0,
            'public_rating_avg', null,
            'taste_avg', null,
            'taste_count', 0,
            'portion_avg', null,
            'portion_count', 0,
            'value_avg', null,
            'value_count', 0
        );
    END IF;

    -- 4. Regional ranking context (Phase 3 dish ranking)
    SELECT r.rank_position, r.bayesian_score, r.is_ranked
    INTO v_rank_row
    FROM public.get_regional_dish_rankings(p_city => 'Hyderabad', p_limit => 50) r
    WHERE r.id = v_dish.id
    LIMIT 1;

    IF FOUND THEN
        v_ranking := jsonb_build_object(
            'region', 'Hyderabad',
            'rank', v_rank_row.rank_position,
            'bayesian_score', v_rank_row.bayesian_score,
            'is_ranked', v_rank_row.is_ranked
        );
    END IF;

    -- 5. "Where to Eat This Dish": Places where this dish has been logged
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'place_id', p.id,
        'place_name', p.name,
        'city', p.city,
        'address', p.address,
        'times_logged', pl.times_logged,
        'dish_rating_count', pl.dish_rating_count,
        'local_dish_rating_avg', pl.local_dish_rating_avg,
        'place_rating_avg', CASE WHEN pps.public_rating_avg IS NOT NULL THEN ROUND(pps.public_rating_avg::numeric, 1) ELSE NULL END
    )), '[]'::jsonb)
    INTO v_places_logged
    FROM (
        SELECT
            fe.place_id,
            COUNT(DISTINCT fe.id)::int AS times_logged,
            COUNT(ed.rating)::int AS dish_rating_count,
            ROUND(AVG(ed.rating)::numeric, 1) AS local_dish_rating_avg
        FROM public.experience_dishes ed
        JOIN public.food_experiences fe ON fe.id = ed.experience_id
        JOIN public.profiles pr ON pr.id = fe.user_id
        WHERE ed.dish_id = v_dish.id
          AND fe.place_id IS NOT NULL
          AND fe.status = 'published'
          AND fe.visibility = 'public'
          AND pr.is_private = false
          AND pr.discoverable = true
          AND pr.deletion_requested_at IS NULL
          AND pr.deletion_pending_at IS NULL
          AND (v_viewer IS NULL OR NOT public.is_blocked_bidirectional(v_viewer, pr.id))
        GROUP BY fe.place_id
        ORDER BY times_logged DESC, local_dish_rating_avg DESC NULLS LAST
        LIMIT 10
    ) pl
    JOIN public.places p ON p.id = pl.place_id
    LEFT JOIN public.place_public_stats pps ON pps.place_id = p.id
    WHERE p.is_listed = true;

    -- 6. Viewer personal taste history
    IF v_viewer IS NOT NULL THEN
        SELECT jsonb_build_object(
            'experience_count', COUNT(DISTINCT fe.id)::int,
            'rating_avg', CASE WHEN AVG(ed.rating) IS NOT NULL THEN ROUND(AVG(ed.rating)::numeric, 1) ELSE NULL END,
            'latest_rating', (
                SELECT ed2.rating
                FROM public.experience_dishes ed2
                JOIN public.food_experiences fe2 ON fe2.id = ed2.experience_id
                WHERE ed2.dish_id = v_dish.id
                  AND fe2.user_id = v_viewer
                  AND ed2.rating IS NOT NULL
                ORDER BY fe2.eaten_at DESC
                LIMIT 1
            )
        )
        INTO v_viewer_personal
        FROM public.experience_dishes ed
        JOIN public.food_experiences fe ON fe.id = ed.experience_id
        WHERE ed.dish_id = v_dish.id
          AND fe.user_id = v_viewer;
    END IF;

    -- 7. Recent public experiences containing this dish (Strict Public Pool)
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', re.id,
        'title', re.title,
        'eaten_at', re.eaten_at,
        'dish_rating', re.dish_rating,
        'dish_taste', re.dish_taste,
        'dish_portion', re.dish_portion,
        'dish_value', re.dish_value,
        'dish_note', re.dish_note,
        'place', CASE WHEN re.place_id IS NOT NULL THEN jsonb_build_object('id', re.place_id, 'name', re.place_name, 'city', re.place_city) ELSE NULL END,
        'author', jsonb_build_object(
            'id', re.user_id,
            'username', re.username,
            'display_name', re.display_name,
            'avatar_path', re.avatar_path
        ),
        'primary_photo_path', (
            SELECT ep.storage_path
            FROM public.experience_photos ep
            WHERE ep.experience_id = re.id
            ORDER BY ep.position ASC
            LIMIT 1
        )
    )), '[]'::jsonb)
    INTO v_recent_experiences
    FROM (
        SELECT
            fe.id,
            fe.title,
            fe.eaten_at,
            ed.rating AS dish_rating,
            ed.taste_rating AS dish_taste,
            ed.portion_rating AS dish_portion,
            ed.value_rating AS dish_value,
            ed.note AS dish_note,
            fe.place_id,
            pl.name AS place_name,
            pl.city AS place_city,
            fe.user_id,
            pr.username,
            pr.display_name,
            pr.avatar_path
        FROM public.experience_dishes ed
        JOIN public.food_experiences fe ON fe.id = ed.experience_id
        JOIN public.profiles pr ON pr.id = fe.user_id
        LEFT JOIN public.places pl ON pl.id = fe.place_id
        WHERE ed.dish_id = v_dish.id
          AND fe.status = 'published'
          AND fe.visibility = 'public'
          AND pr.is_private = false
          AND pr.discoverable = true
          AND pr.deletion_requested_at IS NULL
          AND pr.deletion_pending_at IS NULL
          AND (v_viewer IS NULL OR NOT public.is_blocked_bidirectional(v_viewer, pr.id))
        ORDER BY fe.eaten_at DESC
        LIMIT 10
    ) re;

    -- Return comprehensive dish payload
    RETURN jsonb_build_object(
        'dish', jsonb_build_object(
            'id', v_dish.id,
            'name', v_dish.name,
            'slug', v_dish.slug,
            'cuisine', v_dish.cuisine,
            'description', v_dish.description,
            'translations', v_translations
        ),
        'stats', v_stats,
        'ranking', v_ranking,
        'places_logged', v_places_logged,
        'viewer_personal', v_viewer_personal,
        'recent_experiences', v_recent_experiences
    );
END;
$$;

-- Grants
GRANT EXECUTE ON FUNCTION public.get_explore_trending(integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_place_profile(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_dish_profile(text, uuid) TO anon, authenticated;
