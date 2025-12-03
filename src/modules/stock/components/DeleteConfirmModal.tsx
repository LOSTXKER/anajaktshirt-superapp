'use client';

import { AlertTriangle, Trash2 } from 'lucide-react';
import { Modal, ModalFooter } from '@/modules/shared/ui/Modal';
import { Button } from '@/modules/shared/ui/Button';
import { Product } from '../types';
import { useProductMutations } from '../hooks/useProductMutations';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSuccess: () => void;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  product,
  onSuccess,
}: DeleteConfirmModalProps) {
  const { deleteProduct, loading } = useProductMutations();

  const handleDelete = async () => {
    if (!product) return;

    const success = await deleteProduct(product.id);
    if (success) {
      onSuccess();
      onClose();
    }
  };

  if (!product) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="text-center">
        {/* Warning Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-[#FF3B30]/10 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-[#FF3B30]" />
        </div>

        {/* Title */}
        <h3 className="text-[20px] font-semibold text-[#1D1D1F] mb-2">ยืนยันการลบ?</h3>

        {/* Description */}
        <p className="text-[#86868B] mb-2">
          คุณต้องการลบสินค้านี้ใช่ไหม?
        </p>

        {/* Product Info */}
        <div className="p-4 bg-[#F5F5F7] rounded-xl mb-6 text-left">
          <p className="font-semibold text-[#1D1D1F]">
            {product.model} {product.color} {product.size}
          </p>
          <p className="text-[13px] text-[#86868B]">SKU: {product.sku}</p>
          <p className="text-[13px] text-[#86868B]">
            สต๊อกคงเหลือ: {product.quantity} ตัว
          </p>
        </div>

        {/* Warning */}
        <p className="text-[13px] text-[#FF3B30] mb-6">
          ⚠️ การลบจะทำให้ข้อมูลหายไปถาวร ไม่สามารถกู้คืนได้
        </p>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={onClose} className="min-w-[100px]">
            ยกเลิก
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            isLoading={loading}
            className="min-w-[100px]"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            ลบสินค้า
          </Button>
        </div>
      </div>
    </Modal>
  );
}
