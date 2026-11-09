## Description
<!-- 2-3 plain sentences summarizing the change and how it serves the user journey. -->

## Changes Included
- [ ] Database migrations (if any)
- [ ] Domain schemas / helpers (if any)
- [ ] Web application components / routes (if any)

## Security & Non-Negotiables Check
- [ ] **RLS & Policies:** Every new public table includes RLS enabled, explicit policies, and indexes for policy columns in the SAME migration.
- [ ] **pgTAP Tests:** RLS truth-table tests included for new tables/views.
- [ ] **Data Leaks:** Verified private, followers-only, and draft entries do not leak into public counts, feeds, or search.
- [ ] **Server Secrets:** Service-role key is NOT referenced in client bundles or prefixed `NEXT_PUBLIC_`.
- [ ] **Type Safety:** TypeScript strict passed (`pnpm typecheck`) without any `any`.
- [ ] **Tests Green:** Unit and integration tests passed (`pnpm test`).
