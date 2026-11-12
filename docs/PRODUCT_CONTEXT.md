# MORS 2.0 — Product Architecture & Domain Context

- **Version:** MORS 2.0 (Hyderabad Beta)
- **Status:** Foundational Product Specification
- **Primary Domain:** Social Food Journal + Community-Powered Restaurant & Dish Discovery

---

## 1. Product Vision & Mission

MORS is a social food journal: a personal, searchable archive of someone's whole food life plus a community around taste. In MORS 2.0, the platform expands to answer the two most important culinary questions for diners in Hyderabad:

1. **Where should I eat?** — Answered by trustworthy restaurant consensus scorecards across 5 explicit dimensions (Food Quality, Value for Money, Ambience, Service, Hygiene) and regional neighborhood rankings.
2. **What should I order there?** — Answered by canonical dish ratings and ranked restaurant comparisons ("Where to Eat This Dish" and "What to Order Here").

MORS is intentionally distinct from existing platforms:
- **Not a Delivery App:** Zero ordering, cart logistics, driver tracking, or commercial markups.
- **Not a Table Booking Engine:** No reservations or affiliate commissions.
- **Not a Calorie Tracker:** No macronutrients, weight shaming, or numerical diets.
- **Not a Generic Review Site:** No unverified star bomb reviews, paid prominence, or sponsored placements. All ratings originate from actual, logged food experiences.

---

## 2. Central Objects & Entities

### 2.1 Food Experience (The Central Object)
The atomic unit of MORS is the **Food Experience** — a single eating occasion.
- Can be a home-cooked meal (`place_id IS NULL`), street stall snack, casual meal, or multi-course fine dining visit.
- Contains 1 or more dishes with individual notes and optional dish sub-ratings.
- Attaches 0 to 10 photos (client-compressed, EXIF-stripped).
- Has an optional `overall_rating` representing the eating occasion as a whole.
- When `place_id IS NOT NULL`, optionally attaches a structured 5-dimension **Restaurant Review**.

### 2.2 Canonical Dish vs. Dish Appearance
- **Canonical Dish (`public.dishes`):** Reference representation of a dish (e.g. *Hyderabadi Mutton Dum Biryani*, *Irani Chai*, *Khatti Dal*). Carries canonical name, aliases, multi-lingual translations (`en`, `te`, `hi`), cuisine, and global public consensus stats (`dish_public_stats`).
- **Dish Entry (`public.experience_dishes`):** The dish as eaten on a specific occasion. Carries the original user-entered name, reference to canonical dish, dish-level rating (`1..10`), dish sub-ratings (`taste`, `portion`, `value`), optional dish price in INR, dietary tag (`veg`, `egg`, `non_veg`), and spice level (`1..4`).

### 2.3 Restaurant Brand vs. Physical Branch (`public.places`)
- In Hyderabad, restaurant quality varies significantly across branches of iconic brands (*Paradise*, *Shah Ghouse*, *Cafe Niloufer*, *Bawarchi*).
- **Physical Branch:** Each physical outlet is a distinct row in `public.places` with its own `area_name` (e.g. *Lakdikapul*, *Banjara Hills*, *Tolichowki*), coordinates, and independent consensus stats.
- **Parent Brand:** Branches point to a parent brand entity via `parent_place_id`, enabling both branch-level specificity and brand-wide sibling navigation.

### 2.4 Dish-at-Restaurant (`place_dish_public_stats`)
- Connects a canonical dish to a specific restaurant venue.
- Tracks public experience count, rating count, rating average, and typical logged price for that dish *at that specific restaurant*.
- Powers:
  - **Where to Eat This Dish:** On `/dish/[slug]`, ranks all restaurants serving that dish in Hyderabad.
  - **What to Order Here:** On `/place/[id]`, ranks the top dishes served at that venue.

---

## 3. The Rating Architecture

### 3.1 Independence Invariant
> A restaurant rating and a dish rating are completely independent facts. Never infer one from the other, and never mix them into the same aggregate.

### 3.2 Dimensions & Scale
All ratings use a uniform internal scale: **`smallint 1..10`** in PostgreSQL, displayed as **`0.5..5.0` half-stars** in the UI (`rating / 2.0`).

- **Restaurant Dimensions (Optional when `place_id IS NOT NULL`):**
  1. *Food Quality:* Taste, freshness, temperature, and culinary consistency.
  2. *Value for Money:* Portions, ingredients, and pricing fairness.
  3. *Ambience:* Cleanliness of dining room, noise level, atmosphere (optional/N/A for street food & takeaway).
  4. *Service:* Staff attentiveness, accuracy, and hospitality.
  5. *Hygiene:* Observable kitchen and venue sanitation.
  - *Context:* Dining style (`dine_in`, `takeaway`, `street_stall`) and Would Return? (`yes`, `no`).
- **Dish Dimensions (Optional per dish):**
  1. *Taste:* Execution of flavour, spices, and seasoning.
  2. *Portion:* Quantity relative to price and expectation.
  3. *Value:* Worth relative to dish price.

---

## 4. Public Pool & Privacy Governance

### 4.1 The Public Pool Rule
A rating or experience contributes to community aggregates, global search, and regional rankings **if and only if**:
- `food_experiences.status = 'published'`
- `food_experiences.visibility = 'public'`
- `profiles.is_private = false`
- `profiles.discoverable = true`
- `profiles.deletion_requested_at IS NULL`
- `profiles.deletion_pending_at IS NULL`
- Neither author nor viewer has an active block relationship with the other.

### 4.2 Minimum Sample Thresholds
- **Canonical Dishes & Restaurants:** Require at least **3 distinct public-pool reviewers** (`COUNT(DISTINCT fe.user_id) >= 3`) before displaying numerical consensus scorecards. Below 3, raw log counts are shown with an *"Early stage"* indicator.
- **Dish-at-Place:** Displays score with an *"Early consensus"* badge for 1–2 ratings and *"Verified consensus"* for 3+ distinct reviewers.
