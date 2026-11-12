# MORS 2.0 — Master Implementation Sequence (Phases 0 to 7)

- **Audit Phase:** Phase 0 — Product Specification & Repository Reality Audit
- **Git Commit SHA:** `dd12d32ecf7c3ce51a3853bc54e89642f949c47e`
- **Timestamp:** `2026-11-12T00:20:00+05:30`
- **Governing Playbook:** [MORS_Master_Continuous_Execution_Playbook_Phase_0_to_7.md](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/2.0/MORS_Master_Continuous_Execution_Playbook_Phase_0_to_7.md)

---

## Overview of the 8-Phase Execution Sequence

| Phase | Title | Core Deliverable | Approval Gate Required? |
|---|---|---|---|
| **Phase 0** | Product Specification & Repository Reality Audit | 4 Audit Reports in `docs/audit/`, Evidence in `docs/evidence/phase-0/`, Master Tracker | Completed in this phase |
| **Phase 1** | Product Alignment & Multi-Dimensional Rating Domain Foundation | Updated product docs (`AGENTS.md`, `DECISIONS.md`, `README.md`), `@mors/domain` multi-dimensional rating schemas & helpers, DB migration for restaurant/dish sub-ratings & RLS/trigger fixes | **YES** (Touches DB schema, RLS, domain contract) |
| **Phase 2** | Restaurant, Branch & Dish-at-Place Data Architecture | Rich `places` & `dishes` metadata, `place_dish_public_stats` trigger-maintained table, brand/branch query helpers, canonical merge FK fixes | **YES** (Touches DB schema, migrations, triggers) |
| **Phase 3** | Find Food & Find Restaurants Discovery Engine | Dual-intent discovery RPCs (`find_food_dishes`, `find_restaurants`), `/find` (or upgraded `/search` & `/explore`) UI with filters, sorting, and neighborhood pills | Check if new RPC migration is included |
| **Phase 4** | Multi-Dimensional Review & Experience Logging UX | Upgraded `LogModal.tsx` with decoupled Quick Log vs. 5-dimension Restaurant Review vs. Dish sub-ratings, preserving home-cooked simplicity | Standard phase verification |
| **Phase 5** | Restaurant Profile & Canonical Dish Comparison Pages | Upgraded `/place/[id]` (5-dimension scorecard + "What to Order Here" ranked menu) and `/dish/[slug]` ("Where to Eat This Dish" ranked restaurant comparison) | Standard phase verification |
| **Phase 6** | Trust, Moderation & Anti-Manipulation Hardening | Velocity rate limits, abnormal rating spike detection, review reporting & admin moderation queue upgrades, public-pool integrity pgTAP tests | **YES** (Touches security/moderation RPCs & schema) |
| **Phase 7** | Hyderabad Beta Seed, End-to-End QA & Launch Gate | Rich Hyderabad culinary dataset (`supabase/seed.sql`), full Playwright E2E + axe accessibility + 360/768/1280 visual checks, launch gate sign-off | Final Launch Gate |

---

## Detailed Phase-by-Phase Breakdown

### Phase 0: Product Specification & Repository Reality Audit
- **Objective:** Inspect the repository, database schema, RLS policies, rating flow, and UI routes against MORS 2.0 specifications without modifying application code or database schema.
- **Scope & Affected Files:**
  - `docs/audit/MORS_2_PRODUCT_GAP_AUDIT.md`
  - `docs/audit/MORS_2_DATA_MODEL_AUDIT.md`
  - `docs/audit/MORS_2_UX_AUDIT.md`
  - `docs/audit/MORS_2_IMPLEMENTATION_SEQUENCE.md`
  - `docs/evidence/phase-0/EV-001-repo-and-test-baseline.md`
  - `docs/evidence/phase-0/EV-002-schema-and-rls-inventory.md`
  - `docs/evidence/phase-0/EV-003-rating-search-and-privacy-trace.md`
  - `docs/MORS_MASTER_EXECUTION_TRACKER.md`
- **Database / Backend / Frontend Changes:** None (strictly prohibited in Phase 0).
- **Acceptance Criteria:** All 4 audit documents, evidence files, and master tracker created with exact file/line citations and Decision Register `D0-01` through `D0-12`.

---

