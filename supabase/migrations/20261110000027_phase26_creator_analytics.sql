-- Migration: Phase 26 Creator Tools and Private Analytics
-- Tables: entry_stats_daily, profile_stats_daily
-- Aggregated daily metrics with strictly owner-only RLS and privacy guarantees (no viewer tracking)

CREATE TABLE IF NOT EXISTS public.entry_stats_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES public.food_experiences(id) ON DELETE CASCADE,
  day DATE NOT NULL DEFAULT CURRENT_DATE,
  views INT NOT NULL DEFAULT 0,
  saves INT NOT NULL DEFAULT 0,
  likes INT NOT NULL DEFAULT 0,
  comment_count INT NOT NULL DEFAULT 0,
  CONSTRAINT uq_entry_stats_day UNIQUE(entry_id, day)
);

CREATE TABLE IF NOT EXISTS public.profile_stats_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day DATE NOT NULL DEFAULT CURRENT_DATE,
  profile_views INT NOT NULL DEFAULT 0,
  new_followers INT NOT NULL DEFAULT 0,
  CONSTRAINT uq_profile_stats_day UNIQUE(profile_id, day)
);

CREATE INDEX IF NOT EXISTS idx_entry_stats_daily_entry ON public.entry_stats_daily(entry_id, day);
CREATE INDEX IF NOT EXISTS idx_profile_stats_daily_profile ON public.profile_stats_daily(profile_id, day);

-- Enable RLS
ALTER TABLE public.entry_stats_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_stats_daily ENABLE ROW LEVEL SECURITY;

-- Explicit RLS Policies: Strictly Entry/Profile Owner Only
CREATE POLICY entry_stats_daily_select ON public.entry_stats_daily
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.food_experiences fe
      WHERE fe.id = entry_stats_daily.entry_id
        AND fe.user_id = (SELECT auth.uid())
    )
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

CREATE POLICY entry_stats_daily_admin ON public.entry_stats_daily
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

CREATE POLICY profile_stats_daily_select ON public.profile_stats_daily
  FOR SELECT
  USING (
    (SELECT auth.uid()) = profile_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

CREATE POLICY profile_stats_daily_admin ON public.profile_stats_daily
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

-- RPC for Creator Analytics Summary
CREATE OR REPLACE FUNCTION public.get_creator_analytics(p_profile_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_viewer UUID := (SELECT auth.uid());
  v_total_views BIGINT := 0;
  v_total_saves BIGINT := 0;
  v_total_likes BIGINT := 0;
  v_daily_reach JSONB;
BEGIN
  -- Strict owner check
  IF v_viewer IS NULL OR v_viewer != p_profile_id THEN
    RETURN NULL;
  END IF;

  -- Compute totals from daily aggregated stats
  SELECT 
    COALESCE(SUM(views), 0),
    COALESCE(SUM(saves), 0),
    COALESCE(SUM(likes), 0)
  INTO v_total_views, v_total_saves, v_total_likes
  FROM public.entry_stats_daily esd
  JOIN public.food_experiences fe ON fe.id = esd.entry_id
  WHERE fe.user_id = p_profile_id
    AND esd.day >= CURRENT_DATE - INTERVAL '30 days';

  -- Aggregate 30-day timeline
  SELECT jsonb_agg(
    jsonb_build_object(
      'day', day_series::date,
      'views', COALESCE(SUM(esd.views), 0),
      'saves', COALESCE(SUM(esd.saves), 0)
    ) ORDER BY day_series::date ASC
  )
  INTO v_daily_reach
  FROM generate_series(CURRENT_DATE - INTERVAL '29 days', CURRENT_DATE, INTERVAL '1 day') AS day_series
  LEFT JOIN (
    SELECT esd.day, esd.views, esd.saves
    FROM public.entry_stats_daily esd
    JOIN public.food_experiences fe ON fe.id = esd.entry_id
    WHERE fe.user_id = p_profile_id
  ) esd ON esd.day = day_series::date
  GROUP BY day_series::date;

  RETURN jsonb_build_object(
    'profile_id', p_profile_id,
    'total_views_30d', v_total_views,
    'total_saves_30d', v_total_saves,
    'total_likes_30d', v_total_likes,
    'daily_reach', COALESCE(v_daily_reach, '[]'::jsonb)
  );
END;
$$;
