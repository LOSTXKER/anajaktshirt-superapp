'use client';

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Dropdown, Input, Modal, ModalFooter, useToast } from '@/modules/shared/ui';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  Search, 
  ArrowDownToLine, 
  ArrowUpFromLine,
  Plus,
  Minus,
  X,
  Check,
  ShoppingCart,
  Trash2,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { useProducts } from '@/modules/stock/hooks/useProducts';
import { useStockMutations } from '@/modules/stock/hooks/useStockMutations';
import { Product } from '@/modules/stock/types';

// Reason options for withdrawal
const WITHDRAWAL_REASONS = [
  { id: 'production', label: '🏭 ส่งผลิต', description: 'เบิกไปใช้ในการผลิต/สกรีน' },
  { id: 'sale', label: '💰 ขาย', description: 'เบิกเพื่อขายลูกค้า' },
  { id: 'sample', label: '🎁 ตัวอย่าง', description: 'เบิกเป็นตัวอย่างให้ลูกค้า' },
  { id: 'defect', label: '❌ สินค้าเสีย', description: 'สินค้าชำรุด/เสียหาย' },
  { id: 'return', label: '↩️ คืนซัพพลายเออร์', description: 'ส่งคืนผู้จัดจำหน่าย' },
  { id: 'other', label: '📝 อื่นๆ', description: 'ระบุเหตุผลเอง' },
];

// Cart item type
interface CartItem {
  product: Product;
  quantity: number;
}

type TransactionMode = 'IN' | 'OUT';

