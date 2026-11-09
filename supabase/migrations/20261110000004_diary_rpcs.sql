-- ==============================================================================
-- MORS Database Migration: 20261110000004_diary_rpcs.sql
-- Phase 5: Calendar Month Summary & On-This-Day Memory RPCs
-- ==============================================================================

-- 1. GET_CALENDAR_MONTH_SUMMARY
-- Returns day of month, count of meals logged, and primary photo thumbnail path
CREATE OR REPLACE FUNCTION public.get_calendar_month_summary(
  p_user_id uuid,
  p_year integer,
  p_month integer
)
RETURNS TABLE (
  day integer,
  count bigint,
  thumbnail_path text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_start_date timestamptz;
  v_end_date timestamptz;
BEGIN
  v_start_date := make_timestamptz(p_year, p_month, 1, 0, 0, 0, 'UTC');
  v_end_date := v_start_date + interval '1 month';

  RETURN QUERY
  WITH user_month_experiences AS (
    SELECT
      fe.id,
      EXTRACT(DAY FROM fe.eaten_at AT TIME ZONE 'UTC')::integer AS exp_day,
      fe.eaten_at
    FROM public.food_experiences fe
    WHERE fe.user_id = p_user_id
      AND fe.eaten_at >= v_start_date
      AND fe.eaten_at < v_end_date
      AND public.can_view_experience((SELECT auth.uid()), fe.id)
  ),
  day_counts AS (
    SELECT
      exp_day,
      count(*)::bigint AS meal_count
    FROM user_month_experiences
    GROUP BY exp_day
  ),
  day_photos AS (
    SELECT DISTINCT ON (ume.exp_day)
      ume.exp_day,
      ep.storage_path
    FROM user_month_experiences ume
    JOIN public.experience_photos ep ON ume.id = ep.experience_id
    ORDER BY ume.exp_day, ep.position ASC
  )
  SELECT
    dc.exp_day AS day,
    dc.meal_count AS count,
    dp.storage_path AS thumbnail_path
  FROM day_counts dc
  LEFT JOIN day_photos dp ON dc.exp_day = dp.exp_day
  ORDER BY dc.exp_day ASC;
END;
$$;

-- 2. GET_ON_THIS_DAY_MEMORY
-- Returns an experience logged on today's calendar date in previous years
CREATE OR REPLACE FUNCTION public.get_on_this_day_memory(
  p_user_id uuid
)
RETURNS TABLE (
  experience_id uuid,
  title text,
  dish_name text,
  years_ago integer,
  thumbnail_path text,
  rating smallint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    fe.id AS experience_id,
    fe.title,
    (SELECT ed.display_name FROM public.experience_dishes ed WHERE ed.experience_id = fe.id ORDER BY ed.position ASC LIMIT 1) AS dish_name,
    (EXTRACT(YEAR FROM now()) - EXTRACT(YEAR FROM fe.eaten_at))::integer AS years_ago,
    (SELECT ep.storage_path FROM public.experience_photos ep WHERE ep.experience_id = fe.id ORDER BY ep.position ASC LIMIT 1) AS thumbnail_path,
    fe.overall_rating AS rating
  FROM public.food_experiences fe
  WHERE fe.user_id = p_user_id
    AND EXTRACT(MONTH FROM fe.eaten_at) = EXTRACT(MONTH FROM now())
    AND EXTRACT(DAY FROM fe.eaten_at) = EXTRACT(DAY FROM now())
    AND EXTRACT(YEAR FROM fe.eaten_at) < EXTRACT(YEAR FROM now())
    AND public.can_view_experience((SELECT auth.uid()), fe.id)
  ORDER BY fe.eaten_at DESC
  LIMIT 1;
END;
$$;
