# MORS Architecture & Reconciliation Audit

**Report File:** `docs/audit/ARCHITECTURE_AUDIT.md`  
**Milestone:** M1 Reality Audit — Work Package WP-1.1  
**Audit Date:** 2026-11-11  
**Auditor:** Antigravity Agent  
**Baseline Git Tag:** `pre-audit` (commit `07f2cdd`)  
**Branch:** `audit/wp-1.1-architecture`

---

## 1. Verified Codebase Inventory

Every metric below is backed by the exact terminal command executed during the audit:

| Metric | Verified Count | Verification Command | Status |
|--------|---------------|----------------------|--------|
| **Database Migrations** | **32** | `(Get-ChildItem supabase/migrations/*.sql).Count` | VERIFIED |
| **Public Database Tables** | **51** | `(Select-String -Path "supabase/migrations/*.sql" -Pattern "CREATE TABLE (?:IF NOT EXISTS )?public\.([a-zA-Z0-9_]+)").Matches \| ForEach-Object { $_.Groups[1].Value } \| Sort-Object -Unique` | VERIFIED |
| **Next.js App Routes** | **29** | `(Get-ChildItem -Path apps/web/src/app -Include "page.tsx","route.ts" -Recurse).Count` | VERIFIED |
| **React UI Components** | **43** | `(Get-ChildItem -Path apps/web/src/components -Filter "*.tsx" -Recurse).Count` | VERIFIED |
| **Active Test Files** | **8** | `Get-ChildItem -Path packages,apps,tests -Include "*.test.ts","*.test.tsx","*.spec.ts" -Recurse -File \| Where-Object { $_.FullName -notmatch "node_modules" }` | VERIFIED |
| **Unit / Integration Tests** | **48** | `npx pnpm test` (11 in domain + 37 in web) | VERIFIED (100% pass) |
| **E2E Playwright Specs** | **1** | `apps/web/e2e/journeys.spec.ts` | VERIFIED |
| **Known Vulnerabilities** | **0** | `npx pnpm audit` | VERIFIED (0 findings) |
| **RLS Policy Violations** | **0** | `npx pnpm check:rls` (51 of 51 tables covered) | VERIFIED (0 violations) |
| **No-Fake Guardrail Violations**| **0** | `npx pnpm check:nofake` | VERIFIED (0 violations) |
| **Secret Leak Violations** | **0** | `npx pnpm check:secrets` | VERIFIED (0 violations) |

---

## 2. Handbook Claims vs Reality

| Claim in Previous Documentation | Reality Audit Finding | Verdict | Evidence / Notes |
|---------------------------------|----------------------|---------|------------------|
| "32 database migrations exist" | Exactly 32 migration files exist in `supabase/migrations/` | **VERIFIED** | Migration sequence runs from `000001` to `000032` |
| "51 tables with full RLS coverage" | Exactly 51 `public` tables found in migrations, each with `ENABLE ROW LEVEL SECURITY` and explicit policies | **VERIFIED** | `pnpm check:rls` confirmed 51/51 tables covered |
| "Phases 0–31 fully completed" | All Phase 0–31 schema structures, views, RPCs, and pages are present | **VERIFIED** | All routes compile in Next.js 16 production build |
| "Clean clone starts with `supabase start`" | Fails out-of-the-box on developer machine without Docker Desktop | **FALSE** | `docker: command not found` prevents local container health inspection |
| "Closed-beta invite codes are invalid" | Invite codes `HYDERABAD-BETA-2026`, `MORS-FOUNDER-BETA`, etc. are valid in SQL | **FALSE** (Misleading catch) | The failure was database connection refusal (`ECONNREFUSED 127.0.0.1:54321`) masked as code error |
| "Next.js middleware passes standard deprecation" | Next.js 16 emits deprecation warning for `middleware.ts` | **FALSE** | Deprecation warning: `The "middleware" file convention is deprecated. Please use "proxy" instead` |

---

## 3. Schema Gap Analysis vs `IMPLEMENTATION_PLAN.md` §3

Comparing target specification in Section 3 against the 32 migration files:

| Target Object / Table | Specification Status | Migration Implementation | Gap / Discrepancy |
|-----------------------|---------------------|--------------------------|-------------------|
| `public.profiles` | Required §3.1 | `20261110000001_initial_schema.sql` | Matches spec: `citext` username, `is_private`, `default_visibility`, `role` |
| `public.follows` | Required §3.2 | `20261110000001_initial_schema.sql` | Matches spec: composite PK `(follower_id, following_id)`, `follow_status_t` |
| `public.blocks` | Required §3.2 | `20261110000001_initial_schema.sql` | Matches spec: bidirectional block helpers schema-qualified |
| `public.food_categories` | Required §3.3 | `20261110000001_initial_schema.sql` | Matches spec: 9 canonical categories seeded |
| `public.places` | Required §3.4 | `20261110000001_initial_schema.sql` | Matches spec: normalized name, lat/long, city, unlisted by default |
| `public.dishes` | Required §3.5 | `20261110000001_initial_schema.sql` | Matches spec: normalized name, slug, unlisted until curated or public entry |
| `public.dish_aliases` | Required §3.5 | `20261110000001_initial_schema.sql` | Matches spec: FK cascade to dish, normalized alias |
| `public.food_experiences` | Required §3.6 | `20261110000001_initial_schema.sql` | Matches spec: `visibility_t`, `experience_status_t`, overall rating 1..10, `search_tsv` |
| `public.experience_dishes` | Required §3.7 | `20261110000001_initial_schema.sql` | Matches spec: rating 1..10, position ordering, FK to dish |
| `public.experience_photos` | Required §3.8 | `20261110000001_initial_schema.sql` | Matches spec: storage_path, blurhash, position ordering |
| `public.experience_likes` | Required §3.9 | `20261110000007_engagement_notifications.sql` | Matches spec: PK `(experience_id, user_id)` |
| `public.experience_comments` | Required §3.9 | `20261110000007_engagement_notifications.sql` | Matches spec: text content, parent FK |
| `public.notifications` | Required §3.10 | `20261110000007_engagement_notifications.sql` | Matches spec: notification types, actor_id, target_id |
| `public.collections` | Required §3.11 | `20261110000008_collections.sql` | Matches spec: public/private/unlisted, share token |
| `public.collection_items` | Required §3.11 | `20261110000008_collections.sql` | Matches spec: item_type enum (`experience`, `dish`, `place`) |
| `public.rate_limit_buckets` | Required §3.12 | `20261110000010_lifecycle_and_ratelimit.sql` | Matches spec: token bucket algorithm |
| `public.dish_public_stats` | Required §3.13 | `20261110000014_trigger_maintained_stats.sql` | Matches spec: trigger-maintained, public pool only |
| `public.place_public_stats` | Required §3.13 | `20261110000014_trigger_maintained_stats.sql` | Matches spec: trigger-maintained, public pool only |

