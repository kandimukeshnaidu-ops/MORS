# Evidence Record: EV-002 — Live PostgreSQL Schema, Triggers, and RLS Policy Inventory

- **Evidence ID:** `EV-002`
- **Timestamp:** `2026-11-12T00:16:15+05:30`
- **Git Commit SHA:** `dd12d32ecf7c3ce51a3853bc54e89642f949c47e`
- **Database Target:** Local Supabase PostgreSQL (`supabase_db_MORS`, PostgreSQL 15, 33 migrations applied)

---

## 1. Commands / Inspection Methods Executed

1. `docker exec supabase_db_MORS psql -U postgres -d postgres -c "SELECT table_name, table_type FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"`
2. `docker exec supabase_db_MORS psql -U postgres -d postgres -c "SELECT trigger_name, event_object_table, event_manipulation, action_timing, action_statement FROM information_schema.triggers WHERE trigger_schema = 'public' ORDER BY event_object_table, trigger_name;"`
3. `docker exec supabase_db_MORS psql -U postgres -d postgres -c "SELECT tablename, policyname, cmd, qual, with_check FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('dishes', 'places', 'food_experiences', 'experience_dishes', 'dish_public_stats', 'place_public_stats', 'profiles') ORDER BY tablename, policyname;"`
4. Static inspection of `supabase/migrations/20261110000001_initial_schema.sql` through `20261110000033_guard_profile_columns.sql`.

---

## 2. Relevant Paths & Symbols Inspected

