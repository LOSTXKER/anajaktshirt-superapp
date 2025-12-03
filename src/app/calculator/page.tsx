'use client';

import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Modal, ModalFooter, useToast, QuantityInput, NumberInput } from '@/modules/shared/ui';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calculator,
  Palette,
  Layers,
  Copy,
  Check,
  Plus,
  Minus,
  X,
  Shirt,
  Printer,
  Settings,
  ChevronDown,
  ChevronUp,
  Package,
  Search,
  Info,
} from 'lucide-react';
import { useDTGSettings } from '@/modules/calculator/hooks/useDTGSettings';
import { useProducts } from '@/modules/stock/hooks/useProducts';
import { calculateScreenPrice, generateSummaryText } from '@/modules/calculator/services/calculatorService';
import {
  ScreenInputs,
  CalculationResult,
  CartItem,
  ShirtColor,
  PrintSides,
  SideChoice,
  PrintSize,
  PRINT_SIZES,
} from '@/modules/calculator/types';

type CalculatorMode = 'screen-only' | 'shirt-screen';

const defaultScreenInputs: ScreenInputs = {
  quantity: 0,
  inkCC: 0,
  color: 'dark',
  sides: '1',
  sideChoice: 'front',
  sizeFront: 'A4',
  sizeBack: 'A4',
  hasNeckLogo: false,
  sleevePrintCount: 0,
};

