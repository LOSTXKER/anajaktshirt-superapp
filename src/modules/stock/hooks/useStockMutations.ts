'use client';

import { useState } from 'react';
import { createClient } from '@/modules/shared/services/supabase-client';
import { logAudit } from '@/modules/audit/services/auditService';

export function useStockMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Stock In - เพิ่มสต๊อก
  const stockIn = async (
    productId: string, 
    quantity: number,
    refOrderId?: string,
    note?: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // Get current product quantity
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('stock_qty')
        .eq('id', productId)
        .single();

      if (fetchError) throw fetchError;

      const newQuantity = (product?.stock_qty || 0) + quantity;

      // Update product quantity
      const { error: updateError } = await supabase
        .from('products')
        .update({ 
          stock_qty: newQuantity,
          in_stock: newQuantity > 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (updateError) throw updateError;

      // Create transaction record
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          product_id: productId,
          type: 'IN',
          quantity: quantity,
          ref_order_id: refOrderId || null,
          note: note || null,
          reason: note || null,
        });

      if (txError) {
        console.warn('Transaction log failed:', txError);
        // Don't fail the operation if transaction log fails
      }

      // Log audit
      await logAudit({
        action: 'create',
        entity_type: 'transaction',
        entity_id: productId,
        new_data: { type: 'IN', quantity, productId, refOrderId, note },
      });

      return true;
    } catch (err: any) {
      console.error('Error in stockIn:', err);
      setError(err.message || 'ไม่สามารถนำเข้าสต๊อกได้');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Stock Out - เบิกสินค้า
  const stockOut = async (
    productId: string, 
    quantity: number,
    refOrderId?: string,
    reason?: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // Get current product quantity
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('stock_qty')
        .eq('id', productId)
        .single();

      if (fetchError) throw fetchError;

      const currentQty = product?.stock_qty || 0;
      if (currentQty < quantity) {
        throw new Error(`สต๊อกไม่พอ (มี ${currentQty} ต้องการเบิก ${quantity})`);
      }

      const newQuantity = currentQty - quantity;

      // Update product quantity
      const { error: updateError } = await supabase
        .from('products')
        .update({ 
          stock_qty: newQuantity,
          in_stock: newQuantity > 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (updateError) throw updateError;

      // Create transaction record
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          product_id: productId,
          type: 'OUT',
          quantity: quantity,
          ref_order_id: refOrderId || null,
          note: reason || null,
          reason: reason || null,
        });

      if (txError) {
        console.warn('Transaction log failed:', txError);
        // Don't fail the operation if transaction log fails
      }

      // Log audit
      await logAudit({
        action: 'create',
        entity_type: 'transaction',
        entity_id: productId,
        new_data: { type: 'OUT', quantity, productId, refOrderId, reason },
      });

      return true;
    } catch (err: any) {
      console.error('Error in stockOut:', err);
      setError(err.message || 'ไม่สามารถเบิกสินค้าได้');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Stock Adjust - ปรับสต๊อก
  const stockAdjust = async (
    productId: string, 
    newQuantity: number,
    reason?: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // Get current product quantity
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('stock_qty')
        .eq('id', productId)
        .single();

      if (fetchError) throw fetchError;

      const currentQty = product?.stock_qty || 0;
      const difference = newQuantity - currentQty;

      // Update product quantity
      const { error: updateError } = await supabase
        .from('products')
        .update({ 
          stock_qty: newQuantity,
          in_stock: newQuantity > 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (updateError) throw updateError;

      // Create transaction record
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          product_id: productId,
          type: 'ADJUST',
          quantity: Math.abs(difference),
          note: `ปรับจาก ${currentQty} เป็น ${newQuantity}${reason ? ` - ${reason}` : ''}`,
          reason: reason || 'ปรับปรุงสต๊อก',
        });

      if (txError) {
        console.warn('Transaction log failed:', txError);
      }

      // Log audit
      await logAudit({
        action: 'update',
        entity_type: 'transaction',
        entity_id: productId,
        old_data: { quantity: currentQty },
        new_data: { type: 'ADJUST', quantity: newQuantity, productId, reason, difference },
      });

      return true;
    } catch (err: any) {
      console.error('Error in stockAdjust:', err);
      setError(err.message || 'ไม่สามารถปรับสต๊อกได้');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    stockIn,
    stockOut,
    stockAdjust,
    loading,
    error,
  };
}

