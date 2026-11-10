# MORS — Post-beta phases (14B, 15–21)

Save as `docs/PHASES_POST_BETA.md`. Sits between `docs/PHASES.md` (phases 0–14) and `docs/PHASES_NEXT.md` (phases 22–31). Replaces the short stubs for Phases 15–21 that were in PHASES.md. Same rules: `AGENTS.md`, Definition of Done (IMPLEMENTATION_PLAN §7.9), privacy model (§6), Master Phase Prompt (§10.2).

Template: **Objective · Size/Bucket · Gate · Depends on · Build (DB / Backend / Frontend / UX) · Privacy rules · Edge cases · Tests · Acceptance · Metric (and kill criterion where relevant)**.

A **gate** is evidence from real users, not a calendar date. If a gate never fires, delete the phase.

---

## 0. Roadmap map (everything after the MVP launch gate)

```
Phase 14  Closed beta (Hyderabad, 50-100 users)                  [PHASES.md]
   |
Phase 14B Beta learning sprint  ---- produces docs/BETA_REVIEW_01.md and re-ranks everything below
   |
   +-- 15  Mobile app (Expo), in three slices 15a/15b/15c          gate: native justified by review (decision 18)
   +-- 16  Taste identity and stats                                gate: enough real data per user
   +-- 17  Explore and discovery (restores 5-item nav)             gate: enough public-pool content
   +-- 18  Maps, location, rich dish and place pages               gate: decision 1 final + consent design
   +-- 19  Social upgrades (mentions, grouped notifications,       gate: beta evidence for each item
   |       creator profiles, share links)
   +-- 20  Food Year recap                                         gate: users with a full period of data
   +-- 21  Growth (referrals, SEO opt-in, experiments)             gate: D30 retention healthy
   |
Phases 22-31 (language, trust and safety, scale, multi-city, creator analytics, import, AI assist,
              taste matching, group planning, sustainability)      [PHASES_NEXT.md]
```

Default order if every gate is met: **14B → 15a → 16 → 19 (only evidence-backed items) → 17 → 20 → 15b/15c → 18 → 21**, with Phase 24 (scale) and Phase 23 (trust and safety) from PHASES_NEXT pulled forward whenever their gates fire, because both protect everything else. The beta review may reorder this; it must say why.

**New decisions** (record in `docs/DECISIONS.md`; continues the numbering in IMPLEMENTATION_PLAN §9 and PHASES_NEXT §0):

| # | Decision | Needed by | Default if unanswered |
|---|---|---|---|
| 18 | Native Expo app vs improved PWA first | 14B | PWA first (cheap); native only if the review shows mobile logging friction in the top 3 issues |
| 19 | Email provider for digests (decision 6 extended to bulk mail: domain warm-up, unsubscribe handling) | 14B | Resend with SPF/DKIM/DMARC |
| 20 | Map tiles and geocoding provider and its terms (public OSM tile and Nominatim servers have usage policies that rule out production traffic; verify current terms) | 18 | commercial or self-hosted tiles, MapLibre client |
| 21 | Whether followers see only public-pool stats or stats from entries visible to them | 16 | public-pool stats only (simpler, provably safe) |
| 22 | Day on which Food Year goes live and whether a light recap ships for the first year | 20 | decide by data volume at that time |

---

## Phase 14B — Beta learning sprint (M)
**Objective:** turn four to six weeks of real beta behaviour into decisions, fix the worst friction, and add only the retention loops the data supports. Nothing after this phase is trusted until this is done.
**Gate:** about four weeks since the first 30 users joined, with the analytics in Phase 14 live.
**Depends on:** 14.

**1. Beta scorecard (reproducible, saved queries in `analytics/queries/`)**
Metrics come from the product context. The targets below are **starting hypotheses to challenge, not industry facts**; the owner adjusts them in the review.

| Metric | Definition | Starting target |
|---|---|---|
| First-log completion | signups who publish an entry within 24 h | ≥ 60% |
| Time to log | median seconds from `log_started` to `log_published`, quick vs detailed separately | quick ≤ 45 s |
| Weekly experiences per active user | published entries ÷ weekly active loggers | ≥ 2 |
| D7 / D30 retention | active (logged or opened diary/feed) on day 7 / day 30 after signup | D7 ≥ 25%, D30 ≥ 12% |
| Social connections | accepted follows per user at day 14 | ≥ 3 |
| Collection creation rate | users with ≥ 1 non-system collection ÷ active users | ≥ 20% |
| Repeat logging | users who log in ≥ 3 distinct weeks of their first 5 | ≥ 40% |
| Diary revisit | weekly actives who open diary/calendar | ≥ 30% |

