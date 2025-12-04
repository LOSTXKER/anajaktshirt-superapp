// =============================================
// MOCK DATA
// =============================================
// Sample data for development without database
// =============================================

import type { Order, OrderWorkItem, OrderPayment, WorkType } from '../types/orders';
import type { ProductionJob, ProductionStation } from '../types/production';
import type { Supplier, PurchaseOrder } from '../types/suppliers';
import type { ChangeRequest, ChangeRequestLog, ChangeRequestStats } from '../types/change-requests';
import type { AddonType } from '../types/addons';
import type { Customer, Product, PrintPosition, PrintSize, OrderType, PriorityLevel } from '../types/config';

// ---------------------------------------------
// Customers
// ---------------------------------------------

export const mockCustomers: Customer[] = [
  {
    id: 'cust-001',
    code: 'CUST-001',
    type: 'company',
    name: 'บริษัท ABC จำกัด',
    company_name: 'บริษัท ABC จำกัด',
    contact_name: 'คุณสมศักดิ์',
    phone: '02-123-4567',
    mobile: '081-234-5678',
    email: 'contact@abc.com',
    line_id: 'abc_company',
    tax_id: '0123456789012',
    tier: 'gold',
    credit_days: 30,
    credit_limit: 100000,
    default_address: {
      name: 'คุณสมศักดิ์',
      phone: '081-234-5678',
      address: '123 ถนนสุขุมวิท',
      district: 'วัฒนา',
      province: 'กรุงเทพมหานคร',
      postal_code: '10110',
    },
    total_orders: 25,
    total_spent: 450000,
    last_order_date: '2024-12-01',
    tags: ['VIP', 'Repeat'],
    notes: 'ลูกค้าประจำ สั่งทุกเดือน',
    is_active: true,
    created_at: '2023-01-15T00:00:00Z',
  },
  {
    id: 'cust-002',
    code: 'CUST-002',
    type: 'individual',
    name: 'คุณวิภา ใจดี',
    contact_name: 'คุณวิภา',
    phone: '089-876-5432',
    email: 'wipa@email.com',
    line_id: 'wipa_shop',
    tier: 'silver',
    default_address: {
      name: 'คุณวิภา',
      phone: '089-876-5432',
      address: '456 ถนนรัชดา',
      district: 'ดินแดง',
      province: 'กรุงเทพมหานคร',
      postal_code: '10400',
    },
    total_orders: 8,
    total_spent: 45000,
    last_order_date: '2024-11-28',
    tags: ['Reseller'],
    is_active: true,
    created_at: '2023-06-20T00:00:00Z',
  },
  {
    id: 'cust-003',
    code: 'CUST-003',
    type: 'company',
    name: 'โรงเรียนสาธิต มหาวิทยาลัยเกษตรศาสตร์',
    company_name: 'โรงเรียนสาธิต มหาวิทยาลัยเกษตรศาสตร์',
    contact_name: 'คุณครูประภา',
    phone: '02-987-6543',
    email: 'prapha@satit.ac.th',
    tax_id: '0994000123456',
    tier: 'platinum',
    credit_days: 45,
    default_address: {
      name: 'คุณครูประภา',
      phone: '02-987-6543',
      address: '789 ถนนพหลโยธิน',
      district: 'จตุจักร',
      province: 'กรุงเทพมหานคร',
      postal_code: '10900',
    },
    total_orders: 45,
    total_spent: 890000,
    last_order_date: '2024-12-02',
    tags: ['School', 'Bulk'],
    notes: 'สั่งเยอะทุกปี ช่วงเปิดเทอม',
    is_active: true,
    created_at: '2022-03-10T00:00:00Z',
  },
  {
    id: 'cust-004',
    code: 'CUST-004',
    type: 'individual',
    name: 'คุณสมชาย รักงาน',
    contact_name: 'คุณสมชาย',
    phone: '062-345-6789',
    line_id: 'somchai_work',
    tier: 'bronze',
    default_address: {
      name: 'คุณสมชาย',
      phone: '062-345-6789',
      address: '321 ซอยสุขุมวิท 55',
      district: 'วัฒนา',
      province: 'กรุงเทพมหานคร',
      postal_code: '10110',
    },
    total_orders: 2,
    total_spent: 3500,
    is_active: true,
    created_at: '2024-10-01T00:00:00Z',
  },
  {
    id: 'cust-005',
    code: 'CUST-005',
    type: 'company',
    name: 'บริษัท XYZ Trading',
    company_name: 'บริษัท XYZ Trading จำกัด',
    contact_name: 'คุณมานะ',
    phone: '02-555-1234',
    mobile: '095-111-2222',
    email: 'mana@xyztrading.com',
    tax_id: '0105560012345',
    tier: 'gold',
    credit_days: 30,
    credit_limit: 50000,
    default_address: {
      name: 'บริษัท XYZ Trading',
      phone: '02-555-1234',
      address: '999 อาคารพาณิชย์ ชั้น 5',
      district: 'สาทร',
      province: 'กรุงเทพมหานคร',
      postal_code: '10120',
    },
    total_orders: 15,
    total_spent: 180000,
    last_order_date: '2024-11-15',
    is_active: true,
    created_at: '2023-08-01T00:00:00Z',
  },
];

// ---------------------------------------------
// Products (เสื้อในสต๊อก)
// ---------------------------------------------

export const mockProducts: Product[] = [
  // Cotton Round Neck
  {
    id: 'prod-001',
    sku: 'CRN-WHT-S',
    name: 'เสื้อยืดคอกลม Cotton 100%',
    model: 'Cotton Round Neck',
    color: 'White',
    color_th: 'ขาว',
    size: 'S',
    category: 'tshirt',
    material: 'cotton_100',
    weight_gsm: 180,
    cost: 65,
    price: 89,
    stock_qty: 150,
    reserved_qty: 20,
    available_qty: 130,
    min_stock: 50,
    is_active: true,
    image_url: '/products/crn-white.jpg',
  },
  {
    id: 'prod-002',
    sku: 'CRN-WHT-M',
    name: 'เสื้อยืดคอกลม Cotton 100%',
    model: 'Cotton Round Neck',
    color: 'White',
    color_th: 'ขาว',
    size: 'M',
    category: 'tshirt',
    material: 'cotton_100',
    weight_gsm: 180,
    cost: 65,
    price: 89,
    stock_qty: 200,
    reserved_qty: 35,
    available_qty: 165,
    min_stock: 50,
    is_active: true,
    image_url: '/products/crn-white.jpg',
  },
  {
    id: 'prod-003',
    sku: 'CRN-WHT-L',
    name: 'เสื้อยืดคอกลม Cotton 100%',
    model: 'Cotton Round Neck',
    color: 'White',
    color_th: 'ขาว',
    size: 'L',
    category: 'tshirt',
    material: 'cotton_100',
    weight_gsm: 180,
    cost: 65,
    price: 89,
    stock_qty: 180,
    reserved_qty: 25,
    available_qty: 155,
    min_stock: 50,
    is_active: true,
    image_url: '/products/crn-white.jpg',
  },
  {
    id: 'prod-004',
    sku: 'CRN-WHT-XL',
    name: 'เสื้อยืดคอกลม Cotton 100%',
    model: 'Cotton Round Neck',
    color: 'White',
    color_th: 'ขาว',
    size: 'XL',
    category: 'tshirt',
    material: 'cotton_100',
    weight_gsm: 180,
    cost: 70,
    price: 99,
    stock_qty: 120,
    reserved_qty: 10,
    available_qty: 110,
    min_stock: 30,
    is_active: true,
    image_url: '/products/crn-white.jpg',
  },
  // Black Cotton Round Neck
  {
    id: 'prod-005',
    sku: 'CRN-BLK-M',
    name: 'เสื้อยืดคอกลม Cotton 100%',
    model: 'Cotton Round Neck',
    color: 'Black',
    color_th: 'ดำ',
    size: 'M',
    category: 'tshirt',
    material: 'cotton_100',
    weight_gsm: 180,
    cost: 65,
    price: 89,
    stock_qty: 180,
    reserved_qty: 40,
    available_qty: 140,
    min_stock: 50,
    is_active: true,
    image_url: '/products/crn-black.jpg',
  },
  {
    id: 'prod-006',
    sku: 'CRN-BLK-L',
    name: 'เสื้อยืดคอกลม Cotton 100%',
    model: 'Cotton Round Neck',
    color: 'Black',
    color_th: 'ดำ',
    size: 'L',
    category: 'tshirt',
    material: 'cotton_100',
    weight_gsm: 180,
    cost: 65,
    price: 89,
    stock_qty: 160,
    reserved_qty: 30,
    available_qty: 130,
    min_stock: 50,
    is_active: true,
    image_url: '/products/crn-black.jpg',
  },
  // Polo Shirt
  {
    id: 'prod-007',
    sku: 'POLO-WHT-M',
    name: 'เสื้อโปโล',
    model: 'Polo Classic',
    color: 'White',
    color_th: 'ขาว',
    size: 'M',
    category: 'polo',
    material: 'poly_cotton',
    weight_gsm: 200,
    cost: 120,
    price: 169,
    stock_qty: 80,
    reserved_qty: 10,
    available_qty: 70,
    min_stock: 20,
    is_active: true,
    image_url: '/products/polo-white.jpg',
  },
  {
    id: 'prod-008',
    sku: 'POLO-NAV-L',
    name: 'เสื้อโปโล',
    model: 'Polo Classic',
    color: 'Navy',
    color_th: 'กรมท่า',
    size: 'L',
    category: 'polo',
    material: 'poly_cotton',
    weight_gsm: 200,
    cost: 120,
    price: 169,
    stock_qty: 60,
    reserved_qty: 5,
    available_qty: 55,
    min_stock: 20,
    is_active: true,
    image_url: '/products/polo-navy.jpg',
  },
  // Dri-Fit
  {
    id: 'prod-009',
    sku: 'DRY-WHT-M',
    name: 'เสื้อ Dri-Fit',
    model: 'Dri-Fit Sport',
    color: 'White',
    color_th: 'ขาว',
    size: 'M',
    category: 'sport',
    material: 'polyester',
    weight_gsm: 140,
    cost: 85,
    price: 129,
    stock_qty: 100,
    reserved_qty: 0,
    available_qty: 100,
    min_stock: 30,
    is_active: true,
    image_url: '/products/dryfit-white.jpg',
  },
  {
    id: 'prod-010',
    sku: 'DRY-RED-L',
    name: 'เสื้อ Dri-Fit',
    model: 'Dri-Fit Sport',
    color: 'Red',
    color_th: 'แดง',
    size: 'L',
    category: 'sport',
    material: 'polyester',
    weight_gsm: 140,
    cost: 85,
    price: 129,
    stock_qty: 75,
    reserved_qty: 0,
    available_qty: 75,
    min_stock: 30,
    is_active: true,
    image_url: '/products/dryfit-red.jpg',
  },
];

// ---------------------------------------------
// Print Positions
// ---------------------------------------------

export const mockPrintPositions: PrintPosition[] = [
  { id: 'pos-001', code: 'front_chest_left', name: 'Left Chest', name_th: 'อกซ้าย', sort_order: 1 },
  { id: 'pos-002', code: 'front_chest_right', name: 'Right Chest', name_th: 'อกขวา', sort_order: 2 },
  { id: 'pos-003', code: 'front_chest_center', name: 'Center Chest', name_th: 'อกกลาง', sort_order: 3 },
  { id: 'pos-004', code: 'front_full', name: 'Front Full', name_th: 'หน้าเต็ม', sort_order: 4 },
  { id: 'pos-005', code: 'back_full', name: 'Back Full', name_th: 'หลังเต็ม', sort_order: 5 },
  { id: 'pos-006', code: 'back_upper', name: 'Back Upper', name_th: 'หลังบน', sort_order: 6 },
  { id: 'pos-007', code: 'back_lower', name: 'Back Lower', name_th: 'หลังล่าง', sort_order: 7 },
  { id: 'pos-008', code: 'sleeve_left', name: 'Left Sleeve', name_th: 'แขนซ้าย', sort_order: 8 },
  { id: 'pos-009', code: 'sleeve_right', name: 'Right Sleeve', name_th: 'แขนขวา', sort_order: 9 },
  { id: 'pos-010', code: 'collar', name: 'Collar', name_th: 'คอเสื้อ', sort_order: 10 },
];

// ---------------------------------------------
// Print Sizes
// ---------------------------------------------