### Phase 1: Product Alignment & Multi-Dimensional Rating Domain Foundation
- **Reference Spec:** [MORS_Phase_1_Product_Alignment_and_Rating_Domain_Foundation.md](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/2.0/MORS_Phase_1_Product_Alignment_and_Rating_Domain_Foundation.md)
- **Objective:** Resolve the product identity contradiction between v1 docs and MORS 2.0, create `README.md` and `docs/PRODUCT_CONTEXT.md`, extend `@mors/domain` with separate Meal Experience, Restaurant (5-dimension), and Dish (3-dimension) rating schemas and helpers, and ship the foundational database migration fixing rating columns, `place_public_stats.public_rating_count`, RLS on `dishes`/`places`, and the `profiles` public-pool recompute trigger.
- **Affected Files / Modules:**
  - `README.md`, `docs/PRODUCT_CONTEXT.md`, `AGENTS.md`, `docs/DECISIONS.md`, `docs/FEATURE_REGISTRY.md`
  - `packages/domain/src/ratings.ts`, `packages/domain/src/schemas.ts`, `packages/domain/src/index.ts`, `packages/domain/src/__tests__/ratings.test.ts`
  - `supabase/migrations/20261112000034_mors2_phase1_rating_domain_and_rls_fixes.sql`
  - `supabase/tests/` (pgTAP tests for multi-dimensional ratings, unlisted `dishes`/`places` RLS, and `profiles` privacy transition trigger)
  - `packages/db/src/database.types.ts`
- **Database Changes:**
  - Add restaurant review columns to `public.food_experiences`: `place_rating_overall`, `place_rating_food`, `place_rating_value`, `place_rating_ambience`, `place_rating_service`, `place_rating_hygiene` (`smallint CHECK (1..10)`), `dining_context` (`text`), `would_return` (`boolean`).
  - Add dish sub-rating & attribute columns to `public.experience_dishes`: `taste_rating`, `portion_rating`, `value_rating` (`smallint CHECK (1..10)`), `price_amount` (`numeric(10,2)`), `dietary_tag` (`text`), `spice_level` (`smallint`).
  - Add `public_rating_count` and 5-dimension average/count columns to `public.place_public_stats`.
  - Add `taste_avg`, `portion_avg`, `value_avg` to `public.dish_public_stats`.
  - Fix `recompute_user_stats` (`AVG(fe.overall_rating)` instead of `AVG(fe.rating)`).
  - Fix RLS policies on `public.dishes` and `public.places` so `is_listed = false` is only visible to `created_by = (SELECT auth.uid())` or admins.
  - Add `AFTER UPDATE` trigger on `public.profiles` (`is_private`, `discoverable`, `deletion_requested_at`, `deletion_pending_at`) to recompute affected `dish_public_stats` and `place_public_stats`.
  - Update `create_experience` and `update_experience` RPCs to persist the new rating fields backwards-compatibly.
- **Dependencies:** Owner approval of Phase 0 Decision Register (`D0-01` through `D0-12`) and Phase 1 migration plan.
- **Acceptance Criteria:** All unit tests in `@mors/domain` and `apps/web`, `supabase test db` pgTAP tests, and `pnpm check:*` pass with zero regressions.

---

### Phase 2: Restaurant, Branch & Dish-at-Place Data Architecture
- **Reference Spec:** [MORS_Phase_2_Restaurant_and_Dish_Data_Architecture.md](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/2.0/MORS_Phase_2_Restaurant_and_Dish_Data_Architecture.md)
- **Objective:** Enrich `public.places` and `public.dishes` with structured discovery metadata (neighborhood/area, cuisines, venue style, price tier, dietary classification, slug), create the trigger-maintained `public.place_dish_public_stats` table linking canonical dishes to specific restaurants, and fix `merge_dishes` / `merge_places` so all FK tables and aggregates stay consistent.
- **Affected Files / Modules:**
  - `supabase/migrations/20261112000035_mors2_phase2_place_dish_architecture.sql`
  - `supabase/tests/` (pgTAP tests for `place_dish_public_stats` triggers, brand/branch queries, and canonical merges)
  - `packages/domain/src/schemas.ts` (place & dish metadata schemas)
  - `packages/db/src/database.types.ts`
  - `apps/web/src/app/dish/actions.ts`, `apps/web/src/app/log/actions.ts`