Segment every metric: seeded creators vs organic users; exclude internal/test accounts (PostHog person property `internal=true`, set via allow-list). With fewer than 30 users in a segment, show counts, not percentages.

**2. Qualitative loop**
10 short interviews (script: "show me the last meal you logged; what almost stopped you?"; "when did you last open your diary?"). Session replay stays **off** unless every text field and image is masked; no replay of other users' photos.

**3. Friction triage**
Rank issues by (users affected × severity) ÷ effort. Fix the top five, each with a before/after measurement. Record the rest in the backlog with the reason they were not fixed.

**4. Retention loops (all opt-in, all privacy-checked)**
- **Weekly digest email:** your week in food (count, top-rated dish, a diary highlight) plus up to 3 entries from people you follow. Generated by a job that calls `get_digest_data(user_id)` (SECURITY DEFINER, applies `can_view_*` internally, schema-qualified), never by ad-hoc service-role queries.
- **"On this day" memory** email/in-app card (only if entries exist).
- **Log reminder** at a time the user chooses (email now; push after Phase 15 or PWA).
- One-click unsubscribe, `List-Unsubscribe` header, per-type preferences, send idempotency per (user, type, week).

**5. Native vs PWA decision (decision 18)**
If chosen: PWA manifest, install prompt, offline shell and draft recovery, web push where supported. Measure mobile-web share and logging friction before committing to Phase 15.

**6. Output:** `docs/BETA_REVIEW_01.md` containing the scorecard, interview themes, top-10 friction list, decisions 18–19, and a re-ranked list of Phases 15–31 with reasons. The owner approves it before any later phase starts.

**Edge cases:** seeded creators inflate retention; users who open but never log (count as active for retention, flag for activation); email bounces and spam complaints (suppression list); digest for a user whose follower later blocked them (re-evaluate at send time).
**Tests:** digest content for every viewer role in the truth table; unsubscribe is honoured immediately; duplicate send prevented; scorecard queries return the same numbers on re-run; no event carries free text.
**Acceptance:** scorecard computed from real data; top five friction issues fixed with evidence; digest ships opt-in only; BETA_REVIEW_01 approved.
**Metric:** change in D7 and repeat-logging after the fixes.

---

## Phase 15 — Mobile app, Expo (XL)
**Gate:** BETA_REVIEW_01 justifies native (decision 18) and web beta feedback is addressed.
**Depends on:** 14B. Reuses `packages/domain`, `packages/db`, `packages/tokens`; no business logic is duplicated: mutations call the same RPCs.

Delivered as three reviewable slices, each with its own plan, walkthrough and device checks.

