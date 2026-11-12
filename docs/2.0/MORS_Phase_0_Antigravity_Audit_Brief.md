# MORS 2.0 --- Phase 0: Product Specification & Repository Reality Audit

**Document type:** Antigravity implementation brief\
**Phase:** 0\
**Priority:** P0 --- Mandatory prerequisite\
**Status:** Ready for audit execution\
**Repository:** `https://github.com/kandimukeshnaidu-ops/MORS`\
**Product scope:** Telangana-first food discovery and social food
journal\
**Execution rule:** Audit and documentation only. Do not modify
application code, database schema, migrations, production data, or
existing behaviour.

------------------------------------------------------------------------

## 1. Mission

Perform a rigorous product and technical audit of the existing MORS
repository before any MORS 2.0 feature implementation begins.

MORS is evolving from a social food journal into a **social food
journal + community-powered restaurant and dish discovery platform**.

The purpose of Phase 0 is not to build the new features. It is to
establish, with verifiable evidence:

1.  What currently exists in the repository.
2.  What actually works end-to-end.
3.  What is incomplete, broken, duplicated, or only documented.
4.  Which existing components and database structures can be reused.
5.  What must change to support the MORS 2.0 product direction.
6.  What architectural, data-integrity, privacy, performance, and UX
    risks must be resolved before implementation.
7.  The exact implementation sequence and acceptance criteria for Phases
    1--7.

**Do not assume that an item is implemented because it appears in a
README, phase document, feature registry, migration name, or previous
audit. Verify it in source code and tests.**

The output must be a repository-grounded audit that another developer or
AI coding agent can use without guessing.

------------------------------------------------------------------------

## 2. Product direction: source of truth for this audit

### 2.1 MORS 2.0 product definition

MORS is a community-powered platform where people can:

-   Record their food experiences and preserve a personal food diary.
-   Review restaurants and individual dishes.
-   Discover highly rated dishes and restaurants.
-   Compare restaurants using multiple rating dimensions.
-   Explore food rankings within a selected geographical region.
-   Follow people and discover food through their reviews.
-   Build a taste profile from their actual food ratings and
    experiences.

MORS is **not** intended to become a food delivery, restaurant booking,
calorie tracking, or messaging platform.

### 2.2 Core product questions

The product must answer two questions exceptionally well:

1.  **Where should I eat?**
2.  **What should I order there?**

The existing diary and social experience remain important. Discovery
must extend the existing product, not erase its identity.

### 2.3 Initial geographical scope

The first discovery/ranking release is limited to **Telangana**.

The product architecture should not unnecessarily prevent future
expansion, but Phase 0 must not plan or implement nationwide rollout as
part of the immediate release.

Potential location scopes to investigate:

-   Nearby / selected radius.
-   City or locality.
-   Telangana state.

India-wide discovery is a future expansion, not a Phase 0 implementation
requirement.

### 2.4 Product principles

-   Ratings must represent real user submissions.
-   Restaurant ratings and dish ratings must be independent.
-   Rating count and confidence matter; a tiny sample must not
    automatically outrank a well-supported rating.
-   Private, draft, followers-only, blocked, or otherwise non-public
    experiences must not influence public rankings or aggregates.
-   No fabricated reviews, restaurants, dishes, users, ratings, or taste
    claims.
-   No dead buttons or decorative controls pretending to work.
-   Advanced filters should be optional; basic discovery must remain
    simple.
-   Do not add AI recommendations, DMs, gamification, ads, booking, or
    delivery in this release.

------------------------------------------------------------------------

## 3. Strict execution boundaries

### 3.1 Allowed work

Antigravity may:

-   Inspect repository files and Git history.
-   Inspect application routes, components, server actions, RPC calls,
    SQL migrations, database types, tests, CI workflows, and
    configuration.
-   Run safe local static checks and tests where the environment
    supports them.
-   Inspect local database schema or local development fixtures without
    destructive reset.
-   Create or update audit documentation.
-   Create evidence notes and audit-specific tests that do not alter
    product behaviour.
-   Produce diagrams, tables, dependency maps, and implementation
    recommendations.

### 3.2 Files that may be changed

Follow the repository's `AGENTS.md` audit/change-control rules.

Audit work may modify only:

-   `docs/audit/`
-   `docs/evidence/`
-   `tests/audit/`

If these directories do not exist, create them.

The primary deliverable must be:

`docs/audit/MORS_2_PRODUCT_GAP_AUDIT.md`

Suggested supporting deliverables:

-   `docs/audit/MORS_2_DATA_MODEL_AUDIT.md`
-   `docs/audit/MORS_2_UX_AUDIT.md`
-   `docs/audit/MORS_2_IMPLEMENTATION_SEQUENCE.md`
-   `docs/evidence/phase-0/`
-   `tests/audit/` only where non-invasive audit tests are useful.

Do not create all supporting files merely for appearance. Create them
only if they contain substantive evidence or analysis.

### 3.3 Prohibited actions

**Do not:**

-   Implement any MORS 2.0 feature.
-   Change existing application components or styles.
-   Modify existing SQL migrations.
-   Create or apply product schema migrations.
-   Run `supabase db reset --linked`.
-   Run `supabase db push` against a remote project.
-   Modify production Supabase data or configuration.
-   Change RLS policies or security functions.
-   Change environment variables or secrets.
-   Rewrite existing documentation outside the permitted audit
    directories.
-   Remove existing features or navigation.
-   Install new dependencies.
-   Refactor code while auditing.
-   Claim a test passed unless it was actually run and its result
    recorded.
-   Treat a passing unit test as proof of end-to-end functionality.

If a defect is found, document it with severity and evidence. Do not fix
it in Phase 0.

### 3.4 Handling unavailable environments

If credentials, Supabase local services, browser access, or required
environment variables are unavailable:

