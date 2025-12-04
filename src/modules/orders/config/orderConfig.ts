// =============================================
// ORDER CONFIGURATION - ตั้งค่าระบบออเดอร์
// =============================================

// ประเภทออเดอร์หลัก
export const ORDER_TYPES = [
  {
    id: 'print_stock',
    name: 'พิมพ์เสื้อจากสต็อก',
    name_en: 'Print on Stock',
    icon: '👕',
    description: 'เลือกเสื้อจากสต็อก + เลือกงานพิมพ์',
    features: ['เลือกเสื้อ', 'เลือกงานพิมพ์', 'เลือก Add-on'],
    requires_stock: true,
    requires_design: true,
  },
  {
    id: 'custom_cut',
    name: 'สั่งตัดเสื้อ',
    name_en: 'Custom Cut',
    icon: '✂️',
    description: 'ออกแบบเสื้อเอง + ตัดเย็บ + พิมพ์',
    features: ['ออกแบบเสื้อ', 'ตัดเย็บ', 'งานพิมพ์', 'Add-on'],
    requires_stock: false,
    requires_design: true,
  },
  {
    id: 'ready_made',
    name: 'เสื้อสำเร็จรูป',
    name_en: 'Ready Made',
    icon: '🎁',
    description: 'ซื้อเสื้อจากสต็อกอย่างเดียว',
    features: ['เลือกเสื้อ', 'Add-on'],
    requires_stock: true,
    requires_design: false,
  },
  {
    id: 'print_only',
    name: 'รับพิมพ์อย่างเดียว',
    name_en: 'Print Only',
    icon: '🖨️',
    description: 'ลูกค้าส่งเสื้อมาเอง เราพิมพ์ให้',
    features: ['งานพิมพ์', 'Add-on'],
    requires_stock: false,
    requires_design: true,
  },
];

// ประเภทงานพิมพ์
export const PRINT_METHODS = [
  {
    id: 'dtg',
    name: 'พิมพ์ DTG',
    name_en: 'Direct to Garment',
    icon: '🖨️',
    description: 'พิมพ์ดิจิตอลลงเนื้อผ้าโดยตรง',
    pros: ['สีสันสดใส', 'รายละเอียดสูง', 'ทำจำนวนน้อยได้'],
    cons: ['ราคาสูงกว่าสกรีน', 'ไม่เหมาะกับผ้าโพลีฯ'],
    suitable_for: ['cotton', 'cvc'],
    min_quantity: 1,
    base_price: 50,
    color_limit: null, // Full color
    production_time_days: 1,
  },
  {
    id: 'dtf',
    name: 'พิมพ์ DTF',
    name_en: 'Direct to Film',
    icon: '📄',
    description: 'พิมพ์ลงฟิล์มแล้วรีดติดผ้า',
    pros: ['ใช้ได้กับทุกเนื้อผ้า', 'สีสด', 'ทนทาน'],
    cons: ['สัมผัสฟิล์มเล็กน้อย'],
    suitable_for: ['cotton', 'cvc', 'polyester', 'tc'],
    min_quantity: 1,
    base_price: 40,
    color_limit: null,
    production_time_days: 1,
  },
  {
    id: 'screen',
    name: 'สกรีน',
    name_en: 'Screen Print',
    icon: '🎨',
    description: 'พิมพ์สกรีนแบบดั้งเดิม',
    pros: ['ราคาถูกเมื่อทำจำนวนมาก', 'ทนทาน', 'สีสดมาก'],
    cons: ['เสียค่าบล็อค', 'จำกัดจำนวนสี'],
    suitable_for: ['cotton', 'cvc', 'polyester', 'tc'],
    min_quantity: 30,
    base_price: 20,
    color_limit: 6,
    setup_cost: 300, // ค่าบล็อคต่อสี
    production_time_days: 3,
  },
  {
    id: 'sublimation',
    name: 'ซับลิเมชั่น',
    name_en: 'Sublimation',
    icon: '🌈',
    description: 'พิมพ์ระเหิดสีลงเนื้อผ้า',
    pros: ['Full wrap ได้', 'สีไม่หลุดลอก', 'รายละเอียดสูง'],
    cons: ['ใช้ได้กับโพลีเอสเตอร์/ผ้าขาวเท่านั้น'],
    suitable_for: ['polyester'],
    min_quantity: 1,
    base_price: 60,
    color_limit: null,
    production_time_days: 1,
  },
  {
    id: 'embroidery',
    name: 'ปัก',
    name_en: 'Embroidery',
    icon: '🧵',
    description: 'ปักด้ายลงเนื้อผ้า',
    pros: ['ดูพรีเมียม', 'ทนทานมาก', 'เหมาะกับโลโก้'],
    cons: ['ราคาสูง', 'จำกัดรายละเอียด'],
    suitable_for: ['cotton', 'cvc', 'polyester', 'tc'],
    min_quantity: 1,
    base_price: 100,
    color_limit: 12,
    setup_cost: 500, // ค่าทำแพทเทิร์น
    production_time_days: 2,
  },
  {
    id: 'vinyl',
    name: 'ไวนิล/เฟล็กซ์',
    name_en: 'Vinyl/Flex',
    icon: '✨',
    description: 'ตัดแผ่นไวนิลแล้วรีดติด',
    pros: ['สีเงา/สีพิเศษได้', 'เหมาะกับตัวอักษร'],
    cons: ['ไม่เหมาะกับลายซับซ้อน'],
    suitable_for: ['cotton', 'cvc', 'polyester', 'tc'],
    min_quantity: 1,
    base_price: 30,
    color_limit: 3,
    production_time_days: 1,
  },
];

