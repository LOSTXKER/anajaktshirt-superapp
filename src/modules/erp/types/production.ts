// =============================================
// PRODUCTION TYPES
// =============================================

import type {
  ProductionJobStatus,
  StationStatus,
  WorkCategory,
} from './enums';

import type {
  BaseEntity,
  AuditFields,
  UserRef,
  BaseFilters,
} from './common';

// ---------------------------------------------
// Production Station
// ---------------------------------------------

export interface ProductionStation extends BaseEntity {
  code: string;
  name: string;
  department: string;
  work_type_codes: string[];

  // Capacity
  capacity_per_day: number;

  // Status
  status: StationStatus;

  // Current Assignment
  current_job_id?: string;
  assigned_worker_id?: string;

  is_active: boolean;

  // Relations
  current_job?: ProductionJobSummary;
  assigned_worker?: UserRef;
}

// ---------------------------------------------
// Production Job
// ---------------------------------------------

export interface ProductionJob extends BaseEntity, AuditFields {
  job_number: string;

  // Link to Order
  order_id?: string;
  order_number?: string;
  order_work_item_id?: string;

  // Customer Info (from order snapshot)
  customer_name?: string;
  customer_phone?: string;

  // Job Info
  work_type_code: string;
  work_type_name?: string;
  category_code?: WorkCategory;
  description?: string;

  // Quantity Tracking
  ordered_qty: number;
  produced_qty: number;
  passed_qty: number;
  failed_qty: number;
  rework_qty: number;

  // Status
  status: ProductionJobStatus;
  priority: number;
  progress_percent: number;

  // Assignment
  station_id?: string;
  assigned_to?: string;
  assigned_at?: string;

  // Timing
  estimated_hours?: number;
  actual_hours?: number;
  started_at?: string;
  completed_at?: string;
  due_date?: string;

  // QC
  qc_status?: string;
  qc_notes?: string;
  qc_by?: string;
  qc_at?: string;

  // Rework
  is_rework: boolean;
  rework_reason?: string;
  original_job_id?: string;
  rework_count: number;

  // Files
  design_file_url?: string;
  production_notes?: string;

  // Relations
  station?: ProductionStation;
  assigned_user?: UserRef;
  logs?: ProductionJobLog[];
  qc_records?: ProductionQCRecord[];
}

// ---------------------------------------------
// Production Job Log
// ---------------------------------------------

export interface ProductionJobLog extends BaseEntity {
  job_id: string;

  action: string;
  from_status?: string;
  to_status?: string;

  produced_qty?: number;

  notes?: string;
  performed_by?: string;
  performed_at: string;

  // Relations
  user?: UserRef;
}

// ---------------------------------------------
// Production QC Record
// ---------------------------------------------

export interface ProductionQCRecord extends BaseEntity {
  job_id: string;
  order_id?: string;

  qc_stage_code: string;
  qc_stage_name?: string;

  // Quantities
  total_qty: number;
  checked_qty: number;
  passed_qty: number;
  failed_qty: number;
  rework_qty: number;

  // Result
  overall_result: string;
  pass_rate: number;

  // Checklist
  checklist_results: QCChecklistItem[];

  // Evidence
  photo_urls?: string[];

  // Notes
  notes?: string;
  failure_reasons?: string[];
  rework_instructions?: string;

  // Timing
  started_at?: string;
  completed_at?: string;

  checked_by?: string;
  checked_at: string;

  // Relations
  checker?: UserRef;
}

export interface QCChecklistItem {
  checkpoint_code: string;
  checkpoint_name: string;
  passed: boolean;
  notes?: string;
  photo_urls?: string[];
}

// ---------------------------------------------
// Production Job Summary (for lists)
// ---------------------------------------------

export interface ProductionJobSummary {
  id: string;
  job_number: string;
  order_number?: string;
  customer_name?: string;
  work_type_code: string;
  work_type_name?: string;
  status: ProductionJobStatus;
  priority: number;
  ordered_qty: number;
  produced_qty: number;
  progress_percent: number;
  due_date?: string;
  is_overdue: boolean;
}

// ---------------------------------------------
// Production Queue Item
// ---------------------------------------------

export interface ProductionQueueItem {
  job: ProductionJobSummary;
  position: number;
  estimated_start?: string;
  estimated_complete?: string;
  wait_reason?: string;
}

// ---------------------------------------------
// Station Workload
// ---------------------------------------------

export interface StationWorkload {
  station: ProductionStation;
  current_jobs: number;
  pending_jobs: number;
  total_qty_pending: number;
  utilization_percent: number;
  estimated_clear_date?: string;
}

// ---------------------------------------------
// Input Types
// ---------------------------------------------

export interface CreateProductionJobInput {
  order_id?: string;
  order_work_item_id?: string;

  work_type_code: string;
  work_type_name?: string;
  description?: string;

  ordered_qty: number;
  priority?: number;
  due_date?: string;

  station_id?: string;
  assigned_to?: string;

  design_file_url?: string;
  production_notes?: string;
}

export interface UpdateProductionJobInput {
  status?: ProductionJobStatus;
  produced_qty?: number;
  priority?: number;
  station_id?: string;
  assigned_to?: string;
  production_notes?: string;
}

export interface LogProductionInput {
  job_id: string;
  action: 'start' | 'produce' | 'pause' | 'resume' | 'complete' | 'qc_submit';
  produced_qty?: number;
  notes?: string;
}

// ---------------------------------------------
// Filter Types
// ---------------------------------------------

export interface ProductionJobFilters extends BaseFilters {
  status?: ProductionJobStatus | ProductionJobStatus[];
  work_type_code?: string;
  station_id?: string;
  assigned_to?: string;
  order_id?: string;
  priority?: number;
  due_date_from?: string;
  due_date_to?: string;
  is_overdue?: boolean;
  is_rework?: boolean;
}

// ---------------------------------------------
// Stats Types
// ---------------------------------------------

export interface ProductionStats {
  total_jobs: number;
  pending_jobs: number;
  in_progress_jobs: number;
  completed_today: number;
  total_qty_pending: number;
  total_qty_completed_today: number;
  on_time_rate: number;
  rework_rate: number;
}

export interface ProductionDashboard {
  stats: ProductionStats;
  station_workloads: StationWorkload[];
  urgent_jobs: ProductionJobSummary[];
  overdue_jobs: ProductionJobSummary[];
  recent_completions: ProductionJobSummary[];
}

