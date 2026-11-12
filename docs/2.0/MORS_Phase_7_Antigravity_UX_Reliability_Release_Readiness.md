# MORS — Phase 7 Execution Brief for Antigravity
## UX Refinement, Reliability, Quality Assurance, and Release Readiness

**Phase:** 7  
**Priority:** P0 — release gate  
**Status:** Execute after Phases 0–6 have been reviewed. Any incomplete or unaccepted prerequisite must be recorded before release work begins.  
**Primary outcome:** Turn the implemented MORS product into a stable, coherent, secure, accessible, and measurable release candidate.  
**Nature of this phase:** Quality and stabilization, not a feature expansion sprint.

---

# 1. Mission

Phase 7 is the product-wide quality gate for MORS.

The previous phases establish the product foundations and major user-facing capabilities:

- Phase 0 — Repository and product audit.
- Phase 1 — Rating architecture and data model.
- Phase 2 — Find experience.
- Phase 3 — Regional ranking engine.
- Phase 4 — Restaurant and dish profiles.
- Phase 5 — Personal Taste Identity.
- Phase 6 — Social Experience Upgrade.

Phase 7 verifies that these capabilities work together as one coherent product.

The objective is not to make every screen look more decorative. The objective is to eliminate failures and inconsistencies that prevent a user from trusting MORS.

MORS must reliably support the core user journeys:

1. Create an account, sign in, and retain a valid session.
2. Log a food experience with images and ratings.
3. Find restaurants and dishes.
4. Inspect restaurant and dish profiles.
5. Understand regional ratings and rankings.
6. View private Personal Taste insights without exposing them.
7. Follow users, view the feed, and interact safely.
8. Save useful experiences into collections.
9. Recover from slow networks, failed requests, and invalid states.
10. Use the product comfortably on mobile and desktop.

**Core principle:**

> A feature is not complete because its page renders. It is complete only when its full user journey works, its data is correct, its permissions are enforced, and failure can be recovered from.

Do not add new product modules during this phase unless a defect fix genuinely requires a narrowly scoped supporting change.

---

# 2. Phase 7 goals

By the end of Phase 7, MORS should have:

- no known release-blocking defects;
- no broken primary navigation routes;
- reliable authentication and session handling;
- reliable food-experience creation and editing;
- verified image upload and persistence behavior;
- correct rating and ranking consistency across the product;
- privacy-safe reads and mutations;
- no unexplained infinite loading states;
- clear loading, empty, error, retry, and success states;
- responsive layouts for supported viewport sizes;
- accessible core interactions;
- measured performance with documented bottlenecks;
- dependable automated tests for critical journeys;
- a safe deployment, rollback, and monitoring plan;
- a documented release go/no-go recommendation.

A passing build alone is not evidence that the product is ready.

---

# 3. Mandatory prerequisites and phase reconciliation

Before making changes, inspect the actual status of Phases 0–6.

Read:
- repository instructions and `AGENTS.md`;
- accepted Phase 0 audit and evidence;
- Phase 1 schema/rating/eligibility decisions;
- Phase 2 search contracts and UX specification;
- Phase 3 ranking methodology and operations rules;
- Phase 4 profile contracts and privacy rules;
- Phase 5 personal-data privacy and control rules;
- Phase 6 social behavior, moderation, and privacy rules;
- current implementation plan and decision register;
- current test, build, deployment, and environment documentation.

Do not assume that a phase was implemented merely because its specification file exists.

## 3.1 Build a phase implementation status matrix

For each earlier phase, record:

| Status | Meaning |
|---|---|
| VERIFIED COMPLETE | Implemented and verified through appropriate tests or direct application checks |
| PARTIALLY IMPLEMENTED | Some requirements work; others are incomplete |
| BROKEN | Feature exists but fails in a reproducible way |
| DOCUMENTED ONLY | Specification exists but implementation is absent |
| UNVERIFIED | Evidence is insufficient |
| DEFERRED BY APPROVAL | Explicitly removed from release scope by an owner decision |
| NOT APPLICABLE | Requirement does not apply to the actual product |

For every incomplete P0 requirement:
- identify the affected user journey;
- attach evidence;
- assess severity;
- identify dependencies;
- recommend whether it must be fixed before release.

Do not quietly redefine “complete” to make the phase status look better.

## 3.2 Stop conditions

Stop release approval and report a blocker if:
- critical authentication or authorization defects remain;
- private content can be exposed through public pages, feeds, search, rankings, notifications, or metadata;
- rating or ranking data is materially incorrect;
- user-generated content can be lost or corrupted;
- image uploads can report success without durable storage/persistence;
- major routes fail or hang;
- the app cannot be built or deployed reproducibly;
- backup/rollback arrangements are unknown for risky database changes;
- unresolved security vulnerabilities could expose user data;
- essential moderation and abuse reports have no actionable handling path.

Do not recommend release merely because the number of open bugs is small. One severe privacy or data-loss bug is sufficient to block release.

---

# 4. Scope

## 4.1 In scope

- Full product journey audit.
- Route and navigation verification.
- Authentication and session reliability.
- Food-experience creation, edit, deletion, and persistence.
- Image upload, storage, access, and failure recovery.
- Rating and aggregate consistency.
- Search, regional rankings, restaurant/dish profiles.
- Personal Taste privacy and lifecycle.
- Feed, follow, likes, comments, notifications, collections, and moderation.
- Cross-surface design consistency.
- Loading, empty, error, retry, and success states.
- Responsive layout and accessibility.
- Performance profiling and query optimization.
- Error monitoring and operational readiness.
- Security and privacy regression testing.
- Release documentation, rollback plan, and go/no-go report.

## 4.2 Out of scope

