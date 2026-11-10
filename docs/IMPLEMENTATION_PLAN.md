# MORS — Implementation Plan v3 (master spec)

Status: supersedes the v2 plan and the ChatGPT roadmap. Companion files: `AGENTS.md` (repo root, short rules), `docs/PHASES.md` (phases 0-14), `docs/PHASES_POST_BETA.md` (14B and 15-21) and `docs/PHASES_NEXT.md` (22-31). Save this file as `docs/IMPLEMENTATION_PLAN.md`.

If this file contradicts the product context, the product context wins. If it contradicts itself, stop and ask.

---

## 0. How to use this with Antigravity

1. Create `mors/`, open it as an Antigravity workspace, `git init`.
2. Save: `AGENTS.md` (repo root), `docs/IMPLEMENTATION_PLAN.md`, `docs/PHASES.md`, `docs/PHASES_POST_BETA.md`, `docs/PHASES_NEXT.md`, and the original product context as `docs/PRODUCT_CONTEXT.md`.
3. Rule files: Antigravity reads `AGENTS.md` (supported since v1.20.3) and `GEMINI.md`; if both exist, `GEMINI.md` wins on conflicts. Workspace rules folder is `.agents/rules/`. Each rule file has a **12,000 character limit**; our `AGENTS.md` is ~6,700. Do not add `.agents/` to `.gitignore`. Behaviour differs between Antigravity CLI and Antigravity 2.0: if rules seem ignored, confirm which one you run and that `AGENTS.md` is in the active workspace root. Nested `AGENTS.md` loading is a setting (Settings → Agents) — leave it off.
4. Known weakness: users report agents sometimes ignore rule files. Therefore every phase prompt (section 10) restates the three most critical rules, and every phase ends with a Walkthrough that must prove compliance with evidence. Never accept "done" without test output.
5. Settings: Planning mode always; review-driven policy; terminal commands ask first (allowlist `pnpm`, `git status`, `supabase test db`); deny `supabase db reset --linked`, `supabase db push` to production, `rm -rf`. Connect any Supabase MCP to the **dev** project only.
6. One phase per conversation. Review the Implementation Plan artifact before approving; review the Walkthrough artifact (screenshots at 360/768/1280px) before merging.
7. Parallelism: only Phase 1 (database) and Phase 2 (design system) are independent. Everything else is sequential. Never let two agents touch `supabase/migrations/` at the same time.
8. If the repo already contains code, run the **Repo Reality Check** prompt (section 10) first. Do not assume existing code matches this plan.

---

## 1. Inputs reconciled

| Input | What it contributed |
|---|---|
| Product context (MORS vision) | Source of truth: food experience as central object, privacy model, P0/P1/P2 scope, brand, metrics |
| v2 plan (Claude) | Phases 0–14 skeleton, data model, RLS truth-table approach, Antigravity workflow |
| ChatGPT roadmap | Phases 15–22 ideas (polish, functional audit, logging upgrades, social, taste, explore, reliability, growth) and the "audit before building" instruction |

Goal of v3: one coherent roadmap where privacy is provable, nothing is fake, logging is fast, and later features are earned by beta evidence.

---

## 2. Corrections to the ChatGPT roadmap

| # | Problem | Correction in v3 |
|---|---|---|
| 1 | "Make every feature work" and "UI polish" were late phases (15–16), i.e. quality is audited after everything is built. Fake buttons would accumulate for months. | Quality is a per-phase rule: Feature Registry + `check:nofake` CI + Definition of Done from Phase 0. Phase 13 is a final cross-screen consistency and registry audit, not the first time anyone checks. |
| 2 | Logging improvements (recent dishes/places, duplicate, drafts, edit after publish) came after social, discovery and polish. Logging is principle #1. | Quick Log in Phase 4, recents / log-again / drafts / editing in Phase 5, before diary and social. |
| 3 | Reliability/production readiness (its Phase 21) was placed after taste and Explore, yet labelled "before public launch". | Reliability work is Phases 12–14, before beta. Continuous items (query plans, slow-network tests) sit inside each phase. |
| 4 | Duplicated existing phases: its Phase 19–20 repeat v2 Phase 14 (taste, Explore, recap). | Merged into single post-beta phases 16–20 with beta-evidence gates. |
| 5 | Bookmarks/"saved" as a new table and feature. | Saving = adding to a private system collection "Saved" (reuses collections, RLS, UI). No new table. |
| 6 | Comment @mentions and "social previews" listed without privacy analysis. | Mentions deferred to Phase 19 with block/privacy rules; share previews only for the public pool (never private/unlisted entries). |
| 7 | Referral/growth in the roadmap with no gating. | Phase 21 gated on D30 retention evidence; listed under "do not build yet". |
| 8 | "Personal food map" and "near a selected place" without location-privacy design. | Maps deferred to Phase 18 with consent model; coordinates are city-level by default; no live location. |
| 9 | "Recommendation explanations" like "Because you log South Indian food" with no rule on data use. | Allowed only from the viewer's own logs and the public pool; never reveal another user's private data (rule 13 in AGENTS.md). |
| 10 | Suggested the agent audit the repo but gave no audit format or gate. | Repo Reality Check prompt + `docs/AUDIT.md` (Complete / Incomplete / Broken + evidence) required before any new phase if code exists. |
| 11 | Priority table put UI polish above reliability and logging. | Final order: privacy foundation → logging → diary → social → search → account safety → audit/polish → beta. |
| 12 | Generic "unlimited" phase scope (no sizes, no bucket per phase). | Every phase has size, release bucket, dependencies, edge cases, tests, acceptance. |

