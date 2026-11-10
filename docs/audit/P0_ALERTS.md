# MORS P0 Security & Integrity Alerts

**Milestone:** M1 Reality Audit  
**Status:** RESOLVED (Fixed in Migration 33 `20261110000033_guard_profile_columns.sql`)

---

### SEC-001 — Unrestricted Column-Level Update on `public.profiles`
- **Severity:** P0
- **Area:** SEC
- **Files/Objects Involved:** `supabase/migrations/20261110000033_guard_profile_columns.sql`, trigger `trg_guard_profile_columns` on `public.profiles`.
- **Status:** **FIXED** (commit on branch `fix/wp-2.1-security`)
- **Resolution:** Created PostgreSQL `BEFORE UPDATE` trigger function `guard_profile_columns()` with `SECURITY DEFINER` and `search_path = ''`. Rejects unauthorized attempts to modify `role` unless caller is administrator; strictly preserves database counter values (`followers_count`, `following_count`, `experiences_count`) against client-side manipulation. Verified with regression tests in `apps/web/tests/security.test.ts`.

