# MORS — Execution Plan v3 (Audit → Polish → Closed Beta)

Save as `docs/EXECUTION_PLAN.md`. Companion files: `AGENTS.md` (rules), `docs/IMPLEMENTATION_PLAN.md` (target spec).

---

## A. How agents must read this file

**Precedence (highest first):** `AGENTS.md` → `docs/IMPLEMENTATION_PLAN.md` Sections 3–4 (target data model and authorization) → this file → anything else. If they conflict, stop and ask the owner.

**Situation assumption.** The repo already contains substantial work (the handbook claims ~32 migrations, ~51 tables, a mobile app, and a "Phase 32"). Those numbers are **unverified claims** until Milestone 1 confirms them. `IMPLEMENTATION_PLAN.md` is the **target spec**; the audit measures the gap between the repo and that spec.
If the repo turns out to be nearly empty, stop and tell the owner; the phase plan in `IMPLEMENTATION_PLAN.md` applies instead.

**Frozen until Gate G3 passes:** new features, "Phase 32+" proposals, all Phase 14 (P1/P2) work, Expo mobile changes (except P0 security fixes), Explore redesign (see WP-2.7).

**Three milestones, three gates.** A milestone is finished when its gate criteria are *demonstrated with evidence and approved by the owner*, never because an agent says "done".

| Milestone | Purpose | Approx. time | Gate |
|---|---|---|---|
| M0 Prep | Safe baseline, fixtures, rules refresh | 1–2 days | G0 |
| M1 Reality Audit | Find out what is true. Read-only. | 4–6 days | G1 |
| M2 Remediation and Polish | Fix, then make it coherent | 2–4 weeks (re-estimate after G1) | G2 |
| M3 Closed Beta | Learn from real users | 3 weeks + analysis | G3 |

---

## B. Operating protocol (applies to every work package, "WP")

1. **One WP per conversation.** Start by reading `AGENTS.md`, this file's section for that WP, and any referenced sections.
2. **Planning mode first.** Produce an Implementation Plan artifact (for audits: the list of checks and commands). Wait for approval before executing.
3. **Branches:** `audit/<wp>`, `fix/<wp>-<slug>`, `design/<wp>-<slug>`, `beta/<wp>`. Never commit to `main`. Conventional commits.
4. **Environment safety:** local Supabase or staging only. Never production. Never `supabase db reset --linked`, `supabase db push` to a remote, `rm -rf`, or force-push. Applied migrations are never edited; every fix is a new migration. Redact secrets in every doc and screenshot.
5. **Evidence rule.** Every claim in a report links to evidence stored in `docs/evidence/<wp>/` (command output, test names, screenshots, request/response pairs). No evidence → status is `UNVERIFIED`.
6. **"Renders" is not "works".** See the COMPLETE definition in Section C.
7. **Audit WPs are read-only.** They may write only to `docs/audit/`, `docs/evidence/`, and `tests/audit/`. If a WP needs anything else, stop and ask. Bugs found during an audit are logged, never fixed in place.
8. **P0 alert.** On finding any P0, immediately append it to `docs/audit/P0_ALERTS.md` and say so at the top of your chat reply.
9. **No guessing.** Unknown or ambiguous → ask. Do not assume a script, table, or route exists; check it.
10. **Windows 11 developer machine.** Package scripts must be cross-platform (use `cross-env`, `rimraf`; no bash-only syntax). Give commands in PowerShell-safe form. Keep `.gitattributes` line endings consistent.
11. **Close every WP with a Walkthrough artifact**: acceptance criteria ticked with evidence links, what was not done, and decisions you had to make.
12. **Stop at the end of the WP.** Do not begin the next one.

---

## C. Definitions

**Status values (feature matrix)**
- `COMPLETE` — all five conditions hold: (1) works end to end in a real browser, (2) persists after refresh, (3) side effects are correct (counts, feeds, notifications), (4) privacy is enforced when checked from a *second* account, (5) failure state handled (error message and retry, no silent failure).
- `WORKING` — happy path works; one or more of the five conditions is unproven or fails.
- `INCOMPLETE` — partly built; some required behaviours missing.
- `BROKEN` — exists but fails.
- `NOT_IMPLEMENTED` — absent.
- `UNVERIFIED` — could not be tested; say why.