// ตำแหน่งพิมพ์
export const PRINT_POSITIONS = [
  { id: 'front_center', name: 'หน้าอก (กลาง)', name_en: 'Front Center', icon: '⬜' },
  { id: 'front_left', name: 'หน้าอก (ซ้าย)', name_en: 'Front Left', icon: '◀️' },
  { id: 'front_right', name: 'หน้าอก (ขวา)', name_en: 'Front Right', icon: '▶️' },
  { id: 'back_center', name: 'หลัง (กลาง)', name_en: 'Back Center', icon: '🔲' },
  { id: 'back_top', name: 'หลัง (บน)', name_en: 'Back Top', icon: '⬆️' },
  { id: 'left_sleeve', name: 'แขนซ้าย', name_en: 'Left Sleeve', icon: '💪' },
  { id: 'right_sleeve', name: 'แขนขวา', name_en: 'Right Sleeve', icon: '💪' },
  { id: 'collar', name: 'ปก/คอ', name_en: 'Collar', icon: '👔' },
  { id: 'hem', name: 'ชายเสื้อ', name_en: 'Hem', icon: '⬇️' },
  { id: 'full_front', name: 'เต็มหน้า', name_en: 'Full Front', icon: '📐' },
  { id: 'full_back', name: 'เต็มหลัง', name_en: 'Full Back', icon: '📐' },
];

// ขนาดพิมพ์
export const PRINT_SIZES = [
  { id: 'xs', name: 'XS (5x5 cm)', width: 5, height: 5, price_modifier: 0.5 },
  { id: 's', name: 'S (10x10 cm)', width: 10, height: 10, price_modifier: 0.7 },
  { id: 'm', name: 'M (15x15 cm)', width: 15, height: 15, price_modifier: 1.0 },
  { id: 'l', name: 'L (20x20 cm)', width: 20, height: 20, price_modifier: 1.3 },
  { id: 'xl', name: 'XL (25x30 cm)', width: 25, height: 30, price_modifier: 1.6 },
  { id: 'xxl', name: 'XXL (30x40 cm)', width: 30, height: 40, price_modifier: 2.0 },
  { id: 'a4', name: 'A4 (21x29.7 cm)', width: 21, height: 29.7, price_modifier: 1.5 },
  { id: 'a3', name: 'A3 (29.7x42 cm)', width: 29.7, height: 42, price_modifier: 2.5 },
  { id: 'full', name: 'เต็มตัว', width: 40, height: 50, price_modifier: 3.0 },
];

