-- =============================================
-- PRODUCTION TRACKING SYSTEM
-- =============================================
-- Can run standalone, but for full integration:
-- 1. Run schema.sql first (for user_profiles)
-- 2. Run orders-schema.sql (for orders, order_work_items)
-- 3. Then run this file
-- =============================================

-- =============================================
-- PRODUCTION STATIONS (สถานี/เครื่องจักร)
-- =============================================

CREATE TABLE IF NOT EXISTS production_stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,           -- 'DTG-1', 'EMB-1', 'SEW-1'
  name TEXT NOT NULL,                  -- 'เครื่อง DTG ตัว 1'
  department TEXT NOT NULL,            -- 'printing', 'embroidery', 'sewing', 'cutting'
  work_type_codes TEXT[] DEFAULT '{}', -- ['DTG', 'DTF'] งานที่รับได้
  
  -- Capacity
  capacity_per_day INTEGER DEFAULT 100, -- ตัว/วัน
  
  -- Status
  status TEXT DEFAULT 'active',        -- 'active', 'maintenance', 'offline'
  
  -- Current job
  current_job_id UUID,
  
  -- Worker
  assigned_worker_id UUID,  -- References user_profiles(id) if exists
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PRODUCTION JOBS (งานผลิตแต่ละรายการ)
-- =============================================

CREATE TABLE IF NOT EXISTS production_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_number TEXT UNIQUE NOT NULL,     -- 'PJ-2024-0001'
  
  -- Link to Order (Optional - can be standalone job)
  order_id UUID,  -- Will reference orders(id) if orders table exists
  order_work_item_id UUID,  -- Will reference order_work_items(id) if exists
  
  -- Job Info
  work_type_code TEXT NOT NULL,        -- 'DTG', 'EMBROIDERY'
  work_type_name TEXT,
  description TEXT,
  
  -- Quantity
  ordered_qty INTEGER NOT NULL DEFAULT 1,
  produced_qty INTEGER DEFAULT 0,      -- ผลิตแล้ว
  passed_qty INTEGER DEFAULT 0,        -- ผ่าน QC
  failed_qty INTEGER DEFAULT 0,        -- ไม่ผ่าน QC
  
  -- Status
  status TEXT DEFAULT 'pending',
  -- pending, queued, assigned, in_progress, qc_check, qc_passed, qc_failed, rework, completed, cancelled
  
  priority INTEGER DEFAULT 0,          -- 0 = normal, 1 = rush, 2 = urgent
  
  -- Assignment
  station_id UUID REFERENCES production_stations(id),
  assigned_to UUID,  -- References user_profiles(id) if exists
  assigned_at TIMESTAMPTZ,
  
  -- Timing
  estimated_hours DECIMAL(5,2),
  actual_hours DECIMAL(5,2),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  due_date DATE,
  
  -- QC
  qc_status TEXT,                      -- 'pending', 'passed', 'failed', 'partial'
  qc_notes TEXT,
  qc_by UUID,  -- References user_profiles(id) if exists
  qc_at TIMESTAMPTZ,
  
  -- Rework
  is_rework BOOLEAN DEFAULT false,
  rework_reason TEXT,
  original_job_id UUID,  -- References production_jobs(id) - self reference added after table exists
  rework_count INTEGER DEFAULT 0,
  
  -- Files
  design_file_url TEXT,
  production_notes TEXT,
  
  created_by UUID,  -- References user_profiles(id) if exists
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PRODUCTION JOB LOGS (บันทึกการทำงาน)
-- =============================================

CREATE TABLE IF NOT EXISTS production_job_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES production_jobs(id) ON DELETE CASCADE,
  
  action TEXT NOT NULL,                -- 'started', 'produced', 'paused', 'completed', 'qc_passed', 'qc_failed'
  from_status TEXT,
  to_status TEXT,
  
  produced_qty INTEGER,                -- จำนวนที่ทำในรอบนี้
  
  notes TEXT,
  performed_by UUID,  -- References user_profiles(id) if exists
  performed_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- QC CHECKPOINTS (จุดตรวจคุณภาพ)
-- =============================================

CREATE TABLE IF NOT EXISTS qc_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES production_jobs(id) ON DELETE CASCADE,
  
  checkpoint_name TEXT NOT NULL,       -- 'color_check', 'alignment', 'size_accuracy'
  checkpoint_order INTEGER DEFAULT 0,
  
  passed BOOLEAN,
  notes TEXT,
  photo_urls TEXT[] DEFAULT '{}',
  
  checked_by UUID,  -- References user_profiles(id) if exists
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- QC TEMPLATES (เทมเพลตการตรวจ QC)
-- =============================================

