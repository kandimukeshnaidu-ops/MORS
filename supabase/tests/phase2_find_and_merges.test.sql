-- ==============================================================================
-- MORS 2.0 pgTAP Test Suite: phase2_find_and_merges.test.sql
-- Verifies Phase 2 Find Experience (Restaurants & Dishes) and Canonical Merge Fixes (BUG-06)
-- ==============================================================================

BEGIN;
SELECT plan(12);

-- Test Setup Data
CREATE TEMPORARY TABLE p2_test_data (
    admin_id uuid DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
    user_id uuid DEFAULT '00000000-0000-0000-0000-000000000002'::uuid,
    place_src_id uuid DEFAULT gen_random_uuid(),
    place_dst_id uuid DEFAULT gen_random_uuid(),
    dish_src_id uuid DEFAULT gen_random_uuid(),
    dish_dst_id uuid DEFAULT gen_random_uuid(),
    col_id uuid DEFAULT gen_random_uuid(),
    exp_id uuid DEFAULT gen_random_uuid(),
    exp_dish_id uuid DEFAULT gen_random_uuid()
);
GRANT ALL ON p2_test_data TO public;
INSERT INTO p2_test_data DEFAULT VALUES;

-- Make sure admin_id has role = 'admin' for merge execution
UPDATE public.profiles SET role = 'admin' WHERE id = '00000000-0000-0000-0000-000000000001';

-- 1. Create Test Places
INSERT INTO public.places (id, name, normalized_name, address, city, place_type, is_listed, created_by)
SELECT 
    place_src_id, 
    'Old Cafe Paradise', 
    'old cafe paradise', 
    'MG Road, Secunderabad', 
    'Secunderabad', 
    'Cafe', 
    true, 
    admin_id
FROM p2_test_data;

INSERT INTO public.places (id, name, normalized_name, address, city, place_type, is_listed, created_by)
SELECT 
    place_dst_id, 
    'Paradise Restaurant & Cafe', 
    'paradise restaurant cafe', 
    'SD Road, Secunderabad', 
    'Secunderabad', 
    'Restaurant', 
    true, 
    admin_id
FROM p2_test_data;

-- 2. Create Test Dishes
INSERT INTO public.dishes (id, name, normalized_name, slug, cuisine, is_listed, created_by)
SELECT 
    dish_src_id, 
    'Mutton Dum Biryani Special', 
    'mutton dum biryani special', 
    'mutton-dum-biryani-spc-' || substr(gen_random_uuid()::text, 1, 8), 
    'Hyderabadi', 
    true, 
    admin_id
FROM p2_test_data;

INSERT INTO public.dishes (id, name, normalized_name, slug, cuisine, is_listed, created_by)
SELECT 
    dish_dst_id, 
    'Hyderabadi Mutton Biryani', 
    'hyderabadi mutton biryani', 
    'hyd-mutton-biryani-' || substr(gen_random_uuid()::text, 1, 8), 
    'Hyderabadi', 
    true, 
    admin_id
FROM p2_test_data;

-- 3. Create Collection and Collection Items
INSERT INTO public.collections (id, user_id, name, visibility)
SELECT col_id, admin_id, 'Weekend Eats', 'public'
FROM p2_test_data;

INSERT INTO public.collection_items (collection_id, item_type, place_id, position)
SELECT col_id, 'place', place_src_id, 1.0
FROM p2_test_data;

INSERT INTO public.collection_items (collection_id, item_type, dish_id, position)
SELECT col_id, 'dish', dish_src_id, 2.0
FROM p2_test_data;

-- 4. Create Experience and Experience Dish referencing source entities
INSERT INTO public.food_experiences (
    id,
    user_id,
    place_id,
    category_slug,
    overall_rating,
    place_rating_overall,
    place_rating_food,
    status,
    visibility,
    eaten_at,
    published_at
)
SELECT 
    exp_id,
    admin_id,
    place_src_id,
    'restaurant',
    10,
    10,
    10,
    'published',
    'public',
    now(),
    now()
FROM p2_test_data;

INSERT INTO public.experience_dishes (
    id,
    experience_id,
    dish_id,
    display_name,
    rating,
    taste_rating
)
SELECT 
    exp_dish_id,
    exp_id,
    dish_src_id,
    'Special Mutton Biryani Pot',
    10,
    10
