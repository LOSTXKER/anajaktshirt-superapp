'use client';

import * as React from 'react';
import { cn } from '@/modules/shared/utils/cn';
import Link from 'next/link';
import { ArrowLeft, LucideIcon } from 'lucide-react';
import { Button } from './Button';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconColor?: string;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * PageHeader - ส่วนหัวของหน้า
 * 
 * @example
 * <PageHeader 
 *   title="ออเดอร์"
 *   description="จัดการออเดอร์ทั้งหมด"
 *   icon={ShoppingCart}
 *   iconColor="text-green-500"
 *   actions={<Button>สร้างออเดอร์</Button>}
 * />
 */
export function PageHeader({
  title,
  description,
  icon: Icon,
  iconColor = 'text-[#007AFF]',
  backHref,
  backLabel = 'กลับ',
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('mb-6', className)}>
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center text-[#86868B] hover:text-[#1D1D1F] text-sm mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          {backLabel}
        </Link>
      )}
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {Icon && <Icon className={cn('w-8 h-8', iconColor)} />}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#1D1D1F]">{title}</h1>
            {description && (
              <p className="text-[#86868B] mt-1">{description}</p>
            )}
          </div>
        </div>
        
        {actions && (
          <div className="flex flex-wrap gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * PageContainer - Container สำหรับหน้า
 */
interface PageContainerProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  className?: string;
}

export function PageContainer({ 
  children, 
  maxWidth = 'full',
  className 
}: PageContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-5xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-[1400px]',
    full: 'max-w-[1600px]',
  };

  return (
    <div className={cn(
      'p-4 md:p-6 lg:p-8 mx-auto',
      maxWidthClasses[maxWidth],
      className
    )}>
      {children}
    </div>
  );
}

/**
 * Section - Section พร้อม title
 */
interface SectionProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Section({ 
  title, 
  description, 
  actions, 
  children, 
  className 
}: SectionProps) {
  return (
    <section className={cn('mb-6', className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && (
              <h2 className="text-lg font-semibold text-[#1D1D1F]">{title}</h2>
            )}
            {description && (
              <p className="text-sm text-[#86868B]">{description}</p>
            )}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

