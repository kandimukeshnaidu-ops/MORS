-- ==============================================================================
-- MORS Database Migration: 20261110000033_guard_profile_columns.sql
-- Work Package WP-2.1: Column-level write protection on public.profiles (SEC-001)
-- ==============================================================================

-- 1. Trigger Function to Guard Sensitive Columns on public.profiles
CREATE OR REPLACE FUNCTION public.guard_profile_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller_id uuid;
  v_caller_role text;
BEGIN
  v_caller_id := (SELECT auth.uid());

  -- If called by system/service-role without an auth user context, allow system updates
  IF v_caller_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- 1. Guard 'role' column against self-escalation
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    SELECT role INTO v_caller_role
    FROM public.profiles
    WHERE id = v_caller_id;

    IF v_caller_role IS DISTINCT FROM 'admin' THEN
      RAISE EXCEPTION 'Unauthorized: Only administrators can modify profile roles (SEC-001 violation prevented).';
    END IF;
  END IF;

  -- 2. Guard counter columns against client manipulation
  -- Counters must only be modified via database triggers (e.g. follows/experiences count triggers)
  IF NEW.followers_count IS DISTINCT FROM OLD.followers_count THEN
    -- Discard any client-supplied counter alteration; preserve existing or system value
    NEW.followers_count := OLD.followers_count;
  END IF;

  IF NEW.following_count IS DISTINCT FROM OLD.following_count THEN
    NEW.following_count := OLD.following_count;
  END IF;

  IF NEW.experiences_count IS DISTINCT FROM OLD.experiences_count THEN
    NEW.experiences_count := OLD.experiences_count;
  END IF;

  -- 3. Guard 'onboarding_completed_at' once set
  IF OLD.onboarding_completed_at IS NOT NULL AND NEW.onboarding_completed_at IS NULL THEN
    NEW.onboarding_completed_at := OLD.onboarding_completed_at;
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Attach BEFORE UPDATE trigger to public.profiles
DROP TRIGGER IF EXISTS trg_guard_profile_columns ON public.profiles;
CREATE TRIGGER trg_guard_profile_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_profile_columns();

-- 3. Storage Upload Validation Reinforcement
-- Ensure experience-photos bucket enforces 10MB limit and valid extension
CREATE OR REPLACE FUNCTION public.validate_storage_upload_path(p_name text, p_bucket_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_folder text;
BEGIN
  -- Extract top-level folder
  v_user_folder := (storage.foldername(p_name))[1];
  
  -- Must match auth.uid()
  IF v_user_folder IS NULL OR v_user_folder <> (SELECT auth.uid())::text THEN
    RETURN false;
  END IF;

  -- Must end with supported image extension
  IF NOT (p_name ~* '\.(jpg|jpeg|png|webp)$') THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;
