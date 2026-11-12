# MORS — Phase 5 Execution Brief for Antigravity
## Personal Taste Identity: A User's Food Preferences, Patterns, and Taste Profile

**Phase:** 5  
**Priority:** P1 — personalization foundation  
**Status:** Execute only after Phases 0–4 are reviewed and accepted  
**Primary outcome:** Give each user a clear, useful, editable, privacy-controlled picture of their own food tastes, based on their actual MORS activity rather than unsupported assumptions.

---

## 1. Mission

Build the **Personal Taste Identity** feature: a private view of what a user appears to enjoy, based on the user's own logged food experiences and explicit ratings.

MORS should help a user answer:

- Which cuisines and dishes do I tend to rate highly?
- Which foods do I log most often?
- What kinds of food experiences do I consistently enjoy?
- How has my taste activity changed over time?
- Which parts of my taste profile are supported by enough evidence, and which are still uncertain?

The aim is not to label a person, predict their personality, or pretend a small diary represents their complete life. It is to turn useful food-journal data into a transparent personal insight.

**Core principle:**

> Describe observed food activity. Do not invent preferences, infer sensitive traits, or present weak evidence as a definitive identity.

The profile is about food preferences and MORS activity only. It is not a health profile, diet assessment, religious/cultural classifier, medical tool, or personality test.

---

## 2. Product definition

Personal Taste Identity has three related but distinct concepts:

### 2.1 Taste profile

A structured summary of the user's demonstrated food preferences based on explicit ratings and reliable structured metadata.

Examples:
- cuisines the user has rated highly;
- dishes the user repeatedly rates highly;
- restaurant rating patterns by dimension;
- food categories the user frequently logs;
- explicit taste tags the user has selected, if such tags are supported.

A taste profile must say when evidence is limited.

### 2.2 Food activity

A factual summary of what the user logs, independent of whether they like it.

Examples:
- most logged cuisines;
- most logged dishes;
- number of experiences logged in a period;
- restaurants or categories visited most often.

**Important distinction:** Frequently logged does not mean favourite. A user may log a dish because it is convenient, inexpensive, nearby, or simply new. Do not convert activity counts into preference scores.

### 2.3 Taste changes over time

A cautious comparison of the user's own recorded activity over different periods.

Examples:
- cuisines logged more often in the last three months;
- dishes receiving higher ratings recently;
- changes in rating patterns where sample sizes are adequate.

Do not claim that the user's tastes have changed based on one or two recent records.

---

## 3. Mandatory prerequisites

Read and verify the accepted deliverables from prior phases.

### Phase 0 — Repository and product audit
- Existing user profile and diary behavior.
- Existing privacy and account lifecycle rules.
- Current settings and profile controls.
- Existing analytics, data export, and deletion functionality.
- Existing social visibility rules.

### Phase 1 — Rating architecture and data model
- Canonical restaurant/branch/dish/experience relationships.
- Rating scale, dimensions, and validation rules.
- Source-of-truth rating records.
- Public versus private eligibility semantics.
- User ownership and authorization.
- Dish aliases, cuisine/category metadata, and data quality.

### Phase 2 — Find experience
- Canonical search entity contracts.
- Supported cuisine and dish categories.
- Search result and profile identity conventions.

### Phase 3 — Regional ranking engine
- Aggregate and metric semantics.
- Separation between displayed averages and ranking scores.
- No reuse of regional ranking scores as personal preference scores.

### Phase 4 — Restaurant and dish profiles
- Canonical profile relationships.
- Public experience eligibility.
- Existing user profile and diary integration.
- Current collection, social, and profile UI patterns.

### Stop conditions

Stop and report a blocker if:
- The user's own ratings cannot be reliably attributed to that user.
- Canonical dish/cuisine metadata is too inconsistent to support the proposed insight.
- Private diary records cannot be read securely by their owner.
- The system cannot separate the user's personal insights from public aggregates.
- The app's deletion/export policy does not account for derived personal data.
- A proposed insight would require inferring sensitive or unsupported attributes.
- There is no clear mechanism for the user to control visibility.

Do not invent a data source to fill gaps.

---

## 4. Scope

### 4.1 In scope

- Personal taste profile within the user's authenticated account.
- Summary of explicit high-rated cuisines and dishes where evidence is sufficient.
- Separate food activity summary.
- Rating patterns across approved rating dimensions.
- Time-based comparisons where evidence supports them.
- Evidence counts and confidence labels.
- Empty and low-data states.
- User controls to hide, reset, or exclude profile sections where feasible.
- Privacy-safe calculation and storage.
- Optional, explicit public sharing only if approved.
- Data export/deletion integration.
- Tests for ownership, privacy, correctness, and stale derived data.
- Mobile-first UI and accessibility.

