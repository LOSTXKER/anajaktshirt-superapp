'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/modules/shared/services/supabase-client';
import { Customer, CustomerTier, CustomerStatus } from '../types';

interface UseCustomersOptions {
  tier?: CustomerTier;
  status?: CustomerStatus;
  search?: string;
  limit?: number;
}

export function useCustomers(options: UseCustomersOptions = {}) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('customers')
        .select('*')
        .order('total_spent', { ascending: false });

      // Filter by tier
      if (options.tier) {
        query = query.eq('tier', options.tier);
      }

      // Filter by status
      if (options.status) {
        query = query.eq('status', options.status);
      }

      // Search
      if (options.search) {
        query = query.or(`name.ilike.%${options.search}%,code.ilike.%${options.search}%,contact_name.ilike.%${options.search}%`);
      }

      // Limit
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCustomers(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [supabase, options.tier, options.status, options.search, options.limit]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return {
    customers,
    loading,
    error,
    refresh: fetchCustomers,
  };
}

export function useCustomer(customerId: string | null) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchCustomer = useCallback(async () => {
    if (!customerId) {
      setCustomer(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          contacts:customer_contacts(*),
          interactions:customer_interactions(
            *,
            user:user_profiles!created_by(full_name)
          )
        `)
        .eq('id', customerId)
        .single();

      if (error) throw error;
      setCustomer(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [supabase, customerId]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  return {
    customer,
    loading,
    error,
    refresh: fetchCustomer,
  };
}

export function useCustomerStats() {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    newThisMonth: 0,
    totalRevenue: 0,
    byTier: {
      bronze: 0,
      silver: 0,
      gold: 0,
      platinum: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { data: customers } = await supabase
          .from('customers')
          .select('status, tier, total_spent, created_at');

        if (customers) {
          const total = customers.length;
          const active = customers.filter(c => c.status === 'active').length;
          const newThisMonth = customers.filter(c => 
            new Date(c.created_at) >= startOfMonth
          ).length;
          const totalRevenue = customers.reduce((sum, c) => sum + (c.total_spent || 0), 0);
          
          const byTier = {
            bronze: customers.filter(c => c.tier === 'bronze').length,
            silver: customers.filter(c => c.tier === 'silver').length,
            gold: customers.filter(c => c.tier === 'gold').length,
            platinum: customers.filter(c => c.tier === 'platinum').length,
          };

          setStats({ total, active, newThisMonth, totalRevenue, byTier });
        }
      } catch (err) {
        console.error('Error fetching customer stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [supabase]);

  return { stats, loading };
}

