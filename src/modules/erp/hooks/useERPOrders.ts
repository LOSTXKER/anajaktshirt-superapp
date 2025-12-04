// =============================================
// ERP ORDER HOOKS
// =============================================
// React hooks for ERP order operations
// =============================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  updateOrderStatus,
  getOrderStats,
  getWorkItems,
  addWorkItem,
  getPayments,
  addPayment,
  verifyPayment,
} from '../services/orderService';
import type {
  Order,
  OrderWorkItem,
  OrderPayment,
  OrderFilters,
  CreateOrderInput,
  UpdateOrderInput,
  CreateWorkItemInput,
  CreatePaymentInput,
  OrderStats,
} from '../types/orders';
import type { PaginationParams, PaginatedResult } from '../types/common';

// ---------------------------------------------
// useERPOrders - Main orders list hook
// ---------------------------------------------

interface UseERPOrdersOptions {
  filters?: OrderFilters;
  pagination?: PaginationParams;
  autoFetch?: boolean;
}

interface UseERPOrdersReturn {
  orders: Order[];
  loading: boolean;
  error: string | null;
  pagination: PaginatedResult<Order>['pagination'] | null;
  refetch: () => Promise<void>;
}

export function useERPOrders(options: UseERPOrdersOptions = {}): UseERPOrdersReturn {
  const { filters, pagination: paginationParams, autoFetch = true } = options;
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paginationState, setPaginationState] = useState<PaginatedResult<Order>['pagination'] | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getOrders(filters, paginationParams);
      setOrders(result.data);
      setPaginationState(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [filters, paginationParams]);

  useEffect(() => {
    if (autoFetch) {
      fetchOrders();
    }
  }, [fetchOrders, autoFetch]);

  return {
    orders,
    loading,
    error,
    pagination: paginationState,
    refetch: fetchOrders,
  };
}

// ---------------------------------------------
// useERPOrder - Single order hook
// ---------------------------------------------

interface UseERPOrderReturn {
  order: Order | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useERPOrder(orderId: string | null): UseERPOrderReturn {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId) {
      setOrder(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getOrder(orderId);
      setOrder(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch order');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  return {
    order,
    loading,
    error,
    refetch: fetchOrder,
  };
}

// ---------------------------------------------
// useERPOrderStats - Order statistics hook
// ---------------------------------------------

interface UseERPOrderStatsReturn {
  stats: OrderStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useERPOrderStats(filters?: OrderFilters): UseERPOrderStatsReturn {
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getOrderStats(filters);
      setStats(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}

// ---------------------------------------------
// useERPOrderMutations - Order mutation hooks
// ---------------------------------------------

interface UseERPOrderMutationsReturn {
  createOrder: (data: CreateOrderInput) => Promise<Order | null>;
  updateOrder: (id: string, data: UpdateOrderInput) => Promise<Order | null>;
  updateStatus: (id: string, status: string, reason?: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export function useERPOrderMutations(): UseERPOrderMutationsReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateOrder = useCallback(async (data: CreateOrderInput): Promise<Order | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await createOrder(data);
      if (result.success && result.data) {
        return result.data;
      }
      setError(result.message || 'Failed to create order');
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUpdateOrder = useCallback(async (id: string, data: UpdateOrderInput): Promise<Order | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await updateOrder(id, data);
      if (result.success && result.data) {
        return result.data;
      }
      setError(result.message || 'Failed to update order');
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUpdateStatus = useCallback(async (id: string, status: string, reason?: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const result = await updateOrderStatus(id, status, reason);
      if (!result.success) {
        setError(result.message || 'Failed to update status');
      }
      return result.success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createOrder: handleCreateOrder,
    updateOrder: handleUpdateOrder,
    updateStatus: handleUpdateStatus,
    loading,
    error,
  };
}

// ---------------------------------------------
// useERPWorkItems - Work items hook
// ---------------------------------------------

interface UseERPWorkItemsReturn {
  workItems: OrderWorkItem[];
  loading: boolean;
  error: string | null;
  addWorkItem: (data: CreateWorkItemInput) => Promise<OrderWorkItem | null>;
  refetch: () => Promise<void>;
}

export function useERPWorkItems(orderId: string | null): UseERPWorkItemsReturn {
  const [workItems, setWorkItems] = useState<OrderWorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkItems = useCallback(async () => {
    if (!orderId) {
      setWorkItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getWorkItems(orderId);
      setWorkItems(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch work items');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchWorkItems();
  }, [fetchWorkItems]);

  const handleAddWorkItem = useCallback(async (data: CreateWorkItemInput): Promise<OrderWorkItem | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await addWorkItem(data);
      if (result.success && result.data) {
        setWorkItems(prev => [...prev, result.data!]);
        return result.data;
      }
      setError(result.message || 'Failed to add work item');
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add work item');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    workItems,
    loading,
    error,
    addWorkItem: handleAddWorkItem,
    refetch: fetchWorkItems,
  };
}

// ---------------------------------------------
// useERPPayments - Payments hook
// ---------------------------------------------

interface UseERPPaymentsReturn {
  payments: OrderPayment[];
  loading: boolean;
  error: string | null;
  addPayment: (data: CreatePaymentInput) => Promise<OrderPayment | null>;
  verifyPayment: (paymentId: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useERPPayments(orderId: string | null): UseERPPaymentsReturn {
  const [payments, setPayments] = useState<OrderPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    if (!orderId) {
      setPayments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getPayments(orderId);
      setPayments(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleAddPayment = useCallback(async (data: CreatePaymentInput): Promise<OrderPayment | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await addPayment(data);
      if (result.success && result.data) {
        setPayments(prev => [...prev, result.data!]);
        return result.data;
      }
      setError(result.message || 'Failed to add payment');
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add payment');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleVerifyPayment = useCallback(async (paymentId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const result = await verifyPayment(paymentId, 'current-user'); // TODO: get current user
      if (result.success) {
        await fetchPayments(); // Refresh list
      } else {
        setError(result.message || 'Failed to verify payment');
      }
      return result.success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify payment');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchPayments]);

  return {
    payments,
    loading,
    error,
    addPayment: handleAddPayment,
    verifyPayment: handleVerifyPayment,
    refetch: fetchPayments,
  };
}

