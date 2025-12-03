'use client';

import { useState, useEffect, useMemo } from 'react';
import { Save } from 'lucide-react';
import { Modal, ModalFooter } from '@/modules/shared/ui/Modal';
import { Button } from '@/modules/shared/ui/Button';
import { Input, Label } from '@/modules/shared/ui/Input';
import { Product, ProductFormData } from '../types';
import { useProductMutations } from '../hooks/useProductMutations';
import { createClient } from '@/modules/shared/services/supabase-client';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  onSuccess: () => void;
}

const initialFormData: ProductFormData = {
  main_sku: '',
  sku: '',
  model: '',
  color: '',
  size: '',
  cost: 0,
  price: 0,
  quantity: 0,
  min_level: 10,
};

function QuickPick({ 
  items, 
  selected, 
  onSelect,
  label 
}: { 
  items: string[]; 
  selected: string; 
  onSelect: (value: string) => void;
  label: string;
}) {
  if (items.length === 0) return null;
  
  return (
    <div className="mt-2">
      <p className="text-[11px] text-[#86868B] mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.slice(0, 8).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onSelect(item)}
            className={`px-2.5 py-1 text-[12px] rounded-lg border transition-all ${
              selected === item
                ? 'bg-[#007AFF] text-[#1D1D1F] border-[#007AFF]'
                : 'bg-[#F5F5F7] text-[#1D1D1F] border-[#E8E8ED] hover:border-[#007AFF]/50'
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ProductModal({
  isOpen,
  onClose,
  product,
  onSuccess,
}: ProductModalProps) {
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { createProduct, updateProduct, loading } = useProductMutations();

  const [existingMainSkus, setExistingMainSkus] = useState<string[]>([]);
  const [existingModels, setExistingModels] = useState<string[]>([]);
  const [existingColors, setExistingColors] = useState<string[]>([]);
  const [existingSizes, setExistingSizes] = useState<string[]>([]);

  const isEditing = !!product;

  useEffect(() => {
    async function fetchExistingValues() {
      const supabase = createClient();
      
      const { data } = await supabase
        .from('products')
        .select('main_sku, model, color, size');

      if (data) {
        const mainSkus = [...new Set(data.map(p => p.main_sku).filter(Boolean))];
        const models = [...new Set(data.map(p => p.model).filter(Boolean))];
        const colors = [...new Set(data.map(p => p.color).filter(Boolean))];
        const sizes = [...new Set(data.map(p => p.size).filter(Boolean))];
        
        setExistingMainSkus(mainSkus);
        setExistingModels(models);
        setExistingColors(colors);
        setExistingSizes(sizes);
      }
    }

    if (isOpen) {
      fetchExistingValues();
    }
  }, [isOpen]);

  const sortedSizes = useMemo(() => {
    const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
    return [...existingSizes].sort((a, b) => {
      const aIndex = sizeOrder.indexOf(a);
      const bIndex = sizeOrder.indexOf(b);
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  }, [existingSizes]);

  useEffect(() => {
    if (product) {
      setFormData({
        main_sku: product.main_sku,
        sku: product.sku,
        model: product.model,
        color: product.color,
        size: product.size,
        cost: product.cost,
        price: product.price,
        quantity: product.quantity,
        min_level: product.min_level,
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [product, isOpen]);

  useEffect(() => {
    if (!isEditing && formData.main_sku && formData.color && formData.size) {
      const colorCode = formData.color.substring(0, 1).toUpperCase();
      const sizeCode = formData.size;
      setFormData(prev => ({
        ...prev,
        sku: `${formData.main_sku}-${colorCode}-${sizeCode}`
      }));
    }
  }, [formData.main_sku, formData.color, formData.size, isEditing]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleQuickPick = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.main_sku.trim()) {
      newErrors.main_sku = 'กรุณากรอก SKU หลัก';
    }
    if (!formData.sku.trim()) {
      newErrors.sku = 'กรุณากรอก SKU รอง';
    }
    if (!formData.model.trim()) {
      newErrors.model = 'กรุณากรอกรุ่นเสื้อ';
    }
    if (!formData.color.trim()) {
      newErrors.color = 'กรุณากรอกสี';
    }
    if (!formData.size.trim()) {
      newErrors.size = 'กรุณากรอกไซส์';
    }
    if (formData.cost < 0) {
      newErrors.cost = 'ต้นทุนต้องไม่ติดลบ';
    }
    if (formData.price < 0) {
      newErrors.price = 'ราคาขายต้องไม่ติดลบ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    let success = false;
    
    if (isEditing && product) {
      const result = await updateProduct(product.id, formData);
      success = !!result;
    } else {
      const result = await createProduct(formData);
      success = result.success;
      if (!success && 'isDuplicate' in result && result.isDuplicate) {
        setErrors({ sku: 'SKU นี้มีอยู่ในระบบแล้ว' });
        return;
      }
    }

    if (success) {
      onSuccess();
      onClose();
    }
  };

  const margin = formData.price - formData.cost;
  const marginPercent = formData.cost > 0 ? ((margin / formData.cost) * 100).toFixed(1) : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}
      description={
        isEditing
          ? 'แก้ไขข้อมูลสินค้าในคลัง'
          : 'กรอกข้อมูลเพื่อเพิ่มสินค้าใหม่ในคลัง'
      }
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-5">
          {/* SKU Section */}
          <div className="p-4 bg-[#F5F5F7] rounded-xl space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[17px]">🏷️</span>
              <h3 className="font-semibold text-[#1D1D1F]">รหัสสินค้า (SKU)</h3>
            </div>
            
            <div>
              <Label htmlFor="main_sku" required>SKU หลัก</Label>
              <Input
                id="main_sku"
                name="main_sku"
                placeholder="เช่น HP001, GD001..."
                value={formData.main_sku}
                onChange={handleChange}
                error={errors.main_sku}
                disabled={isEditing}
                className="font-mono text-[17px]"
              />
              <QuickPick
                items={existingMainSkus}
                selected={formData.main_sku}
                onSelect={(v) => handleQuickPick('main_sku', v)}
                label="SKU หลักที่มีอยู่:"
              />
              <p className="text-[11px] text-[#86868B] mt-1">
                รหัสหลักสำหรับกลุ่มสินค้าเดียวกัน (ใช้ร่วมทุก variant)
              </p>
            </div>

            <div>
              <Label htmlFor="sku" required>SKU รอง</Label>
              <Input
                id="sku"
                name="sku"
                placeholder="จะสร้างอัตโนมัติ เช่น HP001-ข-M"
                value={formData.sku}
                onChange={handleChange}
                error={errors.sku}
                disabled={isEditing}
                className="font-mono"
              />
              <p className="text-[11px] text-[#86868B] mt-1">
                {isEditing ? 'ไม่สามารถแก้ไขได้' : 'สร้างอัตโนมัติจาก SKU หลัก + สี + ไซส์'}
              </p>
            </div>
          </div>

          {/* Model */}
          <div>
            <Label htmlFor="model" required>รุ่นเสื้อ</Label>
            <Input
              id="model"
              name="model"
              placeholder="พิมพ์ชื่อรุ่น เช่น Hiptrack, Gildan..."
              value={formData.model}
              onChange={handleChange}
              error={errors.model}
            />
            <QuickPick
              items={existingModels}
              selected={formData.model}
              onSelect={(v) => handleQuickPick('model', v)}
              label="เลือกจากที่เคยใช้:"
            />
          </div>

          {/* Color & Size Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="color" required>สี</Label>
              <Input
                id="color"
                name="color"
                placeholder="พิมพ์สี เช่น ขาว, ดำ..."
                value={formData.color}
                onChange={handleChange}
                error={errors.color}
              />
              <QuickPick
                items={existingColors}
                selected={formData.color}
                onSelect={(v) => handleQuickPick('color', v)}
                label="เลือกจากที่เคยใช้:"
              />
            </div>
            <div>
              <Label htmlFor="size" required>ไซส์</Label>
              <Input
                id="size"
                name="size"
                placeholder="พิมพ์ไซส์ เช่น S, M, L..."
                value={formData.size}
                onChange={handleChange}
                error={errors.size}
              />
              <QuickPick
                items={sortedSizes}
                selected={formData.size}
                onSelect={(v) => handleQuickPick('size', v)}
                label="เลือกจากที่เคยใช้:"
              />
            </div>
          </div>

          {/* Cost & Price Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cost" required>ต้นทุนต่อหน่วย (บาท)</Label>
              <Input
                id="cost"
                name="cost"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.cost}
                onChange={handleChange}
                error={errors.cost}
              />
            </div>
            <div>
              <Label htmlFor="price" required>ราคาขายต่อหน่วย (บาท)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.price}
                onChange={handleChange}
                error={errors.price}
              />
            </div>
          </div>

          {/* Margin Display */}
          {(formData.cost > 0 || formData.price > 0) && (
            <div className="p-4 bg-gradient-to-r from-[#34C759]/10 to-[#30D158]/10 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-[#1D1D1F]">กำไรต่อชิ้น:</span>
                <span className={`text-[17px] font-semibold ${margin >= 0 ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                  ฿{margin.toFixed(2)} ({marginPercent}%)
                </span>
              </div>
            </div>
          )}

          {/* Quantity & Min Level - Only for new products */}
          {!isEditing && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">จำนวนเริ่มต้น</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.quantity}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label htmlFor="min_level">จุดสั่งซื้อ (Reorder Point)</Label>
                <Input
                  id="min_level"
                  name="min_level"
                  type="number"
                  min="0"
                  placeholder="10"
                  value={formData.min_level}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}
        </div>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button type="submit" variant="primary" isLoading={loading}>
            <Save className="w-4 h-4 mr-2" />
            {isEditing ? 'บันทึกการแก้ไข' : 'เพิ่มสินค้า'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
