// =============================================
// ENUMS & STATUS TYPES
// =============================================

// ---------------------------------------------
// Order Enums
// ---------------------------------------------

export type OrderTypeCode = 'ready_made' | 'custom_sewing' | 'full_custom' | 'print_only';

export type ProductionMode = 'in_house' | 'outsource' | 'hybrid';

export type OrderStatus =
  | 'draft'
  | 'quoted'
  | 'awaiting_payment'
  | 'partial_paid'
  | 'designing'
  | 'awaiting_mockup_approval'
  | 'mockup_approved'
  | 'awaiting_material'
  | 'material_ready'
  | 'queued'
  | 'in_production'
  | 'qc_pending'
  | 'qc_passed'
  | 'ready_to_ship'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'on_hold'
  | 'cancelled';

export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'refunded';

export type PaymentTerms = 'full' | '50_50' | '30_70' | 'credit_7' | 'credit_15' | 'credit_30';

export type PaymentMethod = 'bank_transfer' | 'cash' | 'credit_card' | 'promptpay' | 'credit';

export type SalesChannel = 'line' | 'facebook' | 'instagram' | 'walk_in' | 'phone' | 'website' | 'shopee' | 'lazada' | 'other';

// ---------------------------------------------
// Work Item Enums
// ---------------------------------------------

export type WorkCategory = 'printing' | 'embroidery' | 'garment' | 'labeling' | 'packaging' | 'finishing';

export type WorkItemStatus =
  | 'pending'
  | 'blocked'
  | 'designing'
  | 'awaiting_approval'
  | 'approved'
  | 'material_pending'
  | 'material_ready'
  | 'queued'
  | 'assigned'
  | 'in_production'
  | 'qc_pending'
  | 'qc_passed'
  | 'qc_failed'
  | 'rework'
  | 'completed'
  | 'cancelled';

// ---------------------------------------------
// Design & Mockup Enums
// ---------------------------------------------

export type DesignStatus =
  | 'not_required'
  | 'pending'
  | 'drafting'
  | 'awaiting_review'
  | 'revision_requested'
  | 'approved'
  | 'final';

export type MockupStatus = 'pending' | 'sent' | 'approved' | 'rejected' | 'revision_requested';

export type RevisionType = 'free' | 'paid' | 'error_fix';

// ---------------------------------------------
// Production Enums
// ---------------------------------------------

export type ProductionJobStatus =
  | 'pending'
  | 'queued'
  | 'assigned'
  | 'in_progress'
  | 'paused'
  | 'qc_check'
  | 'qc_passed'
  | 'qc_failed'
  | 'rework'
  | 'completed'
  | 'cancelled';

export type StationStatus = 'active' | 'maintenance' | 'offline';

// ---------------------------------------------
// QC Enums
// ---------------------------------------------

export type QCStage = 'material' | 'pre_production' | 'in_process' | 'post_production' | 'final';

export type QCResult = 'pass' | 'fail' | 'partial' | 'pending';

// ---------------------------------------------
// Supplier & Outsource Enums
// ---------------------------------------------

export type SupplierStatus = 'active' | 'inactive' | 'blacklisted';

export type PurchaseOrderStatus =
  | 'draft'
  | 'sent'
  | 'confirmed'
  | 'producing'
  | 'shipped'
  | 'partial_received'
  | 'received'
  | 'qc_pending'
  | 'qc_failed'
  | 'completed'
  | 'cancelled';

// ---------------------------------------------
// Change Request Enums
// ---------------------------------------------

export type ChangeRequestType =
  | 'design_revision'
  | 'quantity_increase'
  | 'quantity_decrease'
  | 'size_change'
  | 'color_change'
  | 'add_work'
  | 'remove_work'
  | 'add_addon'
  | 'remove_addon'
  | 'change_material'
  | 'change_due_date'
  | 'cancel_item'
  | 'other';

export type ChangeRequestCategory = 'minor' | 'major' | 'critical';

export type ChangeRequestStatus =
  | 'pending'
  | 'quoted'
  | 'awaiting_customer'
  | 'approved'
  | 'rejected'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type OrderPhase = 'draft' | 'design' | 'mockup_approved' | 'pre_production' | 'in_production' | 'qc_complete' | 'shipped';

// ---------------------------------------------
// Addon Enums
// ---------------------------------------------

export type AddonCategory = 'packaging' | 'labeling' | 'finishing' | 'extra';

export type AddonPriceType = 'per_piece' | 'per_lot' | 'fixed';

export type AddonStatus = 'pending' | 'design_pending' | 'material_pending' | 'material_ready' | 'ready' | 'attached' | 'completed';

// ---------------------------------------------
// Issue & Error Enums
// ---------------------------------------------

export type IssueSource = 'internal' | 'supplier' | 'customer' | 'external';

export type IssueStatus = 'open' | 'investigating' | 'resolved' | 'closed';

export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';

// ---------------------------------------------
// Material Procurement Enums
// ---------------------------------------------

export type ProcurementSource = 'purchase' | 'customer_provide' | 'internal_transfer';

export type ProcurementStatus = 'pending' | 'ordered' | 'in_transit' | 'received' | 'qc_pending' | 'ready' | 'cancelled';

// ---------------------------------------------
// Priority Levels
// ---------------------------------------------