**Severity**
| Level | Definition |
|---|---|
| P0 | Data exposure, account takeover, unintended deletion or data loss, auth failure |
| P1 | Core journey broken (log, upload, diary, follow, feed, like/comment, collections, search) |
| P2 | UX quality (navigation, spacing, confusing forms, missing states, accessibility) |
| P3 | Enhancement or refinement |

**Effort:** S (hours), M (about a day), L (2–4 days), XL (more; must be split).

**Finding ID:** `<AREA>-<NNN>`, areas `ARCH`, `SEC`, `DB`, `FEAT`, `UI`, `PERF`. Fields: ID, title, severity, area, steps to reproduce, expected, actual, evidence link, files/RPCs involved, proposed fix, effort.

**Feature matrix row fields:** feature, status, test steps, expected, actual, evidence, frontend files, backend objects (tables/RPCs/policies), finding IDs, a `tests/audit/*.spec.ts` link if scripted.

---

## D. Milestone 0 — Prep

### WP-0.1 Baseline and safety (S)
- Tag current `main` as `pre-audit`. Create a staging DB dump and note where it is stored.
- Verify which Supabase project the CLI is linked to and which env vars point where; record in `docs/audit/ENVIRONMENTS.md`. Confirm local, staging, and production are separated and the agent has no production credentials or MCP connection.
- **Clean-clone test:** fresh clone → `pnpm install` → local DB start → reset + seed → `pnpm dev` works on Windows 11. Record the exact commands and any failures.
- Acceptance: tag exists, `ENVIRONMENTS.md` written, clean-clone test passes or failures are documented.

### WP-0.2 Audit fixtures (S) — the only non-audit prep WP; may add seed data and test helpers only
- Deterministic seed users covering the Section 4 truth table: `owner_public`, `owner_private` (private profile), `follower_accepted`, `follower_pending`, `stranger`, `blocked_by_owner`, `blocker_of_owner`, plus an anonymous client.
- Seed entries per owner in every state: public, followers, private, draft. Include one entry with unique searchable words per state, one with a GPS-tagged JPEG, one multi-dish entry, one collection containing a mix of visible and hidden items.
- A bulk generator for ~1,000 entries for one user (used by performance and diary checks).
- Playwright login helpers for each seeded user, usable in two browser contexts.
- Acceptance: seed runs from clean reset; each persona can sign in via helper.

### WP-0.3 Rules refresh (S)
- Add the block in Section J to `AGENTS.md`. Keep the file under ~12,000 characters; move detail to `docs/`.
- Acceptance: `AGENTS.md` updated, character count reported.

**Gate G0:** WP-0.1 to 0.3 accepted by the owner.

---

## E. Milestone 1 — Reality Audit (read-only)

WP-1.1, 1.2 and the static part of 1.5 may run in parallel (they only read and write separate docs). WP-1.3 and 1.4 share the running app and database, so run them sequentially.

### WP-1.1 Architecture and reconciliation audit → `docs/audit/ARCHITECTURE_AUDIT.md`
Inspect the whole repo: folder structure, Next.js routes/layouts, components, server actions/API routes/RPCs, Supabase migrations and tables, RLS and storage policies, auth/session handling, image pipeline, mobile app, domain schemas, generated types, tests, CI workflows.
Produce:
1. **Verified inventory** with the command used for each number (migrations, tables, routes, components, tests, dependencies).
2. **Handbook claims vs reality** table: each handbook claim → VERIFIED / FALSE / UNVERIFIED.
3. **Schema gap vs `IMPLEMENTATION_PLAN.md` §3**, table by table: present / differs (how) / missing, covering enums, constraints, triggers, indexes, views.
4. **Authorization gap vs §4**: each helper function present? Behaviour matches the spec?
5. Dead code, unused files, duplicated components, unnecessary or vulnerable dependencies (`pnpm audit`; unused-dependency check run via `dlx`, nothing added to the repo).
6. **Mobile app:** inventory only, with an assessment of how far it diverges from web and shared packages. No polish work.
7. **Image buffering/rendering engine:** what problem it was built for, how it works, and a recommendation (keep, simplify, or remove) justified with measurements in WP-1.5.
8. Which scripts exist (`typecheck`, `lint`, `test`, `check:rls`, `check:nofake`, `check:secrets`, others).
- Acceptance: every section present with evidence; no claim without a command or file reference.