Do not add these during Phase 7:

- new major product features;
- direct messaging;
- stories, reels, or live streaming;
- AI recommendations or generated summaries;
- new monetization or advertising;
- restaurant booking, delivery, or payments;
- major database redesign;
- nationwide rollout without a separate release decision;
- a complete visual rebrand;
- replacement of the framework or core infrastructure without an exceptional, evidenced need;
- speculative optimization without measurement.

A serious architectural defect may require a change, but it must be narrowly scoped, justified, tested, and approved.

---

# 5. Release scope and product freeze

Before QA starts, establish exactly what is intended to ship.

## 5.1 Release scope document

Create a release scope containing:
- supported user roles;
- supported platforms and browsers;
- supported geography;
- enabled feature set;
- intentionally deferred features;
- required environment variables and external services;
- database migrations included;
- known limitations;
- rollback boundary.

Every UI entry point must correspond to a working feature or be deliberately hidden/disabled with an understandable explanation.

Do not expose incomplete features as if they are ready.

## 5.2 Feature freeze

After the initial baseline audit:
- freeze nonessential feature development;
- allow only approved defect fixes and necessary reliability work;
- record all scope additions;
- retest affected journeys after each material change;
- do not add decorative redesign work while P0 reliability issues remain.

## 5.3 Release candidate

Identify a specific release candidate:
- commit/hash or immutable build identifier;
- build environment;
- migration set;
- feature flags/configuration;
- version;
- test report;
- known issues.

Do not use “latest code” as a release identifier.

---

# 6. Severity and prioritization framework

Triage all defects with a consistent severity system.

| Severity | Meaning | Release treatment |
|---|---|---|
| P0 — Critical | Data exposure, data loss, account takeover, broken core flow, serious integrity failure | Must fix before release |
| P1 — High | Major feature unusable, repeated crash/hang, important flow blocked for a meaningful user group | Must fix or explicitly remove the feature from release scope |
| P2 — Medium | Workaround exists; degraded but usable experience; limited defect | May ship only with documented owner acceptance |
| P3 — Low | Cosmetic issue or minor inconvenience with no material functional impact | Can be deferred |
| Observation | Improvement opportunity or non-defect | Backlog, not a release blocker |

For each issue record:
- identifier;
- feature/route;
- steps to reproduce;
- expected behavior;
- actual behavior;
- environment/device;
- frequency;
- severity;
- privacy/data impact;
- evidence;
- owner;
- fix commit;
- regression test;
- verification status.

Do not classify a bug as P3 merely because it is difficult to fix.

## 6.1 Priority order

1. Privacy and security.
2. Data loss and data integrity.
3. Authentication and access control.
4. Core food logging and persistence.
5. Broken routes and infinite loading.
6. Search and profile correctness.
7. Rating/ranking correctness.
8. Social interactions and moderation.
9. Performance and responsive behavior.
10. Visual polish.

---

# 7. Critical user journeys

Test journeys end to end in a real running application. Unit tests alone are insufficient.

## Journey A — Account creation and authentication

1. New user opens registration.
2. Required validation is shown.
3. User registers.
4. Confirmation or onboarding behavior follows the actual auth configuration.
5. User signs in.
6. Session persists across route changes and reload.
7. User signs out.
8. Protected routes become inaccessible.
9. Another user's private data cannot be retrieved by changing identifiers or URLs.

Acceptance:
- no infinite auth spinner;
- no false authenticated state;
- no redirect loop;
- no session leakage between accounts;
- expired sessions recover predictably.

## Journey B — Log a food experience

1. User starts logging from the main entry point.
2. User selects or creates a supported restaurant/place.
3. User adds one or more dishes.
4. User adds text and supported media.
5. User submits restaurant and dish ratings according to the approved model.
6. User sets visibility.
7. Submission is validated.
8. Experience persists.
9. User sees a confirmed result.
10. Experience appears in the correct diary/profile surfaces.
11. Related aggregates update according to the accepted freshness policy.

Acceptance:
- no duplicate experience on retries;
- no silent field loss;
- correct branch and dish relationships;
- correct rating ownership;
- image upload is durable;
- private experiences remain private;
- failed uploads do not leave broken records or misleading success messages.

## Journey C — Edit and delete an experience

1. User opens an owned experience.
2. User edits supported fields and ratings.
3. The update persists.
4. Aggregates replace old contributions rather than double-counting.
5. User deletes or removes the experience according to policy.
6. Public feeds, counts, rankings, and derived insights update as specified.
7. Another user cannot edit or delete it.

Acceptance:
- idempotent edits;
- correct lifecycle transitions;
- no stale public content beyond documented invalidation limits;
- no unauthorized mutation.

## Journey D — Find a restaurant

1. User opens Find.
2. Selects Restaurants.
3. Searches a name, branch, or supported location.
4. Applies supported filters.
5. Opens a result.
6. Sees correct branch identity and restaurant rating.
7. Opens a linked dish or experience.
8. Uses the logging action if desired.

Acceptance:
- no dish score shown as restaurant score;
- no unsupported opening-hours or availability claims;
- no incorrect branch selection;
- no private data in results.

## Journey E — Find a dish

1. User selects Food.
2. Searches a canonical dish or alias.
3. Opens the result.
4. Sees the correct dish aggregate and rating count.
5. Inspects community logged-at restaurant context.
6. Opens a restaurant branch.
7. Starts logging with the correct dish context if supported.

Acceptance:
- aliases resolve correctly;
- similar dishes remain distinct;
- restaurant ratings are not substituted;
- community logs are not described as verified menu availability.

## Journey F — Regional ranking

