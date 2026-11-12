# Evidence Record: EV-001 — Repository Structure, Git State, and Verification Baseline

- **Evidence ID:** `EV-001`
- **Timestamp:** `2026-11-12T00:16:00+05:30`
- **Git Commit SHA:** `dd12d32ecf7c3ce51a3853bc54e89642f949c47e`
- **Branch:** `master`
- **Phase:** Phase 0 — Product Specification & Repository Reality Audit

---

## 1. Commands / Inspection Methods Executed

1. `git rev-parse HEAD` and `git status --short`
2. `Test-Path README.md` and `Test-Path docs/PRODUCT_CONTEXT.md`
3. `Get-ChildItem -Depth 2` (workspace root, `apps/`, `packages/`, `supabase/`, `docs/`, `scripts/`)
4. `npx pnpm typecheck`
5. `npx pnpm test`
6. `npx pnpm check:nofake`
7. `npx pnpm check:rls`
8. `npx pnpm check:secrets`
9. `npx pnpm build`

---

## 2. Relevant Paths & Symbols Inspected

- [package.json](file:///c:/Users/mukes/OneDrive/Desktop/MORS/package.json)
- [pnpm-workspace.yaml](file:///c:/Users/mukes/OneDrive/Desktop/MORS/pnpm-workspace.yaml)
- [turbo.json](file:///c:/Users/mukes/OneDrive/Desktop/MORS/turbo.json)
- [AGENTS.md](file:///c:/Users/mukes/OneDrive/Desktop/MORS/AGENTS.md)
- [GEMINI.md](file:///c:/Users/mukes/OneDrive/Desktop/MORS/GEMINI.md)
- [docs/DECISIONS.md](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/DECISIONS.md)
- [docs/FEATURE_REGISTRY.md](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/FEATURE_REGISTRY.md)
- [apps/web/package.json](file:///c:/Users/mukes/OneDrive/Desktop/MORS/apps/web/package.json)
- [packages/domain/package.json](file:///c:/Users/mukes/OneDrive/Desktop/MORS/packages/domain/package.json)
- [packages/db/package.json](file:///c:/Users/mukes/OneDrive/Desktop/MORS/packages/db/package.json)
- [packages/tokens/package.json](file:///c:/Users/mukes/OneDrive/Desktop/MORS/packages/tokens/package.json)

---

## 3. Observed Results

### 3.1 Git & Orientation File State
- **HEAD Commit:** `dd12d32ecf7c3ce51a3853bc54e89642f949c47e`
- **Working Tree:** Clean prior to Phase 0 documentation generation.
- **Root `README.md`:** Does not exist (`Test-Path README.md` returned `False`).
- **`docs/PRODUCT_CONTEXT.md`:** Does not exist (`Test-Path docs/PRODUCT_CONTEXT.md` returned `False`).
- **MORS 2.0 Specification Suite (`docs/2.0/`):** 9 Markdown documents present:
  - `MORS_Master_Continuous_Execution_Playbook_Phase_0_to_7.md`
  - `MORS_Phase_0_Antigravity_Audit_Brief.md`
  - `MORS_Phase_1_Product_Alignment_and_Rating_Domain_Foundation.md`
  - `MORS_Phase_2_Restaurant_and_Dish_Data_Architecture.md`
  - `MORS_Phase_3_Find_Food_and_Find_Restaurants_Discovery_Engine.md`
  - `MORS_Phase_4_Multi_Dimensional_Review_and_Experience_Logging_UX.md`
  - `MORS_Phase_5_Restaurant_Profile_and_Canonical_Dish_Comparison_Pages.md`
  - `MORS_Phase_6_Trust_Moderation_and_Anti_Manipulation_Hardening.md`
  - `MORS_Phase_7_Hyderabad_Beta_Seed_QA_and_Launch_Gate.md`

### 3.2 Workspace Packages & Installed Stack
- **Monorepo Manager:** `pnpm@9.15.4` + `turbo@2.3.3`
- **`apps/web`:** Next.js `15.1.0` (App Router), React `19.0.0`, `@supabase/ssr@^0.5.2`, `@supabase/supabase-js@^2.47.10`, Tailwind CSS `^3.4.17`, Vitest `^2.1.8`, Playwright `^1.49.1`.
- **`packages/domain`:** `@mors/domain` (`zod@^3.24.1`, rating helpers, input schemas).
- **`packages/db`:** `@mors/db` (Supabase TypeScript definitions).
- **`packages/tokens`:** `@mors/tokens` (Design tokens JSON + generated `tokens.css`).
- **Note on `GEMINI.md` Stack Header:** `GEMINI.md` Section 0 lists `Drizzle ORM` and `shadcn/ui`, neither of which is installed in `package.json`; the actual codebase uses `@supabase/supabase-js` + Postgres RPCs and custom token-based UI primitives in `apps/web/src/components/ui/`.

### 3.3 Baseline Verification Suite Output
- **`npx pnpm typecheck`:** Passed (`4 successful, 4 total` — `@mors/domain`, `@mors/db`, `@mors/tokens`, `web`).
- **`npx pnpm test`:** Passed (`51 passed, 0 failed` — `@mors/domain`: 11 passed in `ratings.test.ts`; `web`: 40 passed across 12 test files).
- **`npx pnpm check:nofake`:** Passed (`0 violations` across all source files in `apps/` and `packages/`).
- **`npx pnpm check:rls`:** Passed (`51 tables verified with RLS + explicit policies` across 33 migration files).
- **`npx pnpm check:secrets`:** Passed (`0 secret leaks` across source and environment files).
- **`npx pnpm build`:** Passed (`3 successful, 3 total`, 26 Next.js routes compiled cleanly).

---

## 4. Limitations

- Playwright browser E2E suite (`apps/web/e2e/phase14.spec.ts`) was not re-executed during Phase 0 because Phase 0 is a non-invasive specification and codebase reality audit; unit tests, static checks, production build, and live local PostgreSQL schema introspection were executed directly.
