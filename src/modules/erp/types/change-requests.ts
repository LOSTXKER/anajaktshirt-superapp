// =============================================
// CHANGE REQUEST TYPES
// =============================================

import type {
  ChangeRequestType,
  ChangeRequestCategory,
  ChangeRequestStatus,
  OrderPhase,
} from './enums';

import type {
  BaseEntity,
  AuditFields,
  UserRef,
  BaseFilters,
  FileInfo,
} from './common';

// ---------------------------------------------
// Change Request
// ---------------------------------------------

export interface ChangeRequest extends BaseEntity, AuditFields {
  request_number: string;
  order_id: string;
  order_number?: string;

  // Phase & Type
  order_phase: OrderPhase;
  change_type: ChangeRequestType;
  change_category: ChangeRequestCategory;

  // Description
  title: string;
  description: string;
  customer_reason?: string;

  // Affected Items
  affected_work_items?: string[];
  affected_products?: string[];
  affected_addons?: string[];

  // Impact Assessment
  impact: ChangeRequestImpact;
  impact_level?: 'none' | 'low' | 'medium' | 'high' | 'critical'; // Alias for impact.level

  // Cost Breakdown
  fees: ChangeRequestFees;
  actual_cost?: number; // Alias for fees.total_fee

  // Schedule Impact
  days_delayed: number;
  original_due_date?: string;
  new_due_date?: string;

  // Status
  status: ChangeRequestStatus;

  // Approval Flow
  quoted_at?: string;
  quoted_by?: string;
  customer_notified_at?: string;
  customer_response?: 'accept' | 'reject' | 'negotiate';
  customer_responded_at?: string;

  // Payment (if required)
  payment_status: string;
  payment_required: boolean;
  payment_received_at?: string;
  payment_reference?: string;

  // Completion
  completed_at?: string;
  completed_by?: string;

  // Files
  reference_files?: FileInfo[];
  new_design_files?: FileInfo[];

  // Notes
  admin_notes?: string;
  internal_notes?: string;

  // Relations
  order?: {
    order_number: string;
    customer_name: string;
    status: string;
  };
  quoter?: UserRef;
  completer?: UserRef;
  logs?: ChangeRequestLog[];
}

// ---------------------------------------------
// Change Request Impact
// ---------------------------------------------

export interface ChangeRequestImpact {
  // Production Impact
  production_already_started: boolean;
  produced_qty: number;
  waste_qty: number;

  // Material Impact
  materials_ordered: boolean;
  materials_received: boolean;
  material_waste_cost: number;

  // Design Impact
  designs_approved: boolean;
  design_rework_required: boolean;

  // Schedule Impact
  affects_due_date: boolean;
  delay_days: number;

  // Other Orders Impact
  affects_other_orders: boolean;
  affected_order_ids?: string[];

  // Summary
  impact_level: 'none' | 'low' | 'medium' | 'high' | 'critical';
  impact_description?: string;
}

// ---------------------------------------------
// Change Request Fees
// ---------------------------------------------

export interface ChangeRequestFees {
  base_fee: number; // ค่าดำเนินการ
  design_fee: number; // ค่าออกแบบใหม่
  rework_fee: number; // ค่าทำใหม่
  material_fee: number; // ค่าวัสดุเพิ่ม
  waste_fee: number; // ค่าของเสีย
  rush_fee: number; // ค่าเร่งด่วน
  other_fee: number;
  other_fee_description?: string;
  discount: number;
  total_fee: number;
}

// ---------------------------------------------
// Change Request Log
// ---------------------------------------------

