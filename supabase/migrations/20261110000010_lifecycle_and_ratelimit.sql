-- MORS Database Migration: Account Lifecycle & Rate Limiting (Phase 11)
-- Migration: 20261110000010_lifecycle_and_ratelimit.sql

-- 1. Rate Limit Buckets Table
CREATE TABLE public.rate_limit_buckets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bucket_key text NOT NULL,
    window_start timestamptz NOT NULL DEFAULT now(),
    request_count integer NOT NULL DEFAULT 1,
    CONSTRAINT uq_rate_limit_bucket UNIQUE (bucket_key, window_start)
);

CREATE INDEX idx_rate_limit_lookup ON public.rate_limit_buckets (bucket_key, window_start DESC);

-- Enable RLS on rate_limit_buckets
ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;

-- Explicit RLS Policies for rate_limit_buckets
-- Only server-side RPCs or authenticated owners can access rate limiting buckets
CREATE POLICY "rate_limit_buckets_select_policy"
ON public.rate_limit_buckets
FOR SELECT
USING (
    bucket_key LIKE 'user:' || (SELECT auth.uid())::text || ':%'
);

CREATE POLICY "rate_limit_buckets_insert_policy"
ON public.rate_limit_buckets
FOR INSERT
WITH CHECK (
    bucket_key LIKE 'user:' || (SELECT auth.uid())::text || ':%'
);

CREATE POLICY "rate_limit_buckets_update_policy"
ON public.rate_limit_buckets
FOR UPDATE
USING (
    bucket_key LIKE 'user:' || (SELECT auth.uid())::text || ':%'
)
WITH CHECK (
    bucket_key LIKE 'user:' || (SELECT auth.uid())::text || ':%'
);

CREATE POLICY "rate_limit_buckets_delete_policy"
ON public.rate_limit_buckets
FOR DELETE
USING (
    bucket_key LIKE 'user:' || (SELECT auth.uid())::text || ':%'
);

-- 2. Sliding Window Rate Limiter Function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_key text,
    p_max_requests integer,
    p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    curr_time timestamptz := now();
    window_bound timestamptz := curr_time - (p_window_seconds || ' seconds')::interval;
    total_count integer;
BEGIN
    -- Prune expired buckets older than 1 hour to keep table lightweight
    DELETE FROM public.rate_limit_buckets
    WHERE window_start < (curr_time - interval '1 hour');

    -- Sum requests in the active window
    SELECT COALESCE(SUM(request_count), 0) INTO total_count
    FROM public.rate_limit_buckets
    WHERE bucket_key = p_key AND window_start >= window_bound;

    IF total_count >= p_max_requests THEN
        RETURN false; -- Rate limit exceeded
    END IF;

    -- Increment or insert bucket for current second
    INSERT INTO public.rate_limit_buckets (bucket_key, window_start, request_count)
    VALUES (p_key, date_trunc('second', curr_time), 1)
    ON CONFLICT (bucket_key, window_start)
    DO UPDATE SET request_count = public.rate_limit_buckets.request_count + 1;

    RETURN true;
END;
$$;

-- 3. Account Deletion: Request Deletion (Grace Period)
CREATE OR REPLACE FUNCTION public.request_account_deletion()
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    curr_user uuid;
    req_at timestamptz;
BEGIN
    curr_user := auth.uid();
    IF curr_user IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    req_at := now();

    UPDATE public.profiles
    SET deletion_requested_at = req_at
    WHERE id = curr_user;

    RETURN req_at;
END;
$$;

-- 4. Account Deletion: Cancel Deletion
CREATE OR REPLACE FUNCTION public.cancel_account_deletion()
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

    UPDATE public.profiles
    SET deletion_requested_at = NULL
    WHERE id = curr_user;

    RETURN true;
END;
$$;

-- 5. Account Deletion: Hard Delete (Immediate cascading erase)
CREATE OR REPLACE FUNCTION public.execute_account_hard_delete(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    caller_uuid uuid;
BEGIN
    caller_uuid := auth.uid();
    -- Allow user to delete self, or allow service role
    IF caller_uuid IS NOT NULL AND caller_uuid <> target_user_id THEN
        RAISE EXCEPTION 'Unauthorized account deletion';
    END IF;

    -- Cascading removal across all MORS tables
    DELETE FROM public.experience_likes WHERE user_id = target_user_id;
    DELETE FROM public.experience_comments WHERE user_id = target_user_id;
    DELETE FROM public.collection_likes WHERE user_id = target_user_id;
    DELETE FROM public.collection_items WHERE collection_id IN (
        SELECT id FROM public.collections WHERE user_id = target_user_id
    );
    DELETE FROM public.collections WHERE user_id = target_user_id;
    DELETE FROM public.experience_photos WHERE experience_id IN (
        SELECT id FROM public.food_experiences WHERE user_id = target_user_id
    );
    DELETE FROM public.experience_dishes WHERE experience_id IN (
        SELECT id FROM public.food_experiences WHERE user_id = target_user_id
    );
    DELETE FROM public.food_experiences WHERE user_id = target_user_id;
    DELETE FROM public.follows WHERE follower_id = target_user_id OR following_id = target_user_id;
    DELETE FROM public.blocks WHERE blocker_id = target_user_id OR blocked_id = target_user_id;
    DELETE FROM public.notifications WHERE user_id = target_user_id OR actor_id = target_user_id;
    DELETE FROM public.reports WHERE reporter_id = target_user_id;

    -- Finally remove profile row
    DELETE FROM public.profiles WHERE id = target_user_id;

    RETURN true;
END;
$$;
