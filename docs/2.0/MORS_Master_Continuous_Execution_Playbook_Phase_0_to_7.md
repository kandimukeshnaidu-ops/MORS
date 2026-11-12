# MORS — Master Execution Playbook for Antigravity
## Continuous Phase-by-Phase Execution: Phase 0 Through Phase 7

**Document type:** Master orchestration and execution instructions  
**Project:** MORS  
**Execution owner:** Antigravity coding agent  
**Execution mode:** Sequential, continuous, dependency-aware execution  
**Phases covered:** 0, 1, 2, 3, 4, 5, 6, and 7  
**Primary objective:** Audit, build, integrate, test, stabilize, and prepare MORS for release in one coordinated workflow without asking the owner to approve every phase transition.

---

# 1. The instruction that governs the entire run

Execute MORS Phases 0 through 7 **one after another, in the specified order, as one continuous project workflow**.

Do not finish Phase 0 and then wait for the owner to tell you to start Phase 1. Do not finish Phase 1 and ask whether to continue to Phase 2. Do not pause for routine confirmation between phases. Once the deliverables and internal verification requirements for one phase are satisfied, move directly to the next phase.

The intended execution sequence is:

<list>
  <list-item>Phase 0 — Repository and Product Audit</list-item>
  <list-item>Phase 1 — Rating Architecture and Data Model</list-item>
  <list-item>Phase 2 — Find Experience</list-item>
  <list-item>Phase 3 — Regional Ranking Engine</list-item>
  <list-item>Phase 4 — Restaurant and Dish Profiles</list-item>
  <list-item>Phase 5 — Personal Taste Identity</list-item>
  <list-item>Phase 6 — Social Experience Upgrade</list-item>
  <list-item>Phase 7 — UX Refinement, Reliability, and Release Readiness</list-item>
</list>

**Do not interpret this instruction as permission to ignore dependencies or safety.** It means no unnecessary human pause at ordinary phase boundaries. It does not permit you to bypass security, destroy data, invent product facts, or claim an unverified phase is complete.

The final result must be one integrated MORS implementation—not eight disconnected implementations and not eight documents that were never translated into working software.

---

# 2. Which documents govern execution

The individual phase briefs are the detailed specifications. This master playbook controls their order, handoffs, execution behavior, and completion reporting.

Use the following files when they are present in the repository or supplied with the task:

| Order | Specification |
|---|---|
| 1 | `MORS_Phase_0_Antigravity_Audit_Brief.md` |
| 2 | `MORS_Phase_1_Antigravity_Rating_Architecture_Data_Model.md` |
| 3 | `MORS_Phase_2_Antigravity_Find_Experience.md` |
| 4 | `MORS_Phase_3_Antigravity_Regional_Ranking_Engine.md` |
| 5 | `MORS_Phase_4_Antigravity_Restaurant_and_Dish_Profiles.md` |
| 6 | `MORS_Phase_5_Antigravity_Personal_Taste_Identity.md` |
| 7 | `MORS_Phase_6_Antigravity_Social_Experience_Upgrade.md` |
| 8 | `MORS_Phase_7_Antigravity_UX_Reliability_Release_Readiness.md` |
| 9 | This file — `MORS_Master_Continuous_Execution_Playbook_Phase_0_to_7.md` |

The repository's actual instructions always take precedence over assumptions in a generated brief. Read `AGENTS.md`, README files, architecture documentation, existing decisions, contribution guidelines, and local development instructions before changing code.

If a phase brief is available only in the conversation/downloads and not in the repository, use the supplied copy as the specification. Do not pretend it has been committed to the repository.

If one or more phase briefs are missing:
1. Check the repository and the supplied project files.
2. Recover the relevant requirements from existing accepted project documentation where possible.
3. Record which specification was unavailable.
4. Continue only where the requirements are sufficiently clear.
5. Do not invent missing product rules or state that a missing brief was read.

---

# 3. Execution mode: continuous, not stop-and-wait

## 3.1 No routine approval pauses

Do not ask the owner:
- “Should I start the next phase?”
- “Can I continue to Phase 2?”
- “Do you approve moving to Phase 3?”
- “Should I proceed with the next document?”
- “Can I continue testing?”
- “Do you want me to integrate these components?”

The owner has already instructed that all eight phases should run in sequence. Treat that instruction as authorization to perform the normal, reversible development work required by the briefs within the repository and approved local development environment.

After finishing a phase:
1. Save its required documentation.
2. Run the phase's relevant tests.
3. Record its actual status.
4. Record unresolved dependencies.
5. Update the master execution tracker.
6. Start the next phase immediately.

Do not wait for a conversational response between phases.

## 3.2 Internal checkpoints are mandatory

“No stopping between phases” does not mean “skip verification between phases.”

Each phase has an internal checkpoint. The checkpoint is a verification step, not a request for owner approval.

At a checkpoint:
- verify required outputs;
- run the relevant tests;
- confirm data contracts;
- record defects and decisions;
- update the status tracker;
- continue to the next phase.

Never mark a phase complete merely to preserve execution momentum.

## 3.3 Carry blockers forward transparently

If a non-critical requirement cannot be completed:
- mark it `BLOCKED`, `PARTIALLY COMPLETE`, or `DEFERRED`;
- explain exactly why;
- identify dependent tasks;
- do not fabricate an implementation or test result;
- continue with work that does not depend on that blocked requirement.

If a later phase depends on the blocked requirement, do not build a workaround that violates the intended architecture. Complete independent work in that phase, document the dependent work as blocked, and continue to the next phase only where the missing dependency does not create a safety or correctness risk.

