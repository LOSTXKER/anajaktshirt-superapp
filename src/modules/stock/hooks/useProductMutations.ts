'use client';

import { useState } from 'react';
import { createClient } from '@/modules/shared/services/supabase-client';
import { Product, ProductFormData } from '../types';
import { logAudit } from '@/modules/audit/services/auditService';

// Result type for create operation
export type CreateProductResult = 
  | { success: true; product: Product }
  | { success: false; error: string; isDuplicate?: boolean };

export function useProductMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const createProduct = async (data: ProductFormData): Promise<CreateProductResult> => {
    setLoading(true);
    setError(null);

    try {
      const { data: product, error: createError } = await supabase
        .from('products')
        .insert([
          {
            main_sku: data.main_sku,
            sku: data.sku,
            model: data.model,
            color: data.color,
            color_hex: data.color_hex || '#6b7280',
            size: data.size,
            cost: data.cost || 0,
            price: data.price || 0,
            quantity: data.quantity || 0,
            min_level: data.min_level || 10,
          },
        ])
        .select()
        .single();

      if (createError) {
        // Handle specific error codes - these are expected errors, don't log to console
        if (createError.code === '42703') {
          const errorMsg = 'คอลัมน์ไม่มีใน database - กรุณา run SQL schema';
          setError(errorMsg);
          return { success: false, error: errorMsg };
        }
        if (createError.code === '23505') {
          // Duplicate SKU - this is expected when importing, don't log to console
          return { success: false, error: 'SKU ซ้ำ', isDuplicate: true };
        }
        // Unexpected error - log to console for debugging
        console.error('Unexpected error creating product:', createError);
        setError(createError.message || 'ไม่สามารถเพิ่มสินค้าได้');
        return { success: false, error: createError.message || 'ไม่สามารถเพิ่มสินค้าได้' };
      }
      
      // Log audit
      await logAudit({
        action: 'create',
        entity_type: 'product',
        entity_id: product.id,
        new_data: { ...data, id: product.id },
      });
      
      return { success: true, product: product as Product };
    } catch (err: any) {
      // Only log truly unexpected errors
      console.error('Unexpected error:', err);
      const errorMsg = err.message || 'เกิดข้อผิดพลาด';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (
    id: string,
    data: Partial<ProductFormData>
  ): Promise<Product | null> => {
    setLoading(true);
    setError(null);

    try {
      // Get old data for audit and price history
      const { data: oldProduct } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      const { data: product, error: updateError } = await supabase
        .from('products')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      
      // ⭐ Track price changes in history
      const priceChanged = (data.cost !== undefined && data.cost !== oldProduct?.cost) ||
                          (data.price !== undefined && data.price !== oldProduct?.price);
      
      if (priceChanged && oldProduct) {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('product_price_history').insert({
          product_id: id,
          old_cost: oldProduct.cost,
          new_cost: data.cost ?? oldProduct.cost,
          old_price: oldProduct.price,
          new_price: data.price ?? oldProduct.price,
          changed_by: user?.id,
        });
      }
      
      // Log audit with old and new data
      await logAudit({
        action: 'update',
        entity_type: 'product',
        entity_id: id,
        old_data: oldProduct,
        new_data: product,
      });
      
      return product as Product;
    } catch (err: any) {
      console.error('Error updating product:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // Get product data before soft delete for audit
      const { data: oldProduct } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      // ⭐ SOFT DELETE - ไม่ลบจริง เพื่อรักษาประวัติ
      const { error: deleteError } = await supabase
        .from('products')
        .update({ 
          deleted_at: new Date().toISOString(),
          is_active: false,
        })
        .eq('id', id);

      if (deleteError) throw deleteError;
      
      // Log audit
      await logAudit({
        action: 'delete',
        entity_type: 'product',
        entity_id: id,
        old_data: oldProduct,
        new_data: { deleted_at: new Date().toISOString(), is_active: false },
      });
      
      return true;
    } catch (err: any) {
      console.error('Error deleting product:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    createProduct,
    updateProduct,
    deleteProduct,
    loading,
    error,
  };
}
