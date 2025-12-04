'use client';

import {
  Check,
  X,
  AlertTriangle,
  Clock,
  ChevronRight,
  Eye,
  Package,
  User,
  Camera,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { Card, Button } from '@/modules/shared/ui';
import type { QCRecord, QCCheckpoint } from '../../types/qc';
import {
  QC_RESULT_CONFIG,
  QC_STAGE_CONFIG,
  DEFECT_SEVERITY_CONFIG,
} from '../../hooks/useERPQC';

// ---------------------------------------------
// QC Result Badge
// ---------------------------------------------

interface QCResultBadgeProps {
  result: string;
  size?: 'sm' | 'md';
}

export function QCResultBadge({ result, size = 'md' }: QCResultBadgeProps) {
  const config = QC_RESULT_CONFIG[result as keyof typeof QC_RESULT_CONFIG] || {
    label_th: result,
    color: 'bg-gray-100 text-gray-700',
    icon: '❓',
  };

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`${sizeClass} rounded-full font-medium inline-flex items-center gap-1 ${config.color}`}>
      <span>{config.icon}</span>
      {config.label_th}
    </span>
  );
}

// ---------------------------------------------
// QC Record Card (List View)
// ---------------------------------------------

interface QCRecordCardProps {
  record: QCRecord;
  onClick?: () => void;
  compact?: boolean;
}

