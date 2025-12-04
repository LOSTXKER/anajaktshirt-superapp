'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Filter, 
  ChevronDown,
  RefreshCw,
  SlidersHorizontal,
  Download,
  LayoutGrid,
  List,
} from 'lucide-react';
import { Button, Card, Input } from '@/modules/shared/ui';
import { 
  useERPOrders, 
  useERPOrderStats,
  OrderStatsCards,
  OrdersTable,
} from '@/modules/erp';
import type { OrderStatus, PriorityCode, SalesChannel } from '@/modules/erp';

export default function OrdersPageNew() {
  // Filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<PriorityCode | ''>('');
  const [channelFilter, setChannelFilter] = useState<SalesChannel | ''>('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Build filters object
  const filters = useMemo(() => ({
    search: search || undefined,
    status: statusFilter || undefined,
    priority_code: priorityFilter || undefined,
    sales_channel: channelFilter || undefined,
  }), [search, statusFilter, priorityFilter, channelFilter]);

  // Fetch data using ERP hooks
  const { orders, loading: ordersLoading, refetch } = useERPOrders({ filters });
  const { stats, loading: statsLoading } = useERPOrderStats();

  // Handler for copying customer link
  const handleCopyLink = (order: { access_token?: string }) => {
    if (order.access_token) {
      navigator.clipboard.writeText(`${window.location.origin}/order/${order.access_token}`);
      // TODO: Show toast notification
    }
  };

  // Handler for cancel order
  const handleCancel = (order: { id: string }) => {
    // TODO: Show confirmation modal
    console.log('Cancel order:', order.id);
  };

  // Status options
  const statusOptions = [
    { value: '', label: 'ทุกสถานะ' },
    { value: 'draft', label: 'ร่าง' },
    { value: 'quoted', label: 'เสนอราคาแล้ว' },
    { value: 'awaiting_payment', label: 'รอชำระเงิน' },
    { value: 'partial_paid', label: 'ชำระบางส่วน' },
    { value: 'designing', label: 'กำลังออกแบบ' },
    { value: 'awaiting_mockup_approval', label: 'รออนุมัติ Mockup' },
    { value: 'mockup_approved', label: 'อนุมัติ Mockup แล้ว' },
    { value: 'awaiting_material', label: 'รอวัตถุดิบ' },
    { value: 'queued', label: 'รอเข้าคิว' },
    { value: 'in_production', label: 'กำลังผลิต' },
    { value: 'qc_pending', label: 'รอ QC' },
    { value: 'ready_to_ship', label: 'พร้อมส่ง' },
    { value: 'shipped', label: 'จัดส่งแล้ว' },
    { value: 'completed', label: 'เสร็จสิ้น' },
    { value: 'cancelled', label: 'ยกเลิก' },
  ];

  const priorityOptions = [
    { value: '', label: 'ทุกความเร่งด่วน' },
    { value: 'normal', label: 'ปกติ' },
    { value: 'rush', label: 'เร่ง (+20%)' },
    { value: 'urgent', label: 'ด่วน (+50%)' },
    { value: 'emergency', label: 'ด่วนมาก (+100%)' },
  ];

  const channelOptions = [
    { value: '', label: 'ทุกช่องทาง' },
    { value: 'line', label: 'LINE' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'phone', label: 'โทรศัพท์' },
    { value: 'walk_in', label: 'Walk-in' },
    { value: 'website', label: 'Website' },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#1D1D1F] tracking-tight">ออเดอร์</h1>
            <p className="text-[#86868B] mt-1">จัดการออเดอร์และติดตามการผลิต</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="secondary" 
              onClick={() => refetch()}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              รีเฟรช
            </Button>
            <Link href="/orders/create">
              <Button className="gap-2 bg-[#007AFF] hover:bg-[#0066DB]">
                <Plus className="w-4 h-4" />
                สร้างออเดอร์ใหม่
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-8">
          <OrderStatsCards stats={stats} loading={statsLoading} />
        </div>

        {/* Filters Card */}
        <Card className="p-4 bg-white border border-[#E8E8ED] mb-6 apple-card">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
                <Input
                  placeholder="ค้นหาเลขออเดอร์ หรือ ชื่อลูกค้า..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-[#F5F5F7] border-0 focus:bg-white focus:ring-2 focus:ring-[#007AFF]/30"
                />
              </div>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as OrderStatus | '')}
                className="px-4 py-2 bg-[#F5F5F7] border-0 rounded-xl text-sm text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 transition-all"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as PriorityCode | '')}
                className="px-4 py-2 bg-[#F5F5F7] border-0 rounded-xl text-sm text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 transition-all"
              >
                {priorityOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <Button
                variant="secondary"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <SlidersHorizontal className="w-4 h-4" />
                ตัวกรองเพิ่มเติม
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </Button>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-[#F5F5F7] rounded-xl p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-[#86868B]'}`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-[#86868B]'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Extended Filters */}
          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-[#E8E8ED]">
              <div>
                <label className="block text-xs font-medium text-[#86868B] mb-1.5">ช่องทางขาย</label>
                <select
                  value={channelFilter}
                  onChange={(e) => setChannelFilter(e.target.value as SalesChannel | '')}
                  className="w-full px-3 py-2 bg-[#F5F5F7] border-0 rounded-xl text-sm text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                >
                  {channelOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#86868B] mb-1.5">วันที่สั่ง (จาก)</label>
                <Input type="date" className="bg-[#F5F5F7] border-0" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#86868B] mb-1.5">วันที่สั่ง (ถึง)</label>
                <Input type="date" className="bg-[#F5F5F7] border-0" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#86868B] mb-1.5">กำหนดส่ง</label>
                <Input type="date" className="bg-[#F5F5F7] border-0" />
              </div>
            </div>
          )}

          {/* Active Filters Count */}
          {(statusFilter || priorityFilter || channelFilter || search) && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#E8E8ED]">
              <span className="text-xs text-[#86868B]">
                กรองอยู่: {[statusFilter, priorityFilter, channelFilter, search].filter(Boolean).length} รายการ
              </span>
              <button 
                onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                  setPriorityFilter('');
                  setChannelFilter('');
                }}
                className="text-xs text-[#007AFF] hover:underline"
              >
                ล้างทั้งหมด
              </button>
            </div>
          )}
        </Card>

        {/* Orders Table */}
        <OrdersTable 
          orders={orders}
          loading={ordersLoading}
          onCopyLink={handleCopyLink}
          onCancel={handleCancel}
        />

        {/* Pagination */}
        {orders.length > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-[#86868B]">
              แสดง {orders.length} รายการ
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

        {/* Dev Mode Indicator */}
        <div className="fixed bottom-4 right-4">
          <div className="bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-lg">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            Mock Data Mode
          </div>
        </div>
      </div>
    </div>
  );
}

