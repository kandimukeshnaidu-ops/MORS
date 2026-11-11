-- ==============================================================================
-- MORS Audit Fixtures: supabase/audit_fixtures.sql
-- Work Package WP-0.2: Deterministic test users, truth-table entries & bulk generator
-- ==============================================================================

-- 1. Deterministic Auth Users (auth.users)
-- Passwords all default to 'MorsTastePassword2026!'
-- Salt/hash using pgcrypto crypt() for local/testing compatibility
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
) VALUES
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'owner_public@mors.food', extensions.crypt('MorsTastePassword2026!', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"displayName":"Public Owner","invite_code":"HYDERABAD-BETA-2026"}', now(), now(), ('authenticated', 'authenticated', '', '', '', '')),
    ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'owner_private@mors.food', extensions.crypt('MorsTastePassword2026!', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"displayName":"Private Owner","invite_code":"HYDERABAD-BETA-2026"}', now(), now(), ('authenticated', 'authenticated', '', '', '', '')),
    ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'follower_accepted@mors.food', extensions.crypt('MorsTastePassword2026!', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"displayName":"Accepted Follower","invite_code":"HYDERABAD-BETA-2026"}', now(), now(), ('authenticated', 'authenticated', '', '', '', '')),
    ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'follower_pending@mors.food', extensions.crypt('MorsTastePassword2026!', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"displayName":"Pending Follower","invite_code":"HYDERABAD-BETA-2026"}', now(), now(), ('authenticated', 'authenticated', '', '', '', '')),
    ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'stranger@mors.food', extensions.crypt('MorsTastePassword2026!', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"displayName":"Stranger User","invite_code":"HYDERABAD-BETA-2026"}', now(), now(), ('authenticated', 'authenticated', '', '', '', '')),
    ('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'blocked_by_owner@mors.food', extensions.crypt('MorsTastePassword2026!', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"displayName":"Blocked User","invite_code":"HYDERABAD-BETA-2026"}', now(), now(), ('authenticated', 'authenticated', '', '', '', '')),
    ('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000000', 'blocker_of_owner@mors.food', extensions.crypt('MorsTastePassword2026!', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"displayName":"Blocker User","invite_code":"HYDERABAD-BETA-2026"}', now(), now(), ('authenticated', 'authenticated', '', '', '', ''))
ON CONFLICT (id) DO NOTHING;

-- 2. Deterministic Profiles (public.profiles)
INSERT INTO public.profiles (
    id,
    username,
    display_name,
    bio,
    location_text,
    is_private,
    default_visibility,
    discoverable,
    role,
    onboarding_completed_at
) VALUES
    ('00000000-0000-0000-0000-000000000001', 'owner_public', 'Public Owner', 'Curator with a public journal in Hyderabad', 'Jubilee Hills, Hyderabad', false, 'public', true, 'user', now()),
    ('00000000-0000-0000-0000-000000000002', 'owner_private', 'Private Owner', 'Private journal keeper', 'Banjara Hills, Hyderabad', true, 'followers', false, 'user', now()),
    ('00000000-0000-0000-0000-000000000003', 'follower_accepted', 'Accepted Follower', 'Approved follower of owner accounts', 'Secunderabad', false, 'public', true, 'user', now()),
    ('00000000-0000-0000-0000-000000000004', 'follower_pending', 'Pending Follower', 'Awaiting approval', 'Madhapur, Hyderabad', false, 'public', true, 'user', now()),
    ('00000000-0000-0000-0000-000000000005', 'stranger', 'Stranger Persona', 'No relationship to owners', 'Gachibowli, Hyderabad', false, 'public', true, 'user', now()),
    ('00000000-0000-0000-0000-000000000006', 'blocked_by_owner', 'Blocked By Owner', 'Cannot view owner content', 'Kondapur, Hyderabad', false, 'public', true, 'user', now()),
    ('00000000-0000-0000-0000-000000000007', 'blocker_of_owner', 'Blocker Of Owner', 'Blocks owner explicitly', 'Begumpet, Hyderabad', false, 'public', true, 'user', now())
ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    display_name = EXCLUDED.display_name,
    is_private = EXCLUDED.is_private,
    default_visibility = EXCLUDED.default_visibility;

-- 3. Social Relations: Follows & Blocks
INSERT INTO public.follows (follower_id, following_id, status) VALUES
    -- Accepted follows
    ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'accepted'),
    ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'accepted'),
    -- Pending follow
    ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 'pending')
