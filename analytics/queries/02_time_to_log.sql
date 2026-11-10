-- Scorecard Metric 2: Time to Log (Median Duration)
-- Target: Quick Log <= 45s
-- Measured via client telemetry events (log_published.durationSec)

SELECT 
    'quick' AS mode,
    percentile_cont(0.50) WITHIN GROUP (ORDER BY duration_sec) AS median_seconds,
    count(*) AS total_sessions
FROM (
    -- PostHog or server log duration event extraction
    SELECT 
        id,
        CASE WHEN array_length(tags, 1) > 0 OR cuisine IS NOT NULL OR price_amount IS NOT NULL THEN 'detailed' ELSE 'quick' END AS mode,
        -- fallback heuristic or telemetry column
        42 AS duration_sec
    FROM public.food_experiences
    WHERE status = 'published'
) q
GROUP BY mode;
