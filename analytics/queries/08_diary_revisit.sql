-- Scorecard Metric 8: Diary Revisit
-- Target: >= 30% of weekly active users open their diary/calendar

-- Telemetry proxy: Users with diary visits or activity in the last 7 days
WITH weekly_actives AS (
    SELECT DISTINCT user_id
    FROM public.food_experiences
    WHERE eaten_at >= (now() - interval '7 days')
),
diary_revisitations AS (
    -- Users who logged memories or viewed past calendar months
    SELECT DISTINCT user_id
    FROM public.food_experiences
    WHERE eaten_at < (now() - interval '7 days')
      AND updated_at >= (now() - interval '7 days')
)
SELECT 
    count(wa.user_id) AS weekly_active_users,
    count(dr.user_id) AS users_revisiting_diary,
    round(count(dr.user_id)::numeric / nullif(count(wa.user_id), 0) * 100, 2) AS diary_revisit_pct
FROM weekly_actives wa
LEFT JOIN diary_revisitations dr ON dr.user_id = wa.user_id;
