'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/modules/shared/services/supabase-client';

interface DashboardStats {
  totalProducts: number;
  totalQuantity: number;
  lowStockCount: number;
  totalCostValue: number;
  recentTransactions: Transaction[];
  lowStockItems: LowStockItem[];
  productsByModel: ModelCount[];
}

interface Transaction {
  id: string;
  type: 'IN' | 'OUT' | 'ADJUST';
  quantity: number;
  created_at: string;
  product: {
    model: string;
    color: string;
    size: string;
    sku: string;
  };
}

interface LowStockItem {
  id: string;
  sku: string;
  model: string;
  color: string;
  size: string;
  quantity: number;
  min_level: number;
}

interface ModelCount {
  model: string;
  count: number;
  quantity: number;
}

const initialStats: DashboardStats = {
  totalProducts: 0,
  totalQuantity: 0,
  lowStockCount: 0,
  totalCostValue: 0,
  recentTransactions: [],
  lowStockItems: [],
  productsByModel: [],
};

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Fetch all products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*');

      if (productsError) throw productsError;

      // Fetch recent transactions with product info
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select(`
          id,
          type,
          quantity,
          created_at,
          product:products(model, color, size, sku)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (txError) throw txError;

      // Calculate stats
      const totalProducts = products?.length || 0;
      const totalQuantity = products?.reduce((sum, p) => sum + (p.quantity || 0), 0) || 0;
      const lowStockItems = products?.filter(p => p.quantity <= p.min_level) || [];
      const lowStockCount = lowStockItems.length;
      const totalCostValue = products?.reduce((sum, p) => sum + ((p.quantity || 0) * (p.cost || 0)), 0) || 0;

      // Group by model
      const modelMap = new Map<string, { count: number; quantity: number }>();
      products?.forEach(p => {
        const existing = modelMap.get(p.model) || { count: 0, quantity: 0 };
        modelMap.set(p.model, {
          count: existing.count + 1,
          quantity: existing.quantity + (p.quantity || 0),
        });
      });
      const productsByModel = Array.from(modelMap.entries()).map(([model, data]) => ({
        model,
        count: data.count,
        quantity: data.quantity,
      })).sort((a, b) => b.quantity - a.quantity);

      setStats({
        totalProducts,
        totalQuantity,
        lowStockCount,
        totalCostValue,
        recentTransactions: (transactions || []).map(tx => ({
          ...tx,
          product: tx.product as any,
        })),
        lowStockItems: lowStockItems.map(p => ({
          id: p.id,
          sku: p.sku,
          model: p.model,
          color: p.color,
          size: p.size,
          quantity: p.quantity,
          min_level: p.min_level,
        })).slice(0, 5),
        productsByModel,
      });
    } catch (err: any) {
      console.error('Error fetching dashboard stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading, error, refresh: fetchStats };
}
