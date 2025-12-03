'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { createClient } from '@/modules/shared/services/supabase-client';
import { Transaction, TransactionFormData } from '../types';

export function useTransactions(productId?: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const fetchTransactions = useCallback(async () => {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setError('กรุณาตั้งค่า Supabase URL และ Anon Key ใน .env.local');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      let query = supabase
        .from('transactions')
        .select(`
          *,
          product:products(*)
        `)
        .order('created_at', { ascending: false });

      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data, error: fetchError } = await query.limit(100);

      if (fetchError) {
        // More descriptive error message
        if (fetchError.code === '42P01') {
          throw new Error('ตาราง transactions ยังไม่มีใน database - กรุณา run SQL schema ก่อน');
        }
        throw new Error(fetchError.message || 'ไม่สามารถโหลดประวัติรายการได้');
      }
      
      setTransactions(data as Transaction[]);
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  }, [supabase, productId]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const createTransaction = async (
    data: TransactionFormData
  ): Promise<Transaction | null> => {
    setLoading(true);
    setError(null);

    try {
      // Get current user
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      const { data: transaction, error: createError } = await supabase
        .from('transactions')
        .insert([
          {
            product_id: data.product_id,
            user_id: userData.user.id,
            type: data.type,
            quantity: data.quantity,
            reason_category: data.reason_category || null,
            reason: data.reason || null,
            note: data.note || null,
            ref_order_id: data.ref_order_id || null,
          },
        ])
        .select()
        .single();

      if (createError) throw createError;

      // Refresh transactions list
      await fetchTransactions();

      return transaction as Transaction;
    } catch (err: any) {
      console.error('Error creating transaction:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    transactions,
    loading,
    error,
    createTransaction,
    refresh: fetchTransactions,
  };
}

