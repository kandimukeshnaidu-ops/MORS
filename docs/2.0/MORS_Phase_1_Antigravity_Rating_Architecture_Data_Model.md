# MORS — Phase 1 Execution Brief for Antigravity
## Rating Architecture & Data Model

**Phase:** 1  
**Priority:** P0 — foundational  
**Status:** Ready to execute only after Phase 0 audit findings are reviewed and accepted  
**Primary outcome:** A verified, backward-compatible data model and rating architecture that can support MORS as a social food journal and community-powered restaurant + dish discovery platform.

---

## 1. Mission

Phase 1 establishes the data and rating foundations for MORS 2.0.

MORS must be able to answer two distinct questions:

1. **Where should I eat?** — supported by trustworthy restaurant/place ratings and regional rankings.
2. **What should I order there?** — supported by trustworthy ratings for individual dishes.

The data model must preserve the existing food-journaling experience. A food experience remains the user's record of a visit or meal. It can contain a restaurant/place context, one or more dishes, written content, media, and structured ratings, subject to the capabilities verified in Phase 0.

The central architectural rule is:

> A restaurant rating and a dish rating are different facts. Never infer one from the other, and never mix them into the same aggregate.

This phase must be grounded in the real repository and the accepted Phase 0 audit. Do not assume that the current database matches any proposed model in this document.

---

## 2. Product boundaries

### 2.1 In scope

- Define the domain model for food experiences, restaurants/places, restaurant branches where relevant, dishes, and dish appearances within an experience.
- Define the rating dimensions and their ownership.
- Define which experiences and ratings are eligible for public aggregates.
- Define how edits, deletion, moderation, privacy changes, blocks, and account deletion affect aggregates.
- Define aggregation rules for restaurant and dish ratings.
- Define regional ranking inputs and the required location hierarchy.
- Map the target model onto the existing database.
- Prepare and test backward-compatible database migrations if implementation is approved.
- Add validation, integrity constraints, indexes, and automated tests.
- Document data contracts and operational risks.

### 2.2 Out of scope

Do not implement these during Phase 1:

- AI recommendations or personalized ranking.
- Food image recognition.
- Delivery, table booking, payments, or restaurant-owner dashboards.
- Direct messaging or unrelated social features.
- Nationwide rollout beyond the agreed initial geography.
- A large visual redesign of the app.
- A replacement of the entire database or authentication architecture.
- A new analytics platform.

Do not add a feature simply because the new schema could support it.

---

## 3. Mandatory prerequisites

Before changing code or schema, read:

1. `AGENTS.md` and all repository-level instructions.
2. The accepted Phase 0 report and evidence.
3. `docs/DECISIONS.md` and the current implementation plan.
4. Existing schema definitions and migration history.
5. Existing rating, review, experience, search, place, dish, and statistics code.
6. Existing tests and local development instructions.

The Phase 0 report must establish, with evidence:

- Which tables and columns currently exist.
- Where restaurant and dish ratings are currently stored.
- How public statistics are calculated.
- Which records are public, private, followers-only, drafts, moderated, blocked, or deleted.
- Whether place records represent restaurant brands, individual branches, or generic locations.
- How dishes are identified and linked to places/experiences.
- Which migrations have already run and which are pending.
- What breaks if the current rating model is changed.

### Stop conditions

Stop and report rather than guessing if:

- Phase 0 has not been completed or accepted.
- The current schema cannot be inspected safely.
- Existing rating semantics are unclear.
- The repository's instructions conflict with this brief.
- A migration would require destructive rewriting or loss of user-generated data.
- A decision materially changes user-visible behavior and is not covered by an accepted decision.

Do not ask the owner to repeat facts already documented in Phase 0. Point to the exact unresolved decision or evidence gap.

---

## 4. Core domain model

The following is a **conceptual model**, not a command to create tables with these exact names. First map the model to existing entities. Reuse existing tables when they correctly represent the domain.

### 4.1 User

The account that creates an experience and its ratings.

Required relationships and rules:

- Every user-authored experience must have a verifiable owner.
- Account deletion and privacy rules must have deterministic effects on public aggregates.
- A user must not be able to submit ratings on behalf of another user.
- Existing authentication and profile identity remain the source of truth.

