// =============================================
// REPOSITORY INTERFACES
// =============================================
// Abstract interfaces for data access
// Implement these for different databases:
// - MockRepository (development)
// - SupabaseRepository (current)
// - PrismaRepository (future MySQL)
// =============================================

import type {
  PaginationParams,
  PaginatedResult,
  ActionResult,
} from '../types/common';

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

// ---------------------------------------------
// Base Repository Interface
// ---------------------------------------------

export interface BaseRepository<T, CreateInput, UpdateInput, Filters> {
  findById(id: string): Promise<T | null>;
  findMany(filters?: Filters, pagination?: PaginationParams): Promise<PaginatedResult<T>>;
  create(data: CreateInput): Promise<ActionResult<T>>;
  update(id: string, data: UpdateInput): Promise<ActionResult<T>>;
  delete(id: string): Promise<ActionResult>;
}

// ---------------------------------------------
// Order Repository
// ---------------------------------------------

export interface IOrderRepository extends BaseRepository<Order, CreateOrderInput, UpdateOrderInput, OrderFilters> {
  // Order specific methods
  findByOrderNumber(orderNumber: string): Promise<Order | null>;
  findByAccessToken(token: string): Promise<Order | null>;
  
  // Work Items
  getWorkItems(orderId: string): Promise<OrderWorkItem[]>;
  addWorkItem(data: CreateWorkItemInput): Promise<ActionResult<OrderWorkItem>>;
  updateWorkItem(id: string, data: Partial<OrderWorkItem>): Promise<ActionResult<OrderWorkItem>>;
  deleteWorkItem(id: string): Promise<ActionResult>;
  
  // Products
  getProducts(orderId: string): Promise<OrderProduct[]>;
  addProduct(data: Partial<OrderProduct>): Promise<ActionResult<OrderProduct>>;
  
  // Designs
  getDesigns(orderId: string): Promise<OrderDesign[]>;
  
  // Mockups
  getMockups(orderId: string): Promise<OrderMockup[]>;
  approveMockup(mockupId: string): Promise<ActionResult>;
  rejectMockup(mockupId: string, feedback: string): Promise<ActionResult>;
  
  // Payments
  getPayments(orderId: string): Promise<OrderPayment[]>;
  addPayment(data: CreatePaymentInput): Promise<ActionResult<OrderPayment>>;
  verifyPayment(paymentId: string, verifiedBy: string): Promise<ActionResult>;
  rejectPayment(paymentId: string, reason: string): Promise<ActionResult>;
  
  // Status
  updateStatus(orderId: string, status: string, reason?: string): Promise<ActionResult>;
  
  // Stats
  getStats(filters?: OrderFilters): Promise<OrderStats>;
  getSummaries(filters?: OrderFilters, pagination?: PaginationParams): Promise<PaginatedResult<OrderSummary>>;
}

// ---------------------------------------------
// Production Repository
// ---------------------------------------------

export interface IProductionRepository extends BaseRepository<ProductionJob, CreateProductionJobInput, UpdateProductionJobInput, ProductionJobFilters> {
  // Job specific methods
  findByJobNumber(jobNumber: string): Promise<ProductionJob | null>;
  
  // Stations
  getStations(): Promise<ProductionStation[]>;
  getStationWorkload(stationId: string): Promise<{ pending: number; in_progress: number }>;
  
  // Job operations
  assignToStation(jobId: string, stationId: string): Promise<ActionResult>;
  assignToWorker(jobId: string, workerId: string): Promise<ActionResult>;
  startJob(jobId: string): Promise<ActionResult>;
  logProduction(data: LogProductionInput): Promise<ActionResult>;
  completeJob(jobId: string): Promise<ActionResult>;
  
  // Queue
  getQueue(stationId?: string): Promise<ProductionJobSummary[]>;
  reorderQueue(jobIds: string[]): Promise<ActionResult>;
  
  // Stats
  getStats(filters?: ProductionJobFilters): Promise<ProductionStats>;
}

