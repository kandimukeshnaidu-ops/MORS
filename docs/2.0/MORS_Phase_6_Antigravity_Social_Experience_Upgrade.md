# MORS — Phase 6 Execution Brief for Antigravity
## Social Experience Upgrade: Food Community, Feed, Interactions, and Trust

**Phase:** 6  
**Priority:** P1 — core retention and community experience  
**Status:** Execute only after Phases 0–5 are reviewed and accepted  
**Primary outcome:** Make MORS a useful social food-journaling community where people can share real food experiences, discover what people they follow are eating, and interact safely—without turning the product into a generic social-media clone.

---

## 1. Mission

Upgrade the social experience around the central MORS object: the **food experience**.

MORS is not meant to be another general-purpose social network. Its social interactions should help users:
- share meals, dishes, restaurant visits, and food discoveries;
- follow people whose food experiences they find useful;
- see relevant experiences from people they follow;
- react to and discuss a food experience;
- save useful experiences into collections;
- receive notifications about meaningful activity;
- control who can see and interact with their content.

The social layer should strengthen the value of the food diary and discovery system. It should not compete with them.

**Core principle:**

> The food experience is the centre of the social system. Likes, comments, follows, and notifications exist to make food experiences more useful—not to become the product themselves.

Phase 0 may have found that many social features already exist. Antigravity must audit and improve those implementations, not assume they are missing and rebuild them.

---

## 2. Product boundaries

### 2.1 In scope

- Home/social feed based on the existing follow graph and eligible food experiences.
- Clear feed behavior and ordering.
- Following and unfollowing users.
- User profile social context and follow state.
- Likes/reactions on food experiences, using the existing approved model.
- Comments and replies, if already supported or approved.
- Notifications for meaningful social activity.
- Notification preferences and read/unread behavior.
- Save-to-collection integration.
- Share behavior for public experiences.
- Blocking, muting, reporting, and moderation paths according to accepted policy.
- Privacy controls for public and followers-only content.
- Feed loading, pagination, refresh, empty, and failure states.
- Anti-spam and abuse controls.
- Accessibility, performance, analytics, and regression testing.

### 2.2 Out of scope

Do not build these in Phase 6:

- Direct messages or private chat.
- Stories, reels, short-form video feeds, or ephemeral posts.
- Live streaming.
- General-purpose text status updates unrelated to food.
- User-to-user marketplace or payments.
- Public user popularity leaderboards.
- Follower-count competitions or engagement badges.
- AI-generated comment replies or feed summaries.
- Personalized feed ranking based on opaque engagement algorithms.
- Ads or sponsored posts.
- Restaurant-owner promotion tools.
- A new social graph or separate interaction database if the existing system already supports the feature.
- Automatically publishing Personal Taste Identity insights.
- Exposing private taste insights through social cards, feeds, or notifications.

Do not add a feature just because social platforms commonly have it.

---

## 3. Mandatory prerequisites

Read and verify accepted deliverables before implementation.

### Phase 0 — Repository and product audit
- Existing home feed and social behavior.
- Current follow, like, comment, notification, block, and collection systems.
- Existing route and component structure.
- Current bugs, loading states, and known reliability problems.
- Existing security policies and moderation capability.

### Phase 1 — Rating architecture and data model
- Canonical food-experience model.
- User ownership and visibility rules.
- Public aggregate eligibility.
- Rating ownership and separation.
- RLS and server-side authorization.

### Phase 2 — Find experience
- Stable restaurant/dish identities and routes.
- Search-to-profile and search-to-logging flows.
- Existing experience cards and discovery entry points.

### Phase 3 — Regional ranking engine
- Public ranking/aggregate contracts.
- Exact meaning of rating counts and scores.
- Region and ranking freshness rules.

### Phase 4 — Restaurant and dish profiles
- Public experience rendering.
- Existing social interactions on experiences.
- Canonical profile and experience routes.

### Phase 5 — Personal Taste Identity
- Private-by-default taste insight rules.
- User privacy and opt-out controls.
- Separation between private derived insights and public social content.

### Stop conditions

Stop and report a blocker if:
- privacy states cannot be enforced in feed queries;
- block behavior is undefined or inconsistent;
- users can interact with content they are not authorized to view;
- comments or likes can be manipulated by clients without authorization;
- notification payloads can reveal private content;
- moderation and reporting have no safe operational path;
- Personal Taste data can leak into social surfaces;
- existing social data integrity is unclear.

Do not relax privacy policies to make the feed easier to query.

---

## 4. Social product model

### 4.1 Food experience is the post

The primary social item is a submitted food experience.

A food experience may include:
- author;
- restaurant/branch context;
- one or more dishes;
- text;
- media;
- visit date, if supported;
- restaurant rating dimensions;
- dish ratings;
- visibility;
- interactions.

