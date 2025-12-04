'use client';

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Modal, ModalFooter, useToast } from '@/modules/shared/ui';
import { useState, useMemo } from 'react';
import { 
  Package, 
  Search, 
  ArrowDownToLine, 
  ArrowUpFromLine,
  AlertTriangle,
  Shirt,
  Plus,
  Minus,
  Edit3,
  History,
  X,
} from 'lucide-react';
import { useProducts } from '@/modules/stock/hooks/useProducts';
import { useStockMutations } from '@/modules/stock/hooks/useStockMutations';
import { useTransactions } from '@/modules/stock/hooks/useTransactions';
import { Product, Transaction, WITHDRAWAL_REASON_CATEGORIES } from '@/modules/stock/types';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('th-TH', { 
    style: 'currency', 
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDateTime(dateString: string) {
  return new Intl.DateTimeFormat('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

export default function StockPage() {
  const { products, loading, refresh } = useProducts();
  const { stockIn, stockOut, stockAdjust, loading: mutating } = useStockMutations();
  const { transactions, refresh: refreshTransactions } = useTransactions();
  const toast = useToast();
  
  // Search & filter
  const [search, setSearch] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modal states
  const [stockInModal, setStockInModal] = useState(false);
  const [stockOutModal, setStockOutModal] = useState(false);
  const [adjustModal, setAdjustModal] = useState(false);
  const [historyModal, setHistoryModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Form states
  const [quantity, setQuantity] = useState(0);
  const [adjustQty, setAdjustQty] = useState(0);
  const [reason, setReason] = useState('');
  const [reasonCategory, setReasonCategory] = useState('');
  const [note, setNote] = useState('');
  const [orderRef, setOrderRef] = useState('');

  // Get unique values for filters
  const models = useMemo(() => {
    const uniqueModels = [...new Set(products.map(p => p.model).filter(Boolean))];
    return uniqueModels.sort();
  }, [products]);

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))];
    return uniqueCategories.sort();
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (search) {
        const s = search.toLowerCase();
        const matchCode = p.code.toLowerCase().includes(s);
        const matchName = p.name.toLowerCase().includes(s);
        const matchModel = p.model?.toLowerCase().includes(s);
        const matchBrand = p.brand?.toLowerCase().includes(s);
        if (!matchCode && !matchName && !matchModel && !matchBrand) {
          return false;
        }
      }
      if (modelFilter && p.model !== modelFilter) return false;
      if (categoryFilter && p.category !== categoryFilter) return false;
      return true;
    });
  }, [products, search, modelFilter, categoryFilter]);

  // Stats
  const stats = useMemo(() => {
    return {
      totalProducts: products.length,
      activeProducts: products.filter(p => p.is_active).length,
      inStock: products.filter(p => p.in_stock).length,
      lowStock: products.filter(p => p.stock_qty < p.min_qty).length,
      totalValue: products.reduce((sum, p) => sum + (p.stock_qty * p.cost_price), 0),
    };
  }, [products]);

  // Stock status badge
  const getStockBadge = (product: Product) => {
    if (!product.in_stock || product.stock_qty === 0) {
      return <Badge variant="destructive">หมด</Badge>;
    }
    if (product.stock_qty < product.min_qty) {
      return <Badge variant="warning">ใกล้หมด</Badge>;
    }
    return <Badge variant="success">พร้อม</Badge>;
  };

  // Open modals
  const openStockIn = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(0);
    setNote('');
    setOrderRef('');
    setStockInModal(true);
  };

  const openStockOut = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(0);
    setReason('');
    setReasonCategory('');
    setOrderRef('');
    setStockOutModal(true);
  };

  const openAdjust = (product: Product) => {
    setSelectedProduct(product);
    setAdjustQty(product.stock_qty);
    setReason('');
    setAdjustModal(true);
  };

  // Handle stock operations
  const handleStockIn = async () => {
    if (!selectedProduct || quantity <= 0) {
      toast.error('กรุณากรอกจำนวนที่ถูกต้อง');
      return;
    }

    const success = await stockIn(selectedProduct.id, quantity, orderRef || undefined, note || undefined);
    
    if (success) {
      toast.success(`รับเข้า ${selectedProduct.name} จำนวน ${quantity} สำเร็จ`);
      setStockInModal(false);
      refresh();
      refreshTransactions();
    } else {
      toast.error('ไม่สามารถรับเข้าสต็อกได้');
    }
  };

  const handleStockOut = async () => {
    if (!selectedProduct || quantity <= 0) {
      toast.error('กรุณากรอกจำนวนที่ถูกต้อง');
      return;
    }

    if (quantity > selectedProduct.stock_qty) {
      toast.error(`สต็อกไม่พอ (มี ${selectedProduct.stock_qty})`);
      return;
    }

    if (!reason) {
      toast.error('กรุณาระบุเหตุผลการเบิก');
      return;
    }

    const fullReason = reasonCategory ? `${reasonCategory} - ${reason}` : reason;
    const success = await stockOut(selectedProduct.id, quantity, orderRef || undefined, fullReason);
    
    if (success) {
      toast.success(`เบิก ${selectedProduct.name} จำนวน ${quantity} สำเร็จ`);
      setStockOutModal(false);
      refresh();
      refreshTransactions();
    } else {
      toast.error('ไม่สามารถเบิกสต็อกได้');
    }
  };

  const handleAdjust = async () => {
    if (!selectedProduct) return;

    if (adjustQty < 0) {
      toast.error('จำนวนต้องไม่น้อยกว่า 0');
      return;
    }

    const success = await stockAdjust(selectedProduct.id, adjustQty, reason || undefined);
    
    if (success) {
      toast.success(`ปรับสต็อก ${selectedProduct.name} เป็น ${adjustQty} สำเร็จ`);
      setAdjustModal(false);
      refresh();
      refreshTransactions();
    } else {
      toast.error('ไม่สามารถปรับสต็อกได้');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Package className="w-12 h-12 text-[#86868B] mx-auto mb-4 animate-pulse" />
          <p className="text-[#86868B]">กำลังโหลดข้อมูลสินค้า...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F5F7] to-[#E8E8ED] p-6">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1D1D1F] mb-2 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#007AFF] to-[#5AC8FA] flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            คลังสินค้า
          </h1>
          <p className="text-[#86868B]">จัดการสินค้าและสต็อกเสื้อเปล่า</p>
        </div>
        <Button
          onClick={() => setHistoryModal(true)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <History className="w-4 h-4" />
          ประวัติทั้งหมด
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card className="border-0 shadow-sm bg-white/80 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#86868B] mb-1">สินค้าทั้งหมด</p>
                <p className="text-2xl font-bold text-[#1D1D1F]">{stats.totalProducts}</p>
              </div>
              <Package className="w-8 h-8 text-[#007AFF]" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white/80 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#86868B] mb-1">ใช้งานอยู่</p>
                <p className="text-2xl font-bold text-[#34C759]">{stats.activeProducts}</p>
              </div>
              <Shirt className="w-8 h-8 text-[#34C759]" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white/80 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#86868B] mb-1">มีสต็อก</p>
                <p className="text-2xl font-bold text-[#007AFF]">{stats.inStock}</p>
              </div>
              <ArrowUpFromLine className="w-8 h-8 text-[#007AFF]" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white/80 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#86868B] mb-1">ใกล้หมด</p>
                <p className="text-2xl font-bold text-[#FF9500]">{stats.lowStock}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-[#FF9500]" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white/80 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#86868B] mb-1">มูลค่ารวม</p>
                <p className="text-lg font-bold text-[#1D1D1F]">{formatCurrency(stats.totalValue)}</p>
              </div>
              <Package className="w-8 h-8 text-[#5AC8FA]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm bg-white/80 backdrop-blur mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาด้วย Code, ชื่อ, รุ่น, แบรนด์..."
                className="pl-10 bg-[#F5F5F7] border-0"
              />
            </div>
            <select
              value={modelFilter || ''}
              onChange={(e) => setModelFilter(e.target.value)}
              className="px-4 py-2.5 bg-[#F5F5F7] border-0 rounded-xl text-sm"
            >
              <option value="">รุ่นทั้งหมด</option>
              {models.map((model) => (
                <option key={model} value={model || ''}>{model}</option>
              ))}
            </select>
            <select
              value={categoryFilter || ''}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2.5 bg-[#F5F5F7] border-0 rounded-xl text-sm"
            >
              <option value="">หมวดหมู่ทั้งหมด</option>
              {categories.map((category) => (
                <option key={category} value={category || ''}>{category}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="border-0 shadow-sm bg-white/80 backdrop-blur">
        <CardHeader className="border-b border-[#E5E5E7]">
          <CardTitle className="text-lg font-semibold text-[#1D1D1F]">
            รายการสินค้า ({filteredProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F5F5F7]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#86868B] uppercase">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#86868B] uppercase">ชื่อสินค้า</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#86868B] uppercase">รุ่น</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#86868B] uppercase">สี/ไซส์</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[#86868B] uppercase">จำนวน</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[#86868B] uppercase">ราคา</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[#86868B] uppercase">สถานะ</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[#86868B] uppercase">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E7]">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-[#F5F5F7]/50 transition-colors">
                    <td className="px-4 py-4">
                      <span className="font-mono text-sm text-[#1D1D1F]">{product.code}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-[#1D1D1F]">{product.name}</p>
                        {product.brand && (
                          <p className="text-xs text-[#86868B]">{product.brand}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-[#1D1D1F]">{product.model || '-'}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap gap-1">
                          {product.colors.slice(0, 2).map((color, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {color}
                            </Badge>
                          ))}
                          {product.colors.length > 2 && (
                            <Badge variant="secondary" className="text-xs">+{product.colors.length - 2}</Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {product.sizes.slice(0, 3).map((size, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {size}
                            </Badge>
                          ))}
                          {product.sizes.length > 3 && (
                            <Badge variant="outline" className="text-xs">+{product.sizes.length - 3}</Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className={`font-semibold ${
                        product.stock_qty === 0 ? 'text-[#FF3B30]' :
                        product.stock_qty < product.min_qty ? 'text-[#FF9500]' :
                        'text-[#1D1D1F]'
                      }`}>
                        {product.stock_qty}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-sm font-medium text-[#1D1D1F]">{formatCurrency(product.sale_price)}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {getStockBadge(product)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openStockIn(product)}
                          className="p-2"
                          title="รับเข้า"
                        >
                          <Plus className="w-4 h-4 text-[#34C759]" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openStockOut(product)}
                          className="p-2"
                          title="เบิกออก"
                        >
                          <Minus className="w-4 h-4 text-[#FF3B30]" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openAdjust(product)}
                          className="p-2"
                          title="ปรับปรุง"
                        >
                          <Edit3 className="w-4 h-4 text-[#007AFF]" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-[#86868B] mx-auto mb-4 opacity-50" />
                <p className="text-[#86868B]">ไม่พบสินค้า</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stock In Modal */}
      <Modal isOpen={stockInModal} onClose={() => setStockInModal(false)}>
        <div className="p-6">
          <h3 className="text-xl font-bold text-[#1D1D1F] mb-4 flex items-center gap-2">
            <ArrowUpFromLine className="w-5 h-5 text-[#34C759]" />
            รับเข้าสต็อก
          </h3>
          
          {selectedProduct && (
            <div className="mb-4 p-4 bg-[#F5F5F7] rounded-xl">
              <p className="font-medium text-[#1D1D1F]">{selectedProduct.name}</p>
              <p className="text-sm text-[#86868B]">สต็อกปัจจุบัน: {selectedProduct.stock_qty}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1D1D1F] mb-2">จำนวน *</label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                placeholder="0"
                className="bg-[#F5F5F7] border-0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1D1D1F] mb-2">หมายเลขออเดอร์อ้างอิง</label>
              <Input
                value={orderRef}
                onChange={(e) => setOrderRef(e.target.value)}
                placeholder="ORD-001"
                className="bg-[#F5F5F7] border-0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1D1D1F] mb-2">หมายเหตุ</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="รับเข้าจากซัพพลายเออร์..."
                className="w-full px-4 py-2.5 bg-[#F5F5F7] border-0 rounded-xl text-sm resize-none"
                rows={3}
              />
            </div>
          </div>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setStockInModal(false)} disabled={mutating}>
            ยกเลิก
          </Button>
          <Button onClick={handleStockIn} disabled={mutating} className="bg-[#34C759]">
            {mutating ? 'กำลังบันทึก...' : 'รับเข้า'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Stock Out Modal */}
      <Modal isOpen={stockOutModal} onClose={() => setStockOutModal(false)}>
        <div className="p-6">
          <h3 className="text-xl font-bold text-[#1D1D1F] mb-4 flex items-center gap-2">
            <ArrowDownToLine className="w-5 h-5 text-[#FF3B30]" />
            เบิกสต็อก
          </h3>
          
          {selectedProduct && (
            <div className="mb-4 p-4 bg-[#F5F5F7] rounded-xl">
              <p className="font-medium text-[#1D1D1F]">{selectedProduct.name}</p>
              <p className="text-sm text-[#86868B]">สต็อกปัจจุบัน: {selectedProduct.stock_qty}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1D1D1F] mb-2">จำนวน *</label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                placeholder="0"
                max={selectedProduct?.stock_qty}
                className="bg-[#F5F5F7] border-0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1D1D1F] mb-2">หมวดหมู่ *</label>
              <select
                value={reasonCategory}
                onChange={(e) => setReasonCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#F5F5F7] border-0 rounded-xl text-sm"
              >
                <option value="">เลือกหมวดหมู่</option>
                {WITHDRAWAL_REASON_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.label}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1D1D1F] mb-2">เหตุผล *</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#F5F5F7] border-0 rounded-xl text-sm"
                disabled={!reasonCategory}
              >
                <option value="">เลือกเหตุผล</option>
                {reasonCategory && WITHDRAWAL_REASON_CATEGORIES.find(c => c.label === reasonCategory)?.reasons.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1D1D1F] mb-2">หมายเลขออเดอร์อ้างอิง</label>
              <Input
                value={orderRef}
                onChange={(e) => setOrderRef(e.target.value)}
                placeholder="ORD-001"
                className="bg-[#F5F5F7] border-0"
              />
            </div>
          </div>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setStockOutModal(false)} disabled={mutating}>
            ยกเลิก
          </Button>
          <Button onClick={handleStockOut} disabled={mutating} className="bg-[#FF3B30]">
            {mutating ? 'กำลังบันทึก...' : 'เบิกออก'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Adjust Modal */}
      <Modal isOpen={adjustModal} onClose={() => setAdjustModal(false)}>
        <div className="p-6">
          <h3 className="text-xl font-bold text-[#1D1D1F] mb-4 flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-[#007AFF]" />
            ปรับปรุงสต็อก
          </h3>
          
          {selectedProduct && (
            <div className="mb-4 p-4 bg-[#F5F5F7] rounded-xl">
              <p className="font-medium text-[#1D1D1F]">{selectedProduct.name}</p>
              <p className="text-sm text-[#86868B]">สต็อกปัจจุบัน: {selectedProduct.stock_qty}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1D1D1F] mb-2">จำนวนใหม่ *</label>
              <Input
                type="number"
                value={adjustQty}
                onChange={(e) => setAdjustQty(parseInt(e.target.value) || 0)}
                placeholder="0"
                className="bg-[#F5F5F7] border-0"
              />
              {selectedProduct && (
                <p className="text-xs text-[#86868B] mt-1">
                  ต่าง: {adjustQty - selectedProduct.stock_qty > 0 ? '+' : ''}{adjustQty - selectedProduct.stock_qty}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1D1D1F] mb-2">เหตุผล</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="ตรวจนับจริง, แก้ไขข้อผิดพลาด, ..."
                className="w-full px-4 py-2.5 bg-[#F5F5F7] border-0 rounded-xl text-sm resize-none"
                rows={3}
              />
            </div>
          </div>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setAdjustModal(false)} disabled={mutating}>
            ยกเลิก
          </Button>
          <Button onClick={handleAdjust} disabled={mutating} className="bg-[#007AFF]">
            {mutating ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* History Modal */}
      <Modal isOpen={historyModal} onClose={() => setHistoryModal(false)}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-[#1D1D1F] flex items-center gap-2">
              <History className="w-5 h-5 text-[#007AFF]" />
              ประวัติการเคลื่อนไหวสต็อก
            </h3>
            <Button variant="outline" size="sm" onClick={() => setHistoryModal(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="max-h-96 overflow-y-auto space-y-2">
            {transactions.map((tx) => (
              <div key={tx.id} className="p-3 bg-[#F5F5F7] rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {tx.type === 'IN' && <ArrowUpFromLine className="w-4 h-4 text-[#34C759]" />}
                  {tx.type === 'OUT' && <ArrowDownToLine className="w-4 h-4 text-[#FF3B30]" />}
                  {tx.type === 'ADJUST' && <Edit3 className="w-4 h-4 text-[#007AFF]" />}
                  <div>
                    <p className="text-sm font-medium text-[#1D1D1F]">
                      {tx.product?.name || 'Unknown Product'}
                    </p>
                    <p className="text-xs text-[#86868B]">{tx.reason || tx.note || '-'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${
                    tx.type === 'IN' ? 'text-[#34C759]' :
                    tx.type === 'OUT' ? 'text-[#FF3B30]' :
                    'text-[#007AFF]'
                  }`}>
                    {tx.type === 'IN' ? '+' : tx.type === 'OUT' ? '-' : ''}{tx.quantity}
                  </p>
                  <p className="text-xs text-[#86868B]">{formatDateTime(tx.created_at)}</p>
                </div>
              </div>
            ))}
            
            {transactions.length === 0 && (
              <div className="text-center py-8">
                <History className="w-12 h-12 text-[#86868B] mx-auto mb-2 opacity-50" />
                <p className="text-sm text-[#86868B]">ยังไม่มีประวัติการเคลื่อนไหว</p>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
