'use client';

import { useState } from 'react';
import { Card, Button, Input, Modal, useToast, Dropdown } from '@/modules/shared/ui';
import {
  RotateCcw,
  AlertTriangle,
  Pause,
  Play,
  RefreshCw,
  DollarSign,
  Palette,
  Package,
  Truck,
  XCircle,
  CheckCircle2,
  Clock,
  ArrowLeft,
  ArrowRight,
  MessageSquare,
  Edit,
  Plus,
  Minus,
  Zap,
} from 'lucide-react';
import type { Order, OrderStatus } from '../types';

interface QuickActionsProps {
  order: Order;
  onStatusChange: (newStatus: OrderStatus, reason: string) => Promise<boolean>;
  onAddEvent?: (category: string, title: string, description: string) => Promise<boolean>;
  onRefresh: () => void;
}

// สถานการณ์ที่ลูกค้าเรื่องมากทำให้เกิด
const DIFFICULT_CUSTOMER_SCENARIOS = [
  {
    id: 'change_design',
    label: 'ลูกค้าขอเปลี่ยนแบบ',
    icon: Palette,
    color: 'text-purple-600',
    bg: 'bg-purple-100',
    description: 'ลูกค้าต้องการแก้ไขงานออกแบบ',
    targetStatus: 'designing' as OrderStatus,
    eventCategory: 'design_revision',
    affectsDeadline: true,
    affectsCost: true,
  },
  {
    id: 'change_quantity',
    label: 'เปลี่ยนจำนวน',
    icon: Package,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    description: 'ลูกค้าขอเพิ่ม/ลดจำนวน',
    targetStatus: null,
    eventCategory: 'scope_change',
    affectsDeadline: true,
    affectsCost: true,
  },
  {
    id: 'reject_mockup',
    label: 'ไม่อนุมัติ Mockup',
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-100',
    description: 'ลูกค้าไม่อนุมัติ Mockup ต้องแก้ไข',
    targetStatus: 'designing' as OrderStatus,
    eventCategory: 'design_revision',
    affectsDeadline: true,
    affectsCost: false,
  },
  {
    id: 'pause_order',
    label: 'พักออเดอร์',
    icon: Pause,
    color: 'text-yellow-600',
    bg: 'bg-yellow-100',
    description: 'ลูกค้าขอพักออเดอร์ชั่วคราว',
    targetStatus: null,
    eventCategory: 'order_hold',
    affectsDeadline: true,
    affectsCost: false,
  },
  {
    id: 'rush_order',
    label: 'เร่งด่วน',
    icon: Zap,
    color: 'text-orange-600',
    bg: 'bg-orange-100',
    description: 'ลูกค้าขอเร่งงาน',
    targetStatus: null,
    eventCategory: 'priority_change',
    affectsDeadline: true,
    affectsCost: true,
  },
  {
    id: 'change_shipping',
    label: 'เปลี่ยนที่อยู่',
    icon: Truck,
    color: 'text-green-600',
    bg: 'bg-green-100',
    description: 'ลูกค้าเปลี่ยนที่อยู่จัดส่ง',
    targetStatus: null,
    eventCategory: 'customer_request',
    affectsDeadline: false,
    affectsCost: false,
  },
  {
    id: 'refund_request',
    label: 'ขอคืนเงิน',
    icon: DollarSign,
    color: 'text-red-600',
    bg: 'bg-red-100',
    description: 'ลูกค้าขอคืนเงิน',
    targetStatus: null,
    eventCategory: 'refund_request',
    affectsDeadline: false,
    affectsCost: true,
  },
  {
    id: 'redo_production',
    label: 'ทำใหม่',
    icon: RefreshCw,
    color: 'text-indigo-600',
    bg: 'bg-indigo-100',
    description: 'ต้องผลิตใหม่เพราะงานไม่ได้มาตรฐาน',
    targetStatus: 'in_production' as OrderStatus,
    eventCategory: 'replacement',
    affectsDeadline: true,
    affectsCost: true,
  },
];