1. User opens a supported region and ranking type.
2. Selects a metric.
3. Sees a deterministic, paginated ranking.
4. Opens an entity.
5. Profile displays consistent aggregate data and ranking context.
6. Sparse regions display the approved insufficient-data state.

Acceptance:
- correct population and region;
- no silent region fallback;
- displayed average differs from internal ranking score where appropriate;
- only eligible records contribute;
- counts and dimensions are consistent.

## Journey G — Personal Taste Identity

1. User opens their own taste profile.
2. Insights use only their own permitted source data.
3. Activity and preference sections are distinct.
4. Evidence counts and insufficient-data states are correct.
5. User hides/excludes/opts out according to shipped controls.
6. Another account cannot view the private summary.
7. Derived data follows deletion and reset behavior.

Acceptance:
- private by default;
- no cross-user access;
- no sensitive trait inference;
- no public leakage through metadata or social cards.

## Journey H — Social feed and interactions

1. User follows another account.
2. Eligible experiences appear in the following feed.
3. User likes and unlikes an experience.
4. User comments where permitted.
5. Notifications are created and deduplicated.
6. User saves an experience to a collection.
7. User blocks or reports content.
8. Access and notifications follow the accepted privacy/safety rules.

Acceptance:
- deterministic feed order;
- no private or blocked content leakage;
- likes do not change ratings;
- reports reach an actionable workflow;
- retries do not create duplicates.

## Journey I — Recovery and failure handling

Test:
- slow network;
- offline state;
- server error;
- expired session;
- image upload failure;
- duplicate submit;
- pagination failure;
- malformed route identifier;
- deleted target;
- stale cached aggregate.

Acceptance:
- clear error message;
- retry where appropriate;
- user input preserved when safe;
- no infinite spinner;
- no false success;
- no duplicate writes;
- no blank page.

---

# 8. Navigation and route audit

Every visible route and entry point must be checked.

## 8.1 Route inventory

Create a route inventory from the actual application:
- public routes;
- authentication routes;
- protected routes;
- user profile routes;
- diary routes;
- experience detail/edit routes;
- Find/search routes;
- restaurant and dish routes;
- regional ranking routes;
- Personal Taste route;
- feed and notification routes;
- collection routes;
- settings/privacy routes;
- moderation/report routes, where applicable.

Do not rely only on documentation. Enumerate routes from the application code and verify runtime behavior.

## 8.2 Route test cases

For each route test:
- direct URL access;
- internal navigation;
- reload;
- browser back/forward;
- invalid identifier;
- deleted entity;
- unauthenticated access;
- unauthorized account;
- narrow viewport;
- network failure.

## 8.3 Navigation consistency

Check:
- active navigation state;
- page titles;
- back navigation;
- breadcrumbs where appropriate;
- canonical URLs;
- not-found states;
- redirects;
- no orphaned buttons or dead links.

A button must either perform its stated action or be removed/disabled with a clear reason.

---

# 9. Loading, buffering, error recovery, and perceived performance

Persistent loading states are release blockers when they prevent users from understanding whether the application is working.

## 9.1 Loading state audit

For every asynchronous area, identify:
- what request is pending;
- what state starts the request;
- what resolves it;
- what happens on failure;
- whether a timeout exists;
- whether stale requests can overwrite new state;
- whether the loading flag can become stuck.

Audit:
- initial app/session resolution;
- dashboard/home feed;
- Find/search;
- profile data;
- restaurant/dish aggregates;
- experience submission;
- image uploads;
- comments and likes;
- notifications;
- collections;
- Personal Taste calculations.

## 9.2 Loading state rules

- Show a loading indicator only while work is actually pending.
- Use a skeleton only when the expected layout is known.
- Avoid blocking the whole page when only one section is loading.
- Preserve already loaded content where safe.
- Give long-running uploads measurable progress where the upload mechanism supports it.
- Do not display an unexplained “Rendering…” or blank content area.
- Avoid flicker from unnecessary repeated loading toggles.
- Do not make users wait for below-the-fold content before showing the page header.

## 9.3 Request lifecycle

For every request:
- handle success;
- handle empty result;
- handle failure;
- handle timeout or cancellation where appropriate;
- prevent stale response races;
- avoid duplicate submits;
- clean up subscriptions/listeners;
- reset loading state on all terminal paths.

Ensure that one component unmounting or a user switching modes cannot leave an obsolete request controlling the current screen.

## 9.4 Error recovery

Errors should:
- explain what failed at a useful level;
- preserve user-entered content where safe;
- offer Retry when retry is meaningful;
- avoid exposing database/schema internals;
- avoid classifying network failure as “no results”;
- avoid showing a success toast before persistence is confirmed.

Do not use generic error handling that hides all failures and leaves the user uncertain.

---

# 10. Authentication, sessions, and account lifecycle

Verify the actual auth provider and configuration.

Test:
- registration;
- sign-in;
- sign-out;
- session refresh;
- expired or revoked session;
- multi-tab behavior;
- direct protected-route access;
- account deletion request;
- deletion grace period, if configured;
- account restore, if supported;
- suspended/deactivated account behavior;
- user profile state after authentication changes.

Security requirements:
- authorization is enforced server-side;
- client state is not treated as proof of permission;
- user IDs from request bodies are not trusted as ownership;
- secrets remain server-side;
- auth errors do not reveal whether a sensitive account exists beyond the approved behavior.

Ensure logout clears or invalidates user-specific client state and private cached data.

---

# 11. Food logging, images, and persistence integrity

This is one of the most important release gates.

## 11.1 Experience persistence

Verify:
- form validation;
- relationship creation;
- transaction/partial-write behavior;
- correct owner assignment;
- correct restaurant/branch link;
- correct dish links;
- correct rating values;
- correct visibility;
- correct timestamps;
- update and deletion behavior.