### 4.2 Food experience

A food experience is the canonical journal entry for a visit, meal, or food event.

It may include:

- Author/user.
- Place or restaurant context, when applicable.
- Visit date/time, if currently supported.
- Text/review content.
- Photos or other supported media.
- Visibility and publication status.
- One or more linked dish entries.
- Restaurant-level rating dimensions, when the experience is a qualifying restaurant visit.
- Moderation and deletion state.

**Important:** Do not create duplicate review records if the existing experience entity can safely hold the review and rating relationship. A separate review table is justified only if the audit proves that the current experience entity cannot represent the lifecycle, ownership, or query requirements cleanly.

### 4.3 Restaurant/place and branch

Phase 0 must determine what the current `places` entity means.

The data model must not silently treat a restaurant brand and every physical branch as the same thing.

Potential concepts:

- **Restaurant brand:** the business identity, such as a restaurant chain or named operator.
- **Restaurant branch/location:** a specific physical outlet with its own address, service, ambience, hygiene, and potentially different quality.
- **Generic food place:** a location that is not a restaurant, if MORS currently supports food experiences at homes, events, or other non-restaurant places.

The owner must decide whether ratings apply to:
- each physical branch only;
- the restaurant brand only; or
- both branch-level and brand-level views, with branch ratings kept distinct and brand rollups explicitly defined.

Do not aggregate different branches as though they were one physical outlet. If a brand-level score is introduced, label it as a brand-level aggregate and define its weighting method.

### 4.4 Dish

A dish is a canonical food item that can be associated with experiences and, where supported, a restaurant or branch menu.

The model must account for:

- Different spellings and aliases.
- Regional names and transliterations.
- Similar dishes with genuinely different preparation styles.
- Variations that should not be merged into one canonical dish.
- Dish availability varying between branches.
- A dish being logged before it has been matched to a canonical entity.

Do not merge dishes solely because their names look similar. Alias resolution must not destroy the original user-entered name.

### 4.5 Dish entry within an experience

A dish entry is the specific dish a user ate during an experience.

It should preserve the context of that particular meal, including as applicable:

- Canonical dish reference, if resolved.
- Original entered name.
- Restaurant/branch context through the parent experience.
- Optional dish-specific note and media, if supported.
- Dish rating dimensions.
- Quantity/price fields only if already part of the product requirements; do not invent them.

A dish appearing in two restaurants must have separate restaurant-specific performance contexts. A rating of a dish at Restaurant A must not automatically become the rating of that dish at Restaurant B.

---

## 5. Rating architecture

### 5.1 Rating ownership

Use two independent rating domains.

**Restaurant-level rating** belongs to a qualifying food experience at a restaurant or branch.

**Dish-level rating** belongs to a specific dish entry within that experience.

A single experience may contain:
- one restaurant-level rating; and
- zero or more dish-level ratings.

Do not calculate a restaurant rating by averaging its dish ratings. Do not calculate a dish rating by copying the restaurant rating.

### 5.2 Proposed rating dimensions

These dimensions are the target product proposal. Verify them against Phase 0, existing UI, stored data, and accepted owner decisions before implementation.

**Restaurant rating dimensions**

| Dimension | What it measures |
|---|---|
| Overall | The user's overall experience of this restaurant/branch |
| Food quality | Quality, freshness, preparation, and consistency of food |
| Value for money | Whether the experience justified the price |
| Ambience | Comfort, cleanliness of the environment, and atmosphere |
| Service | Staff interaction, responsiveness, and service quality |
| Hygiene | Perceived hygiene of the dining environment and handling |

**Dish rating dimensions**

| Dimension | What it measures |
|---|---|
| Overall | The user's overall opinion of this specific dish |
| Taste | Flavour, seasoning, and execution |
| Portion | Portion size relative to the dish and expectations |
| Value | Whether this dish justified its price |

Do not force users to fill every dimension. Define which fields are required and optional. An omitted dimension is **unrated**, not zero.

Do not use restaurant ambience, service, or hygiene to rate an individual dish. Do not use dish taste to directly populate the restaurant food-quality score.

