# MORS — Phase 4 Execution Brief for Antigravity
## Restaurant & Dish Profiles

**Phase:** 4  
**Priority:** P0 — core product experience  
**Status:** Execute only after Phases 0–3 are reviewed and accepted  
**Primary outcome:** Complete, reliable restaurant and dish profile pages that help users understand a place or a dish, evaluate community evidence, explore public food experiences, and continue into logging.

---

## 1. Mission

Build the detail experiences that sit behind MORS search results and regional rankings.

Phase 2 helps users find a restaurant or dish. Phase 3 determines how eligible entities are ordered within supported regions. Phase 4 gives users enough context to decide what to do next.

The two main questions are:

- **Restaurant profile:** “What is this restaurant like, what do people rate it, and what have people experienced here?”
- **Dish profile:** “What is this dish like, how do people rate it, and where has the community tried it?”

These pages must make the difference between aggregate scores, individual experiences, and verified business information clear.

**Core principle:**

> A profile is an evidence page, not a marketing page. Show what MORS can verify, distinguish community opinion from factual business information, and leave unsupported information out.

Do not build an unrelated restaurant directory, restaurant-owner portal, menu-management system, or a second review database. Reuse the approved Phase 1 data model, Phase 2 search contracts, and Phase 3 aggregate/ranking contracts.

---

## 2. Prerequisites and phase gates

### 2.1 Accepted earlier-phase outputs

**Phase 0**
- Verified repository and current product audit.
- Existing routes, data flows, profile components, logging, social features, collections, and known reliability issues.
- Repository conventions and test procedures.

**Phase 1**
- Approved restaurant/branch, dish, experience, and dish-entry model.
- Rating scale and restaurant/dish dimensions.
- Public aggregate eligibility and privacy rules.
- Ownership and authorization rules.
- Public data access patterns and security policies.

**Phase 2**
- Stable restaurant/branch and canonical dish identities.
- Find/Search result routes and query contracts.
- Existing experience logging flow.
- Existing public experience display patterns.
- URL, pagination, responsive, and accessibility conventions.

**Phase 3**
- Approved regional rankings and ranking methodology.
- Ranking response contracts and calculation version.
- Verified region membership and enabled geography.
- Rating counts, averages, metric breakdowns, and evidence states.
- Freshness and stale-data behavior.

### 2.2 Stop conditions

Stop and report rather than inventing behavior if:
- The entity identity is ambiguous (brand versus branch, or canonical dish versus variant).
- A Phase 1 rating or privacy rule is unresolved.
- Phase 3 has no verified aggregate for a score the page intends to show.
- Public experience queries cannot reliably exclude ineligible content.
- Existing routes or data flows cannot be safely reused.
- Place, dish, cuisine, address, opening hours, menu, or image data is missing or unverified.
- Profile pages would require a destructive schema change.

Do not manufacture placeholder ratings, fake reviews, fabricated opening hours, or sample experiences to make the page look populated.

---

## 3. Scope

### 3.1 In scope

- Restaurant branch profile.
- Restaurant brand profile, only if Phase 1 approved a distinct brand entity and Phase 3 supports its aggregate semantics.
- Canonical dish profile.
- Correct aggregate ratings and per-dimension breakdowns.
- Rating counts and clear evidence states.
- Regional ranking context from Phase 3.
- Public food experiences and review content.
- Dishes logged at a restaurant/branch.
- Restaurant/branch contexts where a dish has been logged.
- Links between restaurant and dish profiles.
- Existing like, comment, follow, save, and collection interactions where already supported and permitted.
- Entry points into the existing food-experience logging flow.
- Pagination, sorting, and supported filters for public experiences.
- Mobile-first visual hierarchy and accessibility.
- Loading, error, empty, partial-data, and stale-data states.
- Metadata, canonical URLs, and safe sharing previews.
- Performance, privacy, abuse, and regression testing.

### 3.2 Out of scope

Do not add these in Phase 4:

- Restaurant-owner accounts, claiming, or profile editing dashboards.
- Self-submitted restaurant ratings by business owners.
- Menu inventory or verified real-time menu availability.
- Booking, ordering, delivery, reservations, or payments.
- Restaurant advertising, paid placement, or sponsored ratings.
- AI-generated restaurant/dish summaries.
- AI-generated review summaries or sentiment labels.
- Personalized recommendation feeds.
- A new messaging system.
- A separate reviews table if the approved experience model already represents the review.
- A new rating calculation implementation inside the frontend.
- A new map/distance engine.
- Unverified business hours, price ranges, contact details, or dietary claims.
- A complete redesign of diary, home, collections, or unrelated routes.

---

## 4. Profile types and identity

The page must show exactly what entity the user is viewing.

### 4.1 Restaurant branch profile

A branch is a physical outlet.

If Phase 1 defines branch-level ratings, the branch profile must use:
- branch identity;
- branch location;
- restaurant-level ratings for that branch;
- branch-specific public experiences;
- branch-specific dish logs, where supported;
- branch-specific regional ranking, if Phase 3 enables it.

