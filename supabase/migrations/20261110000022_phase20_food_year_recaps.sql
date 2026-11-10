-- Migration: Phase 20 Food Year Recap
-- Table: recaps
-- Implements token-gated sharing with strict owner RLS and SECURITY DEFINER RPCs

CREATE TABLE IF NOT EXISTS public.recaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  year INT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  share_token UUID UNIQUE DEFAULT gen_random_uuid(),
  share_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  include_private BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT uq_user_recap_year UNIQUE (user_id, year)
);

-- Index for policy and token lookups
CREATE INDEX IF NOT EXISTS idx_recaps_user_year ON public.recaps(user_id, year);
CREATE INDEX IF NOT EXISTS idx_recaps_share_token ON public.recaps(share_token);

-- Enable RLS
ALTER TABLE public.recaps ENABLE ROW LEVEL SECURITY;

-- Explicit RLS Policies: Owner Only
CREATE POLICY recaps_owner_select ON public.recaps
  FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
  );

CREATE POLICY recaps_owner_all ON public.recaps
  FOR ALL
  USING (
    (SELECT auth.uid()) = user_id
  );

-- SECURITY DEFINER RPC to fetch shared recap by token (returns 404 / null if not enabled or nonexistent)
CREATE OR REPLACE FUNCTION public.get_recap_by_token(p_token UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'year', r.year,
    'username', p.username,
    'displayName', p.display_name,
    'avatarPath', p.avatar_path,
    'data', r.data,
    'generated_at', r.generated_at
  )
  INTO v_result
  FROM public.recaps r
  JOIN public.profiles p ON p.id = r.user_id
  WHERE r.share_token = p_token
    AND r.share_enabled = true
    AND p.deletion_pending_at IS NULL;

  RETURN v_result;
END;
$$;

-- SECURITY DEFINER RPC to toggle recap sharing and regenerate token
CREATE OR REPLACE FUNCTION public.toggle_recap_sharing(
  p_year INT,
  p_share_enabled BOOLEAN,
  p_include_private BOOLEAN DEFAULT FALSE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := (SELECT auth.uid());
  v_token UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  INSERT INTO public.recaps (user_id, year, share_enabled, include_private, share_token)
  VALUES (v_user_id, p_year, p_share_enabled, p_include_private, gen_random_uuid())
  ON CONFLICT (user_id, year)
  DO UPDATE SET 
    share_enabled = EXCLUDED.share_enabled,
    include_private = EXCLUDED.include_private,
    share_token = CASE 
      WHEN EXCLUDED.share_enabled THEN COALESCE(public.recaps.share_token, gen_random_uuid())
      ELSE public.recaps.share_token
    END
  RETURNING share_token INTO v_token;

  RETURN v_token;
END;
$$;
