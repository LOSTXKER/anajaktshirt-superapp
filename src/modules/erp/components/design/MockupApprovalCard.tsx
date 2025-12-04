'use client';

import { useState } from 'react';
import {
  Check,
  X,
  Clock,
  Eye,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Lock,
  AlertTriangle,
} from 'lucide-react';
import { Button, Card, Modal } from '@/modules/shared/ui';
import type { OrderMockup } from '../../types/orders';

// ---------------------------------------------
// Mockup Image Viewer
// ---------------------------------------------

interface MockupImageViewerProps {
  mockup: OrderMockup;
}

export function MockupImageViewer({ mockup }: MockupImageViewerProps) {
  const [currentView, setCurrentView] = useState<'front' | 'back'>('front');
  
  const images = [
    { key: 'front', url: mockup.front_image_url, label: 'ด้านหน้า' },
    { key: 'back', url: mockup.back_image_url, label: 'ด้านหลัง' },
    ...(mockup.additional_images || []).map((url, i) => ({
      key: `additional-${i}`,
      url,
      label: `เพิ่มเติม ${i + 1}`,
    })),
  ].filter(img => img.url);

  const currentImage = images.find(img => img.key === currentView) || images[0];
  const currentIndex = images.findIndex(img => img.key === currentView);

  const goToPrevious = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
    setCurrentView(images[newIndex].key as 'front' | 'back');
  };

  const goToNext = () => {
    const newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
    setCurrentView(images[newIndex].key as 'front' | 'back');
  };

  if (images.length === 0) {
    return (
      <div className="aspect-video bg-[#F5F5F7] rounded-xl flex items-center justify-center">
        <p className="text-[#86868B]">ไม่มีรูปภาพ Mockup</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div className="relative aspect-video bg-[#F5F5F7] rounded-xl overflow-hidden group">
        {currentImage?.url && (
          <img
            src={currentImage.url}
            alt={currentImage.label}
            className="w-full h-full object-contain"
          />
        )}

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Current View Label */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/70 text-white text-sm rounded-full">
          {currentImage?.label}
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 justify-center">
          {images.map((img) => (
            <button
              key={img.key}
              onClick={() => setCurrentView(img.key as 'front' | 'back')}
              className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                currentView === img.key
                  ? 'border-[#007AFF]'
                  : 'border-transparent opacity-50 hover:opacity-100'
              }`}
            >
              {img.url && (
                <img
                  src={img.url}
                  alt={img.label}
                  className="w-full h-full object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------
// Mockup Approval Card
// ---------------------------------------------

interface MockupApprovalCardProps {
  mockup: OrderMockup;
  onApprove?: () => void;
  onReject?: (feedback: string) => void;
  readOnly?: boolean;
}

export function MockupApprovalCard({
  mockup,
  onApprove,
  onReject,
  readOnly = false,
}: MockupApprovalCardProps) {
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved':
        return { 
          bg: 'bg-[#34C759]/10', 
          text: 'text-[#34C759]', 
          borderColor: 'border-[#34C759]/30',
          label: 'อนุมัติแล้ว', 
          Icon: Check,
        };
      case 'rejected':
        return { 
          bg: 'bg-[#FF3B30]/10', 
          text: 'text-[#FF3B30]', 
          borderColor: 'border-[#FF3B30]/30',
          label: 'ไม่อนุมัติ', 
          Icon: X,
        };
      default:
        return { 
          bg: 'bg-[#FF9500]/10', 
          text: 'text-[#FF9500]',
          borderColor: 'border-[#FF9500]/30',
          label: 'รออนุมัติ', 
          Icon: Clock,
        };
    }
  };

  const statusConfig = getStatusConfig(mockup.status);
  const StatusIcon = statusConfig.Icon;

  const handleReject = () => {
    if (feedback.trim()) {
      onReject?.(feedback);
      setShowFeedbackInput(false);
      setFeedback('');
    }
  };

  return (
    <>
      <Card className={`p-6 apple-card border-2 ${statusConfig.borderColor}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-[#1D1D1F]">
              Mockup เวอร์ชัน {mockup.version_number}
            </h2>
            <p className="text-sm text-[#86868B]">
              สร้างเมื่อ {new Date(mockup.created_at).toLocaleString('th-TH')}
            </p>
          </div>
          <span className={`px-3 py-1.5 rounded-full flex items-center gap-2 ${statusConfig.bg} ${statusConfig.text}`}>
            <StatusIcon className="w-4 h-4" />
            {statusConfig.label}
          </span>
        </div>

        {/* Image Viewer */}
        <MockupImageViewer mockup={mockup} />

        {/* Approved Lock Notice */}
        {mockup.status === 'approved' && (
          <div className="mt-4 p-3 bg-[#34C759]/10 rounded-xl">
            <div className="flex items-center gap-2 text-[#34C759]">
              <Lock className="w-4 h-4" />
              <span className="font-medium">Mockup ถูก Lock แล้ว</span>
            </div>
            <p className="text-sm text-[#1D1D1F] mt-1">
              ลูกค้าอนุมัติเมื่อ {mockup.approved_at && new Date(mockup.approved_at).toLocaleString('th-TH')}
            </p>
            {mockup.customer_feedback && (
              <p className="text-sm text-[#86868B] mt-2 italic">
                💬 "{mockup.customer_feedback}"
              </p>
            )}
            <p className="text-xs text-[#FF9500] mt-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              การแก้ไขหลังจากนี้จะมีค่าใช้จ่ายเพิ่มเติม
            </p>
          </div>
        )}

        {/* Customer Feedback (for rejected) */}
        {mockup.status === 'rejected' && mockup.customer_feedback && (
          <div className="mt-4 p-3 bg-[#FF3B30]/10 rounded-xl">
            <div className="flex items-center gap-2 text-[#FF3B30] mb-1">
              <MessageSquare className="w-4 h-4" />
              <span className="font-medium">คำติชมจากลูกค้า</span>
            </div>
            <p className="text-sm text-[#1D1D1F]">{mockup.customer_feedback}</p>
          </div>
        )}

        {/* Approval Actions (for pending) */}
        {mockup.status === 'pending' && !readOnly && (
          <div className="mt-4 pt-4 border-t border-[#E8E8ED]">
            {!showFeedbackInput ? (
              <>
                <p className="text-sm text-[#86868B] mb-3">
                  ⚠️ กรุณาตรวจสอบ Mockup อย่างละเอียดก่อนอนุมัติ 
                  การแก้ไขหลังอนุมัติจะมีค่าใช้จ่ายเพิ่มเติม
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={onApprove}
                    className="flex-1 gap-2 bg-[#34C759] hover:bg-[#2DB84D]"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    อนุมัติ Mockup
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowFeedbackInput(true)}
                    className="flex-1 gap-2 text-[#FF9500] border-[#FF9500]/30 hover:bg-[#FF9500]/10"
                  >
                    <ThumbsDown className="w-4 h-4" />
                    ขอแก้ไข
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="ระบุสิ่งที่ต้องการแก้ไข (เช่น ตำแหน่งโลโก้, สี, ขนาด)..."
                  className="w-full px-4 py-3 bg-[#F5F5F7] border-0 rounded-xl text-sm resize-none"
                  rows={4}
                />
                <div className="flex gap-3">
                  <Button
                    onClick={handleReject}
                    disabled={!feedback.trim()}
                    className="flex-1 gap-2 bg-[#FF9500] hover:bg-[#E08600]"
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

        {/* View Full Size Button */}
        <Button
          variant="ghost"
          onClick={() => setShowPreview(true)}
          className="w-full mt-4 gap-2 text-[#007AFF]"
        >
          <Eye className="w-4 h-4" />
          ดูแบบเต็ม
        </Button>
      </Card>

      {/* Full Size Preview Modal */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title={`Mockup เวอร์ชัน ${mockup.version_number}`}
        size="xl"
      >
        <div className="p-4">
          <MockupImageViewer mockup={mockup} />
        </div>
      </Modal>
    </>
  );
}