export interface ChangeRequestLog extends BaseEntity {
  change_request_id: string;

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
// Phase-based Fee Config
// ---------------------------------------------

export interface PhaseFeesConfig {
  phase: OrderPhase;
  phase_name: string;
  phase_name_th: string;
  fees: {
    design_revision: number;
    quantity_change_percent: number;
    size_color_change: number;
    add_work_percent: number;
    remove_work_penalty_percent: number;
    cancel_penalty_percent: number;
  };
  notes: string;
}

export const PHASE_FEES_CONFIG: PhaseFeesConfig[] = [
  {
    phase: 'draft',
    phase_name: 'Draft',
    phase_name_th: 'ร่าง',
    fees: {
      design_revision: 0,
      quantity_change_percent: 0,
      size_color_change: 0,
      add_work_percent: 0,
      remove_work_penalty_percent: 0,
      cancel_penalty_percent: 0,
    },
    notes: 'แก้ไขฟรีทุกอย่าง',
  },
  {
    phase: 'design',
    phase_name: 'Design',
    phase_name_th: 'ออกแบบ',
    fees: {
      design_revision: 0, // Free within limit
      quantity_change_percent: 0,
      size_color_change: 0,
      add_work_percent: 0,
      remove_work_penalty_percent: 0,
      cancel_penalty_percent: 10,
    },
    notes: 'แก้ไข Design ฟรีตาม limit',
  },
  {
    phase: 'mockup_approved',
    phase_name: 'Mockup Approved',
    phase_name_th: 'อนุมัติ Mockup แล้ว',
    fees: {
      design_revision: 200,
      quantity_change_percent: 0,
      size_color_change: 100,
      add_work_percent: 0,
      remove_work_penalty_percent: 10,
      cancel_penalty_percent: 20,
    },
    notes: 'เริ่มมีค่าใช้จ่ายแก้ไข',
  },
  {
    phase: 'pre_production',
    phase_name: 'Pre-Production',
    phase_name_th: 'เตรียมผลิต',
    fees: {
      design_revision: 300,
      quantity_change_percent: 5,
      size_color_change: 200,
      add_work_percent: 10,
      remove_work_penalty_percent: 20,
      cancel_penalty_percent: 30,
    },
    notes: 'สั่งวัตถุดิบแล้ว',
  },
  {
    phase: 'in_production',
    phase_name: 'In Production',
    phase_name_th: 'กำลังผลิต',
    fees: {
      design_revision: 500,
      quantity_change_percent: 10,
      size_color_change: 500,
      add_work_percent: 20,
      remove_work_penalty_percent: 50,
      cancel_penalty_percent: 50,
    },
    notes: 'ผลิตแล้วบางส่วน',
  },
  {
    phase: 'qc_complete',
    phase_name: 'QC Complete',
    phase_name_th: 'QC เสร็จแล้ว',
    fees: {
      design_revision: 0, // Cannot change
      quantity_change_percent: 0,
      size_color_change: 0,
      add_work_percent: 0,
      remove_work_penalty_percent: 100,
      cancel_penalty_percent: 80,
    },
    notes: 'ผลิตเสร็จแล้ว',
  },
];

// ---------------------------------------------
// Input Types
// ---------------------------------------------

export interface CreateChangeRequestInput {
  order_id: string;
  change_type: ChangeRequestType;
  title: string;
  description: string;
  customer_reason?: string;

  affected_work_items?: string[];
  affected_products?: string[];
  affected_addons?: string[];

  reference_files?: string[];
}

export interface QuoteChangeRequestInput {
  change_request_id: string;

  fees: Partial<ChangeRequestFees>;

  days_delayed?: number;
  new_due_date?: string;

  admin_notes?: string;
}

export interface RespondChangeRequestInput {
  change_request_id: string;
  response: 'accept' | 'reject' | 'negotiate';
  feedback?: string;
  payment_reference?: string;
}

// ---------------------------------------------
// Filter Types
// ---------------------------------------------

export interface ChangeRequestFilters extends BaseFilters {
  status?: ChangeRequestStatus | ChangeRequestStatus[];
  change_type?: ChangeRequestType;
  type?: ChangeRequestType; // Alias for change_type
  change_category?: ChangeRequestCategory;
  order_id?: string;
  order_phase?: OrderPhase;
  payment_status?: string;
}

// ---------------------------------------------
// Summary Types
// ---------------------------------------------

export interface ChangeRequestSummary {
  id: string;
  request_number: string;
  order_number: string;
  customer_name: string;
  change_type: ChangeRequestType;
  title: string;
  status: ChangeRequestStatus;
  total_fee: number;
  created_at: string;
  days_pending: number;
}

// ---------------------------------------------
// Stats Types
// ---------------------------------------------

export interface ChangeRequestStats {
  total_requests: number;
  total?: number; // Alias for total_requests
  pending_requests: number;
  pending?: number; // Alias for pending_requests
  quoted?: number;
  approved?: number;
  rejected?: number;
  completed?: number;
  cancelled?: number;
  awaiting_customer: number;
  total_fees_quoted: number;
  total_fees_collected: number;
  total_cost?: number; // Alias for total_fees_collected
  avg_resolution_days: number;
  by_type?: Record<string, number>;
  by_impact?: Record<string, number>;
}

