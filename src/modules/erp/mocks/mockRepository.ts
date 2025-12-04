// =============================================
// MOCK REPOSITORY IMPLEMENTATION
// =============================================
// Uses localStorage for persistent data storage
// Data persists across page refreshes
// =============================================

import type {
  IRepositoryFactory,
  IOrderRepository,
  IProductionRepository,
  ISupplierRepository,
  IChangeRequestRepository,
  IQCRepository,
} from '../services/repository';

import type {
  Order,
  OrderWorkItem,
  OrderProduct,
  OrderDesign,
  OrderMockup,
  OrderPayment,
  OrderFilters,
  CreateOrderInput,
  UpdateOrderInput,
  CreateWorkItemInput,
  CreatePaymentInput,
  OrderStats,
  OrderSummary,
} from '../types/orders';

import type {
  ProductionJob,
  ProductionStation,
  ProductionJobFilters,
  CreateProductionJobInput,
  UpdateProductionJobInput,
  LogProductionInput,
  ProductionStats,
  ProductionJobSummary,
} from '../types/production';

import type {
  Supplier,
  PurchaseOrder,
  SupplierFilters,
  PurchaseOrderFilters,
  CreateSupplierInput,
  UpdateSupplierInput,
  CreatePurchaseOrderInput,
  ReceiveGoodsInput,
  SupplierStats,
} from '../types/suppliers';

import type {
  ChangeRequest,
  ChangeRequestFilters,
  CreateChangeRequestInput,
  QuoteChangeRequestInput,
  RespondChangeRequestInput,
  ChangeRequestStats,
} from '../types/change-requests';

import type {
  QCRecord,
  QCTemplate,
  QCRecordFilters,
  CreateQCRecordInput,
  QCActionInput,
  QCStats,
} from '../types/qc';

import type { PaginationParams, PaginatedResult, ActionResult } from '../types/common';

import {
  mockOrders,
  mockWorkItems,
  mockPayments,
  mockProductionJobs,
  mockStations,
  mockSuppliers,
  mockPurchaseOrders,
  mockChangeRequests,
} from './data';

// ---------------------------------------------
// localStorage Helper Functions
// ---------------------------------------------

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
  INITIALIZED: 'erp_initialized',
};