CREATE TABLE IF NOT EXISTS qc_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_type_code TEXT NOT NULL,        -- 'DTG', 'EMBROIDERY'
  checkpoint_name TEXT NOT NULL,
  checkpoint_name_th TEXT,
  description TEXT,
  is_required BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- OUTSOURCE JOBS (งานจ้างภายนอก)
-- =============================================

CREATE TABLE IF NOT EXISTS outsource_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link
  production_job_id UUID REFERENCES production_jobs(id),
  order_id UUID,  -- Will reference orders(id) if orders table exists
  order_work_item_id UUID,  -- Will reference order_work_items(id) if exists
  
  -- Supplier
  supplier_id UUID,  -- Will reference suppliers(id) if exists
  supplier_name TEXT,                  -- Snapshot
  supplier_contact TEXT,
  
  -- Job Info
  work_type_code TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2),
  total_price DECIMAL(12,2),
  
  -- Status
  status TEXT DEFAULT 'draft',
  -- draft, sent, confirmed, producing, shipped, received, qc_check, completed, cancelled
  
  -- PO Info
  po_number TEXT,
  po_file_url TEXT,
  po_sent_at TIMESTAMPTZ,
  po_confirmed_at TIMESTAMPTZ,
  
  -- Delivery
  expected_delivery DATE,
  actual_delivery DATE,
  tracking_number TEXT,
  
  -- Receiving
  received_qty INTEGER,
  received_by UUID,  -- References user_profiles(id) if exists
  received_at TIMESTAMPTZ,
  
  -- QC
  qc_status TEXT,
  qc_passed_qty INTEGER,
  qc_failed_qty INTEGER,
  qc_notes TEXT,
  
  -- Files
  design_file_url TEXT,
  
  notes TEXT,
  created_by UUID,  -- References user_profiles(id) if exists
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- OUTSOURCE LOGS
-- =============================================

CREATE TABLE IF NOT EXISTS outsource_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outsource_job_id UUID REFERENCES outsource_jobs(id) ON DELETE CASCADE,
  
  action TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  notes TEXT,
  
  performed_by UUID,  -- References user_profiles(id) if exists
  performed_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Generate Job Number
CREATE OR REPLACE FUNCTION generate_job_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
  new_number TEXT;