### 4.2 Out of scope

Do not implement these in Phase 5:

- AI-generated personality descriptions.
- Health, nutrition, medical, or weight-related assessments.
- Religious, ethnic, cultural, political, or other sensitive trait inference.
- Allergy or dietary safety advice inferred from logs.
- Automatic claims such as vegetarian, vegan, halal, kosher, gluten-free, or similar unless the user explicitly sets a supported profile field and the product has a clear purpose and safeguards.
- Mood or emotional-state inference from food.
- Personality scoring or psychological labels.
- Public user leaderboards.
- Ranking users by number of experiences or ratings.
- AI recommendation feed.
- Automatic posting or social sharing of taste insights.
- A new social graph or messaging system.
- Use of public regional rankings as a proxy for personal preference.
- Purchase, location tracking, or external data enrichment not already approved.
- Complex machine-learning models when simple, transparent summaries are adequate.

---

## 5. Privacy and visibility model

Personal Taste Identity is derived from a user's own activity. It must be treated as personal data.

### 5.1 Default visibility

Default the personal taste profile to **private to the account owner**.

It must not automatically appear:
- on the public user profile;
- in search results;
- in public rankings;
- in other users' recommendations;
- in social cards;
- in public API responses;
- in metadata or share previews.

Do not assume that because a user made one food experience public, they consented to publish a derived summary of all their food activity.

### 5.2 Public sharing

Public sharing, if included in the first release, must be a separate, explicit opt-in.

The user must be able to understand:
- which taste insights will be visible;
- whether the content is based only on public experiences or on all of the user's activity;
- whether counts or examples will be shown;
- how to turn sharing off.

Recommended default for any shared summary:
- use only data that is already eligible for public display;
- exclude private, followers-only, draft, deleted, or restricted experiences;
- show no exact private activity counts;
- never reveal hidden restaurants or dishes through derived sections.

If the implementation cannot guarantee these boundaries, defer public sharing and keep the feature private.

### 5.3 Private activity and personal computation

The user's private/followers-only entries may be included in the owner's private taste computation only if:
- the owner is authenticated;
- the calculation is strictly scoped to that owner;
- the private result cannot be accessed by other users;
- derived data is not inserted into public aggregate tables;
- logs, caches, analytics, and error reporting do not leak the underlying private content.

Draft/unsubmitted records should not influence the profile by default. If draft inclusion is ever considered, it must be a clear, user-controlled option.

### 5.4 Blocks and social relationships

A user's personal taste profile must not disclose another user's private information. It should only summarize the account owner's own recorded data.

Do not derive a user's tastes from:
- friends' likes;
- people they follow;
- comments by others;
- private group activity;
- other users' private experiences.

---

## 6. Data sources and source-of-truth rules

Use only data that can be attributed reliably to the current user.

### 6.1 Eligible personal sources

Potential sources:
- the user's own submitted food experiences;
- restaurant-level ratings written by the user;
- dish-level ratings written by the user;
- canonical dishes linked to the user's own experiences;
- verified structured cuisine/category fields linked to those dishes/restaurants;
- explicit taste tags entered by the user, if already supported.

The final list must be mapped to the actual Phase 0–4 implementation.

### 6.2 Excluded sources

Do not use:
- other users' ratings as evidence of this user's preference;
- public regional ranking position as evidence of this user's preference;
- views, impressions, clicks, likes, or saves as proof that the user likes a food;
- inferred values from captions unless the product explicitly supports a structured, user-confirmed field;
- restaurant popularity as the user's preference;
- unverified cuisine labels or ambiguous dish aliases;
- private data belonging to another user.

### 6.3 Rating source integrity

- Use the user's actual submitted rating, not the public average.
- Use the exact rating dimension and scale approved in Phase 1.
- Exclude invalid, superseded, deleted, or unsubmitted rating values.
- An edited rating must replace the former value.
- A duplicate submission must not increase the user's count twice.
- Restaurant ratings and dish ratings must stay separate.
- A restaurant rating must not be treated as a dish rating.
- A dish rating must not be treated as a restaurant rating.

### 6.4 Metadata quality

Cuisine and category insights are only as accurate as the metadata.

Before presenting a cuisine preference:
- verify the canonical entity's cuisine/category field;
- define how multiple cuisine tags are handled;
- define whether a broad category can be used as evidence;
- avoid inferring cuisine from a dish or restaurant name alone;
- treat unknown or ambiguous metadata as unknown.

Do not present incomplete metadata as a definitive classification.

---

## 7. Personal taste insight model

Build a small number of transparent insight types first. Each insight needs a clear definition.

### 7.1 Highly rated cuisines

Definition candidate:
- calculate the user's average rating for eligible experiences or dish ratings mapped to a cuisine;
- use one clearly defined rating domain;
- display the number of ratings supporting the result;
- require a minimum evidence threshold.

