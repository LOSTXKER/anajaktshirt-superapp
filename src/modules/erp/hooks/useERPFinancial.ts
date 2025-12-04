'use client';

import { useState, useEffect } from 'react';
import { supabaseFinancialRepository } from '../repositories/supabase/financialRepository';
import type {
  Quotation,
  Invoice,
  Receipt,
  FinancialSummary,
  FinancialDocumentStatus,
} from '../types/financial';
import type { Pagination } from '../types/common';

// ---------------------------------------------
// FINANCIAL STATUS CONFIGS
// ---------------------------------------------

export const QUOTATION_STATUS_CONFIG = {
  draft: { label: 'Draft', label_th: 'ฉบับร่าง', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  pending: { label: 'Pending', label_th: 'รออนุมัติ', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  sent: { label: 'Sent', label_th: 'ส่งแล้ว', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  accepted: { label: 'Accepted', label_th: 'ยอมรับแล้ว', color: 'text-green-600', bgColor: 'bg-green-100' },
  rejected: { label: 'Rejected', label_th: 'ปฏิเสธ', color: 'text-red-600', bgColor: 'bg-red-100' },
  expired: { label: 'Expired', label_th: 'หมดอายุ', color: 'text-gray-500', bgColor: 'bg-gray-100' },
};

export const INVOICE_STATUS_CONFIG = {
  draft: { label: 'Draft', label_th: 'ฉบับร่าง', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  pending: { label: 'Pending', label_th: 'รอชำระ', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  sent: { label: 'Sent', label_th: 'ส่งแล้ว', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  partial: { label: 'Partial', label_th: 'ชำระบางส่วน', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  paid: { label: 'Paid', label_th: 'ชำระแล้ว', color: 'text-green-600', bgColor: 'bg-green-100' },
  overdue: { label: 'Overdue', label_th: 'เกินกำหนด', color: 'text-red-600', bgColor: 'bg-red-100' },
  cancelled: { label: 'Cancelled', label_th: 'ยกเลิก', color: 'text-gray-500', bgColor: 'bg-gray-100' },
};

// ---------------------------------------------
// useERPFinancialSummary
// ---------------------------------------------

export function useERPFinancialSummary() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const data = await supabaseFinancialRepository.getFinancialSummary();
        setSummary(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  return { summary, loading, error };
}

// ---------------------------------------------
// useERPQuotations
// ---------------------------------------------

export function useERPQuotations(
  filters?: { status?: FinancialDocumentStatus; customer_id?: string; search?: string },
  pagination?: Pagination
) {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuotations = async () => {
      try {
        setLoading(true);
        const { data, totalCount: count } = await supabaseFinancialRepository.getQuotations(
          filters,
          pagination
        );
        setQuotations(data);
        setTotalCount(count);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuotations();
  }, [filters?.status, filters?.customer_id, filters?.search, pagination?.page, pagination?.pageSize]);

  const createQuotation = async (input: Omit<Quotation, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newQuotation = await supabaseFinancialRepository.createQuotation(input);
      setQuotations(prev => [newQuotation, ...prev]);
      return newQuotation;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateQuotation = async (id: string, updates: Partial<Quotation>) => {
    try {
      const updated = await supabaseFinancialRepository.updateQuotation(id, updates);
      setQuotations(prev => prev.map(q => q.id === id ? updated : q));
      return updated;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    quotations,
    totalCount,
    loading,
    error,
    createQuotation,
    updateQuotation,
  };
}

// ---------------------------------------------
// useERPInvoices
// ---------------------------------------------

export function useERPInvoices(
  filters?: { status?: FinancialDocumentStatus; customer_id?: string; order_id?: string; search?: string },
  pagination?: Pagination
) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const { data, totalCount: count } = await supabaseFinancialRepository.getInvoices(
          filters,
          pagination
        );
        setInvoices(data);
        setTotalCount(count);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [filters?.status, filters?.customer_id, filters?.order_id, filters?.search, pagination?.page, pagination?.pageSize]);

  const createInvoice = async (input: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newInvoice = await supabaseFinancialRepository.createInvoice(input);
      setInvoices(prev => [newInvoice, ...prev]);
      return newInvoice;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateInvoice = async (id: string, updates: Partial<Invoice>) => {
    try {
      const updated = await supabaseFinancialRepository.updateInvoice(id, updates);
      setInvoices(prev => prev.map(inv => inv.id === id ? updated : inv));
      return updated;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    invoices,
    totalCount,
    loading,
    error,
    createInvoice,
    updateInvoice,
  };
}

// ---------------------------------------------
// useERPReceipts
// ---------------------------------------------

export function useERPReceipts(
  filters?: { customer_id?: string; invoice_id?: string; order_id?: string; search?: string },
  pagination?: Pagination
) {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        setLoading(true);
        const { data, totalCount: count } = await supabaseFinancialRepository.getReceipts(
          filters,
          pagination
        );
        setReceipts(data);
        setTotalCount(count);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReceipts();
  }, [filters?.customer_id, filters?.invoice_id, filters?.order_id, filters?.search, pagination?.page, pagination?.pageSize]);

  const createReceipt = async (input: Omit<Receipt, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newReceipt = await supabaseFinancialRepository.createReceipt(input);
      setReceipts(prev => [newReceipt, ...prev]);

      // Also update the corresponding invoice
      // This would trigger a refetch in useERPInvoices
      return newReceipt;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    receipts,
    totalCount,
    loading,
    error,
    createReceipt,
  };
}
