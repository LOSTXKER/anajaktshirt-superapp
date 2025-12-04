'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  mockDesigns,
  mockDesignVersions,
  mockMockups,
  mockApprovalGates,
  getOrderGatesSummary,
  getDesignApprovalSummary,
  getMockupApprovalSummary,
} from '../mocks/data';
import type { 
  OrderDesign, 
  DesignVersion, 
  OrderMockup, 
  ApprovalGate,
  DesignApprovalSummary,
  MockupApprovalSummary,
  OrderGatesSummary,
} from '../types/orders';

// ---------------------------------------------
// useERPDesigns - Design Management
// ---------------------------------------------

interface UseERPDesignsOptions {
  orderId?: string;
  workItemId?: string;
  status?: string;
}

export function useERPDesigns(options: UseERPDesignsOptions = {}) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  // Filter designs
  const designs = useMemo(() => {
    let result = [...mockDesigns];

    if (options.orderId) {
      result = result.filter(d => d.order_id === options.orderId);
    }

    if (options.workItemId) {
      result = result.filter(d => d.order_work_item_id === options.workItemId);
    }

    if (options.status) {
      result = result.filter(d => d.status === options.status);
    }

    return result;
  }, [options.orderId, options.workItemId, options.status]);

  const getDesignById = useCallback((id: string): OrderDesign | undefined => {
    return mockDesigns.find(d => d.id === id);
  }, []);

  const getDesignVersions = useCallback((designId: string): DesignVersion[] => {
    return mockDesignVersions
      .filter(v => v.order_design_id === designId)
      .sort((a, b) => b.version_number - a.version_number);
  }, []);

  const getLatestVersion = useCallback((designId: string): DesignVersion | undefined => {
    const versions = getDesignVersions(designId);
    return versions[0];
  }, [getDesignVersions]);

  // Get approval summary for order
  const getApprovalSummary = useCallback((orderId: string): DesignApprovalSummary | null => {
    return getDesignApprovalSummary(orderId);
  }, []);

  // Calculate revision cost
  const calculateRevisionCost = useCallback((design: OrderDesign): number => {
    const REVISION_COST = 200; // ฿200 per paid revision
    if (design.revision_count <= design.max_free_revisions) {
      return 0;
    }
    return (design.revision_count - design.max_free_revisions) * REVISION_COST;
  }, []);

  // Check if can request revision
  const canRequestRevision = useCallback((design: OrderDesign): boolean => {
    return design.status !== 'approved' && design.status !== 'completed';
  }, []);

  // Check if revision will be paid
  const isRevisionPaid = useCallback((design: OrderDesign): boolean => {
    return design.revision_count >= design.max_free_revisions;
  }, []);

  return {
    designs,
    loading,
    getDesignById,
    getDesignVersions,
    getLatestVersion,
    getApprovalSummary,
    calculateRevisionCost,
    canRequestRevision,
    isRevisionPaid,
  };
}

// ---------------------------------------------
// useERPMockups - Mockup Management
// ---------------------------------------------

interface UseERPMockupsOptions {
  orderId?: string;
  status?: string;
}

export function useERPMockups(options: UseERPMockupsOptions = {}) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  // Filter mockups
  const mockups = useMemo(() => {
    let result = [...mockMockups];

    if (options.orderId) {
      result = result.filter(m => m.order_id === options.orderId);
    }

    if (options.status) {
      result = result.filter(m => m.status === options.status);
    }

    return result.sort((a, b) => b.version_number - a.version_number);
  }, [options.orderId, options.status]);

  const getMockupById = useCallback((id: string): OrderMockup | undefined => {
    return mockMockups.find(m => m.id === id);
  }, []);

  const getLatestMockup = useCallback((orderId: string): OrderMockup | undefined => {
    const orderMockups = mockMockups
      .filter(m => m.order_id === orderId)
      .sort((a, b) => b.version_number - a.version_number);
    return orderMockups[0];
  }, []);

  // Get approval summary
  const getApprovalSummary = useCallback((orderId: string): MockupApprovalSummary | null => {
    return getMockupApprovalSummary(orderId);
  }, []);

  // Check if mockup is approved
  const isMockupApproved = useCallback((orderId: string): boolean => {
    const latest = getLatestMockup(orderId);
    return latest?.status === 'approved';
  }, [getLatestMockup]);

  return {
    mockups,
    loading,
    getMockupById,
    getLatestMockup,
    getApprovalSummary,
    isMockupApproved,
  };
}