A successful UI response must correspond to persisted data, not merely local component state.

## 11.2 Image upload lifecycle

Test:
1. valid image;
2. unsupported file type;
3. file too large;
4. interrupted network;
5. upload timeout;
6. storage authorization failure;
7. upload succeeds but database write fails;
8. database write succeeds but later media processing fails, if applicable;
9. user retries;
10. user removes/replaces an image.

Verify:
- storage path ownership;
- file type and size checks;
- storage access policies;
- correct association with experience;
- orphaned upload handling;
- cleanup behavior;
- signed/public URL strategy;
- image visibility matches experience visibility;
- no private image exposed via public URL or metadata.

Do not report an image as saved unless the storage and database relationship is confirmed.

## 11.3 Data integrity checks

Check for:
- experiences without valid owners;
- orphaned dish links;
- duplicate rating contributions;
- aggregate drift;
- missing media references;
- stale public counters;
- invalid visibility states;
- deleted entities still exposed in result sets.

Use safe read-only checks first. Never run destructive cleanup against production during QA.

---

# 12. Rating, search, and ranking consistency audit

MORS depends on users trusting its ratings.

## 12.1 Rating semantics

Across all surfaces, verify:
- restaurant rating is restaurant-level;
- dish rating is dish-level;
- each dimension has its own denominator;
- missing values are not treated as zero;
- averages are arithmetic display values;
- ranking scores are not displayed as averages;
- rating counts follow the accepted eligibility rule.

## 12.2 Cross-surface consistency

Compare the same entity across:
- Find results;
- regional ranking pages;
- restaurant profile;
- dish profile;
- food experience detail;
- user diary where relevant.

The same aggregate version and freshness state must not produce contradictory numbers.

## 12.3 Search consistency

Verify:
- canonical identity;
- alias handling;
- exact and partial match behavior;
- filters;
- pagination;
- relevance ordering;
- query state in URL;
- privacy;
- empty versus failed state.

## 12.4 Ranking consistency

Verify:
- exact region and metric;
- eligibility;
- minimum evidence;
- ranking formula/version;
- deterministic order;
- stable pagination;
- stale-result behavior;
- no silent fallback to broader region.

Do not fix inconsistent values by hardcoding UI numbers. Trace the data source and correct the underlying contract.

---

# 13. Social and trust/safety audit

Verify:
- follow/unfollow;
- feed authorization;
- chronological ordering;
- likes;
- comments and replies;
- notifications;
- collection saves;
- report submission;
- moderation handling;
- blocking;
- optional mute;
- deleted/restricted target handling.

Check that:
- likes do not affect ratings;
- comments do not expose private experiences;
- notifications cannot leak inaccessible content;
- blocked users are handled consistently;
- report workflows reach an authorized reviewer;
- Personal Taste insights remain private;
- user-generated text is rendered safely.

A report button with no operational review path is not a completed safety feature.

---

# 14. UX consistency and visual quality

This is a consistency pass, not a blanket redesign.

## 14.1 Design system audit

Review:
- typography;
- spacing;
- colors;
- borders and surfaces;
- buttons;
- input fields;
- dialogs;
- cards;
- rating displays;
- badges;
- navigation;
- empty states;
- loading patterns;
- alerts and toasts.

Consolidate duplicate patterns where this reduces inconsistency without creating a risky rewrite.

## 14.2 Content hierarchy

On each page, ask:
- Is the primary purpose immediately obvious?
- Is the main action discoverable?
- Is key information visible without excessive scrolling?
- Are ratings and counts understandable?
- Is branch/dish context obvious?
- Is there too much metadata?
- Is the page visually noisy?
- Does the page still work when data is missing?

## 14.3 Consistency rules

- A restaurant rating card should mean the same thing across the app.
- A dish rating card should mean the same thing across the app.
- Shared experience cards should preserve interaction and privacy behavior.
- Loading and error messages should use consistent language.
- Primary and secondary actions should be visually predictable.
- Mobile controls should not be cramped.
- Do not create new colors, badges, or components without a reusable purpose.

## 14.4 Visual QA

Capture screenshots of:
- Home feed;
- Find Restaurants;
- Find Food;
- restaurant profile;
- dish profile;
- regional ranking;
- Personal Taste;
- user diary/profile;
- experience logging;
- notification center;
- collections;
- settings/privacy.

Capture at minimum:
- narrow mobile;
- typical mobile;
- tablet;
- desktop.

Screenshots are evidence, not a substitute for interaction tests.

---

# 15. Responsive behavior and device testing

Test supported viewport ranges using real browser rendering.

Suggested QA viewports:
- 360 × 800;
- 390 × 844;
- 430 × 932;
- 768 × 1024;
- 1024 × 768;
- 1366 × 768;
- 1440 × 900.

These are test dimensions, not a claim that every possible device is supported.

Verify:
- no unexpected horizontal overflow;
- navigation fits;
- text does not clip;
- cards remain readable;
- dialogs fit;
- keyboard does not obscure form controls;
- upload controls work on supported browsers;
- touch targets are usable;
- images retain correct aspect ratio;
- sticky elements do not cover content;
- long names and missing images do not break layouts.

Test on actual target browsers where possible, not just one Chromium viewport.

---

# 16. Accessibility audit

Use the accessibility standard already adopted by the repository or product. If no standard exists, recommend and document an appropriate baseline rather than making unsupported compliance claims.

Check:
- semantic page structure;
- heading order;
- form labels and instructions;
- keyboard navigation;
- visible focus;
- screen-reader names;
- accessible dialogs;
- error identification;
- status announcements;
- contrast;
- text scaling;
- image alternative text;
- non-color status indicators;
- reduced motion;
- accessible charts;
- accessible pagination and infinite scrolling.

