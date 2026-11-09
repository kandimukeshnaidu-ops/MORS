-- ==============================================================================
-- MORS pgTAP Test Suite: 01_authorization_truth_table.sql
-- Enforces Section 4 Authorization Model:
-- Truth table: viewer in {owner, accepted follower, pending follower, non-follower, blocked either way, anonymous}
--              x entry in {public, followers, private, draft}
--              x profile in {public, private}
-- Total cells = 48 explicit assertions
-- ==============================================================================

BEGIN;
SELECT plan(48);

-- Setup test personas
CREATE TEMPORARY TABLE test_users (
  role text PRIMARY KEY,
  id uuid DEFAULT gen_random_uuid()
);

INSERT INTO test_users (role) VALUES
  ('owner_pub'),
  ('owner_priv'),
  ('accepted_follower'),
  ('pending_follower'),
  ('non_follower'),
  ('blocked_by_owner'),
  ('who_blocked_owner');

-- Mock auth.users and profiles
INSERT INTO public.profiles (id, username, is_private, default_visibility)
SELECT id, ('user_' || role)::extensions.citext, (role = 'owner_priv'), 'public'::public.visibility_t
FROM test_users;

-- Setup Follows
-- 1. accepted follower follows both owners
INSERT INTO public.follows (follower_id, following_id, status)
SELECT u1.id, u2.id, 'accepted'::public.follow_status_t
FROM test_users u1, test_users u2
WHERE u1.role = 'accepted_follower' AND u2.role IN ('owner_pub', 'owner_priv');

-- 2. pending follower follows both owners
INSERT INTO public.follows (follower_id, following_id, status)
SELECT u1.id, u2.id, 'pending'::public.follow_status_t
FROM test_users u1, test_users u2
WHERE u1.role = 'pending_follower' AND u2.role IN ('owner_pub', 'owner_priv');

-- Setup Blocks
-- 3. owner_pub blocks 'blocked_by_owner'
INSERT INTO public.blocks (blocker_id, blocked_id)
SELECT u1.id, u2.id
FROM test_users u1, test_users u2
WHERE u1.role = 'owner_pub' AND u2.role = 'blocked_by_owner';

-- 4. 'who_blocked_owner' blocks owner_pub
INSERT INTO public.blocks (blocker_id, blocked_id)
SELECT u1.id, u2.id
FROM test_users u1, test_users u2
WHERE u1.role = 'who_blocked_owner' AND u2.role = 'owner_pub';

-- Setup Experiences for owner_pub (Public Profile)
INSERT INTO public.food_experiences (id, user_id, category_slug, status, visibility, eaten_at, published_at)
VALUES
  ('11111111-0000-0000-0000-000000000001', (SELECT id FROM test_users WHERE role = 'owner_pub'), 'restaurant', 'published', 'public', now(), now()),
  ('11111111-0000-0000-0000-000000000002', (SELECT id FROM test_users WHERE role = 'owner_pub'), 'restaurant', 'published', 'followers', now(), now()),
  ('11111111-0000-0000-0000-000000000003', (SELECT id FROM test_users WHERE role = 'owner_pub'), 'restaurant', 'published', 'private', now(), now()),
  ('11111111-0000-0000-0000-000000000004', (SELECT id FROM test_users WHERE role = 'owner_pub'), 'restaurant', 'draft', 'public', now(), NULL);

-- Setup Experiences for owner_priv (Private Profile)
INSERT INTO public.food_experiences (id, user_id, category_slug, status, visibility, eaten_at, published_at)
VALUES
  ('22222222-0000-0000-0000-000000000001', (SELECT id FROM test_users WHERE role = 'owner_priv'), 'restaurant', 'published', 'public', now(), now()),
  ('22222222-0000-0000-0000-000000000002', (SELECT id FROM test_users WHERE role = 'owner_priv'), 'restaurant', 'published', 'followers', now(), now()),
  ('22222222-0000-0000-0000-000000000003', (SELECT id FROM test_users WHERE role = 'owner_priv'), 'restaurant', 'published', 'private', now(), now()),
  ('22222222-0000-0000-0000-000000000004', (SELECT id FROM test_users WHERE role = 'owner_priv'), 'restaurant', 'draft', 'public', now(), NULL);

-- -----------------------------------------------------------------------------
-- 1. OWNER VIEW TESTS (8 assertions)
-- -----------------------------------------------------------------------------
SELECT is(public.can_view_experience((SELECT id FROM test_users WHERE role = 'owner_pub'), '11111111-0000-0000-0000-000000000001'), true, 'Owner can view own public entry');
SELECT is(public.can_view_experience((SELECT id FROM test_users WHERE role = 'owner_pub'), '11111111-0000-0000-0000-000000000002'), true, 'Owner can view own followers-only entry');
SELECT is(public.can_view_experience((SELECT id FROM test_users WHERE role = 'owner_pub'), '11111111-0000-0000-0000-000000000003'), true, 'Owner can view own private entry');
SELECT is(public.can_view_experience((SELECT id FROM test_users WHERE role = 'owner_pub'), '11111111-0000-0000-0000-000000000004'), true, 'Owner can view own draft entry');

