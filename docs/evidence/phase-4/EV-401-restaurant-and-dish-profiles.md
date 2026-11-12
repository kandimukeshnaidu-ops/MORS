# Evidence EV-401: Phase 4 Restaurant and Canonical Dish Profiles

**Phase:** Phase 4: Restaurant & Canonical Dish Profiles  
**Date:** 2026-11-12  
**Status:** `VERIFIED COMPLETE`  
**Related Requirements:** MORS 2.0 Brief Phase 4, Non-Negotiables #3, #4, #5, #10, #11, BUG-03, BUG-05  

---

## 1. Objectives & Scope Delivered

Phase 4 delivers the deep evidence and profile experiences that power the MORS Discovery & Regional Ranking engine:
1. **Restaurant Branch Profile (`/place/[id]`):**
   - Verified venue metadata (name, address, city, parent brand, branch network).
   - Independent 5-Dimension Scorecard: Food Quality, Value for Money, Ambience, Service, Hygiene (with per-dimension counts and averages).
   - Regional Ranking Context: Direct Bayesian rank position and confidence tier from Phase 3 (`#X in Hyderabad by Community Consensus`).
   - "What to Order Here": Canonical dishes logged at this branch with community taste score, times logged, and local dish rating average.
   - Viewer Personal Dining History: Private visit counts, latest meal rating, and "+ Log Meal Here" CTA.
2. **Canonical Dish Profile (`/dish/[slug]`):**
   - Canonical dish identity (concept name, cuisine, regional translations in Telugu/Hindi, description).
   - Independent 3-Dimension Scorecard: Taste & Flavor, Portion Size, Value for Money (with per-dimension counts and averages).
   - Regional Ranking Context: Direct Bayesian rank position and confidence tier from Phase 3 (`#X in Hyderabad by Taste Consensus`).
   - "Where to Eat This Dish": Dining venues where the community has logged this dish, with venue community score, times logged, and local dish rating.
   - Viewer Personal Taste Memory: Personal logs count, personal average score, and "+ Log This Dish" CTA.
3. **Strict Public-Pool Privacy & Isolation (BUG-03 & BUG-05 Fixed):**
   - Database RPCs `get_place_profile` and `get_dish_profile` enforce strict public pool criteria (`fe.status = 'published'`, `fe.visibility = 'public'`, `pr.is_private = false`, `pr.discoverable = true`, `pr.deletion_requested_at IS NULL`, `pr.deletion_pending_at IS NULL`, and bidirectional block exclusion).
   - Fixed `get_explore_trending` to enforce complete public pool criteria.
   - Merged places/dishes seamlessly redirect to the canonical entity without splitting ratings or losing historic logs.
   - Unlisted places and dishes return `NULL` (404 Not Found) to strangers, preserving creator privacy.

---

## 2. Database Migration 37 Summary

- File: [`supabase/migrations/20261112000037_mors2_phase4_profiles_and_evidence.sql`](file:///c:/Users/mukes/OneDrive/Desktop/MORS/supabase/migrations/20261112000037_mors2_phase4_profiles_and_evidence.sql)
- Applied: `supabase_db_MORS` (local Docker database container).
- Functions and triggers:
  1. `get_explore_trending(p_limit integer)`: Hardened to enforce strict public pool and active profile status.
  2. `get_place_profile(p_place_id uuid, p_viewer_id uuid)`: Atomic, `SECURITY DEFINER` RPC delivering full place metadata, 5-dimension scorecard, regional ranking, "What to Order Here" dish rankings, and public experience feed.
  3. `get_dish_profile(p_slug text, p_viewer_id uuid)`: Atomic, `SECURITY DEFINER` RPC delivering canonical dish metadata, translations, 3-dimension scorecard, regional ranking, "Where to Eat This Dish" place rankings, and public experience feed.
  4. Extended `dish_public_stats` with `taste_count`, `portion_count`, `value_count` and updated `recompute_dish_stats` to maintain per-dimension denominators.

---

## 3. Automated Verification & Test Suite

### pgTAP Database Tests (15/15 passed)
- Test suite: [`supabase/tests/phase4_profiles.test.sql`](file:///c:/Users/mukes/OneDrive/Desktop/MORS/supabase/tests/phase4_profiles.test.sql)
- Execution:
  ```
  ok 1 - get_place_profile should return valid json for canonical place
  ok 2 - place profile has correct place name
  ok 3 - merged place redirects to canonical place id
  ok 4 - unlisted place returns NULL to stranger
  ok 5 - unlisted place returns data to creator
  ok 6 - place profile includes food quality count > 0
  ok 7 - place profile dishes_logged lists canonical dish
  ok 8 - recent_experiences has exactly 1 entry (private profile experience excluded)
  ok 9 - get_dish_profile returns valid json for canonical slug
  ok 10 - merged dish redirects to canonical slug
  ok 11 - unlisted dish returns NULL to stranger
  ok 12 - dish profile includes Telugu translation
  ok 13 - dish profile places_logged lists the restaurant venue
  ok 14 - dish recent_experiences has exactly 1 entry (private profile excluded)
  ok 15 - get_explore_trending strictly excludes private profile entries
  ```

### Static Gates & Typecheck
- `pnpm typecheck`: **6/6 tasks passed** (0 errors).
- `pnpm test`: **67/67 unit tests passed** (25 in `@mors/domain`, 42 in `web`).
- `pnpm check:nofake`: **0 violations**.
- `pnpm check:rls`: **0 violations** (52 public tables audited).
- `pnpm check:secrets`: **0 violations**.
- `pnpm build`: **Compiled cleanly** (27 static & dynamic routes).
