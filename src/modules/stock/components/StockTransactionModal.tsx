'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Settings2, 
  Package,
  Save
} from 'lucide-react';
import { Modal, ModalFooter } from '@/modules/shared/ui/Modal';
import { Button } from '@/modules/shared/ui/Button';
import { Input, Label, Textarea } from '@/modules/shared/ui/Input';
import { Product, TransactionFormData, WITHDRAWAL_REASON_CATEGORIES } from '../types';
import { useTransactions } from '../hooks/useTransactions';
import { cn } from '@/lib/utils';

interface StockTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSuccess: () => void;
  defaultType?: 'IN' | 'OUT' | 'ADJUST';
}

const transactionConfig = {
  IN: {
    label: 'รับเข้า (Stock In)',
    description: 'เพิ่มสินค้าเข้าคลัง',
    icon: ArrowDownToLine,
    color: 'text-[#34C759]',
    bgColor: 'bg-[#34C759]/10',
    buttonColor: 'bg-[#34C759] hover:bg-[#2DB24C]',
  },
  OUT: {
    label: 'เบิกออก (Stock Out)',
    description: 'เบิกสินค้าออกจากคลัง',
    icon: ArrowUpFromLine,
    color: 'text-[#FF9500]',
    bgColor: 'bg-[#FF9500]/10',
    buttonColor: 'bg-[#FF9500] hover:bg-[#E68600]',
  },
  ADJUST: {
    label: 'ปรับปรุง (Adjust)',
    description: 'ปรับยอดสต๊อก (+/-)',
    icon: Settings2,
    color: 'text-[#AF52DE]',
    bgColor: 'bg-[#AF52DE]/10',
    buttonColor: 'bg-[#AF52DE] hover:bg-[#9B47C5]',
  },
};

