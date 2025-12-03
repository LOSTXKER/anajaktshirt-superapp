// =============================================
// ORDER SYSTEM TYPES
// =============================================

// Order Status
export type OrderStatus =
  | 'draft'
  | 'quoted'
  | 'awaiting_payment'
  | 'partial_paid'
  | 'designing'
  | 'awaiting_mockup_approval'
  | 'awaiting_material'
  | 'queued'
  | 'in_production'
  | 'qc_pending'
  | 'ready_to_ship'
  | 'shipped'
  | 'completed'
  | 'cancelled';

export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

export type PaymentTerms = 'full' | '50_50' | '30_70';

export type WorkItemStatus =
  | 'pending'
  | 'designing'
  | 'awaiting_approval'
  | 'approved'
  | 'in_production'
  | 'qc_pending'
  | 'qc_passed'
  | 'qc_failed'
  | 'completed';

export type DesignStatus =
  | 'pending'
  | 'drafting'
  | 'awaiting_review'
  | 'revision_requested'
  | 'approved'
  | 'final';

export type MockupStatus = 'pending' | 'approved' | 'rejected';

export type PaymentMethod = 'bank_transfer' | 'cash' | 'credit_card' | 'promptpay';

export type SalesChannel = 'line' | 'facebook' | 'instagram' | 'walk_in' | 'phone' | 'website' | 'other';

// =============================================
// MAIN INTERFACES
// =============================================

export interface Order {
  id: string;
  order_number: string;
  
  // Customer Info
  customer_id: string | null;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  customer_line_id: string | null;
  
  // Shipping
  shipping_name: string | null;
  shipping_phone: string | null;
  shipping_address: string | null;
  shipping_district: string | null;
  shipping_province: string | null;
  shipping_postal_code: string | null;
  
  // Billing
  billing_name: string | null;
  billing_tax_id: string | null;
  billing_address: string | null;
  billing_phone: string | null;
  needs_tax_invoice: boolean;
  
  // Status
  status: OrderStatus;
  
  // Pricing
  subtotal: number;
  discount_amount: number;
  discount_percent: number;
  discount_reason: string | null;
  shipping_cost: number;
  total_amount: number;
  final_amount: number;
  
  // Payment
  paid_amount: number;
  balance_due: number;
  payment_status: PaymentStatus;
  payment_terms: PaymentTerms;
  
  // Dates
  order_date: string;
  due_date: string | null;
  shipped_date: string | null;
  completed_date: string | null;
  
  // Shipping
  shipping_method: string | null;
  tracking_number: string | null;
  
  // Notes
  customer_note: string | null;
  internal_note: string | null;
  
  // Sales
  sales_channel: SalesChannel | null;
  sales_person_id: string | null;
  
  // Access
  access_token: string | null;
  
  // Meta
  created_by: string | null;
  created_at: string;
  updated_at: string;
  
  // Relations (optional, for joined queries)
  customer?: {
    id: string;
    name: string;
    company_name?: string;
    tier?: string;
  };
  work_items?: OrderWorkItem[];
  products?: OrderProduct[];
  payments?: OrderPayment[];
  sales_person?: {
    id: string;
    full_name: string;
  };
}

export interface OrderWorkItem {
  id: string;
  order_id: string;
  
  // Work Type
  work_type_id: string | null;
  work_type_code: string;
  work_type_name: string;
  
  description: string | null;
  
  // Quantity & Price
  quantity: number;
  unit_price: number;
  total_price: number;
  
  // Status
  status: WorkItemStatus;
  
  // Assignment
  assigned_to: string | null;
  due_date: string | null;
  
  // Print Details
  position_code: string | null;
  position_name: string | null;
  print_size_code: string | null;
  print_size_name: string | null;
  
  priority: number;
  notes: string | null;
  sort_order: number;
  
  created_at: string;
  updated_at: string;
  
  // Relations
  products?: OrderProduct[];
  designs?: OrderDesign[];
  assigned_user?: {
    id: string;
    full_name: string;
  };
}

export interface OrderProduct {
  id: string;
  order_id: string;
  order_work_item_id: string | null;
  
  // Product Reference
  product_id: string | null;
  
