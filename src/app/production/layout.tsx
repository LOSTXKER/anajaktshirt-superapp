'use client';

import { Sidebar } from '@/modules/shared/ui';
export default function ProductionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <Sidebar />
      <main className="lg:pl-[260px] min-h-screen">
        {children}
      </main>
    </div>
  );
}
