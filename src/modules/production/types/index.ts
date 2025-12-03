// Production Module Types

export type JobStatus = 'pending' | 'reserved' | 'printing' | 'curing' | 'packing' | 'completed' | 'cancelled';
export type JobPriority = 'low' | 'normal' | 'high' | 'urgent';
export type QCStatus = 'pass' | 'fail' | 'rework';
export type InspectionType = 'incoming' | 'in_process' | 'final';

export interface ProductionJob {
  id: string;
  job_number: string;
  erp_order_id: string | null;
  customer_id: string | null;
  customer_name: string;
  customer_contact: string | null;
  customer_phone: string | null;
  product_description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: JobStatus;
  priority: JobPriority;
  progress: number;
  order_date: string;
  due_date: string | null;
  started_at: string | null;
  completed_at: string | null;
  assigned_to: string | null;
  assigned_user?: {
    full_name: string;
    avatar_url: string | null;
  };
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Computed
  items?: ProductionJobItem[];
  updates?: ProductionUpdate[];
}

export interface ProductionJobItem {
  id: string;
  job_id: string;
  product_id: string;
  product?: {
    sku: string;
    model: string;
    color: string;
    size: string;
    quantity: number;
  };
  quantity: number;
  reserved_quantity: number;
  notes: string | null;
  created_at: string;
}

export interface StockReservation {
  id: string;
  job_id: string;
  product_id: string;
  product?: {
    sku: string;
    model: string;
    color: string;
    size: string;
  };
  quantity: number;
  status: 'reserved' | 'used' | 'released';
  reserved_by: string | null;
  reserved_at: string;
  released_at: string | null;
}

export interface ProductionUpdate {
  id: string;
  job_id: string;
  previous_status: string | null;
  new_status: string;
  note: string | null;
  updated_by: string | null;
  user?: {
    full_name: string;
  };
  created_at: string;
}

export interface QCLog {
  id: string;
  job_id: string;
  inspection_type: InspectionType;
  status: QCStatus;
  pass_quantity: number;
  fail_quantity: number;
  defect_type: string | null;
  defect_reason: string | null;
  images: string[];
  inspected_by: string | null;
  inspected_at: string;
  notes: string | null;
}

export interface DefectType {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

// Status configurations
export const JOB_STATUS_CONFIG: Record<JobStatus, { label: string; color: string; bgColor: string; icon: string }> = {
  pending: { label: 'รอดำเนินการ', color: 'text-[#FF9500]', bgColor: 'bg-[#FF9500]/10', icon: '⏳' },
  reserved: { label: 'จองสต๊อกแล้ว', color: 'text-[#5AC8FA]', bgColor: 'bg-[#5AC8FA]/10', icon: '📦' },
  printing: { label: 'กำลังพิมพ์', color: 'text-[#007AFF]', bgColor: 'bg-[#007AFF]/10', icon: '🖨️' },
  curing: { label: 'อบแห้ง', color: 'text-[#AF52DE]', bgColor: 'bg-[#AF52DE]/10', icon: '🔥' },
  packing: { label: 'บรรจุ', color: 'text-[#00C7BE]', bgColor: 'bg-[#00C7BE]/10', icon: '📦' },
  completed: { label: 'เสร็จสิ้น', color: 'text-[#34C759]', bgColor: 'bg-[#34C759]/10', icon: '✅' },
  cancelled: { label: 'ยกเลิก', color: 'text-[#FF3B30]', bgColor: 'bg-[#FF3B30]/10', icon: '❌' },
};

export const JOB_PRIORITY_CONFIG: Record<JobPriority, { label: string; variant: 'destructive' | 'warning' | 'secondary' | 'info' }> = {
  urgent: { label: 'ด่วนมาก', variant: 'destructive' },
  high: { label: 'เร่งด่วน', variant: 'warning' },
  normal: { label: 'ปกติ', variant: 'secondary' },
  low: { label: 'ไม่ด่วน', variant: 'info' },
};

export const QC_STATUS_CONFIG: Record<QCStatus, { label: string; color: string; bgColor: string }> = {
  pass: { label: 'ผ่าน', color: 'text-[#34C759]', bgColor: 'bg-[#34C759]/10' },
  fail: { label: 'ไม่ผ่าน', color: 'text-[#FF3B30]', bgColor: 'bg-[#FF3B30]/10' },
  rework: { label: 'แก้ไข', color: 'text-[#FF9500]', bgColor: 'bg-[#FF9500]/10' },
};

