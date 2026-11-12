-- ==============================================================================
-- MORS 2.0 pgTAP Test Suite: phase3_regional_rankings.test.sql
-- Verifies Phase 3 Regional Ranking Engine, Bayesian Shrinkage, & Minimum Threshold Gates
-- ==============================================================================

BEGIN;
SELECT plan(12);

-- Test Setup Data
CREATE TEMPORARY TABLE p3_test_data (
    user_pub_id uuid DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
    user_priv_id uuid DEFAULT '00000000-0000-0000-0000-000000000002'::uuid,
    place_big_id uuid DEFAULT gen_random_uuid(),
    place_small_id uuid DEFAULT gen_random_uuid(),
    place_other_city_id uuid DEFAULT gen_random_uuid(),
    dish_big_id uuid DEFAULT gen_random_uuid(),
    dish_small_id uuid DEFAULT gen_random_uuid()
);
GRANT ALL ON p3_test_data TO public;
INSERT INTO p3_test_data DEFAULT VALUES;

-- 1. Create Test Places
-- Place A: Large sample in Hyderabad (to be given many ratings @ 9.0)
INSERT INTO public.places (id, name, normalized_name, address, city, is_listed, created_by)
SELECT place_big_id, 'Grand Hyderabad Biryani House', 'grand hyderabad biryani house', 'Abids', 'Hyderabad', true, user_pub_id
FROM p3_test_data;

-- Place B: Small sample in Hyderabad (to be given 1 rating @ 10.0)
INSERT INTO public.places (id, name, normalized_name, address, city, is_listed, created_by)
SELECT place_small_id, 'Tiny Secret Kiosk', 'tiny secret kiosk', 'Banjara Hills', 'Hyderabad', true, user_pub_id
FROM p3_test_data;

-- Place C: Place in Warangal (other city)
INSERT INTO public.places (id, name, normalized_name, address, city, is_listed, created_by)
SELECT place_other_city_id, 'Warangal Royal Dhaba', 'warangal royal dhaba', 'Hanamkonda', 'Warangal', true, user_pub_id
FROM p3_test_data;

-- 2. Create Test Dishes
INSERT INTO public.dishes (id, name, normalized_name, slug, cuisine, is_listed, created_by)
SELECT dish_big_id, 'Popular Chicken Biryani', 'popular chicken biryani', 'pop-chk-biryani-' || substr(gen_random_uuid()::text, 1, 8), 'Hyderabadi', true, user_pub_id
FROM p3_test_data;

INSERT INTO public.dishes (id, name, normalized_name, slug, cuisine, is_listed, created_by)
SELECT dish_small_id, 'Rare Saffron Phirni', 'rare saffron phirni', 'rare-saffron-phirni-' || substr(gen_random_uuid()::text, 1, 8), 'Dessert', true, user_pub_id
FROM p3_test_data;

-- 3. Insert real experiences to trigger authentic stats computation
-- Place A (Big): 5 reviews with raw avg 9.0, food_quality 9.0
INSERT INTO public.food_experiences (
    id, user_id, place_id, category_slug, overall_rating, place_rating_food, place_rating_overall, status, visibility, eaten_at, published_at
)
SELECT 
    gen_random_uuid(), user_pub_id, place_big_id, 'restaurant', 9, 9, 9, 'published', 'public', now(), now()
FROM p3_test_data, generate_series(1, 5);

-- Dishes for Place A: 5 dishes for dish_big_id (rated 9, taste 9)
INSERT INTO public.experience_dishes (
    id, experience_id, dish_id, display_name, rating, taste_rating
)
SELECT 
    gen_random_uuid(), fe.id, d.dish_big_id, 'Popular Chicken Biryani Plate', 9, 9
FROM (SELECT id FROM public.food_experiences WHERE place_id = (SELECT place_big_id FROM p3_test_data)) fe,
     p3_test_data d;

-- Place B (Small): 1 review with raw avg 10.0, food_quality 10.0
INSERT INTO public.food_experiences (
    id, user_id, place_id, category_slug, overall_rating, place_rating_food, place_rating_overall, status, visibility, eaten_at, published_at
)
SELECT 
    gen_random_uuid(), user_pub_id, place_small_id, 'restaurant', 10, 10, 10, 'published', 'public', now(), now()
FROM p3_test_data;

-- Dish for Place B: 1 dish for dish_small_id (rated 10, taste 10)
INSERT INTO public.experience_dishes (
    id, experience_id, dish_id, display_name, rating, taste_rating
)
SELECT 
    gen_random_uuid(), fe.id, d.dish_small_id, 'Rare Saffron Phirni Bowl', 10, 10
FROM (SELECT id FROM public.food_experiences WHERE place_id = (SELECT place_small_id FROM p3_test_data)) fe,
     p3_test_data d;