### 15a — Foundation and reading
**Build:** `apps/mobile` with Expo Router (verify current SDK and Router docs); NativeWind or equivalent consuming the same tokens; secure session storage; email and native Google sign-in (PKCE, deep-link redirect); onboarding; Home feed, profile, entry detail (signed URLs batch, `expo-image` with blurhash), notifications list, settings (privacy, blocks, account deletion in-app), reporting and blocking.
**Edge cases:** token refresh when backgrounded; expired session during a request (silent re-auth then retry once); no connectivity (cached read-only feed with a visible offline banner, no fake data); dynamic type and font scaling; Android back-stack.
**Acceptance:** a user can sign up, onboard, read the feed, open entries, follow, like, comment, report and block on iOS and Android; the same RLS rules apply with no client-side exceptions (truth-table integration test run through the mobile client's API layer).

### 15b — Logging, diary and offline
**Build:** Quick Log optimised for one hand (camera or library via the system picker, minimal permissions, no GPS ever read); on-device compression to display and thumb variants, EXIF stripped, orientation applied; background upload queue with retry and exponential backoff; **offline drafts** stored locally and synced; diary timeline and calendar; collections and Saved; search.
**Offline conflict rules (write them into DECISIONS first):** drafts are single-device until published; publishing uses `client_request_id` so a retry after a lost response never duplicates; editing a published entry offline is last-write-wins with an `updated_at` precondition and a clear conflict prompt, never a silent overwrite.
**Edge cases:** app killed mid-upload (queue resumes; orphan objects cleaned by the reconcile job); low storage; permission denied or "limited photos" selection; HEIC/ProRAW; very large images; battery saver; clock changes affecting `eaten_date`.
**Acceptance:** an entry created in airplane mode publishes exactly once when connectivity returns; time-to-log on device ≤ the web quick-log median; no duplicate rows under forced retries.

### 15c — Push, links and store release
**Build:** Expo Push with `push_tokens`; an Edge Function sends pushes from `notifications` and **re-checks `can_view_*` at send time** so a notification about content that has since become private is never sent; per-type push preferences; universal/app links to profiles, entries, collections (unviewable targets open a generic "not found"); store compliance: in-app account deletion, content reporting, blocking, contact route, accurate permission strings and privacy labels (verify current Apple and Google user-generated-content policies); EAS Build/Submit, internal then closed testing tracks; crash reporting; OTA update policy (what may ship over the air vs a store release).
**Edge cases:** push token rotation and multi-device; logout removes token; deep link while logged out (resume after login); notification permission denied (in-app badge still works).
**Tests:** push payloads contain no private text (title/body generic, e.g. "Someone liked your entry", opening the app fetches content under RLS); deleted/hidden target sends nothing; deep links open the right screen; VoiceOver and TalkBack pass on core screens; real-device matrix including one low-end Android.
**Acceptance:** full journey on iOS and Android via internal testing; push deep-links correct; store checklist complete; same privacy guarantees as web.
**Metric:** share of logs from mobile, mobile D30 vs web D30, crash-free sessions.

---

## Phase 16 — Taste identity and stats (M)
**Gate:** enough real data (for example at least 50 users with 20 or more entries); decision 21 made.
**Objective:** turn a person's history into something worth revisiting, from real activity only (rule 13).

**DB:** `user_stats_owner(user_id, period, data jsonb, computed_at)` computed from all of the owner's published entries; `user_stats_public(user_id, period, data jsonb, computed_at)` computed from the public pool only. Periods: `all_time`, `year`, `month`. Refreshed by trigger-enqueued jobs plus nightly reconcile; `recompute_user_stats(user)` for tests.
**Backend:** one function per stat with a unit-tested definition: totals (experiences, distinct dishes, distinct places), favourite cuisines and categories **by count** (not by rating), highest-rated dishes (min 2 ratings of that dish by the user), average rating, most-logged places, monthly activity, longest gap/most active day (only if useful, never as a streak).
**Frontend/UX:** Profile "Taste" section: plain typographic stats and two or three simple charts (bars/line; every chart has a data table alternative); wording is factual ("You logged South Indian food 23 times"), never a personality label ("You are an adventurous eater"). Visitors (decision 21 default) see public-pool stats only, labelled "From public entries". Minimum data thresholds: a stat appears only with at least 5 relevant entries, otherwise a helpful empty state.
**Privacy rules:** stats shown to anyone but the owner never include private, followers-only or draft entries and never show counts that reveal hidden entries (e.g. "12 entries, 3 public" is forbidden); stats vanish when a profile turns private (non-followers) or the account enters deletion.
**Edge cases:** ties; one-dish users; entries without ratings (excluded from rating stats, included in counts); timezone boundaries for months; merged dishes (stats follow `merged_into_id`); back-dated entries.
**Tests:** stats equal a brute-force recompute; differential test (add/remove a private entry; visitor view unchanged); thresholds; charts have data-table alternatives; axe.
**Acceptance:** owner sees full stats; visitors see only public-pool stats; no personality claims anywhere (`check:nofake` phrase list extended).
**Metric:** profile-stats views per active user; effect on diary revisit rate.

---

## Phase 17 — Explore and discovery (L)
**Gate:** enough public-pool content in the city (starting threshold: ≥ 500 public entries and ≥ 50 active loggers).
**Objective:** useful, trustworthy discovery with no ads, driven by people and real activity. Restores the 5-item primary navigation.

**DB:** `explore_cache(scope, city, kind, payload jsonb, computed_at)` refreshed by pg_cron (e.g. every 10 minutes); built from the public pool only. Trending score (starting formula, tune with data): `score = weighted_engagement / (age_hours + 2)^1.5` where engagement counts **distinct** users' likes and comments, requires at least 3 distinct engagers, caps each user's contribution, ignores accounts younger than 24 h and flagged accounts, and excludes reported-and-actioned content.
**Backend:** `get_explore(city, kind, cursor)` returns sections: popular dishes this week, new places, public collections worth opening, new creators (≥ 5 public entries with photos and an accepted-follow rate above a floor), recently reviewed places. Filters: cuisine, category, rating, price band, city. Blocks applied per viewer after the cached candidate set is built, in the query, not in the cache.
**Recommendation reasons:** every suggestion carries a reason computed only from (a) the viewer's own logs or (b) public-pool aggregates ("Popular in Hyderabad this week", "Because you log South Indian breakfast"). A "why am I seeing this" sheet shows the rule.
**Frontend/UX:** editorial layout (large photographs, section headings in the display serif, no card grids of equal boxes); skeletons; empty states for small cities that say so honestly; city switcher (uses profile city).
**Privacy rules:** public pool only; a user with `discoverable=false` never appears; cache rows hold no viewer-specific data and are served `Cache-Control: private` where per-viewer filtering applies; reasons never reference other people's hidden data.
**Edge cases:** cold start city (show fewer sections rather than padding with fake content); gaming (burst likes from new accounts); a viral entry later made private (removed at next refresh and filtered at read time); sparse ratings (don't rank by average with n < 3).
**Tests:** public-pool-only (truth table rerun at the Explore level); blocked users absent; trending ignores sybil fixtures; reasons reproducible; Lighthouse and p95 on a 20,000-entry dataset.
**Acceptance:** Explore contains only real data; reasons visible; private content never surfaces; navigation shows 5 items.
**Metric:** Explore → follow/save/log conversion; share of sessions touching Explore; effect on D30.

---

## Phase 18 — Maps, location and rich dish/place pages (L)
**Gate:** decision 1 (place data source) and decision 20 (map provider) final; place records are mostly deduplicated.
**Objective:** show where food happened without ever exposing where a person is.

**DB:** `places.lat/lng` already exist; add `source_attribution`, `last_synced_at`. A place's coordinates are the venue's, **never the user's**. Block creating places of type `home` and strip street-level addresses typed into "location" text for home-cooked entries.
**Backend:** server-side geocoding proxy (cached, rate-limited; no user identifiers sent); map data RPC returns pins for (a) the owner's own places, (b) public-pool places in the viewed bounds, filtered by viewer visibility; clustering server- or client-side.
**Frontend/UX:** `/map` (owner's food map: my places by rating/category) and city map in Explore; MapLibre with the chosen provider and required attribution; rich dish and place pages: photo strip from the public pool, community average only when n ≥ 3, branches, top cuisines/dishes at a place, "your visits" (owner only) separated from community data; "near me" is a **one-shot** browser permission request, results computed client-side from bounds, the coordinates never stored or logged.
**Privacy rules:** explicit consent for any location use, off by default; no real-time eating activity or "now at" status; a single entry's place is only as visible as the entry; coordinates in payloads are venue coordinates only.
**Edge cases:** closed or moved venues (report flow); chain branches; two venues in one building; permission denied (manual city picker); tile provider outage (map degrades to list); users logging from abroad.
**Tests:** payloads contain no user coordinates (network assertion with geolocation mocked); map pins for a private entry's place appear only to its owner unless another public-pool entry references the place; attribution rendered; works with keyboard (list view alternative to the map).
**Acceptance:** owner map shows own places; city map shows public-pool places; no precise user location is stored anywhere (schema and log search test).
**Metric:** map opens per active user; place pages → log conversion.

---

## Phase 19 — Social upgrades (M, evidence-gated)
**Gate:** each item needs a named beta-review finding. Build only the items with evidence; skip the rest.
**Objective:** make community interactions better without adding messaging or complex mechanics.

**Candidates**
1. **@mentions in comments:** parse server-side; a mention notification (`mention`) is created only if the mentioned user **can view the entry** and no block exists; mention autocomplete lists only the people the commenter may already see (followers/following and entry participants), never a global user search.
2. **Grouped notifications:** group by (type, target, 24 h) at read time ("Ana and 3 others liked your entry"); no stored aggregate rows to leak; per-type preferences; quiet hours.
3. **Creator profiles:** up to 3 pinned collections and 3 featured entries on a profile (owner chooses; visibility rules still apply per viewer); bio links limited and `rel="nofollow ugc"`.
4. **Share links and previews:** `/e/[id]` and `/c/[token]` get OG previews only for public-pool entries and public collections; private/followers/unlisted get a generic image and `noindex`; OG renderer verifies viewability **as anonymous** before rendering the photo; share sheet (Web Share API, copy link).
5. **Better follow suggestions:** mutual follows and shared public-pool dishes; never reveal why a hidden connection exists; dismissible.
6. **Comment tools:** owner can hide a comment (soft hide, visible to its author with a note), per-user muted-words list applied to comments on one's own entries, report reasons expanded, link limits.
**Edge cases:** mention of a user who blocked the commenter; edited comment re-mentioning; mention flood (cap 5 per comment); shared link to an entry later made private (link becomes "not found"); OG scrapers caching a preview after privacy change (short cache, `noindex`).
**Tests:** mention visibility matrix; grouped counts equal viewable events only; OG endpoint returns generic image for every non-public cell of the truth table; muted words applied without leaking.
**Acceptance:** each shipped item has registry rows and tests; direct messaging remains out of scope.
**Metric:** comments per entry, follow rate from suggestions, share-link click-through.

---

## Phase 20 — Food Year recap (M)
**Gate:** users with a full year or enough of a period of data; decision 22. If beta started recently, ship a light "Food Year so far" in December 2026 only if at least 100 users have 10 or more entries; otherwise aim at the full 2027 recap.
**Objective:** a visually beautiful, shareable summary built only from the user's own real activity.

**DB:** `recaps(user_id, year, data jsonb, generated_at, share_token uuid null, share_enabled boolean default false, include_private boolean default false)`; owner-only RLS; `get_recap_by_token(token)` SECURITY DEFINER for shared pages.
**Backend:** generation job (pg_cron + Edge Function) computes: total experiences, most-logged dishes, favourite cuisines, highest-rated dish, most-visited place, biggest discoveries (first-time dishes rated highly), top experiences, monthly activity, shift in cuisine mix between half-years; uses the user's timezone for year boundaries; "light" variant for users with fewer than 10 entries (never empty-state shame).
**Privacy default:** the recap is **private**. Computation includes private entries for the owner's own view only if `include_private` is on; shared output (image/page) is rendered from public-pool entries unless the owner explicitly includes private ones for that share, with a preview showing exactly what will be exposed. Share creates a static image and an optional unlisted page; revoking deletes the token.
**Frontend/UX:** full-screen editorial story (large photos from the user's own entries, serif display type, restrained motion, reduced-motion respected); one-tap share image (server-rendered at 1080×1350 and 1080×1920); text alternative of the whole recap for screen readers; "regenerate" after editing entries.
**Edge cases:** user deletes an entry that appears in a generated recap (recap invalidated and regenerated); entries without photos (typographic panels); a single entry dominating; users who joined in December; ties.
**Tests:** recap equals brute-force recompute; shared image contains no private entry unless opted in (pixel-level check not needed; assert the data inputs); revoke makes the page "not found"; timezone boundary fixtures.
**Acceptance:** generated from real activity only; sharing is opt-in with a clear preview; accessible alternative provided.
**Metric:** recap views, share rate, new users arriving from shares.

---

## Phase 21 — Growth (M, later)
**Gate:** D30 retention and repeat logging meet the targets set in BETA_REVIEW_01. Growth cannot fix weak retention.
**Objective:** bring in more of the right people, with privacy defaults intact.

**Build**
- **Invites and referrals:** invite links tied to the inviter (revocable, rate-limited, one invite code can't mass-create accounts); in-app "Invite friends" with the Web Share API; reward-free by default (decision on incentives recorded; no pay-to-invite).
- **SEO (opt-in):** per-user "Allow search engines to index my public profile and public entries" (default off); sitemap lists only opted-in public-pool pages; `noindex` stays on everything else; structured data for dish and place pages from public-pool aggregates only.
- **Landing and share pages:** public profile and collection landing pages with a clear "Join MORS" path.
- **Onboarding experiments:** A/B via PostHog flags on onboarding steps, with a guardrail metric (first-log completion must not drop).
- **Community onboarding:** seeded-creator playbook per city (consent, guidelines briefing), city waitlist.
- **Public changelog and feedback board.**
**Privacy rules:** indexing is opt-in per user; no tracking pixels on public pages beyond consent-gated analytics; referral links never reveal the inviter's private data.
**Edge cases:** invite abuse and fake accounts; crawlers hitting expensive pages (cache, rate limit); a user turning indexing off (sitemap and meta update immediately, request removal guidance in settings).
**Tests:** sitemap contains only opted-in public-pool URLs (truth-table rerun); invite rate limits; experiment guardrails; `robots` and meta correct per page state.
**Acceptance:** opt-in SEO works; invites trackable; no private content indexed.
**Metric:** activation of invited users vs organic; D30 of invited users. **Kill criterion:** if invited users retain much worse than organic, stop incentives and revisit.

---

## Do NOT build yet
Everything in IMPLEMENTATION_PLAN §8.1 and PHASES_NEXT's "Do NOT build (still)" list, plus: a default algorithmic "For you" feed, public leaderboards of any kind, "streak" mechanics in digests or notifications, mentions of users who cannot see the entry, and location history. Phases only start when their gate evidence exists in BETA_REVIEW_01 or a later review.
