'use client';

import { getSupabaseClient } from '@/lib/supabase';
import type { Tables } from '@/lib/supabase';
import type {
  Supplier,
  PurchaseOrder,
  SupplierStats,
  SupplierFilters,
  CreateSupplierInput,
  UpdateSupplierInput,
  CreatePurchaseOrderInput,
  ReceiveGoodsInput,
} from '../../types';
import type { ISupplierRepository } from '../../services/repository';
import type { PaginationParams, PaginatedResult, ActionResult } from '../../types/common';

// =============================================
// HELPER FUNCTIONS
// =============================================

function dbToSupplier(row: Tables<'suppliers'>): Supplier {
  return {
    id: row.id,
    name: row.name,
    contact_name: row.contact_name,
    phone: row.phone,
    email: row.email,
    address: row.address,
    service_types: row.service_types || [],
    rating: row.rating,
    is_active: row.is_active,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
  } as Supplier;
}

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
  } as PurchaseOrder;
}

// =============================================
// SUPABASE SUPPLIER REPOSITORY
// =============================================

export class SupabaseSupplierRepository implements ISupplierRepository {
  private get supabase() {
    return getSupabaseClient();
  }

  // ==================== SUPPLIER CRUD ====================

  async findById(id: string): Promise<Supplier | null> {
    const { data, error } = await this.supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return dbToSupplier(data);
  }

  async findByCode(code: string): Promise<Supplier | null> {
    // Assuming there's a code field, or use name as fallback
    const { data, error } = await this.supabase
      .from('suppliers')
      .select('*')
      .eq('name', code) // Use name as code for now
      .single();

    if (error || !data) return null;
    return dbToSupplier(data);
  }

  async getByServiceType(serviceType: string): Promise<Supplier[]> {
    const { data, error } = await this.supabase
      .from('suppliers')
      .select('*')
      .contains('service_types', [serviceType])
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching suppliers by service type:', error);
      return [];
    }

