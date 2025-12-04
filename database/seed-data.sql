-- =============================================
-- SEED DATA - ข้อมูลตัวอย่างสำหรับทดสอบระบบ
-- =============================================
-- Run หลังจาก supabase-schema.sql เรียบร้อยแล้ว
-- =============================================

-- =============================================
-- 1. CUSTOMERS - ลูกค้าตัวอย่าง
-- =============================================

INSERT INTO customers (
  id, code, type, name, company_name, contact_name, 
  phone, mobile, email, line_id, tax_id,
  tier, status, payment_terms, credit_limit,
  default_address, notes,
  created_at, updated_at
) VALUES
-- ลูกค้าบริษัท
(
  gen_random_uuid(), 'CUST-001', 'company', 'บริษัท ABC จำกัด', 'บริษัท ABC จำกัด', 'คุณสมศักดิ์',
  '02-123-4567', '081-234-5678', 'contact@abc.com', 'abc_company', '0123456789012',
  'gold', 'active', '30_70', 500000,
  '{"address": "123 ถนนสุขุมวิท", "district": "คลองเตย", "province": "กรุงเทพฯ", "postal_code": "10110", "name": "คุณสมศักดิ์", "phone": "081-234-5678"}'::jsonb,
  'ลูกค้าประจำ - สั่งเสื้อยูนิฟอร์มพนักงาน',
  NOW(), NOW()
),
-- ลูกค้าร้านค้า
(
  gen_random_uuid(), 'CUST-002', 'retail', 'ร้าน Fashion House', 'ร้าน Fashion House', 'คุณสมหญิง',
  '02-234-5678', '082-345-6789', 'fashion@house.com', 'fashionhouse', NULL,
  'silver', 'active', '50_50', 200000,
  '{"address": "456 ถนนพระราม 4", "district": "ปทุมวัน", "province": "กรุงเทพฯ", "postal_code": "10330", "name": "คุณสมหญิง", "phone": "082-345-6789"}'::jsonb,
  'ขายเสื้อปลีก - สั่งประจำเดือนละครั้ง',
  NOW(), NOW()
),
-- ลูกค้าออนไลน์
(
  gen_random_uuid(), 'CUST-003', 'individual', 'คุณสมชาย ใจดี', NULL, 'คุณสมชาย',
  NULL, '083-456-7890', 'somchai@gmail.com', 'somchai_shop', NULL,
  'bronze', 'active', 'full', 50000,
  '{"address": "789 ซอยรามคำแหง 24", "district": "หัวหมาก", "province": "กรุงเทพฯ", "postal_code": "10240", "name": "คุณสมชาย", "phone": "083-456-7890"}'::jsonb,
  'ขายเสื้อออนไลน์ - LINE/Facebook',
  NOW(), NOW()
),
-- ลูกค้าโรงเรียน
(
  gen_random_uuid(), 'CUST-004', 'company', 'โรงเรียนอนุบาลดาวดี', 'โรงเรียนอนุบาลดาวดี', 'คุณครูมานี',
  '02-345-6789', '084-567-8901', 'info@daowdee.ac.th', 'daowdee_school', '0234567890123',
  'gold', 'active', 'credit_30', 300000,
  '{"address": "321 ถนนเพชรบุรี", "district": "ราชเทวี", "province": "กรุงเทพฯ", "postal_code": "10400", "name": "คุณครูมานี", "phone": "084-567-8901"}'::jsonb,
  'สั่งเสื้อนักเรียนและชุดกีฬา',
  NOW(), NOW()
),
-- ลูกค้าองค์กร
(
  gen_random_uuid(), 'CUST-005', 'company', 'บริษัท Tech Startup จำกัด', 'บริษัท Tech Startup จำกัด', 'คุณนวัตกรรม',
  '02-456-7890', '085-678-9012', 'hr@techstartup.com', 'techstartup', '0345678901234',
  'platinum', 'active', '50_50', 1000000,
  '{"address": "999 อาคารไอที ทาวเวอร์", "district": "สาทร", "province": "กรุงเทพฯ", "postal_code": "10120", "name": "คุณนวัตกรรม", "phone": "085-678-9012"}'::jsonb,
  'สั่งเสื้อ Event และของที่ระลึก',
  NOW(), NOW()
)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- 2. PRODUCTS - สินค้าตัวอย่าง (เสื้อเปล่า)
-- =============================================