Do not combine restaurant overall ratings and dish overall ratings into one cuisine score without a deliberate, approved methodology.

Recommended separation:
- cuisines the user rates highly at the dish level;
- cuisines associated with restaurants the user rates highly.

These are different signals and should not be merged casually.

Possible copy:
- “You tend to rate these cuisines highly”
- “Based on 8 dish ratings”

Do not say “Your favourite cuisine” unless the user explicitly confirms it or the evidence and product policy justify that label.

### 7.2 Highly rated dishes

Identify dishes the user has rated highly, subject to:
- minimum number of ratings or repeated experiences;
- canonical dish identity;
- no duplicate contribution;
- user rating rather than community average.

A single high rating should be described as one positive experience, not a stable favourite.

### 7.3 Frequently logged dishes and cuisines

This is an activity insight, not a preference insight.

Possible copy:
- “Most frequently logged”
- “You logged these dishes most often”

Do not label this section:
- “Your favourites”
- “You love”
- “Your top-rated foods”

unless the calculation is based on explicit ratings and meets the approved evidence threshold.

### 7.4 Rating patterns by dimension

Where user ratings support it, summarize:
- restaurant food quality ratings;
- restaurant value ratings;
- ambience/service/hygiene ratings;
- dish taste ratings;
- dish portion ratings;
- dish value ratings.

Rules:
- keep restaurant and dish dimensions distinct;
- use the user's own ratings;
- show the count for each dimension;
- do not compare dimensions as though they have identical meaning;
- do not infer a preference that the user never rated.

A user who consistently rates service highly may have encountered good service; that does not prove that service is their primary dining preference.

### 7.5 Taste tags and descriptors

Only use structured tags if:
- users explicitly selected them;
- the taxonomy is defined;
- the tag is not a sensitive or health claim;
- the user can review/edit/remove it.

Potential neutral examples:
- spicy;
- sweet;
- savoury;
- crispy;
- creamy;
- tangy.

Do not infer these descriptors automatically from dish names or photos.

### 7.6 Time-based changes

Possible comparisons:
- recent 90 days versus prior 90 days;
- current year versus previous year.

Only show a comparison when both periods contain enough relevant records.

Rules:
- compare equivalent periods;
- account for different activity volume;
- show sample counts;
- avoid causal language;
- do not state that a preference has changed because a category appears once in the recent period.

If evidence is inadequate, show no trend insight.

---

## 8. Evidence, confidence, and language

Every insight needs to expose enough evidence for the user to understand why it appears.

### 8.1 Evidence metadata

Each insight should internally carry:
- metric/insight type;
- source rating domain;
- number of contributing ratings or experiences;
- date range;
- metadata coverage;
- calculation version;
- computed timestamp;
- confidence/evidence state.

Only expose fields that are meaningful and safe for the user.

### 8.2 Evidence states

Use a small set of understandable states, for example:

- **Not enough data** — insufficient observations.
- **Early signal** — some evidence exists, but the pattern is not stable.
- **Consistent pattern** — enough repeated evidence to describe a tendency.
- **Confirmed by you** — the user explicitly marked the item or category as a favourite.

These labels need threshold definitions and product approval. Avoid an arbitrary “confidence percentage” that implies statistical precision the system cannot support.

### 8.3 Minimum evidence

Evaluate and approve thresholds for:
- cuisine averages;
- dish preference summaries;
- dimension patterns;
- time-based comparisons.

Thresholds may differ by insight type. For example, a cuisine average and a repeated favourite dish are not the same question.

Do not hide the evidence count when showing an insight.

### 8.4 Language rules

Prefer:
- “You rated these dishes highly”
- “You often log…”
- “Your recent entries suggest…”
- “Based on your last 12 eligible dish ratings”
- “Not enough ratings to identify a pattern yet”

Avoid:
- “You are a spicy-food person”
- “You hate…”
- “You always choose…”
- “Your personality is…”
- “You are definitely a…”
- “Your ideal diet is…”

The language should describe the data, not define the person.

---

## 9. Personal Taste page and information architecture

The page should be accessible from the authenticated user's own profile or diary area, using the repository's existing navigation conventions.

Recommended structure:

### 9.1 Page header

- Title: **Your Taste**
- Brief explanation: “A private summary of the food you log and rate.”
- Visibility indicator: Private.
- Last updated timestamp only if useful.
- Controls for privacy, reset, and data explanation.

Do not add another primary navigation destination unless the existing information architecture justifies it. Consider a section within the user's Profile or Diary first.

### 9.2 Taste snapshot

A compact summary of the strongest supported insights.

