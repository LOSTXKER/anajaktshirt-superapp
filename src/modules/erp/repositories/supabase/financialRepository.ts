'use client';

import { getSupabaseClient } from '@/lib/supabase';
import type { Tables } from '@/lib/supabase';
import type {
  Quotation,
  Invoice,
  Receipt,
  FinancialSummary,
  FinancialDocumentStatus,
} from '../../types/financial';
import type { Pagination } from '../../types/common';

// Helper functions
function dbToQuotation(row: Tables<'quotations'> & { customer?: Tables<'customers'> | null; order?: Tables<'orders'> | null }): Quotation {
  return {
    id: row.id,
    quotation_number: row.quotation_number,
    order_id: row.order_id,
    customer_id: row.customer_id,
    customer_name: row.customer?.name || '',
    status: row.status as FinancialDocumentStatus,
    issue_date: row.issue_date,
    due_date: row.due_date,
    total_amount: Number(row.total_amount),
    discount_amount: Number(row.discount_amount),
    net_amount: Number(row.net_amount),
    tax_amount: Number(row.tax_amount),
    grand_total: Number(row.grand_total),
    items: row.items as Quotation['items'],
    notes: row.notes,
    terms_and_conditions: row.terms_and_conditions,
    sent_at: row.sent_at,
    accepted_at: row.accepted_at,
    rejected_at: row.rejected_at,
    rejected_reason: row.rejected_reason,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function dbToInvoice(row: Tables<'invoices'> & { customer?: Tables<'customers'> | null; order?: Tables<'orders'> | null }): Invoice {
  return {
    id: row.id,
    invoice_number: row.invoice_number,
    order_id: row.order_id,
    customer_id: row.customer_id,
    customer_name: row.customer?.name || '',
    status: row.status as FinancialDocumentStatus,
    issue_date: row.issue_date,
    due_date: row.due_date,
    total_amount: Number(row.total_amount),
    paid_amount: Number(row.paid_amount),
    outstanding_amount: Number(row.outstanding_amount),
    items: row.items as Invoice['items'],
    notes: row.notes,
    payment_terms: row.payment_terms,
    sent_at: row.sent_at,
    paid_at: row.paid_at,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function dbToReceipt(row: Tables<'receipts'>): Receipt {
  return {
    id: row.id,
    receipt_number: row.receipt_number,
    invoice_id: row.invoice_id,
    order_id: row.order_id,
    customer_id: row.customer_id,
    customer_name: '',
    payment_date: row.payment_date,
    amount: Number(row.amount),
    payment_method: row.payment_method,
    reference_number: row.reference_number,
    notes: row.notes,
    received_by: row.received_by,
    payment_slip_url: row.payment_slip_url,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export class SupabaseFinancialRepository {
  private get supabase() {
    return getSupabaseClient();
  }

  // Helper to fetch customer data
  private async fetchCustomer(customerId: string | null): Promise<any> {
    if (!customerId) return null;

    const { data } = await this.supabase
      .from('customers')
      .select('id, name')
      .eq('id', customerId)
      .single();

    return data;
  }

  // Helper to batch fetch customers
  private async fetchCustomers(customerIds: string[]): Promise<Record<string, any>> {
    if (customerIds.length === 0) return {};

    const { data } = await this.supabase
      .from('customers')
      .select('id, name')
      .in('id', customerIds);

    return data ? Object.fromEntries(data.map(c => [c.id, c])) : {};
  }

  // ==================== FINANCIAL SUMMARY ====================

  async getSummary(): Promise<FinancialSummary> {
    const { data: invoices } = await this.supabase
      .from('invoices')
      .select('total_amount, paid_amount, outstanding_amount, status');

    const { data: quotations } = await this.supabase
      .from('quotations')
      .select('status');

    const { data: receipts } = await this.supabase
      .from('receipts')
      .select('amount');

    const total_revenue = (invoices || []).reduce((sum, inv) => sum + Number(inv.total_amount), 0);
    const total_paid = (receipts || []).reduce((sum, rec) => sum + Number(rec.amount), 0);
    const total_outstanding = (invoices || []).reduce((sum, inv) => sum + Number(inv.outstanding_amount), 0);
    const total_overdue = (invoices || [])
      .filter((inv) => inv.status === 'overdue')
      .reduce((sum, inv) => sum + Number(inv.outstanding_amount), 0);

    const quotations_count = (quotations || []).length;
    const quotations_pending = (quotations || []).filter((q) => q.status === 'pending').length;
    const invoices_count = (invoices || []).length;
    const invoices_pending = (invoices || []).filter((inv) => inv.status === 'pending' || inv.status === 'partial').length;
    const invoices_overdue = (invoices || []).filter((inv) => inv.status === 'overdue').length;

    const revenue_growth_percent = 12.5; // Mock
    const acceptedQuotations = (quotations || []).filter(q => q.status === 'accepted').length;
    const conversion_rate_percent = quotations_count > 0 ? (acceptedQuotations / quotations_count) * 100 : 0;

    return {
      total_revenue,
      total_paid,
      total_outstanding,
      total_overdue,
      quotations_count,
      quotations_pending,
      invoices_count,
      invoices_pending,
      invoices_overdue,
      revenue_growth_percent,
      conversion_rate_percent: parseFloat(conversion_rate_percent.toFixed(1)),
      outstanding_amount: total_outstanding, // Alias for dashboard compatibility
    };
  }

  // Alias for backward compatibility
  async getFinancialSummary(): Promise<FinancialSummary> {
    return this.getSummary();
  }

  // ==================== QUOTATIONS ====================

  async getQuotations(
    filters?: { status?: FinancialDocumentStatus; customer_id?: string; search?: string },
    pagination?: Pagination
  ): Promise<{ data: Quotation[]; totalCount: number }> {
    let query = this.supabase
      .from('quotations')
      .select('*', { count: 'exact' });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.customer_id) {
      query = query.eq('customer_id', filters.customer_id);
    }
    if (filters?.search) {
      query = query.or(`quotation_number.ilike.%${filters.search}%`);
    }

    query = query.order('created_at', { ascending: false });

    if (pagination) {
      const start = pagination.page * pagination.pageSize;
      const end = start + pagination.pageSize - 1;
      query = query.range(start, end);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching quotations:', error);
      return { data: [], totalCount: 0 };
    }

    // Fetch customers separately
    const customerIds = [...new Set((data || []).map(q => q.customer_id).filter(Boolean))];
    const customersMap = await this.fetchCustomers(customerIds);

    // Enrich quotations with customer data
    const enrichedQuotations = (data || []).map(q => ({
      ...q,
      customer: q.customer_id ? customersMap[q.customer_id] : null,
    }));

    return {
      data: enrichedQuotations.map(dbToQuotation),
      totalCount: count || 0,
    };
  }

  async getQuotationById(id: string): Promise<Quotation | null> {
    const { data, error } = await this.supabase
      .from('quotations')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    // Fetch customer separately
    const customer = await this.fetchCustomer(data.customer_id);
    return dbToQuotation({ ...data, customer });
  }

  async createQuotation(quotation: Omit<Quotation, 'id' | 'created_at' | 'updated_at'>): Promise<Quotation> {
    const { data, error } = await this.supabase
      .from('quotations')
      .insert(quotation)
      .select('*')
      .single();

    if (error) throw new Error(error.message);

    // Fetch customer separately
    const customer = await this.fetchCustomer(data.customer_id);
    return dbToQuotation({ ...data, customer });
  }

  async updateQuotation(id: string, updates: Partial<Quotation>): Promise<Quotation> {
    const { data, error } = await this.supabase
      .from('quotations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(error.message);

    // Fetch customer separately
    const customer = await this.fetchCustomer(data.customer_id);
    return dbToQuotation({ ...data, customer });
  }

  // ==================== INVOICES ====================

  async getInvoices(
    filters?: { status?: FinancialDocumentStatus; customer_id?: string; order_id?: string; search?: string },
    pagination?: Pagination
  ): Promise<{ data: Invoice[]; totalCount: number }> {
    let query = this.supabase
      .from('invoices')
      .select('*', { count: 'exact' });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.customer_id) {
      query = query.eq('customer_id', filters.customer_id);
    }
    if (filters?.order_id) {
      query = query.eq('order_id', filters.order_id);
    }
    if (filters?.search) {
      query = query.or(`invoice_number.ilike.%${filters.search}%`);
    }

    query = query.order('created_at', { ascending: false });

    if (pagination) {
      const start = pagination.page * pagination.pageSize;
      const end = start + pagination.pageSize - 1;
      query = query.range(start, end);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching invoices:', error);
      return { data: [], totalCount: 0 };
    }

    // Fetch customers separately
    const customerIds = [...new Set((data || []).map(inv => inv.customer_id).filter(Boolean))];
    const customersMap = await this.fetchCustomers(customerIds);

    // Enrich invoices with customer data
    const enrichedInvoices = (data || []).map(inv => ({
      ...inv,
      customer: inv.customer_id ? customersMap[inv.customer_id] : null,
    }));

    return {
      data: enrichedInvoices.map(dbToInvoice),
      totalCount: count || 0,
    };
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    const { data, error } = await this.supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    // Fetch customer separately
    const customer = await this.fetchCustomer(data.customer_id);
    return dbToInvoice({ ...data, customer });
  }

  async createInvoice(invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>): Promise<Invoice> {
    const { data, error } = await this.supabase
      .from('invoices')
      .insert(invoice)
      .select('*')
      .single();

    if (error) throw new Error(error.message);

    // Fetch customer separately
    const customer = await this.fetchCustomer(data.customer_id);
    return dbToInvoice({ ...data, customer });
  }

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    const { data, error } = await this.supabase
      .from('invoices')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(error.message);

    // Fetch customer separately
    const customer = await this.fetchCustomer(data.customer_id);
    return dbToInvoice({ ...data, customer });
  }

  // ==================== RECEIPTS ====================

  async getReceipts(
    filters?: { customer_id?: string; invoice_id?: string; order_id?: string; search?: string },
    pagination?: Pagination
  ): Promise<{ data: Receipt[]; totalCount: number }> {
    let query = this.supabase
      .from('receipts')
      .select('*', { count: 'exact' });

    if (filters?.customer_id) {
      query = query.eq('customer_id', filters.customer_id);
    }
    if (filters?.invoice_id) {
      query = query.eq('invoice_id', filters.invoice_id);
    }
    if (filters?.order_id) {
      query = query.eq('order_id', filters.order_id);
    }
    if (filters?.search) {
      query = query.or(`receipt_number.ilike.%${filters.search}%,reference_number.ilike.%${filters.search}%`);
    }

    query = query.order('payment_date', { ascending: false });

    if (pagination) {
      const start = pagination.page * pagination.pageSize;
      const end = start + pagination.pageSize - 1;
      query = query.range(start, end);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching receipts:', error);
      return { data: [], totalCount: 0 };
    }

    return {
      data: (data || []).map(dbToReceipt),
      totalCount: count || 0,
    };
  }

  async getReceiptById(id: string): Promise<Receipt | null> {
    const { data, error } = await this.supabase
      .from('receipts')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return dbToReceipt(data);
  }

  async createReceipt(receipt: Omit<Receipt, 'id' | 'created_at' | 'updated_at'>): Promise<Receipt> {
    const { data, error } = await this.supabase
      .from('receipts')
      .insert(receipt)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return dbToReceipt(data);
  }
}

// Export singleton instance
export const supabaseFinancialRepository = new SupabaseFinancialRepository();

