'use client';

import { getSupabaseClient } from '@/lib/supabase';
import type { Tables } from '@/lib/supabase';
import type {
  Supplier,
  PurchaseOrder,
  PurchaseOrderItem,
} from '../../types';
import type { Pagination } from '../../types/common';

// Helper to convert DB row to Supplier type
function dbToSupplier(row: Tables<'suppliers'>): Supplier {
  return {
    id: row.id,
    name: row.name,
    contact_name: row.contact_name,
    phone: row.phone,
    email: row.email,
    address: row.address,
    service_types: row.service_types,
    rating: row.rating,
    is_active: row.is_active,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// Helper to convert DB row to PurchaseOrder type
function dbToPurchaseOrder(row: Tables<'purchase_orders'> & {
  supplier?: Tables<'suppliers'> | null;
  items?: Tables<'purchase_order_items'>[];
}): PurchaseOrder {
  return {
    id: row.id,
    po_number: row.po_number,
    supplier_id: row.supplier_id,
    order_id: row.order_id,
    status: row.status as PurchaseOrder['status'],
    total_amount: row.total_amount,
    notes: row.notes,
    expected_date: row.expected_date,
    received_date: row.received_date,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    supplier: row.supplier ? dbToSupplier(row.supplier) : undefined,
    items: row.items?.map(i => ({
      id: i.id,
      purchase_order_id: i.purchase_order_id,
      description: i.description,
      quantity: i.quantity,
      unit_price: i.unit_price,
      total_price: i.total_price,
      received_qty: i.received_qty,
      work_item_id: i.work_item_id,
      created_at: i.created_at,
    })) || [],
  };
}

export class SupabaseSupplierRepository {
  private get supabase() {
    return getSupabaseClient();
  }

  // ==================== SUPPLIERS ====================

  async findSupplierById(id: string): Promise<Supplier | null> {
    const { data, error } = await this.supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return dbToSupplier(data);
  }

  async findSuppliers(
    filters?: {
      search?: string;
      service_type?: string;
      is_active?: boolean;
    },
    pagination?: Pagination
  ): Promise<{ data: Supplier[]; totalCount: number }> {
    let query = this.supabase
      .from('suppliers')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }
    if (filters?.service_type) {
      query = query.contains('service_types', [filters.service_type]);
    }
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,contact_name.ilike.%${filters.search}%`);
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
      console.error('Error fetching suppliers:', error);
      return { data: [], totalCount: 0 };
    }

    return {
      data: (data || []).map(dbToSupplier),
      totalCount: count || 0,
    };
  }

  async createSupplier(input: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; data?: Supplier; message?: string }> {
    const { data, error } = await this.supabase
      .from('suppliers')
      .insert(input)
      .select()
      .single();

    if (error) {
      console.error('Error creating supplier:', error);
      return { success: false, message: error.message };
    }

    return { success: true, data: dbToSupplier(data) };
  }

  async updateSupplier(id: string, input: Partial<Supplier>): Promise<{ success: boolean; data?: Supplier; message?: string }> {
    const { data, error } = await this.supabase
      .from('suppliers')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating supplier:', error);
      return { success: false, message: error.message };
    }

    return { success: true, data: dbToSupplier(data) };
  }

  async deleteSupplier(id: string): Promise<{ success: boolean; message?: string }> {
    const { error } = await this.supabase
      .from('suppliers')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error deleting supplier:', error);
      return { success: false, message: error.message };
    }

    return { success: true };
  }

  // ==================== PURCHASE ORDERS ====================

  async findPurchaseOrderById(id: string): Promise<PurchaseOrder | null> {
    const { data, error } = await this.supabase
      .from('purchase_orders')
      .select(`
        *,
        supplier:suppliers(*),
        items:purchase_order_items(*)
      `)
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return dbToPurchaseOrder(data);
  }

  async findPurchaseOrders(
    filters?: {
      supplier_id?: string;
      order_id?: string;
      status?: string | string[];
      search?: string;
    },
    pagination?: Pagination
  ): Promise<{ data: PurchaseOrder[]; totalCount: number }> {
    let query = this.supabase
      .from('purchase_orders')
      .select(`
        *,
        supplier:suppliers(*),
        items:purchase_order_items(*)
      `, { count: 'exact' });

    // Apply filters
    if (filters?.supplier_id) {
      query = query.eq('supplier_id', filters.supplier_id);
    }
    if (filters?.order_id) {
      query = query.eq('order_id', filters.order_id);
    }
    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status);
      } else {
        query = query.eq('status', filters.status);
      }
    }
    if (filters?.search) {
      query = query.or(`po_number.ilike.%${filters.search}%`);
    }

    // Apply sorting
    query = query.order('created_at', { ascending: false });

    // Apply pagination
    if (pagination) {
      const start = pagination.page * pagination.pageSize;
      const end = start + pagination.pageSize - 1;
      query = query.range(start, end);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching purchase orders:', error);
      return { data: [], totalCount: 0 };
    }

    return {
      data: (data || []).map(dbToPurchaseOrder),
      totalCount: count || 0,
    };
  }

  async createPurchaseOrder(input: Omit<PurchaseOrder, 'id' | 'po_number' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; data?: PurchaseOrder; message?: string }> {
    // Generate PO number
    const poNumber = `PO-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    const { data, error } = await this.supabase
      .from('purchase_orders')
      .insert({
        po_number: poNumber,
        supplier_id: input.supplier_id,
        order_id: input.order_id,
        status: input.status || 'draft',
        total_amount: input.total_amount || 0,
        notes: input.notes,
        expected_date: input.expected_date,
        created_by: input.created_by,
      })
      .select(`
        *,
        supplier:suppliers(*)
      `)
      .single();

    if (error) {
      console.error('Error creating purchase order:', error);
      return { success: false, message: error.message };
    }

    // Create items if provided
    if (input.items && input.items.length > 0) {
      const itemsToInsert = input.items.map(item => ({
        purchase_order_id: data.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        received_qty: 0,
        work_item_id: item.work_item_id,
      }));

      await this.supabase
        .from('purchase_order_items')
        .insert(itemsToInsert);
    }

    return { success: true, data: dbToPurchaseOrder({ ...data, items: input.items || [] }) };
  }

  async updatePurchaseOrder(id: string, input: Partial<PurchaseOrder>): Promise<{ success: boolean; data?: PurchaseOrder; message?: string }> {
    const { data, error } = await this.supabase
      .from('purchase_orders')
      .update({
        status: input.status,
        total_amount: input.total_amount,
        notes: input.notes,
        expected_date: input.expected_date,
        received_date: input.received_date,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        supplier:suppliers(*),
        items:purchase_order_items(*)
      `)
      .single();

    if (error) {
      console.error('Error updating purchase order:', error);
      return { success: false, message: error.message };
    }

    return { success: true, data: dbToPurchaseOrder(data) };
  }

  // ==================== STATISTICS ====================

  async getStats(): Promise<import('../../types/suppliers').SupplierStats> {
    const { count: total_suppliers } = await this.supabase
      .from('suppliers')
      .select('*', { count: 'exact', head: true });

    const { count: active_suppliers } = await this.supabase
      .from('suppliers')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    const { count: pending_pos } = await this.supabase
      .from('purchase_orders')
      .select('*', { count: 'exact', head: true })
      .in('status', ['draft', 'sent', 'confirmed']);

    const now = new Date().toISOString();
    const { count: overdue_deliveries } = await this.supabase
      .from('purchase_orders')
      .select('*', { count: 'exact', head: true })
      .lt('expected_date', now)
      .not('status', 'in', '(received,cancelled)');

    // Calculate total outstanding (amount for non-cancelled, non-draft POs - maybe?)
    // Or maybe just total amount of pending POs.
    // Let's assume total_outstanding matches pending_amount in dashboard which usually means unpaid or pending POs value.
    const { data: poData } = await this.supabase
      .from('purchase_orders')
      .select('total_amount')
      .in('status', ['sent', 'confirmed', 'partial']);

    const total_outstanding = (poData || []).reduce((sum, po) => sum + (po.total_amount || 0), 0);

    return {
      total_suppliers: total_suppliers || 0,
      active_suppliers: active_suppliers || 0,
      pending_pos: pending_pos || 0,
      overdue_deliveries: overdue_deliveries || 0,
      total_outstanding,
    };
  }
}

// Export singleton instance
export const supabaseSupplierRepository = new SupabaseSupplierRepository();