INSERT INTO products (
  id, code, name, name_th, category, type,
  brand, model, description,
  base_price, sale_price, cost_price,
  colors, sizes, min_qty,
  is_active, in_stock, stock_qty,
  created_at, updated_at
) VALUES
-- เสื้อยืดคอกลม Cotton 100%
(
  gen_random_uuid(), 'SHIRT-001', 'Cotton Round Neck T-Shirt', 'เสื้อยืดคอกลม Cotton 100%', 'tshirt', 'blank',
  'Comfort', 'CR-001', 'เสื้อยืดคอกลม Cotton 100% เนื้อนุ่ม ใส่สบาย เหมาะสำหรับพิมพ์ลาย',
  120, 150, 80,
  ARRAY['white', 'black', 'navy', 'gray', 'red']::text[],
  ARRAY['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL']::text[],
  10,
  true, true, 500,
  NOW(), NOW()
),
-- เสื้อยืดคอกลม Polyester
(
  gen_random_uuid(), 'SHIRT-002', 'Polyester Round Neck T-Shirt', 'เสื้อยืดคอกลม Polyester', 'tshirt', 'blank',
  'Sport Pro', 'PR-001', 'เสื้อยืด Polyester ระบายอากาศดี เหมาะสำหรับกีฬา',
  100, 130, 65,
  ARRAY['white', 'black', 'navy', 'red', 'blue', 'green']::text[],
  ARRAY['S', 'M', 'L', 'XL', '2XL', '3XL']::text[],
  10,
  true, true, 800,
  NOW(), NOW()
),
-- เสื้อโปโล Cotton
(
  gen_random_uuid(), 'POLO-001', 'Cotton Polo Shirt', 'เสื้อโปโล Cotton', 'polo', 'blank',
  'Classic', 'PL-001', 'เสื้อโปโล Cotton คอปก เรียบหรู เหมาะสำหรับยูนิฟอร์ม',
  200, 250, 140,
  ARRAY['white', 'black', 'navy', 'red', 'yellow']::text[],
  ARRAY['S', 'M', 'L', 'XL', '2XL', '3XL']::text[],
  5,
  true, true, 300,
  NOW(), NOW()
),
-- เสื้อโปโล Polyester
(
  gen_random_uuid(), 'POLO-002', 'Polyester Polo Shirt', 'เสื้อโปโล Polyester', 'polo', 'blank',
  'Sport Pro', 'PP-001', 'เสื้อโปโล Polyester ระบายอากาศดี เหมาะสำหรับทีมกีฬา',
  180, 220, 120,
  ARRAY['white', 'black', 'navy', 'red', 'blue', 'orange']::text[],
  ARRAY['S', 'M', 'L', 'XL', '2XL', '3XL']::text[],
  5,
  true, true, 400,
  NOW(), NOW()
),
-- เสื้อกีฬา Dry-Fit
(
  gen_random_uuid(), 'SPORT-001', 'Dry-Fit Sports T-Shirt', 'เสื้อกีฬา Dry-Fit', 'sport', 'blank',
  'Sport Pro', 'DF-001', 'เสื้อกีฬา Dry-Fit ซับเหงื่อเร็ว เหมาะสำหรับออกกำลังกาย',
  150, 180, 100,
  ARRAY['white', 'black', 'navy', 'red', 'blue', 'green', 'yellow', 'orange']::text[],
  ARRAY['S', 'M', 'L', 'XL', '2XL', '3XL']::text[],
  10,
  true, true, 600,
  NOW(), NOW()
),
-- เสื้อฮู้ด Cotton
(
  gen_random_uuid(), 'HOOD-001', 'Cotton Hoodie', 'เสื้อฮู้ด Cotton', 'hoodie', 'blank',
  'Urban', 'HD-001', 'เสื้อฮู้ด Cotton มีหมวก เนื้อหนา อุ่นสบาย',
  450, 550, 320,
  ARRAY['black', 'gray', 'navy', 'maroon']::text[],
  ARRAY['S', 'M', 'L', 'XL', '2XL']::text[],
  3,
  true, true, 150,
  NOW(), NOW()
),
-- เสื้อแจ็คเก็ต
(
  gen_random_uuid(), 'JACKET-001', 'Windbreaker Jacket', 'เสื้อแจ็คเก็ตกันลม', 'jacket', 'blank',
  'Outdoor', 'JK-001', 'เสื้อแจ็คเก็ตกันลม น้ำหนักเบา พับเก็บง่าย',
  380, 450, 270,
  ARRAY['black', 'navy', 'red', 'blue']::text[],
  ARRAY['M', 'L', 'XL', '2XL']::text[],
  3,
  true, true, 100,
  NOW(), NOW()
),
-- เสื้อเด็ก
(
  gen_random_uuid(), 'SHIRT-KIDS-001', 'Kids Cotton T-Shirt', 'เสื้อยืดเด็ก Cotton', 'tshirt', 'blank',
  'Kiddo', 'KD-001', 'เสื้อยืดเด็ก Cotton นุ่ม ใส่สบาย ปลอดภัย',
  90, 120, 60,
  ARRAY['white', 'pink', 'blue', 'yellow', 'green']::text[],
  ARRAY['4', '6', '8', '10', '12', '14']::text[],
  10,
  true, true, 400,
  NOW(), NOW()
)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- 3. SUPPLIERS - ซัพพลายเออร์ตัวอย่าง
-- =============================================

