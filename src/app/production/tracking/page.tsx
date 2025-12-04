'use client';

import { Badge, Button, Card, Input, Modal, Select, useToast } from '@/modules/shared/ui';
import { useState, useMemo } from 'react';
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
  Activity
} from 'lucide-react';
import { 
  useProductionJobs, 
  useProductionStations, 
  useProductionStats 
} from '@/modules/production/hooks/useProductionTracking';
import { useProductionTrackingMutations } from '@/modules/production/hooks/useProductionTrackingMutations';
import { 
  JOB_STATUS_CONFIG, 
  PRIORITY_CONFIG, 
  type ProductionJobStatus,
  type ProductionJob,
  type JobPriority,
} from '@/modules/production/types/tracking';

// Work Type Config
const WORK_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  DTG: { label: 'DTG', color: 'bg-cyan-500' },
  DTF: { label: 'DTF', color: 'bg-blue-500' },
  SILKSCREEN: { label: 'สกรีน', color: 'bg-purple-500' },
  SUBLIMATION: { label: 'ซับลิเมชั่น', color: 'bg-pink-500' },
  EMBROIDERY: { label: 'ปัก', color: 'bg-amber-500' },
  EMBROIDERY_BADGE: { label: 'ปักแผง', color: 'bg-orange-500' },
  SEWING: { label: 'เย็บ', color: 'bg-green-500' },
  CUTTING: { label: 'ตัด', color: 'bg-red-500' },
  PACKAGING: { label: 'แพ็ค', color: 'bg-gray-500' },
};