The objective is to complete as much of the full sequence as safely possible in one run—not to conceal blockers.

---

# 4. Safety boundaries: actions that remain restricted

The continuous-run instruction does not authorize irreversible or externally consequential actions.

## 4.1 Allowed without an additional phase-by-phase confirmation

Subject to repository instructions and available permissions, Antigravity may:
- inspect the repository;
- inspect local schema and migration files;
- inspect existing application code and tests;
- create and update documentation;
- create or edit application code within the phase scope;
- add and update local tests;
- create migration files;
- run formatting, linting, type checking, and local builds;
- run tests using a disposable local database;
- use non-sensitive synthetic test fixtures;
- run safe read-only checks against approved environments;
- add reversible, backward-compatible local implementation changes;
- refactor code where necessary to meet the approved architecture;
- fix defects discovered in earlier phases;
- update the master tracker and evidence.

## 4.2 Do not do these without the required explicit authorization

Do not:
- apply migrations to production or a shared remote database;
- reset, truncate, or seed a database containing real user data;
- delete or overwrite user-generated data;
- drop production columns, tables, or storage buckets;
- rewrite migration history that has already been applied;
- disable or weaken row-level security;
- remove authorization checks;
- expose service-role keys or other secrets to client code;
- deploy to production;
- change DNS, domains, billing, or paid service plans;
- send real emails, notifications, or invitations to users during testing;
- publish public content or enable public taste sharing;
- enable advertising, paid placement, or external data sharing;
- perform destructive penetration testing against production;
- delete, migrate, or transform real user data as a shortcut.

Create and test the code, migrations, runbooks, and deployment instructions, but leave restricted external actions pending explicit authorization.

## 4.3 When a hard stop is justified

A hard stop is justified only when continuing would create an unacceptable risk or is technically impossible without an external action or missing authority.

Examples:
- suspected production data exposure;
- risk of data loss or corruption;
- credentials or repository access unavailable;
- an operation would require destructive remote database changes;
- unresolved legal, security, or privacy concern;
- migration requires a non-reversible operation on real data;
- no safe way to test a critical data transformation;
- an external paid service or deployment action requires owner authorization.

If a hard stop occurs:
1. Stop the affected action, not necessarily the entire workflow.
2. Preserve the current state.
3. Record the evidence and exact blocker.
4. Do not attempt a workaround that weakens safety.
5. Continue independent local work if it is safe.
6. Clearly identify any later phase that cannot be completed because of this blocker.
7. Do not claim the overall project is release-ready.

---

# 5. Decision policy: how to avoid asking questions at every phase

The phase briefs contain product decisions. Use this hierarchy.

## 5.1 Decision hierarchy

Resolve decisions in this order:

1. Existing accepted decisions in the repository.
2. Existing behavior that is demonstrably relied upon by users.
3. Decisions already documented in accepted Phase 0–6 specifications.
4. This master playbook's conservative defaults.
5. A provisional, reversible implementation decision with a clear rationale.

Do not silently override established product behavior.

## 5.2 Conservative defaults for routine decisions

Use the following defaults when no accepted decision exists and the choice is reversible:

| Topic | Conservative default |
|---|---|
| Restaurant identity | Keep branch and brand distinct; do not merge their ratings |
| Rating storage | Preserve current valid source data; do not silently convert historical values |
| Missing rating dimension | Treat as unrated, never zero |
| Public aggregate eligibility | Use only approved public, published, eligible records |
| Search ordering | Relevance first, deterministic tie-breaker |
| Ranking display | Display arithmetic average and eligible count separately from ranking score |
| Sparse regional data | Show insufficient data; do not silently widen the region |
| Dish at restaurant | Label as community logged-at evidence, not verified menu availability |
| Personal Taste | Private by default |
| Personal Taste evidence | Describe actual observed activity; do not infer personality or sensitive traits |
| Feed ordering | Chronological following feed unless an accepted existing policy says otherwise |
| Likes | Never use likes as restaurant/dish ratings |
| Comments | Reuse existing model; do not build complex nested threads by default |
| New social features | Do not add DMs, stories, reels, or engagement leaderboards |
| Search filters | Show only filters backed by reliable structured fields |
| Empty states | Show honest lack of data; do not fabricate content |
| Ranking formula | Evaluate candidates and select only after documented evidence and approval where business policy is materially affected |
| Cache | Prefer simple, safe caching with explicit freshness; do not add infrastructure without measured need |
| Migrations | Prefer additive and backward-compatible changes |
| Public sharing of taste insights | Off/deferred unless explicitly approved |
| Production deployment | Prepare and verify; do not deploy without explicit authorization |

## 5.3 Product decisions that can be provisional

A decision may be made provisionally without waiting when:
- it is reversible;
- it does not change or destroy existing user data;
- it does not weaken privacy/security;
- it does not create a public or financial commitment;
- it does not materially change the product's promise;
- it is clearly marked provisional in documentation.

## 5.4 Decisions that must not be guessed

Do not guess:
- rating scale conversion;
- branch-versus-brand historical mapping;
- public versus private visibility semantics;
- which existing records are eligible for public aggregates;
- account deletion policy;
- data retention policy;
- whether a user consented to public sharing;
- geographic mappings that are not verified;
- whether a restaurant is open or serves a dish;
- whether content is safe to publish;
- production migration or deployment authorization.

Where one of these is unresolved, preserve existing safe behavior, record the decision, and continue independent work.

---

# 6. Global engineering rules

These apply to every phase.

## 6.1 Inspect before implementing

