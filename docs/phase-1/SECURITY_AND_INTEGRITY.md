# MORS Phase 1 — Security, Authorization & Integrity Specification

- **Phase:** 1 — Rating Architecture & Data Model Foundation
- **Deliverable:** `docs/phase-1/SECURITY_AND_INTEGRITY.md`
- **Date:** 2026-11-12

---

## 1. Row-Level Security Policies for Phase 1

### 1.1 `public.dishes`
- **Current Defect:** `SELECT USING (true)` exposed unlisted user-created dishes and `created_by`.
- **Target Policy (Phase 1):**
  ```sql
  DROP POLICY IF EXISTS "Dishes readable by everyone" ON public.dishes;
  CREATE POLICY "dishes_select_policy" ON public.dishes
    FOR SELECT
    USING (
      is_listed = true
      OR created_by = (SELECT auth.uid())
      OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
    );
  ```

### 1.2 `public.places`
- **Current Defect:** `SELECT USING (true)` exposed unlisted user-created places and `created_by`.
- **Target Policy (Phase 1):**
  ```sql
  DROP POLICY IF EXISTS "Places readable by everyone" ON public.places;
  CREATE POLICY "places_select_policy" ON public.places
    FOR SELECT
    USING (
      is_listed = true
      OR created_by = (SELECT auth.uid())
      OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
    );
  ```

### 1.3 `public.place_public_stats` and `public.dish_public_stats`
- Readable by all users (`USING (true)`), because rows strictly contain pre-aggregated, privacy-vetted public-pool numbers.
- Mutations strictly forbidden for clients (`FOR ALL USING (false)`), modified only via `SECURITY DEFINER` recompute functions.

---

## 2. Public-Pool Integrity Trigger on `public.profiles`

Whenever a user's privacy or deletion state changes, their past experiences must instantly stop contributing to public averages without waiting for new eating logs:

```sql
CREATE OR REPLACE FUNCTION public.handle_profile_privacy_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_dish_id UUID;
  v_place_id UUID;
BEGIN
  IF (OLD.is_private IS DISTINCT FROM NEW.is_private)
     OR (OLD.discoverable IS DISTINCT FROM NEW.discoverable)
     OR (OLD.deletion_requested_at IS DISTINCT FROM NEW.deletion_requested_at)
     OR (OLD.deletion_pending_at IS DISTINCT FROM NEW.deletion_pending_at) THEN

    -- Recompute all places visited by this user
    FOR v_place_id IN
      SELECT DISTINCT fe.place_id
      FROM public.food_experiences fe
      WHERE fe.user_id = NEW.id AND fe.place_id IS NOT NULL
    LOOP
      PERFORM public.recompute_place_stats(v_place_id);
    END LOOP;

    -- Recompute all dishes logged by this user
    FOR v_dish_id IN
      SELECT DISTINCT ed.dish_id
      FROM public.experience_dishes ed
      JOIN public.food_experiences fe ON fe.id = ed.experience_id
      WHERE fe.user_id = NEW.id AND ed.dish_id IS NOT NULL
    LOOP
      PERFORM public.recompute_dish_stats(v_dish_id);
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_privacy_change ON public.profiles;
CREATE TRIGGER on_profile_privacy_change
  AFTER UPDATE OF is_private, discoverable, deletion_requested_at, deletion_pending_at
  ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_profile_privacy_change();
```
