'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/modules/shared/services/supabase-client';
import { Product } from '../types';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export function useRealtimeProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const fetchProducts = useCallback(async () => {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setError('กรุณาตั้งค่า Supabase URL และ Anon Key ใน .env.local');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .order('model');

      if (fetchError) {
        // More descriptive error message
        if (fetchError.code === '42P01') {
          throw new Error('ตาราง products ยังไม่มีใน database - กรุณา run SQL schema ก่อน');
        }
        throw new Error(fetchError.message || 'ไม่สามารถโหลดข้อมูลสินค้าได้');
      }
      
      setProducts(data as Product[]);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    // Initial fetch
    fetchProducts();

    // Set up realtime subscription only if configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;

    const channel = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
        },
        (payload: RealtimePostgresChangesPayload<Product>) => {
          console.log('Realtime update:', payload);

          if (payload.eventType === 'INSERT') {
            setProducts((prev) => [...prev, payload.new as Product].sort((a, b) => 
              (a.model || '').localeCompare(b.model || '')
            ));
          } else if (payload.eventType === 'UPDATE') {
            setProducts((prev) =>
              prev.map((p) => (p.id === (payload.new as Product).id ? (payload.new as Product) : p))
            );
          } else if (payload.eventType === 'DELETE') {
            setProducts((prev) => prev.filter((p) => p.id !== (payload.old as Product).id));
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    // Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchProducts]);

  return { products, loading, error, refresh: fetchProducts };
}

