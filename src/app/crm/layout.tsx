'use client';

import { Sidebar } from '@/modules/shared/ui';
import { Bell, Search, Command } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CRMLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="lg:pl-[260px]">
        <motion.header 
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-40 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 flex items-center justify-between px-8"
        >
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="ค้นหา..."
                className="w-full h-10 pl-10 pr-12 rounded-xl bg-slate-100/80 border-0 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:bg-white transition-all"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-400">
                <Command className="w-3 h-3" />
                <span className="text-[10px] font-medium">K</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors group">
              <Bell className="w-5 h-5 text-slate-500 group-hover:text-slate-700" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>

            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900">ผู้ดูแลระบบ</p>
                <p className="text-xs text-slate-500">Super Admin</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-sky-500/20">
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
