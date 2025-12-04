// =============================================
// ORDER TYPES
// =============================================

import type {
  OrderStatus,
  OrderTypeCode,
  ProductionMode,
  PaymentStatus,
  PaymentTerms,
  PaymentMethod,
  SalesChannel,
  WorkItemStatus,
  DesignStatus,
  MockupStatus,
  RevisionType,
  PriorityCode,
  WorkCategory,
} from './enums';

import type {
  BaseEntity,
  AuditFields,
  Address,
  ContactInfo,
  PricingBreakdown,
  CustomerSnapshot,
  ProductSnapshot,
  UserRef,
  CustomerRef,
  BaseFilters,
  FileInfo,
} from './common';

// ---------------------------------------------
// Order Type (Production Mode Config)
// ---------------------------------------------

export interface OrderType extends BaseEntity {
  code: OrderTypeCode;
  name: string;
  name_th: string;
  description?: string;
  default_lead_days: number;
  requires_pattern: boolean;
  requires_fabric: boolean;
  sort_order: number;
  is_active: boolean;
}

// ---------------------------------------------
// Work Type
// ---------------------------------------------

export interface WorkType extends BaseEntity {
  code: string;
  name: string;
  name_th: string;
  description?: string;
  category_code: WorkCategory;
  base_price: number;
  requires_design: boolean;
  requires_material: boolean;
  estimated_minutes_per_unit: number;
  can_outsource?: boolean;
  in_house_capable?: boolean;
  is_active: boolean;
  sort_order: number;
}

// ---------------------------------------------
// Work Dependencies
// ---------------------------------------------

export interface WorkDependency {
  work_type_code: string;
  depends_on: string[]; // ต้องทำหลังจาก work_type_code เหล่านี้
  can_parallel_with: string[]; // ทำพร้อมกันได้
  order_types: string[]; // ใช้กับ order type ไหน (empty = all)
}

export interface OrderTypeRequiredWork {
  order_type_code: string;
  required_work_types: string[]; // งานที่ต้องมีอัตโนมัติ
  suggested_work_types: string[]; // งานที่แนะนำ
  excluded_work_types: string[]; // งานที่ไม่สามารถเลือกได้
}

// ---------------------------------------------
// Main Order Entity
// ---------------------------------------------

export interface Order extends BaseEntity, AuditFields {
  order_number: string;

  // Order Type & Mode
  order_type_code: OrderTypeCode;
  production_mode: ProductionMode;

  // Customer Info (Snapshot)
  customer_id?: string;
  customer_snapshot: CustomerSnapshot;

  // Shipping Address
  shipping_address?: Address & ContactInfo;

  // Billing Info
  billing_name?: string;
  billing_tax_id?: string;
  billing_address?: Address;
  needs_tax_invoice: boolean;

  // Status
  status: OrderStatus;

  // Priority
  priority_level: number;
  priority_code: PriorityCode;
  priority_surcharge_percent: number;
  priority_surcharge_amount: number;

  // Pricing
  pricing: PricingBreakdown;

  // Payment
  paid_amount: number;
  balance_due: number;
  payment_status: PaymentStatus;
  payment_terms: PaymentTerms;

  // Dates
  order_date: string;
  due_date?: string;
  shipped_date?: string;
  completed_date?: string;

  // Shipping
  shipping_method?: string;
  tracking_number?: string;

  // Design Workflow
  revision_count: number;
  max_free_revisions: number;
  paid_revision_count: number;
  paid_revision_total: number;
  all_designs_approved: boolean;
  all_designs_approved_at?: string;
  mockup_approved: boolean;
  mockup_approved_at?: string;

  // Material & Production Gates
  materials_ready: boolean;
  materials_ready_at?: string;
  production_unlocked: boolean;
  production_unlocked_at?: string;

  // Change Requests
  change_request_count: number;
  change_request_total: number;
  customer_acknowledged_changes: boolean;
  customer_acknowledged_at?: string;

  // Addons
  addons_total: number;

  // Notes
  customer_note?: string;
  internal_note?: string;

  // Sales
  sales_channel?: SalesChannel;
  sales_person_id?: string;

  // Access Token (for customer portal)
  access_token?: string;

  // Relations (populated on demand)
  customer?: CustomerRef;
  work_items?: OrderWorkItem[];
  products?: OrderProduct[];
  designs?: OrderDesign[];
  mockups?: OrderMockup[];
  payments?: OrderPayment[];
  addons?: OrderAddon[];
  change_requests?: ChangeRequestSummary[];
  sales_person?: UserRef;
}

