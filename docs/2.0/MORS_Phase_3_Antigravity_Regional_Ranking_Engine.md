# MORS — Phase 3 Execution Brief for Antigravity
## Regional Ranking Engine: Restaurants, Branches, and Dishes

**Phase:** 3  
**Priority:** P0 — core discovery intelligence  
**Status:** Execute only after Phases 0, 1, and 2 are reviewed and accepted  
**Primary outcome:** A transparent, privacy-safe, confidence-aware ranking system that can identify and order restaurants and dishes within clearly defined regions, beginning with the approved Telangana launch scope.

---

## 1. Mission

Build the regional ranking engine that powers meaningful discovery in MORS.

Phase 2 gives users a way to find a known restaurant or dish. Phase 3 adds a trustworthy answer to:

- Which restaurants are highly rated in this locality, city, or district?
- Which dishes are highly rated in this area?
- Which restaurants perform well for a particular cuisine or category?
- Which dishes are consistently well reviewed, rather than merely having one unusually high rating?

This is not a generic sorting feature. It is a data-quality and trust system. Ranking output can influence where users spend money and what they order. A misleading list damages the credibility of the whole product.

**Core rule:**

> A displayed average is a descriptive statistic. A ranking score is an ordering mechanism. They are not the same value and must never be presented as though they are the same.

The engine must be deterministic, explainable, testable, privacy-safe, and resilient to sparse samples, data manipulation, and incomplete geography.

---

## 2. Product principles

1. **Correct entity first.** A restaurant brand, a physical branch, a dish, and a dish at a particular branch are distinct ranking entities.
2. **Separate rating domains.** Restaurant ratings must never be mixed with dish ratings.
3. **Respect sample size.** A perfect score from a tiny sample must not automatically outrank a consistently strong result with many ratings.
4. **Show evidence.** Display the eligible rating count alongside any average or ranking result.
5. **No invented coverage.** A region with little data must not be presented as comprehensively ranked.
6. **No popularity masquerading as quality.** More logs, likes, photos, or comments do not automatically mean a higher quality score.
7. **Protect privacy.** Only records eligible for public aggregates under Phase 1 may affect rankings.
8. **Make the ordering explainable.** Every ranking must have a documented population, metric, time window, threshold, and tie-breaker.
9. **Do not overfit.** Start with a small, defensible set of ranking types.
10. **Keep user intent clear.** “Top rated” means rating-based ordering; it does not mean nearest, cheapest, most popular, or personalized.

---

## 3. Mandatory prerequisites

Read and verify these before implementation:

### Phase 0
- Accepted product and repository audit.
- Existing database, stats, place, dish, search, and location implementation.
- Privacy, moderation, deletion, and account lifecycle rules.
- Current bugs and reliability constraints.

### Phase 1
- Accepted target data model.
- Rating dimensions, scale, and optionality.
- Public aggregate eligibility rule.
- Source-of-truth and aggregation behavior.
- Separate restaurant and dish aggregate contracts.
- Branch-versus-brand decision.
- Location hierarchy and data-quality rules.
- Rebuild/reconciliation approach.
- Security and RLS guarantees.

### Phase 2
- Stable restaurant/branch search identity.
- Stable canonical dish identity.
- Search result contracts and rating/count fields.
- Structured location fields and known coverage.
- Public query paths.
- Pagination and performance conventions.
- Existing Find and browse UI patterns.

### Stop conditions

Stop and report a blocker if:
- Any earlier phase has not been accepted.
- Restaurant brand and branch identities are not distinguishable where required.
- Region membership is based only on untrusted free-text captions or review content.
- The engine cannot reliably exclude ineligible records.
- Aggregate counts cannot be reconciled with eligible source records.
- The rating scale or aggregate semantics remain unresolved.
- The deployment does not have a safe way to calculate or refresh rankings.
- Required geography data has not been validated.

Do not compensate for missing foundations by inventing scores or adding arbitrary UI sorting.

---

## 4. Scope

### 4.1 In scope

- Ranking specification and population definitions.
- Restaurant/branch regional rankings.
- Dish regional rankings.
- Ranking by supported restaurant dimensions, where useful and approved.
- Optional cuisine/category-specific ranking populations.
- Confidence adjustment for small samples.
- Eligibility and minimum-evidence rules.
- Region membership and geographic fallback behavior.
- Tie-breaking and deterministic pagination.
- Recalculation, caching, and freshness.
- Abuse, manipulation, and anomaly controls.
- Ranking response contracts.
- Ranking UI sections and explanatory copy.
- Admin/debug evidence sufficient to investigate incorrect ordering.
- Automated unit, integration, privacy, and performance tests.

### 4.2 Out of scope

Do not implement these in Phase 3:

- Personalized recommendation feeds or taste-profile matching.
- AI-generated recommendations or natural-language ranking explanations.
- Paid/promoted placement.
- Restaurant advertising or sponsorship.
- Restaurant owner dashboards or self-submitted ratings.
- Nationwide coverage beyond the approved rollout decision.
- Real-time restaurant availability or opening hours without a reliable data source.
- Distance-based “near me” ranking unless coordinates, distance semantics, and user location permissions are already accepted and tested.
- Delivery, ordering, reservations, or payments.
- Gamification, badges, or contributor leaderboards.
- Social popularity rankings based on follows, likes, or comments.
- A new data warehouse or ranking infrastructure without measured justification.

