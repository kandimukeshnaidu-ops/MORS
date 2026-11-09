# MORS — Agent Rules

## Product
MORS is a social food journal: a personal, searchable archive of a person's whole food life plus a community around taste. It is NOT a delivery app, booking platform, calorie tracker, or restaurant-review site.
Central object: a FOOD EXPERIENCE (one eating occasion) containing 1+ dishes. Restaurant/place is always optional. Home-cooked meals are first-class.
Three principles; every feature must serve at least one:
1. Effortless logging (no forced review, no forced place)
2. Meaningful personal history (diary is searchable, chronological, enjoyable to revisit)
3. Genuine social discovery (through people you follow; chronological feed first)
Journey: Eat -> Log -> Rate -> Remember -> Collect -> Share -> Discover.

## Stack
Monorepo (pnpm + Turborepo): apps/web (Next.js App Router, TypeScript strict, Tailwind), apps/mobile (Expo, added in Phase 13), packages/domain (Zod schemas, constants, rating helpers), packages/db (generated Supabase types), supabase/ (migrations, seed, pgTAP tests). Backend: Supabase (Postgres, Auth, Storage, Realtime, Edge Functions). Hosting: Vercel. Analytics: PostHog. Errors: Sentry.
Always check current official docs for installed versions before using an API; do not rely on memory for Next.js, Supabase SSR, or Expo specifics.

## Non-negotiables
1. Authorization lives in Postgres RLS and SECURITY DEFINER helper functions. Hiding things in the UI is never security.
2. Every new table in `public` ships in the SAME migration with: RLS enabled, explicit policies, indexes for columns used in policies, and pgTAP tests. No table without RLS, ever.
3. Private, followers-only and draft entries must never leak through: feeds, search, counts, community ratings, stats, notifications, storage URLs, OG images, sitemaps, collections, or error messages.
4. Effective visibility = the MOST RESTRICTIVE of (profile privacy, entry visibility). A public entry on a private profile is followers-only.
5. Blocked users (either direction) cannot see each other's content, follow, like, or comment.
6. Service-role key is server-only. Never in client bundles, NEXT_PUBLIC_* vars, or the mobile app.
7. Views use `security_invoker = true`. SECURITY DEFINER functions set `search_path = ''` and are schema-qualified.
8. Ratings are stored as smallint half-stars 1..10 (UI shows 0.5..5.0). A user's own rating and a dish's community aggregate are different things and never mixed.
9. Community aggregates count only published entries that are publicly visible to everyone.
10. Strip EXIF/GPS from uploaded photos. No precise location or real-time eating activity without explicit consent.
11. Statistics come from real user data only. No invented taste claims or personality inferences.
12. Do not build P1/P2 features early. Do not add dependencies without stating why in the plan.

## Conventions
- TypeScript strict, no `any`. Validate all external input with Zod from packages/domain (shared by web and mobile).
- Server Components by default. Mutations via Server Actions or Postgres RPC; multi-table writes (experience + dishes + photos) go through one transactional RPC.
- Keyset (cursor) pagination only; never OFFSET on feeds or diaries.
- Migrations: `supabase migration new <name>`; never edit an applied migration; never run reset/push against remote. Regenerate types with `pnpm db:types`.
- Photos: private bucket + short-lived signed URLs; client compression (max 2048px longest edge, JPEG/WebP ~0.8) before upload; size/MIME limits in bucket config.
- Design: dark charcoal background, warm off-white text, muted olive accent, serif display + clean sans body, large food photography, subtle borders, restrained motion (respect prefers-reduced-motion). No heavy gradients, glassmorphism, dashboard-card clutter, or food-delivery visual style. All colors/fonts come from design tokens, never hard-coded.
- Accessibility: WCAG AA contrast, keyboard operable (including rating and reorder), visible focus, alt text on photos.
- Git: trunk-based, branch `phase-NN/<slug>`, conventional commits, never commit secrets; keep `.env.example` current.

## Workflow
- Use Planning mode. Produce an Implementation Plan artifact first and wait for approval.
- Read `docs/IMPLEMENTATION_PLAN.md` Sections 3-4 and the current phase before coding. Implement ONLY the current phase. Stop at its end.
- If something is ambiguous or contradicts the plan, ask instead of inventing.
- Finish every phase with: `pnpm typecheck && pnpm lint && pnpm test`, `supabase test db`, the RLS audit script, Playwright journeys for that phase, a 360px/768px/1280px visual check, and a Walkthrough artifact that ticks each acceptance criterion with evidence.
