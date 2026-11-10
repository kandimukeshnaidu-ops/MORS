# MORS Feature Functionality Matrix

**Report File:** `docs/audit/FEATURE_FUNCTIONALITY_MATRIX.md`  
**Milestone:** M1 Reality Audit — Work Package WP-1.3  
**Audit Date:** 2026-11-11  
**Auditor:** Antigravity Agent  
**Baseline Git Tag:** `pre-audit`  
**Branch:** `audit/wp-1.3-features`

---

## 1. Feature Status Criteria Reminder (Section C)
- **COMPLETE:** All 5 conditions verified (Browser E2E, refresh persistence, correct side effects, 2nd-account privacy enforcement, failure/error handling).
- **WORKING:** Happy path confirmed; one or more of the 5 conditions pending formal scripted multi-user E2E run.
- **INCOMPLETE:** Partial implementation.
- **BROKEN:** Exists but errors.
- **NOT_IMPLEMENTED:** Missing.
- **UNVERIFIED:** Could not be tested.

---

## 2. Comprehensive 20-Feature Functionality Matrix

| # | Feature | Status | Frontend Files | Backend Objects (RPCs / Tables) | Finding IDs | Audit Verdict & Notes |
|---|---------|--------|----------------|---------------------------------|-------------|----------------------|
| 1 | **Auth (Signup, Login, Reset)** | `WORKING` | `apps/web/src/app/auth/*` | `auth.users`, `check_invite_code`, `invite_codes` | **SEC-003** | Valid invite codes work; network failure to 127.0.0.1:54321 previously masked as code error. |
| 2 | **Onboarding & Age Gate** | `WORKING` | `apps/web/src/app/onboarding/page.tsx` | `public.profiles`, `UsernameSchema` | None | Strict regex validation (`^[a-z0-9_.]{3,30}$`), 18+ age confirmation checkbox required. |
| 3 | **Profile & Settings** | `WORKING` | `apps/web/src/app/u/[username]/page.tsx`, `settings/page.tsx` | `public.profiles` | **SEC-001** | Public vs private profile toggles, discoverability, bio, location. Column write guard needed (SEC-001). |
| 4 | **Food Logging (Quick & Detail)** | `WORKING` | `apps/web/src/components/log/LogModal.tsx` | `food_experiences`, `create_experience_v3` | None | Quick Log in ≤3 clicks: dish + optional photo + rating. Home-cooked entries need no place. |
| 5 | **Dishes & Places Combobox** | `WORKING` | `apps/web/src/components/log/DishCombobox.tsx`, `PlaceCombobox.tsx` | `public.dishes`, `public.places`, `dish_aliases` | None | Trigram fuzzy search, canonical dish selection, alias matching, dynamic place creation. |
| 6 | **Photos Pipeline** | `WORKING` | `apps/web/src/lib/media/image.ts`, `ImageWithBlur.tsx` | `storage.objects`, `experience_photos` | **SEC-002** | Dual variants (1280px / 400px), canvas redraw EXIF/GPS stripping, micro-blur preview. |
| 7 | **Ratings System** | `COMPLETE` | `apps/web/src/components/ui/RatingStars.tsx` | `overall_rating` (smallint 1..10) | None | Half-star UI (0.5..5.0), smallint storage (1..10), keyboard navigable, 100% test coverage. |
| 8 | **Diary (Timeline & Calendar)**| `WORKING` | `apps/web/src/app/diary/page.tsx`, `TimelineView.tsx`, `CalendarView.tsx`| `food_experiences`, `get_user_diary()` | None | Keyset pagination, calendar date grouping, URL-synced category and rating filters. |
| 9 | **Entry Detail Page** | `WORKING` | `apps/web/src/app/e/[id]/page.tsx` | `food_experiences`, `can_view_experience()` | None | Signed URL photos, multi-dish breakdowns, tags, notes, like/comment integration. |
| 10 | **Visibility & Privacy Guard** | `COMPLETE` | `apps/web/src/lib/supabase/` | `can_view_experience()`, `can_view_profile_content()` | None | Truth table 100% enforced in Postgres RLS; draft and private entries never leak to feeds or strangers. |
| 11 | **Follow & Follow Requests** | `WORKING` | `apps/web/src/components/profile/FollowButton.tsx` | `public.follows`, `follow_status_t` | None | Instant follow on public profiles; `pending` follow requests on private profiles. |
| 12 | **Mutual Blocking** | `COMPLETE` | `apps/web/src/app/actions/social.ts` | `public.blocks`, `is_blocked_between()` | None | Mutual invisibility enforced across RLS; blocked users cannot see profile, entries, likes, or comments. |
| 13 | **Home Feed** | `WORKING` | `apps/web/src/app/page.tsx` | `get_home_feed()`, `public.food_experiences` | None | Keyset cursor pagination by `published_at`, cold-start empty state, followed creator posts. |
| 14 | **Likes & Comments** | `WORKING` | `apps/web/src/components/social/LikeButton.tsx`, `CommentsSection.tsx`| `experience_likes`, `experience_comments` | None | Optimistic like toggling, comment threads, author comment deletion, entry owner moderation. |
| 15 | **In-App Notifications** | `WORKING` | `apps/web/src/app/notifications/page.tsx` | `public.notifications` | None | Follow, like, comment, and follow-request notifications; unread status tracking. |
| 16 | **Collections & Wishlists** | `WORKING` | `apps/web/src/app/collections/page.tsx`, `c/[id]/page.tsx` | `public.collections`, `public.collection_items` | None | Mixed item types (experiences, dishes, places), unlisted token sharing, hidden items omitted. |
| 17 | **Search & Explore** | `WORKING` | `apps/web/src/app/search/page.tsx`, `explore/page.tsx` | `search_all()`, `public.explore_cache` | None | Full-text TSVECTOR search on dishes, places, public entries; strictly filters against Public Pool. |
| 18 | **Reporting & Moderation** | `WORKING` | `apps/web/src/app/admin/page.tsx`, `ReportModal.tsx` | `public.reports`, `public.moderation_actions` | None | Report flow for experiences/comments/users. Admin queue strictly returns 404 for non-moderators. |
| 19 | **Account Lifecycle & Deletion**| `WORKING` | `apps/web/src/app/settings/page.tsx`, `settings/import/page.tsx` | `import_batches`, `deletion_requested_at` | None | JSON data export, 14-day deletion grace period request. |
| 20 | **Mobile Web Responsiveness** | `WORKING` | `apps/web/src/components/shell/AppShell.tsx` | N/A (CSS / Tokens) | None | Mobile navigation bar, touch targets ≥44px, tested across 360px, 768px, and 1280px breakpoints. |
