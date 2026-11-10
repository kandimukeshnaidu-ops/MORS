-- Scorecard Metric 5: Social Connections
-- Target: >= 3 accepted follows per user at day 14

WITH user_day14 AS (
    SELECT 
        p.id AS user_id,
        p.username,
        count(f.id) AS accepted_follows_count
    FROM public.profiles p
    LEFT JOIN public.follows f 
        ON f.follower_id = p.id 
       AND f.status = 'accepted'
       AND f.created_at <= p.created_at + interval '14 days'
    WHERE p.role != 'admin'
      AND p.created_at <= (now() - interval '14 days')
    GROUP BY p.id, p.username
)
SELECT 
    count(*) AS qualified_users_at_day14,
    round(avg(accepted_follows_count), 2) AS avg_follows_at_day14,
    count(*) FILTER (WHERE accepted_follows_count >= 3) AS users_with_gte_3_follows,
    round(count(*) FILTER (WHERE accepted_follows_count >= 3)::numeric / nullif(count(*), 0) * 100, 1) AS pct_users_with_gte_3_follows
FROM user_day14;
