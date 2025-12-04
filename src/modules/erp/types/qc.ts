// =============================================
// QC (QUALITY CONTROL) TYPES
// =============================================

import type {
  QCStage,
  QCResult,
} from './enums';

import type {
  BaseEntity,
  UserRef,
  BaseFilters,
} from './common';

// ---------------------------------------------
// QC Stage Config
// ---------------------------------------------

export interface QCStageConfig extends BaseEntity {
  code: QCStage;
  name: string;
  name_th: string;
  stage_order: number;
  is_mandatory: boolean;
  applies_to_work_types?: string[];
  description?: string;
}

// ---------------------------------------------
// QC Template
// ---------------------------------------------

export interface QCTemplate extends BaseEntity {
  work_type_code: string;
  checkpoint_name: string;
  checkpoint_name_th?: string;
  description?: string;
  is_required: boolean;
  sort_order: number;
  is_active: boolean;
}

// ---------------------------------------------
// QC Record
// ---------------------------------------------

export interface QCRecord extends BaseEntity {
  job_id?: string;
  order_id?: string;
  order_work_item_id?: string;

  qc_stage_code: QCStage;
  qc_stage_name?: string;

  // Quantities
  total_qty: number;
  checked_qty: number;
  passed_qty: number;
  failed_qty: number;
  rework_qty: number;

  // Result
  overall_result: QCResult;
  pass_rate: number;

  // Checklist
  checklist_results: QCCheckpoint[];

  // Evidence
  photo_urls?: string[];

  // Notes
  notes?: string;
  failure_reasons?: string[];
  rework_instructions?: string;

  // Actions Taken
  actions_taken?: QCAction[];

  // Timing
  started_at?: string;
  completed_at?: string;

  checked_by?: string;
  checked_at: string;

  // Follow-up
  follow_up_required: boolean;
  follow_up_notes?: string;
  follow_up_completed_at?: string;

  // Relations
  checker?: UserRef;
  job?: {
    job_number: string;
    work_type_code: string;
  };
  order?: {
    order_number: string;
    customer_name: string;
  };
}

// ---------------------------------------------
// QC Checkpoint Result
// ---------------------------------------------

export interface QCCheckpoint {
  checkpoint_code: string;
  checkpoint_name: string;
  checkpoint_name_th?: string;
  is_required: boolean;
  passed: boolean;
  notes?: string;
  photo_urls?: string[];
  defect_type?: string;
  defect_severity?: 'minor' | 'major' | 'critical';
}

// ---------------------------------------------
// QC Action
// ---------------------------------------------

export interface QCAction {
  action_type: 'pass' | 'rework' | 'reject' | 'hold';
  quantity: number;
  reason?: string;
  rework_instructions?: string;
  assigned_to?: string;
  due_date?: string;
}

// ---------------------------------------------
// Defect Type
// ---------------------------------------------

export interface DefectType extends BaseEntity {
  code: string;
  name: string;
  name_th?: string;
  description?: string;
  category: string;
  severity: 'minor' | 'major' | 'critical';
  is_active: boolean;
}

// ---------------------------------------------
// QC Report
// ---------------------------------------------

export interface QCReport {
  period: {
    from: string;
    to: string;
  };

  summary: {
    total_checked: number;
    total_passed: number;
    total_failed: number;
    total_rework: number;
    overall_pass_rate: number;
  };

  by_stage: {
    stage: QCStage;
    stage_name: string;
    checked: number;
    passed: number;
    failed: number;
    pass_rate: number;
  }[];

  by_work_type: {
    work_type_code: string;
    work_type_name: string;
    checked: number;
    passed: number;
    failed: number;
    pass_rate: number;
  }[];

  top_defects: {
    defect_type: string;
    defect_name: string;
    count: number;
    percentage: number;
  }[];

  by_worker: {
    worker_id: string;
    worker_name: string;
    checked: number;
    fail_rate: number;
  }[];
}

// ---------------------------------------------
// Input Types
// ---------------------------------------------

export interface CreateQCRecordInput {
  job_id?: string;
  order_id?: string;
  order_work_item_id?: string;

  qc_stage_code: QCStage;

  total_qty: number;
  checked_qty: number;

  checklist_results: QCCheckpointInput[];

  photo_urls?: string[];
  notes?: string;
}

export interface QCCheckpointInput {
  checkpoint_code: string;
  passed: boolean;
  notes?: string;
  photo_urls?: string[];
  defect_type?: string;
}

export interface QCActionInput {
  qc_record_id: string;
  action_type: 'pass' | 'rework' | 'reject' | 'hold';
  quantity: number;
  reason?: string;
  rework_instructions?: string;
  assigned_to?: string;
}

// ---------------------------------------------
// Filter Types
// ---------------------------------------------

export interface QCRecordFilters extends BaseFilters {
  qc_stage_code?: QCStage;
  overall_result?: QCResult;
  job_id?: string;
  order_id?: string;
  checked_by?: string;
  has_failures?: boolean;
  follow_up_required?: boolean;
}

// ---------------------------------------------
// Stats Types
// ---------------------------------------------

export interface QCStats {
  total_records: number;
  pending_qc: number;
  failed_today: number;
  rework_in_progress: number;
  avg_pass_rate: number;
  avg_check_time_minutes: number;
}

export interface QCDashboard {
  stats: QCStats;
  recent_failures: QCRecord[];
  pending_rework: QCRecord[];
  top_defects_today: {
    defect_type: string;
    count: number;
  }[];
}