  // Snapshot
  product_sku: string;
  product_name: string;
  product_model: string | null;
  product_color: string | null;
  product_size: string | null;
  
  // Quantity & Price
  quantity: number;
  unit_cost: number;
  unit_price: number;
  total_price: number;
  
  // Stock
  reserved_from_stock: boolean;
  stock_reservation_id: string | null;
  
  created_at: string;
}

export interface OrderDesign {
  id: string;
  order_id: string;
  order_work_item_id: string | null;
  
  design_name: string;
  position: string | null;
  status: DesignStatus;
  
  assigned_designer_id: string | null;
  current_version: number;
  final_file_url: string | null;
  
  revision_count: number;
  max_free_revisions: number;
  
  brief_text: string | null;
  designer_notes: string | null;
  
  created_at: string;
  updated_at: string;
  
  // Relations
  versions?: DesignVersion[];
  mockups?: OrderMockup[];
  designer?: {
    id: string;
    full_name: string;
  };
}

export interface DesignVersion {
  id: string;
  order_design_id: string;
  
  version_number: number;
  file_url: string;
  thumbnail_url: string | null;
  
  status: 'pending' | 'approved' | 'rejected';
  
  feedback: string | null;
  feedback_by: 'customer' | 'admin' | null;
  feedback_at: string | null;
  
  created_by: string | null;
  created_at: string;
}

export interface OrderMockup {
  id: string;
  order_id: string;
  order_design_id: string | null;
  design_id?: string; // Alias
  
  version_number: number;
  front_image_url: string | null;
  back_image_url: string | null;
  additional_images: string[];
  
  status: MockupStatus;
  note: string | null;
  feedback: string | null;
  approved_at: string | null;
  
  created_by: string | null;
  created_at: string;
}

export interface OrderPayment {
  id: string;
  order_id: string;
  
  amount: number;
  payment_type: 'deposit' | 'partial' | 'full';
  payment_method: PaymentMethod | null;
  
  bank_name: string | null;
  transfer_date: string | null;
  transfer_time: string | null;
  slip_image_url: string | null;
  
  reference_number: string | null;
  
  status: 'pending' | 'confirmed' | 'rejected';
  confirmed_by: string | null;
  confirmed_at: string | null;
  rejection_reason: string | null;
  
  note: string | null;
  payment_date: string;
  created_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  changed_by: string | null;
  reason: string | null;
  created_at: string;
  
  // Relations
  user?: {
    id: string;
    full_name: string;
  };
}

export interface OrderNote {
  id: string;
  order_id: string;
  note_text: string;
  attachments: string[];
  mentioned_users: string[];
  created_by: string | null;
  created_at: string;
  
  // Relations
  user?: {
    id: string;
    full_name: string;
  };
}

// =============================================
// REFERENCE DATA TYPES
// =============================================

export interface WorkType {
  id: string;
  code: string;
  name: string;
  name_th: string;
  description: string | null;
  base_price: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface FabricType {
  id: string;
  code: string;
  name: string;
  name_th: string;
  description: string | null;
  suitable_work_types: string[];
  is_active: boolean;
  created_at: string;
}

export interface PrintPosition {
  id: string;
  code: string;
  name: string;
  name_th: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface PrintSize {
  id: string;
  code: string;
  name: string;
  width_cm: number | null;
  height_cm: number | null;
  price_modifier: number;
  is_active: boolean;
  created_at: string;
}

// =============================================
// INPUT TYPES (for mutations)
// =============================================

export interface CreateOrderInput {
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
  billing_phone?: string;
  needs_tax_invoice?: boolean;
  
  due_date?: string;
  
  customer_note?: string;
  internal_note?: string;
  
  sales_channel?: SalesChannel;
  
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

export interface CreateOrderProductInput {
  order_id: string;
  order_work_item_id?: string;
  product_id?: string;
  
  product_sku: string;
  product_name: string;
  product_model?: string;
  product_color?: string;
  product_size?: string;
  
  quantity: number;
  unit_cost?: number;
  unit_price: number;
}

export interface CreateOrderDesignInput {
  order_id: string;
  order_work_item_id?: string;
  
