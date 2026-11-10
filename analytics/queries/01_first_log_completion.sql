-- Scorecard Metric 1: First-Log Completion Rate
-- Target: >= 60% of signups publish an entry within 24h
-- Excludes internal/test accounts

WITH user_cohort AS (
    SELECT 
        id AS user_id,
        created_at AS signup_at
    FROM public.profiles
    WHERE role != 'admin'
),
first_published AS (
    SELECT 
        user_id,
        min(published_at) AS first_log_at
    FROM public.food_experiences
    WHERE status = 'published'
    GROUP BY user_id
)
SELECT 
    count(uc.user_id) AS total_signups,
    count(fp.user_id) FILTER (WHERE fp.first_log_at <= uc.signup_at + interval '24 hours') AS logged_within_24h,
    round(
        (count(fp.user_id) FILTER (WHERE fp.first_log_at <= uc.signup_at + interval '24 hours')::numeric / 
        nullif(count(uc.user_id), 0) * 100), 
        2
    ) AS first_log_completion_pct
FROM user_cohort uc
LEFT JOIN first_published fp ON fp.user_id = uc.user_id;