-- Place C (Warangal): 3 reviews in Warangal
INSERT INTO public.food_experiences (
    id, user_id, place_id, category_slug, overall_rating, place_rating_food, place_rating_overall, status, visibility, eaten_at, published_at
)
SELECT 
    gen_random_uuid(), user_pub_id, place_other_city_id, 'restaurant', 8, 8, 8, 'published', 'public', now(), now()
FROM p3_test_data, generate_series(1, 3);

-- ==============================================================================
-- PART 1: Regional Prior & Threshold Verifications
-- ==============================================================================

-- Test 1: get_regional_prior_mean returns valid score (>= 1.0)
SELECT ok(
    (SELECT public.get_regional_prior_mean('Hyderabad', 7.0)) >= 1.0,
    'get_regional_prior_mean: returns positive prior mean'
);

-- Test 2: get_regional_restaurant_rankings returns results for Hyderabad
SELECT ok(
    (SELECT count(*) FROM public.get_regional_restaurant_rankings('Hyderabad', NULL, 'overall', 10, 0)) >= 2,
    'get_regional_restaurant_rankings: returns ranked places in Hyderabad'
);

-- Test 3: Bayesian Shrinkage works (Place A with 5 reviews @ 9.0 outranks Place B with 1 review @ 10.0)
SELECT is(
    (SELECT id FROM public.get_regional_restaurant_rankings('Hyderabad', NULL, 'overall', 1, 0)),
    (SELECT place_big_id FROM p3_test_data),
    'Bayesian ranking: 5 reviews @ 9.0 outranks 1 review @ 10.0 due to confidence shrinkage'
);

-- Test 4: Minimum evidence gate (Place A with 5 reviews has is_ranked = true)
SELECT is(
    (SELECT is_ranked FROM public.get_regional_restaurant_rankings('Hyderabad', NULL, 'overall', 10, 0) WHERE id = (SELECT place_big_id FROM p3_test_data)),
    true,
    'Ranking gate: Place with 5 reviews has is_ranked = true (>= 3 threshold)'
);

-- Test 5: Emerging tier (Place B with 1 review has is_ranked = false)
SELECT is(
    (SELECT is_ranked FROM public.get_regional_restaurant_rankings('Hyderabad', NULL, 'overall', 10, 0) WHERE id = (SELECT place_small_id FROM p3_test_data)),
    false,
    'Ranking gate: Place with 1 review has is_ranked = false (emerging tier)'
);

-- Test 6: City filter correctly excludes Warangal places from Hyderabad ranking
SELECT is(
    (SELECT count(*)::integer FROM public.get_regional_restaurant_rankings('Hyderabad', NULL, 'overall', 10, 0) WHERE id = (SELECT place_other_city_id FROM p3_test_data)),
    0,
    'Regional isolation: Warangal place is excluded from Hyderabad rankings'
);

-- Test 7: Warangal ranking returns Warangal place
SELECT is(
    (SELECT count(*)::integer FROM public.get_regional_restaurant_rankings('Warangal', NULL, 'overall', 10, 0) WHERE id = (SELECT place_other_city_id FROM p3_test_data)),
    1,
    'Regional ranking: Warangal place is included in Warangal rankings'
);

-- ==============================================================================
-- PART 2: Regional Dish Rankings
-- ==============================================================================

-- Test 8: get_regional_dish_rankings returns results
SELECT ok(
    (SELECT count(*) FROM public.get_regional_dish_rankings('Hyderabad', NULL, 'overall', 10, 0)) >= 2,
    'get_regional_dish_rankings: returns ranked dishes in Hyderabad'
);

-- Test 9: Dish Bayesian shrinkage (Dish A with 10 ratings @ 9.0 outranks Dish B with 1 rating @ 10.0)
SELECT is(
    (SELECT id FROM public.get_regional_dish_rankings('Hyderabad', NULL, 'overall', 1, 0)),
    (SELECT dish_big_id FROM p3_test_data),
    'Dish Bayesian ranking: 10 ratings @ 9.0 outranks 1 rating @ 10.0'
);

-- Test 10: Dish rankings include top_places context
SELECT ok(
    (SELECT jsonb_array_length(top_places) FROM public.get_regional_dish_rankings('Hyderabad', NULL, 'overall', 10, 0) WHERE id = (SELECT dish_big_id FROM p3_test_data)) >= 1,
    'Dish rankings: surfaces top dining venue where community logged this dish'
);

-- ==============================================================================
-- PART 3: Regional Overview RPC
-- ==============================================================================

-- Test 11: get_regional_overview returns row with city name
SELECT is(
    (SELECT city_name FROM public.get_regional_overview('Hyderabad')),
    'Hyderabad',
    'get_regional_overview: returns row matching queried city'
);

-- Test 12: get_regional_overview returns non-negative counts
SELECT ok(
    (SELECT total_venues >= 0 AND ranked_venues >= 0 FROM public.get_regional_overview('Hyderabad')),
    'get_regional_overview: returns valid counts for total and ranked venues'
);

ROLLBACK;
