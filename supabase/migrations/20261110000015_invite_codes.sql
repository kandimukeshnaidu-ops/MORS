-- Migration: 20261110000015_invite_codes.sql
-- Description: Closed beta invite code gating, redemption tracking, and validation RPCs

CREATE TABLE IF NOT EXISTS public.invite_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    max_uses INTEGER NOT NULL DEFAULT 1 CHECK (max_uses > 0),
    uses_count INTEGER NOT NULL DEFAULT 0 CHECK (uses_count >= 0),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

-- Indexes for performance and policy lookups
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON public.invite_codes (code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_created_by ON public.invite_codes (created_by);

-- Explicit policies
CREATE POLICY invite_codes_admin_select ON public.invite_codes
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (SELECT auth.uid())
              AND p.role IN ('admin', 'moderator')
        )
    );

CREATE POLICY invite_codes_admin_insert ON public.invite_codes
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (SELECT auth.uid())
              AND p.role IN ('admin', 'moderator')
        )
    );

-- Table for tracking which user redeemed which code
CREATE TABLE IF NOT EXISTS public.invite_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invite_code_id UUID NOT NULL REFERENCES public.invite_codes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_invite_code_redemption UNIQUE (invite_code_id, user_id)
);

-- Enable RLS
ALTER TABLE public.invite_redemptions ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invite_redemptions_user ON public.invite_redemptions (user_id);
CREATE INDEX IF NOT EXISTS idx_invite_redemptions_code ON public.invite_redemptions (invite_code_id);

-- Explicit policies for invite_redemptions
CREATE POLICY invite_redemptions_select_own ON public.invite_redemptions
    FOR SELECT TO authenticated
    USING (
        user_id = (SELECT auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (SELECT auth.uid())
              AND p.role IN ('admin', 'moderator')
        )
    );

-- RPC for validating invite code before signup (publicly callable, returns boolean valid/invalid)
CREATE OR REPLACE FUNCTION public.check_invite_code(p_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_code TEXT := upper(trim(p_code));
    v_valid BOOLEAN := false;
BEGIN
    SELECT true INTO v_valid
    FROM public.invite_codes
    WHERE code = v_code
      AND uses_count < max_uses
      AND (expires_at IS NULL OR expires_at > now());

    RETURN COALESCE(v_valid, false);
END;
$$;

-- RPC for redeeming invite code upon account creation / onboarding
CREATE OR REPLACE FUNCTION public.redeem_invite_code(p_code TEXT, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_code TEXT := upper(trim(p_code));
    v_invite_id UUID;
    v_max_uses INTEGER;
    v_uses_count INTEGER;
    v_expires_at TIMESTAMPTZ;
BEGIN
    -- Lock code record for update to prevent concurrent race condition
    SELECT id, max_uses, uses_count, expires_at
    INTO v_invite_id, v_max_uses, v_uses_count, v_expires_at
    FROM public.invite_codes
    WHERE code = v_code
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid beta invite code';
    END IF;

    IF v_expires_at IS NOT NULL AND v_expires_at <= now() THEN
        RAISE EXCEPTION 'This invite code has expired';
    END IF;

    IF v_uses_count >= v_max_uses THEN
        RAISE EXCEPTION 'This invite code has already reached its maximum usage limit';
    END IF;

    -- Check if user already redeemed any code
    IF EXISTS (SELECT 1 FROM public.invite_redemptions WHERE user_id = p_user_id) THEN
        RETURN true; -- Already registered under an invite code
    END IF;

    -- Increment usage
    UPDATE public.invite_codes
    SET uses_count = uses_count + 1
    WHERE id = v_invite_id;

    -- Insert redemption record
    INSERT INTO public.invite_redemptions (invite_code_id, user_id)
    VALUES (v_invite_id, p_user_id);

    RETURN true;
END;
$$;

-- Seed default initial closed-beta invite codes
INSERT INTO public.invite_codes (code, max_uses)
VALUES 
    ('HYDERABAD-BETA-2026', 100),
    ('MORS-FOUNDER-BETA', 50),
    ('TASTE-ARCHIVE-HYD', 50)
ON CONFLICT (code) DO NOTHING;
