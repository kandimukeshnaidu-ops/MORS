-- Migration: Phase 21 Growth & Opt-in SEO
-- Adds allow_indexing flag to profiles and functions for indexable public URLs and personal referral generation

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS allow_indexing BOOLEAN NOT NULL DEFAULT FALSE;

-- RPC to retrieve indexable profiles for dynamic sitemap generation
CREATE OR REPLACE FUNCTION public.get_indexable_public_profiles()
RETURNS TABLE (
  username TEXT,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.username,
    p.created_at AS updated_at
  FROM public.profiles p
  WHERE p.is_private = false
    AND p.allow_indexing = true
    AND p.deletion_pending_at IS NULL
    AND p.discoverable = true;
END;
$$;

-- RPC to generate personal invite referral code (max 10 redemptions)
CREATE OR REPLACE FUNCTION public.create_personal_referral_code(p_custom_suffix TEXT DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := (SELECT auth.uid());
  v_username TEXT;
  v_code TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT username INTO v_username FROM public.profiles WHERE id = v_user_id;

  v_code := UPPER(CONCAT(COALESCE(p_custom_suffix, v_username), '-', SUBSTRING(gen_random_uuid()::text FROM 1 FOR 4)));

  INSERT INTO public.invite_codes (code, created_by, max_uses, uses_count, expires_at)
  VALUES (v_code, v_user_id, 10, 0, now() + INTERVAL '90 days')
  ON CONFLICT (code) DO NOTHING;

  RETURN v_code;
END;
$$;
