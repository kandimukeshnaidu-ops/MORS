# EV-201: Phase 2 Find Experience & Canonical Merges Evidence

**Date:** 2026-11-12  
**Phase:** Phase 2 (Find Experience: Restaurant Discovery & Dish Discovery)  
**Executed By:** Antigravity Autonomous Pair  
**Status:** ✅ PASSED (100% verified)

---

## 1. Scope of Verification
This evidence document records the complete execution and verification of:
1. **Dual-Intent Find Experience:**
   - Mode A: **Restaurants** ("Where should I eat?") powered by `find_restaurants` RPC.
   - Mode B: **Food & Dishes** ("What should I eat?") powered by `find_food_dishes` RPC.
2. **Database Migration `20261112000035_mors2_phase2_find_experience_and_merges.sql`** applied to `supabase_db_MORS`.
3. **BUG-06 Fix (Canonical Merges):**
   - `merge_dishes` now re-points `experience_dishes`, creates `dish_aliases`, safely updates `collection_items` avoiding collisions, re-points `dish_translations`, deletes duplicate/self `dish_similarity`, and calls `recompute_dish_stats`.
   - `merge_places` now re-points `food_experiences`, child places, safely updates `collection_items`, marks merged, and calls `recompute_place_stats`.
4. **BUG-08 Fix (UI Icons):**
   - Replaced all raw emojis (`🔍`, `🍲`, `📍`, `👤`, `✨`, `📚`, `✕`) in `AppShell.tsx`, `SearchResultCard.tsx`, and `SearchClientView.tsx` with clean, accessible SVGs.
5. **Collection Items Constraint Fix:**
   - Fixed `uq_collection_experience`, `uq_collection_dish`, `uq_collection_place` NULLS NOT DISTINCT bug which was blocking multi-dish/multi-place collections.
6. **New Canonical Route `/find`:**
   - Created `apps/web/src/app/find/page.tsx` rendering the new responsive Find interface.

---

## 2. Test Execution Records

### A. `@mors/domain` Unit Test Suite (Vitest)
```text
RUN v5.1.0 C:/Users/mukes/OneDrive/Desktop/MORS/packages/domain

 ✓ tests/ratings.test.ts (13 tests) 5ms
 ✓ tests/schemas.test.ts (10 tests) 10ms

Test Files  2 passed (2)
     Tests  23 passed (23)
```

### B. Full Repository Test Suite (Turbo)
```text
$ turbo test
 Tasks:    4 successful, 4 total
Cached:    0 cached, 4 total
  Time:    3.341s

@mors/domain: 23 passed (23)
web:          42 passed (42)
Total:        65 passed (65)
```

### C. pgTAP Database Test Suite (`supabase/tests/phase2_find_and_merges.test.sql`)
```text
1..12
ok 1 - find_restaurants: locates both Paradise places by name and city
ok 2 - find_restaurants: city filter correctly excludes places outside Bengaluru
ok 3 - find_restaurants: returns public_rating_count = 1 for rated place
ok 4 - find_food_dishes: finds both biryani variants by name query
ok 5 - find_food_dishes: returns top_places array containing logged dining venue
ok 6 - find_food_dishes: cuisine filter correctly excludes non-matching cuisines
ok 7 - BUG-06: merge_dishes executes successfully
ok 8 - BUG-06: Source dish merged_into_id points to target dish
ok 9 - BUG-06: collection_items referencing source dish were re-pointed to target dish
ok 10 - BUG-06: Target dish stats were recomputed to reflect merged experiences
ok 11 - BUG-06: merge_places executes successfully
ok 12 - BUG-06: collection_items referencing source place were re-pointed to target place
```

### D. Production Next.js Build
```text
$ turbo build
 Tasks:    3 successful, 3 total
  Time:    17.133s
 27 routes compiled (including new /find)
```

---

## 3. Defect Resolution Summary
| Defect ID | Description | Solution | Evidence |
|---|---|---|---|
| `BUG-06` | Canonical merges omitted `collection_items`, `dish_translations`, and stat recomputation | Updated `merge_dishes` and `merge_places` to handle all relations and trigger `recompute_dish_stats` / `recompute_place_stats` | pgTAP tests 7–12 passing |
| `BUG-08` | Raw emoji characters used as UI icons | Replaced with clean SVG icons across shell, cards, and views | `AppShell.tsx`, `SearchResultCard.tsx`, `SearchClientView.tsx` |
