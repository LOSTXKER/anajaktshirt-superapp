'use client';

import { useState } from 'react';
import { createClient } from '@/modules/shared/services/supabase-client';
import { JobStatus, JobPriority } from '../types';
import { logAudit } from '@/modules/audit/services/auditService';

interface CreateJobInput {
  customer_name: string;
  customer_contact?: string;
  customer_phone?: string;
  customer_id?: string;
  product_description: string;
  quantity: number;
  unit_price?: number;
  priority?: JobPriority;
  due_date?: string;
  notes?: string;
  items?: {
    product_id: string;
    quantity: number;
  }[];
}

interface UpdateJobInput {
  customer_name?: string;
  customer_contact?: string;
  customer_phone?: string;
  product_description?: string;
  quantity?: number;
  unit_price?: number;
  priority?: JobPriority;
  due_date?: string;
  notes?: string;
  assigned_to?: string;
}

export function useProductionMutations() {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const createJob = async (input: CreateJobInput): Promise<{ success: boolean; jobId?: string; error?: string }> => {
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Generate job number
      const { data: jobNumber } = await supabase.rpc('generate_job_number');

      // Create job
      const { data: job, error: jobError } = await supabase
        .from('production_jobs')
        .insert({
          job_number: jobNumber,
          customer_name: input.customer_name,
          customer_contact: input.customer_contact || null,
          customer_phone: input.customer_phone || null,
          customer_id: input.customer_id || null,
          product_description: input.product_description,
          quantity: input.quantity,
          unit_price: input.unit_price || 0,
          total_price: (input.unit_price || 0) * input.quantity,
          priority: input.priority || 'normal',
          due_date: input.due_date || null,
          notes: input.notes || null,
          created_by: user?.id,
        })
        .select()
        .single();

      if (jobError) throw jobError;

      // Create job items if provided
      if (input.items && input.items.length > 0) {
        const { error: itemsError } = await supabase
          .from('production_job_items')
          .insert(
            input.items.map(item => ({
              job_id: job.id,
              product_id: item.product_id,
              quantity: item.quantity,
            }))
          );

        if (itemsError) throw itemsError;
      }

      // Create initial status update
      await supabase
        .from('production_updates')
        .insert({
          job_id: job.id,
          previous_status: null,
          new_status: 'pending',
          note: 'สร้างงานใหม่',
          updated_by: user?.id,
        });

      // Log audit
      await logAudit({
        action: 'create',
        entity_type: 'production_job',
        entity_id: job.id,
        new_data: { ...input, id: job.id, job_number: job.job_number },
      });

      return { success: true, jobId: job.id };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateJob = async (jobId: string, input: UpdateJobInput): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    
    try {
      // Get old data for audit
      const { data: oldJob } = await supabase
        .from('production_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      const updateData: any = { ...input };
      
      // Recalculate total if unit_price or quantity changed
      if (input.unit_price !== undefined || input.quantity !== undefined) {
        if (oldJob) {
          const unitPrice = input.unit_price ?? oldJob.unit_price;
          const quantity = input.quantity ?? oldJob.quantity;
          updateData.total_price = unitPrice * quantity;
        }
      }

      const { error } = await supabase
        .from('production_jobs')
        .update(updateData)
        .eq('id', jobId);

      if (error) throw error;

      // Log audit
      await logAudit({
        action: 'update',
        entity_type: 'production_job',
        entity_id: jobId,
        old_data: oldJob,
        new_data: updateData,
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateJobStatus = async (
    jobId: string, 
    newStatus: JobStatus, 
    note?: string
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get current status
      const { data: job } = await supabase
        .from('production_jobs')
        .select('status')
        .eq('id', jobId)
        .single();

      // Calculate progress based on status
      const progressMap: Record<JobStatus, number> = {
        pending: 0,
        reserved: 15,
        printing: 40,
        curing: 65,
        packing: 85,
        completed: 100,
        cancelled: 0,
      };

      // Update job status
      const updateData: any = {
        status: newStatus,
        progress: progressMap[newStatus],
      };

      // Set timestamps
      if (newStatus === 'printing' && job?.status === 'pending') {
        updateData.started_at = new Date().toISOString();
      }
      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('production_jobs')
        .update(updateData)
        .eq('id', jobId);

      if (updateError) throw updateError;

      // Create status update record
      await supabase
        .from('production_updates')
        .insert({
          job_id: jobId,
          previous_status: job?.status,
          new_status: newStatus,
          note: note || null,
          updated_by: user?.id,
        });

      // Log audit
      await logAudit({
        action: 'update',
        entity_type: 'production_job',
        entity_id: jobId,
        old_data: { status: job?.status },
        new_data: { status: newStatus, note },
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteJob = async (jobId: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    
    try {
      // Get job data before delete for audit
      const { data: oldJob } = await supabase
        .from('production_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      const { error } = await supabase
        .from('production_jobs')
        .delete()
        .eq('id', jobId);

      if (error) throw error;

      // Log audit
      await logAudit({
        action: 'delete',
        entity_type: 'production_job',
        entity_id: jobId,
        old_data: oldJob,
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const reserveStock = async (
    jobId: string,
    items: { product_id: string; quantity: number }[]
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Create reservations
      const { error: reserveError } = await supabase
        .from('stock_reservations')
        .insert(
          items.map(item => ({
            job_id: jobId,
            product_id: item.product_id,
            quantity: item.quantity,
            reserved_by: user?.id,
          }))
        );

      if (reserveError) throw reserveError;

      // Update job status to reserved
      await updateJobStatus(jobId, 'reserved', 'จองสต๊อกแล้ว');

      // Log audit
      await logAudit({
        action: 'create',
        entity_type: 'stock_reservation',
        entity_id: jobId,
        new_data: { jobId, items },
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    createJob,
    updateJob,
    updateJobStatus,
    deleteJob,
    reserveStock,
    loading,
  };
}

