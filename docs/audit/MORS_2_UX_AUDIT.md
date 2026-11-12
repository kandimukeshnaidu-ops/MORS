# MORS 2.0 — UX, Navigation & Discovery Flow Audit

- **Audit Phase:** Phase 0 — Product Specification & Repository Reality Audit
- **Git Commit SHA:** `dd12d32ecf7c3ce51a3853bc54e89642f949c47e`
- **Timestamp:** `2026-11-12T00:19:00+05:30`
- **Evidence Links:**
  - [EV-001: Repository & Test Baseline](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/evidence/phase-0/EV-001-repo-and-test-baseline.md)
  - [EV-003: Rating, Search & Privacy Trace](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/evidence/phase-0/EV-003-rating-search-and-privacy-trace.md)

---

## 1. Complete Current Route Map (`apps/web/src/app`)

Every route below was verified against the 26 compiled Next.js App Router pages ([EV-001](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/evidence/phase-0/EV-001-repo-and-test-baseline.md), [EV-003](file:///c:/Users/mukes/OneDrive/Desktop/MORS/docs/evidence/phase-0/EV-003-rating-search-and-privacy-trace.md)).

| Route Path | File Location | Current Purpose | Auth / Access Model | Status vs. MORS 2.0 |
|---|---|---|---|---|
| `/` | [page.tsx](file:///c:/Users/mukes/OneDrive/Desktop/MORS/apps/web/src/app/page.tsx) | Chronological social home feed + quick-log trigger + taste recommendations | Public landing / Authenticated feed | `PARTIALLY IMPLEMENTED` (Needs clearer Find Food / Find Restaurants entry points) |
| `/diary` | [diary/page.tsx](file:///c:/Users/mukes/OneDrive/Desktop/MORS/apps/web/src/app/diary/page.tsx) | Personal food archive with calendar, filters, drafts, and keyset pagination | Authenticated owner only | `VERIFIED COMPLETE` |
| `/search` | [search/page.tsx](file:///c:/Users/mukes/OneDrive/Desktop/MORS/apps/web/src/app/search/page.tsx) | Unified trigram search across Dishes, Places, People, Experiences, Collections | Public & Authenticated (RLS-scoped) | `PARTIALLY IMPLEMENTED` (Flat keyword search; lacks dual-intent Find Food vs Find Restaurants filters/sorting) |
| `/explore` | [explore/page.tsx](file:///c:/Users/mukes/OneDrive/Desktop/MORS/apps/web/src/app/explore/page.tsx) | Trending experiences, spotlight collections, suggested tastemakers | Public & Authenticated (public pool) | `PARTIALLY IMPLEMENTED` (Lacks top-rated dishes, top-rated restaurants, and neighborhood discovery) |
| `/dish/[slug]` | [dish/\[slug\]/page.tsx](file:///c:/Users/mukes/OneDrive/Desktop/MORS/apps/web/src/app/dish/%5Bslug%5D/page.tsx) | Canonical dish page: Community consensus (`>=3` ratings), personal taste card, recent public logs | Public & Authenticated | `PARTIALLY IMPLEMENTED` (Lacks "Where to Eat This Dish" restaurant comparison ranking & sub-ratings) |
| `/place/[id]` | [place/\[id\]/page.tsx](file:///c:/Users/mukes/OneDrive/Desktop/MORS/apps/web/src/app/place/%5Bid%5D/page.tsx) | Dining venue page: Community rating, personal visit history, branches, recent public logs | Public & Authenticated | `PARTIALLY IMPLEMENTED` (Uses `overall_rating` instead of 5-dimension restaurant review; lacks "Best Dishes Here" menu ranking) |
| `/map` | [map/page.tsx](file:///c:/Users/mukes/OneDrive/Desktop/MORS/apps/web/src/app/map/page.tsx) | Hyderabad venue spatial directory (`get_map_pins`) | Public & Authenticated | `PARTIALLY IMPLEMENTED` (Static placeholder box + accessible venue list; not linked in main sidebar) |
| `/city/[slug]` | [city/\[slug\]/page.tsx](file:///c:/Users/mukes/OneDrive/Desktop/MORS/apps/web/src/app/city/%5Bslug%5D/page.tsx) | Regional city guide (`/city/hyderabad`, `/city/bengaluru`, etc.) | Public & Authenticated | `PARTIALLY IMPLEMENTED` (Lists up to 10 places without ratings, area filters, or iconic city dishes) |
| `/e/[id]` | [e/\[id\]/page.tsx](file:///c:/Users/mukes/OneDrive/Desktop/MORS/apps/web/src/app/e/%5Bid%5D/page.tsx) | Single food experience detail view, dishes list, photos, likes, comments | Scoped by `can_view_experience` (404 if hidden) | `PARTIALLY IMPLEMENTED` (Displays single overall rating + per-dish ratings; lacks restaurant 5-dimension review card) |
| `/collections` & `/c/[id]` | [collections/page.tsx](file:///c:/Users/mukes/OneDrive/Desktop/MORS/apps/web/src/app/collections/page.tsx) | Personal & collaborative collections + group dining plans (Phase 30) | Owner / Collaborator / Public (`can_view_collection`) | `VERIFIED COMPLETE` |
| `/u/[username]` & `/u/[username]/food-year` | [u/\[username\]/page.tsx](file:///c:/Users/mukes/OneDrive/Desktop/MORS/apps/web/src/app/u/%5Busername%5D/page.tsx) | User profile, `TasteStatsCard`, follow/block controls, annual Food Year recap | Scoped by profile privacy & blocks | `VERIFIED COMPLETE` |
| `/notifications` | [notifications/page.tsx](file:///c:/Users/mukes/OneDrive/Desktop/MORS/apps/web/src/app/notifications/page.tsx) | Activity notifications feed | Authenticated recipient only | `VERIFIED COMPLETE` |
| `/creator` | [creator/page.tsx](file:///c:/Users/mukes/OneDrive/Desktop/MORS/apps/web/src/app/creator/page.tsx) | Creator analytics & audience resonance | Authenticated owner only | `VERIFIED COMPLETE` |
| `/settings` & `/settings/import` | [settings/page.tsx](file:///c:/Users/mukes/OneDrive/Desktop/MORS/apps/web/src/app/settings/page.tsx) | Privacy, locale, AI assist opt-in, data export/import, account deletion | Authenticated owner only | `VERIFIED COMPLETE` |
| `/admin` | [admin/page.tsx](file:///c:/Users/mukes/OneDrive/Desktop/MORS/apps/web/src/app/admin/page.tsx) | Moderation queue, canonical dish/place merge tools, invite codes | Admin only (`profiles.is_admin = true`) | `PARTIALLY IMPLEMENTED` (Needs review-manipulation moderation queues in Phase 6) |
| `/auth/*`, `/onboarding`, `/status`, `/changelog`, `/privacy`, `/terms`, `/community-guidelines` | Various under `src/app/` | Authentication, onboarding, operational status, and legal/community docs | Public / Auth | `VERIFIED COMPLETE` |

---

## 2. Current Navigation vs. Proposed MORS 2.0 Navigation

### 2.1 Current Navigation ([apps/web/src/components/shell/AppShell.tsx](file:///c:/Users/mukes/OneDrive/Desktop/MORS/apps/web/src/components/shell/AppShell.tsx))
- **Desktop Sidebar (7 items + CTA):**
  `Home` (`/`) · `Diary` (`/diary`) · `Search` (`/search`) · `Explore` (`/explore`) · `Collections` (`/collections`) · `Notifications` (`/notifications`) · `Profile` (`/profile`) + `[+ Log Experience]`.
- **Mobile Bottom Navigation (5 items):**
  `Home` (`/`) · `Explore` (`/explore`) · `[+]` (Log Modal) · `Saved` (`/collections`) · `Profile` (`/profile`), plus a small `🔍` icon in the top mobile header linking to `/search`.
- **UX Friction Points Identified:**
  1. **Split Discovery Mental Model:** Users have both `Search` (`/search`) and `Explore` (`/explore`) in the desktop sidebar, plus hidden `/map` and `/city/[slug]` pages that are not in the primary navigation at all.
  2. **Mobile Diary & Find Discrepancy:** On mobile (`<= 768px`), `Diary` and `Notifications` are missing from the bottom bar, and `Search` uses a raw emoji (`🔍`) in the top header (which violates `GEMINI.md` Section 9: *"no emoji used as icons"*).
  3. **Right Sidebar Static Boilerplate:** `AppShell.tsx` lines 186–210 render a static "Taste Discovery" card explaining *"Central Object: Food Experience / Home-Cooked: First-Class / Feed Algorithm: Chronological"* on every page instead of contextual discovery shortcuts (e.g., city switcher, top Hyderabad dishes, or quick filters).

### 2.2 Proposed MORS 2.0 Navigation Architecture
- **Unify Discovery Around Intentional Modes:**
  - Introduce a dedicated **Find** experience (`/find` or upgraded `/search` + `/explore` tabs) with two first-class tabs:
    1. **Find Food (Dish-First Discovery):** Search or browse dishes (e.g., *Mutton Biryani*, *Haleem*, *Masala Dosa*, *Apricot Delight*) -> compare the best restaurants serving that dish in the selected city/neighborhood.
    2. **Find Restaurants (Place-First Discovery):** Search or filter restaurants by neighborhood/area, cuisine, price tier (`₹`–`₹₹₹₹`), dietary support (Pure Veg, Halal, etc.), dining style, and specific dimension scores (Best Food Quality, Best Value, Best Ambience, Best Hygiene).
  - **Mobile Bottom Bar (5 items):**
    `Home` (`/`) · `Find` (`/find` or `/search`) · `[+ Log]` · `Diary` (`/diary`) · `Profile` (`/profile`) (with Collections, Explore, and Notifications accessible via top header / profile tabs).

---

## 3. Rating & Review Form UX Audit ([LogModal.tsx](file:///c:/Users/mukes/OneDrive/Desktop/MORS/apps/web/src/components/log/LogModal.tsx))

### 3.1 Current Flow
1. **Quick Log Mode (Default):**
   - Photo upload dropzone (`0..10` photos, client-side compressed, EXIF stripped).
   - Primary Dish Name (`DishCombobox`).
   - Single `RatingStars` input (`0.5..5.0` stars).
   - Toggle button: `+ Add details (place, notes, more dishes, price...)`.
2. **Detailed Mode (`isDetailedOpen = true`):**
   - Experience Title & Meal Category chips (`Dinner`, `Lunch`, `Breakfast`, `Snack`, `Dessert`, `Coffee & Tea`).
   - Place / Restaurant (`PlaceCombobox` — *"leave blank for home-cooked"*).
   - Multi-dish repeater (each dish has `DishCombobox`, `RatingStars`, and single-line `note`).
   - Price (`INR`), Cuisine, Eaten Date & Time, Tags, Memories & Food Notes (`Textarea`), Visibility (`Public`, `Followers only`, `Private`).

### 3.2 UX Defects & MORS 2.0 Redesign Plan (Phase 4)
1. **Decouple Dish Rating from Restaurant & Experience Rating:**
   - Currently, clicking the Quick Log star rating sets both `dishes[0].rating` and `overallRating`.
   - **MORS 2.0 Fix:**
     - **Quick Log (< 20 seconds):** Photo(s) + Primary Dish + **Dish Rating** + optional Place. If a user only logs a dish in Quick Log, `dishes[0].rating` is recorded as the dish rating, and `overall_rating` defaults to `dishes[0].rating` for the meal occasion, **without** fabricating a restaurant review if no place was evaluated.
     - **When a Place/Restaurant is Selected:** Reveal a clean, progressive **"Rate This Restaurant"** section with the 5 MORS 2.0 restaurant dimensions:
       1. **Food Quality** (`0.5..5.0` ★)
       2. **Value for Money** (`0.5..5.0` ★)
       3. **Ambience** (`0.5..5.0` ★ — optional/N/A for street stalls or delivery/takeaway)
       4. **Service** (`0.5..5.0` ★)
       5. **Hygiene** (`0.5..5.0` ★)
       - Plus optional context chips: **Dining Context** (`Dine-in`, `Takeaway`, `Street Stall`) and **Would Return?** (`Yes` / `No`).
     - **Dish Sub-Ratings (Optional Progressive Disclosure per Dish):**
       - Expandable pill on each dish row for `Taste`, `Portion`, `Value`, plus per-dish `Price (₹)` and dietary/spice tags (`Veg`, `Non-Veg`, `Egg`, `Mild`/`Medium`/`Spicy`/`Fiery`).
     - **Home-Cooked First-Class Preservation:**
       - When `place_id` is left blank (home-cooked), restaurant rating dimensions (`Ambience`, `Service`, `Hygiene`, `Value for Money`) are **never shown**, keeping home-cooked logging warm, personal, and clutter-free.

---

## 4. Restaurant Profile (`/place/[id]`) & Dish Profile (`/dish/[slug]`) Hierarchy Audit

### 4.1 Restaurant Profile (`/place/[id]`) — Current vs. MORS 2.0 Target
- **Current Layout ([apps/web/src/app/place/\[id\]/page.tsx](file:///c:/Users/mukes/OneDrive/Desktop/MORS/apps/web/src/app/place/%5Bid%5D/page.tsx)):**
  1. Header: `DINING VENUE` chip, city chip, `SaveToCollectionButton`, Place Name, Address, Parent Place link.
  2. Two-column grid: `Community Ratings` (single overall star average from `overall_rating` + experience count) vs. `Your Personal History` (viewer's latest rating + visit count).
  3. `Other Branches` pill list (if `parent_place_id` matches).
  4. `Public Experiences at <Place>` (up to 10 recent experiences).
- **MORS 2.0 Target Layout (Phase 5):**
  1. **Rich Venue Header:** Name, Neighborhood/Area + City, Cuisine chips, Venue Style badge (`Casual Dining`, `Irani Cafe`, `Street Food`, etc.), Price Tier (`₹₹`), Dietary badge (`Halal`, `Pure Veg`, etc.), Parent Brand & Sibling Branches selector, `Log Meal Here` CTA, `Save` CTA.
  2. **Community Restaurant Scorecard (Public Pool, `>= 3` ratings):**
     - Overall Restaurant Rating (`0.5..5.0` ★) + exact `public_rating_count` & `public_experience_count` + `% Would Return`.
     - **5-Dimension Horizontal Bar Breakdown:** Food Quality, Value for Money, Ambience, Service, Hygiene.
  3. **Personal Visit History Card (Strictly Private to Viewer):**
     - Viewer's own visit count, personal rating average, and quick link to viewer's own diary entries at this place.
  4. **"What to Order Here" — Top-Rated Dishes at This Restaurant (`place_dish_public_stats`):**
     - Ranked dish cards showing how each canonical dish performs *at this specific venue* (dish rating at this place, number of ratings, latest logged price, and link to compare with other restaurants on `/dish/[slug]`).
  5. **Filterable Community Reviews & Food Logs:**
     - Filter by dish eaten or sort by most recent / highest rated.

### 4.2 Canonical Dish Page (`/dish/[slug]`) — Current vs. MORS 2.0 Target
- **Current Layout ([apps/web/src/app/dish/\[slug\]/page.tsx](file:///c:/Users/mukes/OneDrive/Desktop/MORS/apps/web/src/app/dish/%5Bid%5D/page.tsx)):**
  1. Header: `CANONICAL DISH` chip, cuisine chip, `SaveToCollectionButton`, Dish Name, Telugu/Hindi translations, description.
  2. Two-column grid: `Community Consensus` (single overall average + rating count + experience count) vs. `Your Personal Taste` (viewer's latest rating + personal log count).
  3. `Public Community Logs` (up to 10 recent experience logs).
- **MORS 2.0 Target Layout (Phase 5):**
  1. **Dish Hero Header:** Canonical Name, Local Script Badges (`Telugu`, `Hindi`), Cuisine, Dietary/Category badges, Dish Consensus Summary (`Taste`, `Portion`, `Value` sub-averages), and `Log This Dish` CTA.
  2. **"Where to Eat <Dish Name> in <City>" — Ranked Restaurant Comparison Table/Cards (`place_dish_public_stats`):**
     - Ranks restaurants serving this dish by their dish-specific rating (`public_rating_avg` at that place), showing:
       - Rank (`#1`, `#2`, ...)
       - Restaurant Name & Area/Neighborhood
       - Dish Rating at this restaurant (`★ 4.7`) + Dish Rating Count (`14 ratings`)
       - Typical logged Dish Price (`₹320`)
       - Restaurant's Overall Hygiene & Value badges
     - Filters for City, Area, and Price Tier.
  3. **Your Personal Taste Archive for This Dish:**
     - Where *you* had your highest-rated version of this dish (including home-cooked logs!).
  4. **Recent Community Dish Logs & Photos:**
     - Visual grid/list of public-pool logs of this dish (including home-cooked and restaurant versions).

---

## 5. Responsive Layout, States & Design Token Compliance Check

- **Design Tokens:** `packages/tokens` provides dark charcoal surfaces (`--bg-primary`, `--bg-surface`, `--bg-elevated`), warm off-white typography (`--text-primary`, `--text-secondary`, `--text-muted`), and muted olive accents (`--accent-primary`, `--accent-hover`, `--accent-subtle`). Existing components use CSS variables consistently.
- **Iconography Violation to Fix in Phase 3/4:** Replace raw emoji characters (`🔍`, `📍`, `🍲`, `🌍`, `👥`, `🔒`) in `AppShell.tsx`, `SearchClientView.tsx`, `LogModal.tsx`, and `place/[id]/page.tsx` with clean, consistent inline SVG icons per `GEMINI.md` Section 9 (*"no emoji used as icons"*).
- **State Coverage:** Skeletons (`LayoutSkeletons.tsx`), `EmptyState.tsx`, and `RenderingIndicator.tsx` exist and are used on `/`, `/diary`, `/search`, `/explore`, and `/collections`. New `/find` and comparison sections in Phases 3–5 must ship with matching skeleton, empty, error, and low-sample (`< 3` ratings) states.
