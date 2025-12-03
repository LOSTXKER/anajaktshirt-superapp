'use client';

import { useState } from 'react';
import { createClient } from '@/modules/shared/services/supabase-client';
import { auditService } from '@/modules/audit/services/auditService';
import type {
  ProductionJobStatus,
  CreateProductionJobInput,
  UpdateProductionJobInput,
  LogProductionInput,
  QCCheckInput,
  CreateOutsourceJobInput,
} from '../types/tracking';

export function useProductionTrackingMutations() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // =============================================
  // CREATE JOB
  // =============================================
  const createJob = async (
    input: CreateProductionJobInput
  ): Promise<{ success: boolean; jobId?: string; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Generate job number
      const { data: jobNumber } = await supabase.rpc('generate_job_number');

      const { data: job, error: createError } = await supabase
        .from('production_jobs')
        .insert({
          job_number: jobNumber,
          order_id: input.order_id || null,
          order_work_item_id: input.order_work_item_id || null,
          work_type_code: input.work_type_code,
          work_type_name: input.work_type_name || null,
          description: input.description || null,
          ordered_qty: input.ordered_qty,
          priority: input.priority ?? 0,
          due_date: input.due_date || null,
          design_file_url: input.design_file_url || null,
          production_notes: input.production_notes || null,
          status: 'pending',
          created_by: user?.id,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Log creation
      await supabase.from('production_job_logs').insert({
        job_id: job.id,
        action: 'created',
        to_status: 'pending',
        performed_by: user?.id,
      });

      // Audit log
      await auditService.log({
        action: 'create',
        entityType: 'production_job',
        entityId: job.id,
        newData: job,
      });

      return { success: true, jobId: job.id };
    } catch (err: any) {
      console.error('Error creating production job:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // =============================================
  // UPDATE JOB STATUS
  // =============================================
  const updateJobStatus = async (
    jobId: string,
    newStatus: ProductionJobStatus,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Get current job
      const { data: currentJob, error: fetchError } = await supabase
        .from('production_jobs')
        .select('status')
        .eq('id', jobId)
        .single();

      if (fetchError) throw fetchError;

      const oldStatus = currentJob.status;

      // Prepare update data
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      // Set timestamps based on status
      if (newStatus === 'in_progress' && oldStatus !== 'in_progress') {
        updateData.started_at = new Date().toISOString();
      }
      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }
      if (newStatus === 'assigned') {
        updateData.assigned_at = new Date().toISOString();
      }

      // Update job
      const { error: updateError } = await supabase
        .from('production_jobs')
        .update(updateData)
        .eq('id', jobId);

      if (updateError) throw updateError;

      // Log status change
      await supabase.from('production_job_logs').insert({
        job_id: jobId,
        action: 'status_changed',
        from_status: oldStatus,
        to_status: newStatus,
        notes: notes || null,
        performed_by: user?.id,
      });

      // Audit log
      await auditService.log({
        action: 'update',
        entityType: 'production_job',
        entityId: jobId,
        oldData: { status: oldStatus },
        newData: { status: newStatus },
      });

      return { success: true };
    } catch (err: any) {
      console.error('Error updating job status:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // =============================================
  // ASSIGN JOB
  // =============================================
  const assignJob = async (
    jobId: string,
    stationId: string,
    userId?: string
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error: updateError } = await supabase
        .from('production_jobs')
        .update({
          station_id: stationId,
          assigned_to: userId || null,
          assigned_at: new Date().toISOString(),
          status: 'assigned',
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      if (updateError) throw updateError;

      // Log assignment
      await supabase.from('production_job_logs').insert({
        job_id: jobId,
        action: 'assigned',
        to_status: 'assigned',
        notes: `Assigned to station ${stationId}`,
        performed_by: user?.id,
      });

      // Update station current job
      await supabase
        .from('production_stations')
        .update({ current_job_id: jobId })
        .eq('id', stationId);

      return { success: true };
    } catch (err: any) {
      console.error('Error assigning job:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // =============================================
  // LOG PRODUCTION PROGRESS
  // =============================================
  const logProduction = async (
    input: LogProductionInput
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Get current produced qty
      const { data: job, error: fetchError } = await supabase
        .from('production_jobs')
        .select('produced_qty, ordered_qty')
        .eq('id', input.job_id)
        .single();

      if (fetchError) throw fetchError;

      const newProducedQty = (job.produced_qty || 0) + (input.produced_qty || 0);

      // Update produced quantity
      const { error: updateError } = await supabase
        .from('production_jobs')
        .update({
          produced_qty: newProducedQty,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.job_id);

      if (updateError) throw updateError;

      // Log production
      await supabase.from('production_job_logs').insert({
        job_id: input.job_id,
        action: input.action || 'produced',
        produced_qty: input.produced_qty || null,
        notes: input.notes || null,
        performed_by: user?.id,
      });

      return { success: true };
    } catch (err: any) {
      console.error('Error logging production:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // =============================================
  // PERFORM QC CHECK
  // =============================================
  const performQCCheck = async (
    input: QCCheckInput
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Get current job
      const { data: job, error: fetchError } = await supabase
        .from('production_jobs')
        .select('produced_qty, passed_qty, failed_qty')
        .eq('id', input.job_id)
        .single();

      if (fetchError) throw fetchError;

      // Insert checkpoints
      for (const checkpoint of input.checkpoints) {
        await supabase.from('qc_checkpoints').insert({
          job_id: input.job_id,
          checkpoint_name: checkpoint.checkpoint_name,
          passed: checkpoint.passed,
          notes: checkpoint.notes || null,
          photo_urls: checkpoint.photo_urls || [],
          checked_by: user?.id,
        });
      }

      // Update job QC status
      const newStatus = input.overall_passed ? 'qc_passed' : 'qc_failed';
      const passedQty = input.overall_passed ? job.produced_qty : job.passed_qty;
      const failedQty = input.overall_passed ? job.failed_qty : job.produced_qty;

      await supabase
        .from('production_jobs')
        .update({
          status: newStatus,
          qc_status: input.overall_passed ? 'passed' : 'failed',
          qc_notes: input.qc_notes || null,
          qc_by: user?.id,
          qc_at: new Date().toISOString(),
          passed_qty: passedQty,
          failed_qty: failedQty,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.job_id);

      // Log QC
      await supabase.from('production_job_logs').insert({
        job_id: input.job_id,
        action: input.overall_passed ? 'qc_passed' : 'qc_failed',
        to_status: newStatus,
        notes: input.qc_notes || null,
        performed_by: user?.id,
      });

      return { success: true };
    } catch (err: any) {
      console.error('Error performing QC check:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // =============================================
  // CREATE REWORK JOB
  // =============================================
  const createReworkJob = async (
    originalJobId: string,
    quantity: number,
    reason: string
  ): Promise<{ success: boolean; reworkJobId?: string; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Get original job
      const { data: originalJob, error: fetchError } = await supabase
        .from('production_jobs')
        .select('*')
        .eq('id', originalJobId)
        .single();

      if (fetchError) throw fetchError;

      // Generate new job number
      const { data: jobNumber } = await supabase.rpc('generate_job_number');

      // Create rework job
      const { data: reworkJob, error: createError } = await supabase
        .from('production_jobs')
        .insert({
          job_number: jobNumber,
          order_id: originalJob.order_id,
          order_work_item_id: originalJob.order_work_item_id,
          work_type_code: originalJob.work_type_code,
          work_type_name: originalJob.work_type_name,
          description: `[REWORK] ${originalJob.description || ''}`,
          ordered_qty: quantity,
          priority: 1, // Rush priority for rework
          due_date: originalJob.due_date,
          design_file_url: originalJob.design_file_url,
          production_notes: originalJob.production_notes,
          status: 'pending',
          is_rework: true,
          rework_reason: reason,
          original_job_id: originalJobId,
          rework_count: (originalJob.rework_count || 0) + 1,
          created_by: user?.id,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Update original job rework count
      await supabase
        .from('production_jobs')
        .update({
          rework_count: (originalJob.rework_count || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', originalJobId);

      // Log rework creation
      await supabase.from('production_job_logs').insert({
        job_id: originalJobId,
        action: 'rework_created',
        notes: `Rework job ${jobNumber} created: ${reason}`,
        performed_by: user?.id,
      });

      return { success: true, reworkJobId: reworkJob.id };
    } catch (err: any) {
      console.error('Error creating rework job:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // =============================================
  // CREATE OUTSOURCE JOB
  // =============================================
  const createOutsourceJob = async (
    input: CreateOutsourceJobInput
  ): Promise<{ success: boolean; outsourceJobId?: string; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: outsourceJob, error: createError } = await supabase
        .from('outsource_jobs')
        .insert({
          production_job_id: input.production_job_id || null,
          order_id: input.order_id || null,
          order_work_item_id: input.order_work_item_id || null,
          supplier_id: input.supplier_id || null,
          supplier_name: input.supplier_name || null,
          work_type_code: input.work_type_code,
          description: input.description || null,
          quantity: input.quantity,
          unit_price: input.unit_price || null,
          total_price: input.unit_price ? input.unit_price * input.quantity : null,
          expected_delivery: input.expected_delivery || null,
          design_file_url: input.design_file_url || null,
          notes: input.notes || null,
          status: 'draft',
          created_by: user?.id,
        })
        .select()
        .single();

      if (createError) throw createError;

      return { success: true, outsourceJobId: outsourceJob.id };
    } catch (err: any) {
      console.error('Error creating outsource job:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // =============================================
  // UPDATE OUTSOURCE STATUS
  // =============================================
  const updateOutsourceStatus = async (
    outsourceJobId: string,
    newStatus: string,
    additionalData?: Record<string, any>
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
        ...additionalData,
      };

      const { error: updateError } = await supabase
        .from('outsource_jobs')
        .update(updateData)
        .eq('id', outsourceJobId);

      if (updateError) throw updateError;

      // Log status change
      await supabase.from('outsource_logs').insert({
        outsource_job_id: outsourceJobId,
        action: 'status_changed',
        to_status: newStatus,
        performed_by: user?.id,
      });

      return { success: true };
    } catch (err: any) {
      console.error('Error updating outsource status:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // =============================================
  // CREATE STANDALONE JOB (Walk-in customer)
  // =============================================
  const createStandaloneJob = async (input: {
    customer_name: string;
    product_description: string;
    work_type_code: string;
    quantity: number;
    priority?: number;
    due_date?: string;
    notes?: string;
  }): Promise<{ success: boolean; jobId?: string; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Generate job number
      const { data: jobNumber } = await supabase.rpc('generate_job_number');

      const { data: job, error: createError } = await supabase
        .from('production_jobs')
        .insert({
          job_number: jobNumber || `PJ-${Date.now()}`,
          order_id: null,
          order_work_item_id: null,
          work_type_code: input.work_type_code,
          work_type_name: input.work_type_code,
          description: input.product_description,
          customer_name: input.customer_name,
          product_description: input.product_description,
          quantity: input.quantity,
          ordered_qty: input.quantity,
          priority: input.priority ?? 0,
          due_date: input.due_date || null,
          production_notes: input.notes || null,
          status: 'pending',
          created_by: user?.id,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Log creation
      await supabase.from('production_job_logs').insert({
        job_id: job.id,
        action: 'created',
        to_status: 'pending',
        notes: 'งาน Standalone',
        performed_by: user?.id,
      });

      // Audit log
      await auditService.log({
        action: 'create',
        entityType: 'production_job',
        entityId: job.id,
        newData: { ...job, type: 'standalone' },
      });

      return { success: true, jobId: job.id };
    } catch (err: any) {
      console.error('Error creating standalone job:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createJob,
    createStandaloneJob,
    updateJobStatus,
    assignJob,
    logProduction,
    performQCCheck,
    createReworkJob,
    createOutsourceJob,
    updateOutsourceStatus,
  };
}

