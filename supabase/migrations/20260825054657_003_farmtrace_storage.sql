/*
# FarmTrace Storage Bucket

Creates a public storage bucket `produce-photos` for farmer produce batch images.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('produce-photos', 'produce-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read
DROP POLICY IF EXISTS "public_read_produce_photos" ON storage.objects;
CREATE POLICY "public_read_produce_photos" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'produce-photos');

-- Allow authenticated upload to own folder
DROP POLICY IF EXISTS "auth_upload_produce_photos" ON storage.objects;
CREATE POLICY "auth_upload_produce_photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'produce-photos');

-- Allow authenticated update/delete own files
DROP POLICY IF EXISTS "auth_update_produce_photos" ON storage.objects;
CREATE POLICY "auth_update_produce_photos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'produce-photos' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'produce-photos');

DROP POLICY IF EXISTS "auth_delete_produce_photos" ON storage.objects;
CREATE POLICY "auth_delete_produce_photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'produce-photos' AND owner = auth.uid());