Do not merge ratings from other branches into this page unless a clearly labelled brand-level aggregate is shown separately and approved.

### 4.2 Restaurant brand profile

Build this only if the accepted data model includes a brand as a distinct entity.

The brand page must:
- identify itself as the restaurant brand, not a physical outlet;
- show the number of known branches only if the count is accurate;
- list branches with distinct locations;
- distinguish brand-level information from branch-level ratings;
- avoid presenting a brand aggregate as a guarantee about every branch;
- let users open the specific branch they intend to visit.

If Phase 1 did not approve brand-level ratings, the brand page must not invent one. It may function as a branch directory only if that use is within the accepted product scope.

### 4.3 Canonical dish profile

A dish profile represents a canonical dish concept.

It may include:
- canonical display name;
- accepted alternate names/aliases;
- supported cuisine/category;
- dish-level aggregate rating;
- dimension breakdown;
- eligible rating count;
- regional ranking context;
- public experiences containing the dish;
- restaurants/branches where users have logged it, if the relationship is reliable.

Do not merge genuinely different preparations, regional variants, or dishes merely because their names are similar.

### 4.4 Unresolved or merged entities

If a place or dish has been merged, aliased, or redirected:
- use the canonical entity route;
- preserve the original user-entered text in historic experiences where required;
- avoid duplicate profile pages that split the same canonical aggregate;
- handle old URLs with a safe redirect or canonical link;
- do not discard historical experience content.

---

## 5. Restaurant branch profile — page structure

Build the page from verified, useful information. The precise order may be adjusted to fit the existing design system, but the hierarchy below is the target.

### 5.1 Header / identity section

Show, where available and verified:
- restaurant display name;
- branch name or distinguishing locality;
- primary image;
- locality, city, and state;
- cuisine/category tags;
- identity type (branch);
- available actions.

Potential actions, only where the existing feature is supported:
- Log an experience.
- Save to a collection.
- Follow a restaurant/brand entity, if the product has this concept.
- Share profile.
- Report incorrect or inappropriate information.

Do not expose edit controls to ordinary users unless a safe contribution workflow already exists.

Avoid displaying a generic chain logo as though it is a photo of the actual branch.

### 5.2 Primary restaurant rating summary

Use the Phase 1/3 aggregate contract.

Show:
- restaurant overall displayed average;
- eligible rating count;
- clear “restaurant rating” meaning;
- ranking/evidence label if enabled;
- regional position only if Phase 3 has a valid result for the exact region and metric.

Example:
- `4.6 · 86 ratings`
- `Highly rated in this locality` only if the ranking API provides that verified position and scope.

Rules:
- Do not display a ranking score as the public average.
- Do not display `0.0` when no eligible rating exists.
- Show “No restaurant ratings yet” when appropriate.
- If an aggregate is stale, follow Phase 3's stale-data policy.
- Never mix dish ratings into the restaurant score.

### 5.3 Restaurant dimension breakdown

Display approved dimensions:
- food quality;
- value for money;
- ambience;
- service;
- hygiene.

For each dimension:
- display average only when eligible ratings exist;
- show the metric's own eligible count where useful;
- distinguish missing data from a low score;
- do not use the overall rating count as the dimension denominator;
- do not show a dimension if it is not part of the approved schema/product scope.

A dimension with no data should be labelled “Not enough ratings” or omitted according to the approved UI decision, never shown as zero.

### 5.4 Location and business information

Show only known, supported fields:
- address;
- locality/city;
- map link or coordinates, if verified;
- opening hours, only from a trustworthy maintained source;
- phone or website, only if already stored and verified;
- price range, only if collection rules and data coverage are reliable.

Do not:
- guess opening hours;
- infer “open now” from a static schedule that may be stale;
- invent an address from a search query;
- show distance without valid coordinates and a defined reference location;
- turn an unverified external link into a trusted business fact.

### 5.5 Dishes logged at this branch

Purpose: show food that the MORS community has experienced at this branch.

Use clear language:
- “Dishes logged here”
- “Community experiences”
- “People have logged these dishes at this branch”

Do not use “Menu”, “Available now”, or “Popular menu items” unless MORS has a separately verified menu source.

Each dish item may show:
- canonical dish name;
- safe image;
- number of eligible public dish ratings/experiences, as defined;
- branch-specific dish score only if Phase 1 and Phase 3 approved it;
- link to the dish profile.

Rules:
- a dish logged once is not proof of current availability;
- do not infer menu availability from an old experience;
- do not show dish-level overall average as a branch-specific average;
- do not show a branch-specific score unless the correct aggregate exists.

### 5.6 Public food experiences at this branch

Show experiences that:
- belong to the branch;
- are public and published;
- meet Phase 1 eligibility rules for public display;
- are not deleted, rejected, or otherwise restricted.

Each experience card should use existing MORS experience design and may display:
- author identity according to current public profile rules;
- experience date;
- text;
- media;
- linked dishes;
- restaurant rating context;
- interactions already supported, such as likes/comments.

Do not duplicate the underlying experience into a separate review record.

