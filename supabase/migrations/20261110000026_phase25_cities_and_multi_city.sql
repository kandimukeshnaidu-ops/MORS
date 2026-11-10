-- Migration: Phase 25 Multi-City Expansion and Reference Data
-- Table: cities
-- Links places.city_id and profiles.city_id to cities table with RLS and active cities RPC

CREATE TABLE IF NOT EXISTS public.cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_local TEXT,
  state TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'India',
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

-- Explicit RLS Policies: Reference data readable by anyone
CREATE POLICY cities_select ON public.cities
  FOR SELECT
  USING (true);

CREATE POLICY cities_admin ON public.cities
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

-- Add city_id FKs to places and profiles
ALTER TABLE public.places
  ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES public.cities(id) ON DELETE SET NULL;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES public.cities(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_places_city_id ON public.places(city_id);
CREATE INDEX IF NOT EXISTS idx_profiles_city_id ON public.profiles(city_id);

-- Seed initial cities (Hyderabad beta anchor + future regional clusters)
INSERT INTO public.cities (slug, name, name_local, state, country, lat, lng, timezone, is_active)
VALUES 
  ('hyderabad', 'Hyderabad', 'హైదరాబాద్', 'Telangana', 'India', 17.3850, 78.4867, 'Asia/Kolkata', true),
  ('bengaluru', 'Bengaluru', 'ಬೆಂಗಳೂರು', 'Karnataka', 'India', 12.9716, 77.5946, 'Asia/Kolkata', true),
  ('mumbai', 'Mumbai', 'मुंबई', 'Maharashtra', 'India', 19.0760, 72.8777, 'Asia/Kolkata', true),
  ('delhi-ncr', 'Delhi-NCR', 'दिल्ली', 'Delhi', 'India', 28.6139, 77.2090, 'Asia/Kolkata', true)
ON CONFLICT (slug) DO NOTHING;

-- Backfill existing Hyderabad places
UPDATE public.places 
SET city_id = (SELECT id FROM public.cities WHERE slug = 'hyderabad')
WHERE city ILIKE 'hyderabad' AND city_id IS NULL;

-- RPC to list active cities
CREATE OR REPLACE FUNCTION public.get_active_cities()
RETURNS TABLE (
  id UUID,
  slug TEXT,
  name TEXT,
  name_local TEXT,
  state TEXT,
  country TEXT,
  timezone TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.slug,
    c.name,
    c.name_local,
    c.state,
    c.country,
    c.timezone
  FROM public.cities c
  WHERE c.is_active = true
  ORDER BY (c.slug = 'hyderabad') DESC, c.name ASC;
END;
$$;