---

## 5. Ranking entity types

The system must explicitly support only the entity types approved by Phase 1.

### 5.1 Restaurant branch

A physical outlet at a specific location.

Default recommendation: use the branch as the primary restaurant-ranking entity when ratings are collected against a specific visit/location.

A branch score should use restaurant-level ratings for that branch only.

### 5.2 Restaurant brand

A business identity that may operate multiple branches.

A brand-level score must not be created by simply merging all branch ratings without documenting the semantics.

If brand ranking is approved:
- label it as a brand-level aggregate;
- define how each branch contributes;
- prevent branches with much higher review volume from silently dominating unless that is the chosen and documented behavior;
- show the number of branches and ratings represented where useful;
- do not imply that every branch performs equally.

If the Phase 1 decision did not approve brand-level aggregation, do not implement it in this phase.

### 5.3 Dish

A canonical dish entity, independent of one restaurant.

A dish's overall regional score should include only eligible dish ratings associated with that canonical dish and qualifying region according to the approved location rule.

Do not include the restaurant's overall rating in a dish score.

### 5.4 Dish at a branch

A dish-specific performance context at one physical restaurant branch.

Only implement a branch-specific dish ranking if Phase 1 approved the required aggregate and the sample size is sufficient. Otherwise, show logged-at context without a separate branch-specific score.

### 5.5 Generic food places

If MORS supports homes, events, or non-restaurant places, exclude them from restaurant rankings unless an explicit product decision says otherwise. Their experiences may remain in the user's diary and other relevant discovery surfaces.

---

## 6. Ranking surfaces and initial release set

Keep the first release focused.

### P0 surfaces

1. **Top-rated restaurants in a selected supported region**
2. **Top-rated dishes in a selected supported region**
3. **Cuisine/category-specific restaurant lists**, only when the taxonomy and sample coverage are reliable
4. **Cuisine/category-specific dish lists**, only when the taxonomy and sample coverage are reliable

### P1 surfaces

- Restaurant dimension lists such as best value or best ambience, provided the corresponding sample counts are reliable.
- District and locality views beyond the first validated coverage areas.
- Branch-specific dish rankings, if approved and supported.
- Time-window comparisons such as recent versus all-time, once sufficient data exists.

### Defer

- “Trending now” unless trend is clearly defined and robust to small bursts.
- “Most loved” unless the metric and label are defined.
- Personalized “for you”.
- “Hidden gems” unless there is a precise, testable definition.
- Complex multi-signal recommendations.
- Leaderboards of individual users.

Do not ship many ranking surfaces simply because the engine can calculate them. Every surface creates user expectations and a maintenance burden.

---

## 7. Regional hierarchy and membership

### 7.1 Region hierarchy

Use the accepted Phase 1 location model. A possible hierarchy for Telangana is:

1. Country
2. State
3. District
4. City/town
5. Locality/neighbourhood

This hierarchy is a target shape, not permission to infer or fabricate missing values.

### 7.2 Region membership

Each restaurant branch should have one verified canonical location record or an explicitly documented unresolved location status.

Rules:
- Region membership must come from structured, validated place/branch location data.
- Do not derive a restaurant's location from a user's caption, comment, or profile bio.
- Do not assign a branch to a district based on a loosely matching text string.
- A branch should not appear in multiple mutually exclusive localities because of duplicate or inconsistent address strings.
- If the location is ambiguous, exclude it from narrow region rankings and retain it in broader discovery where safe.
- Record the source and verification state of location fields where the current model supports it.

For dishes, regional membership is derived through eligible dish-rating experiences at restaurant branches in the selected region. Do not assign a dish to a region based on the user's home location or profile location.

### 7.3 Geographic roll-up

A branch in a locality may also qualify for the enclosing city, district, and state populations, according to the accepted administrative hierarchy.

Do not count a source rating more than once within the same ranking population because multiple location joins match it.

For example, a branch may be part of:
- its locality ranking;
- its city ranking;
- its district ranking;
- the state ranking.

That is acceptable because these are different populations. Within one population, one eligible rating must contribute only once.

### 7.4 Fallback behavior

When a selected region has insufficient data:
- do not silently substitute a larger region;
- do not show a city ranking under a locality heading;
- do not silently relax minimum sample thresholds;
- clearly communicate that the region does not yet have enough community ratings;
- optionally offer a separately labelled broader region as an alternative.

Example copy:
- “Not enough public ratings in this locality yet.”
- “Explore restaurants across Hyderabad instead.”

The broader region must be an explicit alternative, not an undisclosed fallback.

### 7.5 Location coverage report

Before enabling a region, calculate:
- total known restaurant branches;
- branches with validated state, district, city, and locality;
- unresolved or ambiguous locations;
- duplicate or conflicting location records;
- share of eligible ratings attached to validated branches;
- coverage by region level.

Do not claim full Telangana coverage unless evidence supports it.

---

## 8. Public ranking eligibility

The ranking engine must reuse the exact Phase 1 public aggregate eligibility contract. Do not implement a second interpretation.

At a minimum, only records eligible for public aggregates may influence public rankings.

