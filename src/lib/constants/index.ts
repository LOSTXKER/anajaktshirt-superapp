/**
 * Shared Constants
 * รวม constants ที่ใช้ทั่วทั้งแอป
 */

// =============================================
// COLOR PALETTE (Apple-inspired)
// =============================================

export const COLORS = {
  // Primary
  primary: '#007AFF',
  primaryLight: '#5AC8FA',
  
  // Status Colors
  success: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',
  info: '#5AC8FA',
  
  // Neutrals
  text: '#1D1D1F',
  textSecondary: '#86868B',
  textMuted: '#A1A1A6',
  background: '#F5F5F7',
  border: '#E8E8ED',
  card: '#FFFFFF',
  
  // Sidebar (Dark)
  sidebarBg: '#1D1D1F',
  sidebarText: '#F5F5F7',
} as const;

// =============================================
// ORDER STATUS
// =============================================

export type OrderStatus = 
  | 'draft'
  | 'pending'
  | 'confirmed'
  | 'designing'
  | 'mockup_review'
  | 'approved'
  | 'in_production'
  | 'qc_check'
  | 'ready_to_ship'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'on_hold';

export const ORDER_STATUS_CONFIG: Record<OrderStatus, {
  label: string;
  label_th: string;
  color: string;
  bgColor: string;
  icon?: string;
}> = {
  draft: {
    label: 'Draft',
    label_th: 'ร่าง',
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
  },
  pending: {
    label: 'Pending',
    label_th: 'รอดำเนินการ',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
  },
  confirmed: {
    label: 'Confirmed',
    label_th: 'ยืนยันแล้ว',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  designing: {
    label: 'Designing',
    label_th: 'กำลังออกแบบ',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  mockup_review: {
    label: 'Mockup Review',
    label_th: 'รออนุมัติ Mockup',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
  },
  approved: {
    label: 'Approved',
    label_th: 'อนุมัติแล้ว',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
  },
  in_production: {
    label: 'In Production',
    label_th: 'กำลังผลิต',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  qc_check: {
    label: 'QC Check',
    label_th: 'รอตรวจ QC',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
  ready_to_ship: {
    label: 'Ready to Ship',
    label_th: 'พร้อมส่ง',
    color: 'text-teal-600',
    bgColor: 'bg-teal-100',
  },
  shipped: {
    label: 'Shipped',
    label_th: 'จัดส่งแล้ว',
    color: 'text-sky-600',
    bgColor: 'bg-sky-100',
  },
  delivered: {
    label: 'Delivered',
    label_th: 'ส่งถึงแล้ว',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  completed: {
    label: 'Completed',
    label_th: 'เสร็จสิ้น',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
  },
  cancelled: {
    label: 'Cancelled',
    label_th: 'ยกเลิก',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  on_hold: {
    label: 'On Hold',
    label_th: 'พักไว้',
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
  },
};

// =============================================
// PRODUCTION JOB STATUS
// =============================================

export type ProductionJobStatus =
  | 'pending'
  | 'queued'
  | 'assigned'
  | 'in_progress'
  | 'qc_check'
  | 'qc_passed'
  | 'qc_failed'
  | 'rework'
  | 'completed'
  | 'cancelled';

export const PRODUCTION_STATUS_CONFIG: Record<ProductionJobStatus, {
  label: string;
  label_th: string;
  color: string;
  bgColor: string;
}> = {
  pending: {
    label: 'Pending',
    label_th: 'รอคิว',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
  queued: {
    label: 'Queued',
    label_th: 'อยู่ในคิว',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
  },
  assigned: {
    label: 'Assigned',
    label_th: 'มอบหมายแล้ว',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  in_progress: {
    label: 'In Progress',
    label_th: 'กำลังผลิต',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  qc_check: {
    label: 'QC Check',
    label_th: 'รอตรวจ QC',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
  qc_passed: {
    label: 'QC Passed',
    label_th: 'ผ่าน QC',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  qc_failed: {
    label: 'QC Failed',
    label_th: 'ไม่ผ่าน QC',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  rework: {
    label: 'Rework',
    label_th: 'แก้ไข',
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
  },
  completed: {
    label: 'Completed',
    label_th: 'เสร็จสิ้น',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
  },
  cancelled: {
    label: 'Cancelled',
    label_th: 'ยกเลิก',
    color: 'text-slate-500',
    bgColor: 'bg-slate-100',
  },
};

// =============================================
// PAYMENT STATUS
// =============================================

export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'refunded' | 'overdue';

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, {
  label: string;
  label_th: string;
  color: string;
  bgColor: string;
}> = {
  unpaid: {
    label: 'Unpaid',
    label_th: 'ยังไม่ชำระ',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
  partial: {
    label: 'Partial',
    label_th: 'ชำระบางส่วน',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
  },
  paid: {
    label: 'Paid',
    label_th: 'ชำระแล้ว',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  refunded: {
    label: 'Refunded',
    label_th: 'คืนเงินแล้ว',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  overdue: {
    label: 'Overdue',
    label_th: 'เกินกำหนด',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
};

// =============================================
// WORK TYPES
// =============================================

export const WORK_TYPE_CONFIG: Record<string, {
  label: string;
  label_th: string;
  color: string;
  bgColor: string;
}> = {
  DTG: {
    label: 'DTG',
    label_th: 'DTG',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-500',
  },
  DTF: {
    label: 'DTF',
    label_th: 'DTF',
    color: 'text-blue-600',
    bgColor: 'bg-blue-500',
  },
  SILKSCREEN: {
    label: 'Silkscreen',
    label_th: 'สกรีน',
    color: 'text-purple-600',
    bgColor: 'bg-purple-500',
  },
  SUBLIMATION: {
    label: 'Sublimation',
    label_th: 'ซับลิเมชั่น',
    color: 'text-pink-600',
    bgColor: 'bg-pink-500',
  },
  EMBROIDERY: {
    label: 'Embroidery',
    label_th: 'ปัก',
    color: 'text-amber-600',
    bgColor: 'bg-amber-500',
  },
  EMBROIDERY_BADGE: {
    label: 'Embroidery Badge',
    label_th: 'ปักแผง',
    color: 'text-orange-600',
    bgColor: 'bg-orange-500',
  },
  SEWING: {
    label: 'Sewing',
    label_th: 'เย็บ',
    color: 'text-green-600',
    bgColor: 'bg-green-500',
  },
  CUTTING: {
    label: 'Cutting',
    label_th: 'ตัด',
    color: 'text-red-600',
    bgColor: 'bg-red-500',
  },
  PACKAGING: {
    label: 'Packaging',
    label_th: 'แพ็ค',
    color: 'text-gray-600',
    bgColor: 'bg-gray-500',
  },
};

// =============================================
// PRIORITY
// =============================================

export type Priority = 0 | 1 | 2;

export const PRIORITY_CONFIG: Record<Priority, {
  label: string;
  label_th: string;
  color: string;
  bgColor: string;
}> = {
  0: {
    label: 'Normal',
    label_th: 'ปกติ',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
  1: {
    label: 'Rush',
    label_th: 'เร่งด่วน',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  2: {
    label: 'Urgent',
    label_th: 'ด่วนมาก',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
};

// =============================================
// SALES CHANNELS
// =============================================

export const SALES_CHANNELS = [
  { value: 'walk_in', label: 'Walk-in' },
  { value: 'line', label: 'LINE' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'website', label: 'Website' },
  { value: 'shopee', label: 'Shopee' },
  { value: 'lazada', label: 'Lazada' },
  { value: 'other', label: 'อื่นๆ' },
] as const;

// =============================================
// PAYMENT TERMS
// =============================================

export const PAYMENT_TERMS = [
  { value: 'full', label: 'ชำระเต็มจำนวน' },
  { value: '50_50', label: 'มัดจำ 50%' },
  { value: '30_70', label: 'มัดจำ 30%' },
  { value: 'credit', label: 'เครดิต 30 วัน' },
] as const;

// =============================================
// CUSTOMER TIERS
// =============================================

export const CUSTOMER_TIERS = [
  { value: 'regular', label: 'ลูกค้าทั่วไป', discount: 0 },
  { value: 'silver', label: 'Silver', discount: 5 },
  { value: 'gold', label: 'Gold', discount: 10 },
  { value: 'platinum', label: 'Platinum', discount: 15 },
  { value: 'vip', label: 'VIP', discount: 20 },
] as const;

// =============================================
// SIZE ORDER (for sorting)
// =============================================

export const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];

// =============================================
// HELPER FUNCTIONS
// =============================================

export function getStatusConfig<T extends string>(
  status: T,
  config: Record<T, { label_th: string; color: string; bgColor: string }>
) {
  return config[status] || { label_th: status, color: 'text-gray-600', bgColor: 'bg-gray-100' };
}

export function formatCurrency(amount: number, currency: string = 'THB'): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(
  date: string | Date | null,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return '-';
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };
  
  return new Date(date).toLocaleDateString('th-TH', options || defaultOptions);
}

export function formatDateTime(date: string | Date | null): string {
  if (!date) return '-';
  
  return new Date(date).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

