-- Scorecard Metric 6: Collection Creation Rate
-- Target: >= 20% of active users create at least 1 non-system collection

WITH active_users AS (
    SELECT DISTINCT user_id
    FROM public.food_experiences
    WHERE eaten_at >= (now() - interval '30 days')
),
custom_collections AS (
    SELECT DISTINCT user_id
    FROM public.collections
    WHERE is_wishlist = false 
      AND (system_key IS NULL OR system_key != 'saved')
)
SELECT 
    count(au.user_id) AS total_active_users,
    count(cc.user_id) AS users_with_custom_collection,
    round(count(cc.user_id)::numeric / nullif(count(au.user_id), 0) * 100, 2) AS collection_creation_rate_pct
FROM active_users au
LEFT JOIN custom_collections cc ON cc.user_id = au.user_id;
