'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Package,
  Truck,
  DollarSign,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Edit,
  Printer,
  Send,
  Factory,
  Palette,
  ClipboardCheck,
  Ban,
  MoreHorizontal,
  Copy,
  ExternalLink,
  Plus,
  Upload,
  Image,
  MessageSquare,
  History,
} from 'lucide-react';
import { Button, Card, Input, Modal, Dropdown, useToast } from '@/modules/shared/ui';
import { useOrder, useOrderNotes, useOrderStatusHistory } from '@/modules/orders/hooks/useOrders';
import { useOrderMutations } from '@/modules/orders/hooks/useOrderMutations';
import { ORDER_STATUS_CONFIG, type OrderStatus } from '@/modules/orders/types';

// =============================================
// ORDER WORKFLOW STEPS
// =============================================
const WORKFLOW_STEPS = [
  { 
    id: 'draft', 
    label: 'ร่าง', 
    icon: FileText,
    statuses: ['draft', 'quoted'],
    action: 'ส่งใบเสนอราคา',
    nextStatus: 'awaiting_payment',
  },
  { 
    id: 'payment', 
    label: 'ชำระเงิน', 
    icon: DollarSign,
    statuses: ['awaiting_payment', 'partial_paid'],
    action: 'ยืนยันการชำระ',
    nextStatus: 'designing',
  },
  { 
    id: 'design', 
    label: 'ออกแบบ', 
    icon: Palette,
    statuses: ['designing', 'awaiting_mockup_approval'],
    action: 'ส่ง Mockup',
    nextStatus: 'in_production',
  },
  { 
    id: 'production', 
    label: 'ผลิต', 
    icon: Factory,
    statuses: ['in_production', 'awaiting_material', 'queued'],
    action: 'ผลิตเสร็จ',
    nextStatus: 'qc_pending',
  },
  { 
    id: 'qc', 
    label: 'QC', 
    icon: ClipboardCheck,
    statuses: ['qc_pending'],
    action: 'ผ่าน QC',
    nextStatus: 'ready_to_ship',
  },
  { 
    id: 'shipping', 
    label: 'จัดส่ง', 
    icon: Truck,
    statuses: ['ready_to_ship', 'shipped'],
    action: 'จัดส่งแล้ว',
    nextStatus: 'completed',
  },
  { 
    id: 'completed', 
    label: 'เสร็จสิ้น', 
    icon: CheckCircle2,
    statuses: ['completed'],
    action: null,
    nextStatus: null,
  },
];

function getCurrentStep(status: OrderStatus) {
  const index = WORKFLOW_STEPS.findIndex(step => step.statuses.includes(status));
  return index >= 0 ? index : 0;
}

