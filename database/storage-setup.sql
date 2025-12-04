-- =============================================
-- ANAJAK SUPERAPP - STORAGE SETUP
-- =============================================
-- Run this in Supabase SQL Editor
-- =============================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('designs', 'designs', false),
  ('mockups', 'mockups', false),
  ('payment-slips', 'payment-slips', false)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- RLS Policies for Storage
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can upload designs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view designs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update designs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete designs" ON storage.objects;

DROP POLICY IF EXISTS "Authenticated users can upload mockups" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view mockups" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update mockups" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete mockups" ON storage.objects;

DROP POLICY IF EXISTS "Authenticated users can upload payment slips" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view payment slips" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update payment slips" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete payment slips" ON storage.objects;

-- ==================== DESIGNS BUCKET ====================
CREATE POLICY "Authenticated users can upload designs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'designs' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view designs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'designs' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update designs"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'designs' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'designs' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete designs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'designs' AND auth.role() = 'authenticated');

-- ==================== MOCKUPS BUCKET ====================
CREATE POLICY "Authenticated users can upload mockups"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'mockups' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view mockups"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'mockups' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update mockups"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'mockups' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'mockups' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete mockups"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'mockups' AND auth.role() = 'authenticated');

-- ==================== PAYMENT SLIPS BUCKET ====================
CREATE POLICY "Authenticated users can upload payment slips"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'payment-slips' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view payment slips"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'payment-slips' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update payment slips"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'payment-slips' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'payment-slips' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete payment slips"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'payment-slips' AND auth.role() = 'authenticated');

-- =============================================
-- DONE!
-- =============================================

