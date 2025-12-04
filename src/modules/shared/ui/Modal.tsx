'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/modules/shared/utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm sm:max-w-md',
  md: 'max-w-sm sm:max-w-lg',
  lg: 'max-w-sm sm:max-w-2xl',
  xl: 'max-w-sm sm:max-w-4xl',
  full: 'max-w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-4rem)]',
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
}: ModalProps) {
  // Close on Escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        className={cn(
          'relative w-full bg-white rounded-2xl overflow-hidden animate-scale-in',
          'shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]',
          'max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)]',
          'flex flex-col',
          sizeClasses[size]
        )}
      >
        {/* Header - Fixed */}
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between p-4 sm:p-6 pb-0 flex-shrink-0">
            <div className="flex-1 min-w-0 pr-2">
              {title && (
                <h2 className="text-[16px] sm:text-[19px] font-semibold text-[#1D1D1F] truncate">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-[13px] sm:text-[14px] text-[#86868B] line-clamp-2">{description}</p>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 -mr-2 -mt-2 rounded-xl text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] transition-all duration-200 flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Body - Scrollable */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

// Modal Footer component for consistent button placement
interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3 pt-6 mt-2 border-t border-[#F5F5F7]',
        className
      )}
    >
      {children}
    </div>
  );
}
