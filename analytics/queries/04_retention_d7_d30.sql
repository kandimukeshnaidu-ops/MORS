-- Scorecard Metric 4: User Retention (D7 & D30)
-- Target: D7 >= 25%, D30 >= 12%
-- Defined as logging or opening the diary on Day 7 (day 6-8) or Day 30 (day 28-32)

WITH cohorts AS (
    SELECT 
        id AS user_id,
        created_at::date AS cohort_date
    FROM public.profiles
    WHERE role != 'admin'
),
activity AS (
    SELECT 
        user_id,
        eaten_at::date AS active_date
    FROM public.food_experiences
)
SELECT 
    c.cohort_date,
    count(DISTINCT c.user_id) AS cohort_size,
    count(DISTINCT CASE WHEN a.active_date BETWEEN c.cohort_date + 6 AND c.cohort_date + 8 THEN c.user_id END) AS d7_active,
    round(count(DISTINCT CASE WHEN a.active_date BETWEEN c.cohort_date + 6 AND c.cohort_date + 8 THEN c.user_id END)::numeric / nullif(count(DISTINCT c.user_id), 0) * 100, 1) AS d7_retention_pct,
    count(DISTINCT CASE WHEN a.active_date BETWEEN c.cohort_date + 28 AND c.cohort_date + 32 THEN c.user_id END) AS d30_active,
    round(count(DISTINCT CASE WHEN a.active_date BETWEEN c.cohort_date + 28 AND c.cohort_date + 32 THEN c.user_id END)::numeric / nullif(count(DISTINCT c.user_id), 0) * 100, 1) AS d30_retention_pct
FROM cohorts c
LEFT JOIN activity a ON a.user_id = c.user_id
GROUP BY c.cohort_date
HAVING count(DISTINCT c.user_id) >= 1
ORDER BY c.cohort_date DESC;