Evaluate all lifecycle states:
- public and published;
- draft;
- private;
- followers-only;
- pending moderation;
- rejected or removed;
- deleted/soft-deleted;
- restored;
- author suspended or deleted;
- duplicate, spam, or fraudulent;
- affected by blocks or safety restrictions under the accepted policy.

### Critical requirements

1. A record changing from eligible to ineligible must stop contributing.
2. A record changing from ineligible to eligible must contribute once.
3. Editing an eligible rating must replace the former contribution.
4. A user changing visibility must cause the correct aggregate/ranking update.
5. A moderation action must update all affected ranking populations.
6. Deleted records must not remain in stale ranking caches beyond the documented freshness/invalidation window.
7. Private content must not be exposed through result counts, explanations, or debugging endpoints.
8. The public API must not reveal enough aggregate detail to infer private activity.

Build tests for lifecycle transitions, not only for initial public records.

---

## 9. Displayed average versus ranking score

Keep these distinct in the storage model, calculation layer, and API response.

### 9.1 Displayed average

The displayed average is the ordinary arithmetic mean of eligible ratings for the entity and metric.

For ratings \(r_1, r_2, \ldots, r_n\):

\[
\text{displayed average} = \frac{\sum_{i=1}^{n}r_i}{n}
\]

The UI should display the eligible count alongside the average.

Example:
- `4.7 · 128 ratings`
- `4.9 · 3 ratings`

The UI must not hide the rating count when the count is small. Whether a minimum count is required to display an average is an explicit product decision.

### 9.2 Ranking score

The ranking score orders entities by a confidence-aware metric. It may differ from the displayed average.

A candidate method is Bayesian shrinkage toward a relevant population prior:

\[
S = \frac{n}{n+m}R + \frac{m}{n+m}C
\]

Where:
- \(S\) = adjusted ranking score;
- \(R\) = the entity's eligible average for the metric;
- \(n\) = the entity's eligible rating count for that metric;
- \(C\) = the prior average for the same metric and comparison population;
- \(m\) = a confidence constant representing the strength of the prior.

This prevents a very small sample from automatically taking the top position merely because its raw average is perfect.

### 9.3 This formula is not pre-approved

Antigravity must evaluate it and compare alternatives, such as:
- raw average with minimum evidence threshold;
- Bayesian shrinkage;
- lower confidence bound;
- another statistically defensible method.

The choice must be evidence-based and documented.

Do not set \(m\) to an arbitrary number because it makes a desired restaurant appear first. Evaluate realistic sample distributions and conduct sensitivity analysis.

### 9.4 Prior population

The prior must be appropriate to the comparison:
- restaurant overall prior for restaurant overall rankings;
- dish overall prior for dish overall rankings;
- restaurant ambience prior for ambience rankings;
- relevant cuisine/category prior only if there is sufficient sample and a clear reason.

Do not use a state-wide prior for a tiny locality if it creates unintuitive results without analysis. Evaluate local, city, district, and state priors and document the chosen fallback.

A prior must not be calculated from records outside the same eligibility policy.

### 9.5 Minimum evidence

A confidence adjustment does not eliminate the need for minimum-evidence rules.

Determine whether an entity needs:
- a minimum number of eligible ratings;
- a minimum number of distinct contributors;
- minimum coverage across time;
- a minimum share of valid location-linked experiences.

Set different policies only when justified by evidence and user experience.

Do not pretend that a result with very low evidence is equally reliable to a result with a large sample.

Possible UI states:
- **Ranked:** meets the accepted minimum-evidence rule.
- **Emerging:** displayed separately because it has some evidence but not enough for the main ranked list.
- **Not enough data:** not eligible for ranking; may still appear in ordinary search.

These labels and thresholds require approval.

---

## 10. Metric definitions

### 10.1 Restaurant overall ranking

Uses only the restaurant overall rating for the branch or approved brand entity.

### 10.2 Restaurant dimension rankings

Possible rankings:
- food quality;
- value for money;
- ambience;
- service;
- hygiene.

Each dimension has its own eligible count and average. Missing dimensions are excluded from that metric's denominator.

Do not compute ambience using the overall rating count if fewer experiences contain an ambience rating.

Do not show a restaurant as the “best for ambience” based on two ratings unless the approved minimum evidence supports it.

### 10.3 Dish overall ranking

Uses only the dish overall rating for the canonical dish.

The location population is derived from eligible experiences at branches in the selected region.

### 10.4 Dish dimension rankings

Possible metrics:
- taste;
- portion;
- value.

Each has its own count and average.

### 10.5 Cuisine and category populations

If ranking a cuisine or category:
- define whether cuisine belongs to the restaurant, branch, dish, or experience;
- define how multi-cuisine restaurants qualify;
- prevent duplicate contribution where a place has multiple matching tags;
- ensure category definitions are stable and normalized;
- display the filter/population clearly.

Do not infer cuisine from a restaurant name or user-generated caption.

### 10.6 Ranking period

For the first release, evaluate **all-time eligible ratings** as the simplest baseline.

A recent-only ranking creates additional issues:
- sparse samples;
- volatility;
- seasonal bias;
- stale entities disappearing;
- increased susceptibility to coordinated short-term rating bursts.

Only add a rolling time window when the product has a clear need and enough data.

If recency weighting is considered, document:
- time-decay formula;
- half-life;
- treatment of old ratings;
- effect on count and confidence;
- how the UI explains the metric.

Do not use an undisclosed recency boost.

---

## 11. Ranking algorithm evaluation

Before selecting a formula, create a reproducible evaluation dataset.

### 11.1 Required scenarios

Include at least:
1. Entity A: perfect score from 2 ratings; Entity B: slightly lower score from 150 ratings.
2. Entity A: high score from 5 ratings; Entity B: strong score from 50 ratings.
3. Two entities with equal raw averages but different sample sizes.
4. Entity with a low score and a large sample.
5. Entity with many ratings but a small number of repeated contributors, if contributor data is safely available.
6. Entity with missing dimension values.
7. Region with low sample size.
8. Region with enough data for a meaningful prior.
9. Entities with identical adjusted scores.
10. New entity with a small but promising sample.

### 11.2 Evaluation criteria

Compare candidate methods for:
- resistance to small-sample inflation;
- interpretability;
- stability under one new rating;
- fairness to new entities;
- behavior in sparse regions;
- sensitivity to prior and threshold values;
- computational cost;
- ease of recomputation;
- ability to explain ranking position.

### 11.3 Sensitivity analysis

For candidate confidence constants and thresholds:
- calculate how the order changes;
- identify entities whose positions are highly sensitive;
- explain why;
- avoid parameter choices that cause erratic ranking movement.

Use representative test fixtures or anonymized aggregate distributions approved for analysis. Do not export production personal data into development tools.

### 11.4 Approval

Produce a recommendation and request owner approval for:
- ranking formula;
- confidence parameters;
- minimum-evidence rules;
- prior population;
- tie-breaking rules;
- any separate emerging list.

Do not silently encode these as permanent business policy.

---

## 12. Contributor concentration and manipulation resistance

A large number of ratings does not automatically imply independent evidence.

Review whether the data model can safely support:
- distinct eligible contributor counts;
- one contributor's repeated ratings across time;
- suspicious rating bursts;
- duplicate or coordinated submissions;
- newly created or low-trust accounts, if such trust signals are part of an accepted policy;
- unusual patterns affecting a single branch or dish.

### Rules

- A user must not be able to submit duplicate ratings for the same experience or rating target in a way that increases the count.
- Repeated edits must not increase contribution count.
- Likes, follows, comments, views, or photo uploads must not alter the quality score unless a separate approved formula explicitly requires them.
- Do not penalize users merely for giving a high or low rating.
- Do not infer fraud solely from disagreement with the average.
- Do not create hidden penalties without an auditable rule.
- Do not expose private fraud signals or user trust labels publicly.
- Any suppression or exclusion rule must be documented and testable.
- Preserve an audit trail for moderation/exclusion decisions where the current system supports it.

### Review-burst handling

Evaluate whether a short-term burst of ratings should trigger:
- monitoring only;
- temporary quarantine pending moderation;
- exclusion under the existing anti-abuse policy.

Do not invent a threshold and automatically suppress genuine activity. A sudden increase can be caused by a viral event, new restaurant opening, or real-world gathering.

Phase 3 should implement only the abuse protections supported by the accepted moderation and trust policy. Anything requiring a new user-trust system should be proposed separately.

---

## 13. Ranking calculation and data architecture

### 13.1 Source of truth

The accepted Phase 1 user-authored rating records remain the source of truth.

Ranking tables, materialized views, cached scores, or precomputed result sets are derived outputs.

They must be rebuildable from eligible source data.

### 13.2 Required ranking output fields

The internal ranking result should have strongly typed fields equivalent to:

- entity type;
- entity identifier;
- entity display identity;
- entity location/region identifier;
- region type and region identifier;
- metric identifier;
- displayed average;
- eligible rating count;
- distinct contributor count, if approved and available;
- ranking score;
- evidence/eligibility status;
- calculation version;
- computed timestamp;
- optional supporting metadata required by the UI.

Do not use one ambiguous `rating` field for every entity and metric.

The public response should include only safe fields. It must not expose internal moderation signals, private contributor information, or calculation debug data not intended for users.

### 13.3 Calculation version

Store or otherwise track the ranking algorithm version used to generate a result.

This is necessary to:
- identify stale cached results;
- compare algorithm versions;
- rebuild consistently;
- explain when rankings change because the formula changed rather than because ratings changed.

### 13.4 Recalculation strategy

Inspect existing scale and architecture, then choose the simplest reliable method.

Possible approaches:
- query-time calculation for small datasets;
- database views/materialized views;
- incremental aggregate updates;
- queued recomputation;
- scheduled rebuild;
- hybrid incremental update plus periodic reconciliation.

Choose based on:
- source row volume;
- number of regions;
- number of metrics;
- write frequency;
- query latency;
- current Supabase/Postgres capabilities and app deployment patterns.

Do not introduce a separate ranking service prematurely.

### 13.5 Rebuild and reconciliation

Provide:
- a safe full recomputation path;
- a bounded incremental update path, if needed;
- a way to compare ranking aggregates against source records;
- a way to detect stale calculation versions;
- a documented recovery procedure after a failed job.

A rebuild must not double-count records. It must be idempotent and safe to retry.

---

## 14. Freshness and invalidation

Define when rankings must update after:

- a new public rating;
- an edited rating;
- a visibility change;
- a moderation approval/rejection;
- deletion/restoration;
- account suspension/deletion;
- place/branch location correction;
- place merge;
- dish merge or alias correction;
- change to rating eligibility policy;
- change to ranking formula or parameters.

Document:
- expected update latency;
- cache lifetime;
- invalidation trigger;
- failure behavior;
- stale-data fallback.

Do not claim real-time rankings if the implementation refreshes periodically.

If recalculation fails:
- keep the last known safe result only within the documented freshness policy;
- label or handle stale data appropriately;
- do not publish partially recalculated rankings;
- log operational errors without exposing sensitive content.

---

## 15. API and response contracts

Use current repository conventions. These are logical contracts, not mandatory endpoint names.

### 15.1 Restaurant regional ranking

Input:
- selected region type and identifier;
- metric;
- optional supported cuisine/category filter;
- bounded page size;
- stable pagination cursor.

Output:
- region identity and type;
- ranking metric;
- ordered branch/approved entity results;
- displayed average;
- eligible rating count;
- ranking position;
- safe evidence status;
- next cursor;
- calculation freshness/version metadata only where appropriate.

### 15.2 Dish regional ranking

Input:
- region type and identifier;
- dish metric;
- optional supported category/cuisine filter;
- bounded page size;
- stable cursor.

Output:
- region identity;
- ordered canonical dish results;
- displayed average;
- eligible dish rating count;
- relevant restaurant context only where approved;
- ranking position;
- safe evidence status;
- next cursor.

### 15.3 Dimension ranking

If supported:
- explicit metric key;
- explicit denominator/count for that dimension;
- no substitution from overall averages;
- clear UI label.

### 15.4 API invariants

- Validate region type and identifier.
- Validate metric is allowed for the requested entity type.
- Reject or safely handle invalid combinations (for example, ambience for a dish).
- Apply public eligibility before calculating or returning results.
- Use server-side authorization where required.
- Limit page size.
- Use stable pagination.
- Do not accept a client-provided ranking score.
- Do not leak private source records.
- Do not silently fall back to a different region or metric.
- Return explicit empty/insufficient-evidence status separately from server errors.

---

## 16. Ranking UI and user communication

The ranking system is only trustworthy if the UI explains what users are seeing.

### 16.1 Ranking page structure

A regional ranking surface may include:
- region selector/breadcrumb;
- clear title, e.g. “Top-rated restaurants in [locality]”;
- metric selector where supported;
- cuisine/category filters where supported;
- ordered results;
- displayed average and eligible rating count;
- short explanation of the ranking basis;
- empty/insufficient-data state;
- explicit alternative region suggestion where appropriate.

### 16.2 Labels

Use precise labels:
- “Top-rated restaurants”
- “Top-rated dishes”
- “Highest-rated for value”
- “Highly rated in this locality”

Avoid unsupported labels:
- “Best restaurant”
- “Best food in Telangana”
- “Most loved”
- “Trending”
- “Must visit”
- “Guaranteed best”

These stronger statements imply more than an adjusted rating order.

### 16.3 Explain the distinction

Where ranking order differs from raw average, a short explanation should be discoverable, such as:

“Rankings consider both rating quality and the number of eligible community ratings. The score used to order results may differ from the displayed average.”

Do not publish the entire statistical formula in every card, but make methodology available in an accessible explanation page or expandable information area.

### 16.4 Rating display

Examples:
- `4.7 · 128 ratings`
- `4.9 · 3 ratings` with an emerging/evidence label if approved.

Do not:
- display `0.0` when unrated;
- hide low counts to make a result look more credible;
- show the internal ranking score as the public average;
- imply a higher rank means higher quality across every dimension;
- compare entities from different metrics as if they were measured the same way.

### 16.5 User controls

- Region selection must be clear.
- Metric selection must explain what it measures.
- Filters must be removable.
- The active region and filters must persist in the URL if consistent with Phase 2 patterns.
- Empty states must not silently broaden the region.
- The page should allow users to open an entity profile and inspect supporting public experiences.

---

## 17. Performance and scaling

Measure before optimizing.

Monitor:
- ranking generation time;
- ranking query latency;
- number of source rows scanned;
- number of regions and metrics computed;
- cache hit/miss behavior;
- result payload size;
- job failures and retries;
- staleness duration.

Requirements:
- no unbounded query per region request;
- no per-card source-record fetch that produces N+1 queries;
- stable indexed region and entity joins;
- bounded result pagination;
- no expensive full rebuild on every user rating if unnecessary;
- no partially published result set during rebuild;
- no separate infrastructure unless current database cannot meet measured needs.

Document expected behavior at current scale and what evidence would justify a more advanced system.

---

## 18. Security, privacy, and auditability

Verify:
- public rankings use only Phase 1-eligible data;
- private source records cannot influence public ranking;
- private record existence cannot be inferred from count differences;
- public response does not reveal contributor identities unless already public and approved;
- ranking calculation endpoints are not directly writable by clients;
- admin/rebuild endpoints are protected;
- service-role or elevated credentials remain server-only;
- metric and region inputs are validated;
- internal anomaly flags are not exposed publicly;
- ranking caches are invalidated when source eligibility changes.

