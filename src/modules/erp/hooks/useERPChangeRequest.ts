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
        setTotalCount(result.totalCount);
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

  return {
    changeRequests,
    totalCount,
    loading,
    error,
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
