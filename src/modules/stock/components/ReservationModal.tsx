'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/modules/shared/ui/Modal';
import { Button } from '@/modules/shared/ui/Button';
import { Input } from '@/modules/shared/ui/Input';
import { Select } from '@/modules/shared/ui/Select';
import { useAvailableStock } from '../hooks/useReservations';
import { useReservationMutations } from '../hooks/useReservationMutations';
import { useToast } from '@/modules/shared/ui/Toast';
import { Package, AlertTriangle, Search } from 'lucide-react';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobNumber: string;
  onSuccess?: () => void;
}

export function ReservationModal({
  isOpen,
  onClose,
  jobId,
  jobNumber,
  onSuccess,
}: ReservationModalProps) {
  const { summary, loading: loadingStock, refetch } = useAvailableStock();
  const { createReservation, loading: mutating } = useReservationMutations();
  const { success: toastSuccess, error: toastError } = useToast();

  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [search, setSearch] = useState('');

  // Filter products by search
  const filteredProducts = summary.filter(p => 
    p.product_name.toLowerCase().includes(search.toLowerCase()) ||
    p.main_sku.toLowerCase().includes(search.toLowerCase())
  );

  // Get selected product details
  const selectedProductData = summary.find(p => p.product_id === selectedProduct);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProduct || !quantity) {
      toastError('กรุณากรอกข้อมูลให้ครบ');
      return;
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      toastError('จำนวนต้องมากกว่า 0');
      return;
    }

    if (selectedProductData && qty > selectedProductData.available_quantity) {
      toastError(`สต๊อกไม่เพียงพอ (มี ${selectedProductData.available_quantity} ชิ้น)`);
      return;
    }

    try {
      await createReservation({
        job_id: jobId,
        product_id: selectedProduct,
        quantity: qty,
      });

      toastSuccess('จองสต๊อกสำเร็จ');
      setSelectedProduct('');
      setQuantity('');
      refetch();
      onSuccess?.();
    } catch (err: any) {
      toastError('จองสต๊อกไม่สำเร็จ', err.message);
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedProduct('');
      setQuantity('');
      setSearch('');
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`จองสต๊อกสำหรับ ${jobNumber}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
          <input
            type="text"
            placeholder="ค้นหาสินค้า..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#F5F5F7] border-0 text-[14px] placeholder:text-[#86868B] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
          />
        </div>

        {/* Product Selection */}
        <div>
          <label className="block text-[14px] font-medium text-[#1D1D1F] mb-2">
            เลือกสินค้า
          </label>
          {loadingStock ? (
            <div className="h-[200px] flex items-center justify-center">
              <div className="w-6 h-6 rounded-full border-2 border-[#E8E8ED] border-t-[#007AFF] animate-spin" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="h-[200px] flex flex-col items-center justify-center text-[#86868B]">
              <Package className="w-10 h-10 mb-2" />
              <p>ไม่พบสินค้า</p>
            </div>
          ) : (
            <div className="max-h-[250px] overflow-y-auto space-y-2 border border-[#E8E8ED] rounded-xl p-2">
              {filteredProducts.map((product) => {
                const isLow = product.available_quantity <= 0;
                const isSelected = selectedProduct === product.product_id;

                return (
                  <button
                    key={product.product_id}
                    type="button"
                    onClick={() => !isLow && setSelectedProduct(product.product_id)}
                    disabled={isLow}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                      isSelected 
                        ? 'bg-[#007AFF]/10 border border-[#007AFF]' 
                        : isLow 
                          ? 'bg-gray-50 opacity-50 cursor-not-allowed' 
                          : 'hover:bg-[#F5F5F7] border border-transparent'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isLow ? 'bg-red-100' : 'bg-[#007AFF]/10'
                    }`}>
                      <Package className={`w-5 h-5 ${isLow ? 'text-red-500' : 'text-[#007AFF]'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#1D1D1F] text-[14px] truncate">
                        {product.product_name}
                      </p>
                      <p className="text-[12px] text-[#86868B]">
                        {product.main_sku}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        isLow ? 'text-red-500' : 'text-[#1D1D1F]'
                      }`}>
                        {product.available_quantity}
                      </p>
                      <p className="text-[11px] text-[#86868B]">
                        พร้อมใช้
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Product Info */}
        {selectedProductData && (
          <div className="p-4 rounded-xl bg-[#007AFF]/5 border border-[#007AFF]/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[14px] text-[#86868B]">สต๊อกทั้งหมด</span>
              <span className="font-semibold">{selectedProductData.current_stock}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[14px] text-[#86868B]">จองแล้ว</span>
              <span className="font-semibold text-orange-500">{selectedProductData.reserved_quantity}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#007AFF]/20">
              <span className="text-[14px] font-medium text-[#007AFF]">พร้อมจอง</span>
              <span className="font-bold text-[#007AFF]">{selectedProductData.available_quantity}</span>
            </div>
          </div>
        )}

        {/* Quantity Input */}
        <div>
          <label className="block text-[14px] font-medium text-[#1D1D1F] mb-2">
            จำนวนที่ต้องการจอง
          </label>
          <Input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="กรอกจำนวน"
            min={1}
            max={selectedProductData?.available_quantity || 0}
          />
          {selectedProductData && quantity && parseInt(quantity) > selectedProductData.available_quantity && (
            <div className="flex items-center gap-2 mt-2 text-red-500 text-[13px]">
              <AlertTriangle className="w-4 h-4" />
              <span>จำนวนเกินสต๊อกที่มี ({selectedProductData.available_quantity})</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            ยกเลิก
          </Button>
          <Button 
            type="submit" 
            variant="primary" 
            className="flex-1"
            disabled={!selectedProduct || !quantity || mutating}
          >
            {mutating ? 'กำลังจอง...' : 'ยืนยันจอง'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