Do not assume features are missing. For each workstream:
1. Locate existing routes/components/services.
2. Trace actual data flow.
3. Identify what works.
4. Identify what is incomplete or broken.
5. Reuse what is correct.
6. Change only what is needed.

Avoid duplicate components, duplicate endpoints, duplicate tables, and parallel data models.

## 6.2 Preserve the current stack

Use the installed framework, language, database, UI system, testing stack, and package manager unless there is a documented reason to change them.

Do not:
- replace the framework;
- replace the database;
- add another state-management library;
- add a separate search engine;
- add a new cache service;
- add a new monitoring platform;
- install redundant packages;

unless measured needs justify the change and the owner has authorized the additional operational complexity.

## 6.3 Follow repository conventions

- Follow `AGENTS.md`.
- Follow established formatting and linting.
- Follow naming and folder conventions.
- Use the existing package manager.
- Respect generated files.
- Do not edit generated types manually if they must be regenerated.
- Do not rewrite applied migrations.
- Do not commit secrets.
- Do not remove tests to make the suite pass.

## 6.4 Keep scope controlled

- Implement phase requirements, not every future idea.
- Do not mix unrelated redesigns into a bug fix.
- Do not add AI features just because they are possible.
- Do not add engagement features that do not improve food journaling/discovery.
- Do not overengineer for hypothetical scale.
- Prefer the smallest correct implementation.

## 6.5 Maintain types and contracts

- Use strict types where the project supports them.
- Validate user input at trust boundaries.
- Keep server/client responsibilities clear.
- Keep restaurant and dish rating types distinct.
- Keep personal data scoped to the owner.
- Keep aggregate and ranking calculations server-controlled.
- Avoid ambiguous generic fields such as a single `rating` when the meaning varies by entity type.

## 6.6 Error and loading handling

Every asynchronous user-facing operation must handle:
- pending;
- success;
- empty result;
- failure;
- retry where meaningful;
- stale/cancelled requests where relevant.

No core route should remain indefinitely stuck in a loading state.

## 6.7 Evidence-based completion

A file existing is not proof that a feature works. A button rendering is not proof that its action works. A typecheck passing is not proof of correct runtime behavior.

Use the correct verification method:
- static analysis for type/format issues;
- unit tests for isolated logic;
- integration tests for data/security behavior;
- end-to-end tests for actual user journeys;
- manual checks for visual, responsive, and accessibility behavior;
- query plans and measurements for performance.

---

# 7. Master phase sequence

# Phase 0 — Repository and Product Audit

**Purpose:** Establish the actual state of MORS before making product or architecture changes.

### Execute

1. Read repository instructions and architecture.
2. Inventory routes, components, services, schemas, migrations, policies, storage, tests, and deployment files.
3. Map current user journeys.
4. Audit existing food logging, diary, places, dishes, search, Explore, ratings, social, collections, and settings.
5. Identify existing rating and aggregation behavior.
6. Audit authorization, privacy, visibility, account lifecycle, and storage policies.
7. Record performance and reliability issues.
8. Compare actual implementation with the MORS product direction.
9. Create a prioritized gap and risk register.
10. Produce the Phase 0 implementation sequence.

### Required outputs

Use the Phase 0 brief's required deliverables. At minimum:
- product gap audit;
- data-model audit;
- UX audit where applicable;
- implementation sequence;
- evidence folder;
- open risk/decision register.

### Phase 0 checkpoint

Before Phase 1:
- verify the repository was inspected;
- ensure findings are evidence-based;
- identify current source-of-truth tables and routes;
- identify data-loss/privacy risks;
- mark assumptions clearly.

**Phase 0 is audit-only. Do not implement fixes inside Phase 0.**

### Handoff

Carry the verified schema, current behavior, risks, and implementation constraints into Phase 1. Start Phase 1 automatically after saving the Phase 0 report.

---

# Phase 1 — Rating Architecture and Data Model

**Purpose:** Establish correct and durable data relationships for restaurants, branches, dishes, experiences, and ratings.

### Execute

1. Read Phase 0 results.
2. Map current schema to target concepts.
3. Resolve the restaurant brand versus branch distinction using existing evidence and approved policy.
4. Define restaurant-level rating ownership.
5. Define dish-level rating ownership.
6. Preserve the existing scale unless an explicit accepted decision changes it.
7. Define rating dimensions and optionality.
8. Define public aggregate eligibility.
9. Define the source of truth for submitted ratings.
10. Define displayed averages separately from ranking scores.
11. Define per-dimension counts.
12. Define recalculation, rebuild, and reconciliation.
13. Define region/location relationships required later.
14. Verify RLS, ownership, and server authorization.
15. Prepare additive migrations and tests where changes are required.
16. Test migrations in a disposable local environment.
17. Update typed data-access contracts.

### Required outputs

Use the Phase 1 brief's deliverables:
- schema mapping;
- target data model;
- rating lifecycle;
- aggregation specification;
- security/integrity specification;
- migration plan;
- test report;
- decisions register.

### Phase 1 checkpoint

Verify:
- restaurant and dish ratings are separate;
- missing dimensions are not zero;
- edits do not double-count;
- private/draft/ineligible records do not contribute publicly;
- aggregate values are rebuildable;
- existing data is preserved;
- tests and local migrations work.

Do not apply remote or production migrations.

### Handoff

Expose stable typed contracts for restaurant ratings, dish ratings, eligibility, aggregates, and locations. Start Phase 2 automatically.

---

# Phase 2 — Find Experience

**Purpose:** Build reliable restaurant and dish discovery on the Phase 1 data model.

### Execute

