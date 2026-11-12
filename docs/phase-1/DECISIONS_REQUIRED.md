# MORS Phase 1 — Decisions & Confirmation Log

- **Phase:** 1 — Rating Architecture & Data Model Foundation
- **Deliverable:** `docs/phase-1/DECISIONS_REQUIRED.md`
- **Date:** 2026-11-12
- **Approval Status:** Approved by User on 2026-11-12

---

## Confirmed Decision Status

All 12 key architecture and product decisions (`P1-D01` through `P1-D12` / `D0-01` through `D0-12`) have been approved:

1. **P1-D01 / D0-01 (Product Positioning):** MORS 2.0 is a social food journal + community-powered restaurant and dish discovery platform.
2. **P1-D02 / D0-02 (Review Storage):** Restaurant review dimensions live as optional columns directly on `public.food_experiences`.
3. **P1-D03 / D0-03 (Rating Scale):** Universal `smallint 1..10` (UI `0.5..5.0` half-stars) across all dimensions.
4. **P1-D04 / D0-04 (Restaurant Overall Derivation):** Average of rated dimensions or explicit fallback to meal overall rating.
5. **P1-D05 / D0-05 (Dish Sub-Ratings):** Added to `public.experience_dishes` (`taste_rating`, `portion_rating`, `value_rating`, `price_amount`, `dietary_tag`, `spice_level`).
6. **P1-D06 / D0-06 (Brand vs Branch):** Physical outlets are distinct rows in `public.places` with `area_name`, linked to parent brand via `parent_place_id`.
7. **P1-D07 / D0-07 (Consensus Threshold):** Minimum 3 distinct public-pool reviewers for consensus scorecards; early badge for `< 3`.
8. **P1-D08 / D0-08 (Discovery Navigation):** Unified `Find` hub with dual intent (`Find Food` and `Find Restaurants`).
9. **P1-D09 / D0-09 (Place URLs):** Dual UUID and slug resolution on `/place/[id]`.
10. **P1-D10 / D0-10 (Unlisted Data RLS):** Creator-only `SELECT` on `is_listed = false` in Postgres RLS and search RPCs.
11. **P1-D11 / D0-11 (Repeat Visit Weighting):** Per-user average in public consensus to prevent single-user skew.
12. **P1-D12 / D0-12 (Geographic Scope):** Default to Hyderabad with neighborhood filters while preserving multi-city schema.
