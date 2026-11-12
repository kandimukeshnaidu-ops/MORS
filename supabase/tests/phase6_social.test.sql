BEGIN;
SELECT plan(16);

-- 1. Function existence
SELECT has_function('public', 'get_suggested_profiles', ARRAY['integer'], 'get_suggested_profiles(integer) exists');
SELECT has_function('public', 'get_taste_aligned_profiles', ARRAY['integer'], 'get_taste_aligned_profiles(integer) exists');
SELECT has_function('public', 'get_home_feed_v2', ARRAY['timestamp with time zone', 'uuid', 'integer'], 'get_home_feed_v2(timestamptz, uuid, integer) exists');
SELECT has_function('public', 'convert_plan_to_meal_drafts', ARRAY['uuid'], 'convert_plan_to_meal_drafts(uuid) exists');

-- 2. Setup Test Users
INSERT INTO auth.users (id, email)
VALUES
  ('66666666-6666-6666-6666-666666666661', 'socialuser1@mors.test'),
  ('66666666-6666-6666-6666-666666666662', 'socialuser2@mors.test'),
  ('66666666-6666-6666-6666-666666666663', 'socialuser3@mors.test'),
  ('66666666-6666-6666-6666-666666666664', 'socialblocked@mors.test')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, username, display_name, is_private, discoverable)
VALUES
  ('66666666-6666-6666-6666-666666666661', 'socuser1', 'Social One', false, true),
  ('66666666-6666-6666-6666-666666666662', 'socuser2', 'Social Two', false, true),
  ('66666666-6666-6666-6666-666666666663', 'socuser3', 'Social Three', false, true),
  ('66666666-6666-6666-6666-666666666664', 'socblocked', 'Social Blocked', false, true)
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  is_private = EXCLUDED.is_private,
  discoverable = EXCLUDED.discoverable;

-- Follow relation: User 1 follows User 2
INSERT INTO public.follows (follower_id, following_id, status)
VALUES ('66666666-6666-6666-6666-666666666661', '66666666-6666-6666-6666-666666666662', 'accepted')
ON CONFLICT DO NOTHING;

-- Block relation: User 1 blocks User 4
INSERT INTO public.blocks (blocker_id, blocked_id)
VALUES ('66666666-6666-6666-6666-666666666661', '66666666-6666-6666-6666-666666666664')
ON CONFLICT DO NOTHING;

-- Canonical Test Dish
INSERT INTO public.dishes (id, name, normalized_name, slug, cuisine, is_listed)
VALUES ('66666666-6666-6666-6666-666666666611', 'Social Biryani', 'social biryani', 'social-biryani', 'Hyderabadi', true)
ON CONFLICT DO NOTHING;

-- Test Food Experiences
-- Exp 1 by User 2 (followed by User 1): Public, rated 9/10
INSERT INTO public.food_experiences (id, user_id, title, category_slug, eaten_at, published_at, status, visibility, overall_rating, cuisine)
VALUES (
  '66666666-6666-6666-6666-666666666621',
  '66666666-6666-6666-6666-666666666662',
  'User 2 Lunch',
  'restaurant',
  now() - interval '2 hours',
  now() - interval '2 hours',
  'published',
  'public',
  9,
  'Hyderabadi'
);

INSERT INTO public.experience_dishes (experience_id, dish_id, display_name, rating, position)
VALUES ('66666666-6666-6666-6666-666666666621', '66666666-6666-6666-6666-666666666611', 'Social Biryani', 9, 0);

-- Exp 2 by User 3 (NOT followed by User 1): Public, rated 9/10
INSERT INTO public.food_experiences (id, user_id, title, category_slug, eaten_at, published_at, status, visibility, overall_rating, cuisine)
VALUES (
  '66666666-6666-6666-6666-666666666622',
  '66666666-6666-6666-6666-666666666663',
  'User 3 Lunch',
  'restaurant',
  now() - interval '1 hour',
  now() - interval '1 hour',
  'published',
  'public',
  9,
  'Hyderabadi'
);

INSERT INTO public.experience_dishes (experience_id, dish_id, display_name, rating, position)
VALUES ('66666666-6666-6666-6666-666666666622', '66666666-6666-6666-6666-666666666611', 'Social Biryani', 9, 0);

-- Exp 3 by User 4 (Blocked by User 1): Public
INSERT INTO public.food_experiences (id, user_id, title, category_slug, eaten_at, published_at, status, visibility, overall_rating, cuisine)
VALUES (
  '66666666-6666-6666-6666-666666666623',
  '66666666-6666-6666-6666-666666666664',
  'Blocked User Meal',
  'restaurant',
  now() - interval '30 minutes',
  now() - interval '30 minutes',
  'published',
  'public',
  8,
  'Hyderabadi'
);

-- Exp 4 by User 1: Own Meal
INSERT INTO public.food_experiences (id, user_id, title, category_slug, eaten_at, published_at, status, visibility, overall_rating, cuisine)
VALUES (
  '66666666-6666-6666-6666-666666666624',
  '66666666-6666-6666-6666-666666666661',
  'User 1 Own Meal',
  'restaurant',
  now() - interval '10 minutes',
  now() - interval '10 minutes',
  'published',
  'public',
  9,
  'Hyderabadi'
);

