# MORS — Next Phases (22–31)

Save as `docs/PHASES_NEXT.md`. Continues `docs/PHASES.md` (phases 0–14) and `docs/PHASES_POST_BETA.md` (14B and 15–21). Same rules: `AGENTS.md`, Definition of Done (IMPLEMENTATION_PLAN §7.9), privacy model (§6). Nothing here starts before its **gate** is met; a gate is evidence from real users, not a calendar date. Every phase follows the Master Phase Prompt (§10.2).

Template: **Objective · Size/Bucket · Gate · Depends on · Problems it solves · Build (DB / Backend / Frontend / UX) · Privacy rules · Edge cases · Tests · Acceptance · Metric of success**.

---

## 0. Ordering and gates

```
Evidence from beta + mobile + growth (Phases 14-21)
   |
   +-- 22 Language & local-food search        (gate: >=20% of beta users ask for / use Telugu or Hindi)
   +-- 23 Trust & safety at scale             (gate: >=1 moderation incident/week OR >1,000 users)
   +-- 24 Scale, cost and reliability         (gate: any of: p95 > 400ms, storage cost > budget, >5,000 users)
   |
   +-- 25 Multi-city expansion & place data   (gate: Hyderabad D30 retention healthy; decision 1 final)
   +-- 26 Creator tools & private analytics   (gate: >=30 users with >=100 followers or repeated requests)
   +-- 27 Import & data portability           (gate: users ask to bring history from elsewhere)
   |
   +-- 28 Smart logging assist (AI, opt-in)   (gate: logging drop-off at photo/dish step proven in funnels)
   +-- 29 Taste matching & recommendations    (gate: >=2,000 public-pool entries per active city, Phase 16-17 live)
   +-- 30 Group food planning                 (gate: collections shared to non-users/others frequently)
   +-- 31 Sustainability: MORS Plus (optional)(gate: costs are real and retention proven; decision 13)
```

Recommended order if gates are met together: **24 → 23 → 22 → 27 → 26 → 25 → 29 → 28 → 30 → 31**. Reliability and safety come before anything that adds users or content.

Re-evaluate this list at each beta review. Delete any phase whose gate never fires. A shorter product that people return to beats a longer one nobody asked for.

New decisions to record in `docs/DECISIONS.md` (default if unanswered):

| # | Decision | Needed by | Default |
|---|---|---|---|
| 13 | Monetisation model (none / MORS Plus subscription / creator tools) | 31 | none until retention proven; never ads |
| 14 | AI vendor, region, data-retention and "no training on user data" terms | 28 | defer; Phase 28 does not start without it |
| 15 | Languages after English: Telugu and Hindi first | 22 | Telugu + Hindi |
| 16 | Creator verification policy (what a badge means) | 26 | no badge; "Creator" label by criteria only |
| 17 | Image CDN/transform provider vs Supabase transforms | 24 | Supabase transforms if cost fits, else Cloudflare Images |

---

## Phase 22 — Language and local-food search (M, post-beta)
**Gate:** beta evidence of Telugu/Hindi usage or search misses for local names.
**Problems it solves:** a Hyderabad audience types "pesarattu", "పెసరట్టు", "पेसरट्टू", "paayasam/payasam" and expects the same dish. Search, dish pages and UI should not force English.

**DB**
- `profiles.locale` (`en|te|hi`, default `en`); `dish_translations(dish_id, locale, name, unique(dish_id, locale))` (listed dishes only; user-created unlisted dishes keep the typed name); more `dish_aliases` seeded for transliteration variants; `normalize()` extended to fold common Indic transliteration variants (vowel length, doubled consonants, `v/w`, `ph/f`).
- `search_tsv` stays `simple` config; add trigram on aliases and translations.
- Place names and city names get `name_local` (nullable).
**Frontend**
- UI localisation with an i18n library chosen in the plan (e.g. next-intl; verify current docs). All strings extracted; no string concatenation for plurals/dates; ICU message format.
- Fonts: add Noto Sans Telugu and Noto Sans Devanagari as fallbacks via `next/font`; serif display face falls back per script; verify line-height and clipping for Indic scripts at all sizes (Indic glyphs are taller; test at 360px).
- Language switcher in settings and footer; locale in URL prefix or cookie (decision in plan); `lang` attribute set; date/number/currency formatting via `Intl`.
- Search accepts native-script input and shows the dish in the viewer's locale with the typed name as a secondary line.
**UX:** the user's own typed `display_name` on an entry is never overwritten by a translation. Translations are display-only.
**Privacy rules:** translation/alias tables contain reference data only, never user text; no machine-translation of user-written descriptions/comments by default (cost, accuracy, privacy). "Translate" button is out of scope.
**Edge cases:** mixed-script queries ("biryani బిర్యానీ"); right text direction not needed; truncated labels in longer Telugu/Hindi strings; emoji and ZWJ in dish names; alphabetical sort in Telugu locale (`Intl.Collator`); email templates localised.
**Tests:** every string key exists in all three locale files (CI check); pseudo-locale test for overflow; search recall test with a fixture list of 40 dish spellings across 3 scripts; Playwright smoke in each locale; axe in each locale; screenshots at 360/768/1280 in Telugu.
**Acceptance:** complete core journey in Telugu and Hindi; "పెసరట్టు", "pesarattu" and "pesarattu dosa" resolve to one dish; no layout clipping; fallback to English for any missing key without crashing.
**Metric:** search no-result rate for local names ↓; share of sessions in non-English locales.

