// =============================================
// ERP PRODUCTION HOOKS
// =============================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabaseProductionRepository } from '../repositories/supabase/productionRepository';
import type {
  ProductionJob,
  ProductionStation,
  ProductionStats,
  ProductionJobFilters,
  CreateProductionJobInput,
  UpdateProductionJobInput,
  LogProductionInput,
  ProductionJobSummary,
} from '../types/production';
import type { PaginationParams } from '../types/common';

// ---------------------------------------------
// PRODUCTION CONFIGS
// ---------------------------------------------

export const JOB_STATUS_CONFIG = {
  pending: { label: 'Pending', label_th: 'รอดำเนินการ', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  queued: { label: 'Queued', label_th: 'อยู่ในคิว', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  assigned: { label: 'Assigned', label_th: 'มอบหมายแล้ว', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  in_progress: { label: 'In Progress', label_th: 'กำลังผลิต', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  qc_check: { label: 'QC Check', label_th: 'ตรวจ QC', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  qc_passed: { label: 'QC Passed', label_th: 'ผ่าน QC', color: 'text-green-600', bgColor: 'bg-green-100' },
  qc_failed: { label: 'QC Failed', label_th: 'ไม่ผ่าน QC', color: 'text-red-600', bgColor: 'bg-red-100' },
  rework: { label: 'Rework', label_th: 'แก้ไข', color: 'text-red-600', bgColor: 'bg-red-100' },
  completed: { label: 'Completed', label_th: 'เสร็จสิ้น', color: 'text-green-700', bgColor: 'bg-green-200' },
  cancelled: { label: 'Cancelled', label_th: 'ยกเลิก', color: 'text-gray-500', bgColor: 'bg-gray-100' },
};

export const PRIORITY_LEVEL_CONFIG: Record<number, { label: string; label_th: string; color: string; bgColor: string; score: number }> = {
  0: { label: 'Normal', label_th: 'ปกติ', color: 'text-gray-600', bgColor: 'bg-gray-100', score: 0 },
  1: { label: 'Urgent', label_th: 'เร่ง', color: 'text-orange-600', bgColor: 'bg-orange-100', score: 20 },
  2: { label: 'Express', label_th: 'ด่วน', color: 'text-red-600', bgColor: 'bg-red-100', score: 50 },
  3: { label: 'Critical', label_th: 'ด่วนมาก', color: 'text-red-700', bgColor: 'bg-red-200', score: 100 },
};

// ---------------------------------------------
// useERPProductionJobs - Production jobs list
// ---------------------------------------------

interface UseERPProductionJobsOptions {
  filters?: ProductionJobFilters;
  pagination?: PaginationParams;
  autoFetch?: boolean;
}

export function useERPProductionJobs(options: UseERPProductionJobsOptions = {}) {
  const { filters, pagination, autoFetch = true } = options;

  const [jobs, setJobs] = useState<ProductionJob[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const result = await supabaseProductionRepository.findMany(filters, pagination);
      setJobs(result.data);
      setTotalCount(result.totalCount ?? result.pagination?.total ?? 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination]);

  useEffect(() => {
    if (autoFetch) {
      fetchJobs();
    }
  }, [autoFetch, fetchJobs]);

  const createJob = async (input: CreateProductionJobInput) => {
    try {
      const result = await supabaseProductionRepository.create(input);
      if (result.success && result.data) {
        setJobs(prev => [result.data!, ...prev]);
        return result.data;
      }
      throw new Error(result.message || 'Failed to create job');
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateJob = async (id: string, updates: UpdateProductionJobInput) => {
    try {
      const result = await supabaseProductionRepository.update(id, updates);
      if (result.success && result.data) {
        setJobs(prev => prev.map(j => (j.id === id ? result.data! : j)));
        return result.data;
      }
      throw new Error(result.message || 'Failed to update job');
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const startJob = async (jobId: string) => {
    try {
      const result = await supabaseProductionRepository.startJob(jobId);
      if (result.success) {
        await fetchJobs(); // Refresh list
      }
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const logProduction = async (data: LogProductionInput) => {
    try {
      const result = await supabaseProductionRepository.logProduction(data);
      if (result.success) {
        await fetchJobs(); // Refresh list
      }
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const completeJob = async (jobId: string) => {
    try {
      const result = await supabaseProductionRepository.completeJob(jobId);
      if (result.success) {
        await fetchJobs(); // Refresh list
      }
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    jobs,
    totalCount,
    loading,
    error,
    refetch: fetchJobs,
    createJob,
    updateJob,
    startJob,
    logProduction,
    completeJob,
  };
}

// ---------------------------------------------
// useERPProductionStations - Production stations
// ---------------------------------------------

export function useERPProductionStations() {
  const [stations, setStations] = useState<ProductionStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        setLoading(true);
        const data = await supabaseProductionRepository.getStations();
        setStations(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
  }, []);

  return {
    stations,
    loading,
    error,
  };
}

// ---------------------------------------------
// useERPProductionStats - Production statistics
// ---------------------------------------------

export function useERPProductionStats(filters?: ProductionJobFilters) {
  const [stats, setStats] = useState<ProductionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await supabaseProductionRepository.getStats(filters);
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [filters]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}

// ---------------------------------------------
// useERPProductionMutations - Production mutations only
// ---------------------------------------------

export function useERPProductionMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createJob = async (input: CreateProductionJobInput) => {
    try {
      setLoading(true);
      const result = await supabaseProductionRepository.create(input);
      if (result.success && result.data) {
        return result.data;
      }
      throw new Error(result.message || 'Failed to create job');
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateJob = async (id: string, updates: UpdateProductionJobInput) => {
    try {
      setLoading(true);
      const result = await supabaseProductionRepository.update(id, updates);
      if (result.success && result.data) {
        return result.data;
      }
      throw new Error(result.message || 'Failed to update job');
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const startJob = async (jobId: string) => {
    try {
      setLoading(true);
      return await supabaseProductionRepository.startJob(jobId);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const completeJob = async (jobId: string) => {
    try {
      setLoading(true);
      return await supabaseProductionRepository.completeJob(jobId);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logProduction = async (data: LogProductionInput) => {
    try {
      setLoading(true);
      return await supabaseProductionRepository.logProduction(data);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const assignToStation = async (jobId: string, stationId: string) => {
    try {
      setLoading(true);
      return await supabaseProductionRepository.assignToStation(jobId, stationId);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const assignToWorker = async (jobId: string, workerId: string) => {
    try {
      setLoading(true);
      return await supabaseProductionRepository.assignToWorker(jobId, workerId);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Alias: updateJobStatus (calls updateJob with status)
  const updateJobStatus = async (jobId: string, status: string): Promise<{ success: boolean; data?: ProductionJob; error?: string }> => {
    try {
      const job = await updateJob(jobId, { status: status as ProductionJob['status'] });
      return { success: true, data: job };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Unknown error' };
    }
  };

  // Alias: assignJob (calls assignToStation or assignToWorker)
  const assignJob = async (jobId: string, assigneeId: string, assigneeType: 'station' | 'worker' = 'station') => {
    if (assigneeType === 'station') {
      return assignToStation(jobId, assigneeId);
    }
    return assignToWorker(jobId, assigneeId);
  };

  return {
    loading,
    error,
    createJob,
    updateJob,
    updateJobStatus,
    startJob,
    completeJob,
    logProduction,
    assignToStation,
    assignToWorker,
    assignJob,
  };
}

// ---------------------------------------------
// useERPProductionQueue - Production queue/kanban
// ---------------------------------------------

export function useERPProductionQueue(stationId?: string) {
  const [queue, setQueue] = useState<ProductionJobSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true);
      const data = await supabaseProductionRepository.getQueue(stationId);
      setQueue(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [stationId]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const reorderQueue = async (jobIds: string[]) => {
    try {
      const result = await supabaseProductionRepository.reorderQueue(jobIds);
      if (result.success) {
        await fetchQueue(); // Refresh queue
      }
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const assignToStation = async (jobId: string, stationId: string) => {
    try {
      const result = await supabaseProductionRepository.assignToStation(jobId, stationId);
      if (result.success) {
        await fetchQueue(); // Refresh queue
      }
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const assignToWorker = async (jobId: string, workerId: string) => {
    try {
      const result = await supabaseProductionRepository.assignToWorker(jobId, workerId);
      if (result.success) {
        await fetchQueue(); // Refresh queue
      }
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    queue,
    loading,
    error,
    refetch: fetchQueue,
    reorderQueue,
    assignToStation,
    assignToWorker,
  };
}