// รุ่นเสื้อ
export const SHIRT_MODELS = [
  { id: 'round_neck', name: 'คอกลม', name_en: 'Round Neck', icon: '👕' },
  { id: 'v_neck', name: 'คอวี', name_en: 'V-Neck', icon: '👔' },
  { id: 'polo', name: 'โปโล', name_en: 'Polo', icon: '👕' },
  { id: 'hoodie', name: 'ฮู้ดดี้', name_en: 'Hoodie', icon: '🧥' },
  { id: 'jacket', name: 'แจ็คเก็ต', name_en: 'Jacket', icon: '🧥' },
  { id: 'tank_top', name: 'เสื้อกล้าม', name_en: 'Tank Top', icon: '🎽' },
  { id: 'long_sleeve', name: 'แขนยาว', name_en: 'Long Sleeve', icon: '👕' },
  { id: 'raglan', name: 'แร็กแลน', name_en: 'Raglan', icon: '👕' },
  { id: 'oversize', name: 'โอเวอร์ไซส์', name_en: 'Oversize', icon: '👕' },
  { id: 'crop_top', name: 'ครอปท็อป', name_en: 'Crop Top', icon: '👚' },
];

// เนื้อผ้า
export const FABRIC_TYPES = [
  { 
    id: 'cotton100', 
    name: 'Cotton 100%', 
    description: 'ผ้าฝ้าย 100% นุ่ม ระบายอากาศดี',
    gsm_range: '160-200',
    price_modifier: 1.0,
    suitable_prints: ['dtg', 'dtf', 'screen', 'embroidery', 'vinyl'],
  },
  { 
    id: 'cvc', 
    name: 'CVC (60/40)', 
    description: 'ผสม Cotton 60% Polyester 40%',
    gsm_range: '160-180',
    price_modifier: 0.9,
    suitable_prints: ['dtg', 'dtf', 'screen', 'embroidery', 'vinyl'],
  },
  { 
    id: 'tc', 
    name: 'TC (35/65)', 
    description: 'ผสม Cotton 35% Polyester 65%',
    gsm_range: '140-160',
    price_modifier: 0.8,
    suitable_prints: ['dtf', 'screen', 'sublimation', 'embroidery', 'vinyl'],
  },
  { 
    id: 'polyester', 
    name: 'Polyester 100%', 
    description: 'โพลีเอสเตอร์ 100% แห้งเร็ว',
    gsm_range: '140-180',
    price_modifier: 0.85,
    suitable_prints: ['dtf', 'sublimation', 'embroidery', 'vinyl'],
  },
  { 
    id: 'dryfit', 
    name: 'Dry-Fit', 
    description: 'ผ้ากีฬา ระบายเหงื่อดี',
    gsm_range: '120-160',
    price_modifier: 1.2,
    suitable_prints: ['dtf', 'sublimation', 'vinyl'],
  },
  { 
    id: 'jersey', 
    name: 'Jersey', 
    description: 'ผ้ายืดเนื้อดี นิ่ม',
    gsm_range: '180-220',
    price_modifier: 1.3,
    suitable_prints: ['dtg', 'dtf', 'screen', 'embroidery'],
  },
];

