-- ==============================================================================
-- MORS 2.0 Database Migration: 20261112000036_mors2_phase3_regional_ranking_engine.sql
-- Phase 3: Confidence-Adjusted Regional Ranking Engine (Restaurants & Dishes)
-- ==============================================================================

-- 1. Helper: Compute Regional Prior Mean (Shrinkage Target)
CREATE OR REPLACE FUNCTION public.get_regional_prior_mean(
    p_city text DEFAULT NULL,
    p_default_mean numeric DEFAULT 7.0
)
RETURNS numeric(4,2)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_mean numeric(4,2);
BEGIN
    SELECT round(avg(fe.overall_rating)::numeric, 2)
    INTO v_mean
    FROM public.food_experiences fe
    JOIN public.profiles p ON fe.user_id = p.id
    LEFT JOIN public.places pl ON fe.place_id = pl.id
    WHERE fe.status = 'published'
      AND fe.visibility = 'public'
      AND p.is_private = false
      AND p.discoverable = true
      AND p.deletion_requested_at IS NULL
      AND p.deletion_pending_at IS NULL
      AND fe.overall_rating IS NOT NULL
      AND (p_city IS NULL OR p_city = '' OR pl.city ILIKE '%' || trim(p_city) || '%');

    IF v_mean IS NULL OR v_mean < 1.0 THEN
        RETURN p_default_mean;
    END IF;

    RETURN v_mean;
END;
$$;

-- 2. Regional Restaurant Rankings RPC
-- Returns confidence-adjusted leaderboards for a region (e.g. Hyderabad)
CREATE OR REPLACE FUNCTION public.get_regional_restaurant_rankings(
    p_city text DEFAULT 'Hyderabad',
    p_cuisine text DEFAULT NULL,
    p_dimension text DEFAULT 'overall', -- 'overall', 'food_quality', 'value_for_money', 'ambience', 'service', 'hygiene'
    p_limit integer DEFAULT 25,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    rank_position bigint,
    id uuid,
    name text,
    address text,
    city text,
    place_type text,
    rating_avg numeric(4,2),
    rating_count bigint,
    bayesian_score numeric(4,2),
    is_ranked boolean,
    food_quality_avg numeric(4,2),
    value_avg numeric(4,2),
    ambience_avg numeric(4,2),
    service_avg numeric(4,2),
    hygiene_avg numeric(4,2),
    would_return_pct numeric(5,2)
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_prior numeric(4,2);
    v_m numeric := 5.0; -- Confidence constant (prior strength)
    v_viewer_uuid uuid;
BEGIN
    v_viewer_uuid := auth.uid();
    v_prior := public.get_regional_prior_mean(p_city, 7.0);

    RETURN QUERY
    WITH candidate_places AS (
        SELECT
            pl.id,
            pl.name,
            pl.address,
            pl.city,
            pl.place_type,
            coalesce(pps.public_rating_count, 0::bigint) AS n_count,
            CASE
                WHEN p_dimension = 'food_quality' THEN pps.food_quality_avg
                WHEN p_dimension = 'value_for_money' THEN pps.value_for_money_avg
                WHEN p_dimension = 'ambience' THEN pps.ambience_avg
                WHEN p_dimension = 'service' THEN pps.service_avg
                WHEN p_dimension = 'hygiene' THEN pps.hygiene_avg
                ELSE pps.public_rating_avg
            END AS raw_avg,
            pps.food_quality_avg,
            pps.value_for_money_avg,
            pps.ambience_avg,
            pps.service_avg,
            pps.hygiene_avg,
            pps.would_return_pct
        FROM public.places pl
        JOIN public.place_public_stats pps ON pl.id = pps.place_id
        WHERE pl.merged_into_id IS NULL
          AND (pl.is_listed = true OR (v_viewer_uuid IS NOT NULL AND pl.created_by = v_viewer_uuid) OR EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = v_viewer_uuid AND pr.is_admin = true))
          AND (p_city IS NULL OR p_city = '' OR pl.city ILIKE '%' || trim(p_city) || '%' OR pl.address ILIKE '%' || trim(p_city) || '%')
          AND (p_cuisine IS NULL OR p_cuisine = '' OR pl.place_type ILIKE '%' || trim(p_cuisine) || '%')
          AND pps.public_rating_count > 0
    ),
    scored_places AS (
        SELECT
            cp.id,
            cp.name,
            cp.address,
            cp.city,
            cp.place_type,
            cp.raw_avg AS rating_avg,
            cp.n_count AS rating_count,
            ROUND(
                ((cp.n_count::numeric / (cp.n_count::numeric + v_m)) * cp.raw_avg) +
                ((v_m / (cp.n_count::numeric + v_m)) * v_prior),
                2
            )::numeric(4,2) AS bayesian_score,
            (cp.n_count >= 3) AS is_ranked,
            cp.food_quality_avg,
            cp.value_for_money_avg,
            cp.ambience_avg,
            cp.service_avg,
            cp.hygiene_avg,
            cp.would_return_pct
        FROM candidate_places cp
        WHERE cp.raw_avg IS NOT NULL
    )
    SELECT
        row_number() OVER (ORDER BY sp.is_ranked DESC, sp.bayesian_score DESC, sp.rating_count DESC, sp.name ASC) AS rank_position,
        sp.id,
        sp.name,
        sp.address,
        sp.city,
        sp.place_type,
        sp.rating_avg,
        sp.rating_count,
        sp.bayesian_score,
        sp.is_ranked,
        sp.food_quality_avg,
        sp.value_for_money_avg AS value_avg,
        sp.ambience_avg,
        sp.service_avg,
        sp.hygiene_avg,
        sp.would_return_pct
    FROM scored_places sp
    ORDER BY sp.is_ranked DESC, sp.bayesian_score DESC, sp.rating_count DESC, sp.name ASC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- 3. Regional Dish Rankings RPC
