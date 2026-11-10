# MORS UI/UX Audit

**Report File:** `docs/audit/UI_UX_AUDIT.md`  
**Milestone:** M1 Reality Audit — Work Package WP-1.4  
**Audit Date:** 2026-11-11  
**Auditor:** Antigravity Agent  
**Baseline Git Tag:** `pre-audit`  
**Branch:** `audit/wp-1.4-ui-ux`

---

## 1. Design Rules Compliance Matrix (AGENTS.md)

| Design Guideline | Target Standard | Codebase Reality | Compliance Verdict |
|------------------|----------------|------------------|-------------------|
| **Palette** | Dark charcoal `#121212`, warm off-white `#f5f3ef`, muted olive `#8a9a5b` | Defined in `apps/web/src/app/globals.css` as CSS variables | **PASS (100%)** |
| **Zero Hardcoded Hex** | All components use CSS variables | Zero hex colors found in `apps/web/src/components/**/*.tsx` | **PASS (100%)** |
| **Typography** | Serif display (Newsreader/Georgia) + Clean sans body (Inter/system) | `h1, h2, h3, .font-display` use `var(--font-serif)`; body uses `var(--font-sans)` | **PASS (100%)** |
| **Contrast (WCAG AA)** | Text to background ratio ≥ 4.5:1 | `#f5f3ef` on `#121212` yields ~16:1 ratio | **PASS (100%)** |
| **Reduced Motion** | `@media (prefers-reduced-motion: reduce)` resets animations to `0.01ms` | Present and active in `globals.css` | **PASS (100%)** |
| **Living Gallery** | Accessible at `/dev/ui` rendering all states | 13 component categories covered with interactive controls | **PASS (100%)** |

---

## 2. Multi-Viewport Responsive Audit (360px, 768px, 1280px)

| Page Route | 360px (Mobile) | 768px (Tablet) | 1280px (Desktop) | Loading State | Empty State |
|------------|----------------|----------------|------------------|---------------|-------------|
| **Home Feed (`/`)** | Single column, sticky bottom nav | 2-column grid | 3-column editorial grid | Layout Skeleton | Clean Empty State |
| **Food Log Modal** | Full-width mobile sheet | Centered dialog | Centered dialog | Progress bar | Form fields |
| **Diary (`/diary`)** | Stacked timeline cards | 2-column timeline | Timeline + Calendar toggle | Shimmer cards | "No logs found" |
| **Entry Detail (`/e/[id]`)** | Full-width photo carousel | Max-w-2xl centered | Split photo/details | Skeleton layout | 404 Not Found |
| **Collections (`/collections`)** | Vertical card stack | 2-column cards | 3-column cards | Skeleton cards | "Create collection" |
| **Profile (`/u/[username]`)** | Single column bio & logs | 2-column profile | 3-column profile | Skeleton profile | Private notice / Empty |
| **Component Gallery (`/dev/ui`)**| Responsive wrap flex | 2-column sections | Full width showcase | Built-in controls | N/A |

---

## 3. UI/UX Ranked Problem List

| Finding ID | Severity | Area | Screen / Component | Description | Proposed Polish Hint (WP-2.7) |
|------------|----------|------|--------------------|-------------|--------------------------------|
| **UI-001** | **P2** | UI | Feed / EmptyState | Cold-start empty feed displays message without a 1-click "Log your first meal" CTA | Add prominent primary action button to EmptyState |
| **UI-002** | **P2** | UI | Modal / Sheets | Mobile modal sheet bottom edge does not account for mobile hardware home-bar | Add `pb-[env(safe-area-inset-bottom)]` to mobile sheet container |
| **UI-003** | **P3** | UI | FilterBar | Filter bar horizontal scroll on 360px lacks subtle right edge fade indicator | Add CSS gradient mask on overflowing tag chip lists |
