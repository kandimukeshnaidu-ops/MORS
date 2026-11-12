-- ==============================================================================
-- MORS 2.0 Database Migration: 20261112000035_mors2_phase2_find_experience_and_merges.sql
-- Phase 2: Dual-Intent Find Experience (Restaurants & Food) & Canonical Merge Fixes (BUG-06)
-- ==============================================================================

-- 0. Fix collection_items unique constraint bug (NULLS NOT DISTINCT blocks multi-item collections)
ALTER TABLE public.collection_items
  DROP CONSTRAINT IF EXISTS uq_collection_experience,
  DROP CONSTRAINT IF EXISTS uq_collection_dish,
  DROP CONSTRAINT IF EXISTS uq_collection_place;

DROP INDEX IF EXISTS public.uq_collection_experience;
DROP INDEX IF EXISTS public.uq_collection_dish;
DROP INDEX IF EXISTS public.uq_collection_place;

CREATE UNIQUE INDEX IF NOT EXISTS uq_collection_experience 
  ON public.collection_items (collection_id, experience_id) 
  WHERE experience_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_collection_dish 
  ON public.collection_items (collection_id, dish_id) 
  WHERE dish_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_collection_place 
  ON public.collection_items (collection_id, place_id) 
  WHERE place_id IS NOT NULL;

-- 1. Dual-Intent Find: FIND_RESTAURANTS RPC
-- Optimized for "Where should I eat?": searches places with community statistics
CREATE OR REPLACE FUNCTION public.find_restaurants(
    p_query text DEFAULT NULL,
    p_city text DEFAULT NULL,
    p_cuisine text DEFAULT NULL,
    p_place_type text DEFAULT NULL,
    p_sort text DEFAULT 'relevance', -- 'relevance', 'rating_count', 'rating_score'
    p_limit integer DEFAULT 25,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    name text,
    normalized_name text,
    address text,
    city text,
    place_type text,
    lat double precision,
    lng double precision,
    public_experience_count integer,
    public_rating_count bigint,
    public_rating_avg numeric(4,2),
    food_quality_avg numeric(4,2),
    value_for_money_avg numeric(4,2),
    ambience_avg numeric(4,2),
    service_avg numeric(4,2),
    hygiene_avg numeric(4,2),
    would_return_pct numeric(5,2),
    similarity double precision
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_clean_q text;
    v_viewer_uuid uuid;
BEGIN
    v_clean_q := trim(coalesce(p_query, ''));
    v_viewer_uuid := auth.uid();

    RETURN QUERY
    SELECT
        pl.id,
        pl.name,
        pl.normalized_name,
        pl.address,
        pl.city,
        pl.place_type,
        pl.lat,
        pl.lng,
        coalesce(pps.public_experience_count, 0) AS public_experience_count,
        coalesce(pps.public_rating_count, 0::bigint) AS public_rating_count,
        pps.public_rating_avg,
        pps.food_quality_avg,
        pps.value_for_money_avg,
        pps.ambience_avg,
        pps.service_avg,
        pps.hygiene_avg,
        pps.would_return_pct,
        CASE
            WHEN v_clean_q <> '' THEN
                GREATEST(
                    extensions.similarity(pl.name, v_clean_q),
                    extensions.similarity(pl.normalized_name, lower(v_clean_q)),
                    CASE WHEN pl.name ILIKE '%' || v_clean_q || '%' THEN 0.85 ELSE 0.0 END
                )::double precision
            ELSE 1.0::double precision
        END AS similarity
    FROM public.places pl
    LEFT JOIN public.place_public_stats pps ON pl.id = pps.place_id
    WHERE pl.merged_into_id IS NULL
      AND (pl.is_listed = true OR (v_viewer_uuid IS NOT NULL AND pl.created_by = v_viewer_uuid) OR EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = v_viewer_uuid AND pr.is_admin = true))
      AND (p_city IS NULL OR p_city = '' OR pl.city ILIKE '%' || trim(p_city) || '%' OR pl.address ILIKE '%' || trim(p_city) || '%')
      AND (p_cuisine IS NULL OR p_cuisine = '' OR pl.place_type ILIKE '%' || trim(p_cuisine) || '%')
      AND (p_place_type IS NULL OR p_place_type = '' OR pl.place_type = p_place_type)
      AND (
          v_clean_q = '' OR
          pl.name ILIKE '%' || v_clean_q || '%' OR
          pl.normalized_name % lower(v_clean_q) OR
          extensions.similarity(pl.name, v_clean_q) > 0.2
      )
    ORDER BY
        CASE WHEN p_sort = 'rating_score' THEN pps.public_rating_avg END DESC NULLS LAST,
        CASE WHEN p_sort = 'rating_count' THEN pps.public_rating_count END DESC,
        CASE WHEN p_sort = 'relevance' AND v_clean_q <> '' THEN
            GREATEST(
                extensions.similarity(pl.name, v_clean_q),
                extensions.similarity(pl.normalized_name, lower(v_clean_q)),
                CASE WHEN pl.name ILIKE '%' || v_clean_q || '%' THEN 0.85 ELSE 0.0 END
            )
        END DESC NULLS LAST,
        pps.public_experience_count DESC,
        pl.name ASC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- 2. Dual-Intent Find: FIND_FOOD_DISHES RPC
