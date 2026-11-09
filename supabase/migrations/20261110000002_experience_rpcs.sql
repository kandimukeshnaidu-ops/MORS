-- ==============================================================================
-- MORS Database Migration: 20261110000002_experience_rpcs.sql
-- Phase 1: Transactional RPCs for multi-table writes
-- ==============================================================================

-- 1. CREATE_EXPERIENCE RPC
CREATE OR REPLACE FUNCTION public.create_experience(payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_experience_id uuid;
  v_dish record;
  v_photo record;
  v_status public.experience_status_t;
  v_visibility public.visibility_t;
  v_published_at timestamptz := NULL;
  v_overall_rating smallint;
  v_dishes jsonb;
  v_photos jsonb;
BEGIN
  v_user_id := (SELECT auth.uid());
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to create a food experience';
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
    title,
    category_slug,
    eaten_at,
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
    payload->>'title',
    payload->>'category_slug',
    coalesce((payload->>'eaten_at')::timestamptz, now()),
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

  -- Insert Photos (if any)
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

-- 2. UPDATE_EXPERIENCE RPC
CREATE OR REPLACE FUNCTION public.update_experience(
  p_experience_id uuid,
  payload jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_existing_exp record;
  v_dish record;
  v_photo record;
  v_dishes jsonb;
  v_photos jsonb;
  v_new_status public.experience_status_t;
  v_new_visibility public.visibility_t;
  v_published_at timestamptz;
BEGIN
  v_user_id := (SELECT auth.uid());
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Check ownership
  SELECT * INTO v_existing_exp
  FROM public.food_experiences
  WHERE id = p_experience_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Experience not found or you do not have permission to modify it';
  END IF;

  v_new_status := coalesce((payload->>'status')::public.experience_status_t, v_existing_exp.status);
  v_new_visibility := coalesce((payload->>'visibility')::public.visibility_t, v_existing_exp.visibility);

  v_published_at := v_existing_exp.published_at;
  IF v_published_at IS NULL AND v_new_status = 'published'::public.experience_status_t THEN
    v_published_at := now();
  END IF;

  -- Update Experience Record
  UPDATE public.food_experiences
  SET
    title = coalesce(payload->>'title', title),
    category_slug = coalesce(payload->>'category_slug', category_slug),
    eaten_at = coalesce((payload->>'eaten_at')::timestamptz, eaten_at),
    published_at = v_published_at,
    status = v_new_status,
    visibility = v_new_visibility,
    overall_rating = CASE
      WHEN payload ? 'overall_rating' THEN (payload->>'overall_rating')::smallint
      ELSE overall_rating
    END,
    description = coalesce(payload->>'description', description),
    place_id = CASE
      WHEN payload ? 'place_id' THEN (payload->>'place_id')::uuid
      ELSE place_id
    END,
    price_amount = CASE
      WHEN payload ? 'price_amount' THEN (payload->>'price_amount')::numeric
      ELSE price_amount
    END,
    cuisine = coalesce(payload->>'cuisine', cuisine),
    updated_at = now()
  WHERE id = p_experience_id;

  -- If dishes are provided, replace them atomically
  v_dishes := payload->'dishes';
  IF v_dishes IS NOT NULL AND jsonb_array_length(v_dishes) > 0 THEN
    DELETE FROM public.experience_dishes WHERE experience_id = p_experience_id;

    FOR v_dish IN SELECT * FROM jsonb_to_recordset(v_dishes) AS x(
      dish_id uuid,
      display_name text,
      position integer,
      rating smallint,
      note text
    ) LOOP
      INSERT INTO public.experience_dishes (
        experience_id,
        dish_id,
        display_name,
        position,
        rating,
        note
      ) VALUES (
        p_experience_id,
        v_dish.dish_id,
        v_dish.display_name,
        coalesce(v_dish.position, 0),
        v_dish.rating,
        v_dish.note
      );
    END LOOP;
  END IF;

  -- If photos are provided, update them
  v_photos := payload->'photos';
  IF v_photos IS NOT NULL THEN
    DELETE FROM public.experience_photos WHERE experience_id = p_experience_id;

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
        p_experience_id,
        v_photo.storage_path,
        coalesce(v_photo.width, 0),
        coalesce(v_photo.height, 0),
        v_photo.blurhash,
        v_photo.alt_text,
        coalesce(v_photo.position, 0)
      );
    END LOOP;
  END IF;

  RETURN true;
END;
$$;