Possible modules:
- cuisines you rate highly;
- dishes you rate highly;
- rating patterns by dimension;
- food categories you log frequently.

Only show modules with sufficient data. Do not fill a grid with empty cards.

### 9.3 Your food activity

Keep activity separate from preferences.

Possible modules:
- experiences logged;
- dishes logged;
- unique restaurants/branches visited;
- activity over time;
- most frequently logged cuisines/dishes.

Use exact date ranges and avoid comparing partial periods as if they were complete.

### 9.4 Your rating patterns

Show:
- restaurant rating summary;
- dish rating summary;
- dimension breakdowns;
- evidence counts.

Do not combine the two rating domains.

### 9.5 Taste history

Optional timeline or period comparison:
- monthly/quarterly activity;
- rating trend for a selected metric, if enough observations;
- new categories/dishes tried.

Do not build a complex analytics dashboard. Prefer a few useful summaries over many charts.

### 9.6 Empty state

For a user with little or no data:
- explain that taste insights are generated from logged experiences and ratings;
- say what kind of activity will help build a profile;
- provide one clear action to log an experience;
- do not fabricate a sample taste identity.

Example:
“You haven't logged enough rated experiences for a useful taste profile yet. As you log meals and rate dishes, this page will start showing patterns.”

---

## 10. User controls

The user must remain in control of what the system derives and displays.

### 10.1 Visibility control

Private is the default.

If public sharing is supported:
- separate toggle;
- explanatory confirmation;
- preview of what will become visible;
- clear off switch;
- immediate removal from public surfaces after opt-out, subject to documented cache invalidation.

If public sharing cannot be implemented safely, do not ship it.

### 10.2 Exclude an entry

Evaluate whether a user should be able to exclude a particular experience from Personal Taste calculations without deleting it from the diary.

If implemented:
- exclusion affects only the personal taste profile;
- it does not silently delete the entry;
- it does not change public community aggregates unless the user also changes the entry's visibility or deletes it;
- the user can reverse the exclusion;
- excluded entries are not counted in insight denominators.

This is useful where a user logged a meal for recordkeeping but does not want it used to characterize their preferences.

### 10.3 Hide an insight

Allow the user to hide an insight/card from their own view, without changing source ratings. Distinguish hiding a display from excluding source data.

### 10.4 Reset derived taste profile

Provide a clear reset action if the implementation stores derived summaries.

Reset must:
- remove or invalidate derived personal insight data;
- not delete source food experiences or ratings;
- explain that insights may be recomputed from the same source data unless entries are excluded or the feature is disabled;
- require clear confirmation for destructive derived-data reset.

### 10.5 Disable personal taste processing

Evaluate a control to opt out of personal taste calculations entirely.

If provided:
- stop future personal profile computation;
- remove existing derived profile summaries;
- preserve the user's diary and ratings;
- do not alter public rating aggregates;
- document the effect on cached/queued calculations.

This is preferable to forcing every user to participate in personalization.

---

## 11. Calculation architecture

### 11.1 Source data versus derived data

Source of truth:
- the user's own submitted rating/experience records and explicitly selected structured fields.

Derived data:
- taste summaries;
- category preference scores;
- trend summaries;
- evidence states.

Derived data must be rebuildable or recomputable from eligible user-owned source records.

Do not overwrite source ratings with inferred preferences.

### 11.2 Calculation approach

Start with deterministic aggregation rather than machine learning.

For an insight, document:
- exact input records;
- metric;
- grouping key;
- excluded states;
- denominator;
- minimum evidence;
- rounding;
- time window;
- calculation version.

For an average rating:

