'use client';

import {
  Clock,
  DollarSign,
  Calendar,
  AlertTriangle,
  ChevronRight,
  User,
  Package,
  Check,
  X,
  MessageSquare,
} from 'lucide-react';
import { Card, Button } from '@/modules/shared/ui';
import type { ChangeRequest } from '../../types/change-requests';
import {
  CHANGE_REQUEST_STATUS_CONFIG,
  CHANGE_TYPE_CONFIG,
  IMPACT_LEVEL_CONFIG,
} from '../../hooks/useERPChangeRequest';

// ---------------------------------------------
// Change Request Card (List View)
// ---------------------------------------------

interface ChangeRequestCardProps {
  changeRequest: ChangeRequest;
  onClick?: () => void;
  compact?: boolean;
}

export function ChangeRequestCard({
  changeRequest,
  onClick,
  compact = false,
}: ChangeRequestCardProps) {
  const statusConfig = CHANGE_REQUEST_STATUS_CONFIG[changeRequest.status as keyof typeof CHANGE_REQUEST_STATUS_CONFIG] || {
    label_th: changeRequest.status,
    color: 'bg-gray-100 text-gray-700',
  };

  const typeConfig = CHANGE_TYPE_CONFIG[changeRequest.change_type as keyof typeof CHANGE_TYPE_CONFIG] || {
    label_th: changeRequest.change_type,
    icon: '📝',
  };

  const impactConfig = IMPACT_LEVEL_CONFIG[changeRequest.impact.impact_level] || {
    label_th: 'ไม่ทราบ',
    color: 'bg-gray-100 text-gray-600',
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (compact) {
    return (
      <button
        onClick={onClick}
        className="w-full p-3 bg-white rounded-xl border border-[#E8E8ED] hover:border-[#007AFF]/30 transition-all text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{typeConfig.icon}</span>
            <div>
              <span className="text-sm font-medium text-[#1D1D1F]">{changeRequest.title}</span>
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${statusConfig.color}`}>
                {statusConfig.label_th}
              </span>
            </div>
          </div>
          {changeRequest.fees.total_fee > 0 && (
            <span className="text-sm font-bold text-[#FF9500]">
              {formatCurrency(changeRequest.fees.total_fee)}
            </span>
          )}
        </div>
      </button>
    );
  }

  return (
    <Card
      className="p-4 bg-white apple-card cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="w-12 h-12 bg-[#F5F5F7] rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-2xl">{typeConfig.icon}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-[#86868B]">{changeRequest.request_number}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${statusConfig.color}`}>
                  {statusConfig.label_th}
                </span>
              </div>
              <h3 className="font-semibold text-[#1D1D1F]">{changeRequest.title}</h3>
            </div>
            <ChevronRight className="w-5 h-5 text-[#86868B]" />
          </div>

          {/* Description */}
          <p className="text-sm text-[#86868B] mb-3 line-clamp-2">{changeRequest.description}</p>

          {/* Meta Info */}
          <div className="flex flex-wrap gap-3 text-xs text-[#86868B]">
            <span className="flex items-center gap-1">
              <Package className="w-3 h-3" />
              {changeRequest.order_number}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(changeRequest.created_at)}
            </span>
            <span className={`px-2 py-0.5 rounded-full ${impactConfig.color}`}>
              ผลกระทบ: {impactConfig.label_th}
            </span>
          </div>

          {/* Fee Info */}
          {changeRequest.fees.total_fee > 0 && (
            <div className="mt-3 pt-3 border-t border-[#E8E8ED] flex items-center justify-between">
              <span className="text-sm text-[#86868B]">ค่าใช้จ่ายเพิ่มเติม</span>
              <span className="text-lg font-bold text-[#FF9500]">
                {formatCurrency(changeRequest.fees.total_fee)}
              </span>
            </div>
          )}

          {/* Delay Warning */}
          {changeRequest.days_delayed > 0 && (
            <div className="mt-2 flex items-center gap-2 text-[#FF9500] text-sm">
              <AlertTriangle className="w-4 h-4" />
              ส่งช้า {changeRequest.days_delayed} วัน
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------
// Change Request Detail Card
// ---------------------------------------------

interface ChangeRequestDetailCardProps {
  changeRequest: ChangeRequest;
  onApprove?: () => void;
  onReject?: () => void;
  onQuote?: () => void;
}

export function ChangeRequestDetailCard({
  changeRequest,
  onApprove,
  onReject,
  onQuote,
}: ChangeRequestDetailCardProps) {
  const statusConfig = CHANGE_REQUEST_STATUS_CONFIG[changeRequest.status as keyof typeof CHANGE_REQUEST_STATUS_CONFIG] || {
    label_th: changeRequest.status,
    color: 'bg-gray-100 text-gray-700',
  };

  const typeConfig = CHANGE_TYPE_CONFIG[changeRequest.change_type as keyof typeof CHANGE_TYPE_CONFIG] || {
    label_th: changeRequest.change_type,
    icon: '📝',
  };

  const impactConfig = IMPACT_LEVEL_CONFIG[changeRequest.impact.impact_level] || {
    label_th: 'ไม่ทราบ',
    color: 'bg-gray-100 text-gray-600',
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="p-6 bg-white apple-card">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{typeConfig.icon}</span>
            <span className="text-sm text-[#86868B]">{changeRequest.request_number}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${statusConfig.color}`}>
              {statusConfig.label_th}
            </span>
          </div>
          <h2 className="text-xl font-bold text-[#1D1D1F]">{changeRequest.title}</h2>
        </div>
      </div>

      {/* Description */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-[#86868B] mb-2">รายละเอียด</h3>
        <p className="text-[#1D1D1F]">{changeRequest.description}</p>
        {changeRequest.customer_reason && (
          <div className="mt-2 p-3 bg-[#007AFF]/5 rounded-lg">
            <span className="text-xs text-[#86868B]">เหตุผลจากลูกค้า:</span>
            <p className="text-sm text-[#1D1D1F]">{changeRequest.customer_reason}</p>
          </div>
        )}
      </div>

      {/* Impact Assessment */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-[#86868B] mb-3">การประเมินผลกระทบ</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-[#F5F5F7] rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-[#FF9500]" />
              <span className="text-xs text-[#86868B]">ระดับผลกระทบ</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-sm ${impactConfig.color}`}>
              {impactConfig.label_th}
            </span>
          </div>
          <div className="p-3 bg-[#F5F5F7] rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-[#86868B]" />
              <span className="text-xs text-[#86868B]">ส่งช้า</span>
            </div>
            <span className="font-bold text-[#1D1D1F]">
              {changeRequest.days_delayed > 0 ? `${changeRequest.days_delayed} วัน` : 'ไม่มี'}
            </span>
          </div>
        </div>
      </div>

      {/* Fee Breakdown */}
      {changeRequest.fees.total_fee > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-[#86868B] mb-3">ค่าใช้จ่าย</h3>
          <div className="bg-[#F5F5F7] rounded-lg p-4 space-y-2">
            {changeRequest.fees.base_fee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[#86868B]">ค่าดำเนินการ</span>
                <span>{formatCurrency(changeRequest.fees.base_fee)}</span>
              </div>
            )}
            {changeRequest.fees.design_fee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[#86868B]">ค่าออกแบบ</span>
                <span>{formatCurrency(changeRequest.fees.design_fee)}</span>
              </div>
            )}
            {changeRequest.fees.material_fee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[#86868B]">ค่าวัสดุ</span>
                <span>{formatCurrency(changeRequest.fees.material_fee)}</span>
              </div>
            )}
            {changeRequest.fees.rework_fee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[#86868B]">ค่าทำใหม่</span>
                <span>{formatCurrency(changeRequest.fees.rework_fee)}</span>
              </div>
            )}
            {changeRequest.fees.other_fee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[#86868B]">{changeRequest.fees.other_fee_description || 'อื่นๆ'}</span>
                <span>{formatCurrency(changeRequest.fees.other_fee)}</span>
              </div>
            )}
            <div className="pt-2 mt-2 border-t border-[#E8E8ED] flex justify-between">
              <span className="font-bold text-[#1D1D1F]">รวม</span>
              <span className="font-bold text-[#FF9500] text-lg">
                {formatCurrency(changeRequest.fees.total_fee)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {changeRequest.status === 'pending_quote' && onQuote && (
          <Button onClick={onQuote} className="flex-1 gap-2">
            <DollarSign className="w-4 h-4" />
            เสนอราคา
          </Button>
        )}
        {changeRequest.status === 'awaiting_customer' && (
          <>
            <Button onClick={onApprove} className="flex-1 gap-2 bg-[#34C759] hover:bg-[#2DB84D]">
              <Check className="w-4 h-4" />
              ลูกค้าอนุมัติ
            </Button>
            <Button onClick={onReject} variant="secondary" className="flex-1 gap-2 text-[#FF3B30]">
              <X className="w-4 h-4" />
              ลูกค้าปฏิเสธ
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}

// ---------------------------------------------
// Change Request Stats Card
// ---------------------------------------------

import type { ChangeRequestStats } from '../../types/change-requests';

interface ChangeRequestStatsCardProps {
  stats: ChangeRequestStats;
}

export function ChangeRequestStatsCard({ stats }: ChangeRequestStatsCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <Card className="p-4 bg-white apple-card">
        <div className="text-2xl font-bold text-[#1D1D1F]">{stats.total_requests}</div>
        <div className="text-xs text-[#86868B]">คำขอทั้งหมด</div>
      </Card>
      <Card className="p-4 bg-[#FF9500]/10 apple-card">
        <div className="text-2xl font-bold text-[#FF9500]">{stats.pending_requests}</div>
        <div className="text-xs text-[#FF9500]">รอดำเนินการ</div>
      </Card>
      <Card className="p-4 bg-[#007AFF]/10 apple-card">
        <div className="text-2xl font-bold text-[#007AFF]">{stats.awaiting_customer}</div>
        <div className="text-xs text-[#007AFF]">รอลูกค้าตอบ</div>
      </Card>
      <Card className="p-4 bg-white apple-card">
        <div className="text-2xl font-bold text-[#1D1D1F]">{formatCurrency(stats.total_fees_quoted)}</div>
        <div className="text-xs text-[#86868B]">ยอดเสนอราคา</div>
      </Card>
      <Card className="p-4 bg-[#34C759]/10 apple-card">
        <div className="text-2xl font-bold text-[#34C759]">{formatCurrency(stats.total_fees_collected)}</div>
        <div className="text-xs text-[#34C759]">รับเงินแล้ว</div>
      </Card>
      <Card className="p-4 bg-white apple-card">
        <div className="text-2xl font-bold text-[#1D1D1F]">{stats.avg_resolution_days}</div>
        <div className="text-xs text-[#86868B]">วันเฉลี่ยแก้ไข</div>
      </Card>
    </div>
  );
}

