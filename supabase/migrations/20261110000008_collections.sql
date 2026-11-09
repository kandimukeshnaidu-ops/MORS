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
