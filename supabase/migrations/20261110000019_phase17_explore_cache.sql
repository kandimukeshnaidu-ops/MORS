-- Migration: Phase 17 Explore Cache
-- Table: explore_cache (public-pool aggregated discovery)
-- RLS enabled with explicit policies and SECURITY DEFINER refresh/query functions

CREATE TABLE IF NOT EXISTS public.explore_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope TEXT NOT NULL CHECK (scope IN ('city', 'global')),
  city TEXT NOT NULL DEFAULT 'Hyderabad',
  kind TEXT NOT NULL CHECK (kind IN ('trending', 'popular_dishes', 'places', 'creators')),
  payload JSONB NOT NULL DEFAULT '[]'::jsonb,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_explore_cache UNIQUE (scope, city, kind)
);

-- Index for queries
CREATE INDEX IF NOT EXISTS idx_explore_cache_scope_city ON public.explore_cache(scope, city, kind);

-- Enable RLS
ALTER TABLE public.explore_cache ENABLE ROW LEVEL SECURITY;

-- Explicit RLS Policies:
-- Readable by anyone (anonymous or authenticated) because it strictly holds pre-aggregated public-pool data
CREATE POLICY explore_cache_select ON public.explore_cache
  FOR SELECT
  USING (true);

-- Mutations restricted to service role / SECURITY DEFINER functions
CREATE POLICY explore_cache_admin ON public.explore_cache
  FOR ALL
  USING (false);

-- RPC to retrieve or lazily generate explore sections
CREATE OR REPLACE FUNCTION public.get_explore_cached(p_city TEXT DEFAULT 'Hyderabad', p_kind TEXT DEFAULT 'trending')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_payload JSONB;
BEGIN
  -- Attempt to read from cache first
  SELECT payload INTO v_payload
  FROM public.explore_cache
  WHERE scope = 'city' AND city = p_city AND kind = p_kind;

  IF v_payload IS NOT NULL THEN
    RETURN v_payload;
  END IF;

  -- Return empty JSON array if no cached entry yet
  RETURN '[]'::jsonb;
END;
$$;