Do not create a parallel generic-post model unless Phase 0 proves that the current experience entity cannot safely support the social use case.

### 4.2 User relationship

Users may follow other users under the accepted relationship model.

A follow relationship should provide:
- clear follow/unfollow state;
- accurate follower/following counts, if displayed;
- a feed relationship;
- predictable privacy behavior;
- block-aware behavior.

Do not let follower counts become a measure of food expertise or trustworthiness.

### 4.3 Interaction types

Reuse the current approved interaction systems:
- likes/reactions;
- comments;
- replies, if supported;
- saves/collections;
- follows;
- notifications;
- reports.

Each interaction must have a clear target type and owner. Avoid polymorphic or loosely typed relations that can attach a comment or like to the wrong entity.

### 4.4 Social graph is not a permission bypass

Following a user does not automatically grant access to all their records.

Content visibility must remain authoritative:
- public content can be viewed according to public policy;
- followers-only content can be viewed only by authorized followers, if the app supports that visibility;
- private content remains private;
- drafts remain visible only to the owner;
- deleted, rejected, or restricted content is unavailable according to policy;
- blocked relationships follow the accepted block rules.

---

## 5. Home feed experience

### 5.1 Feed purpose

The home feed should answer:

**“What food experiences have people I follow shared recently?”**

Start with a clear and understandable feed rather than an opaque recommendation algorithm.

### 5.2 Initial feed ordering

Recommended initial behavior:
- chronological ordering by publication time, newest first;
- stable tie-breaker using a unique identifier or equivalent;
- only content the viewer is authorized to see;
- only content eligible for feed display under moderation and account policies.

Do not sort the feed by likes or comments by default. Engagement ranking can amplify low-quality or controversial content and is not necessary for a useful first social experience.

If a different ordering already exists, audit it and document its impact before changing it.

### 5.3 Feed source

Potential sources:
- public experiences from users the viewer follows;
- followers-only experiences from followed users where the viewer is authorized;
- the viewer's own published experiences, if the product's feed convention includes them.

Do not inject:
- private experiences;
- drafts;
- rejected or deleted content;
- blocked-user content;
- hidden or restricted records;
- Personal Taste profile insights;
- paid placements or sponsored content.

### 5.4 Feed composition

Each feed item should reuse the existing food-experience card and show, where available:
- author identity and profile link;
- publication/experience date;
- restaurant/branch context;
- dish context;
- text;
- media;
- correct restaurant/dish rating context;
- like state and count;
- comment count;
- save action;
- share/report actions where supported.

Do not create a different visual language for feed cards if the same experience appears in the diary or restaurant/dish profile.

### 5.5 Feed states

Implement:
1. Initial loading.
2. Feed with items.
3. No followed users.
4. Followed users have not posted eligible experiences.
5. More items loading.
6. End of feed.
7. Network/server error.
8. Retry.
9. Item removed or no longer accessible.
10. Refresh/new items available, if supported.

The empty state should provide a meaningful next step:
- find people to follow;
- discover restaurants/dishes;
- log a food experience.

Do not fill an empty following feed with random public content while still labelling it “Following”.

If a separate discovery feed is proposed, label it clearly and obtain approval. Do not silently mix discovery recommendations into the following feed.

### 5.6 Pagination and refresh

- Use the existing pagination convention.
- Prefer stable cursor pagination where appropriate.
- Avoid loading the entire social graph's content at once.
- Prevent duplicates when new posts appear between pages.
- Preserve feed position during refresh where practical.
- Ensure a new post does not cause already viewed items to disappear unexpectedly.
- Do not fetch the entire media library for feed cards.
- Lazy-load media below the fold.

### 5.7 Feed performance

Measure:
- first useful feed render;
- first page query latency;
- queries per page;
- payload size;
- image loading;
- pagination latency;
- authorization query cost.

Avoid N+1 queries for authors, counts, ratings, and interactions. Use typed bounded responses.

---

## 6. Following and user profiles

### 6.1 Follow actions

Requirements:
- follow/unfollow is clear and reversible;
- button state reflects server-confirmed state;
- counts update without becoming inconsistent;
- repeated requests are idempotent;
- users cannot create duplicate follow records;
- block rules override follow relationships;
- user cannot follow a deleted or unavailable account.

If private accounts or follow requests exist, preserve their accepted semantics. Do not convert private accounts into public follows.

### 6.2 Profile social summary

A user profile may show:
- followers;
- following;
- public food experiences;
- supported collections;
- follow state.

Only show fields that match current product decisions.

Do not show:
- private Personal Taste Identity insights;
- private activity counts;
- private diary entries;
- hidden follower relationships if the product's privacy model restricts them.

