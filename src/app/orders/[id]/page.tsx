'use client';

import { useState } from 'react';
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
  Zap,
  AlertTriangle,
  Sparkles,
  Building,
  Calendar,
  CreditCard,
  Phone,
  Mail,
  Hash,
  Palette,
  Shield,
} from 'lucide-react';
import { Button, Card, Input, Modal, useToast } from '@/modules/shared/ui';
import { 
  useERPOrder,
  useERPWorkItems,
  useERPPayments,
  useERPOrderDesignFlow,
  useERPChangeRequests,
  useERPQCForOrder,
  ORDER_STATUS_CONFIG, 
  PAYMENT_STATUS_CONFIG,
  DesignSummaryCard,
  DesignVersionCard,
  ApprovalGatesSummary,
  CompactGatesProgress,
  MockupApprovalCard,
  ChangeRequestCard,
  QCRecordCard,
  QCSummaryCard,
} from '@/modules/erp';
import type { Order, OrderStatus, OrderWorkItem, OrderPayment } from '@/modules/erp';
import { RefreshCw, ClipboardCheck } from 'lucide-react';

// ---------------------------------------------
// Main Component
// ---------------------------------------------

const TABS = [
  { key: 'details', label: 'ข้อมูลทั่วไป', icon: FileText },
  { key: 'items', label: 'รายการงาน', icon: Package },
  { key: 'design', label: 'ออกแบบ & อนุมัติ', icon: Palette },
  { key: 'changes', label: 'แก้ไข/เปลี่ยนแปลง', icon: RefreshCw },
  { key: 'qc', label: 'QC', icon: ClipboardCheck },
  { key: 'payments', label: 'การชำระเงิน', icon: CreditCard },
  { key: 'production', label: 'การผลิต', icon: Factory },
  { key: 'history', label: 'ประวัติ', icon: Clock },
];

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;
  const { success, error: showError } = useToast();
  
  // ERP Hooks
  const { order, loading, error, refetch } = useERPOrder(orderId);
  const { workItems } = useERPWorkItems(orderId);
  const { payments } = useERPPayments(orderId);
  const { 
    designs, 
    mockups, 
    gates, 
    summary: designSummary, 
    loading: designLoading 
  } = useERPOrderDesignFlow(orderId);
  const { changeRequests, stats: crStats } = useERPChangeRequests({ order_id: orderId });
  const { records: qcRecords, summary: qcSummary } = useERPQCForOrder(orderId);

  // UI State
  const [activeTab, setActiveTab] = useState<string>('details');
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Helpers
  const formatDate = (date: string | null | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (date: string | null | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return '฿0';
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const copyCustomerLink = () => {
    if (order?.access_token) {
      const link = `${window.location.origin}/order/${order.access_token}`;
      navigator.clipboard.writeText(link);
      success('คัดลอกลิงก์แล้ว');
    }
  };

  const toggleItemExpand = (itemId: string) => {
    setExpandedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F5F5F7]">
        <div className="w-8 h-8 border-4 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Error state
  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F5F5F7] text-[#86868B]">
        <Package className="w-16 h-16 mb-4 opacity-50" />
        <h2 className="text-xl font-semibold mb-2 text-[#1D1D1F]">ไม่พบออเดอร์</h2>
        <p className="mb-4">{error || 'Order not found'}</p>
        <Link href="/orders" className="text-[#007AFF] hover:underline">
          กลับไปหน้ารายการ
        </Link>
      </div>
    );
  }

  // Status info
  const statusConfig = ORDER_STATUS_CONFIG[order.status as OrderStatus] || {
    label: order.status,
    label_th: order.status,
    color: 'text-[#86868B]',
    bgColor: 'bg-gray-100',
  };

  const paymentStatusConfig = PAYMENT_STATUS_CONFIG[order.payment_status || 'unpaid'] || {
    label: 'ไม่ทราบ',
    label_th: 'ไม่ทราบ',
    color: 'text-[#86868B]',
    bgColor: 'bg-gray-100',
  };

  const isOverdue = order.due_date && new Date(order.due_date) < new Date() && 
    !['completed', 'cancelled', 'shipped'].includes(order.status);

  const priorityConfig = {
    normal: { label: 'ปกติ', icon: Clock, color: 'text-[#86868B]' },
    rush: { label: 'เร่ง', icon: Zap, color: 'text-[#FF9500]' },
    urgent: { label: 'ด่วน', icon: AlertTriangle, color: 'text-[#FF3B30]' },
    emergency: { label: 'ด่วนมาก', icon: Sparkles, color: 'text-[#AF52DE]' },
  };

  const priority = priorityConfig[order.priority_code as keyof typeof priorityConfig] || priorityConfig.normal;
  const PriorityIcon = priority.icon;

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* Header */}
      <div className="bg-white border-b border-[#E8E8ED] sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-4">
        <Link href="/orders">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
              <div>
          <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-[#1D1D1F]">{order.order_number}</h1>
<span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                    {statusConfig.label_th}
            </span>
            {isOverdue && (
                    <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                เกินกำหนด
              </span>
            )}
          </div>
                <p className="text-sm text-[#86868B] mt-0.5">
                  {order.customer_snapshot?.name || 'ไม่ระบุลูกค้า'}
                </p>
              </div>
        </div>

            <div className="flex items-center gap-2 md:ml-auto">
          <Button variant="secondary" size="sm" onClick={copyCustomerLink}>
            <Copy className="w-4 h-4 mr-2" />
                คัดลอกลิงก์
          </Button>
          <Link href={`/orders/${orderId}/edit`}>
            <Button size="sm">
              <Edit className="w-4 h-4 mr-2" />
              แก้ไข
            </Button>
          </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 bg-white apple-card">
            <div className="flex items-center gap-2 text-[#86868B] text-xs mb-1">
            <DollarSign className="w-4 h-4" />
            ยอดรวม
          </div>
            <div className="text-xl font-bold text-[#1D1D1F]">
              {formatCurrency(order.pricing?.total_amount)}
            </div>
        </Card>
        
          <Card className="p-4 bg-white apple-card">
            <div className="flex items-center gap-2 text-[#86868B] text-xs mb-1">
            <CheckCircle2 className="w-4 h-4" />
            ชำระแล้ว
          </div>
            <div className={`text-xl font-bold ${
              order.payment_status === 'paid' ? 'text-[#34C759]' :
              order.payment_status === 'partial' ? 'text-[#FF9500]' :
              'text-[#86868B]'
            }`}>
            {formatCurrency(order.paid_amount)}
          </div>
<div className="text-xs text-[#86868B] mt-0.5">
              {paymentStatusConfig.label_th}
          </div>
        </Card>
        
          <Card className="p-4 bg-white apple-card">
            <div className="flex items-center gap-2 text-[#86868B] text-xs mb-1">
              <Calendar className="w-4 h-4" />
            วันที่สั่ง
          </div>
            <div className="text-lg font-semibold text-[#1D1D1F]">
              {formatDate(order.order_date)}
            </div>
        </Card>
        
          <Card className="p-4 bg-white apple-card">
            <div className="flex items-center gap-2 text-[#86868B] text-xs mb-1">
            <Truck className="w-4 h-4" />
            กำหนดส่ง
          </div>
            <div className={`text-lg font-semibold ${isOverdue ? 'text-[#FF3B30]' : 'text-[#1D1D1F]'}`}>
            {formatDate(order.due_date)}
          </div>
            {isOverdue && (
              <div className="text-xs text-[#FF3B30] mt-0.5">เกินกำหนด!</div>
            )}
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-2 bg-white rounded-xl p-1 border border-[#E8E8ED]">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
          <button
            key={tab.key}
                onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-[#007AFF] text-white'
                : 'text-[#86868B] hover:bg-[#F5F5F7] hover:text-[#1D1D1F]'
            }`}
          >
                <Icon className="w-4 h-4" />
            {tab.label}
          </button>
            );
          })}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Info */}
              <Card className="p-6 bg-white apple-card">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-[#007AFF]" />
                <h3 className="text-lg font-semibold text-[#1D1D1F]">ข้อมูลลูกค้า</h3>
              </div>
              <div className="space-y-3">
                  <InfoRow
                    icon={<User className="w-4 h-4" />}
                    label="ชื่อ"
                    value={order.customer_snapshot?.name}
                  />
                  <InfoRow
                    icon={<Phone className="w-4 h-4" />}
                    label="เบอร์โทร"
                    value={order.customer_snapshot?.phone}
                  />
                  <InfoRow
                    icon={<Mail className="w-4 h-4" />}
                    label="อีเมล"
                    value={order.customer_snapshot?.email}
                  />
                  {order.customer_snapshot?.tier && (
                    <InfoRow
                      icon={<Hash className="w-4 h-4" />}
                      label="Tier"
                      value={
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          order.customer_snapshot.tier === 'platinum' ? 'bg-[#5856D6]/10 text-[#5856D6]' :
                          order.customer_snapshot.tier === 'gold' ? 'bg-[#FF9500]/10 text-[#FF9500]' :
                          order.customer_snapshot.tier === 'silver' ? 'bg-[#8E8E93]/10 text-[#8E8E93]' :
                          'bg-[#D1D1D6]/10 text-[#8E8E93]'
                        }`}>
                          {order.customer_snapshot.tier}
                        </span>
                      }
                    />
                )}
              </div>
            </Card>

            {/* Shipping Info */}
              <Card className="p-6 bg-white apple-card">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-[#34C759]" />
                <h3 className="text-lg font-semibold text-[#1D1D1F]">ที่อยู่จัดส่ง</h3>
              </div>
              <div className="space-y-3">
                  <InfoRow
                    icon={<User className="w-4 h-4" />}
                    label="ผู้รับ"
                    value={order.shipping_address?.name}
                  />
                  <InfoRow
                    icon={<Phone className="w-4 h-4" />}
                    label="เบอร์โทร"
                    value={order.shipping_address?.phone}
                  />
                  <InfoRow
                    icon={<MapPin className="w-4 h-4" />}
                    label="ที่อยู่"
                    value={order.shipping_address ? 
                      `${order.shipping_address.address || ''} ${order.shipping_address.district || ''} ${order.shipping_address.province || ''} ${order.shipping_address.postal_code || ''}`.trim() || '-'
                      : '-'
                    }
                  />
              </div>
            </Card>

            {/* Order Info */}
              <Card className="p-6 bg-white apple-card">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-[#FF9500]" />
                <h3 className="text-lg font-semibold text-[#1D1D1F]">รายละเอียดออเดอร์</h3>
              </div>
              <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#86868B]">ประเภท</span>
                    <span className="text-[#1D1D1F] font-medium">
                      {order.order_type_code === 'ready_made' ? 'เสื้อสำเร็จรูป + สกรีน' :
                       order.order_type_code === 'custom_sewing' ? 'ตัดเย็บตามแบบ' :
                       order.order_type_code === 'full_custom' ? 'ออกแบบ+ตัดเย็บ+สกรีน' :
                       order.order_type_code === 'print_only' ? 'รับสกรีนอย่างเดียว' :
                       order.order_type_code || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#86868B]">Production Mode</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      order.production_mode === 'in_house' ? 'bg-[#34C759]/10 text-[#34C759]' :
                      order.production_mode === 'outsource' ? 'bg-[#FF9500]/10 text-[#FF9500]' :
                      'bg-[#007AFF]/10 text-[#007AFF]'
                    }`}>
                      {order.production_mode === 'in_house' ? 'In-house' :
                       order.production_mode === 'outsource' ? 'Outsource' :
                       'Hybrid'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#86868B]">ความเร่งด่วน</span>
                    <span className={`flex items-center gap-1 ${priority.color}`}>
                      <PriorityIcon className="w-4 h-4" />
                      {priority.label}
                      {order.priority_surcharge_percent > 0 && (
                        <span className="text-xs">+{order.priority_surcharge_percent}%</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                  <span className="text-[#86868B]">ช่องทางขาย</span>
                  <span className="text-[#1D1D1F] capitalize">{order.sales_channel || '-'}</span>
                </div>
                  <div className="flex justify-between text-sm">
                  <span className="text-[#86868B]">เงื่อนไขชำระ</span>
                  <span className="text-[#1D1D1F]">
                    {order.payment_terms === 'full' ? 'ชำระเต็มจำนวน' :
                     order.payment_terms === '50_50' ? 'มัดจำ 50%' :
                       order.payment_terms === '30_70' ? 'มัดจำ 30%' :
                       order.payment_terms || '-'}
                  </span>
                </div>
                  <div className="flex justify-between text-sm">
                  <span className="text-[#86868B]">ใบกำกับภาษี</span>
                  <span className="text-[#1D1D1F]">{order.needs_tax_invoice ? 'ต้องการ' : 'ไม่ต้องการ'}</span>
                </div>
                </div>

                {order.customer_note && (
                  <div className="mt-4 pt-4 border-t border-[#E8E8ED]">
                    <p className="text-xs text-[#86868B] mb-1">หมายเหตุจากลูกค้า</p>
                    <p className="text-sm text-[#1D1D1F] bg-[#F5F5F7] p-3 rounded-lg">{order.customer_note}</p>
                  </div>
                )}

                {order.internal_note && (
                  <div className="mt-3">
                    <p className="text-xs text-[#86868B] mb-1">หมายเหตุภายใน</p>
                    <p className="text-sm text-yellow-700 bg-yellow-50 p-3 rounded-lg border border-yellow-200">{order.internal_note}</p>
                  </div>
                )}
            </Card>

              {/* Price Summary */}
              <Card className="p-6 bg-white apple-card">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-[#34C759]" />
                <h3 className="text-lg font-semibold text-[#1D1D1F]">สรุปยอด</h3>
              </div>
              <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#86868B]">ยอดรวมสินค้า/บริการ</span>
                    <span>{formatCurrency(order.pricing?.subtotal)}</span>
                </div>
                  {(order.pricing?.discount_amount ?? 0) > 0 && (
                    <div className="flex justify-between text-sm text-[#34C759]">
                      <span>ส่วนลด</span>
                      <span>-{formatCurrency(order.pricing?.discount_amount)}</span>
                  </div>
                )}
                  {(order.pricing?.surcharge_amount ?? 0) > 0 && (
                    <div className="flex justify-between text-sm text-[#FF9500]">
                      <span>ค่าเร่งด่วน</span>
                      <span>+{formatCurrency(order.pricing?.surcharge_amount)}</span>
                  </div>
                )}
                  {(order.pricing?.shipping_cost ?? 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#86868B]">ค่าจัดส่ง</span>
                      <span>{formatCurrency(order.pricing?.shipping_cost)}</span>
                  </div>
                )}
                  {(order.pricing?.tax_amount ?? 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#86868B]">ภาษี ({order.pricing?.tax_percent}%)</span>
                      <span>{formatCurrency(order.pricing?.tax_amount)}</span>
                  </div>
                )}
                  <div className="pt-3 mt-3 border-t border-[#E8E8ED]">
                    <div className="flex justify-between">
                      <span className="text-lg font-bold text-[#1D1D1F]">ยอดรวมทั้งสิ้น</span>
                      <span className="text-lg font-bold text-[#34C759]">
                        {formatCurrency(order.pricing?.total_amount)}
                      </span>
                    </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Items Tab */}
        {activeTab === 'items' && (
            <Card className="p-6 bg-white apple-card">
              <h3 className="text-lg font-semibold text-[#1D1D1F] mb-4">
                รายการงาน ({workItems.length} รายการ)
              </h3>

              {workItems.length === 0 ? (
                <div className="text-center py-12 text-[#86868B]">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>ไม่มีรายการงาน</p>
              </div>
            ) : (
                <div className="space-y-3">
                  {workItems.map((item, index) => (
                    <WorkItemCard
                      key={item.id}
                      item={item}
                      index={index}
                      isExpanded={expandedItems.includes(item.id)}
                      onToggle={() => toggleItemExpand(item.id)}
                      formatCurrency={formatCurrency}
                    />
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Design & Approval Tab */}
          {activeTab === 'design' && (
            <DesignApprovalTab
              orderId={orderId}
              designs={designs}
              mockups={mockups}
              summary={designSummary}
              loading={designLoading}
            />
          )}

          {/* Change Requests Tab */}
          {activeTab === 'changes' && (
            <div className="space-y-6">
              {/* Stats */}
              {crStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="p-4 bg-white apple-card">
                    <div className="text-2xl font-bold text-[#1D1D1F]">{changeRequests.length}</div>
                    <div className="text-xs text-[#86868B]">คำขอทั้งหมด</div>
                  </Card>
                  <Card className="p-4 bg-[#FF9500]/10 apple-card">
                    <div className="text-2xl font-bold text-[#FF9500]">
                      {changeRequests.filter(cr => ['pending_quote', 'awaiting_customer', 'in_progress'].includes(cr.status)).length}
                            </div>
                    <div className="text-xs text-[#FF9500]">รอดำเนินการ</div>
                  </Card>
                  <Card className="p-4 bg-[#34C759]/10 apple-card">
                    <div className="text-2xl font-bold text-[#34C759]">
                      {changeRequests.filter(cr => cr.status === 'completed').length}
                          </div>
                    <div className="text-xs text-[#34C759]">เสร็จสิ้น</div>
                  </Card>
                  <Card className="p-4 bg-white apple-card">
                    <div className="text-2xl font-bold text-[#FF9500]">
                      {formatCurrency(changeRequests.reduce((sum, cr) => sum + cr.fees.total_fee, 0))}
                        </div>
                    <div className="text-xs text-[#86868B]">ค่าใช้จ่ายเพิ่ม</div>
                  </Card>
                        </div>
              )}

              {/* Change Request List */}
              <Card className="p-6 bg-white apple-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[#1D1D1F] flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-[#FF9500]" />
                    คำขอแก้ไข/เปลี่ยนแปลง
                  </h3>
                  <Button size="sm" className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    สร้างคำขอใหม่
                  </Button>
                            </div>

                {changeRequests.length === 0 ? (
                  <div className="text-center py-12 text-[#86868B]">
                    <RefreshCw className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>ยังไม่มีคำขอแก้ไข</p>
                    <p className="text-sm mt-1">ลูกค้าสามารถขอแก้ไขได้ที่นี่</p>
                            </div>
                ) : (
                  <div className="space-y-3">
                    {changeRequests.map((cr) => (
                      <ChangeRequestCard
                        key={cr.id}
                        changeRequest={cr}
                        onClick={() => console.log('View CR:', cr.id)}
                      />
                    ))}
                            </div>
                )}
              </Card>
                          </div>
          )}

          {/* QC Tab */}
          {activeTab === 'qc' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* QC Records */}
              <div className="lg:col-span-2 space-y-4">
                <Card className="p-6 bg-white apple-card">
                  <h3 className="text-lg font-semibold text-[#1D1D1F] mb-4 flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5 text-[#007AFF]" />
                    ประวัติ QC ({qcRecords.length} รายการ)
                  </h3>

                  {qcRecords.length === 0 ? (
                    <div className="text-center py-12 text-[#86868B]">
                      <ClipboardCheck className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>ยังไม่มีรายการ QC</p>
                      <p className="text-sm mt-1">QC จะถูกบันทึกเมื่อเริ่มผลิต</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {qcRecords.map((record) => (
                        <QCRecordCard
                          key={record.id}
                          record={record}
                          onClick={() => console.log('View QC:', record.id)}
                        />
                      ))}
                            </div>
                          )}
                </Card>
              </div>

              {/* QC Summary */}
                                    <div>
                {qcSummary ? (
                  <QCSummaryCard summary={qcSummary} />
                ) : (
                  <Card className="p-6 bg-white apple-card">
                    <h3 className="text-lg font-semibold text-[#1D1D1F] mb-4">สรุป QC</h3>
                    <div className="text-center py-8 text-[#86868B]">
                      <ClipboardCheck className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>ยังไม่มีข้อมูล</p>
                                    </div>
                  </Card>
                )}
                              </div>
                            </div>
                          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <Card className="p-6 bg-white apple-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#1D1D1F]">
                  การชำระเงิน
                </h3>
                <div className="text-sm">
                  <span className="text-[#86868B]">ชำระแล้ว </span>
                  <span className={order.payment_status === 'paid' ? 'text-[#34C759] font-bold' : 'text-[#FF9500] font-bold'}>
                    {formatCurrency(order.paid_amount)}
                                    </span>
                  <span className="text-[#86868B]"> / {formatCurrency(order.pricing?.total_amount)}</span>
                                  </div>
                              </div>

              {payments.length === 0 ? (
                <div className="text-center py-12 text-[#86868B]">
                  <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>ยังไม่มีการชำระเงิน</p>
                            </div>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <PaymentCard
                      key={payment.id}
                      payment={payment}
                      formatCurrency={formatCurrency}
                      formatDateTime={formatDateTime}
                    />
                  ))}
                        </div>
                      )}

              {/* Payment Progress */}
              {order.pricing?.total_amount && order.pricing.total_amount > 0 && (
                <div className="mt-6 pt-6 border-t border-[#E8E8ED]">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-[#86868B]">ความคืบหน้าการชำระ</span>
                    <span className="font-medium">
                      {Math.round(((order.paid_amount || 0) / order.pricing.total_amount) * 100)}%
                    </span>
                    </div>
                  <div className="h-2 bg-[#E8E8ED] rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        order.payment_status === 'paid' ? 'bg-[#34C759]' :
                        order.payment_status === 'partial' ? 'bg-[#FF9500]' :
                        'bg-[#007AFF]'
                      }`}
                      style={{ width: `${Math.min(100, ((order.paid_amount || 0) / order.pricing.total_amount) * 100)}%` }}
                    />
                  </div>
              </div>
            )}
          </Card>
        )}

          {/* Production Tab */}
          {activeTab === 'production' && (
            <Card className="p-6 bg-white apple-card">
              <h3 className="text-lg font-semibold text-[#1D1D1F] mb-4">สถานะการผลิต</h3>

              {/* Approval Gates */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-[#86868B] mb-3">Approval Gates</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <ApprovalGate
                    label="Design Approved"
                    approved={order.all_designs_approved}
                    date={order.all_designs_approved_at}
                    formatDate={formatDateTime}
                  />
                  <ApprovalGate
                    label="Mockup Approved"
                    approved={order.mockup_approved}
                    date={order.mockup_approved_at}
                    formatDate={formatDateTime}
                  />
                  <ApprovalGate
                    label="Materials Ready"
                    approved={order.materials_ready}
                    date={order.materials_ready_at}
                    formatDate={formatDateTime}
                  />
                  <ApprovalGate
                    label="Production Unlocked"
                    approved={order.production_unlocked}
                    date={order.production_unlocked_at}
                    formatDate={formatDateTime}
                  />
                </div>
              </div>

              {/* Production Status */}
              <div className="text-center py-8 text-[#86868B]">
                <Factory className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>ข้อมูลการผลิตจะแสดงที่นี่</p>
                <p className="text-xs mt-1">(Mock mode - ยังไม่มีข้อมูล Production Jobs)</p>
              </div>
          </Card>
        )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <Card className="p-6 bg-white apple-card">
              <h3 className="text-lg font-semibold text-[#1D1D1F] mb-4">ประวัติการเปลี่ยนแปลง</h3>

              <div className="text-center py-12 text-[#86868B]">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>ประวัติจะแสดงที่นี่</p>
                <p className="text-xs mt-1">(Mock mode - ยังไม่มีข้อมูล History)</p>
              </div>
            </Card>
                )}
              </div>
                          </div>
                      </div>
  );
}

