'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Badge } from '@/modules/shared/ui';
import {
  Settings as SettingsIcon,
  Database,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import {
  getStorageStats,
  clearLocalStorage,
  initializeLocalStorage,
} from '@/modules/erp/storage/localStorage';
import { useERP } from '@/modules/erp';

const STORAGE_KEYS = {
  ORDERS: 'erp_orders',
  WORK_ITEMS: 'erp_work_items',
  PAYMENTS: 'erp_payments',
  PRODUCTION_JOBS: 'erp_production_jobs',
  PRODUCTION_STATIONS: 'erp_production_stations',
  SUPPLIERS: 'erp_suppliers',
  PURCHASE_ORDERS: 'erp_purchase_orders',
  CHANGE_REQUESTS: 'erp_change_requests',
  QC_RECORDS: 'erp_qc_records',
  QUOTATIONS: 'erp_quotations',
  INVOICES: 'erp_invoices',
  RECEIPTS: 'erp_receipts',
};

export default function SettingsPage() {
  const { stats, resetData } = useERP();
  const [storageStats, setStorageStats] = useState<Record<string, number>>({
    orders: 0,
    workItems: 0,
    productionJobs: 0,
    changeRequests: 0,
    qcRecords: 0,
    invoices: 0,
  });
  const [showConfirm, setShowConfirm] = useState<'clear' | 'reset' | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Load stats on client-side only
  useEffect(() => {
    setIsClient(true);
    setStorageStats(getStorageStats());
  }, []);

  const refreshStats = () => {
    if (typeof window !== 'undefined') {
      setStorageStats(getStorageStats());
    }
  };

  const handleExport = () => {
    const data: Record<string, any> = {};
    Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
      const item = localStorage.getItem(storageKey);
      if (item) {
        data[key] = JSON.parse(item);
      }
    });

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `erp-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setMessage({ type: 'success', text: 'ส่งออกข้อมูลสำเร็จ!' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
          if (data[key]) {
            localStorage.setItem(storageKey, JSON.stringify(data[key]));
          }
        });
        refreshStats();
        setMessage({ type: 'success', text: 'นำเข้าข้อมูลสำเร็จ! กรุณา Refresh หน้า' });
        setTimeout(() => window.location.reload(), 2000);
      } catch (error) {
        setMessage({ type: 'error', text: 'นำเข้าข้อมูลล้มเหลว! ไฟล์ไม่ถูกต้อง' });
        setTimeout(() => setMessage(null), 3000);
      }
    };
    reader.readAsText(file);
  };

  const handleClearAll = () => {
    clearLocalStorage();
    refreshStats();
    setShowConfirm(null);
    setMessage({ type: 'success', text: 'ลบข้อมูลทั้งหมดแล้ว! กรุณา Refresh หน้า' });
    setTimeout(() => window.location.reload(), 2000);
  };

  const handleReset = () => {
    resetData();
    refreshStats();
    setShowConfirm(null);
    setMessage({ type: 'success', text: 'รีเซ็ตข้อมูลสำเร็จ! กรุณา Refresh หน้า' });
    setTimeout(() => window.location.reload(), 2000);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getTotalSize = () => {
    if (typeof window === 'undefined') return '0 Bytes';
    let total = 0;
    Object.values(STORAGE_KEYS).forEach(key => {
      const item = localStorage.getItem(key);
      if (item) {
        total += new Blob([item]).size;
      }
    });
    return formatBytes(total);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* Header */}
      <div className="bg-white border-b border-[#E8E8ED] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#1D1D1F] flex items-center gap-3">
                <SettingsIcon className="w-7 h-7 text-[#007AFF]" />
                ตั้งค่าระบบ
              </h1>
              <p className="text-sm text-[#86868B] mt-0.5">จัดการข้อมูลและการตั้งค่า</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Message */}
        {message && (
          <div
            className={`p-4 rounded-xl flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        {/* Storage Stats */}
        <Card className="p-6 bg-white apple-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Database className="w-6 h-6 text-[#007AFF]" />
              <h2 className="text-xl font-bold text-[#1D1D1F]">สถิติการใช้งานข้อมูล</h2>
            </div>
            <Button variant="outline" size="sm" onClick={refreshStats}>
              <RefreshCw className="w-4 h-4 mr-2" />
              รีเฟรช
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-[#F5F5F7] rounded-xl">
              <p className="text-sm text-[#86868B]">ออเดอร์</p>
              <p className="text-2xl font-bold text-[#1D1D1F]">{storageStats.orders}</p>
            </div>
            <div className="p-4 bg-[#F5F5F7] rounded-xl">
              <p className="text-sm text-[#86868B]">งานผลิต</p>
              <p className="text-2xl font-bold text-[#1D1D1F]">{storageStats.productionJobs}</p>
            </div>
            <div className="p-4 bg-[#F5F5F7] rounded-xl">
              <p className="text-sm text-[#86868B]">รายการงาน</p>
              <p className="text-2xl font-bold text-[#1D1D1F]">{storageStats.workItems}</p>
            </div>
            <div className="p-4 bg-[#F5F5F7] rounded-xl">
              <p className="text-sm text-[#86868B]">ขนาดรวม</p>
              <p className="text-2xl font-bold text-[#1D1D1F]">{getTotalSize()}</p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium">ข้อมูลถูกเก็บใน Browser localStorage</p>
                <p className="mt-1 text-blue-600">
                  ข้อมูลจะอยู่ไปตลอดจนกว่าจะลบ cache หรือใช้ฟังก์ชัน "ลบข้อมูลทั้งหมด"
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Data Management */}
        <Card className="p-6 bg-white apple-card">
          <h2 className="text-xl font-bold text-[#1D1D1F] mb-4 flex items-center gap-3">
            <Database className="w-6 h-6 text-[#AF52DE]" />
            จัดการข้อมูล
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Export */}
            <div className="p-4 border border-[#E8E8ED] rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <Download className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#1D1D1F]">ส่งออกข้อมูล</h3>
                  <p className="text-sm text-[#86868B]">Backup ข้อมูลเป็นไฟล์ JSON</p>
                </div>
              </div>
              <Button className="w-full" variant="outline" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
            </div>

            {/* Import */}
            <div className="p-4 border border-[#E8E8ED] rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#1D1D1F]">นำเข้าข้อมูล</h3>
                  <p className="text-sm text-[#86868B]">Restore จากไฟล์ Backup</p>
                </div>
              </div>
              <div className="w-full">
                <input
                  id="import-file"
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
                <label htmlFor="import-file">
                  <Button className="w-full" variant="outline" onClick={() => document.getElementById('import-file')?.click()}>
                    <Upload className="w-4 h-4 mr-2" />
                    Import Data
                  </Button>
                </label>
              </div>
            </div>

            {/* Reset to Mock */}
            <div className="p-4 border border-[#E8E8ED] rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#1D1D1F]">รีเซ็ตเป็นข้อมูลตัวอย่าง</h3>
                  <p className="text-sm text-[#86868B]">คืนค่าเป็น Mock Data</p>
                </div>
              </div>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => setShowConfirm('reset')}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset to Mock Data
              </Button>
            </div>

            {/* Clear All */}
            <div className="p-4 border border-red-200 rounded-xl bg-red-50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-700">ลบข้อมูลทั้งหมด</h3>
                  <p className="text-sm text-red-600">ลบข้อมูลถาวร ไม่สามารถกู้คืนได้</p>
                </div>
              </div>
              <Button
                className="w-full"
                variant="destructive"
                onClick={() => setShowConfirm('clear')}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All Data
              </Button>
            </div>
          </div>
        </Card>

        {/* Confirmation Modal */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full p-6 bg-white">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-8 h-8 text-orange-500" />
                <h3 className="text-xl font-bold text-[#1D1D1F]">ยืนยันการดำเนินการ</h3>
              </div>
              <p className="text-[#86868B] mb-6">
                {showConfirm === 'clear'
                  ? 'คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลทั้งหมด? ข้อมูลจะหายและไม่สามารถกู้คืนได้'
                  : 'คุณแน่ใจหรือไม่ว่าต้องการรีเซ็ตข้อมูลเป็นข้อมูลตัวอย่าง? ข้อมูลปัจจุบันจะถูกแทนที่'}
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowConfirm(null)} className="flex-1">
                  ยกเลิก
                </Button>
                <Button
                  variant="destructive"
                  onClick={showConfirm === 'clear' ? handleClearAll : handleReset}
                  className="flex-1"
                >
                  {showConfirm === 'clear' ? 'ลบทั้งหมด' : 'รีเซ็ต'}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
