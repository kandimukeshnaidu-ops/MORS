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
   - **Root Directory**: Click **Edit** and set to `apps/web` (check the box **"Include source files outside of the Root Directory in the Build Step"**). This is required for Next.js Turborepo monorepos so Vercel locates `.next` correctly.
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

## 3. Troubleshooting Common Deployment Issues

### Issue 1: `Error: [NEXT_OUTPUT_DIR_MISSING] The Next.js output directory was not found`
- **Cause**: Vercel's **Root Directory** was left as `./`. Because MORS is a Turborepo monorepo, Next.js outputs its build artifacts to `apps/web/.next`, but Vercel looked at the repository root.
- **Fix**:
  1. In Vercel, open your project (`mors`).
  2. Navigate to **Settings** -> **General**.
  3. Under **Root Directory**, click **Edit**.
  4. Change from `./` to `apps/web`.
  5. Ensure **"Include source files outside of the Root Directory in the Build Step"** is **checked**.
  6. Click **Save**.
  7. Go to **Deployments** -> click `...` on your latest deployment -> click **Redeploy**.

### Issue 2: `This project already has an existing environment variable with name NEXT_PUBLIC_SUPABASE_URL` in the Supabase Integration modal
- **Cause**: You already manually configured `NEXT_PUBLIC_SUPABASE_URL` under Vercel **Settings** -> **Environment Variables**, so Vercel blocks the Supabase integration modal from overwriting it.
- **Fix**:
  - Simply click **Skip** on the "Install Integration" modal! The Supabase integration is optional. As long as your 5 environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`, `APP_ENV`) are added in **Project Settings -> Environment Variables**, MORS connects seamlessly to Supabase.

---

## 4. Post-Deployment Verification Checklist
- [ ] Visit `https://<your-app>.vercel.app` (home page renders dark charcoal UI).
- [ ] Navigate to `/auth/register`:
  - Enter beta code `HYDERABAD-BETA-2026`.
  - Enter test email and password.
  - Verify account creation completes and redirects to `/onboarding`.
- [ ] Test login at `/auth/login`.
- [ ] Log a food experience at `/e/new` and verify it persists after page refresh.
