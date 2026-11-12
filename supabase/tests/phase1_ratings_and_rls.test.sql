-- ==============================================================================
-- MORS 2.0 pgTAP Test Suite: phase1_ratings_and_rls.test.sql
-- Verifies Phase 1 Rating Architecture, BUG-01, BUG-02, BUG-04, and Stats
-- ==============================================================================

BEGIN;
SELECT plan(15);

-- Test IDs
CREATE TEMPORARY TABLE p1_test_data (
    u1_id uuid DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
    u2_id uuid DEFAULT '00000000-0000-0000-0000-000000000002'::uuid,
    place_unlisted_id uuid DEFAULT gen_random_uuid(),
    place_listed_id uuid DEFAULT gen_random_uuid(),
    dish_unlisted_id uuid DEFAULT gen_random_uuid(),
    dish_listed_id uuid DEFAULT gen_random_uuid(),
    exp_id uuid DEFAULT gen_random_uuid(),
    exp_dish_id uuid DEFAULT gen_random_uuid()
);
GRANT ALL ON p1_test_data TO public;
INSERT INTO p1_test_data DEFAULT VALUES;

-- 1. Create Places (one unlisted by u1, one listed)
INSERT INTO public.places (id, name, normalized_name, address, lat, lng, is_listed, created_by)
SELECT 
    place_unlisted_id, 
    'Secret Cafe', 
    'secret cafe', 
    'Secret Alley, Hyderabad', 
    17.43, 
    78.40, 
    false, 
    u1_id
FROM p1_test_data;

INSERT INTO public.places (id, name, normalized_name, address, lat, lng, is_listed, created_by)
SELECT 
    place_listed_id, 
    'Public Bistro', 
    'public bistro', 
    'Road 36, Hyderabad', 
    17.43, 
    78.40, 
    true, 
    u1_id
FROM p1_test_data;

-- 2. Create Dishes (one unlisted by u1, one listed)
INSERT INTO public.dishes (id, name, normalized_name, slug, is_listed, created_by)
SELECT 
    dish_unlisted_id, 
    'Secret Biryani', 
    'secret biryani', 
    'secret-biryani-' || substr(gen_random_uuid()::text, 1, 8), 
    false, 
    u1_id
FROM p1_test_data;

INSERT INTO public.dishes (id, name, normalized_name, slug, is_listed, created_by)
SELECT 
    dish_listed_id, 
    'Public Haleem', 
    'public haleem', 
    'public-haleem-' || substr(gen_random_uuid()::text, 1, 8), 
    true, 
    u1_id
FROM p1_test_data;

-- ==============================================================================
-- PART 1: BUG-01 Tests (Unlisted places & dishes RLS)
-- ==============================================================================

-- Test 1 & 2: As creator (u1), should see both unlisted and listed places
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '00000000-0000-0000-0000-000000000001';

SELECT is(
    (SELECT count(*)::integer FROM public.places WHERE id = (SELECT place_unlisted_id FROM p1_test_data)),
    1,
    'BUG-01: Creator can see their own unlisted place'
);

SELECT is(
    (SELECT count(*)::integer FROM public.dishes WHERE id = (SELECT dish_unlisted_id FROM p1_test_data)),
    1,
    'BUG-01: Creator can see their own unlisted dish'
);

-- Test 3 & 4: As non-creator (u2), CANNOT see unlisted places or dishes
SET LOCAL "request.jwt.claim.sub" = '00000000-0000-0000-0000-000000000002';

SELECT is(
    (SELECT count(*)::integer FROM public.places WHERE id = (SELECT place_unlisted_id FROM p1_test_data)),
    0,
    'BUG-01: Stranger cannot see an unlisted place created by another user'
);

SELECT is(
    (SELECT count(*)::integer FROM public.dishes WHERE id = (SELECT dish_unlisted_id FROM p1_test_data)),
    0,
    'BUG-01: Stranger cannot see an unlisted dish created by another user'
);

-- Test 5 & 6: As non-creator (u2), CAN see listed places and dishes
SELECT is(
    (SELECT count(*)::integer FROM public.places WHERE id = (SELECT place_listed_id FROM p1_test_data)),
    1,
    'BUG-01: Stranger can see listed place'
);

SELECT is(
    (SELECT count(*)::integer FROM public.dishes WHERE id = (SELECT dish_listed_id FROM p1_test_data)),
    1,
    'BUG-01: Stranger can see listed dish'
);

-- ==============================================================================
-- PART 2: Rating Architecture & Place/Dish Public Stats
-- ==============================================================================
RESET ROLE;

-- Make sure u1 profile is public
UPDATE public.profiles SET is_private = false, discoverable = true WHERE id = '00000000-0000-0000-0000-000000000001';

