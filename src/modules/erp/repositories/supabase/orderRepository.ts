'use client';

import { getSupabaseClient } from '@/lib/supabase';
import type { Tables, InsertTables, UpdateTables } from '@/lib/supabase';
import type {
  Order,
  OrderWorkItem,
  OrderPayment,
  OrderDesign,
  DesignVersion,
  OrderMockup,
  CreateOrderInput,
  UpdateOrderInput,
  OrderFilters,
} from '../../types';
import type { Pagination } from '../../types/common';

// Helper to convert DB row to Order type
function dbToOrder(row: Tables<'orders'> & {
  customer?: Tables<'customers'> | null;
  work_items?: Tables<'order_work_items'>[];
  payments?: Tables<'order_payments'>[];
}): Order {
  return {
    id: row.id,
    order_number: row.order_number,
    customer_id: row.customer_id,
    customer_name: row.customer?.name || '',
    order_type_code: row.order_type_code,
    status: row.status as Order['status'],
    priority: row.priority,
    order_date: row.order_date,
    due_date: row.due_date,
    completed_date: row.completed_date,
    sales_channel: row.sales_channel,
    payment_status: row.payment_status as Order['payment_status'],
    paid_amount: row.paid_amount,
    total_quantity: row.total_quantity,
    pricing: row.pricing as Order['pricing'],
    shipping_address: row.shipping_address as Order['shipping_address'],
    notes: row.notes,
    internal_notes: row.internal_notes,
    design_free_revisions: row.design_free_revisions,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    customer: row.customer ? {
      id: row.customer.id,
      name: row.customer.name,
      phone: row.customer.phone,
      email: row.customer.email,
      tier: row.customer.tier,
    } : undefined,
  };
}