// ---------------------------------------------
// Sub Components
// ---------------------------------------------

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
                  return (
    <div className="flex items-start gap-3">
      <div className="text-[#86868B] mt-0.5">{icon}</div>
      <div className="flex-1">
        <div className="text-xs text-[#86868B]">{label}</div>
        <div className="text-sm text-[#1D1D1F]">{value || '-'}</div>
                          </div>
                        </div>
  );
}

function WorkItemCard({
  item,
  index,
  isExpanded,
  onToggle,
  formatCurrency,
}: {
  item: OrderWorkItem;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  formatCurrency: (n: number) => string;
}) {
  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: 'รอดำเนินการ', color: 'bg-gray-100 text-[#86868B]' },
    in_production: { label: 'กำลังผลิต', color: 'bg-purple-100 text-purple-600' },
    qc_pending: { label: 'รอ QC', color: 'bg-yellow-100 text-yellow-600' },
    completed: { label: 'เสร็จสิ้น', color: 'bg-green-100 text-green-600' },
  };

  const status = statusConfig[item.status] || { label: item.status, color: 'bg-gray-100 text-[#86868B]' };
                  
                  return (
    <div className="bg-[#F5F5F7] rounded-xl border border-[#E8E8ED] overflow-hidden">
                      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-[#E8E8ED]/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-[#86868B] font-mono text-sm">#{index + 1}</span>
                          <div className="text-left">
            <div className="text-[#1D1D1F] font-medium">{item.work_type_name_th || item.work_type_name}</div>
            <div className="text-xs text-[#86868B]">
                              {item.position_name && `${item.position_name}`}
                              {item.print_size_name && ` • ${item.print_size_name}`}
                      </div>
                    </div>
                        </div>
        <div className="flex items-center gap-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
            {status.label}
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
                        </div>
                      )}
                    </div>
                  );
}