-   Continue with the checks that can safely be performed.
-   Mark the affected verification as **UNVERIFIED --- environment
    unavailable**.
-   State exactly what access or test is missing.
-   Do not infer a successful result.
-   Do not ask for or print secrets in audit output.

------------------------------------------------------------------------

## 4. Required repository orientation

Before drawing conclusions, inspect the repository's current
instructions and architecture.

Read at minimum:

-   `AGENTS.md`
-   `README.md` (if present)
-   `docs/PRODUCT_CONTEXT.md` (if present)
-   `docs/IMPLEMENTATION_PLAN.md`
-   `docs/PHASES.md`
-   `docs/PHASES_POST_BETA.md` (if present)
-   `docs/PHASES_NEXT.md` (if present)
-   `docs/DECISIONS.md`
-   `docs/FEATURE_REGISTRY.md`
-   `docs/AUDIT.md`
-   `package.json`
-   Workspace/package manifests.
-   CI workflow files.
-   Supabase configuration.
-   Relevant database migrations and tests.

Do not assume every path exists. Record missing files.

### 4.1 Resolve conflicting specifications

The repository's older product rules may describe MORS only as a social
food journal and may explicitly exclude restaurant-review functionality.
MORS 2.0 changes that product direction.

Do not silently ignore or overwrite these rules.

In the audit report:

1.  Quote or summarise the conflicting rule.
2.  Identify which MORS 2.0 requirement conflicts with it.
3.  Explain the impact on implementation.
4.  Recommend the exact documentation or decision that must be updated.
5.  Mark it as an open product/architecture decision until approved.

The MORS 2.0 product direction in this document is the intended target
for the audit. Existing repository instructions continue to govern safe
engineering practices, privacy, security, testing, and change control
unless explicitly superseded by an approved decision.

------------------------------------------------------------------------

## 5. Audit status vocabulary

Use these exact statuses throughout the report.

  -----------------------------------------------------------------------
  Status                              Meaning
  ----------------------------------- -----------------------------------
  `VERIFIED COMPLETE`                 Source, persistence, side effects,
                                      tests, and relevant end-to-end
                                      behaviour provide sufficient
                                      evidence.

  `PARTIALLY IMPLEMENTED`             Some functionality exists, but one
                                      or more required behaviours are
                                      missing or incomplete.

  `BROKEN`                            A reproducible defect prevents the
                                      expected behaviour.

  `DOCUMENTED ONLY`                   Mentioned in documentation or
                                      registry, but no adequate
                                      implementation evidence exists.

  `UNVERIFIED`                        Evidence is insufficient or the
                                      required environment/test is
                                      unavailable.

  `NOT IMPLEMENTED`                   No implementation was found after a
                                      reasonable repository search.

  `NOT APPLICABLE`                    The requirement does not apply to
                                      the current product scope.
  -----------------------------------------------------------------------

Do not use a simple checkbox as proof of completion.

For every important claim, include:

-   Repository path.
-   Relevant symbol, route, function, migration, or test name.
-   Line numbers or a concise code reference where available.
-   Test command and result, if run.
-   Remaining uncertainty.

------------------------------------------------------------------------

## 6. Audit workstream A --- Existing product functionality

Inspect the following areas. Identify the route, frontend components,
server-side logic, database structures, tests, and actual user-visible
behaviour.

### A1. Authentication and account lifecycle

Inspect:

-   Registration and login.
-   Session persistence and refresh.
-   OAuth providers, if present.
-   Onboarding.
-   Profile editing.
-   Public/private profile settings.
-   Account deletion and grace period.
-   Data export.
-   Invite or beta access controls.

Questions:

-   Can a user register, log in, refresh, and remain authenticated?
-   Are protected routes protected on the server?
-   Does logout invalidate the session?
-   Do profile changes persist after refresh?
-   Is account deletion complete across relational rows and storage?
-   Are private profiles handled consistently?

### A2. Food logging and experiences

Inspect:

-   Quick Log.
-   Multi-dish entries.
-   Restaurant/place selection.
-   Home-cooked entries without a place.
-   Overall experience rating.
-   Individual dish rating.
-   Written descriptions.
-   Photos and upload pipeline.
-   Drafts, editing, deletion, and log-again.
-   Idempotency and duplicate submission prevention.

Questions:

-   Is one experience capable of containing multiple dishes?
-   Can an experience exist without a restaurant?
-   Is the dish rating attached to the correct dish/experience
    relationship?
-   What exactly does the existing overall rating represent?
-   Does editing or deleting an experience update every relevant
    aggregate?
-   Do uploaded photos persist and remain private when required?

### A3. Diary and personal archive

Inspect:

-   Timeline.
-   Calendar.
-   Date handling and timezone.
-   Category/rating/date filters.
-   Pagination.
-   Empty and error states.

Questions:

-   Are diary dates based on the user's local date rather than UTC
    boundaries?
-   Do filters work together?
-   Does pagination avoid duplicates or skipped entries?
-   Does the diary include all entries the owner is entitled to see?

### A4. Restaurants / places

Inspect:

-   Place creation and selection.
-   Place canonicalisation.
-   Place aliases and duplicate handling.
-   Place detail route.
-   Place community rating.
-   Place statistics.
-   City/location fields.
-   Place visibility and moderation.
-   Any branch/parent place model.

Questions:

-   Is a place record guaranteed to represent a restaurant, or can it
    represent other venue types?
-   Can one restaurant have multiple branches?
-   Is the rating calculated from overall experience ratings, dish
    ratings, or another value?
-   Is the current average based only on eligible public experiences?
-   Are duplicate restaurants possible?
-   Can a place be discovered without leaking private activity?

### A5. Dishes

Inspect:

