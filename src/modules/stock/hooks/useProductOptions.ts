'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/modules/shared/services/supabase-client';

// Default options (will be merged with DB values)
export const DEFAULT_MODELS = ['Hiptrack', 'Gildan', 'Cotton 100%', 'Fruit of the Loom', 'Hanes'];
export const DEFAULT_COLORS = ['ขาว', 'ดำ', 'กรม', 'เทา', 'แดง', 'น้ำเงิน', 'เขียว', 'เหลือง', 'ชมพู', 'ม่วง', 'ส้ม', 'ครีม'];
export const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];

interface ProductOptions {
  models: { value: string; label: string }[];
  colors: { value: string; label: string }[];
  sizes: { value: string; label: string }[];
  loading: boolean;
}

/**
 * Hook to get unique product options (models, colors, sizes) from database
 * Merges with default values to ensure common options are always available
 */
export function useProductOptions(): ProductOptions {
  const [existingModels, setExistingModels] = useState<string[]>([]);
  const [existingColors, setExistingColors] = useState<string[]>([]);
  const [existingSizes, setExistingSizes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOptions() {
      const supabase = createClient();
      
      try {
        const { data } = await supabase
          .from('products')
          .select('model, color, size');

        if (data) {
          setExistingModels([...new Set(data.map(p => p.model).filter(Boolean))]);
          setExistingColors([...new Set(data.map(p => p.color).filter(Boolean))]);
          setExistingSizes([...new Set(data.map(p => p.size).filter(Boolean))]);
        }
      } catch (error) {
        console.error('Error fetching product options:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchOptions();
  }, []);

  // Merge and format options
  const models = useMemo(() => {
    const allModels = [...new Set([...DEFAULT_MODELS, ...existingModels])].sort();
    return allModels.map(m => ({ value: m, label: m }));
  }, [existingModels]);

  const colors = useMemo(() => {
    const allColors = [...new Set([...DEFAULT_COLORS, ...existingColors])];
    return allColors.map(c => ({ value: c, label: c }));
  }, [existingColors]);

  const sizes = useMemo(() => {
    const allSizes = [...new Set([...DEFAULT_SIZES, ...existingSizes])];
    // Sort sizes logically
    const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
    const sortedSizes = allSizes.sort((a, b) => {
      const aIndex = sizeOrder.indexOf(a);
      const bIndex = sizeOrder.indexOf(b);
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
    return sortedSizes.map(s => ({ value: s, label: s }));
  }, [existingSizes]);

  return { models, colors, sizes, loading };
}

