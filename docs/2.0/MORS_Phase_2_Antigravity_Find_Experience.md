# MORS — Phase 2 Execution Brief for Antigravity
## Find Experience: Restaurant Discovery & Dish Discovery

**Phase:** 2  
**Priority:** P0 — core user-facing experience  
**Status:** Execute only after Phase 1's data model, rating rules, privacy eligibility, and query contracts are reviewed and accepted  
**Primary outcome:** A reliable, fast, mobile-first discovery experience that helps people find a restaurant to visit or a dish to order, using only verified public MORS data.

---

## 1. Mission

Build the user-facing **Find** experience on top of the data and security foundations delivered by Phase 1.

MORS must make two user intents obvious:

1. **Find Restaurants — Where should I eat?**
2. **Find Food — What should I eat?**

These are related but not interchangeable workflows. A user searching for a restaurant needs restaurant-level information. A user searching for a dish needs dish-level information and, where the data supports it, the restaurants or branches where the community has logged that dish.

The experience must help users move from a discovery result to a useful next action:
- open a restaurant or dish profile;
- inspect ratings and public experiences;
- compare available information;
- log their own experience, where appropriate.

The goal is not to build a large, decorative Explore page. The goal is to make discovery understandable, trustworthy, and useful.

### Core product principle

> Search results must reflect what MORS actually knows. Do not present community logs as confirmed menu availability, do not present a raw average as an authoritative ranking, and do not expose private activity.

---

## 2. Dependencies and mandatory gates

Phase 2 depends on Phase 0 and Phase 1.

### 2.1 Required accepted Phase 0 outputs

- Current product and repository audit.
- Existing navigation and feature behavior.
- Existing search, Explore, place, dish, diary, and logging implementation inventory.
- Current UX/reliability issues and known route failures.
- Repository-specific instructions and test commands.

### 2.2 Required accepted Phase 1 outputs

- Approved restaurant/branch/dish/experience data model.
- Stable distinction between restaurant-level and dish-level ratings.
- Defined public aggregate eligibility rules.
- Verified authorization and RLS behavior.
- Query-safe data access contracts for public restaurants and dishes.
- Agreed location data model and known data-quality limitations.
- Approved schema/migration changes, if any.
- Test coverage for aggregate correctness and privacy.

### 2.3 Stop conditions

Do not start building new result queries or UI around assumptions if:
- Phase 1 has not been accepted.
- It is unclear whether a place is a restaurant brand, a physical branch, or a generic location.
- Public query paths cannot reliably exclude private, draft, deleted, or ineligible content.
- The restaurant or dish statistics returned by the data layer cannot be trusted.
- The current app has unresolved runtime/build failures that make meaningful verification impossible.
- Required location or cuisine data is missing or inconsistent.

When blocked, document the exact dependency, affected feature, evidence, and minimum decision needed. Do not invent data to make the UI appear complete.

---

## 3. Product scope

### 3.1 In scope

- Find landing page and the two explicit modes.
- Restaurant search.
- Dish search.
- Search input behavior, suggestions, empty states, and query clearing.
- Filters that are supported by reliable stored data.
- Sorting that is safe before Phase 3 ranking exists.
- Result cards with correct rating type and rating count.
- Restaurant and dish result detail routes.
- Navigation from results to profiles and to the existing logging flow.
- URL/deep-link state for searches and filters.
- Mobile-first responsive layout.
- Loading, error, no-result, partial-result, and retry states.
- Search query performance, pagination, and abuse protection.
- Accessibility, analytics events, and automated tests.
- Clear separation between explicit search and browse/discovery.

### 3.2 Out of scope

Do not implement these in Phase 2:

- Telangana-wide, district-wide, or locality-wide leaderboards.
- The Phase 3 confidence-adjusted regional ranking engine.
- “Best in Hyderabad”, “Top in Telangana”, or equivalent claims unless Phase 3 explicitly approves and powers them.
- Personalized AI recommendations or taste-profile matching.
- AI-generated descriptions or inferred food attributes.
- Food image recognition.
- Restaurant booking, table reservations, delivery, payments, or ordering.
- Restaurant-owner claimed profiles or owner dashboards.
- Real-time menu availability unless a verified menu data source already exists and is approved.
- Map-based route planning or distance claims without reliable coordinates and a tested location service.
- Replacing the complete navigation system or redesigning unrelated screens.
- A new search infrastructure service such as Elasticsearch/Algolia unless measured limitations justify it and the owner approves the added operational cost.

### 3.3 First-release geography

Use the accepted Phase 1 launch scope. The current product direction proposes Telangana first, but do not hardcode this assumption in multiple components or queries.

Represent geography through the approved location model and configuration. If a region is not supported by reliable data, say so rather than implying complete coverage.

---

## 4. Information architecture

### 4.1 Find entry point

The Find entry point must immediately communicate the two jobs it supports.

Recommended structure:

- Page heading: **Find**
- Primary mode selector:
  - **Restaurants**
  - **Food**
- Search field whose placeholder and helper text change with the selected mode.
- Relevant filters for the selected mode.
- Search results or a useful browse state when no query has been entered.
- Clear route to log an experience, without turning the Find page into a logging form.

Do not make the user discover the distinction by trial and error.

### 4.2 Mode A — Find Restaurants

Purpose: find a restaurant or specific branch to visit.

The search experience should support, where data exists:
- restaurant name;
- branch name or area identifier;
- locality/neighbourhood;
- city/town;
- cuisine or food category;
- known aliases and common spelling variations.

Restaurant results must use restaurant-level information. Never show a dish average as the restaurant rating.

### 4.3 Mode B — Find Food

Purpose: discover a dish to eat.

The search experience should support, where data exists:
- canonical dish name;
- alias or alternate spelling;
- regional name/transliteration;
- dish category or cuisine;
- restaurant/branch context where users have logged the dish.

A dish result should answer:
- What is the dish?
- What is the community rating, if enough eligible data exists to display it?
- How many eligible ratings contribute?
- At which restaurants or branches has the community logged it, if that relationship is verified?
- What can the user open next?

Do not claim that a restaurant currently serves a dish merely because a user logged it there in the past. Use copy such as **“Logged here by the community”** rather than **“Available here”**, unless menu availability is independently verified.

### 4.4 Search versus Explore

Keep the distinction explicit.

| Experience | User mindset | Primary behavior |
|---|---|---|
| Search | “I know roughly what I want to find.” | Query, filter, inspect exact results |
| Explore/browse | “I am open to ideas.” | Browse a small set of useful discovery entry points without typing |

Do not build two pages that show the same cards with different headings.

For Phase 2:
- Search is the primary, fully functional capability.
- Browse is a lightweight entry state, not a separate recommendation engine.
- Browse sections may use existing, verified public metadata and deterministic queries.
- Do not call a section “Top”, “Best”, “Trending”, or “Popular” unless its selection rule is defined, truthful, and supported by the approved ranking/aggregation logic.
- If Phase 3 ranking is not ready, use neutral labels such as “Recently logged”, “Browse cuisines”, or “Explore food categories”, provided those queries are supported.
- If the data is too sparse to populate a browse section safely, omit the section and show a useful search-first state.

---

## 5. User journeys

Implement and test these journeys end to end.

### Journey 1 — Find a restaurant by name

1. User opens Find.
2. Restaurants mode is selected.
3. User enters a restaurant name.
4. Search suggestions/results appear.
5. User selects the correct restaurant or branch.
6. Restaurant profile opens.
7. User can inspect restaurant information and restaurant-level rating.
8. User can view public experiences and continue to the existing logging flow.

Acceptance:
- Search is not case-sensitive unless the underlying language requires special handling.
- Leading/trailing whitespace does not break results.
- A failed request does not leave the page loading forever.
- Selecting one result opens the correct profile, not a similarly named branch.

### Journey 2 — Find a restaurant by area or cuisine

1. User switches to Restaurants.
2. User enters a locality, city, or cuisine.
3. User may apply available filters.
4. Results identify the location and cuisine clearly.
5. User opens a restaurant profile.

Acceptance:
- A locality query searches the approved structured location fields, not captions or arbitrary review text.
- Cuisine filters use the approved cuisine taxonomy/field.
- If a filter is unsupported or incomplete, it is not shown as though it were reliable.
- No distance is shown unless coordinates and distance calculation are trustworthy.

### Journey 3 — Find a dish by name

1. User selects Food mode.
2. User searches a dish.
3. Search resolves aliases to canonical dishes where appropriate.
4. Results show dish identity, correct dish-level average/count, and relevant restaurant context.
5. User opens the dish profile.

Acceptance:
- Alias search does not create duplicate canonical dish results.
- Different dishes with similar names are not incorrectly merged.
- Original user-entered names remain preserved in experience history.
- Restaurant ratings are not used as dish ratings.

### Journey 4 — Discover a dish through restaurant context

1. User searches or opens a restaurant.
2. User inspects dishes logged at that restaurant/branch.
3. User opens a dish profile or dish-specific experience context.
4. User can distinguish branch-specific evidence from a dish's overall community rating.

Acceptance:
- The UI makes clear whether a score is for the dish overall or the dish at a specific branch.
- No branch-level dish score is fabricated from the restaurant's overall score.
- If Phase 1 did not approve dish-at-branch aggregates, do not show one.

### Journey 5 — No search results

1. User submits a query that returns no result.
2. The UI states that no matching public result was found.
3. It offers safe next actions, such as:
   - check spelling;
   - remove a filter;
   - search the other mode;
   - log an experience or suggest a new place/dish through an existing supported flow.

Acceptance:
- No-result state is distinct from an API failure.
- The app does not create duplicate place/dish records automatically.
- Any create/suggest action uses the existing approved validation and moderation flow.

