-- MORS Database Migration: Taste Identity & Explore Trending (Phase 14)
-- Migration: 20261110000012_taste_stats_and_explore.sql

-- 1. Profile Taste Identity & Statistics Engine
CREATE OR REPLACE FUNCTION public.get_profile_taste_stats(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    viewer_uuid uuid;
    is_owner boolean;
    owner_is_priv boolean;
    viewer_is_follower boolean;
    total_meals integer := 0;
    avg_rating numeric := NULL;
    fav_cuisines jsonb := '[]'::jsonb;
    top_dishes jsonb := '[]'::jsonb;
    monthly_activity jsonb := '[]'::jsonb;
    top_cat text := NULL;
BEGIN
    viewer_uuid := auth.uid();
    is_owner := (viewer_uuid IS NOT NULL AND viewer_uuid = target_user_id);

    -- Check if blocked
    IF viewer_uuid IS NOT NULL AND public.is_blocked_bidirectional(viewer_uuid, target_user_id) THEN
        RETURN NULL;
    END IF;

    SELECT is_private INTO owner_is_priv FROM public.profiles WHERE id = target_user_id;
    IF owner_is_priv IS NULL THEN
        RETURN NULL;
    END IF;

    IF viewer_uuid IS NOT NULL THEN
        viewer_is_follower := public.is_following(viewer_uuid, target_user_id);
    ELSE
        viewer_is_follower := false;
    END IF;

    -- If profile is private and viewer is not owner or accepted follower, no stats are exposed
    IF owner_is_priv AND NOT is_owner AND NOT viewer_is_follower THEN
        RETURN NULL;
    END IF;

    -- Aggregate stats from permitted experiences:
    -- Owner sees all; follower sees public + followers; public viewer sees public only
    WITH permitted_exp AS (
        SELECT id, eaten_at, overall_rating, cuisine, category_slug
        FROM public.food_experiences
        WHERE user_id = target_user_id
          AND status = 'published'
          AND (
              is_owner OR
              (viewer_is_follower AND visibility IN ('public', 'followers')) OR
              visibility = 'public'
          )
    ),
    cuisine_counts AS (
        SELECT cuisine, count(*)::int AS cnt
        FROM permitted_exp
        WHERE cuisine IS NOT NULL AND trim(cuisine) <> ''
        GROUP BY cuisine
        ORDER BY cnt DESC, cuisine ASC
        LIMIT 4
    ),
    dishes_aggregated AS (
        SELECT ed.display_name, ROUND(AVG(ed.rating)::numeric, 1) AS avg_dish_rating, count(*)::int AS times_logged
        FROM public.experience_dishes ed
        JOIN permitted_exp pe ON pe.id = ed.experience_id
        WHERE ed.rating IS NOT NULL AND ed.rating >= 8 -- 4.0 stars or higher
        GROUP BY ed.display_name
        ORDER BY times_logged DESC, avg_dish_rating DESC
        LIMIT 5
    ),
    months_series AS (
        SELECT
            to_char(date_trunc('month', d), 'YYYY-MM') AS month_str,
            to_char(date_trunc('month', d), 'Mon') AS month_label
        FROM generate_series(
            date_trunc('month', now() - interval '5 months'),
            date_trunc('month', now()),
            interval '1 month'
        ) d
    ),
    monthly_counts AS (
        SELECT
            ms.month_label,
            count(pe.id)::int AS meals_count
        FROM months_series ms
        LEFT JOIN permitted_exp pe ON to_char(date_trunc('month', pe.eaten_at), 'YYYY-MM') = ms.month_str
        GROUP BY ms.month_str, ms.month_label
        ORDER BY ms.month_str ASC
    )
    SELECT
        COUNT(*)::int,
        ROUND(AVG(overall_rating)::numeric / 2.0, 1)
    INTO total_meals, avg_rating
    FROM permitted_exp;

    -- Most logged category
    SELECT category_slug INTO top_cat
    FROM permitted_exp
    WHERE category_slug IS NOT NULL
    GROUP BY category_slug
    ORDER BY count(*) DESC
    LIMIT 1;

    -- Build JSON arrays
    SELECT COALESCE(jsonb_agg(jsonb_build_object('cuisine', cuisine, 'count', cnt)), '[]'::jsonb)
    INTO fav_cuisines
    FROM cuisine_counts;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'name', display_name,
        'rating', avg_dish_rating,
        'timesLogged', times_logged
    )), '[]'::jsonb)
    INTO top_dishes
    FROM dishes_aggregated;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'label', month_label,
        'count', meals_count
    )), '[]'::jsonb)
    INTO monthly_activity
    FROM monthly_counts;

    RETURN jsonb_build_object(
        'totalMeals', total_meals,
        'averageRating', avg_rating,
        'topCategory', top_cat,
        'favouriteCuisines', fav_cuisines,
        'topRatedDishes', top_dishes,
        'monthlyActivity', monthly_activity
    );