-   Canonical dish creation.
-   Aliases and multilingual names.
-   Duplicate detection and merge logic.
-   Dish detail route.
-   Dish ratings and aggregates.
-   Restaurant associations.
-   Search indexing.
-   Dish visibility rules.

Questions:

-   Can the same dish be linked to many restaurants?
-   Is a dish rating independent of the restaurant rating?
-   Does the system distinguish a canonical dish from a
    restaurant-specific preparation or variant?
-   Can users search aliases without creating duplicate canonical
    records?
-   What happens to historical entries after a dish merge?

### A6. Search and Explore

Inspect:

-   Search route and components.
-   Search RPCs.
-   Search types/tabs.
-   Full-text and trigram matching.
-   City filtering.
-   Explore route and content.
-   Trending calculations, if present.
-   Search pagination and performance.

Questions:

-   Can users search users, dishes, places, experiences, and
    collections?
-   Does the interface distinguish food search from restaurant search?
-   Can a search result be opened reliably?
-   Are private experiences excluded from global search?
-   Does Explore duplicate Search's responsibility?
-   Are any search controls decorative or non-functional?

### A7. Social features

Inspect:

-   Follow/unfollow.
-   Private account follow requests.
-   Followers/following lists.
-   Blocking.
-   Home feed.
-   Likes.
-   Comments.
-   Notifications.
-   Reporting and moderation.

Questions:

-   Does the feed show the correct followed users' content?
-   Does unfollow remove content as expected?
-   Are blocked users hidden in both directions?
-   Do likes and comments persist?
-   Are notifications filtered when their target content becomes
    private?
-   Is the feed chronological or algorithmic?
-   Is the existing interaction model suitable for review-centric
    discovery?

### A8. Collections and Saved

Inspect:

-   Collection creation and editing.
-   Public/private/unlisted visibility.
-   Adding experiences, dishes, and places.
-   Saved system collection.
-   Reordering.
-   Sharing.
-   Likes and counts.

Questions:

-   Can users save both a restaurant and a dish?
-   Are unavailable/private items hidden correctly?
-   Are collection counts viewer-safe?
-   Does reorder persist after refresh?

### A9. Taste statistics and profile

Inspect:

-   Public and owner-only statistics.
-   Cuisine counts.
-   Dish counts.
-   Rating distributions.
-   Favourite foods.
-   Taste identity.
-   Recommendation code, if any.

Questions:

-   Which statistics are based on logs versus ratings?
-   Are public statistics calculated from the public pool?
-   Are minimum sample thresholds applied?
-   Does the current taste identity make claims that the data cannot
    support?

### A10. Reliability and UX

Inspect every major route for:

-   Loading state.
-   Empty state.
-   Error state.
-   Success feedback.
-   Retry behaviour.
-   Responsive behaviour.
-   Accessibility.
-   Image layout stability.
-   Navigation consistency.
-   Broken links or dead controls.

The earlier MORS feedback mentioned a rendering/buffering problem.
Specifically inspect whether the loading lifecycle can remain stuck,
whether route transitions resolve, and whether failed requests provide a
recoverable error state. Do not assume a previous fix is still valid.

------------------------------------------------------------------------

## 7. Audit workstream B --- Database and domain architecture

This workstream is mandatory because MORS 2.0 introduces independent
restaurant and dish ratings and regional ranking.

### B1. Build a current schema inventory

List relevant tables, views, materialized views, enums, triggers,
indexes, RPCs, and policies.

At minimum investigate:

-   `profiles`
-   `food_experiences`
-   `experience_dishes`
-   `places`
-   `dishes`
-   `dish_aliases`
-   `place_public_stats`
-   `dish_public_stats`
-   `follows`
-   `blocks`
-   `experience_likes`
-   `experience_comments`
-   `notifications`
-   `collections`
-   `collection_items`
-   `reports`
-   User-stat tables/views.

Use actual repository names. If names differ, record the actual names
and map them to the conceptual role.

For every relevant table record:

  Field             Required information
  ----------------- -----------------------------------
  Name              Exact database object name
  Purpose           What it represents
  Primary key       Exact key
  Foreign keys      Relationships
  Rating fields     If any
  Location fields   If any
  Visibility        RLS and public-pool behaviour
  Aggregation       Trigger/view/RPC
  Indexes           Relevant indexes
  Tests             Existing database test references

### B2. Trace rating calculations

Trace every rating from the UI to persistence and then to community
statistics.

Document:

1.  Input control and allowed values.
2.  Validation schema.
3.  Server Action or RPC.
4.  Database column or relationship.
5.  Trigger/function side effects.
6.  Aggregate table/view.
7.  Detail page display.
8.  Search or ranking usage.
9.  Edit/delete/visibility-change behaviour.

Do not infer rating semantics from a field name alone.

Explicitly answer:

-   Is the current overall rating a restaurant rating, meal rating, or
    general experience rating?
-   Is a dish rating stored per canonical dish, per experience-dish
    association, or elsewhere?
-   Can one visit contribute to more than one dish?
-   Are restaurant and dish averages independent?
-   Can the same user submit multiple ratings for the same entity
    through separate visits?
-   Is there a current one-user-one-entity restriction?
-   How are deleted, hidden, draft, and private entries handled?

### B3. Proposed MORS 2.0 conceptual model

Evaluate this intended relationship without implementing it:

``` text
User
  |
  v
Food Experience / Restaurant Visit
  |-- written experience review
  |-- overall experience rating
  |-- optional restaurant rating dimensions
  |     |-- food quality
  |     |-- value for money
  |     |-- ambience
  |     |-- service
  |     |-- hygiene
  |
  |-- Experience Dish A
  |     |-- independent dish rating
  |     |-- optional taste / portion / value ratings
  |     |-- optional dish note
  |
  |-- Experience Dish B
  |     |-- independent dish rating
  |     |-- optional taste / portion / value ratings
  |     |-- optional dish note
  |
  |-- photos
  |-- place reference (optional)
  |-- visibility and publication state
```