### WP-1.2 Security and database audit → `docs/audit/SECURITY_AND_DATABASE_AUDIT.md`
Test by attempting real attacks as an authenticated "attacker" persona and as anonymous, recording request and response. Do not rely on reading policies alone.

| Area | Required checks |
|---|---|
| RLS coverage | Every `public` table has RLS enabled and explicit policies; list them. Policies reference indexed columns. Views use `security_invoker`. |
| Function security | SECURITY DEFINER functions set `search_path = ''` and are schema-qualified. `EXECUTE` is revoked from `anon`/`public` where it should be. |
| Column-level writes | Can a user directly update their own `role`, counters, `deletion_requested_at`, or other server-owned columns through the API? (RLS cannot restrict columns; check grants or triggers.) |
| Truth table | Execute every cell of `IMPLEMENTATION_PLAN.md` §4: viewer {owner, accepted follower, pending follower, non-follower, blocked either way, anonymous} × entry {public, followers, private, draft} × profile {public, private}. Output as a PASS/FAIL matrix. |
| Leak surfaces | Feed, diary, search, counts, community aggregates, stats, notifications, collections (shown and counted), storage URLs, OG images, sitemap, error messages, Realtime channels, RPC payloads, and the raw HTML/network payload of a locked private profile. |
| Storage | Bucket public/private settings; policies; can another user obtain a signed URL for a private photo; signed URL TTL; path traversal; orphaned objects after entry delete. |
| Uploads | Server-side MIME sniffing, size and dimension limits; does the stored file still contain EXIF/GPS (inspect the stored GPS-tagged test file); HEIC handling. Client-only checks do not count. |
| Integrity | FKs and cascades safe (no unintended deletes); counters vs recomputed values (give the SQL); community ratings include only published, public-to-everyone entries; `create_experience` atomic (inject a failure mid-way); idempotency on double submit; `citext` username uniqueness. |
| Auth/session | Protected routes; password reset flow; callback open-redirect; account enumeration; session expiry behaviour; rate limits. |
| Web hardening | Security headers/CSP; XSS in bio, title, comments, tags; service-role key absent from client bundles (build and grep the output); `NEXT_PUBLIC_*` review; git-history secret scan (document the method used). |
| Query performance | `EXPLAIN` on feed, diary, calendar, search with ~1,000 entries; required indexes from §3 present. |

- Classify as **critical** any data exposure, account takeover, or unintended deletion.
- Acceptance: truth-table matrix has no `UNVERIFIED` cells; every check has evidence.

### WP-1.3 Feature functionality audit → `docs/audit/FEATURE_FUNCTIONALITY_MATRIX.md` + `tests/audit/*.spec.ts`
Test as a user in a real browser (browser subagent) and, wherever feasible, encode each check as a Playwright spec. **These specs become the regression suite in Milestone 2.**
Features to cover (verify each against the "what must be verified" column; use two browser contexts for anything social):

| Feature | What must be verified |
|---|---|
| Auth | Signup, email verification, login, logout, reset password, Google OAuth, protected routes |
| Onboarding | Username availability and reserved words, profile setup, privacy preferences, age confirmation |
| Profile and settings | Edit profile, avatar/cover, counts (public-only), privacy toggle, discoverability |
| Food logging | Quick Log in ≤3 interactions (count and time it), detailed log, edit, delete, draft autosave, publish, idempotent double-submit, home-cooked entry with no place or photo |
| Dishes and places | Search, select, create, "did you mean" duplicates, aliases, multiple dishes per entry |
| Photos | Multi-select, compress, preview, reorder, remove, progress, max 10, interrupted upload recovery, deletion cleans storage |
| Ratings | Half-star select by mouse, touch and keyboard; persists as 1..10; own vs community rating separate |
| Diary | Timeline by `eaten_at`, calendar, filters (URL-synced, survive refresh), personal search, pagination |
| Entry detail | All fields, signed-URL photos, empty fields hidden |
| Visibility | Changing an entry to private/followers/draft removes it from feeds, search, aggregates, collections immediately |
| Follow | Follow, unfollow, request, approve, decline, cancel; follow status when target privacy changes |
| Block | Mutual invisibility; follows removed; cannot like/comment |
| Feed | `published_at` ordering, keyset pagination, cold-start/empty state, back-dated entry does not jump the feed |
| Likes and comments | Add/remove, counts, delete own, owner deletes others' on their entry, permissions |
| Notifications | Created, grouped, deduped, read state, no leakage, Realtime update |
| Collections | Create, edit, reorder (mouse and keyboard), share link, unlisted via token only, hidden items not shown or counted, items of types experience/dish/place |
| Search and Explore | Users, dishes, places, public experiences, collections; misspelling ("birayni"); privacy respected; Explore: record what exists and whether it uses real data |
| Reporting and moderation | Report flow, `/admin` queue gated by role, actions |
| Account lifecycle | Data export content (only own data), account deletion removes everything, invite-code beta access |
| Mobile web | 360px usability; real-device check if available |
| Analytics and monitoring | PostHog events and Sentry errors fire; no private content in events |