export type PriorityLevel = 0 | 1 | 2 | 3;
export type PriorityCode = 'normal' | 'rush' | 'urgent' | 'emergency';

// ---------------------------------------------
// Status Display Configs
// ---------------------------------------------

export interface StatusDisplayConfig {
  label: string;
  label_th: string;
  color: string;
  bgColor: string;
  icon?: string;
}

export const ORDER_STATUS_CONFIG: Record<OrderStatus, StatusDisplayConfig> = {
  draft: { label: 'Draft', label_th: 'ร่าง', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  quoted: { label: 'Quoted', label_th: 'เสนอราคาแล้ว', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  awaiting_payment: { label: 'Awaiting Payment', label_th: 'รอชำระเงิน', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  partial_paid: { label: 'Partial Paid', label_th: 'ชำระบางส่วน', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  designing: { label: 'Designing', label_th: 'กำลังออกแบบ', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  awaiting_mockup_approval: { label: 'Awaiting Mockup', label_th: 'รออนุมัติ Mockup', color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  mockup_approved: { label: 'Mockup Approved', label_th: 'อนุมัติ Mockup แล้ว', color: 'text-violet-600', bgColor: 'bg-violet-100' },
  awaiting_material: { label: 'Awaiting Material', label_th: 'รอวัตถุดิบ', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  material_ready: { label: 'Material Ready', label_th: 'วัตถุดิบพร้อม', color: 'text-lime-600', bgColor: 'bg-lime-100' },
  queued: { label: 'Queued', label_th: 'รอเข้าคิว', color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
  in_production: { label: 'In Production', label_th: 'กำลังผลิต', color: 'text-teal-600', bgColor: 'bg-teal-100' },
  qc_pending: { label: 'QC Pending', label_th: 'รอ QC', color: 'text-pink-600', bgColor: 'bg-pink-100' },
  qc_passed: { label: 'QC Passed', label_th: 'QC ผ่าน', color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  ready_to_ship: { label: 'Ready to Ship', label_th: 'พร้อมส่ง', color: 'text-emerald-700', bgColor: 'bg-emerald-200' },
  shipped: { label: 'Shipped', label_th: 'จัดส่งแล้ว', color: 'text-green-600', bgColor: 'bg-green-100' },
  delivered: { label: 'Delivered', label_th: 'ส่งถึงแล้ว', color: 'text-green-700', bgColor: 'bg-green-200' },
  completed: { label: 'Completed', label_th: 'เสร็จสิ้น', color: 'text-green-800', bgColor: 'bg-green-300' },
  on_hold: { label: 'On Hold', label_th: 'พักไว้', color: 'text-slate-600', bgColor: 'bg-slate-100' },
  cancelled: { label: 'Cancelled', label_th: 'ยกเลิก', color: 'text-red-600', bgColor: 'bg-red-100' },
};

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, StatusDisplayConfig> = {
  unpaid: { label: 'Unpaid', label_th: 'ยังไม่ชำระ', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  partial: { label: 'Partial', label_th: 'ชำระบางส่วน', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  paid: { label: 'Paid', label_th: 'ชำระแล้ว', color: 'text-green-600', bgColor: 'bg-green-100' },
  refunded: { label: 'Refunded', label_th: 'คืนเงินแล้ว', color: 'text-red-600', bgColor: 'bg-red-100' },
};

export const PRIORITY_CONFIG: Record<PriorityCode, StatusDisplayConfig & { surcharge_percent: number; lead_modifier: number }> = {
  normal: { label: 'Normal', label_th: 'ปกติ', color: 'text-gray-600', bgColor: 'bg-gray-100', surcharge_percent: 0, lead_modifier: 1.0 },
  rush: { label: 'Rush', label_th: 'เร่ง', color: 'text-amber-600', bgColor: 'bg-amber-100', surcharge_percent: 20, lead_modifier: 0.7 },
  urgent: { label: 'Urgent', label_th: 'ด่วน', color: 'text-orange-600', bgColor: 'bg-orange-100', surcharge_percent: 50, lead_modifier: 0.5 },
  emergency: { label: 'Emergency', label_th: 'ด่วนมาก', color: 'text-red-600', bgColor: 'bg-red-100', surcharge_percent: 100, lead_modifier: 0.3 },
};

export const WORK_CATEGORY_CONFIG: Record<WorkCategory, StatusDisplayConfig> = {
  printing: { label: 'Printing', label_th: 'งานพิมพ์/สกรีน', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: 'printer' },
  embroidery: { label: 'Embroidery', label_th: 'งานปัก', color: 'text-purple-600', bgColor: 'bg-purple-100', icon: 'scissors' },
  garment: { label: 'Garment', label_th: 'ตัดเย็บ', color: 'text-emerald-600', bgColor: 'bg-emerald-100', icon: 'shirt' },
  labeling: { label: 'Labeling', label_th: 'ป้าย/แท็ก', color: 'text-amber-600', bgColor: 'bg-amber-100', icon: 'tag' },
  packaging: { label: 'Packaging', label_th: 'บรรจุภัณฑ์', color: 'text-indigo-600', bgColor: 'bg-indigo-100', icon: 'package' },
  finishing: { label: 'Finishing', label_th: 'ตกแต่งสำเร็จ', color: 'text-pink-600', bgColor: 'bg-pink-100', icon: 'sparkles' },
};

