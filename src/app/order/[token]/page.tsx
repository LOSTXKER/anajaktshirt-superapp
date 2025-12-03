'use client';

import { Button, Modal } from '@/modules/shared/ui';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Package,
  Clock,
  CheckCircle2,
  DollarSign,
  FileText,
  Image as ImageIcon,
  Upload,
  Phone,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Download,
  Copy,
} from 'lucide-react';
import { useOrderByToken } from '@/modules/orders/hooks/useOrders';
import { useOrderMutations } from '@/modules/orders/hooks/useOrderMutations';
import { ORDER_STATUS_CONFIG, type OrderStatus, type Order } from '@/modules/orders/types';
import { MockupManager } from '@/modules/orders/components/MockupManager';
import { PaymentManager } from '@/modules/orders/components/PaymentManager';

// Status flow for progress bar
const STATUS_FLOW: OrderStatus[] = [
  'draft',
  'quoted',
  'awaiting_payment',
  'designing',
  'awaiting_mockup_approval',
  'in_production',
  'qc_pending',
  'ready_to_ship',
  'shipped',
  'completed',
];

export default function CustomerOrderPage() {
  const params = useParams();
  const token = params.token as string;
  
  const { order, loading, error, refetch } = useOrderByToken(token);
  const { approveMockup, rejectMockup, loading: mutationLoading } = useOrderMutations();

  // UI State
  const [activeTab, setActiveTab] = useState<'status' | 'items' | 'mockup' | 'payment' | 'documents'>('status');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showMockupModal, setShowMockupModal] = useState(false);
  const [selectedMockup, setSelectedMockup] = useState<any>(null);
  const [mockupFeedback, setMockupFeedback] = useState('');
  const [paymentSlip, setPaymentSlip] = useState<File | null>(null);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#007AFF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#86868B]">กำลังโหลดข้อมูลออเดอร์...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#1D1D1F] mb-2">ไม่พบออเดอร์</h1>
          <p className="text-[#86868B] mb-6">
            ลิงก์ไม่ถูกต้องหรือออเดอร์ถูกยกเลิกแล้ว กรุณาติดต่อเจ้าหน้าที่
          </p>
          <a 
            href="https://line.me/ti/p/~yourlineid" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-[#1D1D1F] rounded-full hover:bg-green-600 transition-colors"
          >
            <Phone className="w-5 h-5" />
            ติดต่อ LINE
          </a>
        </div>
      </div>
    );
  }

  const statusConfig = ORDER_STATUS_CONFIG[order.status];
  const currentStatusIndex = STATUS_FLOW.indexOf(order.status);
  const progress = order.status === 'cancelled' ? 0 : ((currentStatusIndex + 1) / STATUS_FLOW.length) * 100;

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const isOverdue = order.due_date && new Date(order.due_date) < new Date() && 
    !['completed', 'cancelled', 'shipped'].includes(order.status);

  const pendingMockups = order.work_items?.flatMap(item => 
    item.designs?.flatMap(d => d.mockups?.filter(m => m.status === 'pending') || []) || []
  ) || [];

  const amountDue = order.total_amount - order.paid_amount;

  const toggleItemExpand = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleApproveMockup = async () => {
    if (!selectedMockup) return;
    const result = await approveMockup(selectedMockup.id, mockupFeedback);
    if (result.success) {
      setShowMockupModal(false);
      setSelectedMockup(null);
      setMockupFeedback('');
      refetch();
    }
  };

  const handleRejectMockup = async () => {
    if (!selectedMockup || !mockupFeedback.trim()) {
      alert('กรุณาระบุเหตุผลที่ต้องการแก้ไข');
      return;
    }
    const result = await rejectMockup(selectedMockup.id, mockupFeedback);
    if (result.success) {
      setShowMockupModal(false);
      setSelectedMockup(null);
      setMockupFeedback('');
      refetch();
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* Header */}
      <header className="bg-white border-b border-[#E8E8ED] sticky top-0 z-50 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#007AFF] flex items-center justify-center">
                <span className="text-[#1D1D1F] font-bold text-lg">A</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-[#1D1D1F]">อนาจักร</h1>
                <p className="text-xs text-[#86868B]">Garment Factory</p>
              </div>
            </div>
            <a 
              href="https://line.me/ti/p/~yourlineid" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-600 rounded-full text-sm hover:bg-green-200 transition-colors"
            >
              <Phone className="w-4 h-4" />
              ติดต่อ
            </a>
          </div>
        </div>
      </header>

      {/* Order Info */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl p-6 mb-6 border border-[#E8E8ED] shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-[#1D1D1F]">{order.order_number}</h2>
              <p className="text-[#86868B]">{order.customer_name}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig?.bgColor || ''} ${statusConfig?.color || ''}`}>
              {statusConfig?.label_th}
            </span>
          </div>

          {/* Progress Bar */}
          {order.status !== 'cancelled' && (
            <div className="mb-4">
              <div className="h-2 bg-[#E8E8ED] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#007AFF] to-[#34C759] transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-[#86868B]">
                <span>รับออเดอร์</span>
                <span>ผลิต</span>
                <span>จัดส่ง</span>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-[#F5F5F7] rounded-xl p-3">
              <div className="text-xs text-[#86868B] mb-1">ยอดรวม</div>
              <div className="text-lg font-bold text-[#1D1D1F]">฿{formatCurrency(order.total_amount)}</div>
            </div>
            <div className="bg-[#F5F5F7] rounded-xl p-3">
              <div className="text-xs text-[#86868B] mb-1">กำหนดส่ง</div>
              <div className={`text-lg font-bold ${isOverdue ? 'text-red-500' : 'text-[#1D1D1F]'}`}>
                {formatDate(order.due_date)}
              </div>
            </div>
          </div>

          {/* Alerts */}
          {pendingMockups.length > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-yellow-700 text-sm font-medium">รอการอนุมัติ Mockup</p>
                <p className="text-yellow-600 text-xs">มี {pendingMockups.length} Mockup รอตรวจสอบ</p>
              </div>
              <Button size="sm" onClick={() => setActiveTab('mockup')}>
                ตรวจสอบ
              </Button>
            </div>
          )}

          {amountDue > 0 && order.status !== 'draft' && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-blue-700 text-sm font-medium">ยอดค้างชำระ ฿{formatCurrency(amountDue)}</p>
                <p className="text-blue-600 text-xs">
                  {order.payment_status === 'partial' ? 'ชำระเงินงวดถัดไป' : 'รอชำระเงิน'}
                </p>
              </div>
              <Button size="sm" onClick={() => setActiveTab('payment')}>
                ชำระเงิน
              </Button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 overflow-x-auto pb-2 -mx-4 px-4">
          {[
            { key: 'status', label: 'สถานะ', icon: Clock },
            { key: 'items', label: 'รายการ', icon: Package },
            { key: 'mockup', label: 'Mockup', icon: ImageIcon, badge: pendingMockups.length },
            { key: 'payment', label: 'ชำระเงิน', icon: DollarSign },
            { key: 'documents', label: 'เอกสาร', icon: FileText },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap relative ${
                activeTab === tab.key
                  ? 'bg-[#007AFF] text-white'
                  : 'bg-white text-[#86868B] hover:text-[#1D1D1F] border border-[#E8E8ED]'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.badge && tab.badge > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-[#1D1D1F] text-xs rounded-full flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {/* Status Tab */}
          {activeTab === 'status' && (
            <div className="bg-white rounded-2xl p-6 border border-[#E8E8ED] shadow-sm">
              <h3 className="text-lg font-semibold text-[#1D1D1F] mb-4">สถานะออเดอร์</h3>
              
              <div className="space-y-4">
                {STATUS_FLOW.map((status, index) => {
                  const config = ORDER_STATUS_CONFIG[status];
                  const isPast = currentStatusIndex > index;
                  const isCurrent = currentStatusIndex === index;
                  
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isPast || isCurrent ? 'bg-[#007AFF]' : 'bg-[#E8E8ED]'
                      }`}>
                        {isPast ? (
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        ) : (
                          <span className={`text-sm ${isCurrent ? 'text-white' : 'text-[#86868B]'}`}>{index + 1}</span>
                        )}
                      </div>
                      <div className={`flex-1 ${isCurrent ? 'text-[#1D1D1F]' : isPast ? 'text-[#86868B]' : 'text-[#C7C7CC]'}`}>
                        <p className={`font-medium ${isCurrent ? 'text-[#007AFF]' : ''}`}>
                          {config?.label_th}
                        </p>
                      </div>
                      {isCurrent && (
                        <span className="text-xs bg-blue-100 text-[#007AFF] px-2 py-1 rounded-full">
                          ปัจจุบัน
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {order.tracking_number && (
                <div className="mt-6 p-4 bg-[#F5F5F7] rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#86868B]">หมายเลขพัสดุ</p>
                      <p className="text-[#1D1D1F] font-mono">{order.tracking_number}</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="secondary"
                      onClick={() => navigator.clipboard.writeText(order.tracking_number || '')}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      คัดลอก
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Items Tab */}
          {activeTab === 'items' && (
            <div className="bg-white rounded-2xl p-6 border border-[#E8E8ED] shadow-sm">
              <h3 className="text-lg font-semibold text-[#1D1D1F] mb-4">รายการสินค้า</h3>
              
              {order.work_items?.map((item) => (
                <div key={item.id} className="mb-3 bg-[#F5F5F7] rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleItemExpand(item.id)}
                    className="w-full p-4 flex items-center justify-between"
                  >
                    <div className="text-left">
                      <p className="text-[#1D1D1F] font-medium">{item.work_type_name}</p>
                      <p className="text-sm text-[#86868B]">
                        {item.position_name && `${item.position_name}`}
                        {item.print_size_name && ` • ${item.print_size_name}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[#1D1D1F]">฿{formatCurrency(item.total_price)}</span>
                      {expandedItems.includes(item.id) ? (
                        <ChevronDown className="w-4 h-4 text-[#86868B]" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-[#86868B]" />
                      )}
                    </div>
                  </button>
                  
                  {expandedItems.includes(item.id) && (
                    <div className="px-4 pb-4 border-t border-[#E8E8ED] pt-3">
                      <div className="text-sm space-y-2">
                        <div className="flex justify-between">
                          <span className="text-[#86868B]">จำนวน</span>
                          <span className="text-[#1D1D1F]">{item.quantity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#86868B]">ราคา/หน่วย</span>
                          <span className="text-[#1D1D1F]">฿{formatCurrency(item.unit_price)}</span>
                        </div>
                      </div>
                      
                      {item.products && item.products.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-[#E8E8ED]">
                          <p className="text-xs text-[#86868B] mb-2">สินค้า:</p>
                          {item.products.map((product) => (
                            <div key={product.id} className="flex justify-between text-sm py-1">
                              <span className="text-[#1D1D1F]">{product.product_name} x{product.quantity}</span>
                              <span className="text-[#86868B]">฿{formatCurrency(product.total_price)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Summary */}
              <div className="mt-4 pt-4 border-t border-[#E8E8ED] space-y-2">
                <div className="flex justify-between text-[#86868B]">
                  <span>ยอดรวม</span>
                  <span>฿{formatCurrency(order.subtotal)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>ส่วนลด</span>
                    <span>-฿{formatCurrency(order.discount_amount)}</span>
                  </div>
                )}
                {order.shipping_cost > 0 && (
                  <div className="flex justify-between text-[#86868B]">
                    <span>ค่าจัดส่ง</span>
                    <span>฿{formatCurrency(order.shipping_cost)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold text-[#1D1D1F] pt-2">
                  <span>ยอดรวมทั้งสิ้น</span>
                  <span className="text-[#34C759]">฿{formatCurrency(order.total_amount)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Mockup Tab */}
          {activeTab === 'mockup' && (
            <div className="bg-white rounded-2xl p-6 border border-[#E8E8ED] shadow-sm">
              <MockupManager
                orderId={order.id}
                designs={order.work_items?.flatMap(item => item.designs || []) || []}
                mockups={order.work_items?.flatMap(item => 
                  item.designs?.flatMap(d => d.mockups || []) || []
                ) || []}
                onRefresh={refetch}
                readOnly={false}
                isCustomerView={true}
              />
            </div>
          )}

          {/* Payment Tab */}
          {activeTab === 'payment' && (
            <div className="bg-white rounded-2xl p-6 border border-[#E8E8ED] shadow-sm">
              <PaymentManager
                order={order as Order}
                payments={order.payments || []}
                onRefresh={refetch}
                readOnly={false}
                isCustomerView={true}
              />
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="bg-white rounded-2xl p-6 border border-[#E8E8ED] shadow-sm">
              <h3 className="text-lg font-semibold text-[#1D1D1F] mb-4">เอกสาร</h3>
              
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-4 bg-[#F5F5F7] rounded-xl hover:bg-[#E8E8ED] transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-[#007AFF]" />
                    <div className="text-left">
                      <p className="text-[#1D1D1F]">ใบเสนอราคา</p>
                      <p className="text-xs text-[#86868B]">QT-{order.order_number}</p>
                    </div>
                  </div>
                  <Download className="w-5 h-5 text-[#86868B]" />
                </button>
                
                {order.payment_status !== 'unpaid' && (
                  <button className="w-full flex items-center justify-between p-4 bg-[#F5F5F7] rounded-xl hover:bg-[#E8E8ED] transition-colors">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-[#34C759]" />
                      <div className="text-left">
                        <p className="text-[#1D1D1F]">ใบเสร็จรับเงิน</p>
                        <p className="text-xs text-[#86868B]">REC-{order.order_number}</p>
                      </div>
                    </div>
                    <Download className="w-5 h-5 text-[#86868B]" />
                  </button>
                )}
              </div>
              
              {order.needs_tax_invoice && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <p className="text-yellow-700 text-sm">ต้องการใบกำกับภาษี - จะได้รับพร้อมสินค้า</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center py-8 text-[#86868B] text-sm">
          <p>มีคำถาม? ติดต่อเราได้เลย</p>
          <a 
            href="https://line.me/ti/p/~yourlineid" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[#34C759] hover:underline"
          >
            LINE: @anajak
          </a>
        </div>
      </div>

      {/* Mockup Feedback Modal */}
      <Modal
        isOpen={showMockupModal}
        onClose={() => {
          setShowMockupModal(false);
          setSelectedMockup(null);
          setMockupFeedback('');
        }}
        title="ขอแก้ไข Mockup"
      >
        <div className="p-4">
          <p className="text-[#86868B] text-sm mb-3">กรุณาระบุรายละเอียดที่ต้องการแก้ไข:</p>
          <textarea
            value={mockupFeedback}
            onChange={(e) => setMockupFeedback(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 bg-[#F5F5F7] border border-[#E8E8ED] rounded-lg text-[#1D1D1F] resize-none focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
            placeholder="เช่น ขอเปลี่ยนสีตัวหนังสือ, ขยับตำแหน่งลาย..."
          />
          <div className="flex gap-2 mt-4">
            <Button variant="secondary" className="flex-1" onClick={() => setShowMockupModal(false)}>
              ยกเลิก
            </Button>
            <Button className="flex-1" onClick={handleRejectMockup} disabled={mutationLoading}>
              ส่งคำขอแก้ไข
            </Button>
          </div>
        </div>
      </Modal>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="อัพโหลดสลิป"
      >
        <div className="p-4">
          <div className="bg-[#F5F5F7] border-2 border-dashed border-[#E8E8ED] rounded-xl p-8 text-center">
            <Upload className="w-12 h-12 text-[#86868B] mx-auto mb-3" />
            <p className="text-[#86868B] mb-2">คลิกเพื่ออัพโหลดสลิป</p>
            <p className="text-xs text-[#C7C7CC]">รองรับ JPG, PNG (ไม่เกิน 5MB)</p>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => setPaymentSlip(e.target.files?.[0] || null)}
            />
          </div>
          
          {paymentSlip && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm">เลือกไฟล์แล้ว: {paymentSlip.name}</p>
            </div>
          )}
          
          <Button className="w-full mt-4" disabled={!paymentSlip || mutationLoading}>
            ยืนยันการชำระเงิน
          </Button>
        </div>
      </Modal>
    </div>
  );
}