function PaymentCard({
  payment,
  formatCurrency,
  formatDateTime,
}: {
  payment: OrderPayment;
  formatCurrency: (n: number) => string;
  formatDateTime: (d: string | null | undefined) => string;
}) {
  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: 'รอตรวจสอบ', color: 'bg-yellow-100 text-yellow-600' },
    verified: { label: 'ยืนยันแล้ว', color: 'bg-green-100 text-green-600' },
    rejected: { label: 'ปฏิเสธ', color: 'bg-red-100 text-red-600' },
  };

  const status = statusConfig[payment.status] || { label: payment.status, color: 'bg-gray-100 text-[#86868B]' };

                  return (
    <div className="p-4 bg-[#F5F5F7] rounded-xl border border-[#E8E8ED]">
      <div className="flex items-start justify-between mb-2">
                        <div>
          <span className="text-lg font-bold text-[#1D1D1F]">{formatCurrency(payment.amount)}</span>
          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
            {status.label}
                            </span>
            </div>
        <span className="text-xs text-[#86868B]">{formatDateTime(payment.created_at)}</span>
                        </div>
      <div className="text-sm text-[#86868B]">
        {payment.payment_method === 'bank_transfer' ? 'โอนเงิน' :
         payment.payment_method === 'cash' ? 'เงินสด' :
         payment.payment_method === 'credit_card' ? 'บัตรเครดิต' :
         payment.payment_method}
        {payment.bank_name && ` • ${payment.bank_name}`}
                        </div>
                      </div>
                  );
}