This is a product concept, not a mandated final schema.

The audit must recommend whether the existing model can support it with
minimal extension or whether a normalized rating model is justified.

Consider these alternatives:

-   Dedicated nullable columns for a fixed set of rating dimensions.
-   A normalized rating-dimension/value table.
-   A hybrid model with fixed core dimensions and extensible optional
    dimensions.

Evaluate:

-   Query simplicity.
-   Aggregate performance.
-   Validation.
-   Historical data migration.
-   Type safety.
-   Reporting.
-   RLS complexity.
-   Future rating-dimension changes.

Do not choose a design solely because it is more flexible. Prefer the
simplest model that meets the real product requirements.

### B4. Restaurant identity and branches

Investigate whether the current `places` model supports:

-   A restaurant brand or parent entity.
-   Individual branches/locations.
-   Branch-specific ratings.
-   Restaurant-wide identity.
-   Duplicate detection and merging.

The product must avoid mixing ratings for different branches when
location-specific differences materially affect the experience.

Recommend a model and clearly distinguish:

-   Restaurant brand.
-   Physical branch.
-   User's visit to a branch.
-   Canonical dish.
-   Restaurant-specific dish/menu item.

Do not assume that a menu item and a canonical dish are interchangeable.

### B5. Rating aggregate integrity

Inspect whether community aggregates are:

-   Trigger-maintained or dynamically calculated.
-   Recomputed after edits and deletes.
-   Updated after visibility/profile changes.
-   Based on the correct public pool.
-   Protected from double counting.
-   Consistent with the source rows.

Recommend how separate aggregates should be maintained for:

-   Restaurant overall rating.
-   Restaurant dimension ratings.
-   Dish overall rating.
-   Dish dimension ratings.
-   Number of eligible ratings per dimension.

A missing rating dimension must not silently become zero or be treated
as a negative rating.

### B6. Historical data migration

Assess how current records can be interpreted under the new model.

Do not automatically convert an existing experience rating into a
restaurant rating or a dish rating.

For each existing rating type, recommend one of:

-   Preserve as overall experience rating only.
-   Preserve as dish rating if its semantics are verified.
-   Map to a new field only if the old meaning is equivalent.
-   Leave new dimension values null.
-   Require users to provide new ratings on future visits.

Provide a migration/backfill strategy and identify data that cannot be
safely inferred.

------------------------------------------------------------------------

## 8. Audit workstream C --- Find product and search architecture

### C1. Intended Find experience

The proposed primary navigation is:

-   Home
-   Find
-   Diary
-   Collections
-   Profile

Notifications should remain accessible in the header.

The Log Experience action must remain prominent and easy to reach.

Explore may become a section or mode inside Find rather than a competing
primary destination. Verify the current navigation before recommending
removal or relocation.

### C2. Find landing page

The Find landing page should provide two clearly differentiated modes:

**Find Food**

-   Search canonical dishes.
-   Search dish aliases.
-   Browse cuisines and categories.
-   Discover top-rated dishes.
-   Select geographical scope.
-   Open a dish detail page.

**Find Restaurants**

-   Search restaurant names.
-   Search cuisine/restaurant categories.
-   Discover top-rated restaurants.
-   Select geographical scope.
-   Open a restaurant detail page.

### C3. Search architecture audit

Trace the current search RPC and indexes.

Report:

-   Searchable entities.
-   Exact and fuzzy matching.
-   Alias handling.
-   Multilingual support.
-   City/location filters.
-   Pagination.
-   Performance.
-   Privacy filtering.
-   Search result ranking.
-   Existing route and component reuse opportunities.

Recommend whether to extend the current Postgres search or introduce
another service.

Default assumption: retain Postgres at the initial Telangana scale
unless evidence demonstrates a concrete performance or relevance
problem. Do not add Algolia, Elasticsearch, or another external search
dependency without a measured reason.

### C4. Search UX separation

Define a clear distinction:

  Find Food                  Find Restaurants
  -------------------------- -----------------------------
  Dish name                  Restaurant name
  Dish category              Cuisine/category
  Dish rating                Restaurant rating
  Dish ranking               Restaurant ranking
  Restaurants serving dish   Dishes served at restaurant

Identify any current UI that confuses these concepts.

------------------------------------------------------------------------

## 9. Audit workstream D --- Regional ranking and location architecture

### D1. Initial geography

The first release is Telangana-first.

Investigate whether existing data can reliably represent:

-   State.
-   City.
-   Locality.
-   Restaurant branch coordinates, if available.
-   User-selected radius.

Do not use a user's precise location without explicit permission.

### D2. Location data quality

Inspect current location fields and determine whether they are:

-   Free-text city names.
-   Normalized city references.
-   State/country references.
-   Latitude/longitude.
-   External place identifiers.

Report inconsistencies, missing values, duplicate spellings, and
ambiguity.

A restaurant must not appear in a city ranking based only on a loosely
matching free-text string if the result could be geographically wrong.

### D3. Ranking dimensions

The intended ranking surfaces are:

**Dish ranking** - Best Butter Chicken in a selected area. - Best
Biryani in Hyderabad. - Best Arabian dishes in Telangana.

**Restaurant ranking** - Best restaurants in a selected region. - Best
Arabian restaurants in Telangana. - Best restaurants for a selected
combination of criteria.

### D4. Multi-criteria filters

Investigate how the ranking engine can support user-selected
combinations.

Examples:

  User goal            Selected criteria
  -------------------- -----------------------------------
  Date night           Ambience + Food quality
  Budget dining        Value + Food quality
  Family dinner        Hygiene + Food quality + Ambience
  Best taste           Food quality
  Premium experience   Ambience + Service + Food quality

