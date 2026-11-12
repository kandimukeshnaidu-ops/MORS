# MORS Phase 1 — Migration & Backfill Plan

- **Phase:** 1 — Rating Architecture & Data Model Foundation
- **Deliverable:** `docs/phase-1/MIGRATION_PLAN.md`
- **Migration File:** `supabase/migrations/20261112000034_mors2_phase1_rating_domain_and_rls_fixes.sql`
- **Date:** 2026-11-12

---

## 1. Migration Strategy (Additive & Reversible)

1. **Step 1: Column Additions with Constraints:**
   - Add restaurant rating columns to `food_experiences` and dish sub-rating columns to `experience_dishes`. All new columns are nullable to ensure 100% backward compatibility with existing data and code.
2. **Step 2: Aggregate Columns on Stats Tables:**
   - Add `public_rating_count` and dimension averages/counts with `DEFAULT 0` on `place_public_stats` and `dish_public_stats`.
3. **Step 3: Idempotent Backfill:**
   - Execute `recompute_place_stats(id)` for all existing rows in `places`.
   - Execute `recompute_dish_stats(id)` for all existing rows in `dishes`.
4. **Step 4: RLS Policy Replacement:**
   - Drop broad `SELECT USING (true)` policies on `dishes` and `places`; apply creator-scoped policies.
5. **Step 5: Trigger Creation & Bug Fixes:**
   - Attach `on_profile_privacy_change` to `public.profiles`.
   - Fix `recompute_user_stats` column typo (`fe.overall_rating`).
   - Update `create_experience` and `update_experience` RPCs to persist new columns.

---

## 2. Rollback SQL Specification

In the event of an unexpected regression:
```sql
-- 1. Drop trigger on profiles
DROP TRIGGER IF EXISTS on_profile_privacy_change ON public.profiles;
DROP FUNCTION IF EXISTS public.handle_profile_privacy_change();

-- 2. Restore previous dishes & places policies
DROP POLICY IF EXISTS "dishes_select_policy" ON public.dishes;
CREATE POLICY "Dishes readable by everyone" ON public.dishes FOR SELECT USING (true);
DROP POLICY IF EXISTS "places_select_policy" ON public.places;
CREATE POLICY "Places readable by everyone" ON public.places FOR SELECT USING (true);

-- 3. Drop added columns
ALTER TABLE public.food_experiences
  DROP COLUMN IF EXISTS place_rating_overall,
  DROP COLUMN IF EXISTS place_rating_food,
  DROP COLUMN IF EXISTS place_rating_value,
  DROP COLUMN IF EXISTS place_rating_ambience,
  DROP COLUMN IF EXISTS place_rating_service,
  DROP COLUMN IF EXISTS place_rating_hygiene,
  DROP COLUMN IF EXISTS dining_context,
  DROP COLUMN IF EXISTS would_return;

ALTER TABLE public.experience_dishes
  DROP COLUMN IF EXISTS taste_rating,
  DROP COLUMN IF EXISTS portion_rating,
  DROP COLUMN IF EXISTS value_rating,
  DROP COLUMN IF EXISTS price_amount,
  DROP COLUMN IF EXISTS dietary_tag,
  DROP COLUMN IF EXISTS spice_level;
```
