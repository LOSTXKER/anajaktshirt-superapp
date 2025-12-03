'use client';

import { useState } from 'react';
import { createClient } from '@/modules/shared/services/supabase-client';
import { CustomerType, PaymentTerms, CustomerTier, InteractionType } from '../types';
import { logAudit } from '@/modules/audit/services/auditService';

interface CreateCustomerInput {
  name: string;
  type?: CustomerType;
  contact_name?: string;
  email?: string;
  phone?: string;
  line_id?: string;
  address?: string;
  district?: string;
  province?: string;
  postal_code?: string;
  tax_id?: string;
  credit_limit?: number;
  payment_terms?: PaymentTerms;
  notes?: string;
  tags?: string[];
}

interface UpdateCustomerInput extends Partial<CreateCustomerInput> {
  tier?: CustomerTier;
  status?: 'active' | 'inactive' | 'blocked';
}

interface AddInteractionInput {
  type: InteractionType;
  subject?: string;
  content?: string;
  attachments?: string[];
}

export function useCustomerMutations() {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const createCustomer = async (input: CreateCustomerInput): Promise<{ success: boolean; customerId?: string; error?: string }> => {
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Generate customer code
      const { data: code } = await supabase.rpc('generate_customer_code');

      const { data, error } = await supabase
        .from('customers')
        .insert({
          code,
          name: input.name,
          type: input.type || 'company',
          contact_name: input.contact_name || null,
          email: input.email || null,
          phone: input.phone || null,
          line_id: input.line_id || null,
          address: input.address || null,
          district: input.district || null,
          province: input.province || null,
          postal_code: input.postal_code || null,
          tax_id: input.tax_id || null,
          credit_limit: input.credit_limit || 0,
          payment_terms: input.payment_terms || 'cash',
          notes: input.notes || null,
          tags: input.tags || [],
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Log audit
      await logAudit({
        action: 'create',
        entity_type: 'customer',
        entity_id: data.id,
        new_data: { ...input, id: data.id, code },
      });

      return { success: true, customerId: data.id };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateCustomer = async (customerId: string, input: UpdateCustomerInput): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    
    try {
      // Get old data for audit
      const { data: oldCustomer } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

      const { error } = await supabase
        .from('customers')
        .update(input)
        .eq('id', customerId);

      if (error) throw error;

      // Log audit
      await logAudit({
        action: 'update',
        entity_type: 'customer',
        entity_id: customerId,
        old_data: oldCustomer,
        new_data: input,
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteCustomer = async (customerId: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    
    try {
      // Get customer data for audit
      const { data: oldCustomer } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

      // Soft delete - set status to blocked
      const { error } = await supabase
        .from('customers')
        .update({ status: 'blocked' })
        .eq('id', customerId);

      if (error) throw error;

      // Log audit (soft delete)
      await logAudit({
        action: 'delete',
        entity_type: 'customer',
        entity_id: customerId,
        old_data: oldCustomer,
        new_data: { status: 'blocked' },
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const addInteraction = async (customerId: string, input: AddInteractionInput): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('customer_interactions')
        .insert({
          customer_id: customerId,
          type: input.type,
          subject: input.subject || null,
          content: input.content || null,
          attachments: input.attachments || [],
          created_by: user?.id,
        });

      if (error) throw error;

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const addContact = async (
    customerId: string, 
    contact: { name: string; position?: string; email?: string; phone?: string; line_id?: string; is_primary?: boolean }
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('customer_contacts')
        .insert({
          customer_id: customerId,
          ...contact,
        });

      if (error) throw error;

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateTier = async (customerId: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    
    try {
      // Get customer's total spent
      const { data: customer } = await supabase
        .from('customers')
        .select('total_spent')
        .eq('id', customerId)
        .single();

      if (!customer) throw new Error('Customer not found');

      // Determine tier based on total spent
      let tier: CustomerTier = 'bronze';
      if (customer.total_spent >= 500000) tier = 'platinum';
      else if (customer.total_spent >= 200000) tier = 'gold';
      else if (customer.total_spent >= 50000) tier = 'silver';

      const { error } = await supabase
        .from('customers')
        .update({ tier })
        .eq('id', customerId);

      if (error) throw error;

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    createCustomer,
    updateCustomer,
    deleteCustomer,
    addInteraction,
    addContact,
    updateTier,
    loading,
  };
}

