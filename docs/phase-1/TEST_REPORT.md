# Phase 1 Test Report: Rating Architecture & Data Model Foundation

**Date:** 2026-11-12  
**Status:** ✅ ALL TESTS PASSING  
**Coverage:** Domain ratings, schema validation, database migrations, pgTAP RLS checks, and trigger recomputation.

---

## 1. Summary of Results

| Suite | Component | Tests Run | Passed | Failed | Status |
|---|---|---|---|---|---|
| Vitest | `@mors/domain` (Ratings & Schemas) | 20 | 20 | 0 | ✅ PASS |
| Vitest | `apps/web` (E2E & Unit) | 40 | 40 | 0 | ✅ PASS |
| pgTAP | Database RLS & Rating Triggers | 15 | 15 | 0 | ✅ PASS |
| TypeScript | Monorepo Typecheck (`turbo typecheck`) | 4 packages | 4 packages | 0 | ✅ PASS |
| Integrity | `pnpm check:nofake` | 1 | 1 | 0 | ✅ PASS |
| Integrity | `pnpm check:rls` | 52 tables | 52 tables | 0 | ✅ PASS |
| Integrity | `pnpm check:secrets` | 1 | 1 | 0 | ✅ PASS |

---

## 2. Key Assertions Verified

### Mathematical & Domain Rating Logic:
- Correct conversion between database half-stars (1..10) and user display format (0.5..5.0).
- Bayesian weighted average formula for restaurants:
  $$\text{Score} = 0.40 \cdot \text{food} + 0.25 \cdot \text{value} + 0.15 \cdot \text{ambience} + 0.10 \cdot \text{service} + 0.10 \cdot \text{hygiene}$$
- Correct validation for 3 dish sub-ratings (`taste`, `portion`, `value`) on smallint range 1..10.
- Decoupling verified: Meal occasion ratings (`overall_rating`) are stored and computed independently of restaurant reviews (`place_rating_*`).

### Security & Authorization (RLS):
- `dishes` table RLS allows creator to view their unlisted dishes, but hides them completely from other authenticated and anonymous users.
- `places` table RLS allows creator to view their unlisted places, but hides them from others until listed or curated.

### Trigger Maintenance & Privacy Cascade:
- Adding a public experience immediately updates `place_public_stats` and `dish_public_stats`.
- Changing a user profile from `is_private = false` to `is_private = true` immediately strips all of that user's experiences and dish ratings from `place_public_stats` and `dish_public_stats`.
- Reverting the profile back to `is_private = false` immediately restores all entries into public aggregates.