---

## Phase 23 — Trust and safety at scale (L, post-beta)
**Gate:** moderation load exceeds what one person can handle in the 24 h SLA, or user count passes ~1,000.
**Problems it solves:** manual review does not scale; spam, harassment and unsafe images will arrive with growth; users need clear recourse.

**DB**
- `moderation_actions` extended (reason code, policy section, expiry); `user_strikes`, `suspensions(user_id, starts_at, ends_at, reason)`; `appeals(id, user_id, action_id, text, status, handled_by)`; `trusted_reporters` (flag on profiles, not user-visible); `spam_signals(user_id, signal, score, created_at)`; `content_hashes(sha256, status)` for known-bad image blocking.
- Rate-limit table gains per-action tiers and shadow-limit mode.
**Backend**
- Spam heuristics on comments/new accounts (link density, repeat text, burst rate, new-account + many follows); score → throttle → review queue, never silent deletion without audit.
- Image safety: optional moderation API call on upload (vendor per decision 14; must be region-compliant and not retain images) — **flag to the queue, do not auto-delete** except exact hash matches of previously removed content.
- Queue prioritisation (severity, reporter trust, repeat targets), SLA timers, bulk actions, canned responses, evidence snapshot (content is snapshotted before deletion so appeals can be judged).
- Appeals flow with a different moderator than the original; outcome emails.
- Transparency page: counts of reports/actions per quarter (aggregate only).
**Frontend/UX**
- User-facing: clear report confirmation ("Thanks, we'll review within 24 h"), "your report was actioned/dismissed" notification (no reporter identity ever shown to the reported), in-app notice of warnings/suspensions with policy link and appeal button.
- Admin: queue filters, context panel, user history, action menu with required reason; keyboard shortcuts.
**Privacy rules:** reported private content is visible to moderators only through the audited service module, with a log line per view; moderators cannot browse private content outside a report; moderator access reviewed monthly; reports never reveal reporter identity.
**Edge cases:** brigading (many reports on one target → weight by reporter trust, not count); retaliatory reports; moderator bias (second review for suspensions); reported user deletes account mid-case (retain minimal evidence for legal period per policy, document in privacy policy); minors appearing in photos.
**Tests:** moderator RLS (only moderators/admins read reports and snapshots); audit log row exists for every moderator view and action; spam simulation fixtures throttle as expected; appeal cannot be handled by the original moderator; suspended user cannot post/comment/log but can export data and delete account.
**Acceptance:** median time-to-first-action under SLA on test load; every action auditable; users can appeal; no auto-removal without audit except exact-hash matches.
**Metric:** time to resolve, repeat-offender rate, % of reports actioned.

---

## Phase 24 — Scale, cost and reliability (L, post-beta)
**Gate:** performance or cost threshold crossed (see §0).
**Problems it solves:** feeds, notifications and photos are the first things to hurt at scale; storage and bandwidth are the main cost.

