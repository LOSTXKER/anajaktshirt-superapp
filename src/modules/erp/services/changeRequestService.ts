// =============================================
// CHANGE REQUEST SERVICE
// =============================================

import { getChangeRequestRepository } from './repository';
import type {
  ChangeRequest,
  ChangeRequestFilters,
  CreateChangeRequestInput,
  QuoteChangeRequestInput,
  RespondChangeRequestInput,
  ChangeRequestStats,
  ChangeRequestFees,
  ChangeRequestImpact,
  PHASE_FEES_CONFIG,
} from '../types/change-requests';
import type { OrderPhase, ChangeRequestType, ChangeRequestCategory } from '../types/enums';
import type { PaginationParams, PaginatedResult, ActionResult } from '../types/common';

// ---------------------------------------------
// Change Request CRUD
// ---------------------------------------------

export async function getChangeRequest(id: string): Promise<ChangeRequest | null> {
  return getChangeRequestRepository().findById(id);
}

export async function getChangeRequestByNumber(requestNumber: string): Promise<ChangeRequest | null> {
  return getChangeRequestRepository().findByRequestNumber(requestNumber);
}

export async function getChangeRequests(
  filters?: ChangeRequestFilters,
  pagination?: PaginationParams
): Promise<PaginatedResult<ChangeRequest>> {
  return getChangeRequestRepository().findMany(filters, pagination);
}

export async function getOrderChangeRequests(orderId: string): Promise<ChangeRequest[]> {
  return getChangeRequestRepository().getByOrderId(orderId);
}

export async function createChangeRequest(data: CreateChangeRequestInput): Promise<ActionResult<ChangeRequest>> {
  return getChangeRequestRepository().create(data);
}

// ---------------------------------------------
// Workflow
// ---------------------------------------------

export async function quoteChangeRequest(data: QuoteChangeRequestInput): Promise<ActionResult> {
  return getChangeRequestRepository().quote(data);
}

export async function notifyCustomer(changeRequestId: string): Promise<ActionResult> {
  return getChangeRequestRepository().notifyCustomer(changeRequestId);
}

export async function respondToChangeRequest(data: RespondChangeRequestInput): Promise<ActionResult> {
  return getChangeRequestRepository().respondToRequest(data);
}

export async function markChangeRequestCompleted(changeRequestId: string): Promise<ActionResult> {
  return getChangeRequestRepository().markCompleted(changeRequestId);
}

export async function cancelChangeRequest(changeRequestId: string, reason: string): Promise<ActionResult> {
  return getChangeRequestRepository().cancel(changeRequestId, reason);
}

// ---------------------------------------------
// Stats
// ---------------------------------------------

export async function getChangeRequestStats(filters?: ChangeRequestFilters): Promise<ChangeRequestStats> {
  return getChangeRequestRepository().getStats(filters);
}

// ---------------------------------------------
// Business Logic Helpers
// ---------------------------------------------

export function determineChangeCategory(
  changeType: ChangeRequestType,
  phase: OrderPhase,
  producedQty: number,
  orderedQty: number
): ChangeRequestCategory {
  // Critical if already produced significant amount
  if (producedQty > orderedQty * 0.5) {
    return 'critical';
  }
  
  // Major changes
  const majorChanges: ChangeRequestType[] = [
    'quantity_decrease',
    'cancel_item',
    'change_material',
    'remove_work',
  ];
  
  if (majorChanges.includes(changeType) && phase !== 'draft') {
    return 'major';
  }
  
  // Minor changes
  const minorChanges: ChangeRequestType[] = [
    'design_revision',
    'add_addon',
    'change_due_date',
  ];
  
  if (minorChanges.includes(changeType) || phase === 'draft') {
    return 'minor';
  }
  
  return 'major';
}

export function calculateImpact(
  changeType: ChangeRequestType,
  phase: OrderPhase,
  context: {
    producedQty: number;
    orderedQty: number;
    materialsOrdered: boolean;
    materialsReceived: boolean;
    designsApproved: boolean;
  }
): ChangeRequestImpact {
  const impact: ChangeRequestImpact = {
    production_already_started: context.producedQty > 0,
    produced_qty: context.producedQty,
    waste_qty: 0,
    materials_ordered: context.materialsOrdered,
    materials_received: context.materialsReceived,
    material_waste_cost: 0,
    designs_approved: context.designsApproved,
    design_rework_required: false,
    affects_due_date: false,
    delay_days: 0,
    affects_other_orders: false,
    impact_level: 'low',
  };
  
  // Design changes
  if (['design_revision', 'color_change'].includes(changeType)) {
    impact.design_rework_required = context.designsApproved;
    if (context.producedQty > 0) {
      impact.waste_qty = context.producedQty;
    }
  }
  
  // Quantity decrease or cancellation
  if (['quantity_decrease', 'cancel_item', 'remove_work'].includes(changeType)) {
    if (context.materialsReceived) {
      impact.material_waste_cost = context.producedQty * 50; // Estimate
    }
    impact.waste_qty = context.producedQty;
  }
  
  // Determine delay
  if (phase === 'in_production' && context.producedQty > 0) {
    impact.affects_due_date = true;
    impact.delay_days = 3; // Base delay
  }
  
  // Determine impact level
  if (impact.waste_qty > context.orderedQty * 0.5 || impact.material_waste_cost > 1000) {
    impact.impact_level = 'critical';
  } else if (impact.waste_qty > 0 || impact.design_rework_required) {
    impact.impact_level = 'high';
  } else if (impact.affects_due_date || context.materialsOrdered) {
    impact.impact_level = 'medium';
  }
  
  return impact;
}

