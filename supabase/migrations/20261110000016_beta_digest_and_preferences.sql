-- Migration: 20261110000016_beta_digest_and_preferences.sql
-- Description: Phase 14B Weekly digest data compilation RPC, send tracking idempotency, and opt-in preferences

-- 1. Add digest preferences to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS weekly_digest_opt_in BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS memory_digest_opt_in BOOLEAN NOT NULL DEFAULT true;

-- 2. Digest sends tracking table for idempotency
CREATE TABLE IF NOT EXISTS public.digest_sends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    digest_type TEXT NOT NULL, -- 'weekly_digest', 'on_this_day'
    period_key TEXT NOT NULL,  -- '2026-W45', '2026-11-10'
    sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_digest_send UNIQUE (user_id, digest_type, period_key)
);

-- Enable RLS
ALTER TABLE public.digest_sends ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_digest_sends_user ON public.digest_sends (user_id);
CREATE INDEX IF NOT EXISTS idx_digest_sends_period ON public.digest_sends (period_key);

-- Explicit policies
CREATE POLICY digest_sends_select_own ON public.digest_sends
    FOR SELECT TO authenticated
    USING (
        user_id = (SELECT auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (SELECT auth.uid())
              AND p.role IN ('admin', 'moderator')
        )
    );

CREATE POLICY digest_sends_admin_insert ON public.digest_sends
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = (SELECT auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (SELECT auth.uid())
              AND p.role IN ('admin', 'moderator')
        )
    );

-- 3. Security definer RPC to safely compile a user's week in food without privacy leakage
CREATE OR REPLACE FUNCTION public.get_digest_data(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_week_count INTEGER := 0;
    v_top_dish JSON := null;
    v_highlight JSON := null;
    v_following_highlights JSON := '[]'::json;
    v_result JSON;
BEGIN
    -- Check opt-in preference
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = p_user_id AND weekly_digest_opt_in = true
    ) THEN
        RETURN null;
    END IF;

    -- Count user's meals logged in the last 7 days
    SELECT count(*)
    INTO v_week_count
    FROM public.food_experiences
    WHERE user_id = p_user_id
      AND eaten_at >= (now() - interval '7 days');

    -- Find top-rated dish logged by user this week
    SELECT json_build_object(
        'dish_name', ed.display_name,
        'rating', ed.rating,
        'eaten_at', fe.eaten_at,
        'experience_id', fe.id
    )
    INTO v_top_dish
    FROM public.experience_dishes ed
    JOIN public.food_experiences fe ON fe.id = ed.experience_id
    WHERE fe.user_id = p_user_id
      AND fe.eaten_at >= (now() - interval '7 days')
      AND ed.rating IS NOT NULL
    ORDER BY ed.rating DESC, fe.eaten_at DESC
    LIMIT 1;

    -- Surfacing a past diary highlight (from > 30 days ago)
    SELECT json_build_object(
        'title', fe.title,
        'eaten_at', fe.eaten_at,
        'rating', fe.overall_rating,
        'id', fe.id
    )
    INTO v_highlight
    FROM public.food_experiences fe
    WHERE fe.user_id = p_user_id
      AND fe.eaten_at <= (now() - interval '30 days')
      AND fe.overall_rating >= 8
    ORDER BY random()
    LIMIT 1;

    -- Up to 3 entries from followed cooks published in the last 7 days that the user is authorized to see
    SELECT COALESCE(
        json_agg(
            json_build_object(
                'id', sub.id,
                'title', sub.title,
                'author_username', sub.author_username,
                'author_display_name', sub.author_display_name,
                'author_avatar_path', sub.author_avatar_path,
                'rating', sub.overall_rating,
                'published_at', sub.published_at
            )
        ),
        '[]'::json
    )
    INTO v_following_highlights
    FROM (
        SELECT 
            fe.id,
            fe.title,
            fe.overall_rating,
            fe.published_at,
            p.username AS author_username,
            p.display_name AS author_display_name,
            p.avatar_path AS author_avatar_path
        FROM public.follows f
        JOIN public.food_experiences fe ON fe.user_id = f.following_id
        JOIN public.profiles p ON p.id = fe.user_id
        WHERE f.follower_id = p_user_id
          AND f.status = 'accepted'
          AND fe.status = 'published'
          AND fe.published_at >= (now() - interval '7 days')
          AND public.can_view_experience(p_user_id, fe.id)
        ORDER BY fe.published_at DESC
        LIMIT 3
    ) sub;

    v_result := json_build_object(
        'user_id', p_user_id,
        'week_experiences_count', v_week_count,
        'top_dish', v_top_dish,
        'diary_highlight', v_highlight,
        'following_highlights', v_following_highlights,
        'generated_at', now()
    );

    RETURN v_result;
END;
$$;
