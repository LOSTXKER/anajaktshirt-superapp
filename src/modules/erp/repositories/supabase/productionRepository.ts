'use client';

import { getSupabaseClient } from '@/lib/supabase';
import type { Tables } from '@/lib/supabase';
import type {
  ProductionJob,
  ProductionStation,
  ProductionJobStatus,
  ProductionStats,
  ProductionJobSummary,
  CreateProductionJobInput,
  UpdateProductionJobInput,
  LogProductionInput,
  ProductionJobFilters,
} from '../../types';
import type { IProductionRepository } from '../../services/repository';
import type { PaginationParams, PaginatedResult, ActionResult } from '../../types/common';

// =============================================
// HELPER FUNCTIONS
// =============================================

function dbToProductionJob(row: Tables<'production_jobs'> & {
  order?: Tables<'orders'> & { customer?: Tables<'customers'> } | null;
  station?: Tables<'production_stations'> | null;
}): ProductionJob {
  return {
    id: row.id,
    job_number: row.job_number,
    order_id: row.order_id,
    work_item_id: row.work_item_id,
    work_type_code: row.work_type_code,
    status: row.status as ProductionJobStatus,
    priority: row.priority,
    station_id: row.station_id,
    assigned_to: row.assigned_to,
    total_qty: row.total_qty,
    completed_qty: row.completed_qty,
    defect_qty: row.defect_qty,
    due_date: row.due_date,
    started_at: row.started_at,
    completed_at: row.completed_at,
    description: row.description,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
    order: row.order ? {
      id: row.order.id,
      order_number: row.order.order_number,
      customer_name: row.order.customer?.name || '',
    } : undefined,
    station: row.station ? {
      id: row.station.id,
      name: row.station.name,
      code: row.station.code,
    } : undefined,
  } as ProductionJob;
}

function dbToProductionStation(row: Tables<'production_stations'>): ProductionStation {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    work_type_codes: row.work_type_codes,
    capacity_per_day: row.capacity_per_day,
    is_active: row.is_active,
    current_job_id: row.current_job_id,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
  } as ProductionStation;
}

// =============================================
// SUPABASE PRODUCTION REPOSITORY
// =============================================

export class SupabaseProductionRepository implements IProductionRepository {
  private get supabase() {
    return getSupabaseClient();
  }

  // ==================== BASE CRUD ====================

