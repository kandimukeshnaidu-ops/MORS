# MORS — Phases (v3)

Save as `docs/PHASES.md`. Spec details (data model, authorization, standards) are in `docs/IMPLEMENTATION_PLAN.md` sections 5–8. Every phase must satisfy the Definition of Done in section 7.9 of that file. Section references like "§6.3" point to it.

Template per phase: **Objective · Size/Bucket · Depends on · Build (DB / Backend / Frontend / UX) · Edge cases · Tests · Acceptance**.

---

## Phase 0 — Repo, tooling, guardrails (S, MVP)
**Objective:** reproducible, automatable base where fake features and RLS gaps fail CI.
**Depends on:** nothing. If code already exists, run the Repo Reality Check first (§10.1) and finish `docs/AUDIT.md`.

**Build**
- pnpm + Turborepo monorepo per §4; Next.js (App Router, TS strict), Tailwind, ESLint, Prettier, Vitest, Playwright, axe.
- `supabase init`; scripts `db:start`, `db:reset:local`, `db:types`, `db:test`.
- Environments local / staging / production; `.env.example` documents every variable; service-role never `NEXT_PUBLIC_`.
- CI (GitHub Actions): install, typecheck, lint, unit, pgTAP, `check:rls`, `check:nofake`, `check:secrets`, build.
- `scripts/check-rls`: query `pg_tables`/`pg_policies`; fail if any `public` table has RLS off or zero policies.
- `scripts/check-nofake`: rules in §7.8; `scripts/allowed-placeholders.json` starts empty.
- `docs/FEATURE_REGISTRY.md`, `docs/DECISIONS.md` created; record installed versions and any doc-verified API differences.
- Sentry and PostHog as no-op-safe stubs; PostHog behind consent.
- Branch protection on `main`; PR template: "RLS + tests included? Registry rows added? Screenshots at 360/768/1280?"

**Edge cases:** CLI version drift (pin in `package.json` and CI); Windows/WSL path issues in scripts (use Node scripts, not bash-only).
**Tests:** CI green on empty PR; temporarily add a table without RLS → `check:rls` fails; add `onClick={() => {}}` → `check:nofake` fails (verify once, then revert).
**Acceptance:** `pnpm dev` serves the app; `pnpm db:start` + `pnpm db:types` work; both guard scripts demonstrably fail on violations; CI green.

---

## Phase 1 — Database foundation and authorization (L, MVP)
**Objective:** schema and privacy rules exist and are proven before any UI. Parallel with Phase 2 (separate directories).

**DB** (§5, §6)
1. Migrations (one concern per file): extensions + `immutable_unaccent`/`normalize`; enums; `profiles` (+ `handle_new_user` trigger); `follows`, `blocks`; `food_categories` (seeded); `places`, `dishes`, `dish_aliases` (unlisted-by-default, column-level grants); `food_experiences`, `experience_dishes`, `experience_photos`; `storage_cleanup_queue`; `rate_limit_events`.
2. Helper functions (§6.2) and RLS policies on every table; policies use `(select auth.uid())`; every policy column indexed.
3. Triggers: `updated_at`; follow status by target privacy; block removes follows/notifications; counters (followers/following accepted-only, `public_experiences_count` public-pool-only); `search_tsv`; `eaten_date` default from timezone; `is_listed` maintenance; photo-count ≤ 10; cleanup queue enqueue on photo/profile delete.
4. Storage buckets and policies (§6.4), including SELECT via `can_view_experience`.
5. RPCs: `create_experience(payload jsonb)` and `update_experience(id, payload jsonb)`: transactional; validate ownership, dish/place existence (creating unlisted dishes/places when `new` flagged), rating range 1–10, ≤ 10 photos, ≤ 10 tags; idempotent on `client_request_id`; set `published_at` on first publish; derive `eaten_date`.
6. `delete_experience(id)` RPC (owner only) enqueuing storage cleanup.
7. Seed: categories; ~30 Hyderabad-flavoured dishes with aliases and ~20 places (listed); 8 test users covering every viewer role in §6.3; ~1,000 generated entries for one perf user (seed only, never in app code).
8. `packages/domain`: Zod schemas and constants mirroring the schema; rating helpers (`halfStarsToDisplay`, `displayToHalfStars`), username rules, reserved words list, visibility helpers.

