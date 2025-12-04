-- =============================================
-- ANAJAK ERP V2 - COMPLETE FACTORY SCHEMA
-- =============================================
-- Run this after: orders-schema.sql, production-tracking-schema.sql
-- =============================================

-- =============================================
-- 1. ORDER TYPES (รูปแบบการผลิต)
-- =============================================
CREATE TABLE IF NOT EXISTS order_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_th TEXT NOT NULL,
  description TEXT,
  default_lead_days INTEGER DEFAULT 7,
  requires_pattern BOOLEAN DEFAULT false,
  requires_fabric BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed data
INSERT INTO order_types (code, name, name_th, default_lead_days, requires_pattern, requires_fabric, sort_order) VALUES
('ready_made', 'Ready-Made', 'เสื้อสำเร็จรูป', 5, false, false, 1),
('custom_sewing', 'Custom Sewing', 'ตัดเย็บตามแบบ', 14, true, true, 2),
('full_custom', 'Full Custom', 'ออกแบบ+ตัดเย็บ', 21, true, true, 3),
('print_only', 'Print Only', 'สกรีน/ปักอย่างเดียว', 3, false, false, 4)
ON CONFLICT (code) DO UPDATE SET
  name_th = EXCLUDED.name_th,
  default_lead_days = EXCLUDED.default_lead_days,
  requires_pattern = EXCLUDED.requires_pattern,
  requires_fabric = EXCLUDED.requires_fabric;

-- =============================================
-- 2. WORK CATEGORIES
-- =============================================
CREATE TABLE IF NOT EXISTS work_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_th TEXT NOT NULL,
  color TEXT, -- for UI display
  icon TEXT, -- icon name
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO work_categories (code, name, name_th, color, icon, sort_order) VALUES
('printing', 'Printing', 'งานพิมพ์/สกรีน', '#3B82F6', 'printer', 1),
('embroidery', 'Embroidery', 'งานปัก', '#8B5CF6', 'scissors', 2),
('garment', 'Garment', 'ตัดเย็บ', '#10B981', 'shirt', 3),
('labeling', 'Labeling', 'ป้าย/แท็ก', '#F59E0B', 'tag', 4),
('packaging', 'Packaging', 'บรรจุภัณฑ์', '#6366F1', 'package', 5),
('finishing', 'Finishing', 'ตกแต่งสำเร็จ', '#EC4899', 'sparkles', 6)
ON CONFLICT (code) DO NOTHING;

-- Update work_types to include category
ALTER TABLE work_types 
ADD COLUMN IF NOT EXISTS category_code TEXT REFERENCES work_categories(code),
ADD COLUMN IF NOT EXISTS requires_design BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS requires_material BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS estimated_minutes_per_unit DECIMAL(8,2) DEFAULT 1;

-- Update existing work types with categories
UPDATE work_types SET category_code = 'printing', requires_design = true WHERE code IN ('dtg', 'dtf', 'silkscreen', 'sublimation', 'vinyl');
UPDATE work_types SET category_code = 'embroidery', requires_design = true WHERE code IN ('embroidery', 'embroidery_badge');
UPDATE work_types SET category_code = 'garment', requires_design = false, requires_material = true WHERE code IN ('pattern', 'cutting', 'sewing');
UPDATE work_types SET category_code = 'labeling', requires_design = true WHERE code IN ('woven_label', 'printed_label', 'hang_tag');
UPDATE work_types SET category_code = 'packaging', requires_design = false WHERE code = 'packaging';

-- =============================================
-- 3. WORK DEPENDENCIES (ลำดับงาน)
-- =============================================
CREATE TABLE IF NOT EXISTS work_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_type_code TEXT NOT NULL,
  depends_on_code TEXT NOT NULL,
  order_type_code TEXT, -- NULL = applies to all
  is_required BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(work_type_code, depends_on_code, order_type_code)
);

INSERT INTO work_dependencies (work_type_code, depends_on_code, order_type_code, is_required, notes) VALUES
-- Sewing must come after cutting
('sewing', 'cutting', 'custom_sewing', true, 'ต้องตัดผ้าก่อนเย็บ'),
('sewing', 'cutting', 'full_custom', true, 'ต้องตัดผ้าก่อนเย็บ'),

-- Print/Emb after sewing for custom orders
('dtg', 'sewing', 'custom_sewing', true, 'สกรีน DTG หลังเย็บเสร็จ'),
('dtf', 'sewing', 'custom_sewing', true, 'สกรีน DTF หลังเย็บเสร็จ'),
('silkscreen', 'sewing', 'custom_sewing', true, 'ซิลค์สกรีนหลังเย็บเสร็จ'),
('embroidery', 'sewing', 'custom_sewing', true, 'ปักหลังเย็บเสร็จ'),
('vinyl', 'sewing', 'custom_sewing', true, 'ไวนิลหลังเย็บเสร็จ'),

-- Sublimation must be BEFORE sewing
('cutting', 'sublimation', 'custom_sewing', false, 'ซับลิเมชั่นทำก่อนตัด (optional)'),

-- Labels after sewing
('woven_label', 'sewing', NULL, true, 'ติดป้ายทอหลังเย็บ'),
('printed_label', 'sewing', NULL, true, 'ติดป้ายพิมพ์หลังเย็บ'),

-- Packaging comes last
('packaging', 'dtg', NULL, false, NULL),
('packaging', 'dtf', NULL, false, NULL),
('packaging', 'silkscreen', NULL, false, NULL),
('packaging', 'embroidery', NULL, false, NULL),
('packaging', 'woven_label', NULL, false, NULL)
ON CONFLICT (work_type_code, depends_on_code, order_type_code) DO NOTHING;

-- =============================================
-- 4. ADDON TYPES
-- =============================================
CREATE TABLE IF NOT EXISTS addon_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_th TEXT NOT NULL,
  category TEXT NOT NULL, -- 'packaging', 'labeling', 'finishing', 'extra'
  base_price DECIMAL(10,2) DEFAULT 0,
  price_type TEXT DEFAULT 'per_piece', -- 'per_piece', 'per_lot', 'fixed'
  requires_design BOOLEAN DEFAULT false,
  requires_material BOOLEAN DEFAULT false,
  material_lead_days INTEGER DEFAULT 0,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO addon_types (code, name, name_th, category, base_price, price_type, requires_design, requires_material, material_lead_days, sort_order) VALUES
-- Packaging
('opp_bag', 'OPP Bag', 'ถุง OPP', 'packaging', 2, 'per_piece', false, true, 0, 1),
('zipper_bag', 'Zipper Bag', 'ถุงซิป', 'packaging', 5, 'per_piece', false, true, 0, 2),
('paper_bag', 'Paper Bag', 'ถุงกระดาษ', 'packaging', 15, 'per_piece', true, true, 7, 3),
('paper_bag_plain', 'Paper Bag Plain', 'ถุงกระดาษเปล่า', 'packaging', 8, 'per_piece', false, true, 0, 4),
('box', 'Box', 'กล่อง', 'packaging', 25, 'per_piece', true, true, 7, 5),
('box_plain', 'Box Plain', 'กล่องเปล่า', 'packaging', 15, 'per_piece', false, true, 0, 6),
('gift_box', 'Gift Box', 'กล่องของขวัญ', 'packaging', 50, 'per_piece', true, true, 14, 7),
('ribbon', 'Ribbon', 'ริบบิ้น', 'packaging', 3, 'per_piece', false, true, 0, 8),

-- Labeling
('hang_tag', 'Hang Tag', 'แท็กห้อย', 'labeling', 3, 'per_piece', true, true, 5, 10),
('hang_tag_string', 'Hang Tag String', 'เชือกแท็ก', 'labeling', 1, 'per_piece', false, true, 0, 11),
('care_label', 'Care Label', 'ป้ายซัก', 'labeling', 2, 'per_piece', false, true, 3, 12),
('size_label', 'Size Label', 'ป้ายไซส์', 'labeling', 1, 'per_piece', false, true, 0, 13),
('brand_label_woven', 'Brand Label Woven', 'ป้ายแบรนด์ทอ', 'labeling', 5, 'per_piece', true, true, 10, 14),
('brand_label_printed', 'Brand Label Printed', 'ป้ายแบรนด์พิมพ์', 'labeling', 3, 'per_piece', true, true, 5, 15),
('leather_tag', 'Leather Tag', 'ป้ายหนัง', 'labeling', 10, 'per_piece', true, true, 14, 16),

-- Finishing
('fold_pack', 'Fold & Pack', 'พับแพค', 'finishing', 5, 'per_piece', false, false, 0, 20),
('press', 'Press', 'รีด', 'finishing', 3, 'per_piece', false, false, 0, 21),
('steam', 'Steam', 'นึ่ง', 'finishing', 5, 'per_piece', false, false, 0, 22),
('spray_water', 'Water Repellent Spray', 'สเปรย์กันน้ำ', 'finishing', 15, 'per_piece', false, true, 0, 23),
('spray_wrinkle', 'Anti-Wrinkle Spray', 'สเปรย์กันยับ', 'finishing', 10, 'per_piece', false, true, 0, 24),

