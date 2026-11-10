# MORS — Runbook: Outage Response and Diagnostics

## 1. Severity Levels
- **SEV-1 (Critical):** Core logging or feed unavailable for all users.
- **SEV-2 (Major):** Photo upload failing, auth degraded, or p95 > 2,000ms.
- **SEV-3 (Minor):** Secondary services (Explore cache, email digests) degraded.

## 2. Immediate Diagnostic Checklist
1. **Supabase Health:**
   - Check Supabase status: `supabase status` or remote dashboard.
   - Connection pooler: verify pooler exhaustion on transaction mode (port 6543).
   - Check Postgres CPU/memory and active queries:
     ```sql
     SELECT pid, now() - pg_stat_activity.query_start AS duration, query, state
     FROM pg_stat_activity
     WHERE state != 'idle' AND now() - pg_stat_activity.query_start > interval '5 seconds';
     ```
2. **Vercel / Next.js Edge:**
   - Check error rates in Vercel logs and Sentry dashboard.
   - Verify environment variables present in production.
3. **Storage / Bucket:**
   - Verify Supabase Storage API response time.
   - Inspect `storage_cleanup_queue` backlog size.

## 3. Communication
- Post operational update to `/status`.
- Notify beta users via announcement channel.
- Never leak private data or system internals in status notices.
