// =============================================
// SUPPLIER SERVICE
// =============================================

import { getSupplierRepository } from './repository';
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
import type { PaginationParams, PaginatedResult, ActionResult } from '../types/common';

// ---------------------------------------------
// Supplier CRUD
// ---------------------------------------------

export async function getSupplier(id: string): Promise<Supplier | null> {
  return getSupplierRepository().findById(id);
}

export async function getSupplierByCode(code: string): Promise<Supplier | null> {
  return getSupplierRepository().findByCode(code);
}

export async function getSuppliers(
  filters?: SupplierFilters,
  pagination?: PaginationParams
): Promise<PaginatedResult<Supplier>> {
  return getSupplierRepository().findMany(filters, pagination);
}

export async function getSuppliersByServiceType(serviceType: string): Promise<Supplier[]> {
  return getSupplierRepository().getByServiceType(serviceType);
}

export async function createSupplier(data: CreateSupplierInput): Promise<ActionResult<Supplier>> {
  return getSupplierRepository().create(data);
}

export async function updateSupplier(id: string, data: UpdateSupplierInput): Promise<ActionResult<Supplier>> {
  return getSupplierRepository().update(id, data);
}

export async function deleteSupplier(id: string): Promise<ActionResult> {
  return getSupplierRepository().delete(id);
}

// ---------------------------------------------
// Purchase Orders
// ---------------------------------------------

export async function getPurchaseOrders(supplierId: string): Promise<PurchaseOrder[]> {
  return getSupplierRepository().getPurchaseOrders(supplierId);
}

export async function createPurchaseOrder(data: CreatePurchaseOrderInput): Promise<ActionResult<PurchaseOrder>> {
  return getSupplierRepository().createPurchaseOrder(data);
}

export async function updatePurchaseOrder(
  poId: string,
  data: Partial<PurchaseOrder>
): Promise<ActionResult<PurchaseOrder>> {
  return getSupplierRepository().updatePurchaseOrder(poId, data);
}

export async function sendPurchaseOrder(poId: string): Promise<ActionResult> {
  return getSupplierRepository().sendPurchaseOrder(poId);
}

export async function confirmPurchaseOrder(poId: string): Promise<ActionResult> {
  return getSupplierRepository().confirmPurchaseOrder(poId);
}

export async function receiveGoods(data: ReceiveGoodsInput): Promise<ActionResult> {
  return getSupplierRepository().receiveGoods(data);
}

// ---------------------------------------------
// Stats
// ---------------------------------------------

export async function getSupplierStats(): Promise<SupplierStats> {
  return getSupplierRepository().getStats();
}

// ---------------------------------------------
// Business Logic Helpers
// ---------------------------------------------

export function calculatePOTotal(items: { quantity: number; unit_price: number }[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
}

export function isPOOverdue(po: PurchaseOrder): boolean {
  if (!po.expected_date) return false;
  if (['completed', 'cancelled', 'received'].includes(po.status)) return false;
  
  const expectedDate = new Date(po.expected_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return expectedDate < today;
}

export function getSupplierRatingLabel(rating: number): { label: string; color: string } {
  if (rating >= 4.5) return { label: 'ยอดเยี่ยม', color: 'green' };
  if (rating >= 4.0) return { label: 'ดีมาก', color: 'emerald' };
  if (rating >= 3.5) return { label: 'ดี', color: 'blue' };
  if (rating >= 3.0) return { label: 'พอใช้', color: 'yellow' };
  if (rating >= 2.0) return { label: 'ต้องปรับปรุง', color: 'orange' };
  return { label: 'แย่', color: 'red' };
}

