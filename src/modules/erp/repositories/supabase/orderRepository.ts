// @ts-nocheck - TODO: Fix type mismatches with Supabase schema
'use client';

import { getSupabaseClient } from '@/lib/supabase';
import type { Tables } from '@/lib/supabase';
import type {
  Order,
  OrderWorkItem,
  OrderProduct,
  OrderPayment,
  OrderDesign,
  DesignVersion,
  OrderMockup,
  CreateOrderInput,
  UpdateOrderInput,
  CreateWorkItemInput,
  CreatePaymentInput,
  OrderFilters,
  OrderStats,
  OrderSummary,
} from '../../types';
import type { IOrderRepository } from '../../services/repository';
import type { PaginationParams, PaginatedResult, ActionResult } from '../../types/common';

// =============================================
// HELPER FUNCTIONS
// =============================================

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

// =============================================
// SUPABASE ORDER REPOSITORY
// =============================================

export class SupabaseOrderRepository implements IOrderRepository {
  private get supabase() {
    return getSupabaseClient();
  }

  // ==================== ORDER CRUD ====================

  async findById(id: string): Promise<Order | null> {
    const { data, error } = await this.supabase
      .from('orders')
      .select(`*, customer:customers(*)`)
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return dbToOrder(data);
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    const { data, error } = await this.supabase
      .from('orders')
      .select(`*, customer:customers(*)`)
      .eq('order_number', orderNumber)
      .single();

    if (error || !data) return null;
    return dbToOrder(data);
  }

  async findByAccessToken(token: string): Promise<Order | null> {
    // Access token would be stored in a separate column or as metadata
    // For now, return null as this feature isn't implemented in DB yet
    console.warn('findByAccessToken not fully implemented - needs access_token column in DB');
    return null;
  }