END;
$$;

-- 2. Explore Trending Experiences (Time-Decayed Public Consensus)
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
    viewer_uuid := auth.uid();

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
          AND (viewer_uuid IS NULL OR NOT public.is_blocked_bidirectional(viewer_uuid, pr.id))
    )
    SELECT
        pp.id::text,
        pp.title,
        pp.eaten_at,
        pp.overall_rating,
        pp.cuisine,
        pp.user_id::text,
        pp.username,
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

-- 3. Annual Food Year Memory Summary
CREATE OR REPLACE FUNCTION public.get_food_year_summary(target_user_id uuid, p_year integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    viewer_uuid uuid;
    is_owner boolean;
    start_ts timestamptz;
    end_ts timestamptz;
    total_logged integer := 0;
    top_dishes jsonb := '[]'::jsonb;
    top_place_name text := NULL;
    best_dish_name text := NULL;
    best_dish_rating numeric := NULL;
BEGIN
    viewer_uuid := auth.uid();
    is_owner := (viewer_uuid IS NOT NULL AND viewer_uuid = target_user_id);

    start_ts := make_timestamptz(p_year, 1, 1, 0, 0, 0, 'UTC');
    end_ts := make_timestamptz(p_year, 12, 31, 23, 59, 59, 'UTC');

    WITH annual_exp AS (
        SELECT id, eaten_at, overall_rating, place_id
        FROM public.food_experiences
        WHERE user_id = target_user_id
          AND status = 'published'
          AND eaten_at >= start_ts AND eaten_at <= end_ts
          AND (
              is_owner OR
              visibility = 'public'
          )
    )
    SELECT count(*)::int INTO total_logged FROM annual_exp;

    -- Top place
    SELECT p.name INTO top_place_name
    FROM annual_exp ae
    JOIN public.places p ON p.id = ae.place_id
    GROUP BY p.name
    ORDER BY count(*) DESC
    LIMIT 1;

    -- Top rated dish
    SELECT ed.display_name, (ed.rating / 2.0)::numeric
    INTO best_dish_name, best_dish_rating
    FROM public.experience_dishes ed
    JOIN annual_exp ae ON ae.id = ed.experience_id
    WHERE ed.rating IS NOT NULL
    ORDER BY ed.rating DESC, ed.created_at ASC
    LIMIT 1;

    -- Top 3 dishes
    SELECT COALESCE(jsonb_agg(jsonb_build_object('name', display_name, 'count', cnt)), '[]'::jsonb)
    INTO top_dishes
    FROM (
        SELECT ed.display_name, count(*)::int AS cnt
        FROM public.experience_dishes ed
        JOIN annual_exp ae ON ae.id = ed.experience_id
        GROUP BY ed.display_name
        ORDER BY cnt DESC
        LIMIT 3
    ) s;

    RETURN jsonb_build_object(
        'year', p_year,
        'totalMealsLogged', total_logged,
        'topPlace', top_place_name,
        'bestDish', jsonb_build_object('name', best_dish_name, 'rating', best_dish_rating),
        'topDishes', top_dishes
    );
END;
$$;
