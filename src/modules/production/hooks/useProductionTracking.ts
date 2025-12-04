'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/modules/shared/services/supabase-client';
import type {
  ProductionJob,
  ProductionJobFilters,
  ProductionStation,
  ProductionJobLog,
  ProductionStats,
  QCCheckpoint,
  QCTemplate,
} from '../types/tracking';

// =============================================
// USE PRODUCTION JOBS
// =============================================

export function useProductionJobs(filters?: ProductionJobFilters) {
  const supabase = createClient();
  const [jobs, setJobs] = useState<ProductionJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const isFetching = useRef(false);

  // Stringify filters to use as dependency
  const filtersKey = JSON.stringify(filters || {});

  const fetchJobs = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    
    try {
      setLoading(true);
      setError(null);

      // Simplified query without complex joins
      let query = supabase
        .from('production_jobs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }
      if (filters?.work_type_code) {
        query = query.eq('work_type_code', filters.work_type_code);
      }
      if (filters?.station_id) {
        query = query.eq('station_id', filters.station_id);
      }
      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }
      if (filters?.priority !== undefined) {
        query = query.eq('priority', filters.priority);
      }
      if (filters?.date_from) {
        query = query.gte('due_date', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('due_date', filters.date_to);
      }
      if (filters?.search) {
        query = query.or(`job_number.ilike.%${filters.search}%,work_type_name.ilike.%${filters.search}%`);
      }
      
      // Pagination
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
      }

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      setJobs((data || []) as ProductionJob[]);
      setTotalCount(count || 0);
    } catch (err: any) {
      console.error('Error fetching production jobs:', err);
      setError(err.message || 'Failed to fetch jobs');
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return { jobs, loading, error, totalCount, refetch: fetchJobs };
}

// =============================================
// USE SINGLE PRODUCTION JOB
// =============================================

export function useProductionJob(jobId: string | null) {
  const supabase = createClient();
  const [job, setJob] = useState<ProductionJob | null>(null);
  const [logs, setLogs] = useState<ProductionJobLog[]>([]);
  const [checkpoints, setCheckpoints] = useState<QCCheckpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJob = useCallback(async () => {
    if (!jobId) {
      setJob(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch job - simplified query
      const { data: jobData, error: jobError } = await supabase
        .from('production_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (jobError) throw jobError;
      setJob(jobData as ProductionJob);

      // Fetch logs
      const { data: logsData } = await supabase
        .from('production_job_logs')
        .select('*')
        .eq('job_id', jobId)
        .order('performed_at', { ascending: false });

      setLogs((logsData || []) as ProductionJobLog[]);

      // Fetch QC checkpoints
      const { data: checkpointsData } = await supabase
        .from('qc_checkpoints')
        .select('*')
        .eq('job_id', jobId)
        .order('checkpoint_order', { ascending: true });

      setCheckpoints((checkpointsData || []) as QCCheckpoint[]);

    } catch (err: any) {
      console.error('Error fetching production job:', err);
      setError(err.message || 'Failed to fetch job');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  return { job, logs, checkpoints, loading, error, refetch: fetchJob };
}

// =============================================
// USE PRODUCTION STATIONS
// =============================================

export function useProductionStations(department?: string) {
  const supabase = createClient();
  const [stations, setStations] = useState<ProductionStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('production_stations')
        .select('*')
        .or('is_active.eq.true,status.eq.active')  // Support both schema versions
        .order('department')
        .order('code');

      if (department) {
        query = query.eq('department', department);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        // If error, try without is_active filter (table might not have the column)
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('production_stations')
          .select('*')
          .order('department')
          .order('code');
        
        if (fallbackError) throw fallbackError;
        setStations((fallbackData || []) as ProductionStation[]);
      } else {
        setStations((data || []) as ProductionStation[]);
      }
    } catch (err: any) {
      console.error('Error fetching production stations:', err);
      setError(err.message || 'Failed to fetch stations');
      setStations([]); // Set empty array on error for better UX
    } finally {
      setLoading(false);
    }
  }, [department]);

  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  return { stations, loading, error, refetch: fetchStations };
}

// =============================================
// USE PRODUCTION STATS
// =============================================

export function useProductionStats() {
  const supabase = createClient();
  const [stats, setStats] = useState<ProductionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const today = new Date().toISOString().split('T')[0];

      // Total jobs
      const { count: totalJobs } = await supabase
        .from('production_jobs')
        .select('*', { count: 'exact', head: true });

      // Pending jobs
      const { count: pendingJobs } = await supabase
        .from('production_jobs')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'queued']);

      // In progress jobs
      const { count: inProgressJobs } = await supabase
        .from('production_jobs')
        .select('*', { count: 'exact', head: true })
        .in('status', ['assigned', 'in_progress']);

      // Completed today
      const { count: completedToday } = await supabase
        .from('production_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('completed_at', today);

      // QC failed today
      const { count: qcFailedToday } = await supabase
        .from('production_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('qc_status', 'failed')
        .gte('updated_at', today);

      // By status
      const { data: allJobs } = await supabase
        .from('production_jobs')
        .select('status');

      const statusCounts: Record<string, number> = {};
      allJobs?.forEach((job: any) => {
        if (job.status) {
          statusCounts[job.status] = (statusCounts[job.status] || 0) + 1;
        }
      });

      const byStatus = Object.entries(statusCounts).map(([status, count]) => ({
        status: status as any,
        count,
      }));

      setStats({
        total_jobs: totalJobs || 0,
        pending_jobs: pendingJobs || 0,
        in_progress_jobs: inProgressJobs || 0,
        completed_today: completedToday || 0,
        qc_failed_today: qcFailedToday || 0,
        by_status: byStatus,
        by_department: [],
      });
    } catch (err: any) {
      console.error('Error fetching production stats:', err);
      setError(err.message || 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchStats();
    }
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}

// =============================================
// USE QC TEMPLATES
// =============================================

export function useQCTemplates(workTypeCode?: string) {
  const supabase = createClient();
  const [templates, setTemplates] = useState<QCTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('qc_templates')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (workTypeCode) {
        query = query.eq('work_type_code', workTypeCode);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setTemplates((data || []) as QCTemplate[]);
    } catch (err: any) {
      console.error('Error fetching QC templates:', err);
      setError(err.message || 'Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  }, [workTypeCode]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return { templates, loading, error, refetch: fetchTemplates };
}
