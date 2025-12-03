import { Product, ProductFormData } from '../types';

// CSV Headers - ตามที่ลูกค้าต้องการ (รวม SKU หลักและรอง)
const PRODUCT_CSV_HEADERS = [
  'SKU หลัก',
  'SKU รอง',
  'รุ่นเสื้อ',
  'สี',
  'ไซส์',
  'ต้นทุนต่อหน่วย',
  'ราคาขายต่อหน่วย',
];

// Headers สำหรับ Export (รวมจำนวนสต๊อก)
const PRODUCT_EXPORT_HEADERS = [
  'SKU หลัก',
  'SKU รอง',
  'รุ่นเสื้อ',
  'สี',
  'ไซส์',
  'ต้นทุนต่อหน่วย',
  'ราคาขายต่อหน่วย',
  'จำนวนคงเหลือ',
  'จุดสั่งซื้อ',
];

// รองรับชื่อคอลัมน์หลายรูปแบบ
const PRODUCT_FIELD_MAP: Record<string, keyof Product | string> = {
  // SKU หลัก
  'SKU หลัก': 'main_sku',
  'sku หลัก': 'main_sku',
  'SKU_หลัก': 'main_sku',
  'main_sku': 'main_sku',
  'MainSKU': 'main_sku',
  
  // SKU รอง
  'SKU รอง': 'sku',
  'sku รอง': 'sku',
  'SKU_รอง': 'sku',
  'SKU': 'sku',
  'sku': 'sku',
  
  // รุ่นเสื้อ
  'รุ่นเสื้อ': 'model',
  'รุ่น': 'model',
  'Model': 'model',
  'model': 'model',
  'ชื่อ': 'model',
  
  // สี
  'สี': 'color',
  'Color': 'color',
  'color': 'color',
  
  // ไซส์
  'ไซส์': 'size',
  'Size': 'size',
  'size': 'size',
  
  // ต้นทุน
  'ต้นทุนต่อหน่วย': 'cost',
  'ต้นทุน': 'cost',
  'Cost': 'cost',
  'cost': 'cost',
  
  // ราคาขาย
  'ราคาขายต่อหน่วย': 'price',
  'ราคาขาย': 'price',
  'ราคาขายต่อ': 'price',
  'Price': 'price',
  'price': 'price',
  
  // จำนวน
  'จำนวนคงเหลือ': 'quantity',
  'จำนวน': 'quantity',
  'Quantity': 'quantity',
  'quantity': 'quantity',
  
  // จุดสั่งซื้อ
  'จุดสั่งซื้อ': 'min_level',
  'Reorder': 'min_level',
  'min_level': 'min_level',
};

/**
 * Convert products array to CSV string
 */
export function productsToCSV(products: Product[]): string {
  const rows: string[] = [];
  
  // Add headers
  rows.push(PRODUCT_EXPORT_HEADERS.join(','));
  
  // Add data rows
  products.forEach((product) => {
    const row = [
      escapeCSV(product.main_sku),
      escapeCSV(product.sku),
      escapeCSV(product.model),
      escapeCSV(product.color),
      escapeCSV(product.size),
      product.cost.toString(),
      product.price.toString(),
      product.quantity.toString(),
      product.min_level.toString(),
    ];
    rows.push(row.join(','));
  });
  
  return rows.join('\n');
}

/**
 * Parse CSV string to product data array
 */
export function csvToProducts(csvString: string): ProductFormData[] {
  const lines = csvString.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error('ไฟล์ CSV ต้องมีหัวตารางและข้อมูลอย่างน้อย 1 แถว');
  }
  
  // Parse headers
  const headers = parseCSVLine(lines[0]);
  
  // Check if headers map to required fields
  const mappedFields = headers.map(h => PRODUCT_FIELD_MAP[h.trim()]).filter(Boolean);
  const requiredFields = ['sku', 'model', 'color', 'size'];
  const missingFields = requiredFields.filter(f => !mappedFields.includes(f));
  
  if (missingFields.length > 0) {
    const fieldNames: Record<string, string> = {
      'sku': 'SKU รอง',
      'model': 'รุ่นเสื้อ',
      'color': 'สี',
      'size': 'ไซส์'
    };
    throw new Error(`ไม่พบคอลัมน์ที่จำเป็น: ${missingFields.map(f => fieldNames[f]).join(', ')}`);
  }
  
  // Parse data rows
  const products: ProductFormData[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    
    if (values.length !== headers.length) {
      console.warn(`แถวที่ ${i + 1} มีจำนวนคอลัมน์ไม่ตรงกับหัวตาราง`);
      continue;
    }
    
    const product: ProductFormData = {
      main_sku: '',
      sku: '',
      model: '',
      color: '',
      size: '',
      cost: 0,
      price: 0,
      quantity: 0,
      min_level: 10,
    };
    
    headers.forEach((header, index) => {
      const field = PRODUCT_FIELD_MAP[header];
      const value = values[index]?.trim() || '';
      
      if (field) {
        if (['cost', 'price', 'quantity', 'min_level'].includes(field)) {
          (product as any)[field] = parseFloat(value) || 0;
        } else {
          (product as any)[field] = value;
        }
      }
    });
    
    // Auto-generate main_sku if missing (use first part of sku)
    if (!product.main_sku && product.sku) {
      const parts = product.sku.split('-');
      product.main_sku = parts[0] || product.sku;
    }
    
    // Validate required fields
    if (product.sku && product.model && product.color && product.size) {
      // Ensure main_sku exists
      if (!product.main_sku) {
        product.main_sku = product.sku;
      }
      products.push(product);
    }
  }
  
  return products;
}

/**
 * Escape CSV field value
 */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // Add BOM for Thai character support in Excel
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate CSV template for import
 */
export function generateImportTemplate(): string {
  const headers = PRODUCT_CSV_HEADERS.join(',');
  const exampleRow = [
    'HP001',
    'HP001-ข-M',
    'Hiptrack',
    'ขาว',
    'M',
    '55',
    '120',
  ].join(',');
  
  return `${headers}\n${exampleRow}`;
}