- [20261110000001_initial_schema.sql](file:///c:/Users/mukes/OneDrive/Desktop/MORS/supabase/migrations/20261110000001_initial_schema.sql)
- [20261110000005_canonical_merges.sql](file:///c:/Users/mukes/OneDrive/Desktop/MORS/supabase/migrations/20261110000005_canonical_merges.sql)
- [20261110000009_search.sql](file:///c:/Users/mukes/OneDrive/Desktop/MORS/supabase/migrations/20261110000009_search.sql)
- [20261110000012_taste_stats_and_explore.sql](file:///c:/Users/mukes/OneDrive/Desktop/MORS/supabase/migrations/20261110000012_taste_stats_and_explore.sql)
- [20261110000013_v3_core_schema_and_idempotency.sql](file:///c:/Users/mukes/OneDrive/Desktop/MORS/supabase/migrations/20261110000013_v3_core_schema_and_idempotency.sql)
- [20261110000014_trigger_maintained_stats.sql](file:///c:/Users/mukes/OneDrive/Desktop/MORS/supabase/migrations/20261110000014_trigger_maintained_stats.sql)
- [20261110000018_phase16_taste_stats.sql](file:///c:/Users/mukes/OneDrive/Desktop/MORS/supabase/migrations/20261110000018_phase16_taste_stats.sql)
- [20261110000020_phase18_map_pins_and_places.sql](file:///c:/Users/mukes/OneDrive/Desktop/MORS/supabase/migrations/20261110000020_phase18_map_pins_and_places.sql)
- [20261110000026_phase25_cities_and_multi_city.sql](file:///c:/Users/mukes/OneDrive/Desktop/MORS/supabase/migrations/20261110000026_phase25_cities_and_multi_city.sql)

---

## 3. Observed Results

### 3.1 Public Schema Tables (51 Base Tables, 0 Views)
All 51 objects in `public` are `BASE TABLE` (Migration `14` converted `dish_public_stats` and `place_public_stats` from `VIEW` to trigger-maintained `BASE TABLE`s):
`ai_assist_preferences`, `appeals`, `blocks`, `cities`, `collection_items`, `collection_likes`, `collection_members`, `collections`, `content_hashes`, `digest_sends`, `dish_aliases`, `dish_public_stats`, `dish_similarity`, `dish_translations`, `dishes`, `entitlement_grants`, `entry_stats_daily`, `experience_comments`, `experience_dishes`, `experience_likes`, `experience_photos`, `explore_cache`, `follows`, `food_categories`, `food_experiences`, `import_batches`, `invite_codes`, `invite_redemptions`, `moderation_actions`, `notifications`, `place_public_stats`, `places`, `plan_votes`, `plans`, `profile_stats_daily`, `profiles`, `push_tokens`, `rate_limit_buckets`, `rec_feedback`, `recaps`, `reports`, `spam_signals`, `storage_cleanup_queue`, `storage_quotas`, `subscriptions`, `suspensions`, `trusted_reporters`, `user_stats_owner`, `user_stats_public`, `user_strikes`, `user_taste_vectors`.

### 3.2 Trigger Inventory (17 Triggers Across 8 Tables)
- `blocks`: `after_block_insert` -> `handle_block_insert()`
- `collection_items`: `on_collection_item_count_change` (INSERT, DELETE) -> `handle_collection_item_count_sync()`
- `collection_likes`: `on_collection_likes_count_change` (INSERT, DELETE) -> `handle_collection_likes_count_sync()`
- `experience_dishes`: `on_experience_dishes_maintain_stats` (INSERT, UPDATE, DELETE) -> `trigger_on_experience_dishes_change()`
- `experience_photos`: `on_experience_photo_deleted` (DELETE) -> `handle_deleted_experience_photo()`
- `follows`: `before_follow_insert` (INSERT) -> `handle_follow_insert()`
- `food_experiences`:
  - `on_experience_maintain_stats` (INSERT, UPDATE, DELETE) -> `trigger_on_experience_change()`
  - `set_experiences_updated_at` (BEFORE UPDATE) -> `set_updated_at()`
- `profiles`:
  - `on_profile_deleted` (AFTER DELETE) -> `handle_deleted_profile_avatar()`
  - `set_profiles_updated_at` (BEFORE UPDATE) -> `set_updated_at()`
  - `trg_guard_profile_columns` (BEFORE UPDATE) -> `guard_profile_columns()`

### 3.3 Key Schema & RLS Defects Identified From Live DB

1. **`dishes` and `places` RLS Policies Allow Unrestricted Read of Unlisted Entities and `created_by`:**
   - Live `pg_policies` output:
     - `dishes | Dishes readable by everyone | SELECT | qual: true`
     - `places | Places readable by everyone | SELECT | qual: true`
   - Violation: `AGENTS.md` Non-Negotiable #11 requires unlisted dishes/places (`is_listed = false`) to be visible ONLY to their creator until used by a public-pool entry or curated, and requires `created_by` never to be exposed to clients. Currently, enforcement is only in application server actions (`apps/web/src/app/log/actions.ts` and `apps/web/src/app/dish/actions.ts`), while direct PostgREST queries, `search_all` (`20261110000009_search.sql`), and `find_similar_dishes`/`find_similar_places` (`20261110000005_canonical_merges.sql`) expose unlisted rows.
2. **Missing Trigger on `public.profiles` for Public-Pool Aggregate Invalidation:**
   - `recompute_dish_stats` and `recompute_place_stats` (`20261110000014_trigger_maintained_stats.sql`) join `public.profiles p` and check `p.is_private = false AND p.discoverable = true AND p.deletion_requested_at IS NULL`.
   - However, `information_schema.triggers` confirms there is no trigger on `public.profiles` `AFTER UPDATE OF is_private, discoverable, deletion_requested_at, deletion_pending_at` to recompute `dish_public_stats` and `place_public_stats` for that user's logged dishes and places.
3. **Broken Column Name in `recompute_user_stats` (`20261110000018_phase16_taste_stats.sql`):**
   - Lines 94 and 114 reference `AVG(fe.rating)` on `public.food_experiences fe`, whereas the column on `public.food_experiences` is `overall_rating`.
4. **Incomplete Foreign Key Re-pointing in `merge_dishes` and `merge_places` (`20261110000005_canonical_merges.sql`):**
   - `merge_dishes` does not re-point `collection_items.dish_id`, `dish_translations.dish_id`, or `dish_similarity` (`dish_a_id`, `dish_b_id`), and does not call `recompute_dish_stats`.
   - `merge_places` does not re-point `collection_items.place_id`, and does not call `recompute_place_stats`.

---

## 4. Limitations

- None. All table, column, trigger, and policy definitions were verified directly against the running PostgreSQL 15 instance (`supabase_db_MORS`) and migration source files.
