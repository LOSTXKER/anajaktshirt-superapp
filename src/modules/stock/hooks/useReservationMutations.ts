'use client';

import { useState } from 'react';
import { createClient } from '@/modules/shared/services/supabase-client';
import { logAudit } from '@/modules/audit/services/auditService';
import { CreateReservationParams } from '../types/reservation';

export function useReservationMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a new reservation
  const createReservation = async (params: CreateReservationParams) => {
    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      // Check available stock first
      const { data: product } = await supabase
        .from('products')
        .select('id, name, current_stock')
        .eq('id', params.product_id)
        .single();

      if (!product) {
        throw new Error('ไม่พบสินค้า');
      }

      // Get current reserved quantity
      const { data: existingReservations } = await supabase
        .from('stock_reservations')
        .select('quantity')
        .eq('product_id', params.product_id)
        .eq('status', 'reserved');

      const totalReserved = (existingReservations || []).reduce((sum, r) => sum + r.quantity, 0);
      const availableStock = product.current_stock - totalReserved;

      if (params.quantity > availableStock) {
        throw new Error(`สต๊อกไม่เพียงพอ (มี ${availableStock} ชิ้น, จองแล้ว ${totalReserved} ชิ้น)`);
      }

      // Create reservation
      const { data, error: insertError } = await supabase
        .from('stock_reservations')
        .insert({
          job_id: params.job_id,
          product_id: params.product_id,
          quantity: params.quantity,
          status: 'reserved',
          reserved_by: user?.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Log audit
      await logAudit({
        action: 'create',
        entity_type: 'reservation',
        entity_id: data.id,
        new_data: { ...params, product_name: product.name },
      });

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Release a reservation (cancel it)
  const releaseReservation = async (reservationId: string) => {
    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();

      // Get existing reservation
      const { data: existing } = await supabase
        .from('stock_reservations')
        .select('*')
        .eq('id', reservationId)
        .single();

      if (!existing) {
        throw new Error('ไม่พบการจอง');
      }

      // Update status
      const { data, error: updateError } = await supabase
        .from('stock_reservations')
        .update({
          status: 'released',
          released_at: new Date().toISOString(),
        })
        .eq('id', reservationId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Log audit
      await logAudit({
        action: 'update',
        entity_type: 'reservation',
        entity_id: reservationId,
        old_data: existing,
        new_data: data,
      });

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Mark reservation as used (when production is complete)
  const useReservation = async (reservationId: string) => {
    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();

      const { data, error: updateError } = await supabase
        .from('stock_reservations')
        .update({ status: 'used' })
        .eq('id', reservationId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Log audit
      await logAudit({
        action: 'update',
        entity_type: 'reservation',
        entity_id: reservationId,
        new_data: { status: 'used' },
      });

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Reserve stock for entire job (multiple products)
  const reserveForJob = async (jobId: string, items: { product_id: string; quantity: number }[]) => {
    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const results = [];
      for (const item of items) {
        const result = await createReservation({
          job_id: jobId,
          product_id: item.product_id,
          quantity: item.quantity,
        });
        results.push(result);
      }

      return results;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createReservation,
    releaseReservation,
    useReservation,
    reserveForJob,
    loading,
    error,
  };
}

