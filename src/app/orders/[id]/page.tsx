'use client';

import { Button, Card, Input, Modal, useToast, Dropdown } from '@/modules/shared/ui';
import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  MapPin,
  Package,
  Clock,
  DollarSign,
  FileText,
  Truck,
  MessageSquare,
  Edit,
  Copy,
  CheckCircle2,
  AlertCircle,
  Send,
  Image,
  ChevronDown,
  ChevronRight,
  Factory,
  Play,
  Loader2,
  Palette,
  ClipboardCheck,
  Ban,
  Calculator,
  Calendar,
  Bell,
} from 'lucide-react';
import { useOrder, useOrderStatusHistory, useOrderNotes } from '@/modules/orders/hooks/useOrders';
import { useOrderMutations } from '@/modules/orders/hooks/useOrderMutations';
import { 
  ORDER_STATUS_CONFIG, 
  WORK_ITEM_STATUS_CONFIG,
  type OrderStatus,
  type Order 
} from '@/modules/orders/types';
import { DesignManager } from '@/modules/orders/components/DesignManager';
import { MockupManager } from '@/modules/orders/components/MockupManager';
import { PaymentManager } from '@/modules/orders/components/PaymentManager';
import { CostBreakdown } from '@/modules/orders/components/CostBreakdown';
import { SLATimeline } from '@/modules/orders/components/SLATimeline';
import { DocumentGenerator } from '@/modules/orders/components/DocumentGenerator';
import { NotificationCenter } from '@/modules/orders/components/NotificationCenter';

// Order Progress Steps Configuration with Actions
const ORDER_STEPS = [
  { 
    key: 'draft', 
    label: 'ร่าง', 
    icon: FileText, 
    description: 'สร้างออเดอร์',
    action: 'ยืนยันข้อมูลและส่งใบเสนอราคาให้ลูกค้า',
    buttonText: 'ส่งใบเสนอราคา',
    nextStatus: 'quoted',
    tab: 'details'
  },
  { 
    key: 'payment', 
    label: 'ชำระเงิน', 
    icon: DollarSign, 
    description: 'รอชำระ/มัดจำ',
    action: 'รอลูกค้าชำระเงินหรือมัดจำ แล้วบันทึกการชำระ',
    buttonText: 'บันทึกการชำระเงิน',
    nextStatus: 'designing',
    tab: 'payments'
  },
  { 
    key: 'design', 
    label: 'ออกแบบ', 
    icon: Palette, 
    description: 'ออกแบบงาน',
    action: 'อัปโหลดงานออกแบบและส่ง Mockup ให้ลูกค้าอนุมัติ',
    buttonText: 'ไปหน้าออกแบบ',
    nextStatus: 'awaiting_mockup_approval',
    tab: 'design'
  },
  { 
    key: 'production', 
    label: 'ผลิต', 
    icon: Factory, 
    description: 'กำลังผลิต',
    action: 'ส่งงานเข้าผลิตและติดตามความคืบหน้า',
    buttonText: 'ไปหน้าการผลิต',
    nextStatus: 'qc_pending',
    tab: 'production'
  },
  { 
    key: 'qc', 
    label: 'QC', 
    icon: ClipboardCheck, 
    description: 'ตรวจสอบคุณภาพ',
    action: 'ตรวจสอบคุณภาพงานก่อนจัดส่ง',
    buttonText: 'ผ่าน QC',
    nextStatus: 'ready_to_ship',
    tab: 'production'
  },
  { 
    key: 'shipping', 
    label: 'จัดส่ง', 
    icon: Truck, 
    description: 'เตรียม/จัดส่ง',
    action: 'เตรียมพัสดุ บันทึกเลข Tracking และจัดส่ง',
    buttonText: 'บันทึกจัดส่งแล้ว',
    nextStatus: 'shipped',
    tab: 'details'
  },
  { 
    key: 'completed', 
    label: 'สำเร็จ', 
    icon: CheckCircle2, 
    description: 'เสร็จสิ้น',
    action: 'ออเดอร์เสร็จสมบูรณ์ 🎉',
    buttonText: null,
    nextStatus: null,
    tab: null
  },
];

// Map status to step index
const getStepFromStatus = (status: string): number => {
  switch (status) {
    case 'draft':
    case 'quoted':
      return 0;
    case 'awaiting_payment':
    case 'partial_paid':
      return 1;
    case 'designing':
    case 'awaiting_mockup_approval':
      return 2;
    case 'in_production':
    case 'awaiting_material':
    case 'queued':
      return 3;
    case 'qc_pending':
      return 4;
    case 'ready_to_ship':
    case 'shipped':
      return 5;
    case 'completed':
      return 6;
    case 'cancelled':
      return -1;
    default:
      return 0;
  }
};