### 5.3 Rating scale

Inspect the current scale and preserve it unless the accepted product decision explicitly changes it.

Document:

- Minimum and maximum values.
- Allowed increments (whole, half, or another step).
- Numeric storage type.
- Rounding/display rules.
- Validation at both client and database layers.
- Treatment of legacy values outside the proposed scale.

Do not silently convert historical ratings. If conversion is necessary, produce a reversible mapping, quantify affected rows, and obtain approval before migration.

### 5.4 Rating invariants

Enforce these invariants:

1. A rating must belong to an authenticated user-owned experience or dish entry.
2. A rating must refer to the correct target type.
3. Restaurant ratings and dish ratings must remain separate.
4. Missing dimensions must never be treated as zero.
5. One experience must not accidentally contribute multiple times to the same restaurant aggregate for the same rating event.
6. A dish rating must contribute only to the correct dish and context.
7. A draft or unpublished experience must not affect public aggregates.
8. A private or followers-only experience must not affect public rankings.
9. A deleted, rejected, or otherwise ineligible experience must not affect public aggregates.
10. Changes to visibility or moderation state must update eligibility deterministically.
11. Editing a rating must replace its prior contribution, not add a second contribution.
12. Duplicate submissions and retries must be idempotent.
13. Clients must not be allowed to write aggregate values directly.
14. Aggregate values must be recomputable from eligible source records.

---

## 6. Public aggregate eligibility

Create one documented, reusable eligibility rule. Do not implement slightly different rules in separate pages, API routes, database views, and ranking jobs.

At minimum, evaluate:

| Record condition | Public aggregate contribution |
|---|---|
| Published and public | Eligible, subject to moderation and integrity rules |
| Draft/unpublished | Ineligible |
| Private | Ineligible |
| Followers-only | Ineligible for public aggregates |
| Pending moderation | Ineligible until approved, unless an existing accepted policy says otherwise |
| Rejected/removed | Ineligible |
| Deleted/soft-deleted | Ineligible |
| Author blocked by relevant safety rules | Follow the accepted block policy; do not expose data across blocked relationships |
| Author account deleted or suspended | Follow the accepted account lifecycle policy |
| Duplicate, spam, or fraudulent entry | Ineligible when identified through the moderation policy |

**Critical distinction:** a record can be visible to a limited audience and still be excluded from public discovery. Do not use "visible to someone" as the same thing as "eligible for public ranking."

Document the exact lifecycle transitions and how each transition affects aggregates. Test transitions, not only initial creation.

---

## 7. Aggregation design

### 7.1 Source of truth

User-submitted ratings and experiences are the source of truth.

Cached counts and averages are derived data. They must be rebuildable.

Do not make a cached public statistics table the only surviving copy of a user's rating.

### 7.2 Required aggregates

At a minimum, define separate aggregates for:

**Restaurant/branch**
- Overall average and eligible rating count.
- Average and count per restaurant dimension.
- Last qualifying contribution time, if useful and privacy-safe.
- Confidence or ranking adjustment inputs.

**Dish**
- Overall average and eligible rating count.
- Average and count per dish dimension.
- Optional restaurant/branch-specific aggregate where the UI needs to answer "How is this dish at this restaurant?"

A missing dimension should have its own count. Example: 50 experiences may have an overall rating, but only 31 may have supplied an ambience rating. The ambience average must use 31, not 50.

### 7.3 Ranking versus displayed average

Do not present a raw average as a trustworthy ranking without considering sample size.

A 5.0 average from two ratings should not automatically outrank a 4.8 average from hundreds of ratings.

Design two separate outputs:

- **Displayed average:** a transparent arithmetic average of eligible ratings, with its count.
- **Ranking score:** a documented confidence-adjusted score used to order results.

A Bayesian-style shrinkage score is a reasonable candidate for evaluation:

`adjusted_score = (n / (n + m)) * entity_average + (m / (n + m)) * regional_prior`

Where:
- `n` is the entity's eligible rating count for the relevant metric;
- `m` is a documented confidence constant;
- `regional_prior` is the prior average for the same metric and comparison population.

