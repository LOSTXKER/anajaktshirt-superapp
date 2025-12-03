-- ============================================
-- Anajak Superapp - Complete Database Schema
-- ============================================
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. USER ROLES & PERMISSIONS
-- ============================================

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users profile (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  department TEXT,
  role_id UUID REFERENCES roles(id),
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default roles
INSERT INTO roles (name, display_name, description, permissions) VALUES
  ('super_admin', 'ผู้ดูแลระบบ', 'เข้าถึงได้ทุกส่วน', '["*"]'::jsonb),
  ('stock_admin', 'ผู้จัดการสต๊อก', 'จัดการสต๊อกและสินค้า', '["stock:*", "products:*", "dashboard:view"]'::jsonb),
  ('production_admin', 'ผู้จัดการผลิต', 'จัดการงานผลิตและ QC', '["production:*", "stock:view", "dashboard:view"]'::jsonb),
  ('sales_admin', 'ผู้จัดการขาย', 'จัดการลูกค้าและ CRM', '["crm:*", "stock:view", "dashboard:view"]'::jsonb),
  ('operator', 'พนักงานปฏิบัติการ', 'ดูข้อมูลและทำรายการ', '["stock:view", "stock:transaction", "production:view", "dashboard:view"]'::jsonb),
  ('viewer', 'ผู้ดูเท่านั้น', 'ดูข้อมูลอย่างเดียว', '["dashboard:view", "stock:view", "production:view"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 2. AUDIT LOGS
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'login', 'logout'
  entity_type TEXT NOT NULL, -- 'product', 'transaction', 'production_job', 'customer'
  entity_id TEXT,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================
-- 3. NOTIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL, -- 'low_stock', 'job_complete', 'new_order', 'system'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT FALSE,
  sent_via TEXT[] DEFAULT '{}', -- ['app', 'line', 'email']
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- Notification settings per user
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email_enabled BOOLEAN DEFAULT TRUE,
  line_enabled BOOLEAN DEFAULT FALSE,
  line_user_id TEXT, -- LINE User ID from LINE Login or manual input
  low_stock_alert BOOLEAN DEFAULT TRUE,
  job_complete_alert BOOLEAN DEFAULT TRUE,
  new_order_alert BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- LINE Messaging API Configuration (Global settings)
CREATE TABLE IF NOT EXISTS line_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_access_token TEXT NOT NULL,
  channel_secret TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. SUPPLIERS
-- ============================================

CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  tax_id TEXT,
  payment_terms TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link products to suppliers
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id);

-- ============================================
-- 5. PRODUCTION MODULE
-- ============================================

-- Production Jobs (งานผลิต)
CREATE TABLE IF NOT EXISTS production_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_number TEXT UNIQUE NOT NULL, -- JOB-2024-001
  erp_order_id TEXT, -- Reference to ERP system
  customer_name TEXT NOT NULL,
  customer_contact TEXT,
  customer_phone TEXT,
  
  -- Order details
  product_description TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) DEFAULT 0,
  total_price DECIMAL(10,2) DEFAULT 0,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending', -- pending, reserved, printing, curing, packing, completed, cancelled
  priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
  progress INTEGER DEFAULT 0, -- 0-100
  
  -- Dates
  order_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Assignment
  assigned_to UUID REFERENCES auth.users(id),
  
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jobs_status ON production_jobs(status);
CREATE INDEX idx_jobs_due ON production_jobs(due_date);