### 6.3 Follow discovery

If the app already supports searching users or suggested accounts, audit and improve it.

Do not introduce contact-book uploads or address-book matching without a separate privacy review and explicit user consent.

Do not recommend accounts using private taste-profile data in Phase 6.

### 6.4 Counts and consistency

- Counts must be based on valid active relationships.
- Unfollow/block/deletion must update counts correctly.
- UI must not optimistically display a permanent success before the server confirms the mutation.
- A failed follow action must restore the correct state.
- Pagination of follower/following lists must be stable and authorized.

---

## 7. Likes and reactions

### 7.1 Product rule

A like is a lightweight signal that a user appreciated an experience. It is not a rating and must never change restaurant or dish aggregates.

### 7.2 Interaction behavior

- Like/unlike must be idempotent.
- A user may have at most the permitted interaction per target according to the existing model.
- Count reflects valid interactions only.
- Repeated rapid clicks must not create duplicates.
- The server/database enforces uniqueness and ownership.
- The UI clearly reflects the viewer's own state.
- Failed requests revert or reconcile optimistic state.

If the product currently supports only a single like, do not add multiple emoji reactions unless there is a clear product need and approval.

### 7.3 Privacy

Do not expose a list of users who liked an experience unless the current product policy permits it.

Do not let private likes reveal a user's activity on content they cannot otherwise access.

### 7.4 No rating influence

Likes must not:
- increase restaurant rating;
- increase dish rating;
- change regional ranking;
- change personal taste preference calculations;
- turn an experience into a verified recommendation.

---

## 8. Comments and replies

### 8.1 Comment purpose

Comments should support discussion about the food experience:
- the dish;
- the restaurant;
- the visit;
- practical context;
- questions or useful clarifications.

They should not turn MORS into a general-purpose chat platform.

### 8.2 Comment model

Inspect existing implementation before changing it.

Define:
- comment owner;
- target experience;
- text constraints;
- created/edited timestamps;
- deletion state;
- moderation state;
- reply relationship, if supported.

Use server-side validation and database constraints.

### 8.3 Comment behavior

- Authenticated users can comment only on content they are authorized to view and interact with.
- Users can edit/delete only their own comments, subject to moderation policy.
- Experience owners cannot silently rewrite another user's comment.
- Replies, if supported, must preserve clear parent-child structure.
- Comment counts must exclude deleted/rejected comments according to policy.
- Pagination should be bounded.
- Text length and request rates must be limited.
- Prevent duplicate submissions on retries.
- Avoid nested threads of unlimited depth.

Recommended scope for the first social upgrade:
- flat comments or one-level replies only;
- no complex nested discussion tree.

### 8.4 Moderation and reporting

Provide a report action on comments where supported.

Report reasons may include:
- spam;
- harassment/abuse;
- hate or hateful content;
- threats;
- impersonation;
- irrelevant or misleading content;
- other policy violation.

Use the app's accepted moderation taxonomy. Do not create an enormous form for reporting.

### 8.5 Safety behavior

- Blocked relationships follow accepted policy.
- Removed comments stop appearing in feeds and counts as defined.
- Deleted account behavior follows account lifecycle rules.
- Notification previews must not show content that has become inaccessible.
- Moderation actions should be auditable where current infrastructure supports it.

---

## 9. Notifications

### 9.1 Notification purpose

Notifications should bring users back for meaningful activity, not create noise.

Potential notification types:
- someone followed you;
- someone liked your food experience;
- someone commented on your experience;
- someone replied to your comment;
- a relevant moderation/account action, where user communication is required.

Only ship types supported by current systems and approved product policy.

### 9.2 Notification quality rules

- Avoid notifying on every low-value event if it becomes noisy.
- Do not notify the user about their own action.
- Group repeated likes on the same experience where appropriate.
- Prevent duplicate notifications on retries.
- A notification must point to the correct target.
- If the target content is deleted or no longer accessible, handle it safely.
- Do not expose private content through push previews or email.
- Do not create notifications for blocked users if the block policy prohibits interaction.

### 9.3 Notification center

Requirements:
- clear unread/read state;
- mark one as read;
- mark all as read if already supported and appropriate;
- stable pagination;
- loading and error states;
- accurate unread count;
- deep links to the relevant profile or experience;
- stale target handling.

Do not make the entire app refresh just because the unread count changes.

### 9.4 Notification preferences

Provide user controls where the current system supports them:
- likes;
- comments/replies;
- new followers;
- other approved notifications.

Default settings should be documented and conservative enough to avoid notification spam.

Do not assume that email, web push, and in-app notifications are all implemented. Build only channels supported by the repository and approved deployment.

### 9.5 Notification delivery architecture