1. Read Phase 1 contracts and Phase 0 audit.
2. Inspect existing Find/Search/Explore routes.
3. Preserve working search behavior.
4. Create or refine two explicit modes: Restaurants and Food.
5. Implement restaurant/branch search.
6. Implement canonical dish search.
7. Implement alias handling and safe normalization.
8. Implement relevance ordering and deterministic tie-breakers.
9. Add only data-quality-supported filters.
10. Create result cards with the correct rating type and count.
11. Add supported autocomplete only if reliable.
12. Implement pagination and URL state.
13. Implement loading, empty, error, retry, and partial states.
14. Connect results to canonical detail routes.
15. Maintain a clear distinction between Search and browse/Explore.
16. Measure search query performance.

### Required outputs

Use the Phase 2 brief's deliverables:
- Phase 1 contract integration;
- Find UX spec;
- search spec;
- API contracts;
- Explore scope;
- test report;
- performance report.

### Phase 2 checkpoint

Verify:
- Restaurants and Food modes search different entity types;
- rating semantics are correct;
- private/ineligible data is excluded;
- aliases do not create duplicate entities;
- result URLs work;
- pagination is stable;
- network errors are not shown as no-results.

Do not introduce regional ranking claims during this phase.

### Handoff

Provide stable entity identity, search response types, rating/count fields, location fields, and query behavior to Phase 3. Start Phase 3 automatically.

---

# Phase 3 — Regional Ranking Engine

**Purpose:** Calculate transparent and confidence-aware rankings for restaurants and dishes within verified regions.

### Execute

1. Read Phase 1 aggregate rules and Phase 2 entity/location contracts.
2. Audit region coverage and data quality.
3. Define ranking populations: branch, brand, dish, and dish-at-branch only where approved.
4. Define exact region membership.
5. Evaluate candidate ranking algorithms.
6. Compare raw average, Bayesian adjustment, confidence-bound methods, or other defensible alternatives.
7. Use reproducible test distributions and sensitivity analysis.
8. Define prior populations and minimum evidence.
9. Separate displayed average from ranking score.
10. Define distinct contributor counts where approved and available.
11. Define metric-specific ranking populations.
12. Implement deterministic tie-breaking.
13. Implement ranking versioning.
14. Implement safe calculation/rebuild/reconciliation.
15. Implement freshness and invalidation.
16. Expose secure ranking contracts.
17. Integrate approved ranking surfaces in Find/browse.
18. Test sparse-region and insufficient-data states.

### Required outputs

Use the Phase 3 brief's deliverables:
- region data readiness;
- ranking methodology;
- ranking architecture;
- API contracts;
- abuse/integrity report;
- UX specification;
- test report;
- operations runbook.

### Phase 3 checkpoint

Verify:
- correct region membership;
- restaurant and dish populations are separate;
- displayed average and ranking score are separate;
- small samples do not automatically dominate;
- all inputs obey Phase 1 eligibility;
- ranking is deterministic;
- rebuild matches source records;
- no silent regional fallback exists.

If ranking policy is not fully settled, use the most conservative evidence-based implementation that preserves existing behavior, mark parameters provisional, and do not publish misleading claims. Do not invent constants to make results look better.

### Handoff

Expose stable profile-ready aggregate and ranking contracts, with entity identity, region, metric, evidence, and freshness. Start Phase 4 automatically.

---

# Phase 4 — Restaurant and Dish Profiles

**Purpose:** Build useful and trustworthy detail pages behind search results and rankings.

### Execute

1. Inspect existing restaurant/place and dish profile routes.
2. Use canonical entity identities.
3. Build the restaurant branch profile.
4. Build a brand profile only if the data model and scope require it.
5. Build the canonical dish profile.
6. Integrate Phase 1 aggregate contracts.
7. Integrate Phase 3 ranking context.
8. Display per-dimension ratings and counts accurately.
9. Display verified location and business information only.
10. Display public experiences using the approved eligibility rule.
11. Show dishes logged at a branch with accurate wording.
12. Show branches where a dish has been logged.
13. Connect restaurant and dish profiles.
14. Connect profile actions to the existing logging flow.
15. Reuse existing social interactions.
16. Add canonical routing and metadata.
17. Implement partial, empty, loading, error, and stale states.
18. Measure profile query and render performance.

### Required outputs

Use the Phase 4 brief's deliverables:
- contract integration;
- profile UX spec;
- profile data contracts;
- experience feed rules;
- route/metadata spec;
- test report;
- performance report.

### Phase 4 checkpoint

Verify:
- branch and brand identities are not mixed;
- dish and restaurant ratings are separate;
- profiles match Find and ranking data;
- public experience queries protect privacy;
- community logged-at context is not described as current menu availability;
- profile-to-logging flow preserves entity relationships.

### Handoff

Provide stable personal data access to the owner's diary and ratings. Start Phase 5 automatically.

---

# Phase 5 — Personal Taste Identity

**Purpose:** Build private, evidence-based summaries of the user's own food activity and explicit ratings.

### Execute

1. Audit user-owned experience/rating data.
2. Verify ownership and privacy.
3. Assess cuisine/category metadata quality.
4. Define activity signals separately from preference signals.
5. Define each insight's exact source and calculation.
6. Separate restaurant and dish rating domains.
7. Define minimum evidence thresholds.
8. Implement private-by-default summaries.
9. Implement explicit evidence and insufficient-data labels.
10. Implement activity summaries separately from preference summaries.
11. Add time comparisons only where data supports them.
12. Implement privacy controls such as opt-out, hide, exclude, or reset according to approved scope.
13. Integrate derived-data lifecycle with edits, deletion, and account removal.
14. Add owner-scoped API and calculation logic.
15. Add cross-user privacy tests.
16. Build a compact, accessible Taste page without introducing a large analytics dashboard.

