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
    revenue: {
      total: 0,
      paid: 0,
      outstanding: 0,
    },
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
    total: 0,
    active: 0,
    pending_po: 0,
    pending_amount: 0,
  },
  revenue: {
    today: 0,
    this_week: 0,
    this_month: 0,
    pending_payment: 0,
  },
};

export function useERPDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null); // Allow null initially
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // TODO: Implement real data fetching for activities and deadlines
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<Deadline[]>([]);

  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoading(true);

      const [orderStats, productionStats, supplierStats, financialSummary] = await Promise.all([
        supabaseOrderRepository.getOrderStats(),
        supabaseProductionRepository.getStats(),
        supabaseSupplierRepository.getStats(),
        supabaseFinancialRepository.getSummary(),
      ]);

      setStats({
        orders: orderStats,
        production: productionStats,
        suppliers: supplierStats,
        revenue: {
          today: 0, // TODO: Implement daily revenue
          this_week: 0, // TODO: Implement weekly revenue
          this_month: financialSummary.total_revenue,
          pending_payment: financialSummary.outstanding_amount,
        },
      });

      // Mock Activities for now until Audit Logs are fully integrated
      setRecentActivities([
        {
          id: '1',
          type: 'order',
          title: 'คำสั่งซื้อใหม่ #ORD-2023-001',
          description: 'ลูกค้า: คุณสมชาย (เสื้อยืด 100 ตัว)',
          timestamp: '10 นาทีที่แล้ว',
          status: 'success',
        },
        {
          id: '2',
          type: 'production',
          title: 'เริ่มผลิตงาน #JOB-001',
          description: 'สถานี: สกรีน DTF',
          timestamp: '30 นาทีที่แล้ว',
          status: 'success',
        },
      ]);

      // Mock Deadlines for now
      setUpcomingDeadlines([]);

    } catch (err: any) {
      console.error('Dashboard fetch error:', err);
      setError(err.message);
      // Fallback to default stats on error to prevent UI crash
      if (!stats) setStats(DEFAULT_STATS);
    } finally {
      setLoading(false);
    }
  }, [stats]);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  return {
    stats,
    recentActivities,
    upcomingDeadlines,
    loading,
    error,
    refetch: fetchDashboardStats,
  };
}