- Acceptance: every row has a status and evidence; every `COMPLETE` row satisfies all five conditions in Section C.

### WP-1.4 UI/UX audit → `docs/audit/UI_UX_AUDIT.md`
- Screenshot every page at **360, 768, 1280px** to `docs/evidence/UI/<page>-<width>.png`.
- Per page, check: spacing/typography consistency, photo proportions, clutter, navigation clarity, alignment, button sizes (touch target ≥44px), text hierarchy, unnecessary borders/cards, loading/empty/error states, mobile behaviour.
- Also: axe scan per page, keyboard-only pass of the Log flow, contrast, `prefers-reduced-motion`, hard-coded colors/fonts outside token files (grep), duplicate components, `/dev/ui` gallery completeness.
- Compare against the design rules in `AGENTS.md` (dark charcoal, warm off-white text, muted olive accent, serif display + clean sans, large food photography, no dashboard-card clutter).
- Output: ranked problem list (finding IDs, severity, screenshot link). **No redesign proposals yet** except one-line fix hints.
- Acceptance: all pages × 3 widths covered; list ranked.

### WP-1.5 Performance, tests and resilience audit → `docs/audit/PERFORMANCE_AUDIT.md`
- Run the scripts that actually exist (from WP-1.1): typecheck, lint, unit tests, pgTAP, RLS check, secrets check, fake-data check, `pnpm --filter web build`. For each: command, exit code, summary, and whether the check itself is trustworthy (e.g., does the RLS check really fail when it should?). A missing script is a finding.
- Bundle size per route (from build output). Lighthouse mobile on Home, Log, Entry detail, Diary, Profile.
- Resilience tests: throttled network (Slow 4G), 12MP and HEIC images, 10 photos at once, empty feed, 1,000-entry diary, repeated clicks/double submit, failed requests (abort in Playwright), interrupted upload, session expiry mid-action, browser refresh mid-edit (is the draft recoverable).
- Query counts per page (look for N+1).
- **Buffering engine verdict:** compare LCP/CLS/perceived load with and without the engine (feature flag or temporary local switch, never committed). State whether it solves a measured problem.
- Acceptance: all commands run and recorded; each resilience scenario has pass/fail with evidence.

### WP-1.6 Synthesis → `docs/audit/PRIORITISED_BUG_BACKLOG.md` and `docs/audit/EXECUTIVE_SUMMARY.md`
- Merge and de-duplicate all findings; assign P0–P3 and effort; group into the remediation batches of Milestone 2 (WP-2.1 … 2.9); mark dependencies.
- Executive summary (one page): what is solid, what is broken, what is claimed but false, top 10 risks, and a **recommendation per area**: keep / fix / rework / remove. Rework of a schema or design system must be justified with specific evidence.
- Re-estimate Milestone 2 using the backlog sizes.

### Gate G1 (all must be true)
- All seven audit docs exist: `ARCHITECTURE_AUDIT`, `FEATURE_FUNCTIONALITY_MATRIX`, `SECURITY_AND_DATABASE_AUDIT`, `UI_UX_AUDIT`, `PERFORMANCE_AUDIT`, `PRIORITISED_BUG_BACKLOG`, `EXECUTIVE_SUMMARY`.
- Every feature row has a status and evidence. Truth table fully executed.
- `git diff pre-audit -- apps packages supabase/migrations` shows **no** source changes.
- Owner has reviewed and approved the backlog and the keep/fix/rework/remove decisions.

