-- ==============================================================================
-- MORS Database Migration: 20261110000007_engagement_notifications.sql
-- Phase 8: Engagement (Likes, Comments), In-App Notifications, and Content Reporting
-- ==============================================================================

-- 1. EXPERIENCE_LIKES TABLE
CREATE TABLE public.experience_likes (
  experience_id uuid NOT NULL REFERENCES public.food_experiences(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (experience_id, user_id)
);

ALTER TABLE public.experience_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes viewable if experience is viewable"
  ON public.experience_likes FOR SELECT
  USING (public.can_view_experience((SELECT auth.uid()), experience_id));

CREATE POLICY "Authenticated users can like viewable experiences"
  ON public.experience_likes FOR INSERT
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND public.can_view_experience((SELECT auth.uid()), experience_id)
  );

CREATE POLICY "Users can remove own likes"
  ON public.experience_likes FOR DELETE
  USING (user_id = (SELECT auth.uid()));

CREATE INDEX idx_exp_likes_exp_id ON public.experience_likes (experience_id);
CREATE INDEX idx_exp_likes_user_id ON public.experience_likes (user_id);


-- 2. EXPERIENCE_COMMENTS TABLE
CREATE TABLE public.experience_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id uuid NOT NULL REFERENCES public.food_experiences(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (length(trim(body)) > 0 AND length(body) <= 1000),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.experience_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments viewable if experience is viewable and not blocked"
  ON public.experience_comments FOR SELECT
  USING (
    public.can_view_experience((SELECT auth.uid()), experience_id)
    AND NOT public.is_blocked_between((SELECT auth.uid()), user_id)
  );

CREATE POLICY "Users can comment on viewable experiences"
  ON public.experience_comments FOR INSERT
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND public.can_view_experience((SELECT auth.uid()), experience_id)
  );

CREATE POLICY "Users can update own comments"
  ON public.experience_comments FOR UPDATE
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users or experience authors can delete comments"
  ON public.experience_comments FOR DELETE
  USING (
    user_id = (SELECT auth.uid())
    OR (SELECT fe.user_id FROM public.food_experiences fe WHERE fe.id = experience_id) = (SELECT auth.uid())
  );

CREATE INDEX idx_exp_comments_exp_id ON public.experience_comments (experience_id, created_at ASC);
CREATE INDEX idx_exp_comments_user_id ON public.experience_comments (user_id);


-- 3. NOTIFICATIONS TABLE
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type public.notification_t NOT NULL,
  experience_id uuid REFERENCES public.food_experiences(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES public.experience_comments(id) ON DELETE CASCADE,
  is_read boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Notifications strictly viewable by recipient"
  ON public.notifications FOR SELECT
  USING (recipient_id = (SELECT auth.uid()));

CREATE POLICY "Notifications insertable by authenticated actors"
  ON public.notifications FOR INSERT
  WITH CHECK (
    actor_id = (SELECT auth.uid())
    AND recipient_id <> (SELECT auth.uid())
  );

CREATE POLICY "Recipients can update read status"
  ON public.notifications FOR UPDATE
  USING (recipient_id = (SELECT auth.uid()))
  WITH CHECK (recipient_id = (SELECT auth.uid()));

CREATE POLICY "Recipients can delete own notifications"
  ON public.notifications FOR DELETE
  USING (recipient_id = (SELECT auth.uid()));

CREATE INDEX idx_notifications_recipient ON public.notifications (recipient_id, is_read, created_at DESC);


-- 4. REPORTS TABLE
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type public.report_target_t NOT NULL,
  target_id uuid NOT NULL,
  reason text NOT NULL CHECK (length(trim(reason)) > 0),
  details text,
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'reviewed', 'actioned')),
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can file reports"
  ON public.reports FOR INSERT
  WITH CHECK (reporter_id = (SELECT auth.uid()));