-- Extra Services
('individual_pack', 'Individual Pack', 'แยกใส่ถุงพร้อมชื่อ', 'extra', 3, 'per_piece', false, true, 0, 30),
('size_sorting', 'Size Sorting', 'แยกไซส์', 'extra', 50, 'per_lot', false, false, 0, 31),
('name_number', 'Name/Number', 'พิมพ์ชื่อ/เบอร์', 'extra', 20, 'per_piece', false, false, 0, 32),
('photo_set', 'Product Photo Set', 'ถ่ายรูปสินค้า', 'extra', 200, 'fixed', false, false, 0, 33),
('sample', 'Sample', 'ทำตัวอย่าง', 'extra', 0, 'fixed', false, false, 0, 34)
ON CONFLICT (code) DO UPDATE SET
  name_th = EXCLUDED.name_th,
  base_price = EXCLUDED.base_price,
  requires_design = EXCLUDED.requires_design,
  requires_material = EXCLUDED.requires_material;

-- =============================================
-- 5. ORDER ADDONS (addon ที่เลือกในแต่ละ order)
-- =============================================
CREATE TABLE IF NOT EXISTS order_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id UUID, -- optional: specific to an item
  addon_type_id UUID REFERENCES addon_types(id),
  addon_code TEXT NOT NULL,
  addon_name TEXT NOT NULL,
  addon_name_th TEXT,
  
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) DEFAULT 0,
  total_price DECIMAL(12,2) DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'pending', -- pending, material_ready, ready, attached, completed
  
  -- Design (if needed)
  requires_design BOOLEAN DEFAULT false,
  design_file_url TEXT,
  design_status TEXT DEFAULT 'not_required', -- not_required, pending, submitted, approved
  design_approved_at TIMESTAMPTZ,
  
  -- Material (if needed)
  requires_material BOOLEAN DEFAULT false,
  material_status TEXT DEFAULT 'not_required', -- not_required, pending, ordered, received
  material_eta DATE,
  
  -- Attachment Info
  attached_by UUID REFERENCES user_profiles(id),
  attached_at TIMESTAMPTZ,
  
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 6. CHANGE REQUESTS
-- =============================================
CREATE TABLE IF NOT EXISTS change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number TEXT UNIQUE NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  
  -- What Phase was the order in
  order_phase TEXT NOT NULL, -- 'draft', 'design', 'mockup_approved', 'in_production', 'qc_complete'
  
  -- Change Type
  change_type TEXT NOT NULL, -- 'design', 'quantity', 'size', 'color', 'add_work', 'remove_work', 'addon', 'other'
  change_category TEXT DEFAULT 'minor', -- 'minor', 'major'
  
  -- Description
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Affected Items
  affected_work_items UUID[],
  affected_products UUID[],
  
  -- Cost Breakdown
  base_fee DECIMAL(10,2) DEFAULT 0, -- ค่าดำเนินการ
  design_fee DECIMAL(10,2) DEFAULT 0, -- ค่าออกแบบใหม่
  rework_fee DECIMAL(10,2) DEFAULT 0, -- ค่าทำใหม่
  material_fee DECIMAL(10,2) DEFAULT 0, -- ค่าวัสดุเพิ่ม
  other_fee DECIMAL(10,2) DEFAULT 0,
  total_fee DECIMAL(12,2) DEFAULT 0,
  
  -- Schedule Impact
  days_delayed INTEGER DEFAULT 0,
  original_due_date DATE,
  new_due_date DATE,
  
  -- Status
  status TEXT DEFAULT 'pending', 
  -- pending, quoted, awaiting_payment, approved, rejected, in_progress, completed, cancelled
  
  -- Approval Flow
  quoted_at TIMESTAMPTZ,
  quoted_by UUID REFERENCES user_profiles(id),
  customer_notified_at TIMESTAMPTZ,
  customer_response TEXT, -- 'accept', 'reject', 'negotiate'
  customer_responded_at TIMESTAMPTZ,
  
  -- Payment
  payment_status TEXT DEFAULT 'not_required', -- not_required, unpaid, paid
  payment_received_at TIMESTAMPTZ,
  payment_reference TEXT,
  
  -- Completion
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES user_profiles(id),
  
  -- Attachments
  reference_files TEXT[],
  new_design_files TEXT[],
  
  -- Notes
  customer_reason TEXT,
  admin_notes TEXT,
  internal_notes TEXT,
  
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Change Request Logs
CREATE TABLE IF NOT EXISTS change_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_request_id UUID REFERENCES change_requests(id) ON DELETE CASCADE,
  
  action TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  
  details JSONB,
  notes TEXT,
  
  performed_by UUID REFERENCES user_profiles(id),
  performed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generate Change Request Number
CREATE OR REPLACE FUNCTION generate_change_request_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
  new_number TEXT;
