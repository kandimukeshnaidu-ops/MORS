# MORS Phase 1 — Aggregation & Ranking Specification

- **Phase:** 1 — Rating Architecture & Data Model Foundation
- **Deliverable:** `docs/phase-1/AGGREGATION_SPEC.md`
- **Date:** 2026-11-12

---

## 1. Displayed Averages vs. Ranking Scores

MORS strictly distinguishes between:
1. **Displayed Average:** The transparent arithmetic average of all eligible public-pool ratings, shown directly to users alongside the exact sample count (e.g. `★ 4.6 (18 ratings)`).
2. **Confidence-Adjusted Ranking Score:** A Bayesian shrinkage score used solely for ordering search results, top lists, and regional discovery, preventing a place with 1 five-star rating from outranking an established venue with hundreds of high ratings.

### 1.1 Bayesian Shrinkage Ranking Formula
For entity ranking (dishes and places):
$$\text{Score} = \left(\frac{N}{N + M}\right) \times \bar{R} + \left(\frac{M}{N + M}\right) \times \mu_{\text{prior}}$$

Where:
- $N$ is the eligible rating count for that entity.
- $\bar{R}$ is the entity's arithmetic rating average (on the `1.0..10.0` scale).
- $M$ is the confidence constant (default: $M = 5.0$, representing the weight of 5 prior ratings).
- $\mu_{\text{prior}}$ is the regional category prior mean (default: $\mu_{\text{prior}} = 7.0$, equivalent to `3.5 / 5.0` stars).

---

## 2. Restaurant 5-Dimension Aggregation Rules

When `recompute_place_stats(p_place_id)` executes:
1. `public_experience_count` = `COUNT(DISTINCT fe.id)`
2. `public_rating_count` = `COUNT(COALESCE(fe.place_rating_overall, fe.overall_rating))`
3. `public_rating_avg` = `ROUND(AVG(COALESCE(fe.place_rating_overall, fe.overall_rating))::numeric, 2)`
4. For each sub-dimension ($D \in \{\text{food\_quality}, \text{value\_for\_money}, \text{ambience}, \text{service}, \text{hygiene}\}$):
   - $D\text{\_count} = \text{COUNT}(fe.\text{place\_rating\_}D)$
   - $D\text{\_avg} = \text{ROUND}(\text{AVG}(fe.\text{place\_rating\_}D)::\text{numeric}, 2)$
5. `would_return_pct` = `ROUND((COUNT(*) FILTER (WHERE fe.would_return = true)::numeric / NULLIF(COUNT(*) FILTER (WHERE fe.would_return IS NOT NULL), 0)) * 100, 2)`

**Crucial Invariant:** An omitted dimension is excluded from that dimension's denominator, not treated as 0.

---

## 3. Dish Sub-Dimension Aggregation Rules

When `recompute_dish_stats(p_dish_id)` executes:
1. `public_experience_count` = `COUNT(DISTINCT fe.id)`
2. `public_rating_count` = `COUNT(ed.rating)`
3. `public_rating_avg` = `ROUND(AVG(ed.rating)::numeric, 2)`
4. `taste_avg` = `ROUND(AVG(ed.taste_rating)::numeric, 2)`
5. `portion_avg` = `ROUND(AVG(ed.portion_rating)::numeric, 2)`
6. `value_avg` = `ROUND(AVG(ed.value_rating)::numeric, 2)`
