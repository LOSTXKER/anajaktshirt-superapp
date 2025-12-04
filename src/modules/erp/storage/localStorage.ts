// =============================================
// LOCAL STORAGE REPOSITORY
// =============================================
// เก็บข้อมูล ERP ใน Browser localStorage
// ข้อมูลจะไม่หายเมื่อ refresh แต่หายเมื่อ clear cache
// =============================================

import type { Order, OrderWorkItem, OrderPayment } from '../types/orders';
import type { ProductionJob, ProductionStation } from '../types/production';
import type { Supplier, PurchaseOrder } from '../types/suppliers';
import type { ChangeRequest } from '../types/change-requests';
import type { QCRecord } from '../types/qc';
import type { Quotation, Invoice, Receipt } from '../types/financial';

// Storage Keys
const STORAGE_KEYS = {
  ORDERS: 'erp_orders',
  WORK_ITEMS: 'erp_work_items',
  PAYMENTS: 'erp_payments',
  PRODUCTION_JOBS: 'erp_production_jobs',
  PRODUCTION_STATIONS: 'erp_production_stations',
  SUPPLIERS: 'erp_suppliers',
  PURCHASE_ORDERS: 'erp_purchase_orders',
  CHANGE_REQUESTS: 'erp_change_requests',
  QC_RECORDS: 'erp_qc_records',
  QUOTATIONS: 'erp_quotations',
  INVOICES: 'erp_invoices',
  RECEIPTS: 'erp_receipts',
  INITIALIZED: 'erp_initialized',
};

// Generic localStorage helpers
function getItem<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function setItem<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// =============================================
// ORDER STORAGE
// =============================================