// ---------------------------------------------
// Order Work Item
// ---------------------------------------------

export interface OrderWorkItem extends BaseEntity {
  order_id: string;

  // Work Type
  work_type_id?: string;
  work_type_code: string;
  work_type_name: string;
  work_type_name_th?: string;
  category_code?: WorkCategory;

  description?: string;

  // Quantity & Price
  quantity: number;
  unit_price: number;
  total_price: number;

  // Status
  status: WorkItemStatus;

  // Dependencies
  depends_on?: string[]; // work_item_ids
  can_start: boolean;
  blocked_reason?: string;

  // Design Status
  all_designs_approved: boolean;
  all_materials_ready: boolean;

  // Production Link
  production_job_id?: string;

  // QC
  qc_status: string;
  qc_passed_qty: number;
  qc_failed_qty: number;

  // Assignment
  assigned_to?: string;
  due_date?: string;

  // Print Details (for print work types)
  position_code?: string;
  position_name?: string;
  print_size_code?: string;
  print_size_name?: string;

  priority: number;
  notes?: string;
  sort_order: number;

  // Relations
  products?: OrderProduct[];
  designs?: OrderDesign[];
  assigned_user?: UserRef;
}

// ---------------------------------------------
// Order Product
// ---------------------------------------------

export interface OrderProduct extends BaseEntity {
  order_id: string;
  order_work_item_id?: string;

  // Product Reference (may be null if product deleted)
  product_id?: string;

  // Snapshot (immutable at order time)
  product_snapshot: ProductSnapshot;

  // Quantity & Price (locked at order time)
  quantity: number;
  unit_cost: number;
  unit_price: number;
  total_price: number;

  // Stock Reservation
  reserved_from_stock: boolean;
  stock_reservation_id?: string;
}

// ---------------------------------------------
// Order Design
// ---------------------------------------------

export interface OrderDesign extends BaseEntity {
  order_id: string;
  order_work_item_id?: string;

  design_name: string;
  position?: string;
  status: DesignStatus;

  assigned_designer_id?: string;
  current_version: number;
  final_file_url?: string;

  // Revision Tracking
  revision_count: number;
  max_free_revisions: number;
  paid_revision_count: number;
  paid_revision_total: number;

  // Brief
  brief_text?: string;
  reference_files?: FileInfo[];
  designer_notes?: string;

  // Relations
  versions?: DesignVersion[];
  designer?: UserRef;
}

// ---------------------------------------------
// Design Version
// ---------------------------------------------

export interface DesignVersion extends BaseEntity {
  order_design_id: string;

  version_number: number;
  file_url: string;
  thumbnail_url?: string;

  // Status
  status: 'pending' | 'approved' | 'rejected';

  // Revision Info
  revision_type: RevisionType;
  revision_cost: number;
  change_description?: string;

  // Customer Approval
  approved_by_customer: boolean;
  customer_approved_at?: string;
  is_final: boolean;

  // Feedback
  feedback?: string;
  feedback_by?: 'customer' | 'admin';
  feedback_at?: string;

  created_by?: string;
}

// ---------------------------------------------
// Order Mockup
// ---------------------------------------------

export interface OrderMockup extends BaseEntity {
  order_id: string;
  order_design_id?: string;

  version_number: number;

  // Images
  front_image_url?: string;
  back_image_url?: string;
  additional_images?: string[];

  // Status
  status: MockupStatus;

  // Customer Response
  customer_feedback?: string;
  approved_at?: string;
  rejected_at?: string;

  created_by?: string;
}

// ---------------------------------------------
// Order Payment
// ---------------------------------------------

export interface OrderPayment extends BaseEntity {
  order_id: string;

  amount: number;
  payment_type: 'deposit' | 'partial' | 'full' | 'refund';
  payment_method: PaymentMethod;

  // Bank Transfer Details
  bank_name?: string;
  transfer_date?: string;
  transfer_time?: string;
  slip_image_url?: string;

  reference_number?: string;

  // Status
  status: 'pending' | 'verified' | 'rejected';
  verified_by?: string;
  verified_at?: string;
  rejection_reason?: string;

  notes?: string;
  payment_date: string;
}