Do not display private follower-only experiences simply because the viewer follows the author unless the page's access model explicitly supports that visibility. Public profile aggregation and viewer-specific access must remain distinct.

### 5.7 Ranking context

Where Phase 3 supports it, show:
- exact region;
- exact metric;
- rank or placement;
- ranking freshness/context if useful;
- link to the full regional ranking page.

Do not show “#1 restaurant” without naming the region and metric, for example: “#1 by overall rating in [approved locality]”.

Do not show a branch's district rank on a page section labelled as a locality ranking.

Do not calculate the rank client-side.

---

## 6. Restaurant brand profile — optional structure

Only implement if approved by Phase 1 and required by the product scope.

Suggested sections:
1. Brand identity.
2. Verified description/category, if present.
3. Brand-level rating, only if explicitly approved.
4. Branch directory with locality/city.
5. Public brand-level experiences, only if the data model supports them.
6. Link to each branch profile.

Do not:
- present one branch's rating as the brand's rating;
- average branch averages without the approved weighting method;
- treat branch count as proof of data coverage;
- imply every branch has the same hygiene, service, ambience, or food quality.

If brand-level rating is not approved, omit the rating block rather than manufacture an aggregate.

---

## 7. Dish profile — page structure

### 7.1 Header / dish identity

Show, where verified:
- canonical dish name;
- suitable image;
- supported category/cuisine;
- accepted alternate names or regional names, where useful;
- a clear indication if the entity represents a specific variation.

Preserve original user-entered names in the user's historic experiences. A canonical name does not erase the user's own wording.

Do not infer ingredients, allergens, dietary suitability, religious status, health value, or preparation method from a dish name or image.

### 7.2 Primary dish rating summary

Use the approved dish aggregate.

Show:
- dish overall displayed average;
- eligible rating count;
- evidence state if applicable;
- regional ranking context from Phase 3, if enabled.

Example:
- `4.5 · 210 ratings`

Rules:
- Use only dish-level ratings.
- Never substitute the restaurant's overall score.
- Never imply that a high overall dish score applies to every restaurant's version.
- If no eligible ratings exist, show “No dish ratings yet”.
- Keep the displayed average separate from the ranking score.

### 7.3 Dish dimension breakdown

Show approved dimensions:
- taste;
- portion;
- value.

For each dimension:
- use its own eligible count;
- omit or label missing data accurately;
- do not interpret a missing rating as poor performance;
- do not show a dimension if it is not approved or available.

### 7.4 Where the community has logged this dish

This section helps answer where users have tried the dish.

Show restaurant/branch context only where the relationship is supported by the experience data.

Possible card fields:
- restaurant/branch name;
- locality/city;
- eligible number of public experiences or dish ratings, with the metric clearly defined;
- branch-specific dish average, only if Phase 1/3 approved it;
- latest public experience date, if privacy-safe and useful.

Use copy such as:
- “Logged at these restaurants”
- “Community experiences”

Do not call this a verified menu list.

If a dish appears at multiple branches, keep branch contexts separate. Do not combine all branch ratings into an implied branch-specific score.

### 7.5 Public experiences containing the dish

Show eligible public food experiences linked to the canonical dish.

The experience card should reuse the existing experience component and preserve:
- author's public identity rules;
- original text;
- media;
- date;
- parent restaurant/branch context;
- dish-specific rating, if present;
- existing interactions.

Do not show a restaurant rating as a rating of the dish.

If one experience contains multiple dishes, make clear which dish rating belongs to which dish.

### 7.6 Regional ranking context

Where Phase 3 enables a regional dish ranking, show:
- region and hierarchy level;
- dish metric;
- position;
- rating count/evidence;
- link to the full regional dish list.

Do not claim a dish is the best in a region if only a category-specific or small-population ranking exists. Make the scope exact.

---

## 8. Relationship between restaurant and dish profiles

The pages should work together without conflating the entities.

### From restaurant to dish
- A restaurant page can link to dishes logged at that branch.
- Selecting a dish opens the canonical dish profile.
- If there is an approved branch-specific dish aggregate, the UI can show it as a separate branch context.
- If not, show only logged-at evidence and the dish's overall community rating separately.

### From dish to restaurant
- A dish page can link to branches where the community logged it.
- Selecting a branch opens the restaurant branch profile.
- Do not imply the dish is currently available there.
- Do not use the restaurant overall rating as the branch's score for that dish.

### Rating creation
When the user starts logging from a restaurant profile:
- preselect the correct branch if that is a supported part of the existing logging flow;
- preserve the relationship to the branch;
- allow the user to add dishes and dish ratings as defined in Phase 1.

When the user starts logging from a dish profile:
- preselect the canonical dish if supported;
- let the user choose or enter the restaurant/branch context according to existing product rules;
- do not auto-select a restaurant merely because it appears first in the dish profile.

The existing logging flow remains the source of truth. Do not create a second rating form just for profiles.

---

## 9. Public experiences and social interactions

Phase 4 must reuse existing MORS social behavior rather than creating parallel systems.

### 9.1 Experience eligibility

