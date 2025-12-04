// =============================================
// ERP DESIGN & APPROVAL HOOKS
// =============================================

'use client';

import { useState, useEffect } from 'react';
import { supabaseOrderRepository } from '../repositories/supabase/orderRepository';
import type {
  OrderDesign,
  DesignVersion,
  OrderMockup,
  ApprovalGate,
} from '../types/orders';

// ---------------------------------------------
// useERPDesigns - Design versions for an order
// ---------------------------------------------

export function useERPDesigns(orderId: string) {
  const [designs, setDesigns] = useState<OrderDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDesigns = async () => {
      try {
        setLoading(true);
        const data = await supabaseOrderRepository.getDesigns(orderId);
        setDesigns(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchDesigns();
    }
  }, [orderId]);

  return {
    designs,
    loading,
    error,
  };
}

// ---------------------------------------------
// useERPMockups - Mockups for an order
// ---------------------------------------------

export function useERPMockups(orderId: string) {
  const [mockups, setMockups] = useState<OrderMockup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMockups = async () => {
      try {
        setLoading(true);
        const data = await supabaseOrderRepository.getMockups(orderId);
        setMockups(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchMockups();
    }
  }, [orderId]);

  const approveMockup = async (mockupId: string) => {
    try {
      const result = await supabaseOrderRepository.approveMockup(mockupId);
      if (result.success) {
        // Refresh mockups
        const data = await supabaseOrderRepository.getMockups(orderId);
        setMockups(data);
      }
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const rejectMockup = async (mockupId: string, feedback: string) => {
    try {
      const result = await supabaseOrderRepository.rejectMockup(mockupId, feedback);
      if (result.success) {
        // Refresh mockups
        const data = await supabaseOrderRepository.getMockups(orderId);
        setMockups(data);
      }
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    mockups,
    loading,
    error,
    approveMockup,
    rejectMockup,
  };
}

// ---------------------------------------------
// useERPApprovalGates - Approval gates (combined hook)
// ---------------------------------------------

export function useERPApprovalGates(orderId: string) {
  const { designs, loading: designsLoading, error: designsError } = useERPDesigns(orderId);
  const { mockups, loading: mockupsLoading, error: mockupsError, approveMockup, rejectMockup } = useERPMockups(orderId);

  // Note: In a full implementation, approval_gates would be a separate table
  // For now, we derive status from designs and mockups
  const approvalGates: ApprovalGate[] = [];

  // Design approval gate
  const latestDesign = designs[0];
  if (latestDesign) {
    const latestVersion = latestDesign.versions?.[0];
    approvalGates.push({
      id: `gate-design-${orderId}`,
      order_id: orderId,
      gate_type: 'design_approval',
      status: latestVersion?.status === 'approved' ? 'approved' : 
              latestVersion?.status === 'rejected' ? 'rejected' : 'pending',
      approved_by: latestVersion?.approved_by,
      approved_at: latestVersion?.approved_at,
      notes: latestVersion?.feedback,
      created_at: latestDesign.created_at,
      updated_at: latestDesign.updated_at,
    });
  }

  // Mockup approval gate
  const latestMockup = mockups[0];
  if (latestMockup) {
    approvalGates.push({
      id: `gate-mockup-${orderId}`,
      order_id: orderId,
      gate_type: 'mockup_approval',
      status: latestMockup.status === 'approved' ? 'approved' :
              latestMockup.status === 'rejected' ? 'rejected' : 'pending',
      approved_by: latestMockup.approved_by_customer ? orderId : undefined, // Mock
      approved_at: latestMockup.approved_at,
      notes: latestMockup.customer_feedback,
      created_at: latestMockup.created_at,
      updated_at: latestMockup.updated_at,
    });
  }

  return {
    designs,
    mockups,
    approvalGates,
    loading: designsLoading || mockupsLoading,
    error: designsError || mockupsError,
    approveMockup,
    rejectMockup,
  };
}
