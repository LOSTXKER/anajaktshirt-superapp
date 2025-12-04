'use client';

import { ToastProvider } from '@/modules/shared/ui';
import { ERPProvider } from '@/modules/erp';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ERPProvider>
        {children}
      </ERPProvider>
    </ToastProvider>
  );
}