// Order Progress Bar Component (Full Version for Detail Page)
function OrderProgressBarFull({ 
  status, 
  onTabChange, 
  onStatusChange 
}: { 
  status: string;
  onTabChange: (tab: string) => void;
  onStatusChange: (newStatus: string) => void;
}) {
  const currentStep = getStepFromStatus(status);
  const currentStepData = ORDER_STEPS[currentStep];
  const progressPercent = (currentStep / (ORDER_STEPS.length - 1)) * 100;
  
  if (status === 'cancelled') {
    return (
      <Card className="p-6 bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200">
        <div className="flex items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center">
            <Ban className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-red-700">ออเดอร์ถูกยกเลิก</h3>
            <p className="text-red-600">ออเดอร์นี้ถูกยกเลิกแล้ว ไม่สามารถดำเนินการต่อได้</p>
          </div>
        </div>
      </Card>
    );
  }
  
  const isCompleted = currentStep === ORDER_STEPS.length - 1;
  
  return (
    <div className="space-y-4">
      {/* Action Card - สิ่งที่ต้องทำตอนนี้ */}
      <Card className={`p-6 border-2 ${
        isCompleted 
          ? 'bg-gradient-to-r from-emerald-50 to-green-100 border-emerald-300' 
          : 'bg-gradient-to-r from-blue-50 to-indigo-100 border-blue-300'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Current Step Icon */}
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${
            isCompleted ? 'bg-emerald-500' : 'bg-[#007AFF]'
          }`}>
            {(() => {
              const Icon = currentStepData?.icon || Clock;
              return <Icon className="w-8 h-8 text-white" />;
            })()}
          </div>
          
          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                isCompleted ? 'bg-emerald-200 text-emerald-700' : 'bg-blue-200 text-blue-700'
              }`}>
                ขั้นตอนที่ {currentStep + 1}/{ORDER_STEPS.length}
              </span>
              <span className={`text-lg font-bold ${isCompleted ? 'text-emerald-700' : 'text-blue-700'}`}>
                {currentStepData?.label}
              </span>
            </div>
            <p className={`text-base ${isCompleted ? 'text-emerald-600' : 'text-blue-600'}`}>
              {currentStepData?.action}
            </p>
          </div>
          
          {/* Action Button */}
          {currentStepData?.buttonText && (
            <Button 
              onClick={() => {
                if (currentStepData.tab) {
                  onTabChange(currentStepData.tab);
                }
              }}
              className={`whitespace-nowrap ${
                isCompleted 
                  ? 'bg-emerald-500 hover:bg-emerald-600' 
                  : 'bg-[#007AFF] hover:bg-[#0066CC]'
              }`}
            >
              <Play className="w-4 h-4 mr-2" />
              {currentStepData.buttonText}
            </Button>
          )}
        </div>
      </Card>

      {/* Progress Bar */}
      <Card className="p-6 bg-white border border-[#E8E8ED]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-[#1D1D1F]">ความคืบหน้าทั้งหมด</h3>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-[#007AFF]">{Math.round(progressPercent)}%</div>
          </div>
        </div>
        
        {/* Progress Track */}
        <div className="relative mb-8">
          {/* Background Track */}
          <div className="absolute top-5 left-0 right-0 h-2 bg-[#E8E8ED] rounded-full" />
          
          {/* Progress Fill with Gradient */}
          <div 
            className="absolute top-5 left-0 h-2 rounded-full transition-all duration-700 ease-out"
            style={{ 
              width: `${progressPercent}%`,
              background: 'linear-gradient(90deg, #34C759 0%, #30D158 50%, #32D74B 100%)',
              boxShadow: '0 0 10px rgba(52, 199, 89, 0.5)'
            }}
          />
          
          {/* Step Dots */}
          <div className="relative flex justify-between">
            {ORDER_STEPS.map((step, index) => {
              const isStepCompleted = index < currentStep;
              const isCurrent = index === currentStep;
              const Icon = step.icon;
              
              return (
                <div 
                  key={step.key} 
                  className="flex flex-col items-center cursor-pointer group"
                  style={{ width: `${100 / ORDER_STEPS.length}%` }}
                  onClick={() => step.tab && onTabChange(step.tab)}
                >
                  {/* Circle */}
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 relative z-10 ${
                      isStepCompleted 
                        ? 'bg-[#34C759] text-white' 
                        : isCurrent 
                          ? 'bg-[#007AFF] text-white ring-4 ring-blue-200 scale-110' 
                          : 'bg-white text-[#86868B] border-2 border-[#E8E8ED] group-hover:border-[#007AFF] group-hover:text-[#007AFF]'
                    }`}
                  >
                    {isStepCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  
                  {/* Label */}
                  <div className="mt-3 text-center">
                    <div className={`text-xs font-medium transition-colors ${
                      isStepCompleted 
                        ? 'text-[#34C759]' 
                        : isCurrent 
                          ? 'text-[#007AFF] font-semibold' 
                          : 'text-[#86868B] group-hover:text-[#007AFF]'
                    }`}>
                      {step.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Steps Legend */}
        <div className="flex items-center justify-center gap-6 text-xs text-[#86868B]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#34C759]" />
            <span>เสร็จแล้ว</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#007AFF] ring-2 ring-blue-200" />
            <span>กำลังดำเนินการ</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-white border-2 border-[#E8E8ED]" />
            <span>รอดำเนินการ</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;
  const { success, error: showError } = useToast();
  
  const { order, loading, refetch } = useOrder(orderId);
  const { history } = useOrderStatusHistory(orderId);
  const { notes, refetch: refetchNotes } = useOrderNotes(orderId);
  const { 
    updateOrderStatus, 
    addNote, 
    sendToProduction, 
    getProductionJobs,
    loading: mutationLoading 
  } = useOrderMutations();

  // UI State
  const [activeTab, setActiveTab] = useState<'details' | 'items' | 'design' | 'mockup' | 'payments' | 'production' | 'cost' | 'timeline' | 'documents' | 'notifications' | 'notes' | 'history'>('details');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus | ''>('');
  const [statusReason, setStatusReason] = useState('');
  const [newNote, setNewNote] = useState('');
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [productionJobs, setProductionJobs] = useState<any[]>([]);
  const [loadingProduction, setLoadingProduction] = useState(false);
  const [sendingToProduction, setSendingToProduction] = useState(false);

  // Fetch production jobs when tab changes - MUST be before any conditional returns
  useEffect(() => {
    let isMounted = true;
    
    const fetchProductionJobs = async () => {
      if (activeTab === 'production' && orderId && !loadingProduction) {
        setLoadingProduction(true);
        const result = await getProductionJobs(orderId);
        if (isMounted && result.success && result.jobs) {
          setProductionJobs(result.jobs);
        }
        if (isMounted) {
          setLoadingProduction(false);
        }
      }
    };
    
    fetchProductionJobs();
    
    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, orderId]); // Only re-fetch when tab or orderId changes

  // Helper functions
  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getJobStatusLabel = (status: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      pending: { label: 'รอคิว', color: 'bg-gray-100 text-[#86868B]' },
      assigned: { label: 'มอบหมายแล้ว', color: 'bg-blue-100 text-blue-600' },
      in_progress: { label: 'กำลังผลิต', color: 'bg-purple-100 text-purple-600' },
      qc_check: { label: 'รอ QC', color: 'bg-yellow-100 text-yellow-600' },
      qc_passed: { label: 'ผ่าน QC', color: 'bg-green-100 text-green-600' },
      qc_failed: { label: 'ไม่ผ่าน QC', color: 'bg-red-100 text-red-600' },
      completed: { label: 'เสร็จสิ้น', color: 'bg-emerald-100 text-emerald-600' },
      cancelled: { label: 'ยกเลิก', color: 'bg-gray-100 text-[#86868B]' },
    };
    return labels[status] || { label: status, color: 'bg-gray-100 text-[#86868B]' };
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not found state
  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-[#86868B]">
        <Package className="w-16 h-16 mb-4 opacity-50" />
        <h2 className="text-xl font-semibold mb-2 text-[#1D1D1F]">ไม่พบออเดอร์</h2>
        <Link href="/orders" className="text-[#007AFF] hover:underline">
          กลับไปหน้ารายการ
        </Link>
      </div>
    );
  }

  // After order is loaded, we can safely use order properties
  const statusConfig = ORDER_STATUS_CONFIG[order.status];
  const customerLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/order/${order.access_token}`;

  const handleStatusChange = async () => {
    if (!newStatus) return;
    
    const result = await updateOrderStatus(orderId, newStatus, statusReason);
    if (result.success) {
      success('เปลี่ยนสถานะเรียบร้อย');
      setShowStatusModal(false);
      setNewStatus('');
      setStatusReason('');
      refetch();
    } else {
      showError(result.error || 'เกิดข้อผิดพลาด');
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    const result = await addNote(orderId, newNote.trim());
    if (result.success) {
      success('เพิ่มหมายเหตุแล้ว');
      setNewNote('');
      refetchNotes();
    } else {
      showError(result.error || 'เกิดข้อผิดพลาด');
    }
  };

  const copyCustomerLink = () => {
    navigator.clipboard.writeText(customerLink);
    success('คัดลอกลิงก์แล้ว');
  };

  const toggleItemExpand = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSendToProduction = async () => {
    setSendingToProduction(true);
    const result = await sendToProduction(orderId);
    if (result.success) {
      success(`ส่งเข้าผลิตเรียบร้อย (${result.jobIds?.length || 0} งาน)`);
      // Refresh production jobs
      const jobsResult = await getProductionJobs(orderId);
      if (jobsResult.success && jobsResult.jobs) {
        setProductionJobs(jobsResult.jobs);
      }
      refetch();
    } else {
      showError(result.error || 'เกิดข้อผิดพลาด');
    }
    setSendingToProduction(false);
  };

  const isOverdue = order.due_date && new Date(order.due_date) < new Date() && 
    !['completed', 'cancelled', 'shipped'].includes(order.status);

  const canSendToProduction = order.work_items && order.work_items.length > 0 && 
    !['draft', 'cancelled', 'completed'].includes(order.status);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <Link href="/orders">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#1D1D1F]">{order.order_number}</h1>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusConfig?.bgColor || ''} ${statusConfig?.color || ''}`}>
              {statusConfig?.label_th}
            </span>
            {isOverdue && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-100 text-red-600">
                <AlertCircle className="w-3 h-3" />
                เกินกำหนด
              </span>
            )}
          </div>
          <p className="text-[#86868B] mt-1">{order.customer_name}</p>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={copyCustomerLink}>
            <Copy className="w-4 h-4 mr-2" />
            คัดลอกลิงก์ลูกค้า
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setShowStatusModal(true)}>
            <Edit className="w-4 h-4 mr-2" />
            เปลี่ยนสถานะ
          </Button>
          <Link href={`/orders/${orderId}/edit`}>
            <Button size="sm">
              <Edit className="w-4 h-4 mr-2" />
              แก้ไข
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 bg-white border border-[#E8E8ED]">
          <div className="flex items-center gap-2 text-[#86868B] text-sm mb-1">
            <DollarSign className="w-4 h-4" />
            ยอดรวม
          </div>
          <div className="text-xl font-bold text-[#1D1D1F]">{formatCurrency(order.total_amount)}</div>
        </Card>
        
        <Card className="p-4 bg-white border border-[#E8E8ED]">
          <div className="flex items-center gap-2 text-[#86868B] text-sm mb-1">
            <CheckCircle2 className="w-4 h-4" />
            ชำระแล้ว
          </div>
          <div className={`text-xl font-bold ${order.payment_status === 'paid' ? 'text-green-600' : order.payment_status === 'partial' ? 'text-yellow-600' : 'text-[#86868B]'}`}>
            {formatCurrency(order.paid_amount)}
          </div>
          <div className="text-xs text-[#86868B]">
            {order.payment_status === 'paid' ? 'ชำระครบแล้ว' : 
             order.payment_status === 'partial' ? `ค้าง ${formatCurrency(order.total_amount - order.paid_amount)}` : 
             'ยังไม่ชำระ'}
          </div>
        </Card>
        
        <Card className="p-4 bg-white border border-[#E8E8ED]">
          <div className="flex items-center gap-2 text-[#86868B] text-sm mb-1">
            <Clock className="w-4 h-4" />
            วันที่สั่ง
          </div>
          <div className="text-lg font-semibold text-[#1D1D1F]">{formatDate(order.order_date)}</div>
        </Card>
        
        <Card className="p-4 bg-white border border-[#E8E8ED]">
          <div className="flex items-center gap-2 text-[#86868B] text-sm mb-1">
            <Truck className="w-4 h-4" />
            กำหนดส่ง
          </div>
          <div className={`text-lg font-semibold ${isOverdue ? 'text-red-600' : 'text-[#1D1D1F]'}`}>
            {formatDate(order.due_date)}
          </div>
        </Card>
      </div>

      {/* Progress Bar with Action Guidance */}
      <div className="mb-6">
        <OrderProgressBarFull 
          status={order.status} 
          onTabChange={(tab) => setActiveTab(tab as any)}
          onStatusChange={async (newStatus) => {
            const result = await updateOrderStatus(orderId, newStatus as OrderStatus, '');
            if (result.success) {
              success('เปลี่ยนสถานะเรียบร้อย');
              refetch();
            } else {
              showError(result.error || 'เกิดข้อผิดพลาด');
            }
          }}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-2 bg-white rounded-xl p-1 border border-[#E8E8ED]">
        {[
          { key: 'details', label: 'ข้อมูลทั่วไป', icon: FileText },
          { key: 'items', label: 'รายการงาน', icon: Package },
          { key: 'design', label: 'งานออกแบบ', icon: Image },
          { key: 'mockup', label: 'Mockup', icon: Image },
          { key: 'production', label: 'การผลิต', icon: Factory },
          { key: 'payments', label: 'การชำระเงิน', icon: DollarSign },
          { key: 'cost', label: 'ต้นทุน', icon: Calculator },
          { key: 'timeline', label: 'Timeline', icon: Calendar },
          { key: 'documents', label: 'เอกสาร', icon: FileText },
          { key: 'notifications', label: 'แจ้งเตือน', icon: Bell },
          { key: 'notes', label: 'หมายเหตุ', icon: MessageSquare },
          { key: 'history', label: 'ประวัติ', icon: Clock },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-[#007AFF] text-white'
                : 'text-[#86868B] hover:bg-[#F5F5F7] hover:text-[#1D1D1F]'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Info */}
            <Card className="p-6 bg-white border border-[#E8E8ED]">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-[#007AFF]" />
                <h3 className="text-lg font-semibold text-[#1D1D1F]">ข้อมูลลูกค้า</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-[#86868B]">ชื่อ</div>
                  <div className="text-[#1D1D1F]">{order.customer_name}</div>
                </div>
                <div>
                  <div className="text-sm text-[#86868B]">เบอร์โทร</div>
                  <div className="text-[#1D1D1F]">{order.customer_phone || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-[#86868B]">อีเมล</div>
                  <div className="text-[#1D1D1F]">{order.customer_email || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-[#86868B]">LINE ID</div>
                  <div className="text-[#1D1D1F]">{order.customer_line_id || '-'}</div>
                </div>
                {order.customer_id && (
                  <Link href={`/crm?customer=${order.customer_id}`} className="text-[#007AFF] text-sm hover:underline">
                    ดูประวัติลูกค้า →
                  </Link>
                )}
              </div>
            </Card>

            {/* Shipping Info */}
            <Card className="p-6 bg-white border border-[#E8E8ED]">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-[#34C759]" />
                <h3 className="text-lg font-semibold text-[#1D1D1F]">ที่อยู่จัดส่ง</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-[#86868B]">ผู้รับ</div>
                  <div className="text-[#1D1D1F]">{order.shipping_name || order.customer_name}</div>
                </div>
                <div>
                  <div className="text-sm text-[#86868B]">เบอร์โทร</div>
                  <div className="text-[#1D1D1F]">{order.shipping_phone || order.customer_phone || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-[#86868B]">ที่อยู่</div>
                  <div className="text-[#1D1D1F]">
                    {order.shipping_address || '-'}
                    {order.shipping_district && `, ${order.shipping_district}`}
                    {order.shipping_province && `, ${order.shipping_province}`}
                    {order.shipping_postal_code && ` ${order.shipping_postal_code}`}
                  </div>
                </div>
                {order.tracking_number && (
                  <div>
                    <div className="text-sm text-[#86868B]">Tracking</div>
                    <div className="text-[#007AFF]">{order.tracking_number}</div>
                  </div>
                )}
              </div>
            </Card>

            {/* Order Info */}
            <Card className="p-6 bg-white border border-[#E8E8ED]">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-[#FF9500]" />
                <h3 className="text-lg font-semibold text-[#1D1D1F]">รายละเอียดออเดอร์</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-[#86868B]">ช่องทางขาย</span>
                  <span className="text-[#1D1D1F] capitalize">{order.sales_channel || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#86868B]">เงื่อนไขชำระ</span>
                  <span className="text-[#1D1D1F]">
                    {order.payment_terms === 'full' ? 'ชำระเต็มจำนวน' :
                     order.payment_terms === '50_50' ? 'มัดจำ 50%' :
                     order.payment_terms === '30_70' ? 'มัดจำ 30%' : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#86868B]">ใบกำกับภาษี</span>
                  <span className="text-[#1D1D1F]">{order.needs_tax_invoice ? 'ต้องการ' : 'ไม่ต้องการ'}</span>
                </div>
                {order.customer_note && (
                  <div>
                    <div className="text-sm text-[#86868B] mb-1">หมายเหตุจากลูกค้า</div>
                    <div className="text-[#1D1D1F] text-sm bg-[#F5F5F7] p-3 rounded">{order.customer_note}</div>
                  </div>
                )}
                {order.internal_note && (
                  <div>
                    <div className="text-sm text-[#86868B] mb-1">หมายเหตุภายใน</div>
                    <div className="text-yellow-700 text-sm bg-yellow-50 p-3 rounded border border-yellow-200">{order.internal_note}</div>
                  </div>
                )}
              </div>
            </Card>

            {/* Summary */}
            <Card className="p-6 bg-white border border-[#E8E8ED]">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-[#34C759]" />
                <h3 className="text-lg font-semibold text-[#1D1D1F]">สรุปยอด</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[#1D1D1F]">
                  <span>ยอดรวมสินค้า/บริการ</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>ส่วนลด {order.discount_reason && `(${order.discount_reason})`}</span>
                    <span>-{formatCurrency(order.discount_amount)}</span>
                  </div>
                )}
                {order.shipping_cost > 0 && (
                  <div className="flex justify-between text-[#1D1D1F]">
                    <span>ค่าจัดส่ง</span>
                    <span>{formatCurrency(order.shipping_cost)}</span>
                  </div>
                )}
                <div className="pt-2 mt-2 border-t border-[#E8E8ED]">
                  <div className="flex justify-between text-lg font-bold text-[#1D1D1F]">
                    <span>ยอดรวมทั้งสิ้น</span>
                    <span className="text-[#34C759]">{formatCurrency(order.total_amount)}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Items Tab */}
        {activeTab === 'items' && (
          <Card className="p-6 bg-white border border-[#E8E8ED]">
            <h3 className="text-lg font-semibold text-[#1D1D1F] mb-4">รายการงาน ({order.work_items?.length || 0} รายการ)</h3>
            
            {!order.work_items || order.work_items.length === 0 ? (
              <div className="text-center py-8 text-[#86868B]">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>ไม่มีรายการงาน</p>
              </div>
            ) : (
              <div className="space-y-4">
                {order.work_items.map((item, index) => {
                  const itemStatusConfig = WORK_ITEM_STATUS_CONFIG[item.status as keyof typeof WORK_ITEM_STATUS_CONFIG];
                  const isExpanded = expandedItems.includes(item.id);
                  
                  return (
                    <div key={item.id} className="bg-[#F5F5F7] rounded-lg border border-[#E8E8ED] overflow-hidden">
                      <button
                        onClick={() => toggleItemExpand(item.id)}
                        className="w-full p-4 flex items-center justify-between hover:bg-[#E8E8ED] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-[#86868B] font-mono text-sm">#{index + 1}</span>
                          <div className="text-left">
                            <div className="text-[#1D1D1F] font-medium">{item.work_type_name}</div>
                            <div className="text-sm text-[#86868B]">
                              {item.position_name && `${item.position_name}`}
                              {item.print_size_name && ` • ${item.print_size_name}`}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`px-2 py-1 rounded text-xs ${itemStatusConfig?.color || 'text-[#86868B]'}`}>
                            {itemStatusConfig?.label_th || item.status}
                          </span>
                          <span className="text-[#1D1D1F] font-medium">{formatCurrency(item.total_price)}</span>
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-[#86868B]" /> : <ChevronRight className="w-4 h-4 text-[#86868B]" />}
                        </div>
                      </button>
                      
                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-[#E8E8ED]">
                          <div className="grid grid-cols-3 gap-4 py-3 text-sm">
                            <div>
                              <span className="text-[#86868B]">จำนวน:</span>
                              <span className="text-[#1D1D1F] ml-2">{item.quantity}</span>
                            </div>
                            <div>
                              <span className="text-[#86868B]">ราคา/หน่วย:</span>
                              <span className="text-[#1D1D1F] ml-2">{formatCurrency(item.unit_price)}</span>
                            </div>
                            <div>
                              <span className="text-[#86868B]">รวม:</span>
                              <span className="text-[#1D1D1F] ml-2">{formatCurrency(item.total_price)}</span>
                            </div>
                          </div>
                          
                          {item.description && (
                            <div className="py-2 text-sm">
                              <span className="text-[#86868B]">รายละเอียด:</span>
                              <span className="text-[#1D1D1F] ml-2">{item.description}</span>
                            </div>
                          )}

                          {/* Products */}
                          {item.products && item.products.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-[#E8E8ED]">
                              <div className="text-sm text-[#86868B] mb-2">สินค้าที่ใช้:</div>
                              <div className="space-y-2">
                                {item.products.map((product) => (
                                  <div key={product.id} className="flex items-center justify-between text-sm bg-white p-2 rounded border border-[#E8E8ED]">
                                    <div>
                                      <span className="text-[#1D1D1F]">{product.product_name}</span>
                                      <span className="text-[#86868B] ml-2">x{product.quantity}</span>
                                    </div>
                                    <span className="text-[#1D1D1F]">{formatCurrency(product.total_price)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Designs */}
                          {item.designs && item.designs.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-[#E8E8ED]">
                              <div className="text-sm text-[#86868B] mb-2">งานออกแบบ:</div>
                              <div className="space-y-2">
                                {item.designs.map((design) => (
                                  <div key={design.id} className="flex items-center justify-between text-sm bg-white p-2 rounded border border-[#E8E8ED]">
                                    <div className="flex items-center gap-2">
                                      <Image className="w-4 h-4 text-purple-500" />
                                      <span className="text-[#1D1D1F]">{design.design_name}</span>
                                      <span className="text-[#86868B]">v{design.current_version}</span>
                                    </div>
                                    <span className={`text-xs ${
                                      design.status === 'approved' ? 'text-green-600' :
                                      design.status === 'revision_requested' ? 'text-yellow-600' :
                                      'text-[#86868B]'
                                    }`}>
                                      {design.status === 'approved' ? 'อนุมัติแล้ว' :
                                       design.status === 'revision_requested' ? 'รอแก้ไข' :
                                       design.status === 'awaiting_review' ? 'รอตรวจสอบ' :
                                       design.status}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {/* Design Tab */}
        {activeTab === 'design' && (
          <Card className="p-6 bg-white border border-[#E8E8ED]">
            <DesignManager
              orderId={orderId}
              designs={order.work_items?.flatMap(item => item.designs || []) || []}
              onRefresh={refetch}
            />
          </Card>
        )}

        {/* Mockup Tab */}
        {activeTab === 'mockup' && (
          <Card className="p-6 bg-white border border-[#E8E8ED]">
            <MockupManager
              orderId={orderId}
              designs={order.work_items?.flatMap(item => item.designs || []) || []}
              mockups={order.work_items?.flatMap(item => 
                item.designs?.flatMap(d => d.mockups || []) || []
              ) || []}
              onRefresh={refetch}
            />
          </Card>
        )}

        {/* Production Tab */}
        {activeTab === 'production' && (
          <Card className="p-6 bg-white border border-[#E8E8ED]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[#1D1D1F]">สถานะการผลิต</h3>
              {canSendToProduction && (
                <Button 
                  onClick={handleSendToProduction} 
                  disabled={sendingToProduction}
                >
                  {sendingToProduction ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  ส่งเข้าผลิต
                </Button>
              )}
            </div>
            
            {loadingProduction ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#007AFF]" />
              </div>
            ) : productionJobs.length === 0 ? (
              <div className="text-center py-12">
                <Factory className="w-16 h-16 mx-auto mb-4 text-[#86868B] opacity-50" />
                <p className="text-[#86868B] mb-4">ยังไม่มีงานผลิต</p>
                {canSendToProduction && (
                  <p className="text-sm text-[#86868B]">
                    กดปุ่ม &quot;ส่งเข้าผลิต&quot; เพื่อสร้าง Production Jobs จาก Work Items
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {productionJobs.map((job) => {
                  const statusInfo = getJobStatusLabel(job.status);
                  return (
                    <div key={job.id} className="bg-[#F5F5F7] rounded-xl p-4 border border-[#E8E8ED]">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-[#007AFF]">{job.job_number}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                          <p className="text-[#1D1D1F] font-medium mt-1">{job.work_type_name}</p>
                          <p className="text-sm text-[#86868B]">{job.product_description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[#1D1D1F] font-semibold">{job.ordered_qty} ชิ้น</p>
                          {job.passed_qty > 0 && (
                            <p className="text-sm text-green-600">
                              เสร็จแล้ว {job.passed_qty}/{job.ordered_qty}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      {job.status !== 'pending' && job.status !== 'cancelled' && (
                        <div className="mb-3">
                          <div className="h-2 bg-[#E8E8ED] rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-500 ${
                                job.status === 'completed' ? 'bg-emerald-500' :
                                job.status === 'qc_passed' ? 'bg-green-500' :
                                job.status === 'qc_failed' ? 'bg-red-500' :
                                'bg-[#007AFF]'
                              }`}
                              style={{ width: `${job.passed_qty ? (job.passed_qty / job.ordered_qty) * 100 : 
                                job.status === 'completed' ? 100 : 
                                job.status === 'qc_passed' || job.status === 'qc_check' ? 80 : 
                                job.status === 'in_progress' ? 50 : 
                                job.status === 'assigned' ? 20 : 0}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4 text-[#86868B]">
                          {job.station && (
                            <span>สถานี: {job.station.name}</span>
                          )}
                          {job.due_date && (
                            <span>กำหนด: {formatDate(job.due_date)}</span>
                          )}
                        </div>
                        <Link 
                          href={`/production/tracking?job=${job.id}`}
                          className="text-[#007AFF] hover:underline text-sm"
                        >
                          ดูรายละเอียด →
                        </Link>
                      </div>
                    </div>
                  );
                })}
                
                {/* Summary */}
                <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600">Production Jobs ทั้งหมด</p>
                      <p className="text-2xl font-bold text-blue-700">{productionJobs.length}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-blue-600">เสร็จแล้ว</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {productionJobs.filter(j => j.status === 'completed').length}/{productionJobs.length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <Card className="p-6 bg-white border border-[#E8E8ED]">
            <PaymentManager
              order={order as Order}
              payments={order.payments || []}
              onRefresh={refetch}
            />
          </Card>
        )}

        {/* Cost Tab */}
        {activeTab === 'cost' && (
          <CostBreakdown
            orderId={orderId}
            totalRevenue={order.total_amount}
            onSave={(costs) => {
              // TODO: Save costs to database
              console.log('Saving costs:', costs);
            }}
          />
        )}

        {/* Timeline Tab */}
        {activeTab === 'timeline' && (
          <SLATimeline
            orderId={orderId}
            currentStatus={order.status}
            orderDate={order.order_date}
            dueDate={order.due_date}
            onSave={(timeline) => {
              // TODO: Save timeline to database
              console.log('Saving timeline:', timeline);
            }}
          />
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <DocumentGenerator order={order as Order} />
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <NotificationCenter
            order={order as Order}
            onSendNotification={async (type, channel, message) => {
              // TODO: Implement actual notification sending
              console.log('Sending notification:', { type, channel, message });
              return true;
            }}
          />
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <Card className="p-6 bg-white border border-[#E8E8ED]">
            <h3 className="text-lg font-semibold text-[#1D1D1F] mb-4">หมายเหตุภายใน</h3>
            
            {/* Add Note */}
            <div className="flex gap-2 mb-4">
              <Input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="เพิ่มหมายเหตุ..."
                onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
              />
              <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
            
            {notes.length === 0 ? (
              <div className="text-center py-8 text-[#86868B]">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>ยังไม่มีหมายเหตุ</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <div key={note.id} className="p-3 bg-[#F5F5F7] rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[#1D1D1F]">{note.user?.full_name || 'Unknown'}</span>
                      <span className="text-xs text-[#86868B]">{formatDate(note.created_at)}</span>
                    </div>
                    <p className="text-[#1D1D1F] text-sm">{note.note_text}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <Card className="p-6 bg-white border border-[#E8E8ED]">
            <h3 className="text-lg font-semibold text-[#1D1D1F] mb-4">ประวัติการเปลี่ยนแปลง</h3>
            
            {history.length === 0 ? (
              <div className="text-center py-8 text-[#86868B]">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>ไม่มีประวัติ</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((entry) => {
                  const fromConfig = entry.from_status ? ORDER_STATUS_CONFIG[entry.from_status as OrderStatus] : null;
                  const toConfig = ORDER_STATUS_CONFIG[entry.to_status as OrderStatus];
                  
                  return (
                    <div key={entry.id} className="flex items-start gap-3 p-3 bg-[#F5F5F7] rounded-lg">
                      <div className="w-2 h-2 mt-2 rounded-full bg-[#007AFF]" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm">
                          {fromConfig && (
                            <>
                              <span className={fromConfig.color}>{fromConfig.label_th}</span>
                              <span className="text-[#86868B]">→</span>
                            </>
                          )}
                          <span className={toConfig?.color || ''}>{toConfig?.label_th}</span>
                        </div>
                        {entry.reason && (
                          <p className="text-sm text-[#86868B] mt-1">{entry.reason}</p>
                        )}
                        <div className="text-xs text-[#86868B] mt-1">
                          {entry.user?.full_name || 'ระบบ'} • {formatDate(entry.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Status Change Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="เปลี่ยนสถานะออเดอร์"
      >
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-[#86868B] mb-2">สถานะใหม่</label>
            <Dropdown
              options={Object.entries(ORDER_STATUS_CONFIG).map(([key, config]) => ({
                value: key,
                label: config.label_th,
              }))}
              value={newStatus}
              onChange={(value) => setNewStatus(value as OrderStatus)}
              placeholder="เลือกสถานะ"
            />
          </div>
          
          <div>
            <label className="block text-sm text-[#86868B] mb-2">เหตุผล (ถ้ามี)</label>
            <textarea
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-[#F5F5F7] border border-[#E8E8ED] rounded-lg text-[#1D1D1F] resize-none focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
              placeholder="เหตุผลในการเปลี่ยนสถานะ..."
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleStatusChange} disabled={!newStatus || mutationLoading}>
              {mutationLoading ? 'กำลังบันทึก...' : 'ยืนยัน'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