Provide negative tests for:
- private experience inclusion;
- followers-only inclusion;
- draft inclusion;
- rejected/deleted content inclusion;
- unauthorized ranking rebuild;
- client-supplied score injection;
- invalid region/metric combinations;
- pagination cursor tampering.

Keep enough audit evidence to explain why a record was included or excluded without exposing private user content.

---

## 19. Implementation workstreams

### Workstream A — Data and region readiness

1. Read accepted Phase 0–2 outputs.
2. Verify location hierarchy and region identifiers.
3. Generate coverage report by region level.
4. Identify ambiguous branch locations.
5. Verify each rating joins to exactly one intended region per ranking population.
6. Verify restaurant and dish aggregates and counts.
7. Identify duplicate or missing entity mappings.

**Deliverable:** `docs/phase-3/REGION_DATA_READINESS.md`

### Workstream B — Ranking methodology

1. Define each ranking population.
2. Define rating metric and eligible denominator.
3. Evaluate candidate confidence-adjustment methods.
4. Test minimum-evidence policies.
5. Analyze prior populations and sparse-region behavior.
6. Conduct sensitivity analysis.
7. Define tie-breaking.
8. Make a recommendation for owner approval.

**Deliverable:** `docs/phase-3/RANKING_METHODOLOGY.md`

### Workstream C — Data architecture

1. Define ranking output schema or view.
2. Define calculation versioning.
3. Define invalidation triggers.
4. Define incremental versus full recomputation.
5. Define reconciliation.
6. Define pagination/query contracts.
7. Evaluate index requirements.
8. Document failure recovery.

**Deliverable:** `docs/phase-3/RANKING_ARCHITECTURE.md`

### Workstream D — Ranking calculation

After methodology approval:

1. Implement shared eligibility usage.
2. Implement restaurant/branch ranking calculation.
3. Implement dish ranking calculation.
4. Implement approved metric-specific rankings.
5. Implement region roll-up.
6. Implement minimum-evidence handling.
7. Implement deterministic tie-breakers.
8. Implement calculation versioning.
9. Implement refresh and rebuild.
10. Add reconciliation checks.

**Deliverable:** tested ranking engine and any approved migration files.

### Workstream E — API and integration

1. Expose secure restaurant ranking results.
2. Expose secure dish ranking results.
3. Add metric and region validation.
4. Add bounded pagination.
5. Add safe caching/freshness behavior.
6. Integrate ranking responses with existing Find/browse surfaces.
7. Keep Search relevance behavior unchanged.

**Deliverable:** tested API/data-access integration.

### Workstream F — UI

1. Add the approved regional ranking surfaces.
2. Add region selector/breadcrumb.
3. Add supported metric/category filters.
4. Show displayed average and eligible count.
5. Communicate ranking basis and evidence states.
6. Add insufficient-data and empty states.
7. Link to entity profiles.
8. Preserve mobile and accessibility standards.

**Deliverable:** verified ranking UI.

### Workstream G — abuse and reliability

1. Add supported duplicate/concentration safeguards.
2. Test lifecycle invalidation.
3. Test anomaly scenarios.
4. Verify rebuild idempotency.
5. Test stale ranking behavior.
6. Test security boundaries.
7. Measure performance.
8. Run regressions across Find, logging, diary, profiles, and social features.

**Deliverable:** `docs/phase-3/TEST_REPORT.md` and evidence.

---

## 20. Priority order

### P0 — Required before release

1. Verified region membership for every ranked entity.
2. Correct restaurant/branch/dish ranking populations.
3. Accepted, documented ranking methodology.
4. Displayed averages separate from ranking scores.
5. Separate per-metric counts.
6. Minimum-evidence policy.
7. Shared Phase 1 eligibility enforcement.
8. Deterministic tie-breaking and pagination.
9. Rebuild and reconciliation path.
10. Secure ranking API contracts.
11. Clear ranking UI and insufficient-data behavior.
12. Automated correctness, privacy, and lifecycle tests.
13. Performance and freshness measurement.

### P1 — Add only where data supports it

1. Cuisine/category rankings.
2. Restaurant dimension rankings.
3. District and locality expansion.
4. Emerging entities section.
5. Branch-specific dish rankings.
6. More advanced contributor-concentration safeguards.
7. Recent-period rankings.

### Explicitly defer

- Personalized rankings.
- AI recommendation explanations.
- Social popularity rankings.
- Paid placements.
- Nationwide leaderboards.
- Real-time trends.
- User leaderboards and gamified ranking systems.

---

## 21. Acceptance and test matrix

### 21.1 Mathematical correctness

- [ ] Displayed average equals arithmetic mean of eligible ratings.
- [ ] Rating count equals eligible rating count for the metric.
- [ ] Each dimension uses its own denominator.
- [ ] Restaurant ratings never enter dish calculations.
- [ ] Dish ratings never enter restaurant calculations.
- [ ] One source rating contributes once per ranking population.
- [ ] Ranking score matches the approved formula and parameters.
- [ ] Ranking order is deterministic.
- [ ] Tie-breaking is deterministic and documented.
- [ ] Formula version is recorded.

### 21.2 Statistical behavior