ON CONFLICT DO NOTHING;

INSERT INTO public.blocks (blocker_id, blocked_id) VALUES
    -- owner_public blocks blocked_by_owner
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000006'),
    -- blocker_of_owner blocks owner_public
    ('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- 4. Truth-Table Seed Entries
-- Each entry includes unique searchable keywords
INSERT INTO public.food_experiences (
    id,
    user_id,
    title,
    category_slug,
    status,
    visibility,
    overall_rating,
    description,
    place_id,
    price_amount,
    cuisine,
    tags,
    published_at
) VALUES
    -- Public owner entries
    ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', 'Royal Biryani Feast xyzw_public_dum_biryani', 'restaurant', 'published', 'public', 9, 'Classic dum cooking with rich spices xyzw_public_dum_biryani', '00000000-0000-0000-0000-000000000101', 450.00, 'Hyderabadi', '{"biryani","dinner"}', now() - interval '2 days'),
    ('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000001', 'Followers Only Haleem xyzw_followers_only_haleem', 'street_food', 'published', 'followers', 8, 'Rich velvety mutton stew xyzw_followers_only_haleem', '00000000-0000-0000-0000-000000000106', 280.00, 'Hyderabadi', '{"haleem","ramzan"}', now() - interval '1 day'),
    ('00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0000-000000000001', 'Secret Private Dosa xyzw_secret_private_dosa', 'home_cooked', 'published', 'private', 10, 'Crispy homemade fermented crepe xyzw_secret_private_dosa', NULL, 0.00, 'South Indian', '{"homemade","breakfast"}', now() - interval '4 hours'),
    ('00000000-0000-0000-0001-000000000004', '00000000-0000-0000-0000-000000000001', 'Draft Irani Chai xyzw_unpublished_draft_chai', 'cafe_beverage', 'draft', 'public', 7, 'Dum-boiled sweet milky tea xyzw_unpublished_draft_chai', '00000000-0000-0000-0000-000000000103', 30.00, 'Hyderabadi', '{"chai","evening"}', NULL),

    -- Private owner entries (all effective followers-only or private)
    ('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0000-000000000002', 'Private Owner Public Entry xyzw_privowner_public', 'restaurant', 'published', 'public', 8, 'Should be restricted by private profile to followers xyzw_privowner_public', '00000000-0000-0000-0000-000000000102', 390.00, 'Hyderabadi', '{"bawarchi"}', now() - interval '3 days'),
    ('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0000-000000000002', 'Private Owner Followers Entry xyzw_privowner_followers', 'street_food', 'published', 'followers', 9, 'Visible only to accepted follower xyzw_privowner_followers', '00000000-0000-0000-0000-000000000108', 120.00, 'Street Food', '{"dosa"}', now() - interval '2 days'),
    ('00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0000-000000000002', 'Private Owner Strictly Private xyzw_privowner_secret', 'home_cooked', 'published', 'private', 10, 'Strictly owner only xyzw_privowner_secret', NULL, 0.00, 'Home Cooked', '{"secret"}', now() - interval '1 day'),

    -- Special Fixture: Multi-Dish Entry
    ('00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0000-000000000001', 'Three Course Hyderabad Lunch xyzw_multidish_meal', 'restaurant', 'published', 'public', 9, 'Tasting menu across multiple courses xyzw_multidish_meal', '00000000-0000-0000-0000-000000000101', 750.00, 'Hyderabadi', '{"lunch","multidish"}', now() - interval '5 days'),

    -- Special Fixture: GPS-Tagged Entry
    ('00000000-0000-0000-0004-000000000001', '00000000-0000-0000-0000-000000000001', 'Charminar Photo Run xyzw_gpstagged_entry', 'cafe_beverage', 'published', 'public', 8, 'Entry with GPS EXIF test photo xyzw_gpstagged_entry', '00000000-0000-0000-0000-000000000104', 45.00, 'Bakery', '{"charminar"}', now() - interval '6 days')
ON CONFLICT (id) DO NOTHING;

-- 5. Dishes for Multi-Dish Entry
INSERT INTO public.experience_dishes (id, experience_id, dish_id, display_name, position, rating, note) VALUES
    ('00000000-0000-0000-0003-000000000011', '00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0000-000000000201', 'Hyderabadi Mutton Dum Biryani', 1, 9, 'Tender and aromatic'),
    ('00000000-0000-0000-0003-000000000012', '00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0000-000000000204', 'Mirchi Ka Salan', 2, 8, 'Tangy and nutty'),
    ('00000000-0000-0000-0003-000000000013', '00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0000-000000000205', 'Double Ka Meetha', 3, 10, 'Rich dessert')
ON CONFLICT (id) DO NOTHING;

-- 6. Photos (including GPS-tagged test reference)
INSERT INTO public.experience_photos (id, experience_id, storage_path, width, height, blurhash, alt_text, position) VALUES
    ('00000000-0000-0000-0004-000000000021', '00000000-0000-0000-0004-000000000001', 'audit/gps_tagged_sample.jpg', 1280, 720, 'L6PZfSi_.AyE_3t7t7R**0o#DgR4', 'Irani chai and biscuit near Charminar with GPS metadata', 1)
ON CONFLICT (id) DO NOTHING;

-- 7. Mixed Collection (Public + Private entries + Dishes + Places)
INSERT INTO public.collections (
    id,
    user_id,
    name,
    description,
    visibility,
    share_token
) VALUES
    ('00000000-0000-0000-0005-000000000001', '00000000-0000-0000-0000-000000000001', 'Hyderabad Greatest Bites', 'Mix of visible and hidden gems', 'public', 'token_hyd_greatest_bites')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.collection_items (collection_id, item_type, experience_id, dish_id, place_id, position) VALUES
    -- Visible public experience
    ('00000000-0000-0000-0005-000000000001', 'experience', '00000000-0000-0000-0001-000000000001', NULL, NULL, 1.0),
    -- Hidden private experience (must NOT leak to strangers)
    ('00000000-0000-0000-0005-000000000001', 'experience', '00000000-0000-0000-0001-000000000003', NULL, NULL, 2.0),
    -- Dish reference
    ('00000000-0000-0000-0005-000000000001', 'dish', NULL, '00000000-0000-0000-0000-000000000201', NULL, 3.0),
    -- Place reference
    ('00000000-0000-0000-0005-000000000001', 'place', NULL, NULL, '00000000-0000-0000-0000-000000000101', 4.0)
ON CONFLICT DO NOTHING;

-- 8. Bulk Entry Generator Procedure (~1,000 entries)
CREATE OR REPLACE FUNCTION public.generate_bulk_entries(
    p_user_id uuid,
    p_count integer DEFAULT 1000
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    i integer;
    v_categories text[] := ARRAY['restaurant', 'street_food', 'home_cooked', 'cafe_beverage'];
    v_visibilities text[] := ARRAY['public', 'followers', 'private'];
    v_now timestamptz := now();
BEGIN
    FOR i IN 1..p_count LOOP
        INSERT INTO public.food_experiences (
            user_id,
            title,
            category_slug,
            eaten_at,
            published_at,
            status,
            visibility,
            overall_rating,
            description,
            price_amount,
            cuisine,
            tags
        ) VALUES (
            p_user_id,
            'Bulk Taste Entry #' || i,
            v_categories[1 + (i % array_length(v_categories, 1))],
            v_now - (i || ' hours')::interval,
            v_now - (i || ' hours')::interval,
            'published'::public.experience_status_t,
            (v_visibilities[1 + (i % array_length(v_visibilities, 1))])::public.visibility_t,
            1 + (i % 10),
            'Automated performance test food log #' || i,
            (50 + (i % 500))::numeric,
            'Hyderabadi',
            ARRAY['bulk', 'test_tag_' || (i % 20)]
        );
    END LOOP;

    RETURN p_count;
END;
$$;


