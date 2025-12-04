'use client';

import { Badge, Button, Card, Input, Modal, useToast } from '@/modules/shared/ui';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft,
  Factory,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Package,
  User,
  Calendar,
  FileText,
  ClipboardCheck,
  History,
  Plus,
  ExternalLink,
  Zap,
  ChevronRight,
  Send,
} from 'lucide-react';
import { 
  useProductionJob,
  useProductionStations,
  useQCTemplates,
} from '@/modules/production/hooks/useProductionTracking';
import { useProductionTrackingMutations } from '@/modules/production/hooks/useProductionTrackingMutations';
import { 
  JOB_STATUS_CONFIG, 
  PRIORITY_CONFIG,
  type ProductionJobStatus,
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

export default function ProductionJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const { success, error: showError } = useToast();
  
  // Data
  const { job, logs, checkpoints, loading, refetch } = useProductionJob(jobId);
  const { stations } = useProductionStations();
  const { templates } = useQCTemplates(job?.work_type_code);
  const { 
    updateJobStatus, 
    assignJob, 
    logProduction, 
    performQCCheck,
    createReworkJob,
    loading: mutationLoading 
  } = useProductionTrackingMutations();
  
  // State
  const [activeTab, setActiveTab] = useState<'info' | 'qc' | 'logs'>('info');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showQCModal, setShowQCModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showReworkModal, setShowReworkModal] = useState(false);
  
  const [selectedStatus, setSelectedStatus] = useState<ProductionJobStatus | ''>('');
  const [statusNotes, setStatusNotes] = useState('');
  const [selectedStation, setSelectedStation] = useState('');
  const [logQuantity, setLogQuantity] = useState(1);
  const [logNotes, setLogNotes] = useState('');
  const [reworkQuantity, setReworkQuantity] = useState(0);
  const [reworkReason, setReworkReason] = useState('');
  const [qcResults, setQCResults] = useState<Record<string, boolean>>({});
  const [qcNotes, setQCNotes] = useState('');
  
  // Format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  // Handle status change
  const handleStatusChange = async () => {
    if (!selectedStatus) return;
    
    const result = await updateJobStatus(jobId, selectedStatus, statusNotes);
    if (result.success) {
      success(`เปลี่ยนสถานะเป็น "${JOB_STATUS_CONFIG[selectedStatus].label_th}" แล้ว`);
      setShowStatusModal(false);
      setSelectedStatus('');
      setStatusNotes('');
      refetch();
    } else {
      showError(result.error || 'เกิดข้อผิดพลาด');
    }
  };
  
  // Handle assign
  const handleAssign = async () => {
    if (!selectedStation) return;
    
    const result = await assignJob(jobId, selectedStation);
    if (result.success) {
      success('มอบหมายงานแล้ว');
      setShowAssignModal(false);
      setSelectedStation('');
      refetch();
    } else {
      showError(result.error || 'เกิดข้อผิดพลาด');
    }
  };
  
  // Handle log production
  const handleLogProduction = async () => {
    const result = await logProduction({
      job_id: jobId,
      action: 'produced',
      produced_qty: logQuantity,
      notes: logNotes || undefined,
    });
    
    if (result.success) {
      success(`บันทึกผลิต ${logQuantity} ตัว แล้ว`);
      setShowLogModal(false);
      setLogQuantity(1);
      setLogNotes('');
      refetch();
    } else {
      showError(result.error || 'เกิดข้อผิดพลาด');
    }
  };
  
  // Handle QC
  const handleQC = async (passed: boolean) => {
    const checkpointResults = templates.map(t => ({
      checkpoint_name: t.checkpoint_name,
      passed: qcResults[t.checkpoint_name] ?? passed,
    }));
    
    const result = await performQCCheck({
      job_id: jobId,
      checkpoints: checkpointResults,
      overall_passed: passed,
      qc_notes: qcNotes || undefined,
    });
    
    if (result.success) {
      success(passed ? 'ผ่าน QC แล้ว' : 'บันทึก QC ไม่ผ่านแล้ว');
      setShowQCModal(false);
      setQCResults({});
      setQCNotes('');
      refetch();
    } else {
      showError(result.error || 'เกิดข้อผิดพลาด');
    }
  };
  
  // Handle create rework
  const handleCreateRework = async () => {
    if (!reworkQuantity || !reworkReason) return;
    
    const result = await createReworkJob(jobId, reworkQuantity, reworkReason);
    if (result.success) {
      success('สร้างงาน Rework แล้ว');
      setShowReworkModal(false);
      setReworkQuantity(0);
      setReworkReason('');
      router.push(`/production/tracking/${result.reworkJobId}`);
    } else {
      showError(result.error || 'เกิดข้อผิดพลาด');
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Factory className="w-12 h-12 text-orange-500 animate-pulse mx-auto mb-4" />
          <p className="text-[#86868B]">กำลังโหลด...</p>
        </div>
      </div>
    );
  }
  
  if (!job) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-[#1D1D1F] text-xl mb-2">ไม่พบงานผลิต</p>
          <Link href="/production/tracking">
            <Button variant="secondary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              กลับหน้ารายการ
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  
  const statusConfig = JOB_STATUS_CONFIG[job.status];
  const priorityConfig = PRIORITY_CONFIG[job.priority];
  const workTypeConfig = WORK_TYPE_CONFIG[job.work_type_code];
  const progress = job.ordered_qty > 0 ? Math.round((job.produced_qty / job.ordered_qty) * 100) : 0;
  
  // Compatible stations for assignment
  const compatibleStations = stations.filter(s => 
    s.work_type_codes.includes(job.work_type_code) && 
    s.status === 'active'
  );
  
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
        <div>
          <Link 
            href="/production/tracking"
            className="inline-flex items-center text-[#86868B] hover:text-[#1D1D1F] text-sm mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            กลับหน้ารายการ
          </Link>
          
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-[#1D1D1F]">
              {job.job_number}
            </h1>
            {job.is_rework && (
              <Badge className="bg-pink-500/20 text-pink-400">
                REWORK #{job.rework_count}
              </Badge>
            )}
            {job.priority > 0 && (
              <Badge className={`${priorityConfig.color} bg-opacity-20`}>
                <Zap className="w-3 h-3 mr-1" />
                {priorityConfig.label_th}
              </Badge>
            )}
          </div>
          
          {job.order && (
            <Link 
              href={`/orders/${job.order.id}`}
              className="inline-flex items-center text-sm text-[#86868B] hover:text-blue-400 mt-1"
            >
              {job.order.order_number} • {job.order.customer_name}
              <ExternalLink className="w-3 h-3 ml-1" />
            </Link>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* Quick Actions based on status */}
          {job.status === 'pending' && !job.station_id && (
            <Button onClick={() => setShowAssignModal(true)}>
              <User className="w-4 h-4 mr-2" />
              มอบหมายงาน
            </Button>
          )}
          
          {['pending', 'queued', 'assigned'].includes(job.status) && (
            <Button onClick={() => {
              setSelectedStatus('in_progress');
              handleStatusChange();
            }}>
              <Play className="w-4 h-4 mr-2" />
              เริ่มผลิต
            </Button>
          )}
          
          {job.status === 'in_progress' && (
            <>
              <Button variant="secondary" onClick={() => setShowLogModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                บันทึกผลผลิต
              </Button>
              <Button onClick={() => {
                setSelectedStatus('qc_check');
                handleStatusChange();
              }}>
                <ClipboardCheck className="w-4 h-4 mr-2" />
                ส่ง QC
              </Button>
            </>
          )}
          
          {job.status === 'qc_check' && (
            <Button onClick={() => setShowQCModal(true)}>
              <ClipboardCheck className="w-4 h-4 mr-2" />
              ตรวจ QC
            </Button>
          )}
          
          {job.status === 'qc_passed' && (
            <Button onClick={() => {
              setSelectedStatus('completed');
              handleStatusChange();
            }}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              เสร็จสิ้น
            </Button>
          )}
          
          {job.status === 'qc_failed' && (
            <Button onClick={() => setShowReworkModal(true)} className="bg-yellow-600 hover:bg-yellow-700">
              <RotateCcw className="w-4 h-4 mr-2" />
              สร้าง Rework
            </Button>
          )}
          
          <Button variant="secondary" onClick={() => setShowStatusModal(true)}>
            เปลี่ยนสถานะ
          </Button>
        </div>
      </div>
      
      {/* Status + Progress */}
      <Card className="p-6 bg-white border-[#E8E8ED] mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Status */}
          <div>
            <p className="text-sm text-[#86868B] mb-2">สถานะ</p>
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
              {statusConfig.label_th}
            </span>
          </div>
          
          {/* Work Type */}
          <div>
            <p className="text-sm text-[#86868B] mb-2">ประเภทงาน</p>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${workTypeConfig?.color || 'bg-gray-500'}`} />
              <span className="text-[#1D1D1F] font-medium">
                {workTypeConfig?.label || job.work_type_code}
              </span>
            </div>
          </div>
          
          {/* Quantity */}
          <div>
            <p className="text-sm text-[#86868B] mb-2">ความคืบหน้า</p>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-[#1D1D1F]">{job.produced_qty}</span>
              <span className="text-[#86868B]">/</span>
              <span className="text-xl text-gray-300">{job.ordered_qty}</span>
              <span className="text-[#86868B]">ตัว</span>
            </div>
            <div className="w-full h-2 bg-[#3a3a3a] rounded-full mt-2">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
          
          {/* QC Stats */}
          <div>
            <p className="text-sm text-[#86868B] mb-2">ผลตรวจสอบ</p>
            <div className="flex gap-4">
              <div>
                <span className="text-green-500 font-bold text-lg">{job.passed_qty}</span>
                <span className="text-[#86868B] text-sm ml-1">ผ่าน</span>
              </div>
              <div>
                <span className="text-red-500 font-bold text-lg">{job.failed_qty}</span>
                <span className="text-[#86868B] text-sm ml-1">ไม่ผ่าน</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-[#E8E8ED] pb-2">
        {[
          { key: 'info', label: 'ข้อมูลงาน', icon: FileText },
          { key: 'qc', label: 'ตรวจสอบคุณภาพ', icon: ClipboardCheck },
          { key: 'logs', label: 'ประวัติการทำงาน', icon: History },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-[#1D1D1F]'
                : 'text-[#86868B] hover:text-[#1D1D1F]'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Tab Content */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Job Details */}
          <Card className="p-6 bg-white border-[#E8E8ED]">
            <h3 className="text-lg font-semibold text-[#1D1D1F] mb-4">รายละเอียดงาน</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-[#86868B]">เลขงาน</span>
                <span className="text-[#1D1D1F]">{job.job_number}</span>
              </div>
              {job.description && (
                <div className="flex justify-between">
                  <span className="text-[#86868B]">รายละเอียด</span>
                  <span className="text-[#1D1D1F] text-right max-w-[200px]">{job.description}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#86868B]">สถานี</span>
                <span className="text-[#1D1D1F]">
                  {job.station ? `${job.station.code} - ${job.station.name}` : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#86868B]">ผู้รับผิดชอบ</span>
                <span className="text-[#1D1D1F]">{job.assigned_user?.full_name || '-'}</span>
              </div>
              {job.production_notes && (
                <div>
                  <span className="text-[#86868B] block mb-2">หมายเหตุการผลิต</span>
                  <p className="text-[#1D1D1F] bg-[#F5F5F7] p-3 rounded-lg text-sm">
                    {job.production_notes}
                  </p>
                </div>
              )}
            </div>
          </Card>
          
          {/* Timing */}
          <Card className="p-6 bg-white border-[#E8E8ED]">
            <h3 className="text-lg font-semibold text-[#1D1D1F] mb-4">เวลา</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-[#86868B]">สร้างเมื่อ</span>
                <span className="text-[#1D1D1F]">{formatDate(job.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#86868B]">กำหนดส่ง</span>
                <span className="text-[#1D1D1F]">{formatDate(job.due_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#86868B]">เริ่มผลิต</span>
                <span className="text-[#1D1D1F]">{formatDate(job.started_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#86868B]">เสร็จสิ้น</span>
                <span className="text-[#1D1D1F]">{formatDate(job.completed_at)}</span>
              </div>
              {job.estimated_hours && (
                <div className="flex justify-between">
                  <span className="text-[#86868B]">เวลาที่คาดการณ์</span>
                  <span className="text-[#1D1D1F]">{job.estimated_hours} ชั่วโมง</span>
                </div>
              )}
            </div>
          </Card>
          
          {/* Design File */}
          {job.design_file_url && (
            <Card className="p-6 bg-white border-[#E8E8ED]">
              <h3 className="text-lg font-semibold text-[#1D1D1F] mb-4">ไฟล์งาน</h3>
              <a 
                href={job.design_file_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-[#F5F5F7] rounded-lg hover:bg-[#222] transition-colors"
              >
                <FileText className="w-8 h-8 text-blue-400" />
                <div className="flex-1">
                  <p className="text-[#1D1D1F]">ดาวน์โหลดไฟล์ออกแบบ</p>
                  <p className="text-sm text-[#86868B]">คลิกเพื่อเปิดไฟล์</p>
                </div>
                <ExternalLink className="w-5 h-5 text-[#86868B]" />
              </a>
            </Card>
          )}
          
          {/* Rework Info */}
          {job.is_rework && (
            <Card className="p-6 bg-white border-[#E8E8ED] border-pink-500/30">
              <h3 className="text-lg font-semibold text-pink-400 mb-4">
                ข้อมูล Rework
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-[#86868B]">สาเหตุ</span>
                  <span className="text-[#1D1D1F]">{job.rework_reason || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#86868B]">ครั้งที่</span>
                  <span className="text-[#1D1D1F]">#{job.rework_count}</span>
                </div>
                {job.original_job_id && (
                  <Link
                    href={`/production/tracking/${job.original_job_id}`}
                    className="flex items-center text-blue-400 hover:underline"
                  >
                    ดูงานต้นฉบับ
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </Card>
          )}
        </div>
      )}
      
      {activeTab === 'qc' && (
        <Card className="p-6 bg-white border-[#E8E8ED]">
          <h3 className="text-lg font-semibold text-[#1D1D1F] mb-4">ผลการตรวจสอบคุณภาพ</h3>
          
          {checkpoints.length === 0 ? (
            <div className="text-center py-8 text-[#86868B]">
              <ClipboardCheck className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>ยังไม่มีการตรวจสอบ QC</p>
              {job.status === 'qc_check' && (
                <Button onClick={() => setShowQCModal(true)} className="mt-4">
                  <ClipboardCheck className="w-4 h-4 mr-2" />
                  เริ่มตรวจ QC
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {checkpoints.map((checkpoint) => (
                <div 
                  key={checkpoint.id}
                  className={`p-4 rounded-lg border ${
                    checkpoint.passed 
                      ? 'bg-green-500/10 border-green-500/30' 
                      : 'bg-red-500/10 border-red-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {checkpoint.passed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <span className="text-[#1D1D1F] font-medium">
                        {templates.find(t => t.checkpoint_name === checkpoint.checkpoint_name)?.checkpoint_name_th || checkpoint.checkpoint_name}
                      </span>
                    </div>
                    <span className={checkpoint.passed ? 'text-green-400' : 'text-red-400'}>
                      {checkpoint.passed ? 'ผ่าน' : 'ไม่ผ่าน'}
                    </span>
                  </div>
                  {checkpoint.notes && (
                    <p className="text-sm text-[#86868B] mt-2 ml-8">{checkpoint.notes}</p>
                  )}
                </div>
              ))}
              
              {job.qc_notes && (
                <div className="mt-4 p-4 bg-[#F5F5F7] rounded-lg">
                  <p className="text-sm text-[#86868B]">หมายเหตุ QC:</p>
                  <p className="text-[#1D1D1F] mt-1">{job.qc_notes}</p>
                </div>
              )}
            </div>
          )}
        </Card>
      )}
      
      {activeTab === 'logs' && (
        <Card className="p-6 bg-white border-[#E8E8ED]">
          <h3 className="text-lg font-semibold text-[#1D1D1F] mb-4">ประวัติการทำงาน</h3>
          
          {logs.length === 0 ? (
            <div className="text-center py-8 text-[#86868B]">
              <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>ยังไม่มีประวัติ</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-4">
                  <div className="w-2 h-2 mt-2 rounded-full bg-blue-500" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[#1D1D1F] font-medium">
                        {log.action === 'created' && 'สร้างงาน'}
                        {log.action === 'status_changed' && 'เปลี่ยนสถานะ'}
                        {log.action === 'assigned' && 'มอบหมายงาน'}
                        {log.action === 'produced' && `ผลิตได้ ${log.produced_qty} ตัว`}
                        {log.action === 'qc_passed' && 'ผ่าน QC'}
                        {log.action === 'qc_failed' && 'ไม่ผ่าน QC'}
                        {log.action === 'rework_created' && 'สร้างงาน Rework'}
                        {!['created', 'status_changed', 'assigned', 'produced', 'qc_passed', 'qc_failed', 'rework_created'].includes(log.action) && log.action}
                      </span>
                      
                      {log.from_status && log.to_status && (
                        <span className="text-sm text-[#86868B]">
                          {JOB_STATUS_CONFIG[log.from_status as ProductionJobStatus]?.label_th || log.from_status}
                          {' → '}
                          {JOB_STATUS_CONFIG[log.to_status as ProductionJobStatus]?.label_th || log.to_status}
                        </span>
                      )}
                    </div>
                    
                    {log.notes && (
                      <p className="text-sm text-[#86868B] mt-1">{log.notes}</p>
                    )}
                    
                    <div className="flex items-center gap-2 mt-1 text-xs text-[#86868B]">
                      <User className="w-3 h-3" />
                      <span>{log.performer?.full_name || 'ระบบ'}</span>
                      <span>•</span>
                      <span>{formatDate(log.performed_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
      
      {/* Status Change Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="เปลี่ยนสถานะงาน"
      >
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-[#86868B] mb-2">เลือกสถานะใหม่</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(JOB_STATUS_CONFIG).map(([status, config]) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status as ProductionJobStatus)}
                  disabled={status === job.status}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    selectedStatus === status
                      ? 'border-blue-500 bg-blue-500/10'
                      : status === job.status
                      ? 'border-[#E8E8ED] bg-[#F5F5F7] opacity-50 cursor-not-allowed'
                      : 'border-[#E8E8ED] bg-white hover:border-[#4a4a4a]'
                  }`}
                >
                  <span className={`text-sm font-medium ${config.color}`}>
                    {config.label_th}
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-[#86868B] mb-2">หมายเหตุ (ถ้ามี)</label>
            <Input
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
              placeholder="ระบุหมายเหตุ..."
              className="bg-[#F5F5F7] border-[#E8E8ED]"
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
              ยกเลิก
            </Button>
            <Button
              onClick={handleStatusChange}
              disabled={!selectedStatus || mutationLoading}
            >
              {mutationLoading ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Assign Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="มอบหมายงาน"
      >
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-[#86868B] mb-2">เลือกสถานี</label>
            {compatibleStations.length === 0 ? (
              <div className="text-sm text-yellow-500 p-4 bg-yellow-500/10 rounded-lg">
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
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-[#E8E8ED] bg-white hover:border-[#4a4a4a]'
                    }`}
                  >
                    <div className="text-[#1D1D1F] font-medium">{station.code}</div>
                    <div className="text-sm text-[#86868B]">{station.name}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setShowAssignModal(false)}>
              ยกเลิก
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedStation || mutationLoading}
            >
              {mutationLoading ? 'กำลังบันทึก...' : 'มอบหมาย'}
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Log Production Modal */}
      <Modal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        title="บันทึกผลการผลิต"
      >
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-[#86868B] mb-2">จำนวนที่ผลิตได้</label>
            <Input
              type="number"
              min={1}
              max={job.ordered_qty - job.produced_qty}
              value={logQuantity}
              onChange={(e) => setLogQuantity(Number(e.target.value))}
              className="bg-[#F5F5F7] border-[#E8E8ED]"
            />
            <p className="text-xs text-[#86868B] mt-1">
              เหลืออีก {job.ordered_qty - job.produced_qty} ตัว
            </p>
          </div>
          
          <div>
            <label className="block text-sm text-[#86868B] mb-2">หมายเหตุ (ถ้ามี)</label>
            <Input
              value={logNotes}
              onChange={(e) => setLogNotes(e.target.value)}
              placeholder="ระบุหมายเหตุ..."
              className="bg-[#F5F5F7] border-[#E8E8ED]"
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setShowLogModal(false)}>
              ยกเลิก
            </Button>
            <Button
              onClick={handleLogProduction}
              disabled={logQuantity < 1 || mutationLoading}
            >
              {mutationLoading ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* QC Modal */}
      <Modal
        isOpen={showQCModal}
        onClose={() => setShowQCModal(false)}
        title="ตรวจสอบคุณภาพ (QC)"
      >
        <div className="p-4 space-y-4">
          <div className="space-y-3">
            {templates.map((template) => (
              <div 
                key={template.id}
                className={`p-4 rounded-lg border transition-colors ${
                  qcResults[template.checkpoint_name] === true
                    ? 'border-green-500/50 bg-green-500/10'
                    : qcResults[template.checkpoint_name] === false
                    ? 'border-red-500/50 bg-red-500/10'
                    : 'border-[#E8E8ED] bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#1D1D1F] font-medium">
                      {template.checkpoint_name_th || template.checkpoint_name}
                    </p>
                    {template.description && (
                      <p className="text-sm text-[#86868B]">{template.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setQCResults(prev => ({ ...prev, [template.checkpoint_name]: true }))}
                      className={`p-2 rounded-lg transition-colors ${
                        qcResults[template.checkpoint_name] === true
                          ? 'bg-green-500 text-[#1D1D1F]'
                          : 'bg-[#3a3a3a] text-[#86868B] hover:bg-green-500/30'
                      }`}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setQCResults(prev => ({ ...prev, [template.checkpoint_name]: false }))}
                      className={`p-2 rounded-lg transition-colors ${
                        qcResults[template.checkpoint_name] === false
                          ? 'bg-red-500 text-[#1D1D1F]'
                          : 'bg-[#3a3a3a] text-[#86868B] hover:bg-red-500/30'
                      }`}
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div>
            <label className="block text-sm text-[#86868B] mb-2">หมายเหตุ QC</label>
            <Input
              value={qcNotes}
              onChange={(e) => setQCNotes(e.target.value)}
              placeholder="ระบุหมายเหตุ..."
              className="bg-[#F5F5F7] border-[#E8E8ED]"
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setShowQCModal(false)}>
              ยกเลิก
            </Button>
            <Button
              variant="secondary"
              className="text-red-500"
              onClick={() => handleQC(false)}
              disabled={mutationLoading}
            >
              ไม่ผ่าน QC
            </Button>
            <Button
              onClick={() => handleQC(true)}
              disabled={mutationLoading}
            >
              {mutationLoading ? 'กำลังบันทึก...' : 'ผ่าน QC'}
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Rework Modal */}
      <Modal
        isOpen={showReworkModal}
        onClose={() => setShowReworkModal(false)}
        title="สร้างงาน Rework"
      >
        <div className="p-4 space-y-4">
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-500 text-sm">
              การสร้างงาน Rework จะสร้างงานผลิตใหม่สำหรับจำนวนที่ไม่ผ่าน QC
            </p>
          </div>
          
          <div>
            <label className="block text-sm text-[#86868B] mb-2">จำนวนที่ต้อง Rework</label>
            <Input
              type="number"
              min={1}
              max={job.failed_qty}
              value={reworkQuantity}
              onChange={(e) => setReworkQuantity(Number(e.target.value))}
              className="bg-[#F5F5F7] border-[#E8E8ED]"
            />
            <p className="text-xs text-[#86868B] mt-1">
              จำนวนที่ไม่ผ่าน QC: {job.failed_qty} ตัว
            </p>
          </div>
          
          <div>
            <label className="block text-sm text-[#86868B] mb-2">สาเหตุ / ปัญหาที่พบ *</label>
            <Input
              value={reworkReason}
              onChange={(e) => setReworkReason(e.target.value)}
              placeholder="ระบุสาเหตุที่ต้อง Rework..."
              className="bg-[#F5F5F7] border-[#E8E8ED]"
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setShowReworkModal(false)}>
              ยกเลิก
            </Button>
            <Button
              onClick={handleCreateRework}
              disabled={!reworkQuantity || !reworkReason || mutationLoading}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {mutationLoading ? 'กำลังสร้าง...' : 'สร้าง Rework'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

