-- Migration: Phase 30 Group Food Planning
-- Tables: collection_members, plans, plan_votes
-- RLS enabled on all tables; explicit policies and indexes on policy columns; RPCs for voting and draft conversion

-- 1. Collection Members (Role-based collaboration)
CREATE TABLE IF NOT EXISTS public.collection_members (
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('editor', 'viewer')),
  status TEXT NOT NULL CHECK (status IN ('invited', 'accepted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (collection_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_collection_members_user ON public.collection_members(user_id);
ALTER TABLE public.collection_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY collection_members_select ON public.collection_members
  FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.user_id = (SELECT auth.uid()))
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

CREATE POLICY collection_members_insert ON public.collection_members
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.user_id = (SELECT auth.uid()))
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

CREATE POLICY collection_members_update ON public.collection_members
  FOR UPDATE
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.user_id = (SELECT auth.uid()))
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

CREATE POLICY collection_members_delete ON public.collection_members
  FOR DELETE
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.user_id = (SELECT auth.uid()))
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

-- 2. Plans (Co-planned outings and meal decisions)
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  planned_for TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'decided', 'completed', 'cancelled')),
  decided_item_id UUID REFERENCES public.collection_items(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_plans_collection ON public.plans(collection_id);
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY plans_select ON public.plans
  FOR SELECT
  USING (
    created_by = (SELECT auth.uid())
    OR EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.user_id = (SELECT auth.uid()))
    OR EXISTS (SELECT 1 FROM public.collection_members cm WHERE cm.collection_id = plans.collection_id AND cm.user_id = (SELECT auth.uid()) AND cm.status = 'accepted')
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

CREATE POLICY plans_insert ON public.plans
  FOR INSERT
  WITH CHECK (
    created_by = (SELECT auth.uid())
    AND (
      EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.user_id = (SELECT auth.uid()))
      OR EXISTS (SELECT 1 FROM public.collection_members cm WHERE cm.collection_id = plans.collection_id AND cm.user_id = (SELECT auth.uid()) AND cm.status = 'accepted' AND cm.role = 'editor')
      OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
    )
  );

CREATE POLICY plans_update ON public.plans
  FOR UPDATE
  USING (
    created_by = (SELECT auth.uid())
    OR EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.user_id = (SELECT auth.uid()))
    OR EXISTS (SELECT 1 FROM public.collection_members cm WHERE cm.collection_id = plans.collection_id AND cm.user_id = (SELECT auth.uid()) AND cm.status = 'accepted' AND cm.role = 'editor')
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

CREATE POLICY plans_delete ON public.plans
  FOR DELETE
  USING (
    created_by = (SELECT auth.uid())
    OR EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.user_id = (SELECT auth.uid()))
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

-- 3. Plan Votes (Candidate venue/dish voting)
CREATE TABLE IF NOT EXISTS public.plan_votes (
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.collection_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vote TEXT NOT NULL CHECK (vote IN ('up', 'down')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (plan_id, item_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_plan_votes_plan ON public.plan_votes(plan_id);
ALTER TABLE public.plan_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY plan_votes_select ON public.plan_votes
  FOR SELECT
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.plans p
      JOIN public.collections c ON c.id = p.collection_id
      WHERE p.id = plan_id
        AND (c.user_id = (SELECT auth.uid()) OR EXISTS (SELECT 1 FROM public.collection_members cm WHERE cm.collection_id = c.id AND cm.user_id = (SELECT auth.uid()) AND cm.status = 'accepted'))
    )
    OR EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = (SELECT auth.uid()) AND pr.is_admin = true)
  );

CREATE POLICY plan_votes_insert ON public.plan_votes
  FOR INSERT
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.plans p
      JOIN public.collections c ON c.id = p.collection_id
      WHERE p.id = plan_id
        AND (c.user_id = (SELECT auth.uid()) OR EXISTS (SELECT 1 FROM public.collection_members cm WHERE cm.collection_id = c.id AND cm.user_id = (SELECT auth.uid()) AND cm.status = 'accepted'))
    )
  );