INSERT INTO suppliers (
  id, code, name, name_th, 
  contact_name, contact_phone, contact_email, contact_line,
  address, status, service_types,
  payment_terms, credit_limit,
  lead_time_days, min_order_amount,
  rating, notes,
  created_at, updated_at
) VALUES
-- โรงงานเย็บผ้า
(
  gen_random_uuid(), 'SUP-001', 'Golden Thread Garment', 'โรงงานเย็บผ้าด้ายทอง',
  'คุณสมบัติ', '02-111-2222', 'sales@goldenthread.com', 'goldenthread',
  '{"address": "55 ซอยประชาอุทิศ 90", "district": "ทุ่งครุ", "province": "กรุงเทพฯ", "postal_code": "10140"}'::jsonb,
  'active', ARRAY['sewing', 'cutting', 'pattern_making']::text[],
  'credit_30', 200000,
  7, 5000,
  4.5, 'โรงงานเย็บคุณภาพดี ส่งตรงเวลา',
  NOW(), NOW()
),
-- ร้านจำหน่ายผ้า
(
  gen_random_uuid(), 'SUP-002', 'Premium Fabric Supply', 'ร้านผ้าพรีเมียม',
  'คุณวัสดุ', '02-222-3333', 'contact@premiumfabric.com', 'premiumfabric',
  '{"address": "888 ตลาดโบ๊เบ๊", "district": "สัมพันธวงศ์", "province": "กรุงเทพฯ", "postal_code": "10100"}'::jsonb,
  'active', ARRAY['fabric', 'material']::text[],
  'credit_15', 150000,
  3, 3000,
  4.8, 'ผ้าคุณภาพดี หลากหลาย มีสต็อกเยอะ',
  NOW(), NOW()
),
-- โรงงานปัก
(
  gen_random_uuid(), 'SUP-003', 'Expert Embroidery', 'โรงงานปักเอ็กซ์เพิร์ท',
  'คุณฝีมือ', '02-333-4444', 'info@expertembroidery.com', 'expertembroidery',
  '{"address": "77 ซอยลาดพร้าว 101", "district": "คลองจั่น", "province": "กรุงเทพฯ", "postal_code": "10240"}'::jsonb,
  'active', ARRAY['embroidery', 'embroidery_patch']::text[],
  'credit_30', 100000,
  10, 2000,
  4.7, 'ปักสวย ละเอียด รับงานใหญ่ได้',
  NOW(), NOW()
),
-- ร้านพิมพ์สกรีน
(
  gen_random_uuid(), 'SUP-004', 'Color Master Screen Print', 'ร้านพิมพ์สกรีนคัลเลอร์มาสเตอร์',
  'คุณสีสัน', '02-444-5555', 'sales@colormaster.com', 'colormaster',
  '{"address": "123 ถนนพระราม 2", "district": "บางบอน", "province": "กรุงเทพฯ", "postal_code": "10150"}'::jsonb,
  'active', ARRAY['screen_printing', 'vinyl']::text[],
  'credit_15', 80000,
  5, 1000,
  4.6, 'พิมพ์สกรีนสีสวย คมชัด',
  NOW(), NOW()
),
-- ร้านจำหน่ายป้าย/Tag
(
  gen_random_uuid(), 'SUP-005', 'Label World', 'เลเบิลเวิลด์',
  'คุณป้าย', '02-555-6666', 'contact@labelworld.com', 'labelworld',
  '{"address": "456 ถนนบางนา-ตราด", "district": "บางนา", "province": "กรุงเทพฯ", "postal_code": "10260"}'::jsonb,
  'active', ARRAY['labeling', 'tagging', 'packaging']::text[],
  'credit_7', 50000,
  7, 500,
  4.3, 'ป้าย Tag หลากหลาย ราคาดี',
  NOW(), NOW()
),
-- ร้านถุงพลาสติก/บรรจุภัณฑ์
(
  gen_random_uuid(), 'SUP-006', 'Pack Pro Supply', 'แพ็คโปรซัพพลาย',
  'คุณห่อ', '02-666-7777', 'info@packpro.com', 'packpro',
  '{"address": "789 ถนนศรีนครินทร์", "district": "ประเวศ", "province": "กรุงเทพฯ", "postal_code": "10250"}'::jsonb,
  'active', ARRAY['packaging', 'folding']::text[],
  'credit_15', 60000,
  3, 1000,
  4.4, 'ถุงบรรจุภัณฑ์ครบวงจร',
  NOW(), NOW()
),
-- บริษัทขนส่ง
(
  gen_random_uuid(), 'SUP-007', 'Fast Delivery Express', 'บริษัทขนส่งด่วน',
  'คุณส่ง', '02-777-8888', 'support@fastexpress.com', 'fastexpress',
  '{"address": "999 ถนนลาดกระบัง", "district": "ลาดกระบัง", "province": "กรุงเทพฯ", "postal_code": "10520"}'::jsonb,
  'active', ARRAY['shipping']::text[],
  'credit_7', 100000,
  1, 0,
  4.5, 'ส่งไว ราคาดี มีติดตามพัสดุ',
  NOW(), NOW()
)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- สรุป Seed Data
-- =============================================
-- ✅ Customers: 5 รายการ (บริษัท, ร้านค้า, ออนไลน์, โรงเรียน, องค์กร)
-- ✅ Products: 8 รายการ (เสื้อยืด, โปโล, กีฬา, ฮู้ด, แจ็คเก็ต, เด็ก)
-- ✅ Suppliers: 7 รายการ (เย็บผ้า, ผ้า, ปัก, พิมพ์, ป้าย, บรรจุ, ขนส่ง)
-- =============================================

