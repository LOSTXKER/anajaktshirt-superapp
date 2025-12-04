-- =============================================
-- ORDER SYSTEM TABLES - ตารางระบบออเดอร์
-- Run this SQL in Supabase SQL Editor
-- =============================================

-- 1. Order Status History - ประวัติการเปลี่ยนสถานะ
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by UUID REFERENCES user_profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for order_status_history
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created_at ON order_status_history(created_at);

-- 2. Order Notes - หมายเหตุออเดอร์
CREATE TABLE IF NOT EXISTS order_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT true,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for order_notes
CREATE INDEX IF NOT EXISTS idx_order_notes_order_id ON order_notes(order_id);

-- 2.5 Order Work Items (if not exists) - รายการงาน
CREATE TABLE IF NOT EXISTS order_work_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  work_type_code TEXT,
  work_type_name TEXT,
  position_code TEXT,
  position_name TEXT,
  print_size_code TEXT,
  print_size_name TEXT,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) DEFAULT 0,
  total_price DECIMAL(10,2) DEFAULT 0,
  description TEXT,
  status TEXT DEFAULT 'pending',
  production_job_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for order_work_items
CREATE INDEX IF NOT EXISTS idx_order_work_items_order_id ON order_work_items(order_id);

-- 3. Order Designs - งานออกแบบ
CREATE TABLE IF NOT EXISTS order_designs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  work_item_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  position_code TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'approved', 'rejected')),
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add work_item_id column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'order_designs' AND column_name = 'work_item_id') THEN
    ALTER TABLE order_designs ADD COLUMN work_item_id UUID;
  END IF;
END $$;

-- Index for order_designs
CREATE INDEX IF NOT EXISTS idx_order_designs_order_id ON order_designs(order_id);

-- 4. Design Versions - เวอร์ชันการออกแบบ
CREATE TABLE IF NOT EXISTS design_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  design_id UUID,
  version_number INTEGER NOT NULL DEFAULT 1,
  file_url TEXT,
  thumbnail_url TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES user_profiles(id),
  approved_at TIMESTAMPTZ,
  rejected_reason TEXT,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add design_id column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'design_versions' AND column_name = 'design_id') THEN
    ALTER TABLE design_versions ADD COLUMN design_id UUID;
  END IF;
END $$;

-- 5. Order Mockups - Mockup
CREATE TABLE IF NOT EXISTS order_mockups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  work_item_id UUID,
  design_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  thumbnail_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'approved', 'rejected', 'revision_requested')),
  sent_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES user_profiles(id),
  rejected_reason TEXT,
  revision_notes TEXT,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add work_item_id and design_id columns if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'order_mockups' AND column_name = 'work_item_id') THEN
    ALTER TABLE order_mockups ADD COLUMN work_item_id UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'order_mockups' AND column_name = 'design_id') THEN
    ALTER TABLE order_mockups ADD COLUMN design_id UUID;
  END IF;
END $$;

-- Index for order_mockups
CREATE INDEX IF NOT EXISTS idx_order_mockups_order_id ON order_mockups(order_id);

-- 6. Order Payments - การชำระเงิน
CREATE TABLE IF NOT EXISTS order_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('deposit', 'remaining', 'full', 'refund', 'adjustment')),
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT,
  payment_reference TEXT,
  slip_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'refunded')),
  confirmed_by UUID REFERENCES user_profiles(id),
  confirmed_at TIMESTAMPTZ,
  rejected_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for order_payments
CREATE INDEX IF NOT EXISTS idx_order_payments_order_id ON order_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_payments_status ON order_payments(status);

-- 7. Order Events - เหตุการณ์ที่เกิดขึ้นกับออเดอร์
CREATE TABLE IF NOT EXISTS order_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  impact_time_hours INTEGER DEFAULT 0,
  impact_cost DECIMAL(10,2) DEFAULT 0,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES user_profiles(id),
  resolution_notes TEXT,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for order_events
CREATE INDEX IF NOT EXISTS idx_order_events_order_id ON order_events(order_id);
CREATE INDEX IF NOT EXISTS idx_order_events_is_resolved ON order_events(is_resolved);

