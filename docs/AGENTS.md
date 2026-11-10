# MORS — Agent Rules (v3)

Keep this file short. Detail lives in `docs/IMPLEMENTATION_PLAN.md` (spec) and `docs/PHASES.md` (phase tasks). If anything here contradicts those, STOP and ask.

## Product
MORS is a social food journal: a personal, searchable archive of someone's whole food life plus a community around taste. It is NOT a delivery app, booking platform, calorie tracker, or restaurant-review site.
Central object: FOOD EXPERIENCE (one eating occasion) containing 1+ dishes. Place is always optional. Home-cooked food is first-class.
Every feature must serve one of: (1) effortless logging, (2) meaningful personal history, (3) genuine social discovery.
Journey: Eat -> Log -> Rate -> Remember -> Collect -> Share -> Discover.
Beta: closed, ~50-100 users, Hyderabad. Web first, mobile after beta.

## Stack
pnpm + Turborepo monorepo. apps/web (Next.js App Router, TS strict, Tailwind), apps/mobile (Expo, Phase 15 only), packages/domain (Zod schemas, constants, rating helpers), packages/tokens (design tokens JSON -> CSS vars), packages/db (generated Supabase types), supabase/ (migrations, seed, pgTAP). Supabase (Postgres, Auth, Storage, Realtime, Edge Functions), Vercel, PostHog, Sentry.
Before using any Next.js, Supabase SSR, Tailwind or Expo API, read the CURRENT official docs for the installed version. Never rely on memory for them.

## Non-negotiables (security and privacy)
1. Authorization lives in Postgres RLS + SECURITY DEFINER helpers. Hiding things in the UI is never security.
2. Every new `public` table ships in the SAME migration with RLS enabled, explicit policies, indexes for policy columns, and pgTAP tests. No exceptions.
3. Private, followers-only and draft entries never leak via: feeds, search, counts, aggregates, stats, notifications, storage URLs, OG images, sitemaps, collections, realtime, logs, or error messages.
4. Effective visibility = MOST RESTRICTIVE of (profile privacy, entry visibility). Public entry on a private profile = followers-only.
5. Blocks (either direction) hide content and prevent follow/like/comment both ways.
6. Hidden and nonexistent look identical: return "not found", never "forbidden".
7. Service-role key is server-only, never in client code, NEXT_PUBLIC_*, or mobile. Service-role use is limited to Edge Functions and one audited server module; photo signing does NOT need it (storage policy calls can_view_experience).
8. Views use `security_invoker = true`. SECURITY DEFINER functions set `search_path = ''` and schema-qualify everything. Use `(select auth.uid())` in policies.
9. Ratings are smallint half-stars 1..10 (UI 0.5..5.0). A user's own rating and community aggregate are different things.
10. "Public pool" = published AND visibility public AND owner profile public AND owner discoverable AND owner not pending deletion. Community aggregates, global search, dish/place public lists and Explore use ONLY the public pool. Aggregates are trigger-maintained tables, never viewer-dependent views.
11. Dishes/places are reference data but start UNLISTED (visible only to creator) until used by a public-pool entry or curated. `created_by` is never exposed to clients.
12. Strip EXIF/GPS from photos. No precise location or real-time eating activity without explicit consent.
13. Statistics and recommendations come from real user data only. No invented taste claims, no personality inference.
14. Do not build P1/P2 features early. No new dependency without a stated reason in the plan.

## No fake functionality
- Never render a control that does nothing. If a feature belongs to a later phase, do not render its UI at all (exception list: `scripts/allowed-placeholders.json`, reviewed by the owner).
- No mock data in app code. Seed data lives only in `supabase/seed`.
- Every phase adds rows to `docs/FEATURE_REGISTRY.md` (element, action, expected outcome, data effect, test id). Every row needs a passing test.
- CI runs `pnpm check:nofake`, `pnpm check:rls`, `pnpm check:secrets`. Do not edit these scripts to make them pass.

## Conventions
- TypeScript strict, no `any`, no `console.log` in app code. Validate ALL external input with Zod from packages/domain (shared web + mobile).
- Server Components by default. Mutations: Server Actions or Postgres RPC. Multi-table writes go through ONE transactional RPC. Idempotency via `client_request_id`.
- Keyset pagination only (never OFFSET) for feeds, diaries, notifications.
- Migrations: `supabase migration new <name>`; never edit an applied migration; never run reset/push against remote; regenerate types with `pnpm db:types`. Any migration adding a FK to dishes/places must update the merge functions and their tests.
- Photos: private bucket, client-side compress to 2 variants (display 1280px, thumb 400px, JPEG ~0.82), EXIF stripped, orientation applied, max 10 photos/entry. Deleting rows does NOT delete storage files; delete through the Storage API and keep the reconcile job working.
- Design: dark charcoal, warm off-white text, muted olive accent, serif display + clean sans body, large food photography, 1px subtle borders, restrained motion (respect prefers-reduced-motion). No heavy gradients, glassmorphism, dashboard-card clutter, delivery-app styling. All colors/fonts/spacing from tokens only; never hard-code.
- Every screen ships with loading (skeleton), empty, error and success states. Mobile-first layouts at 360, 768, 1280 px; tablet is designed, not stretched.
- Accessibility: WCAG AA contrast, keyboard operable (rating, reorder, dialogs), visible focus, alt text support, use Radix/React Aria primitives for dialogs, popovers, menus (do not hand-roll focus traps).
- Analytics: PostHog events carry no free text (no titles, descriptions, comments, search queries). Consent-gated.
- Git: trunk-based, branch `phase-NN/<slug>`, conventional commits, no secrets, keep `.env.example` current.

## Workflow
- Use Planning mode. First produce an Implementation Plan artifact (files, migrations, components, tests, new dependencies with reasons) and WAIT for approval.
- Read IMPLEMENTATION_PLAN.md sections 5-8 and the current phase in PHASES.md. Implement ONLY that phase and stop at its end.
- If anything is ambiguous or conflicts with the plan, ask. Do not invent product decisions. Record decisions in `docs/DECISIONS.md`.
- Never run two agents on migrations at once.
- A phase is done only when: `pnpm typecheck && pnpm lint && pnpm test`, `supabase test db`, `pnpm check:*`, the phase's Playwright journeys, axe, and 360/768/1280 visual checks all pass, FEATURE_REGISTRY rows are green, and the Walkthrough artifact ticks every acceptance criterion with evidence (test names, screenshots) and lists anything not done.