// ไซส์เสื้อ
export const SHIRT_SIZES = [
  { id: 'xs', name: 'XS', chest: 34, length: 26 },
  { id: 's', name: 'S', chest: 36, length: 27 },
  { id: 'm', name: 'M', chest: 38, length: 28 },
  { id: 'l', name: 'L', chest: 40, length: 29 },
  { id: 'xl', name: 'XL', chest: 42, length: 30 },
  { id: '2xl', name: '2XL', chest: 44, length: 31 },
  { id: '3xl', name: '3XL', chest: 46, length: 32 },
  { id: '4xl', name: '4XL', chest: 48, length: 33 },
  { id: '5xl', name: '5XL', chest: 50, length: 34 },
];

// สีเสื้อพื้นฐาน
export const SHIRT_COLORS = [
  { id: 'white', name: 'ขาว', hex: '#FFFFFF' },
  { id: 'black', name: 'ดำ', hex: '#000000' },
  { id: 'navy', name: 'กรมท่า', hex: '#000080' },
  { id: 'red', name: 'แดง', hex: '#FF0000' },
  { id: 'royal_blue', name: 'น้ำเงิน', hex: '#4169E1' },
  { id: 'green', name: 'เขียว', hex: '#008000' },
  { id: 'yellow', name: 'เหลือง', hex: '#FFFF00' },
  { id: 'orange', name: 'ส้ม', hex: '#FFA500' },
  { id: 'pink', name: 'ชมพู', hex: '#FFC0CB' },
  { id: 'purple', name: 'ม่วง', hex: '#800080' },
  { id: 'gray', name: 'เทา', hex: '#808080' },
  { id: 'brown', name: 'น้ำตาล', hex: '#8B4513' },
  { id: 'cream', name: 'ครีม', hex: '#FFFDD0' },
  { id: 'maroon', name: 'เลือดหมู', hex: '#800000' },
];

// Add-ons / บริการเสริม
export const ADDONS = [
  {
    id: 'individual_bag',
    name: 'ถุงใส่เสื้อแยกตัว',
    name_en: 'Individual Bag',
    icon: '🛍️',
    price: 5,
    description: 'ถุงพลาสติกใส่เสื้อแยกทุกตัว',
  },
  {
    id: 'box_packaging',
    name: 'กล่องบรรจุ',
    name_en: 'Box Packaging',
    icon: '📦',
    price: 30,
    description: 'กล่องกระดาษแข็งพร้อมโลโก้',
  },
  {
    id: 'hang_tag',
    name: 'แท็กห้อย',
    name_en: 'Hang Tag',
    icon: '🏷️',
    price: 10,
    description: 'แท็กห้อยพร้อมเชือก',
  },
  {
    id: 'woven_label',
    name: 'ป้ายทอ',
    name_en: 'Woven Label',
    icon: '🏷️',
    price: 15,
    description: 'ป้ายทอติดคอ/ข้าง',
    setup_cost: 500,
    min_quantity: 100,
  },
  {
    id: 'printed_label',
    name: 'ป้ายพิมพ์',
    name_en: 'Printed Label',
    icon: '📝',
    price: 8,
    description: 'ป้ายพิมพ์ติดคอ/ข้าง',
  },
  {
    id: 'size_label',
    name: 'ป้ายไซส์',
    name_en: 'Size Label',
    icon: '📏',
    price: 3,
    description: 'ป้ายบอกไซส์',
  },
  {
    id: 'care_label',
    name: 'ป้ายวิธีซัก',
    name_en: 'Care Label',
    icon: '🧺',
    price: 5,
    description: 'ป้ายคำแนะนำการดูแลรักษา',
  },
  {
    id: 'folding',
    name: 'พับใส่ถุงแบน',
    name_en: 'Flat Folding',
    icon: '📋',
    price: 3,
    description: 'พับเสื้อแบบแบนใส่ถุง',
  },
  {
    id: 'gift_wrap',
    name: 'ห่อของขวัญ',
    name_en: 'Gift Wrap',
    icon: '🎁',
    price: 50,
    description: 'ห่อกระดาษพร้อมริบบิ้น',
  },
];