// Status Flow - สถานะไหนย้อนกลับไปสถานะไหนได้
const STATUS_ROLLBACK_OPTIONS: Record<OrderStatus, { to: OrderStatus; label: string; reason: string }[]> = {
  draft: [],
  quoted: [
    { to: 'draft', label: 'กลับไปร่าง', reason: 'ต้องแก้ไขข้อมูลออเดอร์' },
  ],
  awaiting_payment: [
    { to: 'quoted', label: 'กลับไปเสนอราคา', reason: 'ต้องแก้ไขราคา/รายการ' },
    { to: 'draft', label: 'กลับไปร่าง', reason: 'ต้องแก้ไขข้อมูลออเดอร์' },
  ],
  partial_paid: [
    { to: 'awaiting_payment', label: 'กลับไปรอชำระ', reason: 'ยกเลิกการชำระเงินบางส่วน' },
  ],
  designing: [
    { to: 'awaiting_payment', label: 'กลับไปรอชำระ', reason: 'ยังไม่ชำระเงินครบ' },
    { to: 'partial_paid', label: 'กลับไปชำระบางส่วน', reason: 'รอชำระเพิ่ม' },
  ],
  awaiting_mockup_approval: [
    { to: 'designing', label: 'กลับไปออกแบบ', reason: 'ลูกค้าขอแก้ไขแบบ' },
  ],
  awaiting_material: [
    { to: 'awaiting_mockup_approval', label: 'กลับไปรอ Mockup', reason: 'ต้องแก้ไข Mockup' },
    { to: 'designing', label: 'กลับไปออกแบบ', reason: 'ลูกค้าขอเปลี่ยนแบบ' },
  ],
  queued: [
    { to: 'awaiting_material', label: 'กลับไปรอวัตถุดิบ', reason: 'ของยังไม่พร้อม' },
    { to: 'designing', label: 'กลับไปออกแบบ', reason: 'ลูกค้าขอเปลี่ยนแบบ' },
  ],
  in_production: [
    { to: 'queued', label: 'กลับไปรอคิว', reason: 'ต้องพักการผลิต' },
    { to: 'designing', label: 'กลับไปออกแบบ', reason: 'ลูกค้าขอเปลี่ยนแบบ' },
  ],
  qc_pending: [
    { to: 'in_production', label: 'กลับไปผลิต', reason: 'งานไม่ผ่าน QC ต้องทำใหม่' },
  ],
  ready_to_ship: [
    { to: 'qc_pending', label: 'กลับไป QC', reason: 'ต้องตรวจสอบใหม่' },
    { to: 'in_production', label: 'กลับไปผลิต', reason: 'ต้องทำใหม่' },
  ],
  shipped: [
    { to: 'ready_to_ship', label: 'กลับไปพร้อมส่ง', reason: 'ยกเลิกการจัดส่ง' },
  ],
  completed: [
    { to: 'shipped', label: 'กลับไปจัดส่งแล้ว', reason: 'ยังไม่ได้รับของ' },
  ],
  cancelled: [],
};

// สถานะที่ไปต่อได้
const STATUS_FORWARD_OPTIONS: Record<OrderStatus, { to: OrderStatus; label: string }[]> = {
  draft: [
    { to: 'quoted', label: 'ส่งใบเสนอราคา' },
    { to: 'awaiting_payment', label: 'รอชำระเงิน' },
  ],
  quoted: [
    { to: 'awaiting_payment', label: 'ลูกค้ายืนยัน รอชำระเงิน' },
  ],
  awaiting_payment: [
    { to: 'partial_paid', label: 'รับมัดจำแล้ว' },
    { to: 'designing', label: 'ชำระครบ เริ่มออกแบบ' },
  ],
  partial_paid: [
    { to: 'designing', label: 'เริ่มออกแบบ' },
  ],
  designing: [
    { to: 'awaiting_mockup_approval', label: 'ส่ง Mockup ให้ลูกค้า' },
  ],
  awaiting_mockup_approval: [
    { to: 'awaiting_material', label: 'ลูกค้าอนุมัติ รอวัตถุดิบ' },
    { to: 'in_production', label: 'ลูกค้าอนุมัติ เริ่มผลิต' },
  ],
  awaiting_material: [
    { to: 'queued', label: 'วัตถุดิบพร้อม รอคิว' },
    { to: 'in_production', label: 'วัตถุดิบพร้อม เริ่มผลิต' },
  ],
  queued: [
    { to: 'in_production', label: 'เริ่มผลิต' },
  ],
  in_production: [
    { to: 'qc_pending', label: 'ผลิตเสร็จ รอ QC' },
  ],
  qc_pending: [
    { to: 'ready_to_ship', label: 'QC ผ่าน พร้อมส่ง' },
    { to: 'in_production', label: 'QC ไม่ผ่าน ผลิตใหม่' },
  ],
  ready_to_ship: [
    { to: 'shipped', label: 'จัดส่งแล้ว' },
  ],
  shipped: [
    { to: 'completed', label: 'ลูกค้าได้รับของ สำเร็จ' },
  ],
  completed: [],
  cancelled: [],
};