CREATE POLICY plan_votes_update ON public.plan_votes
  FOR UPDATE
  USING (
    user_id = (SELECT auth.uid())
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
  );

CREATE POLICY plan_votes_delete ON public.plan_votes
  FOR DELETE
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = (SELECT auth.uid()) AND pr.is_admin = true)
  );

-- RPC for casting a vote on a plan candidate item
CREATE OR REPLACE FUNCTION public.cast_plan_vote(
  p_plan_id UUID,
  p_item_id UUID,
  p_vote TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := (SELECT auth.uid());
  v_coll_id UUID;
  v_is_authorized BOOLEAN;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT p.collection_id INTO v_coll_id
  FROM public.plans p
  WHERE p.id = p_plan_id;

  IF v_coll_id IS NULL THEN
    RAISE EXCEPTION 'Plan not found';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.collections c
    WHERE c.id = v_coll_id AND c.user_id = v_user_id
    UNION ALL
    SELECT 1 FROM public.collection_members cm
    WHERE cm.collection_id = v_coll_id AND cm.user_id = v_user_id AND cm.status = 'accepted'
  ) INTO v_is_authorized;

  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'Not authorized to vote on this plan';
  END IF;

  INSERT INTO public.plan_votes (plan_id, item_id, user_id, vote)
  VALUES (p_plan_id, p_item_id, v_user_id, p_vote)
  ON CONFLICT (plan_id, item_id, user_id)
  DO UPDATE SET vote = p_vote, created_at = now();
END;
$$;

-- RPC for converting decided plan to private meal drafts for all members
CREATE OR REPLACE FUNCTION public.convert_plan_to_meal_drafts(p_plan_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller UUID := (SELECT auth.uid());
  v_plan RECORD;
  v_member RECORD;
  v_draft_id UUID;
  v_count INT := 0;
  v_target_dish_id UUID;
  v_target_place_id UUID;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT p.*, c.user_id AS coll_owner_id
  INTO v_plan
  FROM public.plans p
  JOIN public.collections c ON c.id = p.collection_id
  WHERE p.id = p_plan_id;

  IF v_plan.id IS NULL THEN
    RAISE EXCEPTION 'Plan not found';
  END IF;

  -- Ensure caller is owner or accepted editor/member
  IF v_plan.coll_owner_id != v_caller AND NOT EXISTS (
    SELECT 1 FROM public.collection_members cm
    WHERE cm.collection_id = v_plan.collection_id AND cm.user_id = v_caller AND cm.status = 'accepted'
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Check candidate item if decided
  IF v_plan.decided_item_id IS NOT NULL THEN
    SELECT ci.dish_id, ci.place_id
    INTO v_target_dish_id, v_target_place_id
    FROM public.collection_items ci
    WHERE ci.id = v_plan.decided_item_id;
  END IF;

  -- Create private meal draft for collection owner and accepted members
  FOR v_member IN (
    SELECT v_plan.coll_owner_id AS uid
    UNION
    SELECT cm.user_id AS uid
    FROM public.collection_members cm
    WHERE cm.collection_id = v_plan.collection_id AND cm.status = 'accepted'
  ) LOOP
    v_draft_id := gen_random_uuid();
    INSERT INTO public.food_experiences (
      id,
      user_id,
      title,
      eaten_at,
      status,
      visibility,
      place_id
    ) VALUES (
      v_draft_id,
      v_member.uid,
      v_plan.title,
      COALESCE(v_plan.planned_for, now()),
      'draft',
      'private',
      v_target_place_id
    );

    IF v_target_dish_id IS NOT NULL THEN
      INSERT INTO public.experience_dishes (
        experience_id,
        dish_id,
        sort_order
      ) VALUES (
        v_draft_id,
        v_target_dish_id,
        0
      );
    END IF;

    v_count := v_count + 1;
  END LOOP;

  -- Update plan status
  UPDATE public.plans
  SET status = 'completed', updated_at = now()
  WHERE id = p_plan_id;

  RETURN v_count;
END;
$$;
