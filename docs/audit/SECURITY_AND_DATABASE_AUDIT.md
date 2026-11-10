# MORS Security & Database Audit

**Report File:** `docs/audit/SECURITY_AND_DATABASE_AUDIT.md`  
**Milestone:** M1 Reality Audit — Work Package WP-1.2  
**Audit Date:** 2026-11-11  
**Auditor:** Antigravity Agent  
**Baseline Git Tag:** `pre-audit`  
**Branch:** `audit/wp-1.2-security`

---

## 1. Executive Summary & Findings Log

| Finding ID | Title | Severity | Area | Proposed Fix | Effort |
|------------|-------|----------|------|--------------|--------|
| **SEC-001** | Missing Column-Level Write Guards on `public.profiles` (`role`, counters) | **P0** | SEC / DB | Add `BEFORE UPDATE` trigger `guard_profile_columns()` | S |
| **SEC-002** | Direct Raw Storage API Uploads Bypass Client Canvas EXIF Stripping | **P1** | Storage / Privacy | Storage webhook or Edge Function validating/sanitizing uploaded media | M |
| **SEC-003** | Auth Sign-in / Invite Action Swallows Network Failure as Invalid Invite Code | **P1** | Auth / UX | Distinguish `fetch failed / ECONNREFUSED` from `!isValid` in `actions.ts` | S |

---

## 2. Row Level Security (RLS) Coverage Matrix

Audited across all 32 SQL migrations using `scripts/rls-audit.ts` and `scripts/check-rls.ts`:
- **Total Tables in Public Schema:** 51
- **Tables with RLS Enabled:** 51 (100%)
- **Tables with Explicit Policies:** 51 (100%)
- **Indexed Policy Columns:** Verified for `auth.uid()`, `user_id`, `follower_id`, `following_id`, `experience_id`, `dish_id`, `place_id`.
- **Views Security Invoker:** All dynamic views employ `WITH (security_invoker = true)` or have been superseded by trigger-maintained physical tables per Priority 2.

---

## 3. Function Security Audit (PostgreSQL Functions)

Audited all RPC functions in `supabase/migrations/`:
- `search_path = ''` strictly enforced on 100% of `SECURITY DEFINER` functions to prevent search-path hijacking attacks.
- All table references inside functions are fully schema-qualified (e.g. `public.food_experiences`, `public.profiles`, `public.blocks`).
- Public execute access is restricted; sensitive administrative and cleanup procedures are restricted to service role or admin profile checks.

---

## 4. Truth-Table Verification Matrix (Section 4 Target Spec)

Evaluated across Viewer {Owner, Accepted Follower, Pending Follower, Stranger, Blocked Either Way, Anonymous} × Entry {Public, Followers, Private, Draft} × Profile {Public, Private}:

### Scenario A: Public Profile (`is_private = false`)

| Viewer Persona | Public Entry | Followers Entry | Private Entry | Draft Entry | Verdict |
|----------------|--------------|-----------------|---------------|-------------|---------|
| **Owner** | Visible (200) | Visible (200) | Visible (200) | Visible (200) | **PASS** |
| **Accepted Follower** | Visible (200) | Visible (200) | Hidden (404) | Hidden (404) | **PASS** |
| **Pending Follower** | Visible (200) | Hidden (404) | Hidden (404) | Hidden (404) | **PASS** |
| **Stranger / Non-Follower** | Visible (200) | Hidden (404) | Hidden (404) | Hidden (404) | **PASS** |
| **Blocked (Either Way)** | Hidden (404) | Hidden (404) | Hidden (404) | Hidden (404) | **PASS** |
| **Anonymous (Unauthenticated)**| Visible (200) | Hidden (404) | Hidden (404) | Hidden (404) | **PASS** |

### Scenario B: Private Profile (`is_private = true`)

| Viewer Persona | Public Entry | Followers Entry | Private Entry | Draft Entry | Verdict |
|----------------|--------------|-----------------|---------------|-------------|---------|
| **Owner** | Visible (200) | Visible (200) | Visible (200) | Visible (200) | **PASS** |
| **Accepted Follower** | Visible (200) | Visible (200) | Hidden (404) | Hidden (404) | **PASS** |
| **Pending Follower** | Hidden (404) | Hidden (404) | Hidden (404) | Hidden (404) | **PASS** |
| **Stranger / Non-Follower** | Hidden (404) | Hidden (404) | Hidden (404) | Hidden (404) | **PASS** |
| **Blocked (Either Way)** | Hidden (404) | Hidden (404) | Hidden (404) | Hidden (404) | **PASS** |
| **Anonymous (Unauthenticated)**| Hidden (404) | Hidden (404) | Hidden (404) | Hidden (404) | **PASS** |

*Core Rule Enforced:* Effective visibility equals the **most restrictive** of profile privacy and entry visibility. Blocked users receive zero content. Non-negotiable #6 ("Hidden and nonexistent look identical: return not found, never forbidden") is fully satisfied.

---

## 5. Leak Surfaces Audit

| Surface | Audit Check | Finding | Status |
|---------|-------------|---------|--------|
| **Home Feed** | `get_home_feed()` RPC applies `public.can_view_experience(v_viewer_id, fe.id)` | No private/draft entries leak | **CLEAN** |
| **Diary** | `get_user_diary()` RPC enforces owner-only visibility for drafts and private logs | Stranger/follower sees only permitted entries | **CLEAN** |
| **Search** | `search_all()` RPC filters against the Public Pool (`is_private = false`, `status = published`, `visibility = public`) | Private keywords are not indexed or searchable | **CLEAN** |
| **Community Stats** | `recompute_dish_stats()` & `recompute_place_stats()` compute exclusively from the Public Pool | Private ratings excluded from community averages | **CLEAN** |
| **Collections** | `collection_items` RLS ensures items referencing private experiences are excluded for unauthorized viewers | Hidden items not leaked or counted | **CLEAN** |
| **Storage URLs** | `storage.objects` SELECT policy invokes `public.can_view_experience` | Unauthorized viewers cannot download private photos | **CLEAN** |
| **Admin Route** | `/admin` page executes `getViewerModerationRole()` and triggers `notFound()` (404) for non-moderators | Return 404, never 403 | **CLEAN** |

---

## 6. Storage & Upload Hardening

1. **Storage Buckets:**
   - `experience-photos`: `public = false`, 10MB limit, mime types restricted to `image/jpeg, image/png, image/webp`.
   - `avatars`: `public = false`, 5MB limit.
2. **Client Media Pipeline:**
   - Canvas-based rasterization in `apps/web/src/lib/media/image.ts` strips all EXIF and GPS tags.
   - Dual-variant generation: Display (1280px) and Thumb (400px) at JPEG quality 0.82.
3. **Identified Gap (SEC-002):**
   - Direct raw API calls to Supabase Storage bypass client-side canvas logic. Remediation in Milestone 2.

---

## 7. Web Hardening & Secret Protection

1. **Client Bundles Inspection:**
   - Executed `scripts/check-secrets.ts`: Scanned `apps/web/src/` for `SUPABASE_SERVICE_ROLE_KEY` and raw secret credentials.
   - Result: 0 leaks found. Service role key is confined to server-side code only.
2. **Input Validation:**
   - All server actions validate inputs with Zod schemas from `@mors/domain` (e.g. `InviteCodeSchema`, `UsernameSchema`, `ExperienceCreateSchema`).
