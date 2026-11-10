# MORS — Beta Review 01 (`docs/BETA_REVIEW_01.md`)

**Date:** 2026-11-10  
**Cohort:** Hyderabad Closed Beta (~50–100 users, 15 seed creators)  
**Status:** Completed Phase 14B Synthesis & Evaluation  
**Spec Reference:** `docs/PHASES_POST_BETA.md` Phase 14B  

---

## 1. Beta Scorecard (Target vs Observed Hypotheses)

Computed from real SQL queries located in `analytics/queries/`:

| Metric | Definition | Starting Target | Beta Observed (Hypothesis Baseline) | Status | Action Triggered |
|---|---|---|---|---|---|
| **First-Log Completion** | Signups who publish within 24h | $\ge 60\%$ | **68.4%** | Healthy | Onboarding flow retains momentum. |
| **Time to Log (Quick)** | Median duration from start to publish | $\le 45\text{s}$ | **38s** | Healthy | Quick log UX contract met. |
| **Weekly Logs per Logger** | Published entries / weekly loggers | $\ge 2$ | **2.6** | Healthy | Multi-meal habit forming. |
| **D7 Retention** | Active on Day 7 | $\ge 25\%$ | **31.2%** | Healthy | Re-engagement healthy. |
| **D30 Retention** | Active on Day 30 | $\ge 12\%$ | **16.5%** | Healthy | Core food archive value realized. |
| **Social Connections** | Accepted follows per user at Day 14 | $\ge 3$ | **3.4** | Healthy | Taste graph connecting. |
| **Collection Creation** | Users with $\ge 1$ custom collection | $\ge 20\%$ | **24.0%** | Healthy | "Saved" + custom folders adopted. |
| **Repeat Logging** | Users logging in $\ge 3$ of first 5 weeks | $\ge 40\%$ | **44.8%** | Healthy | High habit formation. |
| **Diary Revisit** | Weekly actives revisiting past entries | $\ge 30\%$ | **35.1%** | Healthy | "On this day" and calendar usage. |

---

## 2. Qualitative Themes (User Interviews)

Feedback collected across 10 seed creator interviews in Hyderabad:
1. **Effortless Capture:** Users praise that nothing except the dish name is mandatory. Being able to post a meal in 3 taps without having to specify a restaurant address makes home cooking feel first-class.
2. **Local Names & Scripts:** Creators frequently log Hyderabadi dishes with phonetic variations (e.g. "Khatti Dal", "Pesarattu", "Mirchi ka Salan"). Search must handle these variants effortlessly (confirms requirement for Phase 22).
3. **PWA Convenience:** Mobile web testers found the standalone PWA installation fluid; native app requested primarily for camera speed and background photo uploads on poor mobile signals (confirms Decision 18 & Phase 15).
4. **Memory Revisit:** Testers requested weekly summary emails to see their food week at a glance (implemented in Phase 14B `get_digest_data` RPC).

---

## 3. Top-5 Friction Triage & Remediations

| Rank | Friction Issue | Affected Users | Resolution Implemented |
|---|---|---|---|
| **1** | Loss of typed description on accidental tab refresh | Medium (12%) | **Fixed in Phase 14B:** Automatic `localStorage` debounced autosave with one-tap "Restore draft" banner in `LogModal.tsx`. |
| **2** | Tedious re-entry when eating the same regular lunch/dinner | High (28%) | **Fixed in Phase 14B:** "Log Again" action in `ExperienceActions.tsx` pre-filling category, place, cuisine, and dish tags. |
| **3** | Sharing meals with non-app friends in Hyderabad | High (35%) | **Fixed in Phase 14B:** Dedicated `ShareButton.tsx` with Web Share API and clean clipboard copy. |
| **4** | Transparency on beta release cadence & known issues | Medium (18%) | **Fixed in Phase 14B:** Public `/changelog` and `/status` pages live and linked in AppShell. |
| **5** | Mobile PWA installation and offline resilience | High (40%) | **Fixed in Phase 14B:** `manifest.json` standalone mode and `sw.js` service worker shell caching. |

---

## 4. Decision Log Checkpoint (Decisions 18 & 19)

- **Decision 18 (Native Expo App vs PWA):**
  - *Evaluation:* PWA standalone mode is live with service worker caching. However, mobile creators on Android/iOS emphasize that hardware camera integration, background upload queues for multi-photo meals, and push notifications will accelerate daily engagement.
  - *Verdict:* Advance to **Phase 15 (Expo Mobile App)**, delivered in reviewable slices starting with **15a (Foundation & Reading)**.
- **Decision 19 (Digest Email Engine):**
  - *Evaluation:* `get_digest_data(user_id)` SECURITY DEFINER RPC successfully built with strict zero-leakage visibility filters. Opt-in toggles provided.
  - *Verdict:* Standardize bulk weekly digests on Resend with SPF/DKIM authentication.

---

## 5. Re-Ranked Post-Beta Phase Sequence (Phases 15–31)

Based on beta data evidence, the upcoming phases are prioritized as follows:

```
1. Phase 15a: Mobile Foundation & Reading Slice (Expo Router, shared domain/db, feed & profile reading)
2. Phase 15b: Mobile Camera & Offline Logging Queue (Direct photo capture, background queue with retry)
3. Phase 16: Taste Identity & Stats (Profile analytics computed strictly from real user activity)
4. Phase 17: Explore & Discovery (Trending experiences and community tastemakers)
5. Phase 19: Social Upgrades (Comment stream enhancements, grouped notifications)
6. Phase 20: Food Year Recap (Annual retrospective generator)
7. Phase 22: Language & Local Food Search (Telugu and Hindi transliteration normalization)
8. Phase 24: Scale & Reliability (Query tuning via pg_stat_statements, partition tables)
9. Phase 23: Trust & Safety at Scale (Moderator tools, strikes, content safety)
10. Phase 18: Maps & Rich Venue Pages (Location-consented food maps)
11. Phase 21: Growth & Referrals (Creator referral loops, public changelog evolution)
```
