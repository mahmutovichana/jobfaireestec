-- Allow anonymous uploads to cv-uploads storage bucket
CREATE POLICY "Allow anonymous cv uploads"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'cv-uploads');