### Journey 6 — Network or server failure

1. User searches.
2. Request fails or times out.
3. The page shows a recoverable error and Retry action.
4. User can retry without losing the query or selected filters.

Acceptance:
- No infinite spinner.
- No blank white results area.
- No false “no results” message for a failed request.
- Existing query state remains intact.

### Journey 7 — Open a search URL directly

1. User shares or reloads a search URL.
2. App restores mode, query, and supported filters.
3. Results are fetched securely and rendered.
4. Back/forward navigation behaves consistently.

Acceptance:
- URL state and UI state do not diverge.
- Unsupported or malformed filter values are ignored or rejected safely.
- Private content is never exposed through a crafted URL.

---

## 6. Search behavior and relevance

### 6.1 Search quality principles

Search should be predictable before it becomes clever.

Implement a staged relevance model:

1. Exact canonical-name match.
2. Exact alias match.
3. Prefix match.
4. Token/word match.
5. Safe fuzzy match for minor spelling differences, if supported by the current database.
6. Location or taxonomy match when the query is clearly a location/category.

The exact ordering and scoring must be documented and tested against representative cases.

Avoid a complex opaque score that cannot be explained or debugged.

### 6.2 Query normalization

Evaluate and implement normalization appropriate to the languages actually supported by the product:

- trim leading/trailing whitespace;
- collapse repeated spaces;
- case normalization;
- punctuation normalization where safe;
- Unicode normalization;
- transliteration/alias lookup only when backed by explicit alias data;
- preserve the original query for display and analytics where permitted.

Do not use destructive normalization that makes distinct local-language words indistinguishable.

Do not claim multilingual search is complete if only English aliases exist.

### 6.3 Query intent and mode separation

A query submitted in Restaurants mode searches restaurant/place data. A query submitted in Food mode searches dish data.

Do not run one broad query across restaurant names, dish names, captions, comments, and user profiles and then mix all result types.

Optional cross-mode suggestion:
- If no restaurant result exists but a matching dish does, the UI may offer “Try searching Food for …”.
- If no dish result exists but a restaurant match is strong, the UI may offer “Try searching Restaurants for …”.
- This must be a suggestion, not a silent mode switch.

### 6.4 Result ordering before Phase 3

Phase 2 must not implement the regional ranking engine early.

Recommended ordering:
- primary: relevance to the query;
- secondary: exactness and match quality;
- tertiary: deterministic tie-breaker (for example, entity name or stable identifier).

Optional additional sort modes should be added only if Phase 1 provides reliable inputs and the product definition clearly explains them.

Do not default to raw average rating. A high score with two ratings should not automatically appear first. Do not label a relevance-ordered result list as a “best” list.

### 6.5 Suggestions/autocomplete

Autocomplete is useful only if it is accurate and responsive.

Requirements:
- Debounce network requests using the existing approved client pattern.
- Cancel or ignore stale requests so older responses cannot overwrite newer queries.
- Use a sensible minimum query length based on the search method and language.
- Limit suggestion count.
- Support keyboard navigation and screen readers.
- Escape/submit behavior must be predictable.
- Do not create a request for every keystroke without throttling/debouncing.
- Do not show suggestions based on private experiences or private places.
- Do not reveal private query history.
- Suggestions should identify their type when multiple entity types are ever shown.

If the current stack does not support good autocomplete cheaply, ship reliable submit-based search first rather than compromising correctness.

---

## 7. Filters and controls

Only expose filters backed by reliable structured data.

### 7.1 Restaurant filters

Candidate filters:
- city/town;
- locality/neighbourhood;
- cuisine;
- restaurant category/type;
- price range, only if stored consistently and defined;
- open now, only if current hours are verified and maintained.

Do not expose all candidate filters automatically. Audit field completeness and quality first.

### 7.2 Food filters

Candidate filters:
- cuisine;
- dish category;
- dietary tags, only if explicitly user-verified or sourced reliably;
- restaurant/branch context;
- city/locality context.

Do not infer dietary suitability from a dish name, image, or user caption.

### 7.3 Filter behavior

- Filters must be visible and understandable.
- Active filters must be removable individually.
- Provide a clear “Clear all” action when multiple filters are active.
- Result count, if shown, must reflect the actual query and filters.
- Filters must be reflected in URL state.
- Empty filter results must show which filters are active and offer a way to clear them.
- Do not silently drop a filter when navigation occurs.
- Do not expose filters that return unreliable or misleading data.

---

## 8. Result card requirements

Cards must be scannable and must not imply unsupported facts.

### 8.1 Restaurant result card

Show, where verified:
- restaurant name;
- branch name or locality, where relevant;
- city/area;
- cuisine or category;
- image, if a valid image exists;
- restaurant overall rating;
- eligible rating count;
- a clear action to open the restaurant profile.

