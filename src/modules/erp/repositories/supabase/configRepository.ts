'use client';

import { getSupabaseClient } from '@/lib/supabase';
import type { Tables } from '@/lib/supabase';
import type { Customer, Product, WorkType, OrderType } from '../../types';
import type { Pagination } from '../../types/common';

// Helper to convert DB row to Customer type
function dbToCustomer(row: Tables<'customers'>): Customer {
  return {
    id: row.id,
    name: row.name,
    company_name: row.company_name,
    phone: row.phone,
    email: row.email,
    line_id: row.line_id,
    tier: row.tier,
    total_orders: row.total_orders,
    total_spent: row.total_spent,
    notes: row.notes,
    address: row.address as Customer['address'],
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// Helper to convert DB row to Product type
function dbToProduct(row: Tables<'products'>): Product {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    model: row.model,
    category: row.category,
    color: row.color,
    size: row.size,
    base_price: row.base_price,
    stock_qty: row.stock_qty,
    is_active: row.is_active,
    image_url: row.image_url,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// Helper to convert DB row to WorkType type
function dbToWorkType(row: Tables<'work_types'>): WorkType {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    name_th: row.name, // Use name as name_th since DB only has name in Thai
    category: row.category as WorkType['category'],
    category_code: row.category as WorkType['category'], // Alias for UI compatibility
    base_price: row.base_price || 0,
    requires_design: row.requires_design || false,
    requires_material: false,
    default_production_mode: row.default_production_mode as WorkType['default_production_mode'],
    estimated_days: row.estimated_days || 1,
    estimated_minutes_per_unit: (row.estimated_days || 1) * 60, // Convert days to minutes approx
    can_outsource: row.default_production_mode === 'outsource',
    in_house_capable: row.default_production_mode === 'in_house',
    is_active: row.is_active ?? true,
    sort_order: 0,
    created_at: row.created_at,
  };
}

// Helper to convert DB row to OrderType type
function dbToOrderType(row: Tables<'order_types'>): OrderType {
  // Map features_included/excluded to features array for UI
  const features: { label: string; available: boolean }[] = [];
  
  if (row.features_included) {
    (row.features_included as string[]).forEach(f => {
      features.push({ label: f, available: true });
    });
  }
  if (row.features_excluded) {
    (row.features_excluded as string[]).forEach(f => {
      features.push({ label: f, available: false });
    });
  }

  return {
    id: row.id,
    code: row.code,
    name: row.name,
    name_th: row.name, // Use name as name_th (DB stores Thai names)
    description: row.description || undefined,
    description_full: row.description || undefined,
    icon: row.code === 'ready_made' ? 'shirt' 
      : row.code === 'custom_sewing' ? 'scissors'
      : row.code === 'full_custom' ? 'palette'
      : row.code === 'print_only' ? 'printer' 
      : 'package',
    requires_products: row.code === 'ready_made' || row.code === 'print_only',
    requires_design: true,
    requires_fabric: row.code === 'custom_sewing' || row.code === 'full_custom',
    requires_pattern: row.code === 'full_custom',
    default_production_mode: 'hybrid' as const,
    lead_days_min: row.lead_time_min || 3,
    lead_days_max: row.lead_time_max || 7,
    lead_time_min: row.lead_time_min,
    lead_time_max: row.lead_time_max,
    features_included: row.features_included,
    features_excluded: row.features_excluded,
    features,
    workflow_steps: row.workflow_steps as string[] || [],
    sort_order: row.lead_time_min || 0,
    is_active: row.is_active,
    created_at: row.created_at,
  };
}

export class SupabaseConfigRepository {
  private get supabase() {
    return getSupabaseClient();
  }

  // ==================== CUSTOMERS ====================

  async findCustomerById(id: string): Promise<Customer | null> {
    const { data, error } = await this.supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return dbToCustomer(data);
  }

  async findCustomers(
    filters?: { search?: string; tier?: string },
    pagination?: Pagination
  ): Promise<{ data: Customer[]; totalCount: number }> {
    let query = this.supabase
      .from('customers')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters?.tier) {
      query = query.eq('tier', filters.tier);
    }
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    // Apply sorting
    query = query.order('name');

    // Apply pagination
    if (pagination) {
      const start = pagination.page * pagination.pageSize;
      const end = start + pagination.pageSize - 1;
      query = query.range(start, end);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching customers:', error);
      return { data: [], totalCount: 0 };
    }

    return {
      data: (data || []).map(dbToCustomer),
      totalCount: count || 0,
    };
  }

  async createCustomer(input: Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'total_orders' | 'total_spent'>): Promise<{ success: boolean; data?: Customer; message?: string }> {
    const { data, error } = await this.supabase
      .from('customers')
      .insert({
        ...input,
        total_orders: 0,
        total_spent: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating customer:', error);
      return { success: false, message: error.message };
    }

    return { success: true, data: dbToCustomer(data) };
  }

  async updateCustomer(id: string, input: Partial<Customer>): Promise<{ success: boolean; data?: Customer; message?: string }> {
    const { data, error } = await this.supabase
      .from('customers')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating customer:', error);
      return { success: false, message: error.message };
    }

    return { success: true, data: dbToCustomer(data) };
  }

  // ==================== PRODUCTS ====================

  async findProductById(id: string): Promise<Product | null> {
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return dbToProduct(data);
  }

  async findProducts(
    filters?: { search?: string; category?: string; model?: string; color?: string; size?: string; inStock?: boolean },
    pagination?: Pagination
  ): Promise<{ data: Product[]; totalCount: number }> {
    let query = this.supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    // Apply filters
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.model) {
      query = query.eq('model', filters.model);
    }
    if (filters?.color) {
      query = query.eq('color', filters.color);
    }
    if (filters?.size) {
      query = query.eq('size', filters.size);
    }
    if (filters?.inStock) {
      query = query.gt('stock_qty', 0);
    }
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`);
    }

    // Apply sorting
    query = query.order('name');

    // Apply pagination
    if (pagination) {
      const start = pagination.page * pagination.pageSize;
      const end = start + pagination.pageSize - 1;
      query = query.range(start, end);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      return { data: [], totalCount: 0 };
    }

    return {
      data: (data || []).map(dbToProduct),
      totalCount: count || 0,
    };
  }

  async getProductFilterOptions(): Promise<{ models: string[]; categories: string[]; colors: string[]; sizes: string[] }> {
    const { data } = await this.supabase
      .from('products')
      .select('model, category, color, size')
      .eq('is_active', true);

    if (!data) return { models: [], categories: [], colors: [], sizes: [] };

    const models = [...new Set(data.map(p => p.model).filter(Boolean))] as string[];
    const categories = [...new Set(data.map(p => p.category).filter(Boolean))] as string[];
    const colors = [...new Set(data.map(p => p.color).filter(Boolean))] as string[];
    const sizes = [...new Set(data.map(p => p.size).filter(Boolean))] as string[];

    return { models, categories, colors, sizes };
  }

  // ==================== WORK TYPES ====================

  async getWorkTypes(): Promise<WorkType[]> {
    const { data, error } = await this.supabase
      .from('work_types')
      .select('*')
      .eq('is_active', true)
      .order('category')
      .order('name');

    if (error) {
      console.error('Error fetching work types:', error);
      return [];
    }

    return (data || []).map(dbToWorkType);
  }

  async findWorkTypes(
    filters?: { search?: string; category?: string },
    pagination?: Pagination
  ): Promise<{ data: WorkType[]; totalCount: number }> {
    let query = this.supabase
      .from('work_types')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,code.ilike.%${filters.search}%`);
    }

    query = query.order('category').order('name');

    if (pagination) {
      const start = pagination.page * pagination.pageSize;
      const end = start + pagination.pageSize - 1;
      query = query.range(start, end);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching work types:', error);
      return { data: [], totalCount: 0 };
    }

    return {
      data: (data || []).map(dbToWorkType),
      totalCount: count || 0,
    };
  }

  async getWorkTypeByCode(code: string): Promise<WorkType | null> {
    const { data, error } = await this.supabase
      .from('work_types')
      .select('*')
      .eq('code', code)
      .single();

    if (error || !data) return null;
    return dbToWorkType(data);
  }

  // ==================== ORDER TYPES ====================

  async getOrderTypes(): Promise<OrderType[]> {
    const { data, error } = await this.supabase
      .from('order_types')
      .select('*')
      .eq('is_active', true)
      .order('lead_time_min');

    if (error) {
      console.error('Error fetching order types:', error);
      return [];
    }

    return (data || []).map(dbToOrderType);
  }

  async findOrderTypes(
    filters?: { search?: string },
    pagination?: Pagination
  ): Promise<{ data: OrderType[]; totalCount: number }> {
    let query = this.supabase
      .from('order_types')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,code.ilike.%${filters.search}%`);
    }

    query = query.order('lead_time_min');

    if (pagination) {
      const start = pagination.page * pagination.pageSize;
      const end = start + pagination.pageSize - 1;
      query = query.range(start, end);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching order types:', error);
      return { data: [], totalCount: 0 };
    }

    return {
      data: (data || []).map(dbToOrderType),
      totalCount: count || 0,
    };
  }

  async getOrderTypeByCode(code: string): Promise<OrderType | null> {
    const { data, error } = await this.supabase
      .from('order_types')
      .select('*')
      .eq('code', code)
      .single();

    if (error || !data) return null;
    return dbToOrderType(data);
  }

  // ==================== PRIORITY LEVELS ====================

  async getPriorityLevels(): Promise<any[]> {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('priority_levels')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    
    if (error || !data || data.length === 0) {
      // Fallback to default values
      return [
        { code: 'normal', name: 'Normal', name_th: 'ปกติ', surcharge_percent: 0, lead_time_modifier: 1.0 },
        { code: 'rush', name: 'Rush', name_th: 'เร่ง', surcharge_percent: 20, lead_time_modifier: 0.8 },
        { code: 'urgent', name: 'Urgent', name_th: 'ด่วน', surcharge_percent: 50, lead_time_modifier: 0.6 },
        { code: 'emergency', name: 'Emergency', name_th: 'ด่วนพิเศษ', surcharge_percent: 100, lead_time_modifier: 0.5 },
      ];
    }
    
    return data;
  }
}

// Export singleton instance
export const supabaseConfigRepository = new SupabaseConfigRepository();

