-- =============================================
-- ANAJAK SUPERAPP - ORDER SYSTEM SCHEMA
-- =============================================
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Work Types (ประเภทงาน)
CREATE TABLE IF NOT EXISTS work_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- 'dtg', 'dtf', 'silkscreen', 'embroidery', etc.
  name TEXT NOT NULL,
  name_th TEXT NOT NULL,
  description TEXT,
  base_price DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Fabric Types (ประเภทผ้า)
CREATE TABLE IF NOT EXISTS fabric_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- 'cotton100', 'tc', 'cvc', 'polyester', etc.
  name TEXT NOT NULL,
  name_th TEXT NOT NULL,
  description TEXT,
  suitable_work_types TEXT[], -- Array of work_type codes
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Print Positions (ตำแหน่งพิมพ์)
CREATE TABLE IF NOT EXISTS print_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- 'front_chest', 'back_full', 'left_sleeve', etc.
  name TEXT NOT NULL,
  name_th TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Print Sizes (ขนาดพิมพ์)
CREATE TABLE IF NOT EXISTS print_sizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- 'a5', 'a4', 'a3', 'a3_plus', etc.
  name TEXT NOT NULL,
  width_cm DECIMAL(5,2),
  height_cm DECIMAL(5,2),
  price_modifier DECIMAL(10,2) DEFAULT 0, -- เพิ่ม/ลดราคา
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Orders (ออเดอร์หลัก)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL, -- ORD-2024-0001
  
  -- Customer Info (Snapshot)
  customer_id UUID REFERENCES customers(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  customer_line_id TEXT,
  
  -- Shipping Address (Snapshot)
  shipping_name TEXT,
  shipping_phone TEXT,
  shipping_address TEXT,
  shipping_district TEXT,
  shipping_province TEXT,
  shipping_postal_code TEXT,
  
  -- Billing Info (for Tax Invoice)
  billing_name TEXT,
  billing_tax_id TEXT,
  billing_address TEXT,
  billing_phone TEXT,
  needs_tax_invoice BOOLEAN DEFAULT false,
  
  -- Status
  status TEXT DEFAULT 'draft',
  -- draft, quoted, awaiting_payment, partial_paid, designing, 
  -- awaiting_mockup_approval, awaiting_material, queued, 
  -- in_production, qc_pending, ready_to_ship, shipped, completed, cancelled
  
  -- Pricing
  subtotal DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  discount_reason TEXT,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,
  
  -- Payment
  paid_amount DECIMAL(12,2) DEFAULT 0,
  payment_status TEXT DEFAULT 'unpaid', -- unpaid, partial, paid
  payment_terms TEXT DEFAULT 'full', -- full, 50_50, 30_70
  
  -- Dates
  order_date TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  shipped_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  
  -- Shipping
  shipping_method TEXT, -- kerry, flash, jt, pickup, etc.
  tracking_number TEXT,
  
  -- Notes
  customer_note TEXT, -- หมายเหตุจากลูกค้า
  internal_note TEXT, -- หมายเหตุภายใน
  
  -- Sales Info
  sales_channel TEXT, -- line, facebook, walk_in, phone, website
  sales_person_id UUID REFERENCES user_profiles(id),
  
  -- Access Token (for customer portal)
  access_token TEXT UNIQUE,
  
  -- Meta
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Order Work Items (รายการงานในออเดอร์)
CREATE TABLE IF NOT EXISTS order_work_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Work Type
  work_type_id UUID REFERENCES work_types(id),
  work_type_code TEXT NOT NULL, -- Snapshot
  work_type_name TEXT NOT NULL, -- Snapshot
  
  -- Description
  description TEXT,
  
  -- Quantity & Pricing
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) DEFAULT 0,
  total_price DECIMAL(12,2) DEFAULT 0,
  
  -- Status (แต่ละงานมีสถานะแยก)
  status TEXT DEFAULT 'pending',
  -- pending, designing, awaiting_approval, approved, 
  -- in_production, qc_pending, qc_passed, qc_failed, completed
  
  -- Assignment
  assigned_to UUID REFERENCES user_profiles(id),
  
  -- Due Date
  due_date TIMESTAMPTZ,
  
  -- Position & Size (for print/embroidery)
  position_code TEXT, -- front_chest, back_full, etc.
  position_name TEXT,
  print_size_code TEXT, -- a4, a3, etc.
  print_size_name TEXT,
  
  -- Priority
  priority INTEGER DEFAULT 0, -- Higher = more urgent
  
  -- Notes
  notes TEXT,
  
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Order Products (สินค้าที่ใช้ในแต่ละงาน)
CREATE TABLE IF NOT EXISTS order_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  order_work_item_id UUID REFERENCES order_work_items(id) ON DELETE CASCADE,
  
  -- Product Reference
  product_id UUID REFERENCES products(id),
  
  -- Product Snapshot (เก็บข้อมูล ณ ตอนสั่ง)
  product_sku TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_model TEXT,
  product_color TEXT,
  product_size TEXT,
  
  -- Quantity & Price
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_cost DECIMAL(10,2) DEFAULT 0, -- ต้นทุน (snapshot)
  unit_price DECIMAL(10,2) DEFAULT 0, -- ราคาขาย (snapshot)
  total_price DECIMAL(12,2) DEFAULT 0,
  
  -- Stock
  reserved_from_stock BOOLEAN DEFAULT false,
  stock_reservation_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Order Designs (ไฟล์ออกแบบ)