Rules:
- Rating and count must come from restaurant-level aggregates.
- Do not display a rating if the aggregate is unavailable or ineligible.
- Do not display a count that includes private/ineligible records.
- Never substitute a dish rating.
- Do not show “open” status without a trustworthy current-hours source.
- Do not invent price labels, cuisine, address, or images.

### 8.2 Dish result card

Show, where verified:
- canonical dish name;
- category/cuisine, if available;
- image, if a valid image exists;
- dish overall rating;
- eligible dish rating count;
- relevant restaurant/branch context, if supported;
- a clear action to open the dish profile.

Rules:
- Rating/count must come from the dish-level aggregate.
- If the result includes a restaurant context, make clear whether it is a logged-at relationship, an approved branch-specific aggregate, or verified menu availability.
- Do not turn a community log into a menu claim.
- Do not display a dish rating as if it is the restaurant's rating.

### 8.3 Card density and responsive behavior

- Mobile is the baseline, not a smaller desktop afterthought.
- Use readable touch targets and sufficient spacing.
- Keep primary information visible without excessive card height.
- Avoid placing every metadata field on every card.
- Use consistent card patterns across modes while preserving the different semantics.
- Avoid layout shifts when images load.
- Provide a graceful fallback for missing images.
- Do not use empty image placeholders that look like broken content.

---

## 9. Search result pages and detail navigation

Search results should lead to dedicated profile/detail routes, not overloaded modal stacks.

Use existing route conventions where possible.

### Restaurant profile must support, according to existing approved scope:
- identity and branch context;
- location details;
- restaurant-level score and eligible count;
- per-dimension restaurant ratings if available;
- public food experiences;
- dishes logged at this restaurant/branch, if relationships are reliable;
- a route into the existing log-experience flow.

### Dish profile must support, according to existing approved scope:
- canonical dish identity and aliases, where useful;
- dish-level score and eligible count;
- public experiences containing the dish;
- restaurant/branch contexts where logged;
- a clear distinction between overall dish rating and branch-specific evidence;
- a route into the existing log-experience flow.

Phase 2 may connect to existing profile routes and repair only what is needed for discovery. If complete restaurant/dish profiles are explicitly Phase 4, implement the minimum detail surface needed for search results and document remaining work for Phase 4. Do not silently absorb all of Phase 4 into this phase.

---

## 10. Data access and API contracts

### 10.1 General rules

- Reuse existing repository data-access conventions.
- Keep database access server-side where required by the current security architecture.
- Centralize query validation and authorization.
- Use Phase 1 public eligibility rules.
- Do not expose raw database errors or internal identifiers unnecessarily.
- Do not return private source records to the client.
- Return typed, bounded response objects.
- Add pagination and maximum page sizes.
- Validate query strings and filter values.
- Apply rate limits using the existing approved mechanism.
- Never let the client write or override aggregate values.

### 10.2 Suggested logical contracts

These are logical behaviors, not mandatory endpoint names.

**Restaurant search**
- input: query, optional supported location filters, optional cuisine/category filters, pagination cursor;
- output: restaurant/branch identity, safe display fields, restaurant aggregate fields, next cursor.

**Dish search**
- input: query, optional supported cuisine/category/location filters, pagination cursor;
- output: canonical dish identity, safe display fields, dish aggregate fields, supported logged-at restaurant/branch context, next cursor.

**Search suggestions**
- input: mode, partial query;
- output: bounded list of safe suggestions for that mode.

**Browse landing data**
- input: mode and optional supported location context;
- output: small number of curated/deterministic discovery sections from eligible public data, or an empty state.

### 10.3 Response contract

Document:
- required versus nullable fields;
- rating type and its meaning;
- rating count and eligibility definition;
- entity identity (branch versus brand, canonical dish);
- whether a restaurant association is verified menu availability or community logged-at evidence;
- pagination semantics;
- sorting semantics;
- cache/freshness expectations.

Do not return one ambiguous field called `rating` if it could mean restaurant rating in one response and dish rating in another. Use clearly named fields or strongly typed result variants.

### 10.4 Pagination

- Use the existing pagination convention where possible.
- Prefer cursor pagination for large or changing result sets if supported.
- Avoid unbounded result queries.
- Ensure stable ordering so items do not randomly duplicate or disappear between pages.
- Test the final page and empty page behavior.
- Do not fetch all matching entities and paginate only in the browser.

### 10.5 Caching

- Cache only data that is safe to share publicly.
- Never cache private experience content in a public cache.
- Define invalidation or acceptable staleness for rating counts and aggregates.
- Do not cache user-specific permissions as shared responses.
- Avoid excessive client caching that makes recently updated ratings appear inconsistent.
- Measure before introducing a separate cache service.

---

## 11. Performance and reliability

Phase 2 is not complete if search technically works but feels broken.

Measure:
- search request latency;
- query execution time;
- number of database queries per result page;
- duplicate requests;
- payload size;
- image loading behavior;
- pagination consistency;
- error and timeout frequency.