export function calculateFees(
  changeType: ChangeRequestType,
  phase: OrderPhase,
  impact: ChangeRequestImpact,
  orderValue: number
): ChangeRequestFees {
  const fees: ChangeRequestFees = {
    base_fee: 0,
    design_fee: 0,
    rework_fee: 0,
    material_fee: 0,
    waste_fee: 0,
    rush_fee: 0,
    other_fee: 0,
    discount: 0,
    total_fee: 0,
  };
  
  // Get phase config
  const phaseConfigImport = require('../types/change-requests');
  const phaseConfigs = phaseConfigImport.PHASE_FEES_CONFIG as typeof PHASE_FEES_CONFIG;
  const phaseConfig = phaseConfigs.find(p => p.phase === phase);
  
  if (!phaseConfig) {
    return fees;
  }
  
  // Calculate based on change type
  switch (changeType) {
    case 'design_revision':
      fees.design_fee = phaseConfig.fees.design_revision;
      break;
      
    case 'quantity_increase':
    case 'quantity_decrease':
      fees.base_fee = orderValue * (phaseConfig.fees.quantity_change_percent / 100);
      break;
      
    case 'size_change':
    case 'color_change':
      fees.base_fee = phaseConfig.fees.size_color_change;
      break;
      
    case 'add_work':
      fees.base_fee = orderValue * (phaseConfig.fees.add_work_percent / 100);
      break;
      
    case 'remove_work':
      fees.base_fee = orderValue * (phaseConfig.fees.remove_work_penalty_percent / 100);
      break;
      
    case 'cancel_item':
      fees.base_fee = orderValue * (phaseConfig.fees.cancel_penalty_percent / 100);
      break;
  }
  
  // Add impact-based fees
  if (impact.waste_qty > 0) {
    fees.waste_fee = impact.waste_qty * 30; // Per unit waste cost
  }
  
  if (impact.material_waste_cost > 0) {
    fees.material_fee = impact.material_waste_cost;
  }
  
  if (impact.design_rework_required && fees.design_fee === 0) {
    fees.design_fee = 200;
  }
  
  // Calculate total
  fees.total_fee = 
    fees.base_fee +
    fees.design_fee +
    fees.rework_fee +
    fees.material_fee +
    fees.waste_fee +
    fees.rush_fee +
    fees.other_fee -
    fees.discount;
  
  return fees;
}

export function getChangeTypeLabel(type: ChangeRequestType): { label: string; label_th: string } {
  const labels: Record<ChangeRequestType, { label: string; label_th: string }> = {
    design_revision: { label: 'Design Revision', label_th: 'แก้ไขลาย' },
    quantity_increase: { label: 'Increase Quantity', label_th: 'เพิ่มจำนวน' },
    quantity_decrease: { label: 'Decrease Quantity', label_th: 'ลดจำนวน' },
    quantity_change: { label: 'Change Quantity', label_th: 'เปลี่ยนจำนวน' },
    size_change: { label: 'Size Change', label_th: 'เปลี่ยนไซส์' },
    color_change: { label: 'Color Change', label_th: 'เปลี่ยนสี' },
    add_work: { label: 'Add Work', label_th: 'เพิ่มงาน' },
    remove_work: { label: 'Remove Work', label_th: 'ลบงาน' },
    add_addon: { label: 'Add Addon', label_th: 'เพิ่ม Addon' },
    remove_addon: { label: 'Remove Addon', label_th: 'ลบ Addon' },
    change_material: { label: 'Change Material', label_th: 'เปลี่ยนวัสดุ' },
    change_due_date: { label: 'Change Due Date', label_th: 'เปลี่ยนกำหนดส่ง' },
    cancel_item: { label: 'Cancel Item', label_th: 'ยกเลิกรายการ' },
    other: { label: 'Other', label_th: 'อื่นๆ' },
  };
  return labels[type] || labels.other;
}

