'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Factory,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  ExternalLink,
  Zap,
  Package,
  Activity,
  Plus,
  Filter,
  ChevronRight,
  BarChart3,
  Percent,
} from 'lucide-react';
import { Button, Card, Input, Modal, Select, useToast } from '@/modules/shared/ui';
import {
  useERPProductionJobs,
  useERPProductionStations,
  useERPProductionStats,
  useERPProductionMutations,
} from '@/modules/erp';
import type { ProductionJob, ProductionJobStatus } from '@/modules/erp';

// Work Type Config
const WORK_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  dtf_printing: { label: 'DTF', color: 'bg-blue-500' },
  dtg_printing: { label: 'DTG', color: 'bg-cyan-500' },
  silkscreen: { label: 'สกรีน', color: 'bg-purple-500' },
  sublimation: { label: 'ซับลิเมชั่น', color: 'bg-pink-500' },
  embroidery: { label: 'ปัก', color: 'bg-amber-500' },
  sewing: { label: 'ตัดเย็บ', color: 'bg-green-500' },
  packing: { label: 'แพ็ค', color: 'bg-gray-500' },
  folding: { label: 'พับ', color: 'bg-slate-500' },
};

// Job Status Config
const JOB_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'รอคิว', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  queued: { label: 'เข้าคิว', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  assigned: { label: 'มอบหมายแล้ว', color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  in_progress: { label: 'กำลังผลิต', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  qc_check: { label: 'รอ QC', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  qc_passed: { label: 'QC ผ่าน', color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  qc_failed: { label: 'QC ไม่ผ่าน', color: 'text-red-600', bgColor: 'bg-red-100' },
  rework: { label: 'รอแก้ไข', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  completed: { label: 'เสร็จสิ้น', color: 'text-green-600', bgColor: 'bg-green-100' },
  cancelled: { label: 'ยกเลิก', color: 'text-gray-500', bgColor: 'bg-gray-100' },
};

// Priority Config
const PRIORITY_CONFIG: Record<number, { label: string; color: string }> = {
  0: { label: 'ปกติ', color: 'text-[#86868B]' },
  1: { label: 'เร่ง', color: 'text-[#FF9500]' },
  2: { label: 'ด่วน', color: 'text-[#FF3B30]' },
  3: { label: 'ด่วนมาก', color: 'text-[#AF52DE]' },
};

export default function ProductionPage() {
  const { success, error: showError } = useToast();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductionJobStatus[]>([]);
  const [workTypeFilter, setWorkTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<number | undefined>();

  // Data hooks
  const { jobs, loading, totalCount, refetch } = useERPProductionJobs({
    filters: {
      status: statusFilter.length > 0 ? statusFilter : undefined,
      work_type_code: workTypeFilter || undefined,
      priority: priorityFilter,
      search: searchTerm || undefined,
    },
  });

  const { stations } = useERPProductionStations();
  const { stats, refetch: refetchStats } = useERPProductionStats();
  const { updateJobStatus, assignJob, loading: mutationLoading } = useERPProductionMutations();

  // Modals
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<ProductionJob | null>(null);
  const [selectedStation, setSelectedStation] = useState('');

  // Format date
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
    });
  };

  // Quick actions for status change
  const getQuickActions = (job: ProductionJob) => {
    const actions: { label: string; status: string; icon: React.ReactNode; color: string }[] = [];

    switch (job.status) {
      case 'pending':
      case 'queued':
        actions.push({ label: 'เริ่มงาน', status: 'in_progress', icon: <Play className="w-3 h-3" />, color: 'bg-green-500' });
        break;
      case 'assigned':
        actions.push({ label: 'เริ่มผลิต', status: 'in_progress', icon: <Play className="w-3 h-3" />, color: 'bg-green-500' });
        break;
      case 'in_progress':
        actions.push({ label: 'ส่ง QC', status: 'qc_check', icon: <CheckCircle2 className="w-3 h-3" />, color: 'bg-blue-500' });
        break;
      case 'qc_check':
        actions.push({ label: 'ผ่าน', status: 'qc_passed', icon: <CheckCircle2 className="w-3 h-3" />, color: 'bg-green-500' });
        actions.push({ label: 'ไม่ผ่าน', status: 'qc_failed', icon: <XCircle className="w-3 h-3" />, color: 'bg-red-500' });
        break;
      case 'qc_passed':
        actions.push({ label: 'เสร็จสิ้น', status: 'completed', icon: <CheckCircle2 className="w-3 h-3" />, color: 'bg-emerald-500' });
        break;
      case 'qc_failed':
        actions.push({ label: 'แก้ไข', status: 'rework', icon: <RotateCcw className="w-3 h-3" />, color: 'bg-yellow-500' });
        break;
      case 'rework':
        actions.push({ label: 'เริ่มแก้ไข', status: 'in_progress', icon: <Play className="w-3 h-3" />, color: 'bg-green-500' });
        break;
    }

    return actions;
  };

  // Handle status change
  const handleStatusChange = async (jobId: string, newStatus: string) => {
    const result = await updateJobStatus(jobId, newStatus);
    if (result.success) {
      success(`เปลี่ยนสถานะเป็น "${JOB_STATUS_CONFIG[newStatus]?.label || newStatus}" แล้ว`);
      refetch();
      refetchStats();
    } else {
      showError(result.error || 'เกิดข้อผิดพลาด');
    }
  };

  // Handle assign
  const handleAssign = async () => {
    if (!selectedJob || !selectedStation) return;

    const result = await assignJob(selectedJob.id, selectedStation);
    if (result.success) {
      success('มอบหมายงานแล้ว');
      setShowAssignModal(false);
      setSelectedJob(null);
      setSelectedStation('');
      refetch();
    } else {
      showError(result.error || 'เกิดข้อผิดพลาด');
    }
  };

  // Toggle status filter
  const toggleStatusFilter = (status: ProductionJobStatus) => {
    setStatusFilter(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  // Compatible stations for selected job
  const compatibleStations = selectedJob
    ? stations.filter(s =>
        s.work_type_codes?.includes(selectedJob.work_type_code) &&
        s.status === 'active'
      )
    : [];

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* Header */}
      <div className="bg-white border-b border-[#E8E8ED] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#1D1D1F] flex items-center gap-3">
                <Factory className="w-7 h-7 text-[#FF9500]" />
                การผลิต
              </h1>
              <p className="text-sm text-[#86868B] mt-0.5">จัดการและติดตามงานผลิต</p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => { refetch(); refetchStats(); }}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                รีเฟรช
              </Button>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                สร้างงานใหม่
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="p-4 bg-white apple-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F5F5F7] flex items-center justify-center">
                <Package className="w-5 h-5 text-[#86868B]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1D1D1F]">{stats?.total_jobs || 0}</p>
                <p className="text-xs text-[#86868B]">งานทั้งหมด</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white apple-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F5F5F7] flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#86868B]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1D1D1F]">{stats?.pending_jobs || 0}</p>
                <p className="text-xs text-[#86868B]">รอคิว</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white apple-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F5F5F7] flex items-center justify-center">
                <Activity className="w-5 h-5 text-[#86868B]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#007AFF]">{stats?.in_progress_jobs || 0}</p>
                <p className="text-xs text-[#86868B]">กำลังผลิต</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white apple-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F5F5F7] flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-[#86868B]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#34C759]">{stats?.completed_today || 0}</p>
                <p className="text-xs text-[#86868B]">เสร็จวันนี้</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white apple-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F5F5F7] flex items-center justify-center">
                <Percent className="w-5 h-5 text-[#86868B]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1D1D1F]">{stats?.on_time_rate || 0}%</p>
                <p className="text-xs text-[#86868B]">ส่งทันเวลา</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 bg-white apple-card mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ค้นหาเลขงาน, ลูกค้า, รายละเอียด..."
                  className="pl-10"
                />
              </div>
            </div>

            <Select
              value={workTypeFilter}
              onChange={(e) => setWorkTypeFilter(e.target.value)}
              className="w-full lg:w-48"
            >
              <option value="">ประเภทงานทั้งหมด</option>
              {Object.entries(WORK_TYPE_CONFIG).map(([code, config]) => (
                <option key={code} value={code}>{config.label}</option>
              ))}
            </Select>

            <Select
              value={priorityFilter?.toString() || ''}
              onChange={(e) => setPriorityFilter(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full lg:w-40"
            >
              <option value="">ทุกความสำคัญ</option>
              {Object.entries(PRIORITY_CONFIG).map(([level, config]) => (
                <option key={level} value={level}>{config.label}</option>
              ))}
            </Select>
          </div>

          {/* Status Quick Filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="text-sm text-[#86868B] py-1.5">
              <Filter className="w-4 h-4 inline mr-1" />
              สถานะ:
            </span>
            {Object.entries(JOB_STATUS_CONFIG).map(([status, config]) => (
              <button
                key={status}
                onClick={() => toggleStatusFilter(status as ProductionJobStatus)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  statusFilter.includes(status as ProductionJobStatus)
                    ? `${config.bgColor} ${config.color}`
                    : 'bg-[#F5F5F7] text-[#86868B] hover:bg-[#E8E8ED]'
                }`}
              >
                {config.label}
              </button>
            ))}
            {statusFilter.length > 0 && (
              <button
                onClick={() => setStatusFilter([])}
                className="px-3 py-1.5 rounded-full text-xs font-medium text-[#007AFF] hover:bg-[#F5F5F7]"
              >
                ล้างตัวกรอง
              </button>
            )}
          </div>
        </Card>

        {/* Jobs List */}
        <Card className="bg-white apple-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E8E8ED] bg-[#F5F5F7]">
                  <th className="text-left py-3 px-4 text-xs font-medium text-[#86868B] uppercase tracking-wider">งาน</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-[#86868B] uppercase tracking-wider">ประเภท</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-[#86868B] uppercase tracking-wider">สถานะ</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-[#86868B] uppercase tracking-wider">จำนวน</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-[#86868B] uppercase tracking-wider">สถานี</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-[#86868B] uppercase tracking-wider">กำหนดส่ง</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-[#86868B] uppercase tracking-wider">การดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E8ED]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#86868B]">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                      กำลังโหลด...
                    </td>
                  </tr>
                ) : jobs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#86868B]">
                      <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-[#1D1D1F] font-medium">ไม่พบงานผลิต</p>
                      <p className="text-sm mt-1">สร้างงานใหม่หรือส่งงานจาก Order</p>
                    </td>
                  </tr>
                ) : (
                  jobs.map((job) => {
                    const statusConfig = JOB_STATUS_CONFIG[job.status] || JOB_STATUS_CONFIG.pending;
                    const priorityConfig = PRIORITY_CONFIG[job.priority] || PRIORITY_CONFIG[0];
                    const workTypeConfig = WORK_TYPE_CONFIG[job.work_type_code];
                    const quickActions = getQuickActions(job);
                    const progress = job.ordered_qty > 0
                      ? Math.round((job.produced_qty / job.ordered_qty) * 100)
                      : 0;
                    const isOverdue = job.due_date && new Date(job.due_date) < new Date() && job.status !== 'completed';

                    return (
                      <tr key={job.id} className="hover:bg-[#F5F5F7]/50 transition-colors">
                        {/* Job Info */}
                        <td className="py-3 px-4">
                          <div>
                            <Link
                              href={`/production/${job.id}`}
                              className="text-[#1D1D1F] font-medium hover:text-[#007AFF] flex items-center gap-1"
                            >
                              {job.job_number}
                              {isOverdue && <AlertTriangle className="w-3 h-3 text-[#FF3B30]" />}
                            </Link>
                            {job.order_number ? (
                              <Link
                                href={`/orders/${job.order_id}`}
                                className="text-xs text-[#86868B] hover:text-[#007AFF]"
                              >
                                {job.order_number} • {job.customer_name}
                              </Link>
                            ) : (
                              <div className="text-xs text-[#86868B]">
                                {job.customer_name || 'งาน Standalone'}
                              </div>
                            )}
                            {job.is_rework && (
                              <span className="inline-block mt-1 px-1.5 py-0.5 bg-pink-100 text-pink-600 text-xs rounded">
                                REWORK #{job.rework_count}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Work Type */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${workTypeConfig?.color || 'bg-gray-500'}`} />
                            <span className="text-[#1D1D1F] text-sm">
                              {workTypeConfig?.label || job.work_type_code}
                            </span>
                          </div>
                          {job.priority > 0 && (
                            <div className={`text-xs mt-0.5 ${priorityConfig.color}`}>
                              <Zap className="w-3 h-3 inline mr-0.5" />
                              {priorityConfig.label}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                        </td>

                        {/* Quantity */}
                        <td className="py-3 px-4">
                          <div className="text-[#1D1D1F] text-sm font-medium">
                            {job.produced_qty}/{job.ordered_qty}
                          </div>
                          <div className="w-16 h-1.5 bg-[#E8E8ED] rounded-full mt-1">
                            <div
                              className="h-full bg-[#007AFF] rounded-full transition-all"
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                          {job.passed_qty > 0 && (
                            <div className="text-xs text-[#34C759] mt-0.5">✓ {job.passed_qty}</div>
                          )}
                          {job.failed_qty > 0 && (
                            <div className="text-xs text-[#FF3B30]">✗ {job.failed_qty}</div>
                          )}
                        </td>

                        {/* Station */}
                        <td className="py-3 px-4">
                          {job.station ? (
                            <div className="text-sm">
                              <div className="text-[#1D1D1F] font-medium">{job.station.code}</div>
                              <div className="text-xs text-[#86868B]">{job.station.name}</div>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedJob(job);
                                setShowAssignModal(true);
                              }}
                              className="text-xs text-[#007AFF] hover:underline"
                            >
                              + มอบหมาย
                            </button>
                          )}
                        </td>

                        {/* Due Date */}
                        <td className="py-3 px-4">
                          <div className={`text-sm ${isOverdue ? 'text-[#FF3B30] font-medium' : 'text-[#1D1D1F]'}`}>
                            {formatDate(job.due_date)}
                          </div>
                          {job.started_at && (
                            <div className="text-xs text-[#86868B]">
                              เริ่ม: {formatDate(job.started_at)}
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1.5">
                            {quickActions.map((action, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleStatusChange(job.id, action.status)}
                                disabled={mutationLoading}
                                className={`flex items-center gap-1 px-2 py-1 rounded text-xs text-white ${action.color} hover:opacity-80 transition-opacity disabled:opacity-50`}
                              >
                                {action.icon}
                                <span className="hidden sm:inline">{action.label}</span>
                              </button>
                            ))}

                            <Link href={`/production/${job.id}`}>
                              <Button variant="ghost" size="sm" className="text-[#86868B] hover:text-[#1D1D1F] p-1.5">
                                <ChevronRight className="w-4 h-4" />
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalCount > 0 && (
            <div className="p-4 border-t border-[#E8E8ED] flex items-center justify-between">
              <div className="text-sm text-[#86868B]">
                แสดง {jobs.length} รายการ
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Assign Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setSelectedJob(null);
          setSelectedStation('');
        }}
        title="มอบหมายงาน"
      >
        <div className="p-4 space-y-4">
          {selectedJob && (
            <>
              <div className="bg-[#F5F5F7] rounded-xl p-4">
                <div className="text-[#1D1D1F] font-medium">{selectedJob.job_number}</div>
                <div className="text-sm text-[#86868B] mt-1">
                  {WORK_TYPE_CONFIG[selectedJob.work_type_code]?.label || selectedJob.work_type_code}
                  {' • '}
                  {selectedJob.ordered_qty} ชิ้น
                </div>
              </div>

              <div>
                <label className="block text-sm text-[#86868B] mb-2">เลือกสถานี</label>
                {compatibleStations.length === 0 ? (
                  <div className="text-sm text-[#FF9500] p-4 bg-[#FF9500]/5 rounded-xl border border-[#FF9500]/20">
                    ไม่มีสถานีที่รองรับงานประเภทนี้
                  </div>
                ) : (
                  <div className="space-y-2">
                    {compatibleStations.map((station) => (
                      <button
                        key={station.id}
                        onClick={() => setSelectedStation(station.id)}
                        className={`w-full p-3 rounded-xl border text-left transition-colors ${
                          selectedStation === station.id
                            ? 'border-[#007AFF] bg-[#007AFF]/5'
                            : 'border-[#E8E8ED] bg-white hover:border-[#86868B]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-[#1D1D1F] font-medium">{station.code}</div>
                            <div className="text-sm text-[#86868B]">{station.name}</div>
                          </div>
                          <span className={`text-xs ${
                            station.status === 'active' ? 'text-[#34C759]' : 'text-[#FF9500]'
                          }`}>
                            {station.status === 'active' ? 'ว่าง' : station.status}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedJob(null);
                    setSelectedStation('');
                  }}
                >
                  ยกเลิก
                </Button>
                <Button
                  onClick={handleAssign}
                  disabled={!selectedStation || mutationLoading}
                >
                  {mutationLoading ? 'กำลังบันทึก...' : 'มอบหมายงาน'}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Dev Mode Indicator */}
      <div className="fixed bottom-4 right-4">
        <div className="bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-lg">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
          Mock Data Mode
        </div>
      </div>
    </div>
  );
}