// ---------------------------------------------
// Order Addon
// ---------------------------------------------

export interface OrderAddon extends BaseEntity {
  order_id: string;
  order_item_id?: string;

  addon_type_id?: string;
  addon_code: string;
  addon_name: string;
  addon_name_th?: string;
  category: string;

  quantity: number;
  unit_price: number;
  total_price: number;

  // Status
  status: string;

  // Design (if needed)
  requires_design: boolean;
  design_file_url?: string;
  design_status: string;
  design_approved_at?: string;

  // Material (if needed)
  requires_material: boolean;
  material_status: string;
  material_eta?: string;

  // Attachment Info
  attached_by?: string;
  attached_at?: string;

  notes?: string;
  sort_order: number;
}

// ---------------------------------------------
// Change Request Summary (for Order relations)
// ---------------------------------------------

export interface ChangeRequestSummary {
  id: string;
  request_number: string;
  change_type: string;
  title: string;
  status: string;
  total_fee: number;
  created_at: string;
}

// ---------------------------------------------
// Order Status History
// ---------------------------------------------

export interface OrderStatusHistory extends BaseEntity {
  order_id: string;
  from_status?: OrderStatus;
  to_status: OrderStatus;
  changed_by?: string;
  reason?: string;

  // Relations
  user?: UserRef;
}

// ---------------------------------------------
// Order Note
// ---------------------------------------------

export interface OrderNote extends BaseEntity {
  order_id: string;
  note_text: string;
  attachments?: string[];
  mentioned_users?: string[];
  created_by?: string;

  // Relations
  user?: UserRef;
}

// ---------------------------------------------
// Input Types
// ---------------------------------------------

export interface CreateOrderInput {
  order_type_code?: OrderTypeCode;
  production_mode?: ProductionMode;

  customer_id?: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  customer_line_id?: string;

  shipping_name?: string;
  shipping_phone?: string;
  shipping_address?: string;
  shipping_district?: string;
  shipping_province?: string;
  shipping_postal_code?: string;

  billing_name?: string;
  billing_tax_id?: string;
  billing_address?: string;
  needs_tax_invoice?: boolean;

  due_date?: string;
  priority_code?: PriorityCode;

  customer_note?: string;
  internal_note?: string;

  sales_channel?: SalesChannel;
  sales_person_id?: string;

  discount_amount?: number;
  discount_percent?: number;
  discount_reason?: string;
  shipping_cost?: number;

  payment_terms?: PaymentTerms;
}

export interface UpdateOrderInput extends Partial<CreateOrderInput> {
  status?: OrderStatus;
  shipping_method?: string;
  tracking_number?: string;
}

export interface CreateWorkItemInput {
  order_id: string;
  work_type_code: string;
  work_type_name: string;
  work_type_id?: string;

  description?: string;
  quantity?: number;
  unit_price?: number;

  position_code?: string;
  position_name?: string;
  print_size_code?: string;
  print_size_name?: string;

  assigned_to?: string;
  due_date?: string;
  priority?: number;
  notes?: string;
}

export interface CreatePaymentInput {
  order_id: string;
  amount: number;
  payment_type: 'deposit' | 'partial' | 'full';
  payment_method: PaymentMethod;

  bank_name?: string;
  transfer_date?: string;
  transfer_time?: string;
  slip_image_url?: string;
  reference_number?: string;
  notes?: string;
}

// ---------------------------------------------
// Filter Types
// ---------------------------------------------

export interface OrderFilters extends BaseFilters {
  status?: OrderStatus | OrderStatus[];
  order_type_code?: OrderTypeCode;
  payment_status?: PaymentStatus;
  customer_id?: string;
  sales_person_id?: string;
  sales_channel?: SalesChannel;
  priority_code?: PriorityCode;
  due_date_from?: string;
  due_date_to?: string;
  has_overdue?: boolean;
}

// ---------------------------------------------
// Summary/Stats Types
// ---------------------------------------------

export interface OrderStats {
  total_orders: number;
  total_revenue: number;
  pending_orders: number;
  in_production: number;
  ready_to_ship: number;
  completed_this_month: number;
  overdue_orders: number;
  avg_order_value: number;
}

export interface OrderSummary {
  id: string;
  order_number: string;
  customer_name: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  total_amount: number;
  paid_amount: number;
  due_date?: string;
  order_date: string;
  work_items_count: number;
  is_overdue: boolean;
}

