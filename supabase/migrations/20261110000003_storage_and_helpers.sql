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
