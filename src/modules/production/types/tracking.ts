// =============================================
// PRODUCTION TRACKING TYPES
// =============================================

// Job Status
export type ProductionJobStatus = 
  | 'pending'      // รอคิว
  | 'queued'       // อยู่ในคิว
  | 'assigned'     // มอบหมายแล้ว
  | 'in_progress'  // กำลังผลิต
  | 'qc_check'     // รอตรวจ QC
  | 'qc_passed'    // ผ่าน QC
  | 'qc_failed'    // ไม่ผ่าน QC
  | 'rework'       // แก้ไข
  | 'completed'    // เสร็จสิ้น
  | 'cancelled';   // ยกเลิก

export const JOB_STATUS_CONFIG: Record<ProductionJobStatus, {
  label: string;
  label_th: string;
  color: string;
  bgColor: string;
}> = {
  pending: { label: 'Pending', label_th: 'รอคิว', color: 'text-gray-400', bgColor: 'bg-gray-500/20' },
  queued: { label: 'Queued', label_th: 'อยู่ในคิว', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  assigned: { label: 'Assigned', label_th: 'มอบหมายแล้ว', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  in_progress: { label: 'In Progress', label_th: 'กำลังผลิต', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  qc_check: { label: 'QC Check', label_th: 'รอตรวจ QC', color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  qc_passed: { label: 'QC Passed', label_th: 'ผ่าน QC', color: 'text-green-400', bgColor: 'bg-green-500/20' },
  qc_failed: { label: 'QC Failed', label_th: 'ไม่ผ่าน QC', color: 'text-red-400', bgColor: 'bg-red-500/20' },
  rework: { label: 'Rework', label_th: 'แก้ไข', color: 'text-pink-400', bgColor: 'bg-pink-500/20' },
  completed: { label: 'Completed', label_th: 'เสร็จสิ้น', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
  cancelled: { label: 'Cancelled', label_th: 'ยกเลิก', color: 'text-gray-500', bgColor: 'bg-gray-600/20' },
};

// Priority
export type JobPriority = 0 | 1 | 2;

export const PRIORITY_CONFIG: Record<JobPriority, {
  label: string;
  label_th: string;
  color: string;
}> = {
  0: { label: 'Normal', label_th: 'ปกติ', color: 'text-gray-400' },
  1: { label: 'Rush', label_th: 'เร่งด่วน', color: 'text-yellow-400' },
  2: { label: 'Urgent', label_th: 'ด่วนมาก', color: 'text-red-400' },
};

// Department
export type Department = 'printing' | 'embroidery' | 'sewing' | 'cutting' | 'packing';

export const DEPARTMENT_CONFIG: Record<Department, {
  label: string;
  label_th: string;
  color: string;
}> = {
  printing: { label: 'Printing', label_th: 'งานพิมพ์', color: 'text-cyan-400' },
  embroidery: { label: 'Embroidery', label_th: 'งานปัก', color: 'text-purple-400' },
  sewing: { label: 'Sewing', label_th: 'งานเย็บ', color: 'text-pink-400' },
  cutting: { label: 'Cutting', label_th: 'งานตัด', color: 'text-orange-400' },
  packing: { label: 'Packing', label_th: 'แพ็คกิ้ง', color: 'text-green-400' },
};

// Production Station
export interface ProductionStation {
  id: string;
  code: string;
  name: string;
  department: Department;
  work_type_codes: string[];
  capacity_per_day: number;
  status: 'active' | 'maintenance' | 'offline';
  current_job_id: string | null;
  assigned_worker_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Relations
  assigned_worker?: {
    id: string;
    full_name: string;
  };
  current_job?: ProductionJob;
}

// Production Job
export interface ProductionJob {
  id: string;
  job_number: string;
  
  // Links
  order_id: string | null;
  order_work_item_id: string | null;
  
  // Job Info
  work_type_code: string;
  work_type_name: string | null;
  description: string | null;
  
  // Standalone Job Info (for walk-in customers)
  customer_name: string | null;
  product_description: string | null;
  quantity: number | null;
  
  // Quantity
  ordered_qty: number;
  produced_qty: number;
  passed_qty: number;
  failed_qty: number;
  
  // Status
  status: ProductionJobStatus;
  priority: JobPriority;
  
  // Assignment
  station_id: string | null;
  assigned_to: string | null;
  assigned_at: string | null;
  
  // Timing
  estimated_hours: number | null;
  actual_hours: number | null;
  started_at: string | null;
  completed_at: string | null;
  due_date: string | null;
  
  // QC
  qc_status: string | null;
  qc_notes: string | null;
  qc_by: string | null;
  qc_at: string | null;
  
  // Rework
  is_rework: boolean;
  rework_reason: string | null;
  original_job_id: string | null;
  rework_count: number;
  
  // Files
  design_file_url: string | null;
  production_notes: string | null;
  
  created_by: string | null;
  created_at: string;
  updated_at: string;
  
  // Relations
  order?: {
    id: string;
    order_number: string;
    customer_name: string;
  };
  station?: ProductionStation;
  assigned_user?: {
    id: string;
    full_name: string;
  };
  logs?: ProductionJobLog[];
}

// Production Job Log
export interface ProductionJobLog {
  id: string;
  job_id: string;
  action: string;
  from_status: string | null;
  to_status: string | null;
  produced_qty: number | null;
  notes: string | null;
  performed_by: string | null;
  performed_at: string;
  
  // Relations
  performer?: {
    id: string;
    full_name: string;
  };
}

// QC Checkpoint
export interface QCCheckpoint {
  id: string;
  job_id: string;
  checkpoint_name: string;
  checkpoint_order: number;
  passed: boolean | null;
  notes: string | null;
  photo_urls: string[];
  checked_by: string | null;
  checked_at: string;
  
  // Relations
  checker?: {
    id: string;
    full_name: string;
  };
}

// QC Template
export interface QCTemplate {
  id: string;
  work_type_code: string;
  checkpoint_name: string;
  checkpoint_name_th: string | null;
  description: string | null;
  is_required: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

// Outsource Job
export type OutsourceJobStatus = 
  | 'draft'
  | 'sent'
  | 'confirmed'
  | 'producing'
  | 'shipped'
  | 'received'
  | 'qc_check'
  | 'completed'
  | 'cancelled';

export const OUTSOURCE_STATUS_CONFIG: Record<OutsourceJobStatus, {
  label: string;
  label_th: string;
  color: string;
}> = {
  draft: { label: 'Draft', label_th: 'แบบร่าง', color: 'text-gray-400' },
  sent: { label: 'Sent', label_th: 'ส่งแล้ว', color: 'text-blue-400' },
  confirmed: { label: 'Confirmed', label_th: 'ยืนยันแล้ว', color: 'text-purple-400' },
  producing: { label: 'Producing', label_th: 'กำลังผลิต', color: 'text-yellow-400' },
  shipped: { label: 'Shipped', label_th: 'จัดส่งแล้ว', color: 'text-cyan-400' },
  received: { label: 'Received', label_th: 'รับของแล้ว', color: 'text-green-400' },
  qc_check: { label: 'QC Check', label_th: 'รอตรวจ QC', color: 'text-orange-400' },
  completed: { label: 'Completed', label_th: 'เสร็จสิ้น', color: 'text-emerald-400' },
  cancelled: { label: 'Cancelled', label_th: 'ยกเลิก', color: 'text-gray-500' },
};

export interface OutsourceJob {
  id: string;
  production_job_id: string | null;
  order_id: string | null;
  order_work_item_id: string | null;
  
  // Supplier
  supplier_id: string | null;
  supplier_name: string | null;
  supplier_contact: string | null;
  
  // Job Info
  work_type_code: string;
  description: string | null;
  quantity: number;
  unit_price: number | null;
  total_price: number | null;
  
  // Status
  status: OutsourceJobStatus;
  
  // PO
  po_number: string | null;
  po_file_url: string | null;
  po_sent_at: string | null;
  po_confirmed_at: string | null;
  
  // Delivery
  expected_delivery: string | null;
  actual_delivery: string | null;
  tracking_number: string | null;
  
  // Receiving
  received_qty: number | null;
  received_by: string | null;
  received_at: string | null;
  
  // QC
  qc_status: string | null;
  qc_passed_qty: number | null;
  qc_failed_qty: number | null;
  qc_notes: string | null;
  
  design_file_url: string | null;
  notes: string | null;
  
  created_by: string | null;
  created_at: string;
  updated_at: string;
  
  // Relations
  supplier?: {
    id: string;
    name: string;
    contact_name: string;
  };
  order?: {
    id: string;
    order_number: string;
  };
}

// Filters
export interface ProductionJobFilters {
  status?: ProductionJobStatus[];
  department?: Department;
  work_type_code?: string;
  station_id?: string;
  assigned_to?: string;
  priority?: JobPriority;
  date_from?: string;
  date_to?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

// Statistics
export interface ProductionStats {
  total_jobs: number;
  pending_jobs: number;
  in_progress_jobs: number;
  completed_today: number;
  qc_failed_today: number;
  
  by_department: {
    department: Department;
    count: number;
    in_progress: number;
  }[];
  
  by_status: {
    status: ProductionJobStatus;
    count: number;
  }[];
}

// Input Types
export interface CreateProductionJobInput {
  order_id?: string;
  order_work_item_id?: string;
  work_type_code: string;
  work_type_name?: string;
  description?: string;
  ordered_qty: number;
  priority?: JobPriority;
  due_date?: string;
  design_file_url?: string;
  production_notes?: string;
}

export interface UpdateProductionJobInput {
  status?: ProductionJobStatus;
  priority?: JobPriority;
  station_id?: string;
  assigned_to?: string;
  estimated_hours?: number;
  due_date?: string;
  production_notes?: string;
}

export interface LogProductionInput {
  job_id: string;
  action: string;
  produced_qty?: number;
  notes?: string;
}

export interface QCCheckInput {
  job_id: string;
  checkpoints: {
    checkpoint_name: string;
    passed: boolean;
    notes?: string;
    photo_urls?: string[];
  }[];
  overall_passed: boolean;
  qc_notes?: string;
}

export interface CreateOutsourceJobInput {
  production_job_id?: string;
  order_id?: string;
  order_work_item_id?: string;
  supplier_id?: string;
  supplier_name?: string;
  work_type_code: string;
  description?: string;
  quantity: number;
  unit_price?: number;
  expected_delivery?: string;
  design_file_url?: string;
  notes?: string;
}

