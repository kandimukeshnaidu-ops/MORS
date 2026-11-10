-- Migration: Phase 24 Scale, Cost, and Storage Quotas
-- Storage quotas tracking, covering indexes on high-throughput feed/notification paths, and usage RPC

-- 1. Storage Quotas Table
CREATE TABLE IF NOT EXISTS public.storage_quotas (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  quota_bytes BIGINT NOT NULL DEFAULT 2147483648, -- 2 GB default quota
  used_bytes BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.storage_quotas ENABLE ROW LEVEL SECURITY;

-- Explicit RLS Policies: Owner can read their quota
CREATE POLICY storage_quotas_select ON public.storage_quotas
  FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

CREATE POLICY storage_quotas_admin ON public.storage_quotas
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

-- 2. Covering Indexes for High-Throughput Public Feed and Query Paths
CREATE INDEX IF NOT EXISTS idx_food_experiences_public_feed
  ON public.food_experiences(status, visibility, eaten_at DESC)
  INCLUDE (id, user_id, place_id, rating);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications(user_id, is_read, created_at DESC);

-- 3. Storage Usage RPC
CREATE OR REPLACE FUNCTION public.get_user_storage_usage(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_viewer UUID := (SELECT auth.uid());
  v_quota BIGINT := 2147483648; -- 2 GB
  v_used BIGINT := 0;
  v_percent NUMERIC := 0.0;
BEGIN
  -- Strict owner or admin check
  IF v_viewer IS NULL OR (v_viewer != p_user_id AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = v_viewer AND is_admin = true
  )) THEN
    RETURN NULL;
  END IF;

  SELECT quota_bytes, used_bytes
  INTO v_quota, v_used
  FROM public.storage_quotas
  WHERE user_id = p_user_id;

  IF v_quota IS NULL THEN
    v_quota := 2147483648;
    v_used := 0;
  END IF;

  IF v_quota > 0 THEN
    v_percent := ROUND((v_used::numeric / v_quota::numeric) * 100, 1);
  END IF;

  RETURN jsonb_build_object(
    'user_id', p_user_id,
    'quota_bytes', v_quota,
    'used_bytes', v_used,
    'percentage', v_percent,
    'is_near_quota', (v_percent >= 85.0)
  );
END;
$$;