-- Production Job Items (รายการสินค้าในงาน)
CREATE TABLE IF NOT EXISTS production_job_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES production_jobs(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  reserved_quantity INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock Reservations (จองสต๊อก)
CREATE TABLE IF NOT EXISTS stock_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES production_jobs(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  status TEXT DEFAULT 'reserved', -- reserved, used, released
  reserved_by UUID REFERENCES auth.users(id),
  reserved_at TIMESTAMPTZ DEFAULT NOW(),
  released_at TIMESTAMPTZ
);

-- Production Status Updates (อัปเดตสถานะ real-time)
CREATE TABLE IF NOT EXISTS production_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES production_jobs(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  note TEXT,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- QC Logs (บันทึก QC)
CREATE TABLE IF NOT EXISTS qc_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES production_jobs(id) ON DELETE CASCADE,
  inspection_type TEXT NOT NULL, -- 'incoming', 'in_process', 'final'
  status TEXT NOT NULL, -- 'pass', 'fail', 'rework'
  pass_quantity INTEGER DEFAULT 0,
  fail_quantity INTEGER DEFAULT 0,
  defect_type TEXT,
  defect_reason TEXT,
  images TEXT[], -- URLs to defect images
  inspected_by UUID REFERENCES auth.users(id),
  inspected_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- Defect Types (ประเภทของเสีย)
CREATE TABLE IF NOT EXISTS defect_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

INSERT INTO defect_types (code, name, description) VALUES
  ('PRINT_MISS', 'พิมพ์เบี้ยว/หลุด', 'ลายพิมพ์ไม่ตรงตำแหน่งหรือหลุดล่อน'),
  ('COLOR_DIFF', 'สีไม่ตรง', 'สีไม่ตรงกับตัวอย่างที่กำหนด'),
  ('FABRIC_DEF', 'ผ้าชำรุด', 'ผ้าขาด รู หรือมีรอยตำหนิ'),
  ('STAIN', 'คราบเปื้อน', 'มีคราบสกปรกบนเนื้อผ้า'),
  ('SIZE_WRONG', 'ไซส์ผิด', 'ไซส์ไม่ตรงกับที่สั่ง'),
  ('OTHER', 'อื่นๆ', 'ของเสียประเภทอื่น')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 6. CRM MODULE
-- ============================================

-- Customers (ลูกค้า)
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- CUST-001
  name TEXT NOT NULL,
  type TEXT DEFAULT 'company', -- 'individual', 'company'
  
  -- Contact info
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  line_id TEXT,
  
  -- Address
  address TEXT,
  district TEXT,
  province TEXT,
  postal_code TEXT,
  
  -- Business info
  tax_id TEXT,
  credit_limit DECIMAL(12,2) DEFAULT 0,
  payment_terms TEXT DEFAULT 'cash', -- 'cash', 'credit_7', 'credit_15', 'credit_30'
  
  -- Tier & Stats
  tier TEXT DEFAULT 'bronze', -- 'bronze', 'silver', 'gold', 'platinum'
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'blocked'
  
  notes TEXT,
  tags TEXT[],
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_code ON customers(code);
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_tier ON customers(tier);

-- Customer Contacts (ผู้ติดต่อเพิ่มเติม)
CREATE TABLE IF NOT EXISTS customer_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position TEXT,
  email TEXT,
  phone TEXT,
  line_id TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer Interactions (ประวัติการติดต่อ)
CREATE TABLE IF NOT EXISTS customer_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'call', 'email', 'line', 'visit', 'order', 'complaint', 'note'
  subject TEXT,
  content TEXT,
  attachments TEXT[],
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer Orders (linked to production jobs)
ALTER TABLE production_jobs ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);

-- ============================================
-- 7. HELPER FUNCTIONS
-- ============================================

-- Function to generate job number
CREATE OR REPLACE FUNCTION generate_job_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  new_number TEXT;
BEGIN
  year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(job_number, '-', 3) AS INTEGER)
  ), 0) + 1 INTO sequence_num
  FROM production_jobs
  WHERE job_number LIKE 'JOB-' || year_part || '-%';
  
  new_number := 'JOB-' || year_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate customer code
CREATE OR REPLACE FUNCTION generate_customer_code()
RETURNS TEXT AS $$
DECLARE
  sequence_num INTEGER;
  new_code TEXT;
BEGIN
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(code FROM 6) AS INTEGER)
  ), 0) + 1 INTO sequence_num
  FROM customers
  WHERE code LIKE 'CUST-%';
  
  new_code := 'CUST-' || LPAD(sequence_num::TEXT, 4, '0');
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['user_profiles', 'roles', 'suppliers', 'production_jobs', 'customers', 'notification_settings']) LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%s_updated_at ON %s', t, t);
    EXECUTE format('CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION update_updated_at()', t, t);
  END LOOP;
END $$;

-- ============================================
-- 8. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (to avoid conflicts when re-running)
DROP POLICY IF EXISTS "Users can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view own settings" ON notification_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON notification_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON notification_settings;
DROP POLICY IF EXISTS "Authenticated users can view audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON audit_logs;

