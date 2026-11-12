-- pgTAP Test Suite: Phase 4 Restaurant and Dish Profiles
BEGIN;
SELECT plan(15);

-- Setup test users
INSERT INTO auth.users (id, email)
VALUES
  ('a4000000-0000-0000-0000-000000000001', 'p4_creator@test.mors.app'),
  ('a4000000-0000-0000-0000-000000000002', 'p4_public@test.mors.app'),
  ('a4000000-0000-0000-0000-000000000003', 'p4_private@test.mors.app')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, username, display_name, is_private, discoverable)
VALUES
  ('a4000000-0000-0000-0000-000000000001', 'p4_creator_user', 'Creator User', false, true),
  ('a4000000-0000-0000-0000-000000000002', 'p4_public_user', 'Public Foodie', false, true),
  ('a4000000-0000-0000-0000-000000000003', 'p4_private_user', 'Private Foodie', true, false)
ON CONFLICT (id) DO UPDATE SET is_private = EXCLUDED.is_private, discoverable = EXCLUDED.discoverable;

-- Setup test places
INSERT INTO public.places (id, name, normalized_name, city, address, is_listed, created_by)
VALUES
  ('b4000000-0000-0000-0000-000000000001', 'Paradise Biryani Secunderabad', 'paradise biryani secunderabad', 'Hyderabad', 'MG Road, Secunderabad', true, 'a4000000-0000-0000-0000-000000000001'),
  ('b4000000-0000-0000-0000-000000000002', 'Secret Supper Club', 'secret supper club', 'Hyderabad', 'Banjara Hills', false, 'a4000000-0000-0000-0000-000000000001'),
  ('b4000000-0000-0000-0000-000000000003', 'Old Paradise Branch', 'old paradise branch', 'Hyderabad', 'Old City', true, 'a4000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Mark old paradise branch as merged into paradise secunderabad
UPDATE public.places
SET merged_into_id = 'b4000000-0000-0000-0000-000000000001'
WHERE id = 'b4000000-0000-0000-0000-000000000003';

-- Setup test dishes
INSERT INTO public.dishes (id, name, slug, normalized_name, cuisine, is_listed, created_by)
VALUES
  ('c4000000-0000-0000-0000-000000000001', 'Hyderabadi Dum Mutton Biryani', 'hyderabadi-dum-mutton-biryani-p4', 'hyderabadi dum mutton biryani', 'Hyderabadi', true, 'a4000000-0000-0000-0000-000000000001'),
  ('c4000000-0000-0000-0000-000000000002', 'Secret Underground Pulao', 'secret-underground-pulao-p4', 'secret underground pulao', 'Hyderabadi', false, 'a4000000-0000-0000-0000-000000000001'),
  ('c4000000-0000-0000-0000-000000000003', 'Old Dum Biryani Alias', 'old-dum-biryani-alias-p4', 'old dum biryani alias', 'Hyderabadi', true, 'a4000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Mark old alias dish as merged into canonical mutton biryani
UPDATE public.dishes
SET merged_into_id = 'c4000000-0000-0000-0000-000000000001'
WHERE id = 'c4000000-0000-0000-0000-000000000003';

-- Add dish translation
INSERT INTO public.dish_translations (dish_id, locale, name)
VALUES ('c4000000-0000-0000-0000-000000000001', 'te', 'హైదరాబాదీ దమ్ మటన్ బిర్యానీ')
ON CONFLICT (dish_id, locale) DO UPDATE SET name = EXCLUDED.name;

-- Insert Public Food Experience by public user
INSERT INTO public.food_experiences (
  id, user_id, place_id, category_slug, title, status, visibility, eaten_at,
  overall_rating, place_rating_overall, place_rating_food, place_rating_value,
  place_rating_ambience, place_rating_service, place_rating_hygiene
) VALUES (
  'd4000000-0000-0000-0000-000000000001',
  'a4000000-0000-0000-0000-000000000002',
  'b4000000-0000-0000-0000-000000000001',
  'restaurant',
  'Sunday Feast at Paradise',
  'published',
  'public',
  now() - interval '1 hour',
  9, 9, 10, 8, 9, 8, 9
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.experience_dishes (
  experience_id, dish_id, display_name, position, rating, taste_rating, portion_rating, value_rating, note
) VALUES (
  'd4000000-0000-0000-0000-000000000001',
  'c4000000-0000-0000-0000-000000000001',
  'Mutton Biryani Special',
  1,
  10, 10, 9, 9, 'Tender meat and exquisite spice balance'
) ON CONFLICT DO NOTHING;

-- Insert Private Food Experience by private user (SHOULD NEVER LEAK)
INSERT INTO public.food_experiences (
  id, user_id, place_id, category_slug, title, status, visibility, eaten_at,
  overall_rating, place_rating_overall, place_rating_food
) VALUES (
  'd4000000-0000-0000-0000-000000000002',
  'a4000000-0000-0000-0000-000000000003',
  'b4000000-0000-0000-0000-000000000001',
  'restaurant',
  'Private Meal at Paradise',
  'published',
  'public', -- Even with visibility public, private profile makes it private!
  now() - interval '30 minutes',
  7, 7, 7
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.experience_dishes (
  experience_id, dish_id, display_name, position, rating
) VALUES (
  'd4000000-0000-0000-0000-000000000002',
  'c4000000-0000-0000-0000-000000000001',
  'Secret Dish Eating',
  1,
  6
) ON CONFLICT DO NOTHING;

-- Recompute stats
SELECT public.recompute_place_stats('b4000000-0000-0000-0000-000000000001');
SELECT public.recompute_dish_stats('c4000000-0000-0000-0000-000000000001');

--------------------------------------------------------------------------------
-- Tests
--------------------------------------------------------------------------------

-- Test 1: get_place_profile returns valid JSON for canonical place
SELECT isnt(
  public.get_place_profile('b4000000-0000-0000-0000-000000000001'),
  NULL,
  'get_place_profile should return valid json for canonical place'
);

-- Test 2: get_place_profile includes place name and city
SELECT is(
  (public.get_place_profile('b4000000-0000-0000-0000-000000000001')->'place'->>'name'),
  'Paradise Biryani Secunderabad',
  'place profile has correct place name'
);

-- Test 3: get_place_profile redirects merged place to canonical
SELECT is(
  (public.get_place_profile('b4000000-0000-0000-0000-000000000003')->'place'->>'id')::uuid,
  'b4000000-0000-0000-0000-000000000001'::uuid,
  'merged place redirects to canonical place id'
);

-- Test 4: unlisted place returns NULL for stranger
SELECT is(
  public.get_place_profile('b4000000-0000-0000-0000-000000000002', 'a4000000-0000-0000-0000-000000000002'),
  NULL,
  'unlisted place returns NULL to stranger'
);

-- Test 5: unlisted place returns valid json for its creator
SELECT isnt(
  public.get_place_profile('b4000000-0000-0000-0000-000000000002', 'a4000000-0000-0000-0000-000000000001'),
  NULL,
  'unlisted place returns data to creator'
);

-- Test 6: get_place_profile includes 5 dimension stats
SELECT is(
  ((public.get_place_profile('b4000000-0000-0000-0000-000000000001')->'stats'->>'food_quality_count')::int > 0),
  true,
  'place profile includes food quality count > 0'
);

-- Test 7: get_place_profile "What to Order Here" (dishes_logged) contains the mutton biryani
SELECT is(
  (public.get_place_profile('b4000000-0000-0000-0000-000000000001')->'dishes_logged'->0->>'dish_slug'),
  'hyderabadi-dum-mutton-biryani-p4',
  'place profile dishes_logged lists canonical dish'
);

-- Test 8: BUG-03 check: private profile experience is NOT in place recent_experiences
SELECT is(
  jsonb_array_length(public.get_place_profile('b4000000-0000-0000-0000-000000000001')->'recent_experiences'),
  1,
  'recent_experiences has exactly 1 entry (private profile experience excluded)'
);

-- Test 9: get_dish_profile returns valid json for canonical slug
SELECT isnt(
  public.get_dish_profile('hyderabadi-dum-mutton-biryani-p4'),
  NULL,
  'get_dish_profile returns valid json for canonical slug'
);

-- Test 10: get_dish_profile redirects merged dish slug to canonical dish
SELECT is(
  (public.get_dish_profile('old-dum-biryani-alias-p4')->'dish'->>'slug'),
  'hyderabadi-dum-mutton-biryani-p4',
  'merged dish redirects to canonical slug'
);

-- Test 11: unlisted dish returns NULL for stranger
SELECT is(
  public.get_dish_profile('secret-underground-pulao-p4', 'a4000000-0000-0000-0000-000000000002'),
  NULL,
  'unlisted dish returns NULL to stranger'
);

-- Test 12: get_dish_profile includes translations
SELECT is(
  (public.get_dish_profile('hyderabadi-dum-mutton-biryani-p4')->'dish'->'translations'->0->>'name'),
  'హైదరాబాదీ దమ్ మటన్ బిర్యానీ',
  'dish profile includes Telugu translation'
);

-- Test 13: get_dish_profile "Where to Eat This Dish" (places_logged) contains Paradise
SELECT is(
  (public.get_dish_profile('hyderabadi-dum-mutton-biryani-p4')->'places_logged'->0->>'place_name'),
  'Paradise Biryani Secunderabad',
  'dish profile places_logged lists the restaurant venue'
);

-- Test 14: BUG-03 check: private profile experience is NOT in dish recent_experiences
SELECT is(
  jsonb_array_length(public.get_dish_profile('hyderabadi-dum-mutton-biryani-p4')->'recent_experiences'),
  1,
  'dish recent_experiences has exactly 1 entry (private profile excluded)'
);

-- Test 15: get_explore_trending excludes private user entries
SELECT is(
  EXISTS (
    SELECT 1 FROM public.get_explore_trending(20)
    WHERE id = 'd4000000-0000-0000-0000-000000000002'
  ),
  false,
  'get_explore_trending strictly excludes private profile entries'
);

SELECT * FROM finish();
ROLLBACK;