Automated accessibility scans are useful but insufficient. Perform manual keyboard and screen-reader checks on critical journeys.

Do not claim full WCAG conformance based only on an automated scanner.

---

# 17. Performance and stability

Measure real performance before selecting optimizations.

## 17.1 Frontend metrics

Evaluate:
- initial render;
- largest contentful paint;
- interaction responsiveness;
- layout shift;
- JavaScript bundle size;
- route transition time;
- image decode/loading;
- hydration/runtime errors.

Use the current ecosystem's available tools. Do not introduce unnecessary monitoring dependencies.

## 17.2 Backend and database metrics

Evaluate:
- request latency;
- query execution time;
- query count;
- N+1 patterns;
- slow query plans;
- payload size;
- connection errors;
- rate-limit behavior;
- storage upload/download latency.

## 17.3 Stability

Check:
- uncaught exceptions;
- unhandled promise rejections;
- repeated requests;
- memory leaks from subscriptions/listeners;
- stale requests overwriting current UI;
- broken cache invalidation;
- duplicate database writes;
- failed background jobs;
- unstable pagination.

## 17.4 Performance budgets

Do not invent universal speed targets without measuring the deployment environment.

Instead:
1. Record the baseline.
2. Identify the most user-visible bottlenecks.
3. Propose practical targets for the current stack and hosting.
4. Obtain owner acceptance where a target changes release policy.
5. Measure after fixes.
6. Record device, network, dataset, and environment.

Prioritize improvements that make the product feel responsive:
- show useful content before optional media;
- avoid blocking page shells on unrelated requests;
- paginate large feeds;
- reduce unnecessary client/server round trips;
- cache only safe and appropriately fresh public data.

---

# 18. Security and privacy release audit

Perform a final security pass across all surfaces.

Check:
- server-side authorization;
- database row-level security;
- role/ownership validation;
- input validation;
- output encoding;
- file upload controls;
- storage access policies;
- secrets and environment variables;
- dependency vulnerabilities;
- rate limiting;
- session handling;
- public metadata;
- API error leakage;
- cross-user access;
- private profile and diary data;
- private Personal Taste insights;
- notification payload privacy;
- moderation permissions.

Test common attack paths appropriate to the current application:
- changing IDs in requests;
- submitting another user's owner ID;
- direct API calls bypassing UI;
- unauthorized edits/deletes;
- malformed query/filter values;
- script/markup-like user text;
- oversized upload attempts;
- invalid file types;
- crafted pagination cursors;
- attempts to write aggregate/ranking values from the client.

Do not perform destructive penetration tests against production. Use an approved test/staging environment.

Create a list of third-party dependencies and external services that hold or process user data. Verify that their use is documented and appropriate.

---

# 19. Data migrations and deployment safety

## 19.1 Migration inventory

For the release candidate, list:
- new migrations;
- previously applied migrations;
- pending migrations;
- backfills;
- indexes;
- constraints;
- functions/triggers/policies;
- environment/config changes.

Verify that already-applied migration history has not been rewritten.

## 19.2 Pre-deployment checks

- database backup/restore strategy documented;
- migration order verified;
- required environment variables present;
- external services reachable;
- storage policies deployed;
- feature flags documented;
- build artifact identified;
- health checks ready;
- error monitoring ready;
- rollback owner identified.

## 19.3 Migration safety

- test migrations in a disposable local or approved staging database;
- record before/after row counts and integrity checks;
- make backfills idempotent;
- avoid destructive column/table removal in the same release as a new write path unless explicitly approved;
- never reset production;
- never disable RLS to get a deployment through;
- never apply remote migrations without explicit approval;
- ensure compatibility with the currently deployed application during rollout where needed.

## 19.4 Deployment strategy

Choose a strategy suitable for the current hosting architecture:
- controlled release;
- staged rollout;
- feature flags for risky capabilities;
- short maintenance window only if unavoidable and approved.

Do not claim zero downtime unless it has been designed and verified.

## 19.5 Rollback

Document:
- application rollback steps;
- database rollback or forward-fix strategy;
- feature flag rollback;
- storage compatibility;
- cache invalidation;
- recovery owner;
- expected data impact.

Some migrations are not safely reversible. State this explicitly and plan a forward-compatible recovery rather than pretending every migration has a simple down migration.

---

# 20. Monitoring and operational readiness

The release must be observable.

## 20.1 Minimum signals

Where supported by the current infrastructure, monitor:
- application availability;
- server errors;
- client runtime errors;
- authentication failures;
- database connection/query failures;
- image upload failures;
- search failures;
- experience submission failures;
- feed/notification processing errors;
- background job failures;
- unusual request rates;
- ranking calculation staleness;
- storage failures.

## 20.2 Alerting

Define:
- what triggers an alert;
- who receives it;
- severity;
- initial investigation steps;
- escalation path.

Do not create noisy alerts for events nobody will monitor.

## 20.3 Logging

Logs must:
- identify the operation and correlation/request ID where available;
- avoid secrets and tokens;
- avoid raw private experience text;
- avoid private Personal Taste content;
- avoid unnecessary personal data;
- preserve enough evidence to diagnose failures.

## 20.4 Runbooks

Create concise runbooks for:
- login/session incident;
- food-experience submission failure;
- image upload failure;
- database connection/migration problem;
- search outage;
- stale or incorrect rankings;
- social notification backlog;
- privacy/data exposure incident;
- rollback.

An alert without an investigation procedure is not operational readiness.

---

# 21. Test strategy

Use the repository's existing test stack. Do not introduce a new framework without a documented reason.

## 21.1 Test layers