// ---------------------------------------------
// useERPApprovalGates - Approval Gate Management
// ---------------------------------------------

interface UseERPApprovalGatesOptions {
  orderId?: string;
}

export function useERPApprovalGates(options: UseERPApprovalGatesOptions = {}) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  // Filter gates
  const gates = useMemo(() => {
    let result = [...mockApprovalGates];

    if (options.orderId) {
      result = result.filter(g => g.order_id === options.orderId);
    }

    return result.sort((a, b) => a.sort_order - b.sort_order);
  }, [options.orderId]);

  const getGateById = useCallback((id: string): ApprovalGate | undefined => {
    return mockApprovalGates.find(g => g.id === id);
  }, []);

  const getGateByType = useCallback((orderId: string, gateType: string): ApprovalGate | undefined => {
    return mockApprovalGates.find(g => g.order_id === orderId && g.gate_type === gateType);
  }, []);

  // Get full summary for order
  const getGatesSummary = useCallback((orderId: string): OrderGatesSummary | null => {
    return getOrderGatesSummary(orderId);
  }, []);

  // Check if all mandatory gates passed
  const canStartProduction = useCallback((orderId: string): boolean => {
    const summary = getGatesSummary(orderId);
    return summary?.production_unlocked ?? false;
  }, [getGatesSummary]);

  // Get blocking gates
  const getBlockingGates = useCallback((orderId: string): string[] => {
    const summary = getGatesSummary(orderId);
    return summary?.blocking_gates ?? [];
  }, [getGatesSummary]);

  // Get next gate to complete
  const getNextPendingGate = useCallback((orderId: string): ApprovalGate | undefined => {
    const orderGates = gates.filter(g => g.order_id === orderId);
    return orderGates.find(g => g.status === 'pending' || g.status === 'in_progress');
  }, [gates]);

  // Get gate status color
  const getGateStatusColor = useCallback((status: string): string => {
    switch (status) {
      case 'approved':
        return '#34C759';
      case 'in_progress':
        return '#007AFF';
      case 'rejected':
        return '#FF3B30';
      case 'skipped':
        return '#8E8E93';
      default:
        return '#FF9500';
    }
  }, []);

  // Get gate status text
  const getGateStatusText = useCallback((status: string): string => {
    switch (status) {
      case 'approved':
        return 'ผ่าน';
      case 'in_progress':
        return 'กำลังดำเนินการ';
      case 'rejected':
        return 'ไม่ผ่าน';
      case 'skipped':
        return 'ข้าม';
      default:
        return 'รอดำเนินการ';
    }
  }, []);

  return {
    gates,
    loading,
    getGateById,
    getGateByType,
    getGatesSummary,
    canStartProduction,
    getBlockingGates,
    getNextPendingGate,
    getGateStatusColor,
    getGateStatusText,
  };
}

// ---------------------------------------------
// Combined Hook for Order Design Flow
// ---------------------------------------------

export function useERPOrderDesignFlow(orderId: string) {
  const { designs, loading: designsLoading, getApprovalSummary: getDesignSummary } = useERPDesigns({ orderId });
  const { mockups, loading: mockupsLoading, getApprovalSummary: getMockupSummary } = useERPMockups({ orderId });
  const { gates, loading: gatesLoading, getGatesSummary, canStartProduction } = useERPApprovalGates({ orderId });

  const loading = designsLoading || mockupsLoading || gatesLoading;

  const summary = useMemo(() => {
    const gatesSummary = getGatesSummary(orderId);
    const designSummary = getDesignSummary(orderId);
    const mockupSummary = getMockupSummary(orderId);

    return {
      gates: gatesSummary,
      design: designSummary,
      mockup: mockupSummary,
      canStartProduction: canStartProduction(orderId),
    };
  }, [orderId, getGatesSummary, getDesignSummary, getMockupSummary, canStartProduction]);

  return {
    designs,
    mockups,
    gates,
    summary,
    loading,
  };
}