Inspect current implementation.

Requirements:
- notification creation is server-controlled;
- retries are idempotent;
- authorization is checked when opening a notification target;
- delivery failure does not break the underlying social action;
- private content is not copied into an insecure notification payload;
- read state is owner-scoped.

---

## 10. Collections and saving

Collections are part of the social food-journal experience, but their privacy model must remain clear.

### 10.1 Save experience

- Reuse the existing collection_items relationship.
- Prevent duplicate saves where the data model requires uniqueness.
- Let the user select an existing collection or create one using the approved flow.
- Respect collection visibility.
- Do not expose private collection contents through public experience cards.

### 10.2 Public collections

If public collections are supported:
- show owner identity;
- show collection title and description;
- show only eligible public items;
- preserve ordering;
- handle deleted/hidden experiences safely.

Do not make every collection public by default.

### 10.3 Social distinction

Saving an experience is a personal organization action. It does not mean the user publicly endorsed it.

Do not use save counts as a public quality rating.

---

## 11. Sharing

### 11.1 Share an experience

Sharing should use the existing web/share capability where available.

Rules:
- public experiences may be shared through a canonical URL;
- private/followers-only experiences must not generate a public preview that reveals their content;
- sharing must not change visibility automatically;
- the receiver must still pass normal authorization;
- metadata must accurately identify the content;
- deleted or restricted targets must show an unavailable state.

### 11.2 Social network sharing

If native share or copy-link is supported:
- use a clear action;
- provide feedback for copy/share success or failure;
- avoid exposing private author or location information.

Do not add third-party social integrations without approval.

---

## 12. Block, mute, and report

Trust and user safety are core functionality, not optional polish.

### 12.1 Block

Review the existing block model and define exact behavior.

At minimum, determine:
- whether the blocker stops seeing the blocked user's feed content;
- whether the blocked user can see the blocker's public content;
- whether either party can follow the other;
- whether comments/likes are allowed across the relationship;
- whether follower relationships are removed;
- what happens to existing comments and likes;
- how notifications are suppressed;
- whether profile access is restricted.

The behavior must be consistent across:
- home feed;
- profile pages;
- search results where relevant;
- comments;
- likes;
- notifications;
- collections;
- direct links.

Do not make assumptions based on how another social network handles blocks. Use an explicit product decision.

### 12.2 Mute

Mute is optional and should be implemented only if there is a clear use case.

A mute should reduce feed or notification visibility without pretending it is a block. Its behavior must be clear and reversible.

Do not add mute simply to increase settings complexity.

### 12.3 Report

Users should be able to report:
- an experience;
- a comment;
- a user/account;
- other supported content types.

Requirements:
- concise reason selection;
- optional explanatory text with length limit;
- duplicate-report abuse controls;
- confirmation that the report was submitted;
- no disclosure to the reported user of the reporter's identity unless policy requires it;
- secure moderation queue;
- status handling if the app already supports it.

### 12.4 Moderation workflow

Phase 6 must verify that reports go somewhere actionable.

If the repository has no moderation operations surface:
- define the minimum safe workflow;
- document who can review;
- protect moderator permissions;
- log decisions;
- define appeal/escalation only if required by product policy.

Do not collect reports into a table that nobody can review.

---

## 13. Privacy and authorization

All social queries must use a shared visibility policy.

### 13.1 Feed visibility

The feed must filter content before returning it to the client. Hiding it in the UI is not sufficient.

### 13.2 Interaction visibility

A user may interact only if:
- authenticated;
- target exists;
- target is visible to them;
- target permits the action;
- relationship is not blocked/restricted under policy.

### 13.3 Notification privacy

Notifications must not become a side channel:
- no private comment text in a public payload;
- no hidden experience name or location in push previews;
- no follower-only content preview to an unauthorized viewer;
- target authorization rechecked on open.

### 13.4 Private Taste Identity boundary

Phase 5 taste insights remain private by default.

Do not:
- add them to feed cards;
- use them as public recommendation labels;
- add them to public profile metadata;
- show other users a user's highly rated dishes/cuisines without explicit sharing consent;
- use private insights to rank public feed content.

If a user explicitly shares a taste insight, that is a separate product capability and must follow Phase 5's approved scope and controls. It is not automatically part of Phase 6.

### 13.5 Authorization implementation

- Do not trust client-supplied owner IDs.
- Enforce ownership and visibility in server-side data access and database policies.
- Keep elevated credentials server-only.
- Add negative tests for every mutation.
- Do not weaken RLS to make feed joins work.
- Avoid returning hidden records then filtering them in the browser.

---

## 14. Anti-spam and abuse prevention

Social features are vulnerable to spam and manipulation.

