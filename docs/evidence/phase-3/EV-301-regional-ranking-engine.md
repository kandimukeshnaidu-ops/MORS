# EV-301: Phase 3 Regional Ranking Engine & Confidence Adjustment Evidence

**Date:** 2026-11-12  
**Phase:** Phase 3 (Regional Ranking Engine: Restaurants, Branches, and Dishes)  
**Executed By:** Antigravity Autonomous Pair  
**Status:** ✅ PASSED (100% verified)

---

## 1. Scope of Verification
This evidence document records the complete execution and verification of:
1. **Confidence-Adjusted Bayesian Ranking Engine:**
   - Formula: $S = \frac{n}{n + 5} R + \frac{5}{n + 5} C$, where $C$ is the regional prior mean and $m = 5.0$ is the confidence constant.
   - Evaluated against small-sample inflation: 5 ratings @ 9.0 outranks 1 rating @ 10.0.
2. **Minimum Evidence Gate:**
   - **Ranked Tier:** $n \ge 3$ eligible public ratings required for official ranking.
   - **Emerging Tier:** $1 \le n < 3$ public ratings categorized as "Emerging", never taking the #1 spot from a verified place.
   - **Unranked Tier:** $n = 0$ ratings excluded.
3. **Database Migration `20261112000036_mors2_phase3_regional_ranking_engine.sql`** applied to `supabase_db_MORS`:
   - `get_regional_prior_mean`: Computes true regional mean from public-pool entries.
   - `get_regional_restaurant_rankings`: Ranks restaurants with Bayesian shrinkage, dimension breakdowns (`food_quality`, `value_for_money`, `ambience`), and minimum evidence gates.
   - `get_regional_dish_rankings`: Ranks dishes by Bayesian score and surfaces top dining venues where community logged them.
   - `get_regional_overview`: Provides aggregated statistics for the region.
4. **UI Integration:**
   - `RegionalRankingBoard.tsx` component mounted on `/explore` with city selection, entity switching (Restaurants vs Dishes), dimension filters, and transparent explanatory microcopy.

---

## 2. Test Execution Records

### A. `@mors/domain` Unit Test Suite (Vitest)
```text
RUN v5.1.0 C:/Users/mukes/OneDrive/Desktop/MORS/packages/domain

 ✓ tests/ratings.test.ts (15 tests) 5ms
 ✓ tests/schemas.test.ts (10 tests) 9ms

Test Files  2 passed (2)
     Tests  25 passed (25)
```

### B. Full Repository Test Suite (Turbo)
```text
$ turbo test
 Tasks:    4 successful, 4 total
Cached:    2 cached, 4 total
  Time:    1.685s

@mors/domain: 25 passed (25)
web:          42 passed (42)
Total:        67 passed (67)
```

### C. pgTAP Database Test Suite (`supabase/tests/phase3_regional_rankings.test.sql`)
```text
1..12
ok 1 - get_regional_prior_mean: returns positive prior mean
ok 2 - get_regional_restaurant_rankings: returns ranked places in Hyderabad
ok 3 - Bayesian ranking: 5 reviews @ 9.0 outranks 1 review @ 10.0 due to confidence shrinkage
ok 4 - Ranking gate: Place with 5 reviews has is_ranked = true (>= 3 threshold)
ok 5 - Ranking gate: Place with 1 review has is_ranked = false (emerging tier)
ok 6 - Regional isolation: Warangal place is excluded from Hyderabad rankings
ok 7 - Regional ranking: Warangal place is included in Warangal rankings
ok 8 - get_regional_dish_rankings: returns ranked dishes in Hyderabad
ok 9 - Dish Bayesian ranking: 10 ratings @ 9.0 outranks 1 rating @ 10.0
ok 10 - Dish rankings: surfaces top dining venue where community logged this dish
ok 11 - get_regional_overview: returns row matching queried city
ok 12 - get_regional_overview: returns valid counts for total and ranked venues
```

### D. Production Next.js Build
```text
$ turbo build
 Tasks:    3 successful, 3 total
  Time:    16.571s
 27 routes compiled
```