CREATE TABLE IF NOT EXISTS order_designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  order_work_item_id UUID REFERENCES order_work_items(id) ON DELETE CASCADE,
  
  -- Design Info
  design_name TEXT NOT NULL,
  position TEXT, -- front, back, left_sleeve, etc.
  
  -- Status
  status TEXT DEFAULT 'pending',
  -- pending, drafting, awaiting_review, revision_requested, approved, final
  
  -- Assignment
  assigned_designer_id UUID REFERENCES user_profiles(id),
  
  -- Current Version
  current_version INTEGER DEFAULT 1,
  
  -- Final File
  final_file_url TEXT,
  
  -- Revision Count
  revision_count INTEGER DEFAULT 0,
  max_free_revisions INTEGER DEFAULT 2,
  
  -- Notes
  brief_text TEXT, -- คำอธิบายจากลูกค้า
  designer_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Design Versions (ประวัติเวอร์ชันการออกแบบ)
CREATE TABLE IF NOT EXISTS design_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_design_id UUID REFERENCES order_designs(id) ON DELETE CASCADE,
  
  version_number INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  
  -- Feedback
  feedback TEXT,
  feedback_by TEXT, -- 'customer' or 'admin'
  feedback_at TIMESTAMPTZ,
  
  -- Creator
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Order Mockups (Mockup สำหรับลูกค้าอนุมัติ)
CREATE TABLE IF NOT EXISTS order_mockups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  order_design_id UUID REFERENCES order_designs(id) ON DELETE CASCADE,
  
  version_number INTEGER NOT NULL DEFAULT 1,
  
  -- Images
  front_image_url TEXT,
  back_image_url TEXT,
  additional_images TEXT[], -- Array of URLs
  
  -- Status
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  
  -- Feedback
  customer_feedback TEXT,
  approved_at TIMESTAMPTZ,
  
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Order Payments (บันทึกการชำระเงิน)
CREATE TABLE IF NOT EXISTS order_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Payment Info
  amount DECIMAL(12,2) NOT NULL,
  payment_method TEXT NOT NULL, -- bank_transfer, cash, credit_card, promptpay
  
  -- Bank Transfer Details
  bank_name TEXT,
  transfer_date TIMESTAMPTZ,
  transfer_time TEXT,
  slip_image_url TEXT,
  
  -- Reference
  reference_number TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending', -- pending, verified, rejected
  verified_by UUID REFERENCES user_profiles(id),
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Order Status History (ประวัติการเปลี่ยนสถานะ)
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  
  from_status TEXT,
  to_status TEXT NOT NULL,
  
  changed_by UUID REFERENCES user_profiles(id),
  reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Order Notes (บันทึกภายใน - Internal Chat)
CREATE TABLE IF NOT EXISTS order_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  
  note_text TEXT NOT NULL,
  
  -- Attachments
  attachments TEXT[], -- Array of URLs
  
  -- Mentions
  mentioned_users UUID[], -- Array of user_profile ids
  
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Order Access Log (บันทึกการเข้าถึงของลูกค้า)
CREATE TABLE IF NOT EXISTS order_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  
  action_type TEXT NOT NULL, -- view, mockup_approve, mockup_reject, payment_submit
  action_data JSONB,
  
  ip_address TEXT,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Generate Order Number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
  new_number TEXT;
