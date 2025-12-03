-- =============================================
-- ANAJAK SUPERAPP - STORAGE SETUP
-- =============================================
-- Run this in Supabase SQL Editor
-- =============================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('designs', 'designs', true),
  ('mockups', 'mockups', true),
  ('slips', 'slips', true),
  ('attachments', 'attachments', true)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- RLS Policies for Storage
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can upload designs" ON storage.objects;
DROP POLICY IF EXISTS "Public can view designs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete designs" ON storage.objects;

DROP POLICY IF EXISTS "Authenticated users can upload mockups" ON storage.objects;
DROP POLICY IF EXISTS "Public can view mockups" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete mockups" ON storage.objects;

DROP POLICY IF EXISTS "Authenticated users can upload slips" ON storage.objects;
DROP POLICY IF EXISTS "Public can view slips" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete slips" ON storage.objects;

DROP POLICY IF EXISTS "Authenticated users can upload attachments" ON storage.objects;
DROP POLICY IF EXISTS "Public can view attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete attachments" ON storage.objects;

-- Designs bucket policies
CREATE POLICY "Authenticated users can upload designs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'designs');

CREATE POLICY "Public can view designs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'designs');

CREATE POLICY "Authenticated users can delete designs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'designs');

-- Mockups bucket policies
CREATE POLICY "Authenticated users can upload mockups"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'mockups');

CREATE POLICY "Public can view mockups"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'mockups');

CREATE POLICY "Authenticated users can delete mockups"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'mockups');

-- Slips bucket policies
CREATE POLICY "Authenticated users can upload slips"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'slips');

CREATE POLICY "Public can view slips"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'slips');

CREATE POLICY "Authenticated users can delete slips"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'slips');

-- Attachments bucket policies
CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'attachments');

CREATE POLICY "Public can view attachments"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'attachments');

CREATE POLICY "Authenticated users can delete attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'attachments');

-- =============================================
-- DONE!
-- =============================================