This is a candidate, not an approved final formula. Antigravity must:
1. Compare candidate methods using real or representative test distributions.
2. Explain the bias/benefit of each.
3. Avoid arbitrary constants without justification.
4. Make the formula configurable or centralized where appropriate.
5. Keep the displayed average independent of the ranking score.
6. Add tests for small samples, large samples, ties, missing dimensions, and outliers.

Do not invent ratings or synthetic user data to make the ranking look populated.

### 7.4 Recalculation strategy

Inspect the current implementation before choosing between:

- synchronous aggregate updates;
- database triggers;
- queued/background recalculation;
- scheduled rebuilds;
- hybrid incremental updates plus periodic reconciliation.

Choose the simplest reliable approach for the current scale and stack.

Whatever mechanism is selected must support:
- create;
- edit;
- unpublish;
- visibility change;
- moderation approval/rejection;
- soft deletion/restoration, if supported;
- account deletion/suspension;
- place merge;
- dish merge/alias correction.

Provide a safe full-rebuild path and a reconciliation check to detect drift between source rows and cached aggregates.

---

## 8. Regional ranking and geography foundation

MORS's first regional scope is Telangana, subject to the accepted Phase 0 decision.

Phase 1 must define the location fields and relationships required by Phase 3's ranking engine. It must not prematurely implement the complete discovery UI.

Inspect current location storage and document:

- Country.
- State.
- District, where reliable.
- City/town.
- Locality/neighbourhood.
- Physical address and coordinates, if supported.
- Place/branch-to-location relationship.
- Data source and verification status for each field.

Do not assume that free-text city names are sufficient for reliable regional aggregation.

Do not fabricate district or locality mappings. Identify missing, ambiguous, or inconsistent location data.

Define the initial region hierarchy and how an entity qualifies for a region. Do not allow a restaurant to appear in a region merely because a user typed that region in a caption.

Do not build a full GIS system unless the current product requirements and database justify it.

---

## 9. Privacy, authorization, and integrity

Phase 1 is incomplete unless access rules are verified alongside the schema.

Review:

- Row-level security policies (if Supabase/Postgres RLS is used).
- Server-side authorization for every mutation.
- Ownership checks for experiences and dish entries.
- Public versus private read paths.
- Whether clients can manipulate aggregate tables or views.
- Whether hidden records can leak through search, counts, ranking, or profile statistics.
- Whether storage policies align with experience visibility.
- Whether place/dish lookup endpoints expose private information.
- Whether aggregate rebuild jobs use privileged credentials safely.

Rules:

- Never trust a client-supplied `user_id` as proof of ownership.
- Never allow a client to submit a final public aggregate or ranking score.
- Never expose private source records while calculating public results.
- Never weaken RLS to make a query easier.
- Keep service-role or elevated credentials server-only.
- Preserve existing privacy guarantees unless an explicitly approved decision changes them.

Add tests that attempt unauthorized writes and reads, including attempts to:
- rate another user's experience;
- edit another user's rating;
- alter an aggregate directly;
- read private experience details through a public endpoint;
- affect rankings using an ineligible experience.

---

## 10. Repository investigation and implementation workflow

### Workstream A — Existing schema mapping

1. Inventory the existing tables, views, functions, triggers, policies, indexes, and relevant storage buckets.
2. Trace all reads and writes for experiences, places, dishes, and ratings.
3. Identify duplicate or overlapping sources of truth.
4. Produce an existing-to-target entity mapping.
5. Mark each proposed field as existing, reusable, missing, redundant, or requiring a decision.

**Deliverable:** `docs/phase-1/SCHEMA_MAPPING.md`

### Workstream B — Rating lifecycle specification

1. Define when a restaurant rating is created.
2. Define when a dish rating is created.
3. Define edit and deletion behavior.
4. Define visibility and moderation effects.
5. Define how each event changes eligible counts and averages.
6. Define idempotency and duplicate-submission behavior.

**Deliverable:** `docs/phase-1/RATING_LIFECYCLE.md`

### Workstream C — Aggregate and ranking specification

1. Document displayed averages.
2. Document per-dimension counts.
3. Evaluate confidence-adjusted ranking approaches.
4. Define how branch, brand, dish, and dish-at-branch aggregates differ.
5. Define recomputation and reconciliation.
6. Include sample calculations using clearly labelled illustrative data.