BEGIN
  year_part := to_char(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(order_number FROM 10) AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM orders
  WHERE order_number LIKE 'ORD-' || year_part || '-%';
  
  new_number := 'ORD-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Generate Access Token
CREATE OR REPLACE FUNCTION generate_access_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Update Order Totals (Trigger Function)
CREATE OR REPLACE FUNCTION update_order_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE orders
  SET 
    subtotal = (
      SELECT COALESCE(SUM(total_price), 0)
      FROM order_work_items
      WHERE order_id = NEW.order_id
    ) + (
      SELECT COALESCE(SUM(total_price), 0)
      FROM order_products
      WHERE order_id = NEW.order_id AND order_work_item_id IS NULL
    ),
    updated_at = NOW()
  WHERE id = NEW.order_id;
  
  -- Update total_amount
  UPDATE orders
  SET total_amount = subtotal - discount_amount + shipping_cost,
      updated_at = NOW()
  WHERE id = NEW.order_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-update order totals when work items change
DROP TRIGGER IF EXISTS trigger_update_order_totals_work_items ON order_work_items;
CREATE TRIGGER trigger_update_order_totals_work_items
  AFTER INSERT OR UPDATE OR DELETE ON order_work_items
  FOR EACH ROW
  EXECUTE FUNCTION update_order_totals();

-- Auto-update order totals when products change
DROP TRIGGER IF EXISTS trigger_update_order_totals_products ON order_products;
CREATE TRIGGER trigger_update_order_totals_products
  AFTER INSERT OR UPDATE OR DELETE ON order_products
  FOR EACH ROW
  EXECUTE FUNCTION update_order_totals();

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_due_date ON orders(due_date);
CREATE INDEX IF NOT EXISTS idx_orders_access_token ON orders(access_token);
CREATE INDEX IF NOT EXISTS idx_order_work_items_order_id ON order_work_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_products_order_id ON order_products(order_id);
CREATE INDEX IF NOT EXISTS idx_order_designs_order_id ON order_designs(order_id);
CREATE INDEX IF NOT EXISTS idx_order_payments_order_id ON order_payments(order_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_work_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_mockups ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE fabric_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_sizes ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users (DROP existing first)
DROP POLICY IF EXISTS "Authenticated users can manage orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can manage order_work_items" ON order_work_items;
DROP POLICY IF EXISTS "Authenticated users can manage order_products" ON order_products;
DROP POLICY IF EXISTS "Authenticated users can manage order_designs" ON order_designs;
DROP POLICY IF EXISTS "Authenticated users can manage design_versions" ON design_versions;
DROP POLICY IF EXISTS "Authenticated users can manage order_mockups" ON order_mockups;
DROP POLICY IF EXISTS "Authenticated users can manage order_payments" ON order_payments;
DROP POLICY IF EXISTS "Authenticated users can view order_status_history" ON order_status_history;
DROP POLICY IF EXISTS "Authenticated users can insert order_status_history" ON order_status_history;
DROP POLICY IF EXISTS "Authenticated users can manage order_notes" ON order_notes;
DROP POLICY IF EXISTS "Authenticated users can view work_types" ON work_types;
DROP POLICY IF EXISTS "Authenticated users can view fabric_types" ON fabric_types;
DROP POLICY IF EXISTS "Authenticated users can view print_positions" ON print_positions;
DROP POLICY IF EXISTS "Authenticated users can view print_sizes" ON print_sizes;
DROP POLICY IF EXISTS "Public can view orders by token" ON orders;

-- Create policies
CREATE POLICY "Authenticated users can manage orders" ON orders
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage order_work_items" ON order_work_items
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage order_products" ON order_products
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage order_designs" ON order_designs
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage design_versions" ON design_versions
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage order_mockups" ON order_mockups
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage order_payments" ON order_payments
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view order_status_history" ON order_status_history
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert order_status_history" ON order_status_history
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage order_notes" ON order_notes
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view work_types" ON work_types
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view fabric_types" ON fabric_types
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view print_positions" ON print_positions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view print_sizes" ON print_sizes
  FOR SELECT USING (auth.role() = 'authenticated');

-- Public policy for customer order page (view by access_token)
CREATE POLICY "Public can view orders by token" ON orders
  FOR SELECT USING (access_token IS NOT NULL);

-- =============================================
-- SEED DATA
-- =============================================

-- Work Types
INSERT INTO work_types (code, name, name_th, base_price, sort_order) VALUES
  ('dtg', 'DTG Printing', 'พิมพ์ DTG', 0, 1),
  ('dtf', 'DTF Printing', 'พิมพ์ DTF', 0, 2),
  ('silkscreen', 'Silkscreen', 'สกรีน', 0, 3),
  ('sublimation', 'Sublimation', 'ซับลิเมชั่น', 0, 4),
  ('embroidery', 'Embroidery', 'ปัก', 0, 5),
  ('vinyl', 'Vinyl/Flex', 'ไวนิล/เฟล็กซ์', 0, 6),
  ('woven_label', 'Woven Label', 'ป้ายทอ', 0, 10),
  ('printed_label', 'Printed Label', 'ป้ายพิมพ์', 0, 11),
  ('hang_tag', 'Hang Tag', 'แท็กห้อย', 0, 12),
  ('packaging', 'Packaging', 'แพ็คเกจ/ถุง', 0, 13),
  ('pattern', 'Pattern Making', 'ทำแพทเทิร์น', 0, 20),
  ('sewing', 'Sewing/Tailoring', 'ตัดเย็บ', 0, 21)
ON CONFLICT (code) DO NOTHING;

-- Fabric Types
INSERT INTO fabric_types (code, name, name_th, suitable_work_types) VALUES
  ('cotton100', 'Cotton 100%', 'ผ้าคอตตอน 100%', ARRAY['dtg', 'silkscreen', 'embroidery', 'vinyl']),
  ('tc', 'TC (65% Polyester, 35% Cotton)', 'ผ้า TC', ARRAY['dtf', 'silkscreen', 'embroidery', 'vinyl']),
  ('cvc', 'CVC (60% Cotton, 40% Polyester)', 'ผ้า CVC', ARRAY['dtg', 'dtf', 'silkscreen', 'embroidery']),
  ('polyester', 'Polyester 100%', 'โพลีเอสเตอร์ 100%', ARRAY['dtf', 'sublimation', 'embroidery']),
  ('tri_blend', 'Tri-Blend', 'ผ้าไตรเบลนด์', ARRAY['dtg', 'dtf', 'silkscreen']),
  ('jersey', 'Jersey', 'ผ้าเจอร์ซี่', ARRAY['dtg', 'dtf', 'silkscreen', 'embroidery']),
  ('pique', 'Pique (Polo)', 'ผ้าปิเก้ (โปโล)', ARRAY['embroidery', 'silkscreen']),
  ('dri_fit', 'Dri-FIT / Moisture Wicking', 'ผ้าดรายฟิต', ARRAY['dtf', 'sublimation', 'embroidery'])
ON CONFLICT (code) DO NOTHING;

-- Print Positions
INSERT INTO print_positions (code, name, name_th, sort_order) VALUES
  ('front_chest_left', 'Front Left Chest', 'หน้าอกซ้าย', 1),
  ('front_chest_right', 'Front Right Chest', 'หน้าอกขวา', 2),
  ('front_chest_center', 'Front Center Chest', 'หน้าอกกลาง', 3),
  ('front_full', 'Front Full', 'หน้าเต็มตัว', 4),
  ('back_full', 'Back Full', 'หลังเต็มตัว', 5),
  ('back_upper', 'Back Upper', 'หลังบน', 6),
  ('back_lower', 'Back Lower', 'หลังล่าง', 7),
  ('left_sleeve', 'Left Sleeve', 'แขนซ้าย', 8),
  ('right_sleeve', 'Right Sleeve', 'แขนขวา', 9),
  ('collar', 'Collar/Neck', 'คอเสื้อ', 10),
  ('pocket', 'Pocket', 'กระเป๋า', 11)
ON CONFLICT (code) DO NOTHING;

-- Print Sizes
INSERT INTO print_sizes (code, name, width_cm, height_cm, price_modifier) VALUES
  ('3x3', '3x3 cm', 3, 3, 0),
  ('5x5', '5x5 cm', 5, 5, 0),
  ('a6', 'A6 (10.5x14.8 cm)', 10.5, 14.8, 0),
  ('a5', 'A5 (14.8x21 cm)', 14.8, 21, 0),
  ('a4', 'A4 (21x29.7 cm)', 21, 29.7, 0),
  ('a3', 'A3 (29.7x42 cm)', 29.7, 42, 0),
  ('a3_plus', 'A3+ (32x45 cm)', 32, 45, 0),
  ('custom', 'Custom Size', NULL, NULL, 0)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- DONE!
-- =============================================