### Unit tests
Verify:
- validation;
- rating calculations;
- ranking calculations;
- privacy/eligibility helpers;
- state transitions;
- normalization and parsing;
- pagination utilities.

### Integration tests
Verify:
- database writes/reads;
- RLS policies;
- storage access;
- APIs;
- aggregate updates;
- notification creation;
- derived Personal Taste refresh;
- deletion/visibility lifecycle.

### End-to-end tests
Verify complete user journeys across browser routes and backend persistence.

### Manual exploratory tests
Verify:
- responsive behavior;
- slow networks;
- browser back/forward;
- keyboard and screen-reader behavior;
- real image selection/upload;
- session expiry;
- device/browser-specific issues.

### Regression tests
Ensure fixes do not break previously working features.

## 21.2 Test data

- use non-sensitive synthetic fixtures;
- seed predictable restaurant, branch, dish, and user scenarios;
- include low-data and no-data situations;
- include private/public/followers-only records;
- include failed uploads and deleted targets;
- never copy production private content into test fixtures.

## 21.3 Test evidence

For each test run, record:
- command;
- environment;
- application/build version;
- date/time;
- pass/fail count;
- skipped tests;
- known flakiness;
- failure details;
- evidence link/path.

Do not report “all tests passed” if critical suites were skipped.

---

# 22. Feature-by-feature QA checklist

| Feature | Release checks |
|---|---|
| Authentication | Register, login, logout, refresh, expiry, protected routes |
| User profile | Correct owner, public fields, privacy settings, route handling |
| Food diary | Correct entries, pagination, edits, deletion, visibility |
| Experience logging | Validation, persistence, ratings, relations, retries |
| Image uploads | Type/size, storage, permissions, retry, cleanup |
| Find Restaurants | Search, filters, identity, ratings, privacy |
| Find Food | Aliases, variants, dish ratings, context |
| Regional rankings | Formula, region, count, freshness, tie-breaker |
| Restaurant profiles | Branch identity, dimensions, experiences, location accuracy |
| Dish profiles | Canonical identity, dish ratings, logged-at context |
| Personal Taste | Owner-only, evidence, opt-out, exclusion, deletion |
| Feed | Visibility, ordering, pagination, refresh, empty/error states |
| Follows | Follow/unfollow, counts, block behavior |
| Likes | Idempotency, count consistency, no rating influence |
| Comments | Authorization, validation, moderation, pagination |
| Notifications | Correct events, deduplication, privacy, read state |
| Collections | Save/remove, visibility, ordering, deleted items |
| Reports/blocks | Actionable review, consistent restrictions |
| Settings | Account/privacy/notification controls, persistence |
| Metadata | Canonical URLs, public/private previews, no private leakage |

---

# 23. UX polish backlog

Only after P0 functional and privacy issues are resolved, address these refinements:

- consistent spacing and typography;
- consistent button sizes and states;
- standardized loading skeletons;
- improved empty-state copy;
- clear distinction between no data and failed request;
- improved rating display hierarchy;
- clearer restaurant branch labels;
- clearer dish logged-at wording;
- consistent card image ratios;
- more predictable dialogs and menus;
- better mobile navigation;
- reduced layout shifts;
- improved accessibility labels;
- clear success and error feedback.

For each polish item:
- explain the usability problem;
- show the affected route;
- describe the change;
- test for regression.

Do not change colors, typography, or components merely because a different style looks fashionable.

---

# 24. Implementation workstreams

## Workstream A — Release baseline and phase reconciliation

1. Read all repository instructions and accepted Phase 0–6 artifacts.
2. Verify implementation status against actual code and runtime behavior.
3. Build the phase status matrix.
4. Build route and feature inventories.
5. Establish the release scope and feature freeze.
6. Record baseline build/test/performance results.
7. Create a prioritized defect register.

**Deliverable:** `docs/phase-7/RELEASE_BASELINE.md`

## Workstream B — Critical journey QA

1. Execute all critical user journeys.
2. Test them on the deployed test/staging environment where available.
3. Record reproducible defects.
4. Identify privacy/data integrity failures first.
5. Add regression tests for each confirmed P0/P1 issue.

**Deliverable:** `docs/phase-7/CRITICAL_JOURNEY_REPORT.md`

## Workstream C — Reliability and recovery

1. Audit async request lifecycles.
2. Fix stuck loading states.
3. Fix stale request races.
4. Fix duplicate submissions.
5. Fix retry and cancellation behavior.
6. Fix image upload/persistence failure paths.
7. Improve partial-page failure recovery.
8. Verify session and route recovery.

**Deliverable:** reliability fixes and `docs/phase-7/RELIABILITY_REPORT.md`

## Workstream D — Data integrity and privacy

1. Verify rating/aggregate consistency.
2. Verify visibility and moderation eligibility.
3. Verify owner scoping.
4. Verify storage policies.
5. Verify Personal Taste privacy.
6. Verify notification and feed privacy.
7. Verify account deletion/export behavior.
8. Add negative authorization tests.

**Deliverable:** `docs/phase-7/SECURITY_AND_DATA_INTEGRITY_REPORT.md`

## Workstream E — UX and responsive refinement

1. Audit shared design patterns.
2. Audit navigation and routes.
3. Verify mobile and desktop layouts.
4. Fix interaction inconsistencies.
5. Fix missing and misleading states.
6. Improve accessibility.
7. Capture before/after screenshots.

**Deliverable:** `docs/phase-7/UX_AND_ACCESSIBILITY_REPORT.md`

## Workstream F — Performance and operations

1. Measure frontend performance.
2. Measure backend/database performance.
3. Inspect query plans and N+1 behavior.
4. Measure upload and media behavior.
5. Verify monitoring and logs.
6. Create operational runbooks.
7. Document accepted performance targets and actual results.

