-- ==============================================================================
-- MORS Database Migration: 20261110000006_social_and_home_feed.sql
-- Phase 7: Social Graph, Follow Requests, Blocking, and Chronological Home Feed
-- ==============================================================================

-- 1. GET_HOME_FEED RPC (Strictly chronological, keyset paginated)
CREATE OR REPLACE FUNCTION public.get_home_feed(
  p_cursor_published_at timestamptz DEFAULT NULL,
  p_cursor_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 15
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  title text,
  category_slug text,
  eaten_at timestamptz,
  published_at timestamptz,
  visibility public.visibility_t,
  overall_rating smallint,
  description text,
  place_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_viewer_id uuid;
BEGIN
  v_viewer_id := (SELECT auth.uid());

  RETURN QUERY
  SELECT
    fe.id,
    fe.user_id,
    fe.title,
    fe.category_slug,
    fe.eaten_at,
    fe.published_at,
    fe.visibility,
    fe.overall_rating,
    fe.description,
    fe.place_id
  FROM public.food_experiences fe
  WHERE fe.status = 'published'
    AND fe.published_at IS NOT NULL
    AND public.can_view_experience(v_viewer_id, fe.id)
    AND (
      -- If viewer is authenticated: own posts OR posts of accepted followed users
      (v_viewer_id IS NOT NULL AND (
        fe.user_id = v_viewer_id
        OR EXISTS (
          SELECT 1 FROM public.follows f
          WHERE f.follower_id = v_viewer_id
            AND f.following_id = fe.user_id
            AND f.status = 'accepted'
        )
      ))
      OR
      -- If unauthenticated or no follows: public posts from public profiles
      (v_viewer_id IS NULL AND fe.visibility = 'public' AND NOT EXISTS (
        SELECT 1 FROM public.profiles p WHERE p.id = fe.user_id AND p.is_private
      ))
    )
    -- Keyset pagination on (published_at DESC, id DESC)
    AND (
      p_cursor_published_at IS NULL
      OR (fe.published_at < p_cursor_published_at)
      OR (fe.published_at = p_cursor_published_at AND fe.id < p_cursor_id)
    )
  ORDER BY fe.published_at DESC, fe.id DESC
  LIMIT p_limit;
END;
$$;

-- 2. FOLLOW_USER RPC
CREATE OR REPLACE FUNCTION public.follow_user(p_target_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_viewer_id uuid;
  v_is_target_private boolean;
  v_status public.follow_status_t;
BEGIN
  v_viewer_id := (SELECT auth.uid());
  IF v_viewer_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF v_viewer_id = p_target_id THEN
    RAISE EXCEPTION 'You cannot follow yourself';
  END IF;

  IF public.is_blocked_between(v_viewer_id, p_target_id) THEN
    RAISE EXCEPTION 'Action blocked';
  END IF;

  SELECT is_private INTO v_is_target_private
  FROM public.profiles
  WHERE id = p_target_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  v_status := CASE WHEN v_is_target_private THEN 'pending'::public.follow_status_t ELSE 'accepted'::public.follow_status_t END;

  INSERT INTO public.follows (follower_id, following_id, status)
  VALUES (v_viewer_id, p_target_id, v_status)
  ON CONFLICT (follower_id, following_id) DO UPDATE
  SET status = EXCLUDED.status;

  -- Update counters if accepted
  IF v_status = 'accepted' THEN
    UPDATE public.profiles SET following_count = following_count + 1 WHERE id = v_viewer_id;
    UPDATE public.profiles SET followers_count = followers_count + 1 WHERE id = p_target_id;
  END IF;

  RETURN v_status::text;
END;
$$;

-- 3. UNFOLLOW_USER RPC
CREATE OR REPLACE FUNCTION public.unfollow_user(p_target_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_viewer_id uuid;
  v_old_status public.follow_status_t;
BEGIN
  v_viewer_id := (SELECT auth.uid());
  IF v_viewer_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT status INTO v_old_status
  FROM public.follows
  WHERE follower_id = v_viewer_id AND following_id = p_target_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  DELETE FROM public.follows
  WHERE follower_id = v_viewer_id AND following_id = p_target_id;

  IF v_old_status = 'accepted' THEN
    UPDATE public.profiles SET following_count = greatest(0, following_count - 1) WHERE id = v_viewer_id;
    UPDATE public.profiles SET followers_count = greatest(0, followers_count - 1) WHERE id = p_target_id;
  END IF;

  RETURN true;
END;
$$;

-- 4. RESPOND_FOLLOW_REQUEST RPC
CREATE OR REPLACE FUNCTION public.respond_follow_request(
  p_follower_id uuid,
  p_accept boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_viewer_id uuid;
BEGIN
  v_viewer_id := (SELECT auth.uid());
  IF v_viewer_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_accept THEN
    UPDATE public.follows
    SET status = 'accepted'
    WHERE follower_id = p_follower_id AND following_id = v_viewer_id AND status = 'pending';

    IF FOUND THEN
      UPDATE public.profiles SET following_count = following_count + 1 WHERE id = p_follower_id;
      UPDATE public.profiles SET followers_count = followers_count + 1 WHERE id = v_viewer_id;
    END IF;
  ELSE
    DELETE FROM public.follows
    WHERE follower_id = p_follower_id AND following_id = v_viewer_id AND status = 'pending';
  END IF;

  RETURN true;
END;
$$;

-- 5. BLOCK_USER RPC
CREATE OR REPLACE FUNCTION public.block_user(p_target_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_viewer_id uuid;
BEGIN
  v_viewer_id := (SELECT auth.uid());
  IF v_viewer_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF v_viewer_id = p_target_id THEN
    RAISE EXCEPTION 'You cannot block yourself';
  END IF;

  -- Insert block (triggers automatic removal of follows in both directions)
  INSERT INTO public.blocks (blocker_id, blocked_id)
  VALUES (v_viewer_id, p_target_id)
  ON CONFLICT DO NOTHING;

  RETURN true;
END;
$$;

-- 6. UNBLOCK_USER RPC
CREATE OR REPLACE FUNCTION public.unblock_user(p_target_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_viewer_id uuid;
BEGIN
  v_viewer_id := (SELECT auth.uid());
  IF v_viewer_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  DELETE FROM public.blocks
  WHERE blocker_id = v_viewer_id AND blocked_id = p_target_id;

  RETURN true;
END;
$$;

-- 7. GET_SUGGESTED_PROFILES (Cold start recommendations)
CREATE OR REPLACE FUNCTION public.get_suggested_profiles(p_limit integer DEFAULT 5)
RETURNS TABLE (
  id uuid,
  username text,
  display_name text,
  avatar_path text,
  bio text,
  experiences_count integer,
  followers_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_viewer_id uuid;
BEGIN
  v_viewer_id := (SELECT auth.uid());

  RETURN QUERY
  SELECT
    p.id,
    p.username,
    p.display_name,
    p.avatar_path,
    p.bio,
    p.experiences_count,
    p.followers_count
  FROM public.profiles p
  WHERE NOT p.is_private
    AND (v_viewer_id IS NULL OR (
      p.id <> v_viewer_id
      AND NOT public.is_blocked_between(v_viewer_id, p.id)
      AND NOT EXISTS (
        SELECT 1 FROM public.follows f
        WHERE f.follower_id = v_viewer_id AND f.following_id = p.id
      )
    ))
  ORDER BY p.experiences_count DESC, p.followers_count DESC
  LIMIT p_limit;
END;
$$;