    return (data || []).map(dbToSupplier);
  }

  async findMany(
    filters?: SupplierFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<Supplier>> {
    let query = this.supabase
      .from('suppliers')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters?.status) {
      query = query.eq('is_active', filters.status === 'active');
    }
    if (filters?.service_types && filters.service_types.length > 0) {
      query = query.overlaps('service_types', filters.service_types);
    }
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,contact_name.ilike.%${filters.search}%`);
    }

    // Apply sorting
    query = query.order('name');

    // Apply pagination
    const page = pagination?.page || 0;
    const pageSize = pagination?.pageSize || 20;
    const start = page * pageSize;
    const end = start + pageSize - 1;
    query = query.range(start, end);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching suppliers:', error);
      return {
        data: [],
        pagination: { page, pageSize, totalCount: 0, totalPages: 0 },
      };
    }

    const totalCount = count || 0;
    return {
      data: (data || []).map(dbToSupplier),
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    };
  }

  async create(input: CreateSupplierInput): Promise<ActionResult<Supplier>> {
    const { data, error } = await this.supabase
      .from('suppliers')
      .insert({
        name: input.name,
        contact_name: input.contact_name,
        phone: input.contact_phone,
        email: input.contact_email,
        address: input.address,
        service_types: input.service_types || [],
        is_active: true,
        rating: 0,
        notes: input.notes,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating supplier:', error);
      return { success: false, message: error.message };
    }

    return { success: true, data: dbToSupplier(data) };
  }

  async update(id: string, input: UpdateSupplierInput): Promise<ActionResult<Supplier>> {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (input.name !== undefined) updateData.name = input.name;
    if (input.contact_name !== undefined) updateData.contact_name = input.contact_name;
    if (input.contact_phone !== undefined) updateData.phone = input.contact_phone;
    if (input.contact_email !== undefined) updateData.email = input.contact_email;
    if (input.address !== undefined) updateData.address = input.address;
    if (input.service_types !== undefined) updateData.service_types = input.service_types;
    if (input.notes !== undefined) updateData.notes = input.notes;
    if (input.status !== undefined) updateData.is_active = input.status === 'active';

    const { data, error } = await this.supabase
      .from('suppliers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating supplier:', error);
      return { success: false, message: error.message };
    }

    return { success: true, data: dbToSupplier(data) };
  }

  async delete(id: string): Promise<ActionResult> {
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

  async getPurchaseOrders(supplierId: string): Promise<PurchaseOrder[]> {
    const { data, error } = await this.supabase
      .from('purchase_orders')
      .select(`
        *,
        supplier:suppliers(*),
        items:purchase_order_items(*)
      `)
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching purchase orders:', error);
      return [];
    }

    return (data || []).map(dbToPurchaseOrder);
  }

  async createPurchaseOrder(input: CreatePurchaseOrderInput): Promise<ActionResult<PurchaseOrder>> {
    const poNumber = `PO-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    // Calculate total
    const totalAmount = input.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
      + (input.setup_fees || 0)
      + (input.shipping_cost || 0)
      - (input.discount || 0);

    const { data, error } = await this.supabase
      .from('purchase_orders')
      .insert({
        po_number: poNumber,
        supplier_id: input.supplier_id,
        order_id: input.order_id,
        status: 'draft',
        total_amount: totalAmount,
        expected_date: input.expected_date,
        notes: input.internal_notes,
      })
      .select(`*, supplier:suppliers(*)`)
      .single();

    if (error) {
      console.error('Error creating purchase order:', error);
      return { success: false, message: error.message };
    }

    // Create items
    if (input.items && input.items.length > 0) {
      const itemsToInsert = input.items.map(item => ({
        purchase_order_id: data.id,
        description: item.item_description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price,
        received_qty: 0,
        work_item_id: item.order_work_item_id,
      }));

      await this.supabase.from('purchase_order_items').insert(itemsToInsert);
    }

    return { success: true, data: dbToPurchaseOrder({ ...data, items: [] }) };
  }

  async updatePurchaseOrder(poId: string, input: Partial<PurchaseOrder>): Promise<ActionResult<PurchaseOrder>> {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (input.status !== undefined) updateData.status = input.status;
    if (input.total_amount !== undefined) updateData.total_amount = input.total_amount;
    if (input.notes !== undefined) updateData.notes = input.notes;
    if (input.expected_date !== undefined) updateData.expected_date = input.expected_date;
    if (input.received_date !== undefined) updateData.received_date = input.received_date;

    const { data, error } = await this.supabase
      .from('purchase_orders')
      .update(updateData)
      .eq('id', poId)
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

  async sendPurchaseOrder(poId: string): Promise<ActionResult> {
    const { error } = await this.supabase
      .from('purchase_orders')
      .update({
        status: 'sent',
        updated_at: new Date().toISOString(),
      })
      .eq('id', poId);

    if (error) {
      console.error('Error sending purchase order:', error);
      return { success: false, message: error.message };
    }

    return { success: true };
  }

  async confirmPurchaseOrder(poId: string): Promise<ActionResult> {
    const { error } = await this.supabase
      .from('purchase_orders')
      .update({
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', poId);

    if (error) {
      console.error('Error confirming purchase order:', error);
      return { success: false, message: error.message };
    }

    return { success: true };
  }

  async receiveGoods(input: ReceiveGoodsInput): Promise<ActionResult> {
    // Update PO items with received quantities
    for (const item of input.items) {
      const { error } = await this.supabase
        .from('purchase_order_items')
        .update({
          received_qty: item.received_qty,
        })
        .eq('id', item.po_item_id);

      if (error) {
        console.error('Error updating received qty:', error);
        return { success: false, message: error.message };
      }
    }

    // Check if all items are fully received
    const { data: items } = await this.supabase
      .from('purchase_order_items')
      .select('quantity, received_qty')
      .eq('purchase_order_id', input.po_id);

    const allReceived = (items || []).every(i => i.received_qty >= i.quantity);
    const someReceived = (items || []).some(i => i.received_qty > 0);

    // Update PO status
    let newStatus = 'confirmed';
    if (allReceived) {
      newStatus = 'received';
    } else if (someReceived) {
      newStatus = 'partial';
    }

    const { error } = await this.supabase
      .from('purchase_orders')
      .update({
        status: newStatus,
        received_date: allReceived ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.po_id);

    if (error) {
      console.error('Error updating PO status:', error);
      return { success: false, message: error.message };
    }

    return { success: true };
  }

  // ==================== STATISTICS ====================

  async getStats(): Promise<SupplierStats> {
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

    // Calculate total outstanding
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