// Helper to convert DB row to WorkItem type
function dbToWorkItem(row: Tables<'order_work_items'>): OrderWorkItem {
  return {
    id: row.id,
    order_id: row.order_id,
    work_type_code: row.work_type_code,
    position_code: row.position_code,
    size_code: row.size_code,
    description: row.description,
    quantity: row.quantity,
    unit_price: row.unit_price,
    total_price: row.total_price,
    status: row.status as OrderWorkItem['status'],
    production_mode: row.production_mode as OrderWorkItem['production_mode'],
    supplier_id: row.supplier_id,
    sequence_order: row.sequence_order,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// Helper to convert DB row to Payment type
function dbToPayment(row: Tables<'order_payments'>): OrderPayment {
  return {
    id: row.id,
    order_id: row.order_id,
    amount: row.amount,
    payment_method: row.payment_method,
    payment_date: row.payment_date,
    reference_number: row.reference_number,
    payment_slip_url: row.payment_slip_url,
    status: row.status as OrderPayment['status'],
    verified_by: row.verified_by,
    verified_at: row.verified_at,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export class SupabaseOrderRepository {
  private get supabase() {
    return getSupabaseClient();
  }

  // ==================== ORDERS ====================

  async findById(id: string): Promise<Order | null> {
    const { data, error } = await this.supabase
      .from('orders')
      .select(`
        *,
        customer:customers(*)
      `)
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return dbToOrder(data);
  }

  async findMany(
    filters?: OrderFilters,
    pagination?: Pagination
  ): Promise<{ data: Order[]; totalCount: number }> {
    let query = this.supabase
      .from('orders')
      .select(`
        *,
        customer:customers(*)
      `, { count: 'exact' });

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.customer_id) {
      query = query.eq('customer_id', filters.customer_id);
    }
    if (filters?.payment_status) {
      query = query.eq('payment_status', filters.payment_status);
    }
    if (filters?.priority !== undefined) {
      query = query.eq('priority', filters.priority);
    }
    if (filters?.order_type_code) {
      query = query.eq('order_type_code', filters.order_type_code);
    }
    if (filters?.date_from) {
      query = query.gte('order_date', filters.date_from);
    }
    if (filters?.date_to) {
      query = query.lte('order_date', filters.date_to);
    }
    if (filters?.search) {
      query = query.or(`order_number.ilike.%${filters.search}%,customer.name.ilike.%${filters.search}%`);
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
      console.error('Error fetching orders:', error);
      return { data: [], totalCount: 0 };
    }

    return {
      data: (data || []).map(dbToOrder),
      totalCount: count || 0,
    };
  }

  async create(input: CreateOrderInput): Promise<{ success: boolean; data?: Order; message?: string }> {
    // Generate order number
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    const { data, error } = await this.supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_id: input.customer_id,
        order_type_code: input.order_type_code,
        status: 'draft',
        priority: input.priority || 0,
        order_date: new Date().toISOString(),
        due_date: input.due_date,
        sales_channel: input.sales_channel,
        payment_status: 'unpaid',
        paid_amount: 0,
        total_quantity: input.total_quantity || 0,
        pricing: input.pricing || null,
        shipping_address: input.shipping_address || null,
        notes: input.notes,
        internal_notes: input.internal_notes,
        design_free_revisions: input.design_free_revisions || 2,
        created_by: input.created_by,
      })
      .select(`*, customer:customers(*)`)
      .single();

    if (error) {
      console.error('Error creating order:', error);
      return { success: false, message: error.message };
    }

    return { success: true, data: dbToOrder(data) };
  }

  async update(id: string, input: UpdateOrderInput): Promise<{ success: boolean; data?: Order; message?: string }> {
    const { data, error } = await this.supabase
      .from('orders')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`*, customer:customers(*)`)
      .single();

    if (error) {
      console.error('Error updating order:', error);
      return { success: false, message: error.message };
    }

    return { success: true, data: dbToOrder(data) };
  }

  async delete(id: string): Promise<{ success: boolean; message?: string }> {
    const { error } = await this.supabase
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting order:', error);
      return { success: false, message: error.message };
    }

    return { success: true };
  }

  // ==================== WORK ITEMS ====================

  async getWorkItems(orderId: string): Promise<OrderWorkItem[]> {
    const { data, error } = await this.supabase
      .from('order_work_items')
      .select('*')
      .eq('order_id', orderId)
      .order('sequence_order', { ascending: true });

    if (error) {
      console.error('Error fetching work items:', error);
      return [];
    }

    return (data || []).map(dbToWorkItem);
  }

  async createWorkItem(input: Omit<OrderWorkItem, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; data?: OrderWorkItem; message?: string }> {
    const { data, error } = await this.supabase
      .from('order_work_items')
      .insert(input)
      .select()
      .single();

    if (error) {
      console.error('Error creating work item:', error);
      return { success: false, message: error.message };
    }

    return { success: true, data: dbToWorkItem(data) };
  }

  async updateWorkItem(id: string, input: Partial<OrderWorkItem>): Promise<{ success: boolean; data?: OrderWorkItem; message?: string }> {
    const { data, error } = await this.supabase
      .from('order_work_items')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating work item:', error);
      return { success: false, message: error.message };
    }

    return { success: true, data: dbToWorkItem(data) };
  }

  async deleteWorkItem(id: string): Promise<{ success: boolean; message?: string }> {
    const { error } = await this.supabase
      .from('order_work_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting work item:', error);
      return { success: false, message: error.message };
    }

    return { success: true };
  }

  // ==================== PAYMENTS ====================

  async getPayments(orderId: string): Promise<OrderPayment[]> {
    const { data, error } = await this.supabase
      .from('order_payments')
      .select('*')
      .eq('order_id', orderId)
      .order('payment_date', { ascending: false });

    if (error) {
      console.error('Error fetching payments:', error);
      return [];
    }

    return (data || []).map(dbToPayment);
  }

  async createPayment(input: Omit<OrderPayment, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; data?: OrderPayment; message?: string }> {
    const { data, error } = await this.supabase
      .from('order_payments')
      .insert({
        ...input,
        status: input.status || 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating payment:', error);
      return { success: false, message: error.message };
    }

    // Update order paid_amount
    await this.updateOrderPaidAmount(input.order_id);

    return { success: true, data: dbToPayment(data) };
  }

  async updatePayment(id: string, input: Partial<OrderPayment>): Promise<{ success: boolean; data?: OrderPayment; message?: string }> {
    const { data, error } = await this.supabase
      .from('order_payments')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating payment:', error);
      return { success: false, message: error.message };
    }

    // Update order paid_amount
    if (data) {
      await this.updateOrderPaidAmount(data.order_id);
    }

    return { success: true, data: dbToPayment(data) };
  }

  private async updateOrderPaidAmount(orderId: string): Promise<void> {
    // Get total paid amount for this order
    const { data: payments } = await this.supabase
      .from('order_payments')
      .select('amount')
      .eq('order_id', orderId)
      .eq('status', 'confirmed');

    const totalPaid = (payments || []).reduce((sum, p) => sum + p.amount, 0);

    // Get order total
    const { data: order } = await this.supabase
      .from('orders')
      .select('pricing')
      .eq('id', orderId)
      .single();

    const totalAmount = (order?.pricing as any)?.total_amount || 0;

    // Determine payment status
    let paymentStatus: string = 'unpaid';
    if (totalPaid >= totalAmount) {
      paymentStatus = 'paid';
    } else if (totalPaid > 0) {
      paymentStatus = 'partial';
    }

    // Update order
    await this.supabase
      .from('orders')
      .update({
        paid_amount: totalPaid,
        payment_status: paymentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);
  }

  // ==================== DESIGNS & MOCKUPS ====================

  async getDesigns(orderId: string): Promise<OrderDesign[]> {
    const { data, error } = await this.supabase
      .from('order_designs')
      .select(`
        *,
        versions:design_versions(*)
      `)
      .eq('order_id', orderId);

    if (error) {
      console.error('Error fetching designs:', error);
      return [];
    }

    return (data || []).map(d => ({
      id: d.id,
      order_id: d.order_id,
      work_item_id: d.work_item_id,
      design_name: d.design_name,
      current_version_id: d.current_version_id,
      status: d.status,
      versions: d.versions?.map((v: any) => ({
        id: v.id,
        design_id: v.design_id,
        version_number: v.version_number,
        file_url: v.file_url,
        file_name: v.file_name,
        thumbnail_url: v.thumbnail_url,
        status: v.status,
        is_paid_revision: v.is_paid_revision,
        revision_fee: v.revision_fee,
        feedback: v.feedback,
        approved_at: v.approved_at,
        approved_by: v.approved_by,
        created_by: v.created_by,
        created_at: v.created_at,
      })) || [],
      created_at: d.created_at,
      updated_at: d.updated_at,
    }));
  }

  async getMockups(orderId: string): Promise<OrderMockup[]> {
    const { data, error } = await this.supabase
      .from('order_mockups')
      .select('*')
      .eq('order_id', orderId)
      .order('version_number', { ascending: false });

    if (error) {
      console.error('Error fetching mockups:', error);
      return [];
    }

    return (data || []).map(m => ({
      id: m.id,
      order_id: m.order_id,
      design_version_id: m.design_version_id,
      version_number: m.version_number,
      images: m.images as any,
      status: m.status as any,
      customer_feedback: m.customer_feedback,
      approved_at: m.approved_at,
      created_at: m.created_at,
      updated_at: m.updated_at,
    }));
  }

  // ==================== STATISTICS ====================

  async getOrderStats(): Promise<{
    total: number;
    pending: number;
    in_production: number;
    ready_to_ship: number;
    overdue: number;
    total_revenue: number;
  }> {
    const now = new Date().toISOString();

    // Get counts by status
    const { count: total } = await this.supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    const { count: pending } = await this.supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .in('status', ['draft', 'quoted', 'awaiting_payment', 'designing', 'awaiting_mockup_approval']);

    const { count: in_production } = await this.supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .in('status', ['in_production', 'qc_pending']);

    const { count: ready_to_ship } = await this.supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ready_to_ship');

    const { count: overdue } = await this.supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .lt('due_date', now)
      .not('status', 'in', '(completed,shipped,cancelled)');

    // Get total revenue
    const { data: revenueData } = await this.supabase
      .from('orders')
      .select('paid_amount')
      .eq('payment_status', 'paid');

    const total_revenue = (revenueData || []).reduce((sum, o) => sum + (o.paid_amount || 0), 0);

    return {
      total: total || 0,
      pending: pending || 0,
      in_production: in_production || 0,
      ready_to_ship: ready_to_ship || 0,
      overdue: overdue || 0,
      total_revenue,
    };
  }
}

// Export singleton instance
export const supabaseOrderRepository = new SupabaseOrderRepository();