The user must be able to combine supported criteria without requiring a
separate hard-coded ranking for every possible combination.

### D5. Ranking methodology --- research and recommendation only

Do not implement or finalize ranking mathematics in Phase 0.

Evaluate:

-   Arithmetic average.
-   Bayesian/confidence-adjusted average.
-   Minimum sample threshold.
-   Per-dimension sample count.
-   Recency weighting, if justified.
-   Duplicate or suspicious rating detection.
-   Handling missing dimensions.
-   Tie-breaking.
-   Low-data regions.
-   Cold-start restaurants and dishes.

Important principles:

1.  Show the number of ratings alongside scores.
2.  Do not present a tiny sample as statistically certain.
3.  Do not convert missing criteria into zero.
4.  Do not combine restaurant and dish scores.
5.  Do not allow private experiences into public aggregates.
6.  Make the ranking understandable to users.
7.  Avoid a hidden popularity multiplier that overwhelms quality.

Recommend a first-release approach and explain its trade-offs.

### D6. Geographical edge cases

Document behaviour for:

-   A restaurant near a city boundary.
-   A radius search crossing district boundaries.
-   A venue with no coordinates.
-   Multiple branches with the same name.
-   A dish with too few ratings in a locality.
-   A city with no eligible results.
-   A venue incorrectly assigned to a city.
-   A user denying location permission.

------------------------------------------------------------------------

## 10. Audit workstream E --- Restaurant and dish profile requirements

### E1. Restaurant detail page

The target page should support:

-   Name and photographs.
-   Overall restaurant rating.
-   Rating count.
-   Detailed restaurant rating breakdown.
-   Community written reviews.
-   Signature dishes.
-   Dishes served at the restaurant.
-   Branch/location information.
-   Relevant collections.
-   Useful user-submitted information.

Inspect the current place page and map each requirement to existing code
or a missing feature.

### E2. Dish detail page

The target page should support:

-   Canonical dish name.
-   Aliases and translations.
-   Overall dish rating.
-   Rating count.
-   Optional taste/portion/value breakdown.
-   Community reviews and notes.
-   Restaurants serving the dish.
-   Restaurant-specific dish versions.
-   Regional rankings.
-   Relevant collections.

### E3. Signature dish definition

Investigate whether a signature dish should be:

-   Manually curated by the restaurant.
-   Identified by the community.
-   Derived from rating count and review patterns.
-   A combination of curation and evidence.

Do not let a restaurant's self-declared signature label automatically
imply that the dish is highly rated.

Recommend transparent labelling, for example:

-   Restaurant-highlighted.
-   Community favourite.
-   Highly rated.

These labels must not be conflated.

------------------------------------------------------------------------

## 11. Audit workstream F --- Social and review experience

The desired social model is:

-   Users can follow one another.
-   Users can like reviews/food experiences.
-   Users can comment using the existing comment model.
-   Reviews from followed users appear in the Home feed.
-   Users do not have direct messages.

Inspect the current social implementation and identify the smallest
required changes.

Important distinction:

-   A like is an appreciation signal.
-   A rating is a user's evaluation of food or a restaurant.
-   A comment is a response.
-   A review is the user's written experience.

Do not let likes, comments, or follower counts change a restaurant's or
dish's star rating.

Audit:

-   Feed ordering.
-   Review card design.
-   Rating visibility.
-   Follow privacy.
-   Notification behaviour.
-   Block behaviour.
-   Content deletion.
-   Visibility changes after publication.

Recommend how review-centric feed cards should reuse existing
ExperienceCard or related components.

------------------------------------------------------------------------

## 12. Audit workstream G --- Taste identity

The proposed taste profile should be based on observed behaviour.

Inspect current statistics and identify which are:

-   Based on frequency.
-   Based on ratings.
-   Based on explicit user preferences.
-   Inferred from incomplete data.

Potential future insights:

-   Highest-rated cuisines.
-   Frequently logged cuisines.
-   Highest-rated dishes.
-   Restaurant versus home-cooked preferences.
-   Price/value rating patterns.
-   Rating trends over time.

Clearly distinguish:

-   Frequently eaten.
-   Highly rated.
-   Explicitly preferred.

Do not infer personality, health, religion, income, or other sensitive
traits from food activity.

Do not invent a taste label when the sample size is insufficient.

Recommend minimum-data rules and privacy boundaries for public versus
owner-only statistics.

Taste identity should be implemented only after the new rating model and
ranking data are reliable.

------------------------------------------------------------------------

## 13. Audit workstream H --- UX and information architecture

### H1. Proposed navigation

Evaluate the following target navigation against the current
application:

1.  Home --- following feed and food experiences.
2.  Find --- Find Food and Find Restaurants.
3.  Diary --- personal food history.
4.  Collections --- saved and curated items.
5.  Profile --- reviews, followers, and taste identity.

Additional interface actions:

-   Log Experience remains prominent.
-   Notifications remain in the header.
-   Settings remain accessible from Profile or the account menu.

Do not remove an existing route or feature without mapping its current
purpose and destination.

### H2. Find UX principles

The first interaction should be simple:

-   Choose Find Food or Find Restaurants.
-   Enter a query or browse a category.
-   Choose location.
-   View results.

Advanced criteria should be available through a filter/sort control, not
forced into the first screen.

### H3. Rating form UX

Investigate how a user can rate a visit without excessive friction.

Desired direction:

-   Overall restaurant rating is clear.
-   Detailed dimensions are optional where appropriate.
-   Each dish has its own rating.
-   Dish-specific notes are optional.
-   A user can log a home-cooked experience without selecting a
    restaurant.
-   The user can save a draft or publish without filling every optional
    dimension.