- [ ] Tiny perfect samples do not automatically dominate large, strong samples.
- [ ] Large, consistently strong samples behave sensibly.
- [ ] Low-scoring high-volume entities are not artificially promoted.
- [ ] New entities can be represented without misleading ranking claims.
- [ ] Sparse regions do not use inappropriate priors silently.
- [ ] Sensitivity analysis is documented.
- [ ] Minimum-evidence threshold is applied consistently.
- [ ] Missing dimension ratings do not distort other dimensions.

### 21.3 Geography

- [ ] Branch membership uses verified structured fields.
- [ ] A branch is not assigned to an unsupported locality.
- [ ] A source rating is counted once per region population.
- [ ] District/city roll-ups follow the accepted hierarchy.
- [ ] Dish region membership derives from eligible branch-context experiences.
- [ ] Ambiguous locations are excluded from narrow rankings.
- [ ] Broader-region alternatives are explicit.
- [ ] Coverage limitations are shown or documented.

### 21.4 Lifecycle and privacy

- [ ] Private records never contribute.
- [ ] Followers-only records never contribute to public rankings.
- [ ] Draft records never contribute.
- [ ] Pending/rejected moderation states follow accepted policy.
- [ ] Deleted records are removed from rankings.
- [ ] Restored/approved records contribute exactly once.
- [ ] Visibility changes trigger correct invalidation.
- [ ] Account lifecycle changes follow accepted policy.
- [ ] Public endpoints reveal no private source content.

### 21.5 Reliability and operations

- [ ] Full rebuild is idempotent.
- [ ] Incremental calculation matches full rebuild.
- [ ] Reconciliation detects deliberate aggregate drift.
- [ ] Failed recomputation does not publish a partial ranking.
- [ ] Staleness is bounded and observable.
- [ ] Pagination has no duplicate or missing records.
- [ ] Calculation version is consistent across a published result set.
- [ ] Unauthorized users cannot trigger protected rebuild operations.

### 21.6 UX and regressions

- [ ] Ranking labels accurately describe their metric.
- [ ] Average and eligible count are visible.
- [ ] Methodology explanation is available.
- [ ] Insufficient-data state is clear.
- [ ] Region is clearly identified.
- [ ] No silent region fallback occurs.
- [ ] Mobile layout and accessibility work.
- [ ] Entity profile links work.
- [ ] Search relevance remains unchanged.
- [ ] Logging, diary, collections, and social features still work.

---

## 22. Required documentation and evidence

Follow repository conventions. Suggested files:

| File | Required content |
|---|---|
| `docs/phase-3/REGION_DATA_READINESS.md` | Coverage, location quality, unresolved mapping |
| `docs/phase-3/RANKING_METHODOLOGY.md` | Populations, formula, priors, thresholds, sensitivity analysis |
| `docs/phase-3/RANKING_ARCHITECTURE.md` | Calculation pipeline, storage, versioning, refresh, rebuild |
| `docs/phase-3/API_CONTRACTS.md` | Region/metric input, response contracts, pagination |
| `docs/phase-3/ABUSE_AND_INTEGRITY.md` | Duplicate/concentration controls and audit behavior |
| `docs/phase-3/UX_SPEC.md` | Ranking page labels, states, and methodology explanation |
| `docs/phase-3/TEST_REPORT.md` | Correctness, security, regression, and performance test results |
| `docs/phase-3/OPEN_DECISIONS.md` | Decisions requiring owner approval |
| `docs/phase-3/OPERATIONS_RUNBOOK.md` | Rebuild, reconciliation, staleness, and recovery |

Store safe evidence under `docs/evidence/phase-3/`:
- algorithm comparison fixtures;
- sensitivity analysis results;
- aggregate and source reconciliation output;
- region coverage counts;
- query plans and performance measurements;
- test output;
- UI screenshots;
- job/rebuild evidence.

Do not commit production personal data, private content, secrets, tokens, or raw data exports.

---

## 23. Decisions requiring explicit approval

| Decision ID | Question |
|---|---|
| P3-D01 | Which ranking entities are included: branch, brand, dish, dish-at-branch? |
| P3-D02 | Which regions are launch-ready based on verified location coverage? |
| P3-D03 | Which ranking formula is approved? |
| P3-D04 | Which prior population is used at each region level? |
| P3-D05 | What confidence constant/parameters are justified by evaluation? |
| P3-D06 | What minimum rating and distinct-contributor counts are required? |
| P3-D07 | Are emerging entities shown separately or omitted from ranking pages? |
| P3-D08 | Which metric-specific rankings ship in the first release? |
| P3-D09 | Are cuisine/category rankings supported by reliable taxonomy coverage? |
| P3-D10 | Is the first release all-time only? |
| P3-D11 | What is the permitted ranking freshness window? |
| P3-D12 | Which abuse/anomaly safeguards are approved? |
| P3-D13 | What deterministic tie-breakers are used? |
| P3-D14 | What is the explicit stale-data behavior after calculation failure? |

For each decision, provide:
- current evidence;
- available options;
- recommendation;
- user-facing consequences;
- technical trade-offs;
- whether it blocks release;
- approval status.

Antigravity may recommend. It must not silently make policy decisions that affect public ordering.

---

## 24. Definition of Done

Phase 3 is complete only when:

- [ ] Phases 0, 1, and 2 have been accepted.
- [ ] Region coverage is measured and launch-ready regions are explicitly identified.
- [ ] Every ranking entity has unambiguous identity and region membership.
- [ ] Restaurant, branch, dish, and optional dish-at-branch populations are separate.
- [ ] Formula and parameters have been evaluated and approved.
- [ ] Displayed averages and ranking scores are separate in data and UI.
- [ ] Per-dimension denominators and counts are correct.
- [ ] Minimum-evidence and sparse-region policies are implemented.
- [ ] Public eligibility is inherited from Phase 1.
- [ ] Lifecycle changes invalidate or refresh affected rankings.
- [ ] Rankings are deterministic and safely paginated.
- [ ] Full rebuild and reconciliation are proven.
- [ ] Calculation versioning and freshness are observable.
- [ ] APIs are secure and cannot accept client-supplied ranking scores.
- [ ] UI explains region, metric, count, and ranking basis.
- [ ] Abuse/integrity controls are proportionate and documented.
- [ ] Correctness, privacy, regression, and performance tests pass, or failures are explicitly reported.
- [ ] Documentation and evidence are committed.
- [ ] All release-blocking decisions have owner approval.

If a P0 item is not satisfied, report **PARTIALLY COMPLETE** or **BLOCKED**, not complete.

---

## 25. Required final report from Antigravity

Return:

1. **Verdict:** COMPLETE / PARTIALLY COMPLETE / BLOCKED.
2. **Regions enabled:** exactly which regions and at what hierarchy level.
3. **Data coverage:** counts and gaps for validated location coverage.
4. **Ranking entities:** branch/brand/dish/dish-at-branch support.
5. **Methodology:** formula, prior, parameters, minimum-evidence rules, tie-breakers.
6. **Statistical evaluation:** candidate comparison and sensitivity findings.
7. **Eligibility:** proof that private/ineligible records are excluded.
8. **Architecture:** calculation, storage, versioning, refresh, rebuild, reconciliation.
9. **API/UI:** endpoints/contracts and user-visible ranking surfaces implemented.
10. **Data safety:** no source ratings lost; before/after validation evidence.
11. **Tests:** exact commands, pass/fail counts, and limitations.
12. **Performance:** measured query/job latency and freshness.
13. **Files changed:** code, migrations, tests, and docs grouped clearly.
14. **Deferred items:** what remains out of scope.
15. **Phase 4 readiness:** whether restaurant and dish profiles can consume the new verified ranking and aggregate contracts.

Never claim a ranking is statistically reliable merely because its formula is sophisticated. Report the data volume and coverage that support the claim.

---

## 26. Antigravity execution prompt

> Execute MORS Phase 3 — Regional Ranking Engine using this brief and the accepted Phase 0, Phase 1, and Phase 2 deliverables.
>
> Begin by verifying repository instructions, accepted phase documents, current location coverage, rating aggregates, entity identities, public eligibility rules, search contracts, and existing query performance. Do not assume that every Telangana district or locality is ready for ranking.
>
> Treat restaurant branches, restaurant brands, canonical dishes, and dish-at-branch contexts as distinct ranking populations. Implement only the entity types explicitly approved in Phase 1. Never mix restaurant ratings with dish ratings.
>
> Keep displayed arithmetic averages separate from confidence-adjusted ranking scores. Evaluate candidate methods and parameters using reproducible fixtures and sensitivity analysis before implementation. Do not choose arbitrary constants to make particular entities rank higher. Obtain owner approval for formula, minimum evidence, prior populations, tie-breakers, and release geography.
>
> Reuse Phase 1's exact public aggregate eligibility rules. Private, followers-only, draft, rejected, deleted, or otherwise ineligible records must never influence public rankings. Lifecycle changes must update affected results. Preserve source ratings as the source of truth.
>
> Use verified structured region membership. Never infer a locality or district from captions, comments, or profile text. Where location or sample coverage is insufficient, show an explicit insufficient-data state or a clearly labelled broader-region alternative. Never silently substitute a region.
>
> Make calculations deterministic, versioned, rebuildable, and reconcilable. Choose the simplest architecture that meets measured query and freshness requirements. Do not introduce separate ranking infrastructure without evidence.
>
> Build only the approved ranking surfaces. Do not add personalized recommendations, paid placements, social popularity scores, AI explanations, or unsupported “best” claims.
>
> Secure every ranking endpoint and rebuild operation. The client must never submit a ranking score. Add tests for mathematical correctness, sparse samples, region roll-up, lifecycle changes, privacy, pagination, rebuild idempotency, and stale-data handling.
>
> Measure real query/job performance and document actual data coverage. Do not invent ratings, locations, contributor counts, or test results. If the data is too sparse to support a ranking surface, report that honestly and leave it disabled.
>
> Keep changes within Phase 3. Do not redesign unrelated screens. Finish with the required report and state clearly whether Phase 4 can safely begin.

---

## 27. Phase 4 handoff — Restaurant and Dish Profiles

Phase 4 may begin when:

- restaurant/branch and dish identities are stable;
- approved ranking APIs return the correct entities and metrics;
- displayed average, eligible count, and ranking context are correct;
- region membership is explicit and reliable;
- public experience and rating retrieval respects Phase 1 privacy rules;
- result ordering and calculation versions are consistent;
- profile routes can consume the approved aggregate contracts.

Phase 4 will build deeper restaurant and dish profile experiences. It should consume these ranking and aggregate contracts rather than reimplement rating calculations in profile components.
