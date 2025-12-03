'use client';

import { useState } from 'react';
import { createClient } from '@/modules/shared/services/supabase-client';
import { UserProfile } from '../types';
import { logAudit } from '@/modules/audit/services/auditService';

interface CreateUserInput {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  department?: string;
  role_id?: string;
}

interface UpdateUserInput {
  full_name?: string;
  phone?: string;
  department?: string;
  role_id?: string;
  is_active?: boolean;
}

export function useUserMutations() {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const createUser = async (input: CreateUserInput): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          email: input.email,
          full_name: input.full_name,
          phone: input.phone || null,
          department: input.department || null,
          role_id: input.role_id || null,
          is_active: true,
        });

      if (profileError) throw profileError;

      // Log audit
      await logAudit({
        action: 'create',
        entity_type: 'user',
        entity_id: authData.user.id,
        new_data: { email: input.email, full_name: input.full_name, role_id: input.role_id },
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userId: string, input: UpdateUserInput): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    
    try {
      // Get old data for audit
      const { data: oldUser } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const { error } = await supabase
        .from('user_profiles')
        .update(input)
        .eq('id', userId);

      if (error) throw error;

      // Log audit
      await logAudit({
        action: 'update',
        entity_type: 'user',
        entity_id: userId,
        old_data: oldUser,
        new_data: input,
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string, isActive: boolean): Promise<{ success: boolean; error?: string }> => {
    return updateUser(userId, { is_active: isActive });
  };

  const deleteUser = async (userId: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    
    try {
      // Get user data for audit
      const { data: oldUser } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: false })
        .eq('id', userId);

      if (error) throw error;

      // Log audit (soft delete)
      await logAudit({
        action: 'delete',
        entity_type: 'user',
        entity_id: userId,
        old_data: oldUser,
        new_data: { is_active: false },
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    createUser,
    updateUser,
    toggleUserStatus,
    deleteUser,
    loading,
  };
}

