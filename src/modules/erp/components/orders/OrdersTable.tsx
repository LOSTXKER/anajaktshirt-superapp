'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  Eye, 
  MoreVertical, 
  Copy, 
  Edit, 
  XCircle,
  Clock,
  DollarSign,
  Package,
  Truck,
  CheckCircle2,
  AlertCircle,
  Zap,
  Building2,
  User,
  Palette,
  Factory,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/modules/shared/ui';
import type { Order } from '../../types/orders';
import { ORDER_STATUS_CONFIG, PRIORITY_CONFIG } from '../../types/enums';
import type { OrderStatus, PriorityCode } from '../../types/enums';

interface OrdersTableProps {
  orders: Order[];
  loading?: boolean;
  onCopyLink?: (order: Order) => void;
  onCancel?: (order: Order) => void;
}

// ---------------------------------------------
// Action Menu Component
// ---------------------------------------------

function ActionMenu({ 
  order, 
  onCopyLink, 
  onCancel 
}: { 
  order: Order; 
  onCopyLink?: (order: Order) => void;
  onCancel?: (order: Order) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={menuRef} className="relative">
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-[#86868B] hover:text-[#1D1D1F] h-8 w-8 p-0"
        onClick={() => setIsOpen(!isOpen)}
      >
        <MoreVertical className="w-4 h-4" />
      </Button>
      
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-[#E8E8ED] rounded-xl shadow-lg z-50 py-1 animate-scale-in">
          <Link 
            href={`/orders/${order.id}`}
            className="flex items-center gap-2 px-3 py-2 text-sm text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
          >
            <Eye className="w-4 h-4" />
            ดูรายละเอียด
          </Link>
          <Link 
            href={`/orders/${order.id}/edit`}
            className="flex items-center gap-2 px-3 py-2 text-sm text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
          >
            <Edit className="w-4 h-4" />
            แก้ไข
          </Link>
          {order.access_token && onCopyLink && (
            <button
              onClick={() => {
                onCopyLink(order);
                setIsOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-[#1D1D1F] hover:bg-[#F5F5F7] w-full text-left transition-colors"
            >
              <Copy className="w-4 h-4" />
              คัดลอกลิงก์ลูกค้า
            </button>
          )}
          <div className="border-t border-[#E8E8ED] my-1" />
          <button
            onClick={() => {
              onCancel?.(order);
              setIsOpen(false);
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 w-full text-left transition-colors"
          >
            <XCircle className="w-4 h-4" />
            ยกเลิกออเดอร์
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------
// Status Icon Component
// ---------------------------------------------

function getStatusIcon(status: OrderStatus) {
  switch (status) {
    case 'draft':
      return <Clock className="w-3.5 h-3.5" />;
    case 'quoted':
      return <DollarSign className="w-3.5 h-3.5" />;
    case 'awaiting_payment':
    case 'partial_paid':
      return <DollarSign className="w-3.5 h-3.5" />;
    case 'designing':
      return <Palette className="w-3.5 h-3.5" />;
    case 'awaiting_mockup_approval':
    case 'mockup_approved':
      return <Eye className="w-3.5 h-3.5" />;
    case 'awaiting_material':
    case 'material_ready':
      return <Package className="w-3.5 h-3.5" />;
    case 'queued':
      return <Clock className="w-3.5 h-3.5" />;
    case 'in_production':
      return <Factory className="w-3.5 h-3.5" />;
    case 'qc_pending':
    case 'qc_passed':
      return <ShieldCheck className="w-3.5 h-3.5" />;
    case 'ready_to_ship':
    case 'shipped':
    case 'delivered':
      return <Truck className="w-3.5 h-3.5" />;
    case 'completed':
      return <CheckCircle2 className="w-3.5 h-3.5" />;
    case 'cancelled':
    case 'on_hold':
      return <XCircle className="w-3.5 h-3.5" />;
    default:
      return <Clock className="w-3.5 h-3.5" />;
  }
}

// ---------------------------------------------
// Priority Badge Component
// ---------------------------------------------

function PriorityBadge({ code }: { code: PriorityCode }) {
  const config = PRIORITY_CONFIG[code];
  if (code === 'normal') return null;
  
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${config.bgColor} ${config.color}`}>
      <Zap className="w-3 h-3" />
      {config.label_th}
    </span>
  );
}

// ---------------------------------------------
// Production Mode Badge Component
// ---------------------------------------------

function ProductionModeBadge({ mode }: { mode: string }) {
  if (mode === 'in_house') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
        <Building2 className="w-3 h-3" />
        In-house
      </span>
    );
  }
  if (mode === 'outsource') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
        <User className="w-3 h-3" />
        Outsource
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
      Hybrid
    </span>
  );
}

// ---------------------------------------------
// Helper Functions
// ---------------------------------------------

function formatDate(date: string | null | undefined): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
  }).format(amount);
}

function isOverdue(order: Order): boolean {
  if (!order.due_date) return false;
  if (['completed', 'shipped', 'delivered', 'cancelled'].includes(order.status)) return false;
  return new Date(order.due_date) < new Date();
}

// ---------------------------------------------
// Loading Skeleton
// ---------------------------------------------

function TableSkeleton() {
  return (
    <>
      {[...Array(5)].map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="px-4 py-4">
            <div className="h-4 bg-gray-200 rounded w-28" />
          </td>
          <td className="px-4 py-4">
            <div className="h-4 bg-gray-200 rounded w-32 mb-1" />
            <div className="h-3 bg-gray-100 rounded w-20" />
          </td>
          <td className="px-4 py-4">
            <div className="h-6 bg-gray-200 rounded-full w-24" />
          </td>
          <td className="px-4 py-4">
            <div className="h-4 bg-gray-200 rounded w-20" />
          </td>
          <td className="px-4 py-4">
            <div className="h-4 bg-gray-200 rounded w-16" />
          </td>
          <td className="px-4 py-4">
            <div className="h-4 bg-gray-200 rounded w-20" />
          </td>
          <td className="px-4 py-4">
            <div className="h-4 bg-gray-200 rounded w-20" />
          </td>
          <td className="px-4 py-4">
            <div className="h-8 bg-gray-200 rounded w-16" />
          </td>
        </tr>
      ))}
    </>
  );
}

// ---------------------------------------------
// Empty State
// ---------------------------------------------

function EmptyState() {
  return (
    <tr>
      <td colSpan={8} className="px-4 py-16 text-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-[#F5F5F7] rounded-2xl flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-[#86868B]" />
          </div>
          <p className="text-[#1D1D1F] font-medium mb-1">ไม่พบออเดอร์</p>
          <p className="text-[#86868B] text-sm mb-4">ยังไม่มีออเดอร์ในระบบ</p>
          <Link href="/orders/create">
            <Button>
              สร้างออเดอร์ใหม่
            </Button>
          </Link>
        </div>
      </td>
    </tr>
  );
}

// ---------------------------------------------
// Main Component
// ---------------------------------------------

export function OrdersTable({ orders, loading, onCopyLink, onCancel }: OrdersTableProps) {
  return (
    <div className="apple-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#F5F5F7]/80">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#86868B] uppercase tracking-wide">
                เลขออเดอร์
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#86868B] uppercase tracking-wide">
                ลูกค้า
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#86868B] uppercase tracking-wide">
                สถานะ
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#86868B] uppercase tracking-wide">
                ยอดรวม
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#86868B] uppercase tracking-wide">
                ชำระแล้ว
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#86868B] uppercase tracking-wide">
                วันที่สั่ง
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#86868B] uppercase tracking-wide">
                กำหนดส่ง
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[#86868B] uppercase tracking-wide">
                จัดการ
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E8ED]">
            {loading ? (
              <TableSkeleton />
            ) : orders.length === 0 ? (
              <EmptyState />
            ) : (
              orders.map((order) => {
                const statusConfig = ORDER_STATUS_CONFIG[order.status];
                const orderIsOverdue = isOverdue(order);

                return (
                  <tr key={order.id} className="hover:bg-[#F5F5F7]/50 transition-colors">
                    {/* Order Number */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        <Link 
                          href={`/orders/${order.id}`} 
                          className="text-[#007AFF] hover:underline font-semibold"
                        >
                          {order.order_number}
                        </Link>
                        <div className="flex items-center gap-1">
                          <PriorityBadge code={order.priority_code} />
                          <ProductionModeBadge mode={order.production_mode} />
                        </div>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-4">
                      <div className="text-[#1D1D1F] font-medium">
                        {order.customer_snapshot?.name || 'ไม่ระบุลูกค้า'}
                      </div>
                      {order.customer_snapshot?.tier && (
                        <div className="text-xs text-[#86868B] capitalize">
                          {order.customer_snapshot.tier} member
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <span 
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig?.bgColor || 'bg-gray-100'} ${statusConfig?.color || 'text-gray-600'}`}
                      >
                        {getStatusIcon(order.status)}
                        {statusConfig?.label_th || order.status}
                      </span>
                    </td>

                    {/* Total Amount */}
                    <td className="px-4 py-4">
                      <span className="text-[#1D1D1F] font-semibold">
                        {formatCurrency(order.pricing.total_amount)}
                      </span>
                    </td>

                    {/* Paid Amount */}
                    <td className="px-4 py-4">
                      <div className={`font-medium ${
                        order.payment_status === 'paid' 
                          ? 'text-green-600' 
                          : order.payment_status === 'partial' 
                          ? 'text-amber-600' 
                          : 'text-[#86868B]'
                      }`}>
                        {formatCurrency(order.paid_amount)}
                      </div>
                      {order.payment_status !== 'paid' && order.pricing.total_amount > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <div className="h-1.5 w-16 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-amber-500 rounded-full transition-all"
                              style={{ 
                                width: `${Math.round((order.paid_amount / order.pricing.total_amount) * 100)}%` 
                              }}
                            />
                          </div>
                          <span className="text-[10px] text-[#86868B]">
                            {Math.round((order.paid_amount / order.pricing.total_amount) * 100)}%
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Order Date */}
                    <td className="px-4 py-4 text-[#1D1D1F]">
                      {formatDate(order.order_date)}
                    </td>

                    {/* Due Date */}
                    <td className="px-4 py-4">
                      <div className={`flex items-center gap-1 ${orderIsOverdue ? 'text-red-500 font-medium' : 'text-[#1D1D1F]'}`}>
                        {orderIsOverdue && <AlertCircle className="w-4 h-4" />}
                        {formatDate(order.due_date)}
                      </div>
                      {orderIsOverdue && (
                        <div className="text-[10px] text-red-500 mt-0.5">
                          เกินกำหนด
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/orders/${order.id}`}>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-[#86868B] hover:text-[#007AFF] h-8 w-8 p-0"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <ActionMenu 
                          order={order} 
                          onCopyLink={onCopyLink}
                          onCancel={onCancel}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

