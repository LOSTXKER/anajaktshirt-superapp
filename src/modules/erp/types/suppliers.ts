// =============================================
// SUPPLIER & OUTSOURCE TYPES
// =============================================

import type {
  SupplierStatus,
  PurchaseOrderStatus,
  PaymentStatus,
} from './enums';

import type {
  BaseEntity,
  AuditFields,
  Address,
  ContactInfo,
  UserRef,
  SupplierSnapshot,
  BaseFilters,
} from './common';

// ---------------------------------------------
// Supplier
// ---------------------------------------------

export interface Supplier extends BaseEntity {
  code: string;
  name: string;
  name_th?: string;

  // Contact
  contact: ContactInfo;
  address?: Address;
  
  // Aliases for convenient access
  contact_name?: string; // Alias for contact.name
  contact_phone?: string; // Alias for contact.phone
  contact_email?: string; // Alias for contact.email
  phone?: string; // Alias for contact.phone
  email?: string; // Alias for contact.email
  line_id?: string; // Alias for contact.line_id
  province?: string; // Alias for address.province
  postal_code?: string; // Alias for address.postal_code
  district?: string; // Alias for address.district

  // Business Info
  tax_id?: string;

  // Services
  service_types: string[];
  categories?: string[]; // Supplier categories (e.g., fabric, printing, sewing)

  // Terms
  default_lead_days: number;
  min_order_qty: number;
  payment_terms: string;

  // Performance Metrics
  rating: number;
  on_time_rate: number;
  quality_rate: number;
  total_orders: number;
  total_value: number;

  // Status
  status: SupplierStatus;
  is_active?: boolean; // Derived from status === 'active'

  notes?: string;
}

// ---------------------------------------------
// Supplier Pricing
// ---------------------------------------------

export interface SupplierPricing extends BaseEntity {
  supplier_id: string;

  service_type: string;
  item_name: string;
  item_code?: string;

  // Pricing Tiers
  price_tiers: PriceTier[];

  // Unit
  price_unit: string;

  // Setup Fees
  setup_fee: number;
  setup_fee_description?: string;

  // Lead Time
  lead_days: number;

  is_active: boolean;
  valid_from?: string;
  valid_until?: string;

  notes?: string;
}

export interface PriceTier {
  min_qty: number;
  max_qty?: number;
  unit_price: number;
}

// ---------------------------------------------
// Purchase Order
// ---------------------------------------------

export interface PurchaseOrder extends BaseEntity, AuditFields {
  po_number: string;

  // Supplier
  supplier_id?: string;
  supplier_snapshot: SupplierSnapshot;

  // Link to Order
  order_id?: string;
  order_number?: string;

  // Dates
  po_date: string;
  expected_date?: string;
  actual_delivery_date?: string;

  // Status
  status: PurchaseOrderStatus;

  // Amounts
  subtotal: number;
  setup_fees: number;
  shipping_cost: number;
  discount: number;
  total_amount: number;

  // Payment
  payment_status: PaymentStatus;
  payment_terms?: string;
  paid_amount: number;
  payment_due_date?: string;

  // Delivery
  delivery_method?: string;
  tracking_number?: string;

  // Files
  design_files?: string[];
  spec_file_url?: string;
  po_pdf_url?: string;

  // Communication
  sent_via?: string;
  sent_at?: string;
  confirmed_at?: string;

  // Notes
  internal_notes?: string;
  supplier_notes?: string;

  // Relations
  supplier?: Supplier;
  items?: PurchaseOrderItem[];
  logs?: PurchaseOrderLog[];
  receiving?: GoodsReceiving[];
}

// ---------------------------------------------
// Purchase Order Item
// ---------------------------------------------

export interface PurchaseOrderItem extends BaseEntity {
  po_id: string;

  // Link to order work item or addon
  order_work_item_id?: string;
  order_addon_id?: string;

  // Item Info
  item_description: string;
  service_type?: string;
  specifications?: string;

  // Quantity & Price
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;

  // Received
  received_qty: number;
  qc_passed_qty: number;
  qc_failed_qty: number;

  // Design
  design_file_url?: string;

  notes?: string;
  sort_order: number;
}

// ---------------------------------------------
// Purchase Order Log
// ---------------------------------------------

