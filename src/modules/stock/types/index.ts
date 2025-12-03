// Product types - สินค้าเสื้อเปล่า
export interface Product {
  id: string;
  main_sku: string;      // SKU หลัก (รหัสสินค้าหลัก)
  sku: string;           // SKU รอง (รหัสเฉพาะ variant)
  model: string;         // รุ่นเสื้อ (เช่น Hiptrack, Gildan)
  color: string;         // สี (ชื่อสี)
  color_hex: string;     // สี (Hex code สำหรับแสดงผล)
  size: string;          // ไซส์
  cost: number;          // ต้นทุนต่อหน่วย
  price: number;         // ราคาขายต่อหน่วย
  quantity: number;      // จำนวนคงเหลือ
  min_level: number;     // จุดสั่งซื้อ (Reorder Point)
  is_active: boolean;    // ⭐ สถานะใช้งาน
  deleted_at: string | null; // ⭐ Soft delete timestamp
  created_at: string;
  updated_at: string;
}

// Product Snapshot - สำหรับเก็บใน Order (ไม่เปลี่ยนแปลงตามข้อมูลปัจจุบัน)
export interface ProductSnapshot {
  sku: string;
  main_sku: string;
  model: string;
  color: string;
  size: string;
  name: string;       // ชื่อเต็ม: "Gildan 76000 White M"
}

export interface ProductFormData {
  main_sku: string;
  sku: string;
  model: string;
  color: string;
  color_hex?: string;
  size: string;
  cost: number;
  price: number;
  quantity?: number;
  min_level?: number;
}

// Transaction types
export interface Transaction {
  id: string;
  product_id: string;
  user_id: string;
  type: 'IN' | 'OUT' | 'ADJUST';
  quantity: number;
  reason_category: string | null;  // หมวดหมู่สาเหตุ
  reason: string | null;           // สาเหตุการเบิก
  note: string | null;
  ref_order_id: string | null;
  created_at: string;
  // Joined data
  product?: Product;
}

export interface TransactionFormData {
  product_id: string;
  type: 'IN' | 'OUT' | 'ADJUST';
  quantity: number;
  reason_category?: string;
  reason?: string;
  note?: string;
  ref_order_id?: string;
}

// ===== สาเหตุการเบิกสินค้า =====

// สาเหตุจากโรงงานเสื้อเปล่า
export const FACTORY_DEFECT_REASONS = [
  'เปื้อน (รอยปากกา, คราบสกปรก)',
  'เสื้อขาด/เป็นรู',
  'เย็บผิดทรง/ตะเข็บเบี้ยว',
  'สีผ้าไม่สม่ำเสมอ',
];

// สาเหตุจากข้อผิดพลาดบุคคล
export const HUMAN_ERROR_REASONS = [
  'สกรีนผิดลาย',
  'สกรีนผิดสี',
  'สกรีนผิดตำแหน่ง',
  'สกรีนผิดขนาด (เล็ก/ใหญ่ไป)',
  'สกรีนผิดไซส์เสื้อ',
];

// สาเหตุจากข้อผิดพลาดเทคนิค
export const TECHNICAL_ERROR_REASONS = [
  'ไฟล์ภาพไม่คมชัด (แตก, เบลอ, ฟู)',
  'สีเพี้ยน (ไม่ตรงต้นฉบับ)',
  'หมึกไม่สม่ำเสมอ',
  'หมึกติดเสื้อ',
];

// สาเหตุการเบิกปกติ
export const NORMAL_OUT_REASONS = [
  'ส่งงานลูกค้า',
  'ตัวอย่าง/ทดสอบ',
  'คืนสินค้า',
  'อื่นๆ',
];

// รวมทุกหมวดหมู่
export const WITHDRAWAL_REASON_CATEGORIES = [
  { 
    id: 'normal',
    label: '📦 เบิกปกติ', 
    reasons: NORMAL_OUT_REASONS,
    color: 'bg-sky-50 border-sky-200 text-sky-700'
  },
  { 
    id: 'factory',
    label: '🏭 โรงงานเสื้อเปล่า', 
    reasons: FACTORY_DEFECT_REASONS,
    color: 'bg-orange-50 border-orange-200 text-orange-700'
  },
  { 
    id: 'human',
    label: '👤 ข้อผิดพลาดบุคคล', 
    reasons: HUMAN_ERROR_REASONS,
    color: 'bg-red-50 border-red-200 text-red-700'
  },
  { 
    id: 'technical',
    label: '⚙️ ข้อผิดพลาดเทคนิค', 
    reasons: TECHNICAL_ERROR_REASONS,
    color: 'bg-purple-50 border-purple-200 text-purple-700'
  },
];

// Filter types
export interface ProductFilters {
  search: string;
  model: string;
  color: string;
  size: string;
  stockStatus: 'all' | 'low' | 'normal';
}

// รุ่นเสื้อ
export const SHIRT_MODELS = [
  { value: 'Hiptrack', label: 'Hiptrack' },
  { value: 'Gildan', label: 'Gildan' },
  { value: 'JEEP', label: 'JEEP' },
  { value: 'Cotton 100%', label: 'Cotton 100%' },
  { value: 'TC', label: 'TC' },
  { value: 'CVC', label: 'CVC' },
  { value: 'Polo', label: 'Polo' },
  { value: 'อื่นๆ', label: 'อื่นๆ' },
];

// สีเสื้อ
export const SHIRT_COLORS = [
  { value: 'ขาว', label: 'ขาว' },
  { value: 'ดำ', label: 'ดำ' },
  { value: 'กรม', label: 'กรม' },
  { value: 'เทา', label: 'เทา' },
  { value: 'แดง', label: 'แดง' },
  { value: 'น้ำเงิน', label: 'น้ำเงิน' },
  { value: 'เขียว', label: 'เขียว' },
  { value: 'เหลือง', label: 'เหลือง' },
  { value: 'ชมพู', label: 'ชมพู' },
  { value: 'ม่วง', label: 'ม่วง' },
  { value: 'ส้ม', label: 'ส้ม' },
  { value: 'ครีม', label: 'ครีม' },
  { value: 'อื่นๆ', label: 'อื่นๆ' },
];

// ไซส์เสื้อ
export const SHIRT_SIZES = [
  { value: 'XS', label: 'XS' },
  { value: 'S', label: 'S' },
  { value: 'M', label: 'M' },
  { value: 'L', label: 'L' },
  { value: 'XL', label: 'XL' },
  { value: '2XL', label: '2XL' },
  { value: '3XL', label: '3XL' },
  { value: '4XL', label: '4XL' },
  { value: '5XL', label: '5XL' },
];

// Transaction types
export const TRANSACTION_TYPES = [
  { value: 'IN', label: 'รับเข้า (Stock In)' },
  { value: 'OUT', label: 'เบิกออก (Stock Out)' },
  { value: 'ADJUST', label: 'ปรับปรุง (Adjust)' },
];