// ---------------------------------------------
// Design & Approval Tab Component
// ---------------------------------------------

import type { 
  OrderDesign, 
  OrderMockup, 
  OrderGatesSummary,
  DesignApprovalSummary,
  DesignVersion,
} from '@/modules/erp';

function DesignApprovalTab({
  orderId,
  designs,
  mockups,
  summary,
  loading,
}: {
  orderId: string;
  designs: OrderDesign[];
  mockups: OrderMockup[];
  summary: {
    gates: OrderGatesSummary | null;
    design: DesignApprovalSummary | null;
    mockup: any;
    canStartProduction: boolean;
  };
  loading: boolean;
}) {
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null);
  const [showVersionModal, setShowVersionModal] = useState(false);

  const selectedDesign = designs.find(d => d.id === selectedDesignId);
  // Get versions from design object (populated by repository)
  const selectedDesignVersions: DesignVersion[] = selectedDesign?.versions
    ? [...selectedDesign.versions].sort((a, b) => b.version_number - a.version_number)
    : [];

  const latestMockup = mockups.length > 0
    ? mockups.reduce((latest, m) => m.version_number > latest.version_number ? m : latest, mockups[0])
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
              </div>
                  );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Designs */}
      <div className="lg:col-span-2 space-y-6">
        {/* Design Summary Stats */}
        {summary.design && (
          <Card className="p-6 bg-white apple-card">
            <h3 className="text-lg font-semibold text-[#1D1D1F] mb-4 flex items-center gap-2">
              <Palette className="w-5 h-5 text-[#007AFF]" />
              สรุปการออกแบบ
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-[#F5F5F7] rounded-xl text-center">
                <div className="text-2xl font-bold text-[#1D1D1F]">{summary.design.total_designs}</div>
                <div className="text-xs text-[#86868B]">ไฟล์ออกแบบ</div>
                    </div>
              <div className="p-3 bg-[#34C759]/10 rounded-xl text-center">
                <div className="text-2xl font-bold text-[#34C759]">{summary.design.approved_designs}</div>
                <div className="text-xs text-[#34C759]">อนุมัติแล้ว</div>
                  </div>
              <div className="p-3 bg-[#FF9500]/10 rounded-xl text-center">
                <div className="text-2xl font-bold text-[#FF9500]">{summary.design.pending_designs}</div>
                <div className="text-xs text-[#FF9500]">รอตรวจสอบ</div>
                  </div>
              <div className="p-3 bg-[#007AFF]/10 rounded-xl text-center">
                <div className="text-2xl font-bold text-[#007AFF]">{summary.design.total_revisions}</div>
                <div className="text-xs text-[#007AFF]">แก้ไขทั้งหมด</div>
                </div>
            </div>
            
            {/* Revision Cost Warning */}
            {summary.design.paid_revisions_count > 0 && (
              <div className="mt-4 p-3 bg-[#FF9500]/10 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#FF9500]">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    ค่าแก้ไขเพิ่มเติม ({summary.design.paid_revisions_count} ครั้ง)
                  </span>
                </div>
                <span className="text-lg font-bold text-[#FF9500]">
                  ฿{summary.design.paid_revisions_total.toLocaleString()}
                </span>
              </div>
            )}
          </Card>
        )}

        {/* Designs List */}
        <Card className="p-6 bg-white apple-card">
          <h3 className="text-lg font-semibold text-[#1D1D1F] mb-4">
            ไฟล์ออกแบบ ({designs.length} ไฟล์)
          </h3>

          {designs.length === 0 ? (
            <div className="text-center py-12 text-[#86868B]">
              <Palette className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>ยังไม่มีไฟล์ออกแบบ</p>
              </div>
            ) : (
              <div className="space-y-3">
              {designs.map((design) => {
                // Get versions from design object (populated by repository)
                const versions = design.versions || [];
                  return (
                  <DesignSummaryCard
                    key={design.id}
                    design={design}
                    versions={versions}
                    onClick={() => {
                      setSelectedDesignId(design.id);
                      setShowVersionModal(true);
                    }}
                  />
                );
              })}
              </div>
            )}
          </Card>

        {/* Mockup Section */}
        <Card className="p-6 bg-white apple-card">
          <h3 className="text-lg font-semibold text-[#1D1D1F] mb-4 flex items-center gap-2">
            <Image className="w-5 h-5 text-[#34C759]" />
            Mockup
          </h3>

          {!latestMockup ? (
            <div className="text-center py-12 text-[#86868B]">
              <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>ยังไม่มี Mockup</p>
                        </div>
            ) : (
            <MockupApprovalCard
              mockup={latestMockup}
              onApprove={() => {
                // TODO: Implement approval
                console.log('Approve mockup');
              }}
              onReject={(feedback) => {
                // TODO: Implement rejection
                console.log('Reject mockup:', feedback);
              }}
            />
          )}
        </Card>
                        </div>

      {/* Right Column - Approval Gates */}
      <div className="space-y-6">
        {summary.gates && (
          <ApprovalGatesSummary
            summary={summary.gates}
            onGateClick={(gate) => {
              console.log('Gate clicked:', gate);
            }}
          />
        )}

        {/* Production Ready Banner */}
        {summary.canStartProduction ? (
          <Card className="p-6 bg-[#34C759]/10 border-2 border-[#34C759]/30 apple-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-[#34C759] rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-white" />
                      </div>
              <div>
                <h3 className="font-bold text-[#34C759]">พร้อมผลิต!</h3>
                <p className="text-sm text-[#34C759]/80">ผ่าน Gates ทั้งหมดแล้ว</p>
                    </div>
              </div>
            <Button className="w-full gap-2 bg-[#34C759] hover:bg-[#2DB84D]">
              <Factory className="w-4 h-4" />
              ส่งเข้าผลิต
            </Button>
          </Card>
        ) : (
          <Card className="p-6 bg-[#FF9500]/10 border-2 border-[#FF9500]/30 apple-card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#FF9500] rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-[#FF9500]">ยังผลิตไม่ได้</h3>
                <p className="text-sm text-[#FF9500]/80">
                  รอ: {summary.gates?.blocking_gates.join(', ') || 'Gates'}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Design Versions Modal */}
      <Modal
        isOpen={showVersionModal}
        onClose={() => {
          setShowVersionModal(false);
          setSelectedDesignId(null);
        }}
        title={selectedDesign?.design_name || 'Design Versions'}
        size="lg"
      >
        {selectedDesign && (
        <div className="p-4 space-y-4">
            {/* Design Info */}
            <div className="p-4 bg-[#F5F5F7] rounded-xl">
              <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
                  <span className="text-[#86868B]">ตำแหน่ง:</span>
                  <span className="ml-2 text-[#1D1D1F]">{selectedDesign.position || '-'}</span>
          </div>
          <div>
                  <span className="text-[#86868B]">แก้ไข:</span>
                  <span className="ml-2 text-[#1D1D1F]">
                    {selectedDesign.revision_count} ครั้ง
                    {selectedDesign.paid_revision_count > 0 && (
                      <span className="text-[#FF9500]">
                        {' '}(เสียค่าแก้ ฿{selectedDesign.paid_revision_total})
                      </span>
                    )}
                  </span>
                </div>
              </div>
              {selectedDesign.brief_text && (
                <div className="mt-3 pt-3 border-t border-[#E8E8ED]">
                  <span className="text-xs text-[#86868B]">Brief:</span>
                  <p className="text-sm text-[#1D1D1F] mt-1">{selectedDesign.brief_text}</p>
                </div>
              )}
          </div>
          
            {/* Versions List */}
            <h4 className="font-semibold text-[#1D1D1F]">
              ประวัติเวอร์ชัน ({selectedDesignVersions.length})
            </h4>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {selectedDesignVersions.map((version, index) => (
                <DesignVersionCard
                  key={version.id}
                  version={version}
                  isLatest={index === 0}
                  onApprove={() => {
                    console.log('Approve version:', version.id);
                  }}
                  onReject={(feedback) => {
                    console.log('Reject version:', version.id, feedback);
                  }}
                  onPreview={() => {
                    window.open(version.file_url, '_blank');
                  }}
                />
              ))}
          </div>
        </div>
        )}
      </Modal>
    </div>
  );
}

// ---------------------------------------------
// Original ApprovalGate (for Production tab)
// ---------------------------------------------

function ApprovalGate({
  label,
  approved,
  date,
  formatDate,
}: {
  label: string;
  approved?: boolean;
  date?: string | null;
  formatDate: (d: string | null | undefined) => string;
}) {
  return (
    <div className={`p-3 rounded-xl border ${approved ? 'bg-[#34C759]/5 border-[#34C759]/20' : 'bg-[#F5F5F7] border-[#E8E8ED]'}`}>
      <div className="flex items-center gap-2 mb-1">
        {approved ? (
          <CheckCircle2 className="w-4 h-4 text-[#34C759]" />
        ) : (
          <Clock className="w-4 h-4 text-[#86868B]" />
        )}
        <span className={`text-xs font-medium ${approved ? 'text-[#34C759]' : 'text-[#86868B]'}`}>
          {approved ? 'ผ่าน' : 'รอ'}
        </span>
      </div>
      <div className="text-sm font-medium text-[#1D1D1F]">{label}</div>
      {approved && date && (
        <div className="text-xs text-[#86868B] mt-1">{formatDate(date)}</div>
      )}
    </div>
  );
}
