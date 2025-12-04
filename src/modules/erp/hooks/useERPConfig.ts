'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  mockCustomers,
  mockProducts,
  mockWorkTypes,
  mockAddonTypes,
  mockPrintPositions,
  mockPrintSizes,
  mockOrderTypes,
  mockPriorityLevels,
  mockSalesChannels,
} from '../mocks/data';
import type { Customer, Product, PrintPosition, PrintSize, OrderType, PriorityLevel } from '../types/config';
import type { WorkType } from '../types/orders';
import type { AddonType } from '../types/addons';

// ---------------------------------------------
// useERPCustomers
// ---------------------------------------------

interface UseERPCustomersOptions {
  search?: string;
  tier?: string;
  isActive?: boolean;
}

export function useERPCustomers(options: UseERPCustomersOptions = {}) {
  const [loading, setLoading] = useState(true);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  // Filter customers
  const customers = useMemo(() => {
    let result = [...mockCustomers];

    if (options.search) {
      const searchLower = options.search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(searchLower) ||
          c.code.toLowerCase().includes(searchLower) ||
          c.phone?.includes(options.search!) ||
          c.email?.toLowerCase().includes(searchLower)
      );
    }

    if (options.tier) {
      result = result.filter((c) => c.tier === options.tier);
    }

    if (options.isActive !== undefined) {
      result = result.filter((c) => c.is_active === options.isActive);
    }

    return result;
  }, [options.search, options.tier, options.isActive]);

  const getCustomerById = useCallback((id: string): Customer | undefined => {
    return mockCustomers.find((c) => c.id === id);
  }, []);

  return {
    customers,
    loading,
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
  const [loading, setLoading] = useState(true);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  // Filter products
  const products = useMemo(() => {
    let result = [...mockProducts];

    if (options.search) {
      const searchLower = options.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.sku.toLowerCase().includes(searchLower) ||
          p.model.toLowerCase().includes(searchLower)
      );
    }

    if (options.category) {
      result = result.filter((p) => p.category === options.category);
    }

    if (options.model) {
      result = result.filter((p) => p.model === options.model);
    }

    if (options.color) {
      result = result.filter((p) => p.color === options.color);
    }

    if (options.size) {
      result = result.filter((p) => p.size === options.size);
    }

    if (options.inStock) {
      result = result.filter((p) => p.available_qty > 0);
    }

    return result;
  }, [options.search, options.category, options.model, options.color, options.size, options.inStock]);

  // Get unique values for filters
  const filterOptions = useMemo(() => {
    const models = [...new Set(mockProducts.map((p) => p.model))];
    const colors = [...new Set(mockProducts.map((p) => p.color))];
    const sizes = [...new Set(mockProducts.map((p) => p.size))];
    const categories = [...new Set(mockProducts.map((p) => p.category))];

    return { models, colors, sizes, categories };
  }, []);

  const getProductById = useCallback((id: string): Product | undefined => {
    return mockProducts.find((p) => p.id === id);
  }, []);

  const getProductBySku = useCallback((sku: string): Product | undefined => {
    return mockProducts.find((p) => p.sku === sku);
  }, []);

  return {
    products,
    loading,
    filterOptions,
    getProductById,
    getProductBySku,
  };
}

// ---------------------------------------------
// useERPWorkTypes
// ---------------------------------------------

export function useERPWorkTypes() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 200);
    return () => clearTimeout(timer);
  }, []);

  const workTypes = mockWorkTypes;

  const getWorkTypeByCode = useCallback((code: string): WorkType | undefined => {
    return mockWorkTypes.find((wt) => wt.code === code);
  }, []);

  // Group by category
  const workTypesByCategory = useMemo(() => {
    const grouped: Record<string, WorkType[]> = {};
    workTypes.forEach((wt) => {
      if (!grouped[wt.category_code]) {
        grouped[wt.category_code] = [];
      }
      grouped[wt.category_code].push(wt);
    });
    return grouped;
  }, [workTypes]);

  return {
    workTypes,
    loading,
    getWorkTypeByCode,
    workTypesByCategory,
  };
}

// ---------------------------------------------
// useERPAddonTypes
// ---------------------------------------------

export function useERPAddonTypes() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 200);
    return () => clearTimeout(timer);
  }, []);

  const addonTypes = mockAddonTypes;

  const getAddonTypeByCode = useCallback((code: string): AddonType | undefined => {
    return mockAddonTypes.find((at) => at.code === code);
  }, []);

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
    getAddonTypeByCode,
    addonTypesByCategory,
  };
}

// ---------------------------------------------
// useERPPrintConfig
// ---------------------------------------------

export function useERPPrintConfig() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 200);
    return () => clearTimeout(timer);
  }, []);

  return {
    positions: mockPrintPositions,
    sizes: mockPrintSizes,
    loading,
    getPositionByCode: (code: string) => mockPrintPositions.find((p) => p.code === code),
    getSizeByCode: (code: string) => mockPrintSizes.find((s) => s.code === code),
  };
}

// ---------------------------------------------
// useERPOrderConfig
// ---------------------------------------------

export function useERPOrderConfig() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 200);
    return () => clearTimeout(timer);
  }, []);

  return {
    orderTypes: mockOrderTypes,
    priorityLevels: mockPriorityLevels,
    salesChannels: mockSalesChannels,
    loading,
    getOrderTypeByCode: (code: string) => mockOrderTypes.find((ot) => ot.code === code),
    getPriorityByCode: (code: string) => mockPriorityLevels.find((p) => p.code === code),
  };
}