export const mockPrintSizes: PrintSize[] = [
  { id: 'size-001', code: 'a6', name: 'A6', name_th: 'A6 (10.5x14.8 ซม.)', width_cm: 10.5, height_cm: 14.8, price_modifier: 0.6, sort_order: 1 },
  { id: 'size-002', code: 'a5', name: 'A5', name_th: 'A5 (14.8x21 ซม.)', width_cm: 14.8, height_cm: 21, price_modifier: 0.8, sort_order: 2 },
  { id: 'size-003', code: 'a4', name: 'A4', name_th: 'A4 (21x29.7 ซม.)', width_cm: 21, height_cm: 29.7, price_modifier: 1.0, sort_order: 3 },
  { id: 'size-004', code: 'a3', name: 'A3', name_th: 'A3 (29.7x42 ซม.)', width_cm: 29.7, height_cm: 42, price_modifier: 1.5, sort_order: 4 },
  { id: 'size-005', code: 'a2', name: 'A2', name_th: 'A2 (42x59.4 ซม.)', width_cm: 42, height_cm: 59.4, price_modifier: 2.5, sort_order: 5 },
  { id: 'size-006', code: 'custom', name: 'Custom', name_th: 'กำหนดเอง', price_modifier: 1.0, sort_order: 99 },
];

// ---------------------------------------------
// Order Types (Production Modes)
// ---------------------------------------------

export const mockOrderTypes: OrderType[] = [
  {
    id: 'ot-001',
    code: 'ready_made',
    name: 'Ready-Made',
    name_th: 'เสื้อสำเร็จรูป + สกรีน',
    description: 'เลือกเสื้อจาก Stock แล้วสกรีน/ปัก',
    description_full: 'เหมาะสำหรับออเดอร์ที่ต้องการใช้เสื้อสำเร็จรูปจากคลัง แล้วเพิ่มงานสกรีน/ปัก ส่งได้เร็ว',
    icon: 'shirt',
    requires_products: true,
    requires_design: true,
    requires_fabric: false,
    requires_pattern: false,
    default_production_mode: 'in_house',
    lead_days_min: 3,
    lead_days_max: 5,
    workflow_steps: [
      'เลือกเสื้อจาก Stock',
      'กำหนดงานสกรีน/ปัก',
      'อนุมัติ Design & Mockup',
      'ผลิต → QC → ส่งมอบ',
    ],
    features: [
      { label: 'เลือกเสื้อจาก Stock', available: true },
      { label: 'สกรีน/ปัก', available: true },
      { label: 'ออกแบบลาย', available: true },
      { label: 'ตัดเย็บ', available: false },
    ],
    sort_order: 1,
  },
  {
    id: 'ot-002',
    code: 'custom_sewing',
    name: 'Custom Sewing',
    name_th: 'ตัดเย็บตามแบบ',
    description: 'ตัดเย็บเสื้อใหม่ + สกรีน/ปัก',
    description_full: 'เหมาะสำหรับออเดอร์ที่ต้องการตัดเย็บเสื้อใหม่ตาม Pattern ที่มีอยู่ + สกรีน/ปัก ใช้เวลามากขึ้น',
    icon: 'scissors',
    requires_products: false,
    requires_design: true,
    requires_fabric: true,
    requires_pattern: true,
    default_production_mode: 'outsource',
    lead_days_min: 7,
    lead_days_max: 14,
    workflow_steps: [
      'เลือก Pattern + ผ้า',
      'สั่งตัดเย็บ (Outsource)',
      'รับเสื้อ → สกรีน/ปัก',
      'QC → ส่งมอบ',
    ],
    features: [
      { label: 'เลือก Pattern', available: true },
      { label: 'เลือกผ้า/สั่งผ้า', available: true },
      { label: 'ตัดเย็บ (Outsource)', available: true },
      { label: 'สกรีน/ปัก', available: true },
    ],
    sort_order: 2,
  },
  {
    id: 'ot-003',
    code: 'full_custom',
    name: 'Full Custom',
    name_th: 'ออกแบบ+ตัดเย็บ+สกรีน',
    description: 'ออกแบบตั้งแต่ Pattern + ตัดเย็บ + สกรีน',
    description_full: 'เหมาะสำหรับออเดอร์ที่ต้องการออกแบบ Pattern ใหม่ทั้งหมด ตัดเย็บ + สกรีน ใช้เวลามากที่สุด',
    icon: 'palette',
    requires_products: false,
    requires_design: true,
    requires_fabric: true,
    requires_pattern: false,
    default_production_mode: 'hybrid',
    lead_days_min: 14,
    lead_days_max: 30,
    workflow_steps: [
      'ออกแบบ Pattern ใหม่',
      'อนุมัติ Pattern',
      'เลือกผ้า + ตัดเย็บ',
      'สกรีน/ปัก → QC → ส่งมอบ',
    ],
    features: [
      { label: 'ออกแบบ Pattern', available: true },
      { label: 'เลือกผ้า/สั่งผ้า', available: true },
      { label: 'ตัดเย็บ (Outsource)', available: true },
      { label: 'สกรีน/ปัก', available: true },
    ],
    sort_order: 3,
  },
  {
    id: 'ot-004',
    code: 'print_only',
    name: 'Print Only',
    name_th: 'รับสกรีนอย่างเดียว',
    description: 'ลูกค้านำเสื้อมาเอง + สกรีน/ปัก',
    description_full: 'เหมาะสำหรับลูกค้าที่มีเสื้ออยู่แล้ว ต้องการให้สกรีน/ปักเพิ่มเติม ส่งได้เร็วที่สุด',
    icon: 'printer',
    requires_products: false,
    requires_design: true,
    requires_fabric: false,
    requires_pattern: false,
    default_production_mode: 'in_house',
    lead_days_min: 1,
    lead_days_max: 3,
    workflow_steps: [
      'รับเสื้อจากลูกค้า',
      'กำหนดงานสกรีน/ปัก',
      'อนุมัติ Design',
      'ผลิต → QC → ส่งมอบ',
    ],
    features: [
      { label: 'ลูกค้านำเสื้อมา', available: true },
      { label: 'สกรีน/ปัก', available: true },
      { label: 'ออกแบบลาย', available: true },
      { label: 'ตัดเย็บ', available: false },
    ],
    sort_order: 4,
  },
];

// ---------------------------------------------
// Priority Levels
// ---------------------------------------------

export const mockPriorityLevels: PriorityLevel[] = [
  {
    id: 'pri-001',
    code: 'normal',
    name: 'Normal',
    name_th: 'ปกติ',
    level: 0,
    surcharge_percent: 0,
    min_lead_days: 7,
    color: '#86868B',
    sort_order: 1,
  },
  {
    id: 'pri-002',
    code: 'rush',
    name: 'Rush',
    name_th: 'เร่ง',
    level: 1,
    surcharge_percent: 20,
    min_lead_days: 5,
    color: '#FF9500',
    sort_order: 2,
  },
  {
    id: 'pri-003',
    code: 'urgent',
    name: 'Urgent',
    name_th: 'ด่วน',
    level: 2,
    surcharge_percent: 50,
    min_lead_days: 3,
    color: '#FF3B30',
    sort_order: 3,
  },
  {
    id: 'pri-004',
    code: 'emergency',
    name: 'Emergency',
    name_th: 'ด่วนมาก',
    level: 3,
    surcharge_percent: 100,
    min_lead_days: 1,
    color: '#AF52DE',
    sort_order: 4,
  },
];

// ---------------------------------------------
// Sales Channels
// ---------------------------------------------

export const mockSalesChannels = [
  { code: 'line', name: 'LINE', name_th: 'LINE', icon: 'message-circle' },
  { code: 'facebook', name: 'Facebook', name_th: 'Facebook', icon: 'facebook' },
  { code: 'instagram', name: 'Instagram', name_th: 'Instagram', icon: 'instagram' },
  { code: 'phone', name: 'Phone', name_th: 'โทรศัพท์', icon: 'phone' },
  { code: 'walk_in', name: 'Walk-in', name_th: 'หน้าร้าน', icon: 'store' },
  { code: 'website', name: 'Website', name_th: 'Website', icon: 'globe' },
  { code: 'referral', name: 'Referral', name_th: 'แนะนำ', icon: 'users' },
];

// ---------------------------------------------
// Work Types
// ---------------------------------------------

export const mockWorkTypes: WorkType[] = [
  // === PRINTING (งานพิมพ์) ===
  {
    id: 'wt-001',
    code: 'dtg',
    name: 'DTG Printing',
    name_th: 'พิมพ์ DTG',
    category_code: 'printing',
    base_price: 35,
    requires_design: true,
    requires_material: false,
    estimated_minutes_per_unit: 2,
    can_outsource: true,
    in_house_capable: false,
    is_active: true,
    sort_order: 1,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'wt-002',
    code: 'dtf',
    name: 'DTF Printing',
    name_th: 'พิมพ์ DTF',
    category_code: 'printing',
    base_price: 25,
    requires_design: true,
    requires_material: false,
    estimated_minutes_per_unit: 1.5,
    can_outsource: true,
    in_house_capable: true, // ทำได้ในโรงงาน
    is_active: true,
    sort_order: 2,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'wt-003',
    code: 'silkscreen',
    name: 'Silkscreen',
    name_th: 'สกรีน Silkscreen',
    category_code: 'printing',
    base_price: 15,
    requires_design: true,
    requires_material: false,
    estimated_minutes_per_unit: 0.5,
    can_outsource: true,
    in_house_capable: false,
    is_active: true,
    sort_order: 3,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'wt-004',
    code: 'sublimation',
    name: 'Sublimation',
    name_th: 'ซับลิเมชั่น',
    category_code: 'printing',
    base_price: 40,
    requires_design: true,
    requires_material: false,
    estimated_minutes_per_unit: 3,
    can_outsource: true,
    in_house_capable: false,
    is_active: true,
    sort_order: 4,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'wt-005',
    code: 'vinyl',
    name: 'Vinyl/Heat Transfer',
    name_th: 'ไวนิล/รีดร้อน',
    category_code: 'printing',
    base_price: 30,
    requires_design: true,
    requires_material: false,
    estimated_minutes_per_unit: 2,
    can_outsource: true,
    in_house_capable: false,
    is_active: true,
    sort_order: 5,
    created_at: '2024-01-01T00:00:00Z',
  },
  
  // === EMBROIDERY (งานปัก) ===
  {
    id: 'wt-010',
    code: 'embroidery',
    name: 'Embroidery',
    name_th: 'ปัก',
    category_code: 'embroidery',
    base_price: 50,
    requires_design: true,
    requires_material: false,
    estimated_minutes_per_unit: 5,
    can_outsource: true,
    in_house_capable: false,
    is_active: true,
    sort_order: 10,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'wt-011',
    code: 'embroidery_badge',
    name: 'Embroidery Badge',
    name_th: 'ปักตัวรีด',
    category_code: 'embroidery',
    base_price: 80,
    requires_design: true,
    requires_material: true,
    estimated_minutes_per_unit: 10,
    can_outsource: true,
    in_house_capable: false,
    is_active: true,
    sort_order: 11,
    created_at: '2024-01-01T00:00:00Z',
  },
  
  // === GARMENT (งานตัดเย็บ) ===
  {
    id: 'wt-020',
    code: 'cutting',
    name: 'Cutting',
    name_th: 'ตัดผ้า',
    category_code: 'garment',
    base_price: 20,
    requires_design: false,
    requires_material: true,
    estimated_minutes_per_unit: 5,
    can_outsource: true,
    in_house_capable: false,
    is_active: true,
    sort_order: 20,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'wt-021',
    code: 'sewing',
    name: 'Sewing',
    name_th: 'ตัดเย็บ',
    category_code: 'garment',
    base_price: 100,
    requires_design: false,
    requires_material: true,
    estimated_minutes_per_unit: 30,
    can_outsource: true,
    in_house_capable: false,
    is_active: true,
    sort_order: 21,
    created_at: '2024-01-01T00:00:00Z',
  },
  
  // === LABELING (งานป้าย) ===
  {
    id: 'wt-030',
    code: 'woven_label',
    name: 'Woven Label',
    name_th: 'ป้ายทอ',
    category_code: 'labeling',
    base_price: 5,
    requires_design: true,
    requires_material: true,
    estimated_minutes_per_unit: 1,
    can_outsource: true,
    in_house_capable: false,
    is_active: true,
    sort_order: 30,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'wt-031',
    code: 'printed_label',
    name: 'Printed Label',
    name_th: 'ป้ายพิมพ์',
    category_code: 'labeling',
    base_price: 3,
    requires_design: true,
    requires_material: true,
    estimated_minutes_per_unit: 0.5,
    can_outsource: true,
    in_house_capable: false,
    is_active: true,
    sort_order: 31,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'wt-032',
    code: 'leather_tag',
    name: 'Leather Tag',
    name_th: 'ป้ายหนัง',
    category_code: 'labeling',
    base_price: 15,
    requires_design: true,
    requires_material: true,
    estimated_minutes_per_unit: 2,
    can_outsource: true,
    in_house_capable: false,
    is_active: true,
    sort_order: 32,
    created_at: '2024-01-01T00:00:00Z',
  },
];