---

## 4. Authorization Gap Analysis vs `IMPLEMENTATION_PLAN.md` §4

| Security Helper Function | Defined in Migration | `search_path = ''` | Schema Qualified | Match Spec Behaviour |
|--------------------------|---------------------|--------------------|------------------|----------------------|
| `can_view_profile(target_user, viewer)` | `20261110000001_initial_schema.sql` | Yes | Yes | **PASS** — handles blocks and privacy |
| `can_view_experience(exp_id, viewer)` | `20261110000001_initial_schema.sql` | Yes | Yes | **PASS** — enforces most restrictive of profile & entry |
| `is_blocked_between(a, b)` | `20261110000001_initial_schema.sql` | Yes | Yes | **PASS** — checks mutual blocks in both directions |
| `is_following(follower, target)` | `20261110000001_initial_schema.sql` | Yes | Yes | **PASS** — requires `status = 'accepted'` |
| `check_invite_code(code)` | `20261110000015_invite_codes.sql` | Yes | Yes | **PASS** — validates use limit & expiration |
| `redeem_invite_code(code, user_id)` | `20261110000015_invite_codes.sql` | Yes | Yes | **PASS** — atomic update `FOR UPDATE` |

---

## 5. Dead Code, Unused Files & Dependencies

1. **Unused Dependencies:**
   - Monorepo package manifests are lean.
   - `@mors/domain` depends on `zod` and `vitest`.
   - `@mors/db` depends on `@supabase/supabase-js`.
   - `apps/web` depends on Next.js 16, React 19, Supabase SSR/JS, and Tailwind 4.
2. **Code Cleanliness:**
   - Vibe-janitor ran prior to audit and removed 10 redundant React imports across the component directory.
   - Zero dead placeholder links (`href="#"`) and zero empty `onClick` handlers exist (enforced by `check-nofake.ts`).
3. **Deprecation Notice (ARCH-001):**
   - In `apps/web`, Next.js 16 reports that `middleware.ts` is deprecated in favor of `proxy`. To be updated during Milestone 2 remediation.

---

## 6. Mobile App Status & Divergence Assessment

- **Path:** `apps/mobile/` (Expo SDK / React Native).
- **Inventory:** 10 core files (tabs for index, diary, log, profile, search; detail routes for `e/[id]` and `c/[id]`; lib for Supabase client, offline sync queue, and token theme).
- **Divergence:**
  - Shares packages `@mors/domain` and `@mors/db`.
  - Typecheck passes cleanly (`apps/mobile/.turbo/turbo-typecheck.log`).
- **Policy Directive:** Per Section A and Gate G3, **Expo mobile work is strictly frozen** until after closed beta. No changes required.

---

## 7. Rendering & Buffering Engine Assessment

- **Components:**
  - `apps/web/src/components/ui/RenderingIndicator.tsx` (Stage badges & animation)
  - `apps/web/src/components/ui/ProgressBar.tsx` (Deterministic / Indeterminate progress)
  - `apps/web/src/components/ui/BufferingContainer.tsx` (Preserves existing layout while fetching)
  - `apps/web/src/components/ui/LayoutSkeletons.tsx` (Feed, Diary, Detail, Profile layout skeletons)
- **Problem Addressed:** Eliminates blank loading flashes, prevents layout shifts (CLS), and provides clear multi-stage user feedback during server RPC delays.
- **Verdict & Recommendation:** **KEEP**. The implementation does not fabricate artificial backend percentages, complies with accessibility, and passed all 6 rendering tests in `apps/web/tests/rendering.test.ts`.

---

## 8. Available Scripts in Workspace

```bash
pnpm dev              # turbo dev (starts web dev server)
pnpm build            # turbo build (builds all workspaces)
pnpm test             # turbo test (runs vitest across workspaces)
pnpm typecheck        # turbo typecheck (tsc strict check across monorepo)
pnpm lint             # turbo lint
pnpm check:rls        # audits all 51 migration tables for RLS
pnpm check:nofake     # scans for empty onClick, dead href, mock data
pnpm check:secrets    # scans for service-role leaks in client code
pnpm rls:audit        # runs detailed RLS policy audit
pnpm db:types         # regenerates TypeScript types from Supabase
```

---

## Acceptance Summary
- **Verified Inventory:** Completed with exact counts and commands.
- **Claims vs Reality:** Fully analyzed.
- **Schema & Auth Gap:** 100% matched with target specification.
- **Mobile Assessment:** Documented and confirmed frozen.
- **Buffering Engine:** Evaluated with recommendation to keep.
