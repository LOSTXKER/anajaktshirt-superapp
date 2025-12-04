'use client';

import * as React from 'react';
import { cn } from '@/modules/shared/utils/cn';

interface StatusBadgeProps {
  status: string;
  config?: Record<string, { label_th: string; color: string; bgColor: string }>;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * StatusBadge - แสดงสถานะแบบ Badge
 * 
 * @example
 * <StatusBadge status="pending" config={ORDER_STATUS_CONFIG} />
 */
export function StatusBadge({ status, config, size = 'md', className }: StatusBadgeProps) {
  const statusConfig = config?.[status] || {
    label_th: status,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full whitespace-nowrap',
        sizeClasses[size],
        statusConfig.bgColor,
        statusConfig.color,
        className
      )}
    >
      {statusConfig.label_th}
    </span>
  );
}

/**
 * PaymentStatusBadge - แสดงสถานะการชำระเงิน
 */
interface PaymentStatusBadgeProps {
  status: 'unpaid' | 'partial' | 'paid' | 'refunded' | 'overdue';
  paidAmount?: number;
  totalAmount?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PaymentStatusBadge({ 
  status, 
  paidAmount, 
  totalAmount, 
  size = 'md',
  className 
}: PaymentStatusBadgeProps) {
  const config = {
    unpaid: { label: 'ยังไม่ชำระ', color: 'text-gray-600', bgColor: 'bg-gray-100' },
    partial: { label: 'ชำระบางส่วน', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
    paid: { label: 'ชำระแล้ว', color: 'text-green-600', bgColor: 'bg-green-100' },
    refunded: { label: 'คืนเงินแล้ว', color: 'text-purple-600', bgColor: 'bg-purple-100' },
    overdue: { label: 'เกินกำหนด', color: 'text-red-600', bgColor: 'bg-red-100' },
  };

  const statusConfig = config[status];
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full whitespace-nowrap',
        sizeClasses[size],
        statusConfig.bgColor,
        statusConfig.color,
        className
      )}
    >
      {statusConfig.label}
      {status === 'partial' && paidAmount !== undefined && totalAmount !== undefined && (
        <span className="ml-1 opacity-75">
          ({Math.round((paidAmount / totalAmount) * 100)}%)
        </span>
      )}
    </span>
  );
}

/**
 * PriorityBadge - แสดง Priority
 */
interface PriorityBadgeProps {
  priority: 0 | 1 | 2;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PriorityBadge({ priority, size = 'md', className }: PriorityBadgeProps) {
  const config = {
    0: { label: 'ปกติ', color: 'text-gray-600', bgColor: 'bg-gray-100' },
    1: { label: 'เร่งด่วน', color: 'text-orange-600', bgColor: 'bg-orange-100' },
    2: { label: 'ด่วนมาก', color: 'text-red-600', bgColor: 'bg-red-100' },
  };

  if (priority === 0) return null; // Don't show badge for normal priority

  const priorityConfig = config[priority];
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full whitespace-nowrap',
        sizeClasses[size],
        priorityConfig.bgColor,
        priorityConfig.color,
        className
      )}
    >
      {priorityConfig.label}
    </span>
  );
}



