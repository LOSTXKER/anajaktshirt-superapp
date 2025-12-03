'use client';

import * as React from 'react';
import { cn } from '@/modules/shared/utils/cn';
import { 
  Package, 
  FileText, 
  Users, 
  ShoppingCart, 
  Factory,
  Inbox,
  Search,
  AlertCircle,
} from 'lucide-react';
import { Button } from './Button';

type IconType = 'package' | 'file' | 'users' | 'order' | 'factory' | 'inbox' | 'search' | 'alert';

const iconMap = {
  package: Package,
  file: FileText,
  users: Users,
  order: ShoppingCart,
  factory: Factory,
  inbox: Inbox,
  search: Search,
  alert: AlertCircle,
};

interface EmptyStateProps {
  icon?: IconType | React.ReactNode;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * EmptyState - แสดงเมื่อไม่มีข้อมูล
 * 
 * @example
 * <EmptyState 
 *   icon="order"
 *   title="ไม่พบออเดอร์"
 *   description="ยังไม่มีออเดอร์ในระบบ"
 *   action={{ label: 'สร้างออเดอร์', onClick: () => {} }}
 * />
 */
export function EmptyState({
  icon = 'inbox',
  title = 'ไม่พบข้อมูล',
  description,
  action,
  className,
}: EmptyStateProps) {
  const IconComponent = typeof icon === 'string' ? iconMap[icon as IconType] : null;

  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      {typeof icon === 'string' && IconComponent ? (
        <IconComponent className="w-16 h-16 text-[#86868B] opacity-50 mb-4" />
      ) : (
        <div className="mb-4">{icon}</div>
      )}
      
      <h3 className="text-lg font-semibold text-[#1D1D1F] mb-1">{title}</h3>
      
      {description && (
        <p className="text-sm text-[#86868B] max-w-sm">{description}</p>
      )}
      
      {action && (
        <Button onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  );
}

/**
 * LoadingState - แสดงขณะโหลดข้อมูล
 */
interface LoadingStateProps {
  text?: string;
  className?: string;
}

export function LoadingState({ text = 'กำลังโหลด...', className }: LoadingStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12', className)}>
      <div className="w-8 h-8 border-4 border-[#007AFF] border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-sm text-[#86868B]">{text}</p>
    </div>
  );
}

/**
 * ErrorState - แสดงเมื่อเกิดข้อผิดพลาด
 */
interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'เกิดข้อผิดพลาด',
  description = 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      <AlertCircle className="w-16 h-16 text-red-500 opacity-50 mb-4" />
      
      <h3 className="text-lg font-semibold text-[#1D1D1F] mb-1">{title}</h3>
      <p className="text-sm text-[#86868B] max-w-sm">{description}</p>
      
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} className="mt-4">
          ลองใหม่
        </Button>
      )}
    </div>
  );
}

