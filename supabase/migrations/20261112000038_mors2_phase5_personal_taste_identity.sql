-- MORS 2.0: Phase 5 Migration — Personal Taste Identity Engine
-- Migration: 20261112000038_mors2_phase5_personal_taste_identity.sql

-- 1. Add taste profile privacy control to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS taste_profile_sharing_enabled boolean NOT NULL DEFAULT false;

-- 2. Index for personal taste analysis queries
CREATE INDEX IF NOT EXISTS idx_food_exp_user_status_eaten
  ON public.food_experiences (user_id, status, eaten_at DESC);

CREATE INDEX IF NOT EXISTS idx_exp_dishes_exp_rating
  ON public.experience_dishes (experience_id, rating);

-- 3. RPC to update personal taste profile sharing preferences
CREATE OR REPLACE FUNCTION public.set_taste_profile_sharing(p_enabled boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  UPDATE public.profiles
  SET taste_profile_sharing_enabled = p_enabled
  WHERE id = v_user_id;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_taste_profile_sharing(boolean) TO authenticated;

-- 4. RPC: get_personal_taste_identity
-- Strictly obeys Phase 5 Non-Negotiables:
-- - Separates preferences (ratings) from activity (frequency)
-- - Scoped strictly to authenticated owner or public pool if sharing opt-in is enabled
-- - Returns evidence levels ('insufficient', 'early_signal', 'consistent_pattern')
CREATE OR REPLACE FUNCTION public.get_personal_taste_identity(
  p_user_id uuid DEFAULT NULL,
  p_viewer_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_viewer_id uuid;
  v_target_id uuid;
  v_is_owner boolean;
  v_sharing_enabled boolean;
  v_is_private boolean;
  v_is_follower boolean := false;
  v_now timestamptz := now();
  v_d90 timestamptz := v_now - interval '90 days';
  v_d180 timestamptz := v_now - interval '180 days';

  v_total_meals integer := 0;
  v_unique_dishes integer := 0;
  v_unique_places integer := 0;

  v_top_cuisines jsonb := '[]'::jsonb;
  v_top_rated_dishes jsonb := '[]'::jsonb;
  v_most_logged_dishes jsonb := '[]'::jsonb;
  v_most_logged_cuisines jsonb := '[]'::jsonb;
  v_dimension_patterns jsonb := '{}'::jsonb;
  v_monthly_activity jsonb := '[]'::jsonb;

  v_recent_90d_meals integer := 0;
  v_prior_90d_meals integer := 0;
  v_recent_top_cuisine text := NULL;
BEGIN
  -- Resolve viewer
  v_viewer_id := COALESCE(p_viewer_id, auth.uid());

  -- Resolve target user
  IF p_user_id IS NOT NULL THEN
    v_target_id := p_user_id;
  ELSE
    v_target_id := v_viewer_id;
  END IF;

  IF v_target_id IS NULL THEN
    RETURN NULL;
  END IF;

  v_is_owner := (v_viewer_id IS NOT NULL AND v_viewer_id = v_target_id);

  -- Fetch target user profile settings
  SELECT
    is_private,
    taste_profile_sharing_enabled
  INTO
    v_is_private,
    v_sharing_enabled
  FROM public.profiles
  WHERE id = v_target_id
    AND deletion_requested_at IS NULL
    AND deletion_pending_at IS NULL;

  IF v_is_private IS NULL THEN
    -- User nonexistent or pending deletion
    RETURN NULL;
  END IF;

  -- Block check
  IF v_viewer_id IS NOT NULL AND public.is_blocked_bidirectional(v_viewer_id, v_target_id) THEN
    RETURN NULL;
  END IF;

  -- Privacy gate: Non-owners cannot see taste profile if sharing is disabled
  IF NOT v_is_owner THEN
    IF NOT v_sharing_enabled THEN
      RETURN NULL;
    END IF;

    -- Follower check if profile is private
    IF v_viewer_id IS NOT NULL THEN
      v_is_follower := public.is_accepted_follower(v_viewer_id, v_target_id);
    END IF;

    IF v_is_private AND NOT v_is_follower THEN
      RETURN NULL;
    END IF;
  END IF;

  -- 1. Gather permitted experiences
  -- Owner: all published experiences (including private & followers-only)
  -- Non-owner: strictly public pool
  DROP TABLE IF EXISTS _taste_perm_exp;
  CREATE TEMPORARY TABLE _taste_perm_exp ON COMMIT DROP AS
  SELECT
    fe.id,
    fe.place_id,
    fe.cuisine,
    fe.overall_rating,
    fe.place_rating_food,
    fe.place_rating_value,
    fe.place_rating_ambience,
    fe.place_rating_service,
    fe.place_rating_hygiene,
    fe.eaten_at
  FROM public.food_experiences fe
  WHERE fe.user_id = v_target_id
    AND fe.status = 'published'
    AND (
      v_is_owner
      OR (v_is_follower AND fe.visibility IN ('public', 'followers'))
      OR fe.visibility = 'public'
    );

  -- 2. Basic activity counts
  SELECT count(*)::int INTO v_total_meals FROM _taste_perm_exp;

  SELECT count(DISTINCT ed.dish_id)::int
  INTO v_unique_dishes
  FROM public.experience_dishes ed
  JOIN _taste_perm_exp pe ON pe.id = ed.experience_id
  WHERE ed.dish_id IS NOT NULL;

  SELECT count(DISTINCT pe.place_id)::int
  INTO v_unique_places
  FROM _taste_perm_exp pe
  WHERE pe.place_id IS NOT NULL;

  -- 3. Preferences: Highly Rated Cuisines (Min 3 ratings, rating >= 7 [3.5+ stars])
  WITH cuisine_ratings AS (
    SELECT
      trim(pe.cuisine) AS cuisine_name,
      ROUND(AVG(pe.overall_rating)::numeric / 2.0, 1) AS avg_stars,
      count(*)::int AS rating_count
    FROM _taste_perm_exp pe
    WHERE pe.cuisine IS NOT NULL
      AND trim(pe.cuisine) <> ''
      AND pe.overall_rating IS NOT NULL
    GROUP BY trim(pe.cuisine)
    HAVING count(*) >= 3
    ORDER BY avg_stars DESC, rating_count DESC
    LIMIT 6
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'cuisine', cuisine_name,
      'average_rating', avg_stars,
      'evidence_count', rating_count,
      'evidence_level', CASE
        WHEN rating_count >= 6 THEN 'consistent_pattern'
        WHEN rating_count >= 3 THEN 'early_signal'
        ELSE 'insufficient'
      END
    )
  )
  INTO v_top_cuisines
  FROM cuisine_ratings;

  IF v_top_cuisines IS NULL THEN
    v_top_cuisines := '[]'::jsonb;
  END IF;

  -- 4. Preferences: Highly Rated Dishes (Repeated high ratings: times_logged >= 2, rating >= 8 [4.0+ stars])
  WITH dish_ratings AS (
    SELECT
      ed.display_name,
      ed.dish_id,
      ROUND(AVG(ed.rating)::numeric / 2.0, 1) AS avg_stars,
      count(*)::int AS times_rated
    FROM public.experience_dishes ed
    JOIN _taste_perm_exp pe ON pe.id = ed.experience_id
    WHERE ed.rating IS NOT NULL
      AND ed.rating >= 8
    GROUP BY ed.display_name, ed.dish_id
    HAVING count(*) >= 2
    ORDER BY times_rated DESC, avg_stars DESC
    LIMIT 6
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'name', display_name,
      'dish_id', dish_id,
      'average_rating', avg_stars,
      'evidence_count', times_rated,
      'evidence_level', CASE
        WHEN times_rated >= 4 THEN 'consistent_pattern'
        ELSE 'early_signal'
      END
    )
  )
  INTO v_top_rated_dishes
  FROM dish_ratings;

  IF v_top_rated_dishes IS NULL THEN
    v_top_rated_dishes := '[]'::jsonb;
  END IF;

  -- 5. Food Activity: Most Logged Dishes (frequency alone, not preference)
  WITH logged_dishes AS (
    SELECT
      ed.display_name,
      ed.dish_id,
      count(*)::int AS logged_count
    FROM public.experience_dishes ed
    JOIN _taste_perm_exp pe ON pe.id = ed.experience_id
    GROUP BY ed.display_name, ed.dish_id
    ORDER BY logged_count DESC, ed.display_name ASC
    LIMIT 5
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'name', display_name,
      'dish_id', dish_id,
      'count', logged_count
    )
  )
  INTO v_most_logged_dishes
  FROM logged_dishes;

  IF v_most_logged_dishes IS NULL THEN
    v_most_logged_dishes := '[]'::jsonb;
  END IF;

  -- 6. Food Activity: Most Logged Cuisines (frequency alone)
  WITH logged_cuisines AS (
    SELECT
      trim(pe.cuisine) AS cuisine_name,
      count(*)::int AS logged_count
    FROM _taste_perm_exp pe
    WHERE pe.cuisine IS NOT NULL AND trim(pe.cuisine) <> ''
    GROUP BY trim(pe.cuisine)
    ORDER BY logged_count DESC, cuisine_name ASC
    LIMIT 5
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'cuisine', cuisine_name,
      'count', logged_count
    )
  )
  INTO v_most_logged_cuisines
  FROM logged_cuisines;

  IF v_most_logged_cuisines IS NULL THEN
    v_most_logged_cuisines := '[]'::jsonb;
  END IF;

  -- 7. Rating Patterns by Dimension (Explicit separation of restaurant & dish dimensions)
  WITH place_dims AS (
    SELECT
      ROUND(AVG(pe.place_rating_food)::numeric / 2.0, 1) AS fq_avg, count(pe.place_rating_food)::int AS fq_cnt,
      ROUND(AVG(pe.place_rating_value)::numeric / 2.0, 1) AS val_avg, count(pe.place_rating_value)::int AS val_cnt,
      ROUND(AVG(pe.place_rating_ambience)::numeric / 2.0, 1) AS amb_avg, count(pe.place_rating_ambience)::int AS amb_cnt,
      ROUND(AVG(pe.place_rating_service)::numeric / 2.0, 1) AS srv_avg, count(pe.place_rating_service)::int AS srv_cnt,
      ROUND(AVG(pe.place_rating_hygiene)::numeric / 2.0, 1) AS hyg_avg, count(pe.place_rating_hygiene)::int AS hyg_cnt
    FROM _taste_perm_exp pe
  ),
  dish_dims AS (
    SELECT
      ROUND(AVG(ed.taste_rating)::numeric / 2.0, 1) AS taste_avg, count(ed.taste_rating)::int AS taste_cnt,
      ROUND(AVG(ed.portion_rating)::numeric / 2.0, 1) AS portion_avg, count(ed.portion_rating)::int AS portion_cnt,
      ROUND(AVG(ed.value_rating)::numeric / 2.0, 1) AS dish_val_avg, count(ed.value_rating)::int AS dish_val_cnt
    FROM public.experience_dishes ed
    JOIN _taste_perm_exp pe ON pe.id = ed.experience_id
  )
  SELECT jsonb_build_object(
    'place_dimensions', jsonb_build_object(
      'food_quality', jsonb_build_object('average', pd.fq_avg, 'count', pd.fq_cnt),
      'value_for_money', jsonb_build_object('average', pd.val_avg, 'count', pd.val_cnt),
      'ambience', jsonb_build_object('average', pd.amb_avg, 'count', pd.amb_cnt),
      'service', jsonb_build_object('average', pd.srv_avg, 'count', pd.srv_cnt),
      'hygiene', jsonb_build_object('average', pd.hyg_avg, 'count', pd.hyg_cnt)
    ),
    'dish_dimensions', jsonb_build_object(
      'taste', jsonb_build_object('average', dd.taste_avg, 'count', dd.taste_cnt),
      'portion', jsonb_build_object('average', dd.portion_avg, 'count', dd.portion_cnt),
      'value', jsonb_build_object('average', dd.dish_val_avg, 'count', dd.dish_val_cnt)
    )
  )
  INTO v_dimension_patterns
  FROM place_dims pd, dish_dims dd;

  -- 8. Logging Cadence (Last 6 Months)
  WITH months_series AS (
    SELECT
      to_char(date_trunc('month', d), 'YYYY-MM') AS month_str,
      to_char(date_trunc('month', d), 'Mon') AS month_label
    FROM generate_series(
      date_trunc('month', v_now - interval '5 months'),
      date_trunc('month', v_now),
      interval '1 month'
    ) d
  ),
  monthly_counts AS (
    SELECT
      ms.month_label,
      count(pe.id)::int AS meals_count
    FROM months_series ms
    LEFT JOIN _taste_perm_exp pe ON to_char(date_trunc('month', pe.eaten_at), 'YYYY-MM') = ms.month_str
    GROUP BY ms.month_str, ms.month_label
    ORDER BY ms.month_str ASC
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'label', month_label,
      'count', meals_count
    )
  )
  INTO v_monthly_activity
  FROM monthly_counts;

  IF v_monthly_activity IS NULL THEN
    v_monthly_activity := '[]'::jsonb;
  END IF;

  -- 9. Temporal Shifts: Recent 90 Days vs Prior 90 Days
  SELECT count(*)::int
  INTO v_recent_90d_meals
  FROM _taste_perm_exp
  WHERE eaten_at >= v_d90;

  SELECT count(*)::int
  INTO v_prior_90d_meals
  FROM _taste_perm_exp
  WHERE eaten_at >= v_d180 AND eaten_at < v_d90;

  SELECT trim(cuisine)
  INTO v_recent_top_cuisine
  FROM _taste_perm_exp
  WHERE eaten_at >= v_d90
    AND cuisine IS NOT NULL AND trim(cuisine) <> ''
  GROUP BY trim(cuisine)
  ORDER BY count(*) DESC
  LIMIT 1;

  -- Construct final payload
  RETURN jsonb_build_object(
    'user_id', v_target_id,
    'privacy', jsonb_build_object(
      'is_owner', v_is_owner,
      'sharing_enabled', v_sharing_enabled,
      'data_scope', CASE WHEN v_is_owner THEN 'all_published' ELSE 'public_pool_only' END
    ),
    'taste_profile', jsonb_build_object(
      'top_cuisines', v_top_cuisines,
      'top_rated_dishes', v_top_rated_dishes,
      'dimension_patterns', v_dimension_patterns
    ),
    'food_activity', jsonb_build_object(
      'total_meals', v_total_meals,
      'unique_dishes', v_unique_dishes,
      'unique_places', v_unique_places,
      'most_logged_dishes', v_most_logged_dishes,
      'most_logged_cuisines', v_most_logged_cuisines,
      'monthly_activity', v_monthly_activity
    ),
    'temporal_shifts', jsonb_build_object(
      'recent_90d_meals', v_recent_90d_meals,
      'prior_90d_meals', v_prior_90d_meals,
      'recent_top_cuisine', v_recent_top_cuisine,
      'has_sufficient_comparison_data', (v_recent_90d_meals >= 3 AND v_prior_90d_meals >= 3)
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_personal_taste_identity(uuid, uuid) TO anon, authenticated;
