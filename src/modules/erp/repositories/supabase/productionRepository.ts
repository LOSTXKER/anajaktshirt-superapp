'use client';

import { getSupabaseClient } from '@/lib/supabase';
import type { Tables } from '@/lib/supabase';
import type {
  ProductionJob,
  ProductionStation,
  ProductionJobStatus,
} from '../../types';
import type { Pagination } from '../../types/common';

// Helper to convert DB row to ProductionJob type
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
  };
}

// Helper to convert DB row to ProductionStation type
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
  };
}

export class SupabaseProductionRepository {
  private get supabase() {
    return getSupabaseClient();
  }

  // ==================== PRODUCTION JOBS ====================

  async findJobById(id: string): Promise<ProductionJob | null> {
    const { data, error } = await this.supabase
      .from('production_jobs')
      .select(`
        *,
        order:orders(*, customer:customers(*)),
        station:production_stations(*)
      `)
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return dbToProductionJob(data);
  }

  async findJobs(
    filters?: {
      order_id?: string;
      status?: ProductionJobStatus | ProductionJobStatus[];
      work_type_code?: string;
      station_id?: string;
      priority?: number;
      search?: string;
    },
    pagination?: Pagination
  ): Promise<{ data: ProductionJob[]; totalCount: number }> {
    let query = this.supabase
      .from('production_jobs')
      .select(`
        *,
        order:orders(*, customer:customers(*)),
        station:production_stations(*)
      `, { count: 'exact' });

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
    if (pagination) {
      const start = pagination.page * pagination.pageSize;
      const end = start + pagination.pageSize - 1;
      query = query.range(start, end);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching production jobs:', error);
      return { data: [], totalCount: 0 };
    }

    return {
      data: (data || []).map(dbToProductionJob),
      totalCount: count || 0,
    };
  }

  async createJob(input: Omit<ProductionJob, 'id' | 'job_number' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; data?: ProductionJob; message?: string }> {
    // Generate job number
    const jobNumber = `JOB-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    const { data, error } = await this.supabase
      .from('production_jobs')
      .insert({
        job_number: jobNumber,
        order_id: input.order_id,
        work_item_id: input.work_item_id,
        work_type_code: input.work_type_code,
        status: input.status || 'pending',
        priority: input.priority || 0,
        station_id: input.station_id,
        assigned_to: input.assigned_to,
        total_qty: input.total_qty,
        completed_qty: input.completed_qty || 0,
        defect_qty: input.defect_qty || 0,
        due_date: input.due_date,
        description: input.description,
        notes: input.notes,
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

  async updateJob(id: string, input: Partial<ProductionJob>): Promise<{ success: boolean; data?: ProductionJob; message?: string }> {
    const updateData: any = {
      ...input,
      updated_at: new Date().toISOString(),
    };

    // Set started_at if status changes to in_progress
    if (input.status === 'in_progress' && !input.started_at) {
      updateData.started_at = new Date().toISOString();
    }

    // Set completed_at if status changes to completed
    if (input.status === 'completed' && !input.completed_at) {
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

  async deleteJob(id: string): Promise<{ success: boolean; message?: string }> {
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

  // ==================== PRODUCTION STATIONS ====================

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

  async getStationById(id: string): Promise<ProductionStation | null> {
    const { data, error } = await this.supabase
      .from('production_stations')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return dbToProductionStation(data);
  }

  async createStation(input: Omit<ProductionStation, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; data?: ProductionStation; message?: string }> {
    const { data, error } = await this.supabase
      .from('production_stations')
      .insert(input)
      .select()
      .single();

    if (error) {
      console.error('Error creating production station:', error);
      return { success: false, message: error.message };
    }

    return { success: true, data: dbToProductionStation(data) };
  }

  async updateStation(id: string, input: Partial<ProductionStation>): Promise<{ success: boolean; data?: ProductionStation; message?: string }> {
    const { data, error } = await this.supabase
      .from('production_stations')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating production station:', error);
      return { success: false, message: error.message };
    }

    return { success: true, data: dbToProductionStation(data) };
  }

  // ==================== STATISTICS ====================

  async getProductionStats(): Promise<{
    total_jobs: number;
    pending: number;
    in_progress: number;
    completed_today: number;
    overdue: number;
  }> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

    const { count: total_jobs } = await this.supabase
      .from('production_jobs')
      .select('*', { count: 'exact', head: true });

    const { count: pending } = await this.supabase
      .from('production_jobs')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'queued']);

    const { count: in_progress } = await this.supabase
      .from('production_jobs')
      .select('*', { count: 'exact', head: true })
      .in('status', ['assigned', 'in_progress']);

    const { count: completed_today } = await this.supabase
      .from('production_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('completed_at', todayStart)
      .lt('completed_at', todayEnd);

    const { count: overdue } = await this.supabase
      .from('production_jobs')
      .select('*', { count: 'exact', head: true })
      .lt('due_date', now.toISOString())
      .not('status', 'in', '(completed,cancelled)');

    return {
      total_jobs: total_jobs || 0,
      pending: pending || 0,
      in_progress: in_progress || 0,
      completed_today: completed_today || 0,
      overdue: overdue || 0,
    };
  }
}

// Export singleton instance
export const supabaseProductionRepository = new SupabaseProductionRepository();

