'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/modules/shared/services/supabase-client';
import { ProductionJob, JobStatus } from '../types';

interface UseProductionJobsOptions {
  status?: JobStatus | JobStatus[];
  limit?: number;
}

export function useProductionJobs(options: UseProductionJobsOptions = {}) {
  const [jobs, setJobs] = useState<ProductionJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('production_jobs')
        .select(`
          *,
          assigned_user:user_profiles!assigned_to(full_name, avatar_url)
        `)
        .order('due_date', { ascending: true, nullsFirst: false })
        .order('priority', { ascending: false });

      // Filter by status
      if (options.status) {
        if (Array.isArray(options.status)) {
          query = query.in('status', options.status);
        } else {
          query = query.eq('status', options.status);
        }
      }

      // Limit results
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      setJobs(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [supabase, options.status, options.limit]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('production_jobs_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'production_jobs' },
        () => {
          fetchJobs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchJobs]);

  return {
    jobs,
    loading,
    error,
    refresh: fetchJobs,
  };
}

export function useProductionJob(jobId: string | null) {
  const [job, setJob] = useState<ProductionJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchJob = useCallback(async () => {
    if (!jobId) {
      setJob(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('production_jobs')
        .select(`
          *,
          assigned_user:user_profiles!assigned_to(full_name, avatar_url),
          items:production_job_items(
            *,
            product:products(sku, model, color, size, quantity)
          ),
          updates:production_updates(
            *,
            user:user_profiles!updated_by(full_name)
          )
        `)
        .eq('id', jobId)
        .single();

      if (error) throw error;
      setJob(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [supabase, jobId]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  return {
    job,
    loading,
    error,
    refresh: fetchJob,
  };
}

export function useProductionStats() {
  const [stats, setStats] = useState({
    pending: 0,
    inProgress: 0,
    completedToday: 0,
    overdue: 0,
    totalThisWeek: 0,
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // Get all jobs
        const { data: jobs } = await supabase
          .from('production_jobs')
          .select('status, due_date, completed_at, created_at');

        if (jobs) {
          const pending = jobs.filter(j => j.status === 'pending').length;
          const inProgress = jobs.filter(j => ['reserved', 'printing', 'curing', 'packing'].includes(j.status)).length;
          const completedToday = jobs.filter(j => 
            j.status === 'completed' && 
            j.completed_at?.startsWith(today)
          ).length;
          const overdue = jobs.filter(j => 
            j.due_date && 
            j.due_date < today && 
            !['completed', 'cancelled'].includes(j.status)
          ).length;
          const totalThisWeek = jobs.filter(j => 
            j.created_at >= weekAgo
          ).length;

          setStats({ pending, inProgress, completedToday, overdue, totalThisWeek });
        }
      } catch (err) {
        console.error('Error fetching production stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [supabase]);

  return { stats, loading };
}