// ---------------------------------------------
// Work Dependencies (ลำดับการทำงาน)
// ---------------------------------------------

export interface WorkDependency {
  work_type_code: string;
  depends_on: string[]; // ต้องทำหลังจาก work_type_code เหล่านี้
  can_parallel_with: string[]; // ทำพร้อมกันได้
  order_types: string[]; // ใช้กับ order type ไหน (empty = all)
}

export const mockWorkDependencies: WorkDependency[] = [
  // Cutting ต้องมี fabric พร้อมก่อน
  { 
    work_type_code: 'cutting', 
    depends_on: [], 
    can_parallel_with: [],
    order_types: ['custom_sewing', 'full_custom'],
  },
  // Sewing ต้องทำหลัง Cutting
  { 
    work_type_code: 'sewing', 
    depends_on: ['cutting'], 
    can_parallel_with: [],
    order_types: ['custom_sewing', 'full_custom'],
  },
  // Sublimation ทำก่อน Sewing (พิมพ์บนผ้าก่อนเย็บ)
  { 
    work_type_code: 'sublimation', 
    depends_on: ['cutting'], 
    can_parallel_with: [],
    order_types: ['custom_sewing', 'full_custom'],
  },
  // งานพิมพ์ทั่วไปทำหลัง Sewing (ถ้าเป็น custom) หรือทำเลย (ถ้าเป็น ready-made)
  { 
    work_type_code: 'dtf', 
    depends_on: ['sewing'], 
    can_parallel_with: ['embroidery', 'dtg', 'silkscreen', 'vinyl'],
    order_types: ['custom_sewing', 'full_custom'],
  },
  { 
    work_type_code: 'dtf', 
    depends_on: [], 
    can_parallel_with: ['embroidery', 'dtg', 'silkscreen', 'vinyl'],
    order_types: ['ready_made', 'print_only'],
  },
  { 
    work_type_code: 'dtg', 
    depends_on: ['sewing'], 
    can_parallel_with: ['embroidery', 'dtf', 'silkscreen', 'vinyl'],
    order_types: ['custom_sewing', 'full_custom'],
  },
  { 
    work_type_code: 'dtg', 
    depends_on: [], 
    can_parallel_with: ['embroidery', 'dtf', 'silkscreen', 'vinyl'],
    order_types: ['ready_made', 'print_only'],
  },
  { 
    work_type_code: 'silkscreen', 
    depends_on: ['sewing'], 
    can_parallel_with: ['embroidery', 'dtf', 'dtg', 'vinyl'],
    order_types: ['custom_sewing', 'full_custom'],
  },
  { 
    work_type_code: 'silkscreen', 
    depends_on: [], 
    can_parallel_with: ['embroidery', 'dtf', 'dtg', 'vinyl'],
    order_types: ['ready_made', 'print_only'],
  },
  { 
    work_type_code: 'vinyl', 
    depends_on: ['sewing'], 
    can_parallel_with: ['embroidery', 'dtf', 'dtg', 'silkscreen'],
    order_types: ['custom_sewing', 'full_custom'],
  },
  { 
    work_type_code: 'vinyl', 
    depends_on: [], 
    can_parallel_with: ['embroidery', 'dtf', 'dtg', 'silkscreen'],
    order_types: ['ready_made', 'print_only'],
  },
  // งานปักทำหลัง Sewing (ถ้าเป็น custom) หรือทำเลย
  { 
    work_type_code: 'embroidery', 
    depends_on: ['sewing'], 
    can_parallel_with: ['dtf', 'dtg', 'silkscreen', 'vinyl'],
    order_types: ['custom_sewing', 'full_custom'],
  },
  { 
    work_type_code: 'embroidery', 
    depends_on: [], 
    can_parallel_with: ['dtf', 'dtg', 'silkscreen', 'vinyl'],
    order_types: ['ready_made', 'print_only'],
  },
  // งานป้ายทำหลัง Sewing
  { 
    work_type_code: 'woven_label', 
    depends_on: ['sewing'], 
    can_parallel_with: ['dtf', 'dtg', 'embroidery'],
    order_types: ['custom_sewing', 'full_custom'],
  },
  { 
    work_type_code: 'woven_label', 
    depends_on: [], 
    can_parallel_with: ['dtf', 'dtg', 'embroidery'],
    order_types: ['ready_made', 'print_only'],
  },
];

// ---------------------------------------------
// Required Work Types by Order Type
// (งานที่ต้องมีตาม Production Mode)
// ---------------------------------------------

export interface OrderTypeRequiredWork {
  order_type_code: string;
  required_work_types: string[]; // งานที่ต้องมีอัตโนมัติ
  suggested_work_types: string[]; // งานที่แนะนำ
  excluded_work_types: string[]; // งานที่ไม่สามารถเลือกได้
}

export const mockOrderTypeRequiredWorks: OrderTypeRequiredWork[] = [
  {
    order_type_code: 'ready_made',
    required_work_types: [], // ไม่มีงานบังคับ
    suggested_work_types: ['dtf', 'embroidery'], // แนะนำ DTF, ปัก
    excluded_work_types: ['cutting', 'sewing'], // ไม่มีงานตัดเย็บ
  },
  {
    order_type_code: 'custom_sewing',
    required_work_types: ['cutting', 'sewing'], // บังคับตัดเย็บ
    suggested_work_types: ['dtf', 'embroidery', 'woven_label'],
    excluded_work_types: [],
  },
  {
    order_type_code: 'full_custom',
    required_work_types: ['cutting', 'sewing'], // บังคับตัดเย็บ
    suggested_work_types: ['dtf', 'embroidery', 'woven_label'],
    excluded_work_types: [],
  },
  {
    order_type_code: 'print_only',
    required_work_types: [], // ไม่มีงานบังคับ
    suggested_work_types: ['dtf', 'dtg', 'embroidery'],
    excluded_work_types: ['cutting', 'sewing'], // ไม่มีงานตัดเย็บ
  },
];

// ---------------------------------------------
// Addon Types
// ---------------------------------------------

export const mockAddonTypes: AddonType[] = [
  {
    id: 'addon-001',
    code: 'opp_bag',
    name: 'OPP Bag',
    name_th: 'ถุง OPP',
    category: 'packaging',
    base_price: 2,
    price_type: 'per_piece',
    requires_design: false,
    requires_material: true,
    material_lead_days: 0,
    sort_order: 1,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'addon-002',
    code: 'hang_tag',
    name: 'Hang Tag',
    name_th: 'แท็กห้อย',
    category: 'labeling',
    base_price: 3,
    price_type: 'per_piece',
    requires_design: true,
    requires_material: true,
    material_lead_days: 5,
    sort_order: 2,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'addon-003',
    code: 'fold_pack',
    name: 'Fold & Pack',
    name_th: 'พับแพค',
    category: 'finishing',
    base_price: 5,
    price_type: 'per_piece',
    requires_design: false,
    requires_material: false,
    material_lead_days: 0,
    sort_order: 3,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
  },
];

// ---------------------------------------------
// Suppliers
// ---------------------------------------------

export const mockSuppliers: Supplier[] = [
  {
    id: 'sup-001',
    code: 'SUP-001',
    name: 'ABC Labels Co.',
    name_th: 'บริษัท เอบีซี เลเบิ้ล',
    contact: {
      name: 'คุณสมชาย',
      phone: '081-234-5678',
      email: 'somchai@abclabels.com',
      line_id: 'abclabels',
    },
    address: {
      address: '123 ถนนสุขุมวิท',
      district: 'คลองเตย',
      province: 'กรุงเทพมหานคร',
      postal_code: '10110',
    },
    service_types: ['woven_label', 'printed_label', 'hang_tag'],
    default_lead_days: 7,
    min_order_qty: 100,
    payment_terms: 'credit_30',
    rating: 4.5,
    on_time_rate: 95,
    quality_rate: 98,
    total_orders: 156,
    total_value: 450000,
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sup-002',
    code: 'SUP-002',
    name: 'Thai Embroidery Factory',
    name_th: 'โรงงานปักไทย',
    contact: {
      name: 'คุณวิไล',
      phone: '089-876-5432',
      email: 'wilai@thaiemb.com',
    },
    address: {
      address: '456 ถนนเพชรบุรี',
      district: 'ราชเทวี',
      province: 'กรุงเทพมหานคร',
      postal_code: '10400',
    },
    service_types: ['embroidery', 'embroidery_badge'],
    default_lead_days: 10,
    min_order_qty: 50,
    payment_terms: 'credit_15',
    rating: 4.2,
    on_time_rate: 88,
    quality_rate: 95,
    total_orders: 89,
    total_value: 320000,
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sup-003',
    code: 'SUP-003',
    name: 'Siam Garment',
    name_th: 'สยามการ์เม้นท์',
    contact: {
      name: 'คุณประสิทธิ์',
      phone: '02-123-4567',
      email: 'prasit@siamgarment.com',
    },
    address: {
      address: '789 นิคมอุตสาหกรรมบางปู',
      district: 'บางปู',
      province: 'สมุทรปราการ',
      postal_code: '10280',
    },
    service_types: ['cutting', 'sewing', 'pattern'],
    default_lead_days: 14,
    min_order_qty: 100,
    payment_terms: 'credit_30',
    rating: 4.0,
    on_time_rate: 85,
    quality_rate: 92,
    total_orders: 45,
    total_value: 890000,
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
  },
];

// ---------------------------------------------
// Production Stations
// ---------------------------------------------

export const mockStations: ProductionStation[] = [
  {
    id: 'station-001',
    code: 'DTF-1',
    name: 'เครื่อง DTF ตัว 1',
    department: 'printing',
    work_type_codes: ['dtf'],
    capacity_per_day: 200,
    status: 'active',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'station-002',
    code: 'DTF-2',
    name: 'เครื่อง DTF ตัว 2',
    department: 'printing',
    work_type_codes: ['dtf'],
    capacity_per_day: 200,
    status: 'active',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'station-003',
    code: 'PACK-1',
    name: 'แพ็คกิ้ง',
    department: 'packing',
    work_type_codes: ['packaging'],
    capacity_per_day: 500,
    status: 'active',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
  },
];

// ---------------------------------------------
// Sample Orders
// ---------------------------------------------

