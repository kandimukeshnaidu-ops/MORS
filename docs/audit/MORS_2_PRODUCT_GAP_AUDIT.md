# MORS 2.0 — Product Specification & Repository Reality Gap Audit

- **Audit Phase:** Phase 0 — Product Specification & Repository Reality Audit
- **Git Commit SHA:** `dd12d32ecf7c3ce51a3853bc54e89642f949c47e`
- **Timestamp:** `2026-11-12T00:22:00+05:30`
- **Primary Reference Brief:** [MORS_Phase_0_Antigravity_Audit_Brief.md](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/2.0/MORS_Phase_0_Antigravity_Audit_Brief.md)
- **Supporting Audit Documents:**
  - [MORS_2_DATA_MODEL_AUDIT.md](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/audit/MORS_2_DATA_MODEL_AUDIT.md)
  - [MORS_2_UX_AUDIT.md](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/audit/MORS_2_UX_AUDIT.md)
  - [MORS_2_IMPLEMENTATION_SEQUENCE.md](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/audit/MORS_2_IMPLEMENTATION_SEQUENCE.md)
  - [MORS_MASTER_EXECUTION_TRACKER.md](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/MORS_MASTER_EXECUTION_TRACKER.md)
- **Evidence Files:**
  - [EV-001: Repository & Test Baseline](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/evidence/phase-0/EV-001-repo-and-test-baseline.md)
  - [EV-002: Live PostgreSQL Schema & RLS Inventory](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/evidence/phase-0/EV-002-schema-and-rls-inventory.md)
  - [EV-003: Rating, Search & Privacy Trace](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/evidence/phase-0/EV-003-rating-search-and-privacy-trace.md)

---

## 1. Executive Summary

MORS v1/v3 (Phases 00–31) has been built as a functional, privacy-hardened **social food journal** with a clean Next.js 15 App Router frontend, 51 RLS-enabled PostgreSQL tables across 33 migrations, keyset-paginated feeds/diaries, client-side EXIF-stripped photo compression, canonical dish/place entities, and passing baseline verification (`51/51` unit tests, `4/4` typechecks, `0` fake controls, `0` secret leaks — [EV-001](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/evidence/phase-0/EV-001-repo-and-test-baseline.md)).

However, evaluating the repository against the **MORS 2.0** product direction (*Social Food Journal + Community-Powered Restaurant and Dish Discovery Platform for Hyderabad Beta*) reveals **4 foundational gaps** and **8 concrete technical/security defects**:

1. **Product Specification Conflict:** [AGENTS.md](file:///c:/Users/mukes/OneDrive/Desktop/MORS/AGENTS.md#L6) explicitly states *"It is NOT a ... restaurant-review site"* and [docs/DECISIONS.md](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/DECISIONS.md#L27-L29) Decision #7 omits restaurant review structures. MORS 2.0 intentionally adds structured restaurant reviews, dish-at-restaurant rankings, and dual-intent discovery (`Find Food` vs. `Find Restaurants`) while preserving the personal food journal and home-cooked first-class status.
2. **Conflated Single-Number Ratings:** `public.food_experiences.overall_rating` (`1..10`) is used both as the user's personal meal experience rating and as the sole input to `place_public_stats.public_rating_avg` ([EV-003](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/evidence/phase-0/EV-003-rating-search-and-privacy-trace.md)). Neither 5-dimension restaurant ratings (`food_quality`, `value_for_money`, `ambience`, `service`, `hygiene`) nor 3-dimension dish sub-ratings (`taste`, `portion`, `value`) exist.
3. **Missing Dish-at-Restaurant (`place_dish_public_stats`) Architecture:** There is no aggregate or query layer connecting a canonical dish (`dishes.id`) to a specific restaurant (`places.id`). Consequently, `/dish/[slug]` cannot rank which restaurants in Hyderabad serve the best version of a dish, and `/place/[id]` cannot rank which dishes are best to order at that restaurant ([MORS_2_DATA_MODEL_AUDIT.md](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/audit/MORS_2_DATA_MODEL_AUDIT.md)).
4. **Critical RLS & Public-Pool Integrity Defects Discovered:**
   - `public.dishes` and `public.places` have `FOR SELECT USING (true)` RLS policies, exposing `is_listed = false` rows and `created_by` to all clients ([EV-002](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/evidence/phase-0/EV-002-schema-and-rls-inventory.md)).
   - `public.profiles` has no `AFTER UPDATE` trigger to recompute `dish_public_stats` and `place_public_stats` when a user switches `is_private = true`, `discoverable = false`, or requests deletion ([EV-002](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/evidence/phase-0/EV-002-schema-and-rls-inventory.md)).
   - `place_public_stats` lacks `public_rating_count`, causing `/place/[id]` to display community consensus based on `publicExperienceCount >= 3` even if only 1 experience was rated ([EV-003](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/evidence/phase-0/EV-003-rating-search-and-privacy-trace.md)).
   - `recompute_user_stats` (`20261110000018_phase16_taste_stats.sql`) references non-existent column `fe.rating` instead of `fe.overall_rating` ([EV-002](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/evidence/phase-0/EV-002-schema-and-rls-inventory.md)).

---

## 2. Repository Orientation & Baseline Health

| Check / Artifact | Status | Evidence & Notes |
|---|---|---|
| Git HEAD & Working Tree | `VERIFIED COMPLETE` | `dd12d32ecf7c3ce51a3853bc54e89642f949c47e` on `master` ([EV-001](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/evidence/phase-0/EV-001-repo-and-test-baseline.md)) |
| Root `README.md` & `docs/PRODUCT_CONTEXT.md` | `NOT IMPLEMENTED` | Neither file exists in the repository ([EV-001](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/evidence/phase-0/EV-001-repo-and-test-baseline.md)); scheduled for creation in Phase 1 |
| `GEMINI.md` Stack Declaration | `PARTIALLY IMPLEMENTED` | [GEMINI.md](file:///c:/Users/mukes/OneDrive/Desktop/MORS/GEMINI.md#L4) mentions `Drizzle ORM` and `shadcn/ui`, which are not installed; actual stack is `@supabase/supabase-js` + Postgres RPCs + custom token UI primitives |
| TypeScript Strict Check (`pnpm typecheck`) | `VERIFIED COMPLETE` | `4/4` packages pass with zero errors ([EV-001](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/evidence/phase-0/EV-001-repo-and-test-baseline.md)) |
| Unit Test Suite (`pnpm test`) | `VERIFIED COMPLETE` | `51/51` unit tests pass (`@mors/domain`: 11, `web`: 40) ([EV-001](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/evidence/phase-0/EV-001-repo-and-test-baseline.md)) |
| Static Gates (`check:nofake`, `check:rls`, `check:secrets`) | `VERIFIED COMPLETE` | All 3 scripts pass (`0` violations) ([EV-001](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/evidence/phase-0/EV-001-repo-and-test-baseline.md)) |
| Production Next.js Build (`pnpm build`) | `VERIFIED COMPLETE` | `26` routes compile cleanly ([EV-001](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/evidence/phase-0/EV-001-repo-and-test-baseline.md)) |

---

## 3. Product Definition & Documentation Conflict Matrix

| Topic | Legacy Rule (`AGENTS.md` / `DECISIONS.md`) | MORS 2.0 Specification (`docs/2.0/*`) | Conflict Resolution (Owner Decision Ref) |
|---|---|---|---|
| **Restaurant Reviews** | [AGENTS.md](file:///c:/Users/mukes/OneDrive/Desktop/MORS/AGENTS.md#L6): *"It is NOT a ... restaurant-review site."* [DECISIONS.md](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/DECISIONS.md#L27): *"7. Reviews table structure: Omitted."* | MORS 2.0 is a **social food journal + community-powered restaurant and dish discovery platform** with 5-dimension restaurant reviews and dish rankings. | Update `AGENTS.md` and `DECISIONS.md` in Phase 1 (`D0-01`). MORS remains NOT a delivery app, booking platform, or calorie tracker. |
| **Central Object** | `FOOD EXPERIENCE` (one eating occasion) containing `1+` dishes; place is optional; home-cooked is first-class. | Preserved: `FOOD EXPERIENCE` remains the central logging object; restaurant review dimensions attach optionally when `place_id IS NOT NULL`. | No conflict; preserve `FOOD EXPERIENCE` as parent object (`D0-02`). |
| **Rating Scale** | [AGENTS.md](file:///c:/Users/mukes/OneDrive/Desktop/MORS/AGENTS.md#L23): `smallint` half-stars `1..10` (UI `0.5..5.0`). | All overall, restaurant sub-ratings, and dish sub-ratings use `smallint 1..10` in DB and `0.5..5.0` in UI. | Fully aligned (`D0-03`). |
| **Public Consensus Threshold** | [DECISIONS.md](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/DECISIONS.md#L25): Minimum `3` public ratings before displaying community average. | Retain minimum `3` public-pool ratings from distinct users before displaying consensus scorecards, while showing raw log counts below 3. | Fix `/place/[id]` to check `public_rating_count >= 3` and distinct reviewers (`D0-07`). |

---

## 4. Feature-by-Feature Reality vs. MORS 2.0 Gap Matrix

| Feature Area | Current Status | What Exists Today | What Is Missing for MORS 2.0 | Target Phase |
|---|---|---|---|---|
| **Personal Food Experience Logging** | `VERIFIED COMPLETE` | Multi-dish logging, `0..10` client-compressed EXIF-stripped photos, drafts, idempotency via `client_request_id` ([LogModal.tsx](file:///c:/Users/mukes/OneDrive/Desktop/MORS/apps/web/src/components/log/LogModal.tsx)) | Decoupling quick dish rating from overall meal rating and restaurant review | Phase 4 |
| **Multi-Dimensional Restaurant Ratings** | `NOT IMPLEMENTED` | Only `food_experiences.overall_rating` exists | `food_quality`, `value_for_money`, `ambience`, `service`, `hygiene` (`1..10` smallint), `dining_context`, `would_return` | Phase 1 & Phase 4 |
| **Multi-Dimensional Dish Sub-Ratings** | `NOT IMPLEMENTED` | Only `experience_dishes.rating` and `note` exist | `taste_rating`, `portion_rating`, `value_rating`, per-dish `price_amount`, `dietary_tag`, `spice_level` | Phase 1 & Phase 4 |
| **Dish-at-Restaurant Aggregation** | `NOT IMPLEMENTED` | `dish_public_stats` (global per dish) and `place_public_stats` (global per place) | Trigger-maintained `place_dish_public_stats` keyed by `(place_id, dish_id)` | Phase 2 |
| **Find Food (Dish-First Discovery)** | `PARTIALLY IMPLEMENTED` | Keyword trigram search on `dishes.name` in `/search` ([SearchClientView.tsx](file:///c:/Users/mukes/OneDrive/Desktop/MORS/apps/web/src/components/search/SearchClientView.tsx)) | Filtering by city, neighborhood, cuisine, dietary type, price, min rating, and previewing top restaurants per dish | Phase 3 |
| **Find Restaurants (Place-First Discovery)** | `PARTIALLY IMPLEMENTED` | Keyword + free-text city search on `places` in `/search` | Filtering by neighborhood/area, cuisine, venue style, price tier, dietary support, and sorting by specific dimension scores (`food_quality`, `hygiene`, `value`) | Phase 3 |
| **Canonical Dish Comparison Page (`/dish/[slug]`)** | `PARTIALLY IMPLEMENTED` | Shows global dish average, personal card, and 10 recent logs ([dish/\[slug\]/page.tsx](file:///c:/Users/mukes/OneDrive/Desktop/MORS/apps/web/src/app/dish/%5Bslug%5D/page.tsx)) | **"Where to Eat This Dish"** ranked restaurant comparison list with per-venue dish ratings, sample counts, and prices | Phase 5 |
| **Restaurant Profile Page (`/place/[id]`)** | `PARTIALLY IMPLEMENTED` | Shows single average (`overall_rating`), personal visits, child branches, and 10 recent logs ([place/\[id\]/page.tsx](file:///c:/Users/mukes/OneDrive/Desktop/MORS/apps/web/src/app/place/%5Bid%5D/page.tsx)) | 5-dimension restaurant scorecard, `public_rating_count >= 3` gate, sibling branch navigation, and **"What to Order Here"** ranked dish menu | Phase 5 |
| **Review Anti-Manipulation & Moderation** | `PARTIALLY IMPLEMENTED` | General reports, strikes, suspensions, and rate limit buckets (`20261110000010` & `24`) | Per-user per-place duplicate weight protection, distinct-reviewer threshold (`>= 3` users), and rating-spike anomaly flags | Phase 6 |
| **Hyderabad Beta Culinary Seed Data** | `PARTIALLY IMPLEMENTED` | 15 dishes and 8 places in `supabase/seed.sql` | Rich Hyderabad neighborhoods, brand/branch hierarchies, multi-dimensional reviews, and dish-at-place comparison data | Phase 7 |

---

## 5. Rating Semantics & Mathematical Audit

See Section 3 of [MORS_2_DATA_MODEL_AUDIT.md](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/audit/MORS_2_DATA_MODEL_AUDIT.md) and [EV-003](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/evidence/phase-0/EV-003-rating-search-and-privacy-trace.md).

- **Current State (`PARTIALLY IMPLEMENTED` / `BROKEN` for Place Stats):**
  - `packages/domain/src/ratings.ts` cleanly converts `1..10` <-> `0.5..5.0`.
  - `LogModal.tsx` (lines 499–506) couples `dishes[0].rating` and `overallRating` in Quick Log and provides no separate control for `overallRating` in Detailed Log.
  - `recompute_place_stats` averages `fe.overall_rating` and omits `public_rating_count`.
- **MORS 2.0 Target Formula:**
  - **Meal Experience Rating (`food_experiences.overall_rating`):** Optional `1..10` rating of the eating occasion as a whole (works for both home-cooked and dining out).
  - **Restaurant Review Dimensions (`food_experiences.place_rating_*`):** Optional `1..10` ratings for `food_quality`, `value_for_money`, `ambience`, `service`, `hygiene`, and composite/explicit `place_rating_overall`. When a user rates restaurant sub-dimensions without manually overriding `place_rating_overall`, `place_rating_overall` is computed as the weighted or rounded mean of provided sub-dimensions (Decision `D0-04`).
  - **Dish Rating (`experience_dishes.rating` + `taste_rating`, `portion_rating`, `value_rating`):** Per-dish `1..10` rating contributing both to canonical `dish_public_stats` and (when `fe.place_id IS NOT NULL`) to `place_dish_public_stats`.

---

## 6. Restaurant, Brand, and Branch Data Model Audit

See Section 4 of [MORS_2_DATA_MODEL_AUDIT.md](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/audit/MORS_2_DATA_MODEL_AUDIT.md).

- **Status:** `PARTIALLY IMPLEMENTED`
- `public.places` supports `parent_place_id` and `merged_into_id`, and links to `public.cities(id)` (`city_id`).
- **Gaps:**
  1. Missing venue discovery attributes (`slug`, `area_name`, `cuisines`, `venue_style`, `price_tier`, `dietary_classification`, `is_brand_parent`).
  2. Branch sibling lookup on `/place/[id]` only queries children (`WHERE parent_place_id = canonicalPlace.id`), so visiting a child branch does not show sibling branches sharing the same `parent_place_id`.

---

## 7. Canonical Dish, Aliases, Translations & Dish-at-Place Audit

See Section 5 of [MORS_2_DATA_MODEL_AUDIT.md](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/audit/MORS_2_DATA_MODEL_AUDIT.md).

- **Status:** `PARTIALLY IMPLEMENTED`
- `public.dishes`, `public.dish_aliases`, and `public.dish_translations` (`en`, `te`, `hi`) are implemented and working on `/dish/[slug]`.
- **Gaps:**
  1. No `public.place_dish_public_stats` table linking `(place_id, dish_id)` for dish-first restaurant ranking ("Where to Eat This Dish") and restaurant-first dish ranking ("What to Order Here").
  2. No per-dish `price_amount`, `dietary_tag`, or `spice_level` on `public.experience_dishes`.

---

## 8. Discovery, Search, and Filtering Audit (`Find Food` vs. `Find Restaurants`)

See Section 2 of [MORS_2_UX_AUDIT.md](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/audit/MORS_2_UX_AUDIT.md) and [EV-003](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/evidence/phase-0/EV-003-rating-search-and-privacy-trace.md).

- **Status:** `PARTIALLY IMPLEMENTED`
- `public.search_all` (`20261110000009_search.sql`) performs trigram similarity + `ILIKE` matching across `dishes`, `places`, `profiles`, `food_experiences`, and `collections`, returning a flat union (`result_type, id, title, subtitle, photo_url, url, score`).
- **Gaps:**
  1. Cannot browse top dishes or top restaurants when the search query is empty (`if (!q.trim()) return []` in `SearchClientView.tsx` line 56).
  2. Cannot filter or sort by rating score, dimension score (`food_quality`, `hygiene`, `value_for_money`), neighborhood/area, cuisine, dietary tag, or price tier.
  3. **Security Defect (`BUG-01`):** `search_all` does not filter `dishes` or `places` by `is_listed = true OR created_by = viewer_uuid`.

---

## 9. Experience & Review Logging UX Audit

See Section 3 of [MORS_2_UX_AUDIT.md](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/audit/MORS_2_UX_AUDIT.md).

- **Status:** `PARTIALLY IMPLEMENTED`
- `LogModal.tsx` supports rapid photo compression, draft autosave in `localStorage`, combobox creation of unlisted dishes/places, and multi-dish entry.
- **Gaps:**
  1. Couples `dishes[0].rating` and `overallRating` in Quick Log.
  2. Lacks conditional 5-dimension Restaurant Review controls when a `place` is selected.
  3. Lacks optional per-dish sub-ratings (`Taste`, `Portion`, `Value`), per-dish price, and dietary/spice tags.

---

## 10. Restaurant Profile (`/place/[id]`) & Dish Profile (`/dish/[slug]`) Page Audit

See Section 4 of [MORS_2_UX_AUDIT.md](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/audit/MORS_2_UX_AUDIT.md).

- **Status:** `PARTIALLY IMPLEMENTED`
- Both pages enforce the visual separation between **Community Consensus (Public Only)** and **Personal History (Private to You)**.
- **Gaps & Defects:**
  1. `/place/[id]` checks `publicExperienceCount >= 3` instead of `publicRatingCount >= 3` (`BUG-05`).
  2. `getDishBySlug` and `getPlaceById` allow private-profile entries with `visibility = 'public'` to appear in the public community logs list when viewed by an accepted follower (`BUG-03`).
  3. `/place/[id]` lacks the 5-dimension rating breakdown and "What to Order Here" dish ranking.
  4. `/dish/[slug]` lacks the "Where to Eat This Dish" restaurant comparison ranking.

---

## 11. Personal Food Journal, Home-Cooked Parity & Social Feed Audit

- **Status:** `VERIFIED COMPLETE`
- Home-cooked meals (`place_id IS NULL`) are first-class citizens across `LogModal.tsx`, `/diary`, `/`, and `/u/[username]`.
- `places` has an explicit constraint `check_place_not_home CHECK (lower(name) != 'home')` (`20261110000020_phase18_map_pins_and_places.sql` line 14) preventing "Home" from polluting the public restaurant directory.
- Keyset pagination (`(eaten_at, id)` / `(published_at, id)`) is enforced across feeds, diaries, and notifications.

---

## 12. Privacy, Visibility, Blocking & RLS Security Audit

See Section 8 of [MORS_2_DATA_MODEL_AUDIT.md](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/audit/MORS_2_DATA_MODEL_AUDIT.md) and [EV-002](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/evidence/phase-0/EV-002-schema-and-rls-inventory.md).

| Non-Negotiable Rule | Status | Audit Finding |
|---|---|---|
| #1 & #2: RLS enabled with explicit policies on all tables | `VERIFIED COMPLETE` | All 51 tables in `public` have RLS enabled and explicit policies (`pnpm check:rls` passes). |
| #3 & #10: Public pool isolation in aggregates & entity lists | `BROKEN` (`BUG-02`, `BUG-03`) | Missing trigger on `public.profiles` when `is_private`, `discoverable`, or deletion status changes; `getDishBySlug`/`getPlaceById` recent logs list misses `profiles.is_private = false` filter; `get_explore_trending` misses `pr.discoverable = true AND pr.deletion_requested_at IS NULL AND pr.deletion_pending_at IS NULL`. |
| #4 & #5: Effective visibility & bidirectional blocks | `VERIFIED COMPLETE` | `can_view_experience`, `can_view_collection`, and `is_blocked_between` enforce most-restrictive visibility and bidirectional block hiding. |
| #6: Hidden and nonexistent return identical 404 | `VERIFIED COMPLETE` | Server pages call `notFound()` when RPC/queries return `null`. |
| #7: Service-role key isolation & photo signing | `VERIFIED COMPLETE` | `pnpm check:secrets` passes; photos signed via `experience-photos` storage policy calling `can_view_experience`. |
| #11: Unlisted `dishes`/`places` visible only to creator; `created_by` hidden | `BROKEN` (`BUG-01`) | `dishes` and `places` have RLS policy `FOR SELECT USING (true)`; `search_all` and `find_similar_*` do not check `is_listed = true OR created_by = (SELECT auth.uid())`. |
| #12: Strip EXIF/GPS & venue-only map pins | `VERIFIED COMPLETE` | `processImageFile` strips EXIF via canvas re-encode; `get_map_pins` returns only `places` coordinates. |

---

## 13. Canonical Entity Deduplication & Merge Audit

- **Status:** `PARTIALLY IMPLEMENTED` (`BUG-06`)
- `20261110000005_canonical_merges.sql` defines `find_similar_dishes`, `find_similar_places`, `merge_dishes`, and `merge_places`.
- **Defects to Fix in Phase 2:**
  1. `merge_dishes` only updates `experience_dishes` and `dish_aliases`. It must also update `collection_items.dish_id`, `dish_translations.dish_id`, `dish_similarity`, and `place_dish_public_stats`, then call `recompute_dish_stats`.
  2. `merge_places` only updates `food_experiences.place_id` and `places.parent_place_id`. It must also update `collection_items.place_id` and `place_dish_public_stats`, then call `recompute_place_stats`.
  3. `find_similar_dishes` and `find_similar_places` must filter by `is_listed = true OR created_by = (SELECT auth.uid())`.

---

## 14. Trust, Moderation & Anti-Manipulation Audit

- **Status:** `PARTIALLY IMPLEMENTED`
- Existing tables: `reports`, `moderation_actions`, `appeals`, `user_strikes`, `suspensions`, `trusted_reporters`, `spam_signals`, `content_hashes`, `rate_limit_buckets`.
- **Gaps for MORS 2.0 (Phase 6):**
  1. Currently, a single user who logs 3 public experiences at the same restaurant on the same day satisfies `count(DISTINCT fe.id) >= 3` and can single-handedly establish and skew a restaurant's or dish's public rating.
  2. `recompute_dish_stats`, `recompute_place_stats`, and `recompute_place_dish_stats` should track `public_reviewer_count` (`COUNT(DISTINCT fe.user_id)`) or deduplicate/cap per-user rating weight so public consensus requires `>= 3` **distinct** public-pool reviewers (Decision `D0-07`).

---

## 15. Performance, Indexing & Pagination Audit

- **Status:** `VERIFIED COMPLETE` (for v1 tables) / `PARTIALLY IMPLEMENTED` (for MORS 2.0 discovery)
- Trigram GIN indexes exist on `dishes.name`, `places.name`, `places.city`, `food_experiences.title`, and `collections.name` (`20261110000009_search.sql`).
- Phase 2 and Phase 3 must add composite B-tree and GIN indexes on `places(city_id, area_name, is_listed)`, `places USING gin(cuisines)`, and `place_dish_public_stats(dish_id, public_rating_avg DESC)` to support sub-50ms keyset pagination on Find Food and Find Restaurants.

---

## 16. Test Coverage & Verification Infrastructure Audit

- **Status:** `PARTIALLY IMPLEMENTED`
- `packages/domain`: 11 unit tests in `ratings.test.ts`.
- `apps/web`: 40 unit tests across 12 test files + Playwright E2E spec (`e2e/phase14.spec.ts`).
- `supabase/tests`: pgTAP test suite covering RLS, privacy, triggers, and merges.
- **Gaps:** Need unit tests and pgTAP tests for all new multi-dimensional rating schemas, `place_dish_public_stats` triggers, `profiles` privacy transition triggers, unlisted `dishes`/`places` RLS enforcement, and Playwright E2E coverage for Find Food, Find Restaurants, and 5-dimension review logging.

---

## 17. Risk Register

| Risk ID | Title | Category | Severity | Likelihood | Affected Files / Tables | Evidence | Impact | Recommended Mitigation | Target Phase |
|---|---|---|---|---|---|---|---|---|---|
| **R-01** | Unlisted `dishes` and `places` + `created_by` exposed via RLS `SELECT USING (true)` | Security / Privacy | `CRITICAL` | `CERTAIN` | `public.dishes`, `public.places`, `search_all`, `find_similar_*` | [EV-002](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/evidence/phase-0/EV-002-schema-and-rls-inventory.md) | Any client can read unlisted home/custom dishes or places created by other users and see `created_by` UUIDs | Restrict `SELECT` RLS policy on `dishes` and `places` to `is_listed = true OR created_by = (SELECT auth.uid()) OR is_admin`; filter `search_all` and `find_similar_*` | Phase 1 |
| **R-02** | Stale public aggregates when user switches profile to private or requests deletion | Privacy / Data Integrity | `CRITICAL` | `HIGH` | `public.profiles`, `dish_public_stats`, `place_public_stats` | [EV-002](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/evidence/phase-0/EV-002-schema-and-rls-inventory.md) | Private/deleted user's ratings remain inside public dish/place averages indefinitely until another log touches that dish/place | Add `AFTER UPDATE OF is_private, discoverable, deletion_requested_at, deletion_pending_at` trigger on `public.profiles` to recompute affected stats | Phase 1 |
| **R-03** | Follower of private user sees private user's logs in public lists on `/dish/[slug]` and `/place/[id]` | Privacy | `HIGH` | `HIGH` | [apps/web/src/app/dish/actions.ts](file:///c:/Users/mukes/OneDrive/Desktop/MORS/apps/web/src/app/dish/actions.ts#L132-L151) | [EV-003](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/evidence/phase-0/EV-003-rating-search-and-privacy-trace.md) | Violates Non-Negotiable #10 (public entity lists must use ONLY the public pool) | Add `.eq('food_experiences.profiles.is_private', false).eq('food_experiences.profiles.discoverable', true)` on public entity experience queries | Phase 1 & Phase 5 |
| **R-04** | Runtime SQL failure in `recompute_user_stats` due to `fe.rating` column typo | Correctness | `HIGH` | `CERTAIN` | [20261110000018_phase16_taste_stats.sql](file:///c:/Users/mukes/OneDrive/Desktop/MORS/supabase/migrations/20261110000018_phase16_taste_stats.sql#L94) | [EV-002](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/evidence/phase-0/EV-002-schema-and-rls-inventory.md) | Calling `recompute_user_stats` throws `column fe.rating does not exist` | Replace `fe.rating` with `fe.overall_rating` in Phase 1 migration | Phase 1 |
| **R-05** | Premature consensus display on `/place/[id]` when experiences are unrated or logged by a single user | Product / Privacy | `HIGH` | `HIGH` | `place_public_stats`, [place/\[id\]/page.tsx](file:///c:/Users/mukes/OneDrive/Desktop/MORS/apps/web/src/app/place/%5Bid%5D/page.tsx#L105) | [EV-003](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/evidence/phase-0/EV-003-rating-search-and-privacy-trace.md) | Community rating shown with `< 3` actual ratings or when 1 user logs 3 visits | Add `public_rating_count` and `public_reviewer_count` to stats tables; gate consensus on `>= 3` ratings | Phase 1 & Phase 6 |
| **R-06** | Incomplete FK re-pointing in `merge_dishes` and `merge_places` | Data Integrity | `MEDIUM` | `MEDIUM` | [20261110000005_canonical_merges.sql](file:///c:/Users/mukes/OneDrive/Desktop/MORS/supabase/migrations/20261110000005_canonical_merges.sql#L66-L157) | [EV-002](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/evidence/phase-0/EV-002-schema-and-rls-inventory.md) | Merging duplicate dishes/places orphans `collection_items`, `dish_translations`, `dish_similarity`, and leaves stale stats | Update both RPCs in Phase 2 to re-point all FK tables and call `recompute_*_stats` | Phase 2 |
| **R-07** | Logging fatigue if 5-dimension restaurant ratings are forced on every meal | UX / Adoption | `MEDIUM` | `MEDIUM` | [LogModal.tsx](file:///c:/Users/mukes/OneDrive/Desktop/MORS/apps/web/src/components/log/LogModal.tsx) | [EV-003](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/evidence/phase-0/EV-003-rating-search-and-privacy-trace.md) | Slows down `< 20s` Quick Log or clutters home-cooked logging | Keep all 5 restaurant dimensions and 3 dish sub-dimensions optional behind progressive disclosure; hide restaurant dimensions when `place_id IS NULL` | Phase 4 |

---

## 18. Decision Register (`D0-01` through `D0-12`)

Every item below requires owner confirmation before Phase 1 database and domain code is written. Recommended defaults are highlighted so the owner can approve all defaults in one reply or override specific items.

### `D0-01` — Product Positioning & Rule Update (`AGENTS.md` & `DECISIONS.md`)
- **Context:** `AGENTS.md` line 6 states MORS is *"NOT a ... restaurant-review site"* and `DECISIONS.md` #7 omits review structures, whereas MORS 2.0 introduces structured restaurant and dish reviews/discovery.
- **Options:**
  1. **(Recommended)** Update `AGENTS.md` and `DECISIONS.md` to define MORS 2.0 as a *"social food journal + community-powered restaurant and dish discovery platform"*, while keeping it strictly NOT a delivery app, booking platform, or calorie tracker, and keeping `FOOD EXPERIENCE` (including home-cooked food) as the central object.
  2. Keep `AGENTS.md` unchanged and abort restaurant review features.
- **Impact:** Unblocks Phases 1–7.

### `D0-02` — Storage Architecture for Restaurant Reviews (`food_experiences` Columns vs. Separate `place_reviews` Table)
- **Context:** When a user logs a Food Experience at a restaurant (`place_id IS NOT NULL`), where should the 5 restaurant rating dimensions (`food_quality`, `value_for_money`, `ambience`, `service`, `hygiene`, `place_rating_overall`, `dining_context`, `would_return`) live?
- **Options:**
  1. **(Recommended)** Nullable columns directly on `public.food_experiences` (`place_rating_overall`, `place_rating_food`, `place_rating_value`, `place_rating_ambience`, `place_rating_service`, `place_rating_hygiene`, `dining_context`, `would_return`) with a `CHECK` constraint that they are `NULL` when `place_id IS NULL`.
  2. Separate 1:1 `public.experience_place_reviews` table referencing `food_experiences(id) ON DELETE CASCADE`.
- **Recommendation Rationale:** Option 1 avoids an extra table join on every feed, diary, place profile, and trigger execution, automatically inherits `can_view_experience` RLS without duplicate policy maintenance, and preserves `FOOD EXPERIENCE` as the single atomic parent record.

### `D0-03` — Rating Scale & Encoding Standard Across All New Dimensions
- **Context:** Existing ratings (`overall_rating`, `experience_dishes.rating`) use `smallint 1..10` in Postgres and `0.5..5.0` stars in the UI.
- **Options:**
  1. **(Recommended)** Use `smallint 1..10` (`0.5..5.0` UI half-stars) for all 5 restaurant dimensions and all 3 dish sub-dimensions (`taste`, `portion`, `value`).
  2. Use `1..5` integer stars for sub-dimensions.
- **Recommendation Rationale:** Uniform `1..10` encoding prevents scale conversion bugs and reuses `RatingStars` and `@mors/domain` helpers everywhere.

### `D0-04` — Restaurant Overall Rating Calculation (`place_rating_overall`)
- **Context:** How should a visit's overall restaurant rating (`place_rating_overall`) be determined when a user logs a meal at a place?
- **Options:**
  1. **(Recommended)** If the user rates any of the 5 restaurant dimensions (`food_quality`, `value_for_money`, `ambience`, `service`, `hygiene`), compute `place_rating_overall` as the rounded average of the rated dimensions (unless explicitly overridden by the user); if the user only provides a quick overall experience rating at a place without expanding sub-dimensions, fallback to `COALESCE(place_rating_overall, overall_rating)` in `recompute_place_stats`.
  2. Require all 5 dimensions to be filled before counting toward `place_public_stats`.
- **Recommendation Rationale:** Option 1 supports both `< 20s` quick logs and detailed 5-dimension reviews while preserving backwards compatibility with existing beta entries.

### `D0-05` — Dish Sub-Ratings (`taste`, `portion`, `value`) & Per-Dish Metadata
- **Context:** What structured fields should be added to `public.experience_dishes`?
- **Options:**
  1. **(Recommended)** Add optional `taste_rating` (`1..10`), `portion_rating` (`1..10`), `value_rating` (`1..10`), `price_amount` (`numeric(10,2)`), `dietary_tag` (`'veg' | 'egg' | 'non_veg'`), and `spice_level` (`smallint 1..4`) to `public.experience_dishes`.
  2. Keep `experience_dishes` with only a single `rating` column.
- **Recommendation Rationale:** Enables dish-level value/portion comparisons and accurate dish pricing on "Where to Eat This Dish".

### `D0-06` — Brand vs. Branch Hierarchy in `public.places`
- **Context:** In Hyderabad, iconic names like *Paradise*, *Bawarchi*, *Shah Ghouse*, *Chutneys*, and *Cafe Niloufer* have multiple branches with noticeably different quality.
- **Options:**
  1. **(Recommended)** Each physical branch is its own row in `public.places` with its own `area_name` (e.g., *Cafe Niloufer — Lakdikapul*, *Cafe Niloufer — Banjara Hills*) and its own independent `place_public_stats` and `place_dish_public_stats`. They share `parent_place_id` pointing to the parent brand/flagship row, and `/place/[id]` displays both parent and sibling branches so users can compare branches directly.
  2. Merge all branches into a single place row per brand.
- **Recommendation Rationale:** Branch-level quality variance is one of the primary reasons Hyderabad diners look up food recommendations; keeping stats per-branch while linking sibling branches via `parent_place_id` is essential.

### `D0-07` — Minimum Sample Threshold & Anti-Manipulation Rule for Public Consensus
- **Context:** Currently, `dish_public_stats` requires `public_rating_count >= 3` on `/dish/[slug]`, while `/place/[id]` mistakenly checks `public_experience_count >= 3`, and neither checks whether all 3 ratings came from the same user.
- **Options:**
  1. **(Recommended)** Require `public_rating_count >= 3` **AND** `public_reviewer_count >= 3` (`COUNT(DISTINCT fe.user_id) >= 3`) for canonical dishes and restaurants to display full community consensus scorecards; for a specific dish *at* a specific restaurant (`place_dish_public_stats`), display the dish-at-place score once it has `>= 1` public-pool rating, with a clear `"Early consensus (N ratings)"` badge when `< 3` ratings and `"Verified consensus (N ratings)"` when `>= 3` distinct reviewers.
  2. Hide dish-at-place rows completely until `>= 3` users log the exact same dish at the exact same restaurant branch.
- **Recommendation Rationale:** During closed beta (~50–100 users in Hyderabad), requiring 3 distinct users on every `(place_id, dish_id)` pair before showing any comparison row would leave `/dish/[slug]` and `/place/[id]` mostly empty; showing dish-at-place rows with an explicit sample-size badge (`1–2 ratings: Early` vs. `3+ ratings: Consensus`) balances honesty, privacy, and beta utility.

### `D0-08` — Primary Navigation Structure (`Find Food` & `Find Restaurants`)
- **Context:** How should `Find Food` and `Find Restaurants` be surfaced in `AppShell.tsx`?
- **Options:**
  1. **(Recommended)** Upgrade `/search` into the primary **Find** hub (labeled `Find` in navigation, with `/search` preserved as the route for URL compatibility) featuring top-level mode tabs: **Find Food (Dishes)**, **Find Restaurants (Places)**, and **Community (People, Journals & Collections)**, and allow browsing/filtering immediately even when the search text input is empty. Keep `/explore` for curated trending journals, collections, and tastemakers.
  2. Create two separate top-level sidebar routes (`/find-food` and `/find-restaurants`) in addition to `/search` and `/explore`.
- **Recommendation Rationale:** Option 1 avoids crowding the navigation bar while making **Find Food** and **Find Restaurants** immediately accessible in 1 click on both desktop and mobile.

### `D0-09` — Restaurant Place URLs (`/place/[id]` vs. Slug Support)
- **Context:** `/place/[id]` currently accepts a UUID (`places.id`), whereas `/dish/[slug]` uses a human-readable slug.
- **Options:**
  1. **(Recommended)** Add a unique `slug` column to `public.places` in Phase 2 and update `getPlaceById(idOrSlug)` so `/place/[id]` resolves **both** UUIDs (preserving all existing links, collections, and tests) and human-readable slugs (e.g., `/place/shah-ghouse-tolichowki`).
  2. Replace UUID support with slug-only routing (breaking existing `/place/<uuid>` links).
- **Recommendation Rationale:** Dual UUID-or-slug resolution in `getPlaceById` provides clean SEO URLs with zero breaking changes to existing tests or saved links.

### `D0-10` — Unlisted `dishes` and `places` RLS Enforcement Strategy
- **Context:** `BUG-01` revealed that `dishes` and `places` currently have `FOR SELECT USING (true)` RLS policies.
- **Options:**
  1. **(Recommended)** Tighten the `SELECT` RLS policy on `public.dishes` and `public.places` in Phase 1 to `USING (is_listed = true OR created_by = (SELECT auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true))`, and add the same predicate inside `search_all`, `find_similar_dishes`, and `find_similar_places`.
  2. Leave `SELECT USING (true)` on `dishes` and `places`.
- **Recommendation Rationale:** Option 1 is mandatory to satisfy `AGENTS.md` Non-Negotiables #1 and #11.

### `D0-11` — Repeat Visits by the Same User in Restaurant & Dish Aggregates
- **Context:** If User A logs 5 public meals at *Bawarchi*, how should User A's ratings be weighted in `place_public_stats` and `dish_public_stats`?
- **Options:**
  1. **(Recommended)** Per-user mean first (each distinct public-pool user's average rating at that place / for that dish counts as 1 user voice in `public_rating_avg`), while `public_experience_count` and `public_rating_count` track total public experiences and ratings, and `public_reviewer_count` tracks distinct users.
  2. Raw unweighted average across all experience rows (allowing 1 user with 20 logs to outweigh 10 users with 1 log each).
- **Recommendation Rationale:** Averaging per distinct user first (or capping per-user weight) completely neutralizes single-user spam/brigading while still showing total visit volume (`public_experience_count`).

### `D0-12` — Geographic Scope for MORS 2.0 Launch
- **Context:** `public.cities` (`20261110000026_phase25_cities_and_multi_city.sql`) seeds `Hyderabad` (default anchor), `Bengaluru`, `Mumbai`, and `Delhi-NCR`.
- **Options:**
  1. **(Recommended)** Default all discovery views (`Find Food`, `Find Restaurants`, `/explore`, `/map`) to **Hyderabad** (with Hyderabad neighborhood pills: *Jubilee Hills*, *Banjara Hills*, *Gachibowli*, *Hitec City*, *Madhapur*, *Tolichowki*, *Charminar / Old City*, *Secunderabad*, *Himayatnagar*, *Lakdikapul*), while allowing users to switch the city filter to `All Cities` or another active city in `public.cities`.
  2. Hard-lock all queries to Hyderabad only.
- **Recommendation Rationale:** Keeps the beta laser-focused on Hyderabad culinary culture while preserving the Phase 25 multi-city schema already in the database.

---

## 19. Recommended Phase 1–7 Execution Plan Summary

See [MORS_2_IMPLEMENTATION_SEQUENCE.md](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/audit/MORS_2_IMPLEMENTATION_SEQUENCE.md) for the complete file-by-file breakdown:
- **Phase 1:** Product alignment docs (`README.md`, `docs/PRODUCT_CONTEXT.md`, `AGENTS.md`, `DECISIONS.md`), `@mors/domain` multi-dimensional rating schemas & helpers, and Migration `34` (rating columns on `food_experiences` and `experience_dishes`, `place_public_stats` 5-dimension columns + `public_rating_count`, RLS fixes on `dishes`/`places`, `profiles` privacy trigger, `recompute_user_stats` fix).
- **Phase 2:** Rich restaurant & dish metadata (`area_name`, `cuisines`, `venue_style`, `price_tier`, `dietary_classification`, `slug`), `place_dish_public_stats` trigger-maintained table, brand/branch sibling queries, and `merge_dishes`/`merge_places` FK fixes (Migration `35`).
- **Phase 3:** `find_food_dishes` and `find_restaurants` discovery RPCs (Migration `36`) + upgraded dual-intent **Find Food / Find Restaurants** UI with neighborhood, cuisine, dietary, price, and dimension-score filters/sorting.
- **Phase 4:** Upgraded `LogModal.tsx` with decoupled Quick Log (`< 20s`), progressive 5-dimension Restaurant Review scorecard (when `place` is selected), and optional per-dish sub-ratings (`Taste`, `Portion`, `Value`, price, spice), plus review display on `/e/[id]`.
- **Phase 5:** Upgraded `/place/[id]` (5-dimension scorecard + **"What to Order Here"** ranked dish menu + sibling branches) and `/dish/[slug]` (**"Where to Eat This Dish"** ranked restaurant comparison).
- **Phase 6:** Per-user distinct reviewer weighting (`D0-11`), `public_reviewer_count` thresholds, rating-spike anomaly signals, and admin moderation queue upgrades (Migration `37`).
- **Phase 7:** Authentic Hyderabad culinary seed dataset (`supabase/seed.sql`), full unit + pgTAP + Playwright E2E + axe + 360/768/1280 visual verification, and Launch Gate report.

---

## 20. Final Phase 0 Verdict

**Verdict:** **`READY WITH OPEN DECISIONS`**

The repository baseline is clean, healthy, and well-structured (`51/51` unit tests passing, `51` RLS-enabled tables, production build passing). All gaps, security/privacy defects (`BUG-01` through `BUG-08`), and architectural decisions (`D0-01` through `D0-12`) have been documented with verifiable evidence. Upon owner approval of the recommended defaults in Section 18 (`D0-01` through `D0-12`), execution can immediately proceed to **Phase 1: Product Alignment & Multi-Dimensional Rating Domain Foundation**.