INSERT INTO public.experience_dishes (experience_id, dish_id, display_name, rating, position)
VALUES ('66666666-6666-6666-6666-666666666624', '66666666-6666-6666-6666-666666666611', 'Social Biryani', 10, 0);

-- Like on Exp 1 by User 1
INSERT INTO public.experience_likes (experience_id, user_id)
VALUES ('66666666-6666-6666-6666-666666666621', '66666666-6666-6666-6666-666666666661');

-- Comment on Exp 1 by User 1
INSERT INTO public.experience_comments (experience_id, user_id, body)
VALUES ('66666666-6666-6666-6666-666666666621', '66666666-6666-6666-6666-666666666661', 'Great biryani choice!');

-- Test as User 1
SET LOCAL "request.jwt.claims" = '{"sub": "66666666-6666-6666-6666-666666666661"}';

-- Test 5: get_home_feed_v2 returns items for User 1 (Own meal + Followed User 2)
SELECT is(
  jsonb_array_length(public.get_home_feed_v2()->'items'),
  2,
  'User 1 sees exactly 2 feed items (own meal + followed user meal)'
);

-- Test 6: Blocked User 4 is strictly excluded from feed
SELECT is(
  EXISTS (
    SELECT 1 FROM jsonb_array_elements(public.get_home_feed_v2()->'items') x
    WHERE x->'author'->>'username' = 'socblocked'
  ),
  false,
  'Blocked user 4 is strictly excluded from home feed'
);

-- Test 7: Unfollowed User 3 is excluded from authenticated following feed
SELECT is(
  EXISTS (
    SELECT 1 FROM jsonb_array_elements(public.get_home_feed_v2()->'items') x
    WHERE x->'author'->>'username' = 'socuser3'
  ),
  false,
  'Unfollowed user 3 is excluded from home following feed'
);

-- Test 8: Embedded likes_count, comments_count, and is_liked_by_viewer
SELECT is(
  (public.get_home_feed_v2()->'items'->1->>'likes_count')::int,
  1,
  'Feed item embeds correct likes_count = 1'
);

SELECT is(
  (public.get_home_feed_v2()->'items'->1->>'comments_count')::int,
  1,
  'Feed item embeds correct comments_count = 1'
);

SELECT is(
  (public.get_home_feed_v2()->'items'->1->>'is_liked_by_viewer')::boolean,
  true,
  'Feed item embeds correct is_liked_by_viewer = true'
);

-- Test 9: get_taste_aligned_profiles suggests User 3 to User 1 (both highly rated Social Biryani)
SELECT is(
  (SELECT username FROM public.get_taste_aligned_profiles(5) LIMIT 1),
  'socuser3',
  'Taste-aligned connection surfaces User 3 due to mutual high rating on Social Biryani'
);

-- Test 10: get_taste_aligned_profiles excludes followed User 2 and blocked User 4
SELECT is(
  EXISTS (
    SELECT 1 FROM public.get_taste_aligned_profiles(10)
    WHERE username IN ('socuser2', 'socblocked')
  ),
  false,
  'Taste-aligned recommendations exclude already followed and blocked users'
);

-- Test 11: Group Planning & Voting
-- Create collection and plan
INSERT INTO public.collections (id, user_id, name, visibility)
VALUES ('66666666-6666-6666-6666-666666666631', '66666666-6666-6666-6666-666666666661', 'Weekend Group Lunch', 'private');

INSERT INTO public.collection_members (collection_id, user_id, role, status)
VALUES ('66666666-6666-6666-6666-666666666631', '66666666-6666-6666-6666-666666666662', 'editor', 'accepted');

INSERT INTO public.collection_items (id, collection_id, item_type, dish_id)
VALUES ('66666666-6666-6666-6666-666666666651', '66666666-6666-6666-6666-666666666631', 'dish', '66666666-6666-6666-6666-666666666611');

INSERT INTO public.plans (id, collection_id, title, status, created_by, decided_item_id)
VALUES ('66666666-6666-6666-6666-666666666641', '66666666-6666-6666-6666-666666666631', 'Biryani Outing', 'planning', '66666666-6666-6666-6666-666666666661', '66666666-6666-6666-6666-666666666651');

-- Cast vote
SELECT lives_ok(
  $$ SELECT public.cast_plan_vote('66666666-6666-6666-6666-666666666641'::uuid, '66666666-6666-6666-6666-666666666651'::uuid, 'up') $$,
  'Plan vote cast successfully by collection owner'
);

-- Test 12: Vote recorded in plan_votes
SELECT is(
  (SELECT vote FROM public.plan_votes WHERE plan_id = '66666666-6666-6666-6666-666666666641' AND user_id = '66666666-6666-6666-6666-666666666661'),
  'up',
  'Vote recorded as up'
);

-- Test 13: convert_plan_to_meal_drafts generates drafts for both owner and member
SELECT is(
  public.convert_plan_to_meal_drafts('66666666-6666-6666-6666-666666666641'::uuid),
  2,
  'Plan conversion generates exactly 2 private meal drafts (1 for owner, 1 for member)'
);

-- Test 14: Plan status updated to completed
SELECT is(
  (SELECT status FROM public.plans WHERE id = '66666666-6666-6666-6666-666666666641'),
  'completed',
  'Plan status successfully updated to completed'
);

SELECT * FROM finish();
ROLLBACK;
