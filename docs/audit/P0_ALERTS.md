# MORS P0 Security & Integrity Alerts

**Milestone:** M1 Reality Audit  
**Status:** Under Active Tracking

---

### SEC-001 — Unrestricted Column-Level Update on `public.profiles`
- **Severity:** P0
- **Area:** SEC
- **Files/Objects Involved:** `supabase/migrations/20261110000001_initial_schema.sql`, policy `"Users can update own profile"` on `public.profiles`.
- **Description:** PostgreSQL Row Level Security (RLS) restricts access at the row level, not column level. The current policy allows authenticated users to execute `UPDATE public.profiles SET role = 'admin'` or modify internal counters (`followers_count`, `experiences_count`) directly via the Supabase client API because no `BEFORE UPDATE` trigger or `REVOKE UPDATE (role, ...)` column restriction is applied.
- **Proposed Fix (Milestone 2 WP-2.1):** Add a `BEFORE UPDATE` trigger `guard_profile_columns()` in a new migration that raises an exception if `NEW.role <> OLD.role` (unless executing under admin context) or if counters / `deletion_requested_at` are directly modified by client queries.
- **Effort:** S
