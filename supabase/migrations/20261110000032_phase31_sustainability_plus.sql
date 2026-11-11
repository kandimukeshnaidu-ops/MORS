-- Migration: Phase 31 Sustainability & MORS Plus
-- Tables: subscriptions, entitlement_grants
-- Strict RLS; no client mutation (webhook/service-role and SECURITY DEFINER RPC only)
-- Graceful downgrade: zero data deletion on cancellation; free tier remains 100% usable

-- 1. Subscriptions Table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'razorpay', 'test')),
  provider_sub_id TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL CHECK (plan IN ('plus_monthly', 'plus_annual', 'patron')),
  status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY subscriptions_select ON public.subscriptions
  FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

CREATE POLICY subscriptions_admin ON public.subscriptions
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

-- 2. Entitlement Grants (Specific capability grants e.g. storage boost, printable recap)
CREATE TABLE IF NOT EXISTS public.entitlement_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  entitlement_key TEXT NOT NULL CHECK (entitlement_key IN ('storage_boost_10gb', 'printable_recap', 'advanced_analytics', 'custom_theme')),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  UNIQUE (user_id, entitlement_key)
);
CREATE INDEX IF NOT EXISTS idx_entitlement_grants_user ON public.entitlement_grants(user_id);
ALTER TABLE public.entitlement_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY entitlement_grants_select ON public.entitlement_grants
  FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

CREATE POLICY entitlement_grants_admin ON public.entitlement_grants
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

-- RPC for Entitlement Verification (server-side only)
CREATE OR REPLACE FUNCTION public.has_entitlement(
  p_user_id UUID,
  p_key TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_has_active_sub BOOLEAN := false;
  v_has_grant BOOLEAN := false;
BEGIN
  -- Check active subscription
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.user_id = p_user_id
      AND s.status IN ('active', 'trialing')
      AND s.current_period_end > now()
  ) INTO v_has_active_sub;

  IF v_has_active_sub THEN
    RETURN true;
  END IF;

  -- Check explicit entitlement grant
  SELECT EXISTS (
    SELECT 1 FROM public.entitlement_grants eg
    WHERE eg.user_id = p_user_id
      AND eg.entitlement_key = p_key
      AND (eg.expires_at IS NULL OR eg.expires_at > now())
  ) INTO v_has_grant;

  RETURN v_has_grant;
END;
$$;

-- RPC for One-Click User Subscription Cancellation
CREATE OR REPLACE FUNCTION public.cancel_user_subscription(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller UUID := (SELECT auth.uid());
BEGIN
  IF v_caller IS NULL OR v_caller != p_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.subscriptions
  SET cancel_at_period_end = true, updated_at = now()
  WHERE user_id = p_user_id
    AND status IN ('active', 'trialing');

  RETURN FOUND;
END;
$$;