What we kept from it unchanged: don't build chat/DMs, gamification, AI recommendations or sponsored content early; remove fake interactions; photography-first layouts; empty states that guide action; reduced-motion support; "log again" one-tap action.

---

## 3. Upgrades over the v2 plan (found in review)

| # | Gap in v2 | Fix in v3 |
|---|---|---|
| 1 | **Reference-data leak**: dishes/places are world-readable with `created_by`. A rare place name or `created_by` reveals a private entry's existence/author. | New dishes/places start **unlisted** (`is_listed=false`, visible only to creator). Listed once used by a public-pool entry or curated by an admin. `created_by` excluded via column-level grants. |
| 2 | **Timezone bug**: diary/calendar grouped by `eaten_at` UTC would put a 1 a.m. IST snack on the wrong day. | `profiles.timezone` (default `Asia/Kolkata`) and `food_experiences.eaten_date` (local date computed at write). Calendar and timeline use `eaten_date`. |
| 3 | **Storage deletion**: deleting `storage.objects` rows in SQL does not delete the files, and deleting an entry row doesn't touch storage. | `storage_cleanup_queue` filled by triggers; an Edge Function deletes via the Storage API; nightly reconcile for orphans. Same path used by account deletion. |
| 4 | **Signed URL design** relied on the service role. | Storage `SELECT` policy on `experience-photos` calls `can_view_experience`, so the user's own session (or anon for public entries) can create signed URLs. Service role not needed. |
| 5 | Image transformations are a paid Supabase feature; v2 assumed 2048px single file. | Client generates two variants (display 1280px, thumb 400px). Feed uses thumbs. No dependency on transforms. |
| 6 | Unlisted collections "via token" but RLS cannot read URL tokens. | Unlisted access only through `get_collection_by_token(token)` SECURITY DEFINER RPC that filters items by viewer. Direct table policies never expose unlisted rows to non-owners. |
| 7 | Concurrent reorder "survives" was a bare claim. | `move_collection_item(item_id, after_id)` RPC locks the collection row, computes position, rebalances inside the same transaction. |
| 8 | Idempotency key mentioned, not modelled. | `client_request_id uuid`, `unique(user_id, client_request_id)`; RPC returns the existing row on retry. |
| 9 | Community aggregates "views or materialized" — viewer-dependent views are slow and can leak. | Trigger-maintained tables `dish_public_stats`, `place_public_stats` computed from the public pool only. |
| 10 | Notifications could reference entries that later became private. | Notification reads join through `can_view_experience`; unviewable rows are filtered at read time (and tested). |
| 11 | Search index details missing (`unaccent` is not immutable, so can't index directly). | `immutable_unaccent()` wrapper; `search_tsv` maintained by trigger with `simple` config (names are multilingual/transliterated). |
| 12 | OG images for public pages could expose private photos. | OG only for public-pool entries; server verifies as **anon** that the entry is viewable before rendering. Private/unlisted get a generic image + `noindex`. |
| 13 | Search-engine indexing of public entries undecided. | Default `noindex` for all user content during beta; per-user opt-in "allow search engines" arrives in Phase 21. |
| 14 | No "fake functionality" control (the ChatGPT concern). | `FEATURE_REGISTRY.md`, `check:nofake`, allowlist file, Playwright test per row. |
| 15 | Phase 4 (XL) was too large to review. | Split: Phase 4 Quick Log + photo pipeline; Phase 5 full logging, drafts, edit, recents, log-again. |
| 16 | PostHog could capture user text. | Analytics events carry no free text; consent-gated; IDs only. |
| 17 | Moderation + abuse minimal. | Report reasons enum, per-user rate limits table, new-account write limits, admin queue with audit log (`moderation_actions`). |
| 18 | Hand-rolled accessibility for dialogs/comboboxes. | Use Radix UI or React Aria primitives; styled with tokens. |

---

## 4. Architecture and repository layout

```
mors/
  AGENTS.md
  apps/web/              Next.js App Router, TS strict, Tailwind
  apps/mobile/           Expo (created in Phase 15 only)
  packages/domain/       Zod schemas, constants, rating helpers, visibility types
  packages/tokens/       design tokens (JSON) -> CSS variables + Tailwind theme
  packages/db/           generated Supabase types
  supabase/
    migrations/  seed/  tests/ (pgTAP + truth_table.csv)  functions/ (Edge Functions)
  scripts/               check-rls, check-nofake, check-secrets, allowed-placeholders.json
  docs/                  IMPLEMENTATION_PLAN.md PHASES.md PRODUCT_CONTEXT.md
                         FEATURE_REGISTRY.md DECISIONS.md AUDIT.md (if code pre-existed)
  .github/workflows/ci.yml
```

Stack facts to verify in current docs before use: Next.js session refresh layer (middleware vs proxy file naming depends on version), `@supabase/ssr` cookie handling, Supabase API key model (publishable/secret vs anon/service_role), Tailwind CSS-first `@theme` config, Expo Router. Record installed versions in `docs/DECISIONS.md`.

Environments: local (Supabase CLI), staging (hosted Supabase + Vercel preview), production. Beta and production must be on a paid Supabase tier (backups, no inactivity pause).

Request flow rule: browser → Next.js (Server Components / Server Actions) → Supabase with the **user's session** (RLS applies). Service role only inside Edge Functions and one audited server module (`apps/web/src/server/admin-client.ts`) used for: account hard-delete, export job, storage cleanup, moderation actions, OG rendering checks.

---

## 5. Data model

Spec level: keep semantics, adapt syntax. All tables in `public`, RLS on, policies in the same migration.

### 5.1 Enums and extensions
```
visibility_t        : public | followers | private
collection_vis_t    : public | private | unlisted
follow_status_t     : pending | accepted
experience_status_t : draft | published
notification_t      : follow | follow_request | follow_accepted | like | comment | collection_like   (mention added in Phase 19)
report_target_t     : experience | comment | user | collection | dish | place
report_reason_t     : spam | harassment | inappropriate_image | misinformation | privacy | duplicate | other
extensions          : citext, pg_trgm, unaccent, pg_cron
```
`gen_random_uuid()` is built in; do not add pgcrypto unless needed.

### 5.2 Tables
```sql
profiles(
  id uuid pk references auth.users on delete cascade,
  username citext unique not null,        -- 3-30, [a-z0-9_.], reserved list blocked, cannot start/end with . or _
  username_changed_at timestamptz,        -- allow change once per 30 days
  display_name text, bio text (max 300), location_text text,
  avatar_path text, cover_path text,
  favourite_cuisines text[], social_links jsonb,
  timezone text not null default 'Asia/Kolkata',
  is_private boolean not null default false,
  default_visibility visibility_t not null default 'public',
  discoverable boolean not null default true,
  notification_prefs jsonb,
  followers_count int, following_count int,   -- accepted follows only; trigger-maintained
  public_experiences_count int,               -- public pool only; owner's own total is queried live
  role text not null default 'user',          -- user|moderator|admin; service-role write only
  birth_year_confirmed boolean,               -- minimum-age confirmation (decision 2), NOT date of birth
  onboarding_completed_at, deletion_requested_at, created_at, updated_at)

follows(follower_id, following_id, status follow_status_t, created_at,
  pk(follower_id, following_id), check(follower_id <> following_id))
  -- BEFORE INSERT trigger: status = pending if target.is_private else accepted
  -- AFTER UPDATE of profiles.is_private -> public: auto-accept pending (documented decision); private: existing accepted follows kept
blocks(blocker_id, blocked_id, created_at, pk(blocker_id, blocked_id))
  -- AFTER INSERT trigger deletes follows both directions and pending notifications between the two

food_categories(slug pk, label, sort_order, is_active)
  -- seed: restaurant, street_food, home_cooked, cafe_beverage, snack, dessert, bakery, fast_food, travel_food, special_occasion, other
  -- "everyday meal"/"traditional-regional" are covered by tags + cuisine, not categories

places(id, name, normalized_name, place_type, parent_place_id null,
  address null, city, country default 'IN', lat null, lng null,        -- city-level precision unless owner of place record consents (Phase 18)
  external_source null, external_id null, unique(external_source, external_id),
  is_listed boolean not null default false, listed_at null,
  created_by uuid,                         -- NOT selectable by clients (column-level grants)
  merged_into_id null, created_at)

dishes(id, name, normalized_name, slug unique, cuisine null, description null,
  is_listed boolean not null default false, listed_at null,
  created_by uuid,                         -- NOT selectable by clients
  merged_into_id null, created_at)
dish_aliases(dish_id, alias, normalized_alias)

food_experiences(
  id, user_id references profiles on delete cascade,
  client_request_id uuid not null, unique(user_id, client_request_id),
  title null (max 120), category_slug references food_categories,
  eaten_at timestamptz not null default now(),
  eaten_date date not null,                -- local date in profiles.timezone at write time; diary/calendar use this
  published_at timestamptz null,           -- set at FIRST publish; feed order
  status experience_status_t not null default 'draft',
  visibility visibility_t not null,        -- defaulted from profile.default_visibility by RPC
  overall_rating smallint null check (overall_rating between 1 and 10),
  description null (max 5000),
  place_id null references places,
  price_amount numeric(10,2) null check (>= 0), price_currency char(3) default 'INR',
  cuisine text null, tags text[] not null default '{}' (max 10 tags, each max 30 chars),
  search_tsv tsvector,                     -- trigger-maintained
  created_at, updated_at,
  check (status = 'draft' or published_at is not null))

experience_dishes(id, experience_id on delete cascade, dish_id references dishes,
  display_name text not null, position int not null, rating smallint null check (1..10), note text null (max 1000),
  unique(experience_id, position))
experience_photos(id, experience_id on delete cascade,
  storage_path text, thumb_path text, width int, height int, blurhash text, alt_text text null, position int,
  unique(experience_id, position))                       -- max 10 per experience, enforced in RPC and trigger

collections(id, owner_id, name (max 80), description (max 500), cover_path null,
  visibility collection_vis_t not null default 'private',
  system_key text null,                    -- 'saved' for the default Saved collection; unique(owner_id, system_key)
  share_token uuid unique not null default gen_random_uuid(),
  likes_count int, created_at, updated_at)
collection_items(id, collection_id on delete cascade,
  experience_id null, dish_id null, place_id null,
  check (num_nonnulls(experience_id, dish_id, place_id) = 1),
  position numeric not null, note null (max 300), added_at,
  unique(collection_id, position))
  -- partial unique indexes prevent the same target twice in one collection

experience_likes(user_id, experience_id, created_at, pk(user_id, experience_id))
collection_likes(user_id, collection_id, created_at, pk(user_id, collection_id))
comments(id, experience_id on delete cascade, user_id, body check (char_length between 1 and 1000), created_at)   -- flat; no threads in MVP

notifications(id, recipient_id, actor_id, type, experience_id null, comment_id null, collection_id null, read_at null, created_at)
  -- unique partial index to dedupe like notifications; read via view/RPC joined through can_view_*
reports(id, reporter_id, target_type, target_id, reason report_reason_t, details (max 1000), status open|actioned|dismissed,
  handled_by null, handled_at null, created_at, unique(reporter_id, target_type, target_id))
moderation_actions(id, report_id, moderator_id, action, note, created_at)      -- audit log

dish_public_stats(dish_id pk, public_experience_count, public_rating_count, public_rating_avg_half_stars numeric(4,2), updated_at)
place_public_stats(place_id pk, public_experience_count, public_rating_count, public_rating_avg_half_stars, updated_at)
  -- trigger-maintained from the PUBLIC POOL only (section 6.1)

rate_limit_events(user_id, action, created_at)     -- DB-side limits (decision 5), pruned by pg_cron
storage_cleanup_queue(id, bucket, path, created_at, attempts, done_at null)
data_export_requests(id, user_id, status, file_path null, expires_at null, created_at)      -- Phase 12
push_tokens(user_id, token, platform, created_at)                                           -- Phase 15
```

### 5.3 Reference-data visibility
- `dishes`/`places` rows are readable by everyone when `is_listed = true`, and by their creator and by owners of experiences referencing them when unlisted.
- Column-level grants: revoke table-wide `SELECT` from `anon, authenticated`, then `GRANT SELECT (id, name, slug, cuisine, ...)` excluding `created_by`.
- `is_listed` flips to true by trigger when an experience referencing the row enters the public pool, or by admin. Do not auto-unlist if other public experiences still reference it; recompute on visibility/status change.
- Near-duplicate suggestions ("did you mean…") in the log flow draw from listed rows plus the user's own unlisted rows.

### 5.4 Required indexes
`food_experiences`: `(user_id, eaten_date desc, id desc)`, `(user_id, status, published_at desc, id desc)`, `(published_at desc, id desc) where status='published' and visibility='public'`, GIN `search_tsv`, `(place_id)`, `(category_slug)`. `experience_dishes(dish_id)`, `(experience_id)`. `follows(following_id, status)`. `notifications(recipient_id, created_at desc, id desc)`. GIN trigram on `dishes.normalized_name`, `places.normalized_name`, `profiles.username`. Plus an index for **every column referenced by an RLS policy**. Verify with `EXPLAIN` on a seeded 1,000-entry user and a 20,000-entry public pool.

### 5.5 Normalisation
`normalize(text)`: lowercase → `immutable_unaccent` → strip punctuation → collapse whitespace. Stored in `normalized_name`. Aliases (e.g. "biriyani", "biryani") in `dish_aliases`. Transliteration variants for Telugu/Hindi food names are added as aliases in seed data.

---

## 6. Authorization model

### 6.1 Definitions
- **Effective visibility** = most restrictive of profile privacy and entry visibility.
- **Public pool** = `status='published' AND visibility='public' AND owner.is_private=false AND owner.discoverable=true AND owner.deletion_requested_at IS NULL`. Used by community aggregates, global search of experiences, dish/place pages, Explore, OG images, sitemaps.
- Owners always see their own content, including drafts and private entries.

### 6.2 Helper functions
SQL, `STABLE`, `SECURITY DEFINER`, `SET search_path = ''`, schema-qualified, null-safe for anonymous (`viewer IS NULL`). In policies call as `(select auth.uid())`.

- `is_blocked_between(a, b)`
- `is_accepted_follower(viewer, owner)`
- `can_view_profile_content(viewer, owner)`: viewer = owner OR (no block AND (owner public OR viewer is accepted follower)). Anonymous: owner public only.
- `can_view_experience(viewer, experience_id)`: owner → always. Otherwise `status='published'` AND no block AND `can_view_profile_content` AND (visibility='public' OR (visibility='followers' AND accepted follower)). `private` = owner only.
- `can_view_collection(viewer, collection_id)`: owner, or visibility='public' and owner not blocked. **Unlisted never via table access**; only `get_collection_by_token`.
- `can_view_comment(viewer, comment_id)`: `can_view_experience` AND no block between viewer and commenter.
- Items inside collections are filtered per item (`can_view_experience`, dish/place `is_listed`). A viewer must never learn a hidden item exists: not shown, not counted, no position gaps exposed.

### 6.3 Truth table (the privacy oracle)
Axes: viewer ∈ {owner, accepted follower, pending follower, non-follower, blocked by owner, blocker of owner, anonymous} × entry ∈ {public, followers, private, draft} × owner profile ∈ {public, private}. Expected results live in `supabase/tests/truth_table.csv`, **written independently of the SQL** (derive from the rules above, not from the functions). One pgTAP test iterates every row against: direct table select, feed RPC, search RPC, dish/place public lists, aggregates, notifications read, collection item listing, storage signed-URL creation. A separate Playwright test samples the same matrix through the UI with two browser contexts.

### 6.4 Storage
- `avatars` (public read; write only to own `{user_id}/` prefix). Decision 8: avatars/covers public even for private profiles.
- `experience-photos` (private). Paths: `{user_id}/{experience_id}/{photo_uuid}.jpg` and `{...}/{photo_uuid}_t.jpg`. INSERT/UPDATE/DELETE only to own prefix. SELECT policy (`to anon, authenticated`): parse experience id from path and require `can_view_experience(auth.uid(), id)`. Bucket config: `file_size_limit` (display ≤ 1.5 MB, thumb ≤ 200 KB), `allowed_mime_types` (jpeg, webp).
- Signed URLs: server component batches `createSignedUrls`, TTL 3600 s, called with the user's session (not service role).
- Deletions: triggers on `experience_photos` delete and profile deletion insert into `storage_cleanup_queue`; Edge Function drains it through the Storage API; nightly reconcile lists the bucket and enqueues orphans.

### 6.5 Admin and moderation
`profiles.role` is writable only by service role. `/admin` routes check role server-side AND rely on RLS (`reports`, `moderation_actions` readable by moderators/admins only). Moderator actions go through RPCs that write `moderation_actions`.

### 6.6 Rules that must hold everywhere
Return "not found" for hidden and nonexistent content alike. Counts shown to a viewer include only items that viewer can see (except follower/following counts, which are shown for all profiles; their lists respect privacy). Realtime channels subscribe only to rows the user's RLS allows. Error messages never contain titles, usernames or counts of hidden content.

---

## 7. Cross-cutting standards

### 7.1 Design system (Phase 2 implements; all later phases obey)
Tokens live in `packages/tokens` and are the only place colours/fonts/spacing are defined. Starting values (tune for WCAG AA and verify with axe/contrast script):

| Token | Value | Use |
|---|---|---|
| `--bg` | `#141412` | page |
| `--surface` | `#1B1B18` | raised areas (use sparingly) |
| `--border` | `#2E2E2A` | 1px dividers |
| `--text` | `#EDE8DC` | primary text |
| `--text-muted` | `#A8A397` | secondary text |
| `--accent` | `#8A9A5B` | muted olive: links, primary buttons, rating stars |
| `--accent-ink` | `#141412` | text on accent |
| `--danger` | `#C8553D` | destructive |
| `--focus` | `#D8E0B8` | focus ring (2px, offset 2px) |

Typography: display serif **Newsreader**, body sans **Inter** (both free, via `next/font`); confirm in the Phase 2 plan. Scale: 12/14/16/18/24/32/48; line-height 1.5 body, 1.15 display. Spacing 4px base. Image ratios: feed 4:5, detail 3:2 or original, thumbs 1:1. Icons: one set (lucide), 20px default. Radius: small (4px) only; avoid pill clutter except chips. Motion: 120–200 ms ease-out; like-heart pop, sheet slide, list reorder; all disabled under `prefers-reduced-motion`.

Layout: desktop three-column (left nav, centre column max ~640px, right contextual column); tablet two-column (rail nav + content); mobile single column with bottom nav and prominent centre Log button. Tablet and mobile layouts are designed, not shrunk desktop.

Avoid: gradients (except photo scrims for text legibility), glass blur, drop-shadow card stacks, dashboard stat tiles, delivery-app badges.

### 7.2 Logging UX contract
- Quick Log: ≤ 3 interactions after opening Log (pick photo → type dish name → Post). Rating optional. Category defaults to last used. Visibility defaults from profile.
- "Add details" is progressive disclosure. Nothing but a dish name is mandatory (photo optional, place optional).
- Draft autosave every few seconds locally (IndexedDB) and to server on field blur; recoverable after refresh/crash.
- Duplicate/"Log again": copies category, dishes, place, tags, cuisine, price; **not** photos, rating, description; eaten_at = now; opens as a draft in the form.

### 7.3 Photo pipeline
`createImageBitmap(file, {imageOrientation:'from-image'})` → canvas re-encode (drops EXIF/GPS) → display 1280px and thumb 400px longest edge, JPEG ~0.82 → blurhash from thumb → upload both → register in RPC. HEIC: rely on browser/OS conversion; fallback `heic2any` only if beta users hit it (record as dependency decision). Upload with progress, retry with backoff, resumable queue for interrupted uploads. Max 10 photos. Server validates size, MIME sniffing and dimensions again (Phase 12).

### 7.4 Search
Postgres only. Tsvector `simple` config over title, description, dish names, place name, tags, cuisine; trigram on names for typo tolerance ("birayni" → biryani). Personal search (diary) uses the owner's data; global search uses public pool + discoverable users + listed dishes/places. Debounce 200 ms; limit 20 per type.

### 7.5 Pagination, concurrency, validation
Keyset pagination with `(sort_key, id)` cursors, opaque base64 cursor validated by Zod. No OFFSET. Optimistic UI only where the server result is reconciled. All inputs validated by Zod from `packages/domain` on both client and server; RPCs re-validate (never trust the client).

### 7.6 Analytics and observability
PostHog (consent-gated, no free text): `signup_completed`, `onboarding_completed`, `log_started`, `log_published{mode,duration_ms,photo_count,dish_count}`, `diary_viewed`, `calendar_viewed`, `follow_created`, `like_created`, `comment_created`, `collection_created`, `search_used{type}` (no query text), `share_clicked`. Sentry for errors with PII scrubbing. Metrics from the product context are derived from these.

### 7.7 Testing layers
Unit (Vitest: domain helpers, Zod, rating conversion) · pgTAP (RLS truth table, triggers, RPCs, merge, counters) · integration (RPC through Supabase client as different users) · Playwright E2E (two contexts for social) · axe a11y · Lighthouse budget · visual checks at 360/768/1280 · `check:rls` · `check:nofake` · `check:secrets`.

### 7.8 Feature Registry and the no-fake rule
`docs/FEATURE_REGISTRY.md` is a table maintained by every phase:

`| id | screen | element | user action | expected outcome | data effect (table/column) | test id | status |`

- A control without a registry row fails review.
- `pnpm check:nofake` fails on: empty handlers (`onClick={() => {}}`), `TODO(stub)`, "coming soon" text, `lorem ipsum`, hard-coded sample arrays in `apps/`, `faker` outside `supabase/seed`, disabled buttons without a reason. `scripts/allowed-placeholders.json` lists owner-approved exceptions.
- Features for later phases are **not rendered** (no dead nav items). The Explore tab appears only when Phase 17 ships; until then primary nav has 4 items on web (Home, Log, Collections, Profile) plus Search; the 5-item nav from the product context is restored in Phase 17. (If you prefer to keep the 5-item nav now, Explore must contain real content: a people-to-follow list and recent public collections. Record the choice in DECISIONS.md.)

### 7.9 Definition of Done (every phase)
Typecheck, lint, unit, pgTAP, integration, phase E2E green; `check:*` green; axe clean; 360/768/1280 visual pass; loading/empty/error/success states present; registry rows green; migrations reviewed (RLS + indexes + tests); no new dependency without a reason; `.env.example` and DECISIONS.md updated; Walkthrough artifact with evidence for every acceptance criterion and a list of anything not done.

---

## 8. Roadmap overview

Sizes: S = days, M ≈ 1 week, L = 1–2 weeks, XL = 2+ weeks (one developer plus agents). Re-estimate after Phase 5 using real velocity.

| Phase | Name | Size | Bucket | Notes |
|---|---|---|---|---|
| 0 | Repo, tooling, guardrails, reality check | S | MVP | |
| 1 | Database foundation and authorization | L | MVP | parallel with 2 |
| 2 | Design system and app shell | M | MVP | parallel with 1 |
| 3 | Auth, onboarding, profiles | M | MVP | |
| 4 | Quick Log and photo pipeline | L | MVP | |
| 5 | Full logging: details, drafts, edit, recents, log again | L | MVP | |
| 6 | Diary and personal archive | M | MVP | |
| 7 | Canonical dishes/places and community ratings | L | MVP | |
| 8 | Social graph and home feed | L | MVP | |
| 9 | Likes, comments, notifications, reporting, moderation | L | MVP | |
| 10 | Collections and Saved | M | MVP | |
| 11 | Search | M | MVP | |
| 12 | Account lifecycle, abuse protection, security | M | MVP | |
| 13 | Functional audit and cross-screen polish | M | MVP | gate: registry 100% |
| 14 | Hardening and closed beta (Hyderabad, 50–100 users) | M | MVP | launch gate |
| 14B | Beta learning sprint (scorecard, friction fixes, opt-in retention loops, BETA_REVIEW_01) | M | Post-beta | gate: ~4 weeks of beta data |
| 15 | Mobile app (Expo) in slices 15a/15b/15c | XL | Post-beta | gate: native justified by review |
| 16 | Taste identity and stats | M | Post-beta P1 | needs real data |
| 17 | Explore and discovery | L | Post-beta P1 | restores 5-item nav |
| 18 | Maps, location, rich dish/place pages | L | Post-beta P1 | consent model |
| 19 | Social upgrades (mentions, grouped notifications, creator profiles, share) | M | Post-beta | evidence-gated |
| 20 | Food Year recap | M | Post-beta P1 | |
| 21 | Growth (referrals, SEO opt-in, experiments) | M | Later | gated on D30 retention |
| 22 | Language and local-food search (Telugu, Hindi) | M | Later | gate in PHASES_NEXT |
| 23 | Trust and safety at scale | L | Later | pulled forward if moderation load grows |
| 24 | Scale, cost and reliability | L | Later | pulled forward if p95 or cost thresholds are crossed |
| 25 | Multi-city expansion and place data | L | Later | |
| 26 | Creator tools and private analytics | M | Later | |
| 27 | Import and data portability | M | Later | |
| 28 | Smart logging assist (AI, opt-in) | L | Later | needs decision 14 |
| 29 | Taste matching and recommendations | L | Later | |
| 30 | Group food planning | M | Later | |
| 31 | Sustainability: MORS Plus (optional) | M | Later | needs decision 13 |

Details: phases 0-14 in `docs/PHASES.md`, 14B and 15-21 in `docs/PHASES_POST_BETA.md`, 22-31 in `docs/PHASES_NEXT.md`. Decisions 13-17 are in PHASES_NEXT and 18-22 in PHASES_POST_BETA; record all in `docs/DECISIONS.md`.

### 8.1 Do NOT build yet (and why)
- Direct messages / chat — moderation and privacy burden, no evidence of need.
- Gamification (streaks, badges, leaderboards) — risks gaming data and distorts honest ratings.
- AI recommendations, menu/receipt scanning, dish recognition — P2; need real data and cost review.
- Sponsored placements or ads — contradicts the product's trust model.
- Referral system — growth cannot fix weak retention (Phase 21 gate).
- Separate `reviews` table — experience description and per-dish note cover it (decision 7).
- Threaded comments, stories, reels, live location sharing — scope and privacy risk.
- External search service (Algolia/Elastic) — Postgres is enough at beta scale.
- Native image moderation pipeline — reporting + manual moderation at beta scale; revisit if volume grows.

### 8.2 MVP launch gate (all must pass before inviting beta users)
Register, log in, manage profile · Quick Log ≤ 3 interactions · multi-dish, multi-photo experiences with ratings · diary timeline + calendar + filters · follow, private-account requests, chronological feed · like and comment · collections (public/private/unlisted) and Saved · search users/dishes/places · visibility correct everywhere (truth table green, 7 viewer roles × 4 entry states × 2 profile states) · report, block, delete account, export data · works at 360px · feature registry 100% green · core journeys pass in CI · no open critical RLS/security finding · rollback/backup procedure tested once.

---

## 9. Open decisions (resolve before the noted phase; record in DECISIONS.md)

| # | Decision | Needed by | Default if unanswered |
|---|---|---|---|
| 1 | Place data source: user-created only, OpenStreetMap/Nominatim, or Google Places (cost, storage terms) | 5 | user-created + city text |
| 2 | Minimum age (13/16/18) and India's DPDP Act requirements for children's data; lawyer review | 3 | 18+ confirmation, no DOB stored |
| 3 | Account deletion grace period | 12 | 14 days, then hard delete |
| 4 | Beta access: invite codes vs allow-list | 14 | invite codes |
| 5 | Rate-limit backend: DB-only vs Upstash | 12 | DB-only |
| 6 | Email provider for auth email (custom domain) | 3 | Resend |
| 7 | Separate reviews table | 7 | omitted |
| 8 | Avatars/covers public even for private profiles | 3 | public |
| 9 | Moderation owner and response time during beta | 9 | founder, within 24 h |
| 10 | Anonymous browsing of public profiles/entries (without login) | 3 | allowed for public pool, `noindex` |
| 11 | Explore tab visible before Phase 17 | 2 | hidden (see 7.8) |
| 12 | Pending follow requests auto-accepted if a private account turns public | 8 | auto-accept |

---

## 10. Prompts to paste into Antigravity

### 10.1 Repo Reality Check (only if code already exists)
```
Read AGENTS.md and docs/IMPLEMENTATION_PLAN.md. Use Planning mode. Do NOT change any code.
Inspect the repository and write docs/AUDIT.md listing every feature from docs/PHASES.md
phases 0-14 with status Complete / Incomplete / Broken and EVIDENCE (file paths, test output,
or a browser-subagent check). Specifically find: placeholder or fake buttons, mock data in app
code, forms that don't persist, tables without RLS or policies, private-data leaks (feeds,
search, storage URLs), missing indexes, duplicated components, hard-coded colours/fonts.
Finish with a ranked fix list: broken auth/upload/DB operations first, then privacy leaks,
then missing P0 features, then polish. Wait for my approval before proposing any phase.
```

### 10.2 Master Phase Prompt (replace NN)
```
Read AGENTS.md, docs/IMPLEMENTATION_PLAN.md (sections 5-8) and "Phase NN" in docs/PHASES.md.
Use Planning mode.
Critical reminders: (1) every new table ships with RLS, policies, indexes and pgTAP tests in the
same migration; (2) never render a control that does nothing - add FEATURE_REGISTRY rows with a
passing test for every control; (3) private/followers/draft data must never leak through any path.
1. First produce an Implementation Plan artifact: files, migrations, components, tests, any new
   dependency with a reason. Wait for my approval.
2. Implement ONLY Phase NN. Do not start later phases or P1/P2 features.
3. Run typecheck, lint, unit tests, supabase test db, pnpm check:rls/nofake/secrets, this phase's
   Playwright journeys, axe, and browser-subagent checks at 360, 768 and 1280 px.
4. Finish with a Walkthrough artifact ticking every acceptance criterion with concrete evidence
   (test names, screenshots), plus anything not done and any decision you made.
5. If anything is ambiguous or conflicts with the plan, stop and ask.
```

### 10.3 Phase review prompt (run in a fresh conversation after each phase)
```
Act as a skeptical reviewer. Read AGENTS.md and "Phase NN" in docs/PHASES.md. Do not write
features. Verify, with commands and screenshots, that each acceptance criterion is met; try to
break privacy by querying as another user, an anonymous user and a blocked user; click every
control on the phase's screens and confirm a real data effect; report anything fake, slow
(EXPLAIN), inaccessible, or inconsistent with the design tokens. Output a pass/fail list.
```

### 10.4 Bug-fix prompt
```
Bug: <describe, steps, expected vs actual>. Read AGENTS.md. Write a failing test first
(pgTAP, integration or Playwright), then fix the root cause without weakening RLS or removing
validation, then show the test passing. Do not refactor unrelated code.
```
