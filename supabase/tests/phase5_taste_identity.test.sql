BEGIN;
SELECT plan(16);

-- 1. Function existence
SELECT has_function('public', 'get_personal_taste_identity', ARRAY['uuid', 'uuid'], 'get_personal_taste_identity(uuid, uuid) exists');
SELECT has_function('public', 'set_taste_profile_sharing', ARRAY['boolean'], 'set_taste_profile_sharing(boolean) exists');

-- 2. Setup test users
INSERT INTO auth.users (id, email)
VALUES
  ('55555555-5555-5555-5555-555555555551', 'taster1@mors.test'),
  ('55555555-5555-5555-5555-555555555552', 'viewer1@mors.test'),
  ('55555555-5555-5555-5555-555555555553', 'blocked1@mors.test')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, username, display_name, is_private, taste_profile_sharing_enabled)
VALUES
  ('55555555-5555-5555-5555-555555555551', 'tasteowner', 'Taste Owner', false, false),
  ('55555555-5555-5555-5555-555555555552', 'tasteviewer', 'Taste Viewer', false, false),
  ('55555555-5555-5555-5555-555555555553', 'tasteblocked', 'Taste Blocked', false, false)
ON CONFLICT (id) DO UPDATE SET
  taste_profile_sharing_enabled = EXCLUDED.taste_profile_sharing_enabled,
  is_private = EXCLUDED.is_private;

-- Block relationship
INSERT INTO public.blocks (blocker_id, blocked_id)
VALUES ('55555555-5555-5555-5555-555555555551', '55555555-5555-5555-5555-555555555553')
ON CONFLICT DO NOTHING;

-- Test Places & Dishes
INSERT INTO public.places (id, name, normalized_name, city, country, is_listed)
VALUES ('55555555-5555-5555-5555-555555555501', 'Cafe Niloufer Taste', 'cafe niloufer taste', 'Hyderabad', 'India', true)
ON CONFLICT DO NOTHING;

INSERT INTO public.dishes (id, name, normalized_name, slug, cuisine, is_listed)
VALUES
  ('55555555-5555-5555-5555-555555555511', 'Irani Chai Taste', 'irani chai taste', 'irani-chai-taste', 'Hyderabadi', true),
  ('55555555-5555-5555-5555-555555555512', 'Osmania Biscuit Taste', 'osmania biscuit taste', 'osmania-biscuit-taste', 'Hyderabadi', true)
ON CONFLICT DO NOTHING;

-- Seed experiences for taste owner
-- Exp 1: Public, Hyderabadi, rated 9/10 with 5-dimension place review
INSERT INTO public.food_experiences (
  id, user_id, place_id, title, eaten_at, status, visibility, overall_rating, cuisine, category_slug,
  place_rating_food, place_rating_value, place_rating_ambience, place_rating_service, place_rating_hygiene
)
VALUES (
  '55555555-5555-5555-5555-555555555521',
  '55555555-5555-5555-5555-555555555551',
  '55555555-5555-5555-5555-555555555501',
  'Morning Chai 1',
  now() - interval '10 days',
  'published',
  'public',
  9,
  'Hyderabadi',
  'cafe_beverage',
  9, 10, 8, 7, 8
);

INSERT INTO public.experience_dishes (experience_id, dish_id, display_name, rating, taste_rating, portion_rating, value_rating)
VALUES (
  '55555555-5555-5555-5555-555555555521',
  '55555555-5555-5555-5555-555555555511',
  'Irani Chai Taste',
  10,
  10,
  8,
  10
);

-- Exp 2: Private, Hyderabadi, rated 9/10
INSERT INTO public.food_experiences (id, user_id, place_id, title, eaten_at, status, visibility, overall_rating, cuisine, category_slug)
VALUES (
  '55555555-5555-5555-5555-555555555522',
  '55555555-5555-5555-5555-555555555551',
  '55555555-5555-5555-5555-555555555501',
  'Private Chai 2',
  now() - interval '20 days',
  'published',
  'private',
  9,
  'Hyderabadi',
  'cafe_beverage'
);

INSERT INTO public.experience_dishes (experience_id, dish_id, display_name, rating, taste_rating, portion_rating, value_rating)
VALUES (
  '55555555-5555-5555-5555-555555555522',
  '55555555-5555-5555-5555-555555555511',
  'Irani Chai Taste',
  9,
  9,
  8,
  9
);

-- Exp 3: Public, Hyderabadi, rated 8/10
INSERT INTO public.food_experiences (id, user_id, place_id, title, eaten_at, status, visibility, overall_rating, cuisine, category_slug)
VALUES (
  '55555555-5555-5555-5555-555555555523',
  '55555555-5555-5555-5555-555555555551',
  '55555555-5555-5555-5555-555555555501',
  'Chai and Biscuit 3',
  now() - interval '30 days',
  'published',
  'public',
  8,
  'Hyderabadi',
  'cafe_beverage'
);

INSERT INTO public.experience_dishes (experience_id, dish_id, display_name, rating, taste_rating, portion_rating, value_rating)
VALUES
  ('55555555-5555-5555-5555-555555555523', '55555555-5555-5555-5555-555555555511', 'Irani Chai Taste', 9, 9, 8, 9),
  ('55555555-5555-5555-5555-555555555523', '55555555-5555-5555-5555-555555555512', 'Osmania Biscuit Taste', 8, 8, 8, 8);

