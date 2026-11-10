-- ==============================================================================
-- MORS Database Migration: 20261110000013_v3_core_schema_and_idempotency.sql
-- Priority 1: Storage Cleanup Queue, Timezone, eaten_date, Idempotency, and Unlisted Reference Data
-- ==============================================================================

-- 1. Storage Cleanup Queue Table
CREATE TABLE IF NOT EXISTS public.storage_cleanup_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id text NOT NULL,
  storage_path text NOT NULL,
  queued_at timestamptz DEFAULT now() NOT NULL,
  processed_at timestamptz,
  error_message text
);

ALTER TABLE public.storage_cleanup_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view storage cleanup queue"
  ON public.storage_cleanup_queue
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage storage cleanup queue"
  ON public.storage_cleanup_queue
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_storage_cleanup_queue_pending 
  ON public.storage_cleanup_queue(processed_at, queued_at)
  WHERE processed_at IS NULL;

-- 2. Moderation Actions Table
CREATE TABLE IF NOT EXISTS public.moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id uuid NOT NULL REFERENCES public.profiles(id),
  report_id uuid REFERENCES public.reports(id) ON DELETE SET NULL,
  target_type public.report_target_t NOT NULL,
  target_id text NOT NULL,
  action text NOT NULL CHECK (action IN ('dismiss', 'delete_content', 'warn_user', 'suspend_user')),
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Moderators can view moderation actions"
  ON public.moderation_actions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role IN ('moderator', 'admin')
    )
  );

CREATE POLICY "Moderators can record moderation actions"
  ON public.moderation_actions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    moderator_id = (SELECT auth.uid()) AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role IN ('moderator', 'admin')
    )
  );

