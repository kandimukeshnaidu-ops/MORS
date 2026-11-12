# Evidence Record: EV-003 — Rating Semantics, Discovery, and UI Route Trace

- **Evidence ID:** `EV-003`
- **Timestamp:** `2026-11-12T00:16:30+05:30`
- **Git Commit SHA:** `dd12d32ecf7c3ce51a3853bc54e89642f949c47e`
- **Phase:** Phase 0 — Product Specification & Repository Reality Audit

---

## 1. Commands / Inspection Methods Executed

1. Static code trace of rating conversion, validation, logging UI, Server Actions, RPCs, trigger aggregation, and display components.
2. Route and navigation inventory across `apps/web/src/app` and `apps/web/src/components/shell/AppShell.tsx`.

---

## 2. Relevant Paths & Symbols Inspected

- [ratings.ts](file:///c:/Users/mukes/OneDrive/Desktop/MORS/packages/domain/src/ratings.ts) (`dbRatingToDisplay`, `displayRatingToDb`, `formatDisplayRating`)
- [schemas.ts](file:///c:/Users/mukes/OneDrive/Desktop/MORS/packages/domain/src/schemas.ts) (`DbRatingSchema`, `ExperienceDishInputSchema`, `CreateExperienceInputSchema`)
- [LogModal.tsx](file:///c:/Users/mukes/OneDrive/Desktop/MORS/apps/web/src/components/log/LogModal.tsx) (`LogModal`, lines 494–507, 584–625, 318–335)
- [RatingStars.tsx](file:///c:/Users/mukes/OneDrive/Desktop/MORS/apps/web/src/components/ui/RatingStars.tsx)
- [log/actions.ts](file:///c:/Users/mukes/OneDrive/Desktop/MORS/apps/web/src/app/log/actions.ts) (`saveExperience`, `searchDishes`, `searchPlaces`, `createDish`, `createPlace`)
- [20261110000013_v3_core_schema_and_idempotency.sql](file:///c:/Users/mukes/OneDrive/Desktop/MORS/supabase/migrations/20261110000013_v3_core_schema_and_idempotency.sql) (`create_experience`)
- [20261110000014_trigger_maintained_stats.sql](file:///c:/Users/mukes/OneDrive/Desktop/MORS/supabase/migrations/20261110000014_trigger_maintained_stats.sql) (`recompute_dish_stats`, `recompute_place_stats`)
- [dish/actions.ts](file:///c:/Users/mukes/OneDrive/Desktop/MORS/apps/web/src/app/dish/actions.ts) (`getDishBySlug`, `getPlaceById`)
- [place/\[id\]/page.tsx](file:///c:/Users/mukes/OneDrive/Desktop/MORS/apps/web/src/app/place/%5Bid%5D/page.tsx) (`PlaceDetailPage`)
- [dish/\[slug\]/page.tsx](file:///c:/Users/mukes/OneDrive/Desktop/MORS/apps/web/src/app/dish/%5Bslug%5D/page.tsx) (`DishDetailPage`)
- [SearchClientView.tsx](file:///c:/Users/mukes/OneDrive/Desktop/MORS/apps/web/src/components/search/SearchClientView.tsx) (`SearchClientView`)
- [explore/page.tsx](file:///c:/Users/mukes/OneDrive/Desktop/MORS/apps/web/src/app/explore/page.tsx) (`ExplorePage`)
- [AppShell.tsx](file:///c:/Users/mukes/OneDrive/Desktop/MORS/apps/web/src/components/shell/AppShell.tsx) (`AppShell`)

---

## 3. Observed Results

### 3.1 End-to-End Rating Trace
1. **Domain Layer (`packages/domain/src/ratings.ts` & `schemas.ts`):**
   - Internal DB representation is `smallint` `1..10` (`MIN_DB_RATING = 1`, `MAX_DB_RATING = 10`).
   - UI representation is `0.5..5.0` stars (`dbRatingToDisplay(r) = r / 2`, `displayRatingToDb(d) = Math.round(d * 2)`).
   - `CreateExperienceInputSchema` validates `overall_rating: DbRatingSchema.nullable().optional()` and `dishes[].rating: DbRatingSchema.nullable().optional()`.
   - **No multi-dimensional rating schemas exist** for restaurants (`food_quality`, `value_for_money`, `ambience`, `service`, `hygiene`) or dishes (`taste`, `portion`, `value`).
2. **UI Capture (`apps/web/src/components/log/LogModal.tsx`):**
   - Lines 499–506: A single `RatingStars` input in Quick Log sets both `dishes[0].rating` and `overallRating` simultaneously:
     ```tsx
     <RatingStars
       value={dishes[0]?.rating ?? overallRating}
       onChange={(newRating) => {
         handleDishChange(0, { rating: newRating });
         setOverallRating(newRating);
       }}
       size="md"
     />
     ```
   - Lines 610–615: When `isDetailedOpen` is expanded, each dish row renders its own `RatingStars` that updates `dishes[idx].rating`. If the user changes `dishes[0].rating` inside the detailed dish list, `overallRating` is NOT updated (it remains at whatever was clicked in the top control, or `null` if the user only rated inside the detailed section). Conversely, there is no separate "Overall Experience Rating" or "Restaurant Rating" control in the detailed section.
3. **Database Aggregation (`20261110000014_trigger_maintained_stats.sql`):**
   - `recompute_dish_stats(p_dish_id)` computes `public_experience_count = count(DISTINCT fe.id)`, `public_rating_count = count(ed.rating)`, and `public_rating_avg = round(avg(ed.rating)::numeric, 2)` from `experience_dishes ed JOIN food_experiences fe JOIN profiles p`.
   - `recompute_place_stats(p_place_id)` computes `public_experience_count = count(DISTINCT fe.id)` and `public_rating_avg = round(avg(fe.overall_rating)::numeric, 2)` from `food_experiences fe JOIN profiles p`.
   - `place_public_stats` does NOT have a `public_rating_count` column.
4. **Display (`apps/web/src/app/place/[id]/page.tsx` & `dish/[slug]/page.tsx`):**
   - `dish/[slug]/page.tsx` line 110 gates community consensus on `dish.stats.publicRatingCount >= 3`.
   - `place/[id]/page.tsx` line 105 gates community consensus on `place.stats.publicExperienceCount >= 3` (even if 0 or 1 of those experiences actually had an `overall_rating`!).
   - Both pages divide `publicRatingAvg` by 2 (`(place.stats.publicRatingAvg / 2).toFixed(1)`) to display on the `0.5..5.0` scale.

### 3.2 Public-Pool Leakage in `getDishBySlug` and `getPlaceById` (`apps/web/src/app/dish/actions.ts`)
- Lines 132–151 (`getDishBySlug`) and lines 309–322 (`getPlaceById`) query `recentExperiences` with `.eq('status', 'published').eq('visibility', 'public')` using the caller's Supabase client.
- Because RLS (`can_view_experience`) allows an accepted follower of a private profile (`profiles.is_private = true`) to read that user's `visibility = 'public'` experience, a follower visiting `/dish/[slug]` or `/place/[id]` will see the private user's experience listed under **"Public Community Logs"** / **"Public Experiences"**, violating Non-Negotiable #10.

### 3.3 Discovery & Navigation Reality (`AppShell.tsx`, `/search`, `/explore`)
- Desktop sidebar (`AppShell.tsx` lines 15–80) has 7 items: `Home` (`/`), `Diary` (`/diary`), `Search` (`/search`), `Explore` (`/explore`), `Collections` (`/collections`), `Notifications` (`/notifications`), `Profile` (`/profile`), plus `Log Experience` button.
- Mobile bottom bar (`AppShell.tsx` lines 214–269) has 5 items: `Home` (`/`), `Explore` (`/explore`), `+` (Log Modal), `Saved` (`/collections`), `Profile` (`/profile`), with a small `🔍` link to `/search` in the mobile top header.
- `/search` (`SearchClientView.tsx`) is a flat trigram/ILIKE keyword search box with 6 type tabs (`All Results`, `Dishes`, `Places`, `People`, `Experiences`, `Collections`) and a free-text `City` input when `All Results` or `Places` is selected.
- **MORS 2.0 Discovery Gaps:**
  - No unified `Find` entry point or dual-intent split (`Find Food` vs `Find Restaurants`).
  - No dish-first restaurant comparison on `/dish/[slug]` (currently only shows a flat list of recent experience logs, not a ranked list of restaurants serving that dish with per-restaurant dish ratings, price, and review counts).
  - No restaurant menu/dish breakdown on `/place/[id]` (currently only shows recent experience logs, not top-rated dishes at that restaurant).
  - No filters or sort controls for rating threshold, price range/tier, veg/non-veg dietary type, area/neighborhood, dining style, or minimum review count.

---

## 4. Limitations

- None. All cited files and line numbers were inspected directly at commit `dd12d32ecf7c3ce51a3853bc54e89642f949c47e`.
