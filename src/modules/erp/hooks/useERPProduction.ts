// =============================================
// ERP PRODUCTION HOOKS
// =============================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getProductionJobs,
  getProductionJob,
  getStations,
  getProductionQueue,
  getProductionStats,
  startJob,
  logProduction,
  completeJob,
} from '../services/productionService';
import { initializeERP, isERPInitialized } from '../index';
import type {
  ProductionJob,
  ProductionStation,
  ProductionJobFilters,
  ProductionStats,
  ProductionJobSummary,
  LogProductionInput,
} from '../types/production';
import type { PaginationParams, PaginatedResult } from '../types/common';

// ---------------------------------------------
// Initialize ERP on first use
// ---------------------------------------------

function ensureERPInitialized() {
  if (!isERPInitialized()) {
    initializeERP('mock');
  }
}

// ---------------------------------------------
// useERPProductionJobs - Production jobs list
// ---------------------------------------------

interface UseERPProductionJobsOptions {
  filters?: ProductionJobFilters;
  pagination?: PaginationParams;
  autoFetch?: boolean;
}

interface UseERPProductionJobsReturn {
  jobs: ProductionJob[];
  loading: boolean;
  error: string | null;
  pagination: PaginatedResult<ProductionJob>['pagination'] | null;
  refetch: () => Promise<void>;
}

export function useERPProductionJobs(options: UseERPProductionJobsOptions = {}): UseERPProductionJobsReturn {
  const { filters, pagination: paginationParams, autoFetch = true } = options;
  
  const [jobs, setJobs] = useState<ProductionJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paginationState, setPaginationState] = useState<PaginatedResult<ProductionJob>['pagination'] | null>(null);

  const fetchJobs = useCallback(async () => {
    ensureERPInitialized();
    setLoading(true);
    setError(null);
    
    try {
      const result = await getProductionJobs(filters, paginationParams);
      setJobs(result.data);
      setPaginationState(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  }, [filters, paginationParams]);

  useEffect(() => {
    if (autoFetch) {
      fetchJobs();
    }
  }, [fetchJobs, autoFetch]);

  return {
    jobs,
    loading,
    error,
    pagination: paginationState,
    refetch: fetchJobs,
  };
}

// ---------------------------------------------
// useERPProductionJob - Single job
// ---------------------------------------------

interface UseERPProductionJobReturn {
  job: ProductionJob | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useERPProductionJob(jobId: string | null): UseERPProductionJobReturn {
  const [job, setJob] = useState<ProductionJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJob = useCallback(async () => {
    if (!jobId) {
      setJob(null);
      setLoading(false);
      return;
    }

    ensureERPInitialized();
    setLoading(true);
    setError(null);

    try {
      const result = await getProductionJob(jobId);
      setJob(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch job');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  return {
    job,
    loading,
    error,
    refetch: fetchJob,
  };
}

// ---------------------------------------------
// useERPStations - Production stations
// ---------------------------------------------

interface UseERPStationsReturn {
  stations: ProductionStation[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useERPStations(): UseERPStationsReturn {
  const [stations, setStations] = useState<ProductionStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStations = useCallback(async () => {
    ensureERPInitialized();
    setLoading(true);
    setError(null);

    try {
      const result = await getStations();
      setStations(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  return {
    stations,
    loading,
    error,
    refetch: fetchStations,
  };
}

// ---------------------------------------------
// useERPProductionQueue - Production queue
// ---------------------------------------------

interface UseERPProductionQueueReturn {
  queue: ProductionJobSummary[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useERPProductionQueue(stationId?: string): UseERPProductionQueueReturn {
  const [queue, setQueue] = useState<ProductionJobSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    ensureERPInitialized();
    setLoading(true);
    setError(null);

    try {
      const result = await getProductionQueue(stationId);
      setQueue(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch queue');
    } finally {
      setLoading(false);
    }
  }, [stationId]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  return {
    queue,
    loading,
    error,
    refetch: fetchQueue,
  };
}

// ---------------------------------------------
// useERPProductionStats - Production statistics
// ---------------------------------------------

interface UseERPProductionStatsReturn {
  stats: ProductionStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useERPProductionStats(filters?: ProductionJobFilters): UseERPProductionStatsReturn {
  const [stats, setStats] = useState<ProductionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    ensureERPInitialized();
    setLoading(true);
    setError(null);

    try {
      const result = await getProductionStats(filters);
      setStats(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}

// ---------------------------------------------
// useERPProductionMutations - Job mutations
// ---------------------------------------------

interface UseERPProductionMutationsReturn {
  startJob: (jobId: string) => Promise<boolean>;
  logProduction: (data: LogProductionInput) => Promise<boolean>;
  completeJob: (jobId: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export function useERPProductionMutations(): UseERPProductionMutationsReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartJob = useCallback(async (jobId: string): Promise<boolean> => {
    ensureERPInitialized();
    setLoading(true);
    setError(null);

    try {
      const result = await startJob(jobId);
      if (!result.success) {
        setError(result.message || 'Failed to start job');
      }
      return result.success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start job');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogProduction = useCallback(async (data: LogProductionInput): Promise<boolean> => {
    ensureERPInitialized();
    setLoading(true);
    setError(null);

    try {
      const result = await logProduction(data);
      if (!result.success) {
        setError(result.message || 'Failed to log production');
      }
      return result.success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log production');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCompleteJob = useCallback(async (jobId: string): Promise<boolean> => {
    ensureERPInitialized();
    setLoading(true);
    setError(null);

    try {
      const result = await completeJob(jobId);
      if (!result.success) {
        setError(result.message || 'Failed to complete job');
      }
      return result.success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete job');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    startJob: handleStartJob,
    logProduction: handleLogProduction,
    completeJob: handleCompleteJob,
    loading,
    error,
  };
}