export default function ProductionTrackingPage() {
  const { success, error: showError } = useToast();
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductionJobStatus[]>([]);
  const [workTypeFilter, setWorkTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<number | undefined>();
  
  // Data
  const { jobs, loading, totalCount, refetch } = useProductionJobs({
    status: statusFilter.length > 0 ? statusFilter : undefined,
    work_type_code: workTypeFilter || undefined,
    priority: priorityFilter as JobPriority | undefined,
    search: searchTerm || undefined,
    limit: 50,
  });
  
  const { stations } = useProductionStations();
  const { stats, refetch: refetchStats } = useProductionStats();
  const { updateJobStatus, assignJob, loading: mutationLoading } = useProductionTrackingMutations();
  
  // Modals
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<ProductionJob | null>(null);
  const [selectedStation, setSelectedStation] = useState('');
  
  // Quick status buttons config
  const getQuickActions = (job: ProductionJob) => {
    const actions: { label: string; status: ProductionJobStatus; icon: React.ReactNode; color: string }[] = [];
    
    switch (job.status) {
      case 'pending':
      case 'queued':
        actions.push({ label: 'เริ่มงาน', status: 'in_progress', icon: <Play className="w-4 h-4" />, color: 'bg-green-500' });
        break;
      case 'assigned':
        actions.push({ label: 'เริ่มผลิต', status: 'in_progress', icon: <Play className="w-4 h-4" />, color: 'bg-green-500' });
        break;
      case 'in_progress':
        actions.push({ label: 'ส่ง QC', status: 'qc_check', icon: <CheckCircle2 className="w-4 h-4" />, color: 'bg-blue-500' });
        break;
      case 'qc_check':
        actions.push({ label: 'ผ่าน QC', status: 'qc_passed', icon: <CheckCircle2 className="w-4 h-4" />, color: 'bg-green-500' });
        actions.push({ label: 'ไม่ผ่าน', status: 'qc_failed', icon: <XCircle className="w-4 h-4" />, color: 'bg-red-500' });
        break;
      case 'qc_passed':
        actions.push({ label: 'เสร็จสิ้น', status: 'completed', icon: <CheckCircle2 className="w-4 h-4" />, color: 'bg-emerald-500' });
        break;
      case 'qc_failed':
        actions.push({ label: 'แก้ไข', status: 'rework', icon: <RotateCcw className="w-4 h-4" />, color: 'bg-yellow-500' });
        break;
      case 'rework':
        actions.push({ label: 'เริ่มแก้ไข', status: 'in_progress', icon: <Play className="w-4 h-4" />, color: 'bg-green-500' });
        break;
    }
    
    return actions;
  };
  
  // Handle status change
  const handleStatusChange = async (jobId: string, newStatus: ProductionJobStatus) => {
    const result = await updateJobStatus(jobId, newStatus);
    if (result.success) {
      success(`เปลี่ยนสถานะเป็น "${JOB_STATUS_CONFIG[newStatus].label_th}" แล้ว`);
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
  
  // Format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
    });
  };
  
  // Filter compatible stations
  const compatibleStations = useMemo(() => {
    if (!selectedJob) return [];
    return stations.filter(s => 
      s.work_type_codes?.includes(selectedJob.work_type_code) && 
      s.status === 'active'
    );
  }, [selectedJob, stations]);
  
  // Toggle status filter
  const toggleStatusFilter = (status: ProductionJobStatus) => {
    setStatusFilter(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };
  
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1D1D1F] flex items-center gap-3">
            <Factory className="w-8 h-8 text-orange-500" />
            Production Tracking
          </h1>
          <p className="text-[#86868B] mt-1">ติดตามสถานะงานผลิตทั้งหมด</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            onClick={() => { refetch(); refetchStats(); }}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            รีเฟรช
          </Button>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card className="p-4 bg-white border border-[#E8E8ED]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1D1D1F]">{stats?.total_jobs || 0}</p>
              <p className="text-xs text-[#86868B]">งานทั้งหมด</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-white border border-[#E8E8ED]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1D1D1F]">{stats?.pending_jobs || 0}</p>
              <p className="text-xs text-[#86868B]">รอคิว</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-white border border-[#E8E8ED]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Activity className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1D1D1F]">{stats?.in_progress_jobs || 0}</p>
              <p className="text-xs text-[#86868B]">กำลังผลิต</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-white border border-[#E8E8ED]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1D1D1F]">{stats?.completed_today || 0}</p>
              <p className="text-xs text-[#86868B]">เสร็จวันนี้</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-white border border-[#E8E8ED]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1D1D1F]">{stats?.qc_failed_today || 0}</p>
              <p className="text-xs text-[#86868B]">ไม่ผ่าน QC</p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Filters */}
      <Card className="p-4 bg-white border border-[#E8E8ED] mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหาเลขงาน, ประเภทงาน..."
                className="pl-10"
              />
            </div>
          </div>
          
          {/* Work Type */}
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
          
          {/* Priority */}
          <Select
            value={priorityFilter?.toString() || ''}
            onChange={(e) => setPriorityFilter(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full lg:w-40"
          >
            <option value="">ทุกลำดับความสำคัญ</option>
            <option value="2">ด่วนมาก</option>
            <option value="1">เร่งด่วน</option>
            <option value="0">ปกติ</option>
          </Select>
        </div>
        
        {/* Status Filters */}
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="text-sm text-[#86868B] py-1">สถานะ:</span>
          {Object.entries(JOB_STATUS_CONFIG).map(([status, config]) => (
            <button
              key={status}
              onClick={() => toggleStatusFilter(status as ProductionJobStatus)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                statusFilter.includes(status as ProductionJobStatus)
                  ? `${config.bgColor} ${config.color}`
                  : 'bg-[#F5F5F7] text-[#86868B] hover:bg-[#E8E8ED]'
              }`}
            >
              {config.label_th}
            </button>
          ))}
          {statusFilter.length > 0 && (
            <button
              onClick={() => setStatusFilter([])}
              className="px-3 py-1 rounded-full text-xs font-medium text-[#86868B] hover:text-[#1D1D1F]"
            >
              ล้างตัวกรอง
            </button>
          )}
        </div>
      </Card>
      
      {/* Jobs Table */}
      <Card className="bg-white border border-[#E8E8ED] overflow-hidden">
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
                  <td colSpan={7} className="py-8 text-center text-[#86868B]">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    กำลังโหลด...
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#86868B]">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    ไม่พบงานผลิต
                  </td>
                </tr>
              ) : (
                jobs.map((job) => {
                  const statusConfig = JOB_STATUS_CONFIG[job.status];
                  const priorityConfig = PRIORITY_CONFIG[job.priority];
                  const workTypeConfig = WORK_TYPE_CONFIG[job.work_type_code];
                  const quickActions = getQuickActions(job);
                  const progress = job.ordered_qty > 0 
                    ? Math.round((job.produced_qty / job.ordered_qty) * 100)
                    : 0;
                  
                  return (
                    <tr key={job.id} className="hover:bg-[#F5F5F7] transition-colors">
                      {/* Job Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-start gap-3">
                          <div>
                            <Link 
                              href={`/production/tracking/${job.id}`}
                              className="text-[#1D1D1F] font-medium hover:text-[#007AFF]"
                            >
                              {job.job_number}
                            </Link>
                            {job.order && (
                              <div className="flex items-center gap-1 mt-1">
                                <Link
                                  href={`/orders/${job.order.id}`}
                                  className="text-xs text-[#86868B] hover:text-[#007AFF]"
                                >
                                  {job.order.order_number}
                                </Link>
                                <span className="text-[#E8E8ED]">•</span>
                                <span className="text-xs text-[#86868B]">{job.order.customer_name}</span>
                              </div>
                            )}
                            {job.is_rework && (
                              <Badge className="bg-pink-100 text-pink-600 text-xs mt-1">
                                REWORK #{job.rework_count}
                              </Badge>
                            )}
                          </div>
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
                          <div className={`text-xs mt-1 ${priorityConfig?.color || ''}`}>
                            <Zap className="w-3 h-3 inline mr-1" />
                            {priorityConfig?.label_th}
                          </div>
                        )}
                      </td>
                      
                      {/* Status */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig?.bgColor || ''} ${statusConfig?.color || ''}`}>
                          {statusConfig?.label_th}
                        </span>
                      </td>
                      
                      {/* Quantity + Progress */}
                      <td className="py-3 px-4">
                        <div className="text-[#1D1D1F] text-sm">
                          {job.produced_qty || 0}/{job.ordered_qty || job.quantity || 0}
                        </div>
                        <div className="w-20 h-1.5 bg-[#E8E8ED] rounded-full mt-1">
                          <div 
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        {(job.passed_qty || 0) > 0 && (
                          <div className="text-xs text-green-600 mt-0.5">
                            ผ่าน QC: {job.passed_qty}
                          </div>
                        )}
                        {(job.failed_qty || 0) > 0 && (
                          <div className="text-xs text-red-600">
                            ไม่ผ่าน: {job.failed_qty}
                          </div>
                        )}
                      </td>
                      
                      {/* Station */}
                      <td className="py-3 px-4">
                        {job.station ? (
                          <div className="text-sm">
                            <div className="text-[#1D1D1F]">{job.station.code}</div>
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
                        <div className="text-sm text-[#1D1D1F]">{formatDate(job.due_date)}</div>
                        {job.started_at && (
                          <div className="text-xs text-[#86868B]">
                            เริ่ม: {formatDate(job.started_at)}
                          </div>
                        )}
                      </td>
                      
                      {/* Actions */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          {quickActions.map((action, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleStatusChange(job.id, action.status)}
                              disabled={mutationLoading}
                              className={`flex items-center gap-1 px-2 py-1 rounded text-xs text-[#1D1D1F] ${action.color} hover:opacity-80 transition-opacity disabled:opacity-50`}
                            >
                              {action.icon}
                              <span className="hidden sm:inline">{action.label}</span>
                            </button>
                          ))}
                          
                          <Link href={`/production/tracking/${job.id}`}>
                            <Button variant="ghost" size="sm" className="text-[#86868B] hover:text-[#1D1D1F]">
                              <ExternalLink className="w-4 h-4" />
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
        {totalCount > 50 && (
          <div className="p-4 border-t border-[#E8E8ED] flex items-center justify-between">
            <div className="text-sm text-[#86868B]">
              แสดง {jobs.length} จาก {totalCount} รายการ
            </div>
          </div>
        )}
      </Card>
      
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
              <div className="bg-[#F5F5F7] rounded-lg p-4">
                <div className="text-[#1D1D1F] font-medium">{selectedJob.job_number}</div>
                <div className="text-sm text-[#86868B] mt-1">
                  {WORK_TYPE_CONFIG[selectedJob.work_type_code]?.label || selectedJob.work_type_code}
                  {' • '}
                  {selectedJob.ordered_qty || selectedJob.quantity || 0} ตัว
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-[#86868B] mb-2">เลือกสถานี</label>
                {compatibleStations.length === 0 ? (
                  <div className="text-sm text-yellow-600 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    ไม่มีสถานีที่รองรับงานประเภทนี้
                  </div>
                ) : (
                  <div className="space-y-2">
                    {compatibleStations.map((station) => (
                      <button
                        key={station.id}
                        onClick={() => setSelectedStation(station.id)}
                        className={`w-full p-3 rounded-lg border text-left transition-colors ${
                          selectedStation === station.id
                            ? 'border-[#007AFF] bg-blue-50'
                            : 'border-[#E8E8ED] bg-white hover:border-[#86868B]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-[#1D1D1F] font-medium">{station.code}</div>
                            <div className="text-sm text-[#86868B]">{station.name}</div>
                          </div>
                          <span className={`text-xs ${
                            station.status === 'active' ? 'text-green-600' : 'text-yellow-600'
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
    </div>
  );
}
