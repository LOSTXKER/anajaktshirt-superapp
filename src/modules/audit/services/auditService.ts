'use client';

import { createClient } from '@/modules/shared/services/supabase-client';

interface LogParams {
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'view' | 'export' | 'import';
  entity_type: 'product' | 'transaction' | 'production_job' | 'customer' | 'user' | 'settings' | 'reservation' | 'stock_reservation' | 'order';
  entity_id?: string;
  old_data?: Record<string, any>;
  new_data?: Record<string, any>;
}

export async function logAudit(params: LogParams): Promise<void> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const logEntry = {
      user_id: user?.id || null,
      action: params.action,
      entity_type: params.entity_type,
      entity_id: params.entity_id || null,
      old_data: params.old_data || null,
      new_data: params.new_data || null,
      ip_address: null, // Would need server-side to get real IP
      user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
    };

    await supabase.from('audit_logs').insert(logEntry);
  } catch (error) {
    // Silently fail - don't break main operation for logging
    console.error('Audit log error:', error);
  }
}

// Helper to create diff between old and new data
export function createDiff(oldData: Record<string, any>, newData: Record<string, any>): Record<string, any> {
  const diff: Record<string, { old: any; new: any }> = {};
  
  const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
  
  for (const key of allKeys) {
    if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
      diff[key] = {
        old: oldData[key],
        new: newData[key],
      };
    }
  }
  
  return diff;
}

// Service object for easier use
interface AuditLogInput {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldData?: Record<string, any>;
  newData?: Record<string, any>;
}

export const auditService = {
  async log(params: AuditLogInput): Promise<void> {
    try {
      const supabase = createClient();
      
      const logEntry = {
        user_id: params.userId || null,
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId || null,
        old_data: params.oldData || null,
        new_data: params.newData || null,
        ip_address: null,
        user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
      };

      await supabase.from('audit_logs').insert(logEntry);
    } catch (error) {
      console.error('Audit log error:', error);
    }
  }
};

