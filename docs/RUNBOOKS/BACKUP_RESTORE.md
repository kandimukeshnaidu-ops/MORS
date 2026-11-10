# MORS — Runbook: Point-In-Time Backup and Restore Drill

## 1. Objectives
- Validate Postgres Point-In-Time Recovery (PITR) within 15-minute RPO.
- Ensure recovery can restore complete relational state without data corruption.

## 2. Restore Procedure (Staging Verification)
1. Select recovery target timestamp: `YYYY-MM-DD HH:MI:SS UTC`.
2. Initiate PITR branch/restore in Supabase staging environment.
3. Verify database integrity:
   - Check table row counts: `profiles`, `food_experiences`, `experience_dishes`, `experience_photos`.
   - Run pgTAP tests: `supabase test db`.
   - Execute RLS compliance script: `tsx scripts/check-rls.ts`.
4. Validate photo attachment consistency:
   - Check that all `experience_photos.storage_path` entries correspond to existing objects.
5. Record drill results in `docs/DECISIONS.md`.
