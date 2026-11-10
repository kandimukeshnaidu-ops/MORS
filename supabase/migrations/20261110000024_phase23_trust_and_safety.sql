-- Migration: Phase 23 Trust and Safety at Scale
-- Tables: user_strikes, suspensions, appeals, trusted_reporters, spam_signals, content_hashes
-- All tables with RLS enabled, explicit policies, and SECURITY DEFINER helpers

-- 1. User Strikes
CREATE TABLE IF NOT EXISTS public.user_strikes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  issued_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '90 days')
);
CREATE INDEX IF NOT EXISTS idx_user_strikes_user ON public.user_strikes(user_id);
ALTER TABLE public.user_strikes ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_strikes_select ON public.user_strikes
  FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

CREATE POLICY user_strikes_admin ON public.user_strikes
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

-- 2. User Suspensions
CREATE TABLE IF NOT EXISTS public.suspensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,
  reason TEXT NOT NULL,
  issued_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true
);
CREATE INDEX IF NOT EXISTS idx_suspensions_user ON public.suspensions(user_id, is_active);
ALTER TABLE public.suspensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY suspensions_select ON public.suspensions
  FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

CREATE POLICY suspensions_admin ON public.suspensions
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

-- 3. Appeals
CREATE TABLE IF NOT EXISTS public.appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_id UUID REFERENCES public.moderation_actions(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  handled_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_appeals_user ON public.appeals(user_id);
ALTER TABLE public.appeals ENABLE ROW LEVEL SECURITY;

CREATE POLICY appeals_select ON public.appeals
  FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

CREATE POLICY appeals_insert ON public.appeals
  FOR INSERT
  WITH CHECK (
    (SELECT auth.uid()) = user_id
  );

CREATE POLICY appeals_admin ON public.appeals
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

-- 4. Trusted Reporters
CREATE TABLE IF NOT EXISTS public.trusted_reporters (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  trust_score NUMERIC NOT NULL DEFAULT 1.0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.trusted_reporters ENABLE ROW LEVEL SECURITY;

CREATE POLICY trusted_reporters_admin ON public.trusted_reporters
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

-- 5. Spam Signals
CREATE TABLE IF NOT EXISTS public.spam_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  signal TEXT NOT NULL,
  score NUMERIC NOT NULL DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_spam_signals_user ON public.spam_signals(user_id);
ALTER TABLE public.spam_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY spam_signals_admin ON public.spam_signals
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

-- 6. Content Hashes (for known-bad content prevention)
CREATE TABLE IF NOT EXISTS public.content_hashes (
  sha256 TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'blocked',
  added_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.content_hashes ENABLE ROW LEVEL SECURITY;

CREATE POLICY content_hashes_admin ON public.content_hashes
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

-- Helper RPC: Submit User Appeal
CREATE OR REPLACE FUNCTION public.submit_user_appeal(
  p_action_id UUID,
  p_text TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := (SELECT auth.uid());
  v_appeal_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF length(trim(p_text)) < 10 THEN
    RAISE EXCEPTION 'Appeal explanation must be at least 10 characters';
  END IF;

  INSERT INTO public.appeals (user_id, action_id, text, status)
  VALUES (v_user_id, p_action_id, trim(p_text), 'pending')
  RETURNING id INTO v_appeal_id;

  RETURN v_appeal_id;
END;
$$;

-- Helper RPC: Check User Suspension
CREATE OR REPLACE FUNCTION public.check_user_is_suspended(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.suspensions
    WHERE user_id = p_user_id
      AND is_active = true
      AND (ends_at IS NULL OR ends_at > now())
  );
END;
$$;