SELECT is(public.can_view_experience((SELECT id FROM test_users WHERE role = 'owner_priv'), '22222222-0000-0000-0000-000000000001'), true, 'Private owner can view own public entry');
SELECT is(public.can_view_experience((SELECT id FROM test_users WHERE role = 'owner_priv'), '22222222-0000-0000-0000-000000000002'), true, 'Private owner can view own followers-only entry');
SELECT is(public.can_view_experience((SELECT id FROM test_users WHERE role = 'owner_priv'), '22222222-0000-0000-0000-000000000003'), true, 'Private owner can view own private entry');
SELECT is(public.can_view_experience((SELECT id FROM test_users WHERE role = 'owner_priv'), '22222222-0000-0000-0000-000000000004'), true, 'Private owner can view own draft entry');

-- -----------------------------------------------------------------------------
-- 2. ACCEPTED FOLLOWER TESTS (8 assertions)
-- -----------------------------------------------------------------------------
SELECT is(public.can_view_experience((SELECT id FROM test_users WHERE role = 'accepted_follower'), '11111111-0000-0000-0000-000000000001'), true, 'Accepted follower sees public entry on public profile');
SELECT is(public.can_view_experience((SELECT id FROM test_users WHERE role = 'accepted_follower'), '11111111-0000-0000-0000-000000000002'), true, 'Accepted follower sees followers entry on public profile');
SELECT is(public.can_view_experience((SELECT id FROM test_users WHERE role = 'accepted_follower'), '11111111-0000-0000-0000-000000000003'), false, 'Accepted follower CANNOT see private entry on public profile');
SELECT is(public.can_view_experience((SELECT id FROM test_users WHERE role = 'accepted_follower'), '11111111-0000-0000-0000-000000000004'), false, 'Accepted follower CANNOT see draft on public profile');

SELECT is(public.can_view_experience((SELECT id FROM test_users WHERE role = 'accepted_follower'), '22222222-0000-0000-0000-000000000001'), true, 'Accepted follower sees public entry on private profile');
SELECT is(public.can_view_experience((SELECT id FROM test_users WHERE role = 'accepted_follower'), '22222222-0000-0000-0000-000000000002'), true, 'Accepted follower sees followers entry on private profile');
SELECT is(public.can_view_experience((SELECT id FROM test_users WHERE role = 'accepted_follower'), '22222222-0000-0000-0000-000000000003'), false, 'Accepted follower CANNOT see private entry on private profile');
SELECT is(public.can_view_experience((SELECT id FROM test_users WHERE role = 'accepted_follower'), '22222222-0000-0000-0000-000000000004'), false, 'Accepted follower CANNOT see draft on private profile');

-- -----------------------------------------------------------------------------
-- 3. PENDING FOLLOWER TESTS (8 assertions)
-- -----------------------------------------------------------------------------
SELECT is(public.can_view_experience((SELECT id FROM test_users WHERE role = 'pending_follower'), '11111111-0000-0000-0000-000000000001'), true, 'Pending follower sees public entry on public profile');
SELECT is(public.can_view_experience((SELECT id FROM test_users WHERE role = 'pending_follower'), '11111111-0000-0000-0000-000000000002'), false, 'Pending follower CANNOT see followers entry on public profile');
SELECT is(public.can_view_experience((SELECT id FROM test_users WHERE role = 'pending_follower'), '11111111-0000-0000-0000-000000000003'), false, 'Pending follower CANNOT see private entry on public profile');
SELECT is(public.can_view_experience((SELECT id FROM test_users WHERE role = 'pending_follower'), '11111111-0000-0000-0000-000000000004'), false, 'Pending follower CANNOT see draft on public profile');

SELECT is(public.can_view_experience((SELECT id FROM test_users WHERE role = 'pending_follower'), '22222222-0000-0000-0000-000000000001'), false, 'Pending follower CANNOT see public entry on private profile');
SELECT is(public.can_view_experience((SELECT id FROM test_users WHERE role = 'pending_follower'), '22222222-0000-0000-0000-000000000002'), false, 'Pending follower CANNOT see followers entry on private profile');
SELECT is(public.can_view_experience((SELECT id FROM test_users WHERE role = 'pending_follower'), '22222222-0000-0000-0000-000000000003'), false, 'Pending follower CANNOT see private entry on private profile');
SELECT is(public.can_view_experience((SELECT id FROM test_users WHERE role = 'pending_follower'), '22222222-0000-0000-0000-000000000004'), false, 'Pending follower CANNOT see draft on private profile');

