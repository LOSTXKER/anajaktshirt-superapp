// =============================================
// ERP DASHBOARD HOOKS
// =============================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  mockOrders,
  mockProductionJobs,
  mockSuppliers,
  mockPurchaseOrders,
} from '../mocks/data';

// ---------------------------------------------
// Dashboard Stats Interface
// ---------------------------------------------

export interface DashboardStats {
  // Orders
  orders: {
    total: number;
    pending: number;
    in_production: number;
    ready_to_ship: number;
    completed_today: number;
    overdue: number;
  };
  
  // Revenue
  revenue: {
    today: number;
    this_week: number;
    this_month: number;
    pending_payment: number;
  };
  
  // Production
  production: {
    active_jobs: number;
    pending_jobs: number;
    completed_today: number;
    qc_failed_today: number;
    on_time_rate: number;
  };
  
  // Suppliers
  suppliers: {
    total: number;
    active: number;
    pending_po: number;
    pending_amount: number;
  };
}

export interface RecentActivity {
  id: string;
  type: 'order' | 'production' | 'payment' | 'qc';
  title: string;
  description: string;
  timestamp: string;
  status?: string;
  link?: string;
}

export interface UpcomingDeadline {
  id: string;
  type: 'order' | 'production' | 'po';
  reference: string;
  customer: string;
  due_date: string;
  days_remaining: number;
  priority: number;
}

// ---------------------------------------------
// useERPDashboard - Main dashboard hook
// ---------------------------------------------

interface UseERPDashboardReturn {
  stats: DashboardStats | null;
  recentActivities: RecentActivity[];
  upcomingDeadlines: UpcomingDeadline[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useERPDashboard(): UseERPDashboardReturn {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<UpcomingDeadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 400));

      const today = new Date();
      const todayStr = today.toDateString();

      // Calculate stats
      const orderStats = {
        total: mockOrders.length,
        pending: mockOrders.filter(o => ['awaiting_payment', 'partial_paid'].includes(o.status)).length,
        in_production: mockOrders.filter(o => o.status === 'in_production').length,
        ready_to_ship: mockOrders.filter(o => o.status === 'ready_to_ship').length,
        completed_today: mockOrders.filter(o => 
          o.status === 'completed' && 
          o.updated_at && 
          new Date(o.updated_at).toDateString() === todayStr
        ).length,
        overdue: mockOrders.filter(o => 
          o.due_date && 
          new Date(o.due_date) < today && 
          !['completed', 'cancelled', 'shipped', 'delivered'].includes(o.status)
        ).length,
      };

      const revenueStats = {
        today: 15600,
        this_week: 125000,
        this_month: 485000,
        pending_payment: mockOrders
          .filter(o => o.payment_status !== 'paid')
          .reduce((sum, o) => sum + ((o.pricing?.total_amount || 0) - (o.paid_amount || 0)), 0),
      };

      const productionStats = {
        active_jobs: mockProductionJobs.filter(j => j.status === 'in_progress').length,
        pending_jobs: mockProductionJobs.filter(j => ['pending', 'queued'].includes(j.status)).length,
        completed_today: mockProductionJobs.filter(j => 
          j.status === 'completed' && 
          j.completed_at && 
          new Date(j.completed_at).toDateString() === todayStr
        ).length,
        qc_failed_today: mockProductionJobs.filter(j => 
          j.status === 'qc_failed' && 
          j.qc_at && 
          new Date(j.qc_at).toDateString() === todayStr
        ).length,
        on_time_rate: 92,
      };

      const supplierStats = {
        total: mockSuppliers.length,
        active: mockSuppliers.filter(s => s.is_active).length,
        pending_po: mockPurchaseOrders.filter(po => ['draft', 'pending', 'confirmed'].includes(po.status)).length,
        pending_amount: mockPurchaseOrders
          .filter(po => po.payment_status !== 'paid')
          .reduce((sum, po) => sum + po.total_amount, 0),
      };

      setStats({
        orders: orderStats,
        revenue: revenueStats,
        production: productionStats,
        suppliers: supplierStats,
      });

      // Recent activities (mock)
      setRecentActivities([
        {
          id: 'act-1',
          type: 'payment',
          title: 'รับชำระเงิน',
          description: 'ORD-2024-0003 - ชำระครบ ฿24,075',
          timestamp: '10 นาทีที่แล้ว',
          status: 'success',
        },
        {
          id: 'act-2',
          type: 'production',
          title: 'งานผลิตเสร็จ',
          description: 'JOB-2024-0005 - DTF พิมพ์หน้า 5 ตัว',
          timestamp: '25 นาทีที่แล้ว',
          status: 'completed',
        },
        {
          id: 'act-3',
          type: 'order',
          title: 'ออเดอร์ใหม่',
          description: 'ORD-2024-0004 - โรงเรียน XYZ 200 ตัว',
          timestamp: '1 ชั่วโมงที่แล้ว',
        },
        {
          id: 'act-4',
          type: 'qc',
          title: 'QC ผ่าน',
          description: 'JOB-2024-0003 - DTF พิมพ์หน้า 48/50 ตัว',
          timestamp: '2 ชั่วโมงที่แล้ว',
          status: 'passed',
        },
        {
          id: 'act-5',
          type: 'production',
          title: 'เริ่มงานผลิต',
          description: 'JOB-2024-0001 - กำลังพิมพ์ DTF',
          timestamp: '3 ชั่วโมงที่แล้ว',
        },
      ]);

      // Upcoming deadlines
      const deadlines: UpcomingDeadline[] = [];
      
      mockOrders
        .filter(o => o.due_date && !['completed', 'cancelled', 'shipped', 'delivered'].includes(o.status))
        .forEach(o => {
          const dueDate = new Date(o.due_date!);
          const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (daysRemaining <= 7) {
            deadlines.push({
              id: o.id,
              type: 'order',
              reference: o.order_number,
              customer: o.customer_snapshot?.name || 'ไม่ระบุ',
              due_date: o.due_date!,
              days_remaining: daysRemaining,
              priority: o.priority_code === 'urgent' ? 2 : o.priority_code === 'rush' ? 1 : 0,
            });
          }
        });

      mockProductionJobs
        .filter(j => j.due_date && !['completed', 'cancelled'].includes(j.status))
        .forEach(j => {
          const dueDate = new Date(j.due_date!);
          const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (daysRemaining <= 5) {
            deadlines.push({
              id: j.id,
              type: 'production',
              reference: j.job_number,
              customer: j.customer_name || 'ไม่ระบุ',
              due_date: j.due_date!,
              days_remaining: daysRemaining,
              priority: j.priority,
            });
          }
        });

      // Sort by days remaining, then priority
      deadlines.sort((a, b) => {
        if (a.days_remaining !== b.days_remaining) {
          return a.days_remaining - b.days_remaining;
        }
        return b.priority - a.priority;
      });

      setUpcomingDeadlines(deadlines.slice(0, 10));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    stats,
    recentActivities,
    upcomingDeadlines,
    loading,
    error,
    refetch: fetchDashboard,
  };
}

