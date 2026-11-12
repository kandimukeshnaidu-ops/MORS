# EV-101: Phase 1 Rating Architecture, Data Model, & RLS Verification Evidence

**Date:** 2026-11-12  
**Phase:** Phase 1 (MORS 2.0 Rating Architecture & Data Model Foundation)  
**Executed By:** Antigravity Autonomous Pair  
**Status:** ✅ PASSED (100% verified)

---

## 1. Scope of Verification
This evidence document records the complete execution and verification of:
1. **Multi-dimensional Restaurant Rating Architecture:** 5 dimensions (`food_quality`, `value_for_money`, `ambience`, `service`, `hygiene`) with Bayesian rating calculation and decoupled meal occasion ratings.
2. **Multi-dimensional Dish Sub-ratings:** 3 dimensions (`taste`, `portion`, `value`) with dietary tags and spice levels.
3. **Database Migration `20261112000034_mors2_phase1_rating_domain_and_rls_fixes.sql`** applied to local Docker PostgreSQL instance (`supabase_db_MORS`).
4. **BUG-01 Fix:** RLS select policies on `dishes` and `places` preventing unlisted entity leakage to non-creators while allowing creator access.
5. **BUG-02 Fix:** Automated `on_profile_public_pool_change` trigger on `public.profiles` ensuring changes in `is_private` or `pending_deletion` dynamically add or remove ratings from `place_public_stats` and `dish_public_stats`.
6. **BUG-04 Fix:** Corrected `recompute_user_stats` column references to match table schema.
7. **TypeScript & Monorepo Build Integrity:** `turbo build`, `turbo typecheck`, and `turbo test` passing across `@mors/domain`, `@mors/db`, and `web`.

---

## 2. Test Execution Records

### A. `@mors/domain` Unit Test Suite (Vitest)
```text
RUN v5.1.0 C:/Users/mukes/OneDrive/Desktop/MORS/packages/domain

 ✓ tests/ratings.test.ts (13 tests) 4ms
 ✓ tests/schemas.test.ts (7 tests) 9ms

Test Files  2 passed (2)
     Tests  20 passed (20)
```
- Verified half-star scaling 1..10 $\leftrightarrow$ 0.5..5.0.
- Verified Bayesian weighting and weighted average formula `(0.40 * food + 0.25 * value + 0.15 * ambience + 0.10 * service + 0.10 * hygiene)`.
- Verified strict validation schemas for `DiningContextSchema`, `DietaryTagSchema`, `SpiceLevelSchema`, `RestaurantReviewInputSchema`.

### B. Full Repository Test Suite (Turbo)
```text
$ turbo test
 Tasks:    4 successful, 4 total
Cached:    2 cached, 4 total
  Time:    2.098s

@mors/domain: 20 passed (20)
web:          40 passed (40)
Total:        60 passed (60)
```

### C. Typecheck Suite (Turbo)
```text
$ turbo typecheck
 Tasks:    6 successful, 6 total
Cached:    3 cached, 6 total
  Time:    4.655s
```

### D. Security & Non-Negotiable Audits
```text
$ tsx scripts/check-nofake.ts
✅ check:nofake passed: zero fake controls or mock data found in app code.

$ tsx scripts/check-rls.ts
✅ check:rls passed with 0 violations across all 52 tables.

$ tsx scripts/check-secrets.ts
✅ check:secrets passed: no secrets or service-role references found in client code.
```

### E. pgTAP Database Test Suite (`supabase/tests/phase1_ratings_and_rls.test.sql`)
```text
1..15
ok 1 - BUG-01: Creator can see their own unlisted place
ok 2 - BUG-01: Creator can see their own unlisted dish
ok 3 - BUG-01: Stranger cannot see an unlisted place created by another user
ok 4 - BUG-01: Stranger cannot see an unlisted dish created by another user
ok 5 - BUG-01: Stranger can see listed place
ok 6 - BUG-01: Stranger can see listed dish
ok 7 - Place stats has public_experience_count = 1
ok 8 - Place stats food_quality_avg = 10.0
ok 9 - Dish stats has public_rating_count = 1
ok 10 - Dish stats taste_avg = 10.0
ok 11 - BUG-02: Setting profile to private immediately clears entry from place_public_stats
ok 12 - BUG-02: Setting profile to private immediately clears entry from dish_public_stats
ok 13 - BUG-02: Setting profile back to public immediately restores entry in place_public_stats
ok 14 - BUG-02: Setting profile back to public immediately restores entry in dish_public_stats
ok 15 - BUG-04: recompute_user_stats runs smoothly without column or type errors
```

---

## 3. Defect Resolution Summary
| Defect ID | Description | Solution | Evidence |
|---|---|---|---|
| `BUG-01` | Unlisted `dishes` and `places` leaked to public queries | Added RLS policies checking `is_listed = true OR created_by = auth.uid() OR is_admin` | pgTAP tests 1–6 passing |
| `BUG-02` | Profile privacy change did not trigger stat recalculation | Added `on_profile_public_pool_change` trigger on `profiles` firing `recompute_place_stats` and `recompute_dish_stats` | pgTAP tests 11–14 passing |
| `BUG-04` | `recompute_user_stats` column name mismatch | Updated RPC to use valid columns on `user_stats_owner` and `user_stats_public` | pgTAP test 15 passing |
