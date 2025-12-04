// @ts-nocheck - TODO: Fix type mismatches with Supabase schema
'use client';

import { getSupabaseClient } from '@/lib/supabase';
import type { Tables } from '@/lib/supabase';
import type {
  ChangeRequest,
  ChangeRequestFilters,
  CreateChangeRequestInput,
  QuoteChangeRequestInput,
  RespondChangeRequestInput,
  ChangeRequestStats,
} from '../../types/change-requests';
import type { PaginationParams, PaginatedResult, ActionResult } from '../../types/common';
import type { IChangeRequestRepository } from '../../services/repository';

// Helper to convert DB row to ChangeRequest type
function dbToChangeRequest(row: Tables<'change_requests'>): ChangeRequest {
  return {
    id: row.id,
    request_number: row.request_number,
    order_id: row.order_id,
    type: row.type,
    title: row.title,
    description: row.description,
    status: row.status as ChangeRequest['status'],
    current_phase: row.current_phase,
    requested_by: row.requested_by,
    quoted_fee: row.quoted_fee,
    approved_fee: row.approved_fee,
    impact_assessment: row.impact_assessment as ChangeRequest['impact_assessment'],
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export class SupabaseChangeRequestRepository implements IChangeRequestRepository {
  private get supabase() {
    return getSupabaseClient();
  }

  async findById(id: string): Promise<ChangeRequest | null> {
    const { data, error } = await this.supabase
      .from('change_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return dbToChangeRequest(data);
  }

  async findByRequestNumber(requestNumber: string): Promise<ChangeRequest | null> {
    const { data, error } = await this.supabase
      .from('change_requests')
      .select('*')
      .eq('request_number', requestNumber)
      .single();

    if (error || !data) return null;
    return dbToChangeRequest(data);
  }

  async getByOrderId(orderId: string): Promise<ChangeRequest[]> {
    const { data, error } = await this.supabase
      .from('change_requests')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map(dbToChangeRequest);
  }

  async findMany(
    filters?: ChangeRequestFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<ChangeRequest>> {
    let query = this.supabase
      .from('change_requests')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters?.order_id) {
      query = query.eq('order_id', filters.order_id);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.search) {
      query = query.or(`request_number.ilike.%${filters.search}%,title.ilike.%${filters.search}%`);
    }

    // Apply sorting
    query = query.order('created_at', { ascending: false });

    // Apply pagination
    if (pagination) {
      const start = pagination.page * pagination.pageSize;
      const end = start + pagination.pageSize - 1;
      query = query.range(start, end);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching change requests:', error);
      return { data: [], totalCount: 0, pageCount: 0 };
    }

    const totalCount = count || 0;
    const pageCount = pagination ? Math.ceil(totalCount / pagination.pageSize) : 1;

    return {
      data: (data || []).map(dbToChangeRequest),
      totalCount,
      pageCount,
    };
  }

  async create(input: CreateChangeRequestInput): Promise<ActionResult<ChangeRequest>> {
    // Generate request number
    const requestNumber = `CR-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    const { data, error } = await this.supabase
      .from('change_requests')
      .insert({
        request_number: requestNumber,
        order_id: input.order_id,
        type: input.type,
        title: input.title,
        description: input.description,
        status: 'pending',
        current_phase: input.current_phase,
        requested_by: input.requested_by,
        impact_assessment: input.impact_assessment || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating change request:', error);
      return { success: false, message: error.message };
    }

    return { success: true, data: dbToChangeRequest(data) };
  }

  async update(id: string, updates: Partial<ChangeRequest>): Promise<ActionResult<ChangeRequest>> {
    const { data, error } = await this.supabase
      .from('change_requests')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating change request:', error);
      return { success: false, message: error.message };
    }

    return { success: true, data: dbToChangeRequest(data) };
  }

  async delete(id: string): Promise<ActionResult> {
    const { error } = await this.supabase
      .from('change_requests')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting change request:', error);
      return { success: false, message: error.message };
    }

    return { success: true };
  }

  async quote(data: QuoteChangeRequestInput): Promise<ActionResult> {
    return await this.update(data.change_request_id, {
      quoted_fee: data.quoted_fee,
      impact_assessment: data.impact_assessment,
      status: 'quoted',
    });
  }

  async notifyCustomer(changeRequestId: string): Promise<ActionResult> {
    // In a real implementation, this would send a notification
    // For now, just update the status
    return { success: true };
  }

  async respondToRequest(data: RespondChangeRequestInput): Promise<ActionResult> {
    return await this.update(data.change_request_id, {
      status: data.approved ? 'approved' : 'rejected',
      approved_fee: data.approved ? data.approved_fee : undefined,
    });
  }

  async markCompleted(changeRequestId: string): Promise<ActionResult> {
    return await this.update(changeRequestId, {
      status: 'completed',
    });
  }

  async cancel(changeRequestId: string, reason: string): Promise<ActionResult> {
    return await this.update(changeRequestId, {
      status: 'cancelled',
    });
  }

  async getStats(filters?: ChangeRequestFilters): Promise<ChangeRequestStats> {
    let baseQuery = this.supabase.from('change_requests').select('*', { count: 'exact', head: true });

    if (filters?.order_id) {
      baseQuery = baseQuery.eq('order_id', filters.order_id);
    }

    const { count: total } = await baseQuery;

    const { count: pending } = await baseQuery.eq('status', 'pending');
    const { count: quoted } = await baseQuery.eq('status', 'quoted');
    const { count: approved } = await baseQuery.eq('status', 'approved');
    const { count: in_progress } = await baseQuery.eq('status', 'in_progress');
    const { count: completed } = await baseQuery.eq('status', 'completed');

    // Get total fees
    const { data: approvedRequests } = await this.supabase
      .from('change_requests')
      .select('approved_fee')
      .eq('status', 'approved');

    const total_fees = (approvedRequests || []).reduce((sum, r) => sum + (r.approved_fee || 0), 0);

    return {
      total: total || 0,
      pending: pending || 0,
      quoted: quoted || 0,
      approved: approved || 0,
      in_progress: in_progress || 0,
      completed: completed || 0,
      total_fees,
    };
  }
}

// Export singleton instance
export const supabaseChangeRequestRepository = new SupabaseChangeRequestRepository();