### Required outputs

Use the Phase 5 brief's deliverables:
- personal data readiness;
- insight methodology;
- privacy/user controls;
- architecture;
- API contracts;
- UX spec;
- test report.

### Phase 5 checkpoint

Verify:
- only the current user's permitted data contributes;
- activity is not presented as preference;
- public ratings are not substituted for the user's ratings;
- no sensitive traits are inferred;
- private is the default;
- other users cannot access the summary;
- source diary records remain intact when derived data is reset;
- account deletion and opt-out are respected.

Public sharing of taste insights remains disabled unless explicitly approved.

### Handoff

Ensure social surfaces cannot expose the private derived profile. Start Phase 6 automatically.

---

# Phase 6 — Social Experience Upgrade

**Purpose:** Make MORS a useful food community with reliable social interaction and trust controls.

### Execute

1. Audit existing follows, feed, likes, comments, notifications, collections, blocks, reports, and moderation.
2. Reuse working systems rather than creating duplicates.
3. Establish the food experience as the central social item.
4. Build or repair the following feed.
5. Use chronological ordering initially unless an accepted policy says otherwise.
6. Implement secure follow/unfollow.
7. Implement idempotent like/unlike.
8. Ensure likes never affect ratings or rankings.
9. Implement comments and approved reply depth.
10. Implement meaningful notifications and deduplication.
11. Integrate existing collections/save behavior.
12. Implement safe sharing of public experiences.
13. Verify block semantics consistently across surfaces.
14. Verify reporting goes to an actionable moderation workflow.
15. Add rate limits and abuse controls.
16. Ensure feed and notification queries enforce visibility server-side.
17. Test private Personal Taste isolation.
18. Implement all feed/notification empty, error, pagination, and retry states.
19. Measure social query and processing performance.

### Required outputs

Use the Phase 6 brief's deliverables:
- social system audit;
- social behavior specification;
- feed architecture;
- notification specification;
- trust/safety report;
- privacy matrix;
- test report;
- performance report.

### Phase 6 checkpoint

Verify:
- feed contains only authorized experiences;
- feed order is deterministic;
- likes do not change ratings;
- comments obey target permissions;
- notifications do not leak private information;
- block rules apply everywhere;
- reports reach a reviewer/workflow;
- personal taste insights remain private.

Do not add DMs, stories, reels, live content, engagement-ranked feeds, or leaderboards.

### Handoff

Provide a stable integrated product for the final cross-product audit. Start Phase 7 automatically.

---

# Phase 7 — UX Refinement, Reliability, and Release Readiness

**Purpose:** Verify the whole product and prepare a release candidate. This is the quality gate, not a feature-building phase.

### Execute

1. Reconcile actual implementation status of Phases 0–6.
2. Establish release scope and feature freeze.
3. Build a route inventory.
4. Build a defect register with P0/P1/P2/P3 severity.
5. Test all critical journeys end to end.
6. Verify auth and session persistence.
7. Verify food logging, edit/delete, and image persistence.
8. Verify Search, ranking, profiles, and rating consistency.
9. Verify Personal Taste privacy and lifecycle.
10. Verify feed, social interactions, notifications, collections, and moderation.
11. Audit loading, request cancellation, stale responses, retries, and infinite loading.
12. Audit navigation and dead links.
13. Audit responsive layouts and accessibility.
14. Measure frontend, backend, database, and storage performance.
15. Audit security and privacy.
16. Validate migrations in local/staging environments.
17. Prepare backups, deployment steps, rollback, monitoring, and runbooks.
18. Run the final regression suite.
19. Identify a specific release candidate.
20. Produce GO / CONDITIONAL GO / NO-GO recommendation.

### Required outputs

Use the Phase 7 brief's deliverables:
- release baseline;
- defect register;
- critical journey report;
- reliability report;
- security/data integrity report;
- UX/accessibility report;
- performance/operations report;
- release candidate checklist;
- go/no-go report.

### Phase 7 checkpoint

A GO recommendation requires:
- no unresolved P0 defect;
- critical journeys verified;
- privacy and authorization checks passed;
- data persistence and rating integrity verified;
- reproducible build and deployment;
- migration and rollback plan reviewed;
- monitoring and incident ownership available;
- residual risks documented and accepted.

Do not deploy to production without explicit authorization. Preparing a production-ready candidate is not the same as being authorized to release it.

### Final handoff

Produce one consolidated project report describing what was actually implemented, what remains incomplete, and whether MORS is safe to release.

---

# 8. How to handle blockers without stopping the entire run

Use a dependency-aware approach.

## 8.1 Classify blockers

| Blocker type | Required action |
|---|---|
| Documentation missing but code/evidence is clear | Reconstruct carefully, record source, continue |
| Minor product choice with reversible impact | Use conservative default, mark provisional, continue |
| Missing optional metadata | Omit that field/feature, continue |
| Sparse rating data | Implement honest insufficient-data behavior, continue |
| Missing regional coverage | Enable only verified regions, continue elsewhere |
| Existing component partially broken | Repair within phase scope, add regression tests |
| Feature depends on unapproved risky schema change | Prepare local design/migration, do not apply remotely |
| Critical security/privacy ambiguity | Preserve safest current behavior; block affected feature |
| Risk of data loss or production corruption | Stop affected operation immediately |
| No access to required repository/service | Record access blocker; continue independent work |

## 8.2 Do not create fake progress