-- Returns confidence-adjusted leaderboards for dishes in a region
CREATE OR REPLACE FUNCTION public.get_regional_dish_rankings(
    p_city text DEFAULT 'Hyderabad',
    p_cuisine text DEFAULT NULL,
    p_dimension text DEFAULT 'overall', -- 'overall', 'taste', 'portion', 'value'
    p_limit integer DEFAULT 25,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    rank_position bigint,
    id uuid,
    name text,
    slug text,
    cuisine text,
    rating_avg numeric(4,2),
    rating_count integer,
    bayesian_score numeric(4,2),
    is_ranked boolean,
    taste_avg numeric(4,2),
    portion_avg numeric(4,2),
    value_avg numeric(4,2),
    top_places jsonb
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_prior numeric(4,2);
    v_m numeric := 5.0;
    v_viewer_uuid uuid;
BEGIN
    v_viewer_uuid := auth.uid();
    v_prior := public.get_regional_prior_mean(p_city, 7.0);

    RETURN QUERY
    WITH candidate_dishes AS (
        SELECT
            d.id,
            d.name,
            d.slug,
            d.cuisine,
            coalesce(dps.public_rating_count, 0) AS n_count,
            CASE
                WHEN p_dimension = 'taste' THEN dps.taste_avg
                WHEN p_dimension = 'portion' THEN dps.portion_avg
                WHEN p_dimension = 'value' THEN dps.value_avg
                ELSE dps.public_rating_avg
            END AS raw_avg,
            dps.taste_avg,
            dps.portion_avg,
            dps.value_avg
        FROM public.dishes d
        JOIN public.dish_public_stats dps ON d.id = dps.dish_id
        WHERE d.merged_into_id IS NULL
          AND (d.is_listed = true OR (v_viewer_uuid IS NOT NULL AND d.created_by = v_viewer_uuid) OR EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = v_viewer_uuid AND pr.is_admin = true))
          AND (p_cuisine IS NULL OR p_cuisine = '' OR d.cuisine ILIKE '%' || trim(p_cuisine) || '%')
          AND dps.public_rating_count > 0
    ),
    scored_dishes AS (
        SELECT
            cd.id,
            cd.name,
            cd.slug,
            cd.cuisine,
            cd.raw_avg AS rating_avg,
            cd.n_count AS rating_count,
            ROUND(
                ((cd.n_count::numeric / (cd.n_count::numeric + v_m)) * cd.raw_avg) +
                ((v_m / (cd.n_count::numeric + v_m)) * v_prior),
                2
            )::numeric(4,2) AS bayesian_score,
            (cd.n_count >= 3) AS is_ranked,
            cd.taste_avg,
            cd.portion_avg,
            cd.value_avg
        FROM candidate_dishes cd
        WHERE cd.raw_avg IS NOT NULL
    )
    SELECT
        row_number() OVER (ORDER BY sd.is_ranked DESC, sd.bayesian_score DESC, sd.rating_count DESC, sd.name ASC) AS rank_position,
        sd.id,
        sd.name,
        sd.slug,
        sd.cuisine,
        sd.rating_avg,
        sd.rating_count,
        sd.bayesian_score,
        sd.is_ranked,
        sd.taste_avg,
        sd.portion_avg,
        sd.value_avg,
        COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'place_id', p.id,
                'place_name', p.name,
                'city', p.city,
                'logs_count', counts.cnt
            ))
            FROM (
                SELECT fe.place_id, count(*)::int as cnt
                FROM public.experience_dishes ed
                JOIN public.food_experiences fe ON fe.id = ed.experience_id
                JOIN public.profiles pr ON pr.id = fe.user_id
                WHERE ed.dish_id = sd.id
                  AND fe.place_id IS NOT NULL
                  AND fe.status = 'published'
                  AND fe.visibility = 'public'
                  AND pr.is_private = false
                  AND pr.discoverable = true
                GROUP BY fe.place_id
                ORDER BY cnt DESC
                LIMIT 3
            ) counts
            JOIN public.places p ON p.id = counts.place_id
        ), '[]'::jsonb) AS top_places
    FROM scored_dishes sd
    ORDER BY sd.is_ranked DESC, sd.bayesian_score DESC, sd.rating_count DESC, sd.name ASC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- 4. Regional Overview RPC
