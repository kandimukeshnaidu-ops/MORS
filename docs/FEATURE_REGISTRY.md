# MORS — Feature & Control Registry (v3)

Every interactive control in the user interface must be registered in this document per `AGENTS.md` and `docs/IMPLEMENTATION_PLAN.md` Section 7.8. No control may be rendered if it does not have a real data effect or a passing automated test.

| ID | Screen / Route | Element / Control | Action | Expected Outcome | Data Effect | Test Reference | Status |
|---|---|---|---|---|---|---|---|
| `AUTH-01` | `/auth/login` | Email/Password Form | Submit | Authenticates user and redirects to home or intended route | Supabase Auth session set in secure cookies | `apps/web/e2e/journeys.spec.ts` | Green |
| `AUTH-02` | `/auth/register` | Sign Up Form | Submit | Creates account, sends verification email | Row in `auth.users`, trigger inserts `profiles` | `apps/web/e2e/journeys.spec.ts` | Green |
| `AUTH-03` | `/onboarding` | 3-Step Wizard | Complete | Saves username, display name, avatar, cuisines, privacy defaults | Updates `profiles` with `onboarding_completed_at` | `apps/web/e2e/journeys.spec.ts` | Green |
| `LOG-01` | Desktop/Mobile Shell | Log Experience Button | Click / Tap | Opens Quick Log modal/sheet with initial state | In-memory modal opened; sets start timestamp | `apps/web/e2e/journeys.spec.ts` | Green |
| `LOG-02` | `LogModal` | Dish Combobox | Type / Select | Suggests canonical dishes; allows adding as new | Trigram search on `dishes` | `apps/web/tests/ui.test.ts` | Green |
| `LOG-03` | `LogModal` | Photo File Input | Select File | Compresses client-side, strips EXIF, generates blurhash | Produces processed JPEG blob and metadata | `apps/web/tests/image.test.ts` | Green |
| `LOG-04` | `LogModal` | RatingStars | Click / Arrow keys | Sets overall or dish rating in 0.5 step (1..10 smallint) | Form state updated | `apps/web/tests/ui.test.ts` | Green |
| `LOG-05` | `LogModal` | Publish Button | Click | Submits transactional experience with dishes and photos | Calls `create_experience` RPC; inserts rows | `apps/web/e2e/journeys.spec.ts` | Green |
| `LOG-06` | `/e/[id]` | Delete Experience | Click + Confirm | Deletes entry and removes from feeds/diaries | Calls `delete_experience`; enqueues storage cleanup | `apps/web/e2e/journeys.spec.ts` | Green |
| `DIARY-01` | `/diary` | View Mode Switcher | Click Timeline / Calendar | Toggles between chronological keyset list and calendar month view | Re-renders layout with respective data | `apps/web/e2e/journeys.spec.ts` | Green |
| `DIARY-02` | `/diary` | FilterBar Chips | Select Category / Rating | Filters diary entries by category, rating, or date | Updates URL searchParams and re-queries RPC | `apps/web/e2e/journeys.spec.ts` | Green |
| `FEED-01` | `/` | LikeButton | Click / Tap | Toggles like state optimistically; increments count | Inserts/deletes `experience_likes`; generates notification | `apps/web/e2e/journeys.spec.ts` | Green |
| `FEED-02` | `/e/[id]` | CommentsSection Form | Submit | Posts flat comment; appends to comment stream | Inserts `experience_comments`; generates notification | `apps/web/e2e/journeys.spec.ts` | Green |
| `SOCIAL-01` | `/u/[username]` | FollowButton | Click / Tap | Follows public profile or sends pending request to private profile | Inserts `follows` (status accepted or pending) | `apps/web/e2e/journeys.spec.ts` | Green |
| `COL-01` | `/collections` | Create Collection Modal | Submit | Creates public, private, or unlisted collection | Inserts `collections` row | `apps/web/e2e/journeys.spec.ts` | Green |
| `COL-02` | `/e/[id]`, `/dish/[slug]` | SaveToCollectionButton | Click | Saves item to target collection or creates new | Inserts `collection_items` with fractional position | `apps/web/e2e/journeys.spec.ts` | Green |
| `SEARCH-01` | `/search` | Search Input & Tabs | Type / Click Tab | Trigram and full-text search across users, dishes, places, collections | Executes `search_all` RPC; updates URL | `apps/web/e2e/journeys.spec.ts` | Green |
| `SET-01` | `/settings` | Profile Form | Save Changes | Updates bio, display name, location, and privacy toggles | Updates `profiles` table | `apps/web/e2e/journeys.spec.ts` | Green |
| `SET-02` | `/settings` | Export Data Button | Click | Generates and downloads full JSON archive of food life | Calls `exportUserData` server action | `apps/web/e2e/journeys.spec.ts` | Green |
| `SET-03` | `/settings` | Delete Account Button | Confirm (Type DELETE) | Places account in 14-day deletion grace period | Calls `request_account_deletion` RPC | `apps/web/e2e/journeys.spec.ts` | Green |
| `AUTH-04` | `/auth/register` | Beta Invite Code Input | Type / Submit | Validates beta invite code against active quota before signup | `check_invite_code` RPC; `redeem_invite_code` RPC | `packages/domain/tests/schemas.test.ts` | Green |
| `ADMIN-01` | `/admin` | Moderation Actions | Click Dismiss/Delete | Resolves abuse report and executes moderation action | Updates `reports`, inserts `moderation_actions` | `apps/web/tests/ui.test.ts` | Green |
| `STATUS-01` | `/status` | Beta Ops & Feedback Link | Click | Navigates to operational status and opens beta feedback channel | Operational tracking & feedback delivery | `apps/web/tests/sample.test.ts` | Green |
| `LOG-07` | `/e/[id]` | Log Again Button | Click | Duplicates past meal metadata into a new draft | In-memory modal opened; sets start timestamp | `apps/web/tests/ui.test.ts` | Green |
| `LOG-08` | `LogModal` | Restore / Discard Local Draft | Click | Restores or discards unsaved draft from local storage | LocalStorage read/delete | `apps/web/tests/ui.test.ts` | Green |
| `ENG-01` | `/e/[id]` | Share Experience Button | Click / Tap | Invokes native share sheet or copies experience URL to clipboard | Clipboard API / navigator.share | `apps/web/tests/ui.test.ts` | Green |
| `SEARCH-02` | `/dish/[slug]` | Multilingual Translation Badges | View | Displays regional dish translations (Telugu, Hindi) under canonical name | Reads `dish_translations` | `apps/web/tests/ui.test.ts` | Green |
| `STAT-01` | `/u/[username]` | Taste Identity & Stats Card | View | Displays factual logging cadence, cuisines, and top dishes (min 5 meals) | Reads `user_stats_public` or `user_stats_owner` | `apps/web/tests/ui.test.ts` | Green |
| `EXPLORE-01` | `/explore` | Explore Trending & Discovery Sections | View / Click | Displays time-decayed trending experiences and public collections | Reads `explore_cache` / `get_explore_trending` | `apps/web/tests/ui.test.ts` | Green |
| `MAP-01` | `/map` | Food Map & Accessible Venue Directory | View / Click | Displays mapped dining venues with venue coordinates and visited badges | Reads `get_map_pins` RPC | `apps/web/tests/ui.test.ts` | Green |
| `SOC-01` | `/notifications` | Grouped Social Activity & Mentions | View | Displays grouped notifications and comment mention alerts | Reads `get_grouped_notifications` RPC | `apps/web/tests/ui.test.ts` | Green |
| `RECAP-01` | `/u/[username]/food-year` | Food Year Annual Retrospective | View / Toggle Share | Displays annual food recap story with tokenized sharing controls | Reads `recaps` / `get_recap_by_token` | `apps/web/tests/ui.test.ts` | Green |
| `SEO-01` | `/sitemap.xml` | Opt-in Search Engine Sitemap | View / Index | Generates dynamic sitemap for opted-in public profiles & static pages | Reads `get_indexable_public_profiles` RPC | `apps/web/tests/ui.test.ts` | Green |
