-- ==============================================================================
-- MORS Database Migration: 20261110000014_trigger_maintained_stats.sql
-- Priority 2: Replace Views with Trigger-Maintained Tables for Community Aggregates
-- ==============================================================================

-- 1. Drop existing dynamic views
DROP VIEW IF EXISTS public.dish_public_stats CASCADE;
DROP VIEW IF EXISTS public.place_public_stats CASCADE;

-- 2. Create physical tables with RLS
CREATE TABLE public.dish_public_stats (
  dish_id uuid PRIMARY KEY REFERENCES public.dishes(id) ON DELETE CASCADE,
  public_experience_count integer DEFAULT 0 NOT NULL,
  public_rating_count integer DEFAULT 0 NOT NULL,
  public_rating_avg numeric(4,2)
);

ALTER TABLE public.dish_public_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read for dish_public_stats"
  ON public.dish_public_stats
  FOR SELECT
  TO public
  USING (true);

CREATE INDEX IF NOT EXISTS idx_dish_public_stats_rating_count
  ON public.dish_public_stats(public_rating_count);

CREATE TABLE public.place_public_stats (
  place_id uuid PRIMARY KEY REFERENCES public.places(id) ON DELETE CASCADE,
  public_experience_count integer DEFAULT 0 NOT NULL,
  public_rating_avg numeric(4,2)
);

ALTER TABLE public.place_public_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read for place_public_stats"
  ON public.place_public_stats
  FOR SELECT
  TO public
  USING (true);

CREATE INDEX IF NOT EXISTS idx_place_public_stats_exp_count
  ON public.place_public_stats(public_experience_count);

-- 3. Functions to recompute aggregates strictly from the Public Pool
CREATE OR REPLACE FUNCTION public.recompute_dish_stats(p_dish_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_exp_cnt integer := 0;
  v_rat_cnt integer := 0;
  v_rat_avg numeric(4,2) := NULL;
BEGIN
  IF p_dish_id IS NULL THEN RETURN; END IF;

  SELECT
    count(DISTINCT ed.id)::int,
    count(ed.rating)::int,
    round(avg(ed.rating)::numeric, 2)
  INTO v_exp_cnt, v_rat_cnt, v_rat_avg
  FROM public.experience_dishes ed
  JOIN public.food_experiences fe ON ed.experience_id = fe.id
  JOIN public.profiles p ON fe.user_id = p.id
  WHERE ed.dish_id = p_dish_id
    AND fe.status = 'published'
    AND fe.visibility = 'public'
    AND p.is_private = false
    AND p.discoverable = true
    AND p.deletion_requested_at IS NULL;

  INSERT INTO public.dish_public_stats (dish_id, public_experience_count, public_rating_count, public_rating_avg)
  VALUES (p_dish_id, v_exp_cnt, v_rat_cnt, v_rat_avg)
  ON CONFLICT (dish_id) DO UPDATE
  SET public_experience_count = EXCLUDED.public_experience_count,
      public_rating_count = EXCLUDED.public_rating_count,
      public_rating_avg = EXCLUDED.public_rating_avg;
END;
$$;

CREATE OR REPLACE FUNCTION public.recompute_place_stats(p_place_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_exp_cnt integer := 0;
  v_rat_avg numeric(4,2) := NULL;
BEGIN
  IF p_place_id IS NULL THEN RETURN; END IF;

  SELECT
    count(DISTINCT fe.id)::int,
    round(avg(fe.overall_rating)::numeric, 2)
  INTO v_exp_cnt, v_rat_avg
  FROM public.food_experiences fe
  JOIN public.profiles p ON fe.user_id = p.id
  WHERE fe.place_id = p_place_id
    AND fe.status = 'published'
    AND fe.visibility = 'public'
    AND p.is_private = false
    AND p.discoverable = true
    AND p.deletion_requested_at IS NULL;

  INSERT INTO public.place_public_stats (place_id, public_experience_count, public_rating_avg)
  VALUES (p_place_id, v_exp_cnt, v_rat_avg)
  ON CONFLICT (place_id) DO UPDATE
  SET public_experience_count = EXCLUDED.public_experience_count,
      public_rating_avg = EXCLUDED.public_rating_avg;
END;
$$;

CREATE OR REPLACE FUNCTION public.recompute_all_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT id FROM public.dishes LOOP
    PERFORM public.recompute_dish_stats(r.id);
  END LOOP;
  FOR r IN SELECT id FROM public.places LOOP
    PERFORM public.recompute_place_stats(r.id);
  END LOOP;
END;
$$;

-- 4. Triggers to maintain stats automatically
CREATE OR REPLACE FUNCTION public.trigger_on_experience_dishes_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.dish_id IS NOT NULL THEN
      PERFORM public.recompute_dish_stats(NEW.dish_id);
    END IF;
  END IF;

  IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
    IF OLD.dish_id IS NOT NULL AND (TG_OP = 'DELETE' OR OLD.dish_id <> NEW.dish_id) THEN
      PERFORM public.recompute_dish_stats(OLD.dish_id);
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_experience_dishes_maintain_stats ON public.experience_dishes;
CREATE TRIGGER on_experience_dishes_maintain_stats
AFTER INSERT OR UPDATE OR DELETE ON public.experience_dishes
FOR EACH ROW
EXECUTE FUNCTION public.trigger_on_experience_dishes_change();

CREATE OR REPLACE FUNCTION public.trigger_on_experience_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  d record;
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.place_id IS NOT NULL THEN
      PERFORM public.recompute_place_stats(NEW.place_id);
    END IF;
  END IF;

  IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
    IF OLD.place_id IS NOT NULL AND (TG_OP = 'DELETE' OR OLD.place_id <> NEW.place_id) THEN
      PERFORM public.recompute_place_stats(OLD.place_id);
    END IF;

    -- If visibility or status changed, recompute all attached dishes
    IF TG_OP = 'UPDATE' AND (OLD.visibility <> NEW.visibility OR OLD.status <> NEW.status) THEN
      FOR d IN SELECT dish_id FROM public.experience_dishes WHERE experience_id = NEW.id AND dish_id IS NOT NULL LOOP
        PERFORM public.recompute_dish_stats(d.dish_id);
      END LOOP;
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_experience_maintain_stats ON public.food_experiences;
CREATE TRIGGER on_experience_maintain_stats
AFTER INSERT OR UPDATE OR DELETE ON public.food_experiences
FOR EACH ROW
EXECUTE FUNCTION public.trigger_on_experience_change();

-- Initial population of stats for existing data
SELECT public.recompute_all_stats();
