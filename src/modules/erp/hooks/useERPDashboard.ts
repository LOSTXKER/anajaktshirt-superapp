// =============================================
// ERP DASHBOARD HOOKS
// =============================================

'use client';

import { useState, useEffect } from 'react';
import { supabaseOrderRepository } from '../repositories/supabase/orderRepository';
import { supabaseProductionRepository } from '../repositories/supabase/productionRepository';
import { supabaseSupplierRepository } from '../repositories/supabase/supplierRepository';
import type { OrderStats } from '../types/orders';
import type { ProductionStats } from '../types/production';
import type { SupplierStats } from '../types/suppliers';

export interface DashboardStats {
  orders: OrderStats | null;
  production: ProductionStats | null;
  suppliers: SupplierStats | null;
}

export function useERPDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    orders: null,
    production: null,
    suppliers: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);

        const [orderStats, productionStats, supplierStats] = await Promise.all([
          supabaseOrderRepository.getOrderStats(),
          supabaseProductionRepository.getStats(),
          supabaseSupplierRepository.getStats(),
        ]);

        setStats({
          orders: orderStats,
          production: productionStats,
          suppliers: supplierStats,
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  return {
    stats,
    loading,
    error,
  };
}
