'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/modules/shared/services/supabase-client';
import { AuditLog, AuditLogFilters } from '../types';

export function useAuditLogs(filters: AuditLogFilters = {}) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();

      // Build query - simple select without join first
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters.action) {
        query = query.eq('action', filters.action);
      }
      if (filters.entity_type) {
        query = query.eq('entity_type', filters.entity_type);
      }
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to + 'T23:59:59');
      }

      // Add pagination and sorting
      query = query
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      const { data, error: queryError, count } = await query;

      if (queryError) throw queryError;

      setLogs(data || []);
      setTotalCount(count || 0);
    } catch (err: any) {
      console.error('Audit logs fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return {
    logs,
    loading,
    error,
    totalCount,
    page,
    setPage,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
    refetch: fetchLogs,
  };
}