Never:
- replace an unavailable API with fabricated success data;
- hardcode demo ratings into production UI;
- mark routes as verified without opening/testing them;
- create a fake moderation workflow;
- claim a migration passed without running it;
- claim a feature is implemented because documentation exists;
- silently disable tests that fail;
- suppress errors to make the UI appear stable;
- bypass authorization to complete a page.

## 8.3 Continue safe independent work

If Phase 3 cannot rank an unverified locality, it can still:
- rank validated regions;
- implement the insufficient-data state;
- document missing location data.

If Phase 5 lacks sufficient cuisine metadata, it can still:
- show supported personal rating patterns;
- show food activity counts;
- label cuisine insights as insufficient data.

If Phase 6 lacks a moderation queue, it can:
- audit and fix core social interactions;
- document the reporting limitation;
- avoid presenting the report workflow as operational;
- mark release readiness accordingly.

This prevents one unresolved optional requirement from needlessly halting all unrelated work while preserving truthfulness.

---

# 9. Cross-phase contracts that must never drift

These rules apply across the whole application.

## 9.1 One source of truth for each domain

- Food experiences remain the core user-authored journal record.
- Restaurant and branch identity use the accepted Phase 1 model.
- Dishes use canonical identity and alias rules.
- User ratings remain the source of truth.
- Aggregates and rankings are derived and rebuildable.
- Public experiences use the shared visibility/eligibility policy.
- Personal Taste uses the current user's own permitted data.
- Social actions reference canonical experiences and users.

Do not create a second data model for the same domain simply because a new page needs different fields.

## 9.2 Rating semantics

- Restaurant ratings are not dish ratings.
- Dish ratings are not restaurant ratings.
- Missing dimension values are not zero.
- Displayed average is not ranking score.
- Likes are not ratings.
- Saves are not ratings.
- Public regional rank is not personal preference.
- Personal ratings are not public regional aggregates unless the source record independently satisfies the approved public eligibility rule.

## 9.3 Privacy semantics

- Public visibility is not the same as owner visibility.
- Followers-only is not public.
- Draft is not published.
- Deleted/rejected content does not remain visible merely because of cached data.
- Following a user is not permission to see all their records.
- Personal Taste is private by default.
- Notification previews must not leak inaccessible content.
- Public page counts must not reveal private records.
- Storage access must match content visibility.

## 9.4 Restaurant/dish relationship semantics

- A restaurant brand and a branch are not interchangeable.
- A dish overall rating and a dish-at-branch rating are not interchangeable.
- A dish logged at a restaurant is not verified menu availability.
- A branch location must come from validated structured location data.
- A user's caption is not a verified source of restaurant location or cuisine.

## 9.5 User experience semantics

- Search and browse are different user intents.
- Feed and regional ranking are different ordering systems.
- “Frequently logged” and “highly rated” are different insights.
- “No results” and “request failed” are different states.
- “No ratings” and `0.0` are different states.
- “Saved” and “liked” are different actions.
- “Report submitted” does not mean “report reviewed”.

---

# 10. Required project-wide verification strategy

Run verification continuously, not only at the end.

## 10.1 At every meaningful change

Run the narrowest relevant checks:
- formatter;
- linter;
- type checker;
- unit tests;
- targeted integration tests;
- route or component tests.

## 10.2 At each phase checkpoint

Run:
- relevant phase tests;
- affected regression tests;
- build/type validation where practical;
- privacy/security checks relevant to the phase;
- manual browser verification for user-facing functionality.

## 10.3 At Phase 7

Run the full release suite:
- unit;
- integration;
- database/RLS;
- storage;
- end-to-end;
- security/privacy;
- accessibility;
- responsive;
- performance;
- regression;
- build.

Record exact commands and results.

## 10.4 Test environment rules

- Prefer a disposable local database.
- Use synthetic test users and fixtures.
- Never load production private data into test environments unless there is a separately approved, privacy-safe process.
- Do not reset a database containing real user data.
- Do not send real notifications during test runs.
- Redact secrets and personal data from test evidence.

---

# 11. Required master tracker

Create and maintain:

`docs/MORS_MASTER_EXECUTION_TRACKER.md`

The tracker must contain:

## 11.1 Overall summary

- execution start date;
- current phase;
- current branch/commit if available;
- app build status;
- overall status;
- release candidate status.

## 11.2 Phase status

Use this table:

| Phase | Status | Main outputs | Tests | Blockers | Next action |
|---|---|---|---|---|---|
| 0 — Audit | NOT STARTED | — | — | — | Begin audit |
| 1 — Data model | NOT STARTED | — | — | — | Pending Phase 0 |
| 2 — Find | NOT STARTED | — | — | — | Pending Phase 1 |
| 3 — Rankings | NOT STARTED | — | — | — | Pending Phase 2 |
| 4 — Profiles | NOT STARTED | — | — | — | Pending Phase 3 |
| 5 — Personal Taste | NOT STARTED | — | — | — | Pending Phase 4 |
| 6 — Social | NOT STARTED | — | — | — | Pending Phase 5 |
| 7 — Release readiness | NOT STARTED | — | — | — | Pending Phase 6 |

Allowed status values:
- NOT STARTED
- IN PROGRESS
- VERIFIED COMPLETE
- PARTIALLY COMPLETE
- BLOCKED
- DEFERRED BY APPROVAL

Do not set all phases to complete at the beginning. Update status only when evidence supports it.

## 11.3 Defect and decision registers

Maintain:
- open defects by severity;
- accepted limitations;
- provisional decisions;
- decisions requiring owner authorization;
- migration status;
- security/privacy risks;
- unresolved data-quality issues;
- deferred scope.

## 11.4 Evidence references

