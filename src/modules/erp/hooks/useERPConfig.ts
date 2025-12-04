'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabaseConfigRepository } from '../repositories/supabase';
import type { Customer, Product, PrintPosition, PrintSize, OrderType, PriorityLevel } from '../types/config';
import type { WorkType, WorkDependency, OrderTypeRequiredWork } from '../types/orders';
import type { AddonType } from '../types/addons';
import { WORK_CATEGORIES, type WorkCategory } from '../types/config';

// ---------------------------------------------
// CUSTOMER CONFIGS
// ---------------------------------------------

export const CUSTOMER_TIER_CONFIG = {
  bronze: { label: 'Bronze', label_th: 'บรอนซ์', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  silver: { label: 'Silver', label_th: 'ซิลเวอร์', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  gold: { label: 'Gold', label_th: 'โกลด์', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  platinum: { label: 'Platinum', label_th: 'แพลทินัม', color: 'text-purple-600', bgColor: 'bg-purple-100' },
};

export const CUSTOMER_STATUS_CONFIG = {
  active: { label: 'Active', label_th: 'ใช้งาน', color: 'text-green-600', bgColor: 'bg-green-100' },
  inactive: { label: 'Inactive', label_th: 'ไม่ใช้งาน', color: 'text-gray-500', bgColor: 'bg-gray-100' },
  blocked: { label: 'Blocked', label_th: 'ระงับ', color: 'text-red-600', bgColor: 'bg-red-100' },
};

export const PAYMENT_TERMS_CONFIG = {
  cod: { label: 'COD', label_th: 'เก็บเงินปลายทาง' },
  prepaid: { label: 'Prepaid', label_th: 'ชำระล่วงหน้า' },
  net7: { label: 'Net 7', label_th: '7 วัน' },
  net15: { label: 'Net 15', label_th: '15 วัน' },
  net30: { label: 'Net 30', label_th: '30 วัน' },
  net60: { label: 'Net 60', label_th: '60 วัน' },
};

// ---------------------------------------------
// useERPCustomers
// ---------------------------------------------

interface UseERPCustomersOptions {
  search?: string;
  tier?: string;
  isActive?: boolean;
}

export function useERPCustomers(options: UseERPCustomersOptions = {}) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const { data } = await supabaseConfigRepository.findCustomers(
          {
            search: options.search,
            tier: options.tier,
          },
          { page: 0, pageSize: 1000 }
        );
        setCustomers(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [options.search, options.tier]);

  const getCustomerById = useCallback(
    (id: string): Customer | undefined => {
      return customers.find((c) => c.id === id);
    },
    [customers]
  );

  return {
    customers,
    loading,
    error,
    getCustomerById,
  };
}

// ---------------------------------------------
// useERPProducts
// ---------------------------------------------

interface UseERPProductsOptions {
  search?: string;
  category?: string;
  model?: string;
  color?: string;
  size?: string;
  inStock?: boolean;
}

export function useERPProducts(options: UseERPProductsOptions = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data } = await supabaseConfigRepository.findProducts(
          {
            search: options.search,
            model: options.model,
            color: options.color,
            size: options.size,
          },
          { page: 0, pageSize: 1000 }
        );
        setProducts(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [options.search, options.model, options.color, options.size]);

  // Get unique values for filters
  const filterOptions = useMemo(() => {
    const models = [...new Set(products.map((p) => p.model))];
    const colors = [...new Set(products.map((p) => p.color))];
    const sizes = [...new Set(products.map((p) => p.size))];
    const categories = [...new Set(products.map((p) => p.category))];

    return { models, colors, sizes, categories };
  }, [products]);

  const getProductById = useCallback(
    (id: string): Product | undefined => {
      return products.find((p) => p.id === id);
    },
    [products]
  );

  const getProductBySku = useCallback(
    (sku: string): Product | undefined => {
      return products.find((p) => p.sku === sku);
    },
    [products]
  );

  return {
    products,
    loading,
    error,
    filterOptions,
    getProductById,
    getProductBySku,
  };
}

// ---------------------------------------------
// useERPWorkTypes
// ---------------------------------------------

export function useERPWorkTypes() {
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkTypes = async () => {
      try {
        setLoading(true);
        const { data } = await supabaseConfigRepository.findWorkTypes({}, { page: 0, pageSize: 1000 });
        setWorkTypes(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkTypes();
  }, []);

  const getWorkTypeByCode = useCallback(
    (code: string): WorkType | undefined => {
      return workTypes.find((wt) => wt.code === code);
    },
    [workTypes]
  );

  // Group by category
  const workTypesByCategory = useMemo(() => {
    const grouped: Record<string, WorkType[]> = {};
    workTypes.forEach((wt) => {
      if (!grouped[wt.category]) {
        grouped[wt.category] = [];
      }
      grouped[wt.category].push(wt);
    });
    return grouped;
  }, [workTypes]);

  return {
    workTypes,
    loading,
    error,
    getWorkTypeByCode,
    workTypesByCategory,
  };
}

// ---------------------------------------------
// useERPAddonTypes
// ---------------------------------------------

export function useERPAddonTypes() {
  const [addonTypes, setAddonTypes] = useState<AddonType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // TODO: Implement in configRepository
    // For now, return empty
    setAddonTypes([]);
    setLoading(false);
  }, []);

  const getAddonTypeByCode = useCallback(
    (code: string): AddonType | undefined => {
      return addonTypes.find((at) => at.code === code);
    },
    [addonTypes]
  );

  // Group by category
  const addonTypesByCategory = useMemo(() => {
    const grouped: Record<string, AddonType[]> = {};
    addonTypes.forEach((at) => {
      if (!grouped[at.category]) {
        grouped[at.category] = [];
      }
      grouped[at.category].push(at);
    });
    return grouped;
  }, [addonTypes]);

  return {
    addonTypes,
    loading,
    error,
    getAddonTypeByCode,
    addonTypesByCategory,
  };
}