export default function CalculatorPage() {
  const { settings, loading: settingsLoading } = useDTGSettings();
  const { products } = useProducts();
  const toast = useToast();

  // Mode
  const [mode, setMode] = useState<CalculatorMode>('screen-only');

  // Screen-only inputs
  const [screenInputs, setScreenInputs] = useState<ScreenInputs>(defaultScreenInputs);

  // Shirt+Screen mode
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  
  // Step-by-step product selection
  const [selectionStep, setSelectionStep] = useState<1 | 2 | 3>(1);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  // Results
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  // Calculate results
  const result = useMemo<CalculationResult | null>(() => {
    if (settingsLoading) return null;

    const quantity = mode === 'screen-only'
      ? screenInputs.quantity
      : cartItems.reduce((sum, item) => sum + item.quantity, 0);

    if (quantity <= 0 || screenInputs.inkCC <= 0) return null;

    return calculateScreenPrice({ ...screenInputs, quantity }, settings);
  }, [screenInputs, settings, settingsLoading, mode, cartItems]);

  // Summary calculations for shirt+screen mode
  const shirtScreenSummary = useMemo(() => {
    if (mode !== 'shirt-screen' || cartItems.length === 0 || !result) return null;

    const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalShirtPrice = cartItems.reduce((sum, item) => sum + (item.product.sell_price * item.quantity), 0);
    const totalScreenPrice = result.screenPricePerItem * totalQuantity;
    const grandTotal = totalShirtPrice + totalScreenPrice;
    const avgPrice = grandTotal / totalQuantity;

    return { totalQuantity, totalShirtPrice, totalScreenPrice, grandTotal, avgPrice };
  }, [mode, cartItems, result]);

  // Sort products by SKU first
  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => (a.main_sku || '').localeCompare(b.main_sku || ''));
  }, [products]);

  // Get unique models (sorted by first SKU of each model)
  const uniqueModels = useMemo(() => {
    const modelMap = new Map<string, string>(); // model -> first SKU
    sortedProducts.forEach(p => {
      if (p.model && !modelMap.has(p.model)) {
        modelMap.set(p.model, p.main_sku || '');
      }
    });
    let models = [...modelMap.entries()].sort((a, b) => a[1].localeCompare(b[1])).map(([model]) => model);
    if (productSearch) {
      models = models.filter(m => m.toLowerCase().includes(productSearch.toLowerCase()));
    }
    return models;
  }, [sortedProducts, productSearch]);

  // Get unique colors for selected model (sorted by SKU)
  const uniqueColors = useMemo(() => {
    if (!selectedModel) return [];
    const colorMap = new Map<string, string>(); // color -> first SKU
    sortedProducts
      .filter(p => p.model === selectedModel)
      .forEach(p => {
        if (p.color && !colorMap.has(p.color)) {
          colorMap.set(p.color, p.main_sku || '');
        }
      });
    return [...colorMap.entries()].sort((a, b) => a[1].localeCompare(b[1])).map(([color]) => color);
  }, [sortedProducts, selectedModel]);

  // Size order for proper sorting
  const SIZE_ORDER: Record<string, number> = {
    'XS': 1, 'S': 2, 'M': 3, 'L': 4, 'XL': 5, 
    '2XL': 6, 'XXL': 6, '3XL': 7, 'XXXL': 7, 
    '4XL': 8, '5XL': 9, '6XL': 10,
    // Numeric sizes
    '32': 32, '34': 34, '36': 36, '38': 38, '40': 40, '42': 42, '44': 44, '46': 46, '48': 48,
  };

  // Get sizes for selected model and color (sorted by size order)
  const availableSizes = useMemo(() => {
    if (!selectedModel || !selectedColor) return [];
    return sortedProducts
      .filter(p => p.model === selectedModel && p.color === selectedColor)
      .sort((a, b) => {
        const orderA = SIZE_ORDER[a.size?.toUpperCase()] || 99;
        const orderB = SIZE_ORDER[b.size?.toUpperCase()] || 99;
        if (orderA !== orderB) return orderA - orderB;
        // If same order, sort by SKU
        return (a.main_sku || '').localeCompare(b.main_sku || '');
      });
  }, [sortedProducts, selectedModel, selectedColor]);

  // Handlers
  const updateInput = <K extends keyof ScreenInputs>(key: K, value: ScreenInputs[K]) => {
    setScreenInputs(prev => ({ ...prev, [key]: value }));
  };

  const addToCart = (product: any) => {
    const existingIndex = cartItems.findIndex(item => item.product.id === product.id);
    if (existingIndex >= 0) {
      setCartItems(prev => prev.map((item, i) =>
        i === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCartItems(prev => [...prev, {
        id: `item-${Date.now()}`,
        product: {
          id: product.id,
          name: `${product.model} ${product.color}`,
          main_sku: product.main_sku,
          model: product.model,
          color: product.color,
          size: product.size,
          sell_price: product.price || 0,  // Use 'price' field
          cost_price: product.cost || 0,   // Use 'cost' field
        },
        quantity: 1,
      }]);
    }
    // Reset selection and close modal
    resetProductSelection();
    setIsProductModalOpen(false);
    toast.success('เพิ่มสินค้าแล้ว');
  };

  const resetProductSelection = () => {
    setSelectionStep(1);
    setSelectedModel(null);
    setSelectedColor(null);
    setProductSearch('');
  };

  const openProductModal = () => {
    resetProductSelection();
    setIsProductModalOpen(true);
  };

  const updateCartQuantity = (itemId: string, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  const copyToClipboard = () => {
    if (!result) return;

    let text = '';
    if (mode === 'screen-only') {
      text = generateSummaryText('screen-only', screenInputs, result);
    } else {
      const items = cartItems.map(item => ({
        name: item.product.name,
        size: item.product.size || '-',
        color: item.product.color || '-',
        quantity: item.quantity,
        sellPrice: item.product.sell_price,
      }));
      text = generateSummaryText('shirt-screen', screenInputs, result, items);
    }

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success('คัดลอกแล้ว!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const totalQuantity = mode === 'screen-only'
    ? screenInputs.quantity
    : cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#5AC8FA] flex items-center justify-center">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-[28px] font-semibold text-[#1D1D1F]">คำนวณราคา DTG</h1>
          </div>
          <p className="text-[#86868B]">คำนวณราคาค่าสกรีนและสรุปยอดสำหรับส่งลูกค้า</p>
        </div>
      </div>

      {/* Mode Selector */}
      <Card className="!p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setMode('screen-only')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
              mode === 'screen-only'
                ? 'bg-[#007AFF] text-white shadow-lg shadow-[#007AFF]/20'
                : 'bg-transparent text-[#86868B] hover:bg-[#F5F5F7]'
            }`}
          >
            <Printer className="w-5 h-5" />
            คำนวณเฉพาะค่าสกรีน
          </button>
          <button
            onClick={() => setMode('shirt-screen')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
              mode === 'shirt-screen'
                ? 'bg-[#007AFF] text-white shadow-lg shadow-[#007AFF]/20'
                : 'bg-transparent text-[#86868B] hover:bg-[#F5F5F7]'
            }`}
          >
            <Shirt className="w-5 h-5" />
            เสื้อพร้อมสกรีน
          </button>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Inputs */}
        <div className="space-y-6">
          {/* Shirt+Screen: Product Selection */}
          {mode === 'shirt-screen' && (
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-[#007AFF]" />
                      รายการเสื้อ
                    </CardTitle>
                    <CardDescription>เลือกสินค้าที่ต้องการคำนวณ</CardDescription>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={openProductModal}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    เพิ่มสินค้า
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {cartItems.length === 0 ? (
                  <div className="text-center py-8 text-[#86868B]">
                    <Shirt className="w-12 h-12 mx-auto mb-3 text-[#D2D2D7]" />
                    <p>ยังไม่มีสินค้า</p>
                    <p className="text-sm mt-1">คลิก "เพิ่มสินค้า" เพื่อเริ่มต้น</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cartItems.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 bg-[#F5F5F7] rounded-xl"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[#1D1D1F] truncate">{item.product.name}</p>
                          <p className="text-sm text-[#86868B]">
                            {item.product.size} - {item.product.color} • ฿{item.product.sell_price}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateCartQuantity(item.id, -1)}
                            className="w-8 h-8 rounded-lg bg-white border border-[#E8E8ED] flex items-center justify-center hover:bg-[#F5F5F7]"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-10 text-center font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.id, 1)}
                            className="w-8 h-8 rounded-lg bg-white border border-[#E8E8ED] flex items-center justify-center hover:bg-[#F5F5F7]"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="w-8 h-8 rounded-lg text-red-500 hover:bg-red-50 flex items-center justify-center"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="pt-3 border-t border-[#E8E8ED] flex justify-between items-center">
                      <span className="text-[#86868B]">รวมทั้งหมด</span>
                      <span className="font-bold text-[#1D1D1F]">{totalQuantity} ตัว</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Screen-only: Quantity */}
          {mode === 'screen-only' && (
            <Card>
              <CardContent className="p-4">
                <label className="block text-sm font-medium text-[#86868B] mb-2">จำนวน (ตัว)</label>
                <QuantityInput
                  value={screenInputs.quantity}
                  onChange={(val) => updateInput('quantity', val)}
                  className="h-14 bg-[#F5F5F7] border-0 text-2xl font-bold"
                  min={0}
                  placeholder="ระบุจำนวน"
                />
                {/* Quick fill buttons */}
                <div className="flex gap-2 mt-3">
                  {[1, 30, 50, 100].map((qty) => (
                    <button
                      key={qty}
                      onClick={() => updateInput('quantity', qty)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                        screenInputs.quantity === qty
                          ? 'bg-[#007AFF] text-white'
                          : 'bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E8E8ED]'
                      }`}
                    >
                      {qty}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Print Settings */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-[#AF52DE]" />
                รายละเอียดงานสกรีน
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Shirt Color */}
              <div>
                <label className="block text-sm font-medium text-[#86868B] mb-2">สีเสื้อ</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => updateInput('color', 'dark')}
                    className={`p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                      screenInputs.color === 'dark'
                        ? 'border-[#1D1D1F] bg-[#1D1D1F] text-white'
                        : 'border-[#E8E8ED] hover:border-[#D2D2D7]'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-[#1D1D1F] border-2 border-white shadow-inner" />
                    <span className="font-medium">สีเข้ม/ดำ</span>
                  </button>
                  <button
                    onClick={() => updateInput('color', 'white')}
                    className={`p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                      screenInputs.color === 'white'
                        ? 'border-[#007AFF] bg-[#007AFF]/10'
                        : 'border-[#E8E8ED] hover:border-[#D2D2D7]'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-white border-2 border-[#E8E8ED]" />
                    <span className="font-medium">สีขาว</span>
                  </button>
                </div>
              </div>

              {/* Ink CC */}
              <div>
                <label className="block text-sm font-medium text-[#86868B] mb-2">CC หมึกที่ใช้ (รวม)</label>
                <QuantityInput
                  value={screenInputs.inkCC}
                  onChange={(val) => updateInput('inkCC', val)}
                  className="h-12 bg-[#F5F5F7] border-0 text-lg font-medium"
                  min={0}
                  placeholder="ระบุค่า CC"
                />
              </div>

              {/* Print Sides */}
              <div>
                <label className="block text-sm font-medium text-[#86868B] mb-2">จำนวนด้านที่สกรีน</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => updateInput('sides', '1')}
                    className={`p-3 rounded-xl border-2 transition-all font-medium ${
                      screenInputs.sides === '1'
                        ? 'border-[#007AFF] bg-[#007AFF]/10 text-[#007AFF]'
                        : 'border-[#E8E8ED] hover:border-[#D2D2D7]'
                    }`}
                  >
                    1 ด้าน
                  </button>
                  <button
                    onClick={() => updateInput('sides', '2')}
                    className={`p-3 rounded-xl border-2 transition-all font-medium ${
                      screenInputs.sides === '2'
                        ? 'border-[#007AFF] bg-[#007AFF]/10 text-[#007AFF]'
                        : 'border-[#E8E8ED] hover:border-[#D2D2D7]'
                    }`}
                  >
                    2 ด้าน (หน้า-หลัง)
                  </button>
                </div>
              </div>

              {/* Side Choice (only for 1 side) */}
              {screenInputs.sides === '1' && (
                <div>
                  <label className="block text-sm font-medium text-[#86868B] mb-2">เลือกด้าน</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => updateInput('sideChoice', 'front')}
                      className={`p-3 rounded-xl border-2 transition-all font-medium ${
                        screenInputs.sideChoice === 'front'
                          ? 'border-[#007AFF] bg-[#007AFF]/10 text-[#007AFF]'
                          : 'border-[#E8E8ED] hover:border-[#D2D2D7]'
                      }`}
                    >
                      ด้านหน้า
                    </button>
                    <button
                      onClick={() => updateInput('sideChoice', 'back')}
                      className={`p-3 rounded-xl border-2 transition-all font-medium ${
                        screenInputs.sideChoice === 'back'
                          ? 'border-[#007AFF] bg-[#007AFF]/10 text-[#007AFF]'
                          : 'border-[#E8E8ED] hover:border-[#D2D2D7]'
                      }`}
                    >
                      ด้านหลัง
                    </button>
                  </div>
                </div>
              )}

              {/* Print Sizes */}
              <div className="grid grid-cols-2 gap-4">
                {(screenInputs.sides === '2' || screenInputs.sideChoice === 'front') && (
                  <div>
                    <label className="block text-sm font-medium text-[#86868B] mb-2">
                      ขนาด{screenInputs.sides === '2' ? 'ด้านหน้า' : ''}
                    </label>
                    <select
                      value={screenInputs.sizeFront}
                      onChange={(e) => updateInput('sizeFront', e.target.value as PrintSize)}
                      className="w-full h-12 px-4 rounded-xl bg-[#F5F5F7] border-0 font-medium focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                    >
                      {PRINT_SIZES.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                )}
                {(screenInputs.sides === '2' || screenInputs.sideChoice === 'back') && (
                  <div>
                    <label className="block text-sm font-medium text-[#86868B] mb-2">
                      ขนาด{screenInputs.sides === '2' ? 'ด้านหลัง' : ''}
                    </label>
                    <select
                      value={screenInputs.sizeBack}
                      onChange={(e) => updateInput('sizeBack', e.target.value as PrintSize)}
                      className="w-full h-12 px-4 rounded-xl bg-[#F5F5F7] border-0 font-medium focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                    >
                      {PRINT_SIZES.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Add-ons */}
              <div className="pt-4 border-t border-[#E8E8ED]">
                <label className="block text-sm font-medium text-[#86868B] mb-3">ส่วนเสริม</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-[#F5F5F7] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={screenInputs.hasNeckLogo}
                      onChange={(e) => updateInput('hasNeckLogo', e.target.checked)}
                      className="w-5 h-5 rounded border-[#D2D2D7] text-[#007AFF] focus:ring-[#007AFF]/30"
                    />
                    <span className="font-medium">สกรีน Logo ที่คอ</span>
                    <span className="ml-auto text-sm text-[#86868B]">+{settings.NECK_LOGO_COST} บ.</span>
                  </label>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F5F5F7]">
                    <span className="font-medium flex-1">สกรีนแขน</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateInput('sleevePrintCount', Math.max(0, screenInputs.sleevePrintCount - 1))}
                        className="w-8 h-8 rounded-lg bg-white border border-[#E8E8ED] flex items-center justify-center"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-semibold">{screenInputs.sleevePrintCount}</span>
                      <button
                        onClick={() => updateInput('sleevePrintCount', screenInputs.sleevePrintCount + 1)}
                        className="w-8 h-8 rounded-lg bg-white border border-[#E8E8ED] flex items-center justify-center"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-sm text-[#86868B]">×{settings.SLEEVE_PRINT_COST} บ.</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Results */}
        <div className="space-y-6">
          <Card className={result ? 'border-2 border-[#007AFF]/20 bg-gradient-to-br from-[#007AFF]/5 to-white' : ''}>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-[#007AFF]" />
                สรุปราคา
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!result || totalQuantity <= 0 ? (
                <div className="text-center py-12 text-[#86868B]">
                  <Calculator className="w-16 h-16 mx-auto mb-4 text-[#D2D2D7]" />
                  <p className="font-medium">กรอกข้อมูลเพื่อคำนวณ</p>
                  <p className="text-sm mt-1">ระบุจำนวนและ CC หมึก</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Screen-only result */}
                  {mode === 'screen-only' && (
                    <>
                      <div className="text-center">
                        <p className="text-sm text-[#86868B] mb-1">ราคาค่าสกรีนต่อตัว</p>
                        <p className="text-4xl font-bold text-[#007AFF]">
                          ฿{result.screenPricePerItem.toFixed(2)}
                        </p>
                        {result.discountRate > 0 && (
                          <Badge variant="success" className="mt-2">
                            {result.discountText}
                          </Badge>
                        )}
                      </div>
                      <div className="p-4 rounded-xl bg-[#F5F5F7]">
                        <div className="flex justify-between items-center">
                          <span className="text-[#86868B]">ยอดรวมค่าสกรีน ({totalQuantity} ตัว)</span>
                          <span className="text-2xl font-bold text-[#1D1D1F]">
                            ฿{(result.screenPricePerItem * totalQuantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Shirt+Screen result */}
                  {mode === 'shirt-screen' && shirtScreenSummary && (
                    <>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 rounded-xl bg-[#F5F5F7]">
                          <span className="text-[#86868B]">ราคารวมเสื้อ</span>
                          <span className="font-semibold">฿{shirtScreenSummary.totalShirtPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-xl bg-[#F5F5F7]">
                          <div>
                            <span className="text-[#86868B]">ค่าสกรีน ({totalQuantity} ตัว)</span>
                            <p className="text-xs text-[#86868B]">฿{result.screenPricePerItem.toFixed(2)}/ตัว</p>
                          </div>
                          <span className="font-semibold">฿{shirtScreenSummary.totalScreenPrice.toFixed(2)}</span>
                        </div>
                        {result.discountRate > 0 && (
                          <div className="flex justify-center">
                            <Badge variant="success">{result.discountText}</Badge>
                          </div>
                        )}
                      </div>
                      <div className="p-4 rounded-xl bg-gradient-to-r from-[#007AFF] to-[#5AC8FA] text-white">
                        <div className="flex justify-between items-center mb-2">
                          <span className="opacity-90">ยอดรวมทั้งหมด</span>
                          <span className="text-3xl font-bold">
                            ฿{shirtScreenSummary.grandTotal.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm opacity-75">
                          <span>เฉลี่ยตัวละ</span>
                          <span>฿{shirtScreenSummary.avgPrice.toFixed(2)}</span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Copy Button */}
                  <Button
                    variant="primary"
                    className="w-full gap-2"
                    onClick={copyToClipboard}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        คัดลอกแล้ว!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        คัดลอกสรุปราคา
                      </>
                    )}
                  </Button>

                  {/* Calculation Details */}
                  <div className="border-t border-[#E8E8ED] pt-4">
                    <button
                      onClick={() => setShowDetails(!showDetails)}
                      className="flex items-center gap-2 text-sm text-[#86868B] hover:text-[#1D1D1F] transition-colors"
                    >
                      <Info className="w-4 h-4" />
                      รายละเอียดการคำนวณ
                      {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <AnimatePresence>
                      {showDetails && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 p-3 bg-[#F5F5F7] rounded-xl space-y-1 text-xs text-[#86868B]">
                            {result.details.map((detail, i) => (
                              <p key={i} dangerouslySetInnerHTML={{ __html: `• ${detail}` }} />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card className="bg-gradient-to-br from-[#F5F5F7] to-white">
            <CardContent className="p-4">
              <h3 className="font-semibold text-[#1D1D1F] mb-3 flex items-center gap-2">
                <Info className="w-4 h-4 text-[#007AFF]" />
                ส่วนลดตามจำนวน
              </h3>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div className="p-2 rounded-lg bg-white">
                  <p className="text-[#86868B]">30+ ตัว</p>
                  <p className="font-bold text-[#34C759]">-{settings.DISCOUNT_TIER_30}%</p>
                </div>
                <div className="p-2 rounded-lg bg-white">
                  <p className="text-[#86868B]">50+ ตัว</p>
                  <p className="font-bold text-[#34C759]">-{settings.DISCOUNT_TIER_50}%</p>
                </div>
                <div className="p-2 rounded-lg bg-white">
                  <p className="text-[#86868B]">100+ ตัว</p>
                  <p className="font-bold text-[#34C759]">-{settings.DISCOUNT_TIER_100}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Product Selection Modal - Step by Step */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => { setIsProductModalOpen(false); resetProductSelection(); }}
        title={
          selectionStep === 1 ? '1. เลือกรุ่นเสื้อ' :
          selectionStep === 2 ? '2. เลือกสี' :
          '3. เลือกไซส์'
        }
        size="lg"
      >
        <div className="space-y-4">
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 pb-4 border-b border-[#E8E8ED]">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${selectionStep >= 1 ? 'bg-[#007AFF] text-white' : 'bg-[#E8E8ED] text-[#86868B]'}`}>1</div>
            <div className={`w-12 h-1 rounded ${selectionStep >= 2 ? 'bg-[#007AFF]' : 'bg-[#E8E8ED]'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${selectionStep >= 2 ? 'bg-[#007AFF] text-white' : 'bg-[#E8E8ED] text-[#86868B]'}`}>2</div>
            <div className={`w-12 h-1 rounded ${selectionStep >= 3 ? 'bg-[#007AFF]' : 'bg-[#E8E8ED]'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${selectionStep >= 3 ? 'bg-[#007AFF] text-white' : 'bg-[#E8E8ED] text-[#86868B]'}`}>3</div>
          </div>

          {/* Step 1: Select Model */}
          {selectionStep === 1 && (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
                <input
                  type="text"
                  placeholder="ค้นหารุ่นเสื้อ..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#F5F5F7] border-0 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                />
              </div>
              <div className="max-h-[350px] overflow-y-auto space-y-2">
                {uniqueModels.length === 0 ? (
                  <div className="text-center py-8 text-[#86868B]">
                    <Package className="w-12 h-12 mx-auto mb-3 text-[#D2D2D7]" />
                    <p>ไม่พบรุ่นเสื้อ</p>
                  </div>
                ) : (
                  uniqueModels.map(model => (
                    <button
                      key={model}
                      onClick={() => { setSelectedModel(model); setSelectionStep(2); setProductSearch(''); }}
                      className="w-full flex items-center gap-3 p-4 rounded-xl border border-[#E8E8ED] hover:bg-[#007AFF]/5 hover:border-[#007AFF]/30 text-left transition-all"
                    >
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#007AFF]/10 to-[#5AC8FA]/10 flex items-center justify-center">
                        <Shirt className="w-6 h-6 text-[#007AFF]" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-[#1D1D1F] text-lg">{model}</p>
                        <p className="text-sm text-[#86868B]">
                          {products.filter(p => p.model === model).length} รายการ
                        </p>
                      </div>
                      <ChevronDown className="w-5 h-5 text-[#86868B] -rotate-90" />
                    </button>
                  ))
                )}
              </div>
            </>
          )}

          {/* Step 2: Select Color */}
          {selectionStep === 2 && (
            <>
              <div className="p-3 bg-[#F5F5F7] rounded-xl">
                <p className="text-sm text-[#86868B]">รุ่นที่เลือก</p>
                <p className="font-semibold text-[#1D1D1F]">{selectedModel}</p>
              </div>
              <div className="max-h-[300px] overflow-y-auto grid grid-cols-2 gap-2">
                {uniqueColors.map(color => (
                  <button
                    key={color}
                    onClick={() => { setSelectedColor(color); setSelectionStep(3); }}
                    className="flex items-center gap-3 p-4 rounded-xl border border-[#E8E8ED] hover:bg-[#007AFF]/5 hover:border-[#007AFF]/30 text-left transition-all"
                  >
                    <div className="w-8 h-8 rounded-full border-2 border-[#E8E8ED]" style={{ backgroundColor: color === 'ขาว' ? '#fff' : color === 'ดำ' ? '#1D1D1F' : color === 'กรม' ? '#1e3a5f' : color === 'เทา' ? '#9ca3af' : '#f5f5f7' }} />
                    <span className="font-medium text-[#1D1D1F]">{color}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => { setSelectionStep(1); setSelectedModel(null); }}
                className="text-sm text-[#007AFF] hover:underline"
              >
                ← กลับไปเลือกรุ่น
              </button>
            </>
          )}

          {/* Step 3: Select Size */}
          {selectionStep === 3 && (
            <>
              <div className="p-3 bg-[#F5F5F7] rounded-xl">
                <p className="text-sm text-[#86868B]">ที่เลือก</p>
                <p className="font-semibold text-[#1D1D1F]">{selectedModel} - {selectedColor}</p>
              </div>
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {availableSizes.length === 0 ? (
                  <div className="text-center py-8 text-[#86868B]">
                    <p>ไม่พบไซส์ที่มีในสต๊อก</p>
                  </div>
                ) : (
                  availableSizes.map(product => (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="w-full flex items-center gap-3 p-4 rounded-xl border border-[#E8E8ED] hover:bg-[#34C759]/5 hover:border-[#34C759]/30 text-left transition-all"
                    >
                      <div className="w-12 h-12 rounded-lg bg-[#F5F5F7] flex items-center justify-center font-bold text-lg text-[#1D1D1F]">
                        {product.size}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-[#1D1D1F]">ไซส์ {product.size}</p>
                        <p className="text-sm text-[#86868B]">{product.main_sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#34C759] text-lg">฿{product.price || 0}</p>
                        <p className="text-xs text-[#86868B]">คงเหลือ {product.quantity || 0}</p>
                      </div>
                      <Plus className="w-5 h-5 text-[#34C759]" />
                    </button>
                  ))
                )}
              </div>
              <button
                onClick={() => { setSelectionStep(2); setSelectedColor(null); }}
                className="text-sm text-[#007AFF] hover:underline"
              >
                ← กลับไปเลือกสี
              </button>
            </>
          )}
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => { setIsProductModalOpen(false); resetProductSelection(); }}>ปิด</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