For each phase, record:
- relevant specification;
- implementation docs;
- tests and exact commands;
- screenshots/logs/query plans;
- known limitations;
- date/version.

---

# 12. Recommended repository organization

Adapt to existing repository conventions. Do not create duplicate documentation directories if the project already has a structure.

Suggested structure:

```text
docs/
  MORS_MASTER_EXECUTION_TRACKER.md
  phase-0/
  phase-1/
  phase-2/
  phase-3/
  phase-4/
  phase-5/
  phase-6/
  phase-7/
  decisions/
  evidence/
    phase-0/
    phase-1/
    phase-2/
    phase-3/
    phase-4/
    phase-5/
    phase-6/
    phase-7/
```

Suggested code organization is entirely dependent on the actual stack. Do not force an artificial folder layout from this document.

Every phase should produce:
- implementation;
- tests;
- relevant documentation;
- evidence;
- an updated master tracker.

---

# 13. Code-change and migration management

## 13.1 Keep changes traceable

- Group code changes by phase and feature.
- Avoid large unrelated refactors.
- Use meaningful commit messages if committing is part of repository practice and permission is available.
- Do not squash away useful history without authorization.
- Record migrations and affected tables.
- Keep generated artifacts separate from source files.

## 13.2 Migration sequence

For every schema change:
1. Document the reason.
2. Identify affected data and readers/writers.
3. Prefer additive changes.
4. Create a local migration.
5. Test against a disposable database.
6. Verify old and new data compatibility.
7. Add or update indexes based on query evidence.
8. Verify RLS and ownership.
9. Test a backfill safely and idempotently.
10. Document rollback or forward recovery.
11. Leave remote application pending explicit authorization.

## 13.3 Do not change user data casually

Never:
- silently merge restaurant branches;
- merge dishes solely by name;
- alter historical ratings without mapping;
- discard original dish names;
- delete experiences to fix aggregate counts;
- rewrite visibility defaults without review;
- replace user-generated content with seed/demo records.

---

# 14. How to use autonomous execution effectively

The agent should minimize interruptions while preserving engineering discipline.

## 14.1 Do not send progress-only messages to the repository

Avoid repeatedly writing vague notes such as:
- “Starting Phase 1”;
- “Phase 2 in progress”;
- “Moving to next phase”.

Instead, maintain the master tracker and provide meaningful evidence summaries at phase checkpoints.

## 14.2 Do not wait for approval when a safe default exists

If a small UI behavior or reversible implementation choice is not explicitly decided:
- inspect existing conventions;
- select the simplest consistent option;
- record it as a provisional decision;
- continue.

## 14.3 Do not make irreversible choices just to keep moving

If a choice affects:
- historical user data;
- privacy;
- public disclosure;
- ranking fairness;
- account lifecycle;
- production deployment;
- cost/billing;
then preserve safe existing behavior and record the required owner decision.

Continue independent tasks instead of creating an unsafe workaround.

## 14.4 Do not stop at documentation

The objective is a working application. Documents support the implementation; they do not replace it.

For every implementation requirement:
- locate the code;
- make the change;
- test it;
- inspect it in the running application where applicable;
- record evidence.

If no code change is needed because the feature already works, verify it and record that finding instead of rewriting it.

---

# 15. Final project acceptance criteria

The full Phase 0–7 workflow can be considered successfully executed only when the following are true:

## Product and data
- [ ] Actual existing implementation was audited.
- [ ] Restaurant/branch/dish/experience identities are unambiguous.
- [ ] Restaurant and dish ratings are independent.
- [ ] Public aggregates use the approved eligibility policy.
- [ ] Search, rankings, and profiles use consistent contracts.
- [ ] Location coverage and limitations are known.
- [ ] Personal Taste is private and user-scoped.
- [ ] Social features respect visibility, blocks, and moderation rules.

## User experience
- [ ] Find has separate Restaurants and Food modes.
- [ ] Regional rankings are transparent and evidence-aware.
- [ ] Restaurant and dish profiles show correct information.
- [ ] Logging works from relevant entry points.
- [ ] Personal Taste distinguishes activity from preference.
- [ ] Home feed and social interactions work.
- [ ] Loading/error/empty/retry states are consistent.
- [ ] Mobile and desktop layouts are usable.

## Engineering
- [ ] Core routes work.
- [ ] Data persistence is verified.
- [ ] Images upload and remain accessible according to visibility.
- [ ] Mutations are authorized and idempotent.
- [ ] Migrations are tested locally.
- [ ] Aggregates can be reconciled/rebuilt.
- [ ] Automated tests cover critical paths.
- [ ] Performance is measured.
- [ ] Logs and monitoring do not expose private user data.

## Release
- [ ] No P0 issue remains.
- [ ] P1 issues are fixed or accepted/disabled with a documented reason.
- [ ] Build is reproducible.
- [ ] Deployment and rollback plans exist.
- [ ] Monitoring/runbooks are ready.
- [ ] A release candidate is identified.
- [ ] GO / CONDITIONAL GO / NO-GO is documented.

If any criterion is false, report the actual state. Do not call the entire project complete simply because the agent reached the end of Phase 7.

---

# 16. Required final consolidated report

At the end of the continuous run, create:

`docs/MORS_FINAL_EXECUTION_REPORT.md`

It must contain:

1. Executive summary.
2. Repository starting state.
3. Actual status of each phase.
4. Features already present before execution.
5. Features fixed or newly implemented.
6. Data model and migration summary.
7. Search and ranking methodology summary.
8. Restaurant/dish profile behavior.
9. Personal Taste privacy and calculation summary.
10. Social/feed/notification/moderation summary.
11. UX and reliability fixes.
12. Security and data-integrity findings.
13. Performance baseline and final measurements.
14. Automated test commands and results.
15. Manual end-to-end verification results.
16. Files changed, grouped by phase.
17. Migrations created and whether they were applied locally, remotely, or not applied.
18. Open decisions and provisional decisions.
19. Deferred features and reasons.
20. Known bugs and limitations.
21. Whether production deployment was performed (normally: no, unless explicitly authorized).
22. Final GO / CONDITIONAL GO / NO-GO recommendation.
23. Exact actions required from the owner, if any.

The report must distinguish:
- implemented and tested;
- implemented but not fully tested;
- existing and verified;
- documented only;
- blocked;
- deferred;
- not implemented.

Do not inflate completion percentages. A phase with a critical unresolved dependency is not complete.

---

# 17. Final Antigravity master prompt

Copy the following prompt and provide this master playbook together with all eight phase briefs.

> **Execute the full MORS project workflow from Phase 0 through Phase 7 in one continuous, sequential run.**
>
> Treat the supplied MORS Master Continuous Execution Playbook as the orchestration authority and the eight individual phase briefs as the detailed functional specifications.
>
> You must execute the phases in this exact order:
>
> 1. Phase 0 — Repository and Product Audit
> 2. Phase 1 — Rating Architecture and Data Model
> 3. Phase 2 — Find Experience
> 4. Phase 3 — Regional Ranking Engine
> 5. Phase 4 — Restaurant and Dish Profiles
> 6. Phase 5 — Personal Taste Identity
> 7. Phase 6 — Social Experience Upgrade
> 8. Phase 7 — UX Refinement, Reliability, and Release Readiness
>
> **Do not stop after each phase to ask the owner whether to continue. Do not ask routine confirmation questions between phases. Do not wait for the owner to send “next phase”.** After completing a phase's internal verification checkpoint, move directly to the next phase.
>
> Start by reading `AGENTS.md`, repository instructions, README/architecture documents, current implementation, migrations, environment setup, tests, and all supplied phase briefs. Inspect before implementing. Many requested capabilities may already exist; verify and reuse them rather than rebuilding them.
>
> Phase 0 is an audit-only phase. Do not change application code during Phase 0. Produce the evidence-based audit and immediately continue into Phase 1.
>
> For Phases 1–6, implement the approved requirements in the existing stack. Follow the phase order and use each earlier phase's outputs as the contract for the next. Do not create duplicate tables, endpoints, services, or UI components when existing implementations can be corrected or extended.
>
> After every phase, perform the internal checkpoint, run the relevant tests, document actual outcomes, update `docs/MORS_MASTER_EXECUTION_TRACKER.md`, and immediately start the next phase. These checkpoints are not approval pauses.
>
> If a reversible low-risk detail is not decided, use existing repository conventions and the conservative defaults in the master playbook. Record the decision as provisional and continue. Do not stop to ask about minor UI or implementation choices.
>
> If a decision affects historical data, privacy, security, public disclosure, ranking fairness, account lifecycle, paid services, or production deployment, do not guess. Preserve safe existing behavior, document the required decision, and continue independent work. Do not bypass a dependency or label an unverified result complete.
>
> You may create local code changes, tests, documentation, and migration files. You may run the approved local test/build process and use disposable synthetic test data. **Do not apply migrations to production or shared remote databases, reset real databases, delete/transform real user data, weaken RLS, expose secrets, send real notifications, incur new paid-service costs, or deploy to production without the required explicit authorization.**
>
> Keep restaurant and dish ratings separate. Keep displayed averages separate from ranking scores. Use only eligible public content in public aggregates. Use verified location data. Do not claim a dish is currently available because someone logged it there. Keep Personal Taste private by default. Do not expose private experiences, derived insights, or notification content through public surfaces. Likes must not influence ratings. Reuse the existing social systems.
>
> Do not add unrelated features, AI recommendations, direct messages, stories, reels, ads, booking, delivery, or major infrastructure. The objective is a coherent and reliable food-journaling and discovery product, not feature count.
>
> If one optional or non-critical item is blocked, record it and continue safe independent work. If a critical security/privacy/data-loss issue makes a particular action unsafe, stop only that action, preserve the state, document the blocker, and continue unrelated local work where possible. Never invent a successful implementation to maintain momentum.
>
> Phase 7 is the final cross-product quality and release gate. Test the complete application, fix P0 defects, verify critical journeys and privacy, measure performance, check accessibility, validate migrations locally, prepare rollback/monitoring, and produce a GO / CONDITIONAL GO / NO-GO report.
>
> Do not deploy to production unless explicitly authorized. A release-ready candidate and a production deployment are different outcomes.
>
> At the end, create `docs/MORS_FINAL_EXECUTION_REPORT.md` and update `docs/MORS_MASTER_EXECUTION_TRACKER.md`. Include exact test commands, pass/fail/skipped results, files changed, migrations, evidence, blockers, provisional decisions, deferred work, and the final release recommendation.
>
> **The required behavior is continuous phase-by-phase execution without routine pauses for owner confirmation. The required standard is truthful, tested, dependency-aware implementation. Never sacrifice data safety, security, privacy, or correctness to avoid a pause.**

---

# 18. Final instruction

Run the project as one coordinated development program.

Do not treat each phase as an isolated conversation. Do not repeatedly ask the owner to initiate the next step. Do not stop simply because a phase document has been created.

Audit, implement, verify, document, and continue.

At the same time, do not confuse continuous execution with permission to perform destructive or external actions. Preserve user data, preserve security, maintain honest status, and finish with a verified release recommendation.
