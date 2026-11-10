-- Scorecard Metric 3: Weekly Experiences Per Active User
-- Target: >= 2 published entries per weekly active logger
-- Grouped by ISO calendar week

SELECT 
    date_trunc('week', published_at) AS log_week,
    count(DISTINCT user_id) AS active_loggers,
    count(id) AS total_published_experiences,
    round(count(id)::numeric / nullif(count(DISTINCT user_id), 0), 2) AS experiences_per_active_logger
FROM public.food_experiences
WHERE status = 'published'
  AND published_at >= (now() - interval '8 weeks')
GROUP BY date_trunc('week', published_at)
ORDER BY log_week DESC;