export function QuickActions({ order, onStatusChange, onAddEvent, onRefresh }: QuickActionsProps) {
  const { success, error: showError } = useToast();
  const [showScenarioModal, setShowScenarioModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<typeof DIFFICULT_CUSTOMER_SCENARIOS[0] | null>(null);
  const [statusDirection, setStatusDirection] = useState<'forward' | 'backward'>('forward');
  
  // Form state
  const [reason, setReason] = useState('');
  const [additionalDays, setAdditionalDays] = useState(0);
  const [additionalCost, setAdditionalCost] = useState(0);
  const [processing, setProcessing] = useState(false);

  const currentStatus = order.status;
  const rollbackOptions = STATUS_ROLLBACK_OPTIONS[currentStatus] || [];
  const forwardOptions = STATUS_FORWARD_OPTIONS[currentStatus] || [];

  const handleScenarioSelect = (scenario: typeof DIFFICULT_CUSTOMER_SCENARIOS[0]) => {
    setSelectedScenario(scenario);
    setReason(scenario.description);
    setAdditionalDays(scenario.affectsDeadline ? 3 : 0);
    setAdditionalCost(0);
    setShowScenarioModal(true);
  };

  const handleScenarioSubmit = async () => {
    if (!selectedScenario) return;
    
    setProcessing(true);
    try {
      // Add event first
      if (onAddEvent) {
        await onAddEvent(selectedScenario.eventCategory, selectedScenario.label, reason);
      }

      // Change status if applicable
      if (selectedScenario.targetStatus) {
        const result = await onStatusChange(selectedScenario.targetStatus, reason);
        if (!result) {
          throw new Error('ไม่สามารถเปลี่ยนสถานะได้');
        }
      }

      success(`บันทึก "${selectedScenario.label}" เรียบร้อย`);
      setShowScenarioModal(false);
      setSelectedScenario(null);
      setReason('');
      onRefresh();
    } catch (err: any) {
      showError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setProcessing(false);
    }
  };

  const handleStatusChange = async (newStatus: OrderStatus, defaultReason: string) => {
    if (!reason.trim()) {
      setReason(defaultReason);
    }
    
    setProcessing(true);
    try {
      const result = await onStatusChange(newStatus, reason || defaultReason);
      if (result) {
        success('เปลี่ยนสถานะเรียบร้อย');
        setShowStatusModal(false);
        setReason('');
        onRefresh();
      } else {
        throw new Error('ไม่สามารถเปลี่ยนสถานะได้');
      }
    } catch (err: any) {
      showError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setProcessing(false);
    }
  };

  if (currentStatus === 'cancelled' || currentStatus === 'completed') {
    return (
      <Card className="p-6 bg-white border border-[#E8E8ED]">
        <div className="text-center py-4 text-[#86868B]">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>ออเดอร์นี้ {currentStatus === 'completed' ? 'เสร็จสิ้นแล้ว' : 'ถูกยกเลิกแล้ว'}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Status Actions */}
      <Card className="p-6 bg-white border border-[#E8E8ED]">
        <h3 className="text-lg font-semibold text-[#1D1D1F] mb-4">เปลี่ยนสถานะ</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Forward */}
          {forwardOptions.length > 0 && (
            <div>
              <p className="text-sm text-[#86868B] mb-2 flex items-center gap-1">
                <ArrowRight className="w-4 h-4" />
                ขั้นตอนถัดไป
              </p>
              <div className="space-y-2">
                {forwardOptions.map((opt) => (
                  <Button
                    key={opt.to}
                    variant="secondary"
                    className="w-full justify-start text-left bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                    onClick={() => handleStatusChange(opt.to, opt.label)}
                    disabled={processing}
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Backward */}
          {rollbackOptions.length > 0 && (
            <div>
              <p className="text-sm text-[#86868B] mb-2 flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" />
                ย้อนกลับ
              </p>
              <div className="space-y-2">
                {rollbackOptions.map((opt) => (
                  <Button
                    key={opt.to}
                    variant="secondary"
                    className="w-full justify-start text-left bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
                    onClick={() => {
                      setReason(opt.reason);
                      handleStatusChange(opt.to, opt.reason);
                    }}
                    disabled={processing}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Difficult Customer Scenarios */}
      <Card className="p-6 bg-white border border-[#E8E8ED]">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-[#1D1D1F]">ลูกค้าเรื่องมาก?</h3>
        </div>
        <p className="text-sm text-[#86868B] mb-4">เลือกสถานการณ์ที่เกิดขึ้น ระบบจะช่วยจัดการให้</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {DIFFICULT_CUSTOMER_SCENARIOS.map((scenario) => {
            const Icon = scenario.icon;
            return (
              <button
                key={scenario.id}
                onClick={() => handleScenarioSelect(scenario)}
                className={`p-3 rounded-xl text-center transition-all hover:scale-105 ${scenario.bg}`}
              >
                <Icon className={`w-6 h-6 mx-auto mb-1 ${scenario.color}`} />
                <p className="text-xs font-medium text-[#1D1D1F]">{scenario.label}</p>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Cancel Order */}
      <Card className="p-6 bg-red-50 border border-red-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-red-700">ยกเลิกออเดอร์</h3>
            <p className="text-sm text-red-600">การยกเลิกจะไม่สามารถย้อนกลับได้</p>
          </div>
          <Button
            variant="secondary"
            className="bg-red-100 border-red-300 text-red-700 hover:bg-red-200"
            onClick={() => {
              setReason('');
              setStatusDirection('backward');
              setShowStatusModal(true);
            }}
          >
            <XCircle className="w-4 h-4 mr-2" />
            ยกเลิกออเดอร์
          </Button>
        </div>
      </Card>

      {/* Scenario Modal */}
      <Modal
        isOpen={showScenarioModal}
        onClose={() => setShowScenarioModal(false)}
        title={selectedScenario?.label || 'จัดการสถานการณ์'}
      >
        {selectedScenario && (
          <div className="space-y-4">
            {/* Info */}
            <div className={`p-4 rounded-xl ${selectedScenario.bg}`}>
              <div className="flex items-center gap-3">
                {(() => {
                  const Icon = selectedScenario.icon;
                  return <Icon className={`w-8 h-8 ${selectedScenario.color}`} />;
                })()}
                <div>
                  <p className={`font-medium ${selectedScenario.color}`}>{selectedScenario.label}</p>
                  <p className="text-sm text-[#86868B]">{selectedScenario.description}</p>
                </div>
              </div>
            </div>

            {/* Status Change Notice */}
            {selectedScenario.targetStatus && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700">
                  <ArrowRight className="w-4 h-4 inline mr-1" />
                  สถานะจะเปลี่ยนเป็น: <strong>{selectedScenario.targetStatus}</strong>
                </p>
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="block text-sm text-[#86868B] mb-2">เหตุผล/รายละเอียด</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-[#F5F5F7] border border-[#E8E8ED] rounded-xl text-[#1D1D1F] resize-none focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                placeholder="อธิบายรายละเอียดเพิ่มเติม..."
              />
            </div>

            {/* Impact */}
            <div className="grid grid-cols-2 gap-4">
              {selectedScenario.affectsDeadline && (
                <div>
                  <label className="block text-sm text-[#86868B] mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    ขยายเวลา (วัน)
                  </label>
                  <Input
                    type="number"
                    value={additionalDays || ''}
                    onChange={(e) => setAdditionalDays(parseInt(e.target.value) || 0)}
                    min={0}
                    className="bg-[#F5F5F7] border-[#E8E8ED]"
                  />
                </div>
              )}
              
              {selectedScenario.affectsCost && (
                <div>
                  <label className="block text-sm text-[#86868B] mb-2">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    ค่าใช้จ่ายเพิ่ม (บาท)
                  </label>
                  <Input
                    type="number"
                    value={additionalCost || ''}
                    onChange={(e) => setAdditionalCost(parseInt(e.target.value) || 0)}
                    min={0}
                    className="bg-[#F5F5F7] border-[#E8E8ED]"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="secondary" onClick={() => setShowScenarioModal(false)}>
                ยกเลิก
              </Button>
              <Button onClick={handleScenarioSubmit} disabled={processing}>
                {processing ? 'กำลังบันทึก...' : 'ยืนยัน'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="ยกเลิกออเดอร์"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 rounded-xl border border-red-200">
            <p className="text-red-700 font-medium">⚠️ คำเตือน</p>
            <p className="text-sm text-red-600">การยกเลิกออเดอร์จะไม่สามารถย้อนกลับได้ กรุณาระบุเหตุผล</p>
          </div>
          
          <div>
            <label className="block text-sm text-[#86868B] mb-2">เหตุผลในการยกเลิก *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-[#F5F5F7] border border-[#E8E8ED] rounded-xl text-[#1D1D1F] resize-none focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
              placeholder="ระบุเหตุผลในการยกเลิก..."
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
              ไม่ยกเลิก
            </Button>
            <Button 
              className="bg-red-500 hover:bg-red-600"
              onClick={() => handleStatusChange('cancelled', reason)}
              disabled={!reason.trim() || processing}
            >
              {processing ? 'กำลังยกเลิก...' : 'ยืนยันยกเลิก'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default QuickActions;