-- Policies for user_profiles
CREATE POLICY "Users can view all profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- Policies for notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Policies for notification_settings
CREATE POLICY "Users can view own settings" ON notification_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON notification_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON notification_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for audit_logs (all authenticated users can view and insert)
CREATE POLICY "Authenticated users can view audit logs" ON audit_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert audit logs" ON audit_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- 9. REALTIME SUBSCRIPTIONS
-- ============================================

-- Enable realtime for key tables (ignore errors if already added)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE production_jobs;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE production_updates;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- ============================================
-- 10. DTG CALCULATOR SETTINGS
-- ============================================

-- Calculator settings table
CREATE TABLE IF NOT EXISTS dtg_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default DTG settings
INSERT INTO dtg_settings (key, value, label, description) VALUES
  ('INK_COST_PER_CC', 16, 'ต้นทุนหมึก/CC', 'ราคาหมึกต่อ CC'),
  ('PRETREAT_1_SIDE', 40, 'รองพื้น 1 ด้าน', 'ค่ารองพื้นสำหรับพิมพ์ 1 ด้าน'),
  ('PRETREAT_2_SIDES', 70, 'รองพื้น 2 ด้าน', 'ค่ารองพื้นสำหรับพิมพ์ 2 ด้าน'),
  ('NECK_LOGO_COST', 30, 'ต้นทุนโลโก้คอ', 'ค่าพิมพ์โลโก้ที่คอเสื้อ'),
  ('SLEEVE_PRINT_COST', 70, 'ต้นทุนสกรีนแขน', 'ค่าพิมพ์ที่แขนเสื้อต่อตำแหน่ง'),
  ('WHITE_TSHIRT_DISCOUNT', 40, 'ส่วนลดเสื้อขาว', 'ส่วนลดสำหรับเสื้อสีขาว'),
  ('PROFIT_MARGIN', 1.30, 'อัตรากำไร', 'ตัวคูณกำไร เช่น 1.30 = กำไร 30%'),
  ('MIN_SELL_PRICE', 100, 'ราคาขายขั้นต่ำ', 'ราคาขายขั้นต่ำสำหรับเสื้อสีเข้ม'),
  ('WHITE_TSHIRT_PRICE_CAP', 300, 'ราคาสูงสุดเสื้อขาว', 'ราคาเพดานสูงสุดสำหรับเสื้อขาว'),
  ('DISCOUNT_TIER_30', 5, 'ส่วนลด 30+ ตัว (%)', 'เปอร์เซ็นต์ส่วนลดเมื่อสั่ง 30 ตัวขึ้นไป'),
  ('DISCOUNT_TIER_50', 10, 'ส่วนลด 50+ ตัว (%)', 'เปอร์เซ็นต์ส่วนลดเมื่อสั่ง 50 ตัวขึ้นไป'),
  ('DISCOUNT_TIER_100', 15, 'ส่วนลด 100+ ตัว (%)', 'เปอร์เซ็นต์ส่วนลดเมื่อสั่ง 100 ตัวขึ้นไป'),
  ('WHITE_MIN_A7_A5', 100, 'ราคาขั้นต่ำเสื้อขาว A7-A5', 'ราคาขั้นต่ำเสื้อขาวขนาดเล็ก'),
  ('WHITE_MIN_A4_A3', 150, 'ราคาขั้นต่ำเสื้อขาว A4-A3', 'ราคาขั้นต่ำเสื้อขาวขนาดกลาง'),
  ('WHITE_MIN_A2', 180, 'ราคาขั้นต่ำเสื้อขาว A2', 'ราคาขั้นต่ำเสื้อขาวขนาดใหญ่'),
  ('WHITE_ADD_A7_A5', 50, 'บวกเพิ่มด้าน 2 (A7-A5)', 'ราคาบวกเพิ่มด้านที่ 2 ขนาดเล็ก'),
  ('WHITE_ADD_A4_A3', 80, 'บวกเพิ่มด้าน 2 (A4-A3)', 'ราคาบวกเพิ่มด้านที่ 2 ขนาดกลาง'),
  ('WHITE_ADD_A2', 100, 'บวกเพิ่มด้าน 2 (A2)', 'ราคาบวกเพิ่มด้านที่ 2 ขนาดใหญ่')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ============================================
-- 11. SOFT DELETE SUPPORT
-- ============================================

