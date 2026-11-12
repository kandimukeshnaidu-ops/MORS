# Evidence Artifact: EV-501 — Personal Taste Identity Engine

## Metadata
- **Work Package:** Phase 5 (Personal Taste Identity & Food Journaling)
- **Author:** Antigravity (Advanced Agentic Coding)
- **Date:** 2026-11-12
- **Status:** VERIFIED COMPLETE
- **Target Files:**
  - `supabase/migrations/20261112000038_mors2_phase5_personal_taste_identity.sql`
  - `supabase/tests/phase5_taste_identity.test.sql`
  - `packages/db/src/index.ts`
  - `apps/web/src/app/explore/actions.ts`
  - `apps/web/src/components/profile/TasteStatsCard.tsx`
  - `apps/web/src/components/log/LogModal.tsx`
  - `apps/web/src/app/u/[username]/page.tsx`

---

## 1. Problem Statement & Audit Findings
Prior to Phase 5:
1. **Conflated Activity and Preferences:** Earlier implementations treated frequently logged dishes and cuisines as "favorites", violating the core principle that frequency (convenience, cost, proximity) is not preference.
2. **Missing Dimension Preferences:** Place reviews (5 dimensions: food quality, value for money, ambience, service, hygiene) and dish sub-ratings (3 dimensions: taste, portion, value) were not aggregated for the personal taste profile.
3. **No Evidence Indication:** Insights did not report contributing sample sizes ($n$) or evidence states, presenting weak data as definitive taste claims.
4. **No Explicit Privacy Control:** Derived taste insights lacked explicit opt-in sharing (`taste_profile_sharing_enabled`), risking exposure of private food habits.
5. **Coupled Logging UI (BUG-07):** In `LogModal.tsx`, overall meal rating was tied directly to dish ratings rather than operating as an independent meal occasion score alongside dish sub-ratings and place reviews.

---

## 2. Technical Architecture & Implementation
Migration 38 (`20261112000038_mors2_phase5_personal_taste_identity.sql`) introduced:
1. **Privacy-by-Default Profile Column:**
   - Added `taste_profile_sharing_enabled boolean NOT NULL DEFAULT false` to `public.profiles`.
   - External viewers receive `NULL` unless the user explicitly toggles sharing on.
   - Private profiles require the viewer to be an accepted follower (`public.is_accepted_follower`) even if sharing is enabled.
2. **Deterministic Taste RPC (`get_personal_taste_identity`):**
   - **Preference Aggregation:**
     - `top_cuisines`: Filtered at $\ge 3$ ratings and average $\ge 3.5$ stars. Tags results with evidence levels (`insufficient`, `early_signal`, `consistent_pattern`).
     - `top_rated_dishes`: Repeated high ratings ($\ge 2$ logs, $\ge 4.0$ stars).
     - `dimension_patterns`: Distinct place scorecards (5 dimensions) and dish scorecards (3 dimensions) with individual counts.
   - **Activity Tracking (Frequency Alone):**
     - `most_logged_dishes` and `most_logged_cuisines` tracked purely by logged occurrence, never labeled as favorites.
     - Total meals, unique dishes, and unique places.
   - **Temporal Activity Shifts:**
     - Compares meal volume and dominant cuisine in the last 90 days vs. prior 90 days, gated by a minimum of 3 logs in each window.
3. **UI Decoupling & Display (`LogModal.tsx` & `TasteStatsCard.tsx`):**
   - Decoupled meal occasion rating from dish sub-ratings and 5-dimension place review.
   - Integrated `DimensionBar` into `TasteStatsCard.tsx` with screen-reader-accessible table.
   - Added user-facing toggle to activate or deactivate profile sharing in real time.

---

## 3. Verification & Test Evidence

### pgTAP Test Results (`supabase/tests/phase5_taste_identity.test.sql`)
16/16 tests passing cleanly:
```
ok 1 - get_personal_taste_identity(uuid, uuid) exists
ok 2 - set_taste_profile_sharing(boolean) exists
ok 3 - Blocked viewer cannot access taste identity
ok 4 - External viewer cannot access taste identity when sharing is disabled
ok 5 - Owner can access their own taste identity
ok 6 - Owner taste identity includes private experiences (total_meals = 3)
ok 7 - Unique dishes accurately counted
ok 8 - Top cuisine identified as Hyderabadi
ok 9 - Evidence level correctly classified as early_signal for 3 ratings
ok 10 - Repeated high-rated dish identified
ok 11 - Most logged dishes present in food_activity
ok 12 - Dish taste dimension has 4 ratings recorded
ok 13 - External viewer can access taste identity once sharing is enabled
ok 14 - External viewer only sees public meals (2 meals, private meal 100% hidden)
ok 15 - Viewer payload explicitly marked as public_pool_only
ok 16 - External non-follower cannot access taste identity on private profile even with sharing enabled
```

### Cumulative Verification
- Total pgTAP tests across Phases 1–5: **70/70 passing**.
- Turborepo typecheck: 6/6 tasks passed (0 TypeScript errors).
- Unit tests: 67/67 tests passed.
- Static gates (`check:nofake`, `check:rls`, `check:secrets`): 0 violations.