---

## F. Milestone 2 — Remediation and Polish

**Rules for all of M2**
- Work from the approved backlog, in the order below. Each WP = one branch, one plan, one PR.
- **Test first:** each fix starts with a failing test (promote the relevant `tests/audit` spec). Red → green → commit.
- Forward-only migrations. No schema rewrite, design-system replacement, or restructuring of working components without a written justification in the plan and owner approval.
- Each PR template states: RLS + pgTAP included? tests added? screenshots at 3 widths?
- Do not add dependencies without a stated reason in the plan.

### WP-2.1 P0: security and data integrity
Fix every P0 in the backlog first. Typical scope: missing RLS/policies, column-level write protection (revoke column privileges or trigger-guard `role`, counters, deletion fields), function grants, leak surfaces, storage policies, server-side upload validation and EXIF/GPS stripping, counter/aggregate correctness, unsafe cascades, secret exposure.
- Add a CI check that fails if any public table lacks RLS or policies, and if the service-role key appears in client bundles.
- Acceptance: pgTAP truth table 100% green in CI; Supabase security and performance advisors show no critical findings; each P0 has a regression test.

### WP-2.2 Auth, session and account lifecycle
Auth/session defects; password reset; protected routes; callback redirect safety; rate limits; account deletion (grace period, hard delete of rows and storage), data export (own data only). Legal page shells and the age-confirmation decision wired in.
- Acceptance: full signup → verify → onboard → logout → login → reset E2E in CI; deleting a test account leaves no trace in feed, search, aggregates, collections or storage.

### WP-2.3 Logging and photos (most important journey)
UX contract: Quick Log = photo (or none) + one dish + optional rating → published in about three interactions after opening Log; "Add details" reveals the rest progressively. Atomic `create_experience`/`update_experience`, idempotency key, draft autosave and recovery after refresh, photo pipeline (compress ≤2048px, EXIF strip, reorder, remove, progress, retry), delete removes storage objects, `time-to-log` captured.
- Acceptance: interaction count verified by test; failure injection leaves no partial rows; private photo URLs inaccessible to others; home-cooked entry with no place/photo publishes.

### WP-2.4 Diary and entry detail
Keyset timeline, calendar RPC, URL-synced filters, personal search, empty states; detail page structure (photo, author/date, title, rating, dishes with ratings, notes, optional place/cuisine/price, likes/comments, add to collection, share). Do not render empty fields.
- Acceptance: with 1,000 seeded entries queries use indexes (`EXPLAIN` saved); filters survive refresh; only the owner sees drafts/private.

### WP-2.5 Social, collections and search
Split into two PRs.
- **2.5a** Follow/requests/block, home feed (`published_at`, keyset), likes, comments, notifications (deduped, no leakage), reporting and the `/admin` queue.
- **2.5b** Collections (reorder with keyboard alternative, unlisted by token, hidden items neither shown nor counted), search (`search_all`, typo tolerance, privacy respected).
- Acceptance: feed-level truth table green; cannot like/comment on what you cannot view; searching another user's private words returns nothing; misspelling test passes.

### WP-2.6 Design system consolidation
- Update the **existing** `/dev/ui` gallery; do not create a second component library.
- Tokens as CSS variables: background/surface, text, accent (muted olive), semantic colors, fonts (state the chosen free serif + sans in the plan), type scale, spacing, widths, radii, borders, image aspect ratios, shadows, motion durations. **Dark charcoal is the default theme; a light theme is out of scope.** Tune for WCAG AA.
- Components and required states: Button (primary, secondary, ghost, disabled, loading), Input (default, focus, error, disabled), RatingStars (empty, half, full, interactive, read-only, keyboard), ExperienceCard (image, no image, private, multi-dish), Avatar (sizes, fallback, loading), CollectionCard (cover, no cover, empty), Modal/Sheet (open, close, confirm), Skeletons (feed, diary, profile, collection), Notification item (unread, read, grouped), Toast, EmptyState, ImageWithBlur.
- Add a CI lint that fails on hard-coded hex colors or font names outside the token files.
- Outputs: `docs/polish/DESIGN_SYSTEM.md`, `docs/polish/UI_COMPONENT_AUDIT.md`.
- Acceptance: gallery shows every component state at 360/768/1280; axe passes on the gallery; token lint green.