**Deliverable:** `docs/phase-1/AGGREGATION_SPEC.md`

### Workstream D — Target data model

1. Draw the conceptual ER diagram.
2. Map the conceptual entities to actual current tables.
3. Document keys, relationships, uniqueness constraints, nullable fields, and lifecycle states.
4. Document data migration and compatibility risks.
5. Identify decisions that block a safe implementation.

**Deliverable:** `docs/phase-1/TARGET_DATA_MODEL.md`

### Workstream E — Security and validation design

1. Document ownership and authorization paths.
2. Document RLS policies and server checks.
3. Define validation constraints.
4. Define privacy-safe aggregate eligibility.
5. Add negative tests.

**Deliverable:** `docs/phase-1/SECURITY_AND_INTEGRITY.md`

### Workstream F — Migration and implementation

This workstream may begin only after the target model and blocking decisions are reviewed.

1. Write additive, backward-compatible migrations where possible.
2. Preserve existing columns and data until the replacement path is proven.
3. Backfill in bounded, repeatable steps.
4. Keep old and new read paths compatible during transition where necessary.
5. Add indexes based on observed query patterns and query plans.
6. Add database constraints only after existing data has been checked for violations.
7. Update typed database definitions and server-side data-access code.
8. Update UI only where necessary to collect or display the accepted rating model.
9. Do not change unrelated screens or components.
10. Do not apply migrations to a hosted database without explicit owner approval.

**Deliverable:** reviewed migration files, implementation changes, tests, and a rollback/backfill report.

---

## 11. Migration safety rules

Database changes can permanently damage user data. Follow these rules:

- Never drop or rename a production column as the first step of a transition.
- Prefer additive changes followed by backfill, dual-read/write only when necessary, verification, and a separately approved cleanup.
- Do not run destructive commands against production, staging, or any remote database.
- Do not reset a database containing user data.
- Do not disable RLS or remove policies as a shortcut.
- Do not install dependencies unless the repository instructions require it and the change is approved.
- Do not rewrite migration history.
- Do not edit an already-applied migration to change its behavior.
- Use a disposable local database for migration testing where available.
- Make backfills idempotent and safe to retry.
- Capture pre- and post-migration row counts and integrity checks in the local test report.
- Provide a rollback strategy. If a migration is not safely reversible, state that clearly before implementation.
- Preserve original user-entered dish names and review text.
- Never silently discard ratings that do not fit the new model.

---

## 12. Test plan

Tests must prove the domain rules, not merely that pages render.

### 12.1 Rating tests

- Restaurant rating is stored and aggregated independently.
- Dish rating is stored and aggregated independently.
- One experience can rate a restaurant and multiple dishes.
- Missing dimensions are excluded from that dimension's denominator.
- Invalid values and invalid increments are rejected.
- A dish rating is associated with the correct dish and restaurant context.
- Duplicate requests do not double-count.
- Editing a rating replaces the former contribution.

### 12.2 Eligibility tests

For each lifecycle state, verify whether the record contributes to public aggregates:

- public/published;
- draft;
- private;
- followers-only;
- pending moderation;
- rejected;
- deleted;
- restored, if supported;
- suspended/deleted author, according to policy.

Also test visibility changes after a rating has already contributed.

### 12.3 Aggregate tests

- Average and count are correct.
- Each dimension has its own count.
- Restaurant and dish aggregates never cross-contaminate.
- Rebuild output matches incremental updates.
- Reconciliation detects intentionally introduced drift.
- Branch aggregates remain separate.
- Brand-level rollup, if accepted, follows its documented formula.

### 12.4 Ranking tests

- Two high ratings do not automatically outrank a large, reliable sample.
- A larger sample behaves predictably.
- Small samples are not hidden unless an explicit threshold is approved.
- Ranking score is not displayed as the raw average.
- Different metrics use the correct priors and counts.
- Ineligible records never influence ranking.
- Ties and missing data have deterministic behavior.

### 12.5 Security tests