Implement safeguards proportionate to the current product:
- bounded text length;
- request rate limits;
- idempotent mutations;
- uniqueness constraints;
- duplicate submission protection;
- pagination limits;
- notification deduplication/grouping;
- comment/report abuse handling;
- safe rendering of user text;
- media upload limits already approved by the app.

Do not:
- introduce hidden engagement penalties without policy;
- treat disagreement as abuse;
- automatically suppress a user because their rating differs from the average;
- expose anti-abuse signals publicly;
- add invasive tracking to detect social behavior.

Measure abuse before adding complex moderation automation.

---

## 15. Feed and notification data architecture

### 15.1 Reuse source entities

The food experience remains the feed item. Follows, likes, comments, saves, and notifications should reference the existing canonical entities.

Do not duplicate experience content into a second post table unless the audit proves a necessary architectural gap.

### 15.2 Feed query contract

Logical input:
- authenticated viewer;
- page cursor;
- bounded page size;
- optional approved feed filters.

Logical output:
- eligible experience summary;
- author display information allowed by privacy rules;
- restaurant/branch and dish context;
- viewer's interaction state;
- valid counts;
- next cursor.

Do not return full private records, unnecessary profile fields, or raw moderation data.

### 15.3 Counts and aggregation

- Like counts must use valid likes.
- Comment counts must follow deletion/moderation policy.
- Save counts should not be shown publicly unless explicitly approved.
- Follow counts must use valid relationships.
- Counts must not include private or inaccessible content in a way that leaks its existence.

### 15.4 Notification contract

Return:
- notification type;
- safe actor display data;
- safe target identifier;
- safe preview text or no preview;
- read state;
- creation timestamp;
- canonical target route;
- pagination cursor.

Re-check authorization when resolving the target.

### 15.5 Event processing

If notifications are generated asynchronously:
- use idempotency keys or equivalent;
- avoid duplicate delivery on retry;
- make event processing observable;
- handle deleted targets;
- do not let notification delivery failure roll back a successful like/comment/follow unless the architecture explicitly requires a transaction.

---

## 16. UX and visual design

### 16.1 Design direction

The social UI should feel like a food community:
- food experiences are visually central;
- dish and restaurant context is easy to identify;
- ratings remain visible but not overwhelming;
- comments support useful discussion;
- actions are compact and predictable;
- the feed is not overloaded with generic social metrics.

Do not copy Instagram's visual hierarchy, engagement-first patterns, or content formats.

### 16.2 Home navigation

Use the accepted MORS navigation convention. The home feed should be accessible without adding multiple competing destinations.

Do not add a separate tab for every social action.

### 16.3 Feed card consistency

Use the same experience-card data and visual rules across:
- Home feed;
- user diary/profile;
- restaurant profile;
- dish profile;
- collection items.

The card may adapt its layout to context, but rating semantics, privacy, and action behavior must remain consistent.

### 16.4 Interaction feedback

- Likes should show confirmed state.
- Comments should retain text after a temporary failure where safe.
- Follow action should visibly update after server confirmation.
- Save should identify the target collection.
- Report submission should confirm receipt.
- Notification read state should update predictably.

Avoid optimistic UI that lies to the user when the server rejects the action.

### 16.5 Empty states

Examples:
- No followed users: “Follow people whose food experiences you want to see.”
- No recent posts: “Your following feed is quiet. Explore restaurants or log your next meal.”
- No comments: “Start a useful conversation about this experience.”
- No notifications: “You're all caught up.”

Do not pressure users to post or follow just to fill the screen.

---

## 17. Accessibility

- Feed items have a clear heading/author relationship.
- Like buttons announce liked/unliked state.
- Follow buttons announce following/not-following state.
- Comment form has a label and character guidance where relevant.
- Notification read/unread is not color-only.
- Menus and dialogs are keyboard accessible.
- Focus is managed when opening/closing report dialogs.
- Error and success states are announced.
- Images have appropriate alt text or are decorative.
- Touch targets meet the project's accessibility standard.
- Reduced-motion preferences are respected.
- Infinite scroll, if used, must have accessible alternatives and must not trap keyboard users.

---

## 18. Analytics and product learning

Capture only minimal, useful events:
- `feed_opened`
- `feed_item_opened`
- `feed_pagination_loaded`
- `follow_created`
- `follow_removed`
- `experience_liked`
- `experience_unliked`
- `comment_created`
- `comment_deleted`
- `notification_opened`
- `notification_marked_read`
- `content_reported`
- `user_blocked`
- `experience_saved`

Do not collect:
- private comment content;
- private experience text;
- private taste summaries;
- unnecessary social graph exports;
- sensitive personal data.