export default function StockPage() {
  const { products, loading, refresh } = useProducts();
  const { stockIn, stockOut, loading: mutating } = useStockMutations();
  const toast = useToast();
  
  // Search & filter
  const [search, setSearch] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [mode, setMode] = useState<TransactionMode | null>(null);
  
  // Modal states
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [orderRef, setOrderRef] = useState('');

  // Get unique values for filters
  const models = useMemo(() => [...new Set(products.map(p => p.model))], [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (search) {
        const s = search.toLowerCase();
        if (!p.sku.toLowerCase().includes(s) && 
            !p.model.toLowerCase().includes(s) && 
            !p.color.toLowerCase().includes(s)) {
          return false;
        }
      }
      if (modelFilter && p.model !== modelFilter) return false;
      return true;
    });
  }, [products, search, modelFilter]);

  // Group products by model and color for better display
  const groupedProducts = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    filteredProducts.forEach(p => {
      const key = `${p.model}-${p.color}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    
    // Sort sizes within each group
    const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => {
        const aIdx = sizeOrder.indexOf(a.size);
        const bIdx = sizeOrder.indexOf(b.size);
        if (aIdx === -1 && bIdx === -1) return a.size.localeCompare(b.size);
        if (aIdx === -1) return 1;
        if (bIdx === -1) return -1;
        return aIdx - bIdx;
      });
    });
    
    return groups;
  }, [filteredProducts]);

  // Cart operations
  const addToCart = (product: Product, qty: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        const newQty = existing.quantity + qty;
        if (mode === 'OUT' && newQty > product.quantity) {
          return prev.map(item => 
            item.product.id === product.id 
              ? { ...item, quantity: product.quantity }
              : item
          );
        }
        if (newQty <= 0) {
          return prev.filter(item => item.product.id !== product.id);
        }
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: newQty }
            : item
        );
      }
      return [...prev, { product, quantity: qty }];
    });
  };

  const updateCartQty = (productId: string, qty: number) => {
    setCart(prev => {
      if (qty <= 0) {
        return prev.filter(item => item.product.id !== productId);
      }
      return prev.map(item => {
        if (item.product.id === productId) {
          const maxQty = mode === 'OUT' ? item.product.quantity : 9999;
          return { ...item, quantity: Math.min(qty, maxQty) };
        }
        return item;
      });
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setMode(null);
    setSelectedReason('');
    setCustomReason('');
    setOrderRef('');
  };

  const getCartQty = (productId: string) => {
    return cart.find(item => item.product.id === productId)?.quantity || 0;
  };

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Start transaction mode
  const startMode = (m: TransactionMode) => {
    if (mode && mode !== m) {
      // Switching modes - clear cart
      clearCart();
    }
    setMode(m);
  };

  // Submit transaction
  const handleSubmit = async () => {
    if (cart.length === 0) return;
    
    const reason = selectedReason === 'other' ? customReason : 
      WITHDRAWAL_REASONS.find(r => r.id === selectedReason)?.label || '';

    let successCount = 0;
    let errorCount = 0;

    for (const item of cart) {
      let success = false;
      if (mode === 'IN') {
        success = await stockIn(item.product.id, item.quantity, orderRef || undefined, reason || undefined);
      } else {
        success = await stockOut(item.product.id, item.quantity, orderRef || undefined, reason);
      }
      if (success) successCount++;
      else errorCount++;
    }

    clearCart();
    setIsConfirmOpen(false);
    setIsCartOpen(false);
    refresh();

    // Show toast notification
    if (errorCount === 0) {
      toast.success(
        mode === 'IN' ? 'นำเข้าสต๊อกสำเร็จ' : 'เบิกสินค้าสำเร็จ',
        `ดำเนินการ ${successCount} รายการเรียบร้อยแล้ว`
      );
    } else if (successCount > 0) {
      toast.warning(
        'ดำเนินการบางส่วน',
        `สำเร็จ ${successCount} รายการ, ล้มเหลว ${errorCount} รายการ`
      );
    } else {
      toast.error(
        'เกิดข้อผิดพลาด',
        'ไม่สามารถดำเนินการได้ กรุณาลองใหม่อีกครั้ง'
      );
    }
  };

  // Can proceed to confirm?
  const canProceed = cart.length > 0 && (mode === 'IN' || (mode === 'OUT' && selectedReason));

  return (
    <div className="flex-1 min-h-screen bg-[#F5F5F7]">
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#007AFF]/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-[#007AFF]" />
              </div>
              <h1 className="text-[28px] font-semibold text-[#1D1D1F]">เบิก/นำเข้าสินค้า</h1>
            </div>
            <p className="text-[#86868B]">เลือกสินค้าที่ต้องการ แล้วกดเบิกหรือนำเข้าพร้อมกันได้</p>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <Button 
              variant={mode === 'IN' ? 'primary' : 'outline'} 
              className="gap-2"
              onClick={() => startMode('IN')}
            >
              <ArrowDownToLine className="w-4 h-4" />
              นำเข้าสต๊อก
            </Button>
            <Button 
              variant={mode === 'OUT' ? 'destructive' : 'outline'} 
              className="gap-2"
              onClick={() => startMode('OUT')}
            >
              <ArrowUpFromLine className="w-4 h-4" />
              เบิกสินค้า
            </Button>
          </div>
        </motion.div>

        {/* Mode indicator */}
        <AnimatePresence>
          {mode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className={`p-4 rounded-xl border-2 ${
                mode === 'IN' 
                  ? 'bg-[#34C759]/10 border-[#34C759]/30' 
                  : 'bg-[#FF9500]/10 border-[#FF9500]/30'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {mode === 'IN' ? (
                      <ArrowDownToLine className="w-5 h-5 text-[#34C759]" />
                    ) : (
                      <ArrowUpFromLine className="w-5 h-5 text-[#FF9500]" />
                    )}
                    <div>
                      <p className={`font-semibold ${mode === 'IN' ? 'text-[#34C759]' : 'text-[#FF9500]'}`}>
                        {mode === 'IN' ? '🟢 โหมดนำเข้าสต๊อก' : '🟠 โหมดเบิกสินค้า'}
                      </p>
                      <p className="text-[13px] text-[#86868B]">
                        {mode === 'IN' 
                          ? 'คลิกที่ปุ่ม + เพื่อเพิ่มจำนวนสินค้าที่ต้องการนำเข้า'
                          : 'คลิกที่ปุ่ม + เพื่อเพิ่มสินค้าที่ต้องการเบิก (ไม่เกินจำนวนในสต๊อก)'}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={clearCart}>
                    <X className="w-4 h-4 mr-1" />
                    ยกเลิก
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        <Card className="!p-4 !shadow-none border border-[#E8E8ED]">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B] z-10" />
              <input
                type="text"
                placeholder="ค้นหา SKU, รุ่น, สี..."
                className="w-full h-11 pl-11 pr-4 rounded-xl bg-[#F5F5F7] text-[15px] text-[#1D1D1F] border-0 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#007AFF]/30 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Dropdown
              options={[{ value: '', label: 'ทุกรุ่น' }, ...models.map(m => ({ value: m, label: m }))]}
              value={modelFilter}
              onChange={setModelFilter}
              placeholder="ทุกรุ่น"
              className="w-full sm:w-48"
            />
          </div>
        </Card>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>รายการสินค้า</CardTitle>
              <Badge variant="secondary">{filteredProducts.length} รายการ</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center min-h-[300px]">
                <div className="w-10 h-10 rounded-full border-4 border-[#E8E8ED] border-t-[#007AFF] animate-spin" />
              </div>
            ) : Object.keys(groupedProducts).length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[300px]">
                <Package className="w-12 h-12 text-[#D2D2D7] mb-3" />
                <p className="text-[#86868B]">ไม่พบสินค้า</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedProducts).map(([key, items]) => {
                  const first = items[0];
                  return (
                    <div key={key} className="border border-[#E8E8ED] rounded-xl overflow-hidden">
                      {/* Group header */}
                      <div className="bg-[#F5F5F7] px-4 py-3 flex items-center gap-3">
                        <div 
                          className="w-6 h-6 rounded-full border-2"
                          style={{ 
                            backgroundColor: first.color_hex || '#E8E8ED',
                            borderColor: '#fff'
                          }}
                        />
                        <div>
                          <span className="font-semibold text-[#1D1D1F]">{first.model}</span>
                          <span className="text-[#86868B] ml-2">{first.color}</span>
                        </div>
                        <code className="ml-auto text-[12px] text-[#86868B] font-mono">{first.main_sku}</code>
                      </div>
                      
                      {/* Sizes table */}
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-[#F5F5F7]">
                              <th className="px-4 py-2 text-left text-[12px] font-medium text-[#86868B]">ไซส์</th>
                              <th className="px-4 py-2 text-left text-[12px] font-medium text-[#86868B]">SKU</th>
                              <th className="px-4 py-2 text-right text-[12px] font-medium text-[#86868B]">ต้นทุน</th>
                              <th className="px-4 py-2 text-right text-[12px] font-medium text-[#86868B]">ราคาขาย</th>
                              <th className="px-4 py-2 text-right text-[12px] font-medium text-[#86868B]">ในสต๊อก</th>
                              {mode && (
                                <th className="px-4 py-2 text-center text-[12px] font-medium text-[#86868B] w-[180px]">
                                  {mode === 'IN' ? 'นำเข้า' : 'เบิก'}
                                </th>
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#F5F5F7]">
                            {items.map(product => {
                              const isLowStock = product.quantity <= product.min_level;
                              const cartQty = getCartQty(product.id);
                              const maxQty = mode === 'OUT' ? product.quantity : 9999;
                              
                              return (
                                <tr 
                                  key={product.id} 
                                  className={`transition-colors ${
                                    cartQty > 0 
                                      ? mode === 'IN' ? 'bg-[#34C759]/5' : 'bg-[#FF9500]/5'
                                      : 'hover:bg-[#F5F5F7]/50'
                                  }`}
                                >
                                  <td className="px-4 py-3">
                                    <span className="inline-flex items-center justify-center w-12 h-8 rounded-lg bg-[#F5F5F7] font-semibold text-[14px]">
                                      {product.size}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <code className="text-[12px] text-[#86868B] font-mono">{product.sku}</code>
                                  </td>
                                  <td className="px-4 py-3 text-right text-[13px] text-[#86868B]">
                                    ฿{product.cost.toLocaleString()}
                                  </td>
                                  <td className="px-4 py-3 text-right text-[13px] font-medium text-[#1D1D1F]">
                                    ฿{product.price.toLocaleString()}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <span className={`font-semibold text-[15px] ${
                                      isLowStock ? 'text-[#FF9500]' : 'text-[#1D1D1F]'
                                    }`}>
                                      {product.quantity}
                                    </span>
                                    {isLowStock && (
                                      <AlertTriangle className="w-4 h-4 text-[#FF9500] inline ml-1" />
                                    )}
                                  </td>
                                  {mode && (
                                    <td className="px-4 py-3">
                                      <div className="flex items-center justify-center gap-2">
                                        <button
                                          onClick={() => addToCart(product, -1)}
                                          disabled={cartQty <= 0}
                                          className="w-8 h-8 rounded-lg bg-[#F5F5F7] hover:bg-[#E8E8ED] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                                        >
                                          <Minus className="w-4 h-4 text-[#86868B]" />
                                        </button>
                                        <input
                                          type="number"
                                          min="0"
                                          max={maxQty}
                                          value={cartQty || ''}
                                          onChange={(e) => updateCartQty(product.id, parseInt(e.target.value) || 0)}
                                          className={`w-16 h-8 text-center rounded-lg border text-[14px] font-semibold focus:outline-none focus:ring-2 ${
                                            cartQty > 0
                                              ? mode === 'IN' 
                                                ? 'border-[#34C759] bg-[#34C759]/10 text-[#34C759] focus:ring-[#34C759]/30'
                                                : 'border-[#FF9500] bg-[#FF9500]/10 text-[#FF9500] focus:ring-[#FF9500]/30'
                                              : 'border-[#E8E8ED] text-[#86868B] focus:ring-[#007AFF]/30'
                                          }`}
                                          placeholder="0"
                                        />
                                        <button
                                          onClick={() => addToCart(product, 1)}
                                          disabled={mode === 'OUT' && cartQty >= product.quantity}
                                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                                            mode === 'IN'
                                              ? 'bg-[#34C759] hover:bg-[#2DB24C] text-white'
                                              : 'bg-[#FF9500] hover:bg-[#E68600] text-white'
                                          }`}
                                        >
                                          <Plus className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Floating Cart Button */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <button
              onClick={() => setIsCartOpen(true)}
              className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl transition-transform hover:scale-105 ${
                mode === 'IN'
                  ? 'bg-[#34C759] text-white shadow-[#34C759]/30'
                  : 'bg-[#FF9500] text-white shadow-[#FF9500]/30'
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              <div className="text-left">
                <p className="font-semibold">{cart.length} รายการ</p>
                <p className="text-[12px] opacity-90">{totalCartItems} ชิ้น</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Check className="w-4 h-4" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Modal */}
      <Modal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        title={mode === 'IN' ? '🟢 รายการนำเข้าสต๊อก' : '🟠 รายการเบิกสินค้า'}
        description={`${cart.length} รายการ รวม ${totalCartItems} ชิ้น`}
        size="lg"
      >
        <div className="space-y-4">
          {/* Cart items */}
          <div className="max-h-[300px] overflow-auto space-y-2">
            {cart.map(item => (
              <div 
                key={item.product.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-[#F5F5F7] border border-[#E8E8ED]"
              >
                <div 
                  className="w-8 h-8 rounded-lg border-2"
                  style={{ 
                    backgroundColor: item.product.color_hex || '#E8E8ED',
                    borderColor: '#fff'
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#1D1D1F] text-[14px]">
                    {item.product.model} {item.product.color}
                  </p>
                  <p className="text-[12px] text-[#86868B]">
                    ไซส์ {item.product.size} • {item.product.sku}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateCartQty(item.product.id, item.quantity - 1)}
                    className="w-7 h-7 rounded-lg bg-white hover:bg-[#E8E8ED] flex items-center justify-center"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className={`w-12 text-center font-semibold ${
                    mode === 'IN' ? 'text-[#34C759]' : 'text-[#FF9500]'
                  }`}>
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateCartQty(item.product.id, item.quantity + 1)}
                    disabled={mode === 'OUT' && item.quantity >= item.product.quantity}
                    className="w-7 h-7 rounded-lg bg-white hover:bg-[#E8E8ED] flex items-center justify-center disabled:opacity-30"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="w-8 h-8 rounded-lg hover:bg-[#FF3B30]/10 flex items-center justify-center text-[#86868B] hover:text-[#FF3B30] transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Order reference */}
          <div>
            <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              เลขที่อ้างอิง / Order (ถ้ามี)
            </label>
            <Input
              placeholder="เช่น ORD-2024-001, PO-123..."
              value={orderRef}
              onChange={(e) => setOrderRef(e.target.value)}
            />
          </div>

          {/* Reason selection (for OUT only) */}
          {mode === 'OUT' && (
            <div>
              <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">
                เหตุผลในการเบิก <span className="text-[#FF3B30]">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {WITHDRAWAL_REASONS.map(reason => (
                  <button
                    key={reason.id}
                    onClick={() => setSelectedReason(reason.id)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      selectedReason === reason.id
                        ? 'border-[#FF9500] bg-[#FF9500]/10'
                        : 'border-[#E8E8ED] hover:border-[#FF9500]/50'
                    }`}
                  >
                    <p className="font-medium text-[14px] text-[#1D1D1F]">{reason.label}</p>
                    <p className="text-[11px] text-[#86868B]">{reason.description}</p>
                  </button>
                ))}
              </div>
              
              {selectedReason === 'other' && (
                <div className="mt-3">
                  <Input
                    placeholder="ระบุเหตุผล..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          {/* Summary */}
          <div className={`p-4 rounded-xl ${
            mode === 'IN' ? 'bg-[#34C759]/10' : 'bg-[#FF9500]/10'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[#86868B]">จำนวนรายการ:</span>
              <span className="font-semibold text-[#1D1D1F]">{cart.length} รายการ</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[#86868B]">จำนวนชิ้นรวม:</span>
              <span className={`font-bold text-[20px] ${mode === 'IN' ? 'text-[#34C759]' : 'text-[#FF9500]'}`}>
                {mode === 'IN' ? '+' : '-'}{totalCartItems} ชิ้น
              </span>
            </div>
          </div>
        </div>

        <ModalFooter>
          <Button variant="outline" onClick={() => setIsCartOpen(false)}>
            กลับไปเลือกเพิ่ม
          </Button>
          <Button 
            variant={mode === 'IN' ? 'primary' : 'destructive'}
            onClick={() => {
              setIsCartOpen(false);
              setIsConfirmOpen(true);
            }}
            disabled={!canProceed}
          >
            {mode === 'IN' ? (
              <>
                <ArrowDownToLine className="w-4 h-4 mr-2" />
                ยืนยันนำเข้า
              </>
            ) : (
              <>
                <ArrowUpFromLine className="w-4 h-4 mr-2" />
                ยืนยันเบิก
              </>
            )}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Confirm Modal */}
      <Modal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        size="sm"
      >
        <div className="text-center">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
            mode === 'IN' ? 'bg-[#34C759]/10' : 'bg-[#FF9500]/10'
          }`}>
            {mode === 'IN' ? (
              <ArrowDownToLine className="w-8 h-8 text-[#34C759]" />
            ) : (
              <ArrowUpFromLine className="w-8 h-8 text-[#FF9500]" />
            )}
          </div>
          
          <h3 className="text-[20px] font-semibold text-[#1D1D1F] mb-2">
            {mode === 'IN' ? 'ยืนยันการนำเข้าสต๊อก?' : 'ยืนยันการเบิกสินค้า?'}
          </h3>
          
          <p className="text-[#86868B] mb-4">
            {mode === 'IN' 
              ? `จะเพิ่มสินค้า ${cart.length} รายการ รวม ${totalCartItems} ชิ้น`
              : `จะเบิกสินค้า ${cart.length} รายการ รวม ${totalCartItems} ชิ้น`
            }
          </p>

          {mode === 'OUT' && selectedReason && (
            <div className="p-3 bg-[#F5F5F7] rounded-xl mb-4 text-left">
              <p className="text-[12px] text-[#86868B]">เหตุผล:</p>
              <p className="font-medium text-[#1D1D1F]">
                {selectedReason === 'other' 
                  ? customReason 
                  : WITHDRAWAL_REASONS.find(r => r.id === selectedReason)?.label
                }
              </p>
            </div>
          )}

          {orderRef && (
            <div className="p-3 bg-[#F5F5F7] rounded-xl mb-4 text-left">
              <p className="text-[12px] text-[#86868B]">เลขอ้างอิง:</p>
              <p className="font-medium text-[#1D1D1F]">{orderRef}</p>
            </div>
          )}

          <div className="flex items-center justify-center gap-3 mt-6">
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>
              ยกเลิก
            </Button>
            <Button 
              variant={mode === 'IN' ? 'primary' : 'destructive'}
              onClick={handleSubmit}
              isLoading={mutating}
            >
              <Check className="w-4 h-4 mr-2" />
              ยืนยัน
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