export const orderStorage = {
  getAll: (): Order[] => getItem<Order>(STORAGE_KEYS.ORDERS),
  
  getById: (id: string): Order | undefined => {
    const orders = getItem<Order>(STORAGE_KEYS.ORDERS);
    return orders.find(o => o.id === id);
  },
  
  getByToken: (token: string): Order | undefined => {
    const orders = getItem<Order>(STORAGE_KEYS.ORDERS);
    return orders.find(o => o.access_token === token);
  },
  
  create: (order: Partial<Order>): Order => {
    const orders = getItem<Order>(STORAGE_KEYS.ORDERS);
    const orderCount = orders.length + 1;
    const newOrder: Order = {
      id: generateId('order'),
      order_number: `ORD-${new Date().getFullYear()}-${String(orderCount).padStart(4, '0')}`,
      access_token: generateId('token'),
      status: 'draft',
      payment_status: 'unpaid',
      paid_amount: 0,
      order_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...order,
    } as Order;
    
    orders.push(newOrder);
    setItem(STORAGE_KEYS.ORDERS, orders);
    return newOrder;
  },
  
  update: (id: string, updates: Partial<Order>): Order | undefined => {
    const orders = getItem<Order>(STORAGE_KEYS.ORDERS);
    const index = orders.findIndex(o => o.id === id);
    if (index === -1) return undefined;
    
    orders[index] = {
      ...orders[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    setItem(STORAGE_KEYS.ORDERS, orders);
    return orders[index];
  },
  
  delete: (id: string): boolean => {
    const orders = getItem<Order>(STORAGE_KEYS.ORDERS);
    const filtered = orders.filter(o => o.id !== id);
    if (filtered.length === orders.length) return false;
    setItem(STORAGE_KEYS.ORDERS, filtered);
    return true;
  },
};

// =============================================
// WORK ITEMS STORAGE
// =============================================

export const workItemStorage = {
  getAll: (): OrderWorkItem[] => getItem<OrderWorkItem>(STORAGE_KEYS.WORK_ITEMS),
  
  getByOrderId: (orderId: string): OrderWorkItem[] => {
    const items = getItem<OrderWorkItem>(STORAGE_KEYS.WORK_ITEMS);
    return items.filter(w => w.order_id === orderId);
  },
  
  create: (item: Partial<OrderWorkItem>): OrderWorkItem => {
    const items = getItem<OrderWorkItem>(STORAGE_KEYS.WORK_ITEMS);
    const newItem: OrderWorkItem = {
      id: generateId('wi'),
      status: 'pending',
      quantity: 0,
      unit_price: 0,
      total_price: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...item,
    } as OrderWorkItem;
    
    items.push(newItem);
    setItem(STORAGE_KEYS.WORK_ITEMS, items);
    return newItem;
  },
  
  update: (id: string, updates: Partial<OrderWorkItem>): OrderWorkItem | undefined => {
    const items = getItem<OrderWorkItem>(STORAGE_KEYS.WORK_ITEMS);
    const index = items.findIndex(i => i.id === id);
    if (index === -1) return undefined;
    
    items[index] = { ...items[index], ...updates, updated_at: new Date().toISOString() };
    setItem(STORAGE_KEYS.WORK_ITEMS, items);
    return items[index];
  },
  
  delete: (id: string): boolean => {
    const items = getItem<OrderWorkItem>(STORAGE_KEYS.WORK_ITEMS);
    const filtered = items.filter(i => i.id !== id);
    if (filtered.length === items.length) return false;
    setItem(STORAGE_KEYS.WORK_ITEMS, filtered);
    return true;
  },
};

// =============================================
// PRODUCTION JOB STORAGE
// =============================================

export const productionJobStorage = {
  getAll: (): ProductionJob[] => getItem<ProductionJob>(STORAGE_KEYS.PRODUCTION_JOBS),
  
  getById: (id: string): ProductionJob | undefined => {
    const jobs = getItem<ProductionJob>(STORAGE_KEYS.PRODUCTION_JOBS);
    return jobs.find(j => j.id === id);
  },
  
  getByOrderId: (orderId: string): ProductionJob[] => {
    const jobs = getItem<ProductionJob>(STORAGE_KEYS.PRODUCTION_JOBS);
    return jobs.filter(j => j.order_id === orderId);
  },
  
  create: (job: Partial<ProductionJob>): ProductionJob => {
    const jobs = getItem<ProductionJob>(STORAGE_KEYS.PRODUCTION_JOBS);
    const jobCount = jobs.length + 1;
    const newJob: ProductionJob = {
      id: generateId('job'),
      job_number: `JOB-${new Date().getFullYear()}-${String(jobCount).padStart(4, '0')}`,
      status: 'pending',
      priority: 0,
      quantity: 0,
      completed_qty: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...job,
    } as ProductionJob;
    
    jobs.push(newJob);
    setItem(STORAGE_KEYS.PRODUCTION_JOBS, jobs);
    return newJob;
  },
  
  update: (id: string, updates: Partial<ProductionJob>): ProductionJob | undefined => {
    const jobs = getItem<ProductionJob>(STORAGE_KEYS.PRODUCTION_JOBS);
    const index = jobs.findIndex(j => j.id === id);
    if (index === -1) return undefined;
    
    jobs[index] = { ...jobs[index], ...updates, updated_at: new Date().toISOString() };
    setItem(STORAGE_KEYS.PRODUCTION_JOBS, jobs);
    return jobs[index];
  },
  
  updateStatus: (id: string, status: string): ProductionJob | undefined => {
    return productionJobStorage.update(id, { status } as Partial<ProductionJob>);
  },
};

// =============================================
// CHANGE REQUEST STORAGE
// =============================================

export const changeRequestStorage = {
  getAll: (): ChangeRequest[] => getItem<ChangeRequest>(STORAGE_KEYS.CHANGE_REQUESTS),
  
  getByOrderId: (orderId: string): ChangeRequest[] => {
    const requests = getItem<ChangeRequest>(STORAGE_KEYS.CHANGE_REQUESTS);
    return requests.filter(r => r.order_id === orderId);
  },
  
  create: (request: Partial<ChangeRequest>): ChangeRequest => {
    const requests = getItem<ChangeRequest>(STORAGE_KEYS.CHANGE_REQUESTS);
    const count = requests.length + 1;
    const newRequest: ChangeRequest = {
      id: generateId('cr'),
      request_number: `CR-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`,
      status: 'pending_quote',
      payment_status: 'unpaid',
      payment_required: false,
      days_delayed: 0,
      fees: {
        base_fee: 0,
        design_fee: 0,
        rework_fee: 0,
        material_fee: 0,
        waste_fee: 0,
        rush_fee: 0,
        other_fee: 0,
        discount: 0,
        total_fee: 0,
      },
      impact: {
        production_already_started: false,
        produced_qty: 0,
        waste_qty: 0,
        materials_ordered: false,
        materials_received: false,
        material_waste_cost: 0,
        designs_approved: false,
        design_rework_required: false,
        affects_due_date: false,
        delay_days: 0,
        affects_other_orders: false,
        impact_level: 'none',
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...request,
    } as ChangeRequest;
    
    requests.push(newRequest);
    setItem(STORAGE_KEYS.CHANGE_REQUESTS, requests);
    return newRequest;
  },
  
  update: (id: string, updates: Partial<ChangeRequest>): ChangeRequest | undefined => {
    const requests = getItem<ChangeRequest>(STORAGE_KEYS.CHANGE_REQUESTS);
    const index = requests.findIndex(r => r.id === id);
    if (index === -1) return undefined;
    
    requests[index] = { ...requests[index], ...updates, updated_at: new Date().toISOString() };
    setItem(STORAGE_KEYS.CHANGE_REQUESTS, requests);
    return requests[index];
  },
};

// =============================================
// QC RECORD STORAGE
// =============================================

export const qcRecordStorage = {
  getAll: (): QCRecord[] => getItem<QCRecord>(STORAGE_KEYS.QC_RECORDS),
  
  getByOrderId: (orderId: string): QCRecord[] => {
    const records = getItem<QCRecord>(STORAGE_KEYS.QC_RECORDS);
    return records.filter(r => r.order_id === orderId);
  },
  
  getByJobId: (jobId: string): QCRecord[] => {
    const records = getItem<QCRecord>(STORAGE_KEYS.QC_RECORDS);
    return records.filter(r => r.job_id === jobId);
  },
  
  create: (record: Partial<QCRecord>): QCRecord => {
    const records = getItem<QCRecord>(STORAGE_KEYS.QC_RECORDS);
    const newRecord: QCRecord = {
      id: generateId('qc'),
      overall_result: 'pending',
      pass_rate: 0,
      total_qty: 0,
      checked_qty: 0,
      passed_qty: 0,
      failed_qty: 0,
      rework_qty: 0,
      follow_up_required: false,
      checklist_results: [],
      checked_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...record,
    } as QCRecord;
    
    records.push(newRecord);
    setItem(STORAGE_KEYS.QC_RECORDS, records);
    return newRecord;
  },
};

// =============================================
// INVOICE STORAGE
// =============================================

export const invoiceStorage = {
  getAll: (): Invoice[] => getItem<Invoice>(STORAGE_KEYS.INVOICES),
  
  getByOrderId: (orderId: string): Invoice[] => {
    const invoices = getItem<Invoice>(STORAGE_KEYS.INVOICES);
    return invoices.filter(i => i.order_id === orderId);
  },
  
  create: (invoice: Partial<Invoice>): Invoice => {
    const invoices = getItem<Invoice>(STORAGE_KEYS.INVOICES);
    const count = invoices.length + 1;
    const newInvoice: Invoice = {
      id: generateId('inv'),
      invoice_number: `INV-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`,
      status: 'draft',
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: [],
      subtotal: 0,
      discount_amount: 0,
      tax_amount: 0,
      total_amount: 0,
      paid_amount: 0,
      remaining_amount: 0,
      is_tax_invoice: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...invoice,
    } as Invoice;
    
    invoices.push(newInvoice);
    setItem(STORAGE_KEYS.INVOICES, invoices);
    return newInvoice;
  },
};

// =============================================
// INITIALIZE WITH MOCK DATA
// =============================================

import {
  mockOrders,
  mockProductionJobs,
  mockProductionStations,
  mockSuppliers,
  mockPurchaseOrders,
  mockChangeRequests,
  mockQCRecords,
  mockQuotations,
  mockInvoices,
  mockReceipts,
} from '../mocks/data';

export function initializeLocalStorage(forceReset = false): void {
  if (typeof window === 'undefined') return;
  
  const isInitialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
  
  if (isInitialized && !forceReset) {
    console.log('📦 localStorage already initialized');
    return;
  }
  
  console.log('🚀 Initializing localStorage with mock data...');
  
  // Clear existing data if force reset
  if (forceReset) {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  }
  
  // Initialize with mock data
  setItem(STORAGE_KEYS.ORDERS, mockOrders);
  setItem(STORAGE_KEYS.PRODUCTION_JOBS, mockProductionJobs);
  setItem(STORAGE_KEYS.PRODUCTION_STATIONS, mockProductionStations);
  setItem(STORAGE_KEYS.SUPPLIERS, mockSuppliers);
  setItem(STORAGE_KEYS.PURCHASE_ORDERS, mockPurchaseOrders);
  setItem(STORAGE_KEYS.CHANGE_REQUESTS, mockChangeRequests);
  setItem(STORAGE_KEYS.QC_RECORDS, mockQCRecords);
  setItem(STORAGE_KEYS.QUOTATIONS, mockQuotations);
  setItem(STORAGE_KEYS.INVOICES, mockInvoices);
  setItem(STORAGE_KEYS.RECEIPTS, mockReceipts);
  
  localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  
  console.log('✅ localStorage initialized successfully!');
  console.log(`   - Orders: ${mockOrders.length}`);
  console.log(`   - Production Jobs: ${mockProductionJobs.length}`);
  console.log(`   - Suppliers: ${mockSuppliers.length}`);
  console.log(`   - Change Requests: ${mockChangeRequests.length}`);
  console.log(`   - QC Records: ${mockQCRecords.length}`);
}

// Clear all ERP data
export function clearLocalStorage(): void {
  if (typeof window === 'undefined') return;
  Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  console.log('🗑️ localStorage cleared');
}

// Get storage stats
export function getStorageStats(): Record<string, number> {
  return {
    orders: getItem<Order>(STORAGE_KEYS.ORDERS).length,
    workItems: getItem<OrderWorkItem>(STORAGE_KEYS.WORK_ITEMS).length,
    productionJobs: getItem<ProductionJob>(STORAGE_KEYS.PRODUCTION_JOBS).length,
    changeRequests: getItem<ChangeRequest>(STORAGE_KEYS.CHANGE_REQUESTS).length,
    qcRecords: getItem<QCRecord>(STORAGE_KEYS.QC_RECORDS).length,
    invoices: getItem<Invoice>(STORAGE_KEYS.INVOICES).length,
  };
}

