-- Migration: Phase 19 Social Upgrades
-- Mentions, creator profiles (pinned collections/experiences), muted words, comment moderation, grouped notifications

-- 1. Extend notification_t enum to include 'mention'
ALTER TYPE public.notification_t ADD VALUE IF NOT EXISTS 'mention';

-- 2. Add creator profile pins and muted words to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pinned_collection_ids UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS featured_experience_ids UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS muted_words TEXT[] DEFAULT '{}';

-- 3. Add soft-hide to comments for entry owner moderation
ALTER TABLE public.experience_comments
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT FALSE;

-- Update experience_comments select policy to respect soft-hide
DROP POLICY IF EXISTS experience_comments_select ON public.experience_comments;

CREATE POLICY experience_comments_select ON public.experience_comments
  FOR SELECT
  USING (
    -- Viewer must be able to view the underlying experience
    EXISTS (
      SELECT 1 FROM public.food_experiences fe
      WHERE fe.id = experience_comments.experience_id
        AND (
          fe.user_id = (SELECT auth.uid())
          OR (
            fe.status = 'published'
            AND fe.visibility = 'public'
            AND EXISTS (
              SELECT 1 FROM public.profiles p
              WHERE p.id = fe.user_id
                AND p.is_private = false
                AND p.deletion_pending_at IS NULL
            )
          )
        )
    )
    -- And either comment is not hidden, or viewer is author or entry owner
    AND (
      is_hidden = false
      OR user_id = (SELECT auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.food_experiences fe
        WHERE fe.id = experience_comments.experience_id
          AND fe.user_id = (SELECT auth.uid())
      )
    )
  );

-- 4. RPC for grouped notifications at read-time
CREATE OR REPLACE FUNCTION public.get_grouped_notifications(p_user_id UUID)
RETURNS TABLE (
  group_key TEXT,
  notification_type public.notification_t,
  target_id UUID,
  latest_created_at TIMESTAMPTZ,
  total_actors BIGINT,
  actors JSONB,
  sample_message TEXT,
  is_read BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Strict owner check
  IF (SELECT auth.uid()) IS NULL OR (SELECT auth.uid()) != p_user_id THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH grouped AS (
    SELECT 
      CONCAT(n.type::text, ':', COALESCE(n.entity_id::text, 'none'), ':', date_trunc('day', n.created_at)::date::text) AS g_key,
      n.type AS g_type,
      n.entity_id AS g_entity_id,
      MAX(n.created_at) AS max_time,
      COUNT(DISTINCT n.actor_id) AS actor_count,
      jsonb_agg(
        DISTINCT jsonb_build_object(
          'id', p.id,
          'username', p.username,
          'displayName', p.display_name,
          'avatarPath', p.avatar_path
        )
      ) AS actor_list,
      BOOL_AND(n.is_read) AS all_read
    FROM public.notifications n
    LEFT JOIN public.profiles p ON p.id = n.actor_id
    WHERE n.user_id = p_user_id
    GROUP BY g_key, g_type, g_entity_id
  )
  SELECT 
    g_key AS group_key,
    g_type AS notification_type,
    g_entity_id AS target_id,
    max_time AS latest_created_at,
    actor_count AS total_actors,
    actor_list AS actors,
    CASE 
      WHEN g_type = 'like' THEN 'liked your experience'
      WHEN g_type = 'comment' THEN 'commented on your experience'
      WHEN g_type = 'mention' THEN 'mentioned you in a comment'
      WHEN g_type = 'follow' THEN 'started following you'
      WHEN g_type = 'collection_like' THEN 'liked your collection'
      ELSE 'interacted with your profile'
    END AS sample_message,
    all_read AS is_read
  FROM grouped
  ORDER BY max_time DESC
  LIMIT 50;
END;
$$;
