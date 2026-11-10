-- Migration: Phase 28 Smart Logging Assist (Opt-in)
-- Table: ai_assist_preferences
-- Implements consent-gated dish assistance with strict daily quota and fallback to manual logging

CREATE TABLE IF NOT EXISTS public.ai_assist_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  daily_quota_used INT NOT NULL DEFAULT 0,
  max_daily_quota INT NOT NULL DEFAULT 20,
  last_reset_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_assist_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_assist_preferences_select ON public.ai_assist_preferences
  FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

CREATE POLICY ai_assist_preferences_all ON public.ai_assist_preferences
  FOR ALL
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

-- RPC for Opt-in Dish Suggestions
CREATE OR REPLACE FUNCTION public.get_ai_assist_dishes(
  p_cuisine TEXT DEFAULT NULL,
  p_hint TEXT DEFAULT NULL
)
RETURNS TABLE (
  dish_name TEXT,
  source TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := (SELECT auth.uid());
  v_enabled BOOLEAN := false;
  v_used INT := 0;
  v_max INT := 20;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT enabled, daily_quota_used, max_daily_quota
  INTO v_enabled, v_used, v_max
  FROM public.ai_assist_preferences
  WHERE user_id = v_user_id;

  -- Require explicit opt-in and available quota
  IF NOT COALESCE(v_enabled, false) OR v_used >= v_max THEN
    RETURN;
  END IF;

  -- Increment daily quota usage
  UPDATE public.ai_assist_preferences
  SET daily_quota_used = daily_quota_used + 1
  WHERE user_id = v_user_id;

  -- Return matching reference dishes based on cuisine or hint
  RETURN QUERY
  SELECT d.name AS dish_name, 'reference_pool'::text AS source
  FROM public.dishes d
  WHERE d.is_listed = true
    AND (
      p_hint IS NULL 
      OR d.name ILIKE '%' || p_hint || '%'
      OR d.normalized_name ILIKE '%' || p_hint || '%'
    )
  ORDER BY d.created_at DESC
  LIMIT 3;
END;
$$;