Every profile experience query must apply:
- public visibility;
- published state;
- moderation policy;
- deletion state;
- account status policy;
- block/safety rules according to the accepted Phase 1 policy.

The page may need viewer-specific access to some non-public content under existing rules, but such content must not influence public aggregates or public profile counts.

### 9.2 Interactions

Reuse existing interactions, where they exist:
- like/unlike;
- comment/view comments;
- open author profile;
- share experience;
- follow author;
- save experience to collection.

Do not create new versions of:
- comments;
- likes;
- follows;
- notifications;
- collections;
- sharing infrastructure.

All mutations must preserve existing authorization and ownership checks.

### 9.3 Sorting and filtering experiences

Possible options, if supported:
- Most recent;
- Most relevant (only if a documented deterministic rule exists);
- With photos;
- Specific dish.

Start with the simplest meaningful sort: most recent.

Do not call a feed “most helpful” or “most popular” unless the metric is defined and the ranking is defensible.

Use stable pagination and avoid duplicate experiences across pages.

### 9.4 Counts and privacy

- Public experience counts must count only experiences eligible for public display.
- Do not expose private experience existence through totals.
- Do not show private contributor identities.
- Do not show "X people rated this" if the count includes ineligible data.
- Avoid exact timestamps or metadata that could reveal private user activity.

---

## 10. Profile routing and URL behavior

Inspect existing route conventions before adding routes.

Possible logical routes:
- `/restaurant/[canonical-branch-slug-or-id]`
- `/dish/[canonical-dish-slug-or-id]`
- optional brand route if approved.

Do not copy these exact patterns if the existing repository has an established convention.

Requirements:
- one canonical route per canonical entity;
- stable identifiers that do not depend only on mutable names;
- readable slugs where existing patterns support them;
- canonical redirects for aliases/merged entities;
- correct browser back/forward behavior;
- deep links survive reload;
- invalid or deleted entities show a useful not-found or unavailable state;
- no private content leaks through metadata or server-rendered HTML;
- query/filter tabs preserve state where appropriate.

Avoid exposing sequential database IDs if current security conventions prohibit it.

---

## 11. Data access contracts

### 11.1 General rules

- Use Phase 1 public eligibility.
- Use Phase 3 aggregate/ranking outputs.
- Reuse Phase 2 entity identity and search contracts.
- Keep authorization server-side where required by the current architecture.
- Do not calculate ranking scores or public aggregates in page components.
- Do not query every experience and average ratings in the browser.
- Use typed response objects.
- Validate route identifiers.
- Bound page sizes.
- Use stable pagination.
- Avoid N+1 queries for dishes, rating dimensions, and experience cards.
- Return only fields the page needs.

### 11.2 Restaurant profile contract

Logical response fields:
- branch identity;
- optional brand identity;
- name and supported display labels;
- location fields and verification status where safe;
- safe media references;
- supported cuisine/category tags;
- restaurant aggregate and per-dimension aggregates;
- ranking context by region/metric, when enabled;
- dishes logged at this branch;
- public experience preview/page data;
- supported interactions and action availability;
- freshness or stale state where relevant.

Use distinct field names such as `restaurant_overall_average` and `restaurant_overall_rating_count`, not an ambiguous generic score.

### 11.3 Dish profile contract

Logical response fields:
- canonical dish identity;
- display name and accepted aliases;
- supported category/cuisine;
- safe image references;
- dish overall aggregate;
- per-dimension aggregates;
- regional ranking context;
- branches where the dish has been logged;
- branch-specific dish aggregate only if approved;
- public experience preview/page data;
- freshness or stale state where relevant.

Use distinct field names such as `dish_overall_average` and `dish_overall_rating_count`.

### 11.4 Separation of page data and experience feed data

Do not load all experience records as part of the initial profile payload.

Use:
- a bounded initial profile summary;
- a separate paginated public experience query;
- optional paginated dish/branch sections.

This prevents profile headers from becoming slow because a popular restaurant has many experiences.

### 11.5 Caching and freshness

- Cache only safe public profile data.
- Never share-cache viewer-specific permissions or private experience access.
- Invalidate relevant cache entries after approved entity or aggregate changes.
- Respect Phase 3 ranking freshness metadata.
- Do not show a stale ranking as current.
- Avoid caching full social interaction state in a shared public cache.
- Document acceptable staleness for aggregate summaries.

---

## 12. Actions and contribution flows

### 12.1 Log an experience from a restaurant page

Expected flow:
1. User selects Log an experience.
2. Existing logging flow opens.
3. Correct restaurant branch is preselected if supported.
4. User adds experience content/media.
5. User adds one or more dishes, if desired.
6. User submits restaurant rating dimensions and dish rating dimensions according to the approved model.
7. Existing validation, ownership, moderation, and persistence logic runs.
8. On success, user is returned to a useful state or the new experience is opened.
9. Aggregates and rankings refresh according to their defined freshness policy.

### 12.2 Log a dish from a dish page