  async findMany(
    filters?: OrderFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<Order>> {
    let query = this.supabase
      .from('orders')
      .select(`*, customer:customers(*)`, { count: 'exact' });

    // Apply filters
    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status);
      } else {
        query = query.eq('status', filters.status);
      }
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
      query = query.or(`order_number.ilike.%${filters.search}%`);
    }

    // Apply sorting
    query = query.order('created_at', { ascending: false });

    // Apply pagination
    const page = pagination?.page || 0;
    const pageSize = pagination?.pageSize || 20;
    const start = page * pageSize;
    const end = start + pageSize - 1;
    query = query.range(start, end);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching orders:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return {
        data: [],
        pagination: { page, pageSize, totalCount: 0, totalPages: 0 },
      };
    }

    const totalCount = count || 0;
    return {
      data: (data || []).map(dbToOrder),
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    };
  }

  async create(input: CreateOrderInput): Promise<ActionResult<Order>> {
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

  async update(id: string, input: UpdateOrderInput): Promise<ActionResult<Order>> {
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

  async delete(id: string): Promise<ActionResult> {
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

  // ==================== STATUS ====================

  async updateStatus(orderId: string, status: string, reason?: string): Promise<ActionResult> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    // Set completed_date if status is completed
    if (status === 'completed') {
      updateData.completed_date = new Date().toISOString();
    }

    const { error } = await this.supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (error) {
      console.error('Error updating order status:', error);
      return { success: false, message: error.message };
    }

    // TODO: Log status change with reason

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

  async addWorkItem(input: CreateWorkItemInput): Promise<ActionResult<OrderWorkItem>> {
    const { data, error } = await this.supabase
      .from('order_work_items')
      .insert({
        order_id: input.order_id,
        work_type_code: input.work_type_code,
        position_code: input.position_code,
        size_code: input.size_code,
        description: input.description,
        quantity: input.quantity || 1,
        unit_price: input.unit_price || 0,
        total_price: (input.quantity || 1) * (input.unit_price || 0),
        status: 'pending',
        production_mode: input.production_mode || 'in_house',
        supplier_id: input.supplier_id,
        sequence_order: input.sequence_order || 0,
        notes: input.notes,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating work item:', error);
      return { success: false, message: error.message };
    }

    return { success: true, data: dbToWorkItem(data) };
  }

  async updateWorkItem(id: string, input: Partial<OrderWorkItem>): Promise<ActionResult<OrderWorkItem>> {
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

  async deleteWorkItem(id: string): Promise<ActionResult> {
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

  // ==================== PRODUCTS ====================

  async getProducts(orderId: string): Promise<OrderProduct[]> {
    const { data, error } = await this.supabase
      .from('order_work_item_products')
      .select(`*, work_item:order_work_items!inner(order_id)`)
      .eq('work_item.order_id', orderId);

    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }

    return (data || []).map((p: any) => ({
      id: p.id,
      work_item_id: p.work_item_id,
      product_id: p.product_id,
      product_name: p.product_name,
      color: p.color,
      size: p.size,
      quantity: p.quantity,
      unit_price: p.unit_price,
      total_price: p.total_price,
      created_at: p.created_at,
    }));
  }

  async addProduct(input: Partial<OrderProduct>): Promise<ActionResult<OrderProduct>> {
    const { data, error } = await this.supabase
      .from('order_work_item_products')
      .insert({
        work_item_id: input.work_item_id,
        product_id: input.product_id,
        product_name: input.product_name,
        color: input.color,
        size: input.size,
        quantity: input.quantity || 1,
        unit_price: input.unit_price || 0,
        total_price: (input.quantity || 1) * (input.unit_price || 0),
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding product:', error);
      return { success: false, message: error.message };
    }

    return {
      success: true,
      data: {
        id: data.id,
        work_item_id: data.work_item_id,
        product_id: data.product_id,
        product_name: data.product_name,
        color: data.color,
        size: data.size,
        quantity: data.quantity,
        unit_price: data.unit_price,
        total_price: data.total_price,
        created_at: data.created_at,
      },
    };
  }

  // ==================== DESIGNS ====================

  async getDesigns(orderId: string): Promise<OrderDesign[]> {
    const { data, error } = await this.supabase
      .from('order_designs')
      .select(`*, versions:design_versions(*)`)
      .eq('order_id', orderId);

    if (error) {
      console.error('Error fetching designs:', error);
      return [];
    }

    return (data || []).map((d: any) => ({
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

  // ==================== MOCKUPS ====================

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

    return (data || []).map((m: any) => ({
      id: m.id,
      order_id: m.order_id,
      design_version_id: m.design_version_id,
      version_number: m.version_number,
      images: m.images,
      status: m.status,
      customer_feedback: m.customer_feedback,
      approved_at: m.approved_at,
      created_at: m.created_at,
      updated_at: m.updated_at,
    }));
  }

  async approveMockup(mockupId: string): Promise<ActionResult> {
    const { error } = await this.supabase
      .from('order_mockups')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', mockupId);

    if (error) {
      console.error('Error approving mockup:', error);
      return { success: false, message: error.message };
    }

    return { success: true };
  }

  async rejectMockup(mockupId: string, feedback: string): Promise<ActionResult> {
    const { error } = await this.supabase
      .from('order_mockups')
      .update({
        status: 'rejected',
        customer_feedback: feedback,
        updated_at: new Date().toISOString(),
      })
      .eq('id', mockupId);

    if (error) {
      console.error('Error rejecting mockup:', error);
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

  async addPayment(input: CreatePaymentInput): Promise<ActionResult<OrderPayment>> {
    const { data, error } = await this.supabase
      .from('order_payments')
      .insert({
        order_id: input.order_id,
        amount: input.amount,
        payment_method: input.payment_method,
        payment_date: input.payment_date || new Date().toISOString(),
        reference_number: input.reference_number,
        payment_slip_url: input.payment_slip_url,
        status: 'pending',
        notes: input.notes,
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

  async verifyPayment(paymentId: string, verifiedBy: string): Promise<ActionResult> {
    const { data, error } = await this.supabase
      .from('order_payments')
      .update({
        status: 'confirmed',
        verified_by: verifiedBy,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (error) {
      console.error('Error verifying payment:', error);
      return { success: false, message: error.message };
    }

    // Update order paid_amount
    if (data) {
      await this.updateOrderPaidAmount(data.order_id);
    }

    return { success: true };
  }

  async rejectPayment(paymentId: string, reason: string): Promise<ActionResult> {
    const { error } = await this.supabase
      .from('order_payments')
      .update({
        status: 'rejected',
        notes: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentId);

    if (error) {
      console.error('Error rejecting payment:', error);
      return { success: false, message: error.message };
    }

    return { success: true };
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
    if (totalPaid >= totalAmount && totalAmount > 0) {
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

  // ==================== STATISTICS ====================

  async getStats(filters?: OrderFilters): Promise<OrderStats> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

    // Get counts
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

    const { count: completed } = await this.supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    const { count: completed_today } = await this.supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('completed_date', todayStart)
      .lt('completed_date', todayEnd);

    const { count: overdue } = await this.supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .lt('due_date', now.toISOString())
      .not('status', 'in', '(completed,shipped,cancelled)');

    // Get revenue
    const { data: revenueData } = await this.supabase
      .from('orders')
      .select('pricing, paid_amount, payment_status');

    let total_revenue = 0;
    let paid_revenue = 0;
    let outstanding_revenue = 0;

    (revenueData || []).forEach((o: any) => {
      const orderTotal = o.pricing?.total_amount || 0;
      total_revenue += orderTotal;
      paid_revenue += o.paid_amount || 0;
      outstanding_revenue += orderTotal - (o.paid_amount || 0);
    });

    return {
      total: total || 0,
      pending: pending || 0,
      in_production: in_production || 0,
      ready_to_ship: ready_to_ship || 0,
      completed: completed || 0,
      completed_today: completed_today || 0,
      overdue: overdue || 0,
      total_revenue,
      paid_revenue,
      outstanding_revenue,
    };
  }

  async getSummaries(
    filters?: OrderFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<OrderSummary>> {
    let query = this.supabase
      .from('orders')
      .select(`
        id, order_number, status, payment_status, paid_amount, due_date, order_date,
        customer:customers(name),
        pricing
      `, { count: 'exact' });

    // Apply filters (same as findMany)
    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status);
      } else {
        query = query.eq('status', filters.status);
      }
    }
    if (filters?.customer_id) {
      query = query.eq('customer_id', filters.customer_id);
    }
    if (filters?.search) {
      query = query.or(`order_number.ilike.%${filters.search}%`);
    }

    // Apply sorting & pagination
    query = query.order('created_at', { ascending: false });

    const page = pagination?.page || 0;
    const pageSize = pagination?.pageSize || 20;
    const start = page * pageSize;
    const end = start + pageSize - 1;
    query = query.range(start, end);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching order summaries:', error);
      return {
        data: [],
        pagination: { page, pageSize, totalCount: 0, totalPages: 0 },
      };
    }

    const now = new Date();
    const summaries: OrderSummary[] = (data || []).map((o: any) => ({
      id: o.id,
      order_number: o.order_number,
      customer_name: o.customer?.name || '',
      status: o.status,
      payment_status: o.payment_status,
      total_amount: o.pricing?.total_amount || 0,
      paid_amount: o.paid_amount || 0,
      due_date: o.due_date,
      order_date: o.order_date,
      work_items_count: 0, // Would need a join to count
      is_overdue: o.due_date ? new Date(o.due_date) < now && !['completed', 'shipped', 'cancelled'].includes(o.status) : false,
    }));

    const totalCount = count || 0;
    return {
      data: summaries,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    };
  }
}

// Export singleton instance
export const supabaseOrderRepository = new SupabaseOrderRepository();