-- -----------------------------------------------------------------------------
-- 4. NON-FOLLOWER TESTS (8 assertions)
-- -----------------------------------------------------------------------------
SELECT is(public.can_view_experience((SELECT id FROM test_users WHERE role = 'non_follower'), '11111111-0000-0000-0000-000000000001'), true, 'Non-follower sees public entry on public profile');
SELECT is(public.can_view_experience((SELECT id FROM test_users WHERE role = 'non_follower'), '11111111-0000-0000-0000-000000000002'), false, 'Non-follower CANNOT see followers entry on public profile');
SELECT is(public.can_view_experience((SELECT id FROM test_users WHERE role = 'non_follower'), '11111111-0000-0000-0000-000000000003'), false, 'Non-follower CANNOT see private entry on public profile');
SELECT is(public.can_view_experience((SELECT id FROM test_users WHERE role = 'non_follower'), '11111111-0000-0000-0000-000000000004'), false, 'Non-follower CANNOT see draft on public profile');

SELECT is(public.can_view_experience((SELECT id FROM test_users WHERE role = 'non_follower'), '22222222-0000-0000-0000-000000000001'), false, 'Non-follower CANNOT see public entry on private profile');
SELECT is(public.can_view_experience((SELECT id FROM test_users WHERE role = 'non_follower'), '22222222-0000-0000-0000-000000000002'), false, 'Non-follower CANNOT see followers entry on private profile');
SELECT is(public.can_view_experience((SELECT id FROM test_users WHERE role = 'non_follower'), '22222222-0000-0000-0000-000000000003'), false, 'Non-follower CANNOT see private entry on private profile');
SELECT is(public.can_view_experience((SELECT id FROM test_users WHERE role = 'non_follower'), '22222222-0000-0000-0000-000000000004'), false, 'Non-follower CANNOT see draft on private profile');

-- -----------------------------------------------------------------------------
-- 5. BLOCKED USER TESTS (8 assertions)
-- -----------------------------------------------------------------------------
SELECT is(public.can_view_experience((SELECT id FROM test_users WHERE role = 'blocked_by_owner'), '11111111-0000-0000-0000-000000000001'), false, 'Blocked user CANNOT see public entry');
SELECT is(public.can_view_experience((SELECT id FROM test_users WHERE role = 'blocked_by_owner'), '11111111-0000-0000-0000-000000000002'), false, 'Blocked user CANNOT see followers entry');
SELECT is(public.can_view_experience((SELECT id FROM test_users WHERE role = 'blocked_by_owner'), '11111111-0000-0000-0000-000000000003'), false, 'Blocked user CANNOT see private entry');
SELECT is(public.can_view_experience((SELECT id FROM test_users WHERE role = 'blocked_by_owner'), '11111111-0000-0000-0000-000000000004'), false, 'Blocked user CANNOT see draft');

SELECT is(public.can_view_experience((SELECT id FROM test_users WHERE role = 'who_blocked_owner'), '11111111-0000-0000-0000-000000000001'), false, 'User who blocked owner CANNOT see public entry');
SELECT is(public.can_view_experience((SELECT id FROM test_users WHERE role = 'who_blocked_owner'), '11111111-0000-0000-0000-000000000002'), false, 'User who blocked owner CANNOT see followers entry');
SELECT is(public.can_view_experience((SELECT id FROM test_users WHERE role = 'who_blocked_owner'), '11111111-0000-0000-0000-000000000003'), false, 'User who blocked owner CANNOT see private entry');
SELECT is(public.can_view_experience((SELECT id FROM test_users WHERE role = 'who_blocked_owner'), '11111111-0000-0000-0000-000000000004'), false, 'User who blocked owner CANNOT see draft');

-- -----------------------------------------------------------------------------
-- 6. ANONYMOUS USER TESTS (8 assertions)
-- -----------------------------------------------------------------------------
SELECT is(public.can_view_experience(NULL, '11111111-0000-0000-0000-000000000001'), true, 'Anonymous sees public entry on public profile');
SELECT is(public.can_view_experience(NULL, '11111111-0000-0000-0000-000000000002'), false, 'Anonymous CANNOT see followers entry on public profile');
SELECT is(public.can_view_experience(NULL, '11111111-0000-0000-0000-000000000003'), false, 'Anonymous CANNOT see private entry on public profile');
SELECT is(public.can_view_experience(NULL, '11111111-0000-0000-0000-000000000004'), false, 'Anonymous CANNOT see draft on public profile');

SELECT is(public.can_view_experience(NULL, '22222222-0000-0000-0000-000000000001'), false, 'Anonymous CANNOT see public entry on private profile');
SELECT is(public.can_view_experience(NULL, '22222222-0000-0000-0000-000000000002'), false, 'Anonymous CANNOT see followers entry on private profile');
SELECT is(public.can_view_experience(NULL, '22222222-0000-0000-0000-000000000003'), false, 'Anonymous CANNOT see private entry on private profile');
SELECT is(public.can_view_experience(NULL, '22222222-0000-0000-0000-000000000004'), false, 'Anonymous CANNOT see draft on private profile');

SELECT * FROM finish();
ROLLBACK;
