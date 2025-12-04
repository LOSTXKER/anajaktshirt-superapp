// =============================================
// PRODUCTION SERVICE
// =============================================

import { getProductionRepository } from './repository';
import type {
  ProductionJob,
  ProductionStation,
  ProductionJobFilters,
  CreateProductionJobInput,
  UpdateProductionJobInput,
  LogProductionInput,
  ProductionStats,
  ProductionJobSummary,
} from '../types/production';
import type { PaginationParams, PaginatedResult, ActionResult } from '../types/common';

// ---------------------------------------------
// Production Job CRUD
// ---------------------------------------------

export async function getProductionJob(id: string): Promise<ProductionJob | null> {
  return getProductionRepository().findById(id);
}

export async function getProductionJobByNumber(jobNumber: string): Promise<ProductionJob | null> {
  return getProductionRepository().findByJobNumber(jobNumber);
}

export async function getProductionJobs(
  filters?: ProductionJobFilters,
  pagination?: PaginationParams
): Promise<PaginatedResult<ProductionJob>> {
  return getProductionRepository().findMany(filters, pagination);
}

export async function createProductionJob(data: CreateProductionJobInput): Promise<ActionResult<ProductionJob>> {
  return getProductionRepository().create(data);
}

export async function updateProductionJob(
  id: string,
  data: UpdateProductionJobInput
): Promise<ActionResult<ProductionJob>> {
  return getProductionRepository().update(id, data);
}

// ---------------------------------------------
// Stations
// ---------------------------------------------

export async function getStations(): Promise<ProductionStation[]> {
  return getProductionRepository().getStations();
}

export async function getStationWorkload(stationId: string): Promise<{ pending: number; in_progress: number }> {
  return getProductionRepository().getStationWorkload(stationId);
}

// ---------------------------------------------
// Job Operations
// ---------------------------------------------

export async function assignJobToStation(jobId: string, stationId: string): Promise<ActionResult> {
  return getProductionRepository().assignToStation(jobId, stationId);
}

export async function assignJobToWorker(jobId: string, workerId: string): Promise<ActionResult> {
  return getProductionRepository().assignToWorker(jobId, workerId);
}

export async function startJob(jobId: string): Promise<ActionResult> {
  return getProductionRepository().startJob(jobId);
}

export async function logProduction(data: LogProductionInput): Promise<ActionResult> {
  return getProductionRepository().logProduction(data);
}

export async function completeJob(jobId: string): Promise<ActionResult> {
  return getProductionRepository().completeJob(jobId);
}

// ---------------------------------------------
// Queue
// ---------------------------------------------

export async function getProductionQueue(stationId?: string): Promise<ProductionJobSummary[]> {
  return getProductionRepository().getQueue(stationId);
}

export async function reorderQueue(jobIds: string[]): Promise<ActionResult> {
  return getProductionRepository().reorderQueue(jobIds);
}

// ---------------------------------------------
// Stats
// ---------------------------------------------

export async function getProductionStats(filters?: ProductionJobFilters): Promise<ProductionStats> {
  return getProductionRepository().getStats(filters);
}

// ---------------------------------------------
// Business Logic Helpers
// ---------------------------------------------

export function calculateJobProgress(job: ProductionJob): number {
  if (job.ordered_qty === 0) return 0;
  return Math.round((job.produced_qty / job.ordered_qty) * 100);
}

export function isJobOverdue(job: ProductionJob): boolean {
  if (!job.due_date) return false;
  if (['completed', 'cancelled'].includes(job.status)) return false;
  
  const dueDate = new Date(job.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return dueDate < today;
}

export function estimateCompletionTime(job: ProductionJob): Date | null {
  if (!job.estimated_hours) return null;
  if (!job.started_at) return null;
  
  const startTime = new Date(job.started_at);
  const remainingQty = job.ordered_qty - job.produced_qty;
  const hoursPerUnit = job.estimated_hours / job.ordered_qty;
  const remainingHours = remainingQty * hoursPerUnit;
  
  return new Date(startTime.getTime() + remainingHours * 60 * 60 * 1000);
}

export function getPriorityLabel(priority: number): { label: string; color: string } {
  const priorities: Record<number, { label: string; color: string }> = {
    0: { label: 'ปกติ', color: 'gray' },
    1: { label: 'เร่ง', color: 'amber' },
    2: { label: 'ด่วน', color: 'orange' },
    3: { label: 'ด่วนมาก', color: 'red' },
  };
  return priorities[priority] || priorities[0];
}

