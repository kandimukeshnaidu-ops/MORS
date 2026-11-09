SECTION 0 — HOW TO USE THIS WITH ANTIGRAVITY
Create the repo folder mors/ and open it as an Antigravity workspace.
Save THIS whole file as docs/IMPLEMENTATION_PLAN.md.
Copy the block in Section 1 into AGENTS.md at the repo root (Antigravity reads AGENTS.md; GEMINI.md also works and takes precedence if both exist). Rule files have a size limit (~12,000 characters), so the rules file stays short and the long plan lives in docs/.
Optional: split the "Non-negotiables" into .agents/rules/security.md and .agents/rules/design.md. Do NOT add .agents/ to .gitignore (Antigravity won't index it); use .git/info/exclude if you want it local.
Settings: use Planning mode for every phase, Review-driven review policy, and terminal policy that asks before running commands (you can allowlist pnpm, git status, supabase test db). Add a deny rule for supabase db reset --linked, supabase db push to prod, and rm -rf.
Connect any Supabase MCP only to the dev project, never prod.
Run one phase per conversation. Paste the Master Phase Prompt (Section 5) with the phase number. Review the Implementation Plan artifact before approving. Review the Walkthrough artifact (screenshots from the browser subagent) before merging.
Parallel agents: only Phase 1 (database) and Phase 2 (design system) are independent. Everything else is sequential because it touches shared schema and shared components. Never let two agents edit migrations at once.
If this file ever contradicts the product context (Section 6 of this file summarizes the key rules), the product context wins. Ask me instead of guessing.
SECTION 1 — AGENTS.md (copy this block to repo root)
md
# MORS — Agent Rules

## Product
MORS is a social food journal: a personal, searchable archive of a person's whole food life plus a community around taste. It is NOT a delivery app, booking platform, calorie tracker, or restaurant-review site.
Central object: a FOOD EXPERIENCE (one eating occasion) containing 1+ dishes. Restaurant/place is always optional. Home-cooked meals are first-class.
Three principles; every feature must serve at least one:
1. Effortless logging (no forced review, no forced place)
2. Meaningful personal history (diary is searchable, chronological, enjoyable to revisit)
3. Genuine social discovery (through people you follow; chronological feed first)
Journey: Eat -> Log -> Rate -> Remember -> Collect -> Share -> Discover.

## Stack
Monorepo (pnpm + Turborepo): apps/web (Next.js App Router, TypeScript strict, Tailwind), apps/mobile (Expo, added in Phase 13), packages/domain (Zod schemas, constants, rating helpers), packages/db (generated Supabase types), supabase/ (migrations, seed, pgTAP tests). Backend: Supabase (Postgres, Auth, Storage, Realtime, Edge Functions). Hosting: Vercel. Analytics: PostHog. Errors: Sentry.
Always check current official docs for installed versions before using an API; do not rely on memory for Next.js, Supabase SSR, or Expo specifics.

## Non-negotiables
1. Authorization lives in Postgres RLS and SECURITY DEFINER helper functions. Hiding things in the UI is never security.
2. Every new table in `public` ships in the SAME migration with: RLS enabled, explicit policies, indexes for columns used in policies, and pgTAP tests. No table without RLS, ever.
3. Private, followers-only and draft entries must never leak through: feeds, search, counts, community ratings, stats, notifications, storage URLs, OG images, sitemaps, collections, or error messages.
4. Effective visibility = the MOST RESTRICTIVE of (profile privacy, entry visibility). A public entry on a private profile is followers-only.
5. Blocked users (either direction) cannot see each other's content, follow, like, or comment.
6. Service-role key is server-only. Never in client bundles, NEXT_PUBLIC_* vars, or the mobile app.
7. Views use `security_invoker = true`. SECURITY DEFINER functions set `search_path = ''` and are schema-qualified.
8. Ratings are stored as smallint half-stars 1..10 (UI shows 0.5..5.0). A user's own rating and a dish's community aggregate are different things and never mixed.
9. Community aggregates count only published entries that are publicly visible to everyone.
10. Strip EXIF/GPS from uploaded photos. No precise location or real-time eating activity without explicit consent.
11. Statistics come from real user data only. No invented taste claims or personality inferences.
12. Do not build P1/P2 features early. Do not add dependencies without stating why in the plan.

## Conventions
- TypeScript strict, no `any`. Validate all external input with Zod from packages/domain (shared by web and mobile).
- Server Components by default. Mutations via Server Actions or Postgres RPC; multi-table writes (experience + dishes + photos) go through one transactional RPC.
- Keyset (cursor) pagination only; never OFFSET on feeds or diaries.
- Migrations: `supabase migration new <name>`; never edit an applied migration; never run reset/push against remote. Regenerate types with `pnpm db:types`.
- Photos: private bucket + short-lived signed URLs; client compression (max 2048px longest edge, JPEG/WebP ~0.8) before upload; size/MIME limits in bucket config.
- Design: dark charcoal background, warm off-white text, muted olive accent, serif display + clean sans body, large food photography, subtle borders, restrained motion (respect prefers-reduced-motion). No heavy gradients, glassmorphism, dashboard-card clutter, or food-delivery visual style. All colors/fonts come from design tokens, never hard-coded.
- Accessibility: WCAG AA contrast, keyboard operable (including rating and reorder), visible focus, alt text on photos.
- Git: trunk-based, branch `phase-NN/<slug>`, conventional commits, never commit secrets; keep `.env.example` current.

## Workflow
- Use Planning mode. Produce an Implementation Plan artifact first and wait for approval.
- Read `docs/IMPLEMENTATION_PLAN.md` Sections 3-4 and the current phase before coding. Implement ONLY the current phase. Stop at its end.
- If something is ambiguous or contradicts the plan, ask instead of inventing.
- Finish every phase with: `pnpm typecheck && pnpm lint && pnpm test`, `supabase test db`, the RLS audit script, Playwright journeys for that phase, a 360px/768px/1280px visual check, and a Walkthrough artifact that ticks each acceptance criterion with evidence.
SECTION 2 — CORRECTIONS AND UPGRADES VS THE CHATGPT PLAN
#	Problem in v1	Fix in v2
1	Row-level security and privacy testing were left to Phase 12 (testing), contradicting the product rule "implement RLS before exposing user content".	RLS + pgTAP tests ship with every table, starting Phase 1. A CI check fails if any public table lacks RLS.
2	Ratings were a separate Phase 6, but Phase 4 logging already needs overall and per-dish ratings.	Ratings are built inside Phase 4. Phase 6 is only dish/place canonicalization and community aggregates.
3	Search (a P0 feature) came in Phase 9, yet Phase 6 requires "search before creating dish/place".	Basic trigram search arrives in Phase 4/6; global search is Phase 10.
4	Explore/trending was inside the MVP. Product context marks Explore, trending, maps, recap, stats as P1.	MVP has search + simple follow suggestions only. Explore moved to Phase 14 (post-beta).
5	"Taste statistics" was a pre-launch phase. Product context says advanced stats are P1.	Basic counts (experiences, followers, etc.) live in profiles (Phase 3/5). Advanced stats are Phase 14.
6	Mobile sat before launch while also saying "web first".	Web MVP -> closed web beta -> mobile (Phase 13). Monorepo with shared packages from day one so mobile does not diverge.
7	Security, account deletion, data export, rate limiting were all crammed into the final phase.	Dedicated Phase 11 BEFORE beta. Also required for App Store/Play approval later.
8	Food categories listed only 7 options. Product context lists many more (bakery, fast food, beverages, travel, special occasion, etc.).	food_categories lookup table (editable without migrations) + free-form tags for occasion-type labels.
9	Collections limited to dishes/experiences. Product examples include "Places I Want to Visit" and "My Favourite Coffee Shops".	Collection items can be experience, dish, or place.
10	Photos had no privacy design; a public bucket would expose private-entry photos.	Private bucket + signed URLs checked against visibility; EXIF stripping; compression pipeline.
11	Community ratings could include private entries, leaking them into other people's statistics.	Aggregates count only entries visible to everyone; toggling visibility updates stats (tested).
12	Rating "0-5" scale ambiguous and float-prone.	Stored as smallint 1..10, displayed as 0.5..5.
13	Feed ordering by experience date would let back-dated logs bury or flood feeds.	Added published_at; feed orders by it. eaten_at is for the diary only.
14	Polymorphic likes/comments/items invite broken foreign keys and complicated RLS.	Separate like tables; collection_items uses 3 nullable FKs with a "exactly one" check.
15	Figma-first design deliverable doesn't fit an agent workflow.	Tokens + a living /dev/ui component gallery in code. Figma optional.
16	No migration tooling, environments, CI, monitoring, or legal pieces.	Added in Phase 0 and Phase 11/12.
17	Timeline "12-16 weeks" for web + mobile was optimistic.	Phases sized S/M/L/XL; re-estimate after Phase 4 using real velocity.
18	Included Reckless Neue (paid) font reference and decorative image links.	Free serif/sans choices; no image links.
19	reviews listed as a separate entity beside experience description and dish ratings, creating three places for opinion text.	Experience description = written review; per-dish note = dish review. No separate reviews table in MVP (reversible; see Section 7).
SECTION 3 — DATA MODEL (spec for Phase 1+; adapt syntax, keep semantics)
sql
-- Enums
visibility_t        : 'public' | 'followers' | 'private'
collection_vis_t    : 'public' | 'private' | 'unlisted'
follow_status_t     : 'pending' | 'accepted'
experience_status_t : 'draft' | 'published'
notification_t      : 'follow' | 'follow_request' | 'follow_accepted' | 'like' | 'comment' | 'collection_like'
report_target_t     : 'experience' | 'comment' | 'user' | 'collection' | 'dish' | 'place'

-- Extensions: citext, pg_trgm, unaccent, pgcrypto (uuid), pg_cron (cleanup jobs)

profiles(
  id uuid pk references auth.users on delete cascade,
  username citext unique not null,           -- 3-30 chars, [a-z0-9_.], reserved words blocked
  display_name text, bio text, location_text text,
  avatar_path text, cover_path text,
  favourite_cuisines text[], social_links jsonb,
  is_private boolean default false,
  default_visibility visibility_t default 'public',
  discoverable boolean default true,
  notification_prefs jsonb,
  followers_count int, following_count int, experiences_count int,   -- trigger-maintained, counts only what is public
  role text default 'user',                  -- 'user' | 'moderator' | 'admin' (not client-writable)
  onboarding_completed_at, deletion_requested_at, created_at, updated_at)

follows(follower_id, following_id, status follow_status_t, created_at, pk(follower_id, following_id), check follower<>following)
  -- insert trigger: status = 'pending' if target is_private else 'accepted'
blocks(blocker_id, blocked_id, created_at, pk(blocker_id, blocked_id))
  -- creating a block deletes follows in both directions

food_categories(slug pk, label, sort_order, is_active)   -- restaurant, street_food, home_cooked, cafe_beverage, snack, dessert, bakery, fast_food, other (seed; extendable)

places(id, name, normalized_name, place_type, parent_place_id null,  -- branches/chains
  address, city, country, lat null, lng null, external_source null, external_id null,
  created_by, merged_into_id null, created_at,
  unique(external_source, external_id))

dishes(id, name, normalized_name, slug unique, cuisine null, description null,
  created_by, merged_into_id null, created_at)
dish_aliases(dish_id, alias, normalized_alias)

food_experiences(
  id, user_id references profiles,
  title null, category_slug references food_categories,
  eaten_at timestamptz default now(),         -- diary date; may be back-dated
  published_at timestamptz null,              -- feed order; set on first publish
  status experience_status_t default 'draft',
  visibility visibility_t,                    -- defaults from profile.default_visibility
  overall_rating smallint null check (between 1 and 10),
  description text null,
  place_id null references places,
  price_amount numeric(10,2) null, price_currency char(3) default 'INR',
  cuisine text null, tags text[] default '{}',
  search_tsv tsvector generated/maintained,
  created_at, updated_at)

experience_dishes(id, experience_id on delete cascade, dish_id references dishes,
  display_name text,                          -- what the user typed
  position int, rating smallint null check (between 1 and 10), note text null)

experience_photos(id, experience_id on delete cascade, storage_path, width, height, blurhash, alt_text, position)

collections(id, owner_id, name, description, cover_path, visibility collection_vis_t default 'private',
  share_token uuid unique default gen_random_uuid(), likes_count, created_at, updated_at)
collection_items(id, collection_id on delete cascade,
  experience_id null, dish_id null, place_id null,
  check (num_nonnulls(experience_id, dish_id, place_id) = 1),
  position numeric,                            -- fractional ordering, rebalance when gaps get tiny
  note text null, added_at)

experience_likes(user_id, experience_id, created_at, pk(user_id, experience_id))
collection_likes(user_id, collection_id, created_at, pk(user_id, collection_id))
comments(id, experience_id on delete cascade, user_id, body text check (char_length between 1 and 1000), created_at)  -- flat, no threads in MVP

notifications(id, recipient_id, actor_id, type notification_t, experience_id null, comment_id null,
  collection_id null, read_at null, created_at)  -- unique index prevents duplicate like notifications
reports(id, reporter_id, target_type, target_id, reason, details, status 'open'|'actioned'|'dismissed', handled_by null, created_at)
push_tokens(user_id, token, platform, created_at)          -- Phase 13
data_export_requests(id, user_id, status, file_path null, expires_at null, created_at)   -- Phase 11

-- Reference data is public: dishes, places, aliases. The LINK between a user and a dish/place (an experience) is what is protected.
-- Aggregates (security_invoker views, or materialized + refreshed when visibility changes):
dish_public_stats(dish_id, public_experience_count, public_rating_count, public_rating_avg)
place_public_stats(place_id, public_experience_count, public_rating_avg)
  -- count ONLY: status='published' AND visibility='public' AND owner profile is public AND owner not deleted

Required indexes: food_experiences(user_id, eaten_at desc), (user_id, status, published_at desc), (published_at desc) where status='published' and visibility='public', GIN on search_tsv, GIN trigram on dishes.normalized_name, places.normalized_name, profiles.username, plus every column referenced in an RLS policy.

SECTION 4 — AUTHORIZATION MODEL (build in Phase 1, reuse everywhere)

Helper functions (SQL, STABLE, SECURITY DEFINER, search_path = '', wrap auth.uid() as (select auth.uid()) inside policies for performance):

is_blocked_between(a uuid, b uuid) -> boolean
is_accepted_follower(viewer uuid, owner uuid) -> boolean
can_view_profile_content(viewer, owner): owner = viewer, OR (no block AND (owner profile is public OR viewer is accepted follower)).
can_view_experience(viewer, experience_id):
owner: always (including drafts)
others: status = 'published' AND no block AND can_view_profile_content AND entry visibility is public, or followers with accepted follow. private is owner-only.
can_view_collection(viewer, collection_id): owner; or public/unlisted (unlisted only via share token) AND owner not blocked. Items inside are filtered by can_view_experience etc. A viewer must never learn that a hidden item exists (do not show it, do not count it).

Truth table to test (pgTAP + one Playwright pass): viewer in {owner, accepted follower, pending follower, non-follower, blocked either way, anonymous} x entry in {public, followers, private, draft} x profile in {public, private}. Every cell has an explicit expected result.

Storage:

avatars bucket: public read (decision: avatars/covers are public even for private profiles); write only to {user_id}/….
experience-photos bucket: private. Path {user_id}/{experience_id}/{uuid}.jpg. Write only to own prefix. Reads go through signed URLs generated server-side (batch createSignedUrls) after a visibility check, short TTL.
Bucket config: file_size_limit, allowed_mime_types (jpeg, png, webp, heic converted client-side).

Moderation/admin: profiles.role set only by service role. Admin routes check role server-side AND have RLS policies for reading reports.

SECTION 5 — PHASES
Master Phase Prompt (paste into Antigravity, replace NN)
Read AGENTS.md and docs/IMPLEMENTATION_PLAN.md (Sections 3 and 4, plus "Phase NN"). Use Planning mode.
1. First produce an Implementation Plan artifact: files, migrations, components, tests, and any new dependency with a reason. Wait for my approval.
2. Then implement ONLY Phase NN. Do not start later phases or P1/P2 features.
3. Ship RLS policies and pgTAP tests in the same migration as any new table.
4. Run typecheck, lint, unit tests, `supabase test db`, the RLS audit script, and the Playwright journeys for this phase. Use the browser subagent to check 360px, 768px and 1280px layouts.
5. Finish with a Walkthrough artifact: tick every acceptance criterion for Phase NN with concrete evidence (test names, screenshots). List anything not done and any decision you had to make.
6. If anything is ambiguous or conflicts with the plan, stop and ask.

Sizing: S = days, M = ~1 week, L = 1-2 weeks, XL = 2+ weeks, for one developer working with agents. Re-estimate after Phase 4.

Phase 0 — Repo, tooling, environments (S)

Goal: a clean, reproducible base so every later phase is safe to automate.

Tasks

pnpm + Turborepo monorepo: apps/web, packages/domain, packages/db, supabase/, docs/, .agents/.
Next.js (App Router, TS strict), Tailwind, ESLint, Prettier, Vitest, Playwright.
supabase init; local stack via Supabase CLI; scripts: db:start, db:reset:local, db:types, db:test.
Three environments: local, staging (hosted Supabase + Vercel preview), production. .env.example documents every variable; service-role key never prefixed NEXT_PUBLIC_.
CI (GitHub Actions): install, typecheck, lint, unit tests, pgTAP, RLS audit script, build.
RLS audit script: query pg_tables/pg_policies; fail if any public table has RLS disabled or zero policies.
Sentry and PostHog wired as no-op-safe stubs; PostHog opt-in friendly.
Add AGENTS.md (Section 1) and docs/IMPLEMENTATION_PLAN.md.
Branch protection on main, PR template with "RLS + tests included?" checkbox.

Acceptance

pnpm dev serves the web app; pnpm db:start runs local Supabase; pnpm db:types generates types.
CI is green on an empty-feature PR; RLS audit fails when a test table is created without RLS (verify once, then remove).
Phase 1 — Database foundation and authorization (L)

Goal: the data model and privacy rules exist and are proven before any UI.

Tasks

Migrations for: extensions, enums, profiles (+ handle_new_user trigger on signup), follows, blocks, food_categories (seeded), places, dishes, dish_aliases, food_experiences, experience_dishes, experience_photos.
Helper functions from Section 4; RLS policies on every table; security_invoker views.
Triggers: updated_at, follow status by target privacy, block removes follows, denormalized counters (public-only).
Storage buckets and policies (Section 4).
RPC create_experience(payload jsonb) and update_experience(id, payload jsonb): transactional, validates ownership, dish/place existence, rating range.
Seed: categories, ~30 dishes and ~20 places (Hyderabad-flavoured) and 6 test users covering every viewer role in the truth table.
pgTAP suite implementing the full truth table from Section 4.
packages/domain: Zod schemas and constants matching the schema; rating helpers (halfStarsToDisplay, etc.).

Acceptance

Every truth-table cell passes; anonymous cannot read private/followers/draft data; a user cannot write another user's rows.
RLS audit script passes; Supabase security/performance advisors show no critical findings.
Generated types compile in apps/web.

Can run in parallel with Phase 2 (separate directories).

Phase 2 — Design system and app shell (M)

Goal: the editorial, cinematic identity as reusable code.

Tasks

Design tokens as CSS variables (dark charcoal background, warm off-white text, muted olive accent, subtle border, semantic states). Tune values for WCAG AA contrast.
Fonts via next/font: one serif display face and one clean sans (use free families; choose and state them in the plan).
Components: Button (primary/secondary/icon), Input/Textarea/Select/Combobox, Chip/Tag, RatingStars (half-star, keyboard + touch, read-only and interactive), Avatar, ExperienceCard (large-photo editorial layout), DishCard/DishChip, ProfileCard, CollectionCard, Modal and mobile bottom Sheet, Toast, Skeleton, EmptyState, ImageWithBlur.
App shell: desktop multi-column (left nav, central feed column, right contextual column); mobile bottom nav with a prominent centre Log action. Primary nav: Home, Explore, Log, Collections, Profile (Explore can render a "coming soon" state).
/dev/ui gallery route showing every component and state (disabled in production).
Landing page and static legal page shells.
Motion: restrained, respects prefers-reduced-motion.

Acceptance

Gallery renders every component in all states at 360/768/1280px.
Automated accessibility check (axe) passes on gallery and landing; focus visible; contrast AA.
No hard-coded colors or font names outside the token files.
Phase 3 — Authentication, onboarding, profiles (M) — P0

Tasks

Supabase Auth with @supabase/ssr: email/password, Google OAuth, email verification, password reset, logout. Session refresh in the Next.js middleware/proxy layer per current docs. Protected routes.
Onboarding: username (availability check, reserved words), display name, optional avatar, optional favourite cuisines, default entry visibility, account privacy.
Profile page /u/[username]: header, bio, counts (public-only), recent entries (respecting visibility), collections placeholder, follow button placeholder.
Settings: edit profile, avatar/cover upload (to avatars), privacy (profile public/private; default entry visibility), discoverability.
Minimum-age confirmation at signup (see Open Decisions).

Acceptance

E2E: sign up -> verify -> onboard -> edit profile -> log out -> log in -> reset password.
Unauthenticated users cannot reach protected routes; private-profile page shows a locked state to non-followers with no entry data in the HTML or network payload.
Username uniqueness is case-insensitive and enforced in the database.
Phase 4 — Food logging (XL) — the most important phase

Goal: logging is fast and never forces unnecessary detail.

UX contract

Quick Log: photo (or none) + one dish name + optional rating -> published in about three interactions. Time-to-log is measured.
Add details reveals the rest progressively: title, category, more dishes, place, price, cuisine, tags, description, visibility, date.

Tasks

Log flow as a modal/sheet (desktop) and full-screen sheet (mobile), one-handed friendly.
Fields per product context: title (opt), category (required, defaults to last used), dishes (>=1), place (opt), photos (opt), overall rating (opt, half-star), per-dish rating and note (opt), description (opt), eaten_at (defaults to now, editable), price (opt, INR default), cuisine (opt), tags (opt), visibility (defaults from profile).
Dish combobox: search existing dishes by trigram + aliases, select or "create new". Place combobox: same, optional.
Photo pipeline: multi-select, client-side compress (<=2048px, ~0.8 quality), strip EXIF, progress, reorder, remove, max 10 photos, generate blurhash and dimensions, upload to private bucket.
Draft autosave (status='draft') and Publish (sets published_at). Edit and Delete; delete removes storage objects.
Mutations through create_experience / update_experience RPC; idempotency key to prevent double-submit duplicates.
Entry detail page /e/[id] with signed-URL photos.
PostHog events: log_started, log_published, with duration and quick vs detailed.

Acceptance

Quick log of one dish with one photo completes in <= 3 interactions after opening Log.
Multi-dish entry with per-dish ratings saves atomically (failure leaves no partial rows).
Private entry photo URLs are inaccessible to other users and anonymous requests (tested).
A home-cooked entry with no place and no photos publishes successfully.
Deleting an entry removes its photos from storage.
Phase 5 — Food diary and personal archive (M) — P0

Tasks

Timeline grouped by date (by eaten_at), keyset pagination + infinite scroll.
Calendar month view: RPC returning per-day counts and a thumbnail; click a day to list entries.
Filters (URL-synced): category, cuisine, rating range, date range, place, visibility, draft status.
Personal search across title, description, dish names, place, tags (tsvector + trigram).
Empty states and a gentle "on this day" module (optional, small).
Edit and delete from the diary.

Acceptance

With a seeded user of ~1,000 entries, timeline and calendar queries use indexes (check EXPLAIN) and render quickly.
Filters combine correctly and survive page refresh.
Only the owner sees drafts and private entries in their diary; others never do.
Phase 6 — Canonical dishes/places and community ratings (L)

Tasks

Normalization (lowercase, unaccent, strip punctuation) and trigram "did you mean…?" before creating a dish or place.
Aliases (e.g. alternate spellings) and canonical records; merge_dishes / merge_places admin RPCs repointing references and leaving merged_into_id.
Place branches via parent_place_id; place search by name and city.
Community aggregates (dish_public_stats, place_public_stats) per Section 3.
Minimal public pages /dish/[slug], /place/[slug]: name, community average, count, list of publicly visible experiences. Show the viewer's own rating separately.
Duplicate reporting hooks (feeds Phase 8 reports).

Acceptance

Changing an entry to private/followers/draft immediately removes it from public aggregates and pages (tested).
Creating a near-duplicate dish prompts with matches; merge is atomic and idempotent.
Community average never includes entries the viewer could not themselves see.
Phase 7 — Social graph and feed (L) — P0

Tasks

Follow/unfollow; private accounts use pending requests (approve, decline, cancel). Followers/following lists respect privacy.
Blocking (removes follows both ways, hides content both ways).
Home feed RPC get_home_feed(cursor, limit) (security invoker): own + accepted-followed users' published entries visible to the viewer, ordered by published_at desc, id, keyset pagination. Chronological only.
Cold start: onboarding "people to follow" (public users with recent activity, simple rule) and an empty-feed state with prompts.
Seed accounts for the Hyderabad beta (content you control) — documented as a Phase 12 task.

Acceptance

Feed excludes private, followers-only (if not following), drafts, and blocked users' entries; verified with the truth table at the feed level.
Switching a followed account to private moves existing followers (accepted) intact and new followers to pending.
Feed payload contains no data for entries the viewer cannot see.
Phase 8 — Engagement, notifications, reporting (L) — P0

Tasks

Likes and flat comments (delete own; entry owner may delete comments on their entries); trigger-maintained counts.
Notifications via DB triggers: follow, request, accepted, like, comment. Dedupe likes. In-app notification center, unread badge, Realtime updates, mark read.
Report flow for experiences, comments, users, collections, dishes/places (duplicate reports).
Minimal moderation queue at /admin (role-gated server-side and via RLS): list, view context, action or dismiss.
Per-user DB-level rate limits for comments, reports, follows, likes.

Acceptance

Cannot like or comment on an entry you cannot view; blocked users cannot interact.
Notifications never reference or leak content the recipient cannot view.
Reports are visible only to moderators/admins.
Phase 9 — Collections (M) — P0

Tasks

Create/edit/delete collections with name, description, cover, visibility (public/private/unlisted via share token URL).
Items: experiences, dishes, places; add from any detail page; per-item note.
Reorder with fractional positions; drag-and-drop plus a keyboard-accessible alternative.
Viewer-filtered items: hidden items are neither shown nor counted.
Like a collection; share (copy link, Web Share API); OG image for public/unlisted collections.
Optional default "Want to try" collection (wishlist without needing an experience).

Acceptance

A public collection containing someone's private entry shows that entry only to its owner.
Unlisted collections are not discoverable via search, profile, or sitemap, and load only with the token.
Reordering persists and survives concurrent edits without duplicate positions.
Phase 10 — Search (M) — P0

Tasks

search_all(q, types[], city?, limit) (security invoker) across users, dishes, places, public experiences, public collections using Postgres full-text + pg_trgm. No external search service in the MVP.
Typeahead with debounce; tabs by type; place filter by city.
Respect discoverable, blocks, privacy and visibility everywhere.

Acceptance

Searching for a private entry's unique words as another user returns nothing.
Misspellings (e.g. "birayni") still find biryani.
Typical queries return quickly on a seeded dataset (record timings in the walkthrough).
Phase 11 — Account lifecycle, privacy tooling, abuse protection (M)

Tasks

Account deletion: request -> grace period -> hard delete of rows and storage objects (scheduled job). Also available in-app (required by app stores).
Data export: async job producing JSON + photos archive, expiring signed link.
Notification and discoverability settings.
Rate limiting: Supabase Auth limits plus app-level IP/user limits on uploads and writes (e.g. Upstash or DB-based).
Upload validation: MIME sniffing, size limits, dimension limits, bucket config.
Legal pages: Terms, Privacy Policy, Community Guidelines (reviewed by a lawyer; see Open Decisions on age and India's data protection law).
Security review pass: RLS audit, advisors, secret scan, dependency audit, headers/CSP.

Acceptance

Deleting an account removes profile, entries, photos, likes, comments, follows, notifications; data no longer appears anywhere (feeds, search, aggregates, collections).
Export contains only the requesting user's data.
Oversized or wrong-type uploads are rejected server-side.
Phase 12 — Web MVP hardening and closed beta (M)

Tasks

Playwright journeys (two browser contexts for social): sign up -> log (quick and detailed) -> diary -> follow -> feed -> like/comment -> collection -> search -> privacy changes -> block -> delete account.
Performance (Lighthouse, bundle size, slow query review), accessibility (axe), SEO/OG for public pages, noindex for private/unlisted.
Error monitoring, PostHog funnel and the Section 6 metrics, feedback entry point.
Production infrastructure: paid Supabase tier (backups, no inactivity pausing; check image-transform needs), Vercel plan appropriate for commercial use.
Beta ops: invite list or allow-list, 10-20 seed creators in Hyderabad, onboarding script, weekly metrics review.
Tick the MVP launch gate (Section 7).

Acceptance

All 14 launch-gate items pass; E2E suite green in CI; no open critical RLS or security findings.
Phase 13 — Mobile app, Expo (XL)

Prerequisite: web beta feedback addressed.

Tasks

apps/mobile with Expo Router; reuse packages/domain and packages/db; NativeWind (or equivalent) with the same design tokens.
Session storage in secure storage; native Google sign-in.
Core screens: auth, onboarding, feed, diary + calendar, log flow, entry detail, profile, collections, search, notifications, settings.
Logging optimized for one hand: camera/gallery, on-device compression, background upload queue with retry, offline drafts that sync.
Push notifications (Expo Push) with push_tokens and an Edge Function triggered from notifications; deep/universal links to profiles, entries, collections.
Store compliance: in-app account deletion, content reporting and blocking, privacy labels, accurate permission strings.
EAS Build/Submit, internal testing tracks.

Acceptance

A user can complete the full journey on iOS and Android; offline-created drafts sync once connectivity returns; push deep-links open the correct screen.
Same RLS rules apply with no client-side exceptions.
Phase 14 — P1 features (order by beta evidence)
Taste identity and stats (computed only from real data; owner sees full stats, others see only public-entry-based stats): totals, favourite cuisines, top-rated dishes, average rating, most-logged categories, monthly activity. No personality claims.
Explore: trending (time-decayed likes/comments on public entries), popular dishes, collections, suggested users, recently reviewed places.
Rich dish and place pages; location-based discovery and food maps (explicit consent; no precise live location).
Collection rankings; improved recommendations.
Annual recap ("Food Year"): generated from real activity, shareable image.
P2 (later)

AI recommendations, menu/receipt scanning, automatic dish recognition, taste matching, group food planning, creator analytics.

SECTION 6 — KEY PRODUCT RULES (condensed from the MORS product context)
Tagline: Your food. Your memories. Your taste.
Experience > restaurant review. A dish can appear in many users' experiences; places are optional.
Public by default; private profiles require follow approval.
Chronological, follows-based feed first; no ad-driven discovery.
Metrics that matter: first-log completion, time to log, weekly experiences per active user, D7/D30 retention, follows per user, collection creation rate, repeat logging, diary revisit rate.
Primary question: do people return because they want to document and revisit their food experiences?
SECTION 7 — MVP LAUNCH GATE (all must pass)
 Register, log in, manage profile
 Create and edit multi-dish experiences
 Upload multiple photos
 Rate experiences and individual dishes
 Browse and filter diary (timeline + calendar)
 Follow users; personalized chronological feed
 Like and comment
 Create and share collections
 Search dishes, users, places
 Public / followers-only / private visibility correct everywhere
 Private data protected by database policies (pgTAP truth table green)
 Report, block, delete account, export data
 Works at mobile widths
 Core journeys pass end-to-end tests in CI
SECTION 8 — OPEN DECISIONS (resolve before the phase noted)
Place data source (Phase 4/6): user-created only, OpenStreetMap/Nominatim, or Google Places (cost and storage terms). Default: user-created + city text for MVP.
Minimum age and data-protection compliance (Phase 3/11): decide 13+/16+/18+ and have a lawyer confirm requirements, including India's DPDP Act rules on children's data.
Account deletion grace period (Phase 11): immediate vs 14-30 days.
Beta access (Phase 12): open signup vs invite codes.
Rate limiting backend (Phase 11): Upstash vs DB-only.
Email provider for auth/notification email (Phase 3/8): e.g. Resend with a custom domain.
Separate reviews table: v2 omits it (experience description + per-dish note). Reintroduce only if dish-level written reviews need their own lifecycle.
Avatars/covers public even for private profiles: v2 assumes yes. Change if you want them hidden.
Moderation capacity: who reviews reports during beta and within what time.