-- 8. Order SLA - Timeline/SLA
CREATE TABLE IF NOT EXISTS order_sla (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  step_name TEXT NOT NULL,
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  is_overdue BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for order_sla
CREATE INDEX IF NOT EXISTS idx_order_sla_order_id ON order_sla(order_id);

-- 9. Order Documents - เอกสารออเดอร์
CREATE TABLE IF NOT EXISTS order_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('quotation', 'invoice', 'receipt', 'delivery_note', 'other')),
  document_number TEXT,
  file_url TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generated_by UUID REFERENCES user_profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for order_documents
CREATE INDEX IF NOT EXISTS idx_order_documents_order_id ON order_documents(order_id);
CREATE INDEX IF NOT EXISTS idx_order_documents_type ON order_documents(document_type);

-- 10. Order Notifications - การแจ้งเตือน
CREATE TABLE IF NOT EXISTS order_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('line', 'sms', 'email')),
  recipient TEXT NOT NULL,
  subject TEXT,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for order_notifications
CREATE INDEX IF NOT EXISTS idx_order_notifications_order_id ON order_notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_order_notifications_status ON order_notifications(status);

-- =============================================
-- Add missing columns to orders table
-- =============================================

-- Add metadata column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'metadata') THEN
    ALTER TABLE orders ADD COLUMN metadata JSONB DEFAULT '{}';
  END IF;
END $$;

-- Add order_type column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'order_type') THEN
    ALTER TABLE orders ADD COLUMN order_type TEXT DEFAULT 'print_stock';
  END IF;
END $$;

-- Add shipping columns if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'shipping_subdistrict') THEN
    ALTER TABLE orders ADD COLUMN shipping_subdistrict TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'shipping_district') THEN
    ALTER TABLE orders ADD COLUMN shipping_district TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'shipping_province') THEN
    ALTER TABLE orders ADD COLUMN shipping_province TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'shipping_postal_code') THEN
    ALTER TABLE orders ADD COLUMN shipping_postal_code TEXT;
  END IF;
END $$;

-- Add customer_line_id if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'customer_line_id') THEN
    ALTER TABLE orders ADD COLUMN customer_line_id TEXT;
  END IF;
END $$;

-- =============================================
-- RLS Policies (Enable Row Level Security)
-- =============================================

-- Enable RLS on new tables
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_mockups ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_sla ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (allow all for now)
-- Drop existing policies first, then create
DROP POLICY IF EXISTS "Allow all for authenticated" ON order_status_history;
DROP POLICY IF EXISTS "Allow all for authenticated" ON order_notes;
DROP POLICY IF EXISTS "Allow all for authenticated" ON order_designs;
DROP POLICY IF EXISTS "Allow all for authenticated" ON design_versions;
DROP POLICY IF EXISTS "Allow all for authenticated" ON order_mockups;
DROP POLICY IF EXISTS "Allow all for authenticated" ON order_payments;
DROP POLICY IF EXISTS "Allow all for authenticated" ON order_events;
DROP POLICY IF EXISTS "Allow all for authenticated" ON order_sla;
DROP POLICY IF EXISTS "Allow all for authenticated" ON order_documents;
DROP POLICY IF EXISTS "Allow all for authenticated" ON order_notifications;

CREATE POLICY "Allow all for authenticated" ON order_status_history FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated" ON order_notes FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated" ON order_designs FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated" ON design_versions FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated" ON order_mockups FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated" ON order_payments FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated" ON order_events FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated" ON order_sla FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated" ON order_documents FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated" ON order_notifications FOR ALL TO authenticated USING (true);

-- =============================================
-- Functions
-- =============================================

-- Function to log status changes
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_status_history (order_id, from_status, to_status)
    VALUES (NEW.id, OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for order status changes
DROP TRIGGER IF EXISTS order_status_change_trigger ON orders;
CREATE TRIGGER order_status_change_trigger
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION log_order_status_change();

-- =============================================
-- Done!
-- =============================================
SELECT 'Order system tables created successfully!' as message;

