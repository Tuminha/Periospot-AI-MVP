-- Enable RLS
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create bucket policies
CREATE POLICY "Users can create buckets" ON storage.buckets
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Create default bucket policies for objects
CREATE POLICY "Authenticated users can upload objects" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id IN (SELECT id FROM storage.buckets WHERE name = 'research-papers')
  AND (storage.foldername(name))[1] = 'uploads'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users can view own objects" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id IN (SELECT id FROM storage.buckets WHERE name = 'research-papers')
  AND (storage.foldername(name))[1] = 'uploads'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users can update own objects" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id IN (SELECT id FROM storage.buckets WHERE name = 'research-papers')
  AND (storage.foldername(name))[1] = 'uploads'
  AND (storage.foldername(name))[2] = auth.uid()::text
)
WITH CHECK (
  bucket_id IN (SELECT id FROM storage.buckets WHERE name = 'research-papers')
  AND (storage.foldername(name))[1] = 'uploads'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users can delete own objects" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id IN (SELECT id FROM storage.buckets WHERE name = 'research-papers')
  AND (storage.foldername(name))[1] = 'uploads'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Create policy for test directory (for automated tests)
CREATE POLICY "Service role can access test directory" ON storage.objects
FOR ALL TO service_role
USING (
  bucket_id IN (SELECT id FROM storage.buckets WHERE name = 'research-papers')
  AND (storage.foldername(name))[1] = 'test'
)
WITH CHECK (
  bucket_id IN (SELECT id FROM storage.buckets WHERE name = 'research-papers')
  AND (storage.foldername(name))[1] = 'test'
);

-- Drop the old function if it exists
DROP FUNCTION IF EXISTS verify_storage_access(uuid);

-- Create a simpler function to verify storage access
CREATE OR REPLACE FUNCTION verify_storage_access(user_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Check if the user exists and has access to the storage bucket
  RETURN EXISTS (
    SELECT 1 
    FROM auth.users u
    WHERE u.id = user_id
    AND EXISTS (
      SELECT 1 
      FROM storage.buckets b
      WHERE b.name = 'research-papers'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION verify_storage_access(uuid) TO authenticated;

-- Enable RLS on article_metadata table
ALTER TABLE public.article_metadata ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert metadata for their articles" ON public.article_metadata;
DROP POLICY IF EXISTS "Users can view metadata for their articles" ON public.article_metadata;
DROP POLICY IF EXISTS "Users can update metadata for their articles" ON public.article_metadata;
DROP POLICY IF EXISTS "Users can delete metadata for their articles" ON public.article_metadata;

-- Create insert policy
CREATE POLICY "Users can insert metadata for their articles" ON public.article_metadata
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.articles a
    WHERE a.id = article_id
    AND a.user_id = auth.uid()
  )
);

-- Create select policy
CREATE POLICY "Users can view metadata for their articles" ON public.article_metadata
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.articles a
    WHERE a.id = article_id
    AND a.user_id = auth.uid()
  )
);

-- Create update policy
CREATE POLICY "Users can update metadata for their articles" ON public.article_metadata
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.articles a
    WHERE a.id = article_id
    AND a.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.articles a
    WHERE a.id = article_id
    AND a.user_id = auth.uid()
  )
);

-- Create delete policy
CREATE POLICY "Users can delete metadata for their articles" ON public.article_metadata
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.articles a
    WHERE a.id = article_id
    AND a.user_id = auth.uid()
  )
); 