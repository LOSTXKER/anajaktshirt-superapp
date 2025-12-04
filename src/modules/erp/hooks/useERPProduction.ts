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
      setTotalCount(result.totalCount);
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

  useEffect(() => {
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

    fetchStats();
  }, [filters]);

  return {
    stats,
    loading,
    error,
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
