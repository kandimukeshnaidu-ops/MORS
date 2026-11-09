-- MORS Database Migration: Mobile Push Notification Tokens (Phase 13)
-- Migration: 20261110000011_mobile_push.sql

CREATE TABLE public.push_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    token text NOT NULL,
    platform text NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_device_token UNIQUE (user_id, token)
);

CREATE INDEX idx_push_tokens_user_id ON public.push_tokens (user_id);

-- Enable RLS
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Explicit RLS Policies
CREATE POLICY "push_tokens_select_policy"
ON public.push_tokens
FOR SELECT
USING (
    user_id = (SELECT auth.uid())
);

CREATE POLICY "push_tokens_insert_policy"
ON public.push_tokens
FOR INSERT
WITH CHECK (
    user_id = (SELECT auth.uid())
);

CREATE POLICY "push_tokens_update_policy"
ON public.push_tokens
FOR UPDATE
USING (
    user_id = (SELECT auth.uid())
)
WITH CHECK (
    user_id = (SELECT auth.uid())
);

CREATE POLICY "push_tokens_delete_policy"
ON public.push_tokens
FOR DELETE
USING (
    user_id = (SELECT auth.uid())
);

-- RPC for mobile client push token registration
CREATE OR REPLACE FUNCTION public.register_push_token(
    p_token text,
    p_platform text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    curr_user uuid;
BEGIN
    curr_user := auth.uid();
    IF curr_user IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    INSERT INTO public.push_tokens (user_id, token, platform, updated_at)
    VALUES (curr_user, trim(p_token), p_platform, now())
    ON CONFLICT (user_id, token)
    DO UPDATE SET platform = EXCLUDED.platform, updated_at = now();

    RETURN true;
END;
$$;