export const mockOrders: Order[] = [
  {
    id: 'order-001',
    order_number: 'ORD-2024-0001',
    order_type_code: 'print_only',
    production_mode: 'in_house',
    customer_snapshot: {
      id: 'cust-001',
      code: 'CUST-001',
      name: 'บริษัท ABC จำกัด',
      phone: '02-123-4567',
      email: 'contact@abc.com',
      tier: 'gold',
    },
    shipping_address: {
      name: 'คุณสมศักดิ์',
      phone: '081-234-5678',
      address: '123 ถนนสุขุมวิท',
      district: 'วัฒนา',
      province: 'กรุงเทพมหานคร',
      postal_code: '10110',
    },
    needs_tax_invoice: true,
    billing_name: 'บริษัท ABC จำกัด',
    billing_tax_id: '0123456789012',
    status: 'in_production',
    priority_level: 1,
    priority_code: 'rush',
    priority_surcharge_percent: 20,
    priority_surcharge_amount: 600,
    pricing: {
      subtotal: 3000,
      discount_amount: 0,
      discount_percent: 0,
      surcharge_amount: 600,
      shipping_cost: 100,
      tax_amount: 259,
      tax_percent: 7,
      total_amount: 3959,
    },
    paid_amount: 2000,
    balance_due: 1959,
    payment_status: 'partial',
    payment_terms: '50_50',
    order_date: '2024-12-01T10:00:00Z',
    due_date: '2024-12-10T17:00:00Z',
    revision_count: 1,
    max_free_revisions: 2,
    paid_revision_count: 0,
    paid_revision_total: 0,
    all_designs_approved: true,
    all_designs_approved_at: '2024-12-02T14:00:00Z',
    mockup_approved: true,
    mockup_approved_at: '2024-12-02T16:00:00Z',
    materials_ready: true,
    materials_ready_at: '2024-12-03T09:00:00Z',
    production_unlocked: true,
    production_unlocked_at: '2024-12-03T09:00:00Z',
    change_request_count: 0,
    change_request_total: 0,
    customer_acknowledged_changes: false,
    addons_total: 250,
    customer_note: 'ต้องการรับของภายในวันที่ 10',
    internal_note: 'ลูกค้า VIP',
    sales_channel: 'line',
    created_at: '2024-12-01T10:00:00Z',
    updated_at: '2024-12-04T09:00:00Z',
  },
  {
    id: 'order-002',
    order_number: 'ORD-2024-0002',
    order_type_code: 'ready_made',
    production_mode: 'in_house',
    customer_snapshot: {
      id: 'cust-002',
      code: 'CUST-002',
      name: 'ร้านเสื้อผ้า XYZ',
      phone: '089-876-5432',
      tier: 'silver',
    },
    shipping_address: {
      name: 'คุณวิภา',
      phone: '089-876-5432',
      address: '456 ถนนรัชดา',
      district: 'ดินแดง',
      province: 'กรุงเทพมหานคร',
      postal_code: '10400',
    },
    needs_tax_invoice: false,
    status: 'designing',
    priority_level: 0,
    priority_code: 'normal',
    priority_surcharge_percent: 0,
    priority_surcharge_amount: 0,
    pricing: {
      subtotal: 5000,
      discount_amount: 500,
      discount_percent: 10,
      surcharge_amount: 0,
      shipping_cost: 150,
      tax_amount: 0,
      tax_percent: 0,
      total_amount: 4650,
    },
    paid_amount: 0,
    balance_due: 4650,
    payment_status: 'unpaid',
    payment_terms: 'full',
    order_date: '2024-12-03T14:00:00Z',
    due_date: '2024-12-15T17:00:00Z',
    revision_count: 0,
    max_free_revisions: 2,
    paid_revision_count: 0,
    paid_revision_total: 0,
    all_designs_approved: false,
    mockup_approved: false,
    materials_ready: false,
    production_unlocked: false,
    change_request_count: 0,
    change_request_total: 0,
    customer_acknowledged_changes: false,
    addons_total: 0,
    sales_channel: 'facebook',
    created_at: '2024-12-03T14:00:00Z',
    updated_at: '2024-12-04T10:00:00Z',
  },
  {
    id: 'order-003',
    order_number: 'ORD-2024-0003',
    order_type_code: 'custom_sewing',
    production_mode: 'outsource',
    customer_snapshot: {
      id: 'cust-003',
      code: 'CUST-003',
      name: 'โรงเรียนสาธิต',
      phone: '02-987-6543',
      tier: 'platinum',
    },
    shipping_address: {
      name: 'คุณครูประภา',
      phone: '02-987-6543',
      address: '789 ถนนพหลโยธิน',
      district: 'จตุจักร',
      province: 'กรุงเทพมหานคร',
      postal_code: '10900',
    },
    needs_tax_invoice: true,
    billing_name: 'โรงเรียนสาธิต มหาวิทยาลัย...',
    billing_tax_id: '0994000123456',
    status: 'awaiting_material',
    priority_level: 2,
    priority_code: 'urgent',
    priority_surcharge_percent: 50,
    priority_surcharge_amount: 7500,
    pricing: {
      subtotal: 15000,
      discount_amount: 0,
      discount_percent: 0,
      surcharge_amount: 7500,
      shipping_cost: 0, // Pickup
      tax_amount: 1575,
      tax_percent: 7,
      total_amount: 24075,
    },
    paid_amount: 24075,
    balance_due: 0,
    payment_status: 'paid',
    payment_terms: 'full',
    order_date: '2024-12-02T09:00:00Z',
    due_date: '2024-12-08T12:00:00Z',
    revision_count: 2,
    max_free_revisions: 2,
    paid_revision_count: 0,
    paid_revision_total: 0,
    all_designs_approved: true,
    all_designs_approved_at: '2024-12-03T11:00:00Z',
    mockup_approved: true,
    mockup_approved_at: '2024-12-03T15:00:00Z',
    materials_ready: false,
    production_unlocked: false,
    change_request_count: 1,
    change_request_total: 300,
    customer_acknowledged_changes: true,
    customer_acknowledged_at: '2024-12-03T16:00:00Z',
    addons_total: 1500,
    customer_note: 'ต้องการ 200 ตัว สำหรับงาน Sports Day',
    internal_note: 'รอผ้าจาก Supplier - คาด 6 ธ.ค.',
    sales_channel: 'phone',
    created_at: '2024-12-02T09:00:00Z',
    updated_at: '2024-12-04T11:00:00Z',
  },
];

// ---------------------------------------------
// Sample Work Items
// ---------------------------------------------

export const mockWorkItems: OrderWorkItem[] = [
  {
    id: 'wi-001',
    order_id: 'order-001',
    work_type_code: 'dtf',
    work_type_name: 'DTF Printing',
    work_type_name_th: 'พิมพ์ DTF',
    category_code: 'printing',
    description: 'พิมพ์โลโก้หน้าอก A4',
    quantity: 50,
    unit_price: 40,
    total_price: 2000,
    status: 'in_production',
    can_start: true,
    all_designs_approved: true,
    all_materials_ready: true,
    production_job_id: 'job-001',
    qc_status: 'pending',
    qc_passed_qty: 0,
    qc_failed_qty: 0,
    position_code: 'front_chest_center',
    position_name: 'Front Center Chest',
    print_size_code: 'a4',
    print_size_name: 'A4',
    priority: 1,
    sort_order: 1,
    created_at: '2024-12-01T10:00:00Z',
    updated_at: '2024-12-04T09:00:00Z',
  },
  {
    id: 'wi-002',
    order_id: 'order-001',
    work_type_code: 'dtf',
    work_type_name: 'DTF Printing',
    work_type_name_th: 'พิมพ์ DTF',
    category_code: 'printing',
    description: 'พิมพ์หลัง A3',
    quantity: 50,
    unit_price: 60,
    total_price: 3000,
    status: 'queued',
    can_start: false,
    blocked_reason: 'รองานหน้าเสร็จก่อน',
    all_designs_approved: true,
    all_materials_ready: true,
    qc_status: 'pending',
    qc_passed_qty: 0,
    qc_failed_qty: 0,
    position_code: 'back_full',
    position_name: 'Back Full',
    print_size_code: 'a3',
    print_size_name: 'A3',
    priority: 1,
    sort_order: 2,
    created_at: '2024-12-01T10:00:00Z',
    updated_at: '2024-12-04T09:00:00Z',
  },
];

// ---------------------------------------------
// Production Stations
// ---------------------------------------------