Do not assume every rating field must be mandatory.

### H4. UX audit checklist

Check:

-   Navigation clarity.
-   Search versus Explore overlap.
-   Food versus restaurant terminology.
-   Rating form length.
-   Filter discoverability.
-   Result-card information hierarchy.
-   Restaurant/dish page hierarchy.
-   Mobile bottom navigation.
-   Tablet layout.
-   Desktop layout.
-   Loading, empty, error, success states.
-   Accessibility and keyboard operation.
-   Image loading and layout shifts.
-   Long names and multilingual text.

Record specific route/component evidence and actionable recommendations.

------------------------------------------------------------------------

## 14. Audit workstream I --- Security, privacy, and data integrity

This is a mandatory review, not an optional polish task.

Inspect:

-   RLS on every public table.
-   Policies and helper functions.
-   SECURITY DEFINER functions.
-   `search_path` handling.
-   Storage policies.
-   Public aggregate calculations.
-   Private profile behaviour.
-   Followers-only experiences.
-   Draft experiences.
-   Blocked users.
-   Account deletion.
-   Moderation.
-   Search results.
-   Notifications.
-   Collection visibility.
-   Location and image metadata.

### 14.1 Public ranking eligibility

The audit must identify the exact existing rule for a review to
contribute to public aggregates.

Verify the public-pool definition against the actual repository
instructions and implementation.

At minimum, private, followers-only, draft, blocked, non-discoverable,
or pending-deletion content must not leak into public search or public
aggregate results as applicable to the existing privacy model.

### 14.2 Location privacy

Recommend a privacy-safe approach:

-   No background/live location tracking.
-   No exact home location exposure.
-   Explicit permission before using device location.
-   Manual city/radius selection must remain available.
-   Do not expose precise eating-time activity.
-   Store only the location precision needed for the feature.

### 14.3 Image privacy

Inspect whether:

-   EXIF/GPS metadata is stripped.
-   Private images remain inaccessible to unauthorized viewers.
-   Signed URLs are created under correct authorization.
-   Deletion removes physical storage objects.
-   Public thumbnails do not leak private entries.

### 14.4 Rating abuse

Identify current controls for:

-   Repeated submissions.
-   Spam accounts.
-   Suspicious rating bursts.
-   Coordinated rating manipulation.
-   Restaurant/dish duplicate creation.
-   Report and moderation workflows.

Recommend proportionate beta-scale controls. Do not design an
unnecessarily complex fraud-detection system without evidence.

------------------------------------------------------------------------

## 15. Audit workstream J --- Performance and operational readiness

Inspect:

-   Search query performance.
-   Ranking query feasibility.
-   Aggregate table/index strategy.
-   Feed and diary pagination.
-   N+1 query risks.
-   Image delivery.
-   Server-side caching and revalidation.
-   Loading lifecycle.
-   Error handling.
-   Sentry/observability configuration.
-   CI reliability.
-   Build and deployment workflow.

Recommend how the future ranking system can avoid recalculating every
rating from raw experience rows on every search.

Prefer indexed, maintained aggregates when justified by the actual query
pattern.

Do not add caching that can serve private data to the wrong viewer.

------------------------------------------------------------------------

## 16. Required output documents

### 16.1 Primary report

Create:

`docs/audit/MORS_2_PRODUCT_GAP_AUDIT.md`

It must contain:

1.  Executive summary.
2.  Repository and stack overview.
3.  Product direction and specification conflicts.
4.  Existing functionality audit.
5.  Database/domain architecture audit.
6.  Rating semantics and data-flow analysis.
7.  Restaurant/dish identity analysis.
8.  Find/search audit.
9.  Regional ranking feasibility.
10. Restaurant/dish page gap analysis.
11. Social experience gap analysis.
12. Taste identity audit.
13. UX and navigation audit.
14. Security/privacy audit.
15. Performance/operational audit.
16. Risk register.
17. Prioritized gaps.
18. Open decisions.
19. Phase 1--7 implementation dependencies.
20. Final Phase 0 verdict.

### 16.2 Data model audit

Create `docs/audit/MORS_2_DATA_MODEL_AUDIT.md` if the analysis is
substantial enough to justify a separate document.

Include:

-   Existing schema inventory.
-   Existing rating data flow.
-   Conceptual future entity relationship diagram.
-   Restaurant versus branch identity.
-   Canonical dish versus restaurant-specific menu item.
-   Aggregate design options.
-   Historical data migration.
-   RLS implications.
-   Recommended minimal schema changes for Phase 1.

Do not include executable migration SQL in Phase 0.

### 16.3 UX audit

Create `docs/audit/MORS_2_UX_AUDIT.md` if useful.

Include:

-   Existing route map.
-   Existing navigation.
-   Proposed navigation.
-   Find landing page structure.
-   Find Food flow.
-   Find Restaurants flow.
-   Rating form flow.
-   Restaurant detail page structure.
-   Dish detail page structure.
-   Responsive issues.
-   Loading/error/empty-state issues.

Wireframes may be described in Markdown or Mermaid. Do not implement UI.

### 16.4 Implementation sequence

Create `docs/audit/MORS_2_IMPLEMENTATION_SEQUENCE.md`.

For each future phase, include:

-   Objective.
-   Scope.
-   Files likely to be affected.
-   Database changes.
-   Backend changes.
-   Frontend changes.
-   Tests.
-   Dependencies.
-   Risks.
-   Acceptance criteria.
-   Explicit out-of-scope items.

The sequence must be consistent with the approved eight-phase roadmap:

-   Phase 0 --- Product specification and repository reality audit.
-   Phase 1 --- Rating architecture and data model.
-   Phase 2 --- Find experience.
-   Phase 3 --- Regional ranking engine.
-   Phase 4 --- Restaurant and dish profiles.
-   Phase 5 --- Social experience upgrade.
-   Phase 6 --- Personal taste identity.
-   Phase 7 --- UX refinement and release audit.

