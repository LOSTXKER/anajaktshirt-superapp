'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/modules/shared/services/supabase-client';

interface DashboardStats {
  // Stock stats
  totalProducts: number;
  totalStockValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  
  // Transaction stats (today)
  todayStockIn: number;
  todayStockOut: number;
  todayAdjustments: number;
  
  // Production stats
  totalActiveJobs: number;
  pendingJobs: number;
  inProgressJobs: number;
  completedToday: number;
  overdueJobs: number;
  
  // CRM stats
  totalCustomers: number;
  newCustomersThisMonth: number;
  activeCustomers: number;
  
  // Recent activity
  recentTransactions: any[];
  lowStockProducts: any[];
  upcomingDeadlines: any[];
  recentCustomers: any[];
}

const defaultStats: DashboardStats = {
  totalProducts: 0,
  totalStockValue: 0,
  lowStockCount: 0,
  outOfStockCount: 0,
  todayStockIn: 0,
  todayStockOut: 0,
  todayAdjustments: 0,
  totalActiveJobs: 0,
  pendingJobs: 0,
  inProgressJobs: 0,
  completedToday: 0,
  overdueJobs: 0,
  totalCustomers: 0,
  newCustomersThisMonth: 0,
  activeCustomers: 0,
  recentTransactions: [],
  lowStockProducts: [],
  upcomingDeadlines: [],
  recentCustomers: [],
};

export function useDashboardData() {
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      const today = new Date().toISOString().split('T')[0];
      const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

      // Fetch all data in parallel
      const [
        productsResult,
        transactionsResult,
        todayTransactionsResult,
        jobsResult,
        customersResult,
        recentTransactionsResult,
        lowStockResult,
        upcomingJobsResult,
        recentCustomersResult,
      ] = await Promise.all([
        // Products stats
        supabase
          .from('products')
          .select('id, current_stock, min_stock, cost_price'),
        
        // All transactions for totals
        supabase
          .from('transactions')
          .select('id, type, quantity'),
        
        // Today's transactions
        supabase
          .from('transactions')
          .select('id, type, quantity')
          .gte('created_at', today),
        
        // Production jobs
        supabase
          .from('production_jobs')
          .select('id, status, due_date, completed_at')
          .in('status', ['pending', 'reserved', 'printing', 'curing', 'packing', 'completed']),
        
        // Customers
        supabase
          .from('customers')
          .select('id, status, created_at'),
        
        // Recent transactions (last 10)
        supabase
          .from('transactions')
          .select(`
            id, type, quantity, created_at, notes,
            products:product_id (name, main_sku)
          `)
          .order('created_at', { ascending: false })
          .limit(10),
        
        // Low stock products
        supabase
          .from('products')
          .select('id, name, main_sku, current_stock, min_stock')
          .filter('current_stock', 'lte', 'min_stock')
          .order('current_stock', { ascending: true })
          .limit(10),
        
        // Upcoming deadlines (jobs due in next 7 days)
        supabase
          .from('production_jobs')
          .select('id, job_number, customer_name, due_date, status, progress')
          .lte('due_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .in('status', ['pending', 'reserved', 'printing', 'curing', 'packing'])
          .order('due_date', { ascending: true })
          .limit(5),
        
        // Recent customers
        supabase
          .from('customers')
          .select('id, code, name, tier, total_orders, created_at')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      // Process products stats
      const products = productsResult.data || [];
      const totalProducts = products.length;
      const totalStockValue = products.reduce((sum, p) => 
        sum + ((p.current_stock || 0) * (p.cost_price || 0)), 0
      );
      const lowStockCount = products.filter(p => 
        p.current_stock <= p.min_stock && p.current_stock > 0
      ).length;
      const outOfStockCount = products.filter(p => p.current_stock === 0).length;

      // Process today's transactions
      const todayTx = todayTransactionsResult.data || [];
      const todayStockIn = todayTx
        .filter(t => t.type === 'in')
        .reduce((sum, t) => sum + (t.quantity || 0), 0);
      const todayStockOut = todayTx
        .filter(t => t.type === 'out')
        .reduce((sum, t) => sum + Math.abs(t.quantity || 0), 0);
      const todayAdjustments = todayTx
        .filter(t => t.type === 'adjustment')
        .length;

      // Process jobs stats
      const jobs = jobsResult.data || [];
      const totalActiveJobs = jobs.filter(j => j.status !== 'completed' && j.status !== 'cancelled').length;
      const pendingJobs = jobs.filter(j => j.status === 'pending').length;
      const inProgressJobs = jobs.filter(j => 
        ['reserved', 'printing', 'curing', 'packing'].includes(j.status)
      ).length;
      const completedToday = jobs.filter(j => 
        j.status === 'completed' && 
        j.completed_at && 
        j.completed_at.split('T')[0] === today
      ).length;
      const overdueJobs = jobs.filter(j => 
        j.due_date && 
        j.due_date < today && 
        !['completed', 'cancelled'].includes(j.status)
      ).length;

      // Process customers stats
      const customers = customersResult.data || [];
      const totalCustomers = customers.length;
      const newCustomersThisMonth = customers.filter(c => 
        c.created_at >= firstOfMonth
      ).length;
      const activeCustomers = customers.filter(c => c.status === 'active').length;

      setStats({
        totalProducts,
        totalStockValue,
        lowStockCount,
        outOfStockCount,
        todayStockIn,
        todayStockOut,
        todayAdjustments,
        totalActiveJobs,
        pendingJobs,
        inProgressJobs,
        completedToday,
        overdueJobs,
        totalCustomers,
        newCustomersThisMonth,
        activeCustomers,
        recentTransactions: recentTransactionsResult.data || [],
        lowStockProducts: lowStockResult.data || [],
        upcomingDeadlines: upcomingJobsResult.data || [],
        recentCustomers: recentCustomersResult.data || [],
      });
    } catch (err: any) {
      console.error('Dashboard fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}