Expected flow:
1. User selects Log this dish / Log an experience.
2. Existing logging flow opens with the canonical dish preselected if supported.
3. User selects or enters restaurant/branch context according to current product rules.
4. User records the experience and dish rating.
5. The experience is persisted using the existing data model.
6. The page reflects the updated state after backend confirmation.

### 12.3 No duplicate rating systems

- Do not write ratings directly from a profile header.
- Do not allow the client to write aggregate values.
- Do not create an alternate review form that bypasses experience lifecycle rules.
- Do not mutate ranking positions directly.
- All rating changes must go through the approved logging/editing path.

### 12.4 Save and follow

If supported:
- Save restaurant/dish to an existing collection mechanism only if collection entity types allow it.
- Do not invent a second bookmark table without approval.
- Follow a restaurant/brand only if the social model supports entity follows.
- If entity following is not supported, do not simulate it by creating a user follow.

---

## 13. UX and visual hierarchy

### 13.1 Design goals

- Make the identity obvious before presenting scores.
- Make average, count, and dimension meanings understandable.
- Make branch context prominent when names repeat.
- Keep dish and restaurant page patterns related but semantically distinct.
- Avoid giant data dashboards on mobile.
- Keep the primary logging action discoverable.
- Use actual evidence and content, not decorative empty charts.
- Keep media and experience content readable.
- Avoid excessive badge and chip clutter.

### 13.2 Mobile-first requirements

- Header identity and primary action visible without excessive scrolling.
- Rating summary readable at narrow widths.
- Dimension breakdown collapsible or compact where needed.
- Experience cards do not overflow horizontally.
- Branch/dish lists use compact but readable cards.
- Touch targets are sufficiently large.
- Sticky actions, if used, must not cover content or keyboard controls.
- Images reserve aspect ratio to avoid layout shift.
- Use responsive image sizes and lazy loading below the fold.

### 13.3 Desktop behavior

- Use available width to create a clear hierarchy.
- A two-column layout may be used where it improves scanning:
  - main content: experiences/dishes;
  - secondary column: summary/location/actions.
- Do not force a sidebar if it makes the content cramped.
- Keep the same information order and semantics as mobile.

### 13.4 Missing data and partial profiles

A profile may have an identity but little community evidence.

Examples:
- no ratings;
- ratings but no written experiences;
- written experiences but no image;
- no verified address;
- no supported cuisine data;
- no regional ranking because the region is not enabled.

The page must remain useful:
- show known information;
- omit unknown information;
- label missing ratings clearly;
- provide the appropriate logging action;
- never fill gaps with invented content.

---

## 14. Loading, error, empty, and stale states

Implement and test the following.

### Loading
- profile shell/skeleton;
- aggregate loading if separate;
- experiences loading;
- dishes/branches loading.

### Not found
- invalid identifier;
- deleted or merged entity;
- unsupported route.

### Empty
- no ratings;
- no public experiences;
- no dishes logged at a branch;
- no known branches for a brand;
- no restaurant contexts for a dish;
- no ranking data in this region.

### Error
- profile fetch failure;
- aggregate fetch failure;
- experience page failure;
- interaction mutation failure;
- image load failure.

### Partial data
If the profile identity loads but the experience list fails:
- keep the identity and safe summary visible;
- show an error for the affected section;
- provide a retry action;
- do not blank the entire page.

### Stale data
Follow Phase 3 aggregate freshness rules:
- do not imply stale rankings are live;
- show safe stale state or omit ranking context;
- keep the profile usable if non-ranking information is still current.

### Retry
- preserve route and active tab/filter;
- avoid duplicate requests;
- use the same entity identity;
- do not silently fall back to unrelated data.

---

## 15. Search, ranking, and profile consistency

The same entity must present consistent identity and scores across Find, ranking pages, and profiles.

Verify:
- Search result opens the same canonical profile.
- Ranking result opens the same canonical profile.
- The displayed overall average is identical across all surfaces for the same calculation version and freshness state.
- Eligible rating count is identical.
- Dimension-specific averages/counts match.
- Region and metric labels match the ranking API.
- Branch and brand data are not interchanged.
- Dish identity is canonical and aliases route correctly.
- Any stale-state indicator is consistent.

Do not build separate UI-specific computations that can drift from server results.

---

## 16. Moderation, corrections, and data quality

Profile pages expose potentially sensitive, misleading, or incorrect user-generated content. Reuse the existing moderation and report mechanisms.

Where supported:
- report an experience;
- report an incorrect place/dish identity;
- correct or suggest a location/entity mapping;
- hide content under the existing moderation policy.

Requirements:
- Do not let a public user directly change another user's rating or review.
- Do not allow a business to edit community ratings.
- Ensure a moderated/removed experience disappears according to the accepted policy.
- Correcting a place or dish mapping must not duplicate ratings or experiences.
- Merged entities must resolve to one canonical profile.
- Keep an audit trail for moderation or correction actions where the current system supports it.

Do not build a full place/dish crowdsourced editing workflow unless it is explicitly part of the accepted product scope.

---

## 17. Metadata and sharing

Implement metadata that accurately represents the entity.