Do not merge phases just to shorten the document.

------------------------------------------------------------------------

## 17. Risk register format

Every important risk must use this format:

  Field            Description
  ---------------- --------------------------------------------------
  ID               Stable identifier, e.g. `RATING-001`
  Risk             Specific problem
  Severity         Critical / High / Medium / Low
  Likelihood       High / Medium / Low / Unknown
  Evidence         File, function, migration, test, or reproduction
  Impact           Product/data/security consequence
  Recommendation   Proposed resolution
  Phase            Phase where it should be addressed
  Status           Open / Accepted / Mitigated / Unverified

Prioritize:

-   Incorrect rating semantics.
-   Mixing restaurant and dish aggregates.
-   Branch identity ambiguity.
-   Private data leaking into public rankings.
-   Historical rating misclassification.
-   Duplicate canonical dishes or restaurants.
-   Low-sample ranking distortion.
-   Location data quality.
-   Search/ranking performance.
-   Overcomplicated rating UX.
-   Broken existing logging or social workflows.

------------------------------------------------------------------------

## 18. Required decision register

Create a section in the primary audit for decisions that require
product-owner approval.

At minimum evaluate these questions:

### D0-01 --- What does the existing overall rating mean?

Determine whether it represents a food experience, restaurant, or
another concept.

Do not relabel it without evidence.

### D0-02 --- What is the restaurant review unit?

Recommended direction: one restaurant visit/food experience can contain
one written review, restaurant-level ratings, and multiple independently
rated dishes.

Verify compatibility with the current model.

### D0-03 --- Restaurant versus branch identity

Should ratings be branch-specific, restaurant-brand-wide, or both with
separate aggregates?

Recommend a model that prevents branch-specific differences from being
hidden.

### D0-04 --- Dish identity versus menu item

How should the system represent a canonical dish served in different
restaurant-specific versions?

### D0-05 --- Rating dimensions

Evaluate the proposed restaurant dimensions:

-   Overall.
-   Food quality.
-   Value for money.
-   Ambience.
-   Service.
-   Hygiene.

Evaluate the proposed dish dimensions:

-   Overall.
-   Taste.
-   Portion.
-   Value.

Recommend which dimensions are required, optional, or deferred.

### D0-06 --- Rating submission rules

Can users submit multiple ratings for the same restaurant or dish across
different visits?

Recommended direction: ratings should be tied to genuine experiences,
with aggregate calculations designed to prevent accidental duplicate
submissions.

### D0-07 --- Public rating eligibility

Confirm exactly which experiences can contribute to public rankings.

### D0-08 --- Regional scope and location model

Confirm Telangana-first and recommend the city/branch/radius data
requirements.

### D0-09 --- Minimum sample and ranking confidence

Recommend an understandable initial policy for insufficient ratings.

Do not finalize mathematical weights in Phase 0.

### D0-10 --- Navigation

Confirm the proposed five destinations and where notifications/logging
belong.

### D0-11 --- Review and social interaction

Confirm that likes/comments do not alter ratings and that DMs remain
excluded.

### D0-12 --- Taste profile visibility

Recommend which taste insights are public and which are owner-only.

For each decision, include:

-   Existing state.
-   Options.
-   Recommendation.
-   Trade-offs.
-   Approval required: Yes/No.
-   Phase affected.

Do not silently make irreversible product decisions.

------------------------------------------------------------------------

## 19. Prioritization rules

Use this priority model:

### P0 --- Must resolve before dependent feature work

-   Rating semantics.
-   Restaurant/dish separation.
-   Public aggregate privacy.
-   Restaurant/branch identity.
-   Canonical dish identity.
-   Historical data migration safety.
-   Core search architecture.
-   Regional location data feasibility.
-   Existing critical reliability defects.

### P1 --- Required for a complete MORS 2.0 experience

-   Restaurant and dish profile structure.
-   Multi-criteria ranking UX.
-   Review-centric feed.
-   Taste statistics.
-   UX consistency.

### P2 --- Defer until evidence justifies it

-   AI recommendations.
-   AI food recognition.
-   Nationwide rollout.
-   Gamification.
-   Direct messaging.
-   Ads and monetisation.
-   Delivery and bookings.
-   Native app, unless PWA evidence justifies it.

Do not promote a P2 feature because it is technically interesting.

------------------------------------------------------------------------

## 20. Verification strategy

Run only safe checks that are supported by the available environment.

Potential checks include:

-   Repository status and branch inspection.
-   Dependency and workspace inspection.
-   Typecheck.
-   Lint.
-   Unit tests.
-   Existing audit scripts.
-   Build.
-   Database test suite against a safe local test database.
-   Playwright tests against a safe local/staging environment.
-   Static inspection of RLS policies and migrations.

Before running commands:

1.  Inspect the package scripts.
2.  Confirm what each command does.
3.  Confirm it does not modify production or destroy data.
4.  Record the exact command and result.
5.  Record failures without attempting fixes.

Do not run destructive database commands.

### Evidence format

Create evidence files under:

`docs/evidence/phase-0/`

For each evidence item record:

-   Evidence ID.
-   Date/time.
-   Repository commit SHA.
-   Command or inspection method.
-   Relevant paths/symbols.
-   Result.
-   Limitations.

Screenshots should be included only when they demonstrate a real UI
finding. Do not use screenshots as a substitute for source or database
evidence.

------------------------------------------------------------------------

## 21. Definition of Done

Phase 0 is complete only when all applicable criteria below are met.

### Repository understanding

