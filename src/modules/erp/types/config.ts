// =============================================
// CONFIG TYPES
// =============================================
// Types for configuration data (customers, products, settings)
// =============================================

import type { Address } from './common';

// ---------------------------------------------
// Customer
// ---------------------------------------------

export type CustomerTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type CustomerType = 'individual' | 'company';

export interface Customer {
  id: string;
  code: string;
  type: CustomerType;
  name: string;
  company_name?: string;
  contact_name?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  line_id?: string;
  facebook?: string;
  instagram?: string;
  tax_id?: string;
  tier: CustomerTier;
  credit_days?: number;
  credit_limit?: number;
  default_address?: Address;
  billing_address?: Address;
  total_orders?: number;
  total_spent?: number;
  last_order_date?: string;
  tags?: string[];
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CustomerInput {
  type: CustomerType;
  name: string;
  company_name?: string;
  contact_name?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  line_id?: string;
  tax_id?: string;
  tier?: CustomerTier;
  credit_days?: number;
  credit_limit?: number;
  default_address?: Address;
  notes?: string;
}

// ---------------------------------------------
// Product (สินค้าในสต๊อก)
// ---------------------------------------------

export type ProductCategory = 'tshirt' | 'polo' | 'sport' | 'jacket' | 'hoodie' | 'pants' | 'cap' | 'bag' | 'other';
export type ProductMaterial = 'cotton_100' | 'poly_cotton' | 'polyester' | 'nylon' | 'denim' | 'linen' | 'other';

export interface Product {
  id: string;
  sku: string;
  name: string;
  model: string;
  color: string;
  color_th: string;
  size: string;
  category: ProductCategory;
  material: ProductMaterial;
  weight_gsm?: number;
  cost: number;
  price: number;
  stock_qty: number;
  reserved_qty: number;
  available_qty: number;
  min_stock?: number;
  max_stock?: number;
  is_active: boolean;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProductVariant {
  model: string;
  colors: string[];
  sizes: string[];
  products: Product[];
}

// ---------------------------------------------
// Print Configuration
// ---------------------------------------------

export interface PrintPosition {
  id: string;
  code: string;
  name: string;
  name_th: string;
  description?: string;
  image_url?: string;
  sort_order: number;
  is_active?: boolean;
}

export interface PrintSize {
  id: string;
  code: string;
  name: string;
  name_th: string;
  width_cm?: number;
  height_cm?: number;
  price_modifier: number; // 1.0 = base price, 1.5 = 150% of base
  sort_order: number;
  is_active?: boolean;
}

// ---------------------------------------------
// Order Type (Production Mode)
// ---------------------------------------------

export type ProductionMode = 'in_house' | 'outsource' | 'hybrid';

export interface OrderTypeFeature {
  label: string;
  available: boolean;
}

export interface OrderType {
  id: string;
  code: string;
  name: string;
  name_th: string;
  description?: string;
  description_full?: string;
  icon?: string; // 'shirt' | 'scissors' | 'palette' | 'printer'
  requires_products: boolean; // ต้องเลือกสินค้าจาก stock หรือไม่
  requires_design: boolean; // ต้องมีงานออกแบบหรือไม่
  requires_fabric: boolean; // ต้องเลือกผ้าหรือไม่
  requires_pattern: boolean; // ต้องมี pattern หรือไม่
  default_production_mode: ProductionMode;
  lead_days_min?: number;
  lead_days_max?: number;
  workflow_steps?: string[];
  features?: OrderTypeFeature[];
  sort_order: number;
  is_active?: boolean;
}

// ---------------------------------------------
// Priority Level
// ---------------------------------------------

export interface PriorityLevel {
  id: string;
  code: string;
  name: string;
  name_th: string;
  level: number; // 0 = normal, 1 = rush, 2 = urgent, 3 = emergency
  surcharge_percent: number;
  min_lead_days: number;
  color: string;
  sort_order: number;
  is_active?: boolean;
}

// ---------------------------------------------
// Sales Channel
// ---------------------------------------------

export interface SalesChannel {
  code: string;
  name: string;
  name_th: string;
  icon?: string;
  is_active?: boolean;
}

// ---------------------------------------------
// Payment Terms
// ---------------------------------------------

export type PaymentTermsCode = 'full' | '50_50' | '30_70' | 'credit_7' | 'credit_15' | 'credit_30' | 'credit_45';

export interface PaymentTerms {
  code: PaymentTermsCode;
  name: string;
  name_th: string;
  deposit_percent: number;
  description?: string;
}

export const PAYMENT_TERMS: PaymentTerms[] = [
  { code: 'full', name: 'Full Payment', name_th: 'ชำระเต็มจำนวน', deposit_percent: 100 },
  { code: '50_50', name: '50/50', name_th: 'มัดจำ 50%', deposit_percent: 50 },
  { code: '30_70', name: '30/70', name_th: 'มัดจำ 30%', deposit_percent: 30 },
  { code: 'credit_7', name: 'Credit 7 Days', name_th: 'เครดิต 7 วัน', deposit_percent: 0 },
  { code: 'credit_15', name: 'Credit 15 Days', name_th: 'เครดิต 15 วัน', deposit_percent: 0 },
  { code: 'credit_30', name: 'Credit 30 Days', name_th: 'เครดิต 30 วัน', deposit_percent: 0 },
  { code: 'credit_45', name: 'Credit 45 Days', name_th: 'เครดิต 45 วัน', deposit_percent: 0 },
];

// ---------------------------------------------
// Work Category
// ---------------------------------------------

export interface WorkCategory {
  code: string;
  name: string;
  name_th: string;
  color: string;
  sort_order: number;
}

export const WORK_CATEGORIES: WorkCategory[] = [
  { code: 'printing', name: 'Printing', name_th: 'งานพิมพ์', color: '#007AFF', sort_order: 1 },
  { code: 'embroidery', name: 'Embroidery', name_th: 'งานปัก', color: '#5856D6', sort_order: 2 },
  { code: 'garment', name: 'Garment', name_th: 'งานตัดเย็บ', color: '#FF9500', sort_order: 3 },
  { code: 'labeling', name: 'Labeling', name_th: 'งานป้าย', color: '#34C759', sort_order: 4 },
  { code: 'packaging', name: 'Packaging', name_th: 'งานบรรจุ', color: '#FF3B30', sort_order: 5 },
  { code: 'finishing', name: 'Finishing', name_th: 'งานตกแต่ง', color: '#AF52DE', sort_order: 6 },
];