export function StockTransactionModal({
  isOpen,
  onClose,
  product,
  onSuccess,
  defaultType = 'IN',
}: StockTransactionModalProps) {
  const [transactionType, setTransactionType] = useState<'IN' | 'OUT' | 'ADJUST'>(defaultType);
  const [quantity, setQuantity] = useState<number>(1);
  const [reasonCategory, setReasonCategory] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [note, setNote] = useState('');
  const [refOrderId, setRefOrderId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { createTransaction, loading } = useTransactions();

  const selectedCategoryData = WITHDRAWAL_REASON_CATEGORIES.find(c => c.id === reasonCategory);
  const availableReasons = selectedCategoryData?.reasons || [];

  useEffect(() => {
    if (isOpen) {
      setTransactionType(defaultType);
      setQuantity(1);
      setReasonCategory('');
      setReason('');
      setNote('');
      setRefOrderId('');
      setError(null);
    }
  }, [isOpen, defaultType]);

  useEffect(() => {
    setReason('');
  }, [reasonCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!product) return;

    if (quantity <= 0) {
      setError('จำนวนต้องมากกว่า 0');
      return;
    }

    if (transactionType === 'OUT' && quantity > product.quantity) {
      setError(`สต๊อกไม่เพียงพอ (มีอยู่ ${product.quantity} ตัว)`);
      return;
    }

    if (transactionType === 'OUT' && !reason) {
      setError('กรุณาเลือกสาเหตุการเบิก');
      return;
    }

    const data: TransactionFormData = {
      product_id: product.id,
      type: transactionType,
      quantity: quantity,
      reason_category: reasonCategory || undefined,
      reason: reason || undefined,
      note: note || undefined,
      ref_order_id: refOrderId || undefined,
    };

    const result = await createTransaction(data);
    if (result) {
      onSuccess();
      onClose();
    }
  };

  if (!product) return null;

  const config = transactionConfig[transactionType];
  const TypeIcon = config.icon;

  const getNewQuantity = () => {
    switch (transactionType) {
      case 'IN':
        return product.quantity + quantity;
      case 'OUT':
        return product.quantity - quantity;
      case 'ADJUST':
        return product.quantity + quantity;
      default:
        return product.quantity;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="บันทึกรายการสต๊อก"
      description={`${product.model} ${product.color} ${product.size}`}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        {/* Product Info */}
        <div className="flex items-center gap-4 p-4 bg-[#F5F5F7] rounded-xl mb-6">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#E8E8ED] to-[#D2D2D7] flex items-center justify-center">
            <Package className="w-7 h-7 text-[#86868B]" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-[#1D1D1F]">{product.model} {product.color} {product.size}</h3>
            <p className="text-[13px] text-[#86868B]">
              <span className="font-mono bg-[#AF52DE]/10 text-[#AF52DE] px-1.5 py-0.5 rounded">{product.main_sku}</span>
              {' → '}
              <span className="font-mono">{product.sku}</span>
            </p>
            <p className="text-[13px] text-[#1D1D1F] mt-1">
              สต๊อกปัจจุบัน: <span className="font-semibold">{product.quantity} ตัว</span>
            </p>
          </div>
        </div>

        {/* Transaction Type Selector */}
        <div className="mb-6">
          <Label>ประเภทรายการ</Label>
          <div className="grid grid-cols-3 gap-3 mt-2">
            {(Object.keys(transactionConfig) as Array<'IN' | 'OUT' | 'ADJUST'>).map((type) => {
              const cfg = transactionConfig[type];
              const Icon = cfg.icon;
              const isSelected = transactionType === type;

              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTransactionType(type)}
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all duration-200 text-center',
                    isSelected
                      ? 'border-[#1D1D1F] bg-[#1D1D1F] text-[#1D1D1F]'
                      : 'border-[#E8E8ED] hover:border-[#D2D2D7] bg-white'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-5 h-5 mx-auto mb-2',
                      isSelected ? 'text-[#1D1D1F]' : cfg.color
                    )}
                  />
                  <span className="text-[12px] font-medium">
                    {type === 'IN' && 'รับเข้า'}
                    {type === 'OUT' && 'เบิกออก'}
                    {type === 'ADJUST' && 'ปรับปรุง'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quantity */}
        <div className="mb-4">
          <Label htmlFor="quantity" required>
            จำนวน (ตัว)
          </Label>
          <Input
            id="quantity"
            type="number"
            min={transactionType === 'ADJUST' ? undefined : 1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="text-[17px] font-semibold"
          />
          {transactionType === 'ADJUST' && (
            <p className="text-[11px] text-[#86868B] mt-1">
              ใส่ค่าติดลบเพื่อลดจำนวน (เช่น -5)
            </p>
          )}
        </div>

        {/* Reason Selection - Only show for OUT */}
        {transactionType === 'OUT' && (
          <div className="mb-4 p-4 bg-[#FF9500]/5 rounded-xl border border-[#FF9500]/20">
            <Label required className="text-[#FF9500]">สาเหตุการเบิก</Label>
            
            <div className="grid grid-cols-2 gap-2 mt-3">
              {WITHDRAWAL_REASON_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setReasonCategory(cat.id)}
                  className={cn(
                    'px-3 py-2.5 rounded-xl border text-[13px] font-medium text-left transition-all',
                    reasonCategory === cat.id
                      ? 'bg-[#1D1D1F] border-[#1D1D1F] text-[#1D1D1F]'
                      : 'bg-white border-[#E8E8ED] text-[#1D1D1F] hover:border-[#D2D2D7]'
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {reasonCategory && availableReasons.length > 0 && (
              <div className="mt-3">
                <p className="text-[11px] text-[#86868B] mb-2">เลือกสาเหตุ:</p>
                <div className="space-y-1.5">
                  {availableReasons.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setReason(r)}
                      className={cn(
                        'w-full px-3 py-2 rounded-xl border text-[13px] text-left transition-all',
                        reason === r
                          ? 'bg-[#007AFF] border-[#007AFF] text-[#1D1D1F]'
                          : 'bg-white border-[#E8E8ED] text-[#1D1D1F] hover:border-[#007AFF]/50'
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {reason && (
              <div className="mt-3 p-3 bg-white rounded-xl border border-[#E8E8ED]">
                <p className="text-[11px] text-[#86868B]">สาเหตุที่เลือก:</p>
                <p className="font-medium text-[#1D1D1F]">{selectedCategoryData?.label} → {reason}</p>
              </div>
            )}
          </div>
        )}

        {/* New Quantity Preview */}
        <div className="p-4 bg-[#F5F5F7] rounded-xl mb-4">
          <div className="flex items-center justify-between">
            <span className="text-[14px] text-[#86868B]">สต๊อกหลังบันทึก:</span>
            <span
              className={cn(
                'text-[19px] font-semibold',
                getNewQuantity() < product.min_level
                  ? 'text-[#FF9500]'
                  : 'text-[#34C759]'
              )}
            >
              {getNewQuantity()} ตัว
            </span>
          </div>
          {getNewQuantity() < product.min_level && (
            <p className="text-[12px] text-[#FF9500] mt-2">
              ⚠️ ต่ำกว่าจุดสั่งซื้อ ({product.min_level} ตัว)
            </p>
          )}
        </div>

        {/* Reference Order ID */}
        <div className="mb-4">
          <Label htmlFor="refOrderId">เลข Order อ้างอิง</Label>
          <Input
            id="refOrderId"
            placeholder="เช่น ORD-2024-001"
            value={refOrderId}
            onChange={(e) => setRefOrderId(e.target.value)}
          />
        </div>

        {/* Note */}
        <div className="mb-4">
          <Label htmlFor="note">หมายเหตุเพิ่มเติม</Label>
          <Textarea
            id="note"
            placeholder="รายละเอียดเพิ่มเติม..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-[60px]"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-[#FF3B30]/10 border border-[#FF3B30]/20 rounded-xl mb-4">
            <p className="text-[13px] text-[#FF3B30]">{error}</p>
          </div>
        )}

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button
            type="submit"
            isLoading={loading}
            className={cn(config.buttonColor, 'text-[#1D1D1F]')}
          >
            <Save className="w-4 h-4 mr-2" />
            บันทึกรายการ
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
