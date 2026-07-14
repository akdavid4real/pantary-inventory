-- Recipe images are public to read, but authenticated users may only write
-- inside recipe-images/{auth.uid()}/.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('recipe-images', 'recipe-images', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public recipe image reads" ON storage.objects;
CREATE POLICY "Public recipe image reads" ON storage.objects
FOR SELECT TO public USING (bucket_id = 'recipe-images');

DROP POLICY IF EXISTS "Users upload recipe images" ON storage.objects;
CREATE POLICY "Users upload recipe images" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'recipe-images'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);

DROP POLICY IF EXISTS "Users update recipe images" ON storage.objects;
CREATE POLICY "Users update recipe images" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'recipe-images' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text))
WITH CHECK (bucket_id = 'recipe-images' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));

DROP POLICY IF EXISTS "Users delete recipe images" ON storage.objects;
CREATE POLICY "Users delete recipe images" ON storage.objects
FOR DELETE TO authenticated USING (
  bucket_id = 'recipe-images'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);
