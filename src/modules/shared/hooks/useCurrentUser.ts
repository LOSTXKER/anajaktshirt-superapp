'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/modules/shared/services/supabase-client';

interface CurrentUser {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  department: string | null;
  role_id: string | null;
  role_name: string | null;
  role_display_name: string | null;
  is_active: boolean;
}

interface UseCurrentUserReturn {
  user: CurrentUser | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  hasRole: (roleName: string) => boolean;
  refetch: () => Promise<void>;
}

/**
 * useCurrentUser - ดึงข้อมูล user ปัจจุบัน
 * 
 * @example
 * const { user, isAdmin, isSuperAdmin, loading } = useCurrentUser();
 */
export function useCurrentUser(): UseCurrentUserReturn {
  const supabase = createClient();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) throw authError;
      if (!authUser) {
        setUser(null);
        return;
      }

      // Fetch user profile with role
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select(`
          id,
          email,
          full_name,
          phone,
          department,
          role_id,
          is_active,
          role:roles(
            name,
            display_name
          )
        `)
        .eq('id', authUser.id)
        .single();

      if (profileError) {
        // If profile doesn't exist, create minimal user object
        setUser({
          id: authUser.id,
          email: authUser.email || '',
          full_name: null,
          phone: null,
          department: null,
          role_id: null,
          role_name: null,
          role_display_name: null,
          is_active: true,
        });
        return;
      }

      setUser({
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        phone: profile.phone,
        department: profile.department,
        role_id: profile.role_id,
        role_name: (profile.role as any)?.name || null,
        role_display_name: (profile.role as any)?.display_name || null,
        is_active: profile.is_active,
      });
    } catch (err: any) {
      console.error('Error fetching current user:', err);
      setError(err.message || 'Failed to fetch user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchUser();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isAdmin = user?.role_name === 'admin' || user?.role_name === 'super_admin';
  const isSuperAdmin = user?.role_name === 'super_admin';
  
  const hasRole = (roleName: string) => user?.role_name === roleName;

  return {
    user,
    loading,
    error,
    isAdmin,
    isSuperAdmin,
    hasRole,
    refetch: fetchUser,
  };
}