Useful measures:
- feed load/error rate;
- percentage of users with a populated following feed;
- follow/unfollow success;
- comment submission success;
- notification duplicates and delivery failures;
- report volume and moderation handling time;
- feed items opened;
- saves to collections.

Do not optimize the product solely for likes, comments, or session duration. Those are not measures of food-discovery quality.

---

## 19. Implementation workstreams

### Workstream A — Social system audit

1. Read accepted Phase 0–5 outputs.
2. Inventory follows, feed, likes, comments, notifications, collections, blocks, reports, and moderation.
3. Trace data access, database constraints, RLS, and APIs.
4. Identify duplicate components or overlapping systems.
5. Verify privacy behavior on existing routes.
6. Document gaps and risks.

**Deliverable:** `docs/phase-6/SOCIAL_SYSTEM_AUDIT.md`

### Workstream B — Social interaction specification

1. Define food experience as the central social item.
2. Define following semantics.
3. Define like/comment/reply behavior.
4. Define notification types and grouping.
5. Define block/mute/report behavior.
6. Define collection/save integration.
7. Define privacy and visibility behavior across all surfaces.

**Deliverable:** `docs/phase-6/SOCIAL_BEHAVIOR_SPEC.md`

### Workstream C — Feed architecture

1. Define feed source and ordering.
2. Define authorization/visibility query path.
3. Define stable pagination.
4. Define interaction-state aggregation.
5. Define refresh/new-item behavior.
6. Measure query plans and performance.
7. Implement only required query/index changes.

**Deliverable:** `docs/phase-6/FEED_ARCHITECTURE.md`

### Workstream D — Backend and authorization

1. Repair or implement follow mutations.
2. Repair or implement like mutations.
3. Repair or implement comment mutations.
4. Repair or implement notification generation/read state.
5. Integrate block/report rules.
6. Ensure idempotency and rate limiting.
7. Reuse existing collections.
8. Add security tests for every path.

**Deliverable:** typed, tested social services and APIs.

### Workstream E — Home feed UI

1. Build or repair the following feed.
2. Reuse food-experience cards.
3. Add pagination and refresh.
4. Add clear empty states.
5. Add error and retry behavior.
6. Connect to profiles, restaurants, dishes, and experience detail.
7. Ensure mobile and accessibility quality.

**Deliverable:** reliable Home feed.

### Workstream F — Interaction and notification UI

1. Implement like/unlike behavior.
2. Implement comments and approved replies.
3. Implement follow state and lists.
4. Build notification center.
5. Add notification preferences where supported.
6. Connect collection saving.
7. Add report/block controls.
8. Verify failure feedback and stale target behavior.

**Deliverable:** complete social interaction experience.

### Workstream G — Trust, safety, and moderation

1. Verify report intake and review workflow.
2. Implement block behavior consistently.
3. Implement mute only if approved.
4. Add abuse/rate-limit protections.
5. Verify moderator permissions and audit trail.
6. Verify notification/feed invalidation after moderation.
7. Test private-content leakage.

**Deliverable:** `docs/phase-6/TRUST_AND_SAFETY_REPORT.md`

### Workstream H — QA and reliability

1. Test feed ordering and pagination.
2. Test social mutation idempotency.
3. Test notifications and deduplication.
4. Test all privacy states.
5. Test blocks across feed/profile/comments/notifications.
6. Test mobile and keyboard interactions.
7. Test failure/retry/offline behavior.
8. Measure performance.
9. Run full regression suite.

**Deliverable:** `docs/phase-6/TEST_REPORT.md` and evidence.

---

## 20. Priority order

### P0 — Required for Phase 6 release

1. Existing social systems audited and reused.
2. Secure following/unfollowing.
3. Reliable following feed.
4. Chronological deterministic feed ordering.
5. Valid like/unlike interactions.
6. Reliable comments, within approved scope.
7. Notifications for approved meaningful events.
8. Block/privacy rules enforced consistently.
9. Reporting path connected to an actionable moderation workflow.
10. Feed and notification pagination.
11. Clear empty/loading/error/retry states.
12. Private Taste Identity remains private.
13. Mobile and accessibility quality.
14. Security, idempotency, and regression tests.

### P1 — Add only where justified

1. One-level comment replies.
2. Notification grouping/preferences.
3. Mute.
4. Improved user discovery.
5. Public collection sharing refinements.
6. Feed refresh/new-item indicator.
7. More detailed moderation operations.

### Explicitly defer

- Direct messages.
- Stories/reels/live content.
- Engagement-ranked feed.
- User popularity leaderboards.
- AI-generated comments/summaries.
- Paid/promoted posts.
- Public taste-profile insights.
- General-purpose social posting.

---

## 21. Test matrix

