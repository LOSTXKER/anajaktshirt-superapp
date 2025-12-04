'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Factory,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  Zap,
  User,
  Calendar,
  Package,
  ArrowUp,
  ArrowDown,
  Filter,
  RefreshCw,
  Grid3X3,
  List,
  GripVertical,
  Timer,
  Target,
} from 'lucide-react';
import { Button, Card, Select, useToast } from '@/modules/shared/ui';
import { useERPProductionJobs, useERPProductionStations } from '@/modules/erp';
import type { ProductionJob } from '@/modules/erp';

// Priority Configuration
const PRIORITY_CONFIG = {
  0: { label: 'ปกติ', color: 'text-[#86868B]', bgColor: 'bg-gray-100', score: 0 },
  1: { label: 'เร่ง', color: 'text-[#FF9500]', bgColor: 'bg-orange-100', score: 25 },
  2: { label: 'ด่วน', color: 'text-[#FF3B30]', bgColor: 'bg-red-100', score: 50 },
  3: { label: 'ด่วนมาก', color: 'text-[#AF52DE]', bgColor: 'bg-purple-100', score: 100 },
};

// Work Type Configuration
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

// Status Columns for Kanban
const KANBAN_COLUMNS = [
  { key: 'pending', label: 'รอคิว', color: 'bg-gray-500' },
  { key: 'queued', label: 'เข้าคิว', color: 'bg-blue-500' },
  { key: 'in_progress', label: 'กำลังผลิต', color: 'bg-purple-500' },
  { key: 'qc_check', label: 'รอ QC', color: 'bg-yellow-500' },
  { key: 'completed', label: 'เสร็จสิ้น', color: 'bg-green-500' },
];