function getFromStorage<T>(key: string, fallback: T[]): T[] {
  if (typeof window === 'undefined') return fallback;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

function initializeStorage(): void {
  if (typeof window === 'undefined') return;
  
  const isInitialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
  if (isInitialized) return;
  
  console.log('🚀 Initializing localStorage with mock data...');
  
  saveToStorage(STORAGE_KEYS.ORDERS, mockOrders);
  saveToStorage(STORAGE_KEYS.WORK_ITEMS, mockWorkItems);
  saveToStorage(STORAGE_KEYS.PAYMENTS, mockPayments);
  saveToStorage(STORAGE_KEYS.PRODUCTION_JOBS, mockProductionJobs);
  saveToStorage(STORAGE_KEYS.PRODUCTION_STATIONS, mockStations);
  saveToStorage(STORAGE_KEYS.SUPPLIERS, mockSuppliers);
  saveToStorage(STORAGE_KEYS.PURCHASE_ORDERS, mockPurchaseOrders);
  saveToStorage(STORAGE_KEYS.CHANGE_REQUESTS, mockChangeRequests);
  
  localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  console.log('✅ localStorage initialized!');
}

// Initialize on module load
if (typeof window !== 'undefined') {
  initializeStorage();
}

function generateId(): string {
  return `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function paginate<T>(items: T[], pagination?: PaginationParams): PaginatedResult<T> {
  const page = pagination?.page || 1;
  const limit = pagination?.limit || 20;
  const total = items.length;
  const total_pages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const end = start + limit;

  return {
    data: items.slice(start, end),
    pagination: {
      page,
      limit,
      total,
      total_pages,
      has_next: page < total_pages,
      has_prev: page > 1,
    },
  };
}

function delay(ms: number = 100): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ---------------------------------------------
// Mock Order Repository (localStorage-backed)
// ---------------------------------------------

class MockOrderRepository implements IOrderRepository {
  private getOrders(): Order[] {
    return getFromStorage<Order>(STORAGE_KEYS.ORDERS, mockOrders);
  }

  private saveOrders(orders: Order[]): void {
    saveToStorage(STORAGE_KEYS.ORDERS, orders);
  }

  private _getWorkItemsFromStorage(): OrderWorkItem[] {
    return getFromStorage<OrderWorkItem>(STORAGE_KEYS.WORK_ITEMS, mockWorkItems);
  }

  private _saveWorkItemsToStorage(items: OrderWorkItem[]): void {
    saveToStorage(STORAGE_KEYS.WORK_ITEMS, items);
  }

  private _getPaymentsFromStorage(): OrderPayment[] {
    return getFromStorage<OrderPayment>(STORAGE_KEYS.PAYMENTS, mockPayments);
  }

  private _savePaymentsToStorage(payments: OrderPayment[]): void {
    saveToStorage(STORAGE_KEYS.PAYMENTS, payments);
  }

  async findById(id: string): Promise<Order | null> {
    await delay();
    return this.getOrders().find(o => o.id === id) || null;
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    await delay();
    return this.getOrders().find(o => o.order_number === orderNumber) || null;
  }

  async findByAccessToken(token: string): Promise<Order | null> {
    await delay();
    return this.getOrders().find(o => o.access_token === token) || null;
  }

  async findMany(filters?: OrderFilters, pagination?: PaginationParams): Promise<PaginatedResult<Order>> {
    await delay();
    let result = [...this.getOrders()];

    if (filters?.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      result = result.filter(o => statuses.includes(o.status));
    }

    if (filters?.customer_id) {
      result = result.filter(o => o.customer_snapshot.id === filters.customer_id);
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(o =>
        o.order_number.toLowerCase().includes(search) ||
        o.customer_snapshot.name.toLowerCase().includes(search)
      );
    }

    return paginate(result, pagination);
  }

  async create(data: CreateOrderInput): Promise<ActionResult<Order>> {
    await delay();
    const orders = this.getOrders();
    const newOrder: Order = {
      id: generateId(),
      order_number: `ORD-2024-${String(orders.length + 1).padStart(4, '0')}`,
      order_type_code: data.order_type_code || 'ready_made',
      production_mode: data.production_mode || 'in_house',
      customer_snapshot: {
        id: data.customer_id || generateId(),
        code: 'CUST-NEW',
        name: data.customer_name,
        phone: data.customer_phone,
        email: data.customer_email,
      },
      shipping_address: {
        name: data.shipping_name,
        phone: data.shipping_phone,
        address: data.shipping_address,
        district: data.shipping_district,
        province: data.shipping_province,
        postal_code: data.shipping_postal_code,
      },
      needs_tax_invoice: data.needs_tax_invoice || false,
      billing_name: data.billing_name,
      billing_tax_id: data.billing_tax_id,
      status: 'draft',
      priority_level: 0,
      priority_code: data.priority_code || 'normal',
      priority_surcharge_percent: 0,
      priority_surcharge_amount: 0,
      pricing: {
        subtotal: 0,
        discount_amount: data.discount_amount || 0,
        discount_percent: data.discount_percent || 0,
        discount_reason: data.discount_reason,
        surcharge_amount: 0,
        shipping_cost: data.shipping_cost || 0,
        tax_amount: 0,
        tax_percent: 7,
        total_amount: 0,
      },
      paid_amount: 0,
      balance_due: 0,
      payment_status: 'unpaid',
      payment_terms: data.payment_terms || 'full',
      order_date: new Date().toISOString(),
      due_date: data.due_date,
      revision_count: 0,
      max_free_revisions: 2,
      paid_revision_count: 0,
      paid_revision_total: 0,
      all_designs_approved: false,
      mockup_approved: false,
      materials_ready: false,
      production_unlocked: false,
      change_request_count: 0,
      change_request_total: 0,
      customer_acknowledged_changes: false,
      addons_total: 0,
      customer_note: data.customer_note,
      internal_note: data.internal_note,
      sales_channel: data.sales_channel,
      sales_person_id: data.sales_person_id,
      access_token: Math.random().toString(36).substr(2, 16),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    orders.push(newOrder);
    this.saveOrders(orders);
    console.log('📝 Order created:', newOrder.order_number);
    return { success: true, data: newOrder };
  }

  async update(id: string, data: UpdateOrderInput): Promise<ActionResult<Order>> {
    await delay();
    const orders = this.getOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index === -1) {
      return { success: false, message: 'Order not found' };
    }

    orders[index] = {
      ...orders[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    this.saveOrders(orders);

    console.log('📝 Order updated:', orders[index].order_number);
    return { success: true, data: orders[index] };
  }

  async delete(id: string): Promise<ActionResult> {
    await delay();
    const orders = this.getOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index === -1) {
      return { success: false, message: 'Order not found' };
    }

    orders.splice(index, 1);
    this.saveOrders(orders);
    console.log('🗑️ Order deleted');
    return { success: true };
  }

  async getWorkItems(orderId: string): Promise<OrderWorkItem[]> {
    await delay();
    return this._getWorkItemsFromStorage().filter(wi => wi.order_id === orderId);
  }

  async addWorkItem(data: CreateWorkItemInput): Promise<ActionResult<OrderWorkItem>> {
    await delay();
    const workItems = this._getWorkItemsFromStorage();
    const newItem: OrderWorkItem = {
      id: generateId(),
      order_id: data.order_id,
      work_type_code: data.work_type_code,
      work_type_name: data.work_type_name,
      description: data.description,
      quantity: data.quantity || 1,
      unit_price: data.unit_price || 0,
      total_price: (data.quantity || 1) * (data.unit_price || 0),
      status: 'pending',
      can_start: false,
      all_designs_approved: false,
      all_materials_ready: false,
      qc_status: 'pending',
      qc_passed_qty: 0,
      qc_failed_qty: 0,
      position_code: data.position_code,
      position_name: data.position_name,
      print_size_code: data.print_size_code,
      print_size_name: data.print_size_name,
      priority: data.priority || 0,
      notes: data.notes,
      sort_order: workItems.filter(wi => wi.order_id === data.order_id).length + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    workItems.push(newItem);
    this._saveWorkItemsToStorage(workItems);
    console.log('📝 Work item added');
    return { success: true, data: newItem };
  }

  async updateWorkItem(id: string, data: Partial<OrderWorkItem>): Promise<ActionResult<OrderWorkItem>> {
    await delay();
    const workItems = this._getWorkItemsFromStorage();
    const index = workItems.findIndex(wi => wi.id === id);
    if (index === -1) {
      return { success: false, message: 'Work item not found' };
    }

    workItems[index] = {
      ...workItems[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    this._saveWorkItemsToStorage(workItems);

    return { success: true, data: workItems[index] };
  }

  async deleteWorkItem(id: string): Promise<ActionResult> {
    await delay();
    const workItems = this._getWorkItemsFromStorage();
    const index = workItems.findIndex(wi => wi.id === id);
    if (index === -1) {
      return { success: false, message: 'Work item not found' };
    }

    workItems.splice(index, 1);
    this._saveWorkItemsToStorage(workItems);
    return { success: true };
  }

  async getProducts(orderId: string): Promise<OrderProduct[]> {
    await delay();
    return [];
  }

  async addProduct(data: Partial<OrderProduct>): Promise<ActionResult<OrderProduct>> {
    await delay();
    return { success: true, data: data as OrderProduct };
  }

  async getDesigns(orderId: string): Promise<OrderDesign[]> {
    await delay();
    return [];
  }

  async getMockups(orderId: string): Promise<OrderMockup[]> {
    await delay();
    return [];
  }

  async approveMockup(mockupId: string): Promise<ActionResult> {
    await delay();
    return { success: true };
  }

  async rejectMockup(mockupId: string, feedback: string): Promise<ActionResult> {
    await delay();
    return { success: true };
  }

  async getPayments(orderId: string): Promise<OrderPayment[]> {
    await delay();
    return this._getPaymentsFromStorage().filter(p => p.order_id === orderId);
  }

  async addPayment(data: CreatePaymentInput): Promise<ActionResult<OrderPayment>> {
    await delay();
    const payments = this._getPaymentsFromStorage();
    const newPayment: OrderPayment = {
      id: generateId(),
      order_id: data.order_id,
      amount: data.amount,
      payment_type: data.payment_type,
      payment_method: data.payment_method,
      bank_name: data.bank_name,
      transfer_date: data.transfer_date,
      transfer_time: data.transfer_time,
      slip_image_url: data.slip_image_url,
      reference_number: data.reference_number,
      status: 'pending',
      notes: data.notes,
      payment_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    };

    payments.push(newPayment);
    this._savePaymentsToStorage(payments);
    console.log('💰 Payment added');
    return { success: true, data: newPayment };
  }

  async verifyPayment(paymentId: string, verifiedBy: string): Promise<ActionResult> {
    await delay();
    const payments = this._getPaymentsFromStorage();
    const payment = payments.find(p => p.id === paymentId);
    if (payment) {
      payment.status = 'verified';
      payment.verified_by = verifiedBy;
      payment.verified_at = new Date().toISOString();
      this._savePaymentsToStorage(payments);
    }
    return { success: true };
  }

  async rejectPayment(paymentId: string, reason: string): Promise<ActionResult> {
    await delay();
    const payments = this._getPaymentsFromStorage();
    const payment = payments.find(p => p.id === paymentId);
    if (payment) {
      payment.status = 'rejected';
      payment.rejection_reason = reason;
      this._savePaymentsToStorage(payments);
    }
    return { success: true };
  }

  async updateStatus(orderId: string, status: string, reason?: string): Promise<ActionResult> {
    await delay();
    const orders = this.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.status = status as Order['status'];
      order.updated_at = new Date().toISOString();
      this.saveOrders(orders);
      console.log('📝 Order status updated to:', status);
    }
    return { success: true };
  }

  async getStats(filters?: OrderFilters): Promise<OrderStats> {
    await delay();
    const orders = this.getOrders();
    return {
      total_orders: orders.length,
      total_revenue: orders.reduce((sum, o) => sum + o.pricing.total_amount, 0),
      pending_orders: orders.filter(o => ['draft', 'quoted', 'awaiting_payment'].includes(o.status)).length,
      in_production: orders.filter(o => o.status === 'in_production').length,
      ready_to_ship: orders.filter(o => o.status === 'ready_to_ship').length,
      completed_this_month: orders.filter(o => o.status === 'completed').length,
      overdue_orders: 0,
      avg_order_value: orders.reduce((sum, o) => sum + o.pricing.total_amount, 0) / orders.length,
    };
  }

  async getSummaries(filters?: OrderFilters, pagination?: PaginationParams): Promise<PaginatedResult<OrderSummary>> {
    await delay();
    const orders = this.getOrders();
    const workItems = this._getWorkItemsFromStorage();
    const summaries: OrderSummary[] = orders.map(o => ({
      id: o.id,
      order_number: o.order_number,
      customer_name: o.customer_snapshot.name,
      status: o.status,
      payment_status: o.payment_status,
      total_amount: o.pricing.total_amount,
      paid_amount: o.paid_amount,
      due_date: o.due_date,
      order_date: o.order_date,
      work_items_count: workItems.filter(wi => wi.order_id === o.id).length,
      is_overdue: false,
    }));

    return paginate(summaries, pagination);
  }
}

// ---------------------------------------------
// Mock Production Repository (localStorage-backed)
// ---------------------------------------------

class MockProductionRepository implements IProductionRepository {
  private _getJobs(): ProductionJob[] {
    return getFromStorage<ProductionJob>(STORAGE_KEYS.PRODUCTION_JOBS, mockProductionJobs);
  }

  private _saveJobs(jobs: ProductionJob[]): void {
    saveToStorage(STORAGE_KEYS.PRODUCTION_JOBS, jobs);
  }

  private _getStations(): ProductionStation[] {
    return getFromStorage<ProductionStation>(STORAGE_KEYS.PRODUCTION_STATIONS, mockStations);
  }

  async findById(id: string): Promise<ProductionJob | null> {
    await delay();
    return this._getJobs().find(j => j.id === id) || null;
  }

  async findByJobNumber(jobNumber: string): Promise<ProductionJob | null> {
    await delay();
    return this._getJobs().find(j => j.job_number === jobNumber) || null;
  }

  async findMany(filters?: ProductionJobFilters, pagination?: PaginationParams): Promise<PaginatedResult<ProductionJob>> {
    await delay();
    let result = [...this._getJobs()];

    if (filters?.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      result = result.filter(j => statuses.includes(j.status));
    }

    return paginate(result, pagination);
  }

  async create(data: CreateProductionJobInput): Promise<ActionResult<ProductionJob>> {
    await delay();
    const jobs = this._getJobs();
    const newJob: ProductionJob = {
      id: generateId(),
      job_number: `PJ-2024-${String(jobs.length + 1).padStart(4, '0')}`,
      order_id: data.order_id,
      order_work_item_id: data.order_work_item_id,
      work_type_code: data.work_type_code,
      work_type_name: data.work_type_name,
      description: data.description,
      ordered_qty: data.ordered_qty,
      produced_qty: 0,
      passed_qty: 0,
      failed_qty: 0,
      rework_qty: 0,
      status: 'pending',
      priority: data.priority || 0,
      progress_percent: 0,
      station_id: data.station_id,
      assigned_to: data.assigned_to,
      due_date: data.due_date,
      is_rework: false,
      rework_count: 0,
      design_file_url: data.design_file_url,
      production_notes: data.production_notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    jobs.push(newJob);
    this._saveJobs(jobs);
    console.log('🏭 Production job created:', newJob.job_number);
    return { success: true, data: newJob };
  }

  async update(id: string, data: UpdateProductionJobInput): Promise<ActionResult<ProductionJob>> {
    await delay();
    const jobs = this._getJobs();
    const index = jobs.findIndex(j => j.id === id);
    if (index === -1) {
      return { success: false, message: 'Job not found' };
    }

    jobs[index] = {
      ...jobs[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    this._saveJobs(jobs);

    return { success: true, data: jobs[index] };
  }

  async delete(id: string): Promise<ActionResult> {
    await delay();
    const jobs = this._getJobs();
    const index = jobs.findIndex(j => j.id === id);
    if (index === -1) {
      return { success: false, message: 'Job not found' };
    }

    jobs.splice(index, 1);
    this._saveJobs(jobs);
    return { success: true };
  }

  async getStations(): Promise<ProductionStation[]> {
    await delay();
    return this._getStations();
  }

  async getStationWorkload(stationId: string): Promise<{ pending: number; in_progress: number }> {
    await delay();
    const stationJobs = this._getJobs().filter(j => j.station_id === stationId);
    return {
      pending: stationJobs.filter(j => j.status === 'queued').length,
      in_progress: stationJobs.filter(j => j.status === 'in_progress').length,
    };
  }

  async assignToStation(jobId: string, stationId: string): Promise<ActionResult> {
    await delay();
    const jobs = this._getJobs();
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      job.station_id = stationId;
      job.status = 'assigned';
      job.updated_at = new Date().toISOString();
      this._saveJobs(jobs);
    }
    return { success: true };
  }

  async assignToWorker(jobId: string, workerId: string): Promise<ActionResult> {
    await delay();
    const jobs = this._getJobs();
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      job.assigned_to = workerId;
      job.assigned_at = new Date().toISOString();
      job.updated_at = new Date().toISOString();
      this._saveJobs(jobs);
    }
    return { success: true };
  }

  async startJob(jobId: string): Promise<ActionResult> {
    await delay();
    const jobs = this._getJobs();
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      job.status = 'in_progress';
      job.started_at = new Date().toISOString();
      job.updated_at = new Date().toISOString();
      this._saveJobs(jobs);
      console.log('▶️ Job started:', job.job_number);
    }
    return { success: true };
  }

  async logProduction(data: LogProductionInput): Promise<ActionResult> {
    await delay();
    const jobs = this._getJobs();
    const job = jobs.find(j => j.id === data.job_id);
    if (job && data.produced_qty) {
      job.produced_qty += data.produced_qty;
      job.progress_percent = Math.round((job.produced_qty / job.ordered_qty) * 100);
      job.updated_at = new Date().toISOString();
      this._saveJobs(jobs);
    }
    return { success: true };
  }

  async completeJob(jobId: string): Promise<ActionResult> {
    await delay();
    const jobs = this._getJobs();
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      job.status = 'completed';
      job.completed_at = new Date().toISOString();
      job.updated_at = new Date().toISOString();
      this._saveJobs(jobs);
      console.log('✅ Job completed:', job.job_number);
    }
    return { success: true };
  }

  async getQueue(stationId?: string): Promise<ProductionJobSummary[]> {
    await delay();
    let jobs = this._getJobs().filter(j => ['pending', 'queued', 'assigned'].includes(j.status));
    if (stationId) {
      jobs = jobs.filter(j => j.station_id === stationId);
    }

    return jobs.map(j => ({
      id: j.id,
      job_number: j.job_number,
      order_number: j.order_number,
      customer_name: j.customer_name,
      work_type_code: j.work_type_code,
      work_type_name: j.work_type_name,
      status: j.status,
      priority: j.priority,
      ordered_qty: j.ordered_qty,
      produced_qty: j.produced_qty,
      progress_percent: j.progress_percent,
      due_date: j.due_date,
      is_overdue: false,
    }));
  }

  async reorderQueue(jobIds: string[]): Promise<ActionResult> {
    await delay();
    return { success: true };
  }

  async getStats(filters?: ProductionJobFilters): Promise<ProductionStats> {
    await delay();
    const jobs = this._getJobs();
    return {
      total_jobs: jobs.length,
      pending_jobs: jobs.filter(j => j.status === 'pending').length,
      in_progress_jobs: jobs.filter(j => j.status === 'in_progress').length,
      completed_today: 0,
      total_qty_pending: jobs.filter(j => j.status !== 'completed').reduce((sum, j) => sum + j.ordered_qty - j.produced_qty, 0),
      total_qty_completed_today: 0,
      on_time_rate: 95,
      rework_rate: 2,
    };
  }
}

// ---------------------------------------------
// Mock Supplier Repository (localStorage-backed)
// ---------------------------------------------

class MockSupplierRepository implements ISupplierRepository {
  private _getSuppliers(): Supplier[] {
    return getFromStorage<Supplier>(STORAGE_KEYS.SUPPLIERS, mockSuppliers);
  }

  private _saveSuppliers(suppliers: Supplier[]): void {
    saveToStorage(STORAGE_KEYS.SUPPLIERS, suppliers);
  }

  private _getPurchaseOrders(): PurchaseOrder[] {
    return getFromStorage<PurchaseOrder>(STORAGE_KEYS.PURCHASE_ORDERS, mockPurchaseOrders);
  }

  private _savePurchaseOrders(pos: PurchaseOrder[]): void {
    saveToStorage(STORAGE_KEYS.PURCHASE_ORDERS, pos);
  }

  async findById(id: string): Promise<Supplier | null> {
    await delay();
    return this._getSuppliers().find(s => s.id === id) || null;
  }

  async findByCode(code: string): Promise<Supplier | null> {
    await delay();
    return this._getSuppliers().find(s => s.code === code) || null;
  }

  async findMany(filters?: SupplierFilters, pagination?: PaginationParams): Promise<PaginatedResult<Supplier>> {
    await delay();
    return paginate(this._getSuppliers(), pagination);
  }

  async create(data: CreateSupplierInput): Promise<ActionResult<Supplier>> {
    await delay();
    const suppliers = this._getSuppliers();
    const newSupplier: Supplier = {
      id: generateId(),
      code: data.code || `SUP-${String(suppliers.length + 1).padStart(3, '0')}`,
      name: data.name,
      name_th: data.name_th,
      contact: {
        name: data.contact_name,
        phone: data.contact_phone,
        email: data.contact_email,
        line_id: data.contact_line,
      },
      address: {
        address: data.address,
        district: data.district,
        province: data.province,
        postal_code: data.postal_code,
      },
      service_types: data.service_types || [],
      default_lead_days: data.default_lead_days || 7,
      min_order_qty: data.min_order_qty || 1,
      payment_terms: data.payment_terms || 'cod',
      rating: 0,
      on_time_rate: 100,
      quality_rate: 100,
      total_orders: 0,
      total_value: 0,
      status: 'active',
      notes: data.notes,
      created_at: new Date().toISOString(),
    };

    suppliers.push(newSupplier);
    this._saveSuppliers(suppliers);
    console.log('🏢 Supplier created:', newSupplier.code);
    return { success: true, data: newSupplier };
  }

  async update(id: string, data: UpdateSupplierInput): Promise<ActionResult<Supplier>> {
    await delay();
    const suppliers = this._getSuppliers();
    const index = suppliers.findIndex(s => s.id === id);
    if (index === -1) {
      return { success: false, message: 'Supplier not found' };
    }

    suppliers[index] = { ...suppliers[index], ...data };
    this._saveSuppliers(suppliers);
    return { success: true, data: suppliers[index] };
  }

  async delete(id: string): Promise<ActionResult> {
    await delay();
    const suppliers = this._getSuppliers();
    const index = suppliers.findIndex(s => s.id === id);
    if (index === -1) {
      return { success: false, message: 'Supplier not found' };
    }

    suppliers.splice(index, 1);
    this._saveSuppliers(suppliers);
    return { success: true };
  }

  async getByServiceType(serviceType: string): Promise<Supplier[]> {
    await delay();
    return this._getSuppliers().filter(s => s.service_types.includes(serviceType));
  }

  async getPurchaseOrders(supplierId: string): Promise<PurchaseOrder[]> {
    await delay();
    return this._getPurchaseOrders().filter(po => po.supplier_id === supplierId);
  }

  async createPurchaseOrder(data: CreatePurchaseOrderInput): Promise<ActionResult<PurchaseOrder>> {
    await delay();
    return { success: true, data: {} as PurchaseOrder };
  }

  async updatePurchaseOrder(poId: string, data: Partial<PurchaseOrder>): Promise<ActionResult<PurchaseOrder>> {
    await delay();
    return { success: true, data: {} as PurchaseOrder };
  }

  async sendPurchaseOrder(poId: string): Promise<ActionResult> {
    await delay();
    return { success: true };
  }

  async confirmPurchaseOrder(poId: string): Promise<ActionResult> {
    await delay();
    return { success: true };
  }

  async receiveGoods(data: ReceiveGoodsInput): Promise<ActionResult> {
    await delay();
    return { success: true };
  }

  async getStats(): Promise<SupplierStats> {
    await delay();
    const suppliers = this._getSuppliers();
    const purchaseOrders = this._getPurchaseOrders();
    return {
      total_suppliers: suppliers.length,
      active_suppliers: suppliers.filter(s => s.status === 'active').length,
      pending_pos: purchaseOrders.filter(po => po.status === 'sent').length,
      overdue_deliveries: 0,
      total_outstanding: purchaseOrders
        .filter(po => po.payment_status !== 'paid')
        .reduce((sum, po) => sum + po.total_amount - po.paid_amount, 0),
    };
  }
}

// ---------------------------------------------
// Mock Change Request Repository (localStorage-backed)
// ---------------------------------------------

class MockChangeRequestRepository implements IChangeRequestRepository {
  private _getChangeRequests(): ChangeRequest[] {
    return getFromStorage<ChangeRequest>(STORAGE_KEYS.CHANGE_REQUESTS, mockChangeRequests);
  }

  private _saveChangeRequests(requests: ChangeRequest[]): void {
    saveToStorage(STORAGE_KEYS.CHANGE_REQUESTS, requests);
  }

  async findById(id: string): Promise<ChangeRequest | null> {
    await delay();
    return this._getChangeRequests().find(cr => cr.id === id) || null;
  }

  async findByRequestNumber(requestNumber: string): Promise<ChangeRequest | null> {
    await delay();
    return this._getChangeRequests().find(cr => cr.request_number === requestNumber) || null;
  }

  async findMany(filters?: ChangeRequestFilters, pagination?: PaginationParams): Promise<PaginatedResult<ChangeRequest>> {
    await delay();
    return paginate(this._getChangeRequests(), pagination);
  }

  async create(data: CreateChangeRequestInput): Promise<ActionResult<ChangeRequest>> {
    await delay();
    return { success: true, data: {} as ChangeRequest };
  }

  async update(id: string, data: Partial<ChangeRequest>): Promise<ActionResult<ChangeRequest>> {
    await delay();
    return { success: true, data: {} as ChangeRequest };
  }

  async delete(id: string): Promise<ActionResult> {
    await delay();
    return { success: true };
  }

  async getByOrderId(orderId: string): Promise<ChangeRequest[]> {
    await delay();
    return this._getChangeRequests().filter(cr => cr.order_id === orderId);
  }

  async quote(data: QuoteChangeRequestInput): Promise<ActionResult> {
    await delay();
    const requests = this._getChangeRequests();
    const request = requests.find(cr => cr.id === data.change_request_id);
    if (request) {
      request.fees = data.fees;
      request.status = 'awaiting_customer';
      this._saveChangeRequests(requests);
      console.log('💬 Change request quoted');
    }
    return { success: true };
  }

  async notifyCustomer(changeRequestId: string): Promise<ActionResult> {
    await delay();
    return { success: true };
  }

  async respondToRequest(data: RespondChangeRequestInput): Promise<ActionResult> {
    await delay();
    const requests = this._getChangeRequests();
    const request = requests.find(cr => cr.id === data.change_request_id);
    if (request) {
      request.customer_response = data.response;
      request.customer_response_at = new Date().toISOString();
      if (data.response === 'accepted') {
        request.status = 'approved';
      } else {
        request.status = 'rejected';
      }
      this._saveChangeRequests(requests);
    }
    return { success: true };
  }

  async markCompleted(changeRequestId: string): Promise<ActionResult> {
    await delay();
    const requests = this._getChangeRequests();
    const request = requests.find(cr => cr.id === changeRequestId);
    if (request) {
      request.status = 'completed';
      this._saveChangeRequests(requests);
    }
    return { success: true };
  }

  async cancel(changeRequestId: string, reason: string): Promise<ActionResult> {
    await delay();
    const requests = this._getChangeRequests();
    const request = requests.find(cr => cr.id === changeRequestId);
    if (request) {
      request.status = 'cancelled';
      this._saveChangeRequests(requests);
    }
    return { success: true };
  }

  async getStats(filters?: ChangeRequestFilters): Promise<ChangeRequestStats> {
    await delay();
    const requests = this._getChangeRequests();
    return {
      total_requests: requests.length,
      pending_requests: requests.filter(cr => cr.status === 'pending').length,
      awaiting_customer: requests.filter(cr => cr.status === 'awaiting_customer').length,
      total_fees_quoted: 0,
      total_fees_collected: 0,
      avg_resolution_days: 1,
    };
  }
}

// ---------------------------------------------
// Mock QC Repository
// ---------------------------------------------

class MockQCRepository implements IQCRepository {
  async getTemplates(workTypeCode?: string): Promise<QCTemplate[]> {
    await delay();
    return [];
  }

  async findById(id: string): Promise<QCRecord | null> {
    await delay();
    return null;
  }

  async findMany(filters?: QCRecordFilters, pagination?: PaginationParams): Promise<PaginatedResult<QCRecord>> {
    await delay();
    return paginate([], pagination);
  }

  async create(data: CreateQCRecordInput): Promise<ActionResult<QCRecord>> {
    await delay();
    return { success: true, data: {} as QCRecord };
  }

  async takeAction(data: QCActionInput): Promise<ActionResult> {
    await delay();
    return { success: true };
  }

  async markFollowUpComplete(recordId: string): Promise<ActionResult> {
    await delay();
    return { success: true };
  }

  async getStats(filters?: QCRecordFilters): Promise<QCStats> {
    await delay();
    return {
      total_records: 0,
      pending_qc: 0,
      failed_today: 0,
      rework_in_progress: 0,
      avg_pass_rate: 98,
      avg_check_time_minutes: 5,
    };
  }
}

// ---------------------------------------------
// Create Mock Repository Factory
// ---------------------------------------------

export function createMockRepository(): IRepositoryFactory {
  return {
    orders: new MockOrderRepository(),
    production: new MockProductionRepository(),
    suppliers: new MockSupplierRepository(),
    changeRequests: new MockChangeRequestRepository(),
    qc: new MockQCRepository(),
  };
}

