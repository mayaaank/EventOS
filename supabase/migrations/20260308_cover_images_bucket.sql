-- =============================================================================
-- EventOS · Migration: Cover Images Storage Bucket
-- File: supabase/migrations/20260308_cover_images_bucket.sql
-- =============================================================================

-- =============================================================================
-- 1. CREATE THE STORAGE BUCKET
-- =============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cover-images',
  'cover-images',
  TRUE,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;


-- =============================================================================
-- 2. STORAGE RLS POLICIES
--
-- File path convention (enforced by INSERT policy):
--   cover-images/{user_id}/{event_id}
--
-- Examples:
--   cover-images/abc-123/evt-456        ← organizer abc uploads for event evt
--   cover-images/abc-123/evt-456-v2     ← updated cover
--
-- This means:
--   - You can always find an event's image by querying the event's created_by
--   - Users cannot upload into another user's folder
--   - Cleanup is straightforward (delete folder = delete all user's images)
-- =============================================================================

-- ── Public read ───────────────────────────────────────────────────────────────
-- Anyone (including unauthenticated) can view cover images.
-- Required for landing page + public event cards.
DROP POLICY IF EXISTS "cover_images_select_public" ON storage.objects;
CREATE POLICY "cover_images_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cover-images');


-- ── Upload (INSERT) ───────────────────────────────────────────────────────────
-- Authenticated users can only upload into their own folder:
--   cover-images/{their_user_id}/...
-- Prevents user A from overwriting user B's images.
DROP POLICY IF EXISTS "cover_images_insert_authenticated" ON storage.objects;
CREATE POLICY "cover_images_insert_authenticated"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'cover-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );


-- ── Update (upsert / replace) ────────────────────────────────────────────────
-- Users can only overwrite files in their own folder.
DROP POLICY IF EXISTS "cover_images_update_authenticated" ON storage.objects;
CREATE POLICY "cover_images_update_authenticated"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'cover-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );


-- ── Delete ────────────────────────────────────────────────────────────────────
-- FIX: was `auth.role() = 'authenticated'` which let ANY user delete ANY image.
-- Now restricted to files inside the user's own folder only.
DROP POLICY IF EXISTS "cover_images_delete_authenticated" ON storage.objects;
CREATE POLICY "cover_images_delete_authenticated"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'cover-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );