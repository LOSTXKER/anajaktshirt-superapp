// @ts-nocheck - TODO: Fix type mismatches with Supabase schema
'use client';

import { getSupabaseClient } from '@/lib/supabase';
import type { Tables } from '@/lib/supabase';
import type {
  QCRecord,
  QCTemplate,
  QCRecordFilters,
  CreateQCRecordInput,
  QCActionInput,
  QCStats,
} from '../../types/qc';
import type { PaginationParams, PaginatedResult, ActionResult } from '../../types/common';
import type { IQCRepository } from '../../services/repository';

// Helper to convert DB row to QCRecord type
function dbToQCRecord(row: Tables<'qc_records'>): QCRecord {
  return {
    id: row.id,
    order_id: row.order_id,
    production_job_id: row.production_job_id,
    stage: row.stage,
    checked_qty: row.checked_qty,
    passed_qty: row.passed_qty,
    failed_qty: row.failed_qty,
    overall_result: row.overall_result as QCRecord['overall_result'],
    checkpoints: row.checkpoints as QCRecord['checkpoints'],
    defects_found: row.defects_found as QCRecord['defects_found'],
    notes: row.notes,
    checked_by: row.checked_by,
    checked_at: row.checked_at,
    created_at: row.created_at,
  };
}

export class SupabaseQCRepository implements IQCRepository {
  private get supabase() {
    return getSupabaseClient();
  }

  async getTemplates(workTypeCode?: string): Promise<QCTemplate[]> {
    // For now, return mock templates
    // In a full implementation, these would be stored in a qc_templates table
    return [
      {
        id: 'tmpl-material',
        name: 'Material Check',
        work_type_code: workTypeCode,
        stage: 'material_check',
        checkpoints: [
          { id: '1', name: 'สภาพผ้า', description: 'ตรวจสอบคุณภาพผ้า' },
          { id: '2', name: 'สีผ้า', description: 'ตรวจสอบความสม่ำเสมอของสี' },
        ],
        is_active: true,
        created_at: new Date().toISOString(),
      },
    ];
  }

  async findById(id: string): Promise<QCRecord | null> {
    const { data, error } = await this.supabase
      .from('qc_records')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return dbToQCRecord(data);
  }

  async findMany(
    filters?: QCRecordFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<QCRecord>> {
    let query = this.supabase
      .from('qc_records')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters?.order_id) {
      query = query.eq('order_id', filters.order_id);
    }
    if (filters?.production_job_id) {
      query = query.eq('production_job_id', filters.production_job_id);
    }
    if (filters?.stage) {
      query = query.eq('stage', filters.stage);
    }
    if (filters?.overall_result) {
      query = query.eq('overall_result', filters.overall_result);
    }

    // Apply sorting
    query = query.order('checked_at', { ascending: false });

    // Apply pagination
    if (pagination) {
      const start = pagination.page * pagination.pageSize;
      const end = start + pagination.pageSize - 1;
      query = query.range(start, end);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching QC records:', error);
      return { data: [], totalCount: 0, pageCount: 0 };
    }

    const totalCount = count || 0;
    const pageCount = pagination ? Math.ceil(totalCount / pagination.pageSize) : 1;

    return {
      data: (data || []).map(dbToQCRecord),
      totalCount,
      pageCount,
    };
  }

  async create(input: CreateQCRecordInput): Promise<ActionResult<QCRecord>> {
    const { data, error } = await this.supabase
      .from('qc_records')
      .insert({
        order_id: input.order_id,
        production_job_id: input.production_job_id,
        stage: input.stage,
        checked_qty: input.checked_qty,
        passed_qty: input.passed_qty,
        failed_qty: input.failed_qty,
        overall_result: input.overall_result,
        checkpoints: input.checkpoints || [],
        defects_found: input.defects_found || [],
        notes: input.notes,
        checked_by: input.checked_by,
        checked_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating QC record:', error);
      return { success: false, message: error.message };
    }

    return { success: true, data: dbToQCRecord(data) };
  }

  async takeAction(data: QCActionInput): Promise<ActionResult> {
    // Update production job status based on QC action
    if (data.action === 'approve') {
      const { error } = await this.supabase
        .from('production_jobs')
        .update({ status: 'qc_passed' })
        .eq('id', data.production_job_id);

      if (error) {
        return { success: false, message: error.message };
      }
    } else if (data.action === 'reject') {
      const { error } = await this.supabase
        .from('production_jobs')
        .update({ status: 'qc_failed' })
        .eq('id', data.production_job_id);

      if (error) {
        return { success: false, message: error.message };
      }
    } else if (data.action === 'rework') {
      const { error } = await this.supabase
        .from('production_jobs')
        .update({ status: 'rework' })
        .eq('id', data.production_job_id);

      if (error) {
        return { success: false, message: error.message };
      }
    }

    return { success: true };
  }

  async markFollowUpComplete(recordId: string): Promise<ActionResult> {
    // In a full implementation, this would update the record's follow-up status
    return { success: true };
  }

  async getStats(filters?: QCRecordFilters): Promise<QCStats> {
    let baseQuery = this.supabase.from('qc_records').select('*', { count: 'exact', head: true });

    if (filters?.order_id) {
      baseQuery = baseQuery.eq('order_id', filters.order_id);
    }
    if (filters?.production_job_id) {
      baseQuery = baseQuery.eq('production_job_id', filters.production_job_id);
    }

    const { count: total } = await baseQuery;

    const { count: pass } = await baseQuery.eq('overall_result', 'pass');
    const { count: fail } = await baseQuery.eq('overall_result', 'fail');
    const { count: partial } = await baseQuery.eq('overall_result', 'partial');

    // Get total defects
    const { data: records } = await this.supabase
      .from('qc_records')
      .select('failed_qty, defects_found');

    const total_defects = (records || []).reduce((sum, r) => sum + (r.failed_qty || 0), 0);
    const pass_rate = total ? ((pass || 0) / total) * 100 : 0;

    return {
      total: total || 0,
      pass: pass || 0,
      fail: fail || 0,
      partial: partial || 0,
      total_defects,
      pass_rate: parseFloat(pass_rate.toFixed(1)),
    };
  }
}

// Export singleton instance
export const supabaseQCRepository = new SupabaseQCRepository();