- **Database Changes:**
  - Extend `public.places` with `slug`, `area_name`, `cuisines` (`text[]`), `venue_style`, `price_tier` (`smallint 1..4`), `dietary_classification`, `is_brand_parent` (`boolean`).
  - Extend `public.dishes` with `category_slug`, `dietary_classification`, `default_spice_level`.
  - Create `public.place_dish_public_stats` (`place_id`, `dish_id`, `public_experience_count`, `public_rating_count`, `public_rating_avg`, `taste_avg`, `portion_avg`, `value_avg`, `typical_price_inr`, `updated_at`) with RLS enabled, explicit policies, indexes, and trigger `recompute_place_dish_stats(p_place_id, p_dish_id)`.
  - Update `merge_dishes` and `merge_places` to re-point `collection_items`, `dish_translations`, `dish_similarity`, and recompute stats.
- **Dependencies:** Phase 1 completion.
- **Acceptance Criteria:** `place_dish_public_stats` automatically updates on experience insert/update/delete and profile privacy changes; canonical merges re-point all FKs cleanly.

---

### Phase 3: Find Food & Find Restaurants Discovery Engine
- **Reference Spec:** [MORS_Phase_3_Find_Food_and_Find_Restaurants_Discovery_Engine.md](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/2.0/MORS_Phase_3_Find_Food_and_Find_Restaurants_Discovery_Engine.md)
- **Objective:** Build the MORS 2.0 dual-intent discovery engine (**Find Food** for dish-first search/comparison and **Find Restaurants** for venue-first filtering/ranking) backed by fast, keyset-paginated Postgres RPCs and a cohesive discovery UI.
- **Affected Files / Modules:**
  - `supabase/migrations/20261112000036_mors2_phase3_discovery_rpcs.sql`
  - `apps/web/src/app/search/page.tsx`, `apps/web/src/app/search/actions.ts`
  - `apps/web/src/components/search/SearchClientView.tsx`
  - `apps/web/src/app/explore/page.tsx`, `apps/web/src/app/explore/actions.ts`
  - `apps/web/src/components/shell/AppShell.tsx`
  - `docs/FEATURE_REGISTRY.md`
- **Backend / Frontend Changes:**
  - Create `find_food_dishes` RPC (filters by query, city, area, cuisine, dietary tag, price tier, min rating; returns canonical dish stats + top serving restaurants preview).
  - Create `find_restaurants` RPC (filters by query, city, area, cuisine, venue style, price tier, dietary classification, min overall/food/hygiene/value rating; sorts by consensus rating, food quality, value, hygiene, or popularity).
  - Upgrade `/search` and `/explore` into a unified, intentional **Find Food / Find Restaurants / People & Journals** discovery experience with SVG icons (removing raw emojis), skeleton states, empty states, and URL-synced filter chips.
- **Dependencies:** Phase 2 completion.

---

### Phase 4: Multi-Dimensional Review & Experience Logging UX
- **Reference Spec:** [MORS_Phase_4_Multi_Dimensional_Review_and_Experience_Logging_UX.md](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/2.0/MORS_Phase_4_Multi_Dimensional_Review_and_Experience_Logging_UX.md)
- **Objective:** Upgrade `LogModal.tsx` and experience detail views (`/e/[id]`) so users can log a quick meal in `< 20 seconds` OR expand progressive sections to rate individual dishes (`Taste`, `Portion`, `Value`, price, spice) and rate the restaurant across 5 dimensions (`Food Quality`, `Value for Money`, `Ambience`, `Service`, `Hygiene`), while keeping home-cooked logging completely free of restaurant fields.
- **Affected Files / Modules:**
  - `apps/web/src/components/log/LogModal.tsx`
  - `apps/web/src/components/log/DishCombobox.tsx`, `apps/web/src/components/log/PlaceCombobox.tsx`
  - `apps/web/src/app/log/actions.ts`
  - `apps/web/src/app/e/[id]/page.tsx`
  - `apps/web/src/components/feed/ExperienceCard.tsx`
  - `docs/FEATURE_REGISTRY.md`
- **Frontend / Backend Changes:**
  - Decouple `dishes[0].rating` from `overallRating` and `place_rating_*` in `LogModal.tsx`.
  - Conditionally render the 5-dimension Restaurant Scorecard section only when a `place` is selected.
  - Render per-dish expandable sub-ratings (`Taste`, `Portion`, `Value`, `Price ₹`, `Spice`) on each dish row.
  - Display the structured restaurant review breakdown and dish sub-ratings on `/e/[id]`.
- **Dependencies:** Phase 1 & Phase 2 completion.

