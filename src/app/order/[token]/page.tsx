'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  Package,
  Clock,
  CheckCircle2,
  DollarSign,
  FileText,
  Image as ImageIcon,
  Phone,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Palette,
  Factory,
  Truck,
  Check,
  X,
  RefreshCw,
  Shield,
  Copy,
} from 'lucide-react';
import { Button, Card, Modal, useToast } from '@/modules/shared/ui';
import { supabaseOrderRepository } from '@/modules/erp';
import type { Order, OrderDesign, DesignVersion, OrderMockup, ApprovalGate } from '@/modules/erp';

// Status flow
const STATUS_FLOW = [
  { key: 'draft', label: 'รับออเดอร์', icon: FileText },
  { key: 'pending', label: 'ออกแบบ', icon: Palette },
  { key: 'design_approved', label: 'อนุมัติแบบ', icon: Check },
  { key: 'in_production', label: 'กำลังผลิต', icon: Factory },
  { key: 'ready_to_ship', label: 'พร้อมส่ง', icon: Package },
  { key: 'shipped', label: 'จัดส่งแล้ว', icon: Truck },
  { key: 'completed', label: 'เสร็จสิ้น', icon: CheckCircle2 },
];

export default function CustomerOrderPage() {
  const params = useParams();
  const token = params.token as string;
  const { success, error: showError } = useToast();

  // Find order by token
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [designs, setDesigns] = useState<OrderDesign[]>([]);
  const [mockups, setMockups] = useState<OrderMockup[]>([]);
  const [gates, setGates] = useState<ApprovalGate[]>([]);

  // UI State
  const [activeTab, setActiveTab] = useState<'status' | 'design' | 'mockup' | 'payment'>('status');
  const [selectedDesign, setSelectedDesign] = useState<OrderDesign | null>(null);
  const [selectedMockup, setSelectedMockup] = useState<OrderMockup | null>(null);
  const [feedback, setFeedback] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalType, setApprovalType] = useState<'design' | 'mockup'>('design');

  const fetchOrderByToken = useCallback(async () => {
    setLoading(true);
    try {
      // Find order by access token
      const foundOrder = await supabaseOrderRepository.findByAccessToken(token);
      if (foundOrder) {
        setOrder(foundOrder);
        // Fetch related data
        const [designsData, mockupsData] = await Promise.all([
          supabaseOrderRepository.getDesigns(foundOrder.id),
          supabaseOrderRepository.getMockups(foundOrder.id),
        ]);
        setDesigns(designsData);
        setMockups(mockupsData);
        // Gates would need to be fetched from a separate table or calculated
        setGates([]);
      }
    } catch (err) {
      console.error('Error fetching order:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchOrderByToken();
  }, [fetchOrderByToken]);

  const formatDate = (date: string | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getCurrentStepIndex = () => {
    if (!order) return 0;
    const statusMap: Record<string, number> = {
      draft: 0,
      quoted: 0,
      pending: 1,
      confirmed: 1,
      in_production: 3,
      ready_to_ship: 4,
      shipped: 5,
      completed: 6,
    };
    return statusMap[order.status] || 0;
  };

  const handleApprove = (type: 'design' | 'mockup', item: OrderDesign | OrderMockup) => {
    // TODO: Implement approval API call
    success(`อนุมัติ${type === 'design' ? 'แบบ' : 'ตัวอย่าง'}แล้ว!`);
    setShowApprovalModal(false);
    setFeedback('');
  };

  const handleReject = (type: 'design' | 'mockup', item: OrderDesign | OrderMockup) => {
    if (!feedback.trim()) {
      showError('กรุณาระบุสิ่งที่ต้องการแก้ไข');
      return;
    }
    // TODO: Implement rejection API call
    success('ส่งคำขอแก้ไขแล้ว');
    setShowApprovalModal(false);
    setFeedback('');
  };

  const copyOrderNumber = () => {
    if (order?.order_number) {
      navigator.clipboard.writeText(order.order_number);
      success('คัดลอกเลขออเดอร์แล้ว');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1D1D1F] to-[#2C2C2E] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#007AFF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  // Not found
  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1D1D1F] to-[#2C2C2E] flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center bg-white/10 backdrop-blur border-white/20">
          <AlertCircle className="w-16 h-16 text-[#FF3B30] mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">ไม่พบออเดอร์</h1>
          <p className="text-white/60">ลิงก์นี้อาจหมดอายุหรือไม่ถูกต้อง</p>
          <p className="text-white/40 text-sm mt-2">กรุณาติดต่อร้านค้าเพื่อขอลิงก์ใหม่</p>
        </Card>
      </div>
    );
  }

  const currentStep = getCurrentStepIndex();
  const gatesSummary = getOrderGatesSummary(order.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1D1D1F] to-[#2C2C2E]">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur sticky top-0 z-10 border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">{order.order_number}</h1>
                <button onClick={copyOrderNumber} className="text-white/40 hover:text-white">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-white/60">{order.customer_snapshot?.name}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-[#34C759]">{formatCurrency(order.pricing?.total_amount || 0)}</p>
              <p className="text-xs text-white/40">กำหนดส่ง {formatDate(order.due_date)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-2">
          {STATUS_FLOW.map((step, index) => {
            const Icon = step.icon;
            const isActive = index <= currentStep;
            const isCurrent = index === currentStep;
            return (
              <div key={step.key} className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isActive ? 'bg-[#34C759]' : 'bg-white/10'
                } ${isCurrent ? 'ring-2 ring-[#34C759] ring-offset-2 ring-offset-[#1D1D1F]' : ''}`}>
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-white/40'}`} />
                </div>
                <span className={`text-xs mt-1 ${isActive ? 'text-white' : 'text-white/40'}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#34C759] transition-all duration-500"
            style={{ width: `${(currentStep / (STATUS_FLOW.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex gap-2 bg-white/5 rounded-xl p-1">
          {[
            { key: 'status', label: 'สถานะ', icon: Clock },
            { key: 'design', label: 'ออกแบบ', icon: Palette },
            { key: 'mockup', label: 'ตัวอย่าง', icon: ImageIcon },
            { key: 'payment', label: 'ชำระเงิน', icon: DollarSign },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-[#007AFF] text-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Status Tab */}
        {activeTab === 'status' && (
          <div className="space-y-4">
            {/* Gates Summary */}
            {gatesSummary && (
              <Card className="p-4 bg-white/5 backdrop-blur border-white/10">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#007AFF]" />
                  สถานะการอนุมัติ
                </h3>
                <div className="space-y-2">
                  {gatesSummary.gates.map((gate) => (
                    <div
                      key={gate.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        gate.status === 'approved'
                          ? 'bg-[#34C759]/10'
                          : gate.status === 'in_progress'
                          ? 'bg-[#007AFF]/10'
                          : 'bg-white/5'
                      }`}
                    >
                      <span className="text-white">{gate.gate_name_th}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        gate.status === 'approved'
                          ? 'bg-[#34C759] text-white'
                          : gate.status === 'in_progress'
                          ? 'bg-[#007AFF] text-white'
                          : 'bg-white/20 text-white/60'
                      }`}>
                        {gate.status === 'approved' ? 'ผ่าน' : gate.status === 'in_progress' ? 'รอดำเนินการ' : 'รอ'}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Order Info */}
            <Card className="p-4 bg-white/5 backdrop-blur border-white/10">
              <h3 className="text-white font-semibold mb-3">รายละเอียดออเดอร์</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">วันที่สั่ง</span>
                  <span className="text-white">{formatDate(order.order_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">กำหนดส่ง</span>
                  <span className="text-white">{formatDate(order.due_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">ยอดรวม</span>
                  <span className="text-[#34C759] font-bold">{formatCurrency(order.pricing?.total_amount || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">ชำระแล้ว</span>
                  <span className="text-white">{formatCurrency(order.paid_amount || 0)}</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Design Tab */}
        {activeTab === 'design' && (
          <div className="space-y-4">
            {designs.length === 0 ? (
              <Card className="p-8 bg-white/5 backdrop-blur border-white/10 text-center">
                <Palette className="w-12 h-12 text-white/30 mx-auto mb-2" />
                <p className="text-white/60">ยังไม่มีไฟล์ออกแบบ</p>
              </Card>
            ) : (
              designs.map((design) => {
                const versions = mockDesignVersions.filter(v => v.order_design_id === design.id);
                const latestVersion = versions[0];
                return (
                  <Card key={design.id} className="p-4 bg-white/5 backdrop-blur border-white/10">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-white font-semibold">{design.design_name}</h4>
                        <p className="text-sm text-white/60">{design.position}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        design.status === 'approved'
                          ? 'bg-[#34C759] text-white'
                          : design.status === 'pending'
                          ? 'bg-[#FF9500] text-white'
                          : 'bg-white/20 text-white/60'
                      }`}>
                        {design.status === 'approved' ? 'อนุมัติแล้ว' : design.status === 'pending' ? 'รออนุมัติ' : 'รอแก้ไข'}
                      </span>
                    </div>

                    {latestVersion && (
                      <div
                        className="aspect-video bg-white/5 rounded-lg mb-3 cursor-pointer overflow-hidden"
                        onClick={() => window.open(latestVersion.file_url, '_blank')}
                      >
                        {latestVersion.thumbnail_url ? (
                          <img
                            src={latestVersion.thumbnail_url}
                            alt={design.design_name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/30">
                            คลิกเพื่อดู
                          </div>
                        )}
                      </div>
                    )}

                    {design.status === 'pending' && latestVersion?.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          className="flex-1 gap-2 bg-[#34C759] hover:bg-[#2DB84D]"
                          onClick={() => {
                            setSelectedDesign(design);
                            setApprovalType('design');
                            setShowApprovalModal(true);
                          }}
                        >
                          <ThumbsUp className="w-4 h-4" />
                          อนุมัติ
                        </Button>
                        <Button
                          variant="secondary"
                          className="flex-1 gap-2 border-white/20 text-white hover:bg-white/10"
                          onClick={() => {
                            setSelectedDesign(design);
                            setApprovalType('design');
                            setShowApprovalModal(true);
                          }}
                        >
                          <ThumbsDown className="w-4 h-4" />
                          ขอแก้ไข
                        </Button>
                      </div>
                    )}

                    <p className="text-xs text-white/40 mt-2">
                      เวอร์ชัน {design.current_version} • แก้ไข {design.revision_count} ครั้ง
                      {design.paid_revision_count > 0 && (
                        <span className="text-[#FF9500]"> (ค่าแก้ไข ฿{design.paid_revision_total})</span>
                      )}
                    </p>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* Mockup Tab */}
        {activeTab === 'mockup' && (
          <div className="space-y-4">
            {mockups.length === 0 ? (
              <Card className="p-8 bg-white/5 backdrop-blur border-white/10 text-center">
                <ImageIcon className="w-12 h-12 text-white/30 mx-auto mb-2" />
                <p className="text-white/60">ยังไม่มี Mockup</p>
              </Card>
            ) : (
              mockups.map((mockup) => (
                <Card key={mockup.id} className="p-4 bg-white/5 backdrop-blur border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-white font-semibold">Mockup เวอร์ชัน {mockup.version_number}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      mockup.status === 'approved'
                        ? 'bg-[#34C759] text-white'
                        : mockup.status === 'pending'
                        ? 'bg-[#FF9500] text-white'
                        : 'bg-white/20 text-white/60'
                    }`}>
                      {mockup.status === 'approved' ? 'อนุมัติแล้ว' : mockup.status === 'pending' ? 'รออนุมัติ' : 'ไม่อนุมัติ'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {mockup.front_image_url && (
                      <div
                        className="aspect-square bg-white/5 rounded-lg overflow-hidden cursor-pointer"
                        onClick={() => window.open(mockup.front_image_url, '_blank')}
                      >
                        <img src={mockup.front_image_url} alt="Front" className="w-full h-full object-contain" />
                      </div>
                    )}
                    {mockup.back_image_url && (
                      <div
                        className="aspect-square bg-white/5 rounded-lg overflow-hidden cursor-pointer"
                        onClick={() => window.open(mockup.back_image_url, '_blank')}
                      >
                        <img src={mockup.back_image_url} alt="Back" className="w-full h-full object-contain" />
                      </div>
                    )}
                  </div>

                  {mockup.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 gap-2 bg-[#34C759] hover:bg-[#2DB84D]"
                        onClick={() => {
                          setSelectedMockup(mockup);
                          setApprovalType('mockup');
                          setShowApprovalModal(true);
                        }}
                      >
                        <ThumbsUp className="w-4 h-4" />
                        อนุมัติ Mockup
                      </Button>
                      <Button
                        variant="secondary"
                        className="flex-1 gap-2 border-white/20 text-white hover:bg-white/10"
                        onClick={() => {
                          setSelectedMockup(mockup);
                          setApprovalType('mockup');
                          setShowApprovalModal(true);
                        }}
                      >
                        <ThumbsDown className="w-4 h-4" />
                        ขอแก้ไข
                      </Button>
                    </div>
                  )}

                  {mockup.status === 'approved' && mockup.customer_feedback && (
                    <p className="text-sm text-white/60 mt-2">💬 {mockup.customer_feedback}</p>
                  )}
                </Card>
              ))
            )}
          </div>
        )}

        {/* Payment Tab */}
        {activeTab === 'payment' && (
          <div className="space-y-4">
            <Card className="p-4 bg-white/5 backdrop-blur border-white/10">
              <h3 className="text-white font-semibold mb-3">สรุปการชำระเงิน</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">ยอดรวม</span>
                  <span className="text-white">{formatCurrency(order.pricing?.total_amount || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">ชำระแล้ว</span>
                  <span className="text-[#34C759]">{formatCurrency(order.paid_amount || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">ค้างชำระ</span>
                  <span className="text-[#FF9500]">{formatCurrency((order.pricing?.total_amount || 0) - (order.paid_amount || 0))}</span>
                </div>
              </div>

              {/* Progress */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-white/40 mb-1">
                  <span>ความคืบหน้า</span>
                  <span>{Math.round(((order.paid_amount || 0) / (order.pricing?.total_amount || 1)) * 100)}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#34C759]"
                    style={{ width: `${((order.paid_amount || 0) / (order.pricing?.total_amount || 1)) * 100}%` }}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-white/5 backdrop-blur border-white/10">
              <h3 className="text-white font-semibold mb-3">บัญชีโอนเงิน</h3>
              <div className="space-y-2 text-sm">
                <p className="text-white/60">ธนาคารกสิกรไทย</p>
                <p className="text-white font-mono text-lg">123-4-56789-0</p>
                <p className="text-white">ชื่อบัญชี: บริษัท อนาจักร จำกัด</p>
              </div>
              <Button
                className="w-full mt-4 gap-2"
                onClick={() => navigator.clipboard.writeText('1234567890')}
              >
                <Copy className="w-4 h-4" />
                คัดลอกเลขบัญชี
              </Button>
            </Card>
          </div>
        )}
      </div>

      {/* Contact Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/50 backdrop-blur border-t border-white/10 p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="text-white/60 text-sm">
            มีปัญหา? ติดต่อเรา
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="gap-2 border-white/20 text-white hover:bg-white/10"
            onClick={() => window.open('tel:0812345678')}
          >
            <Phone className="w-4 h-4" />
            081-234-5678
          </Button>
        </div>
      </div>

      {/* Approval Modal */}
      <Modal
        isOpen={showApprovalModal}
        onClose={() => {
          setShowApprovalModal(false);
          setFeedback('');
          setSelectedDesign(null);
          setSelectedMockup(null);
        }}
        title={approvalType === 'design' ? 'อนุมัติแบบ' : 'อนุมัติ Mockup'}
      >
        <div className="p-4 space-y-4">
          <p className="text-[#86868B]">
            กรุณาตรวจสอบ{approvalType === 'design' ? 'แบบ' : 'ตัวอย่าง'}อย่างละเอียด
            การแก้ไขหลังอนุมัติอาจมีค่าใช้จ่ายเพิ่มเติม
          </p>

          <div className="flex gap-3">
            <Button
              className="flex-1 gap-2 bg-[#34C759] hover:bg-[#2DB84D]"
              onClick={() => {
                if (approvalType === 'design' && selectedDesign) {
                  handleApprove('design', selectedDesign);
                } else if (approvalType === 'mockup' && selectedMockup) {
                  handleApprove('mockup', selectedMockup);
                }
              }}
            >
              <ThumbsUp className="w-4 h-4" />
              อนุมัติ
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowApprovalModal(false)}
            >
              ยกเลิก
            </Button>
          </div>

          <div className="border-t border-[#E8E8ED] pt-4">
            <label className="text-sm font-medium text-[#1D1D1F] mb-2 block">
              หรือขอแก้ไข (ระบุสิ่งที่ต้องการแก้ไข)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="เช่น ขอเปลี่ยนสี, ขอขยับตำแหน่ง..."
              className="w-full px-3 py-2 bg-[#F5F5F7] rounded-lg text-sm resize-none"
              rows={3}
            />
            <Button
              variant="secondary"
              className="w-full mt-2 gap-2 text-[#FF9500]"
              disabled={!feedback.trim()}
              onClick={() => {
                if (approvalType === 'design' && selectedDesign) {
                  handleReject('design', selectedDesign);
                } else if (approvalType === 'mockup' && selectedMockup) {
                  handleReject('mockup', selectedMockup);
                }
              }}
            >
              <MessageSquare className="w-4 h-4" />
              ส่งคำขอแก้ไข
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
