'use client';

import { useState } from 'react';
import {
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  ChevronDown,
  ChevronRight,
  Loader2,
  FileText,
  Palette,
  Upload,
} from 'lucide-react';
import { Button } from '@/modules/shared/ui/Button';
import { Input } from '@/modules/shared/ui/Input';
import { Modal } from '@/modules/shared/ui/Modal';
import { Card } from '@/modules/shared/ui/Card';
import { FileUpload } from '@/modules/shared/ui/FileUpload';
import { useToast } from '@/modules/shared/ui/Toast';
import { useOrderMutations } from '../hooks/useOrderMutations';
import type { OrderDesign, DesignVersion } from '../types';

interface DesignManagerProps {
  orderId: string;
  designs: OrderDesign[];
  onRefresh: () => void;
  readOnly?: boolean;
}

export function DesignManager({ orderId, designs, onRefresh, readOnly = false }: DesignManagerProps) {
  const { success, error: showError } = useToast();
  const { addDesign, addDesignVersion, loading } = useOrderMutations();

  // State
  const [expandedDesigns, setExpandedDesigns] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState<OrderDesign | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<DesignVersion | null>(null);

  // New Design Form
  const [newDesignName, setNewDesignName] = useState('');
  const [newDesignPosition, setNewDesignPosition] = useState('');
  const [newDesignBrief, setNewDesignBrief] = useState('');

  // Upload Form
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);

  const toggleExpand = (designId: string) => {
    setExpandedDesigns(prev =>
      prev.includes(designId)
        ? prev.filter(id => id !== designId)
        : [...prev, designId]
    );
  };

  const handleAddDesign = async () => {
    if (!newDesignName.trim()) {
      showError('กรุณาใส่ชื่องานออกแบบ');
      return;
    }

    const result = await addDesign({
      order_id: orderId,
      design_name: newDesignName,
      position: newDesignPosition || undefined,
      brief_text: newDesignBrief || undefined,
    });

    if (result.success) {
      success('เพิ่มงานออกแบบแล้ว');
      setShowAddModal(false);
      setNewDesignName('');
      setNewDesignPosition('');
      setNewDesignBrief('');
      onRefresh();
    } else {
      showError(result.error || 'เกิดข้อผิดพลาด');
    }
  };

  const handleUploadVersion = async () => {
    if (!selectedDesign || !uploadedFileUrl) {
      showError('กรุณาอัพโหลดไฟล์');
      return;
    }

    const result = await addDesignVersion(selectedDesign.id, uploadedFileUrl);

    if (result.success) {
      success('อัพโหลดไฟล์เรียบร้อย');
      setShowUploadModal(false);
      setSelectedDesign(null);
      setUploadedFileUrl(null);
      onRefresh();
    } else {
      showError(result.error || 'เกิดข้อผิดพลาด');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">รอดำเนินการ</span>;
      case 'drafting':
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">กำลังออกแบบ</span>;
      case 'awaiting_review':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">รอตรวจสอบ</span>;
      case 'revision_requested':
        return <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-700">ขอแก้ไข</span>;
      case 'approved':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">อนุมัติแล้ว</span>;
      case 'final':
        return <span className="px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-700">Final</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">{status}</span>;
    }
  };

  const getVersionStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-semibold text-[#1D1D1F]">งานออกแบบ ({designs.length})</h3>
        </div>
        {!readOnly && (
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-1" />
            เพิ่มงานออกแบบ
          </Button>
        )}
      </div>

      {/* Design List */}
      {designs.length === 0 ? (
        <Card className="p-8 bg-[#F5F5F7] border-[#E8E8ED] text-center">
          <Palette className="w-12 h-12 text-[#C7C7CC] mx-auto mb-3" />
          <p className="text-[#86868B]">ยังไม่มีงานออกแบบ</p>
          {!readOnly && (
            <Button variant="secondary" className="mt-3" onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-1" />
              เพิ่มงานออกแบบ
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {designs.map((design) => {
            const isExpanded = expandedDesigns.includes(design.id);
            const versions = design.versions || [];

            return (
              <Card key={design.id} className="bg-white border-[#E8E8ED] overflow-hidden">
                {/* Design Header */}
                <button
                  onClick={() => toggleExpand(design.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-[#F5F5F7] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Palette className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-[#1D1D1F] font-medium">{design.design_name}</p>
                      <p className="text-sm text-[#86868B]">
                        {design.position && `${design.position} • `}
                        Version {design.current_version}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(design.status)}
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-[#86868B]" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-[#86868B]" />
                    )}
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-[#E8E8ED]">
                    {/* Brief */}
                    {design.brief_text && (
                      <div className="mt-3 p-3 bg-[#F5F5F7] rounded-lg">
                        <p className="text-xs text-[#86868B] mb-1">Brief:</p>
                        <p className="text-sm text-[#1D1D1F]">{design.brief_text}</p>
                      </div>
                    )}

                    {/* Actions */}
                    {!readOnly && (
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setSelectedDesign(design);
                            setShowUploadModal(true);
                          }}
                        >
                          <Upload className="w-4 h-4 mr-1" />
                          อัพโหลด Version ใหม่
                        </Button>
                      </div>
                    )}

                    {/* Versions */}
                    <div className="mt-4">
                      <p className="text-sm text-[#86868B] mb-2">ประวัติ Version:</p>
                      {versions.length === 0 ? (
                        <p className="text-sm text-[#C7C7CC] text-center py-4">ยังไม่มีไฟล์</p>
                      ) : (
                        <div className="space-y-2">
                          {versions.map((version) => (
                            <div
                              key={version.id}
                              className="flex items-center gap-3 p-3 bg-[#F5F5F7] rounded-lg"
                            >
                              {/* Thumbnail */}
                              <div className="w-16 h-16 rounded-lg overflow-hidden bg-white border border-[#E8E8ED] flex-shrink-0">
                                {version.thumbnail_url || version.file_url ? (
                                  <img
                                    src={version.thumbnail_url || version.file_url}
                                    alt=""
                                    className="w-full h-full object-cover cursor-pointer"
                                    onClick={() => {
                                      setSelectedVersion(version);
                                      setShowVersionModal(true);
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-[#C7C7CC]" />
                                  </div>
                                )}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-[#1D1D1F] font-medium">Version {version.version_number}</span>
                                  {getVersionStatusIcon(version.status)}
                                </div>
                                <p className="text-xs text-[#86868B]">
                                  {new Date(version.created_at).toLocaleDateString('th-TH', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                                {version.feedback && (
                                  <p className="text-xs text-[#86868B] mt-1 truncate">
                                    💬 {version.feedback}
                                  </p>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedVersion(version);
                                    setShowVersionModal(true);
                                  }}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Mockups */}
                    {design.mockups && design.mockups.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm text-[#86868B] mb-2">Mockups:</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {design.mockups.map((mockup) => (
                            <div key={mockup.id} className="relative group">
                              <div className="aspect-square rounded-lg overflow-hidden bg-[#F5F5F7] border border-[#E8E8ED]">
                                {mockup.front_image_url && (
                                  <img
                                    src={mockup.front_image_url}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                              <div className="absolute top-1 right-1">
                                {mockup.status === 'approved' && (
                                  <CheckCircle2 className="w-5 h-5 text-green-600 bg-white rounded-full" />
                                )}
                                {mockup.status === 'rejected' && (
                                  <XCircle className="w-5 h-5 text-red-600 bg-white rounded-full" />
                                )}
                                {mockup.status === 'pending' && (
                                  <Clock className="w-5 h-5 text-yellow-600 bg-white rounded-full" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Design Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="เพิ่มงานออกแบบ"
      >
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-[#86868B] mb-1">ชื่องานออกแบบ *</label>
            <Input
              value={newDesignName}
              onChange={(e) => setNewDesignName(e.target.value)}
              placeholder="เช่น ลายหน้าอก, ลายหลัง"
            />
          </div>
          <div>
            <label className="block text-sm text-[#86868B] mb-1">ตำแหน่ง</label>
            <select
              value={newDesignPosition}
              onChange={(e) => setNewDesignPosition(e.target.value)}
              className="w-full px-3 py-2 bg-[#F5F5F7] border border-[#E8E8ED] rounded-lg text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
            >
              <option value="">เลือกตำแหน่ง</option>
              <option value="front">หน้า</option>
              <option value="back">หลัง</option>
              <option value="left_sleeve">แขนซ้าย</option>
              <option value="right_sleeve">แขนขวา</option>
              <option value="pocket">กระเป๋า</option>
              <option value="collar">คอ</option>
              <option value="other">อื่นๆ</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-[#86868B] mb-1">Brief / รายละเอียด</label>
            <textarea
              value={newDesignBrief}
              onChange={(e) => setNewDesignBrief(e.target.value)}
              rows={3}
              placeholder="รายละเอียดที่ลูกค้าต้องการ..."
              className="w-full px-3 py-2 bg-[#F5F5F7] border border-[#E8E8ED] rounded-lg text-[#1D1D1F] resize-none focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowAddModal(false)}>
              ยกเลิก
            </Button>
            <Button className="flex-1" onClick={handleAddDesign} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'บันทึก'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Upload Version Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          setUploadedFileUrl(null);
        }}
        title={`อัพโหลด Version ใหม่ - ${selectedDesign?.design_name}`}
      >
        <div className="p-4 space-y-4">
          <FileUpload
            bucket="designs"
            folder={`orders/${orderId}/${selectedDesign?.id}`}
            accept="image/*,.pdf,.ai,.psd"
            maxSizeMB={20}
            onUpload={(result) => {
              if (result.success && result.url) {
                setUploadedFileUrl(result.url);
              }
            }}
            description="รองรับ JPG, PNG, PDF, AI, PSD (สูงสุด 20MB)"
          />

          <div className="flex gap-2 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setShowUploadModal(false);
                setUploadedFileUrl(null);
              }}
            >
              ยกเลิก
            </Button>
            <Button
              className="flex-1"
              onClick={handleUploadVersion}
              disabled={loading || !uploadedFileUrl}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'อัพโหลด'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Version Modal */}
      <Modal
        isOpen={showVersionModal}
        onClose={() => {
          setShowVersionModal(false);
          setSelectedVersion(null);
        }}
        title={`Version ${selectedVersion?.version_number}`}
      >
        <div className="p-4">
          {selectedVersion && (
            <div className="space-y-4">
              {/* Image */}
              <div className="aspect-video bg-[#F5F5F7] rounded-lg overflow-hidden border border-[#E8E8ED]">
                <img
                  src={selectedVersion.file_url}
                  alt=""
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Info */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#86868B]">สถานะ</span>
                  <span className="text-[#1D1D1F] flex items-center gap-1">
                    {getVersionStatusIcon(selectedVersion.status)}
                    {selectedVersion.status === 'approved' ? 'อนุมัติแล้ว' :
                     selectedVersion.status === 'rejected' ? 'ขอแก้ไข' :
                     'รอตรวจสอบ'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#86868B]">อัพโหลดเมื่อ</span>
                  <span className="text-[#1D1D1F]">
                    {new Date(selectedVersion.created_at).toLocaleDateString('th-TH', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              {/* Feedback */}
              {selectedVersion.feedback && (
                <div className="p-3 bg-[#F5F5F7] rounded-lg">
                  <p className="text-xs text-[#86868B] mb-1">
                    💬 Feedback ({selectedVersion.feedback_by === 'customer' ? 'ลูกค้า' : 'แอดมิน'})
                  </p>
                  <p className="text-sm text-[#1D1D1F]">{selectedVersion.feedback}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <a
                  href={selectedVersion.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button variant="secondary" className="w-full">
                    <Eye className="w-4 h-4 mr-2" />
                    เปิดไฟล์
                  </Button>
                </a>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