---

### Phase 5: Restaurant Profile & Canonical Dish Comparison Pages
- **Reference Spec:** [MORS_Phase_5_Restaurant_Profile_and_Canonical_Dish_Comparison_Pages.md](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/2.0/MORS_Phase_5_Restaurant_Profile_and_Canonical_Dish_Comparison_Pages.md)
- **Objective:** Transform `/place/[id]` into a rich Restaurant Profile (with 5-dimension community scorecard, `>= 3` rating sample threshold, sibling/parent branch navigation, and **"What to Order Here"** ranked dish menu) and transform `/dish/[slug]` into a Canonical Dish Comparison hub (with **"Where to Eat This Dish"** ranked restaurant comparison cards, dish sub-rating bars, and personal vs. community split).
- **Affected Files / Modules:**
  - `apps/web/src/app/place/[id]/page.tsx`
  - `apps/web/src/app/dish/[slug]/page.tsx`
  - `apps/web/src/app/dish/actions.ts`
  - `apps/web/src/app/city/[slug]/page.tsx`
  - `docs/FEATURE_REGISTRY.md`
- **Backend / Frontend Changes:**
  - Fix `getDishBySlug` and `getPlaceById` public experience lists so private-profile entries visible to a follower never leak into public entity lists (enforcing `profiles.is_private = false AND profiles.discoverable = true`).
  - Gate `/place/[id]` community consensus on `publicRatingCount >= 3` instead of `publicExperienceCount >= 3`.
  - Query `place_dish_public_stats` on `/place/[id]` to render **"What to Order Here"** (top-rated and most-logged dishes at that restaurant).
  - Query `place_dish_public_stats` on `/dish/[slug]` to render **"Where to Eat <Dish> in <City>"** (ranked restaurants serving that dish with per-venue dish score, rating count, area, and price).
- **Dependencies:** Phase 2, Phase 3, and Phase 4 completion.

---

### Phase 6: Trust, Moderation & Anti-Manipulation Hardening
- **Reference Spec:** [MORS_Phase_6_Trust_Moderation_and_Anti_Manipulation_Hardening.md](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/2.0/MORS_Phase_6_Trust_Moderation_and_Anti_Manipulation_Hardening.md)
- **Objective:** Protect restaurant and dish rankings from brigading, duplicate-review spam, self-dealing, and privacy leaks via database constraints, rate limits, anomaly flags, and admin moderation workflows.
- **Affected Files / Modules:**
  - `supabase/migrations/20261112000037_mors2_phase6_trust_and_anti_manipulation.sql`
  - `apps/web/src/app/admin/page.tsx`, `apps/web/src/app/admin/actions.ts`
  - `supabase/tests/` (pgTAP security & anti-manipulation suite)
- **Database / Backend Changes:**
  - Per-user per-place / per-dish aggregation weighting or recency deduplication (so one user logging the same place 20 times in a day cannot single-handedly skew `place_public_stats` or bypass the 3-reviewer minimum threshold — **require `COUNT(DISTINCT fe.user_id) >= 3` for public consensus!**).
  - Automated spam signal insertion when rapid rating spikes occur on a single venue.
  - Admin review moderation & canonical merge UI enhancements on `/admin`.
- **Dependencies:** Phase 5 completion.

---

### Phase 7: Hyderabad Beta Seed, End-to-End QA & Launch Gate
- **Reference Spec:** [MORS_Phase_7_Hyderabad_Beta_Seed_QA_and_Launch_Gate.md](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/2.0/MORS_Phase_7_Hyderabad_Beta_Seed_QA_and_Launch_Gate.md)
- **Objective:** Populate `supabase/seed.sql` with realistic, culturally accurate Hyderabad restaurants, branches, canonical dishes (with Telugu/Hindi script names), multi-dimensional reviews, and home-cooked experiences; execute full unit, pgTAP, Playwright E2E, axe accessibility, and 360/768/1280 viewport checks; and produce the MORS 2.0 Launch Gate report.
- **Affected Files / Modules:**
  - `supabase/seed.sql`, `supabase/audit_fixtures.sql`
  - `apps/web/e2e/` (Playwright E2E tests for MORS 2.0 journeys)
  - `docs/FEATURE_REGISTRY.md`, `docs/MORS_MASTER_EXECUTION_TRACKER.md`
- **Dependencies:** Phases 1–6 completion.
