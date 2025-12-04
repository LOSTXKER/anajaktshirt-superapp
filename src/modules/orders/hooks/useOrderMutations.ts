'use client';

import { useState } from 'react';
import { supabaseOrderRepository } from '@/modules/erp/repositories/supabase/orderRepository';
import type {
  CreateOrderInput,
  UpdateOrderInput,
  OrderStatus,
} from '../types';

export function useOrderMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // =============================================
  // ORDER CRUD
  // =============================================

  const createOrder = async (input: CreateOrderInput) => {
    setLoading(true);
    setError(null);
    try {
      const result = await supabaseOrderRepository.create(input);
      if (!result.success) throw new Error(result.message);
      return { success: true, order: result.data };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateOrder = async (id: string, input: UpdateOrderInput) => {
    setLoading(true);
    setError(null);
    try {
      const result = await supabaseOrderRepository.update(id, input);
      if (!result.success) throw new Error(result.message);
      return { success: true, order: result.data };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (id: string, status: OrderStatus, reason?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await supabaseOrderRepository.updateStatus(id, status, reason);
      if (!result.success) throw new Error(result.message);
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (id: string, reason: string) => {
    return updateOrderStatus(id, 'cancelled', reason);
  };

  // =============================================
  // WORK ITEMS
  // =============================================

  const addWorkItem = async (input: any) => {
    setLoading(true);
    setError(null);
    try {
      const result = await supabaseOrderRepository.createWorkItem(input);
      if (!result.success) throw new Error(result.message);
      return { success: true, workItemId: result.data?.id };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateWorkItem = async (id: string, input: any) => {
    setLoading(true);
    setError(null);
    try {
      const result = await supabaseOrderRepository.updateWorkItem(id, input);
      if (!result.success) throw new Error(result.message);
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteWorkItem = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await supabaseOrderRepository.deleteWorkItem(id);
      if (!result.success) throw new Error(result.message);
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // =============================================
  // PAYMENTS
  // =============================================

  const addPayment = async (input: any) => {
    setLoading(true);
    setError(null);
    try {
      const result = await supabaseOrderRepository.createPayment(input);
      if (!result.success) throw new Error(result.message);
      return { success: true, paymentId: result.data?.id };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await supabaseOrderRepository.verifyPayment(id, 'system');
      if (!result.success) throw new Error(result.message);
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const rejectPayment = async (id: string, reason: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await supabaseOrderRepository.rejectPayment(id, reason);
      if (!result.success) throw new Error(result.message);
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createOrder,
    updateOrder,
    updateOrderStatus,
    cancelOrder,
    addWorkItem,
    updateWorkItem,
    deleteWorkItem,
    addPayment,
    confirmPayment,
    rejectPayment,
  };
}
