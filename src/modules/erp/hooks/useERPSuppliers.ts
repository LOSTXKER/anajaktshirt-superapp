// =============================================
// ERP SUPPLIERS HOOKS
// =============================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { mockSuppliers, mockPurchaseOrders } from '../mocks/data';
import type {
  Supplier,
  PurchaseOrder,
} from '../types/suppliers';

// ---------------------------------------------
// useERPSuppliers - Suppliers list
// ---------------------------------------------

interface UseERPSuppliersOptions {
  category?: string;
  search?: string;
  autoFetch?: boolean;
}

interface UseERPSuppliersReturn {
  suppliers: Supplier[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useERPSuppliers(options: UseERPSuppliersOptions = {}): UseERPSuppliersReturn {
  const { category, search, autoFetch = true } = options;
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      let filtered = [...mockSuppliers];
      
      if (category) {
        filtered = filtered.filter(s => 
          s.categories?.includes(category)
        );
      }
      
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(s =>
          s.name.toLowerCase().includes(searchLower) ||
          s.code.toLowerCase().includes(searchLower) ||
          s.contact_name?.toLowerCase().includes(searchLower)
        );
      }
      
      setSuppliers(filtered);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  useEffect(() => {
    if (autoFetch) {
      fetchSuppliers();
    }
  }, [fetchSuppliers, autoFetch]);

  return {
    suppliers,
    loading,
    error,
    refetch: fetchSuppliers,
  };
}

// ---------------------------------------------
// useERPSupplier - Single supplier
// ---------------------------------------------

interface UseERPSupplierReturn {
  supplier: Supplier | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useERPSupplier(supplierId: string | null): UseERPSupplierReturn {
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSupplier = useCallback(async () => {
    if (!supplierId) {
      setSupplier(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      const found = mockSuppliers.find(s => s.id === supplierId);
      setSupplier(found || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch supplier');
    } finally {
      setLoading(false);
    }
  }, [supplierId]);

  useEffect(() => {
    fetchSupplier();
  }, [fetchSupplier]);

  return {
    supplier,
    loading,
    error,
    refetch: fetchSupplier,
  };
}

// ---------------------------------------------
// useERPPurchaseOrders - PO list
// ---------------------------------------------

interface UseERPPurchaseOrdersOptions {
  supplier_id?: string;
  status?: string;
  autoFetch?: boolean;
}

interface UseERPPurchaseOrdersReturn {
  purchaseOrders: PurchaseOrder[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useERPPurchaseOrders(options: UseERPPurchaseOrdersOptions = {}): UseERPPurchaseOrdersReturn {
  const { supplier_id, status, autoFetch = true } = options;
  
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPOs = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      let filtered = [...mockPurchaseOrders];
      
      if (supplier_id) {
        filtered = filtered.filter(po => po.supplier_id === supplier_id);
      }
      
      if (status) {
        filtered = filtered.filter(po => po.status === status);
      }
      
      setPurchaseOrders(filtered);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch purchase orders');
    } finally {
      setLoading(false);
    }
  }, [supplier_id, status]);

  useEffect(() => {
    if (autoFetch) {
      fetchPOs();
    }
  }, [fetchPOs, autoFetch]);

  return {
    purchaseOrders,
    loading,
    error,
    refetch: fetchPOs,
  };
}

// ---------------------------------------------
// useERPSupplierStats - Stats
// ---------------------------------------------

interface SupplierStats {
  total_suppliers: number;
  active_suppliers: number;
  total_po: number;
  pending_po: number;
  total_amount_pending: number;
}

interface UseERPSupplierStatsReturn {
  stats: SupplierStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useERPSupplierStats(): UseERPSupplierStatsReturn {
  const [stats, setStats] = useState<SupplierStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const calculatedStats: SupplierStats = {
        total_suppliers: mockSuppliers.length,
        active_suppliers: mockSuppliers.filter(s => s.is_active).length,
        total_po: mockPurchaseOrders.length,
        pending_po: mockPurchaseOrders.filter(po => 
          ['draft', 'pending', 'confirmed'].includes(po.status)
        ).length,
        total_amount_pending: mockPurchaseOrders
          .filter(po => po.payment_status !== 'paid')
          .reduce((sum, po) => sum + po.total_amount, 0),
      };
      
      setStats(calculatedStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
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

