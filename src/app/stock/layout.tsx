'use client';

import { Sidebar } from '@/modules/shared/ui';
import { Bell, Search, Command } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StockLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <Sidebar />
      <div className="lg:pl-[260px]">
        {/* Top Header Bar */}
        <motion.header 
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-30 h-14 lg:h-16 bg-white/80 backdrop-blur-xl border-b border-[#E8E8ED] flex items-center justify-between px-4 pl-16 lg:pl-6 lg:px-8"
        >
          {/* Search - Hidden on small mobile */}
          <div className="hidden sm:flex items-center gap-3 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
              <input 
                type="text"
                placeholder="ค้นหา..."
                className="w-full h-10 pl-10 pr-12 rounded-xl bg-[#F5F5F7] border-0 text-[14px] placeholder:text-[#86868B] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 focus:bg-white transition-all"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#E8E8ED] text-[#86868B]">
                <Command className="w-3 h-3" />
                <span className="text-[10px] font-medium">K</span>
              </div>
            </div>
          </div>

          {/* Mobile Title */}
          <div className="sm:hidden flex-1">
            <h1 className="font-semibold text-[#1D1D1F]">เบิก/นำเข้า</h1>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 lg:gap-4">
            <button className="relative p-2 rounded-xl hover:bg-[#F5F5F7] transition-colors group">
              <Bell className="w-5 h-5 text-[#86868B] group-hover:text-[#1D1D1F]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FF3B30] rounded-full border-2 border-white" />
            </button>

            <div className="flex items-center gap-3 pl-2 lg:pl-4 border-l border-[#E8E8ED]">
              <div className="text-right hidden md:block">
                <p className="text-[13px] font-medium text-[#1D1D1F]">ผู้ดูแลระบบ</p>
                <p className="text-[11px] text-[#86868B]">Super Admin</p>
              </div>
              <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#00D4FF] flex items-center justify-center text-white font-semibold text-[12px] lg:text-[13px] shadow-lg shadow-[#007AFF]/20">
                AD
              </div>
            </div>
          </div>
        </motion.header>

        <main>
          {children}
        </main>
      </div>
    </div>
  );
}
