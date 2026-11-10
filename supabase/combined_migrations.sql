-- ==============================================================================
-- MORS Database Migration: 20261110000001_initial_schema.sql
-- Phase 1: Database foundation and authorization
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 2. ENUMS
CREATE TYPE public.visibility_t AS ENUM ('public', 'followers', 'private');
CREATE TYPE public.collection_vis_t AS ENUM ('public', 'private', 'unlisted');
CREATE TYPE public.follow_status_t AS ENUM ('pending', 'accepted');
CREATE TYPE public.experience_status_t AS ENUM ('draft', 'published');
CREATE TYPE public.notification_t AS ENUM ('follow', 'follow_request', 'follow_accepted', 'like', 'comment', 'collection_like');
CREATE TYPE public.report_target_t AS ENUM ('experience', 'comment', 'user', 'collection', 'dish', 'place');

-- 3. TABLES

-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username extensions.citext UNIQUE NOT NULL,
  display_name text,
  bio text,
  location_text text,
  avatar_path text,
  cover_path text,
  favourite_cuisines text[] DEFAULT '{}'::text[],
  social_links jsonb DEFAULT '{}'::jsonb,
  is_private boolean DEFAULT false NOT NULL,
  default_visibility public.visibility_t DEFAULT 'public'::public.visibility_t NOT NULL,
  discoverable boolean DEFAULT true NOT NULL,
  notification_prefs jsonb DEFAULT '{}'::jsonb,
  followers_count integer DEFAULT 0 NOT NULL,
  following_count integer DEFAULT 0 NOT NULL,
  experiences_count integer DEFAULT 0 NOT NULL,
  role text DEFAULT 'user'::text NOT NULL CHECK (role IN ('user', 'moderator', 'admin')),
  onboarding_completed_at timestamptz,
  deletion_requested_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT username_format CHECK (username ~ '^[a-z0-9_.]{3,30}$')
);

-- Follows
CREATE TABLE public.follows (
  follower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status public.follow_status_t NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT different_users CHECK (follower_id <> following_id)
);

-- Blocks
CREATE TABLE public.blocks (
  blocker_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (blocker_id, blocked_id),
  CONSTRAINT different_users_block CHECK (blocker_id <> blocked_id)
);

-- Food Categories
CREATE TABLE public.food_categories (
  slug text PRIMARY KEY,
  label text NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  is_active boolean DEFAULT true NOT NULL
);

-- Places
CREATE TABLE public.places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  normalized_name text NOT NULL,
  place_type text,
  parent_place_id uuid REFERENCES public.places(id) ON DELETE SET NULL,
  address text,
  city text,
  country text DEFAULT 'India',
  lat double precision,
  lng double precision,
  external_source text,
  external_id text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  merged_into_id uuid REFERENCES public.places(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(external_source, external_id)
);

-- Dishes
CREATE TABLE public.dishes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  normalized_name text NOT NULL,
  slug text UNIQUE NOT NULL,
  cuisine text,
  description text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  merged_into_id uuid REFERENCES public.dishes(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Dish Aliases
CREATE TABLE public.dish_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dish_id uuid NOT NULL REFERENCES public.dishes(id) ON DELETE CASCADE,
  alias text NOT NULL,
  normalized_alias text NOT NULL
);

-- Food Experiences
CREATE TABLE public.food_experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text,
  category_slug text NOT NULL REFERENCES public.food_categories(slug),
  eaten_at timestamptz DEFAULT now() NOT NULL,
  published_at timestamptz,
  status public.experience_status_t DEFAULT 'draft'::public.experience_status_t NOT NULL,
  visibility public.visibility_t DEFAULT 'public'::public.visibility_t NOT NULL,
  overall_rating smallint CHECK (overall_rating IS NULL OR (overall_rating >= 1 AND overall_rating <= 10)),
  description text,
  place_id uuid REFERENCES public.places(id) ON DELETE SET NULL,
  price_amount numeric(10,2),
  price_currency char(3) DEFAULT 'INR'::bpchar NOT NULL,
  cuisine text,
  tags text[] DEFAULT '{}'::text[] NOT NULL,
  search_tsv tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(cuisine, ''))
  ) STORED,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Experience Dishes
CREATE TABLE public.experience_dishes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id uuid NOT NULL REFERENCES public.food_experiences(id) ON DELETE CASCADE,
  dish_id uuid REFERENCES public.dishes(id) ON DELETE SET NULL,
  display_name text NOT NULL,
  position integer DEFAULT 0 NOT NULL,
  rating smallint CHECK (rating IS NULL OR (rating >= 1 AND rating <= 10)),
  note text
);

-- Experience Photos
CREATE TABLE public.experience_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id uuid NOT NULL REFERENCES public.food_experiences(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  width integer NOT NULL,
  height integer NOT NULL,
  blurhash text,
  alt_text text,
  position integer DEFAULT 0 NOT NULL
);

-- 4. SECURITY DEFINER HELPER FUNCTIONS (search_path = '')

CREATE OR REPLACE FUNCTION public.is_blocked_between(a uuid, b uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.blocks
    WHERE (blocker_id = a AND blocked_id = b)
       OR (blocker_id = b AND blocked_id = a)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_accepted_follower(viewer uuid, target uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.follows
    WHERE follower_id = viewer
      AND following_id = target
      AND status = 'accepted'::public.follow_status_t
  );
$$;

CREATE OR REPLACE FUNCTION public.can_view_profile_content(viewer uuid, owner uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    CASE
      -- Owner can always view own content
      WHEN owner = viewer THEN true
      -- Blocked users cannot view
      WHEN public.is_blocked_between(viewer, owner) THEN false
      -- Check profile privacy
      ELSE (
        SELECT
          CASE
            WHEN NOT p.is_private THEN true
            WHEN viewer IS NOT NULL AND public.is_accepted_follower(viewer, owner) THEN true
            ELSE false
          END
        FROM public.profiles p
        WHERE p.id = owner
      )
    END;
$$;

CREATE OR REPLACE FUNCTION public.can_view_experience(viewer uuid, exp_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    CASE
      -- Owner can always view own experience (including drafts)
      WHEN exp.user_id = viewer THEN true
      -- Drafts are strictly owner only
      WHEN exp.status = 'draft'::public.experience_status_t THEN false
      -- Blocked users cannot view
      WHEN public.is_blocked_between(viewer, exp.user_id) THEN false
      -- Effective visibility: most restrictive of profile privacy and entry visibility
      ELSE (
        SELECT
          CASE
            -- Private profile restricts everything to accepted followers
            WHEN p.is_private THEN (viewer IS NOT NULL AND public.is_accepted_follower(viewer, exp.user_id))
            -- Public profile: check entry visibility
            WHEN exp.visibility = 'public'::public.visibility_t THEN true
            WHEN exp.visibility = 'followers'::public.visibility_t THEN (viewer IS NOT NULL AND public.is_accepted_follower(viewer, exp.user_id))
            ELSE false -- 'private' visibility is owner only
          END
        FROM public.profiles p
        WHERE p.id = exp.user_id
      )
    END
  FROM public.food_experiences exp
  WHERE exp.id = exp_id;
$$;

-- 5. TRIGGERS & PROCEDURES

-- Handle signup in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  base_username text;
  final_username text;
  counter integer := 0;
BEGIN
  base_username := lower(regexp_replace(coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)), '[^a-z0-9_.]', '', 'g'));
  IF char_length(base_username) < 3 THEN
    base_username := 'user_' || substr(md5(random()::text), 1, 6);
  END IF;
  final_username := substr(base_username, 1, 30);

  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username::extensions.citext) LOOP
    counter := counter + 1;
    final_username := substr(base_username, 1, 25) || counter;
  END LOOP;

  INSERT INTO public.profiles (
    id,
    username,
    display_name,
    avatar_path,
    created_at,
    updated_at
  ) VALUES (
    new.id,
    final_username::extensions.citext,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', final_username),
    new.raw_user_meta_data->>'avatar_url',
    now(),
    now()
  );
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Automatic updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$;

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_experiences_updated_at BEFORE UPDATE ON public.food_experiences FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Follow privacy trigger
CREATE OR REPLACE FUNCTION public.handle_follow_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  target_is_private boolean;
BEGIN
  -- If blocked, prevent follow
  IF public.is_blocked_between(new.follower_id, new.following_id) THEN
    RAISE EXCEPTION 'Cannot follow a blocked user or user who has blocked you';
  END IF;

  SELECT is_private INTO target_is_private FROM public.profiles WHERE id = new.following_id;
  IF target_is_private THEN
    new.status := 'pending'::public.follow_status_t;
  ELSE
    new.status := 'accepted'::public.follow_status_t;
  END IF;
  RETURN new;
END;
$$;

CREATE TRIGGER before_follow_insert
  BEFORE INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.handle_follow_insert();

-- Block deletes follows both directions
CREATE OR REPLACE FUNCTION public.handle_block_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.follows
  WHERE (follower_id = new.blocker_id AND following_id = new.blocked_id)
     OR (follower_id = new.blocked_id AND following_id = new.blocker_id);
  RETURN new;
END;
$$;

CREATE TRIGGER after_block_insert
  AFTER INSERT ON public.blocks
  FOR EACH ROW EXECUTE FUNCTION public.handle_block_insert();

-- 6. ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dish_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_photos ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles viewable per privacy and blocks"
  ON public.profiles FOR SELECT
  USING (
    id = (SELECT auth.uid()) OR (
      NOT public.is_blocked_between((SELECT auth.uid()), id) AND (
        discoverable OR public.can_view_profile_content((SELECT auth.uid()), id)
      )
    )
  );

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- Follows policies
CREATE POLICY "Follows select viewable if participant or permitted"
  ON public.follows FOR SELECT
  USING (
    (follower_id = (SELECT auth.uid()) OR following_id = (SELECT auth.uid()))
    OR (
      status = 'accepted'::public.follow_status_t
      AND public.can_view_profile_content((SELECT auth.uid()), following_id)
      AND NOT public.is_blocked_between((SELECT auth.uid()), follower_id)
    )
  );

CREATE POLICY "Users can insert follow as follower"
  ON public.follows FOR INSERT
  WITH CHECK (
    follower_id = (SELECT auth.uid())
    AND NOT public.is_blocked_between(follower_id, following_id)
  );

CREATE POLICY "Users can delete follows they are involved in"
  ON public.follows FOR DELETE
  USING (follower_id = (SELECT auth.uid()) OR following_id = (SELECT auth.uid()));

CREATE POLICY "Target user can update follow status"
  ON public.follows FOR UPDATE
  USING (following_id = (SELECT auth.uid()))
  WITH CHECK (following_id = (SELECT auth.uid()));

-- Blocks policies
CREATE POLICY "Users can view own blocks"
  ON public.blocks FOR SELECT
  USING (blocker_id = (SELECT auth.uid()));

CREATE POLICY "Users can block others"
  ON public.blocks FOR INSERT
  WITH CHECK (blocker_id = (SELECT auth.uid()));

CREATE POLICY "Users can unblock others"
  ON public.blocks FOR DELETE
  USING (blocker_id = (SELECT auth.uid()));

-- Food Categories policies
CREATE POLICY "Categories are readable by everyone"
  ON public.food_categories FOR SELECT
  USING (is_active = true);

-- Places policies (reference data)
CREATE POLICY "Places readable by everyone"
  ON public.places FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create places"
  ON public.places FOR INSERT
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Users can update places they created"
  ON public.places FOR UPDATE
  USING (created_by = (SELECT auth.uid()))
  WITH CHECK (created_by = (SELECT auth.uid()));

-- Dishes policies (reference data)
CREATE POLICY "Dishes readable by everyone"
  ON public.dishes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create dishes"
  ON public.dishes FOR INSERT
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Users can update dishes they created"
  ON public.dishes FOR UPDATE
  USING (created_by = (SELECT auth.uid()))
  WITH CHECK (created_by = (SELECT auth.uid()));

-- Dish Aliases policies
CREATE POLICY "Dish aliases readable by everyone"
  ON public.dish_aliases FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create dish aliases"
  ON public.dish_aliases FOR INSERT
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- Food Experiences policies
CREATE POLICY "Experiences viewable per authorization model"
  ON public.food_experiences FOR SELECT
  USING (public.can_view_experience((SELECT auth.uid()), id));

CREATE POLICY "Users can insert own food experiences"
  ON public.food_experiences FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own food experiences"
  ON public.food_experiences FOR UPDATE
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own food experiences"
  ON public.food_experiences FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- Experience Dishes policies
CREATE POLICY "Experience dishes viewable if experience is viewable"
  ON public.experience_dishes FOR SELECT
  USING (public.can_view_experience((SELECT auth.uid()), experience_id));

CREATE POLICY "Users can manage dishes for own experiences"
  ON public.experience_dishes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.food_experiences exp
      WHERE exp.id = experience_id AND exp.user_id = (SELECT auth.uid())
    )
  );

-- Experience Photos policies
CREATE POLICY "Experience photos viewable if experience is viewable"
  ON public.experience_photos FOR SELECT
  USING (public.can_view_experience((SELECT auth.uid()), experience_id));

CREATE POLICY "Users can manage photos for own experiences"
  ON public.experience_photos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.food_experiences exp
      WHERE exp.id = experience_id AND exp.user_id = (SELECT auth.uid())
    )
  );

-- 7. INDEXES (for performance and RLS efficiency)
CREATE INDEX idx_profiles_username_trgm ON public.profiles USING gin (username extensions.gin_trgm_ops);
CREATE INDEX idx_follows_following_status ON public.follows (following_id, status);
CREATE INDEX idx_follows_follower_status ON public.follows (follower_id, status);
CREATE INDEX idx_blocks_lookup ON public.blocks (blocker_id, blocked_id);
CREATE INDEX idx_experiences_user_eaten ON public.food_experiences (user_id, eaten_at DESC);
CREATE INDEX idx_experiences_user_published ON public.food_experiences (user_id, status, published_at DESC);
CREATE INDEX idx_experiences_public_published ON public.food_experiences (published_at DESC)
  WHERE status = 'published' AND visibility = 'public';
CREATE INDEX idx_experiences_tsv ON public.food_experiences USING gin (search_tsv);
CREATE INDEX idx_dishes_normalized_name ON public.dishes USING gin (normalized_name extensions.gin_trgm_ops);
CREATE INDEX idx_places_normalized_name ON public.places USING gin (normalized_name extensions.gin_trgm_ops);
CREATE INDEX idx_exp_dishes_exp_id ON public.experience_dishes (experience_id);
CREATE INDEX idx_exp_photos_exp_id ON public.experience_photos (experience_id);

-- 8. SECURITY INVOKER VIEWS
CREATE OR REPLACE VIEW public.dish_public_stats
WITH (security_invoker = true)
AS
SELECT
  d.id AS dish_id,
  count(DISTINCT ed.id) AS public_experience_count,
  count(ed.rating) AS public_rating_count,
  round(avg(ed.rating), 2) AS public_rating_avg
FROM public.dishes d
LEFT JOIN public.experience_dishes ed ON d.id = ed.dish_id
LEFT JOIN public.food_experiences fe ON ed.experience_id = fe.id
LEFT JOIN public.profiles p ON fe.user_id = p.id
WHERE fe.status = 'published'
  AND fe.visibility = 'public'
  AND NOT p.is_private
GROUP BY d.id;

CREATE OR REPLACE VIEW public.place_public_stats
WITH (security_invoker = true)
AS
SELECT
  pl.id AS place_id,
  count(DISTINCT fe.id) AS public_experience_count,
  round(avg(fe.overall_rating), 2) AS public_rating_avg
FROM public.places pl
LEFT JOIN public.food_experiences fe ON pl.id = fe.place_id
LEFT JOIN public.profiles p ON fe.user_id = p.id
WHERE fe.status = 'published'
  AND fe.visibility = 'public'
  AND NOT p.is_private
GROUP BY pl.id;
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
-- ==============================================================================
-- MORS Database Migration: 20261110000003_storage_and_helpers.sql
-- Phase 4: Storage buckets configuration, storage security policies, and search helpers
-- ==============================================================================

-- 1. Storage Buckets configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('experience-photos', 'experience-photos', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('avatars', 'avatars', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Storage RLS Policies for experience-photos (Private bucket)
-- Upload policy: Users can only upload photos to their own user directory: <uid>/<filename>
DROP POLICY IF EXISTS "Users can upload experience photos to own folder" ON storage.objects;
CREATE POLICY "Users can upload experience photos to own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'experience-photos' AND
    (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  );

-- Select policy: Photos are downloadable/viewable only if the viewer has permission to view the experience
DROP POLICY IF EXISTS "Experience photos viewable per authorization" ON storage.objects;
CREATE POLICY "Experience photos viewable per authorization"
  ON storage.objects FOR SELECT
  TO authenticated, anon
  USING (
    bucket_id = 'experience-photos' AND (
      -- Uploader can always view their own uploaded files
      (storage.foldername(name))[1] = (SELECT auth.uid()::text)
      OR
      -- Or through the experience viewing rules
      EXISTS (
        SELECT 1 FROM public.experience_photos ep
        JOIN public.food_experiences fe ON ep.experience_id = fe.id
        WHERE ep.storage_path = name
          AND public.can_view_experience((SELECT auth.uid()), fe.id)
      )
    )
  );

-- Delete policy: Users can delete their own uploaded photos
DROP POLICY IF EXISTS "Users can delete own experience photos" ON storage.objects;
CREATE POLICY "Users can delete own experience photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'experience-photos' AND
    (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  );

-- 3. Storage RLS Policies for avatars
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  );

DROP POLICY IF EXISTS "Avatars viewable per profile visibility" ON storage.objects;
CREATE POLICY "Avatars viewable per profile visibility"
  ON storage.objects FOR SELECT
  TO authenticated, anon
  USING (
    bucket_id = 'avatars' AND (
      (storage.foldername(name))[1] = (SELECT auth.uid()::text)
      OR
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id::text = (storage.foldername(name))[1]
          AND public.can_view_profile_content((SELECT auth.uid()), p.id)
      )
    )
  );

DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  );
-- ==============================================================================
-- MORS Database Migration: 20261110000004_diary_rpcs.sql
-- Phase 5: Calendar Month Summary & On-This-Day Memory RPCs
-- ==============================================================================

-- 1. GET_CALENDAR_MONTH_SUMMARY
-- Returns day of month, count of meals logged, and primary photo thumbnail path
CREATE OR REPLACE FUNCTION public.get_calendar_month_summary(
  p_user_id uuid,
  p_year integer,
  p_month integer
)
RETURNS TABLE (
  day integer,
  count bigint,
  thumbnail_path text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_start_date timestamptz;
  v_end_date timestamptz;
BEGIN
  v_start_date := make_timestamptz(p_year, p_month, 1, 0, 0, 0, 'UTC');
  v_end_date := v_start_date + interval '1 month';

  RETURN QUERY
  WITH user_month_experiences AS (
    SELECT
      fe.id,
      EXTRACT(DAY FROM fe.eaten_at AT TIME ZONE 'UTC')::integer AS exp_day,
      fe.eaten_at
    FROM public.food_experiences fe
    WHERE fe.user_id = p_user_id
      AND fe.eaten_at >= v_start_date
      AND fe.eaten_at < v_end_date
      AND public.can_view_experience((SELECT auth.uid()), fe.id)
  ),
  day_counts AS (
    SELECT
      exp_day,
      count(*)::bigint AS meal_count
    FROM user_month_experiences
    GROUP BY exp_day
  ),
  day_photos AS (
    SELECT DISTINCT ON (ume.exp_day)
      ume.exp_day,
      ep.storage_path
    FROM user_month_experiences ume
    JOIN public.experience_photos ep ON ume.id = ep.experience_id
    ORDER BY ume.exp_day, ep.position ASC
  )
  SELECT
    dc.exp_day AS day,
    dc.meal_count AS count,
    dp.storage_path AS thumbnail_path
  FROM day_counts dc
  LEFT JOIN day_photos dp ON dc.exp_day = dp.exp_day
  ORDER BY dc.exp_day ASC;
END;
$$;

-- 2. GET_ON_THIS_DAY_MEMORY
-- Returns an experience logged on today's calendar date in previous years
CREATE OR REPLACE FUNCTION public.get_on_this_day_memory(
  p_user_id uuid
)
RETURNS TABLE (
  experience_id uuid,
  title text,
  dish_name text,
  years_ago integer,
  thumbnail_path text,
  rating smallint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    fe.id AS experience_id,
    fe.title,
    (SELECT ed.display_name FROM public.experience_dishes ed WHERE ed.experience_id = fe.id ORDER BY ed.position ASC LIMIT 1) AS dish_name,
    (EXTRACT(YEAR FROM now()) - EXTRACT(YEAR FROM fe.eaten_at))::integer AS years_ago,
    (SELECT ep.storage_path FROM public.experience_photos ep WHERE ep.experience_id = fe.id ORDER BY ep.position ASC LIMIT 1) AS thumbnail_path,
    fe.overall_rating AS rating
  FROM public.food_experiences fe
  WHERE fe.user_id = p_user_id
    AND EXTRACT(MONTH FROM fe.eaten_at) = EXTRACT(MONTH FROM now())
    AND EXTRACT(DAY FROM fe.eaten_at) = EXTRACT(DAY FROM now())
    AND EXTRACT(YEAR FROM fe.eaten_at) < EXTRACT(YEAR FROM now())
    AND public.can_view_experience((SELECT auth.uid()), fe.id)
  ORDER BY fe.eaten_at DESC
  LIMIT 1;
END;
$$;
-- ==============================================================================
-- MORS Database Migration: 20261110000005_canonical_merges.sql
-- Phase 6: Canonical Dishe/Place Merges & Trigram Fuzzy Matchers
-- ==============================================================================

-- 1. MERGE_DISHES RPC
CREATE OR REPLACE FUNCTION public.merge_dishes(
  p_source_id uuid,
  p_target_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_source record;
  v_target record;
  v_user_id uuid;
  v_user_role public.user_role_t;
BEGIN
  v_user_id := (SELECT auth.uid());
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT role INTO v_user_role FROM public.profiles WHERE id = v_user_id;

  IF p_source_id = p_target_id THEN
    RAISE EXCEPTION 'Cannot merge a dish into itself';
  END IF;

  SELECT * INTO v_source FROM public.dishes WHERE id = p_source_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Source dish not found';
  END IF;

  SELECT * INTO v_target FROM public.dishes WHERE id = p_target_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target dish not found';
  END IF;

  -- Only admin/moderator or the creator can merge
  IF v_user_role NOT IN ('admin', 'moderator') AND v_source.created_by <> v_user_id THEN
    RAISE EXCEPTION 'Insufficient permissions to merge dishes';
  END IF;

  -- 1. Re-point references in experience_dishes
  UPDATE public.experience_dishes
  SET dish_id = p_target_id
  WHERE dish_id = p_source_id;

  -- 2. Add source name and its aliases to target as aliases
  INSERT INTO public.dish_aliases (dish_id, alias, normalized_alias)
  VALUES (p_target_id, v_source.name, v_source.normalized_name)
  ON CONFLICT DO NOTHING;

  UPDATE public.dish_aliases
  SET dish_id = p_target_id
  WHERE dish_id = p_source_id;

  -- 3. Mark source dish as merged
  UPDATE public.dishes
  SET merged_into_id = p_target_id
  WHERE id = p_source_id;

  RETURN true;
END;
$$;

-- 2. MERGE_PLACES RPC
CREATE OR REPLACE FUNCTION public.merge_places(
  p_source_id uuid,
  p_target_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_source record;
  v_target record;
  v_user_id uuid;
  v_user_role public.user_role_t;
BEGIN
  v_user_id := (SELECT auth.uid());
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT role INTO v_user_role FROM public.profiles WHERE id = v_user_id;

  IF p_source_id = p_target_id THEN
    RAISE EXCEPTION 'Cannot merge a place into itself';
  END IF;

  SELECT * INTO v_source FROM public.places WHERE id = p_source_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Source place not found';
  END IF;

  SELECT * INTO v_target FROM public.places WHERE id = p_target_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target place not found';
  END IF;

  IF v_user_role NOT IN ('admin', 'moderator') AND v_source.created_by <> v_user_id THEN
    RAISE EXCEPTION 'Insufficient permissions to merge places';
  END IF;

  -- 1. Re-point references in food_experiences
  UPDATE public.food_experiences
  SET place_id = p_target_id
  WHERE place_id = p_source_id;

  -- 2. Re-point child branches
  UPDATE public.places
  SET parent_place_id = p_target_id
  WHERE parent_place_id = p_source_id;

  -- 3. Mark source place as merged
  UPDATE public.places
  SET merged_into_id = p_target_id
  WHERE id = p_source_id;

  RETURN true;
END;
$$;

-- 3. FIND_SIMILAR_DISHES (Trigram Fuzzy Matcher)
CREATE OR REPLACE FUNCTION public.find_similar_dishes(
  p_name text,
  p_threshold real DEFAULT 0.3
)
RETURNS TABLE (
  dish_id uuid,
  name text,
  slug text,
  similarity real
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_normalized text;
BEGIN
  v_normalized := lower(regexp_replace(p_name, '[^a-zA-Z0-9]', '', 'g'));

  RETURN QUERY
  SELECT
    d.id AS dish_id,
    d.name,
    d.slug,
    extensions.similarity(d.normalized_name, v_normalized) AS similarity
  FROM public.dishes d
  WHERE d.merged_into_id IS NULL
    AND extensions.similarity(d.normalized_name, v_normalized) >= p_threshold
  ORDER BY similarity DESC
  LIMIT 5;
END;
$$;

-- 4. FIND_SIMILAR_PLACES (Trigram Fuzzy Matcher)
CREATE OR REPLACE FUNCTION public.find_similar_places(
  p_name text,
  p_city text DEFAULT NULL,
  p_threshold real DEFAULT 0.3
)
RETURNS TABLE (
  place_id uuid,
  name text,
  city text,
  similarity real
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_normalized text;
BEGIN
  v_normalized := lower(regexp_replace(p_name, '[^a-zA-Z0-9]', '', 'g'));

  RETURN QUERY
  SELECT
    pl.id AS place_id,
    pl.name,
    pl.city,
    extensions.similarity(pl.normalized_name, v_normalized) AS similarity
  FROM public.places pl
  WHERE pl.merged_into_id IS NULL
    AND extensions.similarity(pl.normalized_name, v_normalized) >= p_threshold
    AND (p_city IS NULL OR pl.city ILIKE ('%' || p_city || '%'))
  ORDER BY similarity DESC
  LIMIT 5;
END;
$$;
-- ==============================================================================
-- MORS Database Migration: 20261110000006_social_and_home_feed.sql
-- Phase 7: Social Graph, Follow Requests, Blocking, and Chronological Home Feed
-- ==============================================================================

-- 1. GET_HOME_FEED RPC (Strictly chronological, keyset paginated)
CREATE OR REPLACE FUNCTION public.get_home_feed(
  p_cursor_published_at timestamptz DEFAULT NULL,
  p_cursor_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 15
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  title text,
  category_slug text,
  eaten_at timestamptz,
  published_at timestamptz,
  visibility public.visibility_t,
  overall_rating smallint,
  description text,
  place_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_viewer_id uuid;
BEGIN
  v_viewer_id := (SELECT auth.uid());

  RETURN QUERY
  SELECT
    fe.id,
    fe.user_id,
    fe.title,
    fe.category_slug,
    fe.eaten_at,
    fe.published_at,
    fe.visibility,
    fe.overall_rating,
    fe.description,
    fe.place_id
  FROM public.food_experiences fe
  WHERE fe.status = 'published'
    AND fe.published_at IS NOT NULL
    AND public.can_view_experience(v_viewer_id, fe.id)
    AND (
      -- If viewer is authenticated: own posts OR posts of accepted followed users
      (v_viewer_id IS NOT NULL AND (
        fe.user_id = v_viewer_id
        OR EXISTS (
          SELECT 1 FROM public.follows f
          WHERE f.follower_id = v_viewer_id
            AND f.following_id = fe.user_id
            AND f.status = 'accepted'
        )
      ))
      OR
      -- If unauthenticated or no follows: public posts from public profiles
      (v_viewer_id IS NULL AND fe.visibility = 'public' AND NOT EXISTS (
        SELECT 1 FROM public.profiles p WHERE p.id = fe.user_id AND p.is_private
      ))
    )
    -- Keyset pagination on (published_at DESC, id DESC)
    AND (
      p_cursor_published_at IS NULL
      OR (fe.published_at < p_cursor_published_at)
      OR (fe.published_at = p_cursor_published_at AND fe.id < p_cursor_id)
    )
  ORDER BY fe.published_at DESC, fe.id DESC
  LIMIT p_limit;
END;
$$;

-- 2. FOLLOW_USER RPC
CREATE OR REPLACE FUNCTION public.follow_user(p_target_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_viewer_id uuid;
  v_is_target_private boolean;
  v_status public.follow_status_t;
BEGIN
  v_viewer_id := (SELECT auth.uid());
  IF v_viewer_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF v_viewer_id = p_target_id THEN
    RAISE EXCEPTION 'You cannot follow yourself';
  END IF;

  IF public.is_blocked_between(v_viewer_id, p_target_id) THEN
    RAISE EXCEPTION 'Action blocked';
  END IF;

  SELECT is_private INTO v_is_target_private
  FROM public.profiles
  WHERE id = p_target_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  v_status := CASE WHEN v_is_target_private THEN 'pending'::public.follow_status_t ELSE 'accepted'::public.follow_status_t END;

  INSERT INTO public.follows (follower_id, following_id, status)
  VALUES (v_viewer_id, p_target_id, v_status)
  ON CONFLICT (follower_id, following_id) DO UPDATE
  SET status = EXCLUDED.status;

  -- Update counters if accepted
  IF v_status = 'accepted' THEN
    UPDATE public.profiles SET following_count = following_count + 1 WHERE id = v_viewer_id;
    UPDATE public.profiles SET followers_count = followers_count + 1 WHERE id = p_target_id;
  END IF;

  RETURN v_status::text;
END;
$$;

-- 3. UNFOLLOW_USER RPC
CREATE OR REPLACE FUNCTION public.unfollow_user(p_target_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_viewer_id uuid;
  v_old_status public.follow_status_t;
BEGIN
  v_viewer_id := (SELECT auth.uid());
  IF v_viewer_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT status INTO v_old_status
  FROM public.follows
  WHERE follower_id = v_viewer_id AND following_id = p_target_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  DELETE FROM public.follows
  WHERE follower_id = v_viewer_id AND following_id = p_target_id;

  IF v_old_status = 'accepted' THEN
    UPDATE public.profiles SET following_count = greatest(0, following_count - 1) WHERE id = v_viewer_id;
    UPDATE public.profiles SET followers_count = greatest(0, followers_count - 1) WHERE id = p_target_id;
  END IF;

  RETURN true;
END;
$$;

-- 4. RESPOND_FOLLOW_REQUEST RPC
CREATE OR REPLACE FUNCTION public.respond_follow_request(
  p_follower_id uuid,
  p_accept boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_viewer_id uuid;
BEGIN
  v_viewer_id := (SELECT auth.uid());
  IF v_viewer_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_accept THEN
    UPDATE public.follows
    SET status = 'accepted'
    WHERE follower_id = p_follower_id AND following_id = v_viewer_id AND status = 'pending';

    IF FOUND THEN
      UPDATE public.profiles SET following_count = following_count + 1 WHERE id = p_follower_id;
      UPDATE public.profiles SET followers_count = followers_count + 1 WHERE id = v_viewer_id;
    END IF;
  ELSE
    DELETE FROM public.follows
    WHERE follower_id = p_follower_id AND following_id = v_viewer_id AND status = 'pending';
  END IF;

  RETURN true;
END;
$$;

-- 5. BLOCK_USER RPC
CREATE OR REPLACE FUNCTION public.block_user(p_target_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_viewer_id uuid;
BEGIN
  v_viewer_id := (SELECT auth.uid());
  IF v_viewer_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF v_viewer_id = p_target_id THEN
    RAISE EXCEPTION 'You cannot block yourself';
  END IF;

  -- Insert block (triggers automatic removal of follows in both directions)
  INSERT INTO public.blocks (blocker_id, blocked_id)
  VALUES (v_viewer_id, p_target_id)
  ON CONFLICT DO NOTHING;

  RETURN true;
END;
$$;

-- 6. UNBLOCK_USER RPC
CREATE OR REPLACE FUNCTION public.unblock_user(p_target_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_viewer_id uuid;
BEGIN
  v_viewer_id := (SELECT auth.uid());
  IF v_viewer_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  DELETE FROM public.blocks
  WHERE blocker_id = v_viewer_id AND blocked_id = p_target_id;

  RETURN true;
END;
$$;

-- 7. GET_SUGGESTED_PROFILES (Cold start recommendations)
CREATE OR REPLACE FUNCTION public.get_suggested_profiles(p_limit integer DEFAULT 5)
RETURNS TABLE (
  id uuid,
  username text,
  display_name text,
  avatar_path text,
  bio text,
  experiences_count integer,
  followers_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_viewer_id uuid;
BEGIN
  v_viewer_id := (SELECT auth.uid());

  RETURN QUERY
  SELECT
    p.id,
    p.username,
    p.display_name,
    p.avatar_path,
    p.bio,
    p.experiences_count,
    p.followers_count
  FROM public.profiles p
  WHERE NOT p.is_private
    AND (v_viewer_id IS NULL OR (
      p.id <> v_viewer_id
      AND NOT public.is_blocked_between(v_viewer_id, p.id)
      AND NOT EXISTS (
        SELECT 1 FROM public.follows f
        WHERE f.follower_id = v_viewer_id AND f.following_id = p.id
      )
    ))
  ORDER BY p.experiences_count DESC, p.followers_count DESC
  LIMIT p_limit;
END;
$$;
-- ==============================================================================
-- MORS Database Migration: 20261110000007_engagement_notifications.sql
-- Phase 8: Engagement (Likes, Comments), In-App Notifications, and Content Reporting
-- ==============================================================================

-- 1. EXPERIENCE_LIKES TABLE
CREATE TABLE public.experience_likes (
  experience_id uuid NOT NULL REFERENCES public.food_experiences(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (experience_id, user_id)
);

ALTER TABLE public.experience_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes viewable if experience is viewable"
  ON public.experience_likes FOR SELECT
  USING (public.can_view_experience((SELECT auth.uid()), experience_id));

CREATE POLICY "Authenticated users can like viewable experiences"
  ON public.experience_likes FOR INSERT
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND public.can_view_experience((SELECT auth.uid()), experience_id)
  );

CREATE POLICY "Users can remove own likes"
  ON public.experience_likes FOR DELETE
  USING (user_id = (SELECT auth.uid()));

CREATE INDEX idx_exp_likes_exp_id ON public.experience_likes (experience_id);
CREATE INDEX idx_exp_likes_user_id ON public.experience_likes (user_id);


-- 2. EXPERIENCE_COMMENTS TABLE
CREATE TABLE public.experience_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id uuid NOT NULL REFERENCES public.food_experiences(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (length(trim(body)) > 0 AND length(body) <= 1000),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.experience_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments viewable if experience is viewable and not blocked"
  ON public.experience_comments FOR SELECT
  USING (
    public.can_view_experience((SELECT auth.uid()), experience_id)
    AND NOT public.is_blocked_between((SELECT auth.uid()), user_id)
  );

CREATE POLICY "Users can comment on viewable experiences"
  ON public.experience_comments FOR INSERT
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND public.can_view_experience((SELECT auth.uid()), experience_id)
  );

CREATE POLICY "Users can update own comments"
  ON public.experience_comments FOR UPDATE
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users or experience authors can delete comments"
  ON public.experience_comments FOR DELETE
  USING (
    user_id = (SELECT auth.uid())
    OR (SELECT fe.user_id FROM public.food_experiences fe WHERE fe.id = experience_id) = (SELECT auth.uid())
  );

CREATE INDEX idx_exp_comments_exp_id ON public.experience_comments (experience_id, created_at ASC);
CREATE INDEX idx_exp_comments_user_id ON public.experience_comments (user_id);


-- 3. NOTIFICATIONS TABLE
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type public.notification_t NOT NULL,
  experience_id uuid REFERENCES public.food_experiences(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES public.experience_comments(id) ON DELETE CASCADE,
  is_read boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Notifications strictly viewable by recipient"
  ON public.notifications FOR SELECT
  USING (recipient_id = (SELECT auth.uid()));

CREATE POLICY "Notifications insertable by authenticated actors"
  ON public.notifications FOR INSERT
  WITH CHECK (
    actor_id = (SELECT auth.uid())
    AND recipient_id <> (SELECT auth.uid())
  );

CREATE POLICY "Recipients can update read status"
  ON public.notifications FOR UPDATE
  USING (recipient_id = (SELECT auth.uid()))
  WITH CHECK (recipient_id = (SELECT auth.uid()));

CREATE POLICY "Recipients can delete own notifications"
  ON public.notifications FOR DELETE
  USING (recipient_id = (SELECT auth.uid()));

CREATE INDEX idx_notifications_recipient ON public.notifications (recipient_id, is_read, created_at DESC);


-- 4. REPORTS TABLE
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type public.report_target_t NOT NULL,
  target_id uuid NOT NULL,
  reason text NOT NULL CHECK (length(trim(reason)) > 0),
  details text,
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'reviewed', 'actioned')),
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can file reports"
  ON public.reports FOR INSERT
  WITH CHECK (reporter_id = (SELECT auth.uid()));

CREATE POLICY "Users can view own filed reports or moderators"
  ON public.reports FOR SELECT
  USING (
    reporter_id = (SELECT auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('moderator', 'admin')
  );

CREATE INDEX idx_reports_lookup ON public.reports (target_type, target_id);
CREATE INDEX idx_reports_reporter ON public.reports (reporter_id);


-- 5. ATOMIC HELPER RPCS

-- TOGGLE_EXPERIENCE_LIKE
CREATE OR REPLACE FUNCTION public.toggle_experience_like(p_experience_id uuid)
RETURNS TABLE (liked boolean, total_likes bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_exp_author uuid;
  v_already_liked boolean;
  v_count bigint;
BEGIN
  v_user_id := (SELECT auth.uid());
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT public.can_view_experience(v_user_id, p_experience_id) THEN
    RAISE EXCEPTION 'You do not have permission to view this experience';
  END IF;

  SELECT user_id INTO v_exp_author
  FROM public.food_experiences
  WHERE id = p_experience_id;

  SELECT EXISTS (
    SELECT 1 FROM public.experience_likes
    WHERE experience_id = p_experience_id AND user_id = v_user_id
  ) INTO v_already_liked;

  IF v_already_liked THEN
    DELETE FROM public.experience_likes
    WHERE experience_id = p_experience_id AND user_id = v_user_id;

    -- Remove notification if unread
    DELETE FROM public.notifications
    WHERE recipient_id = v_exp_author AND actor_id = v_user_id AND experience_id = p_experience_id AND type = 'like';

    SELECT count(*) INTO v_count FROM public.experience_likes WHERE experience_id = p_experience_id;
    RETURN QUERY SELECT false AS liked, v_count AS total_likes;
  ELSE
    INSERT INTO public.experience_likes (experience_id, user_id)
    VALUES (p_experience_id, v_user_id);

    -- Notify author if not self
    IF v_exp_author <> v_user_id THEN
      INSERT INTO public.notifications (recipient_id, actor_id, type, experience_id)
      VALUES (v_exp_author, v_user_id, 'like', p_experience_id);
    END IF;

    SELECT count(*) INTO v_count FROM public.experience_likes WHERE experience_id = p_experience_id;
    RETURN QUERY SELECT true AS liked, v_count AS total_likes;
  END IF;
END;
$$;

-- ADD_EXPERIENCE_COMMENT
CREATE OR REPLACE FUNCTION public.add_experience_comment(
  p_experience_id uuid,
  p_body text
)
RETURNS TABLE (
  comment_id uuid,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_exp_author uuid;
  v_new_id uuid;
  v_created_at timestamptz;
BEGIN
  v_user_id := (SELECT auth.uid());
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT public.can_view_experience(v_user_id, p_experience_id) THEN
    RAISE EXCEPTION 'You do not have permission to comment on this experience';
  END IF;

  SELECT user_id INTO v_exp_author
  FROM public.food_experiences
  WHERE id = p_experience_id;

  INSERT INTO public.experience_comments (experience_id, user_id, body)
  VALUES (p_experience_id, v_user_id, trim(p_body))
  RETURNING id, experience_comments.created_at INTO v_new_id, v_created_at;

  -- Notify author if not self
  IF v_exp_author <> v_user_id THEN
    INSERT INTO public.notifications (recipient_id, actor_id, type, experience_id, comment_id)
    VALUES (v_exp_author, v_user_id, 'comment', p_experience_id, v_new_id);
  END IF;

  RETURN QUERY SELECT v_new_id, v_created_at;
END;
$$;

-- MARK_NOTIFICATIONS_READ
CREATE OR REPLACE FUNCTION public.mark_notifications_read(p_ids uuid[] DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := (SELECT auth.uid());
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_ids IS NULL OR array_length(p_ids, 1) = 0 THEN
    UPDATE public.notifications
    SET is_read = true
    WHERE recipient_id = v_user_id AND NOT is_read;
  ELSE
    UPDATE public.notifications
    SET is_read = true
    WHERE recipient_id = v_user_id AND id = ANY(p_ids);
  END IF;

  RETURN true;
END;
$$;
-- MORS Database Migration: Collections (Phase 9)
-- Migration: 20261110000008_collections.sql

-- 1. Collections Table
CREATE TABLE public.collections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL CHECK (char_length(trim(name)) >= 1 AND char_length(name) <= 100),
    description text CHECK (description IS NULL OR char_length(description) <= 1000),
    cover_photo_path text,
    visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'unlisted')),
    share_token text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
    is_wishlist boolean NOT NULL DEFAULT false,
    items_count integer NOT NULL DEFAULT 0 CHECK (items_count >= 0),
    likes_count integer NOT NULL DEFAULT 0 CHECK (likes_count >= 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Unique index to ensure at most one wishlist per user
CREATE UNIQUE INDEX idx_collections_user_wishlist ON public.collections(user_id) WHERE is_wishlist = true;
CREATE INDEX idx_collections_user_id ON public.collections(user_id);
CREATE INDEX idx_collections_visibility ON public.collections(visibility);
CREATE INDEX idx_collections_share_token ON public.collections(share_token);

-- 2. Collection Items Table (Polymorphic: Experience, Dish, Place)
CREATE TABLE public.collection_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id uuid NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
    item_type text NOT NULL CHECK (item_type IN ('experience', 'dish', 'place')),
    experience_id uuid REFERENCES public.food_experiences(id) ON DELETE CASCADE,
    dish_id uuid REFERENCES public.dishes(id) ON DELETE CASCADE,
    place_id uuid REFERENCES public.places(id) ON DELETE CASCADE,
    note text CHECK (note IS NULL OR char_length(note) <= 500),
    position double precision NOT NULL DEFAULT 1.0,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT check_item_reference CHECK (
        (item_type = 'experience' AND experience_id IS NOT NULL AND dish_id IS NULL AND place_id IS NULL) OR
        (item_type = 'dish' AND dish_id IS NOT NULL AND experience_id IS NULL AND place_id IS NULL) OR
        (item_type = 'place' AND place_id IS NOT NULL AND experience_id IS NULL AND dish_id IS NULL)
    ),
    CONSTRAINT uq_collection_experience UNIQUE NULLS NOT DISTINCT (collection_id, experience_id),
    CONSTRAINT uq_collection_dish UNIQUE NULLS NOT DISTINCT (collection_id, dish_id),
    CONSTRAINT uq_collection_place UNIQUE NULLS NOT DISTINCT (collection_id, place_id)
);

CREATE INDEX idx_collection_items_collection_id ON public.collection_items(collection_id);
CREATE INDEX idx_collection_items_experience_id ON public.collection_items(experience_id);
CREATE INDEX idx_collection_items_dish_id ON public.collection_items(dish_id);
CREATE INDEX idx_collection_items_place_id ON public.collection_items(place_id);
CREATE INDEX idx_collection_items_ordering ON public.collection_items(collection_id, position ASC);

-- 3. Collection Likes Table
CREATE TABLE public.collection_likes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id uuid NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_collection_user_like UNIQUE (collection_id, user_id)
);

CREATE INDEX idx_collection_likes_collection ON public.collection_likes(collection_id);
CREATE INDEX idx_collection_likes_user ON public.collection_likes(user_id);

-- 4. Security Definer Helper for Collection Visibility Check
CREATE OR REPLACE FUNCTION public.can_view_collection(
    viewer_id uuid,
    target_collection_id uuid,
    req_token text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    coll_owner_id uuid;
    coll_vis text;
    coll_token text;
    owner_is_priv boolean;
BEGIN
    SELECT user_id, visibility, share_token
    INTO coll_owner_id, coll_vis, coll_token
    FROM public.collections
    WHERE id = target_collection_id;

    IF coll_owner_id IS NULL THEN
        RETURN false;
    END IF;

    -- Owner can always view
    IF viewer_id IS NOT NULL AND coll_owner_id = viewer_id THEN
        RETURN true;
    END IF;

    -- Block check (bidirectional)
    IF viewer_id IS NOT NULL AND public.is_blocked_bidirectional(viewer_id, coll_owner_id) THEN
        RETURN false;
    END IF;

    -- Private collections: strictly owner only
    IF coll_vis = 'private' THEN
        RETURN false;
    END IF;

    -- Unlisted collections: requires matching secret token
    IF coll_vis = 'unlisted' THEN
        RETURN (req_token IS NOT NULL AND req_token = coll_token);
    END IF;

    -- Public collections: effective visibility respects profile privacy
    IF coll_vis = 'public' THEN
        SELECT is_private INTO owner_is_priv FROM public.profiles WHERE id = coll_owner_id;
        IF owner_is_priv IS TRUE THEN
            -- Only accepted followers can view
            IF viewer_id IS NULL THEN
                RETURN false;
            END IF;
            RETURN public.is_following(viewer_id, coll_owner_id);
        END IF;
        RETURN true;
    END IF;

    RETURN false;
END;
$$;

-- 5. Enable RLS on all 3 tables
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_likes ENABLE ROW LEVEL SECURITY;

-- 6. Collections RLS Policies
CREATE POLICY "collections_select_policy"
ON public.collections
FOR SELECT
USING (
    user_id = (SELECT auth.uid()) OR
    public.can_view_collection((SELECT auth.uid()), id)
);

CREATE POLICY "collections_insert_policy"
ON public.collections
FOR INSERT
WITH CHECK (
    user_id = (SELECT auth.uid())
);

CREATE POLICY "collections_update_policy"
ON public.collections
FOR UPDATE
USING (
    user_id = (SELECT auth.uid())
)
WITH CHECK (
    user_id = (SELECT auth.uid())
);

CREATE POLICY "collections_delete_policy"
ON public.collections
FOR DELETE
USING (
    user_id = (SELECT auth.uid())
);

-- 7. Collection Items RLS Policies
-- Non-negotiable: A public collection containing someone's private entry shows that entry only to its owner.
CREATE POLICY "collection_items_select_policy"
ON public.collection_items
FOR SELECT
USING (
    public.can_view_collection((SELECT auth.uid()), collection_id) AND (
        item_type IN ('dish', 'place') OR
        (item_type = 'experience' AND experience_id IS NOT NULL AND public.can_view_experience((SELECT auth.uid()), experience_id))
    )
);

CREATE POLICY "collection_items_insert_policy"
ON public.collection_items
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.collections c
        WHERE c.id = collection_id AND c.user_id = (SELECT auth.uid())
    )
);

CREATE POLICY "collection_items_update_policy"
ON public.collection_items
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.collections c
        WHERE c.id = collection_id AND c.user_id = (SELECT auth.uid())
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.collections c
        WHERE c.id = collection_id AND c.user_id = (SELECT auth.uid())
    )
);

CREATE POLICY "collection_items_delete_policy"
ON public.collection_items
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.collections c
        WHERE c.id = collection_id AND c.user_id = (SELECT auth.uid())
    )
);

-- 8. Collection Likes RLS Policies
CREATE POLICY "collection_likes_select_policy"
ON public.collection_likes
FOR SELECT
USING (
    public.can_view_collection((SELECT auth.uid()), collection_id)
);

CREATE POLICY "collection_likes_insert_policy"
ON public.collection_likes
FOR INSERT
WITH CHECK (
    user_id = (SELECT auth.uid()) AND
    public.can_view_collection((SELECT auth.uid()), collection_id)
);

CREATE POLICY "collection_likes_delete_policy"
ON public.collection_likes
FOR DELETE
USING (
    user_id = (SELECT auth.uid())
);

-- 9. Triggers for Counts Maintenance
CREATE OR REPLACE FUNCTION public.handle_collection_item_count_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.collections
        SET items_count = items_count + 1, updated_at = now()
        WHERE id = NEW.collection_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.collections
        SET items_count = GREATEST(items_count - 1, 0), updated_at = now()
        WHERE id = OLD.collection_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER on_collection_item_count_change
AFTER INSERT OR DELETE ON public.collection_items
FOR EACH ROW EXECUTE FUNCTION public.handle_collection_item_count_sync();

CREATE OR REPLACE FUNCTION public.handle_collection_likes_count_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.collections
        SET likes_count = likes_count + 1
        WHERE id = NEW.collection_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.collections
        SET likes_count = GREATEST(likes_count - 1, 0)
        WHERE id = OLD.collection_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER on_collection_likes_count_change
AFTER INSERT OR DELETE ON public.collection_likes
FOR EACH ROW EXECUTE FUNCTION public.handle_collection_likes_count_sync();

-- 10. RPCs for Collections Operations
CREATE OR REPLACE FUNCTION public.get_or_create_wishlist(user_uuid uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    wishlist_id uuid;
BEGIN
    SELECT id INTO wishlist_id
    FROM public.collections
    WHERE user_id = user_uuid AND is_wishlist = true;

    IF wishlist_id IS NULL THEN
        INSERT INTO public.collections (
            user_id,
            name,
            description,
            visibility,
            is_wishlist
        ) VALUES (
            user_uuid,
            'Want to try',
            'Dishes and places I am excited to experience soon.',
            'private',
            true
        ) RETURNING id INTO wishlist_id;
    END IF;

    RETURN wishlist_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.toggle_collection_like(coll_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    curr_user uuid;
    exists_id uuid;
    new_liked boolean;
    total_likes integer;
BEGIN
    curr_user := auth.uid();
    IF curr_user IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF NOT public.can_view_collection(curr_user, coll_id) THEN
        RAISE EXCEPTION 'Collection not found or access denied';
    END IF;

    SELECT id INTO exists_id
    FROM public.collection_likes
    WHERE collection_id = coll_id AND user_id = curr_user;

    IF exists_id IS NOT NULL THEN
        DELETE FROM public.collection_likes WHERE id = exists_id;
        new_liked := false;
    ELSE
        INSERT INTO public.collection_likes (collection_id, user_id)
        VALUES (coll_id, curr_user);
        new_liked := true;
    END IF;

    SELECT likes_count INTO total_likes
    FROM public.collections
    WHERE id = coll_id;

    RETURN jsonb_build_object(
        'liked', new_liked,
        'likesCount', total_likes
    );
END;
$$;
-- MORS Database Migration: Full-text & Trigram Search (Phase 10)
-- Migration: 20261110000009_search.sql

-- 1. Trigram and FTS Indexes
CREATE INDEX IF NOT EXISTS idx_dishes_canonical_name_trgm 
ON public.dishes USING gin (canonical_name extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_places_name_trgm 
ON public.places USING gin (name extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_places_city_trgm 
ON public.places USING gin (city extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_experiences_title_trgm 
ON public.food_experiences USING gin (title extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_collections_name_trgm 
ON public.collections USING gin (name extensions.gin_trgm_ops);

-- 2. Unified Search Function (SECURITY INVOKER)
CREATE OR REPLACE FUNCTION public.search_all(
    p_query text,
    p_types text[] DEFAULT NULL,
    p_city text DEFAULT NULL,
    p_limit integer DEFAULT 25
)
RETURNS TABLE (
    result_type text,
    id text,
    title text,
    subtitle text,
    photo_url text,
    url text,
    score double precision
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    clean_q text;
    viewer_uuid uuid;
BEGIN
    clean_q := trim(p_query);
    IF clean_q = '' OR clean_q IS NULL THEN
        RETURN;
    END IF;

    viewer_uuid := auth.uid();

    RETURN QUERY
    WITH combined_results AS (
        -- A. Canonical Dishes
        SELECT
            'dish'::text AS r_type,
            d.id::text AS r_id,
            d.canonical_name::text AS r_title,
            COALESCE(d.cuisine, 'Dish')::text AS r_subtitle,
            d.primary_photo_path::text AS r_photo,
            ('/dish/' || d.slug)::text AS r_url,
            GREATEST(
                extensions.similarity(d.canonical_name, clean_q),
                extensions.similarity(d.normalized_name, lower(clean_q)),
                CASE WHEN d.canonical_name ILIKE '%' || clean_q || '%' THEN 0.8 ELSE 0.0 END
            )::double precision AS r_score
        FROM public.dishes d
        WHERE (p_types IS NULL OR 'dish' = ANY(p_types))
          AND (
              d.canonical_name ILIKE '%' || clean_q || '%' OR
              d.normalized_name % lower(clean_q) OR
              extensions.similarity(d.canonical_name, clean_q) > 0.25
          )

        UNION ALL

        -- B. Dining Places / Venues
        SELECT
            'place'::text AS r_type,
            pl.id::text AS r_id,
            pl.name::text AS r_title,
            COALESCE(pl.city, 'Dining Venue')::text AS r_subtitle,
            NULL::text AS r_photo,
            ('/place/' || pl.id)::text AS r_url,
            GREATEST(
                extensions.similarity(pl.name, clean_q),
                extensions.similarity(pl.normalized_name, lower(clean_q)),
                CASE WHEN pl.name ILIKE '%' || clean_q || '%' THEN 0.8 ELSE 0.0 END
            )::double precision AS r_score
        FROM public.places pl
        WHERE (p_types IS NULL OR 'place' = ANY(p_types))
          AND (p_city IS NULL OR pl.city ILIKE '%' || p_city || '%')
          AND (
              pl.name ILIKE '%' || clean_q || '%' OR
              pl.normalized_name % lower(clean_q) OR
              extensions.similarity(pl.name, clean_q) > 0.25
          )

        UNION ALL

        -- C. Discoverable Users / Profiles
        SELECT
            'user'::text AS r_type,
            pr.id::text AS r_id,
            pr.username::text AS r_title,
            pr.display_name::text AS r_subtitle,
            pr.avatar_path::text AS r_photo,
            ('/u/' || pr.username)::text AS r_url,
            GREATEST(
                extensions.similarity(pr.username, clean_q),
                COALESCE(extensions.similarity(pr.display_name, clean_q), 0.0),
                CASE WHEN pr.username ILIKE '%' || clean_q || '%' THEN 0.85 ELSE 0.0 END
            )::double precision AS r_score
        FROM public.profiles pr
        WHERE (p_types IS NULL OR 'user' = ANY(p_types))
          AND pr.discoverable = true
          AND (viewer_uuid IS NULL OR NOT public.is_blocked_bidirectional(viewer_uuid, pr.id))
          AND (
              pr.username ILIKE '%' || clean_q || '%' OR
              (pr.display_name IS NOT NULL AND pr.display_name ILIKE '%' || clean_q || '%') OR
              pr.username % clean_q OR
              extensions.similarity(pr.username, clean_q) > 0.25
          )

        UNION ALL

        -- D. Food Experiences (Strictly viewer-permitted)
        SELECT
            'experience'::text AS r_type,
            fe.id::text AS r_id,
            COALESCE(fe.title, 'Food Experience')::text AS r_title,
            COALESCE(fe.cuisine, 'Journal Entry')::text AS r_subtitle,
            NULL::text AS r_photo,
            ('/e/' || fe.id)::text AS r_url,
            GREATEST(
                COALESCE(extensions.similarity(fe.title, clean_q), 0.0),
                CASE WHEN fe.title ILIKE '%' || clean_q || '%' THEN 0.75 ELSE 0.0 END,
                CASE WHEN fe.description ILIKE '%' || clean_q || '%' THEN 0.6 ELSE 0.0 END
            )::double precision AS r_score
        FROM public.food_experiences fe
        WHERE (p_types IS NULL OR 'experience' = ANY(p_types))
          AND public.can_view_experience(viewer_uuid, fe.id)
          AND (
              fe.title ILIKE '%' || clean_q || '%' OR
              (fe.description IS NOT NULL AND fe.description ILIKE '%' || clean_q || '%') OR
              (fe.title IS NOT NULL AND extensions.similarity(fe.title, clean_q) > 0.25)
          )

        UNION ALL

        -- E. Public Collections
        SELECT
            'collection'::text AS r_type,
            col.id::text AS r_id,
            col.name::text AS r_title,
            (col.items_count || ' items')::text AS r_subtitle,
            col.cover_photo_path::text AS r_photo,
            ('/c/' || col.id)::text AS r_url,
            GREATEST(
                extensions.similarity(col.name, clean_q),
                CASE WHEN col.name ILIKE '%' || clean_q || '%' THEN 0.8 ELSE 0.0 END
            )::double precision AS r_score
        FROM public.collections col
        WHERE (p_types IS NULL OR 'collection' = ANY(p_types))
          AND col.visibility = 'public'
          AND public.can_view_collection(viewer_uuid, col.id)
          AND (
              col.name ILIKE '%' || clean_q || '%' OR
              (col.description IS NOT NULL AND col.description ILIKE '%' || clean_q || '%') OR
              extensions.similarity(col.name, clean_q) > 0.25
          )
    )
    SELECT
        r_type,
        r_id,
        r_title,
        r_subtitle,
        r_photo,
        r_url,
        r_score
    FROM combined_results
    ORDER BY r_score DESC, r_title ASC
    LIMIT p_limit;
END;
$$;
-- MORS Database Migration: Account Lifecycle & Rate Limiting (Phase 11)
-- Migration: 20261110000010_lifecycle_and_ratelimit.sql

-- 1. Rate Limit Buckets Table
CREATE TABLE public.rate_limit_buckets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bucket_key text NOT NULL,
    window_start timestamptz NOT NULL DEFAULT now(),
    request_count integer NOT NULL DEFAULT 1,
    CONSTRAINT uq_rate_limit_bucket UNIQUE (bucket_key, window_start)
);

CREATE INDEX idx_rate_limit_lookup ON public.rate_limit_buckets (bucket_key, window_start DESC);

-- Enable RLS on rate_limit_buckets
ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;

-- Explicit RLS Policies for rate_limit_buckets
-- Only server-side RPCs or authenticated owners can access rate limiting buckets
CREATE POLICY "rate_limit_buckets_select_policy"
ON public.rate_limit_buckets
FOR SELECT
USING (
    bucket_key LIKE 'user:' || (SELECT auth.uid())::text || ':%'
);

CREATE POLICY "rate_limit_buckets_insert_policy"
ON public.rate_limit_buckets
FOR INSERT
WITH CHECK (
    bucket_key LIKE 'user:' || (SELECT auth.uid())::text || ':%'
);

CREATE POLICY "rate_limit_buckets_update_policy"
ON public.rate_limit_buckets
FOR UPDATE
USING (
    bucket_key LIKE 'user:' || (SELECT auth.uid())::text || ':%'
)
WITH CHECK (
    bucket_key LIKE 'user:' || (SELECT auth.uid())::text || ':%'
);

CREATE POLICY "rate_limit_buckets_delete_policy"
ON public.rate_limit_buckets
FOR DELETE
USING (
    bucket_key LIKE 'user:' || (SELECT auth.uid())::text || ':%'
);

-- 2. Sliding Window Rate Limiter Function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_key text,
    p_max_requests integer,
    p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    curr_time timestamptz := now();
    window_bound timestamptz := curr_time - (p_window_seconds || ' seconds')::interval;
    total_count integer;
BEGIN
    -- Prune expired buckets older than 1 hour to keep table lightweight
    DELETE FROM public.rate_limit_buckets
    WHERE window_start < (curr_time - interval '1 hour');

    -- Sum requests in the active window
    SELECT COALESCE(SUM(request_count), 0) INTO total_count
    FROM public.rate_limit_buckets
    WHERE bucket_key = p_key AND window_start >= window_bound;

    IF total_count >= p_max_requests THEN
        RETURN false; -- Rate limit exceeded
    END IF;

    -- Increment or insert bucket for current second
    INSERT INTO public.rate_limit_buckets (bucket_key, window_start, request_count)
    VALUES (p_key, date_trunc('second', curr_time), 1)
    ON CONFLICT (bucket_key, window_start)
    DO UPDATE SET request_count = public.rate_limit_buckets.request_count + 1;

    RETURN true;
END;
$$;

-- 3. Account Deletion: Request Deletion (Grace Period)
CREATE OR REPLACE FUNCTION public.request_account_deletion()
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    curr_user uuid;
    req_at timestamptz;
BEGIN
    curr_user := auth.uid();
    IF curr_user IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    req_at := now();

    UPDATE public.profiles
    SET deletion_requested_at = req_at
    WHERE id = curr_user;

    RETURN req_at;
END;
$$;

-- 4. Account Deletion: Cancel Deletion
CREATE OR REPLACE FUNCTION public.cancel_account_deletion()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    curr_user uuid;
BEGIN
    curr_user := auth.uid();
    IF curr_user IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    UPDATE public.profiles
    SET deletion_requested_at = NULL
    WHERE id = curr_user;

    RETURN true;
END;
$$;

-- 5. Account Deletion: Hard Delete (Immediate cascading erase)
CREATE OR REPLACE FUNCTION public.execute_account_hard_delete(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    caller_uuid uuid;
BEGIN
    caller_uuid := auth.uid();
    -- Allow user to delete self, or allow service role
    IF caller_uuid IS NOT NULL AND caller_uuid <> target_user_id THEN
        RAISE EXCEPTION 'Unauthorized account deletion';
    END IF;

    -- Cascading removal across all MORS tables
    DELETE FROM public.experience_likes WHERE user_id = target_user_id;
    DELETE FROM public.experience_comments WHERE user_id = target_user_id;
    DELETE FROM public.collection_likes WHERE user_id = target_user_id;
    DELETE FROM public.collection_items WHERE collection_id IN (
        SELECT id FROM public.collections WHERE user_id = target_user_id
    );
    DELETE FROM public.collections WHERE user_id = target_user_id;
    DELETE FROM public.experience_photos WHERE experience_id IN (
        SELECT id FROM public.food_experiences WHERE user_id = target_user_id
    );
    DELETE FROM public.experience_dishes WHERE experience_id IN (
        SELECT id FROM public.food_experiences WHERE user_id = target_user_id
    );
    DELETE FROM public.food_experiences WHERE user_id = target_user_id;
    DELETE FROM public.follows WHERE follower_id = target_user_id OR following_id = target_user_id;
    DELETE FROM public.blocks WHERE blocker_id = target_user_id OR blocked_id = target_user_id;
    DELETE FROM public.notifications WHERE user_id = target_user_id OR actor_id = target_user_id;
    DELETE FROM public.reports WHERE reporter_id = target_user_id;

    -- Finally remove profile row
    DELETE FROM public.profiles WHERE id = target_user_id;

    RETURN true;
END;
$$;
-- MORS Database Migration: Mobile Push Notification Tokens (Phase 13)
-- Migration: 20261110000011_mobile_push.sql

CREATE TABLE public.push_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    token text NOT NULL,
    platform text NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_device_token UNIQUE (user_id, token)
);

CREATE INDEX idx_push_tokens_user_id ON public.push_tokens (user_id);

-- Enable RLS
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Explicit RLS Policies
CREATE POLICY "push_tokens_select_policy"
ON public.push_tokens
FOR SELECT
USING (
    user_id = (SELECT auth.uid())
);

CREATE POLICY "push_tokens_insert_policy"
ON public.push_tokens
FOR INSERT
WITH CHECK (
    user_id = (SELECT auth.uid())
);

CREATE POLICY "push_tokens_update_policy"
ON public.push_tokens
FOR UPDATE
USING (
    user_id = (SELECT auth.uid())
)
WITH CHECK (
    user_id = (SELECT auth.uid())
);

CREATE POLICY "push_tokens_delete_policy"
ON public.push_tokens
FOR DELETE
USING (
    user_id = (SELECT auth.uid())
);

-- RPC for mobile client push token registration
CREATE OR REPLACE FUNCTION public.register_push_token(
    p_token text,
    p_platform text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    curr_user uuid;
BEGIN
    curr_user := auth.uid();
    IF curr_user IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    INSERT INTO public.push_tokens (user_id, token, platform, updated_at)
    VALUES (curr_user, trim(p_token), p_platform, now())
    ON CONFLICT (user_id, token)
    DO UPDATE SET platform = EXCLUDED.platform, updated_at = now();

    RETURN true;
END;
$$;
-- MORS Database Migration: Taste Identity & Explore Trending (Phase 14)
-- Migration: 20261110000012_taste_stats_and_explore.sql

-- 1. Profile Taste Identity & Statistics Engine
CREATE OR REPLACE FUNCTION public.get_profile_taste_stats(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    viewer_uuid uuid;
    is_owner boolean;
    owner_is_priv boolean;
    viewer_is_follower boolean;
    total_meals integer := 0;
    avg_rating numeric := NULL;
    fav_cuisines jsonb := '[]'::jsonb;
    top_dishes jsonb := '[]'::jsonb;
    monthly_activity jsonb := '[]'::jsonb;
    top_cat text := NULL;
BEGIN
    viewer_uuid := auth.uid();
    is_owner := (viewer_uuid IS NOT NULL AND viewer_uuid = target_user_id);

    -- Check if blocked
    IF viewer_uuid IS NOT NULL AND public.is_blocked_bidirectional(viewer_uuid, target_user_id) THEN
        RETURN NULL;
    END IF;

    SELECT is_private INTO owner_is_priv FROM public.profiles WHERE id = target_user_id;
    IF owner_is_priv IS NULL THEN
        RETURN NULL;
    END IF;

    IF viewer_uuid IS NOT NULL THEN
        viewer_is_follower := public.is_following(viewer_uuid, target_user_id);
    ELSE
        viewer_is_follower := false;
    END IF;

    -- If profile is private and viewer is not owner or accepted follower, no stats are exposed
    IF owner_is_priv AND NOT is_owner AND NOT viewer_is_follower THEN
        RETURN NULL;
    END IF;

    -- Aggregate stats from permitted experiences:
    -- Owner sees all; follower sees public + followers; public viewer sees public only
    WITH permitted_exp AS (
        SELECT id, eaten_at, overall_rating, cuisine, category_slug
        FROM public.food_experiences
        WHERE user_id = target_user_id
          AND status = 'published'
          AND (
              is_owner OR
              (viewer_is_follower AND visibility IN ('public', 'followers')) OR
              visibility = 'public'
          )
    ),
    cuisine_counts AS (
        SELECT cuisine, count(*)::int AS cnt
        FROM permitted_exp
        WHERE cuisine IS NOT NULL AND trim(cuisine) <> ''
        GROUP BY cuisine
        ORDER BY cnt DESC, cuisine ASC
        LIMIT 4
    ),
    dishes_aggregated AS (
        SELECT ed.display_name, ROUND(AVG(ed.rating)::numeric, 1) AS avg_dish_rating, count(*)::int AS times_logged
        FROM public.experience_dishes ed
        JOIN permitted_exp pe ON pe.id = ed.experience_id
        WHERE ed.rating IS NOT NULL AND ed.rating >= 8 -- 4.0 stars or higher
        GROUP BY ed.display_name
        ORDER BY times_logged DESC, avg_dish_rating DESC
        LIMIT 5
    ),
    months_series AS (
        SELECT
            to_char(date_trunc('month', d), 'YYYY-MM') AS month_str,
            to_char(date_trunc('month', d), 'Mon') AS month_label
        FROM generate_series(
            date_trunc('month', now() - interval '5 months'),
            date_trunc('month', now()),
            interval '1 month'
        ) d
    ),
    monthly_counts AS (
        SELECT
            ms.month_label,
            count(pe.id)::int AS meals_count
        FROM months_series ms
        LEFT JOIN permitted_exp pe ON to_char(date_trunc('month', pe.eaten_at), 'YYYY-MM') = ms.month_str
        GROUP BY ms.month_str, ms.month_label
        ORDER BY ms.month_str ASC
    )
    SELECT
        COUNT(*)::int,
        ROUND(AVG(overall_rating)::numeric / 2.0, 1)
    INTO total_meals, avg_rating
    FROM permitted_exp;

    -- Most logged category
    SELECT category_slug INTO top_cat
    FROM permitted_exp
    WHERE category_slug IS NOT NULL
    GROUP BY category_slug
    ORDER BY count(*) DESC
    LIMIT 1;

    -- Build JSON arrays
    SELECT COALESCE(jsonb_agg(jsonb_build_object('cuisine', cuisine, 'count', cnt)), '[]'::jsonb)
    INTO fav_cuisines
    FROM cuisine_counts;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'name', display_name,
        'rating', avg_dish_rating,
        'timesLogged', times_logged
    )), '[]'::jsonb)
    INTO top_dishes
    FROM dishes_aggregated;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'label', month_label,
        'count', meals_count
    )), '[]'::jsonb)
    INTO monthly_activity
    FROM monthly_counts;

    RETURN jsonb_build_object(
        'totalMeals', total_meals,
        'averageRating', avg_rating,
        'topCategory', top_cat,
        'favouriteCuisines', fav_cuisines,
        'topRatedDishes', top_dishes,
        'monthlyActivity', monthly_activity
    );
END;
$$;

-- 2. Explore Trending Experiences (Time-Decayed Public Consensus)
CREATE OR REPLACE FUNCTION public.get_explore_trending(p_limit integer DEFAULT 20)
RETURNS TABLE (
    id text,
    title text,
    eaten_at timestamptz,
    overall_rating smallint,
    cuisine text,
    author_id text,
    author_username text,
    author_display_name text,
    author_avatar_path text,
    likes_count integer,
    comments_count integer,
    primary_photo_path text,
    trending_score double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    viewer_uuid uuid;
BEGIN
    viewer_uuid := auth.uid();

    RETURN QUERY
    WITH public_pool AS (
        SELECT
            fe.id,
            fe.title,
            fe.eaten_at,
            fe.overall_rating,
            fe.cuisine,
            fe.user_id,
            pr.username,
            pr.display_name,
            pr.avatar_path,
            (SELECT count(*)::int FROM public.experience_likes el WHERE el.experience_id = fe.id) AS l_cnt,
            (SELECT count(*)::int FROM public.experience_comments ec WHERE ec.experience_id = fe.id) AS c_cnt,
            (
                SELECT ep.storage_path
                FROM public.experience_photos ep
                WHERE ep.experience_id = fe.id
                ORDER BY ep.position ASC
                LIMIT 1
            ) AS photo_path
        FROM public.food_experiences fe
        JOIN public.profiles pr ON pr.id = fe.user_id
        WHERE fe.status = 'published'
          AND fe.visibility = 'public'
          AND pr.is_private = false
          AND (viewer_uuid IS NULL OR NOT public.is_blocked_bidirectional(viewer_uuid, pr.id))
    )
    SELECT
        pp.id::text,
        pp.title,
        pp.eaten_at,
        pp.overall_rating,
        pp.cuisine,
        pp.user_id::text,
        pp.username,
        pp.display_name,
        pp.avatar_path,
        pp.l_cnt,
        pp.c_cnt,
        pp.photo_path,
        (
            (pp.l_cnt * 2.0 + pp.c_cnt * 3.0 + 1.0) /
            POWER((EXTRACT(EPOCH FROM (now() - pp.eaten_at)) / 3600.0) + 2.0, 1.25)
        )::double precision AS t_score
    FROM public_pool pp
    ORDER BY t_score DESC, pp.eaten_at DESC
    LIMIT p_limit;
END;
$$;

-- 3. Annual Food Year Memory Summary
CREATE OR REPLACE FUNCTION public.get_food_year_summary(target_user_id uuid, p_year integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    viewer_uuid uuid;
    is_owner boolean;
    start_ts timestamptz;
    end_ts timestamptz;
    total_logged integer := 0;
    top_dishes jsonb := '[]'::jsonb;
    top_place_name text := NULL;
    best_dish_name text := NULL;
    best_dish_rating numeric := NULL;
BEGIN
    viewer_uuid := auth.uid();
    is_owner := (viewer_uuid IS NOT NULL AND viewer_uuid = target_user_id);

    start_ts := make_timestamptz(p_year, 1, 1, 0, 0, 0, 'UTC');
    end_ts := make_timestamptz(p_year, 12, 31, 23, 59, 59, 'UTC');

    WITH annual_exp AS (
        SELECT id, eaten_at, overall_rating, place_id
        FROM public.food_experiences
        WHERE user_id = target_user_id
          AND status = 'published'
          AND eaten_at >= start_ts AND eaten_at <= end_ts
          AND (
              is_owner OR
              visibility = 'public'
          )
    )
    SELECT count(*)::int INTO total_logged FROM annual_exp;

    -- Top place
    SELECT p.name INTO top_place_name
    FROM annual_exp ae
    JOIN public.places p ON p.id = ae.place_id
    GROUP BY p.name
    ORDER BY count(*) DESC
    LIMIT 1;

    -- Top rated dish
    SELECT ed.display_name, (ed.rating / 2.0)::numeric
    INTO best_dish_name, best_dish_rating
    FROM public.experience_dishes ed
    JOIN annual_exp ae ON ae.id = ed.experience_id
    WHERE ed.rating IS NOT NULL
    ORDER BY ed.rating DESC, ed.created_at ASC
    LIMIT 1;

    -- Top 3 dishes
    SELECT COALESCE(jsonb_agg(jsonb_build_object('name', display_name, 'count', cnt)), '[]'::jsonb)
    INTO top_dishes
    FROM (
        SELECT ed.display_name, count(*)::int AS cnt
        FROM public.experience_dishes ed
        JOIN annual_exp ae ON ae.id = ed.experience_id
        GROUP BY ed.display_name
        ORDER BY cnt DESC
        LIMIT 3
    ) s;

    RETURN jsonb_build_object(
        'year', p_year,
        'totalMealsLogged', total_logged,
        'topPlace', top_place_name,
        'bestDish', jsonb_build_object('name', best_dish_name, 'rating', best_dish_rating),
        'topDishes', top_dishes
    );
END;
$$;
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
-- ==============================================================================
-- MORS Database Migration: 20261110000014_trigger_maintained_stats.sql
-- Priority 2: Replace Views with Trigger-Maintained Tables for Community Aggregates
-- ==============================================================================

-- 1. Drop existing dynamic views
DROP VIEW IF EXISTS public.dish_public_stats CASCADE;
DROP VIEW IF EXISTS public.place_public_stats CASCADE;

-- 2. Create physical tables with RLS
CREATE TABLE public.dish_public_stats (
  dish_id uuid PRIMARY KEY REFERENCES public.dishes(id) ON DELETE CASCADE,
  public_experience_count integer DEFAULT 0 NOT NULL,
  public_rating_count integer DEFAULT 0 NOT NULL,
  public_rating_avg numeric(4,2)
);

ALTER TABLE public.dish_public_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read for dish_public_stats"
  ON public.dish_public_stats
  FOR SELECT
  TO public
  USING (true);

CREATE INDEX IF NOT EXISTS idx_dish_public_stats_rating_count
  ON public.dish_public_stats(public_rating_count);

CREATE TABLE public.place_public_stats (
  place_id uuid PRIMARY KEY REFERENCES public.places(id) ON DELETE CASCADE,
  public_experience_count integer DEFAULT 0 NOT NULL,
  public_rating_avg numeric(4,2)
);

ALTER TABLE public.place_public_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read for place_public_stats"
  ON public.place_public_stats
  FOR SELECT
  TO public
  USING (true);

CREATE INDEX IF NOT EXISTS idx_place_public_stats_exp_count
  ON public.place_public_stats(public_experience_count);

-- 3. Functions to recompute aggregates strictly from the Public Pool
CREATE OR REPLACE FUNCTION public.recompute_dish_stats(p_dish_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_exp_cnt integer := 0;
  v_rat_cnt integer := 0;
  v_rat_avg numeric(4,2) := NULL;
BEGIN
  IF p_dish_id IS NULL THEN RETURN; END IF;

  SELECT
    count(DISTINCT ed.id)::int,
    count(ed.rating)::int,
    round(avg(ed.rating)::numeric, 2)
  INTO v_exp_cnt, v_rat_cnt, v_rat_avg
  FROM public.experience_dishes ed
  JOIN public.food_experiences fe ON ed.experience_id = fe.id
  JOIN public.profiles p ON fe.user_id = p.id
  WHERE ed.dish_id = p_dish_id
    AND fe.status = 'published'
    AND fe.visibility = 'public'
    AND p.is_private = false
    AND p.discoverable = true
    AND p.deletion_requested_at IS NULL;

  INSERT INTO public.dish_public_stats (dish_id, public_experience_count, public_rating_count, public_rating_avg)
  VALUES (p_dish_id, v_exp_cnt, v_rat_cnt, v_rat_avg)
  ON CONFLICT (dish_id) DO UPDATE
  SET public_experience_count = EXCLUDED.public_experience_count,
      public_rating_count = EXCLUDED.public_rating_count,
      public_rating_avg = EXCLUDED.public_rating_avg;
END;
$$;

CREATE OR REPLACE FUNCTION public.recompute_place_stats(p_place_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_exp_cnt integer := 0;
  v_rat_avg numeric(4,2) := NULL;
BEGIN
  IF p_place_id IS NULL THEN RETURN; END IF;

  SELECT
    count(DISTINCT fe.id)::int,
    round(avg(fe.overall_rating)::numeric, 2)
  INTO v_exp_cnt, v_rat_avg
  FROM public.food_experiences fe
  JOIN public.profiles p ON fe.user_id = p.id
  WHERE fe.place_id = p_place_id
    AND fe.status = 'published'
    AND fe.visibility = 'public'
    AND p.is_private = false
    AND p.discoverable = true
    AND p.deletion_requested_at IS NULL;

  INSERT INTO public.place_public_stats (place_id, public_experience_count, public_rating_avg)
  VALUES (p_place_id, v_exp_cnt, v_rat_avg)
  ON CONFLICT (place_id) DO UPDATE
  SET public_experience_count = EXCLUDED.public_experience_count,
      public_rating_avg = EXCLUDED.public_rating_avg;
END;
$$;

CREATE OR REPLACE FUNCTION public.recompute_all_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT id FROM public.dishes LOOP
    PERFORM public.recompute_dish_stats(r.id);
  END LOOP;
  FOR r IN SELECT id FROM public.places LOOP
    PERFORM public.recompute_place_stats(r.id);
  END LOOP;
END;
$$;

-- 4. Triggers to maintain stats automatically
CREATE OR REPLACE FUNCTION public.trigger_on_experience_dishes_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.dish_id IS NOT NULL THEN
      PERFORM public.recompute_dish_stats(NEW.dish_id);
    END IF;
  END IF;

  IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
    IF OLD.dish_id IS NOT NULL AND (TG_OP = 'DELETE' OR OLD.dish_id <> NEW.dish_id) THEN
      PERFORM public.recompute_dish_stats(OLD.dish_id);
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_experience_dishes_maintain_stats ON public.experience_dishes;
CREATE TRIGGER on_experience_dishes_maintain_stats
AFTER INSERT OR UPDATE OR DELETE ON public.experience_dishes
FOR EACH ROW
EXECUTE FUNCTION public.trigger_on_experience_dishes_change();

CREATE OR REPLACE FUNCTION public.trigger_on_experience_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  d record;
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.place_id IS NOT NULL THEN
      PERFORM public.recompute_place_stats(NEW.place_id);
    END IF;
  END IF;

  IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
    IF OLD.place_id IS NOT NULL AND (TG_OP = 'DELETE' OR OLD.place_id <> NEW.place_id) THEN
      PERFORM public.recompute_place_stats(OLD.place_id);
    END IF;

    -- If visibility or status changed, recompute all attached dishes
    IF TG_OP = 'UPDATE' AND (OLD.visibility <> NEW.visibility OR OLD.status <> NEW.status) THEN
      FOR d IN SELECT dish_id FROM public.experience_dishes WHERE experience_id = NEW.id AND dish_id IS NOT NULL LOOP
        PERFORM public.recompute_dish_stats(d.dish_id);
      END LOOP;
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_experience_maintain_stats ON public.food_experiences;
CREATE TRIGGER on_experience_maintain_stats
AFTER INSERT OR UPDATE OR DELETE ON public.food_experiences
FOR EACH ROW
EXECUTE FUNCTION public.trigger_on_experience_change();

-- Initial population of stats for existing data
SELECT public.recompute_all_stats();
-- Migration: 20261110000015_invite_codes.sql
-- Description: Closed beta invite code gating, redemption tracking, and validation RPCs

CREATE TABLE IF NOT EXISTS public.invite_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    max_uses INTEGER NOT NULL DEFAULT 1 CHECK (max_uses > 0),
    uses_count INTEGER NOT NULL DEFAULT 0 CHECK (uses_count >= 0),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

-- Indexes for performance and policy lookups
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON public.invite_codes (code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_created_by ON public.invite_codes (created_by);

-- Explicit policies
CREATE POLICY invite_codes_admin_select ON public.invite_codes
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (SELECT auth.uid())
              AND p.role IN ('admin', 'moderator')
        )
    );

CREATE POLICY invite_codes_admin_insert ON public.invite_codes
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (SELECT auth.uid())
              AND p.role IN ('admin', 'moderator')
        )
    );

-- Table for tracking which user redeemed which code
CREATE TABLE IF NOT EXISTS public.invite_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invite_code_id UUID NOT NULL REFERENCES public.invite_codes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_invite_code_redemption UNIQUE (invite_code_id, user_id)
);

-- Enable RLS
ALTER TABLE public.invite_redemptions ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invite_redemptions_user ON public.invite_redemptions (user_id);
CREATE INDEX IF NOT EXISTS idx_invite_redemptions_code ON public.invite_redemptions (invite_code_id);

-- Explicit policies for invite_redemptions
CREATE POLICY invite_redemptions_select_own ON public.invite_redemptions
    FOR SELECT TO authenticated
    USING (
        user_id = (SELECT auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (SELECT auth.uid())
              AND p.role IN ('admin', 'moderator')
        )
    );

-- RPC for validating invite code before signup (publicly callable, returns boolean valid/invalid)
CREATE OR REPLACE FUNCTION public.check_invite_code(p_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_code TEXT := upper(trim(p_code));
    v_valid BOOLEAN := false;
BEGIN
    SELECT true INTO v_valid
    FROM public.invite_codes
    WHERE code = v_code
      AND uses_count < max_uses
      AND (expires_at IS NULL OR expires_at > now());

    RETURN COALESCE(v_valid, false);
END;
$$;

-- RPC for redeeming invite code upon account creation / onboarding
CREATE OR REPLACE FUNCTION public.redeem_invite_code(p_code TEXT, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_code TEXT := upper(trim(p_code));
    v_invite_id UUID;
    v_max_uses INTEGER;
    v_uses_count INTEGER;
    v_expires_at TIMESTAMPTZ;
BEGIN
    -- Lock code record for update to prevent concurrent race condition
    SELECT id, max_uses, uses_count, expires_at
    INTO v_invite_id, v_max_uses, v_uses_count, v_expires_at
    FROM public.invite_codes
    WHERE code = v_code
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid beta invite code';
    END IF;

    IF v_expires_at IS NOT NULL AND v_expires_at <= now() THEN
        RAISE EXCEPTION 'This invite code has expired';
    END IF;

    IF v_uses_count >= v_max_uses THEN
        RAISE EXCEPTION 'This invite code has already reached its maximum usage limit';
    END IF;

    -- Check if user already redeemed any code
    IF EXISTS (SELECT 1 FROM public.invite_redemptions WHERE user_id = p_user_id) THEN
        RETURN true; -- Already registered under an invite code
    END IF;

    -- Increment usage
    UPDATE public.invite_codes
    SET uses_count = uses_count + 1
    WHERE id = v_invite_id;

    -- Insert redemption record
    INSERT INTO public.invite_redemptions (invite_code_id, user_id)
    VALUES (v_invite_id, p_user_id);

    RETURN true;
END;
$$;

-- Seed default initial closed-beta invite codes
INSERT INTO public.invite_codes (code, max_uses)
VALUES 
    ('HYDERABAD-BETA-2026', 100),
    ('MORS-FOUNDER-BETA', 50),
    ('TASTE-ARCHIVE-HYD', 50)
ON CONFLICT (code) DO NOTHING;
-- Migration: 20261110000016_beta_digest_and_preferences.sql
-- Description: Phase 14B Weekly digest data compilation RPC, send tracking idempotency, and opt-in preferences

-- 1. Add digest preferences to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS weekly_digest_opt_in BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS memory_digest_opt_in BOOLEAN NOT NULL DEFAULT true;

-- 2. Digest sends tracking table for idempotency
CREATE TABLE IF NOT EXISTS public.digest_sends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    digest_type TEXT NOT NULL, -- 'weekly_digest', 'on_this_day'
    period_key TEXT NOT NULL,  -- '2026-W45', '2026-11-10'
    sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_digest_send UNIQUE (user_id, digest_type, period_key)
);

-- Enable RLS
ALTER TABLE public.digest_sends ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_digest_sends_user ON public.digest_sends (user_id);
CREATE INDEX IF NOT EXISTS idx_digest_sends_period ON public.digest_sends (period_key);

-- Explicit policies
CREATE POLICY digest_sends_select_own ON public.digest_sends
    FOR SELECT TO authenticated
    USING (
        user_id = (SELECT auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (SELECT auth.uid())
              AND p.role IN ('admin', 'moderator')
        )
    );

CREATE POLICY digest_sends_admin_insert ON public.digest_sends
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = (SELECT auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (SELECT auth.uid())
              AND p.role IN ('admin', 'moderator')
        )
    );

-- 3. Security definer RPC to safely compile a user's week in food without privacy leakage
CREATE OR REPLACE FUNCTION public.get_digest_data(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_week_count INTEGER := 0;
    v_top_dish JSON := null;
    v_highlight JSON := null;
    v_following_highlights JSON := '[]'::json;
    v_result JSON;
BEGIN
    -- Check opt-in preference
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = p_user_id AND weekly_digest_opt_in = true
    ) THEN
        RETURN null;
    END IF;

    -- Count user's meals logged in the last 7 days
    SELECT count(*)
    INTO v_week_count
    FROM public.food_experiences
    WHERE user_id = p_user_id
      AND eaten_at >= (now() - interval '7 days');

    -- Find top-rated dish logged by user this week
    SELECT json_build_object(
        'dish_name', ed.display_name,
        'rating', ed.rating,
        'eaten_at', fe.eaten_at,
        'experience_id', fe.id
    )
    INTO v_top_dish
    FROM public.experience_dishes ed
    JOIN public.food_experiences fe ON fe.id = ed.experience_id
    WHERE fe.user_id = p_user_id
      AND fe.eaten_at >= (now() - interval '7 days')
      AND ed.rating IS NOT NULL
    ORDER BY ed.rating DESC, fe.eaten_at DESC
    LIMIT 1;

    -- Surfacing a past diary highlight (from > 30 days ago)
    SELECT json_build_object(
        'title', fe.title,
        'eaten_at', fe.eaten_at,
        'rating', fe.overall_rating,
        'id', fe.id
    )
    INTO v_highlight
    FROM public.food_experiences fe
    WHERE fe.user_id = p_user_id
      AND fe.eaten_at <= (now() - interval '30 days')
      AND fe.overall_rating >= 8
    ORDER BY random()
    LIMIT 1;

    -- Up to 3 entries from followed cooks published in the last 7 days that the user is authorized to see
    SELECT COALESCE(
        json_agg(
            json_build_object(
                'id', sub.id,
                'title', sub.title,
                'author_username', sub.author_username,
                'author_display_name', sub.author_display_name,
                'author_avatar_path', sub.author_avatar_path,
                'rating', sub.overall_rating,
                'published_at', sub.published_at
            )
        ),
        '[]'::json
    )
    INTO v_following_highlights
    FROM (
        SELECT 
            fe.id,
            fe.title,
            fe.overall_rating,
            fe.published_at,
            p.username AS author_username,
            p.display_name AS author_display_name,
            p.avatar_path AS author_avatar_path
        FROM public.follows f
        JOIN public.food_experiences fe ON fe.user_id = f.following_id
        JOIN public.profiles p ON p.id = fe.user_id
        WHERE f.follower_id = p_user_id
          AND f.status = 'accepted'
          AND fe.status = 'published'
          AND fe.published_at >= (now() - interval '7 days')
          AND public.can_view_experience(p_user_id, fe.id)
        ORDER BY fe.published_at DESC
        LIMIT 3
    ) sub;

    v_result := json_build_object(
        'user_id', p_user_id,
        'week_experiences_count', v_week_count,
        'top_dish', v_top_dish,
        'diary_highlight', v_highlight,
        'following_highlights', v_following_highlights,
        'generated_at', now()
    );

    RETURN v_result;
END;
$$;
-- Migration: 20261110000017_phase22_locale_and_dish_translations.sql
-- Description: Phase 22 Language and local-food search (Telugu & Hindi translations and transliterations)

-- 1. Add locale to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'en';

-- 2. Dish translations table for multi-script and localized dish search
CREATE TABLE IF NOT EXISTS public.dish_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dish_id UUID NOT NULL REFERENCES public.dishes(id) ON DELETE CASCADE,
    locale TEXT NOT NULL, -- 'te', 'hi', 'ur'
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_dish_translation UNIQUE (dish_id, locale)
);

-- Enable RLS
ALTER TABLE public.dish_translations ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dish_translations_dish ON public.dish_translations (dish_id);
CREATE INDEX IF NOT EXISTS idx_dish_translations_locale ON public.dish_translations (locale);
CREATE INDEX IF NOT EXISTS idx_dish_translations_name_trgm ON public.dish_translations USING gin (name gin_trgm_ops);

-- Explicit policies
CREATE POLICY dish_translations_select ON public.dish_translations
    FOR SELECT TO public
    USING (
        EXISTS (
            SELECT 1 FROM public.dishes d
            WHERE d.id = dish_translations.dish_id
              AND (d.is_listed = true OR d.created_by = (SELECT auth.uid()))
        )
    );

CREATE POLICY dish_translations_admin_insert ON public.dish_translations
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (SELECT auth.uid())
              AND p.role IN ('admin', 'moderator')
        )
    );

-- 3. Seed Telugu and Hindi translations for iconic Hyderabad dishes
DO $$
DECLARE
    v_biryani_id UUID;
    v_pesarattu_id UUID;
    v_haleem_id UUID;
    v_chai_id UUID;
BEGIN
    SELECT id INTO v_biryani_id FROM public.dishes WHERE canonical_name ILIKE '%biryani%' LIMIT 1;
    SELECT id INTO v_pesarattu_id FROM public.dishes WHERE canonical_name ILIKE '%pesarattu%' LIMIT 1;
    SELECT id INTO v_haleem_id FROM public.dishes WHERE canonical_name ILIKE '%haleem%' LIMIT 1;
    SELECT id INTO v_chai_id FROM public.dishes WHERE canonical_name ILIKE '%chai%' LIMIT 1;

    IF v_biryani_id IS NOT NULL THEN
        INSERT INTO public.dish_translations (dish_id, locale, name)
        VALUES 
            (v_biryani_id, 'te', 'హైదరాబాదీ దమ్ బిర్యానీ'),
            (v_biryani_id, 'hi', 'हैदराबादी दम बिरयानी')
        ON CONFLICT (dish_id, locale) DO UPDATE SET name = EXCLUDED.name;
    END IF;

    IF v_pesarattu_id IS NOT NULL THEN
        INSERT INTO public.dish_translations (dish_id, locale, name)
        VALUES 
            (v_pesarattu_id, 'te', 'పెసరట్టు'),
            (v_pesarattu_id, 'hi', 'पेसरट्टू')
        ON CONFLICT (dish_id, locale) DO UPDATE SET name = EXCLUDED.name;
    END IF;

    IF v_haleem_id IS NOT NULL THEN
        INSERT INTO public.dish_translations (dish_id, locale, name)
        VALUES 
            (v_haleem_id, 'te', 'హైదరాబాదీ హలీమ్'),
            (v_haleem_id, 'hi', 'हैदराबादी हलीम')
        ON CONFLICT (dish_id, locale) DO UPDATE SET name = EXCLUDED.name;
    END IF;

    IF v_chai_id IS NOT NULL THEN
        INSERT INTO public.dish_translations (dish_id, locale, name)
        VALUES 
            (v_chai_id, 'te', 'ఇరానీ చాయ్'),
            (v_chai_id, 'hi', 'ईरानी चाय')
        ON CONFLICT (dish_id, locale) DO UPDATE SET name = EXCLUDED.name;
    END IF;
END $$;
-- Migration: Phase 16 Taste Identity and Stats
-- Tables: user_stats_owner, user_stats_public
-- RLS enabled with explicit policies and SECURITY DEFINER computation function

CREATE TABLE IF NOT EXISTS public.user_stats_owner (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  period TEXT NOT NULL CHECK (period IN ('all_time', 'year', 'month')),
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, period)
);

CREATE TABLE IF NOT EXISTS public.user_stats_public (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  period TEXT NOT NULL CHECK (period IN ('all_time', 'year', 'month')),
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, period)
);

-- Indexes for policy columns and queries
CREATE INDEX IF NOT EXISTS idx_user_stats_owner_user ON public.user_stats_owner(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_public_user ON public.user_stats_public(user_id);

-- Enable RLS
ALTER TABLE public.user_stats_owner ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats_public ENABLE ROW LEVEL SECURITY;

-- Explicit RLS Policies for user_stats_owner:
-- Strictly owner-only visibility
CREATE POLICY user_stats_owner_select ON public.user_stats_owner
  FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
  );

CREATE POLICY user_stats_owner_all_admin ON public.user_stats_owner
  FOR ALL
  USING (
    (SELECT auth.uid()) = user_id
  );

-- Explicit RLS Policies for user_stats_public:
-- Readable by anyone if owner's profile is public, not pending deletion, and viewer is not blocked
CREATE POLICY user_stats_public_select ON public.user_stats_public
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = user_stats_public.user_id
        AND p.is_private = false
        AND p.deletion_pending_at IS NULL
        AND (
          (SELECT auth.uid()) IS NULL
          OR NOT EXISTS (
            SELECT 1 FROM public.blocks b
            WHERE (b.blocker_id = (SELECT auth.uid()) AND b.blocked_id = p.id)
               OR (b.blocker_id = p.id AND b.blocked_id = (SELECT auth.uid()))
          )
        )
    )
  );

CREATE POLICY user_stats_public_admin ON public.user_stats_public
  FOR ALL
  USING (
    (SELECT auth.uid()) = user_id
  );

-- Function to recompute stats with strict security qualifiers
CREATE OR REPLACE FUNCTION public.recompute_user_stats(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_owner_data JSONB;
  v_public_data JSONB;
  v_is_profile_public BOOLEAN;
  v_is_pending_del BOOLEAN;
BEGIN
  -- Check profile flags
  SELECT is_private = false, deletion_pending_at IS NOT NULL
  INTO v_is_profile_public, v_is_pending_del
  FROM public.profiles
  WHERE id = p_user_id;

  -- 1. Compute Owner Stats (All published entries of the user)
  SELECT jsonb_build_object(
    'total_experiences', COALESCE(COUNT(DISTINCT fe.id), 0),
    'distinct_dishes', COALESCE(COUNT(DISTINCT ed.dish_id), 0),
    'distinct_places', COALESCE(COUNT(DISTINCT fe.place_id), 0),
    'avg_rating', ROUND(AVG(fe.rating)::numeric, 1)
  )
  INTO v_owner_data
  FROM public.food_experiences fe
  LEFT JOIN public.experience_dishes ed ON ed.experience_id = fe.id
  WHERE fe.user_id = p_user_id
    AND fe.status = 'published';

  -- Upsert owner stats for all_time
  INSERT INTO public.user_stats_owner (user_id, period, data, computed_at)
  VALUES (p_user_id, 'all_time', COALESCE(v_owner_data, '{}'::jsonb), now())
  ON CONFLICT (user_id, period)
  DO UPDATE SET data = EXCLUDED.data, computed_at = EXCLUDED.computed_at;

  -- 2. Compute Public Stats (Only public-pool entries, and only if profile is public & not pending deletion)
  IF v_is_profile_public AND NOT v_is_pending_del THEN
    SELECT jsonb_build_object(
      'total_experiences', COALESCE(COUNT(DISTINCT fe.id), 0),
      'distinct_dishes', COALESCE(COUNT(DISTINCT ed.dish_id), 0),
      'distinct_places', COALESCE(COUNT(DISTINCT fe.place_id), 0),
      'avg_rating', ROUND(AVG(fe.rating)::numeric, 1)
    )
    INTO v_public_data
    FROM public.food_experiences fe
    LEFT JOIN public.experience_dishes ed ON ed.experience_id = fe.id
    WHERE fe.user_id = p_user_id
      AND fe.status = 'published'
      AND fe.visibility = 'public';

    INSERT INTO public.user_stats_public (user_id, period, data, computed_at)
    VALUES (p_user_id, 'all_time', COALESCE(v_public_data, '{}'::jsonb), now())
    ON CONFLICT (user_id, period)
    DO UPDATE SET data = EXCLUDED.data, computed_at = EXCLUDED.computed_at;
  ELSE
    -- If private or pending deletion, delete public stats to ensure zero leak
    DELETE FROM public.user_stats_public WHERE user_id = p_user_id;
  END IF;
END;
$$;
-- Migration: Phase 17 Explore Cache
-- Table: explore_cache (public-pool aggregated discovery)
-- RLS enabled with explicit policies and SECURITY DEFINER refresh/query functions

CREATE TABLE IF NOT EXISTS public.explore_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope TEXT NOT NULL CHECK (scope IN ('city', 'global')),
  city TEXT NOT NULL DEFAULT 'Hyderabad',
  kind TEXT NOT NULL CHECK (kind IN ('trending', 'popular_dishes', 'places', 'creators')),
  payload JSONB NOT NULL DEFAULT '[]'::jsonb,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_explore_cache UNIQUE (scope, city, kind)
);

-- Index for queries
CREATE INDEX IF NOT EXISTS idx_explore_cache_scope_city ON public.explore_cache(scope, city, kind);

-- Enable RLS
ALTER TABLE public.explore_cache ENABLE ROW LEVEL SECURITY;

-- Explicit RLS Policies:
-- Readable by anyone (anonymous or authenticated) because it strictly holds pre-aggregated public-pool data
CREATE POLICY explore_cache_select ON public.explore_cache
  FOR SELECT
  USING (true);

-- Mutations restricted to service role / SECURITY DEFINER functions
CREATE POLICY explore_cache_admin ON public.explore_cache
  FOR ALL
  USING (false);

-- RPC to retrieve or lazily generate explore sections
CREATE OR REPLACE FUNCTION public.get_explore_cached(p_city TEXT DEFAULT 'Hyderabad', p_kind TEXT DEFAULT 'trending')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_payload JSONB;
BEGIN
  -- Attempt to read from cache first
  SELECT payload INTO v_payload
  FROM public.explore_cache
  WHERE scope = 'city' AND city = p_city AND kind = p_kind;

  IF v_payload IS NOT NULL THEN
    RETURN v_payload;
  END IF;

  -- Return empty JSON array if no cached entry yet
  RETURN '[]'::jsonb;
END;
$$;
-- Migration: Phase 18 Maps, Location and Rich Dish/Place Pages
-- Adds source_attribution and last_synced_at to places
-- Implements get_map_pins RPC with strict venue-only coordinates and public-pool filtering

ALTER TABLE public.places 
  ADD COLUMN IF NOT EXISTS source_attribution TEXT,
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

-- Prevent places from being registered as 'home'
ALTER TABLE public.places
  DROP CONSTRAINT IF EXISTS check_place_not_home;

ALTER TABLE public.places
  ADD CONSTRAINT check_place_not_home CHECK (lower(name) != 'home');

-- Function to return map venue pins (never user coordinates)
CREATE OR REPLACE FUNCTION public.get_map_pins(
  p_min_lat NUMERIC DEFAULT NULL,
  p_max_lat NUMERIC DEFAULT NULL,
  p_min_lng NUMERIC DEFAULT NULL,
  p_max_lng NUMERIC DEFAULT NULL,
  p_city TEXT DEFAULT 'Hyderabad'
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  lat NUMERIC,
  lng NUMERIC,
  city TEXT,
  address TEXT,
  source_attribution TEXT,
  is_visited_by_viewer BOOLEAN,
  public_experience_count BIGINT,
  public_rating_avg NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_viewer_id UUID := (SELECT auth.uid());
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.lat,
    p.lng,
    p.city,
    p.address,
    p.source_attribution,
    CASE 
      WHEN v_viewer_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.food_experiences fe
        WHERE fe.place_id = p.id AND fe.user_id = v_viewer_id
      ) THEN true
      ELSE false
    END AS is_visited_by_viewer,
    COALESCE(ps.public_experience_count, 0) AS public_experience_count,
    ROUND(ps.public_rating_avg::numeric, 1) AS public_rating_avg
  FROM public.places p
  LEFT JOIN public.place_public_stats ps ON ps.place_id = p.id
  WHERE p.lat IS NOT NULL 
    AND p.lng IS NOT NULL
    AND (p_city IS NULL OR p.city ILIKE p_city)
    AND (p_min_lat IS NULL OR p.lat >= p_min_lat)
    AND (p_max_lat IS NULL OR p.lat <= p_max_lat)
    AND (p_min_lng IS NULL OR p.lng >= p_min_lng)
    AND (p_max_lng IS NULL OR p.lng <= p_max_lng)
    AND (
      -- Place is either referenced by a public pool entry or visited by viewer
      (ps.public_experience_count > 0)
      OR (v_viewer_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.food_experiences fe
        WHERE fe.place_id = p.id AND fe.user_id = v_viewer_id
      ))
    );
END;
$$;
-- Migration: Phase 19 Social Upgrades
-- Mentions, creator profiles (pinned collections/experiences), muted words, comment moderation, grouped notifications

-- 1. Extend notification_t enum to include 'mention'
ALTER TYPE public.notification_t ADD VALUE IF NOT EXISTS 'mention';

-- 2. Add creator profile pins and muted words to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pinned_collection_ids UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS featured_experience_ids UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS muted_words TEXT[] DEFAULT '{}';

-- 3. Add soft-hide to comments for entry owner moderation
ALTER TABLE public.experience_comments
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT FALSE;

-- Update experience_comments select policy to respect soft-hide
DROP POLICY IF EXISTS experience_comments_select ON public.experience_comments;

CREATE POLICY experience_comments_select ON public.experience_comments
  FOR SELECT
  USING (
    -- Viewer must be able to view the underlying experience
    EXISTS (
      SELECT 1 FROM public.food_experiences fe
      WHERE fe.id = experience_comments.experience_id
        AND (
          fe.user_id = (SELECT auth.uid())
          OR (
            fe.status = 'published'
            AND fe.visibility = 'public'
            AND EXISTS (
              SELECT 1 FROM public.profiles p
              WHERE p.id = fe.user_id
                AND p.is_private = false
                AND p.deletion_pending_at IS NULL
            )
          )
        )
    )
    -- And either comment is not hidden, or viewer is author or entry owner
    AND (
      is_hidden = false
      OR user_id = (SELECT auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.food_experiences fe
        WHERE fe.id = experience_comments.experience_id
          AND fe.user_id = (SELECT auth.uid())
      )
    )
  );

-- 4. RPC for grouped notifications at read-time
CREATE OR REPLACE FUNCTION public.get_grouped_notifications(p_user_id UUID)
RETURNS TABLE (
  group_key TEXT,
  notification_type public.notification_t,
  target_id UUID,
  latest_created_at TIMESTAMPTZ,
  total_actors BIGINT,
  actors JSONB,
  sample_message TEXT,
  is_read BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Strict owner check
  IF (SELECT auth.uid()) IS NULL OR (SELECT auth.uid()) != p_user_id THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH grouped AS (
    SELECT 
      CONCAT(n.type::text, ':', COALESCE(n.entity_id::text, 'none'), ':', date_trunc('day', n.created_at)::date::text) AS g_key,
      n.type AS g_type,
      n.entity_id AS g_entity_id,
      MAX(n.created_at) AS max_time,
      COUNT(DISTINCT n.actor_id) AS actor_count,
      jsonb_agg(
        DISTINCT jsonb_build_object(
          'id', p.id,
          'username', p.username,
          'displayName', p.display_name,
          'avatarPath', p.avatar_path
        )
      ) AS actor_list,
      BOOL_AND(n.is_read) AS all_read
    FROM public.notifications n
    LEFT JOIN public.profiles p ON p.id = n.actor_id
    WHERE n.user_id = p_user_id
    GROUP BY g_key, g_type, g_entity_id
  )
  SELECT 
    g_key AS group_key,
    g_type AS notification_type,
    g_entity_id AS target_id,
    max_time AS latest_created_at,
    actor_count AS total_actors,
    actor_list AS actors,
    CASE 
      WHEN g_type = 'like' THEN 'liked your experience'
      WHEN g_type = 'comment' THEN 'commented on your experience'
      WHEN g_type = 'mention' THEN 'mentioned you in a comment'
      WHEN g_type = 'follow' THEN 'started following you'
      WHEN g_type = 'collection_like' THEN 'liked your collection'
      ELSE 'interacted with your profile'
    END AS sample_message,
    all_read AS is_read
  FROM grouped
  ORDER BY max_time DESC
  LIMIT 50;
END;
$$;
-- Migration: Phase 20 Food Year Recap
-- Table: recaps
-- Implements token-gated sharing with strict owner RLS and SECURITY DEFINER RPCs

CREATE TABLE IF NOT EXISTS public.recaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  year INT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  share_token UUID UNIQUE DEFAULT gen_random_uuid(),
  share_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  include_private BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT uq_user_recap_year UNIQUE (user_id, year)
);

-- Index for policy and token lookups
CREATE INDEX IF NOT EXISTS idx_recaps_user_year ON public.recaps(user_id, year);
CREATE INDEX IF NOT EXISTS idx_recaps_share_token ON public.recaps(share_token);

-- Enable RLS
ALTER TABLE public.recaps ENABLE ROW LEVEL SECURITY;

-- Explicit RLS Policies: Owner Only
CREATE POLICY recaps_owner_select ON public.recaps
  FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
  );

CREATE POLICY recaps_owner_all ON public.recaps
  FOR ALL
  USING (
    (SELECT auth.uid()) = user_id
  );

-- SECURITY DEFINER RPC to fetch shared recap by token (returns 404 / null if not enabled or nonexistent)
CREATE OR REPLACE FUNCTION public.get_recap_by_token(p_token UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'year', r.year,
    'username', p.username,
    'displayName', p.display_name,
    'avatarPath', p.avatar_path,
    'data', r.data,
    'generated_at', r.generated_at
  )
  INTO v_result
  FROM public.recaps r
  JOIN public.profiles p ON p.id = r.user_id
  WHERE r.share_token = p_token
    AND r.share_enabled = true
    AND p.deletion_pending_at IS NULL;

  RETURN v_result;
END;
$$;

-- SECURITY DEFINER RPC to toggle recap sharing and regenerate token
CREATE OR REPLACE FUNCTION public.toggle_recap_sharing(
  p_year INT,
  p_share_enabled BOOLEAN,
  p_include_private BOOLEAN DEFAULT FALSE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := (SELECT auth.uid());
  v_token UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  INSERT INTO public.recaps (user_id, year, share_enabled, include_private, share_token)
  VALUES (v_user_id, p_year, p_share_enabled, p_include_private, gen_random_uuid())
  ON CONFLICT (user_id, year)
  DO UPDATE SET 
    share_enabled = EXCLUDED.share_enabled,
    include_private = EXCLUDED.include_private,
    share_token = CASE 
      WHEN EXCLUDED.share_enabled THEN COALESCE(public.recaps.share_token, gen_random_uuid())
      ELSE public.recaps.share_token
    END
  RETURNING share_token INTO v_token;

  RETURN v_token;
END;
$$;
-- Migration: Phase 21 Growth & Opt-in SEO
-- Adds allow_indexing flag to profiles and functions for indexable public URLs and personal referral generation

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS allow_indexing BOOLEAN NOT NULL DEFAULT FALSE;

-- RPC to retrieve indexable profiles for dynamic sitemap generation
CREATE OR REPLACE FUNCTION public.get_indexable_public_profiles()
RETURNS TABLE (
  username TEXT,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.username,
    p.created_at AS updated_at
  FROM public.profiles p
  WHERE p.is_private = false
    AND p.allow_indexing = true
    AND p.deletion_pending_at IS NULL
    AND p.discoverable = true;
END;
$$;

-- RPC to generate personal invite referral code (max 10 redemptions)
CREATE OR REPLACE FUNCTION public.create_personal_referral_code(p_custom_suffix TEXT DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := (SELECT auth.uid());
  v_username TEXT;
  v_code TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT username INTO v_username FROM public.profiles WHERE id = v_user_id;

  v_code := UPPER(CONCAT(COALESCE(p_custom_suffix, v_username), '-', SUBSTRING(gen_random_uuid()::text FROM 1 FOR 4)));

  INSERT INTO public.invite_codes (code, created_by, max_uses, uses_count, expires_at)
  VALUES (v_code, v_user_id, 10, 0, now() + INTERVAL '90 days')
  ON CONFLICT (code) DO NOTHING;

  RETURN v_code;
END;
$$;
-- Migration: Phase 23 Trust and Safety at Scale
-- Tables: user_strikes, suspensions, appeals, trusted_reporters, spam_signals, content_hashes
-- All tables with RLS enabled, explicit policies, and SECURITY DEFINER helpers

-- 1. User Strikes
CREATE TABLE IF NOT EXISTS public.user_strikes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  issued_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '90 days')
);
CREATE INDEX IF NOT EXISTS idx_user_strikes_user ON public.user_strikes(user_id);
ALTER TABLE public.user_strikes ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_strikes_select ON public.user_strikes
  FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

CREATE POLICY user_strikes_admin ON public.user_strikes
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

-- 2. User Suspensions
CREATE TABLE IF NOT EXISTS public.suspensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,
  reason TEXT NOT NULL,
  issued_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true
);
CREATE INDEX IF NOT EXISTS idx_suspensions_user ON public.suspensions(user_id, is_active);
ALTER TABLE public.suspensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY suspensions_select ON public.suspensions
  FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

CREATE POLICY suspensions_admin ON public.suspensions
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

-- 3. Appeals
CREATE TABLE IF NOT EXISTS public.appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_id UUID REFERENCES public.moderation_actions(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  handled_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_appeals_user ON public.appeals(user_id);
ALTER TABLE public.appeals ENABLE ROW LEVEL SECURITY;

CREATE POLICY appeals_select ON public.appeals
  FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

CREATE POLICY appeals_insert ON public.appeals
  FOR INSERT
  WITH CHECK (
    (SELECT auth.uid()) = user_id
  );

CREATE POLICY appeals_admin ON public.appeals
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

-- 4. Trusted Reporters
CREATE TABLE IF NOT EXISTS public.trusted_reporters (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  trust_score NUMERIC NOT NULL DEFAULT 1.0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.trusted_reporters ENABLE ROW LEVEL SECURITY;

CREATE POLICY trusted_reporters_admin ON public.trusted_reporters
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

-- 5. Spam Signals
CREATE TABLE IF NOT EXISTS public.spam_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  signal TEXT NOT NULL,
  score NUMERIC NOT NULL DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_spam_signals_user ON public.spam_signals(user_id);
ALTER TABLE public.spam_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY spam_signals_admin ON public.spam_signals
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

-- 6. Content Hashes (for known-bad content prevention)
CREATE TABLE IF NOT EXISTS public.content_hashes (
  sha256 TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'blocked',
  added_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.content_hashes ENABLE ROW LEVEL SECURITY;

CREATE POLICY content_hashes_admin ON public.content_hashes
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

-- Helper RPC: Submit User Appeal
CREATE OR REPLACE FUNCTION public.submit_user_appeal(
  p_action_id UUID,
  p_text TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := (SELECT auth.uid());
  v_appeal_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF length(trim(p_text)) < 10 THEN
    RAISE EXCEPTION 'Appeal explanation must be at least 10 characters';
  END IF;

  INSERT INTO public.appeals (user_id, action_id, text, status)
  VALUES (v_user_id, p_action_id, trim(p_text), 'pending')
  RETURNING id INTO v_appeal_id;

  RETURN v_appeal_id;
END;
$$;

-- Helper RPC: Check User Suspension
CREATE OR REPLACE FUNCTION public.check_user_is_suspended(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.suspensions
    WHERE user_id = p_user_id
      AND is_active = true
      AND (ends_at IS NULL OR ends_at > now())
  );
END;
$$;
-- Migration: Phase 24 Scale, Cost, and Storage Quotas
-- Storage quotas tracking, covering indexes on high-throughput feed/notification paths, and usage RPC

-- 1. Storage Quotas Table
CREATE TABLE IF NOT EXISTS public.storage_quotas (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  quota_bytes BIGINT NOT NULL DEFAULT 2147483648, -- 2 GB default quota
  used_bytes BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.storage_quotas ENABLE ROW LEVEL SECURITY;

-- Explicit RLS Policies: Owner can read their quota
CREATE POLICY storage_quotas_select ON public.storage_quotas
  FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

CREATE POLICY storage_quotas_admin ON public.storage_quotas
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

-- 2. Covering Indexes for High-Throughput Public Feed and Query Paths
CREATE INDEX IF NOT EXISTS idx_food_experiences_public_feed
  ON public.food_experiences(status, visibility, eaten_at DESC)
  INCLUDE (id, user_id, place_id, rating);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications(user_id, is_read, created_at DESC);

-- 3. Storage Usage RPC
CREATE OR REPLACE FUNCTION public.get_user_storage_usage(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_viewer UUID := (SELECT auth.uid());
  v_quota BIGINT := 2147483648; -- 2 GB
  v_used BIGINT := 0;
  v_percent NUMERIC := 0.0;
BEGIN
  -- Strict owner or admin check
  IF v_viewer IS NULL OR (v_viewer != p_user_id AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = v_viewer AND is_admin = true
  )) THEN
    RETURN NULL;
  END IF;

  SELECT quota_bytes, used_bytes
  INTO v_quota, v_used
  FROM public.storage_quotas
  WHERE user_id = p_user_id;

  IF v_quota IS NULL THEN
    v_quota := 2147483648;
    v_used := 0;
  END IF;

  IF v_quota > 0 THEN
    v_percent := ROUND((v_used::numeric / v_quota::numeric) * 100, 1);
  END IF;

  RETURN jsonb_build_object(
    'user_id', p_user_id,
    'quota_bytes', v_quota,
    'used_bytes', v_used,
    'percentage', v_percent,
    'is_near_quota', (v_percent >= 85.0)
  );
END;
$$;
-- Migration: Phase 25 Multi-City Expansion and Reference Data
-- Table: cities
-- Links places.city_id and profiles.city_id to cities table with RLS and active cities RPC

CREATE TABLE IF NOT EXISTS public.cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_local TEXT,
  state TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'India',
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

-- Explicit RLS Policies: Reference data readable by anyone
CREATE POLICY cities_select ON public.cities
  FOR SELECT
  USING (true);

CREATE POLICY cities_admin ON public.cities
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

-- Add city_id FKs to places and profiles
ALTER TABLE public.places
  ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES public.cities(id) ON DELETE SET NULL;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES public.cities(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_places_city_id ON public.places(city_id);
CREATE INDEX IF NOT EXISTS idx_profiles_city_id ON public.profiles(city_id);

-- Seed initial cities (Hyderabad beta anchor + future regional clusters)
INSERT INTO public.cities (slug, name, name_local, state, country, lat, lng, timezone, is_active)
VALUES 
  ('hyderabad', 'Hyderabad', 'హైదరాబాద్', 'Telangana', 'India', 17.3850, 78.4867, 'Asia/Kolkata', true),
  ('bengaluru', 'Bengaluru', 'ಬೆಂಗಳೂರು', 'Karnataka', 'India', 12.9716, 77.5946, 'Asia/Kolkata', true),
  ('mumbai', 'Mumbai', 'मुंबई', 'Maharashtra', 'India', 19.0760, 72.8777, 'Asia/Kolkata', true),
  ('delhi-ncr', 'Delhi-NCR', 'दिल्ली', 'Delhi', 'India', 28.6139, 77.2090, 'Asia/Kolkata', true)
ON CONFLICT (slug) DO NOTHING;

-- Backfill existing Hyderabad places
UPDATE public.places 
SET city_id = (SELECT id FROM public.cities WHERE slug = 'hyderabad')
WHERE city ILIKE 'hyderabad' AND city_id IS NULL;

-- RPC to list active cities
CREATE OR REPLACE FUNCTION public.get_active_cities()
RETURNS TABLE (
  id UUID,
  slug TEXT,
  name TEXT,
  name_local TEXT,
  state TEXT,
  country TEXT,
  timezone TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.slug,
    c.name,
    c.name_local,
    c.state,
    c.country,
    c.timezone
  FROM public.cities c
  WHERE c.is_active = true
  ORDER BY (c.slug = 'hyderabad') DESC, c.name ASC;
END;
$$;
-- Migration: Phase 26 Creator Tools and Private Analytics
-- Tables: entry_stats_daily, profile_stats_daily
-- Aggregated daily metrics with strictly owner-only RLS and privacy guarantees (no viewer tracking)

CREATE TABLE IF NOT EXISTS public.entry_stats_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES public.food_experiences(id) ON DELETE CASCADE,
  day DATE NOT NULL DEFAULT CURRENT_DATE,
  views INT NOT NULL DEFAULT 0,
  saves INT NOT NULL DEFAULT 0,
  likes INT NOT NULL DEFAULT 0,
  comment_count INT NOT NULL DEFAULT 0,
  CONSTRAINT uq_entry_stats_day UNIQUE(entry_id, day)
);

CREATE TABLE IF NOT EXISTS public.profile_stats_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day DATE NOT NULL DEFAULT CURRENT_DATE,
  profile_views INT NOT NULL DEFAULT 0,
  new_followers INT NOT NULL DEFAULT 0,
  CONSTRAINT uq_profile_stats_day UNIQUE(profile_id, day)
);

CREATE INDEX IF NOT EXISTS idx_entry_stats_daily_entry ON public.entry_stats_daily(entry_id, day);
CREATE INDEX IF NOT EXISTS idx_profile_stats_daily_profile ON public.profile_stats_daily(profile_id, day);

-- Enable RLS
ALTER TABLE public.entry_stats_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_stats_daily ENABLE ROW LEVEL SECURITY;

-- Explicit RLS Policies: Strictly Entry/Profile Owner Only
CREATE POLICY entry_stats_daily_select ON public.entry_stats_daily
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.food_experiences fe
      WHERE fe.id = entry_stats_daily.entry_id
        AND fe.user_id = (SELECT auth.uid())
    )
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

CREATE POLICY entry_stats_daily_admin ON public.entry_stats_daily
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

CREATE POLICY profile_stats_daily_select ON public.profile_stats_daily
  FOR SELECT
  USING (
    (SELECT auth.uid()) = profile_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

CREATE POLICY profile_stats_daily_admin ON public.profile_stats_daily
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

-- RPC for Creator Analytics Summary
CREATE OR REPLACE FUNCTION public.get_creator_analytics(p_profile_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_viewer UUID := (SELECT auth.uid());
  v_total_views BIGINT := 0;
  v_total_saves BIGINT := 0;
  v_total_likes BIGINT := 0;
  v_daily_reach JSONB;
BEGIN
  -- Strict owner check
  IF v_viewer IS NULL OR v_viewer != p_profile_id THEN
    RETURN NULL;
  END IF;

  -- Compute totals from daily aggregated stats
  SELECT 
    COALESCE(SUM(views), 0),
    COALESCE(SUM(saves), 0),
    COALESCE(SUM(likes), 0)
  INTO v_total_views, v_total_saves, v_total_likes
  FROM public.entry_stats_daily esd
  JOIN public.food_experiences fe ON fe.id = esd.entry_id
  WHERE fe.user_id = p_profile_id
    AND esd.day >= CURRENT_DATE - INTERVAL '30 days';

  -- Aggregate 30-day timeline
  SELECT jsonb_agg(
    jsonb_build_object(
      'day', day_series::date,
      'views', COALESCE(SUM(esd.views), 0),
      'saves', COALESCE(SUM(esd.saves), 0)
    ) ORDER BY day_series::date ASC
  )
  INTO v_daily_reach
  FROM generate_series(CURRENT_DATE - INTERVAL '29 days', CURRENT_DATE, INTERVAL '1 day') AS day_series
  LEFT JOIN (
    SELECT esd.day, esd.views, esd.saves
    FROM public.entry_stats_daily esd
    JOIN public.food_experiences fe ON fe.id = esd.entry_id
    WHERE fe.user_id = p_profile_id
  ) esd ON esd.day = day_series::date
  GROUP BY day_series::date;

  RETURN jsonb_build_object(
    'profile_id', p_profile_id,
    'total_views_30d', v_total_views,
    'total_saves_30d', v_total_saves,
    'total_likes_30d', v_total_likes,
    'daily_reach', COALESCE(v_daily_reach, '[]'::jsonb)
  );
END;
$$;
-- Migration: Phase 27 Import and Data Portability
-- Table: import_batches
-- Implements batch import of historical food notes into private drafts (never leaking to public feeds)

CREATE TABLE IF NOT EXISTS public.import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  total_rows INT NOT NULL DEFAULT 0,
  imported_rows INT NOT NULL DEFAULT 0,
  errors JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_import_batches_user ON public.import_batches(user_id);

-- Enable RLS
ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY import_batches_select ON public.import_batches
  FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

CREATE POLICY import_batches_insert ON public.import_batches
  FOR INSERT
  WITH CHECK (
    (SELECT auth.uid()) = user_id
  );

CREATE POLICY import_batches_admin ON public.import_batches
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

-- SECURITY DEFINER RPC to import food entries into private drafts
CREATE OR REPLACE FUNCTION public.import_food_entries(
  p_batch_id UUID,
  p_entries JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := (SELECT auth.uid());
  v_entry JSONB;
  v_imported_count INT := 0;
  v_new_exp_id UUID;
  v_dish_name TEXT;
  v_dish_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  FOR v_entry IN SELECT * FROM jsonb_array_elements(p_entries)
  LOOP
    -- Insert strictly as private draft
    INSERT INTO public.food_experiences (
      user_id,
      title,
      description,
      eaten_at,
      status,
      visibility,
      client_request_id
    ) VALUES (
      v_user_id,
      v_entry->>'title',
      v_entry->>'notes',
      COALESCE((v_entry->>'eaten_at')::timestamptz, now()),
      'draft',
      'private',
      v_entry->>'client_request_id'
    )
    ON CONFLICT (client_request_id) DO NOTHING
    RETURNING id INTO v_new_exp_id;

    IF v_new_exp_id IS NOT NULL THEN
      v_imported_count := v_imported_count + 1;

      -- Optional single dish attachment if supplied
      v_dish_name := trim(COALESCE(v_entry->>'dish', ''));
      IF length(v_dish_name) > 0 THEN
        -- Find or create unlisted dish
        SELECT id INTO v_dish_id FROM public.dishes WHERE lower(name) = lower(v_dish_name) LIMIT 1;
        IF v_dish_id IS NULL THEN
          INSERT INTO public.dishes (name, normalized_name, created_by, is_listed)
          VALUES (v_dish_name, lower(v_dish_name), v_user_id, false)
          RETURNING id INTO v_dish_id;
        END IF;

        INSERT INTO public.experience_dishes (
          experience_id,
          dish_id,
          display_name,
          rating
        ) VALUES (
          v_new_exp_id,
          v_dish_id,
          v_dish_name,
          (v_entry->>'rating')::smallint
        );
      END IF;
    END IF;
  END LOOP;

  -- Update batch record
  UPDATE public.import_batches
  SET 
    imported_rows = v_imported_count,
    status = 'completed'
  WHERE id = p_batch_id AND user_id = v_user_id;

  RETURN jsonb_build_object(
    'batch_id', p_batch_id,
    'imported_count', v_imported_count
  );
END;
$$;
-- Migration: Phase 28 Smart Logging Assist (Opt-in)
-- Table: ai_assist_preferences
-- Implements consent-gated dish assistance with strict daily quota and fallback to manual logging

CREATE TABLE IF NOT EXISTS public.ai_assist_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  daily_quota_used INT NOT NULL DEFAULT 0,
  max_daily_quota INT NOT NULL DEFAULT 20,
  last_reset_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_assist_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_assist_preferences_select ON public.ai_assist_preferences
  FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

CREATE POLICY ai_assist_preferences_all ON public.ai_assist_preferences
  FOR ALL
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

-- RPC for Opt-in Dish Suggestions
CREATE OR REPLACE FUNCTION public.get_ai_assist_dishes(
  p_cuisine TEXT DEFAULT NULL,
  p_hint TEXT DEFAULT NULL
)
RETURNS TABLE (
  dish_name TEXT,
  source TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := (SELECT auth.uid());
  v_enabled BOOLEAN := false;
  v_used INT := 0;
  v_max INT := 20;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT enabled, daily_quota_used, max_daily_quota
  INTO v_enabled, v_used, v_max
  FROM public.ai_assist_preferences
  WHERE user_id = v_user_id;

  -- Require explicit opt-in and available quota
  IF NOT COALESCE(v_enabled, false) OR v_used >= v_max THEN
    RETURN;
  END IF;

  -- Increment daily quota usage
  UPDATE public.ai_assist_preferences
  SET daily_quota_used = daily_quota_used + 1
  WHERE user_id = v_user_id;

  -- Return matching reference dishes based on cuisine or hint
  RETURN QUERY
  SELECT d.name AS dish_name, 'reference_pool'::text AS source
  FROM public.dishes d
  WHERE d.is_listed = true
    AND (
      p_hint IS NULL 
      OR d.name ILIKE '%' || p_hint || '%'
      OR d.normalized_name ILIKE '%' || p_hint || '%'
    )
  ORDER BY d.created_at DESC
  LIMIT 3;
END;
$$;
-- Migration: Phase 29 Taste Matching and Explainable Recommendations
-- Tables: user_taste_vectors, dish_similarity, rec_feedback
-- Adds allow_taste_comparison to profiles; RLS enabled on all tables

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS allow_taste_comparison BOOLEAN NOT NULL DEFAULT false;

-- 1. User Taste Vectors (Strictly owner-only)
CREATE TABLE IF NOT EXISTS public.user_taste_vectors (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  top_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  top_cuisines JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_taste_vectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_taste_vectors_select ON public.user_taste_vectors
  FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

CREATE POLICY user_taste_vectors_admin ON public.user_taste_vectors
  FOR ALL
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

-- 2. Dish Similarity (Public reference co-occurrence)
CREATE TABLE IF NOT EXISTS public.dish_similarity (
  dish_a_id UUID NOT NULL REFERENCES public.dishes(id) ON DELETE CASCADE,
  dish_b_id UUID NOT NULL REFERENCES public.dishes(id) ON DELETE CASCADE,
  score NUMERIC NOT NULL DEFAULT 1.0,
  PRIMARY KEY (dish_a_id, dish_b_id)
);
ALTER TABLE public.dish_similarity ENABLE ROW LEVEL SECURITY;

CREATE POLICY dish_similarity_select ON public.dish_similarity
  FOR SELECT
  USING (true);

CREATE POLICY dish_similarity_admin ON public.dish_similarity
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

-- 3. Recommendation Feedback (Dismissals and 'Not Interested' signals)
CREATE TABLE IF NOT EXISTS public.rec_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  signal TEXT NOT NULL CHECK (signal IN ('dismiss', 'not_interested')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rec_feedback_user ON public.rec_feedback(user_id, target_id);
ALTER TABLE public.rec_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY rec_feedback_select ON public.rec_feedback
  FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

CREATE POLICY rec_feedback_insert ON public.rec_feedback
  FOR INSERT
  WITH CHECK (
    (SELECT auth.uid()) = user_id
  );

CREATE POLICY rec_feedback_admin ON public.rec_feedback
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

-- RPC for Explainable Taste Recommendations
CREATE OR REPLACE FUNCTION public.get_taste_recommendations(p_user_id UUID)
RETURNS TABLE (
  dish_id UUID,
  dish_name TEXT,
  reason TEXT,
  public_rating_avg NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_viewer UUID := (SELECT auth.uid());
BEGIN
  IF v_viewer IS NULL OR v_viewer != p_user_id THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    d.id AS dish_id,
    d.name AS dish_name,
    'Popular in Hyderabad with highly rated experiences'::text AS reason,
    ROUND(dps.public_rating_avg::numeric, 1) AS public_rating_avg
  FROM public.dishes d
  JOIN public.dish_public_stats dps ON dps.dish_id = d.id
  WHERE d.is_listed = true
    AND dps.public_experience_count >= 1
    AND NOT EXISTS (
      -- Exclude dismissed recommendations
      SELECT 1 FROM public.rec_feedback rf
      WHERE rf.user_id = p_user_id AND rf.target_id = d.id
    )
  ORDER BY dps.public_rating_avg DESC NULLS LAST
  LIMIT 5;
END;
$$;

-- RPC for Dismissing Recommendation
CREATE OR REPLACE FUNCTION public.dismiss_recommendation(
  p_target_id UUID,
  p_target_type TEXT,
  p_signal TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := (SELECT auth.uid());
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  INSERT INTO public.rec_feedback (user_id, target_id, target_type, signal)
  VALUES (v_user_id, p_target_id, p_target_type, p_signal);
END;
$$;
-- Migration: Phase 30 Group Food Planning
-- Tables: collection_members, plans, plan_votes
-- RLS enabled on all tables; explicit policies and indexes on policy columns; RPCs for voting and draft conversion

-- 1. Collection Members (Role-based collaboration)
CREATE TABLE IF NOT EXISTS public.collection_members (
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('editor', 'viewer')),
  status TEXT NOT NULL CHECK (status IN ('invited', 'accepted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (collection_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_collection_members_user ON public.collection_members(user_id);
ALTER TABLE public.collection_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY collection_members_select ON public.collection_members
  FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.owner_id = (SELECT auth.uid()))
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

CREATE POLICY collection_members_insert ON public.collection_members
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.owner_id = (SELECT auth.uid()))
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

CREATE POLICY collection_members_update ON public.collection_members
  FOR UPDATE
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.owner_id = (SELECT auth.uid()))
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

CREATE POLICY collection_members_delete ON public.collection_members
  FOR DELETE
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.owner_id = (SELECT auth.uid()))
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

-- 2. Plans (Co-planned outings and meal decisions)
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  planned_for TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'decided', 'completed', 'cancelled')),
  decided_item_id UUID REFERENCES public.collection_items(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_plans_collection ON public.plans(collection_id);
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY plans_select ON public.plans
  FOR SELECT
  USING (
    created_by = (SELECT auth.uid())
    OR EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.owner_id = (SELECT auth.uid()))
    OR EXISTS (SELECT 1 FROM public.collection_members cm WHERE cm.collection_id = plans.collection_id AND cm.user_id = (SELECT auth.uid()) AND cm.status = 'accepted')
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

CREATE POLICY plans_insert ON public.plans
  FOR INSERT
  WITH CHECK (
    created_by = (SELECT auth.uid())
    AND (
      EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.owner_id = (SELECT auth.uid()))
      OR EXISTS (SELECT 1 FROM public.collection_members cm WHERE cm.collection_id = plans.collection_id AND cm.user_id = (SELECT auth.uid()) AND cm.status = 'accepted' AND cm.role = 'editor')
      OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
    )
  );

CREATE POLICY plans_update ON public.plans
  FOR UPDATE
  USING (
    created_by = (SELECT auth.uid())
    OR EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.owner_id = (SELECT auth.uid()))
    OR EXISTS (SELECT 1 FROM public.collection_members cm WHERE cm.collection_id = plans.collection_id AND cm.user_id = (SELECT auth.uid()) AND cm.status = 'accepted' AND cm.role = 'editor')
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

CREATE POLICY plans_delete ON public.plans
  FOR DELETE
  USING (
    created_by = (SELECT auth.uid())
    OR EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.owner_id = (SELECT auth.uid()))
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

-- 3. Plan Votes (Candidate venue/dish voting)
CREATE TABLE IF NOT EXISTS public.plan_votes (
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.collection_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vote TEXT NOT NULL CHECK (vote IN ('up', 'down')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (plan_id, item_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_plan_votes_plan ON public.plan_votes(plan_id);
ALTER TABLE public.plan_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY plan_votes_select ON public.plan_votes
  FOR SELECT
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.plans p
      JOIN public.collections c ON c.id = p.collection_id
      WHERE p.id = plan_id
        AND (c.owner_id = (SELECT auth.uid()) OR EXISTS (SELECT 1 FROM public.collection_members cm WHERE cm.collection_id = c.id AND cm.user_id = (SELECT auth.uid()) AND cm.status = 'accepted'))
    )
    OR EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = (SELECT auth.uid()) AND pr.is_admin = true)
  );

CREATE POLICY plan_votes_insert ON public.plan_votes
  FOR INSERT
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.plans p
      JOIN public.collections c ON c.id = p.collection_id
      WHERE p.id = plan_id
        AND (c.owner_id = (SELECT auth.uid()) OR EXISTS (SELECT 1 FROM public.collection_members cm WHERE cm.collection_id = c.id AND cm.user_id = (SELECT auth.uid()) AND cm.status = 'accepted'))
    )
  );

CREATE POLICY plan_votes_update ON public.plan_votes
  FOR UPDATE
  USING (
    user_id = (SELECT auth.uid())
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
  );

CREATE POLICY plan_votes_delete ON public.plan_votes
  FOR DELETE
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = (SELECT auth.uid()) AND pr.is_admin = true)
  );

-- RPC for casting a vote on a plan candidate item
CREATE OR REPLACE FUNCTION public.cast_plan_vote(
  p_plan_id UUID,
  p_item_id UUID,
  p_vote TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := (SELECT auth.uid());
  v_coll_id UUID;
  v_is_authorized BOOLEAN;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT p.collection_id INTO v_coll_id
  FROM public.plans p
  WHERE p.id = p_plan_id;

  IF v_coll_id IS NULL THEN
    RAISE EXCEPTION 'Plan not found';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.collections c
    WHERE c.id = v_coll_id AND c.owner_id = v_user_id
    UNION ALL
    SELECT 1 FROM public.collection_members cm
    WHERE cm.collection_id = v_coll_id AND cm.user_id = v_user_id AND cm.status = 'accepted'
  ) INTO v_is_authorized;

  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'Not authorized to vote on this plan';
  END IF;

  INSERT INTO public.plan_votes (plan_id, item_id, user_id, vote)
  VALUES (p_plan_id, p_item_id, v_user_id, p_vote)
  ON CONFLICT (plan_id, item_id, user_id)
  DO UPDATE SET vote = p_vote, created_at = now();
END;
$$;

-- RPC for converting decided plan to private meal drafts for all members
CREATE OR REPLACE FUNCTION public.convert_plan_to_meal_drafts(p_plan_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller UUID := (SELECT auth.uid());
  v_plan RECORD;
  v_member RECORD;
  v_draft_id UUID;
  v_count INT := 0;
  v_target_dish_id UUID;
  v_target_place_id UUID;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT p.*, c.owner_id AS coll_owner_id
  INTO v_plan
  FROM public.plans p
  JOIN public.collections c ON c.id = p.collection_id
  WHERE p.id = p_plan_id;

  IF v_plan.id IS NULL THEN
    RAISE EXCEPTION 'Plan not found';
  END IF;

  -- Ensure caller is owner or accepted editor/member
  IF v_plan.coll_owner_id != v_caller AND NOT EXISTS (
    SELECT 1 FROM public.collection_members cm
    WHERE cm.collection_id = v_plan.collection_id AND cm.user_id = v_caller AND cm.status = 'accepted'
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Check candidate item if decided
  IF v_plan.decided_item_id IS NOT NULL THEN
    SELECT ci.dish_id, ci.place_id
    INTO v_target_dish_id, v_target_place_id
    FROM public.collection_items ci
    WHERE ci.id = v_plan.decided_item_id;
  END IF;

  -- Create private meal draft for collection owner and accepted members
  FOR v_member IN (
    SELECT v_plan.coll_owner_id AS uid
    UNION
    SELECT cm.user_id AS uid
    FROM public.collection_members cm
    WHERE cm.collection_id = v_plan.collection_id AND cm.status = 'accepted'
  ) LOOP
    v_draft_id := gen_random_uuid();
    INSERT INTO public.food_experiences (
      id,
      user_id,
      title,
      eaten_at,
      status,
      visibility,
      place_id
    ) VALUES (
      v_draft_id,
      v_member.uid,
      v_plan.title,
      COALESCE(v_plan.planned_for, now()),
      'draft',
      'private',
      v_target_place_id
    );

    IF v_target_dish_id IS NOT NULL THEN
      INSERT INTO public.experience_dishes (
        experience_id,
        dish_id,
        sort_order
      ) VALUES (
        v_draft_id,
        v_target_dish_id,
        0
      );
    END IF;

    v_count := v_count + 1;
  END LOOP;

  -- Update plan status
  UPDATE public.plans
  SET status = 'completed', updated_at = now()
  WHERE id = p_plan_id;

  RETURN v_count;
END;
$$;
-- Migration: Phase 31 Sustainability & MORS Plus
-- Tables: subscriptions, entitlement_grants
-- Strict RLS; no client mutation (webhook/service-role and SECURITY DEFINER RPC only)
-- Graceful downgrade: zero data deletion on cancellation; free tier remains 100% usable

-- 1. Subscriptions Table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'razorpay', 'test')),
  provider_sub_id TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL CHECK (plan IN ('plus_monthly', 'plus_annual', 'patron')),
  status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY subscriptions_select ON public.subscriptions
  FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

CREATE POLICY subscriptions_admin ON public.subscriptions
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

-- 2. Entitlement Grants (Specific capability grants e.g. storage boost, printable recap)
CREATE TABLE IF NOT EXISTS public.entitlement_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  entitlement_key TEXT NOT NULL CHECK (entitlement_key IN ('storage_boost_10gb', 'printable_recap', 'advanced_analytics', 'custom_theme')),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  PRIMARY KEY (id),
  UNIQUE (user_id, entitlement_key)
);
CREATE INDEX IF NOT EXISTS idx_entitlement_grants_user ON public.entitlement_grants(user_id);
ALTER TABLE public.entitlement_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY entitlement_grants_select ON public.entitlement_grants
  FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

CREATE POLICY entitlement_grants_admin ON public.entitlement_grants
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );

-- RPC for Entitlement Verification (server-side only)
CREATE OR REPLACE FUNCTION public.has_entitlement(
  p_user_id UUID,
  p_key TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_has_active_sub BOOLEAN := false;
  v_has_grant BOOLEAN := false;
BEGIN
  -- Check active subscription
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.user_id = p_user_id
      AND s.status IN ('active', 'trialing')
      AND s.current_period_end > now()
  ) INTO v_has_active_sub;

  IF v_has_active_sub THEN
    RETURN true;
  END IF;

  -- Check explicit entitlement grant
  SELECT EXISTS (
    SELECT 1 FROM public.entitlement_grants eg
    WHERE eg.user_id = p_user_id
      AND eg.entitlement_key = p_key
      AND (eg.expires_at IS NULL OR eg.expires_at > now())
  ) INTO v_has_grant;

  RETURN v_has_grant;
END;
$$;

-- RPC for One-Click User Subscription Cancellation
CREATE OR REPLACE FUNCTION public.cancel_user_subscription(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller UUID := (SELECT auth.uid());
BEGIN
  IF v_caller IS NULL OR v_caller != p_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.subscriptions
  SET cancel_at_period_end = true, updated_at = now()
  WHERE user_id = p_user_id
    AND status IN ('active', 'trialing');

  RETURN FOUND;
END;
$$;
-- ==============================================================================
-- MORS Database Migration: 20261110000033_guard_profile_columns.sql
-- Work Package WP-2.1: Column-level write protection on public.profiles (SEC-001)
-- ==============================================================================

-- 1. Trigger Function to Guard Sensitive Columns on public.profiles
CREATE OR REPLACE FUNCTION public.guard_profile_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller_id uuid;
  v_caller_role text;
BEGIN
  v_caller_id := (SELECT auth.uid());

  -- If called by system/service-role without an auth user context, allow system updates
  IF v_caller_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- 1. Guard 'role' column against self-escalation
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    SELECT role INTO v_caller_role
    FROM public.profiles
    WHERE id = v_caller_id;

    IF v_caller_role IS DISTINCT FROM 'admin' THEN
      RAISE EXCEPTION 'Unauthorized: Only administrators can modify profile roles (SEC-001 violation prevented).';
    END IF;
  END IF;

  -- 2. Guard counter columns against client manipulation
  -- Counters must only be modified via database triggers (e.g. follows/experiences count triggers)
  IF NEW.followers_count IS DISTINCT FROM OLD.followers_count THEN
    -- Discard any client-supplied counter alteration; preserve existing or system value
    NEW.followers_count := OLD.followers_count;
  END IF;

  IF NEW.following_count IS DISTINCT FROM OLD.following_count THEN
    NEW.following_count := OLD.following_count;
  END IF;

  IF NEW.experiences_count IS DISTINCT FROM OLD.experiences_count THEN
    NEW.experiences_count := OLD.experiences_count;
  END IF;

  -- 3. Guard 'onboarding_completed_at' once set
  IF OLD.onboarding_completed_at IS NOT NULL AND NEW.onboarding_completed_at IS NULL THEN
    NEW.onboarding_completed_at := OLD.onboarding_completed_at;
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Attach BEFORE UPDATE trigger to public.profiles
DROP TRIGGER IF EXISTS trg_guard_profile_columns ON public.profiles;
CREATE TRIGGER trg_guard_profile_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_profile_columns();

-- 3. Storage Upload Validation Reinforcement
-- Ensure experience-photos bucket enforces 10MB limit and valid extension
CREATE OR REPLACE FUNCTION public.validate_storage_upload_path(p_name text, p_bucket_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_folder text;
BEGIN
  -- Extract top-level folder
  v_user_folder := (storage.foldername(p_name))[1];
  
  -- Must match auth.uid()
  IF v_user_folder IS NULL OR v_user_folder <> (SELECT auth.uid())::text THEN
    RETURN false;
  END IF;

  -- Must end with supported image extension
  IF NOT (p_name ~* '\.(jpg|jpeg|png|webp)$') THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;