-- Optimized for "What should I eat?": searches dishes with community statistics and top places
CREATE OR REPLACE FUNCTION public.find_food_dishes(
    p_query text DEFAULT NULL,
    p_cuisine text DEFAULT NULL,
    p_dietary_tag text DEFAULT NULL,
    p_sort text DEFAULT 'relevance', -- 'relevance', 'rating_count', 'rating_score'
    p_limit integer DEFAULT 25,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    name text,
    normalized_name text,
    slug text,
    cuisine text,
    description text,
    public_experience_count integer,
    public_rating_count integer,
    public_rating_avg numeric(4,2),
    taste_avg numeric(4,2),
    portion_avg numeric(4,2),
    value_avg numeric(4,2),
    similarity double precision,
    top_places jsonb
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_clean_q text;
    v_viewer_uuid uuid;
BEGIN
    v_clean_q := trim(coalesce(p_query, ''));
    v_viewer_uuid := auth.uid();

    RETURN QUERY
    WITH candidate_dishes AS (
        SELECT
            d.id,
            d.name,
            d.normalized_name,
            d.slug,
            d.cuisine,
            d.description,
            coalesce(dps.public_experience_count, 0) AS public_experience_count,
            coalesce(dps.public_rating_count, 0) AS public_rating_count,
            dps.public_rating_avg,
            dps.taste_avg,
            dps.portion_avg,
            dps.value_avg,
            CASE
                WHEN v_clean_q <> '' THEN
                    GREATEST(
                        extensions.similarity(d.name, v_clean_q),
                        extensions.similarity(d.normalized_name, lower(v_clean_q)),
                        CASE WHEN d.name ILIKE '%' || v_clean_q || '%' THEN 0.85 ELSE 0.0 END
                    )::double precision
                ELSE 1.0::double precision
            END AS sim_score
        FROM public.dishes d
        LEFT JOIN public.dish_public_stats dps ON d.id = dps.dish_id
        WHERE d.merged_into_id IS NULL
          AND (d.is_listed = true OR (v_viewer_uuid IS NOT NULL AND d.created_by = v_viewer_uuid) OR EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = v_viewer_uuid AND pr.is_admin = true))
          AND (p_cuisine IS NULL OR p_cuisine = '' OR d.cuisine ILIKE '%' || trim(p_cuisine) || '%')
          AND (
              v_clean_q = '' OR
              d.name ILIKE '%' || v_clean_q || '%' OR
              d.normalized_name % lower(v_clean_q) OR
              extensions.similarity(d.name, v_clean_q) > 0.2 OR
              EXISTS (
                  SELECT 1 FROM public.dish_aliases da
                  WHERE da.dish_id = d.id AND (da.alias ILIKE '%' || v_clean_q || '%' OR extensions.similarity(da.alias, v_clean_q) > 0.25)
              )
          )
        ORDER BY
            CASE WHEN p_sort = 'rating_score' THEN dps.public_rating_avg END DESC NULLS LAST,
            CASE WHEN p_sort = 'rating_count' THEN dps.public_rating_count END DESC,
            CASE WHEN p_sort = 'relevance' AND v_clean_q <> '' THEN
                GREATEST(
                    extensions.similarity(d.name, v_clean_q),
                    extensions.similarity(d.normalized_name, lower(v_clean_q)),
                    CASE WHEN d.name ILIKE '%' || v_clean_q || '%' THEN 0.85 ELSE 0.0 END
                )
            END DESC NULLS LAST,
            dps.public_experience_count DESC,
            d.name ASC
        LIMIT p_limit
        OFFSET p_offset
    )
    SELECT
        cd.id,
        cd.name,
        cd.normalized_name,
        cd.slug,
        cd.cuisine,
        cd.description,
        cd.public_experience_count,
        cd.public_rating_count,
        cd.public_rating_avg,
        cd.taste_avg,
        cd.portion_avg,
        cd.value_avg,
        cd.sim_score AS similarity,
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
                WHERE ed.dish_id = cd.id
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
    FROM candidate_dishes cd;
END;
$$;

