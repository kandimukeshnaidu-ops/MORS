# MORS — Production Deployment Guide for Vercel

This guide outlines the production deployment of the MORS social food journal on **Vercel** with a remote **Supabase** backend.

---

## 1. Remote Supabase Setup (Free Tier)
Because Vercel runs on cloud edge servers, it cannot reach your local laptop's Docker instance (`127.0.0.1:54321`).

1. Log in to [Supabase](https://supabase.com) and click **New project**.
2. Name your project (e.g. `mors-production`), set a strong database password, and select your region (e.g. `South Asia (Mumbai)` for Hyderabad proximity).
3. In your project dashboard, navigate to **SQL Editor**:
   - Open [`supabase/combined_migrations.sql`](file:///C:/Users/mukes/OneDrive/Desktop/MORS/supabase/combined_migrations.sql) from this repository.
   - Paste the contents into the SQL Editor and click **Run** (applies all 33 migrations and RLS policies).
   - *(Optional)* In the SQL Editor, run [`supabase/audit_fixtures.sql`](file:///C:/Users/mukes/OneDrive/Desktop/MORS/supabase/audit_fixtures.sql) if you want the initial Hyderabad seed data and test personas.
4. Navigate to **Project Settings -> API** and copy:
   - **Project URL**: `https://<your-project-id>.supabase.co`
   - **anon / public key**: `eyJhbGciOi...`
   - **service_role key**: `eyJhbGciOi...` (keep secret!)

---

## 2. Deploying to Vercel

### Option A: Via GitHub Integration (Recommended — 1-Click)
1. Go to [vercel.com/new](https://vercel.com/new).
2. Connect your GitHub account and locate the **`kandimukeshnaidu-ops/MORS`** repository.
3. Click **Import**.
4. In the **Configure Project** screen:
   - **Framework Preset**: Next.js (automatically detected)
   - **Root Directory**: Leave as `./` (automatically handled by `vercel.json` and Turborepo)
5. Expand **Environment Variables** and add the following 5 variables:

| Variable | Value | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SITE_URL` | `https://<your-project-name>.vercel.app` | Canonical site URL |
| `APP_ENV` | `production` | Environment flag |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<your-project-id>.supabase.co` | Remote Supabase API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `<your-supabase-anon-key>` | Public Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | `<your-supabase-service-role-key>` | Server-side Service Role Key |

6. Click **Deploy**. Vercel will install dependencies, run Turborepo build, and deploy MORS live to a global HTTPS URL!

---

### Option B: Via Vercel CLI (From your terminal)
1. Open PowerShell and run:
   ```powershell
   npx vercel login
   ```
2. Follow the browser prompt to log into your Vercel account.
3. Link and deploy the project:
   ```powershell
   npx vercel --prod
   ```
4. Set the environment variables in your Vercel project dashboard or via CLI:
   ```powershell
   npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
   npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
   npx vercel env add SUPABASE_SERVICE_ROLE_KEY production
   npx vercel env add NEXT_PUBLIC_SITE_URL production
   npx vercel env add APP_ENV production
   ```

---

## 3. Post-Deployment Verification Checklist
- [ ] Visit `https://<your-app>.vercel.app` (home page renders dark charcoal UI).
- [ ] Navigate to `/auth/register`:
  - Enter beta code `HYDERABAD-BETA-2026`.
  - Enter test email and password.
  - Verify account creation completes and redirects to `/onboarding`.
- [ ] Test login at `/auth/login`.
- [ ] Log a food experience at `/e/new` and verify it persists after page refresh.