**DB**
- Review `pg_stat_statements` and fix the top 10 queries; add covering/partial indexes where proven; vacuum/analyze tuning; connection pooling (Supabase pooler, transaction mode) verified with prepared-statement settings.
- Partition `notifications` and `rate_limit_events` by month (drop old partitions via pg_cron); archive rules for `moderation_actions` snapshots.
- Pre-computed feed? **Not yet.** Keep pull-based keyset feed unless p95 fails at target load; if it does, introduce a `feed_items` fan-out table for accounts with < N followers and pull for large accounts (design recorded in DECISIONS first, then built).
- Read replica for heavy read paths (Explore, search) only if load tests justify.
**Backend/infra**
- Image delivery: CDN with long-lived immutable caching for signed thumbnails where policy allows (note: private-bucket signed URLs vary per request — use stable per-photo cache keys via a signing proxy only if privacy review passes; otherwise accept the cost); WebP/AVIF variants generated at upload or by transforms (decision 17); lazy-loading and `fetchpriority` tuned.
- Storage lifecycle: delete orphans, compress older originals, report storage per user; per-user quota (e.g. 2 GB free) with friendly warning.
- Load tests (k6) with realistic mix: 5,000 users, 20 writes/min, 500 reads/min; run in staging; thresholds in CI as a nightly job.
- Backups: PITR enabled, restore drill monthly; documented runbooks (`docs/RUNBOOKS/`): outage, bad migration rollback, leaked key rotation, storage incident.
- SLOs: availability 99.5%, feed p95 < 400 ms, log publish p95 < 2 s excluding upload; error budget alerts.
- Cost dashboard (Supabase, Vercel, PostHog, Sentry) reviewed monthly.
**Privacy rules:** caching must never cache viewer-specific content on shared caches; test with two users and a CDN in front; keep `Cache-Control: private` on anything gated.
**Edge cases:** thundering herd on a viral entry; migration locking on large tables (use `CONCURRENTLY`, expand/contract pattern); slow Realtime fan-out; large accounts (10k followers).
**Tests:** load test thresholds pass; cache-leak test (user A's private response not served to user B/anonymous); restore drill produces a working copy; migration dry-run on a copy of staging data.
**Acceptance:** SLOs met under load; cost per active user known and within budget; runbooks exercised once.
**Metric:** p95 latency, cost per MAU, incident count.

---

## Phase 25 — Multi-city expansion and place data (L, post-beta)
**Gate:** Hyderabad cohort retention healthy (D30 target set in the beta review) and decision 1 finalised.
**Problems it solves:** places are user-typed and duplicated; other cities cannot be seeded by hand; place pages are thin.

**DB**
- `cities(id, slug, name, name_local, state, country, lat, lng, timezone, is_active)`; `places.city_id`; migrate city text → `city_id` (expand/contract).
- Place source integration per decision 1 (OpenStreetMap/Nominatim or a commercial API; respect licence/storage terms, rate limits and attribution). `external_source/external_id` already exist; add `last_synced_at`, `source_attribution`.
- `place_claims` is **out of scope** (no business accounts).
**Backend:** place search proxy (server-side, cached, rate-limited; user queries never sent with identifiers); dedupe on insert against `external_id` and trigram; scheduled sync for changed names/closures; "report closed/wrong" flows feed moderation.
**Frontend/UX:** city picker (profile default, switchable); city landing pages `/city/[slug]` showing popular dishes, new public collections, active creators (public pool only); onboarding asks city; place picker shows nearby suggestions only after explicit location permission (one-shot, not stored).
**Privacy rules:** profile city is public text the user chooses; no inference from IP stored; place coordinates are the place's, never the user's.
**Edge cases:** same-name chains/branches; places that move or close; user in a city with no places (still log with typed name); timezone per city for "On this day" and recaps; INR assumption removed (currency per country).
**Tests:** dedupe tests with fixtures (chain branches, spelling variants); licence/attribution rendered where required; no request logs contain user ids with place queries; city pages use public pool only (truth table rerun).
**Acceptance:** a user in a second city can log with real place search in < 3 interactions; duplicate-place rate in the new city below target; Hyderabad data migrated without loss.
**Metric:** activation and retention in the new city vs Hyderabad baseline.

---

## Phase 26 — Creator tools and private analytics (M, post-beta)
**Gate:** repeated asks from people with audience; Phase 19 creator profiles live.
**Problems it solves:** serious reviewers want to understand their reach without the app turning into a vanity-metrics game.

**DB:** `entry_stats_daily(entry_id, day, views, saves, likes, comment_count)` aggregated, no per-viewer rows; `profile_stats_daily(profile_id, day, profile_views, new_followers)`; both owner-readable only; retention 13 months.
**Backend:** view counting server-side, deduped per session (cookie-less, hashed ephemeral id), excludes owner and bots; aggregates only; no "who viewed" ever.
**Frontend/UX**
- `/creator` dashboard: reach over time, best entries, saves, collection performance, follower growth; plain charts (line/bar), no dashboards-of-cards clutter; each chart has a data table alternative for accessibility.
- Featured entries and pinned collections on profile; "Creator" label shown by transparent criteria (e.g. ≥ 50 public entries and ≥ 100 followers; decision 16). No paid badge.
- Export own analytics CSV.
**Privacy rules:** analytics count only views by people allowed to see; followers-only entries produce stats visible to the owner only and never leak viewer identity; no cross-user comparison, no leaderboard.
**Edge cases:** private → public switches (stats start at publication; earlier views of private entries are not counted); deleted entries (stats removed); bot spikes; timezone day boundaries.
**Tests:** stats readable only by owner (RLS); view dedupe; no viewer identity stored (schema test); counts equal brute-force.
**Acceptance:** owner can see accurate, privacy-safe reach for their public entries; no way to infer individual viewers.
**Metric:** creator weekly active rate, creator retention.

---

## Phase 27 — Import and data portability (M, post-beta)
**Gate:** users ask to bring history from notes, spreadsheets or other apps.
**Problems it solves:** a diary is only valuable with history; people already have years of food photos and notes.

**Build**
- CSV/JSON importer with a documented MORS template (title, date, dishes, rating, place, notes, tags); in-browser validation with row-level error report; dry run before commit.
- Photo bulk import: select a folder of photos → use photo capture date only if the user opts in (EXIF read client-side, then stripped); suggested grouping by time (same meal) that the user confirms; no GPS ever read or stored.
- All imported entries default to **private** drafts for review ("Import inbox") and are published in batches by the user; idempotent via `client_request_id` per row; batch limits (e.g. 500 rows, 200 photos per run) with resumable queue.
- Round-trip: Phase 12 export format becomes importable (backup/restore).
- No third-party account connections (no scraping, no OAuth to other apps) in this phase.
**Edge cases:** duplicate rows on re-run; malformed dates and locales (dd/mm vs mm/dd chooser); thousands of rows; entries with new dishes (created unlisted); photos referenced but missing.
**Tests:** dry run writes nothing; re-import is idempotent; imported entries not in feeds/search/aggregates until published; export → import round trip equality.
**Acceptance:** a 300-row CSV with 150 photos imports into private drafts, reviewable and publishable in batches, with a clear error report.
**Metric:** % of new users who import; entries per importer after 30 days.

---

## Phase 28 — Smart logging assist (AI, opt-in) (L, later)
**Gate:** funnel data shows drop-off at photo/dish entry; decision 14 resolved (vendor, region, retention, no-training terms); legal review under India's DPDP Act for sending photos to a processor.
**Problems it solves:** typing dish names and prices is the slowest part of logging.

**Scope (in order; ship each separately behind flags)**
1. **Dish suggestion from photo:** after upload, suggest 1–3 dish names the user taps to accept. Never auto-fills silently; always user-confirmed.
2. **Menu/receipt scan:** user photographs a menu or bill → extract dish names and price → user confirms line items. Receipt image is deleted after extraction unless the user attaches it.
3. **Place suggestion:** from typed text/recents only (no location inference from photos).
**Backend:** Edge Function proxy so keys never reach clients; per-user daily quota and cost caps; timeouts with graceful fallback to manual; no raw images stored by the vendor (contractual); request logs contain no image or user identifiers beyond an anonymous request id.
**UX:** clear one-time consent ("Send this photo to our AI provider to suggest a name?"), per-photo not blanket; off by default; setting to disable; suggestions shown as chips, with "Not right? Type it" always first-class; no confidence percentages shown as facts.
**Privacy rules:** nothing is sent without consent; private entries' photos only processed if the owner consents at that moment; no training on user data; suggestions never create public dishes (still unlisted until public-pool use).
**Edge cases:** wrong guesses (measure acceptance rate; if < 40% accepted, remove feature); non-food images; people in photos; regional dishes the model does not know; vendor outage.
**Tests:** consent gate (no network call without consent, tested by network assertion); quota enforcement; receipt image purged; accessibility of chips; time-to-log vs control group.
**Acceptance:** with the feature on, median time-to-log drops measurably versus control and logging completion does not fall; opt-out works.
**Metric:** suggestion acceptance rate, time-to-log delta. **Kill criterion:** no improvement after 4 weeks → remove.

---

## Phase 29 — Taste matching and recommendations (L, later)
**Gate:** Phase 16–17 live and enough public-pool data (≥ 2,000 public entries in the city; ≥ 200 active loggers).
**Problems it solves:** "what should I eat next?" and "who has taste like mine?" — without invented personality claims (rule 13).

**DB:** `user_taste_vectors` (owner-only; derived from the user's own logs: dish/cuisine/category counts weighted by rating), `dish_similarity` (from public-pool co-occurrence and ratings), `rec_feedback(user_id, target, signal)` (dismiss/not interested).
**Backend:** nightly job computes recommendations from (a) the viewer's own history and (b) public-pool aggregates only. Taste overlap between two users uses **only entries the viewer may already see** of the other user, and only when the other user has opted in ("Allow taste comparison", default off). No ML black box in v1: transparent rules (similar cuisines, dishes rated ≥ 4.0 by many people in your city, dishes frequently logged by people you follow).
**UX:** "Because you log South Indian breakfast" style explanations on every recommendation (the reason is the product); dismiss and "not interested" controls that really change future results; a "Taste match" chip on profiles of consenting users showing shared dishes, never a percentage score of "compatibility".
**Privacy rules:** recommendations must be explainable from data the viewer is allowed to see; never reveal that a hidden entry exists; opted-out users never appear in matching; no demographic inference.
**Edge cases:** cold start (few logs → show city popularity labelled as such); filter bubble (always include a "try something different" slot); gaming via fake logs (ignore new/flagged accounts); deleted users disappear from similarity within the next run.
**Tests:** recommendation explanations are reproducible from allowed data (test recomputes); opted-out users absent; private entries never influence what another viewer sees (differential test: add/remove a private entry, other viewer's results unchanged); dismiss reduces repeats.
**Acceptance:** users can see why each suggestion appeared; dismissals persist; privacy differential test passes.
**Metric:** recommendation → log/save conversion; dismissal rate.

---

## Phase 30 — Group food planning (M, later)
**Gate:** collections are often shared and used for "where shall we eat" decisions.
**Problems it solves:** friends decide together; MORS already has shared lists but no collaboration.

**DB:** reuse `collections`; add `collection_members(collection_id, user_id, role editor|viewer, status invited|accepted)`; `plans(id, collection_id, title, planned_for, created_by)`; `plan_votes(plan_id, item_id, user_id, vote)`.
**Backend:** invites by username or link (link requires login and is revocable); members can add items; owner controls roles; notifications for invites and changes; blocks respected (cannot invite/accept across a block).
**UX:** "Plan with friends" from a collection → pick candidates → vote (up/down) → "Decided" marks one item; after the outing, one tap converts the plan to a draft entry for each member ("Log this meal").
**Privacy rules:** membership never expands visibility: each member still sees only the items they can already view through the normal `can_view_*` rules, so a private entry added by someone else stays invisible to other members (the entry's owner must change its visibility to share it); group membership is visible only to members.
**Edge cases:** member leaves (their added items stay/leave per owner's choice); everyone removed; vote ties; plan date passed; invitation spam (rate limit, block).
**Tests:** member visibility truth table; block prevents invitation; revoked link stops working; adding someone's private entry is impossible.
**Acceptance:** two users plan a meal, vote, decide, and each logs it afterwards in under 3 interactions.
**Metric:** plans created per active collection, plan → log conversion.

---

## Phase 31 — Sustainability: MORS Plus (optional) (M, later)
**Gate:** infrastructure cost is material, retention is proven, decision 13 chosen. Skip entirely if costs stay low.
**Principles:** never ads, never sell data, never paywall privacy/safety, never gate core logging, diary access, export or account deletion. Free tier stays genuinely useful.

**Candidate paid features (choose few):** higher photo storage quota, advanced stats history and printable year book, custom themes within the design system, priority import, creator analytics depth.
**Build:** payments via a provider supporting India (e.g. Razorpay or Stripe — decide with finance/legal: GST invoicing, refunds, UPI/mandates); `subscriptions` table written only by verified webhooks (signature checked, idempotent); entitlement function `has_entitlement(user, key)` used server-side only; graceful downgrade (nothing deleted; over-quota users can still view and export everything, only new uploads are limited); billing page with cancel in one click.
**Privacy rules:** payment data never touches MORS servers beyond provider tokens; no payment status exposed to other users; no public "Plus" badge.
**Edge cases:** failed renewals, refunds/chargebacks, duplicate webhooks, regional pricing, taxes, trial abuse.
**Tests:** webhook replay is idempotent; entitlement cannot be set by client; downgrade keeps all data accessible.
**Acceptance:** upgrade, downgrade, cancel, refund flows tested end to end in provider test mode; legal pages updated.
**Metric:** conversion, churn, support burden. **Kill criterion:** if paid features reduce logging or sharing, remove or reprice.

---

## Do NOT build (still)
Chat/DMs (moderation load), ads/sponsored placement, public follower leaderboards, streak/badge gamification, restaurant business accounts and paid promotion, scraping/crawling other apps, auto-publishing from photo libraries, AI-written reviews on behalf of users, location tracking, personality labels, algorithmic feed replacing the chronological one (offer a separate opt-in "For you" tab at most, after Phase 29, never default).