Requirements:
- No unbounded database scans for common searches.
- Add indexes only when justified by query patterns and explain/query-plan evidence.
- Avoid N+1 queries for rating aggregates or restaurant context.
- Avoid fetching large experience bodies for search cards.
- Use bounded server-side limits.
- Cancel/ignore stale autocomplete requests.
- Provide a useful timeout/error state.
- Preserve query and filters during retry.
- Prevent duplicate submit actions while a request is in progress.
- Ensure slow image loading does not block result text or actions.

Suggested targets are engineering goals, not claims:
- Search submit should feel responsive on an ordinary mobile connection.
- The first useful result state should not wait for every optional image.
- Performance should be measured against a documented local/staging environment with realistic data volume.
- Do not declare an SLA until actual measurement and deployment conditions justify one.

---

## 12. UX states and interaction behavior

Every search mode must have all the following states designed and implemented:

1. Initial state with no query.
2. Typing/autocomplete state, if autocomplete is shipped.
3. Loading state.
4. Results state.
5. Empty/no-results state.
6. Error state.
7. Retry state.
8. Active-filter state.
9. No-results-with-filters state.
10. Pagination/loading-more state.
11. Missing-image fallback.
12. Partial data state (for example, entity exists but has no eligible ratings).

### UX rules

- Loading indicators must communicate that work is happening; do not leave unexplained “Rendering…” or blank space.
- Use skeletons only when the expected content layout is known.
- Keep the search field available when results are shown.
- Preserve input after a failed request.
- Make mode switching clear and predictable.
- Make active filters easy to inspect and remove.
- Do not show a rating placeholder such as `0.0` when there are no ratings.
- Say “No ratings yet” rather than implying a zero score.
- Distinguish “No matching results” from “Could not load results.”
- Show a clear next action in every empty state.
- Avoid decorative animations that delay interaction or hide content.
- Respect reduced-motion preferences.
- Do not add new navigation items without a product reason.

---

## 13. Accessibility and usability

- Search field has a programmatic label.
- Mode selector is operable by keyboard and assistive technology.
- Autocomplete follows accessible combobox/listbox behavior if implemented.
- Result cards have meaningful accessible names.
- Interactive elements are not nested incorrectly.
- Keyboard focus is visible and predictable.
- Filters are keyboard-accessible.
- Color is not the only way to convey rating or selected state.
- Images have suitable alternative text or are decorative.
- Error and result-count updates are announced appropriately.
- Text contrast and touch target sizes meet the project's accessibility standard.
- Test on mobile viewport sizes and with keyboard navigation.

---

## 14. Analytics and product learning

Instrument a minimal set of events so the team can understand whether Find works.

Suggested events:
- `find_opened`
- `find_mode_selected`
- `find_search_submitted`
- `find_suggestion_selected`
- `find_filter_applied`
- `find_filter_removed`
- `find_results_loaded`
- `find_no_results`
- `find_result_opened`
- `find_search_error`
- `find_log_experience_started`

Capture only what is necessary:
- mode;
- filter type;
- result count bucket;
- latency bucket;
- result entity type;
- whether a result was opened.

Privacy requirements:
- Do not log private review text, private experience content, credentials, tokens, or sensitive personal data.
- Avoid storing raw search queries indefinitely without a documented purpose and retention policy.
- Do not make analytics a prerequisite for search functionality.
- Follow existing consent and telemetry rules in the repository.

Use analytics to identify:
- searches with no results;
- mode confusion;
- searches that return results but no profile opens;
- filters that repeatedly lead to empty states;
- slow queries;
- failure rates.

Do not optimize for clicks alone. A click does not prove that a restaurant recommendation was useful.

---

## 15. Security and abuse prevention

Verify that:
- search returns only public, eligible entities and aggregates;
- private experience content cannot be inferred from result counts;
- public restaurant/dish profiles do not expose private contributor details;
- query parameters cannot bypass visibility or moderation checks;
- autocomplete does not leak hidden names or locations;
- result pagination cannot expose records by changing cursors;
- search endpoints enforce input length and page-size limits;
- rate limiting uses the approved existing mechanism;
- database errors and internal schema details are not returned to clients;
- SQL is parameterized or safely constructed through the current data-access layer;
- user-supplied query text is rendered safely;
- images and external URLs are handled according to existing security rules.

Abuse tests must include:
- extremely long query;
- empty/whitespace query;
- malformed cursor;
- repeated rapid requests;
- SQL-like input;
- markup/script-like input;
- crafted filters;
- attempts to search for private or moderated content.

Do not create a new user tracking mechanism just to rate-limit search if the repository already has an approved approach.

---

## 16. Implementation workstreams

### Workstream A — Phase 1 contract integration

1. Read accepted Phase 1 documents.
2. Identify the approved query paths and public aggregates.
3. Map existing search/Explore components to the accepted data model.
4. Identify routes that can be reused.
5. Record gaps and blockers before changing the UI.

