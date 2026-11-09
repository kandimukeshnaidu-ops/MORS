-- MORS Database Migration: Full-text & Trigram Search (Phase 10)
-- Migration: 20261110000009_search.sql

-- 1. Trigram and FTS Indexes
CREATE INDEX IF NOT EXISTS idx_dishes_canonical_name_trgm 
ON public.dishes USING gin (canonical_name extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_places_name_trgm 
ON public.places USING gin (name extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_places_city_trgm 
ON public.places USING gin (city extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_experiences_title_trgm 
ON public.food_experiences USING gin (title extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_collections_name_trgm 
ON public.collections USING gin (name extensions.gin_trgm_ops);

-- 2. Unified Search Function (SECURITY INVOKER)
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
        -- A. Canonical Dishes
        SELECT
            'dish'::text AS r_type,
            d.id::text AS r_id,
            d.canonical_name::text AS r_title,
            COALESCE(d.cuisine, 'Dish')::text AS r_subtitle,
            d.primary_photo_path::text AS r_photo,
            ('/dish/' || d.slug)::text AS r_url,
            GREATEST(
                extensions.similarity(d.canonical_name, clean_q),
                extensions.similarity(d.normalized_name, lower(clean_q)),
                CASE WHEN d.canonical_name ILIKE '%' || clean_q || '%' THEN 0.8 ELSE 0.0 END
            )::double precision AS r_score
        FROM public.dishes d
        WHERE (p_types IS NULL OR 'dish' = ANY(p_types))
          AND (
              d.canonical_name ILIKE '%' || clean_q || '%' OR
              d.normalized_name % lower(clean_q) OR
              extensions.similarity(d.canonical_name, clean_q) > 0.25
          )

        UNION ALL

        -- B. Dining Places / Venues
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
