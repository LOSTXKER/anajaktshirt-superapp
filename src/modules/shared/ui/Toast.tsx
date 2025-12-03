'use client';

import * as React from 'react';
import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/modules/shared/utils/cn';

// Toast Types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Toast Context
interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Hook to use toast
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Toast Provider
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);

    // Auto remove after duration
    const duration = toast.duration ?? 4000;
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const success = useCallback((title: string, description?: string) => {
    addToast({ type: 'success', title, description });
  }, [addToast]);

  const error = useCallback((title: string, description?: string) => {
    addToast({ type: 'error', title, description, duration: 6000 });
  }, [addToast]);

  const warning = useCallback((title: string, description?: string) => {
    addToast({ type: 'warning', title, description });
  }, [addToast]);

  const info = useCallback((title: string, description?: string) => {
    addToast({ type: 'info', title, description });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

// Toast Container
function ToastContainer({ 
  toasts, 
  removeToast 
}: { 
  toasts: Toast[]; 
  removeToast: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-[420px] w-full pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Individual Toast Item
function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const config = {
    success: {
      icon: CheckCircle2,
      iconColor: 'text-[#34C759]',
      bgColor: 'bg-[#34C759]/10',
      borderColor: 'border-[#34C759]/20',
    },
    error: {
      icon: AlertCircle,
      iconColor: 'text-[#FF3B30]',
      bgColor: 'bg-[#FF3B30]/10',
      borderColor: 'border-[#FF3B30]/20',
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-[#FF9500]',
      bgColor: 'bg-[#FF9500]/10',
      borderColor: 'border-[#FF9500]/20',
    },
    info: {
      icon: Info,
      iconColor: 'text-[#007AFF]',
      bgColor: 'bg-[#007AFF]/10',
      borderColor: 'border-[#007AFF]/20',
    },
  };

  const { icon: Icon, iconColor, bgColor, borderColor } = config[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="pointer-events-auto"
    >
      <div 
        className={cn(
          'relative flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-xl',
          'bg-white/95 shadow-lg shadow-black/10',
          borderColor
        )}
      >
        {/* Icon */}
        <div className={cn('p-2 rounded-xl flex-shrink-0', bgColor)}>
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-[15px] font-semibold text-[#1D1D1F]">
            {toast.title}
          </p>
          {toast.description && (
            <p className="mt-1 text-[13px] text-[#86868B] leading-relaxed">
              {toast.description}
            </p>
          )}
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="mt-2 text-[13px] font-semibold text-[#007AFF] hover:underline"
            >
              {toast.action.label}
            </button>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

// Standalone Toast Component (for simple use without provider)
export interface SimpleToastProps {
  type: ToastType;
  title: string;
  description?: string;
  isVisible: boolean;
  onClose: () => void;
}

export function SimpleToast({ type, title, description, isVisible, onClose }: SimpleToastProps) {
  const config = {
    success: {
      icon: CheckCircle2,
      iconColor: 'text-[#34C759]',
      bgColor: 'bg-[#34C759]/10',
    },
    error: {
      icon: AlertCircle,
      iconColor: 'text-[#FF3B30]',
      bgColor: 'bg-[#FF3B30]/10',
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-[#FF9500]',
      bgColor: 'bg-[#FF9500]/10',
    },
    info: {
      icon: Info,
      iconColor: 'text-[#007AFF]',
      bgColor: 'bg-[#007AFF]/10',
    },
  };

  const { icon: Icon, iconColor, bgColor } = config[type];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-6 right-6 z-[100] max-w-[420px]"
        >
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/95 backdrop-blur-xl border border-[#E8E8ED] shadow-lg shadow-black/10">
            <div className={cn('p-2 rounded-xl', bgColor)}>
              <Icon className={cn('w-5 h-5', iconColor)} />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-[15px] font-semibold text-[#1D1D1F]">{title}</p>
              {description && (
                <p className="mt-1 text-[13px] text-[#86868B]">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Confirm Dialog (replacement for browser confirm)
export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'default' | 'danger';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'ยืนยัน',
  cancelText = 'ยกเลิก',
  type = 'default',
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-[400px] mx-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-6 text-center">
                {/* Icon */}
                <div className={cn(
                  'mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4',
                  type === 'danger' ? 'bg-[#FF3B30]/10' : 'bg-[#007AFF]/10'
                )}>
                  {type === 'danger' ? (
                    <AlertTriangle className="w-7 h-7 text-[#FF3B30]" />
                  ) : (
                    <Info className="w-7 h-7 text-[#007AFF]" />
                  )}
                </div>

                {/* Title */}
                <h3 className="text-[18px] font-semibold text-[#1D1D1F] mb-2">
                  {title}
                </h3>

                {/* Description */}
                {description && (
                  <p className="text-[14px] text-[#86868B] leading-relaxed">
                    {description}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex border-t border-[#E8E8ED]">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 py-4 text-[16px] font-medium text-[#007AFF] hover:bg-[#F5F5F7] transition-colors border-r border-[#E8E8ED] disabled:opacity-50"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={cn(
                    'flex-1 py-4 text-[16px] font-semibold transition-colors disabled:opacity-50',
                    type === 'danger' 
                      ? 'text-[#FF3B30] hover:bg-[#FF3B30]/10' 
                      : 'text-[#007AFF] hover:bg-[#007AFF]/10'
                  )}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      กำลังดำเนินการ...
                    </span>
                  ) : confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Alert Dialog (replacement for browser alert)
export interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  buttonText?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
}

export function AlertDialog({
  isOpen,
  onClose,
  title,
  description,
  buttonText = 'ตกลง',
  type = 'info',
}: AlertDialogProps) {
  const config = {
    success: { icon: CheckCircle2, color: 'text-[#34C759]', bg: 'bg-[#34C759]/10' },
    error: { icon: AlertCircle, color: 'text-[#FF3B30]', bg: 'bg-[#FF3B30]/10' },
    warning: { icon: AlertTriangle, color: 'text-[#FF9500]', bg: 'bg-[#FF9500]/10' },
    info: { icon: Info, color: 'text-[#007AFF]', bg: 'bg-[#007AFF]/10' },
  };

  const { icon: Icon, color, bg } = config[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-[360px] mx-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-6 text-center">
                <div className={cn('mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4', bg)}>
                  <Icon className={cn('w-7 h-7', color)} />
                </div>
                <h3 className="text-[18px] font-semibold text-[#1D1D1F] mb-2">
                  {title}
                </h3>
                {description && (
                  <p className="text-[14px] text-[#86868B] leading-relaxed">
                    {description}
                  </p>
                )}
              </div>

              <div className="border-t border-[#E8E8ED]">
                <button
                  onClick={onClose}
                  className="w-full py-4 text-[16px] font-semibold text-[#007AFF] hover:bg-[#F5F5F7] transition-colors"
                >
                  {buttonText}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