**Deliverable:** `docs/phase-2/PHASE_1_CONTRACT_INTEGRATION.md`

### Workstream B — UX and interaction specification

1. Document Find landing state.
2. Document Restaurants and Food modes.
3. Define each mode's search placeholder, filters, card fields, and detail route.
4. Design all loading, error, empty, and partial-data states.
5. Define mobile and desktop behavior.
6. Review Search versus Explore boundaries.

**Deliverable:** `docs/phase-2/FIND_UX_SPEC.md`

### Workstream C — Search query design

1. Document supported fields for each mode.
2. Define normalization and alias behavior.
3. Define relevance order and deterministic tie-breakers.
4. Define filters and field-quality thresholds.
5. Define pagination and response shapes.
6. Measure query plans and identify index requirements.
7. Build test cases before tuning fuzzy search.

**Deliverable:** `docs/phase-2/SEARCH_SPEC.md`

### Workstream D — Data access and backend

1. Implement or repair restaurant search data access.
2. Implement or repair dish search data access.
3. Add suggestion queries only if they meet correctness and performance criteria.
4. Apply centralized public eligibility.
5. Return correct aggregate type, count, and context.
6. Validate and bound all inputs and outputs.
7. Add authorization, rate limiting, and pagination.
8. Add query/index changes only when justified.

**Deliverable:** tested server-side search contracts and any required migration/index changes.

### Workstream E — Find UI

1. Implement Find landing page.
2. Implement clear mode selection.
3. Implement search input and query state.
4. Implement supported filters.
5. Implement restaurant result cards.
6. Implement dish result cards.
7. Implement loading, empty, error, retry, and partial states.
8. Connect result navigation to the correct detail routes.
9. Connect the existing log-experience path.
10. Preserve responsive behavior and accessibility.

**Deliverable:** complete Find experience in the application.

### Workstream F — Browse/Explore entry state

1. Inspect available public data and metadata coverage.
2. Select only a few useful browse sections.
3. Use deterministic and explainable data selection.
4. Use neutral labels unless an approved ranking system supports stronger claims.
5. Omit sections with insufficient or poor-quality data.
6. Ensure every browse item opens a relevant profile.

**Deliverable:** a lightweight browse state that does not duplicate Search or simulate Phase 3 rankings.

### Workstream G — QA and performance

1. Test end-to-end journeys.
2. Test privacy and abusive inputs.
3. Test keyboard and mobile behavior.
4. Test slow networks and request failures.
5. Measure query performance.
6. Verify URL and browser history behavior.
7. Verify all result links and route states.
8. Run existing unit, integration, build, and e2e test commands.

**Deliverable:** `docs/phase-2/TEST_REPORT.md` and evidence.

---

## 17. Priority order

### P0 — Required for Phase 2 completion

1. Find landing page with clear Restaurants and Food modes.
2. Working restaurant search using verified public data.
3. Working dish search using verified public data.
4. Correct rating type and count on each result.
5. Correct restaurant/branch and dish identity in results.
6. Result navigation to the correct detail surface.
7. Loading, empty, error, retry, and partial-data states.
8. Privacy-safe result queries.
9. Mobile-first layout and accessible core controls.
10. Search URL state and reliable pagination.
11. End-to-end tests for primary journeys.

### P1 — Valuable if data quality and reliability support it

1. Autocomplete and query suggestions.
2. Alias and transliteration support beyond existing reliable aliases.
3. Additional cuisine/category/location filters.
4. Lightweight Explore/browse sections.
5. More refined relevance tuning.
6. Search analytics and no-result insights.
7. Performance improvements based on measured bottlenecks.

### Explicitly defer

- Regional leaderboards and “best near me” rankings.
- Personalized recommendations.
- AI semantic search.
- Map-based discovery and distance ranking.
- Unverified real-time opening status.
- Menu availability claims without a trusted menu source.
- Advanced dietary filters based on inferred attributes.

---

## 18. Acceptance criteria

### Restaurants mode

- [ ] A user can search by restaurant name.
- [ ] Supported branch, locality, city, and cuisine fields work as documented.
- [ ] Result identity distinguishes brand and branch where the model requires it.
- [ ] Result rating is restaurant-level only.
- [ ] Eligible rating count is accurate.
- [ ] Results never include private or ineligible entities.
- [ ] Selecting a result opens the correct detail route.
- [ ] No-result and error states are distinct.
- [ ] Query and filters survive retry and URL reload.

### Food mode

- [ ] A user can search by canonical dish name.
- [ ] Approved aliases resolve to the correct canonical dish.
- [ ] Similar but distinct dishes remain distinct.
- [ ] Result rating is dish-level only.
- [ ] Eligible rating count is accurate.
- [ ] Restaurant context is accurately labelled as logged-at or verified availability.
- [ ] No restaurant rating is substituted for a dish rating.
- [ ] Selecting a result opens the correct detail route.
- [ ] No-result and error states are distinct.

