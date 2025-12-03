'use client';

import { useState } from 'react';
import {
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Upload,
  Receipt,
  CreditCard,
  AlertCircle,
  Loader2,
  DollarSign,
  Banknote,
} from 'lucide-react';
import { Button } from '@/modules/shared/ui/Button';
import { Input } from '@/modules/shared/ui/Input';
import { Modal } from '@/modules/shared/ui/Modal';
import { Card } from '@/modules/shared/ui/Card';
import { ImageUpload } from '@/modules/shared/ui/FileUpload';
import { useToast } from '@/modules/shared/ui/Toast';
import { useOrderMutations } from '../hooks/useOrderMutations';
import type { OrderPayment, Order } from '../types';

interface PaymentManagerProps {
  order: Order;
  payments: OrderPayment[];
  onRefresh: () => void;
  readOnly?: boolean;
  isCustomerView?: boolean;
}

export function PaymentManager({
  order,
  payments,
  onRefresh,
  readOnly = false,
  isCustomerView = false,
}: PaymentManagerProps) {
  const { success, error: showError } = useToast();
  const { addPayment, confirmPayment, rejectPayment, loading } = useOrderMutations();

  // State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<OrderPayment | null>(null);

  // Form State
  const [paymentType, setPaymentType] = useState<'deposit' | 'partial' | 'full'>('deposit');
  const [amount, setAmount] = useState('');
  const [slipUrl, setSlipUrl] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const handleAddPayment = async () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showError('กรุณาใส่จำนวนเงินที่ถูกต้อง');
      return;
    }

    if (!slipUrl) {
      showError('กรุณาอัพโหลดสลิป');
      return;
    }

    const result = await addPayment({
      order_id: order.id,
      amount: parsedAmount,
      payment_type: paymentType,
      slip_image_url: slipUrl,
      note: note || undefined,
    });

    if (result.success) {
      success('บันทึกการชำระเงินแล้ว รอการตรวจสอบ');
      setShowAddModal(false);
      resetForm();
      onRefresh();
    } else {
      showError(result.error || 'เกิดข้อผิดพลาด');
    }
  };

  const handleConfirm = async (paymentId: string) => {
    const result = await confirmPayment(paymentId);
    if (result.success) {
      success('ยืนยันการชำระเงินเรียบร้อย');
      onRefresh();
    } else {
      showError(result.error || 'เกิดข้อผิดพลาด');
    }
  };

  const handleReject = async (paymentId: string) => {
    const result = await rejectPayment(paymentId, 'สลิปไม่ถูกต้อง');
    if (result.success) {
      success('ปฏิเสธการชำระเงินแล้ว');
      onRefresh();
    } else {
      showError(result.error || 'เกิดข้อผิดพลาด');
    }
  };

  const resetForm = () => {
    setPaymentType('deposit');
    setAmount('');
    setSlipUrl(null);
    setNote('');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
    }).format(value);
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
      case 'confirmed':
        return (
          <span className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
            <CheckCircle2 className="w-3 h-3" />
            ยืนยันแล้ว
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
            <XCircle className="w-3 h-3" />
            ไม่ผ่าน
          </span>
        );
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-[#86868B]">{status}</span>;
    }
  };

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'มัดจำ';
      case 'partial':
        return 'ชำระบางส่วน';
      case 'full':
        return 'ชำระเต็มจำนวน';
      default:
        return type;
    }
  };

  // Calculate totals
  const confirmedTotal = payments
    .filter(p => p.status === 'confirmed')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingTotal = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const remaining = (order.final_amount || order.total_amount) - confirmedTotal;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-emerald-500" />
          <h3 className="text-lg font-semibold text-[#1D1D1F]">การชำระเงิน</h3>
        </div>
        {!readOnly && (
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-1" />
            {isCustomerView ? 'แจ้งชำระเงิน' : 'เพิ่มการชำระ'}
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4 bg-[#F5F5F7] border-[#E8E8ED]">
          <p className="text-xs text-[#86868B] mb-1">ยอดรวมทั้งหมด</p>
          <p className="text-xl font-bold text-[#1D1D1F]">{formatCurrency(order.final_amount || order.total_amount)}</p>
        </Card>
        <Card className="p-4 bg-[#F5F5F7] border-[#E8E8ED]">
          <p className="text-xs text-[#86868B] mb-1">ชำระแล้ว</p>
          <p className="text-xl font-bold text-green-600">{formatCurrency(confirmedTotal)}</p>
        </Card>
        <Card className="p-4 bg-[#F5F5F7] border-[#E8E8ED]">
          <p className="text-xs text-[#86868B] mb-1">รอตรวจสอบ</p>
          <p className="text-xl font-bold text-yellow-600">{formatCurrency(pendingTotal)}</p>
        </Card>
        <Card className="p-4 bg-[#F5F5F7] border-[#E8E8ED]">
          <p className="text-xs text-[#86868B] mb-1">คงเหลือ</p>
          <p className={`text-xl font-bold ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(remaining)}
          </p>
        </Card>
      </div>

      {/* Payment Reminder for Customer */}
      {isCustomerView && remaining > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-700 font-medium">ยอดค้างชำระ {formatCurrency(remaining)}</p>
              <p className="text-amber-600 text-sm mt-1">
                กรุณาชำระเงินเพื่อดำเนินการผลิตต่อ
              </p>
              <div className="mt-3 p-3 bg-white rounded-lg border border-amber-200">
                <p className="text-[#1D1D1F] text-sm font-medium">บัญชีสำหรับโอนเงิน:</p>
                <p className="text-[#86868B] text-sm mt-1">
                  ธนาคารกสิกรไทย<br/>
                  เลขที่บัญชี: xxx-x-xxxxx-x<br/>
                  ชื่อบัญชี: บริษัท อณาจักรเสื้อผ้า จำกัด
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment History */}
      {payments.length === 0 ? (
        <Card className="p-8 bg-[#F5F5F7] border-[#E8E8ED] text-center">
          <Receipt className="w-12 h-12 text-[#C7C7CC] mx-auto mb-3" />
          <p className="text-[#86868B]">ยังไม่มีการชำระเงิน</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {payments.map((payment) => (
            <Card key={payment.id} className="p-4 bg-white border-[#E8E8ED]">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {/* Slip Preview */}
                  {payment.slip_image_url ? (
                    <div
                      className="w-16 h-16 rounded-lg overflow-hidden bg-[#F5F5F7] cursor-pointer flex-shrink-0"
                      onClick={() => {
                        setSelectedPayment(payment);
                        setShowSlipModal(true);
                      }}
                    >
                      <img
                        src={payment.slip_image_url}
                        alt="Slip"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-[#F5F5F7] flex items-center justify-center flex-shrink-0">
                      <Banknote className="w-6 h-6 text-[#C7C7CC]" />
                    </div>
                  )}

                  {/* Info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#1D1D1F] font-medium">
                        {formatCurrency(payment.amount)}
                      </span>
                      <span className="text-xs text-[#86868B] px-2 py-0.5 bg-[#F5F5F7] rounded">
                        {getPaymentTypeLabel(payment.payment_type)}
                      </span>
                    </div>
                    <p className="text-sm text-[#86868B] mt-1">
                      {new Date(payment.payment_date).toLocaleDateString('th-TH', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {payment.note && (
                      <p className="text-xs text-[#86868B] mt-1">{payment.note}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {getStatusBadge(payment.status)}
                  
                  {/* Admin Actions */}
                  {!isCustomerView && !readOnly && payment.status === 'pending' && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-green-600 hover:bg-green-50"
                        onClick={() => handleConfirm(payment.id)}
                        disabled={loading}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleReject(payment.id)}
                        disabled={loading}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Payment Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title={isCustomerView ? 'แจ้งชำระเงิน' : 'เพิ่มการชำระเงิน'}
      >
        <div className="p-4 space-y-4">
          {/* Payment Type */}
          <div>
            <label className="block text-sm text-[#86868B] mb-2">ประเภทการชำระ</label>
            <div className="grid grid-cols-3 gap-2">
              {(['deposit', 'partial', 'full'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setPaymentType(type);
                    if (type === 'full') {
                      setAmount(remaining.toString());
                    } else if (type === 'deposit') {
                      setAmount(((order.final_amount || order.total_amount) * 0.5).toString());
                    }
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    paymentType === type
                      ? 'bg-[#007AFF] text-[#1D1D1F]'
                      : 'bg-[#F5F5F7] text-[#86868B] hover:bg-[#E8E8ED]'
                  }`}
                >
                  {getPaymentTypeLabel(type)}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm text-[#86868B] mb-1">จำนวนเงิน *</label>
            <div className="relative">
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="pl-10"
              />
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
            </div>
            <p className="text-xs text-[#86868B] mt-1">
              ยอดค้างชำระ: {formatCurrency(remaining)}
            </p>
          </div>

          {/* Slip Upload */}
          <ImageUpload
            bucket="slips"
            folder={`orders/${order.id}`}
            label="สลิปการโอนเงิน *"
            value={slipUrl || undefined}
            onChange={setSlipUrl}
            aspectRatio="auto"
            maxSizeMB={5}
          />

          {/* Note */}
          <div>
            <label className="block text-sm text-[#86868B] mb-1">หมายเหตุ</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="หมายเหตุ (ถ้ามี)"
              className="w-full px-3 py-2 bg-[#F5F5F7] border border-[#E8E8ED] rounded-lg text-[#1D1D1F] resize-none focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}
            >
              ยกเลิก
            </Button>
            <Button
              className="flex-1"
              onClick={handleAddPayment}
              disabled={loading || !slipUrl || !amount}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-1" />
                  {isCustomerView ? 'แจ้งชำระเงิน' : 'บันทึก'}
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Slip Modal */}
      <Modal
        isOpen={showSlipModal}
        onClose={() => {
          setShowSlipModal(false);
          setSelectedPayment(null);
        }}
        title="หลักฐานการชำระเงิน"
      >
        {selectedPayment && (
          <div className="p-4">
            {/* Slip Image */}
            <div className="rounded-lg overflow-hidden bg-[#F5F5F7] mb-4">
              <img
                src={selectedPayment.slip_image_url!}
                alt="Slip"
                className="w-full h-auto"
              />
            </div>

            {/* Details */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#86868B]">จำนวนเงิน</span>
                <span className="text-[#1D1D1F] font-medium">{formatCurrency(selectedPayment.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#86868B]">ประเภท</span>
                <span className="text-[#1D1D1F]">{getPaymentTypeLabel(selectedPayment.payment_type)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#86868B]">วันที่</span>
                <span className="text-[#1D1D1F]">
                  {new Date(selectedPayment.payment_date).toLocaleDateString('th-TH', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#86868B]">สถานะ</span>
                {getStatusBadge(selectedPayment.status)}
              </div>
            </div>

            {/* Admin Actions */}
            {!isCustomerView && !readOnly && selectedPayment.status === 'pending' && (
              <div className="flex gap-2 mt-4 pt-4 border-t border-[#E8E8ED]">
                <Button
                  variant="secondary"
                  className="flex-1 border-red-300 text-red-500 hover:bg-red-50"
                  onClick={() => handleReject(selectedPayment.id)}
                  disabled={loading}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  ไม่ผ่าน
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => handleConfirm(selectedPayment.id)}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      ยืนยัน
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