// Priority Score Algorithm
function calculatePriorityScore(job: ProductionJob): number {
  let score = 0;
  
  // 1. Base priority score (0-100)
  const priorityScore = PRIORITY_CONFIG[job.priority as keyof typeof PRIORITY_CONFIG]?.score || 0;
  score += priorityScore;
  
  // 2. Due date urgency (0-50)
  if (job.due_date) {
    const daysUntilDue = Math.ceil(
      (new Date(job.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntilDue <= 0) {
      score += 50; // Overdue
    } else if (daysUntilDue <= 1) {
      score += 40; // Due tomorrow
    } else if (daysUntilDue <= 3) {
      score += 30; // Due in 3 days
    } else if (daysUntilDue <= 7) {
      score += 15; // Due in a week
    }
  }
  
  // 3. Waiting time bonus (0-20)
  if (job.created_at) {
    const daysWaiting = Math.floor(
      (Date.now() - new Date(job.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    score += Math.min(daysWaiting * 2, 20); // 2 points per day, max 20
  }
  
  // 4. Quantity consideration (small jobs get slight boost)
  if (job.quantity <= 50) {
    score += 5; // Small batch bonus
  }
  
  return score;
}

export default function ProductionQueuePage() {
  const { success } = useToast();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [workTypeFilter, setWorkTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Data
  const { jobs, loading, refetch } = useERPProductionJobs({});
  const { stations } = useERPProductionStations();

  // Calculate priority scores and sort
  const sortedJobs = useMemo(() => {
    let filtered = [...jobs];
    
    // Apply filters
    if (workTypeFilter) {
      filtered = filtered.filter(j => j.work_type_code === workTypeFilter);
    }
    if (priorityFilter) {
      filtered = filtered.filter(j => j.priority === Number(priorityFilter));
    }
    
    // Calculate scores and sort
    return filtered
      .map(job => ({
        ...job,
        priorityScore: calculatePriorityScore(job),
      }))
      .sort((a, b) => b.priorityScore - a.priorityScore);
  }, [jobs, workTypeFilter, priorityFilter]);

  // Group by status for Kanban
  const jobsByStatus = useMemo(() => {
    const grouped: Record<string, typeof sortedJobs> = {};
    KANBAN_COLUMNS.forEach(col => {
      grouped[col.key] = sortedJobs.filter(j => j.status === col.key);
    });
    return grouped;
  }, [sortedJobs]);

  // Stats
  const stats = useMemo(() => ({
    total: jobs.length,
    pending: jobs.filter(j => j.status === 'pending' || j.status === 'queued').length,
    inProgress: jobs.filter(j => j.status === 'in_progress').length,
    overdue: jobs.filter(j => {
      if (!j.due_date) return false;
      return new Date(j.due_date) < new Date() && j.status !== 'completed';
    }).length,
    avgScore: sortedJobs.length > 0 
      ? Math.round(sortedJobs.reduce((sum, j) => sum + j.priorityScore, 0) / sortedJobs.length)
      : 0,
  }), [jobs, sortedJobs]);

  const formatDate = (date: string | null | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
    });
  };

  const getDaysUntilDue = (dueDate: string | null | undefined) => {
    if (!dueDate) return null;
    const days = Math.ceil(
      (new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  // Job Card Component
  const JobCard = ({ job }: { job: typeof sortedJobs[0] }) => {
    const workType = WORK_TYPE_CONFIG[job.work_type_code];
    const priority = PRIORITY_CONFIG[job.priority as keyof typeof PRIORITY_CONFIG];
    const daysUntilDue = getDaysUntilDue(job.due_date);
    const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
    const isUrgent = daysUntilDue !== null && daysUntilDue <= 2;

    return (
      <div className={`p-3 bg-white rounded-xl border ${isOverdue ? 'border-[#FF3B30]' : 'border-[#E8E8ED]'} hover:shadow-md transition-shadow`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${workType?.color || 'bg-gray-400'}`} />
            <span className="text-sm font-medium text-[#1D1D1F]">{job.job_number}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${priority?.bgColor} ${priority?.color}`}>
              {priority?.label}
            </span>
            <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-[#007AFF]/10 text-[#007AFF]">
              {job.priorityScore}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2 text-[#86868B]">
            <Package className="w-3 h-3" />
            <span>{workType?.label || job.work_type_code}</span>
            <span>•</span>
            <span>{job.quantity} ชิ้น</span>
          </div>
          
          <div className="flex items-center gap-2 text-[#86868B]">
            <User className="w-3 h-3" />
            <span className="truncate">{job.customer_name}</span>
          </div>

          {job.due_date && (
            <div className={`flex items-center gap-2 ${isOverdue ? 'text-[#FF3B30]' : isUrgent ? 'text-[#FF9500]' : 'text-[#86868B]'}`}>
              <Calendar className="w-3 h-3" />
              <span>
                {formatDate(job.due_date)}
                {daysUntilDue !== null && (
                  <span className="ml-1">
                    ({isOverdue ? `เกิน ${Math.abs(daysUntilDue)} วัน` : `อีก ${daysUntilDue} วัน`})
                  </span>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Score Breakdown (tooltip-like) */}
        <div className="mt-2 pt-2 border-t border-[#E8E8ED] flex items-center justify-between text-xs">
          <Link href={`/orders/${job.order_id}`} className="text-[#007AFF] hover:underline">
            {job.order_number}
          </Link>
          <div className="flex items-center gap-1 text-[#86868B]">
            <Target className="w-3 h-3" />
            <span>Score: {job.priorityScore}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* Header */}
      <div className="bg-white border-b border-[#E8E8ED] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#1D1D1F] flex items-center gap-3">
                <Factory className="w-7 h-7 text-[#FF9500]" />
                Production Queue
              </h1>
              <p className="text-sm text-[#86868B] mt-0.5">จัดคิวงานอัตโนมัติตาม Priority Algorithm</p>
            </div>

            <div className="flex gap-2">
              {/* View Toggle */}
              <div className="flex bg-[#F5F5F7] rounded-lg p-1">
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`p-2 rounded-md ${viewMode === 'kanban' ? 'bg-white shadow-sm' : ''}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => refetch()}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                รีเฟรช
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-4 bg-white apple-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F5F5F7] flex items-center justify-center">
                <Package className="w-5 h-5 text-[#86868B]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1D1D1F]">{stats.total}</p>
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
                <p className="text-2xl font-bold text-[#FF9500]">{stats.pending}</p>
                <p className="text-xs text-[#86868B]">รอดำเนินการ</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white apple-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F5F5F7] flex items-center justify-center">
                <Play className="w-5 h-5 text-[#86868B]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#007AFF]">{stats.inProgress}</p>
                <p className="text-xs text-[#86868B]">กำลังผลิต</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white apple-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F5F5F7] flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-[#86868B]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#FF3B30]">{stats.overdue}</p>
                <p className="text-xs text-[#86868B]">เกินกำหนด</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white apple-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F5F5F7] flex items-center justify-center">
                <Target className="w-5 h-5 text-[#86868B]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#AF52DE]">{stats.avgScore}</p>
                <p className="text-xs text-[#86868B]">Avg. Score</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 pb-4">
        <Card className="p-3 bg-white apple-card">
          <div className="flex flex-wrap gap-3">
            <Select
              value={workTypeFilter}
              onChange={(e) => setWorkTypeFilter(e.target.value)}
              className="w-40"
            >
              <option value="">ทุกประเภทงาน</option>
              {Object.entries(WORK_TYPE_CONFIG).map(([code, config]) => (
                <option key={code} value={code}>{config.label}</option>
              ))}
            </Select>

            <Select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-36"
            >
              <option value="">ทุกความเร่งด่วน</option>
              {Object.entries(PRIORITY_CONFIG).map(([level, config]) => (
                <option key={level} value={level}>{config.label}</option>
              ))}
            </Select>

            {/* Algorithm Info */}
            <div className="flex-1 flex items-center justify-end gap-2 text-xs text-[#86868B]">
              <Zap className="w-3 h-3" />
              <span>Priority = Base + Urgency + Wait Time + Size</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {viewMode === 'kanban' ? (
          /* Kanban View */
          <div className="grid grid-cols-5 gap-4">
            {KANBAN_COLUMNS.map((column) => (
              <div key={column.key} className="space-y-3">
                {/* Column Header */}
                <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-[#E8E8ED]">
                  <span className={`w-3 h-3 rounded-full ${column.color}`} />
                  <span className="font-medium text-[#1D1D1F]">{column.label}</span>
                  <span className="ml-auto text-sm text-[#86868B]">
                    {jobsByStatus[column.key]?.length || 0}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-3 min-h-[200px]">
                  {jobsByStatus[column.key]?.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                  {(jobsByStatus[column.key]?.length || 0) === 0 && (
                    <div className="p-4 text-center text-[#86868B] text-sm bg-[#F5F5F7] rounded-xl border-2 border-dashed border-[#E8E8ED]">
                      ไม่มีงาน
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <Card className="bg-white apple-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F5F5F7]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#86868B]">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#86868B]">Score</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#86868B]">เลขงาน</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#86868B]">ประเภท</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#86868B]">ลูกค้า</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#86868B]">จำนวน</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#86868B]">กำหนดส่ง</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#86868B]">Priority</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#86868B]">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E8ED]">
                  {sortedJobs.map((job, index) => {
                    const workType = WORK_TYPE_CONFIG[job.work_type_code];
                    const priority = PRIORITY_CONFIG[job.priority as keyof typeof PRIORITY_CONFIG];
                    const daysUntilDue = getDaysUntilDue(job.due_date);
                    const isOverdue = daysUntilDue !== null && daysUntilDue < 0;

                    return (
                      <tr key={job.id} className={`hover:bg-[#F5F5F7]/50 ${isOverdue ? 'bg-red-50' : ''}`}>
                        <td className="px-4 py-3 text-sm text-[#86868B]">{index + 1}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-lg text-sm font-bold bg-[#007AFF]/10 text-[#007AFF]">
                            {job.priorityScore}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-[#007AFF]">{job.job_number}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${workType?.color || 'bg-gray-400'}`} />
                            <span className="text-sm">{workType?.label || job.work_type_code}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-[#1D1D1F]">{job.customer_name}</td>
                        <td className="px-4 py-3 text-sm">{job.quantity}</td>
                        <td className={`px-4 py-3 text-sm ${isOverdue ? 'text-[#FF3B30] font-medium' : 'text-[#86868B]'}`}>
                          {formatDate(job.due_date)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${priority?.bgColor} ${priority?.color}`}>
                            {priority?.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            job.status === 'completed' ? 'bg-green-100 text-green-700' :
                            job.status === 'in_progress' ? 'bg-purple-100 text-purple-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {job.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