**Deliverable:** `docs/phase-7/PERFORMANCE_AND_OPERATIONS_REPORT.md`

## Workstream G — Release preparation

1. Freeze release scope.
2. Identify immutable release candidate.
3. Verify migrations and environment configuration.
4. Confirm backup/rollback plan.
5. Run final regression suite.
6. Conduct release review.
7. Produce go/no-go recommendation.

**Deliverable:** `docs/phase-7/RELEASE_CANDIDATE_CHECKLIST.md` and `docs/phase-7/GO_NO_GO_REPORT.md`

---

# 25. Priority order

## P0 — Must resolve before release

1. User data/privacy exposure.
2. Data loss or incorrect ownership.
3. Authentication/session failures.
4. Food logging and image persistence failures.
5. Broken major routes.
6. Infinite loading or unrecoverable error states in core flows.
7. Incorrect restaurant/dish rating or ranking values.
8. Search/profile identity mismatches.
9. Unauthorized social mutations or content exposure.
10. Personal Taste privacy leaks.
11. Critical security vulnerabilities.
12. Migration/deployment risks without rollback.
13. Build or release reproducibility failures.

## P1 — Must fix or explicitly remove from release scope

1. Major mobile layout breakage.
2. Repeated feed/search/profile failures.
3. Notifications that link to wrong or inaccessible targets.
4. Important accessibility failures.
5. Performance bottlenecks that make core tasks unreliable.
6. Incomplete moderation/report handling.
7. Inconsistent UI state or misleading success feedback.

## P2 — May be accepted with documented owner approval

1. Minor visual inconsistencies.
2. Non-critical slow secondary sections.
3. Low-frequency cosmetic defects.
4. Minor metadata improvements.
5. Nonessential animations or transitions.

## Explicitly defer

- new major features;
- AI features;
- new social modules;
- monetization;
- speculative infrastructure;
- broad visual rebrand.

---

# 26. Required documentation and evidence

Follow repository conventions. Suggested files:

| File | Required content |
|---|---|
| `docs/phase-7/RELEASE_BASELINE.md` | Phase status, scope, routes, current build/test baseline |
| `docs/phase-7/DEFECT_REGISTER.md` | Severity, reproduction, owner, fix and verification |
| `docs/phase-7/CRITICAL_JOURNEY_REPORT.md` | End-to-end journey results |
| `docs/phase-7/RELIABILITY_REPORT.md` | Loading, retries, uploads, session and recovery |
| `docs/phase-7/SECURITY_AND_DATA_INTEGRITY_REPORT.md` | Access controls, privacy, migrations, data checks |
| `docs/phase-7/UX_AND_ACCESSIBILITY_REPORT.md` | Design consistency, viewport and accessibility results |
| `docs/phase-7/PERFORMANCE_AND_OPERATIONS_REPORT.md` | Metrics, monitoring, runbooks, known limits |
| `docs/phase-7/RELEASE_CANDIDATE_CHECKLIST.md` | Build, migrations, environment, backup and rollback |
| `docs/phase-7/GO_NO_GO_REPORT.md` | Final release recommendation and unresolved risks |

Store safe evidence under `docs/evidence/phase-7/`:
- test outputs;
- screenshots;
- performance measurements;
- query plans;
- migration validation;
- accessibility results;
- route verification;
- redacted error logs;
- release build identifiers.

Do not commit:
- secrets or environment files;
- production personal data;
- private reviews or comments;
- user media;
- access tokens;
- unredacted logs containing personal data.

---

# 27. Release go/no-go criteria

Antigravity must produce one of three outcomes.

## GO

Recommend GO only if:
- all P0 defects are resolved and verified;
- no material privacy/security issue remains;
- critical user journeys pass;
- data persistence is verified;
- rating and ranking integrity is verified;
- the app builds and deploys reproducibly;
- migration and rollback plan is accepted;
- monitoring and incident ownership exist;
- remaining P1/P2 issues are explicitly accepted by the owner.

## CONDITIONAL GO

Recommend CONDITIONAL GO only if:
- no P0 issue remains;
- known P1 issues are isolated;
- affected features can be safely disabled or removed from release scope;
- owner accepts the residual risk;
- a follow-up fix/verification plan is documented.

Do not use conditional approval to ship a known privacy or data-loss defect.

## NO-GO

Recommend NO-GO if:
- any P0 issue remains;
- data correctness or ownership cannot be established;
- privacy boundaries are not reliable;
- critical workflows fail;
- deployment/rollback is unsafe;
- test evidence is insufficient for the risk level.

A NO-GO decision is a valid result. Do not manipulate severity or skip tests to force a launch.

---

# 28. Definition of Done

Phase 7 is complete only when:

- [ ] Actual implementation status of Phases 0–6 is documented.
- [ ] Release scope and feature freeze are defined.
- [ ] All major routes are inventoried and verified.
- [ ] Critical user journeys have been exercised end to end.
- [ ] No P0 defect remains.
- [ ] P1 issues are fixed or explicitly removed/accepted under a documented decision.
- [ ] Authentication, session, and authorization behavior is verified.
- [ ] Experience creation, editing, deletion, and image persistence are verified.
- [ ] Rating, aggregate, and ranking consistency is verified.
- [ ] Search, profiles, feed, collections, notifications, and moderation are verified.
- [ ] Personal Taste remains private according to its approved controls.
- [ ] Loading, buffering, empty, error, and retry behavior is reliable.
- [ ] Mobile, desktop, and accessibility checks are complete.
- [ ] Performance has been measured and major bottlenecks addressed.
- [ ] Security and privacy regression tests pass.
- [ ] Migrations and deployment have a documented safe procedure.
- [ ] Rollback/recovery plan exists and has been reviewed.
- [ ] Monitoring and incident runbooks are ready.
- [ ] Release candidate is immutable and identified.
- [ ] Final GO / CONDITIONAL GO / NO-GO decision is documented.
- [ ] Owner has accepted remaining risks.

