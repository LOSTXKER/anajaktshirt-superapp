'use client';

import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from '@/modules/shared/ui';
import { useState } from 'react';
import { useAuditLogs } from '@/modules/audit/hooks/useAuditLogs';
import { ACTION_LABELS, ENTITY_LABELS, AuditLogFilters } from '@/modules/audit/types';
import { 
  History, 
  User, 
  Calendar, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Search,
  FileText,
  RefreshCw
} from 'lucide-react';

export default function AuditLogsPage() {
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const { logs, loading, error, totalCount, page, setPage, totalPages, refetch } = useAuditLogs(filters);

  const handleFilterChange = (key: keyof AuditLogFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setPage(1);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold text-[#1D1D1F] flex items-center gap-3">
            <History className="w-8 h-8 text-[#007AFF]" />
            Audit Logs
          </h1>
          <p className="text-[#86868B] mt-1 text-[15px]">
            บันทึกกิจกรรมทั้งหมดในระบบ
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            ตัวกรอง
          </Button>
          <Button variant="outline" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            รีเฟรช
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-[13px] font-medium text-[#86868B] mb-1.5">
                  การกระทำ
                </label>
                <select
                  value={filters.action || ''}
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#F5F5F7] border-0 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                >
                  <option value="">ทั้งหมด</option>
                  {Object.entries(ACTION_LABELS).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#86868B] mb-1.5">
                  ประเภทข้อมูล
                </label>
                <select
                  value={filters.entity_type || ''}
                  onChange={(e) => handleFilterChange('entity_type', e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#F5F5F7] border-0 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                >
                  <option value="">ทั้งหมด</option>
                  {Object.entries(ENTITY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#86868B] mb-1.5">
                  วันที่เริ่มต้น
                </label>
                <Input
                  type="date"
                  value={filters.date_from || ''}
                  onChange={(e) => handleFilterChange('date_from', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#86868B] mb-1.5">
                  วันที่สิ้นสุด
                </label>
                <Input
                  type="date"
                  value={filters.date_to || ''}
                  onChange={(e) => handleFilterChange('date_to', e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button variant="ghost" onClick={clearFilters} className="text-[#86868B]">
                ล้างตัวกรอง
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-[14px] text-[#86868B]">
        <span>พบ <strong className="text-[#1D1D1F]">{totalCount.toLocaleString()}</strong> รายการ</span>
        {totalPages > 1 && (
          <span>หน้า {page} จาก {totalPages}</span>
        )}
      </div>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-[400px]">
              <div className="w-8 h-8 rounded-full border-2 border-[#E8E8ED] border-t-[#007AFF] animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-[400px] text-red-500">
              <p>เกิดข้อผิดพลาด: {error}</p>
              <Button variant="outline" onClick={() => refetch()} className="mt-4">
                ลองอีกครั้ง
              </Button>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[400px] text-[#86868B]">
              <FileText className="w-16 h-16 text-[#D2D2D7] mb-4" />
              <p className="font-medium">ไม่พบรายการ</p>
              <p className="text-[13px] mt-1">ยังไม่มี audit log ในระบบ</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F5F5F7] border-b border-[#E8E8ED]">
                  <tr>
                    <th className="px-4 py-3 text-left text-[13px] font-semibold text-[#86868B]">
                      เวลา
                    </th>
                    <th className="px-4 py-3 text-left text-[13px] font-semibold text-[#86868B]">
                      ผู้ใช้
                    </th>
                    <th className="px-4 py-3 text-left text-[13px] font-semibold text-[#86868B]">
                      การกระทำ
                    </th>
                    <th className="px-4 py-3 text-left text-[13px] font-semibold text-[#86868B]">
                      ประเภท
                    </th>
                    <th className="px-4 py-3 text-left text-[13px] font-semibold text-[#86868B]">
                      รายละเอียด
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E8ED]">
                  {logs.map((log) => {
                    const actionConfig = ACTION_LABELS[log.action] || { label: log.action, color: 'bg-gray-100 text-gray-700' };
                    const entityLabel = ENTITY_LABELS[log.entity_type] || log.entity_type;

                    return (
                      <tr key={log.id} className="hover:bg-[#F5F5F7]/50 transition-colors">
                        <td className="px-4 py-3 text-[13px] text-[#86868B] whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {formatDate(log.created_at)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[#007AFF]/10 flex items-center justify-center">
                              <User className="w-4 h-4 text-[#007AFF]" />
                            </div>
                            <div>
                              <p className="text-[14px] font-medium text-[#1D1D1F]">
                                {log.user?.full_name || 'ไม่ระบุ'}
                              </p>
                              <p className="text-[12px] text-[#86868B]">
                                {log.user?.email || '-'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={actionConfig.color}>
                            {actionConfig.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-[14px] text-[#1D1D1F]">
                          {entityLabel}
                        </td>
                        <td className="px-4 py-3 text-[13px] text-[#86868B] max-w-[300px]">
                          {log.entity_id && (
                            <span className="text-[#007AFF]">ID: {log.entity_id.slice(0, 8)}...</span>
                          )}
                          {log.new_data && (
                            <details className="mt-1">
                              <summary className="cursor-pointer text-[#007AFF] hover:underline">
                                ดูข้อมูล
                              </summary>
                              <pre className="mt-2 p-2 bg-[#F5F5F7] rounded text-[11px] overflow-x-auto max-h-[200px]">
                                {JSON.stringify(log.new_data, null, 2)}
                              </pre>
                            </details>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#E8E8ED]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                ก่อนหน้า
              </Button>

              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-[14px] font-medium transition-colors ${
                        page === pageNum
                          ? 'bg-[#007AFF] text-white'
                          : 'text-[#86868B] hover:bg-[#F5F5F7]'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                ถัดไป
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

