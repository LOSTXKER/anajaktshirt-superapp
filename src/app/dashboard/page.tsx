'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  Factory,
  DollarSign,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  ArrowRight,
  Zap,
  CreditCard,
  Truck,
  AlertCircle,
  Activity,
  Calendar,
} from 'lucide-react';
import { Button, Card } from '@/modules/shared/ui';
import { useERPDashboard } from '@/modules/erp';

// Activity type icons
const ACTIVITY_ICONS: Record<string, { icon: React.ReactNode; color: string }> = {
  order: { icon: <Package className="w-4 h-4" />, color: 'bg-blue-100 text-blue-600' },
  production: { icon: <Factory className="w-4 h-4" />, color: 'bg-purple-100 text-purple-600' },
  payment: { icon: <CreditCard className="w-4 h-4" />, color: 'bg-green-100 text-green-600' },
  qc: { icon: <CheckCircle2 className="w-4 h-4" />, color: 'bg-amber-100 text-amber-600' },
};

export default function DashboardPage() {
  const { stats, recentActivities, upcomingDeadlines, loading, refetch } = useERPDashboard();

  // Format currency
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `฿${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `฿${(amount / 1000).toFixed(0)}K`;
    }
    return `฿${amount.toLocaleString()}`;
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* Header */}
      <div className="bg-white border-b border-[#E8E8ED] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#1D1D1F] flex items-center gap-3">
                <LayoutDashboard className="w-7 h-7 text-[#007AFF]" />
                Dashboard
              </h1>
              <p className="text-sm text-[#86868B] mt-0.5">ภาพรวมระบบ ERP</p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => refetch()}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                รีเฟรช
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading && !stats ? (
          <div className="text-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-[#007AFF]" />
            <p className="text-[#86868B]">กำลังโหลดข้อมูล...</p>
          </div>
        ) : (
          <>
            {/* Quick Stats Row 1 - Orders */}
            <div className="mb-6">
              <h2 className="text-sm font-medium text-[#86868B] mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                ออเดอร์
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                <StatCard
                  label="ทั้งหมด"
                  value={stats?.orders.total || 0}
                  href="/orders"
                />
                <StatCard
                  label="รอชำระ"
                  value={stats?.orders.pending || 0}
                  color="text-[#FF9500]"
                  href="/orders?status=awaiting_payment"
                />
                <StatCard
                  label="กำลังผลิต"
                  value={stats?.orders.in_production || 0}
                  color="text-[#007AFF]"
                  href="/orders?status=in_production"
                />
                <StatCard
                  label="พร้อมส่ง"
                  value={stats?.orders.ready_to_ship || 0}
                  color="text-[#34C759]"
                  href="/orders?status=ready_to_ship"
                />
                <StatCard
                  label="เสร็จวันนี้"
                  value={stats?.orders.completed_today || 0}
                  color="text-[#34C759]"
                />
                <StatCard
                  label="เกินกำหนด"
                  value={stats?.orders.overdue || 0}
                  color="text-[#FF3B30]"
                  alert={stats?.orders.overdue ? stats.orders.overdue > 0 : false}
                />
              </div>
            </div>

            {/* Quick Stats Row 2 - Revenue */}
            <div className="mb-6">
              <h2 className="text-sm font-medium text-[#86868B] mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                รายได้
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                  label="วันนี้"
                  value={formatCurrency(stats?.revenue.today || 0)}
                  isAmount
                  color="text-[#34C759]"
                />
                <StatCard
                  label="สัปดาห์นี้"
                  value={formatCurrency(stats?.revenue.this_week || 0)}
                  isAmount
                />
                <StatCard
                  label="เดือนนี้"
                  value={formatCurrency(stats?.revenue.this_month || 0)}
                  isAmount
                />
                <StatCard
                  label="รอชำระ"
                  value={formatCurrency(stats?.revenue.pending_payment || 0)}
                  isAmount
                  color="text-[#FF9500]"
                />
              </div>
            </div>

            {/* Quick Stats Row 3 - Production & Suppliers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Production */}
              <div>
                <h2 className="text-sm font-medium text-[#86868B] mb-3 flex items-center gap-2">
                  <Factory className="w-4 h-4" />
                  การผลิต
                </h2>
                <div className="grid grid-cols-3 gap-3">
                  <StatCard
                    label="กำลังผลิต"
                    value={stats?.production.in_progress_jobs || 0}
                    color="text-[#007AFF]"
                    href="/production?status=in_progress"
                    small
                  />
                  <StatCard
                    label="รอคิว"
                    value={stats?.production.pending_jobs || 0}
                    color="text-[#FF9500]"
                    href="/production?status=pending"
                    small
                  />
                  <StatCard
                    label="ส่งทันเวลา"
                    value={`${stats?.production.on_time_rate || 0}%`}
                    color="text-[#34C759]"
                    isAmount
                    small
                  />
                </div>
              </div>

              {/* Suppliers */}
              <div>
                <h2 className="text-sm font-medium text-[#86868B] mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Suppliers
                </h2>
                <div className="grid grid-cols-3 gap-3">
                  <StatCard
                    label="Active"
                    value={stats?.suppliers.active_suppliers || 0}
                    color="text-[#34C759]"
                    href="/suppliers"
                    small
                  />
                  <StatCard
                    label="PO รอ"
                    value={stats?.suppliers.pending_pos || 0}
                    color="text-[#FF9500]"
                    href="/suppliers?tab=po"
                    small
                  />
                  <StatCard
                    label="ค้างชำระ"
                    value={formatCurrency(stats?.suppliers.total_outstanding || 0)}
                    isAmount
                    color="text-[#FF3B30]"
                    small
                  />
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Activities */}
              <Card className="lg:col-span-2 p-0 bg-white apple-card overflow-hidden">
                <div className="px-4 py-3 border-b border-[#E8E8ED] flex items-center justify-between">
                  <h3 className="font-semibold text-[#1D1D1F] flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#007AFF]" />
                    กิจกรรมล่าสุด
                  </h3>
                </div>
                <div className="divide-y divide-[#E8E8ED]">
                  {recentActivities.map((activity) => {
                    const config = ACTIVITY_ICONS[activity.type] || ACTIVITY_ICONS.order;
                    return (
                      <div key={activity.id} className="px-4 py-3 hover:bg-[#F5F5F7]/50 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.color}`}>
                            {config.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-[#1D1D1F] text-sm">{activity.title}</span>
                              {activity.status === 'success' && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#34C759]" />
                              )}
                            </div>
                            <p className="text-sm text-[#86868B] truncate">{activity.description}</p>
                          </div>
                          <span className="text-xs text-[#86868B] whitespace-nowrap">{activity.timestamp}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Upcoming Deadlines */}
              <Card className="p-0 bg-white apple-card overflow-hidden">
                <div className="px-4 py-3 border-b border-[#E8E8ED] flex items-center justify-between">
                  <h3 className="font-semibold text-[#1D1D1F] flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#FF3B30]" />
                    กำหนดส่งใกล้ถึง
                  </h3>
                </div>
                <div className="divide-y divide-[#E8E8ED]">
                  {upcomingDeadlines.length === 0 ? (
                    <div className="px-4 py-8 text-center text-[#86868B]">
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">ไม่มีกำหนดส่งใกล้ถึง</p>
                    </div>
                  ) : (
                    upcomingDeadlines.map((deadline) => (
                      <Link
                        key={deadline.id}
                        href={deadline.type === 'order' ? `/orders/${deadline.id}` : `/production/${deadline.id}`}
                        className="block px-4 py-3 hover:bg-[#F5F5F7]/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-[#1D1D1F] text-sm">{deadline.reference}</span>
                              {deadline.priority > 0 && (
                                <Zap className={`w-3 h-3 ${
                                  deadline.priority >= 2 ? 'text-[#FF3B30]' : 'text-[#FF9500]'
                                }`} />
                              )}
                            </div>
                            <p className="text-xs text-[#86868B]">{deadline.customer}</p>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-medium ${
                              deadline.days_remaining <= 0 ? 'text-[#FF3B30]' :
                              deadline.days_remaining <= 2 ? 'text-[#FF9500]' :
                              'text-[#1D1D1F]'
                            }`}>
                              {deadline.days_remaining <= 0 ? (
                                <span className="flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  เกินกำหนด
                                </span>
                              ) : deadline.days_remaining === 1 ? (
                                'พรุ่งนี้'
                              ) : (
                                `${deadline.days_remaining} วัน`
                              )}
                            </div>
                            <p className="text-xs text-[#86868B]">{formatDate(deadline.due_date)}</p>
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </Card>
            </div>

            {/* Quick Links */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <QuickLink
                href="/orders/create"
                icon={<Package className="w-5 h-5" />}
                label="สร้างออเดอร์ใหม่"
                color="bg-[#007AFF]"
              />
              <QuickLink
                href="/production"
                icon={<Factory className="w-5 h-5" />}
                label="ดูงานผลิต"
                color="bg-[#FF9500]"
              />
              <QuickLink
                href="/suppliers"
                icon={<Building2 className="w-5 h-5" />}
                label="จัดการ Suppliers"
                color="bg-[#5856D6]"
              />
              <QuickLink
                href="/calculator"
                icon={<DollarSign className="w-5 h-5" />}
                label="คำนวณราคา"
                color="bg-[#34C759]"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------
// Sub Components
// ---------------------------------------------

function StatCard({
  label,
  value,
  color = 'text-[#1D1D1F]',
  href,
  isAmount = false,
  alert = false,
  small = false,
}: {
  label: string;
  value: string | number;
  color?: string;
  href?: string;
  isAmount?: boolean;
  alert?: boolean;
  small?: boolean;
}) {
  const content = (
    <Card className={`${small ? 'p-3' : 'p-4'} bg-white apple-card hover:shadow-md transition-shadow ${href ? 'cursor-pointer' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`${small ? 'text-xl' : 'text-2xl'} font-bold ${color}`}>
            {value}
          </p>
          <p className="text-xs text-[#86868B] mt-0.5">{label}</p>
        </div>
        {alert && (
          <AlertTriangle className="w-5 h-5 text-[#FF3B30]" />
        )}
        {href && !alert && (
          <ArrowRight className="w-4 h-4 text-[#86868B]" />
        )}
      </div>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

function QuickLink({
  href,
  icon,
  label,
  color,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  color: string;
}) {
  return (
    <Link href={href}>
      <Card className="p-4 bg-white apple-card hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${color} text-white flex items-center justify-center`}>
            {icon}
          </div>
          <span className="text-sm font-medium text-[#1D1D1F]">{label}</span>
        </div>
      </Card>
    </Link>
  );
}