For public profiles:
- meaningful title;
- accurate description from verified fields only;
- canonical URL;
- safe Open Graph/share image where available;
- no private review text or private contributor information in metadata;
- no fabricated ranking statement in description;
- canonical handling for aliases/merged entities.

For user-generated content:
- do not expose private experience media in public preview metadata;
- ensure private routes are not indexed or previewed publicly;
- respect current authentication and robots/indexing conventions.

Sharing a profile should open the same canonical entity route.

---

## 18. Performance and reliability

Measure and optimize the profile data path.

Track:
- time to render identity/header;
- time to render aggregate summary;
- first public experience load;
- payload size;
- queries per page;
- number of related dish/branch queries;
- image loading behavior;
- pagination performance;
- cache freshness/invalidation.

Requirements:
- profile header must not wait for all historical experiences;
- avoid N+1 queries;
- use bounded pagination;
- index high-use joins based on query plans;
- lazy-load lower-page media;
- reserve image dimensions;
- keep interactions responsive;
- avoid repeated refetching when likes/comments change;
- handle slow network and partial backend failure.

Do not add a separate cache or search service without measured evidence.

---

## 19. Accessibility

- Page has a meaningful heading hierarchy.
- Restaurant/branch identity is announced clearly.
- Dish identity is announced clearly.
- Rating values have accessible text labels, not only stars or color.
- Each rating dimension is named and its score/count is understandable.
- Cards and links have meaningful accessible names.
- Images have appropriate alt text or are decorative.
- Keyboard focus is visible.
- Tabs/accordions are keyboard accessible.
- Report/share/save controls have labels.
- Loading/error updates are announced appropriately.
- Touch targets and contrast meet the repository's accessibility standard.
- Reduced-motion preferences are respected.

---

## 20. Implementation workstreams

### Workstream A — Profile contract integration

1. Read accepted Phase 0–3 documentation.
2. Identify existing restaurant/place and dish routes.
3. Map each route to canonical entities.
4. Map aggregate and ranking responses to profile needs.
5. Identify existing experience-card and social components.
6. Record gaps before implementing.

**Deliverable:** `docs/phase-4/PROFILE_CONTRACT_INTEGRATION.md`

### Workstream B — UX specification

1. Define branch profile layout.
2. Define optional brand profile layout.
3. Define dish profile layout.
4. Define cross-navigation between profiles.
5. Define rating and evidence presentation.
6. Define experience feed behavior.
7. Define mobile/desktop layouts.
8. Define empty, partial, error, and stale states.

**Deliverable:** `docs/phase-4/PROFILE_UX_SPEC.md`

### Workstream C — Backend/profile data

1. Implement or repair branch profile query.
2. Implement brand profile query only if approved.
3. Implement canonical dish profile query.
4. Add separate paginated public experience queries.
5. Add dishes-logged-at-branch and branches-where-logged relationships.
6. Integrate Phase 1 aggregates and Phase 3 rankings.
7. Apply public eligibility and authorization consistently.
8. Bound queries and optimize based on evidence.

**Deliverable:** typed, tested profile data contracts.

### Workstream D — Restaurant profile UI

1. Build identity/header.
2. Add restaurant overall summary.
3. Add approved dimension breakdown.
4. Add verified location/business information.
5. Add dishes logged at branch.
6. Add public experiences.
7. Add regional ranking context where supported.
8. Add logging and supported social actions.

**Deliverable:** complete branch profile.

### Workstream E — Dish profile UI

1. Build canonical dish identity/header.
2. Add dish overall summary.
3. Add approved dimension breakdown.
4. Add branches where the community logged the dish.
5. Add public experiences containing the dish.
6. Add regional ranking context where supported.
7. Add logging and supported social actions.

**Deliverable:** complete dish profile.

### Workstream F — Routing and integration

1. Connect Find results to canonical profile routes.
2. Connect regional ranking cards to profile routes.
3. Connect restaurant pages to dish profiles.
4. Connect dish pages to restaurant branch profiles.
5. Connect profile logging actions to the existing experience flow.
6. Handle aliases, merges, deleted entities, and invalid identifiers.
7. Verify browser history and direct URL reload.

**Deliverable:** end-to-end profile navigation.

### Workstream G — QA and performance

1. Test all page states.
2. Test public privacy boundaries.
3. Test aggregate consistency.
4. Test route canonicalization.
5. Test social interactions.
6. Test logging from both profile types.
7. Test responsive and accessible behavior.
8. Measure query/payload performance.
9. Run regressions across Find, diary, logging, collections, and social features.

**Deliverable:** `docs/phase-4/TEST_REPORT.md` and evidence.

---

## 21. Priority order

### P0 — Required

1. Canonical restaurant branch profile.
2. Canonical dish profile.
3. Correct overall aggregate and eligible count on each profile.
4. Approved per-dimension rating breakdowns.
5. Public experiences with privacy-safe eligibility.
6. Dishes logged at branch / branches where dish is logged, with accurate labels.
7. Links between restaurant and dish profiles.
8. Logging action connected to the existing experience flow.
9. Loading, empty, error, partial, and stale states.
10. Mobile-first responsive and accessible experience.
11. Stable routes and canonical handling.
12. Consistency with Find and regional ranking data.