CREATE OR REPLACE FUNCTION public.get_regional_overview(
    p_city text DEFAULT 'Hyderabad'
)
RETURNS TABLE (
    city_name text,
    total_venues bigint,
    ranked_venues bigint,
    total_dishes bigint,
    ranked_dishes bigint,
    regional_avg_rating numeric(4,2)
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        coalesce(p_city, 'Telangana') AS city_name,
        (SELECT count(*) FROM public.places pl WHERE pl.is_listed = true AND pl.merged_into_id IS NULL AND (p_city IS NULL OR pl.city ILIKE '%' || p_city || '%'))::bigint AS total_venues,
        (SELECT count(*) FROM public.places pl JOIN public.place_public_stats pps ON pl.id = pps.place_id WHERE pl.is_listed = true AND pl.merged_into_id IS NULL AND (p_city IS NULL OR pl.city ILIKE '%' || p_city || '%') AND pps.public_rating_count >= 3)::bigint AS ranked_venues,
        (SELECT count(*) FROM public.dishes d WHERE d.is_listed = true AND d.merged_into_id IS NULL)::bigint AS total_dishes,
        (SELECT count(*) FROM public.dishes d JOIN public.dish_public_stats dps ON d.id = dps.dish_id WHERE d.is_listed = true AND d.merged_into_id IS NULL AND dps.public_rating_count >= 3)::bigint AS ranked_dishes,
        public.get_regional_prior_mean(p_city, 7.0) AS regional_avg_rating;
END;
$$;