**Edge cases:** deleting an experience that is the only public use of a dish (unlist? no — recompute, tested); user changes `default_visibility` (does not retro-change entries); anonymous role with null `auth.uid()`; `follows` insert race (unique PK); counter drift (provide `recompute_counters()` function + test).
**Tests:** the full truth-table pgTAP (§6.3) against every access path that exists in this phase (tables, RPCs, storage); write-isolation tests (cannot insert/update other user's rows, cannot set own `role`, cannot read `created_by`); RPC atomicity (forced failure leaves zero rows); idempotent retry returns same row; EXPLAIN assertions for the main indexes.
**Acceptance:** every truth-table cell passes; anonymous cannot read private/followers/draft data; `check:rls` and Supabase security/performance advisors show no critical findings; types compile in `apps/web`.

---

## Phase 2 — Design system and app shell (M, MVP)
**Objective:** the editorial, cinematic identity as reusable code. Parallel with Phase 1.

**Frontend**
- Tokens (§7.1) in `packages/tokens` → CSS variables + Tailwind theme; contrast verified by script.
- Fonts via `next/font` (Newsreader + Inter unless the plan justifies alternatives).
- Components (Radix/React Aria primitives, token-styled): Button (primary/secondary/ghost/icon/destructive), Input, Textarea, Select, Combobox, Chip/Tag, **RatingStars** (half-star; pointer, touch and keyboard: arrow keys step 0.5; read-only and interactive; accessible name "3.5 out of 5"), Avatar, **ExperienceCard** (photo-first editorial layout, 4:5), DishChip, ProfileRow, CollectionCover, Dialog and mobile bottom Sheet, Toast, Skeleton, EmptyState (title, one sentence, one action), ErrorState (retry), ConfirmDialog, **ImageWithBlur** (blurhash placeholder, aspect-ratio reserved to avoid layout shift), Tabs, Menu.
- App shell per §7.1: desktop 3-column, tablet 2-column rail, mobile bottom nav with prominent centre Log. Nav items follow decision 11 / §7.8 (only items that lead to real screens).
- `/dev/ui` gallery with every component and state (404 in production).
- Landing page and static legal page shells (content in Phase 12).
- Motion utilities honouring `prefers-reduced-motion`.

**UX rules:** photography is the visual focus; no card-in-card; borders 1px; generous whitespace; text never over photos without a scrim.
**Edge cases:** very long usernames/dish names (truncate with title attr); RTL not required; 200% zoom; keyboard-only; dark-only theme (no light theme in MVP — record in DECISIONS).
**Tests:** axe on gallery and landing; keyboard tests for RatingStars/Combobox/Dialog; visual snapshots at 360/768/1280; token lint (no hex/`px` colours/fonts outside token files).
**Acceptance:** gallery shows every component in default/hover/focus/disabled/loading/error states at three widths; axe clean; contrast AA; zero hard-coded colours/fonts.

---

## Phase 3 — Authentication, onboarding, profiles (M, MVP)
**Depends on:** 1, 2.

**Backend/DB:** Supabase Auth with `@supabase/ssr`; email/password + Google OAuth; email verification; password reset; logout; session refresh in the Next.js proxy/middleware layer per current docs. Reserved-username list; `username_changed_at` rule (30 days). Server Action `check_username_available` (rate-limited). Minimum-age confirmation stored as boolean (decision 2). Create default private `Saved` collection at onboarding completion (RPC; table arrives in Phase 10 — until then skip; the Phase 10 migration backfills for existing users).
**Frontend:**
- `/signup`, `/login`, `/forgot-password`, `/reset-password`, `/verify`.
- Onboarding (3 short steps): username + display name → optional avatar and favourite cuisines → privacy (profile public/private, default entry visibility). Skippable where optional; progress persisted.
- `/u/[username]`: header (avatar, name, bio, counts), recent entries respecting visibility (uses Phase 4 data once present: until then a real empty state "No entries yet"), private-profile locked state.
- `/settings`: profile edit, avatar/cover upload (to `avatars`), privacy (profile public/private, default visibility, discoverability), timezone, email/password change.
- Follow button is **not rendered** until Phase 8.
**Edge cases:** OAuth user without username → forced onboarding; email already registered via other provider; expired verification link; username race (DB unique, friendly error); changing profile to private with existing pending/accepted follows (none yet; tested in Phase 8); avatar of 5 MB (client-compress to ≤ 512px, ≤ 150 KB).
**Tests:** E2E sign up → verify → onboard → edit → logout → login → reset password; protected-route redirects; private-profile HTML and network payload contain no entry data for non-followers; case-insensitive username uniqueness at DB level; avatar write only to own prefix.
**Acceptance:** all above pass; unauthenticated users cannot reach protected routes; no secrets in client bundle (`check:secrets`).

---

## Phase 4 — Quick Log and photo pipeline (L, MVP) — the most important phase
**Objective:** logging a normal meal takes seconds and never forces detail.
**Depends on:** 1, 2, 3.

**UX contract (§7.2):** open Log → choose photo (or skip) → type dish name → Post. Optional rating inline (half-star). Success toast with "View" and "Add details".
**Build**
- Log entry point: centre button (mobile), left-nav button + keyboard shortcut (desktop). Dialog (desktop) / full-screen sheet (mobile), one-handed layout, primary action reachable by thumb.
- Dish field: combobox searching listed dishes + aliases + user's own unlisted dishes by trigram; "Add 'X' as new" creates unlisted dish via RPC.
- Photo pipeline per §7.3: multi-select, compress to display + thumb, EXIF stripped/orientation applied, blurhash, progress, remove, reorder (keyboard accessible), max 10, retry on failure, interrupted-upload resume.
- `create_experience` RPC with `client_request_id` generated when the sheet opens; Post button disabled while in flight; retries are safe.
- Entry detail `/e/[id]`: large photos (signed URLs batch), dishes with ratings, place if any, date, visibility chip (owner only), edit/delete menu for owner (edit wired in Phase 5; until then not rendered; delete works: confirm dialog → RPC → storage cleanup queue).
- Published entry appears immediately on the owner's profile page and (Phase 6) diary.
- PostHog: `log_started`, `log_published` with `mode=quick`, `duration_ms`, counts.
**Edge cases:** no photo at all (home-cooked text-only entry publishes); photo upload fails halfway (entry not created, uploaded objects queued for cleanup); user navigates away mid-upload (confirm dialog, draft kept); offline (clear error, nothing lost: form state kept in IndexedDB); duplicate tap; 10-photo cap message; HEIC from iPhone; very large panorama (dimension cap 8000px → downscale); dish name 1 char vs 120 char limits; emoji and Telugu/Hindi text.
**Tests:** Playwright: quick log with one photo ≤ 3 interactions; text-only home-cooked log; double-submit creates one row; kill network mid-upload then retry; private entry photo URL inaccessible to another user and anon (signed URL creation denied and a direct object URL returns 404/400); delete removes both objects after cleanup job runs; EXIF GPS absent in stored file (assert via metadata read); integration test on RPC atomicity.
**Acceptance:** all above; time-to-log measured and shown in PostHog; entries from Phase 4 pass the truth table at the detail-page level; registry rows for every control.

---

## Phase 5 — Full logging: details, drafts, edit, recents, log again (L, MVP)
**Objective:** serious loggers get every field; casual loggers never see them unless they ask.
**Depends on:** 4.

**Build**
- "Add details" progressive disclosure: title, category (required, default last used; chips from `food_categories`), additional dishes (reorder; per-dish rating and note), place (combobox; "no place" default; unlisted create), price (INR default), cuisine, tags (max 10), description, visibility (default from profile), date and time (quick chips: Now, Earlier today, Yesterday + full picker; timezone from profile).
- Overall rating and per-dish ratings; clear-rating action.
- **Drafts:** local autosave (IndexedDB) plus server draft (`status='draft'`) on blur; "Drafts" list in the log menu; recover after refresh; discard action; drafts never visible to others, excluded from counts and feeds; pg_cron deletes drafts untouched for 30 days (with storage cleanup).
- **Edit published entries:** all fields, including photos (add/remove/reorder), via `update_experience`; changing visibility updates aggregates and notifications visibility immediately (Phase 7/9 consumers tested later). Editing never changes `published_at`.
- **Recents:** "Recent dishes" and "Recent places" chips (user's last 10 distinct, from own data) at the top of the pickers.
- **Log again:** on own entries (detail page and diary row) → opens form prefilled per §7.2 as a new draft.
- Photo extras: caption/alt text field per photo; basic crop (square/original toggle) before upload; reorder drag + keyboard.
- Delete entry with confirmation (already in 4) now also available from diary.
**Edge cases:** editing an entry while another tab edits it (updated_at precondition → friendly conflict message); removing the last dish (blocked: ≥ 1 dish); changing category on a published entry; back-dated entry (feed order unaffected: `published_at`); future date (warn, allow ≤ 1 day ahead); switching a published entry to draft is **not allowed** (use private visibility instead — record in DECISIONS); photo removed from storage but referenced (RPC removes row and enqueues object).
**Tests:** E2E detailed log with 3 dishes + ratings; edit then verify all fields persisted; draft survives reload and device change (server draft); log-again copies exactly the fields in §7.2; visibility change reflected on profile for another user in a second context; recents correctness; stale-edit conflict.
**Acceptance:** every product-context field is writable and persisted; quick log is still ≤ 3 interactions (regression test); multi-dish atomic save; deleting removes photos; registry green.

---

## Phase 6 — Diary and personal archive (M, MVP)
**Depends on:** 5.

**Build:** Diary at `/diary` (also reachable from Profile):
- Timeline grouped by `eaten_date` (user's timezone), keyset pagination + infinite scroll with "back to top".
- Calendar month view: RPC returns per-day count and cover thumbnail; tap a day lists that day's entries; month navigation; today marker.
- Filters (URL-synced): category, cuisine, rating range, date range, place, visibility, drafts. Chips show active filters; "clear all".
- Personal search across title, description, dish names, place, tags (tsvector + trigram); highlights.
- Gentle "On this day" module (only if entries exist for this date in prior years; small, dismissible).
- Empty states per filter result; first-time empty state links to Log.
- Edit/delete/log-again from list rows.
**Edge cases:** entries logged at 00:30 local; timezone change in settings (existing `eaten_date` stays; new ones use new tz); 1,000+ entries; entries without photos (typographic card); drafts section separate and owner-only.
**Tests:** EXPLAIN on timeline/calendar/search with the 1,000-entry user (index scans); filter combinations and refresh persistence; owner-only drafts/private (another user sees none via diary URL → "not found"); calendar counts equal list counts.
**Acceptance:** timeline and calendar render quickly on seeded data (record timings); filters combine correctly and survive reload; only owner sees drafts/private entries.

---

## Phase 7 — Canonical dishes/places and community ratings (L, MVP)
**Depends on:** 5, 6.

**Build**
- Normalisation and trigram "Did you mean…?" before creating a dish/place (suggest listed matches).
- Aliases; canonical records; admin RPCs `merge_dishes(from, to)` / `merge_places(from, to)`: atomic, idempotent, repoint `experience_dishes`, `collection_items`, `dish_aliases`, set `merged_into_id`, recompute stats; migration checklist: any future FK to dishes/places must update merge functions and tests.
- Place branches (`parent_place_id`); search by name and city; user-created places default city from profile.
- Community aggregates (`dish_public_stats`, `place_public_stats`) maintained by triggers on public-pool changes (visibility, status, profile privacy/discoverable, deletion).
- Pages `/dish/[slug]`, `/place/[slug]` (listed only; unlisted → "not found" to non-creators): name, aliases, community average and count (shown only when count ≥ 3 to avoid single-entry de-anonymisation; below that show "Not enough ratings yet"), list of public-pool entries (keyset). Viewer's own rating shown separately and labelled "Your rating".
- Report hooks: "Report duplicate / wrong info" (consumed in Phase 9).
**Edge cases:** merge loop (A→B→A) rejected; entry referencing merged dish still displays its typed `display_name`; renaming a dish; listed dish becomes unlisted? (never auto-unlist while any public-pool entry exists); private-profile owner's entry excluded; stats after account deletion request.
**Tests:** flip an entry public→followers/private/draft and profile public→private: aggregates and pages update immediately; near-duplicate prompt; merge idempotency and atomicity; community average never includes entries the viewer could not see; unlisted dish invisible to others (and `created_by` ungettable).
**Acceptance:** all above; aggregates equal a brute-force recompute in a test (`recompute_all_stats()` equals trigger values).

---

## Phase 8 — Social graph and home feed (L, MVP)
**Depends on:** 3, 7.

**Build**
- Follow/unfollow; private accounts create `pending` requests (approve, decline, cancel); followers/following lists (`/u/[username]/followers`, `/following`) respect privacy; counts visible, lists gated.
- Blocking (profile menu): removes follows both ways, hides content both ways, prevents follow/like/comment; "Blocked accounts" in settings with unblock.
- `get_home_feed(cursor, limit)` (security invoker): own + accepted-followed users' published entries visible to the viewer, ordered `(published_at desc, id desc)`, keyset. Chronological only. Cards use thumbs; photos signed in batch.
- Cold start: onboarding "people to follow" (public-pool users with recent activity, simple recency rule, excluding blocked) and an empty-feed state with prompts (Log your first meal / follow people).
- Profile follow button states: Follow / Requested / Following / Unfollow (confirm) / Blocked.
- Follow-request management page (`/requests`) for private accounts.
**Edge cases:** follow then target turns private (accepted stay, new pending — decision 12 when turning public); follow request then block; unfollow removes entries from feed immediately; own entries in feed (yes); feed with 0 photos; pagination while new entries arrive (keyset stable); "new posts" banner (no auto-insert).
**Tests:** feed-level truth table via RPC for all viewer roles; Playwright with two contexts (follow → entry appears; unfollow → disappears; private request → approve); feed payload contains no hidden entry data (network assertion); blocked both directions.
**Acceptance:** feed excludes private, followers-only (if not following), drafts, blocked users' entries; privacy switch behaves per spec; payload clean.

---

## Phase 9 — Engagement, notifications, reporting, moderation (L, MVP)
**Depends on:** 8.

**Build**
- Likes (optimistic UI, reconciled), flat comments (delete own; entry owner deletes any comment on their entries; max 1000 chars; basic link stripping/limit 2 links), trigger-maintained counts, like list (excludes blocked).
- Notifications by DB triggers: follow, follow_request, follow_accepted, like, comment. Likes deduped per (actor, entry). Read through RPC/view joined with `can_view_*` so hidden targets disappear. Notification centre `/notifications` with unread badge, mark read/all read, Realtime updates (RLS-respecting), keyset pagination, preferences per type in settings.
- Reports: from entry, comment, user, collection (Phase 10 hook), dish/place (duplicate/wrong info); reason enum + details; one report per reporter/target.
- `/admin` moderation queue (role-gated server-side + RLS): list, context view (shows reported content even if private, via service-module with audit), actions (dismiss, delete content, warn, suspend user) written to `moderation_actions`.
- Rate limits via `rate_limit_events`: comments (e.g. 20/10 min), likes, follows (e.g. 60/hour), reports; new accounts (< 24 h) stricter. Friendly error with retry time.
**Edge cases:** like then unlike spam (no repeat notifications); comment on entry that becomes private afterwards (comment hidden to non-owner viewers; notification hidden); commenter blocked after commenting; deleting a comment removes its notification; self-like (allowed, no notification); suspended user.
**Tests:** cannot like/comment what you cannot view; blocked cannot interact; notifications never reveal unviewable content (flip visibility after notification); reports readable only by moderators/admins (RLS test); rate-limit enforcement; Realtime subscription does not deliver other users' rows.
**Acceptance:** all above; moderation actions audited; every control has a registry row.

---

## Phase 10 — Collections and Saved (M, MVP)
**Depends on:** 7, 9.

**Build**
- Collections CRUD: name, description, cover (own photo or first item), visibility public/private/unlisted.
- **Saved**: system collection (`system_key='saved'`, private, cannot be deleted/renamed/made public). One-tap save (bookmark icon) on every viewable entry card/detail; unsave toggles. Backfill Saved for existing users.
- Items: experiences, dishes, places; add from any detail page via "Add to collection" sheet (list + create new); per-item note.
- Reorder: drag-and-drop plus keyboard-accessible "Move up/down"; `move_collection_item` RPC with row lock; rebalance when gaps < 1e-6.
- Viewer-filtered items: hidden items neither shown nor counted. Owner sees all with a subtle "hidden from others" marker on items that are private.
- Unlisted: reachable only via `/c/[token]` → `get_collection_by_token`; `noindex`, excluded from profile, search, sitemap.
- Like a collection (`collection_likes`, notification `collection_like`); share (copy link, Web Share API); OG image only for public (and unlisted shown with generic image).
- Collections tab: "Mine" and "Saved"; public collections on profiles.
- Report collection.
**Edge cases:** item's entry becomes private/deleted (item hidden for others; owner sees placeholder "Entry unavailable" with remove); entry owner blocks collection owner; collection with 500 items (pagination); duplicate adds (idempotent); converting unlisted → public regenerates nothing but offers "reset link" (new token).
**Tests:** public collection containing someone's private entry shows it only to its owner; unlisted not discoverable but loads with token (and token leak after reset fails); concurrent reorder in two contexts leaves unique ordered positions; Saved cannot be made public (DB constraint + UI); counts equal visible items.
**Acceptance:** all above; collection truth-table rows pass.

---

## Phase 11 — Search (M, MVP)
**Depends on:** 7, 8, 10.

**Build**
- `search_all(q, types[], city?, limit, cursor)` (security invoker) across users (discoverable, not blocked; private profiles are findable by username/name but show only the locked card, never entries), dishes/places (listed only), experiences (public pool only), public collections.
- Header search with typeahead (200 ms debounce), result tabs, city filter for places, recent searches (local only, clearable).
- Trigram + tsvector ranking; exact username match boosted.
**Edge cases:** empty/1-char query; diacritics ("pani puri" vs "paanipuri"); Telugu/Hindi script and transliteration aliases; blocked users hidden both ways; deleted/pending-deletion users excluded; SQL wildcard characters escaped.
**Tests:** unique words from another user's private/followers/draft entry return nothing; misspelling "birayni" finds biryani; blocked users absent; EXPLAIN and recorded timings on 20,000 public entries; no query text sent to analytics.
**Acceptance:** all above; p95 typeahead < 300 ms on the seeded dataset (recorded in Walkthrough).

---

## Phase 12 — Account lifecycle, abuse protection, security (M, MVP)
**Depends on:** all previous MVP phases.

**Build**
- **Account deletion:** in-app request → grace period (decision 3) with immediate hiding (`deletion_requested_at` removes from public pool/search/feeds) → hard delete job (Edge Function + pg_cron): rows, storage via cleanup queue, auth user; cancel during grace; confirmation email.
- **Data export:** async job producing JSON (profile, entries, dishes, ratings, collections, likes, comments authored) + photo archive, expiring signed link (24 h), only the requester's data.
- Notification/discoverability settings finalised.
- Rate limiting: Supabase Auth limits + DB-based (or Upstash per decision 5) on uploads and writes; CAPTCHA on signup if abuse appears.
- Upload validation server-side: MIME sniffing, size and dimension limits, bucket config verified.
- Legal pages (Terms, Privacy Policy, Community Guidelines) drafted for lawyer review; consent banner for analytics; age confirmation copy aligned to decision 2.
- Security pass: RLS audit, Supabase advisors, secret scan, dependency audit, security headers/CSP, CORS, cookie flags, brute-force protection, error messages leak nothing.
**Edge cases:** deleting while export running; deleting user who owns the only listed use of a dish (reference rows stay, unlisted if no public use); collections containing deleted user's entries (items disappear); users with 10,000 photos (batch queue, resumable); re-registering same email after deletion.
**Tests:** after hard delete, no rows or objects remain anywhere (feeds, search, aggregates, collections, storage); export contains only requester's data (cross-user fixture); oversized/wrong-type uploads rejected server-side; pgTAP re-run of full truth table; penetration-style script: cross-user read/write attempts on every table and bucket.
**Acceptance:** all above; no open critical findings.

---

## Phase 13 — Functional audit and cross-screen polish (M, MVP)
**Objective:** one coherent product, no fake or dead interaction (the ChatGPT concern, handled as a gate rather than a late discovery).
**Depends on:** 12.

**Build**
- Audit with the phase-review prompt (§10.3): every route, button, link, form, dropdown, filter, tab, modal. Produce `docs/AUDIT.md` (Complete/Incomplete/Broken) and fix everything Incomplete/Broken.
- Registry gate: 100% rows have passing tests and no orphan controls (script compares registry ids with `data-testid`s).
- Cross-screen consistency: spacing scale, type scale, image ratios, icon sizes, border usage; remove unnecessary cards/borders/labels; unify empty, loading, error, success states; confirmation dialogs for all destructive actions.
- Photography-first review of feed, profile, detail, collections; skeletons match final layouts (no jump).
- Motion pass: like heart, sheet transitions, collection reorder, route transitions; all reduced-motion safe.
- Tablet pass (768px): designed layouts for diary, feed, detail, collections.
- Copy pass: plain, warm, short microcopy; no jargon; Telugu/Hindi display names render correctly.
**Edge cases:** stale data after mutations (revalidate paths/tags correctly); back/forward cache; double navigation; offline banner.
**Tests:** full Playwright regression; visual diffs at 360/768/1280; axe on all routes; Lighthouse accessibility ≥ 95.
**Acceptance:** registry 100%; zero "coming soon"/dead controls; no hard-coded styles; a reviewer can complete the central journey (Eat → Log → Rate → Remember → Collect → Share) without a snag.

---

## Phase 14 — Hardening and closed beta (M, MVP)
**Depends on:** 13.

**Build**
- E2E journeys in CI (two contexts): sign up → quick log → detailed log → diary/calendar → follow → feed → like/comment → collection/Saved → search → privacy change → block → export → delete account.
- Performance: Lighthouse budgets (LCP < 2.5 s on 4G mid-range), bundle analysis, slow-query review (`pg_stat_statements`), image delivery and caching headers, large feeds/diaries tests, slow-network and interrupted-upload tests, real-device testing (low-end Android + iPhone Safari).
- Observability: Sentry alerts, structured server logs without PII, uptime check, PostHog funnels for the product-context metrics (first-log completion, time-to-log, weekly experiences per active user, D7/D30, follows per user, collection creation, repeat logging, diary revisit).
- Production: paid Supabase tier (backups, PITR if affordable), restore drill, Vercel plan suitable for commercial use, custom domain + email domain (SPF/DKIM), env separation.
- Beta ops: invite codes (decision 4), 10–20 seed creators in Hyderabad (real people, with consent), onboarding script, in-app feedback entry point, weekly metrics review, moderation rota (decision 9), status/known-issues page.
- Public pages: `noindex` everywhere (decision in §3 #13); basic OG for public-pool entries and public collections.
**Tests:** launch gate checklist (§8.2) executed and attached; chaos test: kill the DB connection mid-publish; backup restore verified.
**Acceptance:** all gate items pass; CI E2E green; no open critical RLS/security findings; the primary question is instrumented: *do people return to log and revisit?*

> **Beta review checkpoint:** collect 4–6 weeks of data before starting Phase 15+. Re-rank 15–21 by evidence.

---

## Phase 15 — Mobile app, Expo (XL, post-beta)
**Prerequisite:** beta feedback addressed.
**Build:** `apps/mobile` with Expo Router; reuse `packages/domain`, `packages/db`, `packages/tokens` (NativeWind or equivalent); secure session storage; native Google sign-in; screens: auth, onboarding, feed, diary + calendar, log (camera/gallery, on-device compression, background upload queue with retry, offline drafts that sync), entry detail, profile, collections/Saved, search, notifications, settings; push via Expo Push + `push_tokens` + Edge Function from `notifications`; universal/deep links; store compliance (in-app deletion, reporting, blocking, privacy labels, permission strings); EAS Build/Submit and internal testing tracks.
**Edge cases:** token refresh in background; low storage; permission denial; app killed mid-upload; push for content later hidden (server re-checks visibility before sending).
**Acceptance:** full journey on iOS and Android; offline drafts sync; push deep-links open the right screen; same RLS rules, no client-side exceptions.

## Phase 16 — Taste identity and stats (M, post-beta P1)
**Gate:** enough real data (e.g. ≥ 50 users with ≥ 20 entries).
**Build:** profile "Taste" section computed only from real data: totals (experiences, dishes, places), favourite cuisines, highest-rated dishes, most-logged categories, average rating, favourite places, monthly activity. Owner sees full stats (including private entries); others see stats computed from entries visible to them (public-pool or followers-visible per viewer; never revealing counts of hidden entries). Pre-computed snapshots refreshed by trigger/job; "last updated" shown. No personality labels or inferred "taste type".
**Tests:** stats equal brute-force recompute; viewer-dependent stats never include hidden entries; empty states for new users.

## Phase 17 — Explore and discovery (L, post-beta P1)
**Build:** Explore tab (restores 5-item nav): popular dishes and places by city, public collections, new creators, recently reviewed places, trending (time-decayed likes/comments on public-pool entries, minimum thresholds), filters (cuisine, category, rating, price range, city). Recommendation reasons only from the viewer's own logs or public-pool aggregates ("Popular in Hyderabad this week", "Because you log South Indian food"). No ads/sponsored placements.
**Tests:** public-pool-only everywhere; blocked users hidden; reason strings never leak other users' private data; cold-start behaviour.

## Phase 18 — Maps, location, rich dish and place pages (L, post-beta P1)
**Build:** explicit-consent location features (off by default); city-level precision unless a place has a public address; food map of the owner's own places and public places; rich dish/place pages (photos from public pool, top reviewers, branches); "near me" with one-shot location permission (never stored unless user saves it). Decision 1 (place data source) must be final.
**Tests:** no precise coordinates in any payload for non-consenting users; map respects visibility; permission-denied flows.

## Phase 19 — Social upgrades (M, post-beta, evidence-gated)
**Candidates (build only what beta data justifies):** @mentions in comments (respect blocks/privacy; mention notifications only to users who can view the entry), grouped notifications ("A and 3 others liked…"), creator profiles with featured collections, shareable entry/profile links with OG previews (public pool only), better follow suggestions, comment moderation tools. Direct messaging remains out of scope.

## Phase 20 — Food Year recap (M, post-beta P1)
**Build:** annual recap from real activity: total experiences, most-logged dishes, favourite cuisines, highest-rated dish, most-visited place, biggest discoveries, top experiences, monthly activity, changes in cuisine mix. Shareable image rendered server-side from the owner's data; share only what the owner chooses to include (private entries excluded by default; owner can opt in to include them in their own recap image).

## Phase 21 — Growth (M, later)
**Gate:** D30 retention and weekly logging indicate the product is sticky.
**Build:** referral/invite system, per-user "allow search engines" opt-in with SEO for public profiles/collections, onboarding experiments, creator onboarding, retention experiments (A/B via PostHog), public changelog.

## P2 (later, each needs its own plan)
AI recommendations, menu/receipt scanning, automatic dish recognition, taste matching, group food planning, advanced creator analytics.