// =============================================
// MAIN COMPONENT
// =============================================
export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const { success, error: showError } = useToast();

  // Data hooks
  const { order, loading, error, refetch } = useOrder(orderId);
  const { notes, refetch: refetchNotes } = useOrderNotes(orderId);
  const { history } = useOrderStatusHistory(orderId);
  const { updateOrderStatus, loading: updating } = useOrderMutations();

  // State
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | ''>('');

  // Get current workflow step
  const currentStepIndex = order ? getCurrentStep(order.status) : 0;
  const currentStep = WORKFLOW_STEPS[currentStepIndex];
  const isCancelled = order?.status === 'cancelled';
  const isCompleted = order?.status === 'completed';

  // Handle status change
  const handleStatusChange = async () => {
    if (!order || !selectedStatus) return;
    
    try {
      const result = await updateOrderStatus(order.id, selectedStatus as OrderStatus);
      if (result.success) {
        success('อัพเดทสถานะสำเร็จ!');
        refetch();
        setShowStatusModal(false);
      } else {
        showError(result.error || 'เกิดข้อผิดพลาด');
      }
    } catch (err) {
      showError('เกิดข้อผิดพลาด');
    }
  };

  // Handle next step
  const handleNextStep = async () => {
    if (!order || !currentStep.nextStatus) return;
    
    try {
      const result = await updateOrderStatus(order.id, currentStep.nextStatus as OrderStatus);
      if (result.success) {
        success(`อัพเดทเป็น "${WORKFLOW_STEPS[currentStepIndex + 1]?.label}" สำเร็จ!`);
        refetch();
      } else {
        showError(result.error || 'เกิดข้อผิดพลาด');
      }
    } catch (err) {
      showError('เกิดข้อผิดพลาด');
    }
  };

  // Format helpers
  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '฿0';
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-[#007AFF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#86868B]">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !order) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#1D1D1F] mb-2">ไม่พบออเดอร์</h2>
          <p className="text-[#86868B] mb-4">{error || 'ออเดอร์นี้อาจถูกลบหรือไม่มีอยู่'}</p>
          <Link href="/orders">
            <Button>กลับไปหน้ารายการ</Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = ORDER_STATUS_CONFIG[order.status];

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/orders" className="inline-flex items-center text-[#86868B] hover:text-[#1D1D1F] mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          กลับไปรายการออเดอร์
        </Link>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#1D1D1F]">{order.order_number}</h1>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusConfig?.bgColor} ${statusConfig?.color}`}>
                {statusConfig?.label_th}
              </span>
            </div>
            <p className="text-[#86868B] mt-1">
              สร้างเมื่อ {formatDateTime(order.created_at)}
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowStatusModal(true)}>
              <Edit className="w-4 h-4 mr-2" />
              เปลี่ยนสถานะ
            </Button>
            <Button variant="secondary">
              <Printer className="w-4 h-4 mr-2" />
              พิมพ์
            </Button>
          </div>
        </div>
      </div>

      {/* Workflow Progress */}
      <Card className="p-6 bg-white border-[#E8E8ED] mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#1D1D1F]">ขั้นตอนดำเนินการ</h2>
          {!isCancelled && !isCompleted && currentStep.action && (
            <Button onClick={handleNextStep} disabled={updating}>
              {currentStep.action}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {WORKFLOW_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isPending = index > currentStepIndex;

            return (
              <div key={step.id} className="flex-1 flex items-center">
                {/* Step Circle */}
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isCompleted
                      ? 'bg-[#34C759] text-white'
                      : isCurrent
                        ? 'bg-[#007AFF] text-white'
                        : 'bg-[#F5F5F7] text-[#86868B]'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className={`text-xs mt-2 ${
                    isCurrent ? 'text-[#007AFF] font-medium' : 'text-[#86868B]'
                  }`}>
                    {step.label}
                  </span>
                </div>

                {/* Connector Line */}
                {index < WORKFLOW_STEPS.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded-full ${
                    isCompleted ? 'bg-[#34C759]' : 'bg-[#E8E8ED]'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Current Action Card */}
        {!isCancelled && !isCompleted && (
          <div className="mt-6 p-4 bg-[#007AFF]/5 rounded-xl border border-[#007AFF]/20">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#007AFF] flex items-center justify-center text-white flex-shrink-0">
                <currentStep.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-[#1D1D1F]">
                  ขั้นตอนปัจจุบัน: {currentStep.label}
                </h3>
                <p className="text-sm text-[#86868B] mt-1">
                  {getStepDescription(order.status)}
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <Card className="p-6 bg-white border-[#E8E8ED]">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-[#007AFF]" />
              <h2 className="text-lg font-semibold text-[#1D1D1F]">ข้อมูลลูกค้า</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-lg font-medium text-[#1D1D1F]">{order.customer_name}</div>
                {order.customer_phone && (
                  <div className="flex items-center gap-2 text-[#86868B] mt-1">
                    <Phone className="w-4 h-4" />
                    {order.customer_phone}
                  </div>
                )}
                {order.customer_email && (
                  <div className="flex items-center gap-2 text-[#86868B] mt-1">
                    <Mail className="w-4 h-4" />
                    {order.customer_email}
                  </div>
                )}
              </div>

              {order.shipping_address && (
                <div>
                  <div className="flex items-center gap-2 text-[#86868B] mb-1">
                    <MapPin className="w-4 h-4" />
                    ที่อยู่จัดส่ง
                  </div>
                  <div className="text-sm text-[#1D1D1F]">
                    {order.shipping_address}
                    {(order as any).shipping_subdistrict && ` ${(order as any).shipping_subdistrict}`}
                    {order.shipping_district && ` ${order.shipping_district}`}
                    {order.shipping_province && ` ${order.shipping_province}`}
                    {order.shipping_postal_code && ` ${order.shipping_postal_code}`}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Work Items */}
          <Card className="p-6 bg-white border-[#E8E8ED]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-[#34C759]" />
                <h2 className="text-lg font-semibold text-[#1D1D1F]">รายการสินค้า/งาน</h2>
              </div>
              <span className="text-sm text-[#86868B]">
                {order.work_items?.length || 0} รายการ
              </span>
            </div>

            {order.work_items && order.work_items.length > 0 ? (
              <div className="space-y-3">
                {order.work_items.map((item: any, index: number) => (
                  <div key={item.id || index} className="p-4 bg-[#F5F5F7] rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-[#1D1D1F]">
                          {item.work_type_name || item.description || `รายการ ${index + 1}`}
                        </div>
                        <div className="text-sm text-[#86868B] mt-1">
                          {item.position_name && `${item.position_name} • `}
                          {item.print_size_name && `${item.print_size_name} • `}
                          จำนวน {item.quantity || 0} ชิ้น
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-[#1D1D1F]">
                          {formatCurrency((item.quantity || 0) * (item.unit_price || 0))}
                        </div>
                        <div className="text-xs text-[#86868B]">
                          @{formatCurrency(item.unit_price || 0)}/ชิ้น
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[#86868B]">
                <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>ยังไม่มีรายการสินค้า</p>
              </div>
            )}
          </Card>

          {/* Notes */}
          <Card className="p-6 bg-white border-[#E8E8ED]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#FF9500]" />
                <h2 className="text-lg font-semibold text-[#1D1D1F]">หมายเหตุ</h2>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setShowNoteModal(true)}>
                <Plus className="w-4 h-4 mr-1" />
                เพิ่มหมายเหตุ
              </Button>
            </div>

            {order.internal_note && (
              <div className="p-3 bg-[#FFF3CD] rounded-lg mb-3">
                <div className="text-sm text-[#856404]">{order.internal_note}</div>
              </div>
            )}

            {notes && notes.length > 0 ? (
              <div className="space-y-2">
                {notes.map((note: any) => (
                  <div key={note.id} className="p-3 bg-[#F5F5F7] rounded-lg">
                    <div className="text-sm text-[#1D1D1F]">{note.content}</div>
                    <div className="text-xs text-[#86868B] mt-1">
                      {formatDateTime(note.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#86868B] text-sm">ยังไม่มีหมายเหตุ</p>
            )}
          </Card>
        </div>

        {/* Right Column - Summary & Actions */}
        <div className="space-y-6">
          {/* Price Summary */}
          <Card className="p-6 bg-white border-[#E8E8ED]">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-[#34C759]" />
              <h2 className="text-lg font-semibold text-[#1D1D1F]">สรุปยอด</h2>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#86868B]">ยอดสินค้า</span>
                <span className="text-[#1D1D1F]">{formatCurrency(order.subtotal || 0)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#86868B]">ส่วนลด</span>
                  <span className="text-red-500">-{formatCurrency(order.discount_amount)}</span>
                </div>
              )}
              {order.shipping_cost > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#86868B]">ค่าจัดส่ง</span>
                  <span className="text-[#1D1D1F]">{formatCurrency(order.shipping_cost)}</span>
                </div>
              )}
              <div className="pt-3 border-t border-[#E8E8ED]">
                <div className="flex justify-between">
                  <span className="font-semibold text-[#1D1D1F]">รวมทั้งสิ้น</span>
                  <span className="text-xl font-bold text-[#007AFF]">
                    {formatCurrency(order.total_amount || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Status */}
            <div className="mt-4 p-3 rounded-lg bg-[#F5F5F7]">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#86868B]">สถานะการชำระ</span>
                <span className={`text-sm font-medium ${
                  order.payment_status === 'paid' ? 'text-[#34C759]' :
                  order.payment_status === 'partial' ? 'text-[#FF9500]' :
                  'text-[#86868B]'
                }`}>
                  {order.payment_status === 'paid' ? 'ชำระแล้ว ✓' :
                   order.payment_status === 'partial' ? 'ชำระบางส่วน' :
                   'ยังไม่ชำระ'}
                </span>
              </div>
              {order.paid_amount > 0 && (
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-[#86868B]">ชำระแล้ว</span>
                  <span className="text-sm text-[#1D1D1F]">
                    {formatCurrency(order.paid_amount || 0)}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Order Info */}
          <Card className="p-6 bg-white border-[#E8E8ED]">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-[#86868B]" />
              <h2 className="text-lg font-semibold text-[#1D1D1F]">ข้อมูลออเดอร์</h2>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#86868B]">กำหนดส่ง</span>
                <span className={`font-medium ${
                  order.due_date && new Date(order.due_date) < new Date() ? 'text-red-500' : 'text-[#1D1D1F]'
                }`}>
                  {formatDate(order.due_date)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#86868B]">ช่องทางขาย</span>
                <span className="text-[#1D1D1F]">{order.sales_channel || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#86868B]">เงื่อนไขชำระ</span>
                <span className="text-[#1D1D1F]">
                  {order.payment_terms === 'full' ? 'ชำระเต็มจำนวน' :
                   order.payment_terms === '50_50' ? 'มัดจำ 50%' :
                   order.payment_terms === '30_70' ? 'มัดจำ 30%' :
                   order.payment_terms || '-'}
                </span>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6 bg-white border-[#E8E8ED]">
            <h2 className="text-lg font-semibold text-[#1D1D1F] mb-4">การดำเนินการ</h2>
            
            <div className="space-y-2">
              {order.access_token && (
                <Button 
                  variant="secondary" 
                  className="w-full justify-start"
                  onClick={() => {
                    const url = `${window.location.origin}/order/${order.access_token}`;
                    navigator.clipboard.writeText(url);
                    success('คัดลอกลิงก์แล้ว!');
                  }}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  คัดลอกลิงก์สำหรับลูกค้า
                </Button>
              )}
              <Button variant="secondary" className="w-full justify-start">
                <Upload className="w-4 h-4 mr-2" />
                อัปโหลดไฟล์งาน
              </Button>
              <Button variant="secondary" className="w-full justify-start">
                <Image className="w-4 h-4 mr-2" />
                ส่ง Mockup
              </Button>
              <Button 
                variant="secondary" 
                className="w-full justify-start text-red-500 hover:text-red-600"
                onClick={() => {
                  setSelectedStatus('cancelled');
                  setShowStatusModal(true);
                }}
              >
                <Ban className="w-4 h-4 mr-2" />
                ยกเลิกออเดอร์
              </Button>
            </div>
          </Card>

          {/* History */}
          <Card className="p-6 bg-white border-[#E8E8ED]">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-[#86868B]" />
              <h2 className="text-lg font-semibold text-[#1D1D1F]">ประวัติ</h2>
            </div>

            {history && history.length > 0 ? (
              <div className="space-y-3">
                {history.slice(0, 5).map((item: any) => {
                  const fromConfig = item.from_status ? ORDER_STATUS_CONFIG[item.from_status as OrderStatus] : null;
                  const toConfig = ORDER_STATUS_CONFIG[item.to_status as OrderStatus];
                  return (
                    <div key={item.id} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#007AFF] mt-2" />
                      <div className="flex-1">
                        <div className="text-sm text-[#1D1D1F]">
                          {fromConfig ? `${fromConfig.label_th} → ` : ''}
                          {toConfig?.label_th || item.to_status}
                        </div>
                        <div className="text-xs text-[#86868B]">
                          {formatDateTime(item.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-[#86868B]">ยังไม่มีประวัติ</p>
            )}
          </Card>
        </div>
      </div>

      {/* Status Change Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="เปลี่ยนสถานะออเดอร์"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#86868B] mb-2">เลือกสถานะใหม่</label>
            <Dropdown
              value={selectedStatus}
              onChange={(val) => setSelectedStatus(val as OrderStatus)}
              options={Object.entries(ORDER_STATUS_CONFIG).map(([key, config]) => ({
                value: key,
                label: config.label_th,
              }))}
              placeholder="เลือกสถานะ"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleStatusChange} disabled={!selectedStatus || updating}>
              {updating ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Note Modal */}
      <Modal
        isOpen={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        title="เพิ่มหมายเหตุ"
      >
        <div className="space-y-4">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="พิมพ์หมายเหตุ..."
            className="w-full p-3 border border-[#E8E8ED] rounded-lg text-[#1D1D1F] resize-none h-32"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setShowNoteModal(false)}>
              ยกเลิก
            </Button>
            <Button disabled={!newNote.trim()}>
              บันทึก
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Helper function for step descriptions
function getStepDescription(status: OrderStatus): string {
  switch (status) {
    case 'draft':
      return 'ออเดอร์อยู่ในสถานะร่าง รอส่งใบเสนอราคาให้ลูกค้า';
    case 'quoted':
      return 'ส่งใบเสนอราคาแล้ว รอลูกค้ายืนยัน';
    case 'awaiting_payment':
      return 'รอลูกค้าชำระเงิน';
    case 'partial_paid':
      return 'ลูกค้าชำระเงินบางส่วนแล้ว รอชำระส่วนที่เหลือ';
    case 'designing':
      return 'กำลังออกแบบงาน';
    case 'awaiting_mockup_approval':
      return 'ส่ง Mockup แล้ว รอลูกค้าอนุมัติ';
    case 'in_production':
      return 'กำลังผลิตสินค้า';
    case 'awaiting_material':
      return 'รอวัตถุดิบ';
    case 'queued':
      return 'อยู่ในคิวรอผลิต';
    case 'qc_pending':
      return 'ผลิตเสร็จแล้ว รอตรวจคุณภาพ';
    case 'ready_to_ship':
      return 'ตรวจคุณภาพผ่านแล้ว พร้อมจัดส่ง';
    case 'shipped':
      return 'จัดส่งแล้ว รอลูกค้าได้รับสินค้า';
    case 'completed':
      return 'ออเดอร์เสร็จสมบูรณ์';
    case 'cancelled':
      return 'ออเดอร์ถูกยกเลิก';
    default:
      return '';
  }
}
