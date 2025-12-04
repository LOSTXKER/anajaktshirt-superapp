'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  mockQuotations,
  mockInvoices,
  mockReceipts,
  getFinancialSummary,
} from '../mocks/data';
import type {
  Quotation,
  Invoice,
  Receipt,
  FinancialSummary,
  QuotationFilters,
  InvoiceFilters,
} from '../types/financial';

// ---------------------------------------------
// useERPQuotations
// ---------------------------------------------

export function useERPQuotations(filters: QuotationFilters = {}) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const quotations = useMemo(() => {
    let result = [...mockQuotations];

    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      result = result.filter(q => statuses.includes(q.status));
    }

    if (filters.customer_id) {
      result = result.filter(q => q.customer_id === filters.customer_id);
    }

    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return result;
  }, [filters]);

  return {
    quotations,
    loading,
    total: quotations.length,
  };
}

// ---------------------------------------------
// useERPInvoices
// ---------------------------------------------

export function useERPInvoices(filters: InvoiceFilters = {}) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const invoices = useMemo(() => {
    let result = [...mockInvoices];

    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      result = result.filter(inv => statuses.includes(inv.status));
    }

    if (filters.order_id) {
      result = result.filter(inv => inv.order_id === filters.order_id);
    }

    if (filters.customer_id) {
      result = result.filter(inv => inv.customer_id === filters.customer_id);
    }

    if (filters.is_overdue) {
      result = result.filter(inv => inv.status === 'overdue');
    }

    if (filters.is_tax_invoice !== undefined) {
      result = result.filter(inv => inv.is_tax_invoice === filters.is_tax_invoice);
    }

    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return result;
  }, [filters]);

  return {
    invoices,
    loading,
    total: invoices.length,
  };
}

// ---------------------------------------------
// useERPReceipts
// ---------------------------------------------

export function useERPReceipts(orderId?: string) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const receipts = useMemo(() => {
    let result = [...mockReceipts];

    if (orderId) {
      result = result.filter(r => r.order_id === orderId);
    }

    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return result;
  }, [orderId]);

  return {
    receipts,
    loading,
    total: receipts.length,
  };
}

// ---------------------------------------------
// useERPFinancialSummary
// ---------------------------------------------

export function useERPFinancialSummary() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSummary(getFinancialSummary());
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  return {
    summary,
    loading,
  };
}

// ---------------------------------------------
// Status Configs
// ---------------------------------------------

export const QUOTATION_STATUS_CONFIG = {
  draft: { label: 'Draft', label_th: 'แบบร่าง', color: 'bg-gray-100 text-gray-700' },
  sent: { label: 'Sent', label_th: 'ส่งแล้ว', color: 'bg-blue-100 text-blue-700' },
  viewed: { label: 'Viewed', label_th: 'ดูแล้ว', color: 'bg-cyan-100 text-cyan-700' },
  accepted: { label: 'Accepted', label_th: 'ยอมรับ', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', label_th: 'ปฏิเสธ', color: 'bg-red-100 text-red-700' },
  expired: { label: 'Expired', label_th: 'หมดอายุ', color: 'bg-gray-100 text-gray-500' },
  converted: { label: 'Converted', label_th: 'แปลงเป็นออเดอร์', color: 'bg-purple-100 text-purple-700' },
} as const;

export const INVOICE_STATUS_CONFIG = {
  draft: { label: 'Draft', label_th: 'แบบร่าง', color: 'bg-gray-100 text-gray-700' },
  sent: { label: 'Sent', label_th: 'ส่งแล้ว', color: 'bg-blue-100 text-blue-700' },
  partial: { label: 'Partial', label_th: 'จ่ายบางส่วน', color: 'bg-yellow-100 text-yellow-700' },
  paid: { label: 'Paid', label_th: 'จ่ายแล้ว', color: 'bg-green-100 text-green-700' },
  overdue: { label: 'Overdue', label_th: 'เกินกำหนด', color: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Cancelled', label_th: 'ยกเลิก', color: 'bg-gray-100 text-gray-500' },
  refunded: { label: 'Refunded', label_th: 'คืนเงินแล้ว', color: 'bg-orange-100 text-orange-700' },
} as const;

