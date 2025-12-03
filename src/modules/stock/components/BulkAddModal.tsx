'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Save, Package, Check, ChevronRight, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal, ModalFooter } from '@/modules/shared/ui/Modal';
import { Button } from '@/modules/shared/ui/Button';
import { Input, Label } from '@/modules/shared/ui/Input';
import { Badge } from '@/modules/shared/ui/Badge';
import { ProductFormData } from '../types';
import { useProductMutations } from '../hooks/useProductMutations';
import { createClient } from '@/modules/shared/services/supabase-client';

interface BulkAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Mode = 'select' | 'new' | 'existing';
type Step = 'mode' | 'info' | 'sizes' | 'confirm';

const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
const DEFAULT_COLOR_HEX = '#86868B';

// Helper function to check if color is light
const isLightColor = (hex: string) => {
  if (!hex || hex.length < 7) return true;
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155;
};

interface ExistingProduct {
  main_sku: string;
  model: string;
  color: string;
  color_hex: string;
  cost: number;
  price: number;
  existingSizes: string[];
}

interface ExistingColor {
  name: string;
  hex: string;
}

export function BulkAddModal({ isOpen, onClose, onSuccess }: BulkAddModalProps) {
  const [mode, setMode] = useState<Mode>('select');
  const [step, setStep] = useState<Step>('mode');
  
  // Form data
  const [mainSku, setMainSku] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [colorHex, setColorHex] = useState(DEFAULT_COLOR_HEX);
  const [cost, setCost] = useState(0);
  const [price, setPrice] = useState(0);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [customSize, setCustomSize] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Existing products data
  const [existingProducts, setExistingProducts] = useState<ExistingProduct[]>([]);
  const [selectedExisting, setSelectedExisting] = useState<ExistingProduct | null>(null);
  const [searchExisting, setSearchExisting] = useState('');
  
  // Import progress
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  
  const { createProduct } = useProductMutations();

  // Existing unique values for new product creation
  const [existingMainSkus, setExistingMainSkus] = useState<string[]>([]);
  const [existingModels, setExistingModels] = useState<string[]>([]);
  const [existingColors, setExistingColors] = useState<ExistingColor[]>([]);
  const [existingSizes, setExistingSizes] = useState<string[]>([]);

  // Fetch existing data
  useEffect(() => {
    async function fetchExistingData() {
      const supabase = createClient();
      const { data } = await supabase
        .from('products')
        .select('main_sku, model, color, color_hex, size, cost, price');

      if (data) {
        // Get unique values
        setExistingMainSkus([...new Set(data.map(p => p.main_sku).filter(Boolean))]);
        setExistingModels([...new Set(data.map(p => p.model).filter(Boolean))]);
        
        // Get unique colors with hex
        const colorMap: Record<string, string> = {};
        data.forEach(p => {
          if (p.color && !colorMap[p.color]) {
            colorMap[p.color] = p.color_hex || DEFAULT_COLOR_HEX;
          }
        });
        setExistingColors(Object.entries(colorMap).map(([name, hex]) => ({ name, hex })));
        
        setExistingSizes([...new Set(data.map(p => p.size).filter(Boolean))]);
        
        // Group by main_sku + color for existing product selection
        const grouped: Record<string, ExistingProduct> = {};
        data.forEach(p => {
          if (!p.main_sku || !p.color) return;
          const key = `${p.main_sku}-${p.color}`;
          if (!grouped[key]) {
            grouped[key] = {
              main_sku: p.main_sku,
              model: p.model || '',
              color: p.color,
              color_hex: p.color_hex || DEFAULT_COLOR_HEX,
              cost: p.cost || 0,
              price: p.price || 0,
              existingSizes: [],
            };
          }
          if (p.size && !grouped[key].existingSizes.includes(p.size)) {
            grouped[key].existingSizes.push(p.size);
          }
        });
        setExistingProducts(Object.values(grouped));
      }
    }

    if (isOpen) {
      fetchExistingData();
      // Reset form
      setMode('select');
      setStep('mode');
      setMainSku('');
      setModel('');
      setColor('');
      setColorHex(DEFAULT_COLOR_HEX);
      setCost(0);
      setPrice(0);
      setSelectedSizes([]);
      setSelectedExisting(null);
      setSearchExisting('');
      setErrors({});
    }
  }, [isOpen]);

  // Filter existing products
  const filteredExisting = useMemo(() => {
    if (!searchExisting) return existingProducts;
    const search = searchExisting.toLowerCase();
    return existingProducts.filter(p => 
      p.main_sku.toLowerCase().includes(search) ||
      p.model.toLowerCase().includes(search) ||
      p.color.toLowerCase().includes(search)
    );
  }, [existingProducts, searchExisting]);

  // All available sizes
  const allSizes = useMemo(() => {
    const combined = [...DEFAULT_SIZES];
    existingSizes.forEach(s => {
      if (!combined.includes(s)) combined.push(s);
    });
    return combined;
  }, [existingSizes]);

  // Get sizes that already exist (for existing product mode)
  const alreadyExistingSizes = useMemo(() => {
    if (mode === 'existing' && selectedExisting) {
      return selectedExisting.existingSizes;
    }
    return [];
  }, [mode, selectedExisting]);

  // Toggle size selection
  const toggleSize = (size: string) => {
    if (alreadyExistingSizes.includes(size)) return; // Can't select existing sizes
    setSelectedSizes(prev => 
      prev.includes(size) 
        ? prev.filter(s => s !== size)
        : [...prev, size]
    );
  };

  // Add custom size
  const addCustomSize = () => {
    if (customSize.trim() && !selectedSizes.includes(customSize.trim())) {
      setSelectedSizes(prev => [...prev, customSize.trim()]);
      setCustomSize('');
    }
  };

  // Select all available sizes
  const selectAllSizes = () => {
    const available = allSizes.filter(s => !alreadyExistingSizes.includes(s));
    setSelectedSizes(available);
  };

  // Clear all sizes
  const clearAllSizes = () => {
    setSelectedSizes([]);
  };

  // Handle existing product selection
  const handleSelectExisting = (product: ExistingProduct) => {
    setSelectedExisting(product);
    setMainSku(product.main_sku);
    setModel(product.model);
    setColor(product.color);
    setColorHex(product.color_hex);
    setCost(product.cost);
    setPrice(product.price);
    setStep('sizes');
  };

  // Validate step
  const validateInfo = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!mainSku.trim()) newErrors.mainSku = 'กรุณากรอก SKU หลัก';
    if (!model.trim()) newErrors.model = 'กรุณากรอกรุ่นเสื้อ';
    if (!color.trim()) newErrors.color = 'กรุณากรอกสี';
    if (cost < 0) newErrors.cost = 'ต้นทุนต้องไม่ติดลบ';
    if (price < 0) newErrors.price = 'ราคาต้องไม่ติดลบ';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigation
  const handleModeSelect = (selectedMode: 'new' | 'existing') => {
    setMode(selectedMode);
    if (selectedMode === 'new') {
      setStep('info');
    } else {
      setStep('mode'); // Stay on mode to show existing products list
    }
  };

  const nextStep = () => {
    if (step === 'info' && validateInfo()) {
      setStep('sizes');
    } else if (step === 'sizes' && selectedSizes.length > 0) {
      setStep('confirm');
    }
  };

  const prevStep = () => {
    if (step === 'info') {
      setMode('select');
      setStep('mode');
    } else if (step === 'sizes') {
      if (mode === 'existing') {
        setSelectedExisting(null);
        setStep('mode');
      } else {
        setStep('info');
      }
    } else if (step === 'confirm') {
      setStep('sizes');
    }
  };

  // Generate products to be created
  const productsToCreate = useMemo(() => {
    return selectedSizes.map(size => {
      const colorCode = color.substring(0, 1).toUpperCase();
      return {
        main_sku: mainSku,
        sku: `${mainSku}-${colorCode}-${size}`,
        model,
        color,
        color_hex: colorHex,
        size,
        cost,
        price,
        quantity: 0,
        min_level: 10,
      } as ProductFormData;
    });
  }, [mainSku, model, color, colorHex, cost, price, selectedSizes]);

  // Submit
  const handleSubmit = async () => {
    setIsImporting(true);
    setImportProgress({ current: 0, total: productsToCreate.length });

    let successCount = 0;
    let skippedCount = 0;
    
    for (let i = 0; i < productsToCreate.length; i++) {
      const product = productsToCreate[i];
      setImportProgress({ current: i + 1, total: productsToCreate.length });

      const result = await createProduct(product);
      if (result.success) {
        successCount++;
      } else if (result.isDuplicate) {
        skippedCount++;
      }
    }

    setIsImporting(false);

    if (successCount === productsToCreate.length) {
      onSuccess();
      onClose();
    } else if (successCount > 0 || skippedCount > 0) {
      onSuccess();
      setErrors({ submit: `เพิ่มสำเร็จ ${successCount} รายการ${skippedCount > 0 ? `, ข้าม ${skippedCount} รายการ (SKU ซ้ำ)` : ''}` });
    } else {
      setErrors({ submit: `ไม่สามารถเพิ่มสินค้าได้` });
    }
  };

  // Calculate margin
  const margin = price - cost;
  const marginPercent = cost > 0 ? ((margin / cost) * 100).toFixed(1) : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'existing' ? 'เพิ่มไซส์ให้สินค้าเดิม' : 'เพิ่มสินค้าใหม่'}
      description={mode === 'existing' ? 'เลือกสินค้าที่มีอยู่แล้วเพิ่มไซส์ใหม่' : 'เพิ่มสินค้าใหม่พร้อมหลายไซส์'}
      size="lg"
    >
      <AnimatePresence mode="wait">
        {/* Step: Select Mode */}
        {step === 'mode' && mode === 'select' && (
          <motion.div
            key="mode-select"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <p className="text-[13px] text-[#86868B] text-center mb-6">เลือกวิธีการเพิ่มสินค้า</p>
            
            <button
              onClick={() => handleModeSelect('existing')}
              className="w-full p-5 rounded-xl border-2 border-[#E8E8ED] hover:border-[#007AFF] hover:bg-[#007AFF]/5 transition-all text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#007AFF]/10 flex items-center justify-center group-hover:bg-[#007AFF]/20 transition-colors">
                  <Plus className="w-6 h-6 text-[#007AFF]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[#1D1D1F]">เพิ่มไซส์ให้สินค้าเดิม</h3>
                  <p className="text-[13px] text-[#86868B]">เลือกจากสินค้าที่มีอยู่แล้ว แล้วเพิ่มไซส์ใหม่</p>
                </div>
                <ChevronRight className="w-5 h-5 text-[#86868B] group-hover:text-[#007AFF]" />
              </div>
              {existingProducts.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {existingProducts.slice(0, 3).map(p => (
                    <Badge key={`${p.main_sku}-${p.color}`} variant="secondary" size="sm">
                      {p.model} {p.color}
                    </Badge>
                  ))}
                  {existingProducts.length > 3 && (
                    <Badge variant="secondary" size="sm">+{existingProducts.length - 3}</Badge>
                  )}
                </div>
              )}
            </button>

            <button
              onClick={() => handleModeSelect('new')}
              className="w-full p-5 rounded-xl border-2 border-[#E8E8ED] hover:border-[#34C759] hover:bg-[#34C759]/5 transition-all text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#34C759]/10 flex items-center justify-center group-hover:bg-[#34C759]/20 transition-colors">
                  <Package className="w-6 h-6 text-[#34C759]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[#1D1D1F]">สร้างสินค้าใหม่ทั้งหมด</h3>
                  <p className="text-[13px] text-[#86868B]">เพิ่มสินค้ารุ่นใหม่ สีใหม่ พร้อมทุกไซส์</p>
                </div>
                <ChevronRight className="w-5 h-5 text-[#86868B] group-hover:text-[#34C759]" />
              </div>
            </button>
          </motion.div>
        )}

        {/* Step: Select Existing Product */}
        {step === 'mode' && mode === 'existing' && (
          <motion.div
            key="existing-list"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
              <input
                type="text"
                placeholder="ค้นหาสินค้า..."
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-[#E8E8ED] bg-[#F5F5F7] text-[14px] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#007AFF]/30 focus:border-[#007AFF]"
                value={searchExisting}
                onChange={(e) => setSearchExisting(e.target.value)}
              />
            </div>

            {/* Product List */}
            <div className="max-h-[350px] overflow-y-auto space-y-2">
              {filteredExisting.length === 0 ? (
                <div className="text-center py-8 text-[#86868B]">
                  <Package className="w-12 h-12 mx-auto text-[#D2D2D7] mb-3" />
                  <p>ไม่พบสินค้า</p>
                </div>
              ) : (
                filteredExisting.map(product => (
                  <button
                    key={`${product.main_sku}-${product.color}`}
                    onClick={() => handleSelectExisting(product)}
                    className="w-full p-4 rounded-xl border border-[#E8E8ED] hover:border-[#007AFF] hover:bg-[#007AFF]/5 transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg border-2 flex items-center justify-center text-[13px] font-bold"
                        style={{ 
                          backgroundColor: product.color_hex,
                          borderColor: isLightColor(product.color_hex) ? '#E8E8ED' : 'transparent',
                          color: isLightColor(product.color_hex) ? '#1D1D1F' : '#ffffff'
                        }}
                      >
                        {product.existingSizes.length}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[#1D1D1F]">{product.model}</span>
                          <span className="text-[#86868B]">{product.color}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-[11px] font-mono text-[#007AFF]">{product.main_sku}</code>
                          <span className="text-[11px] text-[#86868B]">
                            มี {product.existingSizes.length} ไซส์
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[#86868B]" />
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {product.existingSizes.map(size => (
                        <span key={size} className="px-2 py-0.5 rounded bg-[#F5F5F7] text-[#86868B] text-[11px]">
                          {size}
                        </span>
                      ))}
                    </div>
                  </button>
                ))
              )}
            </div>

            <ModalFooter>
              <Button variant="outline" onClick={() => { setMode('select'); setStep('mode'); }}>
                ย้อนกลับ
              </Button>
            </ModalFooter>
          </motion.div>
        )}

        {/* Step: New Product Info */}
        {step === 'info' && (
          <motion.div
            key="info"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {/* Main SKU */}
            <div>
              <Label required>SKU หลัก</Label>
              <Input
                placeholder="เช่น HP001, GD001..."
                value={mainSku}
                onChange={(e) => setMainSku(e.target.value)}
                error={errors.mainSku}
                className="font-mono text-[17px]"
              />
              {existingMainSkus.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {existingMainSkus.slice(0, 6).map(sku => (
                    <button
                      key={sku}
                      type="button"
                      onClick={() => setMainSku(sku)}
                      className={`px-2.5 py-1 text-[12px] rounded-lg border transition-all ${
                        mainSku === sku
                          ? 'bg-[#007AFF] text-[#1D1D1F] border-[#007AFF]'
                          : 'bg-[#F5F5F7] text-[#86868B] border-[#E8E8ED] hover:border-[#007AFF]/50'
                      }`}
                    >
                      {sku}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Model */}
            <div>
              <Label required>รุ่นเสื้อ</Label>
              <Input
                placeholder="เช่น Hiptrack, Gildan..."
                value={model}
                onChange={(e) => setModel(e.target.value)}
                error={errors.model}
              />
              {existingModels.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {existingModels.slice(0, 6).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setModel(m)}
                      className={`px-2.5 py-1 text-[12px] rounded-lg border transition-all ${
                        model === m
                          ? 'bg-[#007AFF] text-[#1D1D1F] border-[#007AFF]'
                          : 'bg-[#F5F5F7] text-[#86868B] border-[#E8E8ED] hover:border-[#007AFF]/50'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Color */}
            <div>
              <Label required>สี</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  className="w-12 h-11 rounded-xl border border-[#E8E8ED] cursor-pointer"
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  title="เลือกสี RGB"
                />
                <Input
                  placeholder="ชื่อสี เช่น ดำ, ขาว, กรม..."
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  error={errors.color}
                  className="flex-1"
                />
              </div>
              {existingColors.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {existingColors.slice(0, 10).map(c => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => {
                        setColor(c.name);
                        setColorHex(c.hex);
                      }}
                      className={`px-2.5 py-1 text-[12px] rounded-lg border transition-all flex items-center gap-1.5 ${
                        color === c.name
                          ? 'bg-[#007AFF] text-[#1D1D1F] border-[#007AFF]'
                          : 'bg-[#F5F5F7] text-[#86868B] border-[#E8E8ED] hover:border-[#007AFF]/50'
                      }`}
                    >
                      <span 
                        className="w-3 h-3 rounded-full border"
                        style={{ 
                          backgroundColor: c.hex,
                          borderColor: isLightColor(c.hex) ? '#D2D2D7' : 'transparent'
                        }}
                      />
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cost & Price */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label required>ต้นทุน (บาท)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={cost || ''}
                  onChange={(e) => setCost(Number(e.target.value))}
                  error={errors.cost}
                />
              </div>
              <div>
                <Label required>ราคาขาย (บาท)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={price || ''}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  error={errors.price}
                />
              </div>
            </div>

            {/* Margin Preview */}
            {(cost > 0 || price > 0) && (
              <div className="p-3 bg-[#34C759]/10 rounded-xl border border-[#34C759]/20">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-[#86868B]">กำไรต่อชิ้น:</span>
                  <span className={`font-semibold ${margin >= 0 ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                    ฿{margin.toFixed(2)} ({marginPercent}%)
                  </span>
                </div>
              </div>
            )}

            <ModalFooter>
              <Button variant="outline" onClick={prevStep}>ย้อนกลับ</Button>
              <Button variant="primary" onClick={nextStep}>ถัดไป</Button>
            </ModalFooter>
          </motion.div>
        )}

        {/* Step: Select Sizes */}
        {step === 'sizes' && (
          <motion.div
            key="sizes"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {/* Product Summary */}
            <div className="p-4 bg-[#F5F5F7] rounded-xl flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded-lg border-2 flex items-center justify-center text-[17px] font-bold"
                style={{ 
                  backgroundColor: colorHex,
                  borderColor: isLightColor(colorHex) ? '#E8E8ED' : 'transparent',
                  color: isLightColor(colorHex) ? '#1D1D1F' : '#ffffff'
                }}
              >
                ?
              </div>
              <div>
                <p className="font-semibold text-[#1D1D1F]">{model}</p>
                <div className="flex items-center gap-2 text-[13px] text-[#86868B]">
                  <span 
                    className="w-3 h-3 rounded-full border"
                    style={{ 
                      backgroundColor: colorHex,
                      borderColor: isLightColor(colorHex) ? '#D2D2D7' : 'transparent'
                    }}
                  />
                  {color} • SKU: {mainSku}
                </div>
              </div>
            </div>

            {/* Size Selection */}
            <div>
              {/* Free-form Size Input */}
              <div className="mb-4">
                <Label>พิมพ์ไซส์ที่ต้องการเพิ่ม</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="พิมพ์ไซส์ เช่น S, M, L, XL, Free, 32, 34..."
                    value={customSize}
                    onChange={(e) => setCustomSize(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomSize();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={addCustomSize} disabled={!customSize.trim()}>
                    <Plus className="w-4 h-4 mr-1" />
                    เพิ่ม
                  </Button>
                </div>
                <p className="text-[11px] text-[#86868B] mt-1">กด Enter หรือปุ่มเพิ่ม เพื่อเพิ่มไซส์</p>
              </div>

              {/* Quick Pick Sizes */}
              <div className="flex items-center justify-between mb-3">
                <Label className="text-[#86868B]">หรือเลือกจากไซส์มาตรฐาน</Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAllSizes}
                    className="text-[12px] text-[#007AFF] hover:underline"
                  >
                    เลือกทั้งหมด
                  </button>
                  <span className="text-[#D2D2D7]">|</span>
                  <button
                    type="button"
                    onClick={clearAllSizes}
                    className="text-[12px] text-[#86868B] hover:underline"
                  >
                    ล้าง
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-5 gap-2">
                {allSizes.map(size => {
                  const isExisting = alreadyExistingSizes.includes(size);
                  const isSelected = selectedSizes.includes(size);
                  
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleSize(size)}
                      disabled={isExisting}
                      className={`p-2 rounded-xl border-2 text-center font-medium text-[13px] transition-all ${
                        isExisting
                          ? 'bg-[#F5F5F7] text-[#D2D2D7] border-[#E8E8ED] cursor-not-allowed'
                          : isSelected
                            ? 'bg-[#007AFF] text-[#1D1D1F] border-[#007AFF] shadow-md'
                            : 'bg-white text-[#86868B] border-[#E8E8ED] hover:border-[#007AFF]/50'
                      }`}
                    >
                      {size}
                      {isExisting && (
                        <span className="block text-[10px] font-normal mt-0.5">มีแล้ว</span>
                      )}
                      {isSelected && !isExisting && (
                        <Check className="w-4 h-4 mx-auto mt-1" />
                      )}
                    </button>
                  );
                })}
              </div>

            </div>

            {/* Selected Sizes Display */}
            {selectedSizes.length > 0 && (
              <div className="p-3 bg-[#007AFF]/10 rounded-xl border border-[#007AFF]/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-medium text-[#007AFF]">ไซส์ที่เลือก ({selectedSizes.length})</span>
                  <button
                    type="button"
                    onClick={clearAllSizes}
                    className="text-[12px] text-[#007AFF] hover:underline"
                  >
                    ล้างทั้งหมด
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSizes.map(size => (
                    <span 
                      key={size}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#007AFF] text-[#1D1D1F] rounded-lg text-[13px] font-medium"
                    >
                      {size}
                      <button
                        type="button"
                        onClick={() => toggleSize(size)}
                        className="hover:bg-white/20 rounded p-0.5"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedSizes.length === 0 && (
              <div className="text-center py-4 text-[#86868B] text-[13px]">
                ยังไม่ได้เลือกไซส์ กรุณาพิมพ์หรือเลือกไซส์ด้านบน
              </div>
            )}

            <ModalFooter>
              <Button variant="outline" onClick={prevStep}>ย้อนกลับ</Button>
              <Button variant="primary" onClick={nextStep} disabled={selectedSizes.length === 0}>
                ถัดไป
              </Button>
            </ModalFooter>
          </motion.div>
        )}

        {/* Step: Confirm */}
        {step === 'confirm' && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {isImporting ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-[#E8E8ED] border-t-[#007AFF] animate-spin" />
                <p className="font-medium text-[#1D1D1F]">กำลังเพิ่มสินค้า...</p>
                <p className="text-[13px] text-[#86868B] mt-1">
                  {importProgress.current} / {importProgress.total}
                </p>
                <div className="w-full h-2 bg-[#F5F5F7] rounded-full mt-4 overflow-hidden">
                  <motion.div
                    className="h-full bg-[#007AFF]"
                    initial={{ width: 0 }}
                    animate={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <>
                {/* Summary */}
                <div className="p-4 bg-[#34C759]/10 rounded-xl border border-[#34C759]/20">
                  <div className="flex items-center gap-3 mb-3">
                    <Package className="w-6 h-6 text-[#34C759]" />
                    <div>
                      <p className="font-semibold text-[#1D1D1F]">
                        พร้อมเพิ่ม {productsToCreate.length} รายการ
                      </p>
                      <p className="text-[13px] text-[#34C759]">
                        {model} {color} - {selectedSizes.length} ไซส์ใหม่
                      </p>
                    </div>
                  </div>
                </div>

                {/* Preview Table */}
                <div className="max-h-[250px] overflow-auto border border-[#E8E8ED] rounded-xl">
                  <table className="w-full text-[13px]">
                    <thead className="bg-[#F5F5F7] sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-[#86868B]">SKU รอง</th>
                        <th className="px-3 py-2 text-left font-medium text-[#86868B]">ไซส์</th>
                        <th className="px-3 py-2 text-right font-medium text-[#86868B]">ต้นทุน</th>
                        <th className="px-3 py-2 text-right font-medium text-[#86868B]">ราคาขาย</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productsToCreate.map((product, index) => (
                        <tr key={index} className="border-t border-[#F5F5F7]">
                          <td className="px-3 py-2">
                            <code className="text-[11px] font-mono text-[#007AFF]">{product.sku}</code>
                          </td>
                          <td className="px-3 py-2">
                            <Badge variant="secondary" size="sm">{product.size}</Badge>
                          </td>
                          <td className="px-3 py-2 text-right text-[#86868B]">฿{product.cost}</td>
                          <td className="px-3 py-2 text-right font-medium text-[#1D1D1F]">฿{product.price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {errors.submit && (
                  <div className="p-3 bg-[#FF3B30]/10 border border-[#FF3B30]/20 rounded-xl">
                    <p className="text-[13px] text-[#FF3B30]">{errors.submit}</p>
                  </div>
                )}

                <ModalFooter>
                  <Button variant="outline" onClick={prevStep}>ย้อนกลับ</Button>
                  <Button variant="primary" onClick={handleSubmit}>
                    <Save className="w-4 h-4 mr-2" />
                    เพิ่ม {productsToCreate.length} รายการ
                  </Button>
                </ModalFooter>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
