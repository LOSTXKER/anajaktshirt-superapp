'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/modules/shared/services/supabase-client';

const supabase = createClient();
import type { 
  Order, 
  OrderSummary, 
  OrderStats, 
  OrderFilters,
  WorkType,
  PrintPosition,
  PrintSize
} from '../types';

export function useOrders(filters?: OrderFilters) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('orders')
        .select(`*`, { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.status) {
        if (Array.isArray(filters.status)) {
          query = query.in('status', filters.status);
        } else {
          query = query.eq('status', filters.status);
        }
      }

      if (filters?.payment_status) {
        query = query.eq('payment_status', filters.payment_status);
      }

      if (filters?.customer_id) {
        query = query.eq('customer_id', filters.customer_id);
      }

      if (filters?.sales_person_id) {
        query = query.eq('sales_person_id', filters.sales_person_id);
      }

      if (filters?.sales_channel) {
        query = query.eq('sales_channel', filters.sales_channel);
      }

      if (filters?.date_from) {
        query = query.gte('order_date', filters.date_from);
      }

      if (filters?.date_to) {
        query = query.lte('order_date', filters.date_to);
      }

      if (filters?.due_date_from) {
        query = query.gte('due_date', filters.due_date_from);
      }

      if (filters?.due_date_to) {
        query = query.lte('due_date', filters.due_date_to);
      }

      if (filters?.search) {
        query = query.or(`order_number.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%`);
      }

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      setOrders(data as Order[]);
      setTotalCount(count || 0);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    orders,
    loading,
    error,
    totalCount,
    refetch: fetchOrders,
  };
}

export function useOrder(orderId: string | null) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId) {
      setOrder(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch order basic data first
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      // Fetch work items separately
      const { data: workItems } = await supabase
        .from('order_work_items')
        .select('*')
        .eq('order_id', orderId);

      // Fetch payments separately
      const { data: payments } = await supabase
        .from('order_payments')
        .select('*')
        .eq('order_id', orderId);

      // Fetch designs separately
      const { data: designs } = await supabase
        .from('order_designs')
        .select('*')
        .eq('order_id', orderId);

      // Fetch mockups separately
      const { data: mockups } = await supabase
        .from('order_mockups')
        .select('*')
        .eq('order_id', orderId);

      // Combine all data
      const fullOrder = {
        ...orderData,
        work_items: workItems || [],
        payments: payments || [],
        designs: designs || [],
        mockups: mockups || [],
      };

      setOrder(fullOrder as Order);
    } catch (err: any) {
      console.error('Error fetching order:', err);
      setError(err.message || 'Failed to fetch order');
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

export function useOrderByToken(token: string | null) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!token) {
      setOrder(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('orders')
        .select(`
          *,
          work_items:order_work_items(
            id,
            work_type_name,
            description,
            quantity,
            unit_price,
            total_price,
            status,
            position_name,
            print_size_name,
            products:order_products(
              id,
              product_name,
              product_size,
              product_color,
              quantity,
              unit_price,
              total_price
            ),
            designs:order_designs(
              id,
              design_name,
              status,
              mockups:order_mockups(*)
            )
          ),
          payments:order_payments(
            id,
            amount,
            status,
            created_at
          )
        `)
        .eq('access_token', token)
        .single();

      if (fetchError) throw fetchError;

      setOrder(data as Order);
    } catch (err: any) {
      console.error('Error fetching order by token:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

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

export function useOrderStats() {
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, status, total_amount, due_date, completed_date');

      if (ordersError) throw ordersError;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const stats: OrderStats = {
        total_orders: orders?.length || 0,
        total_revenue: orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0,
        pending_orders: orders?.filter(o => ['draft', 'quoted', 'awaiting_payment', 'partial_paid'].includes(o.status)).length || 0,
        in_production: orders?.filter(o => ['designing', 'awaiting_mockup_approval', 'awaiting_material', 'queued', 'in_production', 'qc_pending'].includes(o.status)).length || 0,
        ready_to_ship: orders?.filter(o => o.status === 'ready_to_ship').length || 0,
        completed_this_month: orders?.filter(o => 
          o.status === 'completed' && 
          o.completed_date && 
          new Date(o.completed_date) >= startOfMonth
        ).length || 0,
        overdue_orders: orders?.filter(o => 
          o.due_date && 
          new Date(o.due_date) < now && 
          !['completed', 'cancelled', 'shipped'].includes(o.status)
        ).length || 0,
      };

      setStats(stats);
    } catch (err: any) {
      console.error('Error fetching order stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

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

export function useOrderStatusHistory(orderId: string | null) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setHistory([]);
      setLoading(false);
      return;
    }

    const fetchHistory = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('order_status_history')
          .select('*')
          .eq('order_id', orderId)
          .order('created_at', { ascending: false });

        if (error) {
          // Table might not exist or be empty - that's okay
          console.warn('Status history not available:', error.message);
          setHistory([]);
          return;
        }
        setHistory(data || []);
      } catch (err) {
        // Silently handle - history is optional
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [orderId]);

  return { history, loading };
}

export function useOrderNotes(orderId: string | null) {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = useCallback(async () => {
    if (!orderId) {
      setNotes([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('order_notes')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (error) {
        // Table might not exist or be empty - that's okay
        console.warn('Notes not available:', error.message);
        setNotes([]);
        return;
      }
      setNotes(data || []);
    } catch (err) {
      // Silently handle - notes are optional
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  return { notes, loading, refetch: fetchNotes };
}

// Reference data hooks
export function useWorkTypes() {
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkTypes = async () => {
      try {
        const { data, error } = await supabase
          .from('work_types')
          .select('*')
          .eq('is_active', true)
          .order('sort_order');

        if (error) throw error;
        setWorkTypes(data || []);
      } catch (err) {
        console.error('Error fetching work types:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkTypes();
  }, []);

  return { workTypes, loading };
}

export function usePrintPositions() {
  const [positions, setPositions] = useState<PrintPosition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const { data, error } = await supabase
          .from('print_positions')
          .select('*')
          .eq('is_active', true)
          .order('sort_order');

        if (error) throw error;
        setPositions(data || []);
      } catch (err) {
        console.error('Error fetching print positions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPositions();
  }, []);

  return { positions, loading };
}

export function usePrintSizes() {
  const [sizes, setSizes] = useState<PrintSize[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSizes = async () => {
      try {
        const { data, error } = await supabase
          .from('print_sizes')
          .select('*')
          .eq('is_active', true);

        if (error) throw error;
        setSizes(data || []);
      } catch (err) {
        console.error('Error fetching print sizes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSizes();
  }, []);

  return { sizes, loading };
}

