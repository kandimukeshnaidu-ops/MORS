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
| **23 (D0-01)** | Product positioning update (MORS 2.0) | Social food journal + restaurant & dish discovery | Preserves food journal and home-cooked first-class status while enabling trustworthy restaurant/dish discovery in Hyderabad. |
| **24 (D0-02)** | Restaurant review storage location | Direct columns on `public.food_experiences` | Avoids redundant join/table overhead; reuses atomic `can_view_experience` RLS and lifecycle. Columns are strictly NULL when `place_id IS NULL`. |
| **25 (D0-03)** | Universal rating scale standard | `smallint 1..10` (UI `0.5..5.0` half-stars) | Prevents scale conversion bugs; uniformly applies to overall meal, 5 restaurant dimensions, and 3 dish sub-dimensions. |
| **26 (D0-04)** | Restaurant overall rating derivation | Average of rated dimensions or explicit | Supports quick log and detailed 5-dimension reviews backwards-compatibly. |
| **27 (D0-05)** | Dish sub-ratings & metadata | Columns on `public.experience_dishes` | Adds `taste_rating`, `portion_rating`, `value_rating`, `price_amount`, `dietary_tag`, `spice_level`. |
| **28 (D0-06)** | Brand vs branch hierarchy | Physical branches distinct in `public.places` | Physical outlets have distinct `area_name` and stats, linked to brand parent via `parent_place_id`. |
| **29 (D0-07)** | Minimum consensus threshold | `>= 3` distinct public-pool reviewers | Protects cook and small-business privacy; prevents single-user skew. Shows "Early consensus" badge for dish-at-place when `< 3`. |
| **30 (D0-08)** | Discovery navigation architecture | Unified `Find` hub with dual intent | Dual tabs: `Find Food (Dishes)` and `Find Restaurants (Places)`, preserving `/explore` for editorial & tastemakers. |
| **31 (D0-09)** | Restaurant place URLs | Dual UUID and slug resolution | Supports SEO slugs (`/place/shah-ghouse-tolichowki`) without breaking existing UUID links. |
| **32 (D0-10)** | Unlisted dishes & places RLS | Creator-only read via RLS | `is_listed = true OR created_by = auth.uid() OR is_admin` enforced in Postgres RLS and all search RPCs. |
| **33 (D0-11)** | Per-user repeat visit weighting | Per-user mean in public consensus | Neutralizes single-user spam/brigading while preserving total visit counts. |
| **34 (D0-12)** | Geographic focus for launch | Hyderabad beta anchor + neighborhood pills | Anchors beta on Hyderabad culinary culture while preserving multi-city schema foundation. |

---

## Tooling & Dependency Versions (Verified)
- **Framework:** Next.js `16.4.5` (App Router, Turbopack)
- **Styling:** Tailwind CSS `^4.0.0`
- **Testing:** Vitest `5.1.0`, Playwright `1.58.2`, `@axe-core/playwright`
- **Monorepo:** Turborepo `2.11.10`, pnpm `10.x`
- **Database:** Supabase Postgres, Auth, Storage, Realtime
