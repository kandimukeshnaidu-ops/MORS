# MORS Environment & Infrastructure Audit

**Generated:** 2026-11-11  
**Milestone:** M0 Prep — Work Package WP-0.1  
**Commit / Git Tag:** `pre-audit` (commit `07f2cdd`)  
**Operating System:** Windows 11 (PowerShell 5.1 / Node.js v24.18.0 / pnpm v12.18.0)

---

## 1. Project Separation & Credentials Verification

| Environment | Host / Endpoint | Status / Credentials | Separation Verification |
|-------------|-----------------|---------------------|--------------------------|
| **Local** | `http://127.0.0.1:54321` (API)<br>`http://localhost:3000` (Web) | Configured in `apps/web/.env.local` using local placeholder keys | Isolated local loopback |
| **Staging** | Not linked | None | No remote staging project linked; CLI has no remote tokens |
| **Production** | Not linked | None | Agent has **zero** production credentials or MCP access to production |

### Supabase CLI Connection Status
- `npx supabase projects list` returned:
  ```json
  {"_tag":"Error","error":{"code":"AccessTokenRequiredError","message":"Access token not provided. Supply an access token by running supabase login or setting the SUPABASE_ACCESS_TOKEN environment variable."}}
  ```
- **Conclusion:** No production or remote project is linked. CLI is strictly unauthenticated against remote systems.

---

## 2. Environment Variables Inventory

### File: `apps/web/.env.local`
```env
APP_ENV=local
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder_anon_key
SUPABASE_SERVICE_ROLE_KEY=placeholder_service_role_key
```

### File: `.env.example`
Maintained at project root with placeholders for `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`, and `SENTRY_DSN`.

---

## 3. Clean-Clone Test Log (Windows 11)

| Step | Command | Result / Exit Code | Evidence / Notes |
|------|---------|-------------------|------------------|
| **1. Dependencies** | `npx pnpm install` | Exit Code 0 | All monorepo workspaces resolved cleanly. |
| **2. Typecheck** | `npx pnpm -r typecheck` | Exit Code 0 | TypeScript strict mode passes with 0 errors across `@mors/domain`, `@mors/db`, `web`, and `mobile`. |
| **3. Unit Tests** | `npx pnpm test` | Exit Code 0 | 48/48 unit tests passing (11 domain + 37 web). |
| **4. Database Start** | `npx supabase start` | Exit Code 1 (FAILED) | `failed to inspect container health: docker: command not found (podman also not found) — install Docker Desktop or Podman and ensure it is on PATH` |
| **5. Dev Server** | `npx pnpm --filter web dev` | Exit Code 0 (ACTIVE) | Next.js App Router starts on `http://localhost:3000` responding with HTTP 200 OK. |

---

## 4. Safety & Rollback Checkpoint
- Git tag **`pre-audit`** set on clean tree at commit `07f2cdd`.
- Consolidated migrations saved at `supabase/combined_migrations.sql` (187 KB, 32 migrations).
- Seed data preserved at `supabase/seed.sql` (9.7 KB).