-- Test 3: Blocked viewer receives NULL
SELECT is(
  public.get_personal_taste_identity('55555555-5555-5555-5555-555555555551', '55555555-5555-5555-5555-555555555553'),
  NULL,
  'Blocked viewer cannot access taste identity'
);

-- Test 4: External viewer receives NULL when sharing is disabled (default)
SELECT is(
  public.get_personal_taste_identity('55555555-5555-5555-5555-555555555551', '55555555-5555-5555-5555-555555555552'),
  NULL,
  'External viewer cannot access taste identity when sharing is disabled'
);

-- Test 5: Owner querying own taste identity succeeds
SELECT ok(
  public.get_personal_taste_identity('55555555-5555-5555-5555-555555555551', '55555555-5555-5555-5555-555555555551') IS NOT NULL,
  'Owner can access their own taste identity'
);

-- Test 6: Owner sees private experiences included in total meals count (3 meals)
SELECT is(
  (public.get_personal_taste_identity('55555555-5555-5555-5555-555555555551', '55555555-5555-5555-5555-555555555551')->'food_activity'->>'total_meals')::int,
  3,
  'Owner taste identity includes private experiences (total_meals = 3)'
);

-- Test 7: Unique dishes counted correctly (2 unique dishes)
SELECT is(
  (public.get_personal_taste_identity('55555555-5555-5555-5555-555555555551', '55555555-5555-5555-5555-555555555551')->'food_activity'->>'unique_dishes')::int,
  2,
  'Unique dishes accurately counted'
);

-- Test 8: Top cuisines aggregated with early signal evidence level (Hyderabadi, 3 ratings)
SELECT is(
  public.get_personal_taste_identity('55555555-5555-5555-5555-555555555551', '55555555-5555-5555-5555-555555555551')->'taste_profile'->'top_cuisines'->0->>'cuisine',
  'Hyderabadi',
  'Top cuisine identified as Hyderabadi'
);

SELECT is(
  public.get_personal_taste_identity('55555555-5555-5555-5555-555555555551', '55555555-5555-5555-5555-555555555551')->'taste_profile'->'top_cuisines'->0->>'evidence_level',
  'early_signal',
  'Evidence level correctly classified as early_signal for 3 ratings'
);

-- Test 9: Top rated dishes identified (Irani Chai Taste, logged 3 times, rating >= 4.0 stars)
SELECT is(
  public.get_personal_taste_identity('55555555-5555-5555-5555-555555555551', '55555555-5555-5555-5555-555555555551')->'taste_profile'->'top_rated_dishes'->0->>'name',
  'Irani Chai Taste',
  'Repeated high-rated dish identified'
);

-- Test 10: Most logged dishes separated from preference
SELECT is(
  public.get_personal_taste_identity('55555555-5555-5555-5555-555555555551', '55555555-5555-5555-5555-555555555551')->'food_activity'->'most_logged_dishes'->0->>'name',
  'Irani Chai Taste',
  'Most logged dishes present in food_activity'
);

-- Test 11: Dimension patterns return distinct place and dish scores
SELECT is(
  (public.get_personal_taste_identity('55555555-5555-5555-5555-555555555551', '55555555-5555-5555-5555-555555555551')->'taste_profile'->'dimension_patterns'->'dish_dimensions'->'taste'->>'count')::int,
  4,
  'Dish taste dimension has 4 ratings recorded'
);

-- Test 12: Enable sharing and test external viewer sees strictly public pool
UPDATE public.profiles
SET taste_profile_sharing_enabled = true
WHERE id = '55555555-5555-5555-5555-555555555551';

SELECT ok(
  public.get_personal_taste_identity('55555555-5555-5555-5555-555555555551', '55555555-5555-5555-5555-555555555552') IS NOT NULL,
  'External viewer can access taste identity once sharing is enabled'
);

-- Test 13: External viewer sees strictly public pool count (2 public meals, private meal excluded)
SELECT is(
  (public.get_personal_taste_identity('55555555-5555-5555-5555-555555555551', '55555555-5555-5555-5555-555555555552')->'food_activity'->>'total_meals')::int,
  2,
  'External viewer only sees public meals (2 meals, private meal 100% hidden)'
);

-- Test 14: Data scope indicator correctly shows public_pool_only for viewer
SELECT is(
  public.get_personal_taste_identity('55555555-5555-5555-5555-555555555551', '55555555-5555-5555-5555-555555555552')->'privacy'->>'data_scope',
  'public_pool_only',
  'Viewer payload explicitly marked as public_pool_only'
);

-- Test 15: If profile is private, external non-follower cannot view even if sharing is enabled
UPDATE public.profiles
SET is_private = true
WHERE id = '55555555-5555-5555-5555-555555555551';

SELECT is(
  public.get_personal_taste_identity('55555555-5555-5555-5555-555555555551', '55555555-5555-5555-5555-555555555552'),
  NULL,
  'External non-follower cannot access taste identity on private profile even with sharing enabled'
);

SELECT * FROM finish();
ROLLBACK;