CREATE INDEX IF NOT EXISTS idx_moderation_actions_moderator 
  ON public.moderation_actions(moderator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_target 
  ON public.moderation_actions(target_type, target_id);

-- 3. Profiles: Timezone column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'Asia/Kolkata' NOT NULL;

-- 4. Dishes & Places: Unlisted status (is_listed = false by default)
ALTER TABLE public.dishes ADD COLUMN IF NOT EXISTS is_listed boolean DEFAULT false NOT NULL;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS is_listed boolean DEFAULT false NOT NULL;

-- Existing seeded/curated reference items are listed
UPDATE public.dishes SET is_listed = true WHERE is_listed = false;
UPDATE public.places SET is_listed = true WHERE is_listed = false;

CREATE INDEX IF NOT EXISTS idx_dishes_is_listed ON public.dishes(is_listed);
CREATE INDEX IF NOT EXISTS idx_places_is_listed ON public.places(is_listed);

-- 5. Food Experiences: eaten_date, client_request_id, and indexes
ALTER TABLE public.food_experiences ADD COLUMN IF NOT EXISTS eaten_date date;
ALTER TABLE public.food_experiences ADD COLUMN IF NOT EXISTS client_request_id uuid;

-- Backfill eaten_date from eaten_at using Asia/Kolkata timezone
UPDATE public.food_experiences
SET eaten_date = (eaten_at AT TIME ZONE 'Asia/Kolkata')::date
WHERE eaten_date IS NULL;

ALTER TABLE public.food_experiences ALTER COLUMN eaten_date SET NOT NULL;

-- Add unique constraint on (user_id, client_request_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_client_request_id'
  ) THEN
    ALTER TABLE public.food_experiences 
      ADD CONSTRAINT unique_user_client_request_id UNIQUE (user_id, client_request_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_food_experiences_user_eaten_date 
  ON public.food_experiences(user_id, eaten_date DESC);

-- 6. Collections: system_key for the Saved system collection
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS system_key text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_system_key'
  ) THEN
    ALTER TABLE public.collections 
      ADD CONSTRAINT unique_user_system_key UNIQUE (user_id, system_key);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_collections_user_system_key 
  ON public.collections(user_id, system_key);

-- 7. Automated Storage Cleanup Triggers
CREATE OR REPLACE FUNCTION public.handle_deleted_experience_photo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF OLD.storage_path IS NOT NULL AND length(trim(OLD.storage_path)) > 0 THEN
    INSERT INTO public.storage_cleanup_queue (bucket_id, storage_path)
    VALUES ('experience-photos', OLD.storage_path);
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_experience_photo_deleted ON public.experience_photos;
CREATE TRIGGER on_experience_photo_deleted
AFTER DELETE ON public.experience_photos
FOR EACH ROW
EXECUTE FUNCTION public.handle_deleted_experience_photo();

CREATE OR REPLACE FUNCTION public.handle_deleted_profile_avatar()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF OLD.avatar_path IS NOT NULL AND length(trim(OLD.avatar_path)) > 0 THEN
    INSERT INTO public.storage_cleanup_queue (bucket_id, storage_path)
    VALUES ('avatars', OLD.avatar_path);
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_deleted ON public.profiles;
CREATE TRIGGER on_profile_deleted
AFTER DELETE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_deleted_profile_avatar();

-- 8. Enhanced CREATE_EXPERIENCE RPC with Idempotency & eaten_date
CREATE OR REPLACE FUNCTION public.create_experience(payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_user_tz text;
  v_client_request_id uuid;
  v_existing_id uuid;
  v_experience_id uuid;
  v_dish record;
  v_photo record;
  v_status public.experience_status_t;
  v_visibility public.visibility_t;
  v_published_at timestamptz := NULL;
  v_eaten_at timestamptz;
  v_eaten_date date;
  v_overall_rating smallint;
  v_dishes jsonb;
  v_photos jsonb;
BEGIN
  v_user_id := (SELECT auth.uid());
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to create a food experience';
  END IF;

  -- Idempotency check via client_request_id
  IF payload ? 'client_request_id' AND (payload->>'client_request_id') IS NOT NULL THEN
    v_client_request_id := (payload->>'client_request_id')::uuid;
    SELECT id INTO v_existing_id
    FROM public.food_experiences
    WHERE user_id = v_user_id AND client_request_id = v_client_request_id;

    IF v_existing_id IS NOT NULL THEN
      RETURN v_existing_id; -- Idempotent return of existing row
    END IF;
  END IF;

  -- Retrieve User Timezone for accurate eaten_date computation
  SELECT timezone INTO v_user_tz
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_user_tz IS NULL THEN
    v_user_tz := 'Asia/Kolkata';
  END IF;

  -- Validate Category
  IF payload->>'category_slug' IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.food_categories WHERE slug = payload->>'category_slug'
  ) THEN
    RAISE EXCEPTION 'Invalid or missing category_slug: %', payload->>'category_slug';
  END IF;

  -- Validate Status & Visibility
  v_status := coalesce((payload->>'status')::public.experience_status_t, 'draft'::public.experience_status_t);
  v_visibility := coalesce((payload->>'visibility')::public.visibility_t, 'public'::public.visibility_t);

  IF v_status = 'published'::public.experience_status_t THEN
    v_published_at := now();
  END IF;

  -- Compute eaten_at and local eaten_date
  v_eaten_at := coalesce((payload->>'eaten_at')::timestamptz, now());
  v_eaten_date := (v_eaten_at AT TIME ZONE v_user_tz)::date;

  -- Validate Overall Rating
  IF payload ? 'overall_rating' AND (payload->>'overall_rating') IS NOT NULL THEN
    v_overall_rating := (payload->>'overall_rating')::smallint;
    IF v_overall_rating < 1 OR v_overall_rating > 10 THEN
      RAISE EXCEPTION 'Overall rating must be between 1 and 10';
    END IF;
  END IF;

  -- Validate Dishes Array (Must have >= 1 dish)
  v_dishes := payload->'dishes';
  IF v_dishes IS NULL OR jsonb_array_length(v_dishes) = 0 THEN
    RAISE EXCEPTION 'A food experience must contain at least one dish';
  END IF;

  -- Insert Parent Experience
  INSERT INTO public.food_experiences (
    user_id,
    client_request_id,
    title,
    category_slug,
    eaten_at,
    eaten_date,
    published_at,
    status,
    visibility,
    overall_rating,
    description,
    place_id,
    price_amount,
    price_currency,
    cuisine,
    tags
  ) VALUES (
    v_user_id,
    v_client_request_id,
    payload->>'title',
    payload->>'category_slug',
    v_eaten_at,
    v_eaten_date,
    v_published_at,
    v_status,
    v_visibility,
    v_overall_rating,
    payload->>'description',
    (payload->>'place_id')::uuid,
    (payload->>'price_amount')::numeric,
    coalesce(payload->>'price_currency', 'INR'),
    payload->>'cuisine',
    CASE
      WHEN payload ? 'tags' AND jsonb_typeof(payload->'tags') = 'array'
      THEN (SELECT coalesce(array_agg(elem::text), '{}'::text[]) FROM jsonb_array_elements_text(payload->'tags') elem)
      ELSE '{}'::text[]
    END
  )
  RETURNING id INTO v_experience_id;

  -- Insert Dishes
  FOR v_dish IN SELECT * FROM jsonb_to_recordset(v_dishes) AS x(
    dish_id uuid,
    display_name text,
    position integer,
    rating smallint,
    note text
  ) LOOP
    IF v_dish.display_name IS NULL OR length(trim(v_dish.display_name)) = 0 THEN
      RAISE EXCEPTION 'Every dish must have a non-empty display_name';
    END IF;

    IF v_dish.rating IS NOT NULL AND (v_dish.rating < 1 OR v_dish.rating > 10) THEN
      RAISE EXCEPTION 'Dish rating must be between 1 and 10';
    END IF;

    INSERT INTO public.experience_dishes (
      experience_id,
      dish_id,
      display_name,
      position,
      rating,
      note
    ) VALUES (
      v_experience_id,
      v_dish.dish_id,
      v_dish.display_name,
      coalesce(v_dish.position, 0),
      v_dish.rating,
      v_dish.note
    );
  END LOOP;

  -- Insert Photos (if any, max 10)
  v_photos := payload->'photos';
  IF v_photos IS NOT NULL AND jsonb_array_length(v_photos) > 0 THEN
    IF jsonb_array_length(v_photos) > 10 THEN
      RAISE EXCEPTION 'Cannot exceed maximum of 10 photos per experience';
    END IF;

    FOR v_photo IN SELECT * FROM jsonb_to_recordset(v_photos) AS y(
      storage_path text,
      width integer,
      height integer,
      blurhash text,
      alt_text text,
      position integer
    ) LOOP
      INSERT INTO public.experience_photos (
        experience_id,
        storage_path,
        width,
        height,
        blurhash,
        alt_text,
        position
      ) VALUES (
        v_experience_id,
        v_photo.storage_path,
        coalesce(v_photo.width, 0),
        coalesce(v_photo.height, 0),
        v_photo.blurhash,
        v_photo.alt_text,
        coalesce(v_photo.position, 0)
      );
    END LOOP;
  END IF;

  -- Increment user's experience counter if published & public
  IF v_status = 'published'::public.experience_status_t AND v_visibility = 'public'::public.visibility_t THEN
    UPDATE public.profiles
    SET experiences_count = experiences_count + 1
    WHERE id = v_user_id;
  END IF;

  RETURN v_experience_id;
END;
$$;

-- 9. DELETE_EXPERIENCE RPC enqueuing storage cleanup
CREATE OR REPLACE FUNCTION public.delete_experience(p_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_exp record;
BEGIN
  v_user_id := (SELECT auth.uid());
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_exp
  FROM public.food_experiences
  WHERE id = p_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Deletion cascades to experience_photos, triggering on_experience_photo_deleted
  DELETE FROM public.food_experiences WHERE id = p_id;

  IF v_exp.status = 'published'::public.experience_status_t AND v_exp.visibility = 'public'::public.visibility_t THEN
    UPDATE public.profiles
    SET experiences_count = GREATEST(0, experiences_count - 1)
    WHERE id = v_user_id;
  END IF;

  RETURN true;
END;
$$;