### UX and reliability

- [ ] Find immediately communicates the two modes.
- [ ] Search and browse have distinct purposes.
- [ ] All required UX states exist.
- [ ] Mobile layout is usable without horizontal overflow.
- [ ] Keyboard focus and controls work.
- [ ] Search requests are bounded and stale requests cannot overwrite current results.
- [ ] URL state behaves consistently.
- [ ] Pagination is stable and does not duplicate or omit results.
- [ ] No unexplained infinite loading state remains.

### Engineering and privacy

- [ ] Phase 1's public eligibility rule is reused.
- [ ] Client cannot write or manipulate aggregates.
- [ ] Search does not expose private source content or hidden entity information.
- [ ] Query input and pagination are validated.
- [ ] Relevant security and abuse tests pass.
- [ ] Query performance has been measured and documented.
- [ ] Existing diary, logging, social, and collection workflows still work.
- [ ] No unrelated database or app architecture rewrite occurred.

---

## 19. Required files and evidence

Follow repository conventions. Suggested documentation paths:

| File | Contents |
|---|---|
| `docs/phase-2/PHASE_1_CONTRACT_INTEGRATION.md` | How Phase 2 uses Phase 1's accepted data and security contracts |
| `docs/phase-2/FIND_UX_SPEC.md` | Information architecture, user journeys, responsive layouts, UX states |
| `docs/phase-2/SEARCH_SPEC.md` | Modes, fields, normalization, relevance, filters, pagination |
| `docs/phase-2/API_CONTRACTS.md` | Request/response types, validation, error model, caching |
| `docs/phase-2/EXPLORE_SCOPE.md` | Search vs browse boundary and any browse sections shipped |
| `docs/phase-2/TEST_REPORT.md` | Commands, pass/fail results, device/viewport coverage |
| `docs/phase-2/PERFORMANCE_REPORT.md` | Query plans, timings, payload sizes, known limits |
| `docs/phase-2/OPEN_ISSUES.md` | Deferred issues, missing data, unresolved decisions |

Store safe evidence under `docs/evidence/phase-2/`:
- representative search test cases;
- query plans with secrets and private data removed;
- screenshots of key states and responsive sizes;
- automated test output;
- accessibility findings;
- performance measurements.

Do not commit real user private content, production data exports, credentials, tokens, or secrets.

---

## 20. Required test matrix

| Area | Test cases |
|---|---|
| Restaurant query | Exact name, partial name, case variation, extra spaces, alias, typo |
| Dish query | Exact canonical name, alias, regional alias, typo, similar distinct names |
| Location | Supported city, locality, unknown locality, ambiguous name |
| Filters | Each filter alone, combined filters, clear one, clear all, no results |
| Relevance | Exact versus prefix, alias versus fuzzy, stable ties |
| Aggregates | Restaurant rating, dish rating, missing ratings, zero eligible ratings |
| Privacy | Private, followers-only, draft, rejected, deleted, blocked/suspended cases per Phase 1 policy |
| Pagination | First page, middle page, last page, repeated cursor, malformed cursor |
| Race conditions | Slow earlier query returns after newer query; rapid mode switch |
| Failure | Timeout, server error, offline/reconnect, retry |
| Security | Long input, SQL-like input, script-like input, invalid filters |
| Accessibility | Keyboard navigation, screen reader labels, focus visibility, touch targets |
| Responsive | Small mobile, larger mobile, tablet, desktop |
| Regression | Diary, logging, profile, collections, follows, and existing navigation |

Use realistic but non-sensitive test fixtures. Clearly label any illustrative data.

---

## 21. Explicit product and engineering decisions

Record these decisions in `docs/phase-2/OPEN_ISSUES.md` or the repository's decision register:

| Decision ID | Question |
|---|---|
| P2-D01 | Which fields are reliable enough to search for restaurants and branches? |
| P2-D02 | Which canonical dish fields and aliases are searchable? |
| P2-D03 | What is the minimum query length for each supported language/search method? |
| P2-D04 | Which filters meet the data-quality threshold for release? |
| P2-D05 | Is autocomplete reliable enough to ship now, or should submit-based search ship first? |
| P2-D06 | Which browse sections can be populated without implying rankings? |
| P2-D07 | What exact copy distinguishes “logged at this restaurant” from “available here”? |
| P2-D08 | Which result detail routes already exist and which minimum surfaces are required now? |
| P2-D09 | What are the accepted pagination and cache freshness rules? |
| P2-D10 | What latency and error targets are realistic for the current deployment? |

For each decision include:
- evidence;
- options;
- recommendation;
- trade-offs;
- blocker status;
- approval status.

Do not invent hours, prices, menus, cuisine tags, dietary facts, ratings, or location data to complete a card.

---

## 22. Phase 2 Definition of Done

