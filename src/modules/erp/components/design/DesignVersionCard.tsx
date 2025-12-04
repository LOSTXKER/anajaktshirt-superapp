'use client';

import { useState } from 'react';
import {
  Check,
  X,
  Clock,
  MessageSquare,
  Download,
  Eye,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  DollarSign,
} from 'lucide-react';
import { Button, Card } from '@/modules/shared/ui';
import type { OrderDesign, DesignVersion } from '../../types/orders';

// ---------------------------------------------
// Design Version Card
// ---------------------------------------------

interface DesignVersionCardProps {
  version: DesignVersion;
  isLatest?: boolean;
  onApprove?: () => void;
  onReject?: (feedback: string) => void;
  onPreview?: () => void;
}

export function DesignVersionCard({
  version,
  isLatest = false,
  onApprove,
  onReject,
  onPreview,
}: DesignVersionCardProps) {
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [feedback, setFeedback] = useState('');

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved':
        return { bg: 'bg-[#34C759]/10', text: 'text-[#34C759]', label: 'อนุมัติแล้ว', Icon: Check };
      case 'rejected':
        return { bg: 'bg-[#FF3B30]/10', text: 'text-[#FF3B30]', label: 'ไม่อนุมัติ', Icon: X };
      default:
        return { bg: 'bg-[#FF9500]/10', text: 'text-[#FF9500]', label: 'รอตรวจสอบ', Icon: Clock };
    }
  };

  const statusConfig = getStatusConfig(version.status);
  const StatusIcon = statusConfig.Icon;

  const handleReject = () => {
    if (feedback.trim()) {
      onReject?.(feedback);
      setShowFeedbackInput(false);
      setFeedback('');
    }
  };

  return (
    <div className={`p-4 rounded-xl border ${
      isLatest ? 'border-[#007AFF] bg-[#007AFF]/5' : 'border-[#E8E8ED] bg-white'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#1D1D1F]">
            เวอร์ชัน {version.version_number}
          </span>
          {isLatest && (
            <span className="px-2 py-0.5 text-xs bg-[#007AFF]/10 text-[#007AFF] rounded-full">
              ล่าสุด
            </span>
          )}
          {version.revision_type === 'paid' && (
            <span className="px-2 py-0.5 text-xs bg-[#FF9500]/10 text-[#FF9500] rounded-full flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              ฿{version.revision_cost}
            </span>
          )}
        </div>
        <span className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 ${statusConfig.bg} ${statusConfig.text}`}>
          <StatusIcon className="w-3 h-3" />
          {statusConfig.label}
        </span>
      </div>

      {/* Preview Image */}
      {version.thumbnail_url || version.file_url ? (
        <div 
          className="relative aspect-video bg-[#F5F5F7] rounded-lg overflow-hidden mb-3 cursor-pointer group"
          onClick={onPreview}
        >
          <img
            src={version.thumbnail_url || version.file_url}
            alt={`Version ${version.version_number}`}
            className="w-full h-full object-contain"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Eye className="w-8 h-8 text-white" />
          </div>
        </div>
      ) : (
        <div className="aspect-video bg-[#F5F5F7] rounded-lg mb-3 flex items-center justify-center">
          <span className="text-sm text-[#86868B]">ไม่มีตัวอย่าง</span>
        </div>
      )}

      {/* Change Description */}
      {version.change_description && (
        <p className="text-sm text-[#86868B] mb-3">
          📝 {version.change_description}
        </p>
      )}

      {/* Feedback */}
      {version.feedback && (
        <div className={`p-3 rounded-lg mb-3 ${
          version.feedback_by === 'customer' ? 'bg-[#007AFF]/5' : 'bg-[#F5F5F7]'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="w-4 h-4 text-[#86868B]" />
            <span className="text-xs text-[#86868B]">
              {version.feedback_by === 'customer' ? 'ลูกค้า' : 'Admin'}
            </span>
          </div>
          <p className="text-sm text-[#1D1D1F]">{version.feedback}</p>
        </div>
      )}

      {/* Actions for pending versions */}
      {version.status === 'pending' && isLatest && (
        <div className="space-y-2">
          {!showFeedbackInput ? (
            <div className="flex gap-2">
              <Button
                onClick={onApprove}
                className="flex-1 gap-2 bg-[#34C759] hover:bg-[#2DB84D]"
              >
                <ThumbsUp className="w-4 h-4" />
                อนุมัติ
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowFeedbackInput(true)}
                className="flex-1 gap-2 text-[#FF3B30] border-[#FF3B30]/30 hover:bg-[#FF3B30]/10"
              >
                <ThumbsDown className="w-4 h-4" />
                ขอแก้ไข
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="ระบุสิ่งที่ต้องการแก้ไข..."
                className="w-full px-3 py-2 bg-[#F5F5F7] border-0 rounded-xl text-sm resize-none"
                rows={3}
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleReject}
                  disabled={!feedback.trim()}
                  className="flex-1 gap-2 bg-[#FF3B30] hover:bg-[#E02020]"
                >
                  ส่งคำขอแก้ไข
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowFeedbackInput(false);
                    setFeedback('');
                  }}
                >
                  ยกเลิก
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Approved confirmation */}
      {version.status === 'approved' && version.customer_approved_at && (
        <div className="flex items-center gap-2 text-xs text-[#34C759]">
          <Check className="w-4 h-4" />
          ลูกค้าอนุมัติเมื่อ {new Date(version.customer_approved_at).toLocaleString('th-TH')}
        </div>
      )}

      {/* Download/View Actions */}
      <div className="flex gap-2 mt-3 pt-3 border-t border-[#E8E8ED]">
        <Button variant="ghost" size="sm" onClick={onPreview} className="gap-1 text-[#86868B]">
          <Eye className="w-4 h-4" />
          ดูตัวอย่าง
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-1 text-[#86868B]"
          onClick={() => window.open(version.file_url, '_blank')}
        >
          <Download className="w-4 h-4" />
          ดาวน์โหลด
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------
// Design Summary Card (for list view)
// ---------------------------------------------

interface DesignSummaryCardProps {
  design: OrderDesign;
  versions: DesignVersion[];
  onClick?: () => void;
}

export function DesignSummaryCard({
  design,
  versions,
  onClick,
}: DesignSummaryCardProps) {
  const latestVersion = versions[0];

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved':
        return { bg: 'bg-[#34C759]/10', text: 'text-[#34C759]', label: 'อนุมัติแล้ว' };
      case 'revision_requested':
        return { bg: 'bg-[#FF9500]/10', text: 'text-[#FF9500]', label: 'รอแก้ไข' };
      case 'in_progress':
        return { bg: 'bg-[#007AFF]/10', text: 'text-[#007AFF]', label: 'กำลังทำ' };
      default:
        return { bg: 'bg-[#F5F5F7]', text: 'text-[#86868B]', label: 'รอดำเนินการ' };
    }
  };

  const statusConfig = getStatusConfig(design.status);

  return (
    <Card 
      className="p-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="flex gap-4">
        {/* Thumbnail */}
        <div className="w-20 h-20 bg-[#F5F5F7] rounded-lg overflow-hidden flex-shrink-0">
          {latestVersion?.thumbnail_url || latestVersion?.file_url ? (
            <img
              src={latestVersion.thumbnail_url || latestVersion.file_url}
              alt={design.design_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#86868B]">
              📝
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-semibold text-[#1D1D1F] truncate">{design.design_name}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs ${statusConfig.bg} ${statusConfig.text}`}>
              {statusConfig.label}
            </span>
          </div>
          
          {design.position && (
            <p className="text-sm text-[#86868B] mb-1">📍 {design.position}</p>
          )}
          
          <div className="flex items-center gap-3 text-xs text-[#86868B]">
            <span>เวอร์ชัน {design.current_version}</span>
            <span>•</span>
            <span>แก้ไข {design.revision_count} ครั้ง</span>
            {design.paid_revision_count > 0 && (
              <>
                <span>•</span>
                <span className="text-[#FF9500]">฿{design.paid_revision_total}</span>
              </>
            )}
          </div>
          
          {/* Revision warning */}
          {design.revision_count >= design.max_free_revisions && design.status !== 'approved' && (
            <div className="flex items-center gap-1 mt-2 text-xs text-[#FF9500]">
              <AlertTriangle className="w-3 h-3" />
              แก้ไขครั้งต่อไปจะมีค่าใช้จ่าย
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

