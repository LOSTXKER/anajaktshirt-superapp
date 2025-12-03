'use client';

import { Button, Card, Input } from '@/modules/shared/ui';
import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Filter, 
  ChevronDown,
  Package,
  Clock,
  AlertCircle,
  CheckCircle2,
  Truck,
  XCircle,
  DollarSign,
  Eye,
  MoreVertical,
  Copy,
  Edit,
} from 'lucide-react';
import { useOrders, useOrderStats } from '@/modules/orders/hooks/useOrders';
import { ORDER_STATUS_CONFIG, type OrderStatus, type OrderFilters } from '@/modules/orders/types';

// Simple Action Menu Component
function ActionMenu({ orderId, accessToken }: { orderId: string; accessToken: string | null }) {
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
        className="text-[#86868B] hover:text-[#1D1D1F]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <MoreVertical className="w-4 h-4" />
      </Button>
      
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-[#E8E8ED] rounded-lg shadow-lg z-50 py-1">
          <Link 
            href={`/orders/${orderId}`}
            className="flex items-center gap-2 px-3 py-2 text-sm text-[#1D1D1F] hover:bg-[#F5F5F7]"
          >
            <Eye className="w-4 h-4" />
            ดูรายละเอียด
          </Link>
          <Link 
            href={`/orders/${orderId}/edit`}
            className="flex items-center gap-2 px-3 py-2 text-sm text-[#1D1D1F] hover:bg-[#F5F5F7]"
          >
            <Edit className="w-4 h-4" />
            แก้ไข
          </Link>
          {accessToken && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/order/${accessToken}`);
                setIsOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-[#1D1D1F] hover:bg-[#F5F5F7] w-full text-left"
            >
              <Copy className="w-4 h-4" />
              คัดลอกลิงก์ลูกค้า
            </button>
          )}
          <div className="border-t border-[#E8E8ED] my-1" />
          <button
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-[#F5F5F7] w-full text-left"
          >
            <XCircle className="w-4 h-4" />
            ยกเลิกออเดอร์
          </button>
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [showFilters, setShowFilters] = useState(false);

  const filters: OrderFilters = useMemo(() => ({
    search: search || undefined,
    status: statusFilter || undefined,
  }), [search, statusFilter]);

  const { orders, loading, totalCount } = useOrders(filters);
  const { stats } = useOrderStats();

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'draft':
        return <Clock className="w-4 h-4" />;
      case 'awaiting_payment':
      case 'partial_paid':
        return <DollarSign className="w-4 h-4" />;
      case 'designing':
      case 'awaiting_mockup_approval':
        return <Package className="w-4 h-4" />;
      case 'in_production':
      case 'qc_pending':
        return <Package className="w-4 h-4" />;
      case 'ready_to_ship':
      case 'shipped':
        return <Truck className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const statusOptions = [
    { value: '', label: 'ทุกสถานะ' },
    { value: 'draft', label: 'ร่าง' },
    { value: 'quoted', label: 'เสนอราคาแล้ว' },
    { value: 'awaiting_payment', label: 'รอชำระเงิน' },
    { value: 'partial_paid', label: 'ชำระบางส่วน' },
    { value: 'designing', label: 'กำลังออกแบบ' },
    { value: 'awaiting_mockup_approval', label: 'รอลูกค้าอนุมัติ' },
    { value: 'in_production', label: 'กำลังผลิต' },
    { value: 'qc_pending', label: 'รอ QC' },
    { value: 'ready_to_ship', label: 'พร้อมส่ง' },
    { value: 'shipped', label: 'จัดส่งแล้ว' },
    { value: 'completed', label: 'เสร็จสิ้น' },
    { value: 'cancelled', label: 'ยกเลิก' },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1D1D1F]">ออเดอร์</h1>
          <p className="text-[#86868B] mt-1">จัดการออเดอร์ทั้งหมด</p>
        </div>
        <Link href="/orders/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            สร้างออเดอร์ใหม่
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <Card className="p-4 bg-white border border-[#E8E8ED]">
          <div className="text-[#86868B] text-sm">ทั้งหมด</div>
          <div className="text-2xl font-bold text-[#1D1D1F] mt-1">{stats?.total_orders || 0}</div>
        </Card>
        <Card className="p-4 bg-white border border-[#E8E8ED]">
          <div className="text-[#86868B] text-sm">รอดำเนินการ</div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">{stats?.pending_orders || 0}</div>
        </Card>
        <Card className="p-4 bg-white border border-[#E8E8ED]">
          <div className="text-[#86868B] text-sm">กำลังผลิต</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{stats?.in_production || 0}</div>
        </Card>
        <Card className="p-4 bg-white border border-[#E8E8ED]">
          <div className="text-[#86868B] text-sm">พร้อมส่ง</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{stats?.ready_to_ship || 0}</div>
        </Card>
        <Card className="p-4 bg-white border border-[#E8E8ED]">
          <div className="text-[#86868B] text-sm">เกิน Due Date</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{stats?.overdue_orders || 0}</div>
        </Card>
        <Card className="p-4 bg-white border border-[#E8E8ED]">
          <div className="text-[#86868B] text-sm">ยอดรวม</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">
            {formatCurrency(stats?.total_revenue || 0)}
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-white border border-[#E8E8ED] mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
              <Input
                placeholder="ค้นหาเลขออเดอร์ หรือ ชื่อลูกค้า..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatus | '')}
              className="px-4 py-2 bg-[#F5F5F7] border border-[#E8E8ED] rounded-lg text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <Button
              variant="secondary"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              ตัวกรอง
              <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Extended Filters */}
        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-[#E8E8ED]">
            <div>
              <label className="block text-sm text-[#86868B] mb-1">วันที่สั่ง (จาก)</label>
              <Input type="date" />
            </div>
            <div>
              <label className="block text-sm text-[#86868B] mb-1">วันที่สั่ง (ถึง)</label>
              <Input type="date" />
            </div>
            <div>
              <label className="block text-sm text-[#86868B] mb-1">กำหนดส่ง (จาก)</label>
              <Input type="date" />
            </div>
            <div>
              <label className="block text-sm text-[#86868B] mb-1">กำหนดส่ง (ถึง)</label>
              <Input type="date" />
            </div>
          </div>
        )}
      </Card>

      {/* Orders Table */}
      <Card className="bg-white border border-[#E8E8ED] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F5F5F7]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#86868B] uppercase">เลขออเดอร์</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#86868B] uppercase">ลูกค้า</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#86868B] uppercase">สถานะ</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#86868B] uppercase">ยอดรวม</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#86868B] uppercase">ชำระแล้ว</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#86868B] uppercase">วันที่สั่ง</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#86868B] uppercase">กำหนดส่ง</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[#86868B] uppercase">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8ED]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-[#86868B]">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
                      กำลังโหลด...
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-[#86868B]">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>ไม่พบออเดอร์</p>
                    <Link href="/orders/create" className="text-[#007AFF] hover:underline">
                      สร้างออเดอร์ใหม่
                    </Link>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const statusConfig = ORDER_STATUS_CONFIG[order.status];
                  const isOverdue = order.due_date && new Date(order.due_date) < new Date() && 
                    !['completed', 'cancelled', 'shipped'].includes(order.status);

                  return (
                    <tr key={order.id} className="hover:bg-[#F5F5F7]">
                      <td className="px-4 py-3">
                        <Link href={`/orders/${order.id}`} className="text-[#007AFF] hover:underline font-medium">
                          {order.order_number}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[#1D1D1F]">{order.customer_name}</div>
                        {order.customer?.company_name && (
                          <div className="text-sm text-[#86868B]">{order.customer.company_name}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig?.bgColor || ''} ${statusConfig?.color || ''}`}>
                          {getStatusIcon(order.status)}
                          {statusConfig?.label_th}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#1D1D1F] font-medium">
                        {formatCurrency(order.total_amount)}
                      </td>
                      <td className="px-4 py-3">
                        <div className={order.payment_status === 'paid' ? 'text-green-600' : order.payment_status === 'partial' ? 'text-yellow-600' : 'text-[#86868B]'}>
                          {formatCurrency(order.paid_amount)}
                        </div>
                        {order.payment_status !== 'paid' && order.total_amount > 0 && (
                          <div className="text-xs text-[#86868B]">
                            ({Math.round((order.paid_amount / order.total_amount) * 100)}%)
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#1D1D1F]">
                        {formatDate(order.order_date)}
                      </td>
                      <td className="px-4 py-3">
                        <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-500' : 'text-[#1D1D1F]'}`}>
                          {isOverdue && <AlertCircle className="w-4 h-4" />}
                          {formatDate(order.due_date)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/orders/${order.id}`}>
                            <Button variant="ghost" size="sm" className="text-[#86868B] hover:text-[#1D1D1F]">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <ActionMenu orderId={order.id} accessToken={order.access_token} />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalCount > 0 && (
          <div className="px-4 py-3 border-t border-[#E8E8ED] flex items-center justify-between">
            <div className="text-sm text-[#86868B]">
              แสดง {orders.length} จาก {totalCount} รายการ
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled>
                ก่อนหน้า
              </Button>
              <Button variant="secondary" size="sm" disabled>
                ถัดไป
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