  design_name: string;
  position?: string;
  brief_text?: string;
  assigned_designer_id?: string;
}

export interface CreatePaymentInput {
  order_id: string;
  amount: number;
  payment_method: PaymentMethod;
  
  bank_name?: string;
  transfer_date?: string;
  transfer_time?: string;
  slip_image_url?: string;
  reference_number?: string;
  notes?: string;
}

// =============================================
// FILTER TYPES
// =============================================

export interface OrderFilters {
  status?: OrderStatus | OrderStatus[];
  payment_status?: PaymentStatus;
  customer_id?: string;
  sales_person_id?: string;
  sales_channel?: SalesChannel;
  date_from?: string;
  date_to?: string;
  due_date_from?: string;
  due_date_to?: string;
  search?: string; // Search in order_number, customer_name
}

// =============================================
// SUMMARY/STATS TYPES
// =============================================

export interface OrderStats {
  total_orders: number;
  total_revenue: number;
  pending_orders: number;
  in_production: number;
  ready_to_ship: number;
  completed_this_month: number;
  overdue_orders: number;
}

export interface OrderSummary {
  id: string;
  order_number: string;
  customer_name: string;
  status: OrderStatus;
  total_amount: number;
  paid_amount: number;
  due_date: string | null;
  order_date: string;
  work_items_count: number;
}

// =============================================
// STATUS DISPLAY CONFIG
// =============================================

export const ORDER_STATUS_CONFIG: Record<OrderStatus, {
  label: string;
  label_th: string;
  color: string;
  bgColor: string;
}> = {
  draft: { label: 'Draft', label_th: 'ร่าง', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  quoted: { label: 'Quoted', label_th: 'เสนอราคาแล้ว', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  awaiting_payment: { label: 'Awaiting Payment', label_th: 'รอชำระเงิน', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  partial_paid: { label: 'Partial Paid', label_th: 'ชำระบางส่วน', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  designing: { label: 'Designing', label_th: 'กำลังออกแบบ', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  awaiting_mockup_approval: { label: 'Awaiting Mockup', label_th: 'รอลูกค้าอนุมัติ', color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  awaiting_material: { label: 'Awaiting Material', label_th: 'รอวัตถุดิบ', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  queued: { label: 'Queued', label_th: 'รอเข้าคิว', color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
  in_production: { label: 'In Production', label_th: 'กำลังผลิต', color: 'text-teal-600', bgColor: 'bg-teal-100' },
  qc_pending: { label: 'QC Pending', label_th: 'รอ QC', color: 'text-pink-600', bgColor: 'bg-pink-100' },
  ready_to_ship: { label: 'Ready to Ship', label_th: 'พร้อมส่ง', color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  shipped: { label: 'Shipped', label_th: 'จัดส่งแล้ว', color: 'text-green-600', bgColor: 'bg-green-100' },
  completed: { label: 'Completed', label_th: 'เสร็จสิ้น', color: 'text-green-700', bgColor: 'bg-green-200' },
  cancelled: { label: 'Cancelled', label_th: 'ยกเลิก', color: 'text-red-600', bgColor: 'bg-red-100' },
};

export const WORK_ITEM_STATUS_CONFIG: Record<WorkItemStatus, {
  label: string;
  label_th: string;
  color: string;
}> = {
  pending: { label: 'Pending', label_th: 'รอดำเนินการ', color: 'text-gray-500' },
  designing: { label: 'Designing', label_th: 'กำลังออกแบบ', color: 'text-purple-500' },
  awaiting_approval: { label: 'Awaiting Approval', label_th: 'รออนุมัติ', color: 'text-yellow-500' },
  approved: { label: 'Approved', label_th: 'อนุมัติแล้ว', color: 'text-blue-500' },
  in_production: { label: 'In Production', label_th: 'กำลังผลิต', color: 'text-teal-500' },
  qc_pending: { label: 'QC Pending', label_th: 'รอ QC', color: 'text-pink-500' },
  qc_passed: { label: 'QC Passed', label_th: 'QC ผ่าน', color: 'text-green-500' },
  qc_failed: { label: 'QC Failed', label_th: 'QC ไม่ผ่าน', color: 'text-red-500' },
  completed: { label: 'Completed', label_th: 'เสร็จ', color: 'text-green-600' },
};

