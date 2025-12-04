'use client';

import { useEffect, useState } from 'react';
import { Transaction } from '../types';
import { createClient } from '@/modules/shared/services/supabase-client';

export function useTransactions(productId?: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchTransactions();
  }, [productId]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('transactions')
        .select('*, product:products(code, name, model)')
        .order('created_at', { ascending: false });

      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('Error fetching transactions:', fetchError);
        throw new Error(fetchError.message || 'ไม่สามารถโหลดประวัติรายการได้');
      }
      
      setTransactions(data as Transaction[]);
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err.message || 'ไม่สามารถโหลดประวัติรายการได้');
    } finally {
      setLoading(false);
    }
  };

  return { transactions, loading, error, refresh: fetchTransactions };
}
