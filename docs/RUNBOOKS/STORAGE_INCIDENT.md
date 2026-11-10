# MORS — Runbook: Storage Incident and Orphan Reconcile

## 1. Problem Description
- Orphan objects accumulating in the private storage bucket due to interrupted client uploads.
- Users nearing 2 GB storage quota without realizing.

## 2. Reconcile Procedure
1. Run Storage reconcile script:
   - Queries `storage_cleanup_queue` table for unconfirmed draft uploads older than 24 hours.
   - Cross-references objects against `experience_photos.storage_path`.
   - Safely removes orphan objects via Supabase Storage API (`remove([path])`).
2. Quota Audit:
   - Query users near quota limit:
     ```sql
     SELECT user_id, quota_bytes, used_bytes, ROUND((used_bytes::numeric / quota_bytes::numeric)*100, 1) AS pct
     FROM public.storage_quotas
     WHERE (used_bytes::numeric / quota_bytes::numeric) >= 0.85;
     ```
   - In-app warning surfaced in Settings and Quick Log when `percentage >= 85.0%`.
