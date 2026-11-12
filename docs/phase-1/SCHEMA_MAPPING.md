# MORS Phase 1 — Schema Mapping Specification

- **Phase:** 1 — Rating Architecture & Data Model Foundation
- **Deliverable:** `docs/phase-1/SCHEMA_MAPPING.md`
- **Date:** 2026-11-12
- **Git Baseline SHA:** `dd12d32ecf7c3ce51a3853bc54e89642f949c47e`

---

## 1. Existing vs. Target Entity Mapping

| Conceptual Concept | Existing Table / Column | Target Entity in MORS 2.0 | Action / Disposition |
|---|---|---|---|
| **User Account** | `public.profiles` (`id, username, is_private, discoverable, ...`) | `public.profiles` | **Reusable.** Add trigger on privacy/deletion changes to recompute public aggregates. |
| **Food Experience** | `public.food_experiences` (`id, user_id, place_id, overall_rating, title, ...`) | `public.food_experiences` | **Reusable & Extended.** Add 5-dimension restaurant review columns (`place_rating_*`, `dining_context`, `would_return`). Keep `overall_rating` as meal occasion rating. |
| **Dish Appearance** | `public.experience_dishes` (`id, experience_id, dish_id, display_name, rating, note, ...`) | `public.experience_dishes` | **Reusable & Extended.** Add dish sub-ratings (`taste_rating`, `portion_rating`, `value_rating`), `price_amount`, `dietary_tag`, `spice_level`. |
| **Canonical Dish** | `public.dishes` (`id, name, slug, cuisine, is_listed, created_by, ...`) | `public.dishes` | **Reusable.** Fix RLS policy so `is_listed = false` is creator-only. In Phase 2, add discovery metadata. |
| **Dish Aliases** | `public.dish_aliases` (`id, dish_id, alias, normalized_alias`) | `public.dish_aliases` | **Reusable.** Preserved for search matching. |
| **Dish Translations** | `public.dish_translations` (`dish_id, locale, name`) | `public.dish_translations` | **Reusable.** Preserved for Telugu and Hindi scripts. |
| **Restaurant / Place** | `public.places` (`id, name, city, address, parent_place_id, is_listed, created_by, ...`) | `public.places` | **Reusable.** Fix RLS policy so `is_listed = false` is creator-only. In Phase 2, add `area_name`, `cuisines`, `venue_style`, `price_tier`, `slug`. |
| **Restaurant Aggregates** | `public.place_public_stats` (`place_id, public_experience_count, public_rating_avg`) | `public.place_public_stats` | **Reusable & Extended.** Add `public_rating_count`, 5-dimension averages & counts (`food_quality_avg`, `value_for_money_avg`, `ambience_avg`, `service_avg`, `hygiene_avg`), and `would_return_pct`. |
| **Dish Aggregates** | `public.dish_public_stats` (`dish_id, public_experience_count, public_rating_count, public_rating_avg`) | `public.dish_public_stats` | **Reusable & Extended.** Add `taste_avg`, `portion_avg`, `value_avg`. |
| **Dish-at-Place Aggregates** | *(Does not exist)* | `public.place_dish_public_stats` | **Missing.** Scheduled for creation in Phase 2 linking `(place_id, dish_id)`. |

---

## 2. Field-by-Field Mapping for Phase 1 Changes

### 2.1 Table `public.food_experiences`
| Field Name | Type | Existing? | Target Nullability | Invariant / Validation Rule |
|---|---|---|---|---|
| `id` | `uuid` | Existing (PK) | `NOT NULL` | Immutable UUID |
| `overall_rating` | `smallint` | Existing | Nullable | Meal occasion rating (`1..10`) |
| `place_rating_overall` | `smallint` | **New** | Nullable | Restaurant composite/explicit rating (`1..10`). Must be NULL if `place_id IS NULL`. |
| `place_rating_food` | `smallint` | **New** | Nullable | Restaurant food quality (`1..10`). Must be NULL if `place_id IS NULL`. |
| `place_rating_value` | `smallint` | **New** | Nullable | Restaurant value for money (`1..10`). Must be NULL if `place_id IS NULL`. |
| `place_rating_ambience` | `smallint` | **New** | Nullable | Restaurant ambience (`1..10`). Must be NULL if `place_id IS NULL`. |
| `place_rating_service` | `smallint` | **New** | Nullable | Restaurant service (`1..10`). Must be NULL if `place_id IS NULL`. |
| `place_rating_hygiene` | `smallint` | **New** | Nullable | Restaurant hygiene (`1..10`). Must be NULL if `place_id IS NULL`. |
| `dining_context` | `text` | **New** | Nullable | `CHECK (dining_context IN ('dine_in', 'takeaway', 'street_stall'))` |
| `would_return` | `boolean` | **New** | Nullable | User recommendation signal |

### 2.2 Table `public.experience_dishes`
| Field Name | Type | Existing? | Target Nullability | Invariant / Validation Rule |
|---|---|---|---|---|
| `id` | `uuid` | Existing (PK) | `NOT NULL` | Immutable UUID |
| `rating` | `smallint` | Existing | Nullable | Overall dish rating (`1..10`) |
| `taste_rating` | `smallint` | **New** | Nullable | Dish taste score (`1..10`) |
| `portion_rating` | `smallint` | **New** | Nullable | Dish portion size score (`1..10`) |
| `value_rating` | `smallint` | **New** | Nullable | Dish value score (`1..10`) |
| `price_amount` | `numeric(10,2)` | **New** | Nullable | `CHECK (price_amount >= 0)` |
| `dietary_tag` | `text` | **New** | Nullable | `CHECK (dietary_tag IN ('veg', 'egg', 'non_veg'))` |
| `spice_level` | `smallint` | **New** | Nullable | `CHECK (spice_level BETWEEN 1 AND 4)` (1=Mild, 2=Medium, 3=Spicy, 4=Fiery) |
