-- Migration: Phase 18 Maps, Location and Rich Dish/Place Pages
-- Adds source_attribution and last_synced_at to places
-- Implements get_map_pins RPC with strict venue-only coordinates and public-pool filtering

ALTER TABLE public.places 
  ADD COLUMN IF NOT EXISTS source_attribution TEXT,
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

-- Prevent places from being registered as 'home'
ALTER TABLE public.places
  DROP CONSTRAINT IF EXISTS check_place_not_home;

ALTER TABLE public.places
  ADD CONSTRAINT check_place_not_home CHECK (lower(name) != 'home');

-- Function to return map venue pins (never user coordinates)
CREATE OR REPLACE FUNCTION public.get_map_pins(
  p_min_lat NUMERIC DEFAULT NULL,
  p_max_lat NUMERIC DEFAULT NULL,
  p_min_lng NUMERIC DEFAULT NULL,
  p_max_lng NUMERIC DEFAULT NULL,
  p_city TEXT DEFAULT 'Hyderabad'
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  lat NUMERIC,
  lng NUMERIC,
  city TEXT,
  address TEXT,
  source_attribution TEXT,
  is_visited_by_viewer BOOLEAN,
  public_experience_count BIGINT,
  public_rating_avg NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_viewer_id UUID := (SELECT auth.uid());
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.lat,
    p.lng,
    p.city,
    p.address,
    p.source_attribution,
    CASE 
      WHEN v_viewer_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.food_experiences fe
        WHERE fe.place_id = p.id AND fe.user_id = v_viewer_id
      ) THEN true
      ELSE false
    END AS is_visited_by_viewer,
    COALESCE(ps.public_experience_count, 0) AS public_experience_count,
    ROUND(ps.public_rating_avg::numeric, 1) AS public_rating_avg
  FROM public.places p
  LEFT JOIN public.place_public_stats ps ON ps.place_id = p.id
  WHERE p.lat IS NOT NULL 
    AND p.lng IS NOT NULL
    AND (p_city IS NULL OR p.city ILIKE p_city)
    AND (p_min_lat IS NULL OR p.lat >= p_min_lat)
    AND (p_max_lat IS NULL OR p.lat <= p_max_lat)
    AND (p_min_lng IS NULL OR p.lng >= p_min_lng)
    AND (p_max_lng IS NULL OR p.lng <= p_max_lng)
    AND (
      -- Place is either referenced by a public pool entry or visited by viewer
      (ps.public_experience_count > 0)
      OR (v_viewer_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.food_experiences fe
        WHERE fe.place_id = p.id AND fe.user_id = v_viewer_id
      ))
    );
END;
$$;