// ---------------------------------------------
// useERPPrintConfig
// ---------------------------------------------

export function useERPPrintConfig() {
  const [positions, setPositions] = useState<PrintPosition[]>([]);
  const [sizes, setSizes] = useState<PrintSize[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // TODO: Implement in configRepository
    // For now, return empty
    setPositions([]);
    setSizes([]);
    setLoading(false);
  }, []);

  return {
    positions,
    sizes,
    loading,
    error,
    getPositionByCode: (code: string) => positions.find((p) => p.code === code),
    getSizeByCode: (code: string) => sizes.find((s) => s.code === code),
  };
}

// ---------------------------------------------
// useERPOrderConfig
// ---------------------------------------------

export function useERPOrderConfig() {
  const [orderTypes, setOrderTypes] = useState<OrderType[]>([]);
  const [priorityLevels, setPriorityLevels] = useState<PriorityLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderConfig = async () => {
      try {
        setLoading(true);
        const [orderTypesResult, priorities] = await Promise.all([
          supabaseConfigRepository.findOrderTypes({}, { page: 0, pageSize: 100 }),
          supabaseConfigRepository.getPriorityLevels(),
        ]);
        setOrderTypes(orderTypesResult.data);
        setPriorityLevels(priorities as PriorityLevel[]);
      } catch (err: any) {
        console.error('Error fetching order config:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderConfig();
  }, []);

  const salesChannels = [
    { code: 'line', name_th: 'LINE' },
    { code: 'facebook', name_th: 'Facebook' },
    { code: 'instagram', name_th: 'Instagram' },
    { code: 'website', name_th: 'Website' },
    { code: 'walk_in', name_th: 'Walk-in' },
    { code: 'phone', name_th: 'Phone' },
  ];

  return {
    orderTypes,
    priorityLevels,
    salesChannels,
    loading,
    error,
    getOrderTypeByCode: (code: string) => orderTypes.find((ot) => ot.code === code),
    getPriorityByCode: (code: string) => priorityLevels.find((p) => p.code === code),
  };
}

// ---------------------------------------------
// useERPWorkDependencies
// ---------------------------------------------

export function useERPWorkDependencies(orderTypeCode: string) {
  const [dependencies, setDependencies] = useState<WorkDependency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // TODO: Implement work dependencies in database
    // For now, return empty
    setDependencies([]);
    setLoading(false);
  }, [orderTypeCode]);

  const { workTypes } = useERPWorkTypes();

  // For now, all work types are available
  const availableWorkTypes = workTypes;
  const requiredWorkTypes: WorkType[] = [];
  const suggestedWorkTypes: WorkType[] = [];

  // Get dependencies for a specific work type
  const getDependenciesFor = useCallback(
    (workTypeCode: string): WorkDependency | undefined => {
      return dependencies.find((d) => d.work_type_code === workTypeCode);
    },
    [dependencies]
  );

  // Check if work type can be added (all dependencies met)
  const canAddWorkType = useCallback(
    (workTypeCode: string, currentWorkItems: string[]): boolean => {
      const dep = getDependenciesFor(workTypeCode);
      if (!dep || dep.depends_on.length === 0) return true;

      // Check if all dependencies are in currentWorkItems
      return dep.depends_on.every((depCode) => currentWorkItems.includes(depCode));
    },
    [getDependenciesFor]
  );

  // Get missing dependencies for a work type
  const getMissingDependencies = useCallback(
    (workTypeCode: string, currentWorkItems: string[]): string[] => {
      const dep = getDependenciesFor(workTypeCode);
      if (!dep) return [];

      return dep.depends_on.filter((depCode) => !currentWorkItems.includes(depCode));
    },
    [getDependenciesFor]
  );

  // Build workflow order from selected work items
  const buildWorkflowOrder = useCallback(
    (workItems: string[]): { code: string; order: number; parallel: string[] }[] => {
      return workItems.map((code, index) => ({
        code,
        order: index + 1,
        parallel: [],
      }));
    },
    []
  );

  // Work categories for grouping
  const workCategories = WORK_CATEGORIES;

  return {
    loading,
    error,
    orderTypeConfig: null,
    dependencies,
    availableWorkTypes,
    requiredWorkTypes,
    suggestedWorkTypes,
    workCategories,
    getDependenciesFor,
    canAddWorkType,
    getMissingDependencies,
    buildWorkflowOrder,
  };
}