-- Add soft delete to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_deleted ON products(deleted_at) WHERE deleted_at IS NULL;

-- Add soft delete to customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add soft delete to production_jobs
ALTER TABLE production_jobs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- ============================================
-- 12. PRICE HISTORY (for tracking changes)
-- ============================================

CREATE TABLE IF NOT EXISTS product_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  
  old_cost DECIMAL(10,2),
  new_cost DECIMAL(10,2),
  old_price DECIMAL(10,2),
  new_price DECIMAL(10,2),
  
  reason TEXT,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_history_product ON product_price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_date ON product_price_history(changed_at DESC);

-- ============================================
-- 13. ORDERS MODULE (Future Ready)
-- ============================================

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL, -- ORD-2024-0001
  
  -- Customer Reference + Snapshot
  customer_id UUID REFERENCES customers(id),
  customer_snapshot JSONB NOT NULL, -- Snapshot at order time
  
  -- Order Status
  status TEXT DEFAULT 'draft', -- draft, confirmed, processing, completed, cancelled
  
  -- Pricing
  subtotal DECIMAL(12,2) DEFAULT 0,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  tax_percent DECIMAL(5,2) DEFAULT 7, -- VAT 7%
  tax_amount DECIMAL(12,2) DEFAULT 0,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,
  
  -- Payment
  payment_status TEXT DEFAULT 'pending', -- pending, partial, paid
  paid_amount DECIMAL(12,2) DEFAULT 0,
  payment_method TEXT, -- cash, transfer, credit
  
  -- Delivery
  shipping_address TEXT,
  shipping_method TEXT,
  tracking_number TEXT,
  
  -- Notes
  notes TEXT,
  internal_notes TEXT,
  
  -- Metadata
  source TEXT DEFAULT 'manual', -- manual, line, website
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Product Reference (may be null if product deleted)
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  
  -- ⭐ IMPORTANT: Product Snapshot at order time
  product_snapshot JSONB NOT NULL,
  -- Contains: { sku, main_sku, model, color, size, name }
  
  -- Pricing at order time (immutable)
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,     -- ราคาขาย ณ ตอนสั่ง
  unit_cost DECIMAL(10,2) NOT NULL,      -- ต้นทุน ณ ตอนสั่ง
  discount_percent DECIMAL(5,2) DEFAULT 0,
  line_total DECIMAL(12,2) NOT NULL,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- Order Payments
CREATE TABLE IF NOT EXISTS order_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  
  amount DECIMAL(12,2) NOT NULL,
  payment_method TEXT NOT NULL, -- cash, transfer, card, other
  reference_number TEXT,
  
  notes TEXT,
  received_by UUID REFERENCES auth.users(id),
  received_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  new_number TEXT;
BEGIN
  year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(order_number, '-', 3) AS INTEGER)
  ), 0) + 1 INTO sequence_num
  FROM orders
  WHERE order_number LIKE 'ORD-' || year_part || '-%';
  
  new_number := 'ORD-' || year_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 14. QUOTATIONS MODULE (Future Ready)
-- ============================================

CREATE TABLE IF NOT EXISTS quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_number TEXT UNIQUE NOT NULL, -- QT-2024-0001
  
  -- Customer Reference + Snapshot
  customer_id UUID REFERENCES customers(id),
  customer_snapshot JSONB NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'draft', -- draft, sent, accepted, rejected, expired
  valid_until DATE,
  
  -- Pricing
  subtotal DECIMAL(12,2) DEFAULT 0,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  tax_percent DECIMAL(5,2) DEFAULT 7,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,
  
  -- Linked Order (if accepted)
  order_id UUID REFERENCES orders(id),
  
  -- Notes
  notes TEXT,
  terms_conditions TEXT,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- Quotation Items
CREATE TABLE IF NOT EXISTS quotation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE,
  
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_snapshot JSONB NOT NULL,
  
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  line_total DECIMAL(12,2) NOT NULL,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to generate quotation number
CREATE OR REPLACE FUNCTION generate_quotation_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  new_number TEXT;
BEGIN
  year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(quotation_number, '-', 3) AS INTEGER)
  ), 0) + 1 INTO sequence_num
  FROM quotations
  WHERE quotation_number LIKE 'QT-' || year_part || '-%';
  
  new_number := 'QT-' || year_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Done! Run this in Supabase SQL Editor
-- ============================================

