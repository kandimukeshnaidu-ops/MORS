# MORS Phase 1 — Rating Lifecycle Specification

- **Phase:** 1 — Rating Architecture & Data Model Foundation
- **Deliverable:** `docs/phase-1/RATING_LIFECYCLE.md`
- **Date:** 2026-11-12

---

## 1. Lifecycle Events & Aggregate Impact

| Event | Food Experience State | Eligibility for Public Pool | Effect on `place_public_stats` | Effect on `dish_public_stats` |
|---|---|---|---|---|
| **Create Quick Log** | `status = 'published'`, `visibility = 'public'`, profile public & discoverable | **Eligible** | Increments `public_experience_count`; if `place_rating_overall` or `overall_rating` provided, updates `public_rating_avg` & `public_rating_count`. | Increments `public_experience_count`; if dish `rating` provided, updates `public_rating_avg` & `public_rating_count`. |
| **Create Draft** | `status = 'draft'` | **Ineligible** | No change to public aggregates. | No change to public aggregates. |
| **Create Followers-Only** | `visibility = 'followers'` | **Ineligible** | No change to public aggregates. | No change to public aggregates. |
| **Create Private** | `visibility = 'private'` | **Ineligible** | No change to public aggregates. | No change to public aggregates. |
| **Update / Edit Log** | `status = 'published'`, `visibility = 'public'` | **Eligible** | Replaces former ratings in place aggregate (atomic recompute). | Replaces former ratings in dish aggregate (atomic recompute). |
| **Change Visibility to Private** | Visibility changed `public` -> `private` | **Ineligible** | Removes contribution from `place_public_stats`. | Removes contribution from `dish_public_stats`. |
| **Profile Goes Private** | `profiles.is_private` changed `false` -> `true` | **Ineligible** | Profile update trigger recomputes all places visited by user, removing their ratings. | Profile update trigger recomputes all dishes logged by user, removing their ratings. |
| **Delete Experience** | Row deleted via `delete_experience` RPC | **Ineligible** | Cascades deletion; trigger recomputes place stats. | Trigger recomputes dish stats. |
| **Author Deletion Request** | `deletion_requested_at` or `deletion_pending_at` set | **Ineligible** | Profile trigger fires; entries immediately excluded from public pool. | Profile trigger fires; entries immediately excluded from public pool. |

---

## 2. Idempotency & Concurrency

- Every experience creation sends a client-generated UUID `client_request_id`.
- The database enforces uniqueness on `(user_id, client_request_id)`, preventing duplicate network requests from double-counting ratings.
- Aggregates are recalculated from authoritative source rows (`food_experiences` and `experience_dishes`) inside transactional triggers, preventing incremental counter drift.