BEGIN
  year_part := to_char(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(request_number FROM 9) AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM change_requests
  WHERE request_number LIKE 'CR-' || year_part || '-%';
  
  new_number := 'CR-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 7. APPROVAL GATES
-- =============================================
CREATE TABLE IF NOT EXISTS approval_gates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  
  gate_type TEXT NOT NULL, -- 'design_complete', 'mockup', 'material_ready', 'production_start'
  gate_name TEXT NOT NULL,
  gate_order INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, skipped
  is_required BOOLEAN DEFAULT true,
  
  -- Requirements to pass
  requirements JSONB, -- {designs_approved: true, mockup_approved: true, etc}
  requirements_met JSONB DEFAULT '{}',
  
  -- Approval
  approved_by UUID REFERENCES user_profiles(id),
  approved_at TIMESTAMPTZ,
  
  -- Customer Confirmation (for customer-facing gates)
  requires_customer_approval BOOLEAN DEFAULT false,
  customer_notified_at TIMESTAMPTZ,
  customer_confirmed BOOLEAN DEFAULT false,
  customer_confirmed_at TIMESTAMPTZ,
  customer_ip TEXT,
  
  -- Notes
  notes TEXT,
  rejection_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 8. UPDATES TO ORDERS TABLE
-- =============================================
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS order_type_code TEXT DEFAULT 'ready_made',
ADD COLUMN IF NOT EXISTS production_mode TEXT DEFAULT 'in_house',
ADD COLUMN IF NOT EXISTS priority_level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS priority_name TEXT DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS priority_surcharge_percent DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS priority_surcharge_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS revision_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_free_revisions INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS paid_revision_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS paid_revision_total DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS change_request_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS change_request_total DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS all_designs_approved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS all_designs_approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS mockup_approved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS mockup_approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS materials_ready BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS materials_ready_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS production_unlocked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS production_unlocked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS addons_total DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS customer_acknowledged_changes BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS customer_acknowledged_at TIMESTAMPTZ;

-- =============================================
-- 9. PRIORITY LEVELS
-- =============================================
CREATE TABLE IF NOT EXISTS priority_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level INTEGER UNIQUE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_th TEXT NOT NULL,
  surcharge_percent DECIMAL(5,2) DEFAULT 0,
  lead_time_modifier DECIMAL(3,2) DEFAULT 1.0, -- multiplier for standard lead time
  color TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO priority_levels (level, code, name, name_th, surcharge_percent, lead_time_modifier, color) VALUES
(0, 'normal', 'Normal', 'ปกติ', 0, 1.0, '#6B7280'),
(1, 'rush', 'Rush', 'เร่ง', 20, 0.7, '#F59E0B'),
(2, 'urgent', 'Urgent', 'ด่วน', 50, 0.5, '#EF4444'),
(3, 'emergency', 'Emergency', 'ด่วนมาก', 100, 0.3, '#DC2626')
ON CONFLICT (code) DO UPDATE SET
  surcharge_percent = EXCLUDED.surcharge_percent,
  lead_time_modifier = EXCLUDED.lead_time_modifier;

-- =============================================
-- 10. QC IMPROVEMENTS
-- =============================================
CREATE TABLE IF NOT EXISTS qc_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_th TEXT NOT NULL,
  stage_order INTEGER DEFAULT 0,
  is_mandatory BOOLEAN DEFAULT true,
  applies_to_work_types TEXT[], -- NULL = applies to all
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO qc_stages (code, name, name_th, stage_order, is_mandatory, applies_to_work_types) VALUES
('material', 'Material QC', 'ตรวจวัตถุดิบ', 1, true, ARRAY['cutting', 'sewing']),
('pre_production', 'Pre-Production QC', 'ตรวจก่อนผลิต', 2, false, NULL),
('in_process', 'In-Process QC', 'ตรวจระหว่างผลิต', 3, false, NULL),
('post_production', 'Post-Production QC', 'ตรวจหลังผลิต', 4, true, NULL),
('final', 'Final QC', 'ตรวจก่อนส่ง', 5, true, NULL)
ON CONFLICT (code) DO NOTHING;

-- Detailed QC Records
CREATE TABLE IF NOT EXISTS qc_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to production
  job_id UUID REFERENCES production_jobs(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  
  qc_stage_code TEXT NOT NULL,
  qc_stage_name TEXT,
  
  -- Quantities
  total_qty INTEGER NOT NULL,
  checked_qty INTEGER NOT NULL,
  passed_qty INTEGER DEFAULT 0,
  failed_qty INTEGER DEFAULT 0,
  rework_qty INTEGER DEFAULT 0,
  
  -- Result
  overall_result TEXT, -- 'pass', 'fail', 'partial', 'pending'
  pass_rate DECIMAL(5,2), -- percentage
  
  -- Checklist Results
  checklist_results JSONB DEFAULT '[]',
  -- [{checkpoint_code, checkpoint_name, passed: bool, notes, photo_urls: []}]
  
  -- Evidence
  photo_urls TEXT[] DEFAULT '{}',
  
  -- Notes
  notes TEXT,
  failure_reasons TEXT[] DEFAULT '{}',
  rework_instructions TEXT,
  
  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  checked_by UUID REFERENCES user_profiles(id),
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 11. REVISION TRACKING IMPROVEMENTS
-- =============================================
ALTER TABLE design_versions
ADD COLUMN IF NOT EXISTS revision_type TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS revision_cost DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS change_description TEXT,
ADD COLUMN IF NOT EXISTS approved_by_customer BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS customer_approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_final BOOLEAN DEFAULT false;

-- =============================================
-- 12. ORDER ITEMS (improved)
-- =============================================
-- Add new columns to order_work_items for better tracking
ALTER TABLE order_work_items
ADD COLUMN IF NOT EXISTS depends_on UUID[], -- array of work_item_ids this depends on
ADD COLUMN IF NOT EXISTS can_start BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS blocked_reason TEXT,
ADD COLUMN IF NOT EXISTS all_designs_approved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS all_materials_ready BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS production_job_id UUID,
ADD COLUMN IF NOT EXISTS qc_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS qc_passed_qty INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS qc_failed_qty INTEGER DEFAULT 0;

-- =============================================
-- 13. SUPPLIER MANAGEMENT (Outsource System)
-- =============================================

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- 'SUP-001'
  name TEXT NOT NULL,
  name_th TEXT,
  
  -- Contact Info
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  contact_line TEXT,
  
  -- Address
  address TEXT,
  district TEXT,
  province TEXT,
  postal_code TEXT,
  
  -- Business Info
  tax_id TEXT,
  
  -- Services (what they can do)
  service_types TEXT[] DEFAULT '{}', -- ['woven_label', 'printed_label', 'embroidery', 'sewing']
  
  -- Terms
  default_lead_days INTEGER DEFAULT 7,
  min_order_qty INTEGER DEFAULT 1,
  payment_terms TEXT DEFAULT 'cod', -- 'cod', 'credit_7', 'credit_15', 'credit_30'
  
  -- Performance Metrics
  rating DECIMAL(3,2) DEFAULT 0, -- 0-5 stars
  on_time_rate DECIMAL(5,2) DEFAULT 100, -- percentage
  quality_rate DECIMAL(5,2) DEFAULT 100, -- percentage
  total_orders INTEGER DEFAULT 0,
  total_value DECIMAL(14,2) DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'blacklisted'
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Supplier Pricing (price list per supplier)
CREATE TABLE IF NOT EXISTS supplier_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  
  -- What this price is for
  service_type TEXT NOT NULL, -- 'woven_label', 'embroidery', etc.
  item_name TEXT NOT NULL, -- 'ป้ายทอ Standard', 'ป้ายทอ HD'
  item_code TEXT, -- optional internal code
  
  -- Pricing tiers (quantity-based)
  price_tier_1_min INTEGER DEFAULT 1,
  price_tier_1_max INTEGER DEFAULT 499,
  price_tier_1 DECIMAL(10,2) NOT NULL,
  
  price_tier_2_min INTEGER DEFAULT 500,
  price_tier_2_max INTEGER DEFAULT 999,
  price_tier_2 DECIMAL(10,2),
  
  price_tier_3_min INTEGER DEFAULT 1000,
  price_tier_3_max INTEGER,
  price_tier_3 DECIMAL(10,2),
  
  -- Unit
  price_unit TEXT DEFAULT 'piece', -- 'piece', 'lot', 'meter', 'kg'
  
  -- Setup fees
  setup_fee DECIMAL(10,2) DEFAULT 0, -- ค่าแม่พิมพ์, ค่า setup
  setup_fee_description TEXT, -- 'ค่าแม่พิมพ์ครั้งแรก'
  
  -- Lead time
  lead_days INTEGER DEFAULT 7,
  
  is_active BOOLEAN DEFAULT true,
  valid_from DATE,
  valid_until DATE,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase Orders (PO)
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number TEXT UNIQUE NOT NULL, -- 'PO-2024-0001'
  
  -- Supplier
  supplier_id UUID REFERENCES suppliers(id),
  supplier_name TEXT NOT NULL, -- snapshot
  supplier_contact TEXT, -- snapshot
  
  -- Link to Order (optional - can be standalone PO)
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  order_number TEXT, -- snapshot
  
  -- Dates
  po_date DATE DEFAULT CURRENT_DATE,
  expected_date DATE,
  actual_delivery_date DATE,
  
  -- Status
  status TEXT DEFAULT 'draft',
  -- draft, sent, confirmed, producing, shipped, partial_received, received, qc_pending, qc_failed, completed, cancelled
  
  -- Amounts
  subtotal DECIMAL(12,2) DEFAULT 0,
  setup_fees DECIMAL(10,2) DEFAULT 0,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,
  
  -- Payment
  payment_status TEXT DEFAULT 'unpaid', -- unpaid, partial, paid
  payment_terms TEXT, -- 'cod', 'credit_30', etc.
  paid_amount DECIMAL(12,2) DEFAULT 0,
  payment_due_date DATE,
  
  -- Delivery
  delivery_method TEXT, -- 'pickup', 'delivery'
  tracking_number TEXT,
  
  -- Files
  design_files TEXT[] DEFAULT '{}',
  spec_file_url TEXT,
  po_pdf_url TEXT,
  
  -- Communication
  sent_via TEXT, -- 'email', 'line', 'phone'
  sent_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  
  -- Notes
  internal_notes TEXT,
  supplier_notes TEXT, -- notes for supplier
  
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase Order Items
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
  
  -- Link to order work item or addon (optional)
  order_work_item_id UUID,
  order_addon_id UUID,
  
  -- Item Info
  item_description TEXT NOT NULL,
  service_type TEXT, -- 'woven_label', 'embroidery', etc.
  specifications TEXT, -- detailed specs
  
  -- Quantity & Price
  quantity INTEGER NOT NULL,
  unit TEXT DEFAULT 'pcs',
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  
  -- Received
  received_qty INTEGER DEFAULT 0,
  qc_passed_qty INTEGER DEFAULT 0,
  qc_failed_qty INTEGER DEFAULT 0,
  
  -- Design
  design_file_url TEXT,
  
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase Order Logs
CREATE TABLE IF NOT EXISTS purchase_order_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
  
  action TEXT NOT NULL, -- 'created', 'sent', 'confirmed', 'shipped', 'received', 'qc_check', etc.
  from_status TEXT,
  to_status TEXT,
  
  details JSONB, -- additional details
  notes TEXT,
  
  performed_by UUID REFERENCES user_profiles(id),
  performed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goods Receiving (รับของ)
CREATE TABLE IF NOT EXISTS goods_receiving (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gr_number TEXT UNIQUE NOT NULL, -- 'GR-2024-0001'
  
  po_id UUID REFERENCES purchase_orders(id),
  po_number TEXT, -- snapshot
  supplier_id UUID REFERENCES suppliers(id),
  supplier_name TEXT, -- snapshot
  
  -- Receiving Info
  received_date TIMESTAMPTZ DEFAULT NOW(),
  received_by UUID REFERENCES user_profiles(id),
  
  -- Delivery
  delivery_method TEXT, -- 'pickup', 'delivered'
  tracking_number TEXT,
  
  -- Quantities
  expected_qty INTEGER NOT NULL,
  received_qty INTEGER NOT NULL,
  
  -- QC
  qc_status TEXT DEFAULT 'pending', -- 'pending', 'passed', 'partial', 'failed'
  qc_passed_qty INTEGER DEFAULT 0,
  qc_failed_qty INTEGER DEFAULT 0,
  qc_notes TEXT,
  qc_photos TEXT[] DEFAULT '{}',
  qc_by UUID REFERENCES user_profiles(id),
  qc_at TIMESTAMPTZ,
  
  -- Action taken for failed items
  failed_action TEXT, -- 'return', 'accept_discount', 'reorder', 'none'
  failed_action_notes TEXT,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goods Receiving Items (รายการของที่รับ)
CREATE TABLE IF NOT EXISTS goods_receiving_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gr_id UUID REFERENCES goods_receiving(id) ON DELETE CASCADE,
  po_item_id UUID REFERENCES purchase_order_items(id),
  
  -- Item Info (snapshot from PO)
  item_description TEXT NOT NULL,
  
  -- Quantities
  expected_qty INTEGER NOT NULL,
  received_qty INTEGER NOT NULL,
  
  -- QC Result
  qc_passed_qty INTEGER DEFAULT 0,
  qc_failed_qty INTEGER DEFAULT 0,
  qc_notes TEXT,
  qc_photos TEXT[] DEFAULT '{}',
  
  -- Defect details
  defect_type TEXT, -- 'quantity_short', 'quality_issue', 'wrong_spec', 'damaged'
  defect_description TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work Type Outsource Config (กำหนดว่างานไหน outsource ได้)
CREATE TABLE IF NOT EXISTS work_type_outsource_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_type_code TEXT NOT NULL,
  
  -- Outsource settings
  can_outsource BOOLEAN DEFAULT false,
  always_outsource BOOLEAN DEFAULT false, -- ต้อง outsource เสมอ
  
  -- Default supplier
  default_supplier_id UUID REFERENCES suppliers(id),
  
  -- Instructions
  outsource_instructions TEXT, -- คำแนะนำสำหรับส่ง outsource
  required_files TEXT[], -- ['design_ai', 'spec_pdf']
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(work_type_code)
);

-- Addon Outsource Config
CREATE TABLE IF NOT EXISTS addon_outsource_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  addon_code TEXT NOT NULL,
  
  can_outsource BOOLEAN DEFAULT false,
  always_outsource BOOLEAN DEFAULT false,
  
  default_supplier_id UUID REFERENCES suppliers(id),
  
  outsource_instructions TEXT,
  required_files TEXT[],
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(addon_code)
);

-- Seed default outsource config
INSERT INTO work_type_outsource_config (work_type_code, can_outsource, always_outsource) VALUES
('woven_label', true, true),
('printed_label', true, true),
('leather_tag', true, true),
('embroidery', true, false),
('silkscreen', true, false),
('sublimation', true, false),
('cutting', true, false),
('sewing', true, false),
('dtg', false, false),
('dtf', false, false)
ON CONFLICT (work_type_code) DO UPDATE SET
  can_outsource = EXCLUDED.can_outsource,
  always_outsource = EXCLUDED.always_outsource;

INSERT INTO addon_outsource_config (addon_code, can_outsource, always_outsource) VALUES
('hang_tag', true, true),
('paper_bag', true, true),
('box', true, true),
('gift_box', true, true),
('brand_label_woven', true, true),
('leather_tag', true, true),
('care_label', true, false),
('opp_bag', false, false),
('zipper_bag', false, false),
('fold_pack', false, false)
ON CONFLICT (addon_code) DO UPDATE SET
  can_outsource = EXCLUDED.can_outsource,
  always_outsource = EXCLUDED.always_outsource;

-- Add outsource fields to order_work_items
ALTER TABLE order_work_items
ADD COLUMN IF NOT EXISTS production_mode TEXT DEFAULT 'in_house', -- 'in_house', 'outsource'
ADD COLUMN IF NOT EXISTS supplier_id UUID,
ADD COLUMN IF NOT EXISTS po_id UUID,
ADD COLUMN IF NOT EXISTS outsource_status TEXT, -- NULL if in_house
ADD COLUMN IF NOT EXISTS outsource_eta DATE;

-- Add outsource fields to order_addons
ALTER TABLE order_addons
ADD COLUMN IF NOT EXISTS production_mode TEXT DEFAULT 'in_house',
ADD COLUMN IF NOT EXISTS supplier_id UUID,
ADD COLUMN IF NOT EXISTS po_id UUID,
ADD COLUMN IF NOT EXISTS outsource_status TEXT,
ADD COLUMN IF NOT EXISTS outsource_eta DATE;

-- Generate PO Number
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
  new_number TEXT;
BEGIN
  year_part := to_char(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(po_number FROM 9) AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM purchase_orders
  WHERE po_number LIKE 'PO-' || year_part || '-%';
  
  new_number := 'PO-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Generate GR Number
CREATE OR REPLACE FUNCTION generate_gr_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
  new_number TEXT;
BEGIN
  year_part := to_char(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(gr_number FROM 9) AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM goods_receiving
  WHERE gr_number LIKE 'GR-' || year_part || '-%';
  
  new_number := 'GR-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 14. FACTORY CAPABILITIES
-- =============================================

-- Factory Capabilities (กำหนดว่าโรงงานทำอะไรได้)
CREATE TABLE IF NOT EXISTS factory_capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_type_code TEXT UNIQUE NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'inactive', -- 'active', 'inactive', 'planned'
  
  -- Capacity
  daily_capacity INTEGER DEFAULT 0, -- 0 = unlimited
  current_load INTEGER DEFAULT 0,
  
  -- Default routing
  default_mode TEXT DEFAULT 'outsource', -- 'in_house', 'outsource'
  
  -- Equipment
  equipment_name TEXT,
  equipment_count INTEGER DEFAULT 0,
  
  -- When activated
  activated_at TIMESTAMPTZ,
  activated_by UUID REFERENCES user_profiles(id),
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed factory capabilities (DTF only active)
INSERT INTO factory_capabilities (work_type_code, status, daily_capacity, default_mode, notes) VALUES
('dtf', 'active', 200, 'in_house', 'เครื่อง DTF หลัก'),
('dtg', 'inactive', 0, 'outsource', 'รอซื้อเครื่อง'),
('silkscreen', 'inactive', 0, 'outsource', 'ยังไม่มี line'),
('sublimation', 'inactive', 0, 'outsource', 'รอซื้อเครื่อง'),
('vinyl', 'inactive', 0, 'outsource', 'ยังไม่มีเครื่อง'),
('embroidery', 'inactive', 0, 'outsource', 'ส่งโรงปัก'),
('cutting', 'inactive', 0, 'outsource', 'ส่งโรงตัด'),
('sewing', 'inactive', 0, 'outsource', 'ส่งโรงเย็บ'),
('design', 'active', 0, 'in_house', 'ออกแบบเอง'),
('qc', 'active', 0, 'in_house', 'ตรวจคุณภาพเอง'),
('assembly', 'active', 500, 'in_house', 'รวม+แพ็คเอง')
ON CONFLICT (work_type_code) DO UPDATE SET
  status = EXCLUDED.status,
  daily_capacity = EXCLUDED.daily_capacity,
  default_mode = EXCLUDED.default_mode;

-- =============================================
-- 15. ISSUE & ERROR TRACKING
-- =============================================

-- Issues Table
CREATE TABLE IF NOT EXISTS issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_number TEXT UNIQUE NOT NULL, -- 'ISS-2024-0001'
  
  -- Linked entities
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  order_work_item_id UUID,
  po_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
  production_job_id UUID,
  
  -- Issue details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Classification
  issue_type TEXT NOT NULL, -- 'production_error', 'quality_issue', 'delay', 'material', 'customer', 'other'
  source TEXT NOT NULL, -- 'internal', 'supplier', 'customer', 'external'
  severity TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  
  -- Supplier (if applicable)
  supplier_id UUID REFERENCES suppliers(id),
  supplier_name TEXT,
  
  -- Impact
  affected_quantity INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'open', 
  -- 'open', 'investigating', 'action_planned', 'in_progress', 'resolved', 'verified', 'on_hold', 'escalated', 'cancelled'
  
  -- Resolution
  resolution_action TEXT, -- 'return', 'rework', 'redo', 'accept_discount', 'write_off', 'none'
  resolution_description TEXT,
  
  -- Responsibility
  responsible_party TEXT, -- 'internal', 'supplier', 'customer', 'split', 'external'
  
  -- Cost
  estimated_cost DECIMAL(12,2) DEFAULT 0,
  actual_cost DECIMAL(12,2) DEFAULT 0,
  recovered_cost DECIMAL(12,2) DEFAULT 0, -- จาก Supplier claim
  
  -- Timeline impact
  days_delayed INTEGER DEFAULT 0,
  
  -- Assignment
  assigned_to UUID REFERENCES user_profiles(id),
  
  -- Evidence
  photo_urls TEXT[] DEFAULT '{}',
  
  -- Dates
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  
  -- Notes
  internal_notes TEXT,
  
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Issue Logs
CREATE TABLE IF NOT EXISTS issue_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
  
  action TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  
  details JSONB,
  notes TEXT,
  
  performed_by UUID REFERENCES user_profiles(id),
  performed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generate Issue Number
CREATE OR REPLACE FUNCTION generate_issue_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
  new_number TEXT;
BEGIN
  year_part := to_char(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(issue_number FROM 10) AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM issues
  WHERE issue_number LIKE 'ISS-' || year_part || '-%';
  
  new_number := 'ISS-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 16. STATUS REVERSION SYSTEM
-- =============================================

-- Status Reversions (บันทึกการย้อนสถานะ)
CREATE TABLE IF NOT EXISTS status_reversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reversion_number TEXT UNIQUE NOT NULL, -- 'REV-2024-0001'
  
  -- Entity
  entity_type TEXT NOT NULL, -- 'order', 'work_item', 'production_job'
  entity_id UUID NOT NULL,
  
  -- Status change
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  
  -- Reason
  reason_type TEXT NOT NULL, -- 'customer_change', 'quality_issue', 'material_problem', 'internal_error', 'other'
  reason_description TEXT NOT NULL,
  
  -- Linked entities
  linked_issue_id UUID REFERENCES issues(id),
  linked_change_request_id UUID,
  
  -- Impact
  affected_items JSONB, -- [{work_item_id, action: 'keep'|'discard'|'cancel'}]
  cost_impact DECIMAL(12,2) DEFAULT 0,
  days_impact INTEGER DEFAULT 0,
  
  -- Approval (if required)
  requires_approval BOOLEAN DEFAULT false,
  approval_status TEXT DEFAULT 'not_required', -- 'not_required', 'pending', 'approved', 'rejected'
  approved_by UUID REFERENCES user_profiles(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'executed', 'rejected', 'cancelled'
  executed_at TIMESTAMPTZ,
  
  requested_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reversion Rules (กำหนดว่าย้อนอะไรได้บ้าง)
CREATE TABLE IF NOT EXISTS reversion_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, -- 'order', 'work_item', 'production_job'
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  
  is_allowed BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT false,
  requires_reason BOOLEAN DEFAULT true,
  approval_role TEXT, -- 'manager', 'admin', 'finance'
  
  cost_rule TEXT, -- 'none', 'calculate', 'fixed'
  fixed_cost DECIMAL(10,2) DEFAULT 0,
  
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed reversion rules
INSERT INTO reversion_rules (entity_type, from_status, to_status, is_allowed, requires_approval, requires_reason) VALUES
-- Order reversions
('order', 'quoted', 'draft', true, false, false),
('order', 'awaiting_payment', 'draft', true, false, true),
('order', 'awaiting_payment', 'quoted', true, false, false),
('order', 'designing', 'draft', true, false, true),
('order', 'designing', 'quoted', true, false, true),
('order', 'awaiting_mockup_approval', 'designing', true, false, true),
('order', 'in_production', 'designing', true, true, true),
('order', 'in_production', 'awaiting_mockup_approval', true, true, true),
('order', 'ready_to_ship', 'in_production', true, true, true),
('order', 'shipped', 'ready_to_ship', true, true, true),
('order', 'completed', 'shipped', false, true, true)
ON CONFLICT DO NOTHING;

-- Generate Reversion Number
CREATE OR REPLACE FUNCTION generate_reversion_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
  new_number TEXT;
BEGIN
  year_part := to_char(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(reversion_number FROM 10) AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM status_reversions
  WHERE reversion_number LIKE 'REV-' || year_part || '-%';
  
  new_number := 'REV-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 17. MATERIAL PROCUREMENT
-- =============================================

-- Material Requests (คำขอวัสดุ)
CREATE TABLE IF NOT EXISTS material_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number TEXT UNIQUE NOT NULL, -- 'MR-2024-0001'
  
  -- Linked order
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  order_work_item_id UUID,
  order_addon_id UUID,
  
  -- Material details
  product_id UUID, -- REFERENCES products(id) if exists
  product_sku TEXT,
  product_name TEXT NOT NULL,
  product_description TEXT,
  
  -- Quantity
  required_qty INTEGER NOT NULL,
  available_qty INTEGER DEFAULT 0,
  ordered_qty INTEGER DEFAULT 0,
  received_qty INTEGER DEFAULT 0,
  
  -- Procurement method
  procurement_type TEXT DEFAULT 'purchase', -- 'purchase', 'customer_provide', 'transfer'
  
  -- Status
  status TEXT DEFAULT 'pending',
  -- 'pending', 'partially_ordered', 'ordered', 'in_transit', 'partially_received', 'received', 'cancelled'
  
  -- Customer provide info
  customer_shipping_tracking TEXT,
  customer_expected_date DATE,
  customer_received_at TIMESTAMPTZ,
  
  -- Linked PO
  po_id UUID REFERENCES purchase_orders(id),
  
  -- Supplier selection
  selected_supplier_id UUID REFERENCES suppliers(id),
  supplier_price DECIMAL(10,2),
  supplier_lead_days INTEGER,
  
  -- Timeline
  needed_by DATE,
  expected_date DATE,
  
  -- Notes
  notes TEXT,
  
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Material Request Logs
CREATE TABLE IF NOT EXISTS material_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES material_requests(id) ON DELETE CASCADE,
  
  action TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  
  details JSONB,
  notes TEXT,
  
  performed_by UUID REFERENCES user_profiles(id),
  performed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generate Material Request Number
CREATE OR REPLACE FUNCTION generate_material_request_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
  new_number TEXT;
BEGIN
  year_part := to_char(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(request_number FROM 9) AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM material_requests
  WHERE request_number LIKE 'MR-' || year_part || '-%';
  
  new_number := 'MR-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Add material status to orders
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS materials_status TEXT DEFAULT 'not_checked',
-- 'not_checked', 'checking', 'all_available', 'partial', 'awaiting_material', 'awaiting_customer'
ADD COLUMN IF NOT EXISTS materials_eta DATE,
ADD COLUMN IF NOT EXISTS has_customer_material BOOLEAN DEFAULT false;

-- Add material status to order_work_items
ALTER TABLE order_work_items
ADD COLUMN IF NOT EXISTS material_status TEXT DEFAULT 'not_required',
-- 'not_required', 'available', 'partial', 'awaiting', 'awaiting_customer', 'received'
ADD COLUMN IF NOT EXISTS material_request_id UUID,
ADD COLUMN IF NOT EXISTS customer_provides_material BOOLEAN DEFAULT false;

-- =============================================
-- 18. ENHANCED CHANGE REQUEST (ความเรื่องมาก)
-- =============================================

-- Add more fields to change_requests
ALTER TABLE change_requests
ADD COLUMN IF NOT EXISTS revision_number INTEGER DEFAULT 1, -- ครั้งที่เท่าไร
ADD COLUMN IF NOT EXISTS is_customer_fault BOOLEAN DEFAULT true, -- ลูกค้าผิดเอง?
ADD COLUMN IF NOT EXISTS affected_production_qty INTEGER DEFAULT 0, -- จำนวนที่ผลิตไปแล้ว
ADD COLUMN IF NOT EXISTS waste_cost DECIMAL(10,2) DEFAULT 0, -- ค่าของเสีย
ADD COLUMN IF NOT EXISTS linked_issue_id UUID, -- ถ้ามาจาก issue
ADD COLUMN IF NOT EXISTS linked_reversion_id UUID, -- ถ้าต้อง revert status
ADD COLUMN IF NOT EXISTS customer_acknowledged BOOLEAN DEFAULT false, -- ลูกค้ารับทราบ
ADD COLUMN IF NOT EXISTS customer_acknowledged_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS requires_new_mockup BOOLEAN DEFAULT false, -- ต้อง approve mockup ใหม่
ADD COLUMN IF NOT EXISTS new_mockup_approved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS new_mockup_approved_at TIMESTAMPTZ;

-- Change Request Types (ประเภทการเปลี่ยนแปลง)
CREATE TABLE IF NOT EXISTS change_request_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_th TEXT NOT NULL,
  
  -- Cost structure by phase
  cost_design_phase DECIMAL(10,2) DEFAULT 0, -- ค่าใช้จ่ายถ้าอยู่ใน design phase
  cost_mockup_phase DECIMAL(10,2) DEFAULT 0, -- หลัง mockup approved
  cost_production_phase DECIMAL(10,2) DEFAULT 0, -- ระหว่างผลิต
  cost_per_piece_produced DECIMAL(10,2) DEFAULT 0, -- ค่าต่อชิ้นที่ผลิตไปแล้ว
  
  -- Requires
  requires_new_design BOOLEAN DEFAULT false,
  requires_new_mockup BOOLEAN DEFAULT false,
  
  -- Time impact
  typical_days_delay INTEGER DEFAULT 0,
  
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO change_request_types (code, name, name_th, cost_design_phase, cost_mockup_phase, cost_production_phase, cost_per_piece_produced, requires_new_design, requires_new_mockup, typical_days_delay) VALUES
('design_minor', 'Minor Design Change', 'แก้ไขลายเล็กน้อย', 0, 100, 300, 0, true, false, 1),
('design_major', 'Major Design Change', 'เปลี่ยนลายทั้งหมด', 0, 300, 500, 30, true, true, 3),
('color_change', 'Color Change', 'เปลี่ยนสี', 0, 100, 500, 30, true, true, 2),
('size_change', 'Size Distribution Change', 'เปลี่ยนไซส์', 0, 50, 200, 0, false, false, 1),
('quantity_increase', 'Quantity Increase', 'เพิ่มจำนวน', 0, 0, 0, 0, false, false, 2),
('quantity_decrease', 'Quantity Decrease', 'ลดจำนวน', 0, 100, 300, 0, false, false, 0),
('add_work', 'Add Work Item', 'เพิ่มงาน', 0, 200, 400, 0, true, true, 3),
('remove_work', 'Remove Work Item', 'ลบงาน', 0, 100, 300, 0, false, true, 0),
('position_change', 'Position Change', 'เปลี่ยนตำแหน่งลาย', 0, 100, 400, 30, true, true, 2),
('addon_change', 'Addon Change', 'เปลี่ยน Addon', 0, 50, 100, 0, false, false, 1),
('material_change', 'Material Change', 'เปลี่ยนวัสดุ/เสื้อ', 0, 200, 500, 50, false, true, 3),
('cancel_partial', 'Partial Cancellation', 'ยกเลิกบางส่วน', 0, 200, 500, 0, false, false, 0),
('other', 'Other', 'อื่นๆ', 0, 100, 300, 0, false, false, 2)
ON CONFLICT (code) DO UPDATE SET
  cost_design_phase = EXCLUDED.cost_design_phase,
  cost_mockup_phase = EXCLUDED.cost_mockup_phase,
  cost_production_phase = EXCLUDED.cost_production_phase,
  cost_per_piece_produced = EXCLUDED.cost_per_piece_produced;

-- =============================================
-- 19. QUOTATION SYSTEM
-- =============================================

-- Quotations
CREATE TABLE IF NOT EXISTS quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_number TEXT UNIQUE NOT NULL, -- 'QT-2024-0001'
  version INTEGER DEFAULT 1, -- version number if revised
  
  -- Customer
  customer_id UUID REFERENCES customers(id),
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  customer_company TEXT,
  
  -- Status
  status TEXT DEFAULT 'draft',
  -- 'draft', 'sent', 'viewed', 'approved', 'revision_requested', 'rejected', 'expired', 'converted'
  
  -- Validity
  created_date DATE DEFAULT CURRENT_DATE,
  valid_until DATE,
  is_expired BOOLEAN DEFAULT false,
  
  -- Items (stored as JSONB for flexibility)
  items JSONB DEFAULT '[]',
  -- [{description, quantity, unit_price, total, work_type, position, size, etc.}]
  
  -- Pricing
  subtotal DECIMAL(12,2) DEFAULT 0,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  discount_reason TEXT,
  shipping_estimate DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,
  
  -- Terms
  payment_terms TEXT DEFAULT '50_50',
  lead_time_days INTEGER DEFAULT 14,
  
  -- Notes
  notes TEXT,
  internal_notes TEXT,
  terms_conditions TEXT,
  
  -- Conversion
  converted_to_order_id UUID,
  converted_at TIMESTAMPTZ,
  
  -- Customer Response
  customer_response TEXT, -- 'approved', 'rejected', 'revision'
  customer_response_at TIMESTAMPTZ,
  customer_feedback TEXT,
  
  -- Sent info
  sent_at TIMESTAMPTZ,
  sent_via TEXT, -- 'email', 'line', 'manual'
  viewed_at TIMESTAMPTZ,
  
  -- Reminder
  last_reminder_at TIMESTAMPTZ,
  reminder_count INTEGER DEFAULT 0,
  
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quotation Logs
CREATE TABLE IF NOT EXISTS quotation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE,
  
  action TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  
  details JSONB,
  notes TEXT,
  
  performed_by UUID REFERENCES user_profiles(id),
  performed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generate Quotation Number
CREATE OR REPLACE FUNCTION generate_quotation_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
  new_number TEXT;
BEGIN
  year_part := to_char(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(quotation_number FROM 9) AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM quotations
  WHERE quotation_number LIKE 'QT-' || year_part || '-%';
  
  new_number := 'QT-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 20. INVOICE & PAYMENT SYSTEM
-- =============================================

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL, -- 'INV-2024-0001'
  
  -- Type
  invoice_type TEXT DEFAULT 'full', -- 'deposit', 'balance', 'full', 'additional'
  
  -- Linked entities
  order_id UUID REFERENCES orders(id),
  quotation_id UUID REFERENCES quotations(id),
  
  -- Customer
  customer_id UUID REFERENCES customers(id),
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  
  -- Tax Invoice Info (optional)
  is_tax_invoice BOOLEAN DEFAULT false,
  tax_id TEXT,
  branch_number TEXT DEFAULT '00000',
  
  -- Dates
  invoice_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  
  -- Items
  items JSONB DEFAULT '[]',
  
  -- Amounts
  subtotal DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  before_vat DECIMAL(12,2) DEFAULT 0,
  vat_percent DECIMAL(5,2) DEFAULT 0, -- 0 or 7
  vat_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  
  -- Payment
  payment_status TEXT DEFAULT 'unpaid', -- 'unpaid', 'partial', 'paid', 'overdue', 'cancelled'
  paid_amount DECIMAL(12,2) DEFAULT 0,
  remaining_amount DECIMAL(12,2) DEFAULT 0,
  paid_at TIMESTAMPTZ,
  
  -- PDF
  pdf_url TEXT,
  
  -- Notes
  notes TEXT,
  
  -- Sent
  sent_at TIMESTAMPTZ,
  sent_via TEXT,
  
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Receipts
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number TEXT UNIQUE NOT NULL, -- 'REC-2024-0001'
  
  -- Linked
  invoice_id UUID REFERENCES invoices(id),
  order_id UUID REFERENCES orders(id),
  payment_id UUID REFERENCES order_payments(id),
  
  -- Customer
  customer_id UUID REFERENCES customers(id),
  customer_name TEXT NOT NULL,
  
  -- Amounts
  amount DECIMAL(12,2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_reference TEXT,
  
  -- Dates
  receipt_date DATE DEFAULT CURRENT_DATE,
  payment_date DATE,
  
  -- Tax Receipt
  is_tax_receipt BOOLEAN DEFAULT false,
  
  -- PDF
  pdf_url TEXT,
  
  notes TEXT,
  
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Methods Configuration
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_th TEXT NOT NULL,
  
  -- Type
  method_type TEXT NOT NULL, -- 'bank_transfer', 'promptpay', 'cash', 'credit_card', 'credit_term'
  
  -- Bank details (for bank transfer)
  bank_name TEXT,
  bank_code TEXT,
  account_number TEXT,
  account_name TEXT,
  
  -- PromptPay
  promptpay_id TEXT,
  qr_code_url TEXT,
  
  -- Credit term
  credit_days INTEGER,
  min_customer_tier TEXT, -- minimum tier required
  
  -- Settings
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  instructions TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed payment methods
INSERT INTO payment_methods (code, name, name_th, method_type, is_active, sort_order) VALUES
('bank_scb', 'SCB Bank Transfer', 'โอนผ่าน ธ.ไทยพาณิชย์', 'bank_transfer', true, 1),
('bank_kbank', 'KBank Transfer', 'โอนผ่าน ธ.กสิกรไทย', 'bank_transfer', true, 2),
('promptpay', 'PromptPay', 'พร้อมเพย์', 'promptpay', true, 3),
('cash', 'Cash', 'เงินสด', 'cash', true, 4),
('credit_15', 'Credit 15 Days', 'เครดิต 15 วัน', 'credit_term', true, 10),
('credit_30', 'Credit 30 Days', 'เครดิต 30 วัน', 'credit_term', true, 11)
ON CONFLICT (code) DO NOTHING;

-- Generate Invoice Number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
  new_number TEXT;
BEGIN
  year_part := to_char(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(invoice_number FROM 10) AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM invoices
  WHERE invoice_number LIKE 'INV-' || year_part || '-%';
  
  new_number := 'INV-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Generate Receipt Number
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
  new_number TEXT;
BEGIN
  year_part := to_char(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(receipt_number FROM 10) AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM receipts
  WHERE receipt_number LIKE 'REC-' || year_part || '-%';
  
  new_number := 'REC-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 21. PRICING ENGINE
-- =============================================

-- Price Rules
CREATE TABLE IF NOT EXISTS price_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  rule_type TEXT NOT NULL, -- 'work_type', 'quantity_discount', 'tier_discount', 'rush_fee'
  
  -- Work type pricing
  work_type_code TEXT,
  position_code TEXT,
  size_code TEXT,
  
  -- Quantity range
  qty_min INTEGER,
  qty_max INTEGER,
  
  -- Customer tier
  customer_tier TEXT,
  
  -- Price
  price DECIMAL(10,2),
  discount_percent DECIMAL(5,2),
  markup_percent DECIMAL(5,2),
  
  -- Priority (higher = applied first)
  priority INTEGER DEFAULT 0,
  
  is_active BOOLEAN DEFAULT true,
  valid_from DATE,
  valid_until DATE,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer Tier Discounts
CREATE TABLE IF NOT EXISTS customer_tier_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_code TEXT UNIQUE NOT NULL, -- 'retail', 'wholesale', 'corporate', 'vip'
  tier_name TEXT NOT NULL,
  tier_name_th TEXT NOT NULL,
  
  discount_percent DECIMAL(5,2) DEFAULT 0,
  min_order_value DECIMAL(12,2) DEFAULT 0, -- minimum order to qualify
  credit_days INTEGER DEFAULT 0, -- 0 = no credit
  
  benefits TEXT[], -- list of benefits
  
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed customer tiers
INSERT INTO customer_tier_discounts (tier_code, tier_name, tier_name_th, discount_percent, credit_days, sort_order) VALUES
('retail', 'Retail', 'ลูกค้าทั่วไป', 0, 0, 1),
('wholesale', 'Wholesale', 'ขายส่ง', 5, 0, 2),
('corporate', 'Corporate', 'องค์กร', 10, 15, 3),
('vip', 'VIP', 'VIP', 15, 30, 4)
ON CONFLICT (tier_code) DO UPDATE SET
  discount_percent = EXCLUDED.discount_percent,
  credit_days = EXCLUDED.credit_days;

-- Quantity Discounts
CREATE TABLE IF NOT EXISTS quantity_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  qty_min INTEGER NOT NULL,
  qty_max INTEGER,
  discount_percent DECIMAL(5,2) NOT NULL,
  
  -- Optional: specific to work type
  work_type_code TEXT,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed quantity discounts
INSERT INTO quantity_discounts (qty_min, qty_max, discount_percent) VALUES
(50, 99, 5),
(100, 299, 10),
(300, 499, 15),
(500, NULL, 20)
ON CONFLICT DO NOTHING;

-- =============================================
-- 22. SHIPPING SYSTEM
-- =============================================

-- Shipping Carriers
CREATE TABLE IF NOT EXISTS shipping_carriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_th TEXT NOT NULL,
  
  -- API Integration
  api_enabled BOOLEAN DEFAULT false,
  api_key TEXT,
  api_endpoint TEXT,
  
  -- Tracking
  tracking_url_template TEXT, -- 'https://track.com?no={tracking}'
  
  -- Pricing
  base_price DECIMAL(10,2) DEFAULT 0,
  price_per_kg DECIMAL(10,2) DEFAULT 0,
  
  -- Settings
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed carriers
INSERT INTO shipping_carriers (code, name, name_th, tracking_url_template, is_active, sort_order) VALUES
('kerry', 'Kerry Express', 'Kerry Express', 'https://th.kerryexpress.com/th/track/?track={tracking}', true, 1),
('flash', 'Flash Express', 'Flash Express', 'https://www.flashexpress.com/tracking/?se={tracking}', true, 2),
('jt', 'J&T Express', 'J&T Express', 'https://www.jtexpress.co.th/index/query/gzquery.html?billcode={tracking}', true, 3),
('pickup', 'Pickup', 'รับเอง', NULL, true, 10),
('own', 'Own Delivery', 'ส่งเอง', NULL, true, 11)
ON CONFLICT (code) DO NOTHING;

-- Shipments
CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_number TEXT UNIQUE NOT NULL, -- 'SHP-2024-0001'
  
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Carrier
  carrier_id UUID REFERENCES shipping_carriers(id),
  carrier_code TEXT,
  carrier_name TEXT,
  
  -- Tracking
  tracking_number TEXT,
  tracking_url TEXT,
  
  -- Items
  items JSONB DEFAULT '[]', -- [{order_product_id, quantity}]
  
  -- Package info
  package_count INTEGER DEFAULT 1,
  total_weight DECIMAL(8,2), -- kg
  
  -- Status
  status TEXT DEFAULT 'pending',
  -- 'pending', 'packed', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'returned'
  
  -- Dates
  packed_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  
  -- Recipient
  recipient_name TEXT,
  recipient_phone TEXT,
  recipient_address TEXT,
  
  -- Cost
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  cod_amount DECIMAL(10,2) DEFAULT 0, -- if COD
  
  -- Notes
  notes TEXT,
  delivery_notes TEXT, -- สำหรับคนส่ง
  
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shipment Tracking Events
CREATE TABLE IF NOT EXISTS shipment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
  
  event_type TEXT NOT NULL, -- 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed'
  event_description TEXT,
  location TEXT,
  
  event_time TIMESTAMPTZ DEFAULT NOW(),
  source TEXT DEFAULT 'manual', -- 'manual', 'api', 'webhook'
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generate Shipment Number
CREATE OR REPLACE FUNCTION generate_shipment_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
  new_number TEXT;
BEGIN
  year_part := to_char(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(shipment_number FROM 10) AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM shipments
  WHERE shipment_number LIKE 'SHP-' || year_part || '-%';
  
  new_number := 'SHP-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 23. NOTIFICATION SYSTEM
-- =============================================

-- Notification Templates
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  code TEXT UNIQUE NOT NULL, -- 'order_confirmed', 'mockup_ready', etc.
  name TEXT NOT NULL,
  
  -- Channels
  channels TEXT[] DEFAULT '{}'::TEXT[], -- ['line', 'email', 'sms', 'in_app']
  
  -- Templates per channel
  line_template TEXT,
  email_subject TEXT,
  email_template TEXT,
  sms_template TEXT,
  in_app_title TEXT,
  in_app_body TEXT,
  
  -- Variables available
  variables TEXT[], -- ['customer_name', 'order_number', 'total_amount', etc.]
  
  -- Settings
  is_active BOOLEAN DEFAULT true,
  send_to_customer BOOLEAN DEFAULT true,
  send_to_admin BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification Queue
CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  template_code TEXT NOT NULL,
  channel TEXT NOT NULL, -- 'line', 'email', 'sms', 'in_app'
  
  -- Recipient
  recipient_type TEXT NOT NULL, -- 'customer', 'admin', 'user'
  recipient_id UUID,
  recipient_contact TEXT, -- email/phone/line_id
  
  -- Content
  subject TEXT,
  body TEXT NOT NULL,
  
  -- Context
  order_id UUID,
  context_data JSONB,
  
  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'cancelled'
  
  -- Scheduling
  scheduled_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  
  -- Retry
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  last_error TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification History
CREATE TABLE IF NOT EXISTS notification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  queue_id UUID REFERENCES notification_queue(id),
  template_code TEXT,
  channel TEXT,
  recipient_contact TEXT,
  
  status TEXT, -- 'sent', 'delivered', 'failed', 'bounced'
  
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  
  error_message TEXT,
  response_data JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed notification templates
INSERT INTO notification_templates (code, name, channels, send_to_customer, send_to_admin, variables) VALUES
('quotation_sent', 'Quotation Sent', ARRAY['line', 'email'], true, false, ARRAY['customer_name', 'quotation_number', 'total_amount', 'valid_until', 'link']),
('order_confirmed', 'Order Confirmed', ARRAY['line', 'email'], true, true, ARRAY['customer_name', 'order_number', 'total_amount']),
('payment_received', 'Payment Received', ARRAY['line'], true, true, ARRAY['customer_name', 'order_number', 'amount', 'payment_method']),
('mockup_ready', 'Mockup Ready', ARRAY['line', 'email'], true, false, ARRAY['customer_name', 'order_number', 'link']),
('mockup_approved', 'Mockup Approved', ARRAY['in_app'], false, true, ARRAY['customer_name', 'order_number']),
('production_started', 'Production Started', ARRAY['line'], true, false, ARRAY['customer_name', 'order_number', 'estimated_date']),
('production_complete', 'Production Complete', ARRAY['line'], true, false, ARRAY['customer_name', 'order_number']),
('payment_reminder', 'Payment Reminder', ARRAY['line', 'email'], true, false, ARRAY['customer_name', 'order_number', 'amount', 'due_date']),
('shipped', 'Order Shipped', ARRAY['line', 'email'], true, false, ARRAY['customer_name', 'order_number', 'tracking_number', 'carrier', 'tracking_url']),
('delivered', 'Order Delivered', ARRAY['line'], true, false, ARRAY['customer_name', 'order_number']),
('change_request_submitted', 'Change Request Submitted', ARRAY['in_app'], false, true, ARRAY['customer_name', 'order_number', 'change_type']),
('issue_reported', 'Issue Reported', ARRAY['in_app', 'line'], false, true, ARRAY['order_number', 'issue_type', 'severity']),
('po_overdue', 'PO Overdue', ARRAY['in_app', 'line'], false, true, ARRAY['po_number', 'supplier_name', 'days_overdue'])
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- 24. REPEAT ORDER & TEMPLATES
-- =============================================

-- Order Templates (for repeat orders)
CREATE TABLE IF NOT EXISTS order_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name TEXT NOT NULL,
  description TEXT,
  
  -- Source
  source_order_id UUID REFERENCES orders(id),
  
  -- Customer (optional - can be template for any customer)
  customer_id UUID REFERENCES customers(id),
  
  -- Template data
  order_type_code TEXT,
  items JSONB DEFAULT '[]',
  addons JSONB DEFAULT '[]',
  
  -- Design files
  design_files JSONB DEFAULT '[]',
  
  -- Pricing (at time of template creation)
  pricing_snapshot JSONB,
  
  -- Usage stats
  times_used INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  is_active BOOLEAN DEFAULT true,
  
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add repeat order fields to orders
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS is_repeat_order BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS source_order_id UUID,
ADD COLUMN IF NOT EXISTS template_id UUID;

-- =============================================
-- 25. INDEXES (Updated)
-- =============================================

-- Factory Capabilities
CREATE INDEX IF NOT EXISTS idx_factory_capabilities_status ON factory_capabilities(status);

-- Issues
CREATE INDEX IF NOT EXISTS idx_issues_order_id ON issues(order_id);
CREATE INDEX IF NOT EXISTS idx_issues_po_id ON issues(po_id);
CREATE INDEX IF NOT EXISTS idx_issues_supplier_id ON issues(supplier_id);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_severity ON issues(severity);
CREATE INDEX IF NOT EXISTS idx_issues_source ON issues(source);

-- Status Reversions
CREATE INDEX IF NOT EXISTS idx_status_reversions_entity ON status_reversions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_status_reversions_status ON status_reversions(status);

-- Material Requests
CREATE INDEX IF NOT EXISTS idx_material_requests_order_id ON material_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_material_requests_status ON material_requests(status);
CREATE INDEX IF NOT EXISTS idx_material_requests_po_id ON material_requests(po_id);

-- Change Request Types
CREATE INDEX IF NOT EXISTS idx_change_request_types_code ON change_request_types(code);

-- Quotations
CREATE INDEX IF NOT EXISTS idx_quotations_customer_id ON quotations(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_valid_until ON quotations(valid_until);

-- Invoices
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

-- Receipts
CREATE INDEX IF NOT EXISTS idx_receipts_invoice_id ON receipts(invoice_id);
CREATE INDEX IF NOT EXISTS idx_receipts_order_id ON receipts(order_id);

-- Shipments
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number ON shipments(tracking_number);

-- Notification Queue
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled_at ON notification_queue(scheduled_at);

-- Order Templates
CREATE INDEX IF NOT EXISTS idx_order_templates_customer_id ON order_templates(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_addons_order_id ON order_addons(order_id);
CREATE INDEX IF NOT EXISTS idx_order_addons_status ON order_addons(status);
CREATE INDEX IF NOT EXISTS idx_change_requests_order_id ON change_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_change_requests_status ON change_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_gates_order_id ON approval_gates(order_id);
CREATE INDEX IF NOT EXISTS idx_approval_gates_gate_type ON approval_gates(gate_type);
CREATE INDEX IF NOT EXISTS idx_qc_records_job_id ON qc_records(job_id);
CREATE INDEX IF NOT EXISTS idx_qc_records_order_id ON qc_records(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_type_code ON orders(order_type_code);
CREATE INDEX IF NOT EXISTS idx_orders_priority_level ON orders(priority_level);

-- Supplier & Outsource indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);
CREATE INDEX IF NOT EXISTS idx_supplier_pricing_supplier_id ON supplier_pricing(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_pricing_service_type ON supplier_pricing(service_type);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_order_id ON purchase_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_expected_date ON purchase_orders(expected_date);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_po_id ON purchase_order_items(po_id);
CREATE INDEX IF NOT EXISTS idx_goods_receiving_po_id ON goods_receiving(po_id);
CREATE INDEX IF NOT EXISTS idx_goods_receiving_supplier_id ON goods_receiving(supplier_id);
CREATE INDEX IF NOT EXISTS idx_order_work_items_production_mode ON order_work_items(production_mode);
CREATE INDEX IF NOT EXISTS idx_order_work_items_po_id ON order_work_items(po_id);
CREATE INDEX IF NOT EXISTS idx_order_addons_production_mode ON order_addons(production_mode);
CREATE INDEX IF NOT EXISTS idx_order_addons_po_id ON order_addons(po_id);

-- =============================================
-- 14. RLS POLICIES
-- =============================================
ALTER TABLE order_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE addon_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_request_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE priority_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE qc_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE qc_records ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Authenticated users can view order_types" ON order_types;
DROP POLICY IF EXISTS "Authenticated users can view work_categories" ON work_categories;
DROP POLICY IF EXISTS "Authenticated users can view work_dependencies" ON work_dependencies;
DROP POLICY IF EXISTS "Authenticated users can view addon_types" ON addon_types;
DROP POLICY IF EXISTS "Authenticated users can manage order_addons" ON order_addons;
DROP POLICY IF EXISTS "Authenticated users can manage change_requests" ON change_requests;
DROP POLICY IF EXISTS "Authenticated users can manage change_request_logs" ON change_request_logs;
DROP POLICY IF EXISTS "Authenticated users can manage approval_gates" ON approval_gates;
DROP POLICY IF EXISTS "Authenticated users can view priority_levels" ON priority_levels;
DROP POLICY IF EXISTS "Authenticated users can view qc_stages" ON qc_stages;
DROP POLICY IF EXISTS "Authenticated users can manage qc_records" ON qc_records;

-- Create policies
CREATE POLICY "Authenticated users can view order_types" ON order_types
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view work_categories" ON work_categories
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view work_dependencies" ON work_dependencies
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view addon_types" ON addon_types
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage order_addons" ON order_addons
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage change_requests" ON change_requests
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage change_request_logs" ON change_request_logs
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage approval_gates" ON approval_gates
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view priority_levels" ON priority_levels
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view qc_stages" ON qc_stages
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage qc_records" ON qc_records
  FOR ALL USING (auth.role() = 'authenticated');

-- Supplier & Outsource RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE goods_receiving ENABLE ROW LEVEL SECURITY;
ALTER TABLE goods_receiving_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_type_outsource_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE addon_outsource_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage suppliers" ON suppliers;
DROP POLICY IF EXISTS "Authenticated users can manage supplier_pricing" ON supplier_pricing;
DROP POLICY IF EXISTS "Authenticated users can manage purchase_orders" ON purchase_orders;
DROP POLICY IF EXISTS "Authenticated users can manage purchase_order_items" ON purchase_order_items;
DROP POLICY IF EXISTS "Authenticated users can manage purchase_order_logs" ON purchase_order_logs;
DROP POLICY IF EXISTS "Authenticated users can manage goods_receiving" ON goods_receiving;
DROP POLICY IF EXISTS "Authenticated users can manage goods_receiving_items" ON goods_receiving_items;
DROP POLICY IF EXISTS "Authenticated users can view work_type_outsource_config" ON work_type_outsource_config;
DROP POLICY IF EXISTS "Authenticated users can view addon_outsource_config" ON addon_outsource_config;

CREATE POLICY "Authenticated users can manage suppliers" ON suppliers
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage supplier_pricing" ON supplier_pricing
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage purchase_orders" ON purchase_orders
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage purchase_order_items" ON purchase_order_items
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage purchase_order_logs" ON purchase_order_logs
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage goods_receiving" ON goods_receiving
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage goods_receiving_items" ON goods_receiving_items
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view work_type_outsource_config" ON work_type_outsource_config
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view addon_outsource_config" ON addon_outsource_config
  FOR SELECT USING (auth.role() = 'authenticated');

-- Factory Capabilities
ALTER TABLE factory_capabilities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can manage factory_capabilities" ON factory_capabilities;
CREATE POLICY "Authenticated users can manage factory_capabilities" ON factory_capabilities
  FOR ALL USING (auth.role() = 'authenticated');

-- Issues
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can manage issues" ON issues;
DROP POLICY IF EXISTS "Authenticated users can manage issue_logs" ON issue_logs;
CREATE POLICY "Authenticated users can manage issues" ON issues
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage issue_logs" ON issue_logs
  FOR ALL USING (auth.role() = 'authenticated');

-- Status Reversions
ALTER TABLE status_reversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reversion_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can manage status_reversions" ON status_reversions;
DROP POLICY IF EXISTS "Authenticated users can view reversion_rules" ON reversion_rules;
CREATE POLICY "Authenticated users can manage status_reversions" ON status_reversions
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view reversion_rules" ON reversion_rules
  FOR SELECT USING (auth.role() = 'authenticated');

-- Material Requests
ALTER TABLE material_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_request_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can manage material_requests" ON material_requests;
DROP POLICY IF EXISTS "Authenticated users can manage material_request_logs" ON material_request_logs;
CREATE POLICY "Authenticated users can manage material_requests" ON material_requests
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage material_request_logs" ON material_request_logs
  FOR ALL USING (auth.role() = 'authenticated');

-- Change Request Types
ALTER TABLE change_request_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view change_request_types" ON change_request_types;
CREATE POLICY "Authenticated users can view change_request_types" ON change_request_types
  FOR SELECT USING (auth.role() = 'authenticated');

-- Quotations
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can manage quotations" ON quotations;
DROP POLICY IF EXISTS "Authenticated users can manage quotation_logs" ON quotation_logs;
CREATE POLICY "Authenticated users can manage quotations" ON quotations
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage quotation_logs" ON quotation_logs
  FOR ALL USING (auth.role() = 'authenticated');

-- Invoices & Receipts
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can manage invoices" ON invoices;
DROP POLICY IF EXISTS "Authenticated users can manage receipts" ON receipts;
DROP POLICY IF EXISTS "Authenticated users can view payment_methods" ON payment_methods;
CREATE POLICY "Authenticated users can manage invoices" ON invoices
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage receipts" ON receipts
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view payment_methods" ON payment_methods
  FOR SELECT USING (auth.role() = 'authenticated');

-- Pricing
ALTER TABLE price_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_tier_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quantity_discounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can manage price_rules" ON price_rules;
DROP POLICY IF EXISTS "Authenticated users can view customer_tier_discounts" ON customer_tier_discounts;
DROP POLICY IF EXISTS "Authenticated users can view quantity_discounts" ON quantity_discounts;
CREATE POLICY "Authenticated users can manage price_rules" ON price_rules
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view customer_tier_discounts" ON customer_tier_discounts
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view quantity_discounts" ON quantity_discounts
  FOR SELECT USING (auth.role() = 'authenticated');

-- Shipping
ALTER TABLE shipping_carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view shipping_carriers" ON shipping_carriers;
DROP POLICY IF EXISTS "Authenticated users can manage shipments" ON shipments;
DROP POLICY IF EXISTS "Authenticated users can manage shipment_events" ON shipment_events;
CREATE POLICY "Authenticated users can view shipping_carriers" ON shipping_carriers
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage shipments" ON shipments
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage shipment_events" ON shipment_events
  FOR ALL USING (auth.role() = 'authenticated');

-- Notifications
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view notification_templates" ON notification_templates;
DROP POLICY IF EXISTS "Authenticated users can manage notification_queue" ON notification_queue;
DROP POLICY IF EXISTS "Authenticated users can view notification_history" ON notification_history;
CREATE POLICY "Authenticated users can view notification_templates" ON notification_templates
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage notification_queue" ON notification_queue
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view notification_history" ON notification_history
  FOR SELECT USING (auth.role() = 'authenticated');

-- Order Templates
ALTER TABLE order_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can manage order_templates" ON order_templates;
CREATE POLICY "Authenticated users can manage order_templates" ON order_templates
  FOR ALL USING (auth.role() = 'authenticated');

-- =============================================
-- 15. HELPER FUNCTIONS
-- =============================================

-- Function to check if work item can start based on dependencies
CREATE OR REPLACE FUNCTION check_work_item_dependencies(work_item_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  item RECORD;
  dep RECORD;
  all_deps_completed BOOLEAN := true;
BEGIN
  SELECT * INTO item FROM order_work_items WHERE id = work_item_id;
  
  IF item.depends_on IS NULL OR array_length(item.depends_on, 1) IS NULL THEN
    RETURN true;
  END IF;
  
  FOR dep IN 
    SELECT * FROM order_work_items 
    WHERE id = ANY(item.depends_on)
  LOOP
    IF dep.status NOT IN ('completed', 'qc_passed') THEN
      all_deps_completed := false;
      EXIT;
    END IF;
  END LOOP;
  
  RETURN all_deps_completed;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate change request fees based on phase
CREATE OR REPLACE FUNCTION calculate_change_request_fees(
  p_order_phase TEXT,
  p_change_type TEXT,
  p_affected_qty INTEGER DEFAULT 0
)
RETURNS TABLE(
  base_fee DECIMAL(10,2),
  design_fee DECIMAL(10,2),
  rework_fee DECIMAL(10,2)
) AS $$
BEGIN
  base_fee := 0;
  design_fee := 0;
  rework_fee := 0;
  
  -- Base fee by phase
  CASE p_order_phase
    WHEN 'design' THEN
      base_fee := 0;
    WHEN 'mockup_approved' THEN
      base_fee := 200;
    WHEN 'in_production' THEN
      base_fee := 500;
    WHEN 'qc_complete' THEN
      base_fee := 1000;
    ELSE
      base_fee := 0;
  END CASE;
  
  -- Design fee if design change
  IF p_change_type IN ('design', 'color', 'add_work') THEN
    design_fee := 300;
  END IF;
  
  -- Rework fee if in production
  IF p_order_phase IN ('in_production', 'qc_complete') AND p_affected_qty > 0 THEN
    rework_fee := p_affected_qty * 30; -- ฿30 per piece rework
  END IF;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- DONE!
-- =============================================
SELECT 'ERP V2 Schema created successfully!' as message;
