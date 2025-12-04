'use client';

import { useState, useEffect } from 'react';
import { supabaseChangeRequestRepository } from '../repositories/supabase/changeRequestRepository';
import type {
  ChangeRequest,
  ChangeRequestFilters,
  CreateChangeRequestInput,
  QuoteChangeRequestInput,
  RespondChangeRequestInput,
  ChangeRequestStats,
} from '../types/change-requests';
import type { PaginationParams } from '../types/common';

// ---------------------------------------------
// STATUS & TYPE CONFIGS
// ---------------------------------------------

export const CHANGE_REQUEST_STATUS_CONFIG = {
  pending: { label: 'Pending', label_th: 'รอดำเนินการ', color: 'bg-yellow-100 text-yellow-700' },
  quoted: { label: 'Quoted', label_th: 'ส่งราคาแล้ว', color: 'bg-blue-100 text-blue-700' },
  approved: { label: 'Approved', label_th: 'อนุมัติแล้ว', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', label_th: 'ปฏิเสธ', color: 'bg-red-100 text-red-700' },
  in_progress: { label: 'In Progress', label_th: 'กำลังดำเนินการ', color: 'bg-purple-100 text-purple-700' },
  completed: { label: 'Completed', label_th: 'เสร็จสิ้น', color: 'bg-gray-100 text-gray-700' },
  cancelled: { label: 'Cancelled', label_th: 'ยกเลิก', color: 'bg-gray-100 text-gray-500' },
};

export const CHANGE_TYPE_CONFIG = {
  design: { label: 'Design Change', label_th: 'เปลี่ยนแบบ', icon: '🎨' },
  quantity: { label: 'Quantity Change', label_th: 'เปลี่ยนจำนวน', icon: '📦' },
  color: { label: 'Color Change', label_th: 'เปลี่ยนสี', icon: '🎨' },
  size: { label: 'Size Change', label_th: 'เปลี่ยนไซส์', icon: '📏' },
  material: { label: 'Material Change', label_th: 'เปลี่ยนวัสดุ', icon: '🧵' },
  deadline: { label: 'Deadline Change', label_th: 'เปลี่ยนกำหนดส่ง', icon: '📅' },
  cancel: { label: 'Cancel Order', label_th: 'ยกเลิกออเดอร์', icon: '❌' },
  other: { label: 'Other', label_th: 'อื่นๆ', icon: '📝' },
};

export const IMPACT_LEVEL_CONFIG: Record<string, { label: string; label_th: string; color: string }> = {
  none: { label: 'None', label_th: 'ไม่มี', color: 'bg-gray-100 text-gray-600' },
  low: { label: 'Low', label_th: 'น้อย', color: 'bg-green-100 text-green-600' },
  medium: { label: 'Medium', label_th: 'ปานกลาง', color: 'bg-yellow-100 text-yellow-600' },
  high: { label: 'High', label_th: 'มาก', color: 'bg-red-100 text-red-600' },
  critical: { label: 'Critical', label_th: 'วิกฤต', color: 'bg-purple-100 text-purple-600' },
};

export function useERPChangeRequests(filters?: ChangeRequestFilters, pagination?: PaginationParams) {
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChangeRequests = async () => {
      try {
        setLoading(true);
        const result = await supabaseChangeRequestRepository.findMany(filters, pagination);
        setChangeRequests(result.data);
        setTotalCount(result.totalCount ?? result.pagination?.total ?? 0);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchChangeRequests();
  }, [filters?.order_id, filters?.status, filters?.type, filters?.search, pagination?.page, pagination?.pageSize]);

  const createChangeRequest = async (input: CreateChangeRequestInput) => {
    try {
      const result = await supabaseChangeRequestRepository.create(input);
      if (result.success && result.data) {
        setChangeRequests(prev => [result.data!, ...prev]);
        return result.data;
      }
      throw new Error(result.message || 'Failed to create change request');
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const quoteChangeRequest = async (input: QuoteChangeRequestInput) => {
    try {
      const result = await supabaseChangeRequestRepository.quote(input);
      if (result.success) {
        // Refresh list
        const refreshResult = await supabaseChangeRequestRepository.findMany(filters, pagination);
        setChangeRequests(refreshResult.data);
      }
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const respondToRequest = async (input: RespondChangeRequestInput) => {
    try {
      const result = await supabaseChangeRequestRepository.respondToRequest(input);
      if (result.success) {
        // Refresh list
        const refreshResult = await supabaseChangeRequestRepository.findMany(filters, pagination);
        setChangeRequests(refreshResult.data);
      }
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const markCompleted = async (changeRequestId: string) => {
    try {
      const result = await supabaseChangeRequestRepository.markCompleted(changeRequestId);
      if (result.success) {
        setChangeRequests(prev =>
          prev.map(cr => cr.id === changeRequestId ? { ...cr, status: 'completed' as const } : cr)
        );
      }
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const cancelRequest = async (changeRequestId: string, reason: string) => {
    try {
      const result = await supabaseChangeRequestRepository.cancel(changeRequestId, reason);
      if (result.success) {
        setChangeRequests(prev =>
          prev.map(cr => cr.id === changeRequestId ? { ...cr, status: 'cancelled' as const } : cr)
        );
      }
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Calculate inline stats
  const pending = changeRequests.filter(cr => cr.status === 'pending').length;
  const quoted = changeRequests.filter(cr => cr.status === 'quoted').length;
  const approved = changeRequests.filter(cr => cr.status === 'approved').length;
  const rejected = changeRequests.filter(cr => cr.status === 'rejected').length;
  const completed = changeRequests.filter(cr => cr.status === 'completed').length;
  const cancelled = changeRequests.filter(cr => cr.status === 'cancelled').length;
  const totalFees = changeRequests.reduce((sum, cr) => sum + (cr.actual_cost || cr.fees?.total_fee || 0), 0);
  
  const stats: ChangeRequestStats = {
    total_requests: totalCount,
    total: totalCount,
    pending_requests: pending,
    pending: pending,
    awaiting_customer: changeRequests.filter(cr => cr.status === 'awaiting_customer' || cr.status === 'quoted').length,
    total_fees_quoted: changeRequests.reduce((sum, cr) => sum + (cr.fees?.total_fee || 0), 0),
    total_fees_collected: totalFees,
    avg_resolution_days: 0, // Would need to calculate from completed requests
    quoted: quoted,
    approved: approved,
    rejected: rejected,
    completed: completed,
    cancelled: cancelled,
    total_cost: totalFees,
    by_type: changeRequests.reduce((acc, cr) => {
      const key = cr.change_type || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    by_impact: changeRequests.reduce((acc, cr) => {
      const key = cr.impact_level || cr.impact?.level || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  return {
    changeRequests,
    totalCount,
    loading,
    error,
    stats,
    createChangeRequest,
    quoteChangeRequest,
    respondToRequest,
    markCompleted,
    cancelRequest,
  };
}

export function useERPChangeRequestStats(filters?: ChangeRequestFilters) {
  const [stats, setStats] = useState<ChangeRequestStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await supabaseChangeRequestRepository.getStats(filters);
        setStats(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [filters?.order_id]);

  return { stats, loading, error };
}
