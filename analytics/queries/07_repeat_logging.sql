-- Scorecard Metric 7: Repeat Logging Habit
-- Target: >= 40% of users log in >= 3 distinct weeks of their first 5 weeks

WITH user_first_5_weeks AS (
    SELECT 
        p.id AS user_id,
        count(DISTINCT date_trunc('week', fe.eaten_at)) AS distinct_logging_weeks
    FROM public.profiles p
    LEFT JOIN public.food_experiences fe 
        ON fe.user_id = p.id 
       AND fe.status = 'published'
       AND fe.eaten_at BETWEEN p.created_at AND p.created_at + interval '5 weeks'
    WHERE p.role != 'admin'
      AND p.created_at <= (now() - interval '5 weeks')
    GROUP BY p.id
)
SELECT 
    count(*) AS total_evaluated_users,
    count(*) FILTER (WHERE distinct_logging_weeks >= 3) AS users_logging_in_gte_3_weeks,
    round(count(*) FILTER (WHERE distinct_logging_weeks >= 3)::numeric / nullif(count(*), 0) * 100, 2) AS repeat_logging_rate_pct
FROM user_first_5_weeks;