// Production Steps
export const PRODUCTION_STEPS = {
  print_stock: [
    { id: 'prepare_material', name: 'เตรียมวัตถุดิบ', duration_hours: 2 },
    { id: 'printing', name: 'พิมพ์/สกรีน', duration_hours: 4 },
    { id: 'quality_check', name: 'ตรวจคุณภาพ', duration_hours: 1 },
    { id: 'packaging', name: 'แพ็คสินค้า', duration_hours: 1 },
  ],
  custom_cut: [
    { id: 'pattern_design', name: 'ออกแบบแพทเทิร์น', duration_hours: 4 },
    { id: 'fabric_cutting', name: 'ตัดผ้า', duration_hours: 4 },
    { id: 'sewing', name: 'เย็บ', duration_hours: 8 },
    { id: 'printing', name: 'พิมพ์/สกรีน', duration_hours: 4 },
    { id: 'finishing', name: 'ตกแต่ง/เก็บงาน', duration_hours: 2 },
    { id: 'quality_check', name: 'ตรวจคุณภาพ', duration_hours: 1 },
    { id: 'packaging', name: 'แพ็คสินค้า', duration_hours: 1 },
  ],
  ready_made: [
    { id: 'prepare_stock', name: 'เตรียมสินค้า', duration_hours: 1 },
    { id: 'quality_check', name: 'ตรวจคุณภาพ', duration_hours: 0.5 },
    { id: 'packaging', name: 'แพ็คสินค้า', duration_hours: 0.5 },
  ],
  print_only: [
    { id: 'receive_garment', name: 'รับเสื้อจากลูกค้า', duration_hours: 0 },
    { id: 'printing', name: 'พิมพ์/สกรีน', duration_hours: 4 },
    { id: 'quality_check', name: 'ตรวจคุณภาพ', duration_hours: 1 },
    { id: 'packaging', name: 'แพ็คสินค้า', duration_hours: 1 },
  ],
};

// Helper: Calculate print price
export function calculatePrintPrice(
  method: string,
  size: string,
  quantity: number,
  colors?: number
): { unitPrice: number; setupCost: number; totalPrice: number } {
  const printMethod = PRINT_METHODS.find(m => m.id === method);
  const printSize = PRINT_SIZES.find(s => s.id === size);
  
  if (!printMethod || !printSize) {
    return { unitPrice: 0, setupCost: 0, totalPrice: 0 };
  }
  
  let unitPrice = printMethod.base_price * printSize.price_modifier;
  let setupCost = 0;
  
  // Screen printing has setup cost per color
  if (method === 'screen' && colors && printMethod.setup_cost) {
    setupCost = printMethod.setup_cost * colors;
    // Unit price decreases with quantity for screen printing
    if (quantity >= 100) unitPrice *= 0.7;
    else if (quantity >= 50) unitPrice *= 0.85;
  }
  
  // Embroidery has setup cost
  if (method === 'embroidery' && printMethod.setup_cost) {
    setupCost = printMethod.setup_cost;
  }
  
  const totalPrice = (unitPrice * quantity) + setupCost;
  
  return { unitPrice, setupCost, totalPrice };
}

// Helper: Estimate production time
export function estimateProductionTime(
  orderType: string,
  quantity: number,
  printMethods: string[]
): { days: number; hours: number } {
  const steps = PRODUCTION_STEPS[orderType as keyof typeof PRODUCTION_STEPS] || [];
  let totalHours = steps.reduce((sum, step) => sum + step.duration_hours, 0);
  
  // Add time based on quantity
  const quantityMultiplier = Math.ceil(quantity / 50);
  totalHours *= quantityMultiplier;
  
  // Add time based on print methods
  printMethods.forEach(method => {
    const printMethod = PRINT_METHODS.find(m => m.id === method);
    if (printMethod) {
      totalHours += (printMethod.production_time_days * 8);
    }
  });
  
  const days = Math.ceil(totalHours / 8);
  const hours = totalHours % 8;
  
  return { days, hours };
}