- Users cannot rate or edit another user's experience.
- Users cannot write aggregate fields.
- Private experiences do not leak through public aggregate endpoints.
- Unauthorized access is denied by database policies and server authorization.
- Public search cannot retrieve private source content.

### 12.6 Regression tests

- Existing food logging continues to work.
- Existing diary history remains readable.
- Existing media and storage relationships remain intact.
- Existing collections and social features do not break.
- Existing public statistics are either preserved or migrated with a documented compatibility path.
- Navigation and unrelated product flows are not unintentionally changed.

Use the repository's existing test tools. Do not introduce a new testing framework without a concrete reason.

---

## 13. Required documentation and evidence

Create or update these files, following repository conventions:

| File | Required content |
|---|---|
| `docs/phase-1/SCHEMA_MAPPING.md` | Existing schema mapped to target concepts |
| `docs/phase-1/TARGET_DATA_MODEL.md` | Entities, relationships, constraints, ER diagram |
| `docs/phase-1/RATING_LIFECYCLE.md` | Rating creation, edits, visibility, moderation, deletion |
| `docs/phase-1/AGGREGATION_SPEC.md` | Averages, counts, ranking candidates, rebuild strategy |
| `docs/phase-1/SECURITY_AND_INTEGRITY.md` | RLS, authorization, privacy and integrity rules |
| `docs/phase-1/MIGRATION_PLAN.md` | Migration order, backfill, compatibility, rollback |
| `docs/phase-1/TEST_REPORT.md` | Tests run, results, failures, limitations |
| `docs/phase-1/DECISIONS_REQUIRED.md` | Unresolved owner decisions and recommended options |

Store relevant command output, schema snapshots that are safe to commit, query plans, and test evidence under `docs/evidence/phase-1/`. Never commit secrets, tokens, private user content, or production data dumps.

If repository conventions use a different documentation location, follow them and explain the mapping in the final report.

---

## 14. Decisions that must be explicit

Do not bury these in implementation details.

| Decision ID | Decision |
|---|---|
| P1-D01 | Does a restaurant rating apply to a physical branch, restaurant brand, or both? |
| P1-D02 | What is the exact rating scale and increment? |
| P1-D03 | Which rating dimensions are required versus optional? |
| P1-D04 | Which experience visibility and moderation states qualify for public aggregates? |
| P1-D05 | What is the account deletion/suspension effect on historic public ratings? |
| P1-D06 | How are dish variants and aliases distinguished? |
| P1-D07 | Are dish-at-branch aggregates required in the first release? |
| P1-D08 | Which confidence-adjusted ranking formula should be used? |
| P1-D09 | What are the initial regional boundaries and data-quality requirements? |
| P1-D10 | What is the approved aggregate update/rebuild mechanism? |
| P1-D11 | What compatibility period is required for existing clients and data? |
| P1-D12 | Which migrations, if any, may be applied to a shared development database? |

For every decision, include:
- current state/evidence;
- options;
- recommendation;
- trade-offs;
- whether it blocks implementation;
- owner approval status.

Antigravity may recommend. It must not silently make product-policy decisions.

---

## 15. Priority order

### P0 — Must finish before Phase 2

1. Verify current schema and rating storage.
2. Define restaurant versus branch semantics.
3. Define restaurant/dish rating ownership and scale.
4. Define public aggregate eligibility.
5. Define source-of-truth and aggregation rules.
6. Define data model and migration plan.
7. Verify privacy, RLS, and authorization.
8. Prove the model with automated tests.
9. Ensure existing food logging and diary data remain intact.

### P1 — Complete if required by the accepted first-release scope

1. Dish-at-branch aggregates.
2. Brand-level rollups.
3. Advanced alias/variant management.
4. More detailed locality-level aggregation.
5. Performance optimizations beyond measured bottlenecks.

### Explicitly defer

- Personalized AI ranking.
- Advanced taste profiles.
- Gamification.
- Complex recommendation pipelines.
- Unnecessary denormalization.
- Premature scaling infrastructure.

---

## 16. Definition of Done

Phase 1 is complete only when all applicable items are true:

- [ ] Phase 0 findings were reviewed and accepted.
- [ ] Current schema and data flows were verified against the repository.
- [ ] Restaurant, branch, dish, experience, and dish-entry concepts are unambiguous.
- [ ] Restaurant and dish ratings are independent at storage, validation, aggregation, and display layers.
- [ ] Rating scale, dimensions, and optionality are documented and approved.
- [ ] Public aggregate eligibility is centralized and tested across lifecycle changes.
- [ ] Displayed averages and ranking scores are separate and documented.
- [ ] Per-dimension counts are correct.
- [ ] Aggregate rebuild and reconciliation are possible.
- [ ] Location data supports the agreed regional scope without fabricated mappings.
- [ ] RLS and server-side authorization protect user data and aggregates.
- [ ] Migrations are additive/backward-compatible where practical and have a documented rollback plan.
- [ ] No hosted database was changed without explicit approval.
- [ ] Unit, integration, security, migration, and regression tests pass, or all failures are clearly reported.
- [ ] Existing user data and food-journal workflows remain intact.
- [ ] Required docs and evidence are committed.
- [ ] All blocking product decisions have owner approval.

If one of these is false, report the phase as **PARTIALLY COMPLETE**, not complete.

---

## 17. Required final report from Antigravity

At the end of the phase, report:

1. **Verdict:** COMPLETE / PARTIALLY COMPLETE / BLOCKED.
2. **What was discovered:** current schema, existing rating behavior, key constraints.
3. **What changed:** exact files, migrations, code paths, and tests.
4. **What did not change:** especially remote databases, production data, and deferred features.
5. **Data safety:** before/after counts, backfill status, integrity checks, rollback approach.
6. **Rating behavior:** how restaurant and dish scores are stored and calculated.
7. **Privacy/security:** eligibility and authorization test results.
8. **Test evidence:** commands run, pass/fail counts, known limitations.
9. **Open decisions:** every unresolved owner decision and why it matters.
10. **Phase 2 readiness:** explicit blockers and recommended next step.

Do not state that a test passed unless it was actually run. Do not state that a migration is safe unless the relevant migration and data checks were performed.

---

## 18. Antigravity execution prompt

Use the following as the task prompt:

> Execute MORS Phase 1 — Rating Architecture & Data Model using this brief and the accepted Phase 0 audit.
>
> Start by reading repository instructions and the Phase 0 deliverables. Inspect the actual schema, migrations, application data flows, security policies, and tests. Treat all conceptual entities and proposed dimensions in this brief as targets to validate, not as proof of existing implementation.
>
> Produce the schema mapping, target model, rating lifecycle, aggregation specification, security/integrity specification, migration plan, decision register, and test plan before making schema changes.
>
> Preserve the existing food-journal product and all user-generated data. Keep restaurant ratings separate from dish ratings. Do not mix branch-level and brand-level ratings. Exclude ineligible private, draft, moderated, and deleted records from public aggregates according to the accepted policy. Keep displayed averages separate from confidence-adjusted ranking scores.
>
> Do not invent missing data, product policy, rating scale, geographic mappings, or existing implementation details. When a decision is not supported by evidence or accepted policy, record it with options and a recommendation.
>
> You may create migration files and implementation code only after the target model and blocking decisions are documented. Test migrations using a disposable local database or the repository's approved local environment. Do not apply migrations to production or any remote/shared database, do not reset a database containing user data, and do not perform destructive cleanup without explicit approval.
>
> Keep changes limited to Phase 1. Do not redesign unrelated screens or add deferred features. Run the relevant tests and report exact commands and results. If a critical safety or product decision is unresolved, stop the affected implementation and report the blocker rather than guessing.
>
> Finish with the required final report and state whether Phase 2 can safely begin.

---

## 19. Phase 2 handoff

Phase 1 should hand Phase 2 a stable contract, not just a collection of migrations.

Phase 2 — **Find Experience** — may begin when:

- the restaurant/branch and dish identity model is stable;
- the rating data is queryable without mixing rating types;
- public eligibility rules are enforced;
- regional/location fields are sufficiently reliable for the initial scope;
- privacy-safe query paths exist;
- the required indexes and tests are in place.

Phase 2 should then build the user-facing discovery experience on top of the verified data model. It should not invent a second rating system or work around unresolved Phase 1 decisions.
