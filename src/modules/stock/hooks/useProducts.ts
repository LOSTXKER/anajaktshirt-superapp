'use client';

import { useEffect, useState } from 'react';
import { Product } from '../types';
import { createClient } from '@/modules/shared/services/supabase-client';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .is('deleted_at', null) // ⭐ Filter out soft-deleted products
        .order('model')
        .order('color')
        .order('size');

      if (error) throw error;
      setProducts(data as Product[]);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err.message || 'ไม่สามารถโหลดข้อมูลสินค้าได้');
    } finally {
      setLoading(false);
    }
  };

  return { products, loading, error, refresh: fetchProducts };
}
