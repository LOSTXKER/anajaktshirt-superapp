// =============================================
// ERP DASHBOARD HOOKS
// =============================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabaseOrderRepository } from '../repositories/supabase/orderRepository';
import { supabaseProductionRepository } from '../repositories/supabase/productionRepository';
import { supabaseSupplierRepository } from '../repositories/supabase/supplierRepository';
import { supabaseFinancialRepository } from '../repositories/supabase/financialRepository';
import type { OrderStats } from '../types/orders';
import type { ProductionStats } from '../types/production';
import type { SupplierStats } from '../types/suppliers';

export interface DashboardStats {
  orders: OrderStats;
  production: ProductionStats;
  suppliers: SupplierStats;
  revenue: {
    today: number;
    this_week: number;
    this_month: number;
    pending_payment: number;
  };
}

export interface Activity {
  id: string;
  type: 'order' | 'production' | 'payment' | 'qc';
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
}

export interface Deadline {
  id: string;
  type: 'order' | 'production';
  reference: string;
  customer: string;
  due_date: string;
  days_remaining: number;
  priority: number;
}

const DEFAULT_STATS: DashboardStats = {
  orders: {
    total: 0,
    pending: 0,
    in_production: 0,
    ready_to_ship: 0,
    completed: 0,
    completed_today: 0,
    overdue: 0,
    total_revenue: 0,
    paid_revenue: 0,
    outstanding_revenue: 0,
  },
  production: {
    total_jobs: 0,
    pending_jobs: 0,
    in_progress_jobs: 0,
    completed_today: 0,
    total_qty_pending: 0,
    total_qty_completed_today: 0,
    on_time_rate: 0,
    rework_rate: 0,
  },
  suppliers: {
    total_suppliers: 0,
    active_suppliers: 0,
    total_po: 0,
    pending_po: 0,
    pending_pos: 0,
    overdue_deliveries: 0,
    total_outstanding: 0,
    total_amount_pending: 0,
  },
  revenue: {
    today: 0,
    this_week: 0,
    this_month: 0,
    pending_payment: 0,
  },
};

export function useERPDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<Deadline[]>([]);

  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoading(true);

      const [orderStats, productionStats, supplierStats, financialSummary] = await Promise.all([
        supabaseOrderRepository.getStats(),
        supabaseProductionRepository.getStats(),
        supabaseSupplierRepository.getStats(),
        supabaseFinancialRepository.getSummary(),
      ]);

      setStats({
        orders: orderStats,
        production: productionStats,
        suppliers: supplierStats,
        revenue: {
          today: 0, // TODO: Implement daily revenue calculation
          this_week: 0, // TODO: Implement weekly revenue calculation
          this_month: financialSummary.total_revenue || orderStats.total_revenue,
          pending_payment: financialSummary.outstanding_amount || orderStats.outstanding_revenue,
        },
      });

      // Mock Activities for now
      setRecentActivities([
        {
          id: '1',
          type: 'order',
          title: 'ระบบพร้อมใช้งาน',
          description: 'Supabase connected successfully',
          timestamp: 'เมื่อสักครู่',
          status: 'success',
        },
      ]);

      setUpcomingDeadlines([]);

    } catch (err: any) {
      console.error('Dashboard fetch error:', err);
      setError(err.message);
      setStats(DEFAULT_STATS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  return {
    stats,
    recentActivities,
    upcomingDeadlines,
    loading,
    error,
    refetch: fetchDashboardStats,
  };
}