### WP-2.7 Screen redesign (in this order)
Log → Entry detail → Home feed → Diary → Profile → Collections → Search → Settings and notifications.
- **Design checkpoint:** after Log and Entry detail, stop and present before/after screenshots at 3 widths. The owner approves the direction before the remaining screens are done.
- Direction: photography-led, editorial typography, quiet interface, restrained color; avoid making every post a large dashboard card; food gets room to breathe; show honest counts only; profile feels personal, not like creator analytics.
- **Explore:** not redesigned before beta (`IMPLEMENTATION_PLAN.md` puts it in Phase 14). If the audit found a working Explore on real data, keep it as is; if it is broken or fake-data, hide it behind a feature flag or show a "coming soon" state. Search is polished; Explore and Search stay distinct.
- Per screen: loading, empty and error states; before/after screenshots into `docs/polish/screens/`.
- Output: `docs/polish/REDESIGN_CHANGELOG.md`.

### WP-2.8 Interaction, responsive, accessibility and performance
- Optimistic like with rollback on failure; blur-up image loading; upload progress; immediate publish feedback; save/discard confirmations; retry on failed requests; skeletons resembling final content; every button shows its state (no silent two-second waits).
- Mobile: bottom navigation with a prominent Log action, full-screen log sheet, one-handed reach, no hover-only interactions, camera/gallery permission handling. Desktop: editorial multi-column, bounded text width.
- Accessibility: keyboard-complete flows (including rating and reorder), visible focus, screen-reader labels, photo alt-text field, contrast AA, `prefers-reduced-motion`.
- Performance targets (on throttled Slow 4G, mobile profile): LCP ≤ 2.5 s on Home and Entry detail, CLS ≤ 0.1, no unbounded request waterfalls; axe: zero serious/critical violations.
- Output: `docs/polish/ACCESSIBILITY_AND_PERFORMANCE_REPORT.md`, responsive test results.

### WP-2.9 Beta-readiness hardening
- Playwright journeys in CI using two browser contexts: sign up → log (quick and detailed) → diary → follow → feed → like/comment → collection → search → privacy change → block → delete account.
- Error monitoring verified end to end (trigger a test error and see it in Sentry). Upload and request rate limits tested.
- **Backup and restore drill:** restore a backup to a scratch project and verify data; document the steps in `docs/ops/BACKUP_RESTORE.md`.
- Production infrastructure checklist: paid Supabase tier (backups, no inactivity pause), Vercel plan suitable for the use, custom email domain, cron jobs for deletion/cleanup running.
- Legal: Terms, Privacy Policy, Community Guidelines present; age rule decided; lawyer review done or explicitly waived by the owner in writing.
- Feedback entry point in the app; invite-code access tested; a documented incident procedure ("pause invites, hotfix, notify users").
- Produce `docs/polish/FUNCTIONAL_REMEDIATION_REPORT.md`: every P0/P1 → fixed commit + test link.

### Gate G2 (all must be true)
- Zero open P0; every P1 on a core journey fixed with a test.
- The 14 MVP launch-gate items from `IMPLEMENTATION_PLAN.md` Section 7 each have evidence.
- E2E suite green in CI; pgTAP green; advisors clean; token lint green.
- Before/after screenshots for all main pages; responsive and accessibility reports done.
- Owner approves beta readiness in writing.

---

## G. Milestone 3 — Closed Beta

### WP-3.1 Instrumentation (agent)
PostHog, opt-in and consent-aware. **Never send:** free text (titles, notes, comments, bio), photo URLs, exact place names tied to private entries, or anything about private/followers-only/draft entries beyond a count-free event name. No session replay on the Log flow or any private entry (mask it). Properties allowed: anonymous user id, `quick|detailed`, durations, counts, screen name, app version.