CREATE POLICY "Users can view own filed reports or moderators"
  ON public.reports FOR SELECT
  USING (
    reporter_id = (SELECT auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('moderator', 'admin')
  );

CREATE INDEX idx_reports_lookup ON public.reports (target_type, target_id);
CREATE INDEX idx_reports_reporter ON public.reports (reporter_id);


-- 5. ATOMIC HELPER RPCS

-- TOGGLE_EXPERIENCE_LIKE
CREATE OR REPLACE FUNCTION public.toggle_experience_like(p_experience_id uuid)
RETURNS TABLE (liked boolean, total_likes bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_exp_author uuid;
  v_already_liked boolean;
  v_count bigint;
BEGIN
  v_user_id := (SELECT auth.uid());
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT public.can_view_experience(v_user_id, p_experience_id) THEN
    RAISE EXCEPTION 'You do not have permission to view this experience';
  END IF;

  SELECT user_id INTO v_exp_author
  FROM public.food_experiences
  WHERE id = p_experience_id;

  SELECT EXISTS (
    SELECT 1 FROM public.experience_likes
    WHERE experience_id = p_experience_id AND user_id = v_user_id
  ) INTO v_already_liked;

  IF v_already_liked THEN
    DELETE FROM public.experience_likes
    WHERE experience_id = p_experience_id AND user_id = v_user_id;

    -- Remove notification if unread
    DELETE FROM public.notifications
    WHERE recipient_id = v_exp_author AND actor_id = v_user_id AND experience_id = p_experience_id AND type = 'like';

    SELECT count(*) INTO v_count FROM public.experience_likes WHERE experience_id = p_experience_id;
    RETURN QUERY SELECT false AS liked, v_count AS total_likes;
  ELSE
    INSERT INTO public.experience_likes (experience_id, user_id)
    VALUES (p_experience_id, v_user_id);

    -- Notify author if not self
    IF v_exp_author <> v_user_id THEN
      INSERT INTO public.notifications (recipient_id, actor_id, type, experience_id)
      VALUES (v_exp_author, v_user_id, 'like', p_experience_id);
    END IF;

    SELECT count(*) INTO v_count FROM public.experience_likes WHERE experience_id = p_experience_id;
    RETURN QUERY SELECT true AS liked, v_count AS total_likes;
  END IF;
END;
$$;

-- ADD_EXPERIENCE_COMMENT
CREATE OR REPLACE FUNCTION public.add_experience_comment(
  p_experience_id uuid,
  p_body text
)
RETURNS TABLE (
  comment_id uuid,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_exp_author uuid;
  v_new_id uuid;
  v_created_at timestamptz;
BEGIN
  v_user_id := (SELECT auth.uid());
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT public.can_view_experience(v_user_id, p_experience_id) THEN
    RAISE EXCEPTION 'You do not have permission to comment on this experience';
  END IF;

  SELECT user_id INTO v_exp_author
  FROM public.food_experiences
  WHERE id = p_experience_id;

  INSERT INTO public.experience_comments (experience_id, user_id, body)
  VALUES (p_experience_id, v_user_id, trim(p_body))
  RETURNING id, experience_comments.created_at INTO v_new_id, v_created_at;

  -- Notify author if not self
  IF v_exp_author <> v_user_id THEN
    INSERT INTO public.notifications (recipient_id, actor_id, type, experience_id, comment_id)
    VALUES (v_exp_author, v_user_id, 'comment', p_experience_id, v_new_id);
  END IF;

  RETURN QUERY SELECT v_new_id, v_created_at;
END;
$$;

-- MARK_NOTIFICATIONS_READ
CREATE OR REPLACE FUNCTION public.mark_notifications_read(p_ids uuid[] DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := (SELECT auth.uid());
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_ids IS NULL OR array_length(p_ids, 1) = 0 THEN
    UPDATE public.notifications
    SET is_read = true
    WHERE recipient_id = v_user_id AND NOT is_read;
  ELSE
    UPDATE public.notifications
    SET is_read = true
    WHERE recipient_id = v_user_id AND id = ANY(p_ids);
  END IF;

  RETURN true;
END;
$$;