If a P0 requirement is false, Phase 7 is not release-ready. Report **BLOCKED** or **PARTIALLY COMPLETE**.

---

# 29. Required final report from Antigravity

Return a release-readiness report with:

1. **Verdict:** GO / CONDITIONAL GO / NO-GO.
2. **Release candidate:** commit/hash, build/version, environment.
3. **Phase reconciliation:** actual status of Phases 0–6.
4. **Release scope:** enabled, disabled, and deferred features.
5. **Critical journeys:** pass/fail and evidence.
6. **P0/P1/P2 defects:** open, fixed, deferred, and accepted.
7. **Authentication/security:** results and unresolved risks.
8. **Data integrity:** experience, image, rating, aggregate, and deletion checks.
9. **Privacy:** results for public/private/followers-only and Personal Taste.
10. **Reliability:** loading, error, retry, upload, and session results.
11. **UX/accessibility:** viewports, manual checks, and known limitations.
12. **Performance:** baseline and post-fix measurements with environment details.
13. **Deployment:** migrations, backups, rollback, monitoring, and runbooks.
14. **Tests:** exact commands, pass/fail/skipped counts, and flaky tests.
15. **Files changed:** code, tests, migrations, configuration, and documentation.
16. **Known risks:** precise impact and owner decision needed.
17. **Recommendation:** whether the product is safe to release and why.

Never claim “production ready” or “fully secure” based only on a successful build or test suite. State exactly what was and was not verified.

---

# 30. Antigravity execution prompt

> Execute MORS Phase 7 — UX Refinement, Reliability, and Release Readiness using this brief and the actual repository state.
>
> Begin by reading repository instructions and reconciling the accepted Phase 0–6 specifications with the current implementation. Do not assume that a specification means a feature is implemented. Inspect the actual application, routes, database/migrations, auth, storage, privacy rules, tests, and deployment configuration.
>
> Establish the release scope and a feature freeze. Build the route inventory, phase status matrix, defect register, and baseline test/build/performance report before making changes.
>
> Test complete user journeys, especially authentication, food logging, image upload/persistence, editing/deletion, restaurant/dish search, ratings, regional rankings, profiles, Personal Taste privacy, feed, comments, notifications, collections, and moderation.
>
> Prioritize privacy/security, data loss, ownership, authentication, persistence, broken routes, infinite loading, and incorrect ratings/rankings above visual polish. A P0 issue must block release.
>
> Audit every asynchronous request for loading lifecycle, stale response races, duplicate submission, cancellation, timeout, success, failure, and retry behavior. Remove unexplained infinite loading states. Preserve user input after safe failures. Do not show success until the relevant server/storage persistence is confirmed.
>
> Verify image upload from file selection through storage and database association, including interrupted uploads, retries, authorization failures, orphan cleanup, and visibility. Do not claim an image is saved unless persistence is confirmed.
>
> Verify privacy and authorization server-side across every surface. Test direct API requests and crafted identifiers, not just the UI. Confirm that private experiences and Personal Taste insights cannot leak through search, feeds, counts, notifications, page metadata, or public APIs.
>
> Verify rating and ranking consistency across Find results, regional ranking pages, restaurant/dish profiles, and experiences. Do not hardcode UI values to hide discrepancies; trace and fix the source contract.
>
> Improve visual consistency only where it fixes a real usability problem. Test responsive layouts, keyboard behavior, screen-reader labels, contrast, reduced motion, and critical accessibility states. Do not perform a broad rebrand or add features.
>
> Measure performance in a documented environment. Inspect query plans, N+1 behavior, payload sizes, image loading, and client runtime failures. Optimize based on measured bottlenecks rather than speculation.
>
> Review migrations, backups, deployment compatibility, monitoring, alerting, runbooks, and rollback. Do not reset production, alter applied migration history, or apply remote migrations without explicit approval. Never weaken RLS or remove security policies to get a release through.
>
> Run unit, integration, end-to-end, security, accessibility, and regression checks using the existing project tools. Report exact commands, results, skipped tests, known flakiness, and evidence. Do not claim an unexecuted test passed.
>
> Keep changes limited to stabilization and release readiness. Do not add major features, AI, monetization, direct messaging, or unrelated redesign. If a P0 defect or unresolved privacy/data-safety decision remains, recommend NO-GO.
>
> Finish with the required release-readiness report and one explicit recommendation: GO, CONDITIONAL GO, or NO-GO. Explain the evidence and remaining risks.

---

# 31. What comes after Phase 7

Phase 7 is the release gate for the current MORS product scope. It does not automatically authorize a new phase.

After a release candidate is verified, the next work should be driven by:
- actual user feedback;
- failed or abandoned user journeys;
- search queries with no results;
- restaurant/dish data coverage;
- quality of user-generated contributions;
- moderation and support load;
- measured performance;
- retention and repeat logging behavior;
- feature usage and opt-out patterns;
- reliability incidents.

Do not create Phase 8 just to keep adding features. First determine what users are actually struggling with and what evidence says should be improved.

Potential post-release work may include:
- onboarding refinement;
- better contribution quality and entity correction flows;
- regional coverage expansion;
- improved creator/contributor tools;
- recommendation experiments;
- monetization, only if the product has a credible usage and trust foundation.

Each should be a separate, evidence-backed product decision.