  async findById(id: string): Promise<ProductionJob | null> {
    const { data, error } = await this.supabase
      .from('production_jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    // Fetch related data separately
    const enrichedData = await this.enrichProductionJob(data);
    return dbToProductionJob(enrichedData);
  }

  async findByJobNumber(jobNumber: string): Promise<ProductionJob | null> {
    const { data, error } = await this.supabase
      .from('production_jobs')
      .select('*')
      .eq('job_number', jobNumber)
      .single();

    if (error || !data) return null;

    // Fetch related data separately
    const enrichedData = await this.enrichProductionJob(data);
    return dbToProductionJob(enrichedData);
  }

  // Helper to fetch related data
  private async enrichProductionJob(job: any): Promise<any> {
    const enriched = { ...job };

    // Fetch order if exists
    if (job.order_id) {
      const { data: order } = await this.supabase
        .from('orders')
        .select('id, order_number, customer_id')
        .eq('id', job.order_id)
        .single();

      if (order) {
        enriched.order = order;

        // Fetch customer if exists
        if (order.customer_id) {
          const { data: customer } = await this.supabase
            .from('customers')
            .select('id, name')
            .eq('id', order.customer_id)
            .single();

          if (customer) {
            enriched.order.customer = customer;
          }
        }
      }
    }

    // Fetch station if exists
    if (job.station_id) {
      const { data: station } = await this.supabase
        .from('production_stations')
        .select('*')
        .eq('id', job.station_id)
        .single();

      if (station) {
        enriched.station = station;
      }
    }

    return enriched;
  }

  async findMany(
    filters?: ProductionJobFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<ProductionJob>> {
    let query = this.supabase
      .from('production_jobs')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters?.order_id) {
      query = query.eq('order_id', filters.order_id);
    }
    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status);
      } else {
        query = query.eq('status', filters.status);
      }
    }
    if (filters?.work_type_code) {
      query = query.eq('work_type_code', filters.work_type_code);
    }
    if (filters?.station_id) {
      query = query.eq('station_id', filters.station_id);
    }
    if (filters?.priority !== undefined) {
      query = query.eq('priority', filters.priority);
    }
    if (filters?.search) {
      query = query.or(`job_number.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    // Apply sorting
    query = query.order('priority', { ascending: false }).order('created_at', { ascending: false });

    // Apply pagination
    const page = pagination?.page || 0;
    const pageSize = pagination?.pageSize || 20;
    const start = page * pageSize;
    const end = start + pageSize - 1;
    query = query.range(start, end);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching production jobs:', error);
      return {
        data: [],
        pagination: { page, pageSize, totalCount: 0, totalPages: 0 },
      };
    }

    // Fetch related data for all jobs
    const enrichedJobs = await this.enrichProductionJobs(data || []);

    const totalCount = count || 0;
    return {
      data: enrichedJobs.map(dbToProductionJob),
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    };
  }

  // Batch enrich for multiple jobs
  private async enrichProductionJobs(jobs: any[]): Promise<any[]> {
    if (jobs.length === 0) return [];

    // Fetch all unique order IDs
    const orderIds = [...new Set(jobs.map(j => j.order_id).filter(Boolean))];
    const stationIds = [...new Set(jobs.map(j => j.station_id).filter(Boolean))];

    // Batch fetch orders
    let ordersMap: Record<string, any> = {};
    if (orderIds.length > 0) {
      const { data: orders } = await this.supabase
        .from('orders')
        .select('id, order_number, customer_id')
        .in('id', orderIds);

      if (orders) {
        // Fetch customers for these orders
        const customerIds = [...new Set(orders.map(o => o.customer_id).filter(Boolean))];
        let customersMap: Record<string, any> = {};

        if (customerIds.length > 0) {
          const { data: customers } = await this.supabase
            .from('customers')
            .select('id, name')
            .in('id', customerIds);

          if (customers) {
            customersMap = Object.fromEntries(customers.map(c => [c.id, c]));
          }
        }

        // Map orders with customers
        ordersMap = Object.fromEntries(
          orders.map(o => [
            o.id,
            {
              ...o,
              customer: o.customer_id ? customersMap[o.customer_id] : null,
            },
          ])
        );
      }
    }

    // Batch fetch stations
    let stationsMap: Record<string, any> = {};
    if (stationIds.length > 0) {
      const { data: stations } = await this.supabase
        .from('production_stations')
        .select('*')
        .in('id', stationIds);

      if (stations) {
        stationsMap = Object.fromEntries(stations.map(s => [s.id, s]));
      }
    }

    // Enrich jobs with fetched data
    return jobs.map(job => ({
      ...job,
      order: job.order_id ? ordersMap[job.order_id] : null,
      station: job.station_id ? stationsMap[job.station_id] : null,
    }));
  }

  async create(input: CreateProductionJobInput): Promise<ActionResult<ProductionJob>> {
    const jobNumber = `JOB-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    const { data, error } = await this.supabase
      .from('production_jobs')
      .insert({
        job_number: jobNumber,
        order_id: input.order_id,
        work_item_id: input.order_work_item_id,
        work_type_code: input.work_type_code,
        status: 'pending',
        priority: input.priority || 0,
        station_id: input.station_id,
        assigned_to: input.assigned_to,
        total_qty: input.ordered_qty,
        completed_qty: 0,
        defect_qty: 0,
        due_date: input.due_date,
        description: input.description,
        notes: input.production_notes,
      })
      .select(`
        *,
        order:orders(*, customer:customers(*)),
        station:production_stations(*)
      `)
      .single();

    if (error) {
      console.error('Error creating production job:', error);
      return { success: false, message: error.message };
    }

    return { success: true, data: dbToProductionJob(data) };
  }

  async update(id: string, input: UpdateProductionJobInput): Promise<ActionResult<ProductionJob>> {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (input.status !== undefined) updateData.status = input.status;
    if (input.produced_qty !== undefined) updateData.completed_qty = input.produced_qty;
    if (input.priority !== undefined) updateData.priority = input.priority;
    if (input.station_id !== undefined) updateData.station_id = input.station_id;
    if (input.assigned_to !== undefined) updateData.assigned_to = input.assigned_to;
    if (input.production_notes !== undefined) updateData.notes = input.production_notes;

    // Set started_at if status changes to in_progress
    if (input.status === 'in_progress') {
      updateData.started_at = new Date().toISOString();
    }

    // Set completed_at if status changes to completed
    if (input.status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await this.supabase
      .from('production_jobs')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        order:orders(*, customer:customers(*)),
        station:production_stations(*)
      `)
      .single();

    if (error) {
      console.error('Error updating production job:', error);
      return { success: false, message: error.message };
    }

    return { success: true, data: dbToProductionJob(data) };
  }

  async delete(id: string): Promise<ActionResult> {
    const { error } = await this.supabase
      .from('production_jobs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting production job:', error);
      return { success: false, message: error.message };
    }

    return { success: true };
  }

  // ==================== STATIONS ====================

  async getStations(): Promise<ProductionStation[]> {
    const { data, error } = await this.supabase
      .from('production_stations')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching production stations:', error);
      return [];
    }

    return (data || []).map(dbToProductionStation);
  }

  async getStationWorkload(stationId: string): Promise<{ pending: number; in_progress: number }> {
    const { count: pending } = await this.supabase
      .from('production_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('station_id', stationId)
      .in('status', ['pending', 'queued']);

    const { count: in_progress } = await this.supabase
      .from('production_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('station_id', stationId)
      .in('status', ['assigned', 'in_progress']);

    return {
      pending: pending || 0,
      in_progress: in_progress || 0,
    };
  }

  // ==================== JOB OPERATIONS ====================

  async assignToStation(jobId: string, stationId: string): Promise<ActionResult> {
    const { error } = await this.supabase
      .from('production_jobs')
      .update({
        station_id: stationId,
        status: 'queued',
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (error) {
      console.error('Error assigning job to station:', error);
      return { success: false, message: error.message };
    }

    return { success: true };
  }

  async assignToWorker(jobId: string, workerId: string): Promise<ActionResult> {
    const { error } = await this.supabase
      .from('production_jobs')
      .update({
        assigned_to: workerId,
        status: 'assigned',
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (error) {
      console.error('Error assigning job to worker:', error);
      return { success: false, message: error.message };
    }

    return { success: true };
  }

  async startJob(jobId: string): Promise<ActionResult> {
    const { error } = await this.supabase
      .from('production_jobs')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (error) {
      console.error('Error starting job:', error);
      return { success: false, message: error.message };
    }

    return { success: true };
  }

  async logProduction(input: LogProductionInput): Promise<ActionResult> {
    // Get current job
    const { data: job, error: fetchError } = await this.supabase
      .from('production_jobs')
      .select('completed_qty')
      .eq('id', input.job_id)
      .single();

    if (fetchError || !job) {
      return { success: false, message: 'Job not found' };
    }

    const newCompletedQty = (job.completed_qty || 0) + (input.produced_qty || 0);

    const updateData: any = {
      completed_qty: newCompletedQty,
      updated_at: new Date().toISOString(),
    };

    if (input.action === 'start') {
      updateData.status = 'in_progress';
      updateData.started_at = new Date().toISOString();
    } else if (input.action === 'complete') {
      updateData.status = 'completed';
      updateData.completed_at = new Date().toISOString();
    } else if (input.action === 'pause') {
      updateData.status = 'assigned';
    }

    if (input.notes) {
      updateData.notes = input.notes;
    }

    const { error } = await this.supabase
      .from('production_jobs')
      .update(updateData)
      .eq('id', input.job_id);

    if (error) {
      console.error('Error logging production:', error);
      return { success: false, message: error.message };
    }

    return { success: true };
  }

  async completeJob(jobId: string): Promise<ActionResult> {
    const { error } = await this.supabase
      .from('production_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (error) {
      console.error('Error completing job:', error);
      return { success: false, message: error.message };
    }

    return { success: true };
  }

  // ==================== QUEUE ====================

  async getQueue(stationId?: string): Promise<ProductionJobSummary[]> {
    let query = this.supabase
      .from('production_jobs')
      .select('id, job_number, work_type_code, status, priority, total_qty, completed_qty, due_date, order_id')
      .in('status', ['pending', 'queued', 'assigned'])
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true });

    if (stationId) {
      query = query.eq('station_id', stationId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching queue:', error);
      return [];
    }

    if (!data || data.length === 0) return [];

    // Fetch order and customer data separately
    const orderIds = [...new Set(data.map((j: any) => j.order_id).filter(Boolean))];
    let ordersMap: Record<string, any> = {};

    if (orderIds.length > 0) {
      const { data: orders } = await this.supabase
        .from('orders')
        .select('id, order_number, customer_id')
        .in('id', orderIds);

      if (orders) {
        const customerIds = [...new Set(orders.map(o => o.customer_id).filter(Boolean))];
        let customersMap: Record<string, any> = {};

        if (customerIds.length > 0) {
          const { data: customers } = await this.supabase
            .from('customers')
            .select('id, name')
            .in('id', customerIds);

          if (customers) {
            customersMap = Object.fromEntries(customers.map(c => [c.id, c]));
          }
        }

        ordersMap = Object.fromEntries(
          orders.map(o => [
            o.id,
            {
              ...o,
              customer: o.customer_id ? customersMap[o.customer_id] : null,
            },
          ])
        );
      }
    }

    // Fetch work type names
    const workTypeCodes = [...new Set(data.map((j: any) => j.work_type_code).filter(Boolean))];
    let workTypesMap: Record<string, string> = {};

    if (workTypeCodes.length > 0) {
      const { data: workTypes } = await this.supabase
        .from('work_types')
        .select('code, name')
        .in('code', workTypeCodes);

      if (workTypes) {
        workTypesMap = Object.fromEntries(workTypes.map(wt => [wt.code, wt.name]));
      }
    }

    const now = new Date();
    return data.map((job: any) => {
      const order = job.order_id ? ordersMap[job.order_id] : null;
      return {
        id: job.id,
        job_number: job.job_number,
        order_number: order?.order_number || '',
        customer_name: order?.customer?.name || '',
        work_type_code: job.work_type_code,
        work_type_name: workTypesMap[job.work_type_code] || job.work_type_code,
        status: job.status,
        priority: job.priority,
        ordered_qty: job.total_qty,
        produced_qty: job.completed_qty,
        progress_percent: job.total_qty > 0 ? Math.round((job.completed_qty / job.total_qty) * 100) : 0,
        due_date: job.due_date,
        is_overdue: job.due_date ? new Date(job.due_date) < now : false,
      };
    });
  }

  async reorderQueue(jobIds: string[]): Promise<ActionResult> {
    // Update priority based on position in array
    for (let i = 0; i < jobIds.length; i++) {
      const { error } = await this.supabase
        .from('production_jobs')
        .update({ priority: jobIds.length - i })
        .eq('id', jobIds[i]);

      if (error) {
        console.error('Error reordering queue:', error);
        return { success: false, message: error.message };
      }
    }

    return { success: true };
  }

  // ==================== STATISTICS ====================

  async getStats(filters?: ProductionJobFilters): Promise<ProductionStats> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

    const { count: total_jobs } = await this.supabase
      .from('production_jobs')
      .select('*', { count: 'exact', head: true });

    const { count: pending_jobs } = await this.supabase
      .from('production_jobs')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'queued']);

    const { count: in_progress_jobs } = await this.supabase
      .from('production_jobs')
      .select('*', { count: 'exact', head: true })
      .in('status', ['assigned', 'in_progress']);

    const { count: completed_today } = await this.supabase
      .from('production_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('completed_at', todayStart)
      .lt('completed_at', todayEnd);

    // Calculate total qty pending
    const { data: pendingQtyData } = await this.supabase
      .from('production_jobs')
      .select('total_qty')
      .in('status', ['pending', 'queued', 'assigned', 'in_progress']);

    const total_qty_pending = pendingQtyData?.reduce((sum, job) => sum + (job.total_qty || 0), 0) || 0;

    // Calculate total qty completed today
    const { data: completedQtyData } = await this.supabase
      .from('production_jobs')
      .select('completed_qty')
      .eq('status', 'completed')
      .gte('completed_at', todayStart)
      .lt('completed_at', todayEnd);

    const total_qty_completed_today = completedQtyData?.reduce((sum, job) => sum + (job.completed_qty || 0), 0) || 0;

    return {
      total_jobs: total_jobs || 0,
      pending_jobs: pending_jobs || 0,
      in_progress_jobs: in_progress_jobs || 0,
      completed_today: completed_today || 0,
      total_qty_pending,
      total_qty_completed_today,
      // NOTE: These require historical data analysis across multiple tables
      // Implement when we have enough production history
      on_time_rate: 100, // Percentage of jobs completed before due_date
      rework_rate: 0, // Percentage of jobs that required rework (from QC data)
    };
  }
}

// Export singleton instance
export const supabaseProductionRepository = new SupabaseProductionRepository();
