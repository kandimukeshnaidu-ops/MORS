# MORS 2.0 — Master Continuous Execution Tracker (Phases 0 to 7)

- **Project:** MORS 2.0 — Social Food Journal + Community-Powered Restaurant & Dish Discovery Platform
- **Baseline Commit SHA:** `dd12d32ecf7c3ce51a3853bc54e89642f949c47e`
- **Last Updated:** `2026-11-12T12:57:00+05:30`
- **Current Active Phase:** ALL PHASES COMPLETE (Phases 0 through 7 Verified Complete)

---

## 1. Overall Program Summary

| Metric | Current Status |
|---|---|
| **Active Phase** | Program Complete — All Phases (0 through 7) Verified |
| **Typecheck (`pnpm typecheck`)** | Passing (`4/4` packages) |
| **Unit Tests (`pnpm test`)** | Passing (`67/67` tests across `@mors/domain` & `web`) |
| **pgTAP Database Tests** | Passing (`86/86` tests across Phase 1 to Phase 6 test suites) |
| **Playwright E2E Tests** | Passing (`16/16` tests across Desktop Chrome & Mobile Chrome) |
| **Static Gates (`check:nofake`, `check:rls`, `check:secrets`)** | Passing (`0` fake controls, `52/52` tables with RLS, `0` secret leaks) |
| **Production Build (`pnpm build`)** | Passing (`27` Next.js routes) |
| **Open Owner Decisions** | Decisions 23–34 approved & documented in `docs/DECISIONS.md` |

---

## 2. Phase-by-Phase Execution Status Table

| Phase | Name | Spec Document | Status | Key Deliverables | Blocking Issues / Gate |
|---|---|---|---|---|---|
| **Phase 0** | Product Specification & Repository Reality Audit | [MORS_Phase_0_Antigravity_Audit_Brief.md](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/2.0/MORS_Phase_0_Antigravity_Audit_Brief.md) | `VERIFIED COMPLETE` | [MORS_2_PRODUCT_GAP_AUDIT.md](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/audit/MORS_2_PRODUCT_GAP_AUDIT.md), [MORS_2_DATA_MODEL_AUDIT.md](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/audit/MORS_2_DATA_MODEL_AUDIT.md), [MORS_2_UX_AUDIT.md](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/audit/MORS_2_UX_AUDIT.md), [MORS_2_IMPLEMENTATION_SEQUENCE.md](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/audit/MORS_2_IMPLEMENTATION_SEQUENCE.md), [EV-001](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/evidence/phase-0/EV-001-repo-and-test-baseline.md), [EV-002](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/evidence/phase-0/EV-002-schema-and-rls-inventory.md), [EV-003](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/evidence/phase-0/EV-003-rating-search-and-privacy-trace.md) | None. Completed. |
| **Phase 1** | Product Alignment & Rating Domain Foundation | [MORS_Phase_1_Antigravity_Rating_Architecture_Data_Model.md](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/2.0/MORS_Phase_1_Antigravity_Rating_Architecture_Data_Model.md) | `VERIFIED COMPLETE` | Product docs alignment, `@mors/domain` multi-dim rating schemas, DB migration `34` (rating columns, RLS fixes on `dishes`/`places`, `profiles` stats trigger), [EV-101](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/evidence/phase-1/EV-101-phase1-migration-and-tests.md), [TEST_REPORT.md](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/phase-1/TEST_REPORT.md) | None. Completed. |
| **Phase 2** | Find Experience: Restaurant & Dish Discovery | [MORS_Phase_2_Antigravity_Find_Experience.md](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/2.0/MORS_Phase_2_Antigravity_Find_Experience.md) | `VERIFIED COMPLETE` | Dual-intent Find mode selector (`/find`, `/search`), `find_restaurants` & `find_food_dishes` RPCs, canonical merge fixes (`merge_dishes`, `merge_places`), [EV-201](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/evidence/phase-2/EV-201-find-experience-and-merges.md) | None. Completed. |
| **Phase 3** | Regional Ranking Engine & Confidence Adjustment | [MORS_Phase_3_Antigravity_Regional_Ranking_Engine.md](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/2.0/MORS_Phase_3_Antigravity_Regional_Ranking_Engine.md) | `VERIFIED COMPLETE` | Confidence-adjusted Bayesian ranking, minimum threshold gates (3-review gate), locality/city aggregation, ranking RPCs (`get_regional_restaurant_rankings`, `get_regional_dish_rankings`), [EV-301](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/evidence/phase-3/EV-301-regional-ranking-engine.md) | None. Completed. |
| **Phase 4** | Restaurant Profile & Canonical Dish Profiles | [MORS_Phase_4_Antigravity_Restaurant_and_Dish_Profiles.md](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/2.0/MORS_Phase_4_Antigravity_Restaurant_and_Dish_Profiles.md) | `VERIFIED COMPLETE` | Upgraded `/place/[id]` (5-dim scorecard + "What to Order Here") and `/dish/[slug]` (3-dim taste scorecard + "Where to Eat This Dish" ranking), RPCs `get_place_profile` & `get_dish_profile`, strict public-pool isolation, [EV-401](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/evidence/phase-4/EV-401-restaurant-and-dish-profiles.md) | None. Completed. |
| **Phase 5** | Personal Taste Identity & Food Journaling | [MORS_Phase_5_Antigravity_Personal_Taste_Identity.md](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/2.0/MORS_Phase_5_Antigravity_Personal_Taste_Identity.md) | `VERIFIED COMPLETE` | Upgraded `LogModal.tsx` (`BUG-07` fixed: meal occasion rating decoupled from dish sub-ratings & 5-dim place review), DB migration `38` (`get_personal_taste_identity`, `set_taste_profile_sharing`), `TasteStatsCard.tsx`, [EV-501](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/evidence/phase-5/EV-501-personal-taste-identity.md) | None. Completed. |
| **Phase 6** | Social Experience Upgrade & Curated Taste Discovery | [MORS_Phase_6_Antigravity_Social_Experience_Upgrade.md](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/2.0/MORS_Phase_6_Antigravity_Social_Experience_Upgrade.md) | `VERIFIED COMPLETE` | Fast single-query feed RPC `get_home_feed_v2`, taste-aligned recommendations RPC `get_taste_aligned_profiles`, interactive social actions on `ExperienceCard.tsx`, plan-to-draft conversion fixes, [EV-601](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/evidence/phase-6/EV-601-social-experience-upgrade.md) | None. Completed. |
| **Phase 7** | UX Reliability & Release Readiness | [MORS_Phase_7_Antigravity_UX_Reliability_Release_Readiness.md](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/2.0/MORS_Phase_7_Antigravity_UX_Reliability_Release_Readiness.md) | `VERIFIED COMPLETE` | End-to-end user journeys (16/16), multi-viewport responsive layout audit (360/768/1280), release gate sign-off, [EV-701](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/evidence/phase-7/EV-701-release-readiness.md) | None. Completed. GO FOR RELEASE. |

---

## 3. Active Defect & Security Register (Discovered in Phase 0 Audit)

| Defect ID | Severity | Component / File | Description | Target Fix Phase | Status |
|---|---|---|---|---|---|
| **BUG-01** | `CRITICAL` | [20261110000001_initial_schema.sql](file:///c:/Users/mukes/OneDrive/Desktop/MORS/supabase/migrations/20261110000001_initial_schema.sql#L52-L90), [20261110000009_search.sql](file:///c:/Users/mukes/OneDrive/Desktop/MORS/supabase/migrations/20261110000009_search.sql#L65-L95) | `dishes` and `places` have RLS policy `FOR SELECT USING (true)` and `search_all` / `find_similar_*` do not filter by `is_listed = true OR created_by = auth.uid()`, exposing unlisted reference entities and `created_by` to all clients (violates Non-Negotiables #1 & #11). | Phase 1 | ✅ Resolved in Migration 34 (`phase1_ratings_and_rls.test.sql` passed) |
| **BUG-02** | `CRITICAL` | [20261110000014_trigger_maintained_stats.sql](file:///c:/Users/mukes/OneDrive/Desktop/MORS/supabase/migrations/20261110000014_trigger_maintained_stats.sql) | No trigger on `public.profiles` when `is_private`, `discoverable`, `deletion_requested_at`, or `deletion_pending_at` changes. When a user goes private or requests deletion, their ratings remain in `dish_public_stats` and `place_public_stats` (violates Non-Negotiables #3 & #10). | Phase 1 | ✅ Resolved in Migration 34 via `on_profile_public_pool_change` trigger |
| **BUG-03** | `HIGH` | [dish/actions.ts](file:///c:/Users/mukes/OneDrive/Desktop/MORS/apps/web/src/app/dish/actions.ts), [20261112000037_mors2_phase4_profiles_and_evidence.sql](file:///c:/Users/mukes/OneDrive/Desktop/MORS/supabase/migrations/20261112000037_mors2_phase4_profiles_and_evidence.sql) | `getDishBySlug`, `getPlaceById`, and `get_explore_trending` queried public entries without strict `profiles.is_private = false AND pr.discoverable = true` filter. | Phase 4 | ✅ Resolved in Migration 37 (`phase4_profiles.test.sql` passed) |
| **BUG-04** | `HIGH` | [20261110000018_phase16_taste_stats.sql](file:///c:/Users/mukes/OneDrive/Desktop/MORS/supabase/migrations/20261110000018_phase16_taste_stats.sql#L94) | `recompute_user_stats` references non-existent column `fe.rating` instead of `fe.overall_rating`, causing runtime SQL error when invoked. | Phase 1 | ✅ Resolved in Migration 34 (`lives_ok` verified) |
| **BUG-05** | `HIGH` | [20261110000014_trigger_maintained_stats.sql](file:///c:/Users/mukes/OneDrive/Desktop/MORS/supabase/migrations/20261110000014_trigger_maintained_stats.sql#L20-L25), [place/\[id\]/page.tsx](file:///c:/Users/mukes/OneDrive/Desktop/MORS/apps/web/src/app/place/%5Bid%5D/page.tsx#L105) | `place_public_stats` lacks `public_rating_count` and averages `fe.overall_rating`. `/place/[id]` checks `publicExperienceCount >= 3` instead of `publicRatingCount >= 3`, displaying consensus ratings even when only 1 of 3 experiences was rated. | Phase 1 | ✅ Resolved in Migration 34 (`place_public_stats` has `public_rating_count` and dimension counts) |
| **BUG-06** | `MEDIUM` | [20261110000005_canonical_merges.sql](file:///c:/Users/mukes/OneDrive/Desktop/MORS/supabase/migrations/20261110000005_canonical_merges.sql#L66-L157) | `merge_dishes` omits `collection_items`, `dish_translations`, and `dish_similarity`; `merge_places` omits `collection_items`; neither calls `recompute_dish_stats` / `recompute_place_stats`. | Phase 2 | ✅ Resolved in Migration 35 (`phase2_find_and_merges.test.sql` passed) |
| **BUG-07** | `MEDIUM` | [LogModal.tsx](file:///c:/Users/mukes/OneDrive/Desktop/MORS/apps/web/src/components/log/LogModal.tsx#L499-L506) | Quick-log star input sets both `dishes[0].rating` and `overallRating` to the same value, and detailed mode has no independent control for `overallRating` or restaurant sub-ratings. | Phase 5 | ✅ Resolved in Phase 5 (meal occasion decoupled from dish sub-ratings & 5-dim place reviews) |
| **BUG-08** | `LOW` | [AppShell.tsx](file:///c:/Users/mukes/OneDrive/Desktop/MORS/apps/web/src/components/shell/AppShell.tsx#L95), [SearchClientView.tsx](file:///c:/Users/mukes/OneDrive/Desktop/MORS/apps/web/src/components/search/SearchClientView.tsx#L97) | Raw emoji characters (`🔍`, `🍲`, `📍`, `🌍`) used as UI icons, violating `GEMINI.md` Section 9 design rule. | Phase 2 | ✅ Resolved in Phase 2 (all raw emojis replaced with clean SVGs) |

---

## 4. Evidence Log Index

- **Phase 7 Evidence:**
  - [EV-701: UX Refinement, Reliability, Quality Assurance, and Release Readiness](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/evidence/phase-7/EV-701-release-readiness.md)
- **Phase 6 Evidence:**
  - [EV-601: Social Experience Upgrade & Curated Taste Discovery](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/evidence/phase-6/EV-601-social-experience-upgrade.md)
- **Phase 5 Evidence:**
  - [EV-501: Personal Taste Identity Engine](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/evidence/phase-5/EV-501-personal-taste-identity.md)
- **Phase 4 Evidence:**
  - [EV-401: Restaurant Branch and Canonical Dish Profiles](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/evidence/phase-4/EV-401-restaurant-and-dish-profiles.md)
  - [EV-001: Repository Structure, Git State, and Verification Baseline](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/evidence/phase-0/EV-001-repo-and-test-baseline.md)
  - [EV-002: Live PostgreSQL Schema, Triggers, and RLS Policy Inventory](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/evidence/phase-0/EV-002-schema-and-rls-inventory.md)
  - [EV-003: Rating Semantics, Discovery, and UI Route Trace](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/evidence/phase-0/EV-003-rating-search-and-privacy-trace.md)
