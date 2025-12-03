'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/modules/shared/services/supabase-client';
import { UserProfile, Role } from '../types';

export function useUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          role:roles(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const fetchRoles = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('name');

      if (error) throw error;
      setRoles(data || []);
    } catch (err: any) {
      console.error('Error fetching roles:', err);
    }
  }, [supabase]);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [fetchUsers, fetchRoles]);

  return {
    users,
    roles,
    loading,
    error,
    refresh: fetchUsers,
  };
}

export function useCurrentUser() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (authUser) {
          const { data } = await supabase
            .from('user_profiles')
            .select(`
              *,
              role:roles(*)
            `)
            .eq('id', authUser.id)
            .single();
          
          setUser(data);
        }
      } catch (err) {
        console.error('Error fetching current user:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, [supabase]);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user?.role?.permissions) return false;
    
    const perms = user.role.permissions as string[];
    
    // Super admin has all permissions
    if (perms.includes('*')) return true;
    
    // Check exact permission
    if (perms.includes(permission)) return true;
    
    // Check wildcard permission (e.g., 'stock:*' covers 'stock:view')
    const [module] = permission.split(':');
    if (perms.includes(`${module}:*`)) return true;
    
    return false;
  }, [user]);

  const canAccess = useCallback((module: string): boolean => {
    return hasPermission(`${module}:view`) || hasPermission(`${module}:*`) || hasPermission('*');
  }, [hasPermission]);

  return {
    user,
    loading,
    hasPermission,
    canAccess,
    isAdmin: user?.role?.name === 'super_admin',
  };
}