export const mockProductionStations: ProductionStation[] = [
  {
    id: 'station-001',
    code: 'DTF-01',
    name: 'เครื่อง DTF หลัก',
    department: 'printing',
    work_type_codes: ['dtf_printing'],
    capacity_per_day: 200,
    status: 'active',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'station-002',
    code: 'DTF-02',
    name: 'เครื่อง DTF สำรอง',
    department: 'printing',
    work_type_codes: ['dtf_printing'],
    capacity_per_day: 150,
    status: 'active',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'station-003',
    code: 'PRESS-01',
    name: 'เครื่องรีดความร้อน 1',
    department: 'printing',
    work_type_codes: ['dtf_printing', 'sublimation'],
    capacity_per_day: 300,
    status: 'active',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'station-004',
    code: 'PACK-01',
    name: 'โต๊ะแพ็คสินค้า',
    department: 'packaging',
    work_type_codes: ['packing', 'folding'],
    capacity_per_day: 500,
    status: 'active',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

// ---------------------------------------------
// Production Jobs
// ---------------------------------------------

export const mockProductionJobs: ProductionJob[] = [
  {
    id: 'job-001',
    job_number: 'JOB-2024-0001',
    order_id: 'order-001',
    order_number: 'ORD-2024-0001',
    order_work_item_id: 'wi-001',
    customer_name: 'บริษัท ABC จำกัด',
    customer_phone: '02-123-4567',
    work_type_code: 'dtf_printing',
    work_type_name: 'DTF พิมพ์หน้า',
    category_code: 'printing',
    description: 'เสื้อยืดคอกลมสีขาว + DTF หน้าอก A4',
    ordered_qty: 100,
    produced_qty: 60,
    passed_qty: 55,
    failed_qty: 5,
    rework_qty: 0,
    status: 'in_progress',
    priority: 1,
    progress_percent: 60,
    station_id: 'station-001',
    assigned_to: 'user-002',
    assigned_at: '2024-12-01T09:00:00Z',
    estimated_hours: 8,
    actual_hours: 5,
    started_at: '2024-12-01T09:30:00Z',
    due_date: '2024-12-05',
    is_rework: false,
    rework_count: 0,
    created_at: '2024-12-01T08:00:00Z',
    updated_at: '2024-12-04T14:00:00Z',
    station: {
      id: 'station-001',
      code: 'DTF-01',
      name: 'เครื่อง DTF หลัก',
      department: 'printing',
      work_type_codes: ['dtf_printing'],
      capacity_per_day: 200,
      status: 'active',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  },
  {
    id: 'job-002',
    job_number: 'JOB-2024-0002',
    order_id: 'order-001',
    order_number: 'ORD-2024-0001',
    order_work_item_id: 'wi-002',
    customer_name: 'บริษัท ABC จำกัด',
    work_type_code: 'dtf_printing',
    work_type_name: 'DTF พิมพ์หลัง',
    category_code: 'printing',
    description: 'เสื้อยืดคอกลมสีขาว + DTF หลัง A3',
    ordered_qty: 100,
    produced_qty: 0,
    passed_qty: 0,
    failed_qty: 0,
    rework_qty: 0,
    status: 'queued',
    priority: 1,
    progress_percent: 0,
    estimated_hours: 10,
    due_date: '2024-12-05',
    is_rework: false,
    rework_count: 0,
    created_at: '2024-12-01T08:00:00Z',
    updated_at: '2024-12-01T08:00:00Z',
  },
  {
    id: 'job-003',
    job_number: 'JOB-2024-0003',
    order_id: 'order-002',
    order_number: 'ORD-2024-0002',
    customer_name: 'คุณวิภา ใจดี',
    work_type_code: 'dtf_printing',
    work_type_name: 'DTF พิมพ์หน้า',
    category_code: 'printing',
    description: 'เสื้อยืดคอวีสีกรม + DTF หน้าอก A5',
    ordered_qty: 50,
    produced_qty: 50,
    passed_qty: 48,
    failed_qty: 2,
    rework_qty: 2,
    status: 'qc_passed',
    priority: 0,
    progress_percent: 100,
    station_id: 'station-002',
    assigned_to: 'user-003',
    started_at: '2024-11-28T10:00:00Z',
    completed_at: '2024-11-29T16:00:00Z',
    due_date: '2024-12-10',
    is_rework: false,
    rework_count: 0,
    qc_status: 'passed',
    qc_notes: 'ผ่าน QC สีสดใสถูกต้อง',
    qc_by: 'user-001',
    qc_at: '2024-11-29T17:00:00Z',
    created_at: '2024-11-27T14:00:00Z',
    updated_at: '2024-11-29T17:00:00Z',
    station: {
      id: 'station-002',
      code: 'DTF-02',
      name: 'เครื่อง DTF สำรอง',
      department: 'printing',
      work_type_codes: ['dtf_printing'],
      capacity_per_day: 150,
      status: 'active',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  },
  {
    id: 'job-004',
    job_number: 'JOB-2024-0004',
    order_id: 'order-003',
    order_number: 'ORD-2024-0003',
    customer_name: 'โรงเรียน XYZ',
    work_type_code: 'dtf_printing',
    work_type_name: 'DTF หน้า+หลัง',
    category_code: 'printing',
    description: 'เสื้อยืดคอโปโลสีขาว + DTF หน้า+หลัง',
    ordered_qty: 200,
    produced_qty: 0,
    passed_qty: 0,
    failed_qty: 0,
    rework_qty: 0,
    status: 'pending',
    priority: 2,
    progress_percent: 0,
    due_date: '2024-12-15',
    is_rework: false,
    rework_count: 0,
    production_notes: 'รอผ้าจาก Supplier',
    created_at: '2024-12-03T09:00:00Z',
    updated_at: '2024-12-03T09:00:00Z',
  },
  {
    id: 'job-005',
    job_number: 'JOB-2024-0005',
    customer_name: 'ลูกค้า Walk-in',
    work_type_code: 'dtf_printing',
    work_type_name: 'DTF พิมพ์หน้า',
    category_code: 'printing',
    description: 'เสื้อยืดลูกค้านำมาเอง + DTF A4',
    ordered_qty: 5,
    produced_qty: 5,
    passed_qty: 5,
    failed_qty: 0,
    rework_qty: 0,
    status: 'completed',
    priority: 0,
    progress_percent: 100,
    station_id: 'station-001',
    started_at: '2024-12-04T11:00:00Z',
    completed_at: '2024-12-04T12:00:00Z',
    due_date: '2024-12-04',
    is_rework: false,
    rework_count: 0,
    created_at: '2024-12-04T10:30:00Z',
    updated_at: '2024-12-04T12:00:00Z',
  },
  {
    id: 'job-006',
    job_number: 'JOB-2024-0006',
    order_id: 'order-001',
    order_number: 'ORD-2024-0001',
    customer_name: 'บริษัท ABC จำกัด',
    work_type_code: 'packing',
    work_type_name: 'แพ็คใส่ถุง',
    category_code: 'packaging',
    description: 'แพ็คเสื้อใส่ถุงซิป + ติดสติ๊กเกอร์',
    ordered_qty: 100,
    produced_qty: 0,
    passed_qty: 0,
    failed_qty: 0,
    rework_qty: 0,
    status: 'pending',
    priority: 1,
    progress_percent: 0,
    due_date: '2024-12-05',
    is_rework: false,
    rework_count: 0,
    production_notes: 'รองานพิมพ์เสร็จ',
    created_at: '2024-12-01T08:00:00Z',
    updated_at: '2024-12-01T08:00:00Z',
  },
  {
    id: 'job-007',
    job_number: 'JOB-2024-0007-R1',
    order_id: 'order-002',
    order_number: 'ORD-2024-0002',
    customer_name: 'คุณวิภา ใจดี',
    work_type_code: 'dtf_printing',
    work_type_name: 'DTF พิมพ์หน้า',
    category_code: 'printing',
    description: 'REWORK - เสื้อยืดคอวีสีกรม + DTF หน้าอก A5',
    ordered_qty: 2,
    produced_qty: 2,
    passed_qty: 2,
    failed_qty: 0,
    rework_qty: 0,
    status: 'completed',
    priority: 2,
    progress_percent: 100,
    station_id: 'station-001',
    started_at: '2024-11-30T09:00:00Z',
    completed_at: '2024-11-30T10:00:00Z',
    due_date: '2024-11-30',
    is_rework: true,
    rework_reason: 'พิมพ์ไม่ชัด 2 ตัว',
    original_job_id: 'job-003',
    rework_count: 1,
    created_at: '2024-11-30T08:30:00Z',
    updated_at: '2024-11-30T10:00:00Z',
  },
];

// ---------------------------------------------
// Sample Payments
// ---------------------------------------------

export const mockPayments: OrderPayment[] = [
  {
    id: 'pay-001',
    order_id: 'order-001',
    amount: 2000,
    payment_type: 'deposit',
    payment_method: 'bank_transfer',
    bank_name: 'กสิกรไทย',
    transfer_date: '2024-12-01',
    transfer_time: '14:30',
    slip_image_url: 'https://example.com/slips/slip-001.jpg',
    reference_number: 'TRF-001',
    status: 'verified',
    verified_by: 'user-001',
    verified_at: '2024-12-01T15:00:00Z',
    payment_date: '2024-12-01',
    created_at: '2024-12-01T14:35:00Z',
  },
  {
    id: 'pay-002',
    order_id: 'order-003',
    amount: 24075,
    payment_type: 'full',
    payment_method: 'bank_transfer',
    bank_name: 'ไทยพาณิชย์',
    transfer_date: '2024-12-02',
    transfer_time: '10:00',
    slip_image_url: 'https://example.com/slips/slip-002.jpg',
    status: 'verified',
    verified_by: 'user-001',
    verified_at: '2024-12-02T10:30:00Z',
    payment_date: '2024-12-02',
    created_at: '2024-12-02T10:05:00Z',
  },
];

// ---------------------------------------------
// Sample Purchase Orders
// ---------------------------------------------

export const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: 'po-001',
    po_number: 'PO-2024-0001',
    supplier_id: 'sup-003',
    supplier_snapshot: {
      id: 'sup-003',
      code: 'SUP-003',
      name: 'Siam Garment',
      contact_name: 'คุณประสิทธิ์',
      phone: '02-123-4567',
    },
    order_id: 'order-003',
    order_number: 'ORD-2024-0003',
    po_date: '2024-12-03',
    expected_date: '2024-12-07',
    status: 'confirmed',
    subtotal: 8000,
    setup_fees: 0,
    shipping_cost: 0,
    discount: 0,
    total_amount: 8000,
    payment_status: 'unpaid',
    payment_terms: 'credit_30',
    paid_amount: 0,
    delivery_method: 'delivery',
    sent_via: 'line',
    sent_at: '2024-12-03T14:00:00Z',
    confirmed_at: '2024-12-03T15:00:00Z',
    internal_notes: 'ผ้าโพลี + ตัดเย็บ 200 ตัว',
    created_at: '2024-12-03T13:00:00Z',
    updated_at: '2024-12-03T15:00:00Z',
  },
];

// ---------------------------------------------
// Design & Design Versions (Phase 3)
// ---------------------------------------------

import type { 
  OrderDesign, 
  DesignVersion, 
  OrderMockup, 
  ApprovalGate,
  DesignApprovalSummary,
  MockupApprovalSummary,
  OrderGatesSummary,
} from '../types/orders';

export const mockDesigns: OrderDesign[] = [
  {
    id: 'design-001',
    order_id: 'order-001',
    order_work_item_id: 'wi-001',
    design_name: 'โลโก้หน้าอก',
    position: 'front_chest_left',
    status: 'approved',
    assigned_designer_id: 'user-002',
    current_version: 2,
    final_file_url: 'https://storage.example.com/designs/design-001-v2.png',
    revision_count: 2,
    max_free_revisions: 2,
    paid_revision_count: 0,
    paid_revision_total: 0,
    brief_text: 'โลโก้ตามไฟล์ที่ส่งมา ขนาด 8x8 ซม.',
    reference_files: [
      { name: 'logo-ref.jpg', url: 'https://storage.example.com/ref/logo-ref.jpg' }
    ],
    designer_notes: 'ปรับสีให้เข้ากับเสื้อขาว',
    created_at: '2024-12-01T10:00:00Z',
    updated_at: '2024-12-02T14:00:00Z',
  },
  {
    id: 'design-002',
    order_id: 'order-001',
    order_work_item_id: 'wi-002',
    design_name: 'พิมพ์หลังเต็ม',
    position: 'back_full',
    status: 'pending',
    assigned_designer_id: 'user-002',
    current_version: 1,
    revision_count: 1,
    max_free_revisions: 2,
    paid_revision_count: 0,
    paid_revision_total: 0,
    brief_text: 'รายชื่อพนักงาน 50 คน พื้นหลังสีฟ้า',
    created_at: '2024-12-01T10:30:00Z',
    updated_at: '2024-12-01T10:30:00Z',
  },
  {
    id: 'design-003',
    order_id: 'order-002',
    design_name: 'DTF หน้าอก',
    position: 'front_chest_center',
    status: 'approved',
    current_version: 1,
    final_file_url: 'https://storage.example.com/designs/design-003-v1.png',
    revision_count: 1,
    max_free_revisions: 2,
    paid_revision_count: 0,
    paid_revision_total: 0,
    brief_text: 'ลายตามไฟล์ที่ลูกค้าส่งมา',
    created_at: '2024-11-28T10:00:00Z',
    updated_at: '2024-11-29T11:00:00Z',
  },
  {
    id: 'design-004',
    order_id: 'order-003',
    design_name: 'โลโก้หน้าอก',
    position: 'front_chest_left',
    status: 'revision_requested',
    current_version: 3,
    revision_count: 3,
    max_free_revisions: 2,
    paid_revision_count: 1,
    paid_revision_total: 200,
    brief_text: 'โลโก้บริษัท + ชื่อพนักงาน',
    designer_notes: 'แก้รอบที่ 3 - เปลี่ยนสีตัวอักษร',
    created_at: '2024-12-02T09:00:00Z',
    updated_at: '2024-12-04T10:00:00Z',
  },
];

export const mockDesignVersions: DesignVersion[] = [
  // Design 001 - Version 1
  {
    id: 'dv-001',
    order_design_id: 'design-001',
    version_number: 1,
    file_url: 'https://storage.example.com/designs/design-001-v1.png',
    thumbnail_url: 'https://storage.example.com/designs/design-001-v1-thumb.png',
    status: 'rejected',
    revision_type: 'free',
    revision_cost: 0,
    change_description: 'เวอร์ชันแรก',
    approved_by_customer: false,
    is_final: false,
    feedback: 'ขอปรับสีให้เข้มขึ้น',
    feedback_by: 'customer',
    feedback_at: '2024-12-01T15:00:00Z',
    created_by: 'user-002',
    created_at: '2024-12-01T11:00:00Z',
  },
  // Design 001 - Version 2 (Final)
  {
    id: 'dv-002',
    order_design_id: 'design-001',
    version_number: 2,
    file_url: 'https://storage.example.com/designs/design-001-v2.png',
    thumbnail_url: 'https://storage.example.com/designs/design-001-v2-thumb.png',
    status: 'approved',
    revision_type: 'free',
    revision_cost: 0,
    change_description: 'ปรับสีตามคำขอ',
    approved_by_customer: true,
    customer_approved_at: '2024-12-02T10:00:00Z',
    is_final: true,
    feedback: 'สวยมากครับ',
    feedback_by: 'customer',
    feedback_at: '2024-12-02T10:00:00Z',
    created_by: 'user-002',
    created_at: '2024-12-02T09:00:00Z',
  },
  // Design 002 - Version 1
  {
    id: 'dv-003',
    order_design_id: 'design-002',
    version_number: 1,
    file_url: 'https://storage.example.com/designs/design-002-v1.png',
    thumbnail_url: 'https://storage.example.com/designs/design-002-v1-thumb.png',
    status: 'pending',
    revision_type: 'free',
    revision_cost: 0,
    change_description: 'เวอร์ชันแรก',
    approved_by_customer: false,
    is_final: false,
    created_by: 'user-002',
    created_at: '2024-12-01T14:00:00Z',
  },
  // Design 004 - Multiple versions with paid revision
  {
    id: 'dv-004',
    order_design_id: 'design-004',
    version_number: 1,
    file_url: 'https://storage.example.com/designs/design-004-v1.png',
    status: 'rejected',
    revision_type: 'free',
    revision_cost: 0,
    approved_by_customer: false,
    is_final: false,
    feedback: 'ขอเปลี่ยน font',
    feedback_by: 'customer',
    created_at: '2024-12-02T10:00:00Z',
  },
  {
    id: 'dv-005',
    order_design_id: 'design-004',
    version_number: 2,
    file_url: 'https://storage.example.com/designs/design-004-v2.png',
    status: 'rejected',
    revision_type: 'free',
    revision_cost: 0,
    approved_by_customer: false,
    is_final: false,
    feedback: 'ขอเปลี่ยนสี',
    feedback_by: 'customer',
    created_at: '2024-12-03T09:00:00Z',
  },
  {
    id: 'dv-006',
    order_design_id: 'design-004',
    version_number: 3,
    file_url: 'https://storage.example.com/designs/design-004-v3.png',
    status: 'pending',
    revision_type: 'paid', // แก้เกิน 2 ครั้ง = คิดเงิน
    revision_cost: 200,
    change_description: 'แก้ไขครั้งที่ 3 (คิดค่าแก้ไข ฿200)',
    approved_by_customer: false,
    is_final: false,
    created_at: '2024-12-04T10:00:00Z',
  },
];

// ---------------------------------------------
// Mockups
// ---------------------------------------------

export const mockMockups: OrderMockup[] = [
  {
    id: 'mockup-001',
    order_id: 'order-001',
    order_design_id: 'design-001',
    version_number: 1,
    front_image_url: 'https://storage.example.com/mockups/mockup-001-front.jpg',
    back_image_url: 'https://storage.example.com/mockups/mockup-001-back.jpg',
    additional_images: [],
    status: 'approved',
    customer_feedback: 'ตรงตามต้องการ',
    approved_at: '2024-12-02T14:00:00Z',
    created_by: 'user-002',
    created_at: '2024-12-02T12:00:00Z',
  },
  {
    id: 'mockup-002',
    order_id: 'order-002',
    version_number: 1,
    front_image_url: 'https://storage.example.com/mockups/mockup-002-front.jpg',
    status: 'approved',
    approved_at: '2024-11-29T15:00:00Z',
    created_by: 'user-001',
    created_at: '2024-11-29T13:00:00Z',
  },
  {
    id: 'mockup-003',
    order_id: 'order-003',
    version_number: 1,
    front_image_url: 'https://storage.example.com/mockups/mockup-003-front.jpg',
    back_image_url: 'https://storage.example.com/mockups/mockup-003-back.jpg',
    status: 'pending',
    created_by: 'user-002',
    created_at: '2024-12-04T09:00:00Z',
  },
];

// ---------------------------------------------
// Approval Gates
// ---------------------------------------------

export const mockApprovalGates: ApprovalGate[] = [
  // Order 001 - All gates passed
  {
    id: 'gate-001-design',
    order_id: 'order-001',
    gate_type: 'design',
    gate_name: 'Design Approval',
    gate_name_th: 'อนุมัติแบบ',
    description: 'ลูกค้าต้องอนุมัติไฟล์ออกแบบทั้งหมด',
    status: 'approved',
    is_mandatory: true,
    can_skip: false,
    requires_customer_approval: true,
    requires_admin_approval: false,
    progress_percent: 100,
    total_items: 2,
    approved_items: 2,
    approved_by: 'customer',
    approved_at: '2024-12-02T10:00:00Z',
    customer_confirmed: true,
    customer_confirmed_at: '2024-12-02T10:00:00Z',
    started_at: '2024-12-01T10:00:00Z',
    completed_at: '2024-12-02T10:00:00Z',
    sort_order: 1,
    created_at: '2024-12-01T09:00:00Z',
  },
  {
    id: 'gate-001-mockup',
    order_id: 'order-001',
    gate_type: 'mockup',
    gate_name: 'Mockup Approval',
    gate_name_th: 'อนุมัติตัวอย่าง',
    description: 'ลูกค้าต้องอนุมัติ Mockup ก่อนผลิต',
    status: 'approved',
    is_mandatory: true,
    can_skip: false,
    requires_customer_approval: true,
    requires_admin_approval: false,
    progress_percent: 100,
    total_items: 1,
    approved_items: 1,
    approved_by: 'customer',
    approved_at: '2024-12-02T14:00:00Z',
    customer_confirmed: true,
    customer_confirmed_at: '2024-12-02T14:00:00Z',
    notes: 'ลูกค้ายืนยันว่าตรงตามต้องการ',
    started_at: '2024-12-02T12:00:00Z',
    completed_at: '2024-12-02T14:00:00Z',
    sort_order: 2,
    created_at: '2024-12-01T09:00:00Z',
  },
  {
    id: 'gate-001-material',
    order_id: 'order-001',
    gate_type: 'material',
    gate_name: 'Material Ready',
    gate_name_th: 'วัสดุพร้อม',
    description: 'ตรวจสอบวัสดุทั้งหมดพร้อมผลิต',
    status: 'approved',
    is_mandatory: true,
    can_skip: false,
    requires_customer_approval: false,
    requires_admin_approval: true,
    progress_percent: 100,
    total_items: 50,
    approved_items: 50,
    approved_by: 'user-001',
    approved_by_name: 'Admin',
    approved_at: '2024-12-02T15:00:00Z',
    customer_confirmed: false,
    sort_order: 3,
    created_at: '2024-12-01T09:00:00Z',
  },
  
  // Order 003 - Pending gates
  {
    id: 'gate-003-design',
    order_id: 'order-003',
    gate_type: 'design',
    gate_name: 'Design Approval',
    gate_name_th: 'อนุมัติแบบ',
    status: 'in_progress',
    is_mandatory: true,
    can_skip: false,
    requires_customer_approval: true,
    requires_admin_approval: false,
    progress_percent: 50,
    total_items: 2,
    approved_items: 1,
    customer_confirmed: false,
    notes: 'รอลูกค้าอนุมัติงานที่ 2',
    started_at: '2024-12-02T09:00:00Z',
    sort_order: 1,
    created_at: '2024-12-02T08:00:00Z',
  },
  {
    id: 'gate-003-mockup',
    order_id: 'order-003',
    gate_type: 'mockup',
    gate_name: 'Mockup Approval',
    gate_name_th: 'อนุมัติตัวอย่าง',
    status: 'pending',
    is_mandatory: true,
    can_skip: false,
    requires_customer_approval: true,
    requires_admin_approval: false,
    progress_percent: 0,
    total_items: 1,
    approved_items: 0,
    customer_confirmed: false,
    sort_order: 2,
    created_at: '2024-12-02T08:00:00Z',
  },
  {
    id: 'gate-003-material',
    order_id: 'order-003',
    gate_type: 'material',
    gate_name: 'Material Ready',
    gate_name_th: 'วัสดุพร้อม',
    status: 'pending',
    is_mandatory: true,
    can_skip: false,
    requires_customer_approval: false,
    requires_admin_approval: true,
    progress_percent: 0,
    total_items: 200,
    approved_items: 0,
    customer_confirmed: false,
    notes: 'รอของจาก Supplier',
    sort_order: 3,
    created_at: '2024-12-02T08:00:00Z',
  },
];

// ---------------------------------------------
// Helper: Get Gates Summary for Order
// ---------------------------------------------

export function getOrderGatesSummary(orderId: string): OrderGatesSummary | null {
  const gates = mockApprovalGates.filter(g => g.order_id === orderId);
  if (gates.length === 0) return null;
  
  const order = mockOrders.find(o => o.id === orderId);
  if (!order) return null;
  
  const designGate = gates.find(g => g.gate_type === 'design');
  const mockupGate = gates.find(g => g.gate_type === 'mockup');
  const materialGate = gates.find(g => g.gate_type === 'material');
  
  const blockingGates = gates
    .filter(g => g.is_mandatory && g.status !== 'approved' && g.status !== 'skipped')
    .map(g => g.gate_name_th);
  
  return {
    order_id: orderId,
    order_number: order.order_number,
    gates,
    design_approved: designGate?.status === 'approved',
    mockup_approved: mockupGate?.status === 'approved',
    material_ready: materialGate?.status === 'approved',
    payment_confirmed: order.payment_status === 'paid' || order.payment_status === 'deposit_paid',
    production_unlocked: blockingGates.length === 0,
    blocking_gates: blockingGates,
  };
}

// ---------------------------------------------
// Design Approval Summary Helper
// ---------------------------------------------

export function getDesignApprovalSummary(orderId: string): DesignApprovalSummary | null {
  const designs = mockDesigns.filter(d => d.order_id === orderId);
  if (designs.length === 0) return null;
  
  return {
    order_id: orderId,
    total_designs: designs.length,
    approved_designs: designs.filter(d => d.status === 'approved').length,
    pending_designs: designs.filter(d => d.status === 'pending' || d.status === 'in_progress').length,
    rejected_designs: designs.filter(d => d.status === 'revision_requested').length,
    total_revisions: designs.reduce((sum, d) => sum + d.revision_count, 0),
    free_revisions_used: designs.reduce((sum, d) => sum + Math.min(d.revision_count, d.max_free_revisions), 0),
    paid_revisions_count: designs.reduce((sum, d) => sum + d.paid_revision_count, 0),
    paid_revisions_total: designs.reduce((sum, d) => sum + d.paid_revision_total, 0),
    all_approved: designs.every(d => d.status === 'approved'),
    last_updated: designs.reduce((latest, d) => 
      d.updated_at && d.updated_at > latest ? d.updated_at : latest, 
      designs[0]?.updated_at || ''
    ),
  };
}

// ---------------------------------------------
// Mockup Approval Summary Helper
// ---------------------------------------------

export function getMockupApprovalSummary(orderId: string): MockupApprovalSummary | null {
  const mockups = mockMockups.filter(m => m.order_id === orderId);
  if (mockups.length === 0) return null;
  
  const latestMockup = mockups.reduce((latest, m) => 
    m.version_number > latest.version_number ? m : latest,
    mockups[0]
  );
  
  return {
    order_id: orderId,
    total_mockups: mockups.length,
    approved_mockups: mockups.filter(m => m.status === 'approved').length,
    pending_mockups: mockups.filter(m => m.status === 'pending').length,
    current_version: latestMockup.version_number,
    has_customer_feedback: !!latestMockup.customer_feedback,
    all_approved: mockups.every(m => m.status === 'approved'),
    approved_at: latestMockup.approved_at,
  };
}

// =============================================
// PHASE 4: CHANGE REQUEST MOCK DATA
// =============================================

// Note: ChangeRequest is already imported at the top

export const mockChangeRequests: ChangeRequest[] = [
  {
    id: 'cr-001',
    request_number: 'CR-2024-0001',
    order_id: 'order-001',
    order_number: 'ORD-2024-0001',
    
    order_phase: 'mockup_approved',
    change_type: 'design_revision',
    change_category: 'customer_request',
    
    title: 'เปลี่ยนสีโลโก้',
    description: 'ลูกค้าขอเปลี่ยนสีโลโก้จากน้ำเงินเป็นแดง',
    customer_reason: 'ต้องการให้ตรงกับ CI ใหม่ของบริษัท',
    
    affected_work_items: ['wi-001'],
    
    impact: {
      production_already_started: false,
      produced_qty: 0,
      waste_qty: 0,
      materials_ordered: false,
      materials_received: false,
      material_waste_cost: 0,
      designs_approved: true,
      design_rework_required: true,
      affects_due_date: false,
      delay_days: 0,
      affects_other_orders: false,
      impact_level: 'low',
      impact_description: 'ต้องแก้ไขไฟล์ออกแบบใหม่',
    },
    
    fees: {
      base_fee: 0,
      design_fee: 200,
      rework_fee: 0,
      material_fee: 0,
      waste_fee: 0,
      rush_fee: 0,
      other_fee: 0,
      discount: 0,
      total_fee: 200,
    },
    
    days_delayed: 0,
    
    status: 'completed',
    
    quoted_at: '2024-12-01T10:00:00Z',
    quoted_by: 'user-001',
    customer_notified_at: '2024-12-01T10:30:00Z',
    customer_response: 'accept',
    customer_responded_at: '2024-12-01T11:00:00Z',
    
    payment_status: 'paid',
    payment_required: true,
    payment_received_at: '2024-12-01T11:30:00Z',
    payment_reference: 'PAY-CR-001',
    
    completed_at: '2024-12-01T14:00:00Z',
    completed_by: 'user-002',
    
    admin_notes: 'แก้ไขเสร็จแล้ว ส่ง mockup ใหม่ให้ลูกค้าดู',
    
    order: {
      order_number: 'ORD-2024-0001',
      customer_name: 'บริษัท ABC จำกัด',
      status: 'in_production',
    },
    
    created_at: '2024-12-01T09:00:00Z',
    updated_at: '2024-12-01T14:00:00Z',
  },
  {
    id: 'cr-002',
    request_number: 'CR-2024-0002',
    order_id: 'order-003',
    order_number: 'ORD-2024-0003',
    
    order_phase: 'pre_production',
    change_type: 'quantity_change',
    change_category: 'customer_request',
    
    title: 'เพิ่มจำนวนเสื้อ',
    description: 'ลูกค้าขอเพิ่มจำนวนเสื้อจาก 200 เป็น 250 ตัว',
    customer_reason: 'มีพนักงานใหม่เพิ่มขึ้น',
    
    affected_products: ['prod-001'],
    
    impact: {
      production_already_started: false,
      produced_qty: 0,
      waste_qty: 0,
      materials_ordered: true,
      materials_received: false,
      material_waste_cost: 0,
      designs_approved: true,
      design_rework_required: false,
      affects_due_date: true,
      delay_days: 2,
      affects_other_orders: false,
      impact_level: 'medium',
      impact_description: 'ต้องสั่งวัสดุเพิ่ม อาจส่งช้า 2 วัน',
    },
    
    fees: {
      base_fee: 0,
      design_fee: 0,
      rework_fee: 0,
      material_fee: 5000, // ค่าเสื้อเพิ่ม 50 ตัว
      waste_fee: 0,
      rush_fee: 0,
      other_fee: 0,
      discount: 0,
      total_fee: 5000,
    },
    
    days_delayed: 2,
    original_due_date: '2024-12-10',
    new_due_date: '2024-12-12',
    
    status: 'awaiting_customer',
    
    quoted_at: '2024-12-03T14:00:00Z',
    quoted_by: 'user-001',
    customer_notified_at: '2024-12-03T14:30:00Z',
    
    payment_status: 'unpaid',
    payment_required: true,
    
    admin_notes: 'ส่งใบเสนอราคาให้ลูกค้าแล้ว รอตอบกลับ',
    
    order: {
      order_number: 'ORD-2024-0003',
      customer_name: 'โรงเรียนสวนกุหลาบ',
      status: 'pending',
    },
    
    created_at: '2024-12-03T10:00:00Z',
    updated_at: '2024-12-03T14:30:00Z',
  },
  {
    id: 'cr-003',
    request_number: 'CR-2024-0003',
    order_id: 'order-001',
    order_number: 'ORD-2024-0001',
    
    order_phase: 'in_production',
    change_type: 'add_work',
    change_category: 'customer_request',
    
    title: 'เพิ่มปักชื่อพนักงาน',
    description: 'ลูกค้าขอเพิ่มงานปักชื่อพนักงานที่หน้าอกซ้าย',
    customer_reason: 'ลืมใส่ตอนสั่ง',
    
    affected_work_items: [],
    
    impact: {
      production_already_started: true,
      produced_qty: 20,
      waste_qty: 0,
      materials_ordered: true,
      materials_received: true,
      material_waste_cost: 0,
      designs_approved: true,
      design_rework_required: false,
      affects_due_date: true,
      delay_days: 3,
      affects_other_orders: false,
      impact_level: 'medium',
      impact_description: 'ต้องหยุดผลิตเพื่อเพิ่มงานปัก',
    },
    
    fees: {
      base_fee: 100,
      design_fee: 0,
      rework_fee: 400, // งานที่ผลิตไปแล้ว 20 ตัว
      material_fee: 0,
      waste_fee: 0,
      rush_fee: 0,
      other_fee: 2500, // ค่าปัก 50 ตัว x 50 บาท
      other_fee_description: 'ค่าปักชื่อ 50 ตัว x ฿50',
      discount: 0,
      total_fee: 3000,
    },
    
    days_delayed: 3,
    original_due_date: '2024-12-11',
    new_due_date: '2024-12-14',
    
    status: 'pending_quote',
    
    payment_status: 'unpaid',
    payment_required: true,
    
    internal_notes: 'รอคำนวณค่าใช้จ่ายจากฝ่ายผลิต',
    
    order: {
      order_number: 'ORD-2024-0001',
      customer_name: 'บริษัท ABC จำกัด',
      status: 'in_production',
    },
    
    created_at: '2024-12-04T08:00:00Z',
    updated_at: '2024-12-04T08:00:00Z',
  },
];

export const mockChangeRequestLogs: ChangeRequestLog[] = [
  {
    id: 'crlog-001',
    change_request_id: 'cr-001',
    action: 'created',
    to_status: 'pending_quote',
    notes: 'สร้างคำขอเปลี่ยนแปลง',
    performed_by: 'user-001',
    performed_at: '2024-12-01T09:00:00Z',
    created_at: '2024-12-01T09:00:00Z',
  },
  {
    id: 'crlog-002',
    change_request_id: 'cr-001',
    action: 'quoted',
    from_status: 'pending_quote',
    to_status: 'awaiting_customer',
    notes: 'ส่งใบเสนอราคา ฿200',
    performed_by: 'user-001',
    performed_at: '2024-12-01T10:00:00Z',
    created_at: '2024-12-01T10:00:00Z',
  },
  {
    id: 'crlog-003',
    change_request_id: 'cr-001',
    action: 'customer_accepted',
    from_status: 'awaiting_customer',
    to_status: 'awaiting_payment',
    notes: 'ลูกค้ายืนยันรับทราบ',
    performed_at: '2024-12-01T11:00:00Z',
    created_at: '2024-12-01T11:00:00Z',
  },
  {
    id: 'crlog-004',
    change_request_id: 'cr-001',
    action: 'payment_received',
    from_status: 'awaiting_payment',
    to_status: 'in_progress',
    details: { amount: 200, reference: 'PAY-CR-001' },
    notes: 'รับชำระเงินแล้ว',
    performed_by: 'user-001',
    performed_at: '2024-12-01T11:30:00Z',
    created_at: '2024-12-01T11:30:00Z',
  },
  {
    id: 'crlog-005',
    change_request_id: 'cr-001',
    action: 'completed',
    from_status: 'in_progress',
    to_status: 'completed',
    notes: 'แก้ไขเสร็จสิ้น',
    performed_by: 'user-002',
    performed_at: '2024-12-01T14:00:00Z',
    created_at: '2024-12-01T14:00:00Z',
  },
];

// Change Request Stats Helper
export function getChangeRequestStats(): ChangeRequestStats {
  const requests = mockChangeRequests;
  const pendingStatuses = ['pending_quote', 'awaiting_customer', 'awaiting_payment', 'in_progress'];
  
  return {
    total_requests: requests.length,
    pending_requests: requests.filter(r => pendingStatuses.includes(r.status)).length,
    awaiting_customer: requests.filter(r => r.status === 'awaiting_customer').length,
    total_fees_quoted: requests.reduce((sum, r) => sum + r.fees.total_fee, 0),
    total_fees_collected: requests.filter(r => r.payment_status === 'paid').reduce((sum, r) => sum + r.fees.total_fee, 0),
    avg_resolution_days: 1.5,
  };
}

// =============================================
// PHASE 5: QC MOCK DATA
// =============================================

import type {
  QCRecord,
  QCCheckpoint,
  QCStats,
  QCStageConfig,
  DefectType,
} from '../types/qc';

export const mockQCStageConfigs: QCStageConfig[] = [
  {
    id: 'qc-stage-material',
    code: 'material',
    name: 'Material Inspection',
    name_th: 'ตรวจวัตถุดิบ',
    stage_order: 1,
    is_mandatory: true,
    description: 'ตรวจสอบคุณภาพวัตถุดิบก่อนเข้าผลิต',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'qc-stage-pre',
    code: 'pre_production',
    name: 'Pre-Production',
    name_th: 'ก่อนผลิต',
    stage_order: 2,
    is_mandatory: true,
    description: 'ตรวจสอบความพร้อมก่อนเริ่มผลิต',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'qc-stage-inline',
    code: 'in_process',
    name: 'In-Process',
    name_th: 'ระหว่างผลิต',
    stage_order: 3,
    is_mandatory: false,
    applies_to_work_types: ['dtf', 'silkscreen', 'embroidery'],
    description: 'ตรวจสอบระหว่างกระบวนการผลิต',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'qc-stage-post',
    code: 'post_production',
    name: 'Post-Production',
    name_th: 'หลังผลิต',
    stage_order: 4,
    is_mandatory: true,
    description: 'ตรวจสอบหลังผลิตเสร็จ',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'qc-stage-final',
    code: 'final',
    name: 'Final Inspection',
    name_th: 'ตรวจสอบขั้นสุดท้าย',
    stage_order: 5,
    is_mandatory: true,
    description: 'ตรวจสอบก่อนส่งมอบ',
    created_at: '2024-01-01T00:00:00Z',
  },
];

export const mockDefectTypes: DefectType[] = [
  { id: 'defect-001', code: 'print_blur', name: 'Print Blur', name_th: 'พิมพ์เบลอ', category: 'printing', severity: 'major', is_active: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'defect-002', code: 'print_crack', name: 'Print Crack', name_th: 'พิมพ์แตก', category: 'printing', severity: 'critical', is_active: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'defect-003', code: 'color_mismatch', name: 'Color Mismatch', name_th: 'สีไม่ตรง', category: 'printing', severity: 'major', is_active: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'defect-004', code: 'position_wrong', name: 'Wrong Position', name_th: 'ตำแหน่งผิด', category: 'printing', severity: 'critical', is_active: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'defect-005', code: 'fabric_stain', name: 'Fabric Stain', name_th: 'ผ้าเปื้อน', category: 'material', severity: 'minor', is_active: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'defect-006', code: 'fabric_hole', name: 'Fabric Hole', name_th: 'ผ้าเป็นรู', category: 'material', severity: 'critical', is_active: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'defect-007', code: 'size_wrong', name: 'Wrong Size', name_th: 'ไซส์ผิด', category: 'garment', severity: 'critical', is_active: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'defect-008', code: 'seam_loose', name: 'Loose Seam', name_th: 'ตะเข็บหลุด', category: 'garment', severity: 'major', is_active: true, created_at: '2024-01-01T00:00:00Z' },
];

export const mockQCRecords: QCRecord[] = [
  {
    id: 'qc-001',
    job_id: 'job-001',
    order_id: 'order-001',
    order_work_item_id: 'wi-001',
    
    qc_stage_code: 'post_production',
    qc_stage_name: 'หลังผลิต',
    
    total_qty: 50,
    checked_qty: 50,
    passed_qty: 48,
    failed_qty: 2,
    rework_qty: 2,
    
    overall_result: 'pass_with_rework',
    pass_rate: 96,
    
    checklist_results: [
      { checkpoint_code: 'print_quality', checkpoint_name: 'คุณภาพงานพิมพ์', checkpoint_name_th: 'คุณภาพงานพิมพ์', is_required: true, passed: true },
      { checkpoint_code: 'color_accuracy', checkpoint_name: 'ความถูกต้องของสี', checkpoint_name_th: 'ความถูกต้องของสี', is_required: true, passed: true },
      { checkpoint_code: 'position_accuracy', checkpoint_name: 'ตำแหน่งงานพิมพ์', checkpoint_name_th: 'ตำแหน่งงานพิมพ์', is_required: true, passed: true },
      { checkpoint_code: 'adhesion_test', checkpoint_name: 'การยึดติดของหมึก', checkpoint_name_th: 'การยึดติดของหมึก', is_required: true, passed: true },
      { 
        checkpoint_code: 'overall_appearance', 
        checkpoint_name: 'สภาพโดยรวม', 
        checkpoint_name_th: 'สภาพโดยรวม', 
        is_required: true, 
        passed: false,
        notes: 'พบ 2 ตัวมีรอยเปื้อน',
        defect_type: 'fabric_stain',
        defect_severity: 'minor',
      },
    ],
    
    photo_urls: ['https://storage.example.com/qc/qc-001-1.jpg'],
    notes: 'พบ 2 ตัวมีรอยเปื้อน ส่งซักใหม่',
    failure_reasons: ['fabric_stain'],
    rework_instructions: 'ส่งซักทำความสะอาดใหม่',
    
    actions_taken: [
      { action_type: 'pass', quantity: 48, reason: 'ผ่านทุกรายการ' },
      { action_type: 'rework', quantity: 2, reason: 'รอยเปื้อน', rework_instructions: 'ส่งซักใหม่' },
    ],
    
    started_at: '2024-12-03T09:00:00Z',
    completed_at: '2024-12-03T10:30:00Z',
    
    checked_by: 'user-003',
    checked_at: '2024-12-03T10:30:00Z',
    
    follow_up_required: true,
    follow_up_notes: 'ตรวจสอบหลังซักใหม่',
    
    checker: { id: 'user-003', full_name: 'พนักงาน QC' },
    job: { job_number: 'JOB-2024-0001', work_type_code: 'dtf' },
    order: { order_number: 'ORD-2024-0001', customer_name: 'บริษัท ABC จำกัด' },
    
    created_at: '2024-12-03T10:30:00Z',
    updated_at: '2024-12-03T10:30:00Z',
  },
  {
    id: 'qc-002',
    job_id: 'job-003',
    order_id: 'order-002',
    order_work_item_id: 'wi-003',
    
    qc_stage_code: 'final',
    qc_stage_name: 'ตรวจสอบขั้นสุดท้าย',
    
    total_qty: 100,
    checked_qty: 100,
    passed_qty: 100,
    failed_qty: 0,
    rework_qty: 0,
    
    overall_result: 'pass',
    pass_rate: 100,
    
    checklist_results: [
      { checkpoint_code: 'print_quality', checkpoint_name: 'คุณภาพงานพิมพ์', is_required: true, passed: true },
      { checkpoint_code: 'color_accuracy', checkpoint_name: 'ความถูกต้องของสี', is_required: true, passed: true },
      { checkpoint_code: 'position_accuracy', checkpoint_name: 'ตำแหน่งงานพิมพ์', is_required: true, passed: true },
      { checkpoint_code: 'packaging', checkpoint_name: 'บรรจุภัณฑ์', is_required: true, passed: true },
      { checkpoint_code: 'quantity_count', checkpoint_name: 'จำนวนถูกต้อง', is_required: true, passed: true },
    ],
    
    notes: 'ผ่านทุกรายการ พร้อมส่ง',
    
    actions_taken: [
      { action_type: 'pass', quantity: 100, reason: 'ผ่านทุกรายการ พร้อมส่งมอบ' },
    ],
    
    started_at: '2024-12-02T14:00:00Z',
    completed_at: '2024-12-02T15:00:00Z',
    
    checked_by: 'user-003',
    checked_at: '2024-12-02T15:00:00Z',
    
    follow_up_required: false,
    
    checker: { id: 'user-003', full_name: 'พนักงาน QC' },
    job: { job_number: 'JOB-2024-0003', work_type_code: 'dtf' },
    order: { order_number: 'ORD-2024-0002', customer_name: 'คุณวิภา ใจดี' },
    
    created_at: '2024-12-02T15:00:00Z',
    updated_at: '2024-12-02T15:00:00Z',
  },
  {
    id: 'qc-003',
    job_id: 'job-004',
    order_id: 'order-003',
    
    qc_stage_code: 'material',
    qc_stage_name: 'ตรวจวัตถุดิบ',
    
    total_qty: 200,
    checked_qty: 200,
    passed_qty: 195,
    failed_qty: 5,
    rework_qty: 0,
    
    overall_result: 'pass_with_rework',
    pass_rate: 97.5,
    
    checklist_results: [
      { checkpoint_code: 'fabric_quality', checkpoint_name: 'คุณภาพผ้า', is_required: true, passed: true },
      { checkpoint_code: 'color_match', checkpoint_name: 'สีตรงตาม PO', is_required: true, passed: true },
      { 
        checkpoint_code: 'no_defects', 
        checkpoint_name: 'ไม่มีตำหนิ', 
        is_required: true, 
        passed: false,
        notes: 'พบผ้ามีรู 5 ตัว',
        defect_type: 'fabric_hole',
        defect_severity: 'critical',
      },
      { checkpoint_code: 'size_correct', checkpoint_name: 'ไซส์ถูกต้อง', is_required: true, passed: true },
    ],
    
    notes: 'พบผ้ามีตำหนิ 5 ตัว ส่งคืน supplier',
    failure_reasons: ['fabric_hole'],
    
    actions_taken: [
      { action_type: 'pass', quantity: 195, reason: 'ผ่านทุกรายการ' },
      { action_type: 'reject', quantity: 5, reason: 'ผ้าเป็นรู - ส่งคืน supplier' },
    ],
    
    started_at: '2024-12-03T08:00:00Z',
    completed_at: '2024-12-03T08:45:00Z',
    
    checked_by: 'user-003',
    checked_at: '2024-12-03T08:45:00Z',
    
    follow_up_required: true,
    follow_up_notes: 'รอ supplier ส่งทดแทน 5 ตัว',
    
    checker: { id: 'user-003', full_name: 'พนักงาน QC' },
    order: { order_number: 'ORD-2024-0003', customer_name: 'โรงเรียนสวนกุหลาบ' },
    
    created_at: '2024-12-03T08:45:00Z',
    updated_at: '2024-12-03T08:45:00Z',
  },
];

// QC Stats Helper
export function getQCStats(): QCStats {
  const records = mockQCRecords;
  const totalChecked = records.reduce((sum, r) => sum + r.checked_qty, 0);
  const totalPassed = records.reduce((sum, r) => sum + r.passed_qty, 0);
  
  return {
    total_records: records.length,
    pending_qc: 2, // mock
    failed_today: records.filter(r => r.failed_qty > 0).length,
    rework_in_progress: records.filter(r => r.rework_qty > 0 && r.follow_up_required).length,
    avg_pass_rate: totalChecked > 0 ? Math.round((totalPassed / totalChecked) * 100) : 0,
    avg_check_time_minutes: 45,
  };
}

// Get QC Records for Order
export function getQCRecordsForOrder(orderId: string): QCRecord[] {
  return mockQCRecords.filter(r => r.order_id === orderId);
}

// Get QC Records for Job
export function getQCRecordsForJob(jobId: string): QCRecord[] {
  return mockQCRecords.filter(r => r.job_id === jobId);
}

// =============================================
// PHASE 6: FINANCIAL MOCK DATA
// =============================================

import type {
  Quotation,
  Invoice,
  Receipt,
  FinancialSummary,
} from '../types/financial';

export const mockQuotations: Quotation[] = [
  {
    id: 'quot-001',
    quotation_number: 'QT-2024-0001',
    order_id: 'order-001',
    customer_id: 'cust-001',
    customer_name: 'บริษัท ABC จำกัด',
    customer_email: 'contact@abc.com',
    customer_phone: '02-123-4567',
    status: 'converted',
    valid_from: '2024-11-25',
    valid_until: '2024-12-05',
    items: [
      { id: 'qi-001', description: 'เสื้อโปโลขาว + DTF หน้าอก', quantity: 50, unit: 'ตัว', unit_price: 79, total_price: 3950 },
    ],
    subtotal: 3950,
    discount_amount: 0,
    tax_amount: 0,
    shipping_cost: 0,
    total_amount: 3950,
    payment_terms: 'มัดจำ 50%',
    sent_at: '2024-11-25T10:00:00Z',
    viewed_at: '2024-11-25T11:00:00Z',
    accepted_at: '2024-11-26T09:00:00Z',
    converted_to_order_id: 'order-001',
    converted_at: '2024-11-26T10:00:00Z',
    created_by: 'user-001',
    created_at: '2024-11-25T09:00:00Z',
    updated_at: '2024-11-26T10:00:00Z',
  },
  {
    id: 'quot-002',
    quotation_number: 'QT-2024-0002',
    customer_id: 'cust-003',
    customer_name: 'บริษัท XYZ จำกัด',
    customer_email: 'order@xyz.com',
    status: 'sent',
    valid_from: '2024-12-01',
    valid_until: '2024-12-15',
    items: [
      { id: 'qi-002', description: 'เสื้อทีมฟุตบอล ซับลิเมชั่น', quantity: 30, unit: 'ตัว', unit_price: 350, total_price: 10500 },
      { id: 'qi-003', description: 'กางเกงทีมฟุตบอล ซับลิเมชั่น', quantity: 30, unit: 'ตัว', unit_price: 280, total_price: 8400 },
    ],
    subtotal: 18900,
    discount_percent: 5,
    discount_amount: 945,
    tax_amount: 0,
    shipping_cost: 0,
    total_amount: 17955,
    payment_terms: 'ชำระเต็มจำนวน',
    sent_at: '2024-12-01T14:00:00Z',
    viewed_at: '2024-12-02T09:00:00Z',
    created_by: 'user-001',
    created_at: '2024-12-01T13:00:00Z',
    updated_at: '2024-12-02T09:00:00Z',
  },
];

export const mockInvoices: Invoice[] = [
  {
    id: 'inv-001',
    invoice_number: 'INV-2024-0001',
    order_id: 'order-001',
    order_number: 'ORD-2024-0001',
    customer_id: 'cust-001',
    customer_name: 'บริษัท ABC จำกัด',
    customer_email: 'contact@abc.com',
    billing_address: '123 ถนนสุขุมวิท วัฒนา กรุงเทพฯ 10110',
    tax_id: '0123456789012',
    status: 'partial',
    invoice_date: '2024-12-01',
    due_date: '2024-12-15',
    items: [
      { id: 'ii-001', description: 'เสื้อโปโลขาว + DTF หน้าอก', quantity: 50, unit: 'ตัว', unit_price: 79, total_price: 3950 },
    ],
    subtotal: 3950,
    discount_amount: 0,
    tax_percent: 0,
    tax_amount: 0,
    total_amount: 3950,
    paid_amount: 2000,
    remaining_amount: 1950,
    payment_terms: 'มัดจำ 50% ที่เหลือจ่ายก่อนส่งของ',
    sent_at: '2024-12-01T12:00:00Z',
    is_tax_invoice: false,
    order: { order_number: 'ORD-2024-0001', customer_name: 'บริษัท ABC จำกัด' },
    created_at: '2024-12-01T11:00:00Z',
    updated_at: '2024-12-01T14:00:00Z',
  },
  {
    id: 'inv-002',
    invoice_number: 'INV-2024-0002',
    order_id: 'order-002',
    order_number: 'ORD-2024-0002',
    customer_id: 'cust-002',
    customer_name: 'คุณวิภา ใจดี',
    customer_phone: '089-876-5432',
    status: 'paid',
    invoice_date: '2024-11-28',
    due_date: '2024-12-05',
    items: [
      { id: 'ii-002', description: 'เสื้อยืดคอวีสีกรม + DTF หน้าอก', quantity: 100, unit: 'ตัว', unit_price: 95, total_price: 9500 },
    ],
    subtotal: 9500,
    discount_amount: 0,
    tax_amount: 0,
    total_amount: 9500,
    paid_amount: 9500,
    remaining_amount: 0,
    sent_at: '2024-11-28T10:00:00Z',
    paid_at: '2024-11-29T09:00:00Z',
    is_tax_invoice: false,
    order: { order_number: 'ORD-2024-0002', customer_name: 'คุณวิภา ใจดี' },
    created_at: '2024-11-28T09:00:00Z',
    updated_at: '2024-11-29T09:00:00Z',
  },
  {
    id: 'inv-003',
    invoice_number: 'INV-2024-0003',
    order_id: 'order-003',
    order_number: 'ORD-2024-0003',
    customer_id: 'cust-003',
    customer_name: 'โรงเรียนสวนกุหลาบ',
    billing_address: 'กรุงเทพมหานคร',
    tax_id: '0994000123456',
    status: 'paid',
    invoice_date: '2024-12-02',
    due_date: '2024-12-16',
    items: [
      { id: 'ii-003', description: 'เสื้อโปโลนักเรียน + สกรีนโลโก้', quantity: 200, unit: 'ตัว', unit_price: 120, total_price: 24000 },
    ],
    subtotal: 24000,
    discount_amount: 0,
    tax_percent: 7,
    tax_amount: 1680,
    total_amount: 25680,
    paid_amount: 25680,
    remaining_amount: 0,
    sent_at: '2024-12-02T11:00:00Z',
    paid_at: '2024-12-02T14:00:00Z',
    is_tax_invoice: true,
    tax_invoice_number: 'TAX-2024-0001',
    order: { order_number: 'ORD-2024-0003', customer_name: 'โรงเรียนสวนกุหลาบ' },
    created_at: '2024-12-02T10:00:00Z',
    updated_at: '2024-12-02T14:00:00Z',
  },
];

export const mockReceipts: Receipt[] = [
  {
    id: 'rcpt-001',
    receipt_number: 'RCP-2024-0001',
    invoice_id: 'inv-001',
    order_id: 'order-001',
    payment_id: 'pay-001',
    customer_name: 'บริษัท ABC จำกัด',
    amount: 2000,
    payment_method: 'bank_transfer',
    payment_date: '2024-12-01',
    reference_number: 'TRF-001',
    is_tax_receipt: false,
    notes: 'มัดจำ 50%',
    created_at: '2024-12-01T15:00:00Z',
  },
  {
    id: 'rcpt-002',
    receipt_number: 'RCP-2024-0002',
    invoice_id: 'inv-002',
    order_id: 'order-002',
    payment_id: 'pay-002',
    customer_name: 'คุณวิภา ใจดี',
    amount: 9500,
    payment_method: 'bank_transfer',
    payment_date: '2024-11-29',
    is_tax_receipt: false,
    notes: 'ชำระเต็มจำนวน',
    created_at: '2024-11-29T10:00:00Z',
  },
  {
    id: 'rcpt-003',
    receipt_number: 'RCP-2024-0003',
    invoice_id: 'inv-003',
    order_id: 'order-003',
    payment_id: 'pay-003',
    customer_name: 'โรงเรียนสวนกุหลาบ',
    customer_address: 'กรุงเทพมหานคร',
    tax_id: '0994000123456',
    amount: 25680,
    payment_method: 'bank_transfer',
    payment_date: '2024-12-02',
    is_tax_receipt: true,
    notes: 'ใบกำกับภาษี',
    created_at: '2024-12-02T15:00:00Z',
  },
];

// Financial Summary Helper
export function getFinancialSummary(): FinancialSummary {
  const totalRevenue = mockInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
  const paidRevenue = mockInvoices.reduce((sum, inv) => sum + inv.paid_amount, 0);
  const pendingRevenue = mockInvoices.filter(inv => inv.status === 'sent' || inv.status === 'partial').reduce((sum, inv) => sum + inv.remaining_amount, 0);
  const overdueRevenue = mockInvoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.remaining_amount, 0);
  
  return {
    period: {
      from: '2024-12-01',
      to: '2024-12-31',
    },
    revenue: {
      total: totalRevenue,
      paid: paidRevenue,
      pending: pendingRevenue,
      overdue: overdueRevenue,
    },
    invoices: {
      total: mockInvoices.length,
      draft: mockInvoices.filter(i => i.status === 'draft').length,
      sent: mockInvoices.filter(i => i.status === 'sent' || i.status === 'partial').length,
      paid: mockInvoices.filter(i => i.status === 'paid').length,
      overdue: mockInvoices.filter(i => i.status === 'overdue').length,
    },
    quotations: {
      total: mockQuotations.length,
      pending: mockQuotations.filter(q => q.status === 'sent' || q.status === 'viewed').length,
      accepted: mockQuotations.filter(q => q.status === 'accepted' || q.status === 'converted').length,
      conversion_rate: 50,
    },
    payments: {
      total_received: paidRevenue,
      by_method: [
        { method: 'bank_transfer', amount: paidRevenue, count: mockReceipts.length },
      ],
    },
  };
}

