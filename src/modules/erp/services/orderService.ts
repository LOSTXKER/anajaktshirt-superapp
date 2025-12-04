// =============================================
// ORDER SERVICE
// =============================================
// High-level order operations using repository
// =============================================

import { getOrderRepository } from './repository';
import type {
  Order,
  OrderWorkItem,
  OrderPayment,
  OrderFilters,
  CreateOrderInput,
  UpdateOrderInput,
  CreateWorkItemInput,
  CreatePaymentInput,
  OrderStats,
  OrderSummary,
} from '../types/orders';
import type { PaginationParams, PaginatedResult, ActionResult } from '../types/common';

// ---------------------------------------------
// Order CRUD
// ---------------------------------------------

export async function getOrder(id: string): Promise<Order | null> {
  return getOrderRepository().findById(id);
}

export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  return getOrderRepository().findByOrderNumber(orderNumber);
}

export async function getOrderByToken(token: string): Promise<Order | null> {
  return getOrderRepository().findByAccessToken(token);
}

export async function getOrders(
  filters?: OrderFilters,
  pagination?: PaginationParams
): Promise<PaginatedResult<Order>> {
  return getOrderRepository().findMany(filters, pagination);
}

export async function getOrderSummaries(
  filters?: OrderFilters,
  pagination?: PaginationParams
): Promise<PaginatedResult<OrderSummary>> {
  return getOrderRepository().getSummaries(filters, pagination);
}

export async function createOrder(data: CreateOrderInput): Promise<ActionResult<Order>> {
  return getOrderRepository().create(data);
}

export async function updateOrder(id: string, data: UpdateOrderInput): Promise<ActionResult<Order>> {
  return getOrderRepository().update(id, data);
}

export async function deleteOrder(id: string): Promise<ActionResult> {
  return getOrderRepository().delete(id);
}

// ---------------------------------------------
// Order Status
// ---------------------------------------------

export async function updateOrderStatus(
  orderId: string,
  status: string,
  reason?: string
): Promise<ActionResult> {
  return getOrderRepository().updateStatus(orderId, status, reason);
}

// ---------------------------------------------
// Work Items
// ---------------------------------------------

export async function getWorkItems(orderId: string): Promise<OrderWorkItem[]> {
  return getOrderRepository().getWorkItems(orderId);
}

export async function addWorkItem(data: CreateWorkItemInput): Promise<ActionResult<OrderWorkItem>> {
  return getOrderRepository().addWorkItem(data);
}

export async function updateWorkItem(
  id: string,
  data: Partial<OrderWorkItem>
): Promise<ActionResult<OrderWorkItem>> {
  return getOrderRepository().updateWorkItem(id, data);
}

export async function deleteWorkItem(id: string): Promise<ActionResult> {
  return getOrderRepository().deleteWorkItem(id);
}

// ---------------------------------------------
// Payments
// ---------------------------------------------

export async function getPayments(orderId: string): Promise<OrderPayment[]> {
  return getOrderRepository().getPayments(orderId);
}

export async function addPayment(data: CreatePaymentInput): Promise<ActionResult<OrderPayment>> {
  return getOrderRepository().addPayment(data);
}

export async function verifyPayment(paymentId: string, verifiedBy: string): Promise<ActionResult> {
  return getOrderRepository().verifyPayment(paymentId, verifiedBy);
}

export async function rejectPayment(paymentId: string, reason: string): Promise<ActionResult> {
  return getOrderRepository().rejectPayment(paymentId, reason);
}

// ---------------------------------------------
// Mockups
// ---------------------------------------------

export async function approveMockup(mockupId: string): Promise<ActionResult> {
  return getOrderRepository().approveMockup(mockupId);
}

export async function rejectMockup(mockupId: string, feedback: string): Promise<ActionResult> {
  return getOrderRepository().rejectMockup(mockupId, feedback);
}

// ---------------------------------------------
// Stats
// ---------------------------------------------

export async function getOrderStats(filters?: OrderFilters): Promise<OrderStats> {
  return getOrderRepository().getStats(filters);
}

// ---------------------------------------------
// Business Logic Helpers
// ---------------------------------------------

export function canStartProduction(order: Order): { allowed: boolean; reason?: string } {
  // Check all gates
  if (!order.all_designs_approved) {
    return { allowed: false, reason: 'ยังไม่อนุมัติ Design ทั้งหมด' };
  }
  
  if (!order.mockup_approved) {
    return { allowed: false, reason: 'ยังไม่อนุมัติ Mockup' };
  }
  
  if (!order.materials_ready) {
    return { allowed: false, reason: 'วัตถุดิบยังไม่พร้อม' };
  }
  
  // Check payment (at least deposit)
  if (order.payment_status === 'unpaid') {
    return { allowed: false, reason: 'ยังไม่ชำระเงิน' };
  }
  
  return { allowed: true };
}

export function calculateOrderTotals(order: Order): {
  subtotal: number;
  discount: number;
  surcharge: number;
  shipping: number;
  tax: number;
  total: number;
  balance: number;
} {
  const subtotal = order.pricing.subtotal;
  const discount = order.pricing.discount_amount;
  const surcharge = order.priority_surcharge_amount + order.change_request_total;
  const shipping = order.pricing.shipping_cost;
  const tax = order.pricing.tax_amount;
  const total = subtotal - discount + surcharge + shipping + tax;
  const balance = total - order.paid_amount;
  
  return { subtotal, discount, surcharge, shipping, tax, total, balance };
}

export function isOrderOverdue(order: Order): boolean {
  if (!order.due_date) return false;
  if (['completed', 'shipped', 'delivered', 'cancelled'].includes(order.status)) return false;
  
  const dueDate = new Date(order.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return dueDate < today;
}

export function getOrderProgress(order: Order): number {
  const statusProgress: Record<string, number> = {
    draft: 5,
    quoted: 10,
    awaiting_payment: 15,
    partial_paid: 20,
    designing: 30,
    awaiting_mockup_approval: 40,
    mockup_approved: 45,
    awaiting_material: 50,
    material_ready: 55,
    queued: 60,
    in_production: 75,
    qc_pending: 85,
    qc_passed: 90,
    ready_to_ship: 95,
    shipped: 98,
    delivered: 99,
    completed: 100,
    cancelled: 0,
    on_hold: 0,
  };
  
  return statusProgress[order.status] || 0;
}