### P1 — Only if approved and supported

1. Separate restaurant brand profile.
2. Brand-level aggregate and branch roll-up.
3. Advanced experience sorting/filtering.
4. Dish-at-branch score presentation.
5. Additional business metadata.
6. User suggestions/corrections to entity data.
7. Richer share metadata and profile previews.

### Explicitly defer

- Verified menu management.
- Owner-claimed pages.
- Reservation/delivery/ordering.
- AI summaries and recommendations.
- Paid placement.
- Unverified hours or availability.
- Advanced maps and distance-based discovery.

---

## 22. Test matrix

| Area | Required test cases |
|---|---|
| Restaurant identity | Correct branch, similarly named branches, brand versus branch |
| Dish identity | Canonical dish, alias, variant, merged dish, similar names |
| Aggregates | Correct overall average/count, dimension denominators, no-data state |
| Ranking | Correct region/metric/position, stale ranking, insufficient evidence |
| Experiences | Public published, private, followers-only, draft, rejected, deleted, blocked cases per policy |
| Dish relationships | One dish at multiple branches, multiple dishes in one experience |
| Social | Like/unlike, comment, follow, save, share, report; authorization failures |
| Logging | Start from restaurant, start from dish, preselection, validation, persistence |
| Routing | Direct load, refresh, back/forward, canonical redirects, invalid identifier |
| Partial failures | Profile loads but feed fails; aggregate loads but ranking fails; media failure |
| Pagination | First/middle/final page, stable ordering, duplicate prevention |
| Privacy | Private experience not shown/countable/indexable; no private metadata leak |
| Responsive | Small mobile, large mobile, tablet, desktop |
| Accessibility | Keyboard, screen reader names, focus, contrast, reduced motion |
| Performance | Header latency, first feed load, query count, payload, image layout shift |
| Regression | Find, logging, diary, collections, notifications, follows, comments |

---

## 23. Required documentation and evidence

Follow repository conventions. Suggested files:

| File | Required content |
|---|---|
| `docs/phase-4/PROFILE_CONTRACT_INTEGRATION.md` | Mapping from Phase 1–3 contracts to profile needs |
| `docs/phase-4/PROFILE_UX_SPEC.md` | Restaurant, brand (if approved), and dish page layouts |
| `docs/phase-4/PROFILE_DATA_CONTRACTS.md` | Request/response schemas and data ownership |
| `docs/phase-4/EXPERIENCE_FEED_RULES.md` | Eligibility, sorting, pagination, counts |
| `docs/phase-4/ROUTING_AND_METADATA.md` | Canonical routes, redirects, metadata, sharing |
| `docs/phase-4/TEST_REPORT.md` | Test commands/results and limitations |
| `docs/phase-4/PERFORMANCE_REPORT.md` | Query/payload/render metrics |
| `docs/phase-4/OPEN_DECISIONS.md` | Unresolved product/engineering decisions |

Store safe evidence under `docs/evidence/phase-4/`:
- screenshots of desktop and mobile profiles;
- sample responses with personal data removed;
- route/navigation tests;
- aggregate consistency tests;
- privacy tests;
- performance measurements;
- accessibility findings.

Do not commit private experience text, production user media, tokens, credentials, or personal data exports.

---

## 24. Decisions requiring explicit approval

| Decision ID | Question |
|---|---|
| P4-D01 | Is a separate restaurant brand profile required for the initial release? |
| P4-D02 | Which business fields are verified and safe to display? |
| P4-D03 | Which restaurant and dish dimensions appear by default? |
| P4-D04 | Should dimension counts be shown individually on the page? |
| P4-D05 | Which experience sort options ship initially? |
| P4-D06 | Are branch-specific dish aggregates supported and approved? |
| P4-D07 | Which social actions are available on profiles versus experience cards? |
| P4-D08 | Can users save restaurant/dish entities to collections, or only experiences? |
| P4-D09 | What is the approved entity correction/reporting workflow? |
| P4-D10 | Which profile fields are eligible for public search indexing and share previews? |
| P4-D11 | What cache freshness is acceptable for profile aggregates and ranking context? |
| P4-D12 | What is the required post-log return behavior? |

For every decision provide:
- current implementation/evidence;
- options;
- recommendation;
- user-facing consequences;
- engineering/privacy trade-offs;
- blocker status;
- approval status.

Do not silently introduce brand profiles, menu claims, new entity-follow behavior, or user-generated business-editing workflows.

---

## 25. Definition of Done

Phase 4 is complete only when:

- [ ] Phases 0–3 have been accepted.
- [ ] Restaurant branch and dish profiles resolve to canonical entities.
- [ ] Brand profile exists only if explicitly approved.
- [ ] Restaurant and dish aggregates are correct and independent.
- [ ] Dimension averages use correct per-dimension counts.
- [ ] Ranking context uses the approved Phase 3 API and exact region/metric.
- [ ] Public experiences obey Phase 1 eligibility.
- [ ] Profile counts do not reveal private content.
- [ ] Dish/branch associations are described as logged-at evidence unless availability is verified.
- [ ] Branch and brand ratings are not conflated.
- [ ] Profile pages link correctly to each other.
- [ ] Logging uses the existing experience flow and preserves canonical relationships.
- [ ] Supported social interactions reuse current systems and authorization.
- [ ] Loading, error, empty, partial, and stale states are handled.
- [ ] Routes, canonical redirects, and metadata are correct.
- [ ] Mobile and accessibility criteria pass.
- [ ] Query and render performance are measured.
- [ ] Regression tests for Find, diary, logging, collections, and social pass, or failures are accurately reported.
- [ ] Documentation and evidence are committed.
- [ ] All blocking decisions are approved.

If any P0 criterion is false, report **PARTIALLY COMPLETE** or **BLOCKED**, not complete.

---

## 26. Required final report from Antigravity

Return:

1. **Verdict:** COMPLETE / PARTIALLY COMPLETE / BLOCKED.
2. **Profile types shipped:** branch, brand, dish.
3. **Before-state:** what profile routes and content existed before the phase.
4. **Identity behavior:** canonical IDs, aliases, merges, and branch/brand handling.
5. **Rating display:** aggregates, counts, dimensions, and evidence states.
6. **Ranking context:** exact metrics/regions and freshness behavior used.
7. **Experience feed:** eligibility, sorting, pagination, and interactions.
8. **Dish/branch context:** how logged-at evidence is displayed without claiming menu availability.
9. **Logging:** how profile actions enter the existing logging flow.
10. **Privacy/security:** evidence from authorization and visibility tests.
11. **Responsive/accessibility:** viewports and checks completed.
12. **Performance:** render timings, query counts, payload sizes, and limitations.
13. **Tests:** exact commands and pass/fail counts.
14. **Files changed:** code, tests, migrations, and documentation.
15. **Open issues/deferred work:** clearly separated from completed work.
16. **Phase 5 readiness:** whether personal taste identity can safely build on the existing diary and rating data.

Do not claim a profile is complete because its route renders. Verify its identity, aggregates, privacy, interactions, and end-to-end actions.

---

## 27. Antigravity execution prompt

> Execute MORS Phase 4 — Restaurant & Dish Profiles using this brief and the accepted Phase 0, Phase 1, Phase 2, and Phase 3 deliverables.
>
> Start by reading repository instructions and inspecting existing profile routes, entity models, search links, ranking contracts, experience cards, social interactions, logging flow, and tests. Reuse existing implementations wherever they correctly satisfy the requirements. Do not create parallel profile or review systems.
>
> Build a canonical restaurant branch profile and a canonical dish profile. Build a separate brand profile only if Phase 1 and the approved scope require it. Clearly distinguish a brand from each physical branch.
>
> Use Phase 1 aggregates and Phase 3 ranking APIs. Restaurant pages must use restaurant-level aggregates. Dish pages must use dish-level aggregates. Dimension scores must use their own eligible rating counts. Never calculate ranking scores or public averages independently in frontend components.
>
> Display only verified business facts. Show dishes as community-logged-at a branch unless a trusted menu source establishes current availability. Do not fabricate hours, prices, addresses, cuisine, photos, ingredients, allergens, dietary suitability, or ratings.
>
> Show public experiences only under the exact Phase 1 eligibility and privacy policy. Public counts must not reveal private or ineligible content. Reuse existing likes, comments, follows, collections, notifications, and report behavior only where those systems already support the action.
>
> Connect profile logging actions to the existing food-experience flow. Preserve canonical restaurant/branch and dish relationships. Do not create a second rating form or allow clients to write aggregates.
>
> Integrate profile cards with Find and regional ranking routes. Ensure the same entity, displayed average, eligible count, metric, and region remain consistent across surfaces. Respect Phase 3 freshness and stale-data behavior.
>
> Implement loading, empty, error, partial-data, not-found, and stale states. Use stable pagination for public experiences. Keep the header independent from the full experience history so large profiles remain responsive. Make pages mobile-first and accessible.
>
> Test identity resolution, aggregate correctness, privacy, route behavior, social actions, logging from both profile types, pagination, partial failures, responsiveness, accessibility, and regressions. Measure actual query and render performance.
>
> Keep changes within Phase 4. Do not add restaurant-owner portals, menu management, booking, delivery, AI summaries, paid placement, or unrelated redesign. Stop and report if an earlier-phase contract or product decision is unresolved.
>
> Finish with the required report and state clearly whether Phase 5 can safely begin.

---

## 28. Phase 5 handoff — Personal Taste Identity

Phase 5 may begin when:
- users' eligible restaurant and dish ratings are consistently stored;
- diary experiences and linked dishes are queryable under stable contracts;
- dimension meanings and rating scales are settled;
- public and private experience handling is reliable;
- restaurant and dish identities are canonical;
- profile and diary data can be read without exposing restricted content.

Phase 5 can then build a personal taste identity from a user's own activity. It must distinguish private personal insights from public community rankings and must not treat a user's limited logging history as a complete representation of their preferences.
