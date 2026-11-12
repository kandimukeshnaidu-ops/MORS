# Evidence Artifact: EV-601 — Social Experience Upgrade & Curated Taste Discovery

## Metadata
- **Work Package:** Phase 6 (Social Experience Upgrade: Food Community, Feed, Interactions, and Trust)
- **Author:** Antigravity (Advanced Agentic Coding)
- **Date:** 2026-11-12
- **Status:** VERIFIED COMPLETE
- **Target Files:**
  - `supabase/migrations/20261112000039_mors2_phase6_social_experience_upgrade.sql`
  - `supabase/tests/phase6_social.test.sql`
  - `packages/db/src/index.ts`
  - `apps/web/src/app/social/actions.ts`
  - `apps/web/src/app/page.tsx`
  - `apps/web/src/components/ui/ExperienceCard.tsx`
  - `apps/web/src/components/social/PeopleToFollow.tsx`

---

## 1. Problem Statement & Audit Findings
Prior to Phase 6:
1. **N+1 Feed Fetching:** The original `getHomeFeed` server action performed 5 serial roundtrips per feed page (querying experiences, authors, places, dishes, and photos sequentially), creating unnecessary latency and load.
2. **Missing Social Interactions on Experience Cards:** `ExperienceCard` rendered static post content without inline like toggling, comment counts, share buttons, or direct links to full experience discussions.
3. **Cold Start & Social Discovery Gaps:** Suggested profiles relied on a naive count query that failed to account for taste alignment or mutual high-rated dishes, and did not explain why a creator was recommended.
4. **Data Model Dormant Incompatibilities (BUG-08 & BUG-09):** `convert_plan_to_meal_drafts` referenced deprecated column `sort_order` and omitted required `category_slug` and `display_name` on generated dish drafts.

---

## 2. Technical Architecture & Implementation
Migration 39 (`20261112000039_mors2_phase6_social_experience_upgrade.sql`) and frontend upgrades introduced:

1. **Unified Fast Feed RPC (`get_home_feed_v2`):**
   - Keyset-paginated chronological feed ordering (`published_at DESC, id DESC`).
   - Enforces bidirectional block rules via `public.can_view_experience` and explicit block checks.
   - Embeds author profile, place details, dishes, primary photo storage path, `likes_count`, `comments_count`, and `is_liked_by_viewer` in a single transactional query.
   - Strict privacy enforcement: public pool for unauthenticated viewers, followed users + own entries for authenticated viewers.

2. **Taste-Aligned Discovery Engine (`get_taste_aligned_profiles`):**
   - Identifies candidate food lovers sharing mutual high-rated dishes ($\ge 4.0$ stars / $\ge 8$ smallint) and common cuisines.
   - Excludes already followed users, blocked users, private profiles, and accounts pending deletion.
   - Surfaced in the UI with human-readable rationale tags (e.g. `✦ Shared taste in Biryani • 2 mutual favorites`).

3. **Interactive Social Experience Card (`ExperienceCard.tsx`):**
   - Integrated `LikeButton` with optimistic feedback and server-side RPC synchronization.
   - Interactive comment counter linking directly to `/e/[id]#comments`.
   - Native one-click URL sharing with clipboard feedback.
   - Fully backward-compatible props across all app surfaces.

4. **Corrected Group Plan Conversion:**
   - Fixed `convert_plan_to_meal_drafts` to use valid `position` ordering, default `'restaurant'` category slug, and copy dish `name` to required `display_name`.

---

## 3. Verification & Test Evidence

### pgTAP Test Results (`supabase/tests/phase6_social.test.sql`)
16/16 tests passing cleanly:
```
ok 1 - get_suggested_profiles(integer) exists
ok 2 - get_taste_aligned_profiles(integer) exists
ok 3 - get_home_feed_v2(timestamptz, uuid, integer) exists
ok 4 - convert_plan_to_meal_drafts(uuid) exists
ok 5 - User 1 sees exactly 2 feed items (own meal + followed user meal)
ok 6 - Blocked user 4 is strictly excluded from home feed
ok 7 - Unfollowed user 3 is excluded from home following feed
ok 8 - Feed item embeds correct likes_count = 1
ok 9 - Feed item embeds correct comments_count = 1
ok 10 - Feed item embeds correct is_liked_by_viewer = true
ok 11 - Taste-aligned connection surfaces User 3 due to mutual high rating on Social Biryani
ok 12 - Taste-aligned recommendations exclude already followed and blocked users
ok 13 - Plan vote cast successfully by collection owner
ok 14 - Vote recorded as up
ok 15 - Plan conversion generates exactly 2 private meal drafts (1 for owner, 1 for member)
ok 16 - Plan status successfully updated to completed
```

### Static Analysis & Integrity
- `npx pnpm typecheck`: 6/6 tasks passed (0 errors).
- `npx pnpm test`: 67/67 unit tests passed.
- `npx pnpm check:nofake`: 0 violations.
- `npx pnpm check:rls`: 0 violations across 52 tables.
- `npx pnpm check:secrets`: 0 violations.
- `npx pnpm build`: Production build cleanly compiled (27 routes).