export interface PurchaseOrderLog extends BaseEntity {
  po_id: string;

  action: string;
  from_status?: string;
  to_status?: string;

  details?: Record<string, unknown>;
  notes?: string;

  performed_by?: string;
  performed_at: string;

  // Relations
  user?: UserRef;
}

// ---------------------------------------------
// Goods Receiving
// ---------------------------------------------

export interface GoodsReceiving extends BaseEntity {
  gr_number: string;
  po_id: string;

  // Received
  received_date: string;
  received_by?: string;

  // Quantities
  total_expected_qty: number;
  total_received_qty: number;

  // Status
  status: string;

  // Files
  delivery_note_url?: string;
  photo_urls?: string[];

  // Notes
  notes?: string;
  issues?: string;

  // Relations
  items?: GoodsReceivingItem[];
  receiver?: UserRef;
}

// ---------------------------------------------
// Goods Receiving Item
// ---------------------------------------------

export interface GoodsReceivingItem extends BaseEntity {
  gr_id: string;
  po_item_id: string;

  // Quantities
  expected_qty: number;
  received_qty: number;

  // QC
  qc_status?: string;
  qc_passed_qty: number;
  qc_failed_qty: number;
  qc_notes?: string;

  notes?: string;
}

// ---------------------------------------------
// Input Types
// ---------------------------------------------

export interface CreateSupplierInput {
  code?: string;
  name: string;
  name_th?: string;

  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  contact_line?: string;

  address?: string;
  district?: string;
  province?: string;
  postal_code?: string;

  tax_id?: string;
  service_types?: string[];

  default_lead_days?: number;
  min_order_qty?: number;
  payment_terms?: string;

  notes?: string;
}

export interface UpdateSupplierInput extends Partial<CreateSupplierInput> {
  status?: SupplierStatus;
}

export interface CreatePurchaseOrderInput {
  supplier_id: string;
  order_id?: string;

  expected_date?: string;
  payment_terms?: string;

  items: CreatePurchaseOrderItemInput[];

  setup_fees?: number;
  shipping_cost?: number;
  discount?: number;

  internal_notes?: string;
  supplier_notes?: string;
}

export interface CreatePurchaseOrderItemInput {
  order_work_item_id?: string;
  order_addon_id?: string;

  item_description: string;
  service_type?: string;
  specifications?: string;

  quantity: number;
  unit?: string;
  unit_price: number;

  design_file_url?: string;
  notes?: string;
}

export interface ReceiveGoodsInput {
  po_id: string;
  items: ReceiveGoodsItemInput[];
  delivery_note_url?: string;
  photo_urls?: string[];
  notes?: string;
}

export interface ReceiveGoodsItemInput {
  po_item_id: string;
  received_qty: number;
  qc_status?: 'pending' | 'passed' | 'failed';
  qc_notes?: string;
}

// ---------------------------------------------
// Filter Types
// ---------------------------------------------

export interface SupplierFilters extends BaseFilters {
  status?: SupplierStatus;
  service_types?: string[];
  category?: string;
}

export interface PurchaseOrderFilters extends BaseFilters {
  status?: PurchaseOrderStatus | PurchaseOrderStatus[];
  supplier_id?: string;
  order_id?: string;
  payment_status?: PaymentStatus;
  expected_date_from?: string;
  expected_date_to?: string;
}

// ---------------------------------------------
// Summary Types
// ---------------------------------------------

export interface SupplierSummary {
  id: string;
  code: string;
  name: string;
  service_types: string[];
  rating: number;
  total_orders: number;
  status: SupplierStatus;
}

export interface PurchaseOrderSummary {
  id: string;
  po_number: string;
  supplier_name: string;
  order_number?: string;
  status: PurchaseOrderStatus;
  total_amount: number;
  expected_date?: string;
  items_count: number;
  is_overdue: boolean;
}

// ---------------------------------------------
// Stats Types
// ---------------------------------------------

export interface SupplierStats {
  total_suppliers: number;
  active_suppliers: number;
  total_po: number;
  pending_po: number; // Alias for pending_pos
  pending_pos: number;
  overdue_deliveries: number;
  total_outstanding: number;
  total_amount_pending: number; // Total amount of pending POs
}

