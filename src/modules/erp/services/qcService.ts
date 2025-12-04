// =============================================
// QC SERVICE
// =============================================

import { getQCRepository } from './repository';
import type {
  QCRecord,
  QCTemplate,
  QCRecordFilters,
  CreateQCRecordInput,
  QCActionInput,
  QCStats,
} from '../types/qc';
import type { QCResult, QCStage } from '../types/enums';
import type { PaginationParams, PaginatedResult, ActionResult } from '../types/common';

// ---------------------------------------------
// QC Templates
// ---------------------------------------------

export async function getQCTemplates(workTypeCode?: string): Promise<QCTemplate[]> {
  return getQCRepository().getTemplates(workTypeCode);
}

// ---------------------------------------------
// QC Records
// ---------------------------------------------

export async function getQCRecord(id: string): Promise<QCRecord | null> {
  return getQCRepository().findById(id);
}

export async function getQCRecords(
  filters?: QCRecordFilters,
  pagination?: PaginationParams
): Promise<PaginatedResult<QCRecord>> {
  return getQCRepository().findMany(filters, pagination);
}

export async function createQCRecord(data: CreateQCRecordInput): Promise<ActionResult<QCRecord>> {
  return getQCRepository().create(data);
}

// ---------------------------------------------
// QC Actions
// ---------------------------------------------

export async function takeQCAction(data: QCActionInput): Promise<ActionResult> {
  return getQCRepository().takeAction(data);
}

export async function markFollowUpComplete(recordId: string): Promise<ActionResult> {
  return getQCRepository().markFollowUpComplete(recordId);
}

// ---------------------------------------------
// Stats
// ---------------------------------------------

export async function getQCStats(filters?: QCRecordFilters): Promise<QCStats> {
  return getQCRepository().getStats(filters);
}

// ---------------------------------------------
// Business Logic Helpers
// ---------------------------------------------

export function calculateQCResult(
  passedQty: number,
  failedQty: number,
  reworkQty: number,
  totalQty: number
): QCResult {
  if (failedQty === 0 && reworkQty === 0) {
    return 'pass';
  }
  
  if (passedQty === 0) {
    return 'fail';
  }
  
  return 'partial';
}

export function calculatePassRate(passedQty: number, checkedQty: number): number {
  if (checkedQty === 0) return 0;
  return Math.round((passedQty / checkedQty) * 100 * 100) / 100; // 2 decimal places
}

export function getQCStageLabel(stage: QCStage): { label: string; label_th: string } {
  const labels: Record<QCStage, { label: string; label_th: string }> = {
    material: { label: 'Material QC', label_th: 'ตรวจวัตถุดิบ' },
    pre_production: { label: 'Pre-Production QC', label_th: 'ตรวจก่อนผลิต' },
    in_process: { label: 'In-Process QC', label_th: 'ตรวจระหว่างผลิต' },
    post_production: { label: 'Post-Production QC', label_th: 'ตรวจหลังผลิต' },
    final: { label: 'Final QC', label_th: 'ตรวจก่อนส่ง' },
  };
  return labels[stage];
}

export function getQCResultLabel(result: QCResult): { label: string; label_th: string; color: string } {
  const labels: Record<QCResult, { label: string; label_th: string; color: string }> = {
    pass: { label: 'Pass', label_th: 'ผ่าน', color: 'green' },
    fail: { label: 'Fail', label_th: 'ไม่ผ่าน', color: 'red' },
    partial: { label: 'Partial', label_th: 'ผ่านบางส่วน', color: 'yellow' },
    pending: { label: 'Pending', label_th: 'รอตรวจ', color: 'gray' },
  };
  return labels[result];
}

export function shouldRequireFollowUp(
  result: QCResult,
  failedQty: number,
  defectSeverity?: 'minor' | 'major' | 'critical'
): boolean {
  // Always follow up on critical defects
  if (defectSeverity === 'critical') return true;
  
  // Follow up on failures
  if (result === 'fail') return true;
  
  // Follow up if significant failures
  if (failedQty > 10) return true;
  
  // Follow up on major defects
  if (defectSeverity === 'major' && failedQty > 0) return true;
  
  return false;
}

export function getDefaultCheckpoints(workTypeCode: string): {
  code: string;
  name: string;
  name_th: string;
  required: boolean;
}[] {
  const defaultCheckpoints: Record<string, { code: string; name: string; name_th: string; required: boolean }[]> = {
    dtg: [
      { code: 'color_accuracy', name: 'Color Accuracy', name_th: 'ความถูกต้องของสี', required: true },
      { code: 'print_alignment', name: 'Print Alignment', name_th: 'ตำแหน่งลาย', required: true },
      { code: 'print_quality', name: 'Print Quality', name_th: 'คุณภาพการพิมพ์', required: true },
      { code: 'fabric_damage', name: 'Fabric Condition', name_th: 'สภาพผ้า', required: true },
    ],
    dtf: [
      { code: 'transfer_adhesion', name: 'Transfer Adhesion', name_th: 'การยึดติดของฟิล์ม', required: true },
      { code: 'color_accuracy', name: 'Color Accuracy', name_th: 'ความถูกต้องของสี', required: true },
      { code: 'print_alignment', name: 'Print Alignment', name_th: 'ตำแหน่งลาย', required: true },
      { code: 'edge_quality', name: 'Edge Quality', name_th: 'ขอบลาย', required: true },
    ],
    embroidery: [
      { code: 'thread_color', name: 'Thread Color', name_th: 'สีด้าย', required: true },
      { code: 'stitch_quality', name: 'Stitch Quality', name_th: 'คุณภาพฝีเข็ม', required: true },
      { code: 'position', name: 'Position', name_th: 'ตำแหน่งปัก', required: true },
      { code: 'backing_clean', name: 'Backing Clean', name_th: 'ความสะอาดด้านหลัง', required: true },
    ],
    silkscreen: [
      { code: 'ink_coverage', name: 'Ink Coverage', name_th: 'ความทึบของหมึก', required: true },
      { code: 'registration', name: 'Registration', name_th: 'ความตรงของบล็อก', required: true },
      { code: 'print_cleanliness', name: 'Print Cleanliness', name_th: 'ความสะอาดลาย', required: true },
    ],
    sewing: [
      { code: 'seam_quality', name: 'Seam Quality', name_th: 'คุณภาพตะเข็บ', required: true },
      { code: 'measurements', name: 'Measurements', name_th: 'ขนาด/สัดส่วน', required: true },
      { code: 'finishing', name: 'Finishing', name_th: 'ความเรียบร้อย', required: true },
    ],
  };
  
  return defaultCheckpoints[workTypeCode] || [
    { code: 'general_quality', name: 'General Quality', name_th: 'คุณภาพทั่วไป', required: true },
    { code: 'specifications', name: 'Specifications', name_th: 'ตามสเปค', required: true },
  ];
}

