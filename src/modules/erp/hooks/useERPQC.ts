'use client';

import { useState, useEffect } from 'react';
import { supabaseQCRepository } from '../repositories/supabase/qcRepository';
import type {
  QCRecord,
  QCTemplate,
  QCRecordFilters,
  CreateQCRecordInput,
  QCActionInput,
  QCStats,
} from '../types/qc';
import type { PaginationParams } from '../types/common';

export function useERPQCRecords(filters?: QCRecordFilters, pagination?: PaginationParams) {
  const [qcRecords, setQCRecords] = useState<QCRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQCRecords = async () => {
      try {
        setLoading(true);
        const result = await supabaseQCRepository.findMany(filters, pagination);
        setQCRecords(result.data);
        setTotalCount(result.totalCount);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQCRecords();
  }, [filters?.order_id, filters?.production_job_id, filters?.stage, filters?.overall_result, pagination?.page, pagination?.pageSize]);

  const createQCRecord = async (input: CreateQCRecordInput) => {
    try {
      const result = await supabaseQCRepository.create(input);
      if (result.success && result.data) {
        setQCRecords(prev => [result.data!, ...prev]);
        return result.data;
      }
      throw new Error(result.message || 'Failed to create QC record');
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const takeAction = async (input: QCActionInput) => {
    try {
      const result = await supabaseQCRepository.takeAction(input);
      if (result.success) {
        // Refresh list
        const refreshResult = await supabaseQCRepository.findMany(filters, pagination);
        setQCRecords(refreshResult.data);
      }
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const markFollowUpComplete = async (recordId: string) => {
    try {
      const result = await supabaseQCRepository.markFollowUpComplete(recordId);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    qcRecords,
    totalCount,
    loading,
    error,
    createQCRecord,
    takeAction,
    markFollowUpComplete,
  };
}

export function useERPQCTemplates(workTypeCode?: string) {
  const [templates, setTemplates] = useState<QCTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const data = await supabaseQCRepository.getTemplates(workTypeCode);
        setTemplates(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [workTypeCode]);

  return { templates, loading, error };
}

export function useERPQCStats(filters?: QCRecordFilters) {
  const [stats, setStats] = useState<QCStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await supabaseQCRepository.getStats(filters);
        setStats(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [filters?.order_id, filters?.production_job_id]);

  return { stats, loading, error };
}
