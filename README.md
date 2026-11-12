# MORS — Social Food Journal & Discovery Platform

> A personal, searchable archive of someone's whole food life plus a community-powered restaurant and dish discovery platform for authentic taste.

MORS is **not** a delivery app, booking platform, or calorie tracker. It is built around a single central object: the **FOOD EXPERIENCE** (one eating occasion) containing 1+ dishes. Place context is always optional, making home-cooked food a first-class citizen alongside dining out.

**Beta Target:** Closed beta (~50–100 users), anchored on **Hyderabad, India**.

---

## 1. Product Journey & Core Principles

Every feature in MORS serves one of three pillars:
1. **Effortless Logging:** Capture meals in under 20 seconds (photo, dish name, rating) with progressive disclosure for deep memories, multi-dish feasts, and restaurant reviews.
2. **Meaningful Personal History:** A private, searchable culinary archive with calendar views, taste identity metrics, and annual Food Year recaps.
3. **Genuine Social Discovery:** Community-powered consensus answering two core questions:
   - *Where should I eat?* (Find Restaurants: multi-dimensional ratings across Food Quality, Value, Ambience, Service, Hygiene)
   - *What should I order there?* (Find Food: canonical dish ratings and ranked restaurant comparisons)

**The Central Invariant:**
> A restaurant rating and a dish rating are different facts. Never infer one from the other, and never mix them into the same aggregate.

---

## 2. Monorepo Architecture

```
MORS/
├── apps/
│   ├── web/               # Next.js 15 App Router (TypeScript strict, Tailwind CSS)
│   └── mobile/            # Expo / React Native (Phase 15 mobile rollout)
├── packages/
│   ├── domain/            # Zod validation schemas, rating calculations, domain constants
│   ├── db/                # Generated Supabase PostgreSQL TypeScript definitions
│   └── tokens/            # Design tokens JSON & compiled CSS variables
├── supabase/
│   ├── migrations/        # Sequential idempotent SQL migrations
│   ├── seed.sql           # Hyderabad reference data, canonical dishes & places
│   └── tests/             # pgTAP automated database test suite
├── docs/                  # Architecture specs, phase playbooks, audit reports
└── scripts/               # Windows & cross-platform dev/verification scripts
```

---

## 3. Technology Stack

- **Frontend:** Next.js `15.1.0` (App Router, React 19, Server Components by default).
- **Backend & Database:** Supabase (PostgreSQL 15, Auth, Storage, Realtime).
- **Styling & Tokens:** Custom design system tokens (`packages/tokens`) rendered as CSS variables (dark charcoal palette, warm off-white typography, muted olive accents).
- **Data Validation:** Zod (`packages/domain`) shared strictly across web and future mobile.
- **Testing:** Vitest (unit & integration), Playwright (end-to-end browser journeys), pgTAP (in-database RLS & trigger testing).
- **Package Manager:** `pnpm` workspaces managed with `Turborepo`.

---

## 4. Local Development Quickstart

### Prerequisites
- Node.js `20.x` or later
- `pnpm` (`npm install -g pnpm`)
- Docker Desktop running locally (for Supabase CLI)

### Installation & Startup
```powershell
# 1. Install dependencies across all monorepo packages
pnpm install

# 2. Start local Supabase Docker stack (Kong: 54321, Postgres: 54322)
npx supabase start

# 3. Apply migrations, seed data, and generate types
pnpm db:types

# 4. Start Next.js web development server
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Windows Desktop Launcher
A one-click Windows shortcut is available at `scripts/launch-mors.bat` (which boots local Supabase and launches the web app). To cleanly shut down local services, run `scripts/stop-mors.bat`.

---

## 5. Verification & Quality Gates

Run these commands before any commit or phase transition:
```powershell
# Type checking across all 4 monorepo packages
pnpm typecheck

# Unit and integration test suite
pnpm test

# Verify zero fake UI controls or non-functional placeholders
pnpm check:nofake

# Verify Row-Level Security (RLS) is enabled with explicit policies on all public tables
pnpm check:rls

# Verify zero hardcoded secrets or sensitive environment leaks
pnpm check:secrets

# Production Next.js build
pnpm build
```

---

## 6. Security, Privacy & Integrity Non-Negotiables

1. **Postgres RLS is Truth:** Authorization lives in PostgreSQL RLS policies and `SECURITY DEFINER` helpers. Hiding UI elements is never security.
2. **Public-Pool Isolation:** Only published, public entries by discoverable, non-private accounts not pending deletion contribute to community rankings and public search.
3. **Unlisted Reference Data:** Newly created dishes and places start unlisted (`is_listed = false`) and are readable **only** by their creator or admins until curated or used in a public-pool entry.
4. **Photo Privacy:** Camera EXIF/GPS metadata is stripped on the client prior to upload. Photos are stored in private buckets and signed on-demand via access-controlled storage policies.
5. **No Synthetic Taste:** Recommendations and statistics are calculated purely from real user eating logs. No fake or imputed data is ever generated.
