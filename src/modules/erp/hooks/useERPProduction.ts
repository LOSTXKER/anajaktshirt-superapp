// =============================================
// ERP PRODUCTION HOOKS
// =============================================

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  mockProductionJobs,
  mockProductionStations,
} from '../mocks/data';
import type {
  ProductionJob,
  ProductionStation,
  ProductionStats,
  ProductionJobFilters,
} from '../types/production';

// ---------------------------------------------
// useERPProductionJobs - Production jobs list
// ---------------------------------------------

interface UseERPProductionJobsOptions {
  filters?: ProductionJobFilters;
  autoFetch?: boolean;
}

interface UseERPProductionJobsReturn {
  jobs: ProductionJob[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  refetch: () => Promise<void>;
}

export function useERPProductionJobs(options: UseERPProductionJobsOptions = {}): UseERPProductionJobsReturn {
  const { filters, autoFetch = true } = options;
  
  const [jobs, setJobs] = useState<ProductionJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      let filtered = [...mockProductionJobs];
      
      // Apply filters
      if (filters?.status) {
        const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
        filtered = filtered.filter(j => statuses.includes(j.status));
      }
      
      if (filters?.work_type_code) {
        filtered = filtered.filter(j => j.work_type_code === filters.work_type_code);
      }
      
      if (filters?.priority !== undefined) {
        filtered = filtered.filter(j => j.priority === filters.priority);
      }
      
      if (filters?.station_id) {
        filtered = filtered.filter(j => j.station_id === filters.station_id);
      }
      
      if (filters?.search) {
        const search = filters.search.toLowerCase();
        filtered = filtered.filter(j =>
          j.job_number.toLowerCase().includes(search) ||
          j.customer_name?.toLowerCase().includes(search) ||
          j.order_number?.toLowerCase().includes(search) ||
          j.description?.toLowerCase().includes(search)
        );
      }
      
      // Sort by priority (descending) then due_date
      filtered.sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        if (a.due_date && b.due_date) {
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        }
        return 0;
      });
      
      setJobs(filtered);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch production jobs');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (autoFetch) {
      fetchJobs();
    }
  }, [fetchJobs, autoFetch]);

  return {
    jobs,
    loading,
    error,
    totalCount: jobs.length,
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

    setLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      const found = mockProductionJobs.find(j => j.id === jobId);
      setJob(found || null);
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
// useERPProductionStations - Stations list
// ---------------------------------------------

interface UseERPProductionStationsReturn {
  stations: ProductionStation[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useERPProductionStations(): UseERPProductionStationsReturn {
  const [stations, setStations] = useState<ProductionStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      setStations(mockProductionStations);
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
// useERPProductionStats - Stats
// ---------------------------------------------

interface UseERPProductionStatsReturn {
  stats: ProductionStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useERPProductionStats(): UseERPProductionStatsReturn {
  const [stats, setStats] = useState<ProductionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const jobs = mockProductionJobs;
      const today = new Date().toDateString();
      
      const calculatedStats: ProductionStats = {
        total_jobs: jobs.length,
        pending_jobs: jobs.filter(j => ['pending', 'queued'].includes(j.status)).length,
        in_progress_jobs: jobs.filter(j => j.status === 'in_progress').length,
        completed_today: jobs.filter(j => 
          j.status === 'completed' && 
          j.completed_at && 
          new Date(j.completed_at).toDateString() === today
        ).length,
        total_qty_pending: jobs
          .filter(j => !['completed', 'cancelled'].includes(j.status))
          .reduce((sum, j) => sum + (j.ordered_qty - j.produced_qty), 0),
        total_qty_completed_today: jobs
          .filter(j => j.completed_at && new Date(j.completed_at).toDateString() === today)
          .reduce((sum, j) => sum + j.passed_qty, 0),
        on_time_rate: 92,
        rework_rate: 3,
      };
      
      setStats(calculatedStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  }, []);

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
// useERPProductionMutations - Mutations
// ---------------------------------------------

interface UseERPProductionMutationsReturn {
  updateJobStatus: (jobId: string, status: string, notes?: string) => Promise<{ success: boolean; error?: string }>;
  assignJob: (jobId: string, stationId: string) => Promise<{ success: boolean; error?: string }>;
  loading: boolean;
  error: string | null;
}

export function useERPProductionMutations(): UseERPProductionMutationsReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateJobStatus = useCallback(async (jobId: string, status: string, notes?: string) => {
    setLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      // In mock mode, just return success
      console.log('Mock: Update job status', { jobId, status, notes });
      return { success: true };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update status';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const assignJob = useCallback(async (jobId: string, stationId: string) => {
    setLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      console.log('Mock: Assign job', { jobId, stationId });
      return { success: true };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to assign job';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    updateJobStatus,
    assignJob,
    loading,
    error,
  };
}
