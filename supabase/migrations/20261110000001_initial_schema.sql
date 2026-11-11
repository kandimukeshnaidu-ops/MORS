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
  is_admin boolean GENERATED ALWAYS AS (role = 'admin') STORED,
  onboarding_completed_at timestamptz,
  deletion_requested_at timestamptz,
  deletion_pending_at timestamptz,
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

CREATE OR REPLACE FUNCTION public.is_blocked_bidirectional(a uuid, b uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.is_blocked_between(a, b);
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
