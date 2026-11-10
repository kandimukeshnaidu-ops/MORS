# MORS — Runbook: Secret and Key Rotation

## 1. Principles
- Zero downtime: always support overlapping active credentials where supported.
- Service-role key is strictly server-only (`apps/web` server actions and Edge Functions).
- Never commit secrets to git.

## 2. Supabase API Key Rotation Procedure
1. Generate new API keys in the Supabase Dashboard (Settings -> API).
2. Update Vercel production environment variables:
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Trigger instant redeployment in Vercel to pick up new environment variables.
4. Verify smoke tests:
   - User authentication (`/auth/login`)
   - Quick log publish (`create_experience`)
   - Feed read under RLS
5. Revoke previous keys in Supabase Dashboard.
6. Verify no stale requests fail in logs.