-- Insert public experience with restaurant sub-ratings by u1
INSERT INTO public.food_experiences (
    id,
    user_id,
    place_id,
    category_slug,
    overall_rating,
    place_rating_food,
    place_rating_value,
    place_rating_ambience,
    place_rating_service,
    place_rating_hygiene,
    place_rating_overall,
    dining_context,
    status,
    visibility,
    eaten_at,
    published_at
)
SELECT 
    exp_id,
    u1_id,
    place_listed_id,
    'restaurant',
    8,  -- overall meal rating (4.0 stars)
    10, -- food quality (5.0)
    8,  -- value (4.0)
    6,  -- ambience (3.0)
    6,  -- service (3.0)
    10, -- hygiene (5.0)
    8,  -- calculated overall restaurant rating
    'dine_in',
    'published',
    'public',
    now(),
    now()
FROM p1_test_data;

-- Insert dish with sub-ratings
INSERT INTO public.experience_dishes (
    id,
    experience_id,
    dish_id,
    display_name,
    rating,
    taste_rating,
    portion_rating,
    value_rating,
    dietary_tag,
    spice_level
)
SELECT 
    exp_dish_id,
    exp_id,
    dish_listed_id,
    'Test Haleem Special',
    9,
    10, -- taste (5.0)
    8,  -- portion (4.0)
    8,  -- value (4.0)
    'non_veg',
    3
FROM p1_test_data;

-- Test 7: Place public stats updated correctly
SELECT is(
    (SELECT public_experience_count FROM public.place_public_stats WHERE place_id = (SELECT place_listed_id FROM p1_test_data)),
    1,
    'Place stats has public_experience_count = 1'
);

-- Test 8: Place dimension averages updated
SELECT is(
    (SELECT food_quality_avg FROM public.place_public_stats WHERE place_id = (SELECT place_listed_id FROM p1_test_data)),
    10.0::numeric(4,2),
    'Place stats food_quality_avg = 10.0'
);

-- Test 9: Dish public stats updated correctly
SELECT is(
    (SELECT public_rating_count FROM public.dish_public_stats WHERE dish_id = (SELECT dish_listed_id FROM p1_test_data)),
    1,
    'Dish stats has public_rating_count = 1'
);

-- Test 10: Dish taste average updated
SELECT is(
    (SELECT taste_avg FROM public.dish_public_stats WHERE dish_id = (SELECT dish_listed_id FROM p1_test_data)),
    10.0::numeric(4,2),
    'Dish stats taste_avg = 10.0'
);

-- ==============================================================================
-- PART 3: BUG-02 Tests (Profile privacy change cascade)
-- ==============================================================================

-- When u1 sets their profile to private, their ratings must leave the public pool immediately!
UPDATE public.profiles SET is_private = true WHERE id = '00000000-0000-0000-0000-000000000001';

-- Test 11: Place stats dropped to 0
SELECT is(
    (SELECT public_experience_count FROM public.place_public_stats WHERE place_id = (SELECT place_listed_id FROM p1_test_data)),
    0,
    'BUG-02: Setting profile to private immediately clears entry from place_public_stats'
);

-- Test 12: Dish stats dropped to 0
SELECT is(
    (SELECT public_rating_count FROM public.dish_public_stats WHERE dish_id = (SELECT dish_listed_id FROM p1_test_data)),
    0,
    'BUG-02: Setting profile to private immediately clears entry from dish_public_stats'
);

-- When u1 restores their profile to public, their ratings must return to the public pool!
UPDATE public.profiles SET is_private = false WHERE id = '00000000-0000-0000-0000-000000000001';

-- Test 13: Place stats restored to 1
SELECT is(
    (SELECT public_experience_count FROM public.place_public_stats WHERE place_id = (SELECT place_listed_id FROM p1_test_data)),
    1,
    'BUG-02: Setting profile back to public immediately restores entry in place_public_stats'
);

-- Test 14: Dish stats restored to 1
SELECT is(
    (SELECT public_rating_count FROM public.dish_public_stats WHERE dish_id = (SELECT dish_listed_id FROM p1_test_data)),
    1,
    'BUG-02: Setting profile back to public immediately restores entry in dish_public_stats'
);

-- ==============================================================================
-- PART 4: BUG-04 Tests (recompute_user_stats execution)
-- ==============================================================================

-- Test 15: recompute_user_stats executes without error and updates stats
SELECT lives_ok(
    'SELECT recompute_user_stats(''00000000-0000-0000-0000-000000000001''::uuid)',
    'BUG-04: recompute_user_stats runs smoothly without column or type errors'
);

ROLLBACK;