Events:
```
signup_completed, onboarding_completed
first_log_started, first_log_published
food_experience_published, food_experience_edited, food_experience_deleted
diary_viewed, diary_filter_used, diary_entry_opened
user_followed, follow_request_accepted, experience_liked, comment_created
collection_created, collection_item_added, collection_shared
search_performed, explore_item_opened
```
- Add a Playwright test asserting events fire and carry no forbidden properties.
- Build PostHog funnels/dashboards for the metrics below.
- Acceptance: event test green; owner can see the funnel in PostHog.

**Metrics (definitions):** signup completion; first-log completion (% of signed-up users who publish within 24 h); time to first log (`first_log_started` → `first_log_published`); logs per active user per week; repeat logging (≥2 logs on different days); diary revisit (≥1 `diary_viewed` on a day other than a log day); follows per user; collection creation rate; D1 and D7 retention; "returned in week 2" and "returned in week 3".
**Note on D30:** a 3-week beta cannot measure D30. Schedule a 30-day follow-up check for the same cohort and treat D30 as a later measurement.

### WP-3.2 Beta pack (agent drafts, owner edits)
`BETA_TEST_PLAN.md`, `BETA_ONBOARDING_GUIDE.md` (what MORS is, what to try, how to report problems, what data is collected), `docs/beta/INTERVIEW_SCRIPT.md`, feedback form, issue-log template (fields: user type, screen, issue, severity, frequency, evidence, proposed solution, status; bugs, usability issues and feature requests kept separate).

### WP-3.3 Run the beta (owner-led; agent supports with triage)
- **Cohort:** 10–20 people via invite codes. At least 5 are not close friends. Include: casual food lovers, restaurant explorers, home cooks, heavy social-media users, food enthusiasts, and at least 2 less technical users. Any seeded creator content must come from real people who agreed to it; do not fabricate users or content.
- **Pre-flight (day 0):** the owner and two testers run the full journey on a real phone and a desktop; fix blockers.
- **Tasks given to testers:** (1) join and onboard; (2) log a home-cooked meal with a photo and no place; (3) log a multi-dish meal with ratings, a place and details; (4) find a meal from a past date in the diary and edit it; (5) search and follow people, view their public entries; (6) like, comment, check notifications; (7) create a collection and share it; (8) create a private entry and verify a second account cannot see it.
- **Observation:** 3–5 moderated 30-minute sessions (screen share, think-aloud) in week 1; interviews at the end of week 1 using the script; ask "what did you try to do that you couldn't?"
- **Cadence:** weekly triage. After the first week, only P0/P1 hotfixes ship; everything else is queued so the cohort sees a stable product.
- **Stop-the-line:** any privacy leak or data loss → pause invites, hotfix, notify affected users, add a regression test.

### WP-3.4 Analysis and roadmap (agent drafts from real data; owner decides)
Outputs: `USER_FEEDBACK_REPORT.md`, `BETA_ANALYTICS_REPORT.md`, `USABILITY_ISSUES.md`, `POST_BETA_PRIORITISED_ROADMAP.md`.
- Classify every finding: **Fix immediately** (privacy, data loss, broken logging, critical usability), **Improve next** (repeated complaints, confusing flows), **Validate further** (raised by one or two people), **Reject/defer** (off-core).
- State the sample size in every quantitative claim. 10–20 users give directional evidence only; do not claim retention forecasts or product-market fit.
- Proposed directional targets for the owner to adjust before the beta starts (not pass/fail): ≥70% signup→onboarding completion, majority of testers publish a first log, median quick-log time well under 60 s, ≥30–40% of testers log on 3+ distinct days, most testers complete the privacy task correctly.

### Gate G3
- Testers completed the journeys; all feedback recorded in the issue log; findings classified; roadmap derived from evidence; owner approves the next roadmap. Only then may the Phase 32+ proposals, Phase 13 (mobile) and Phase 14 be reconsidered.

---

## H. Templates

**Finding**
```
### SEC-007 — <title>
Severity: P0 | Area: SEC | Effort: M
Steps: 1) … 2) …
Expected: …
Actual: …
Evidence: docs/evidence/WP-1.2/SEC-007-request.txt
Files/objects: apps/web/…, rpc get_home_feed, policy experience_select
Proposed fix: …
```

