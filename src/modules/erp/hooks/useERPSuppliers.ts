// =============================================
// ERP SUPPLIERS HOOKS
// =============================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabaseSupplierRepository } from '../repositories/supabase/supplierRepository';
import type {
  Supplier,
  PurchaseOrder,
  SupplierFilters,
  PurchaseOrderFilters,
  CreateSupplierInput,
  UpdateSupplierInput,
  CreatePurchaseOrderInput,
  ReceiveGoodsInput,
  SupplierStats,
} from '../types/suppliers';
import type { PaginationParams } from '../types/common';

// ---------------------------------------------
// useERPSuppliers - Suppliers list
// ---------------------------------------------

export function useERPSuppliers(filters?: SupplierFilters, pagination?: PaginationParams) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      const result = await supabaseSupplierRepository.findMany(filters, pagination);
      setSuppliers(result.data);
      setTotalCount(result.totalCount);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const createSupplier = async (input: CreateSupplierInput) => {
    try {
      const result = await supabaseSupplierRepository.create(input);
      if (result.success && result.data) {
        setSuppliers(prev => [result.data!, ...prev]);
        return result.data;
      }
      throw new Error(result.message || 'Failed to create supplier');
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateSupplier = async (id: string, updates: UpdateSupplierInput) => {
    try {
      const result = await supabaseSupplierRepository.update(id, updates);
      if (result.success && result.data) {
        setSuppliers(prev => prev.map(s => (s.id === id ? result.data! : s)));
        return result.data;
      }
      throw new Error(result.message || 'Failed to update supplier');
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    suppliers,
    totalCount,
    loading,
    error,
    refetch: fetchSuppliers,
    createSupplier,
    updateSupplier,
  };
}

// ---------------------------------------------
// useERPPurchaseOrders - Purchase orders list
// ---------------------------------------------

export function useERPPurchaseOrders(filters?: PurchaseOrderFilters, pagination?: PaginationParams) {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPurchaseOrders = useCallback(async () => {
    try {
      setLoading(true);
      // Note: This would need to be implemented in the repository
      // For now, returning empty
      setPurchaseOrders([]);
      setTotalCount(0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination]);

  useEffect(() => {
    fetchPurchaseOrders();
  }, [fetchPurchaseOrders]);

  const createPurchaseOrder = async (input: CreatePurchaseOrderInput) => {
    try {
      const result = await supabaseSupplierRepository.createPurchaseOrder(input);
      if (result.success && result.data) {
        setPurchaseOrders(prev => [result.data!, ...prev]);
        return result.data;
      }
      throw new Error(result.message || 'Failed to create purchase order');
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const sendPurchaseOrder = async (poId: string) => {
    try {
      const result = await supabaseSupplierRepository.sendPurchaseOrder(poId);
      if (result.success) {
        await fetchPurchaseOrders(); // Refresh list
      }
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const confirmPurchaseOrder = async (poId: string) => {
    try {
      const result = await supabaseSupplierRepository.confirmPurchaseOrder(poId);
      if (result.success) {
        await fetchPurchaseOrders(); // Refresh list
      }
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const receiveGoods = async (data: ReceiveGoodsInput) => {
    try {
      const result = await supabaseSupplierRepository.receiveGoods(data);
      if (result.success) {
        await fetchPurchaseOrders(); // Refresh list
      }
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    purchaseOrders,
    totalCount,
    loading,
    error,
    refetch: fetchPurchaseOrders,
    createPurchaseOrder,
    sendPurchaseOrder,
    confirmPurchaseOrder,
    receiveGoods,
  };
}

// ---------------------------------------------
// useERPSupplierStats - Supplier statistics
// ---------------------------------------------

export function useERPSupplierStats() {
  const [stats, setStats] = useState<SupplierStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await supabaseSupplierRepository.getStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}