// ---------------------------------------------
// Supplier Repository
// ---------------------------------------------

export interface ISupplierRepository extends BaseRepository<Supplier, CreateSupplierInput, UpdateSupplierInput, SupplierFilters> {
  // Supplier specific methods
  findByCode(code: string): Promise<Supplier | null>;
  getByServiceType(serviceType: string): Promise<Supplier[]>;
  
  // Purchase Orders
  getPurchaseOrders(supplierId: string): Promise<PurchaseOrder[]>;
  createPurchaseOrder(data: CreatePurchaseOrderInput): Promise<ActionResult<PurchaseOrder>>;
  updatePurchaseOrder(poId: string, data: Partial<PurchaseOrder>): Promise<ActionResult<PurchaseOrder>>;
  sendPurchaseOrder(poId: string): Promise<ActionResult>;
  confirmPurchaseOrder(poId: string): Promise<ActionResult>;
  receiveGoods(data: ReceiveGoodsInput): Promise<ActionResult>;
  
  // Stats
  getStats(): Promise<SupplierStats>;
}

// ---------------------------------------------
// Change Request Repository
// ---------------------------------------------

export interface IChangeRequestRepository extends BaseRepository<ChangeRequest, CreateChangeRequestInput, Partial<ChangeRequest>, ChangeRequestFilters> {
  // Change request specific methods
  findByRequestNumber(requestNumber: string): Promise<ChangeRequest | null>;
  getByOrderId(orderId: string): Promise<ChangeRequest[]>;
  
  // Workflow
  quote(data: QuoteChangeRequestInput): Promise<ActionResult>;
  notifyCustomer(changeRequestId: string): Promise<ActionResult>;
  respondToRequest(data: RespondChangeRequestInput): Promise<ActionResult>;
  markCompleted(changeRequestId: string): Promise<ActionResult>;
  cancel(changeRequestId: string, reason: string): Promise<ActionResult>;
  
  // Stats
  getStats(filters?: ChangeRequestFilters): Promise<ChangeRequestStats>;
}

// ---------------------------------------------
// QC Repository
// ---------------------------------------------

export interface IQCRepository {
  // Templates
  getTemplates(workTypeCode?: string): Promise<QCTemplate[]>;
  
  // Records
  findById(id: string): Promise<QCRecord | null>;
  findMany(filters?: QCRecordFilters, pagination?: PaginationParams): Promise<PaginatedResult<QCRecord>>;
  create(data: CreateQCRecordInput): Promise<ActionResult<QCRecord>>;
  
  // Actions
  takeAction(data: QCActionInput): Promise<ActionResult>;
  markFollowUpComplete(recordId: string): Promise<ActionResult>;
  
  // Stats
  getStats(filters?: QCRecordFilters): Promise<QCStats>;
}

// ---------------------------------------------
// Repository Factory Type
// ---------------------------------------------

export interface IRepositoryFactory {
  orders: IOrderRepository;
  production: IProductionRepository;
  suppliers: ISupplierRepository;
  changeRequests: IChangeRequestRepository;
  qc: IQCRepository;
}

// ---------------------------------------------
// Current Repository Instance
// Will be set by the app initialization
// ---------------------------------------------

let currentRepository: IRepositoryFactory | null = null;

export function setRepository(repo: IRepositoryFactory) {
  currentRepository = repo;
}

export function getRepository(): IRepositoryFactory {
  if (!currentRepository) {
    throw new Error('Repository not initialized. Call setRepository() first.');
  }
  return currentRepository;
}

// Convenience getters
export function getOrderRepository(): IOrderRepository {
  return getRepository().orders;
}

export function getProductionRepository(): IProductionRepository {
  return getRepository().production;
}

export function getSupplierRepository(): ISupplierRepository {
  return getRepository().suppliers;
}

export function getChangeRequestRepository(): IChangeRequestRepository {
  return getRepository().changeRequests;
}

export function getQCRepository(): IQCRepository {
  return getRepository().qc;
}

