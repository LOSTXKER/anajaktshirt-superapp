'use client';

import { ToastProvider } from '@/modules/shared/ui';
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
}