Phase 2 is complete only when:

- [ ] Phase 0 and Phase 1 have been accepted.
- [ ] Find has two clear modes: Restaurants and Food.
- [ ] Both modes perform real searches against verified data.
- [ ] Result types and ratings are semantically correct.
- [ ] Search results use privacy-safe public data only.
- [ ] Users can open the correct result detail surface.
- [ ] The primary search flows work on mobile and desktop.
- [ ] Search, no-result, loading, failure, retry, and partial states are complete.
- [ ] URL state, pagination, and browser navigation behave correctly.
- [ ] Filters shown in the UI are backed by reliable data.
- [ ] Explore/browse is clearly distinct from explicit Search, or deliberately deferred.
- [ ] No premature Phase 3 ranking claims or systems have been added.
- [ ] Security, regression, and end-to-end tests pass, or failures are reported accurately.
- [ ] Performance is measured and bottlenecks are documented.
- [ ] Existing logging, diary, social, and collection flows still work.
- [ ] Documentation and evidence are committed.
- [ ] All blocking decisions have owner approval.

If any P0 criterion is false, report **PARTIALLY COMPLETE** or **BLOCKED**, not complete.

---

## 23. Required final report from Antigravity

Return a report with:

1. **Verdict:** COMPLETE / PARTIALLY COMPLETE / BLOCKED.
2. **Before-state:** what Find, Search, Explore, and result routes did before the work.
3. **Implemented behavior:** Restaurants mode, Food mode, filters, suggestions, browse sections.
4. **Data contracts:** exact data paths and aggregate fields used.
5. **Privacy:** evidence that private/ineligible data is excluded.
6. **UX:** screenshots or evidence for initial, loading, results, empty, error, and mobile states.
7. **Performance:** measured query times, query plans, page sizes, and known limitations.
8. **Tests:** exact commands and pass/fail results.
9. **Files changed:** exact file list grouped by backend, UI, tests, docs, and migrations.
10. **Deferred items:** what remains for Phase 3 or Phase 4.
11. **Known issues:** no hiding incomplete or unreliable behavior.
12. **Phase 3 readiness:** whether search has stable location and entity contracts for regional ranking.

Do not claim a feature works based solely on source code existing. Verify it through the application and tests.

---

## 24. Antigravity execution prompt

> Execute MORS Phase 2 — Find Experience using this brief and the accepted Phase 0 and Phase 1 deliverables.
>
> First inspect the actual repository instructions, current Find/Search/Explore implementation, routes, Phase 1 data contracts, public query paths, and existing tests. Do not assume that the app has no search implementation; identify what exists and repair/reuse it before creating new components or services.
>
> Build two explicit user workflows:
> - Restaurants: help users find a restaurant or branch.
> - Food: help users find a dish and understand its community evidence.
>
> Keep the rating types separate. Restaurant results must use restaurant-level aggregates; dish results must use dish-level aggregates. Show eligible rating counts. Distinguish a dish that the community has logged at a restaurant from a dish that is verified as currently available there.
>
> Implement only filters backed by reliable structured data. Search must be relevance-based and deterministic. Do not implement Phase 3 regional rankings, “best near me” claims, AI recommendations, or unverified opening/menu information.
>
> Reuse the accepted Phase 1 public eligibility and authorization rules. Never expose private, followers-only, draft, rejected, deleted, or otherwise ineligible content through results, suggestions, counts, or browse sections. Do not let clients write aggregates.
>
> Design and implement all essential states: initial, loading, results, no results, error, retry, partial data, and pagination. Preserve the query and filters through retry and URL navigation. Make the experience mobile-first and accessible.
>
> Build the search specifications and data contracts before query tuning. Use the repository's existing stack and patterns. Do not introduce a search provider, cache service, testing framework, or new dependency without measured need and approval.
>
> Test realistic search cases, privacy boundaries, race conditions, pagination, failure/retry, accessibility, responsive layouts, and regressions in diary/logging/social/collections. Measure query performance and document actual results.
>
> Keep changes within Phase 2. Do not redesign unrelated application areas. Do not fabricate data to fill empty cards or sections. Stop and report if a Phase 1 contract or product decision is unresolved.
>
> Finish with the required final report and state explicitly whether Phase 3 can safely begin.

---

## 25. Phase 3 handoff — Regional Ranking Engine

Phase 3 may begin when Phase 2 provides:

- stable restaurant and branch search identities;
- stable canonical dish search identities;
- correct restaurant and dish aggregates/counts in result contracts;
- reliable structured location fields and documented coverage;
- privacy-safe public data access;
- query patterns and indexes understood well enough to support ranking;
- no unresolved ambiguity about whether a result is a brand, branch, dish, or dish-at-branch context.

Phase 3 will introduce the regional ranking engine. It should build on the accepted Phase 1 aggregate model and Phase 2 entity/location contracts. It must not retrofit a ranking formula into loosely typed search results.