| Area | Required test cases |
|---|---|
| Feed | Following posts, own posts if supported, no follows, no posts, new posts, end of feed |
| Ordering | Newest first, stable ties, pagination during new inserts |
| Visibility | Public, followers-only, private, draft, rejected, deleted, blocked |
| Following | Follow, unfollow, duplicate request, deleted account, private-account rules |
| Likes | Like, unlike, rapid repeated click, retry, unauthorized target |
| Comments | Create, edit, delete, invalid length, duplicate submit, blocked relationship |
| Notifications | Follow, like, comment, grouping, deduplication, read/unread, deleted target |
| Block | Feed, profile, follow state, likes, comments, notifications, direct URL |
| Mute | If shipped: feed filtering, notification suppression, unmute |
| Reports | Submit, rate limits, duplicate reports, permissions, moderation queue |
| Collections | Save, duplicate save, remove, private collection, deleted experience |
| Privacy | Private experience not exposed through feed, counts, notifications, metadata |
| Personal Taste | No private insight in feed/profile/notifications |
| Reliability | Timeout, retry, offline, stale target, mutation failure |
| Security | Arbitrary owner IDs, unauthorized mutations, direct data access |
| Accessibility | Keyboard, screen reader state, dialog focus, reduced motion |
| Responsive | Small mobile, large mobile, tablet, desktop |
| Regression | Logging, diary, Find, restaurant/dish profiles, collections, ranking pages |

Use non-sensitive test fixtures. Do not put production private content into test data.

---

## 22. Required documentation and evidence

Follow repository conventions. Suggested files:

| File | Required content |
|---|---|
| `docs/phase-6/SOCIAL_SYSTEM_AUDIT.md` | Existing feature inventory and gaps |
| `docs/phase-6/SOCIAL_BEHAVIOR_SPEC.md` | Follow, like, comment, notification, block, report rules |
| `docs/phase-6/FEED_ARCHITECTURE.md` | Feed source, ordering, eligibility, pagination |
| `docs/phase-6/NOTIFICATION_SPEC.md` | Event types, grouping, preferences, privacy |
| `docs/phase-6/TRUST_AND_SAFETY_REPORT.md` | Blocks, reports, moderation workflow, abuse controls |
| `docs/phase-6/PRIVACY_MATRIX.md` | Visibility behavior across feed and social surfaces |
| `docs/phase-6/TEST_REPORT.md` | Exact test commands/results and limitations |
| `docs/phase-6/PERFORMANCE_REPORT.md` | Feed/query/notification performance |
| `docs/phase-6/OPEN_DECISIONS.md` | Owner decisions and unresolved issues |

Store safe evidence under `docs/evidence/phase-6/`:
- screenshots of feed and interaction states;
- feed query plans;
- redacted test outputs;
- notification deduplication evidence;
- privacy and authorization tests;
- moderation workflow evidence;
- mobile/accessibility checks;
- performance measurements.

Do not commit private comments, private experience text, user exports, credentials, or tokens.

---

## 23. Decisions requiring explicit approval

| Decision ID | Question |
|---|---|
| P6-D01 | Is Home a following-only feed for the initial release? |
| P6-D02 | Are users' own experiences included in Home? |
| P6-D03 | Is feed ordering chronological only? (Recommended initially.) |
| P6-D04 | Are comments flat or one-level replies? |
| P6-D05 | Which notification types ship initially? |
| P6-D06 | Which notifications are grouped? |
| P6-D07 | What are the exact block semantics across existing social surfaces? |
| P6-D08 | Is mute required in the initial release? |
| P6-D09 | Which report reasons and moderation workflow are approved? |
| P6-D10 | Are public collections shareable in the current release? |
| P6-D11 | Which notification channels exist and are approved? |
| P6-D12 | What are default notification preferences? |
| P6-D13 | What rate limits and comment constraints are appropriate? |
| P6-D14 | Are any discovery-feed suggestions allowed in Home, or is it strictly Following? |

For each decision include:
- current implementation/evidence;
- options;
- recommendation;
- privacy/safety impact;
- engineering cost;
- whether it blocks release;
- approval status.

Antigravity may recommend. It must not silently create a new feed algorithm or change privacy semantics.

---

## 24. Definition of Done

Phase 6 is complete only when:

- [ ] Phases 0–5 have been accepted.
- [ ] Existing social capabilities have been audited and reused appropriately.
- [ ] Home feed behavior and source are explicit.
- [ ] Feed ordering is deterministic and pagination is stable.
- [ ] Every feed item passes server-side visibility and moderation rules.
- [ ] Following/unfollowing is correct and idempotent.
- [ ] Like/unlike does not affect ratings or rankings.
- [ ] Comments are secure, bounded, and moderatable.
- [ ] Notifications are accurate, deduplicated, and privacy-safe.
- [ ] Block behavior is consistent across all relevant surfaces.
- [ ] Reports reach an actionable moderation workflow.
- [ ] Collections and saves reuse existing data models.
- [ ] Private Personal Taste Identity data never leaks to social surfaces.
- [ ] Loading, empty, error, retry, and stale-target states are complete.
- [ ] Mobile, accessibility, and performance criteria are verified.
- [ ] Security, privacy, abuse, and regression tests pass, or failures are accurately reported.
- [ ] Required documentation and evidence are committed.
- [ ] All release-blocking decisions are approved.

If any P0 criterion is false, report **PARTIALLY COMPLETE** or **BLOCKED**, not complete.

---

## 25. Required final report from Antigravity

Return:

1. **Verdict:** COMPLETE / PARTIALLY COMPLETE / BLOCKED.
2. **Before-state:** existing social systems, gaps, and known defects.
3. **Feed behavior:** source, ordering, eligibility, pagination, refresh.
4. **Following:** mutations, counts, privacy, and block behavior.
5. **Likes/comments:** exact supported behavior and authorization.
6. **Notifications:** event types, grouping, delivery, preferences, deduplication.
7. **Trust/safety:** block, mute, report, moderation workflow.
8. **Privacy:** visibility matrix and evidence that private content is protected.
9. **Personal Taste boundary:** proof that private derived insights are not exposed.
10. **Performance:** feed latency, query count, payload size, notification processing.
11. **Tests:** exact commands and pass/fail counts.
12. **Files changed:** code, tests, migrations, and docs.
13. **Deferred items:** direct messages, stories, AI, ranking feed, or other excluded items.
14. **Phase 7 readiness:** whether the platform's operational reliability and release readiness can be audited safely.

Do not claim that a social feature is complete just because a button exists. Verify the full mutation, authorization, persistence, notification, and failure path.

---

## 26. Antigravity execution prompt

> Execute MORS Phase 6 — Social Experience Upgrade using this brief and the accepted Phase 0 through Phase 5 deliverables.
>
> Begin by reading repository instructions and auditing the actual follow, feed, like, comment, notification, collection, block, report, and moderation implementations. Many of these may already exist. Reuse and repair the current systems rather than creating parallel tables, APIs, components, or notification pipelines.
>
> Keep the food experience as the central social item. Build or repair a clear following feed with deterministic chronological ordering, server-side visibility filtering, stable pagination, useful empty states, and retry behavior. Do not silently mix random public discovery content into a Following feed.
>
> Implement reliable follow/unfollow, like/unlike, approved comments/replies, and meaningful notifications. Likes are not ratings and must never affect restaurant/dish aggregates, regional rankings, or Personal Taste calculations. All mutations must be authorized, bounded, idempotent, and tested.
>
> Reuse existing collections and save behavior. Ensure public/private collection rules are respected. Use canonical experience URLs for sharing and never expose private content through previews or metadata.
>
> Verify block, report, and moderation behavior across feed, profiles, comments, likes, follows, notifications, and direct links. Reports must reach an actionable and permission-protected moderation workflow. Do not build a report table that nobody can review.
>
> Keep Phase 5 Personal Taste Identity private by default. Never place derived taste insights in public feeds, profiles, notifications, or social recommendation labels without a separate explicitly approved sharing capability.
>
> Do not add direct messages, stories, reels, live streaming, engagement-ranked feeds, user leaderboards, AI-generated content, or paid placements. The purpose is a high-quality food community, not a clone of a general social network.
>
> Make the experience mobile-first and accessible. Test privacy states, blocks, cross-user access, notification deduplication, race conditions, pagination, failed mutations, stale targets, and regressions in logging, diary, Find, profiles, collections, and regional rankings.
>
> Measure feed and notification performance. Do not introduce infrastructure or dependencies without evidence. Do not weaken RLS or server authorization to make a query easier.
>
> Keep changes within Phase 6. Stop and report if a product policy, moderation workflow, or privacy rule is unresolved.
>
> Finish with the required final report and state clearly whether Phase 7 can safely begin.

---

## 27. Phase 7 handoff — UX Refinement, Reliability, and Release Readiness

Phase 7 should not be treated as another feature-building phase. It is the release gate for the product work built across the earlier phases.

Phase 7 may begin when:
- Find, rankings, restaurant/dish profiles, personal taste, and social flows have stable contracts;
- major user journeys are implemented;
- authorization and privacy boundaries are understood;
- the app has a reproducible test/build process;
- unresolved P0 issues are documented.

Phase 7 will perform a cross-product quality audit, fix the highest-impact defects, validate real user journeys, verify mobile behavior and accessibility, measure performance, and prepare a safe release. It must prioritize reliability over adding more features.
