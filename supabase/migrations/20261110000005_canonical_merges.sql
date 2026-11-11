-- ==============================================================================
-- MORS Database Migration: 20261110000005_canonical_merges.sql
-- Phase 6: Canonical Dishe/Place Merges & Trigram Fuzzy Matchers
-- ==============================================================================

-- 1. MERGE_DISHES RPC
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

  -- Only admin/moderator or the creator can merge
  IF v_user_role NOT IN ('admin', 'moderator') AND v_source.created_by <> v_user_id THEN
    RAISE EXCEPTION 'Insufficient permissions to merge dishes';
  END IF;

  -- 1. Re-point references in experience_dishes
  UPDATE public.experience_dishes
  SET dish_id = p_target_id
  WHERE dish_id = p_source_id;

  -- 2. Add source name and its aliases to target as aliases
  INSERT INTO public.dish_aliases (dish_id, alias, normalized_alias)
  VALUES (p_target_id, v_source.name, v_source.normalized_name)
  ON CONFLICT DO NOTHING;

  UPDATE public.dish_aliases
  SET dish_id = p_target_id
  WHERE dish_id = p_source_id;

  -- 3. Mark source dish as merged
  UPDATE public.dishes
  SET merged_into_id = p_target_id
  WHERE id = p_source_id;

  RETURN true;
END;
$$;

-- 2. MERGE_PLACES RPC
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

  -- 3. Mark source place as merged
  UPDATE public.places
  SET merged_into_id = p_target_id
  WHERE id = p_source_id;

  RETURN true;
END;
$$;

-- 3. FIND_SIMILAR_DISHES (Trigram Fuzzy Matcher)
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
    AND extensions.similarity(d.normalized_name, v_normalized) >= p_threshold
  ORDER BY similarity DESC
  LIMIT 5;
END;
$$;

-- 4. FIND_SIMILAR_PLACES (Trigram Fuzzy Matcher)
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
    AND extensions.similarity(pl.normalized_name, v_normalized) >= p_threshold
    AND (p_city IS NULL OR pl.city ILIKE ('%' || p_city || '%'))
  ORDER BY similarity DESC
  LIMIT 5;
END;
$$;