FROM p2_test_data;

-- ==============================================================================
-- PART 1: find_restaurants Verification
-- ==============================================================================

-- Test 1: find_restaurants returns matching places by name
SELECT is(
    (SELECT count(*)::integer FROM public.find_restaurants('Paradise', 'Secunderabad', NULL, NULL, 'relevance', 10, 0)),
    2,
    'find_restaurants: locates both Paradise places by name and city'
);

-- Test 2: find_restaurants filters by city
SELECT is(
    (SELECT count(*)::integer FROM public.find_restaurants('Paradise', 'Bengaluru', NULL, NULL, 'relevance', 10, 0)),
    0,
    'find_restaurants: city filter correctly excludes places outside Bengaluru'
);

-- Test 3: find_restaurants includes community statistics
SELECT is(
    (SELECT public_rating_count FROM public.find_restaurants('Old Cafe Paradise', NULL, NULL, NULL, 'relevance', 1, 0)),
    1::bigint,
    'find_restaurants: returns public_rating_count = 1 for rated place'
);

-- ==============================================================================
-- PART 2: find_food_dishes Verification
-- ==============================================================================

-- Test 4: find_food_dishes finds canonical dish
SELECT is(
    (SELECT count(*)::integer FROM public.find_food_dishes('Mutton Biryani', NULL, NULL, 'relevance', 10, 0)),
    2,
    'find_food_dishes: finds both biryani variants by name query'
);

-- Test 5: find_food_dishes returns top places where logged
SELECT is(
    (SELECT jsonb_array_length(top_places) FROM public.find_food_dishes('Mutton Dum Biryani Special', NULL, NULL, 'relevance', 1, 0)),
    1,
    'find_food_dishes: returns top_places array containing logged dining venue'
);

-- Test 6: find_food_dishes filters by cuisine
SELECT is(
    (SELECT count(*)::integer FROM public.find_food_dishes('Mutton Biryani', 'Italian', NULL, 'relevance', 10, 0)),
    0,
    'find_food_dishes: cuisine filter correctly excludes non-matching cuisines'
);

-- ==============================================================================
-- PART 3: BUG-06 Canonical Merges Verification
-- ==============================================================================

SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '00000000-0000-0000-0000-000000000001';

-- Test 7: merge_dishes executes successfully
SELECT is(
    (SELECT public.merge_dishes((SELECT dish_src_id FROM p2_test_data), (SELECT dish_dst_id FROM p2_test_data))),
    true,
    'BUG-06: merge_dishes executes successfully'
);

RESET ROLE;

-- Test 8: Source dish is marked as merged
SELECT is(
    (SELECT merged_into_id FROM public.dishes WHERE id = (SELECT dish_src_id FROM p2_test_data)),
    (SELECT dish_dst_id FROM p2_test_data),
    'BUG-06: Source dish merged_into_id points to target dish'
);

-- Test 9: collection_items re-pointed to target dish
SELECT is(
    (SELECT dish_id FROM public.collection_items WHERE collection_id = (SELECT col_id FROM p2_test_data) AND dish_id IS NOT NULL),
    (SELECT dish_dst_id FROM p2_test_data),
    'BUG-06: collection_items referencing source dish were re-pointed to target dish'
);

-- Test 10: Target dish stats recomputed
SELECT is(
    (SELECT public_rating_count FROM public.dish_public_stats WHERE dish_id = (SELECT dish_dst_id FROM p2_test_data)),
    1,
    'BUG-06: Target dish stats were recomputed to reflect merged experiences'
);

SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '00000000-0000-0000-0000-000000000001';

-- Test 11: merge_places executes successfully
SELECT is(
    (SELECT public.merge_places((SELECT place_src_id FROM p2_test_data), (SELECT place_dst_id FROM p2_test_data))),
    true,
    'BUG-06: merge_places executes successfully'
);

RESET ROLE;

-- Test 12: collection_items re-pointed to target place and place stats recomputed
SELECT is(
    (SELECT place_id FROM public.collection_items WHERE collection_id = (SELECT col_id FROM p2_test_data) AND place_id IS NOT NULL),
    (SELECT place_dst_id FROM p2_test_data),
    'BUG-06: collection_items referencing source place were re-pointed to target place'
);

ROLLBACK;