export function QCRecordCard({
  record,
  onClick,
  compact = false,
}: QCRecordCardProps) {
  const stageConfig = QC_STAGE_CONFIG[record.qc_stage_code as keyof typeof QC_STAGE_CONFIG] || {
    label_th: record.qc_stage_code,
    icon: '📋',
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('th-TH', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (compact) {
    return (
      <button
        onClick={onClick}
        className="w-full p-3 bg-white rounded-xl border border-[#E8E8ED] hover:border-[#007AFF]/30 transition-all text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{stageConfig.icon}</span>
            <div>
              <span className="text-sm font-medium text-[#1D1D1F]">{stageConfig.label_th}</span>
              <QCResultBadge result={record.overall_result} size="sm" />
            </div>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-[#34C759]">{record.pass_rate}%</span>
            <div className="text-xs text-[#86868B]">{record.passed_qty}/{record.total_qty}</div>
          </div>
        </div>
      </button>
    );
  }

  return (
    <Card
      className="p-4 bg-white apple-card cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
          record.overall_result === 'pass' ? 'bg-[#34C759]/10' :
          record.overall_result === 'fail' ? 'bg-[#FF3B30]/10' :
          'bg-[#FF9500]/10'
        }`}>
          {record.overall_result === 'pass' ? (
            <CheckCircle2 className="w-6 h-6 text-[#34C759]" />
          ) : record.overall_result === 'fail' ? (
            <XCircle className="w-6 h-6 text-[#FF3B30]" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-[#FF9500]" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{stageConfig.icon}</span>
                <span className="font-semibold text-[#1D1D1F]">{stageConfig.label_th}</span>
                <QCResultBadge result={record.overall_result} size="sm" />
              </div>
              {record.job?.job_number && (
                <span className="text-xs text-[#86868B]">{record.job.job_number}</span>
              )}
            </div>
            <ChevronRight className="w-5 h-5 text-[#86868B]" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            <div className="text-center p-2 bg-[#F5F5F7] rounded-lg">
              <div className="text-lg font-bold text-[#1D1D1F]">{record.total_qty}</div>
              <div className="text-xs text-[#86868B]">ตรวจ</div>
            </div>
            <div className="text-center p-2 bg-[#34C759]/10 rounded-lg">
              <div className="text-lg font-bold text-[#34C759]">{record.passed_qty}</div>
              <div className="text-xs text-[#34C759]">ผ่าน</div>
            </div>
            <div className="text-center p-2 bg-[#FF3B30]/10 rounded-lg">
              <div className="text-lg font-bold text-[#FF3B30]">{record.failed_qty}</div>
              <div className="text-xs text-[#FF3B30]">ไม่ผ่าน</div>
            </div>
            <div className="text-center p-2 bg-[#FF9500]/10 rounded-lg">
              <div className="text-lg font-bold text-[#FF9500]">{record.rework_qty}</div>
              <div className="text-xs text-[#FF9500]">ซ่อม</div>
            </div>
          </div>

          {/* Pass Rate */}
          <div className="mb-2">
            <div className="flex justify-between text-xs text-[#86868B] mb-1">
              <span>อัตราผ่าน</span>
              <span className="font-medium">{record.pass_rate}%</span>
            </div>
            <div className="h-2 bg-[#E8E8ED] rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  record.pass_rate >= 95 ? 'bg-[#34C759]' :
                  record.pass_rate >= 80 ? 'bg-[#FF9500]' :
                  'bg-[#FF3B30]'
                }`}
                style={{ width: `${record.pass_rate}%` }}
              />
            </div>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-3 text-xs text-[#86868B]">
            {record.checker?.name && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {record.checker.name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDateTime(record.checked_at)}
            </span>
            {record.photo_urls && record.photo_urls.length > 0 && (
              <span className="flex items-center gap-1">
                <Camera className="w-3 h-3" />
                {record.photo_urls.length}
              </span>
            )}
          </div>

          {/* Follow-up Warning */}
          {record.follow_up_required && !record.follow_up_completed_at && (
            <div className="mt-2 flex items-center gap-2 text-[#FF9500] text-sm">
              <RefreshCw className="w-4 h-4" />
              {record.follow_up_notes || 'ต้องติดตามผล'}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------
// QC Checkpoint List
// ---------------------------------------------

interface QCCheckpointListProps {
  checkpoints: QCCheckpoint[];
}

export function QCCheckpointList({ checkpoints }: QCCheckpointListProps) {
  return (
    <div className="space-y-2">
      {checkpoints.map((checkpoint, index) => {
        const severityConfig = checkpoint.defect_severity 
          ? DEFECT_SEVERITY_CONFIG[checkpoint.defect_severity]
          : null;

        return (
          <div
            key={index}
            className={`p-3 rounded-lg border ${
              checkpoint.passed 
                ? 'bg-[#34C759]/5 border-[#34C759]/20' 
                : 'bg-[#FF3B30]/5 border-[#FF3B30]/20'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {checkpoint.passed ? (
                  <Check className="w-4 h-4 text-[#34C759]" />
                ) : (
                  <X className="w-4 h-4 text-[#FF3B30]" />
                )}
                <span className={`font-medium ${
                  checkpoint.passed ? 'text-[#34C759]' : 'text-[#FF3B30]'
                }`}>
                  {checkpoint.checkpoint_name_th || checkpoint.checkpoint_name}
                </span>
                {checkpoint.is_required && (
                  <span className="text-xs text-[#86868B]">(บังคับ)</span>
                )}
              </div>
              {severityConfig && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${severityConfig.color}`}>
                  {severityConfig.label_th}
                </span>
              )}
            </div>
            {checkpoint.notes && (
              <p className="text-sm text-[#86868B] mt-1 ml-6">{checkpoint.notes}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------
// QC Summary Card
// ---------------------------------------------

interface QCSummaryCardProps {
  summary: {
    total_records: number;
    total_checked: number;
    total_passed: number;
    total_failed: number;
    total_rework: number;
    overall_pass_rate: number;
    has_pending_rework: boolean;
    pending_follow_ups: number;
  };
}

export function QCSummaryCard({ summary }: QCSummaryCardProps) {
  return (
    <Card className="p-6 bg-white apple-card">
      <h3 className="text-lg font-semibold text-[#1D1D1F] mb-4">สรุป QC</h3>
      
      {/* Pass Rate Gauge */}
      <div className="text-center mb-6">
        <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full border-4 ${
          summary.overall_pass_rate >= 95 ? 'border-[#34C759]' :
          summary.overall_pass_rate >= 80 ? 'border-[#FF9500]' :
          'border-[#FF3B30]'
        }`}>
          <div>
            <div className={`text-2xl font-bold ${
              summary.overall_pass_rate >= 95 ? 'text-[#34C759]' :
              summary.overall_pass_rate >= 80 ? 'text-[#FF9500]' :
              'text-[#FF3B30]'
            }`}>
              {summary.overall_pass_rate}%
            </div>
            <div className="text-xs text-[#86868B]">อัตราผ่าน</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-[#F5F5F7] rounded-lg text-center">
          <div className="text-xl font-bold text-[#1D1D1F]">{summary.total_checked}</div>
          <div className="text-xs text-[#86868B]">ตรวจทั้งหมด</div>
        </div>
        <div className="p-3 bg-[#34C759]/10 rounded-lg text-center">
          <div className="text-xl font-bold text-[#34C759]">{summary.total_passed}</div>
          <div className="text-xs text-[#34C759]">ผ่าน</div>
        </div>
        <div className="p-3 bg-[#FF3B30]/10 rounded-lg text-center">
          <div className="text-xl font-bold text-[#FF3B30]">{summary.total_failed}</div>
          <div className="text-xs text-[#FF3B30]">ไม่ผ่าน</div>
        </div>
        <div className="p-3 bg-[#FF9500]/10 rounded-lg text-center">
          <div className="text-xl font-bold text-[#FF9500]">{summary.total_rework}</div>
          <div className="text-xs text-[#FF9500]">รอซ่อม</div>
        </div>
      </div>

      {/* Warnings */}
      {(summary.has_pending_rework || summary.pending_follow_ups > 0) && (
        <div className="mt-4 space-y-2">
          {summary.has_pending_rework && (
            <div className="flex items-center gap-2 text-[#FF9500] text-sm p-2 bg-[#FF9500]/10 rounded-lg">
              <RefreshCw className="w-4 h-4" />
              มีงานรอซ่อม
            </div>
          )}
          {summary.pending_follow_ups > 0 && (
            <div className="flex items-center gap-2 text-[#007AFF] text-sm p-2 bg-[#007AFF]/10 rounded-lg">
              <Clock className="w-4 h-4" />
              {summary.pending_follow_ups} รายการรอติดตาม
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------
// QC Stats Overview
// ---------------------------------------------

import type { QCStats } from '../../types/qc';

interface QCStatsOverviewProps {
  stats: QCStats;
}

export function QCStatsOverview({ stats }: QCStatsOverviewProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <Card className="p-4 bg-white apple-card">
        <div className="text-2xl font-bold text-[#1D1D1F]">{stats.total_records}</div>
        <div className="text-xs text-[#86868B]">รายการ QC</div>
      </Card>
      <Card className="p-4 bg-[#FF9500]/10 apple-card">
        <div className="text-2xl font-bold text-[#FF9500]">{stats.pending_qc}</div>
        <div className="text-xs text-[#FF9500]">รอตรวจ</div>
      </Card>
      <Card className="p-4 bg-[#FF3B30]/10 apple-card">
        <div className="text-2xl font-bold text-[#FF3B30]">{stats.failed_today}</div>
        <div className="text-xs text-[#FF3B30]">ไม่ผ่านวันนี้</div>
      </Card>
      <Card className="p-4 bg-[#007AFF]/10 apple-card">
        <div className="text-2xl font-bold text-[#007AFF]">{stats.rework_in_progress}</div>
        <div className="text-xs text-[#007AFF]">กำลังซ่อม</div>
      </Card>
      <Card className="p-4 bg-[#34C759]/10 apple-card">
        <div className="text-2xl font-bold text-[#34C759]">{stats.avg_pass_rate}%</div>
        <div className="text-xs text-[#34C759]">อัตราผ่านเฉลี่ย</div>
      </Card>
      <Card className="p-4 bg-white apple-card">
        <div className="text-2xl font-bold text-[#1D1D1F]">{stats.avg_check_time_minutes}</div>
        <div className="text-xs text-[#86868B]">นาที/รายการ</div>
      </Card>
    </div>
  );
}

