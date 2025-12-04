-- =============================================
-- PRODUCTION TRACKING MIGRATION
-- =============================================
-- ใช้กับ Database ที่มี production_jobs อยู่แล้ว
-- =============================================

-- =============================================
-- 1. เพิ่ม columns ที่ขาดใน production_jobs
-- =============================================

ALTER TABLE production_jobs ADD COLUMN IF NOT EXISTS order_id UUID;
ALTER TABLE production_jobs ADD COLUMN IF NOT EXISTS order_work_item_id UUID;
ALTER TABLE production_jobs ADD COLUMN IF NOT EXISTS work_type_code TEXT;
ALTER TABLE production_jobs ADD COLUMN IF NOT EXISTS work_type_name TEXT;
ALTER TABLE production_jobs ADD COLUMN IF NOT EXISTS ordered_qty INTEGER DEFAULT 1;
ALTER TABLE production_jobs ADD COLUMN IF NOT EXISTS produced_qty INTEGER DEFAULT 0;
ALTER TABLE production_jobs ADD COLUMN IF NOT EXISTS passed_qty INTEGER DEFAULT 0;
ALTER TABLE production_jobs ADD COLUMN IF NOT EXISTS failed_qty INTEGER DEFAULT 0;
ALTER TABLE production_jobs ADD COLUMN IF NOT EXISTS station_id UUID;
ALTER TABLE production_jobs ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;
ALTER TABLE production_jobs ADD COLUMN IF NOT EXISTS estimated_hours DECIMAL(5,2);
ALTER TABLE production_jobs ADD COLUMN IF NOT EXISTS actual_hours DECIMAL(5,2);
ALTER TABLE production_jobs ADD COLUMN IF NOT EXISTS qc_status TEXT;
ALTER TABLE production_jobs ADD COLUMN IF NOT EXISTS qc_notes TEXT;
ALTER TABLE production_jobs ADD COLUMN IF NOT EXISTS qc_by UUID;
ALTER TABLE production_jobs ADD COLUMN IF NOT EXISTS qc_at TIMESTAMPTZ;
ALTER TABLE production_jobs ADD COLUMN IF NOT EXISTS is_rework BOOLEAN DEFAULT false;
ALTER TABLE production_jobs ADD COLUMN IF NOT EXISTS rework_reason TEXT;
ALTER TABLE production_jobs ADD COLUMN IF NOT EXISTS original_job_id UUID;
ALTER TABLE production_jobs ADD COLUMN IF NOT EXISTS rework_count INTEGER DEFAULT 0;
ALTER TABLE production_jobs ADD COLUMN IF NOT EXISTS design_file_url TEXT;
ALTER TABLE production_jobs ADD COLUMN IF NOT EXISTS production_notes TEXT;

-- =============================================
-- 2. PRODUCTION STATIONS (สถานี/เครื่องจักร)
-- =============================================

CREATE TABLE IF NOT EXISTS production_stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  work_type_codes TEXT[] DEFAULT '{}',
  capacity_per_day INTEGER DEFAULT 100,
  status TEXT DEFAULT 'active',
  current_job_id UUID,
  assigned_worker_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. PRODUCTION JOB LOGS (บันทึกการทำงาน)
-- =============================================

CREATE TABLE IF NOT EXISTS production_job_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES production_jobs(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  produced_qty INTEGER,
  notes TEXT,
  performed_by UUID,
  performed_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 4. QC CHECKPOINTS (จุดตรวจคุณภาพ)
-- =============================================

CREATE TABLE IF NOT EXISTS qc_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES production_jobs(id) ON DELETE CASCADE,
  checkpoint_name TEXT NOT NULL,
  checkpoint_order INTEGER DEFAULT 0,
  passed BOOLEAN,
  notes TEXT,
  photo_urls TEXT[] DEFAULT '{}',
  checked_by UUID,
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 5. QC TEMPLATES (เทมเพลตการตรวจ QC)
-- =============================================

CREATE TABLE IF NOT EXISTS qc_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_type_code TEXT NOT NULL,
  checkpoint_name TEXT NOT NULL,
  checkpoint_name_th TEXT,
  description TEXT,
  is_required BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 6. OUTSOURCE JOBS (งานจ้างภายนอก)
-- =============================================

CREATE TABLE IF NOT EXISTS outsource_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_job_id UUID REFERENCES production_jobs(id),
  order_id UUID,
  order_work_item_id UUID,
  supplier_id UUID,
  supplier_name TEXT,
  supplier_contact TEXT,
  work_type_code TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2),
  total_price DECIMAL(12,2),
  status TEXT DEFAULT 'draft',
  po_number TEXT,
  po_file_url TEXT,
  po_sent_at TIMESTAMPTZ,
  po_confirmed_at TIMESTAMPTZ,
  expected_delivery DATE,
  actual_delivery DATE,
  tracking_number TEXT,
  received_qty INTEGER,
  received_by UUID,
  received_at TIMESTAMPTZ,
  qc_status TEXT,
  qc_passed_qty INTEGER,
  qc_failed_qty INTEGER,
  qc_notes TEXT,
  design_file_url TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 7. OUTSOURCE LOGS
-- =============================================

CREATE TABLE IF NOT EXISTS outsource_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outsource_job_id UUID REFERENCES outsource_jobs(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  notes TEXT,
  performed_by UUID,
  performed_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 8. INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_production_jobs_order_id ON production_jobs(order_id);
CREATE INDEX IF NOT EXISTS idx_production_jobs_station_id ON production_jobs(station_id);
CREATE INDEX IF NOT EXISTS idx_production_job_logs_job_id ON production_job_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_outsource_jobs_order_id ON outsource_jobs(order_id);
CREATE INDEX IF NOT EXISTS idx_outsource_jobs_supplier_id ON outsource_jobs(supplier_id);

-- =============================================
-- 9. RLS POLICIES
-- =============================================

ALTER TABLE production_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_job_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE qc_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE qc_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE outsource_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE outsource_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage production_stations" ON production_stations;
DROP POLICY IF EXISTS "Authenticated users can manage production_job_logs" ON production_job_logs;
DROP POLICY IF EXISTS "Authenticated users can manage qc_checkpoints" ON qc_checkpoints;
DROP POLICY IF EXISTS "Authenticated users can view qc_templates" ON qc_templates;
DROP POLICY IF EXISTS "Authenticated users can manage outsource_jobs" ON outsource_jobs;
DROP POLICY IF EXISTS "Authenticated users can manage outsource_logs" ON outsource_logs;

CREATE POLICY "Authenticated users can manage production_stations" ON production_stations
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
-- 10. SEED DATA - Production Stations
-- =============================================

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

-- =============================================
-- 11. SEED DATA - QC Templates
-- =============================================

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
SELECT 'Production Migration completed successfully!' as message;