BEGIN
  year_part := to_char(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(job_number FROM 9) AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM production_jobs
  WHERE job_number LIKE 'PJ-' || year_part || '-%';
  
  new_number := 'PJ-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Auto-create production jobs when order work item created
-- NOTE: This trigger will only work after orders-schema.sql is run
CREATE OR REPLACE FUNCTION create_production_job_from_work_item()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO production_jobs (
    job_number,
    order_id,
    order_work_item_id,
    work_type_code,
    work_type_name,
    ordered_qty,
    due_date,
    created_by
  ) VALUES (
    generate_job_number(),
    NEW.order_id,
    NEW.id,
    NEW.work_type_code,
    NEW.work_type_name,
    NEW.quantity,
    (SELECT due_date FROM orders WHERE id = NEW.order_id),
    (SELECT created_by FROM orders WHERE id = NEW.order_id)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create production jobs
-- Only create trigger if order_work_items table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_work_items') THEN
    DROP TRIGGER IF EXISTS trigger_create_production_job ON order_work_items;
    CREATE TRIGGER trigger_create_production_job
      AFTER INSERT ON order_work_items
      FOR EACH ROW
      EXECUTE FUNCTION create_production_job_from_work_item();
  END IF;
END $$;

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_production_jobs_order_id ON production_jobs(order_id);
CREATE INDEX IF NOT EXISTS idx_production_jobs_status ON production_jobs(status);
CREATE INDEX IF NOT EXISTS idx_production_jobs_station_id ON production_jobs(station_id);
CREATE INDEX IF NOT EXISTS idx_production_jobs_assigned_to ON production_jobs(assigned_to);
CREATE INDEX IF NOT EXISTS idx_production_jobs_due_date ON production_jobs(due_date);
CREATE INDEX IF NOT EXISTS idx_production_job_logs_job_id ON production_job_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_outsource_jobs_order_id ON outsource_jobs(order_id);
CREATE INDEX IF NOT EXISTS idx_outsource_jobs_supplier_id ON outsource_jobs(supplier_id);

-- =============================================
-- RLS POLICIES
-- =============================================

ALTER TABLE production_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_job_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE qc_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE qc_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE outsource_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE outsource_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can manage production_stations" ON production_stations;
DROP POLICY IF EXISTS "Authenticated users can manage production_jobs" ON production_jobs;
DROP POLICY IF EXISTS "Authenticated users can manage production_job_logs" ON production_job_logs;
DROP POLICY IF EXISTS "Authenticated users can manage qc_checkpoints" ON qc_checkpoints;
DROP POLICY IF EXISTS "Authenticated users can view qc_templates" ON qc_templates;
DROP POLICY IF EXISTS "Authenticated users can manage outsource_jobs" ON outsource_jobs;
DROP POLICY IF EXISTS "Authenticated users can manage outsource_logs" ON outsource_logs;

-- Create policies
CREATE POLICY "Authenticated users can manage production_stations" ON production_stations
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage production_jobs" ON production_jobs
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage production_job_logs" ON production_job_logs
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage qc_checkpoints" ON qc_checkpoints
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view qc_templates" ON qc_templates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage outsource_jobs" ON outsource_jobs
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage outsource_logs" ON outsource_logs
  FOR ALL USING (auth.role() = 'authenticated');

-- =============================================
-- SEED DATA
-- =============================================

-- Production Stations
INSERT INTO production_stations (code, name, department, work_type_codes, capacity_per_day) VALUES
('DTG-1', 'เครื่อง DTG ตัว 1', 'printing', ARRAY['DTG'], 150),
('DTG-2', 'เครื่อง DTG ตัว 2', 'printing', ARRAY['DTG'], 150),
('DTF-1', 'เครื่อง DTF', 'printing', ARRAY['DTF'], 200),
('SILK-1', 'ซิลค์สกรีน Line 1', 'printing', ARRAY['SILKSCREEN'], 300),
('SILK-2', 'ซิลค์สกรีน Line 2', 'printing', ARRAY['SILKSCREEN'], 300),
('SUB-1', 'ซับลิเมชั่น', 'printing', ARRAY['SUBLIMATION'], 200),
('EMB-1', 'เครื่องปัก 1', 'embroidery', ARRAY['EMBROIDERY', 'EMBROIDERY_BADGE'], 50),
('EMB-2', 'เครื่องปัก 2', 'embroidery', ARRAY['EMBROIDERY', 'EMBROIDERY_BADGE'], 50),
('SEW-1', 'เย็บ Line 1', 'sewing', ARRAY['SEWING'], 80),
('SEW-2', 'เย็บ Line 2', 'sewing', ARRAY['SEWING'], 80),
('CUT-1', 'ตัดผ้า', 'cutting', ARRAY['CUTTING'], 200),
('PACK-1', 'แพ็คกิ้ง', 'packing', ARRAY['PACKAGING'], 500)
ON CONFLICT (code) DO NOTHING;

-- QC Templates
INSERT INTO qc_templates (work_type_code, checkpoint_name, checkpoint_name_th, description, sort_order) VALUES
-- DTG
('DTG', 'color_accuracy', 'ความถูกต้องของสี', 'ตรวจสอบสีตรงตาม Mockup', 1),
('DTG', 'print_alignment', 'ตำแหน่งลาย', 'ลายอยู่ตำแหน่งที่กำหนด', 2),
('DTG', 'print_quality', 'คุณภาพการพิมพ์', 'ลายคมชัด ไม่มีจุดขาว', 3),
('DTG', 'fabric_damage', 'สภาพผ้า', 'ไม่มีรอยเปื้อน รอยยับ', 4),
-- EMBROIDERY
('EMBROIDERY', 'thread_color', 'สีด้าย', 'สีด้ายตรงตามกำหนด', 1),
('EMBROIDERY', 'stitch_quality', 'คุณภาพฝีเข็ม', 'ฝีเข็มสม่ำเสมอ ไม่หลุดลุ่ย', 2),
('EMBROIDERY', 'embroidery_position', 'ตำแหน่งปัก', 'ตำแหน่งตรงตาม Mockup', 3),
('EMBROIDERY', 'backing_clean', 'ความสะอาดด้านหลัง', 'ตัดด้ายเรียบร้อย', 4),
-- SILKSCREEN
('SILKSCREEN', 'ink_coverage', 'ความทึบของหมึก', 'หมึกทึบสม่ำเสมอ', 1),
('SILKSCREEN', 'registration', 'ความตรงของบล็อก', 'สีไม่เยื้อง', 2),
('SILKSCREEN', 'print_cleanliness', 'ความสะอาดลาย', 'ไม่มีหมึกเลอะ', 3)
ON CONFLICT DO NOTHING;

-- =============================================
-- DONE!
-- =============================================
SELECT 'Production Tracking schema created successfully!' as message;