**Matrix row**
```
| Likes | WORKING | tests/audit/likes.spec.ts | like persists, count +1, blocked user cannot like | count updates; blocked user CAN like (FEAT-031) | docs/evidence/WP-1.3/likes/ | components/LikeButton.tsx | experience_likes, trigger likes_count | FEAT-031 |
```

**Backlog row:** `ID | Title | P | Effort | Batch (WP-2.x) | Depends on | Status (open / in progress / fixed / verified) | Fix commit | Test`

**Evidence layout:** `docs/evidence/<WP>/<finding-or-feature>/…`

---

## I. Decisions the owner must make

| # | Decision | Default if unanswered | Needed by |
|---|---|---|---|
| 1 | Does the repo already contain the work the handbook claims (or is it near-empty)? | Assume substantial work exists | G0 |
| 2 | Minimum age (13+/16+/18+) and lawyer review of Terms/Privacy (including India's DPDP Act implications) | 18+ until a lawyer says otherwise | WP-2.2 |
| 3 | Account deletion grace period | 14 days | WP-2.2 |
| 4 | Place data source | User-created + city text | WP-2.3 |
| 5 | Beta access | Invite codes | WP-2.9 |
| 6 | Email provider/domain for auth email | Resend with a custom domain | WP-2.2 |
| 7 | Who reviews reports during the beta, and response time | Owner, within 24 h | WP-2.9 |
| 8 | Mobile app: frozen until after the beta | Frozen | G1 |
| 9 | Explore: hidden or kept as is until after the beta | Hidden/coming soon if not real-data | G1 |
| 10 | Analytics consent model | Opt-in banner | WP-3.1 |
| 11 | Design checkpoint approval (after Log and Entry detail) | Required | WP-2.7 |

---

## J. Additions for `AGENTS.md` (paste at the end; keep the whole file under ~12,000 characters)

```md
## Audit, evidence and change-control rules
- In audit work packages, change only docs/audit/, docs/evidence/ and tests/audit/. Log bugs; never fix them in place.
- A feature is COMPLETE only if it works end to end in a browser, persists after refresh, has correct side effects (counts, feeds, notifications), is privacy-correct when checked from a second account, and handles failure visibly. "The page renders" is not complete. Anything unproven is UNVERIFIED.
- Every claim in a report links to evidence in docs/evidence/. No evidence, no claim.
- Every bug fix starts with a failing test.
- Never touch production. Never run supabase db reset --linked, db push to a remote, rm -rf, or force-push.
- Do not rewrite the database schema, the design system, or working components without a written justification in the plan and my approval.
- The developer machine is Windows 11: package scripts must be cross-platform.
- Work package scope is strict. Stop at the end of the package.
```

**Antigravity settings reminder:** Planning mode; Review-driven policy; terminal commands ask first (allowlist `pnpm`, `git status`, `supabase test db`); deny `supabase db reset --linked`, remote `db push`, `rm -rf`; Supabase MCP connected to the dev project only; never ignore `.agents/` in `.gitignore`. Audit WPs 1.1, 1.2 and static 1.5 may run in parallel; anything that edits code or migrations runs alone.

---

## K. Master prompt (replace `<WP>`)

```
Read AGENTS.md and docs/EXECUTION_PLAN.md (Sections A, B, C and the section for <WP>).
Also read the sections of docs/IMPLEMENTATION_PLAN.md that <WP> references.
Use Planning mode. First produce an Implementation Plan artifact (files, commands, tests, migrations, any new dependency with a reason) and wait for my approval.
Then execute ONLY <WP>. Do not start any other work package or any frozen feature.
Store all evidence in docs/evidence/<WP>/. Never mark anything complete without evidence.
If something is ambiguous, contradicts the plan, or you find a P0, stop and tell me.
Finish with a Walkthrough artifact: each acceptance criterion ticked with an evidence link, what was not done, and decisions you made.
```

**Suggested order of conversations:** 0.1 → 0.2 → 0.3 → (1.1 ∥ 1.2) → 1.3 → 1.4 → 1.5 → 1.6 → **G1 review with the owner** → 2.1 → 2.2 → 2.3 → 2.4 → 2.5a → 2.5b → 2.6 → 2.7 (checkpoint) → 2.8 → 2.9 → **G2** → 3.1 → 3.2 → 3.3 → 3.4 → **G3**.
