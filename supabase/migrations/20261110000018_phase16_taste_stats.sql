-- Migration: Phase 16 Taste Identity and Stats
-- Tables: user_stats_owner, user_stats_public
-- RLS enabled with explicit policies and SECURITY DEFINER computation function

CREATE TABLE IF NOT EXISTS public.user_stats_owner (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  period TEXT NOT NULL CHECK (period IN ('all_time', 'year', 'month')),
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, period)
);

CREATE TABLE IF NOT EXISTS public.user_stats_public (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  period TEXT NOT NULL CHECK (period IN ('all_time', 'year', 'month')),
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, period)
);

-- Indexes for policy columns and queries
CREATE INDEX IF NOT EXISTS idx_user_stats_owner_user ON public.user_stats_owner(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_public_user ON public.user_stats_public(user_id);

-- Enable RLS
ALTER TABLE public.user_stats_owner ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats_public ENABLE ROW LEVEL SECURITY;

-- Explicit RLS Policies for user_stats_owner:
-- Strictly owner-only visibility
CREATE POLICY user_stats_owner_select ON public.user_stats_owner
  FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
  );

CREATE POLICY user_stats_owner_all_admin ON public.user_stats_owner
  FOR ALL
  USING (
    (SELECT auth.uid()) = user_id
  );

-- Explicit RLS Policies for user_stats_public:
-- Readable by anyone if owner's profile is public, not pending deletion, and viewer is not blocked
CREATE POLICY user_stats_public_select ON public.user_stats_public
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = user_stats_public.user_id
        AND p.is_private = false
        AND p.deletion_pending_at IS NULL
        AND (
          (SELECT auth.uid()) IS NULL
          OR NOT EXISTS (
            SELECT 1 FROM public.blocks b
            WHERE (b.blocker_id = (SELECT auth.uid()) AND b.blocked_id = p.id)
               OR (b.blocker_id = p.id AND b.blocked_id = (SELECT auth.uid()))
          )
        )
    )
  );

CREATE POLICY user_stats_public_admin ON public.user_stats_public
  FOR ALL
  USING (
    (SELECT auth.uid()) = user_id
  );

-- Function to recompute stats with strict security qualifiers
CREATE OR REPLACE FUNCTION public.recompute_user_stats(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_owner_data JSONB;
  v_public_data JSONB;
  v_is_profile_public BOOLEAN;
  v_is_pending_del BOOLEAN;
BEGIN
  -- Check profile flags
  SELECT is_private = false, deletion_pending_at IS NOT NULL
  INTO v_is_profile_public, v_is_pending_del
  FROM public.profiles
  WHERE id = p_user_id;

  -- 1. Compute Owner Stats (All published entries of the user)
  SELECT jsonb_build_object(
    'total_experiences', COALESCE(COUNT(DISTINCT fe.id), 0),
    'distinct_dishes', COALESCE(COUNT(DISTINCT ed.dish_id), 0),
    'distinct_places', COALESCE(COUNT(DISTINCT fe.place_id), 0),
    'avg_rating', ROUND(AVG(fe.rating)::numeric, 1)
  )
  INTO v_owner_data
  FROM public.food_experiences fe
  LEFT JOIN public.experience_dishes ed ON ed.experience_id = fe.id
  WHERE fe.user_id = p_user_id
    AND fe.status = 'published';

  -- Upsert owner stats for all_time
  INSERT INTO public.user_stats_owner (user_id, period, data, computed_at)
  VALUES (p_user_id, 'all_time', COALESCE(v_owner_data, '{}'::jsonb), now())
  ON CONFLICT (user_id, period)
  DO UPDATE SET data = EXCLUDED.data, computed_at = EXCLUDED.computed_at;

  -- 2. Compute Public Stats (Only public-pool entries, and only if profile is public & not pending deletion)
  IF v_is_profile_public AND NOT v_is_pending_del THEN
    SELECT jsonb_build_object(
      'total_experiences', COALESCE(COUNT(DISTINCT fe.id), 0),
      'distinct_dishes', COALESCE(COUNT(DISTINCT ed.dish_id), 0),
      'distinct_places', COALESCE(COUNT(DISTINCT fe.place_id), 0),
      'avg_rating', ROUND(AVG(fe.rating)::numeric, 1)
    )
    INTO v_public_data
    FROM public.food_experiences fe
    LEFT JOIN public.experience_dishes ed ON ed.experience_id = fe.id
    WHERE fe.user_id = p_user_id
      AND fe.status = 'published'
      AND fe.visibility = 'public';

    INSERT INTO public.user_stats_public (user_id, period, data, computed_at)
    VALUES (p_user_id, 'all_time', COALESCE(v_public_data, '{}'::jsonb), now())
    ON CONFLICT (user_id, period)
    DO UPDATE SET data = EXCLUDED.data, computed_at = EXCLUDED.computed_at;
  ELSE
    -- If private or pending deletion, delete public stats to ensure zero leak
    DELETE FROM public.user_stats_public WHERE user_id = p_user_id;
  END IF;
END;
$$;