-   [ ] Current repository instructions have been read.
-   [ ] Existing phase documents and decision logs have been reconciled.
-   [ ] Conflicting product rules have been identified.
-   [ ] Current routes and major components have been inventoried.
-   [ ] Current database objects relevant to ratings/search/location
    have been inventoried.
-   [ ] Existing rating data flow has been traced end-to-end where
    possible.
-   [ ] Existing tests have been inspected and relevant safe tests run.

### Product understanding

-   [ ] MORS 2.0 product definition is documented.
-   [ ] Existing versus proposed functionality is clearly separated.
-   [ ] Restaurant and dish rating semantics are analysed.
-   [ ] Restaurant versus branch identity is analysed.
-   [ ] Canonical dish versus menu item identity is analysed.
-   [ ] Telangana-first scope is documented.
-   [ ] Find Food and Find Restaurants requirements are documented.
-   [ ] Regional ranking requirements are documented.
-   [ ] Social and taste identity requirements are documented.
-   [ ] Navigation proposal is documented.

### Technical readiness

-   [ ] Current rating storage and aggregate calculations are traced.
-   [ ] RLS and public aggregate eligibility are reviewed.
-   [ ] Historical data migration risks are documented.
-   [ ] Location data quality is assessed.
-   [ ] Search and ranking query feasibility is assessed.
-   [ ] Performance risks are recorded.
-   [ ] Phase 1 schema options and recommendation are documented.
-   [ ] No product migrations or application code changes were made.

### Deliverables

-   [ ] `docs/audit/MORS_2_PRODUCT_GAP_AUDIT.md` exists and is complete.
-   [ ] Supporting audit documents exist where justified.
-   [ ] Risk register is populated.
-   [ ] Decision register is populated.
-   [ ] Phase 1--7 dependencies are mapped.
-   [ ] Every major claim has evidence or is explicitly marked
    unverified.
-   [ ] Final audit verdict is provided.

### Final verdict

Choose exactly one:

-   `READY FOR PHASE 1 PLANNING`
-   `READY WITH OPEN DECISIONS`
-   `NOT READY — CRITICAL GAPS`

Phase 0 does not authorize Phase 1 implementation. Phase 1 requires a
separate implementation plan and explicit owner approval.

------------------------------------------------------------------------

## 22. Required final response from Antigravity

After completing Phase 0, provide a concise but substantive summary
containing:

1.  **Overall verdict** --- one of the three statuses above.
2.  **What currently works** --- verified features only.
3.  **What is incomplete or broken** --- include severity.
4.  **Most important architectural finding** --- especially current
    rating semantics.
5.  **Database changes likely required** --- conceptual only, no
    migration implementation.
6.  **Top ten risks** --- ranked.
7.  **Open product decisions** --- requiring owner approval.
8.  **Recommended Phase 1 scope** --- specific and bounded.
9.  **Files created** --- exact paths.
10. **Tests executed** --- exact commands and results.
11. **Tests not executed** --- reason.
12. **Confirmation of boundaries** --- explicitly confirm that no
    application code, migrations, production data, or production
    configuration were changed.

Do not claim Phase 0 is complete if key areas remain unverified. Explain
what is missing and what evidence is needed.

------------------------------------------------------------------------

# 23. Antigravity execution prompt

Use the following as the execution instruction for this work package:

> You are performing MORS 2.0 Phase 0: Product Specification and
> Repository Reality Audit.
>
> Read this entire document and the repository's `AGENTS.md` before
> acting.
>
> Treat the repository as an existing production-oriented codebase. Do
> not assume documentation accurately reflects the current
> implementation. Verify every important claim in source code, database
> migrations, policies, functions, tests, and safe end-to-end checks
> where available.
>
> MORS 2.0 is a Telangana-first social food journal and
> community-powered restaurant/dish discovery platform. Its key new
> capabilities are independent restaurant and dish ratings, regional
> rankings, multi-criteria discovery, rich restaurant/dish pages,
> review-centric social discovery, and evidence-based taste identity.
>
> Your task is strictly an audit and planning task. Do not implement
> features, refactor application code, modify migrations, alter database
> schema, change production settings, or fix bugs.
>
> You may only create or modify files in `docs/audit/`,
> `docs/evidence/`, and `tests/audit/`, in accordance with the
> repository's instructions.
>
> Work through all audit workstreams in this document. Trace existing
> rating data from the user interface through validation and server-side
> persistence to database aggregates and display. Pay particular
> attention to whether the existing overall rating actually represents a
> restaurant, a dish, or a general food experience. Do not relabel
> historical data based on assumptions.
>
> Examine restaurant/branch identity, canonical dish/menu-item identity,
> public aggregate eligibility, RLS, search, location data, ranking
> feasibility, social feed behaviour, taste statistics, and UX.
>
> Produce the required audit documents with evidence-backed findings.
> Mark uncertain items `UNVERIFIED`. If the environment prevents a test,
> state the limitation. Do not fabricate test results or repository
> facts.
>
> Do not begin Phase 1. Do not create a migration. Do not change any
> application behaviour.
>
> At the end, provide the required final summary and choose exactly one
> Phase 0 verdict. Stop and wait for the product owner's approval.

------------------------------------------------------------------------

## 24. Handoff to Phase 1

Phase 1 must begin with the approved findings from this audit.

Its scope will be:

**Rating architecture and data model**

-   Finalize experience, restaurant visit, branch, canonical dish, and
    menu-item relationships.
-   Finalize independent restaurant and dish rating semantics.
-   Decide the rating dimension storage model.
-   Define public aggregate eligibility.
-   Define historical data migration rules.
-   Define aggregate maintenance and recalculation.
-   Define RLS and privacy tests.
-   Produce a file-by-file implementation plan.
-   Wait for approval before coding.

**The Phase 0 rule is simple: understand the existing MORS completely
before changing its foundation.**
