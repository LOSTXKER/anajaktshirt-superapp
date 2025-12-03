'use client';

import { useState } from 'react';
import {
  Plus,
  Image as ImageIcon,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Loader2,
  Shirt,
  ThumbsUp,
  ThumbsDown,
  Send,
} from 'lucide-react';
import { Button } from '@/modules/shared/ui/Button';
import { Modal } from '@/modules/shared/ui/Modal';
import { Card } from '@/modules/shared/ui/Card';
import { ImageUpload } from '@/modules/shared/ui/FileUpload';
import { useToast } from '@/modules/shared/ui/Toast';
import { useOrderMutations } from '../hooks/useOrderMutations';
import type { OrderMockup, OrderDesign } from '../types';

interface MockupManagerProps {
  orderId: string;
  designs: OrderDesign[];
  mockups: OrderMockup[];
  onRefresh: () => void;
  readOnly?: boolean;
  isCustomerView?: boolean; // For customer-facing page
}

export function MockupManager({
  orderId,
  designs,
  mockups,
  onRefresh,
  readOnly = false,
  isCustomerView = false,
}: MockupManagerProps) {
  const { success, error: showError } = useToast();
  const { addMockup, approveMockup, rejectMockup, loading } = useOrderMutations();

  // State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedMockup, setSelectedMockup] = useState<OrderMockup | null>(null);

  // Create Mockup Form
  const [selectedDesignId, setSelectedDesignId] = useState('');
  const [frontImageUrl, setFrontImageUrl] = useState<string | null>(null);
  const [backImageUrl, setBackImageUrl] = useState<string | null>(null);
  const [mockupNote, setMockupNote] = useState('');

  // Feedback Form
  const [feedbackText, setFeedbackText] = useState('');

  const handleCreateMockup = async () => {
    if (!selectedDesignId) {
      showError('กรุณาเลือกงานออกแบบ');
      return;
    }

    if (!frontImageUrl && !backImageUrl) {
      showError('กรุณาอัพโหลดรูป Mockup อย่างน้อย 1 รูป');
      return;
    }

    const result = await addMockup({
      order_id: orderId,
      design_id: selectedDesignId,
      front_image_url: frontImageUrl || undefined,
      back_image_url: backImageUrl || undefined,
      note: mockupNote || undefined,
    });

    if (result.success) {
      success('สร้าง Mockup เรียบร้อย');
      setShowCreateModal(false);
      resetCreateForm();
      onRefresh();
    } else {
      showError(result.error || 'เกิดข้อผิดพลาด');
    }
  };

  const handleApprove = async (mockupId: string) => {
    const result = await approveMockup(mockupId);
    if (result.success) {
      success('อนุมัติ Mockup เรียบร้อย');
      setShowViewModal(false);
      setSelectedMockup(null);
      onRefresh();
    } else {
      showError(result.error || 'เกิดข้อผิดพลาด');
    }
  };

  const handleReject = async () => {
    if (!selectedMockup) return;

    if (!feedbackText.trim()) {
      showError('กรุณาใส่ข้อเสนอแนะ');
      return;
    }

    const result = await rejectMockup(selectedMockup.id, feedbackText);
    if (result.success) {
      success('ส่ง Feedback เรียบร้อย');
      setShowFeedbackModal(false);
      setShowViewModal(false);
      setSelectedMockup(null);
      setFeedbackText('');
      onRefresh();
    } else {
      showError(result.error || 'เกิดข้อผิดพลาด');
    }
  };

  const resetCreateForm = () => {
    setSelectedDesignId('');
    setFrontImageUrl(null);
    setBackImageUrl(null);
    setMockupNote('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">
            <Clock className="w-3 h-3" />
            รอตรวจสอบ
          </span>
        );
      case 'approved':
        return (
          <span className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
            <CheckCircle2 className="w-3 h-3" />
            อนุมัติแล้ว
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
            <XCircle className="w-3 h-3" />
            ขอแก้ไข
          </span>
        );
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-[#86868B]">{status}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shirt className="w-5 h-5 text-pink-500" />
          <h3 className="text-lg font-semibold text-[#1D1D1F]">
            Mockup ({mockups.length})
          </h3>
        </div>
        {!readOnly && !isCustomerView && (
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-1" />
            สร้าง Mockup
          </Button>
        )}
      </div>

      {/* Customer Instructions */}
      {isCustomerView && mockups.some(m => m.status === 'pending') && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-yellow-700 text-sm">
            📌 กรุณาตรวจสอบ Mockup ด้านล่าง หากถูกต้องกด <span className="font-bold">"อนุมัติ"</span> 
            หากต้องการแก้ไขกด <span className="font-bold">"ขอแก้ไข"</span> และใส่รายละเอียดที่ต้องการแก้
          </p>
        </div>
      )}

      {/* Mockup Grid */}
      {mockups.length === 0 ? (
        <Card className="p-8 bg-[#F5F5F7] border-[#E8E8ED] text-center">
          <Shirt className="w-12 h-12 text-[#86868B] mx-auto mb-3" />
          <p className="text-[#86868B]">
            {isCustomerView ? 'ยังไม่มี Mockup ให้ตรวจสอบ' : 'ยังไม่มี Mockup'}
          </p>
          {!readOnly && !isCustomerView && (
            <Button variant="secondary" className="mt-3" onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-1" />
              สร้าง Mockup
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockups.map((mockup) => {
            const design = designs.find(d => d.id === mockup.design_id);

            return (
              <Card
                key={mockup.id}
                className="bg-white border-[#E8E8ED] overflow-hidden cursor-pointer hover:border-[#007AFF] transition-colors"
                onClick={() => {
                  setSelectedMockup(mockup);
                  setShowViewModal(true);
                }}
              >
                {/* Image */}
                <div className="aspect-square relative">
                  {mockup.front_image_url ? (
                    <img
                      src={mockup.front_image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : mockup.back_image_url ? (
                    <img
                      src={mockup.back_image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#F5F5F7]">
                      <ImageIcon className="w-12 h-12 text-[#C7C7CC]" />
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    {getStatusBadge(mockup.status)}
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Eye className="w-8 h-8 text-[#1D1D1F]" />
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="text-[#1D1D1F] font-medium text-sm truncate">
                    {design?.design_name || 'Mockup'}
                  </p>
                  <p className="text-xs text-[#86868B] mt-1">
                    {new Date(mockup.created_at).toLocaleDateString('th-TH', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                  {mockup.feedback && (
                    <p className="text-xs text-[#86868B] mt-2 truncate">
                      💬 {mockup.feedback}
                    </p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Mockup Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetCreateForm();
        }}
        title="สร้าง Mockup ใหม่"
      >
        <div className="p-4 space-y-4">
          {/* Select Design */}
          <div>
            <label className="block text-sm text-[#86868B] mb-1">เลือกงานออกแบบ *</label>
            <select
              value={selectedDesignId}
              onChange={(e) => setSelectedDesignId(e.target.value)}
              className="w-full px-3 py-2 bg-[#F5F5F7] border border-[#E8E8ED] rounded-lg text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
            >
              <option value="">-- เลือกงานออกแบบ --</option>
              {designs.map((design) => (
                <option key={design.id} value={design.id}>
                  {design.design_name} {design.position && `(${design.position})`}
                </option>
              ))}
            </select>
          </div>

          {/* Front Image */}
          <ImageUpload
            bucket="mockups"
            folder={`orders/${orderId}`}
            label="รูป Mockup หน้า"
            value={frontImageUrl || undefined}
            onChange={setFrontImageUrl}
            aspectRatio="square"
            maxSizeMB={10}
          />

          {/* Back Image */}
          <ImageUpload
            bucket="mockups"
            folder={`orders/${orderId}`}
            label="รูป Mockup หลัง"
            value={backImageUrl || undefined}
            onChange={setBackImageUrl}
            aspectRatio="square"
            maxSizeMB={10}
          />

          {/* Note */}
          <div>
            <label className="block text-sm text-[#86868B] mb-1">หมายเหตุ</label>
            <textarea
              value={mockupNote}
              onChange={(e) => setMockupNote(e.target.value)}
              rows={2}
              placeholder="หมายเหตุเพิ่มเติม..."
              className="w-full px-3 py-2 bg-[#F5F5F7] border border-[#E8E8ED] rounded-lg text-[#1D1D1F] resize-none focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setShowCreateModal(false);
                resetCreateForm();
              }}
            >
              ยกเลิก
            </Button>
            <Button className="flex-1" onClick={handleCreateMockup} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'สร้าง Mockup'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Mockup Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedMockup(null);
        }}
        title="ตรวจสอบ Mockup"
      >
        {selectedMockup && (
          <div className="p-4 space-y-4">
            {/* Images */}
            <div className="grid grid-cols-2 gap-3">
              {selectedMockup.front_image_url && (
                <div>
                  <p className="text-xs text-[#86868B] mb-1">ด้านหน้า</p>
                  <div className="aspect-square rounded-lg overflow-hidden bg-[#F5F5F7]">
                    <img
                      src={selectedMockup.front_image_url}
                      alt="Front"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
              {selectedMockup.back_image_url && (
                <div>
                  <p className="text-xs text-[#86868B] mb-1">ด้านหลัง</p>
                  <div className="aspect-square rounded-lg overflow-hidden bg-[#F5F5F7]">
                    <img
                      src={selectedMockup.back_image_url}
                      alt="Back"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Status */}
            <div className="flex items-center justify-between py-2 border-y border-[#E8E8ED]">
              <span className="text-[#86868B] text-sm">สถานะ</span>
              {getStatusBadge(selectedMockup.status)}
            </div>

            {/* Note */}
            {selectedMockup.note && (
              <div className="p-3 bg-[#F5F5F7] rounded-lg">
                <p className="text-xs text-[#86868B] mb-1">หมายเหตุ</p>
                <p className="text-sm text-[#1D1D1F]">{selectedMockup.note}</p>
              </div>
            )}

            {/* Feedback */}
            {selectedMockup.feedback && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-600 mb-1">💬 Feedback จากลูกค้า</p>
                <p className="text-sm text-[#1D1D1F]">{selectedMockup.feedback}</p>
              </div>
            )}

            {/* Actions - Only show for pending status */}
            {selectedMockup.status === 'pending' && (
              <div className="flex gap-2 pt-2">
                <Button
                  variant="secondary"
                  className="flex-1 border-red-300 text-red-500 hover:bg-red-50"
                  onClick={() => setShowFeedbackModal(true)}
                >
                  <ThumbsDown className="w-4 h-4 mr-1" />
                  ขอแก้ไข
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => handleApprove(selectedMockup.id)}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      อนุมัติ
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Feedback Modal */}
      <Modal
        isOpen={showFeedbackModal}
        onClose={() => {
          setShowFeedbackModal(false);
          setFeedbackText('');
        }}
        title="ส่งข้อเสนอแนะ"
      >
        <div className="p-4 space-y-4">
          <p className="text-[#86868B] text-sm">
            กรุณาระบุสิ่งที่ต้องการให้แก้ไข เราจะดำเนินการและส่ง Mockup ใหม่ให้ตรวจสอบอีกครั้ง
          </p>

          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            rows={4}
            placeholder="เช่น ต้องการให้ลายเล็กลง, เปลี่ยนสี, ย้ายตำแหน่ง..."
            className="w-full px-3 py-2 bg-[#F5F5F7] border border-[#E8E8ED] rounded-lg text-[#1D1D1F] resize-none focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
            autoFocus
          />

          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setShowFeedbackModal(false);
                setFeedbackText('');
              }}
            >
              ยกเลิก
            </Button>
            <Button
              className="flex-1"
              onClick={handleReject}
              disabled={loading || !feedbackText.trim()}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 mr-1" />
                  ส่ง Feedback
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
