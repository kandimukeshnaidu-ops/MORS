# MORS — Architectural & Product Decisions Log

This file records product and architectural decisions per `docs/IMPLEMENTATION_PLAN.md` Section 9.

| # | Decision | Selected Choice | Rationale |
|---|---|---|---|
| **1** | Place data source | User-created + city text | No paid Google Places API dependence during beta; avoids OSM licensing/storage quirks. Users create unlisted places by default. |
| **2** | Minimum age & DPDP Act compliance | 18+ confirmation boolean (no DOB stored) | Satisfies India DPDP requirements for minors without storing sensitive child date-of-birth data. |
| **3** | Account deletion grace period | 14 days, then hard delete | Standard user recovery window; immediately hides content from public pool and search during grace period. |
| **4** | Beta access model | Invite codes | Predictable onboarding cohort (~50-100 users) in Hyderabad without open sign-up spam. |
| **5** | Rate-limit backend | DB-only (`rate_limit_events` table) | Avoids external Upstash/Redis infra cost/complexity for closed beta scale; sliding-window RPC. |
| **6** | Auth email provider | Resend (custom domain) | High deliverability, straightforward Next.js API integration. |
| **7** | Reviews table structure | Omitted | Experiences already possess overall descriptions and individual dish notes; no separate redundant `reviews` table needed. |
| **8** | Profile avatars/covers visibility | Public for all accounts | Clean profile card header display; private profiles lock only entries, diaries, and collections. |
| **9** | Beta moderation rota | Founder, response < 24 h | Single-operator moderation for closed beta via `/admin` queue. |
| **10** | Anonymous browsing of public entries | Allowed for public pool, `noindex` | Allows sharing direct links while preventing SEO indexing before Phase 21. |
| **11** | Explore tab visibility in MVP | Hidden from main navigation until Phase 17 | Core MVP focuses on personal food logging and chronological social graph; no dead/unbacked tabs. |
| **12** | Follow request state when account turns public | Auto-accept pending requests | Seamless transition without orphan pending requests. |
| **13** | Monetisation model | None until retention proven; never ads | Focus on sticky retention and taste archival; no ad distortion of recommendations. |
| **14** | AI vendor & data privacy terms | Defer; Phase 28 requires zero training on user data | Guarantee strict user privacy before introducing AI logging assistance. |
| **15** | Post-English Languages | Telugu and Hindi first | Core audience is Hyderabad, expanding across India. Native script and transliteration support. |
| **16** | Creator verification policy | No badge; "Creator" label by objective criteria | Prevents arbitrary status signaling; highlights genuine active cooks. |
| **17** | Image transform provider | Supabase transforms if within budget, else Cloudflare | Client dual-variant generation minimizes transform overhead. |
| **18** | Native Expo app vs improved PWA first | PWA first; native if review shows mobile logging friction in top 3 | Fast iteration in closed beta; native app built when feedback justifies. |
| **19** | Email provider for digests | Resend with SPF/DKIM/DMARC | High deliverability, one-click unsubscribe support. |
| **20** | Map tiles & geocoding provider | Commercial or self-hosted tiles with MapLibre | Compliance with public OSM tile and Nominatim usage limits. |
| **21** | Viewer stats privacy | Public-pool stats only | Simpler, mathematically provable safety against follower de-anonymization. |
| **22** | Food Year recap launch timing | Decided by data volume at year end | Ensures meaningful retrospectives with sufficient logged occasions. |

---

## Tooling & Dependency Versions (Verified)
- **Framework:** Next.js `16.4.5` (App Router, Turbopack)
- **Styling:** Tailwind CSS `^4.0.0`
- **Testing:** Vitest `5.1.0`, Playwright `1.58.2`, `@axe-core/playwright`
- **Monorepo:** Turborepo `2.11.10`, pnpm `10.x`
- **Database:** Supabase Postgres, Auth, Storage, Realtime
