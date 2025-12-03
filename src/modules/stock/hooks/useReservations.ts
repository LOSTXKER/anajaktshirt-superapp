'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/modules/shared/services/supabase-client';
import { StockReservation, ReservationSummary } from '../types/reservation';

export function useReservations(jobId?: string) {
  const [reservations, setReservations] = useState<StockReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();

      let query = supabase
        .from('stock_reservations')
        .select(`
          *,
          job:production_jobs!stock_reservations_job_id_fkey (
            job_number,
            customer_name,
            status,
            due_date
          ),
          product:products!stock_reservations_product_id_fkey (
            name,
            main_sku,
            current_stock
          ),
          reserved_by_user:user_profiles!stock_reservations_reserved_by_fkey (
            full_name,
            email
          )
        `)
        .eq('status', 'reserved')
        .order('reserved_at', { ascending: false });

      if (jobId) {
        query = query.eq('job_id', jobId);
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      setReservations(data || []);
    } catch (err: any) {
      console.error('Reservations fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  return { reservations, loading, error, refetch: fetchReservations };
}

// Hook to get available stock (current - reserved)
export function useAvailableStock() {
  const [summary, setSummary] = useState<ReservationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();

      // Get all products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, main_sku, current_stock')
        .order('name');

      if (productsError) throw productsError;

      // Get all active reservations
      const { data: reservations, error: reservationsError } = await supabase
        .from('stock_reservations')
        .select('product_id, quantity')
        .eq('status', 'reserved');

      if (reservationsError) throw reservationsError;

      // Calculate reserved quantity per product
      const reservedMap = new Map<string, number>();
      for (const r of reservations || []) {
        const current = reservedMap.get(r.product_id) || 0;
        reservedMap.set(r.product_id, current + r.quantity);
      }

      // Build summary
      const summaryData: ReservationSummary[] = (products || []).map(p => ({
        product_id: p.id,
        product_name: p.name,
        main_sku: p.main_sku,
        current_stock: p.current_stock || 0,
        reserved_quantity: reservedMap.get(p.id) || 0,
        available_quantity: (p.current_stock || 0) - (reservedMap.get(p.id) || 0),
      }));

      setSummary(summaryData);
    } catch (err: any) {
      console.error('Available stock fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary, loading, error, refetch: fetchSummary };
}