-- 3. Fix BUG-06: Robust Canonical Merges (Dishes and Places)
-- Merges all foreign keys (collection_items, dish_translations, dish_similarity) and triggers stat recomputation
CREATE OR REPLACE FUNCTION public.merge_dishes(
  p_source_id uuid,
  p_target_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_source record;
  v_target record;
  v_user_id uuid;
  v_user_role text;
BEGIN
  v_user_id := (SELECT auth.uid());
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT role INTO v_user_role FROM public.profiles WHERE id = v_user_id;

  IF p_source_id = p_target_id THEN
    RAISE EXCEPTION 'Cannot merge a dish into itself';
  END IF;

  SELECT * INTO v_source FROM public.dishes WHERE id = p_source_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Source dish not found';
  END IF;

  SELECT * INTO v_target FROM public.dishes WHERE id = p_target_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target dish not found';
  END IF;

  IF v_user_role NOT IN ('admin', 'moderator') AND v_source.created_by <> v_user_id THEN
    RAISE EXCEPTION 'Insufficient permissions to merge dishes';
  END IF;

  -- 1. Re-point experience_dishes
  UPDATE public.experience_dishes
  SET dish_id = p_target_id
  WHERE dish_id = p_source_id;

  -- 2. Convert source dish name into an alias of target dish (if not duplicate)
  INSERT INTO public.dish_aliases (dish_id, alias, normalized_alias)
  VALUES (p_target_id, v_source.name, v_source.normalized_name)
  ON CONFLICT DO NOTHING;

  -- 3. Re-point existing aliases from source to target
  UPDATE public.dish_aliases
  SET dish_id = p_target_id
  WHERE dish_id = p_source_id;

  -- 4. Re-point collection_items
  UPDATE public.collection_items ci
  SET dish_id = p_target_id
  WHERE ci.dish_id = p_source_id
    AND NOT EXISTS (
      SELECT 1 FROM public.collection_items existing
      WHERE existing.collection_id = ci.collection_id AND existing.dish_id = p_target_id
    );
  DELETE FROM public.collection_items WHERE dish_id = p_source_id;

  -- 5. Re-point dish_translations
  UPDATE public.dish_translations dt
  SET dish_id = p_target_id
  WHERE dt.dish_id = p_source_id
    AND NOT EXISTS (
      SELECT 1 FROM public.dish_translations existing
      WHERE existing.dish_id = p_target_id AND existing.locale = dt.locale
    );
  DELETE FROM public.dish_translations WHERE dish_id = p_source_id;

  -- 6. Delete self-referential or duplicate similarity pairs
  DELETE FROM public.dish_similarity
  WHERE (dish_a_id = p_source_id AND dish_b_id = p_target_id)
     OR (dish_a_id = p_target_id AND dish_b_id = p_source_id);

  UPDATE public.dish_similarity ds
  SET dish_a_id = p_target_id
  WHERE ds.dish_a_id = p_source_id
    AND NOT EXISTS (
      SELECT 1 FROM public.dish_similarity existing
      WHERE existing.dish_a_id = p_target_id AND existing.dish_b_id = ds.dish_b_id
    );
  DELETE FROM public.dish_similarity WHERE dish_a_id = p_source_id;

  UPDATE public.dish_similarity ds
  SET dish_b_id = p_target_id
  WHERE ds.dish_b_id = p_source_id
    AND NOT EXISTS (
      SELECT 1 FROM public.dish_similarity existing
      WHERE existing.dish_b_id = p_target_id AND existing.dish_a_id = ds.dish_a_id
    );
  DELETE FROM public.dish_similarity WHERE dish_b_id = p_source_id;

  -- 7. Mark source dish as merged
  UPDATE public.dishes
  SET merged_into_id = p_target_id
  WHERE id = p_source_id;

  -- 8. Recompute target dish public stats
  PERFORM public.recompute_dish_stats(p_target_id);

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.merge_places(
  p_source_id uuid,
  p_target_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_source record;
  v_target record;
  v_user_id uuid;
  v_user_role text;
BEGIN
  v_user_id := (SELECT auth.uid());
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT role INTO v_user_role FROM public.profiles WHERE id = v_user_id;

  IF p_source_id = p_target_id THEN
    RAISE EXCEPTION 'Cannot merge a place into itself';
  END IF;

  SELECT * INTO v_source FROM public.places WHERE id = p_source_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Source place not found';
  END IF;

  SELECT * INTO v_target FROM public.places WHERE id = p_target_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target place not found';
  END IF;

  IF v_user_role NOT IN ('admin', 'moderator') AND v_source.created_by <> v_user_id THEN
    RAISE EXCEPTION 'Insufficient permissions to merge places';
  END IF;

  -- 1. Re-point references in food_experiences
  UPDATE public.food_experiences
  SET place_id = p_target_id
  WHERE place_id = p_source_id;

  -- 2. Re-point child branches
  UPDATE public.places
  SET parent_place_id = p_target_id
  WHERE parent_place_id = p_source_id;

  -- 3. Re-point collection_items
  UPDATE public.collection_items ci
  SET place_id = p_target_id
  WHERE ci.place_id = p_source_id
    AND NOT EXISTS (
      SELECT 1 FROM public.collection_items existing
      WHERE existing.collection_id = ci.collection_id AND existing.place_id = p_target_id
    );
  DELETE FROM public.collection_items WHERE place_id = p_source_id;

  -- 4. Mark source place as merged
  UPDATE public.places
  SET merged_into_id = p_target_id
  WHERE id = p_source_id;

  -- 5. Recompute target place public stats
  PERFORM public.recompute_place_stats(p_target_id);

  RETURN true;
END;
$$;
