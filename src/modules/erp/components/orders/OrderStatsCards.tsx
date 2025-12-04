'use client';

import { 
  Package, 
  Clock, 
  Truck, 
  AlertCircle, 
  DollarSign,
  Factory,
} from 'lucide-react';
import type { OrderStats } from '../../types/orders';

interface OrderStatsCardsProps {
  stats: OrderStats | null;
  loading?: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  variant?: 'default' | 'warning' | 'success';
  subtitle?: string;
  loading?: boolean;
}

function StatCard({ title, value, icon, variant = 'default', subtitle, loading }: StatCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm animate-pulse">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="h-3 bg-gray-100 rounded w-16" />
            <div className="h-7 bg-gray-100 rounded w-12" />
          </div>
          <div className="w-10 h-10 bg-gray-100 rounded-xl" />
        </div>
      </div>
    );
  }

  const valueColor = variant === 'warning' 
    ? 'text-amber-600' 
    : variant === 'success' 
    ? 'text-emerald-600' 
    : 'text-[#1D1D1F]';

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-[#86868B] uppercase tracking-wide">{title}</p>
          <p className={`text-2xl font-bold mt-1.5 ${valueColor}`}>{value}</p>
          {subtitle && (
            <p className="text-[11px] text-[#86868B] mt-1">{subtitle}</p>
          )}
        </div>
        <div className="p-2.5 rounded-xl bg-[#F5F5F7] text-[#86868B]">
          {icon}
        </div>
      </div>
    </div>
  );
}

function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `฿${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `฿${(amount / 1000).toFixed(0)}K`;
  }
  return `฿${amount.toLocaleString()}`;
}

export function OrderStatsCards({ stats, loading }: OrderStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <StatCard
        title="ทั้งหมด"
        value={stats?.total_orders || 0}
        icon={<Package className="w-5 h-5" />}
        loading={loading}
      />
      <StatCard
        title="รอดำเนินการ"
        value={stats?.pending_orders || 0}
        icon={<Clock className="w-5 h-5" />}
        variant={stats?.pending_orders ? 'warning' : 'default'}
        loading={loading}
      />
      <StatCard
        title="กำลังผลิต"
        value={stats?.in_production || 0}
        icon={<Factory className="w-5 h-5" />}
        loading={loading}
      />
      <StatCard
        title="พร้อมส่ง"
        value={stats?.ready_to_ship || 0}
        icon={<Truck className="w-5 h-5" />}
        variant={stats?.ready_to_ship ? 'success' : 'default'}
        loading={loading}
      />
      <StatCard
        title="เกินกำหนด"
        value={stats?.overdue_orders || 0}
        icon={<AlertCircle className="w-5 h-5" />}
        variant={stats?.overdue_orders ? 'warning' : 'default'}
        loading={loading}
      />
      <StatCard
        title="ยอดรวม"
        value={formatCurrency(stats?.total_revenue || 0)}
        icon={<DollarSign className="w-5 h-5" />}
        variant="success"
        subtitle={`เฉลี่ย ${formatCurrency(stats?.avg_order_value || 0)}/ออเดอร์`}
        loading={loading}
      />
    </div>
  );
}
