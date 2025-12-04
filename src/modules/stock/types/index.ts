// =============================================
// STOCK MODULE TYPES
// =============================================
// Updated to match new Products schema (ERP-compatible)
// =============================================

// Product types - สินค้าเสื้อเปล่า (NEW SCHEMA)
export interface Product {
  id: string;
  code: string;              // Unique product code
  name: string;              // Product name
  name_th: string | null;    // Thai name
  category: string | null;   // Category (shirts, fabric, etc)
  type: string | null;       // blank, custom, etc.
  brand: string | null;      // Brand name
  model: string | null;      // Model (Gildan, Hiptrack, etc)
  description: string | null;
  base_price: number;        // Base price
  sale_price: number;        // Sale price
  cost_price: number;        // Cost price
  colors: string[];          // Available colors array
  sizes: string[];           // Available sizes array
  min_qty: number;           // Minimum order quantity
  is_active: boolean;        // Active status
  in_stock: boolean;         // In stock status
  stock_qty: number;         // Current stock quantity
  image_url: string | null;  // Product image
  created_at: string;
  updated_at: string;
}

// Product Snapshot - สำหรับเก็บใน Order
export interface ProductSnapshot {
  code: string;
  name: string;
  model: string | null;
  color: string;
  size: string;
}

// Form data for creating/editing products
export interface ProductFormData {
  code: string;
  name: string;
  name_th?: string;
  category?: string;
  type?: string;
  brand?: string;
  model?: string;
  description?: string;
  base_price: number;
  sale_price: number;
  cost_price: number;
  colors: string[];
  sizes: string[];
  min_qty?: number;
  stock_qty?: number;
  image_url?: string;
}

// Transaction types
export interface Transaction {
  id: string;
  product_id: string;
  user_id: string | null;
  type: 'IN' | 'OUT' | 'ADJUST';
  quantity: number;
  reason_category: string | null;
  reason: string | null;
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

export const FACTORY_DEFECT_REASONS = [
  'เปื้อน (รอยปากกา, คราบสกปรก)',
  'เสื้อขาด/เป็นรู',
  'เย็บผิดทรง/ตะเข็บเบี้ยว',
  'สีผ้าไม่สม่ำเสมอ',
];

export const HUMAN_ERROR_REASONS = [
  'สกรีนผิดลาย',
  'สกรีนผิดสี',
  'สกรีนผิดตำแหน่ง',
  'สกรีนผิดขนาด (เล็ก/ใหญ่ไป)',
  'สกรีนผิดไซส์เสื้อ',
];

export const TECHNICAL_ERROR_REASONS = [
  'ไฟล์ภาพไม่คมชัด (แตก, เบลอ, ฟู)',
  'สีเพี้ยน (ไม่ตรงต้นฉบับ)',
  'หมึกไม่สม่ำเสมอ',
  'หมึกติดเสื้อ',
];

export const NORMAL_OUT_REASONS = [
  'ส่งงานลูกค้า',
  'ตัวอย่าง/ทดสอบ',
  'คืนสินค้า',
  'อื่นๆ',
];

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

// Product models
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

export const SHIRT_COLORS = [
  { value: 'ขาว', label: 'ขาว', hex: '#FFFFFF' },
  { value: 'ดำ', label: 'ดำ', hex: '#000000' },
  { value: 'กรม', label: 'กรม', hex: '#000080' },
  { value: 'เทา', label: 'เทา', hex: '#808080' },
  { value: 'แดง', label: 'แดง', hex: '#FF0000' },
  { value: 'น้ำเงิน', label: 'น้ำเงิน', hex: '#0000FF' },
  { value: 'เขียว', label: 'เขียว', hex: '#008000' },
  { value: 'เหลือง', label: 'เหลือง', hex: '#FFFF00' },
  { value: 'ชมพู', label: 'ชมพู', hex: '#FFC0CB' },
  { value: 'ม่วง', label: 'ม่วง', hex: '#800080' },
  { value: 'ส้ม', label: 'ส้ม', hex: '#FFA500' },
  { value: 'ครีม', label: 'ครีม', hex: '#FFFDD0' },
  { value: 'อื่นๆ', label: 'อื่นๆ', hex: '#CCCCCC' },
];

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

export const TRANSACTION_TYPES = [
  { value: 'IN', label: 'รับเข้า (Stock In)' },
  { value: 'OUT', label: 'เบิกออก (Stock Out)' },
  { value: 'ADJUST', label: 'ปรับปรุง (Adjust)' },
];
