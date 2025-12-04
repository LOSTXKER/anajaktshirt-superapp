// =============================================
// FINANCIAL TYPES
// =============================================
// Quotation, Invoice, Receipt, Payment Tracking
// =============================================

import type { BaseEntity, UserRef, BaseFilters } from './common';

// ---------------------------------------------
// Quotation
// ---------------------------------------------

export type QuotationStatus = 
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'converted';

export interface Quotation extends BaseEntity {
  quotation_number: string;
  order_id?: string;
  customer_id?: string;
  
  // Customer Info
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  
  // Status
  status: QuotationStatus;
  
  // Validity
  valid_from: string;
  valid_until: string;
  
  // Items
  items: QuotationItem[];
  
  // Pricing
  subtotal: number;
  discount_percent?: number;
  discount_amount: number;
  tax_percent?: number;
  tax_amount: number;
  shipping_cost: number;
  total_amount: number;
  
  // Terms
  payment_terms?: string;
  delivery_terms?: string;
  notes?: string;
  terms_conditions?: string;
  
  // Tracking
  sent_at?: string;
  viewed_at?: string;
  accepted_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
  
  // Conversion
  converted_to_order_id?: string;
  converted_at?: string;
  
  // Created by
  created_by?: string;
  creator?: UserRef;
}

export interface QuotationItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount?: number;
  total_price: number;
  notes?: string;
}

// ---------------------------------------------
// Invoice
// ---------------------------------------------

export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'partial'
  | 'paid'
  | 'overdue'
  | 'cancelled'
  | 'refunded';

export interface Invoice extends BaseEntity {
  invoice_number: string;
  order_id: string;
  order_number?: string;
  customer_id?: string;
  
  // Customer Info
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  billing_address?: string;
  tax_id?: string;
  
  // Status
  status: InvoiceStatus;
  
  // Dates
  invoice_date: string;
  due_date: string;
  
  // Items
  items: InvoiceItem[];
  
  // Pricing
  subtotal: number;
  discount_amount: number;
  tax_percent?: number;
  tax_amount: number;
  total_amount: number;
  
  // Payments
  paid_amount: number;
  remaining_amount: number;
  
  // Terms
  payment_terms?: string;
  notes?: string;
  
  // Tracking
  sent_at?: string;
  viewed_at?: string;
  paid_at?: string;
  
  // Tax Invoice
  is_tax_invoice: boolean;
  tax_invoice_number?: string;
  
  // Relations
  payments?: InvoicePayment[];
  order?: {
    order_number: string;
    customer_name: string;
  };
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount?: number;
  total_price: number;
}

export interface InvoicePayment {
  id: string;
  invoice_id: string;
  payment_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
}

// ---------------------------------------------
// Receipt
// ---------------------------------------------

export interface Receipt extends BaseEntity {
  receipt_number: string;
  invoice_id?: string;
  order_id: string;
  payment_id: string;
  
  // Customer Info
  customer_name: string;
  customer_address?: string;
  tax_id?: string;
  
  // Payment Info
  amount: number;
  payment_method: string;
  payment_date: string;
  
  // Reference
  reference_number?: string;
  
  // Tax Receipt
  is_tax_receipt: boolean;
  
  // Notes
  notes?: string;
  
  // Printed
  printed_at?: string;
  printed_by?: string;
}

// ---------------------------------------------
// Financial Summary
// ---------------------------------------------

export interface FinancialSummary {
  period: {
    from: string;
    to: string;
  };
  
  revenue: {
    total: number;
    paid: number;
    pending: number;
    overdue: number;
  };
  
  invoices: {
    total: number;
    draft: number;
    sent: number;
    paid: number;
    overdue: number;
  };
  
  quotations: {
    total: number;
    pending: number;
    accepted: number;
    conversion_rate: number;
  };
  
  payments: {
    total_received: number;
    by_method: {
      method: string;
      amount: number;
      count: number;
    }[];
  };
}

// ---------------------------------------------
// Input Types
// ---------------------------------------------

export interface CreateQuotationInput {
  customer_id?: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  
  items: Omit<QuotationItem, 'id'>[];
  
  valid_days?: number;
  discount_percent?: number;
  discount_amount?: number;
  tax_percent?: number;
  shipping_cost?: number;
  
  payment_terms?: string;
  delivery_terms?: string;
  notes?: string;
}

export interface CreateInvoiceInput {
  order_id: string;
  
  due_days?: number;
  
  items?: Omit<InvoiceItem, 'id'>[];
  
  discount_amount?: number;
  tax_percent?: number;
  
  payment_terms?: string;
  notes?: string;
  
  is_tax_invoice?: boolean;
}

// ---------------------------------------------
// Filter Types
// ---------------------------------------------

export interface QuotationFilters extends BaseFilters {
  status?: QuotationStatus | QuotationStatus[];
  customer_id?: string;
  valid_from?: string;
  valid_to?: string;
}

export interface InvoiceFilters extends BaseFilters {
  status?: InvoiceStatus | InvoiceStatus[];
  order_id?: string;
  customer_id?: string;
  due_from?: string;
  due_to?: string;
  is_overdue?: boolean;
  is_tax_invoice?: boolean;
}

