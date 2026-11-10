-- Migration: Phase 29 Taste Matching and Explainable Recommendations
-- Tables: user_taste_vectors, dish_similarity, rec_feedback
-- Adds allow_taste_comparison to profiles; RLS enabled on all tables

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS allow_taste_comparison BOOLEAN NOT NULL DEFAULT false;

-- 1. User Taste Vectors (Strictly owner-only)
CREATE TABLE IF NOT EXISTS public.user_taste_vectors (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  top_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  top_cuisines JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_taste_vectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_taste_vectors_select ON public.user_taste_vectors
  FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

CREATE POLICY user_taste_vectors_admin ON public.user_taste_vectors
  FOR ALL
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

-- 2. Dish Similarity (Public reference co-occurrence)
CREATE TABLE IF NOT EXISTS public.dish_similarity (
  dish_a_id UUID NOT NULL REFERENCES public.dishes(id) ON DELETE CASCADE,
  dish_b_id UUID NOT NULL REFERENCES public.dishes(id) ON DELETE CASCADE,
  score NUMERIC NOT NULL DEFAULT 1.0,
  PRIMARY KEY (dish_a_id, dish_b_id)
);
ALTER TABLE public.dish_similarity ENABLE ROW LEVEL SECURITY;

CREATE POLICY dish_similarity_select ON public.dish_similarity
  FOR SELECT
  USING (true);

CREATE POLICY dish_similarity_admin ON public.dish_similarity
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

-- 3. Recommendation Feedback (Dismissals and 'Not Interested' signals)
CREATE TABLE IF NOT EXISTS public.rec_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  signal TEXT NOT NULL CHECK (signal IN ('dismiss', 'not_interested')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rec_feedback_user ON public.rec_feedback(user_id, target_id);
ALTER TABLE public.rec_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY rec_feedback_select ON public.rec_feedback
  FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

CREATE POLICY rec_feedback_insert ON public.rec_feedback
  FOR INSERT
  WITH CHECK (
    (SELECT auth.uid()) = user_id
  );

CREATE POLICY rec_feedback_admin ON public.rec_feedback
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

-- RPC for Explainable Taste Recommendations
CREATE OR REPLACE FUNCTION public.get_taste_recommendations(p_user_id UUID)
RETURNS TABLE (
  dish_id UUID,
  dish_name TEXT,
  reason TEXT,
  public_rating_avg NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_viewer UUID := (SELECT auth.uid());
BEGIN
  IF v_viewer IS NULL OR v_viewer != p_user_id THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    d.id AS dish_id,
    d.name AS dish_name,
    'Popular in Hyderabad with highly rated experiences'::text AS reason,
    ROUND(dps.public_rating_avg::numeric, 1) AS public_rating_avg
  FROM public.dishes d
  JOIN public.dish_public_stats dps ON dps.dish_id = d.id
  WHERE d.is_listed = true
    AND dps.public_experience_count >= 1
    AND NOT EXISTS (
      -- Exclude dismissed recommendations
      SELECT 1 FROM public.rec_feedback rf
      WHERE rf.user_id = p_user_id AND rf.target_id = d.id
    )
  ORDER BY dps.public_rating_avg DESC NULLS LAST
  LIMIT 5;
END;
$$;

-- RPC for Dismissing Recommendation
CREATE OR REPLACE FUNCTION public.dismiss_recommendation(
  p_target_id UUID,
  p_target_type TEXT,
  p_signal TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := (SELECT auth.uid());
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  INSERT INTO public.rec_feedback (user_id, target_id, target_type, signal)
  VALUES (v_user_id, p_target_id, p_target_type, p_signal);
END;
$$;