\[
\text{user average} = \frac{\sum \text{the user's eligible ratings}}{\text{number of eligible ratings}}
\]

Do not weight the user's rating by the public regional ranking score.

### 11.3 Avoid exposure bias

A user may have logged 10 biryanis and 2 desserts simply because they had more opportunities to eat biryani.

Therefore:
- frequency is activity, not preference;
- average rating is a preference signal but may have a small sample;
- repeat visits can overrepresent one restaurant;
- categories with missing metadata may be undercounted.

Show these distinctions in the UI and methodology.

### 11.4 Repeated entities

Define how multiple experiences affect an insight.

Possible policies:
- each eligible user rating is one observation;
- repeated ratings of the same dish at different branches remain separate observations;
- repeated ratings of the same dish at the same branch may be subject to a documented duplicate/time-window policy.

Do not silently de-duplicate real distinct experiences, but do not let repeated edits/retries multiply an observation.

### 11.5 Personal versus public calculations

Maintain a hard boundary:
- personal taste insights are keyed and scoped to one user;
- public regional aggregates use the Phase 1 eligibility rule and source-of-truth records;
- personal preferences never write into public aggregates;
- public popularity never substitutes for personal preference.

If the same source rating contributes to both systems under their separate approved rules, those calculations must remain logically separate.

### 11.6 Storage strategy

Inspect scale and current schema before selecting:
- query-time calculation;
- cached user summary;
- derived per-user insight rows;
- scheduled refresh;
- event-triggered recalculation.

Choose the simplest safe option.

Requirements:
- user-scoped access control;
- idempotent refresh;
- calculation version;
- invalidation on source changes;
- no public read access by default;
- no cross-user query paths;
- cleanup on account deletion or opt-out.

Do not create a large personalization service for a small number of deterministic summaries.

---

## 12. Recalculation and lifecycle behavior

Define behavior after:

- new experience submission;
- new restaurant rating;
- new dish rating;
- rating edit;
- experience deletion/restoration;
- experience visibility change;
- canonical dish merge/alias correction;
- cuisine/category metadata correction;
- account data export;
- account deletion;
- personal taste opt-out;
- entry exclusion;
- algorithm/threshold change.

Rules:
- edit replaces the old contribution;
- deletion removes the contribution according to the account lifecycle policy;
- private visibility changes must not expose personal results publicly;
- derived summaries must not persist beyond the retention/deletion policy;
- retries must not double-count;
- failed refresh must not show a falsely current result;
- rebuilds must be safe and idempotent.

---

## 13. API and data contracts

Use the existing repository conventions. These are logical contracts, not mandatory route names.

### 13.1 Get personal taste profile

Input:
- authenticated session only;
- optional supported date range or section selector.

Output:
- current user's taste summary;
- evidence states and counts;
- activity summaries;
- last computation/version;
- visibility state;
- available user controls.

Never accept a client-supplied user ID as proof of identity.

### 13.2 Update preferences and controls

Input:
- authenticated session;
- explicit visibility/opt-out/exclusion changes;
- validation for each supported control.

Output:
- confirmed saved state;
- recalculation/invalidation status.

### 13.3 Recalculate personal profile

This should be server-controlled or triggered through approved application events.

Requirements:
- strict user scoping;
- idempotency;
- rate limiting;
- no arbitrary user ID access;
- safe background processing only if existing infrastructure supports it.

### 13.4 Data response rules

- Distinguish restaurant and dish rating domains.
- Use explicit count fields.
- Use nullable or omitted fields for insufficient data, not zero.
- Return the date range used.
- Include a calculation version internally.
- Do not return private source text to a public profile.
- Do not expose cross-user derived profiles.

---

## 14. Security and privacy tests

Test that:
- User A cannot read User B's taste profile.
- User A cannot trigger recalculation for User B.
- An unauthenticated client cannot access a personal profile.
- A client cannot submit arbitrary taste scores.
- Derived profile tables are not publicly readable.
- Public user profile routes do not expose private taste insights.
- Public sharing, if implemented, uses only the user's explicitly approved data scope.
- Turning off public sharing removes visibility from public surfaces.
- Private source entries can contribute only to the owner's private profile.
- Other users' ratings or private experiences never influence this user's profile.
- Account deletion removes derived personal data according to policy.
- Opt-out stops future calculation.
- Excluded entries do not contribute.
- Hidden cards remain hidden without altering source data.
- Analytics/error logs do not contain private diary content.

Do not weaken RLS or server authorization to make profile queries easier.

---

## 15. UX, visual design, and accessibility

### 15.1 Visual principles

- Personal, not clinical.
- Insightful, not judgmental.
- Evidence-led, not mystical.
- Simple enough to scan.
- Clear separation between taste patterns and activity counts.
- No giant dashboard of low-value charts.
- Do not use a pseudo-scientific “taste score” unless there is a clearly defined and justified metric. Prefer descriptive patterns over one composite number.

### 15.2 Responsive behavior

- Mobile-first layout.
- Compact taste snapshot.
- Clear labels and evidence counts.
- Avoid horizontally scrolling data tables.
- Charts must have text equivalents.
- Controls should remain discoverable.
- Use accessible touch targets.
- Avoid layout shifts from late-loading content.

### 15.3 Accessibility

- Correct heading hierarchy.
- Meaningful names for insight cards.
- Rating values announced as text.
- Evidence states not conveyed by color alone.
- Keyboard-accessible controls.
- Visible focus indicators.
- Screen reader announcements for updates/errors.
- Reduced-motion support.
- Text alternatives for charts and trends.

---

## 16. Analytics and product learning

Track only events needed to understand feature usefulness.

Suggested events:
- `taste_profile_opened`
- `taste_insight_viewed`
- `taste_insight_hidden`
- `taste_entry_excluded`
- `taste_profile_opted_out`
- `taste_profile_shared` (only if sharing is approved)
- `taste_profile_reset`
- `taste_log_experience_started`

Do not send:
- raw review text;
- private dish names if not necessary;
- sensitive user attributes;
- private profile summaries;
- exact personal taste scores to third-party analytics.

Measure:
- how often users open the feature;
- which insight types are useful;
- whether users hide or correct insights;
- opt-out rate;
- data sufficiency by insight type;
- calculation failures and freshness.

Do not treat time spent on the page as proof that the insights are accurate.

---

## 17. Implementation workstreams

### Workstream A — Personal data audit

1. Read accepted Phase 0–4 documentation.
2. Trace user-owned experience and rating records.
3. Verify owner scoping and privacy behavior.
4. Inspect cuisine/category metadata quality.
5. Inspect deletion/export policies.
6. Identify whether personal insights can be calculated without new schema.
7. Document gaps and risks.

**Deliverable:** `docs/phase-5/PERSONAL_DATA_READINESS.md`

### Workstream B — Insight definitions

1. Define activity versus preference signals.
2. Define each insight and exact formula.
3. Define which rating domains it uses.
4. Define minimum evidence thresholds.
5. Define metadata coverage requirements.
6. Define language and evidence labels.
7. Evaluate bias and exposure limitations.
8. Obtain approval for all thresholds and insight copy.

**Deliverable:** `docs/phase-5/TASTE_INSIGHT_METHODOLOGY.md`

### Workstream C — Privacy and controls

1. Define private-by-default behavior.
2. Define public sharing only if approved.
3. Define entry exclusion and hidden insight behavior.
4. Define opt-out and reset behavior.
5. Define derived-data deletion lifecycle.
6. Define user-facing explanations and confirmation steps.
7. Verify security model.

**Deliverable:** `docs/phase-5/PRIVACY_AND_USER_CONTROLS.md`

### Workstream D — Calculation architecture

1. Define source data and derived data.
2. Choose query-time/cached/derived-row approach based on evidence.
3. Define user scoping and calculation versioning.
4. Define refresh triggers and idempotency.
5. Define failure and stale-result behavior.
6. Add test fixtures.
7. Avoid machine learning unless a separate approved need exists.

**Deliverable:** `docs/phase-5/PERSONAL_TASTE_ARCHITECTURE.md`

### Workstream E — Backend and APIs

1. Implement user-scoped data access.
2. Implement approved insight calculations.
3. Implement activity summaries separately.
4. Implement visibility/opt-out/exclusion controls.
5. Implement recalculation/invalidation.
6. Integrate deletion/export behavior.
7. Add security and correctness tests.

**Deliverable:** typed, tested personal taste service/API.

### Workstream F — Personal Taste UI

1. Add entry point in existing profile/diary structure.
2. Build private taste snapshot.
3. Build separate activity summary.
4. Build rating pattern sections.
5. Build evidence and insufficient-data states.
6. Add privacy and control UI.
7. Add optional trend section only if supported.
8. Make it responsive and accessible.

**Deliverable:** complete private Personal Taste experience.

### Workstream G — QA and validation

1. Test mathematical correctness.
2. Test minimum evidence and sparse data.
3. Test privacy and cross-user access.
4. Test source record lifecycle changes.
5. Test opt-out/reset/exclusion.
6. Test account deletion and export integration.
7. Test mobile and accessibility.
8. Run diary, profile, rating, and social regressions.
9. Validate copy against actual evidence.

**Deliverable:** `docs/phase-5/TEST_REPORT.md` and evidence.

---

## 18. Priority order

### P0 — Required

1. Verified user ownership of source ratings and experiences.
2. Personal/private calculation boundary.
3. Separate activity from preference.
4. Explicit definitions for each shipped insight.
5. Minimum evidence and data quality rules.
6. Accurate restaurant/dish rating separation.
7. Private-by-default user interface.
8. User-scoped access control.
9. Correct recalculation after edits/deletion/metadata changes.
10. Clear insufficient-data states.
11. User control for opt-out or equivalent privacy choice.
12. Tests for ownership, privacy, correctness, and lifecycle.

### P1 — Add if the data supports it

1. Cuisine preference summaries.
2. Highly rated dish patterns.
3. Restaurant/dish dimension summaries.
4. Time-based comparisons.
5. Entry exclusion controls.
6. Hidden insight controls.
7. Optional explicit public sharing.
8. Taste tags selected by the user.

### Explicitly defer

- AI-generated taste descriptions.
- Personality profiling.
- Health/diet/medical inference.
- Personalized recommendation feed.
- Predictive food suggestions.
- Social taste comparisons.
- Public taste leaderboards.
- A single composite taste score.

---

## 19. Test matrix

| Area | Required cases |
|---|---|
| Ownership | Authenticated owner, unauthenticated access, cross-user access attempt |
| Rating domains | Restaurant ratings, dish ratings, missing dimensions, mixed experience |
| Activity vs preference | Frequently logged but low-rated dish; rarely logged but highly rated dish |
| Evidence | Zero records, one record, below threshold, at threshold, above threshold |
| Metadata | Missing cuisine, multiple cuisines, alias, merged dish, ambiguous category |
| Privacy | Private, followers-only, public, draft, deleted, restricted according to policy |
| Lifecycle | Create, edit, delete, restore, visibility change, metadata correction |
| Exposure | Repeated visits, one restaurant dominating, uneven category sample |
| Time analysis | Complete periods, partial periods, sparse period, no comparison |
| Controls | Hide insight, exclude entry, undo exclusion, opt out, reset, sharing off |
| Security | Client-supplied score, arbitrary user ID, direct derived table access |
| Deletion/export | Derived data included in export policy and removed on account deletion |
| Reliability | Recalculation retry, concurrent changes, stale summary, failed refresh |
| UI | Empty, partial, sufficient evidence, error, loading, private indicator |
| Regression | Diary, ratings, profile, logging, collections, search, regional rankings |

Use realistic fixtures. Do not copy production personal food histories into test data.

---

## 20. Required documentation and evidence

Follow repository conventions. Suggested files:

| File | Required content |
|---|---|
| `docs/phase-5/PERSONAL_DATA_READINESS.md` | Data sources, user ownership, metadata coverage, privacy risks |
| `docs/phase-5/TASTE_INSIGHT_METHODOLOGY.md` | Definitions, formulas, thresholds, sample rules, language |
| `docs/phase-5/PRIVACY_AND_USER_CONTROLS.md` | Private default, sharing, exclusion, reset, opt-out |
| `docs/phase-5/PERSONAL_TASTE_ARCHITECTURE.md` | Calculation, storage, versioning, refresh, deletion |
| `docs/phase-5/API_CONTRACTS.md` | User-scoped requests/responses and control actions |
| `docs/phase-5/UX_SPEC.md` | Page structure, evidence labels, empty/partial states |
| `docs/phase-5/TEST_REPORT.md` | Correctness, privacy, lifecycle, regression results |
| `docs/phase-5/OPEN_DECISIONS.md` | Owner decisions and unresolved issues |

Store safe evidence under `docs/evidence/phase-5/`:
- anonymized/illustrative calculation fixtures;
- evidence-threshold evaluation;
- privacy and authorization test output;
- calculation reconciliation output;
- screenshots of empty and populated states;
- accessibility findings;
- performance and freshness measurements.

Do not commit private diary text, production user records, tokens, credentials, or sensitive personal information.

---

## 21. Decisions requiring explicit approval

| Decision ID | Question |
|---|---|
| P5-D01 | Is Personal Taste private-only for the initial release? |
| P5-D02 | Which source records contribute to private insights? |
| P5-D03 | Are private/followers-only entries included in the owner's private calculation? |
| P5-D04 | Are drafts excluded? (Recommended: yes.) |
| P5-D05 | Which insight types ship first? |
| P5-D06 | What minimum evidence is required for each insight? |
| P5-D07 | Which rating domains are used for cuisine summaries? |
| P5-D08 | How are multiple cuisine tags handled? |
| P5-D09 | Is per-entry exclusion supported? |
| P5-D10 | Is full personal taste processing opt-out supported? |
| P5-D11 | How do derived data and summaries participate in export/deletion? |
| P5-D12 | Is public sharing deferred? (Recommended unless it can be safely isolated.) |
| P5-D13 | Which time window, if any, is used for trend comparisons? |
| P5-D14 | What calculation refresh latency is acceptable? |

For every decision include:
- current evidence;
- options;
- recommendation;
- privacy and product consequences;
- technical impact;
- whether it blocks implementation;
- approval status.

Antigravity may recommend. It must not silently turn an experimental insight into a permanent user-facing claim.

---

## 22. Definition of Done

Phase 5 is complete only when:

- [ ] Phases 0–4 have been accepted.
- [ ] Source records are reliably scoped to the authenticated user.
- [ ] Personal taste calculations are separate from public aggregates and regional rankings.
- [ ] Activity metrics and preference metrics are clearly distinguished.
- [ ] Each insight has a documented formula, source, denominator, and threshold.
- [ ] Restaurant and dish rating domains remain separate.
- [ ] Unknown or poor-quality metadata is not presented as fact.
- [ ] Evidence counts and insufficient-data states are visible.
- [ ] Language describes observed data without defining the user's personality.
- [ ] Private is the default visibility.
- [ ] No cross-user access or public leakage is possible.
- [ ] User control for opt-out or equivalent is implemented.
- [ ] Deletion, edits, exclusions, and metadata changes refresh derived data correctly.
- [ ] Derived data follows the account deletion/export policy.
- [ ] UI is responsive and accessible.
- [ ] Correctness, privacy, lifecycle, and regression tests pass, or failures are accurately documented.
- [ ] Required documentation and evidence are committed.
- [ ] All release-blocking decisions are approved.

If any P0 criterion is false, report **PARTIALLY COMPLETE** or **BLOCKED**, not complete.

---

## 23. Required final report from Antigravity

Return:

1. **Verdict:** COMPLETE / PARTIALLY COMPLETE / BLOCKED.
2. **Before-state:** existing user profile, diary, and rating data available.
3. **Insight types shipped:** exact definitions and source fields.
4. **Evidence policy:** thresholds, counts, data quality, and limitations.
5. **Activity versus preference:** how the UI separates the two.
6. **Privacy:** default visibility and proof of cross-user isolation.
7. **Controls:** opt-out, exclusion, hide, reset, and public sharing status.
8. **Calculation:** source of truth, cache/derived model, versioning, refresh.
9. **Lifecycle:** behavior on edits, deletion, metadata changes, and account deletion.
10. **UI:** screenshots/states and responsive/accessibility checks.
11. **Tests:** exact commands and pass/fail counts.
12. **Performance:** calculation latency and known scaling limits.
13. **Files changed:** code, tests, migrations, and docs.
14. **Deferred items:** AI, recommendations, sharing, or any other excluded work.
15. **Phase 6 readiness:** whether social features can safely expose or interact with the taste profile under explicit user controls.

Do not claim that the system understands a user's taste simply because it generated a summary. Report the amount and quality of evidence behind every insight.

---

## 24. Antigravity execution prompt

> Execute MORS Phase 5 — Personal Taste Identity using this brief and the accepted Phase 0 through Phase 4 deliverables.
>
> Begin by reading repository instructions and inspecting the actual user-owned experience/rating data, profile and diary routes, rating semantics, cuisine/dish metadata quality, privacy policies, account deletion/export behavior, and existing tests. Do not assume that fields or features described in the brief already exist.
>
> Build a private, evidence-based taste summary from the authenticated user's own food activity. Keep food activity separate from food preference: frequently logged does not mean favourite. Use the user's explicit ratings, not public averages, regional ranking scores, likes, views, or other users' activity as a substitute for personal preference.
>
> Keep restaurant ratings and dish ratings separate. Define each insight, source, grouping, denominator, minimum evidence, date range, and calculation version. Use deterministic and explainable calculations first. Do not introduce machine learning or a single composite taste score.
>
> Treat the profile as private by default. Do not publish derived insights to the public user profile, search, rankings, social cards, metadata, or public APIs. If public sharing is proposed, implement it only after explicit approval and ensure the user sees exactly what will be shared. If privacy boundaries are uncertain, defer sharing.
>
> Do not infer health, medical, nutrition, allergy, religious, ethnic, cultural, political, personality, or other sensitive attributes. Do not infer dietary suitability or ingredients from dish names, pictures, or captions. Describe only observed food logging and explicit rating patterns.
>
> Include clear evidence counts and insufficient-data states. Use cautious wording such as “you rated these dishes highly” rather than defining what kind of person the user is. Never equate frequency with preference.
>
> Provide user control for opt-out or an equivalent privacy choice. If implementing entry exclusion, hide, or reset, explain their distinct effects. Preserve source diary entries and ratings when clearing derived data. Ensure account deletion/export and source edits correctly update or remove derived summaries.
>
> Keep all calculation and read paths strictly scoped to the authenticated owner. Do not trust client-supplied user IDs or scores. Do not expose derived personal tables publicly. Add tests for cross-user access, private entries, lifecycle changes, low sample sizes, metadata gaps, and opt-out.
>
> Keep the UI within the existing MORS design and navigation patterns. Do not create a large dashboard or add a new primary navigation destination without a clear product reason. Make it mobile-first, accessible, and honest about sparse data.
>
> Keep changes within Phase 5. Do not add AI personality descriptions, health/diet inference, social leaderboards, or a recommendation feed. Stop and report if a privacy, data, or product decision is unresolved.
>
> Finish with the required final report and state whether Phase 6 can safely begin.

---

## 25. Phase 6 handoff — Social Experience Upgrade

Phase 6 may begin when:
- personal taste insights have clear private/public boundaries;
- profile visibility controls are reliable;
- the user's own ratings and experiences are consistently queryable;
- public experience and interaction rules are stable;
- derived personal insights do not leak through social surfaces;
- account privacy, block, mute, and deletion behavior is understood.

Phase 6 can then improve how people share and interact around food experiences. It must not automatically publish personal taste insights or weaken the privacy controls established in Phase 5.
