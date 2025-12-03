'use client';

import { Badge, Button, Card, CardContent, Dropdown, Modal, ModalFooter, useToast } from '@/modules/shared/ui';
import React, { useState, useMemo } from 'react';
import { Plus, Search, Download, Upload, RefreshCw, Package, ChevronRight, Check } from 'lucide-react';
import Link from 'next/link';
import { ImportModal } from '@/modules/stock/components/ImportModal';
import { useRealtimeProducts } from '@/modules/stock/hooks/useRealtimeProducts';
import { useProductOptions } from '@/modules/stock/hooks/useProductOptions';
import { productsToCSV, downloadCSV } from '@/modules/stock/utils/csv';
import { createClient } from '@/modules/shared/services/supabase-client';

const isLightColor = (hex: string) => {
  if (!hex || hex.length < 7) return true;
  const c = hex.replace('#', '');
  return (parseInt(c.substring(0, 2), 16) * 299 + parseInt(c.substring(2, 4), 16) * 587 + parseInt(c.substring(4, 6), 16) * 114) / 1000 > 155;
};

const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];

interface ProductGroup {
  main_sku: string;
  model: string;
  variantCount: number;
  totalQuantity: number;
  colors: { name: string; hex: string }[];
  sizes: string[];
  lowStockCount: number;
}

export default function ProductsPage() {
  const { products, loading, error, refresh } = useRealtimeProducts();
  const { models } = useProductOptions();
  const supabase = createClient();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [filterModel, setFilterModel] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    main_sku: '', model: '', color: '', color_hex: '#007AFF', sizes: [] as string[], cost: 0, price: 0
  });

  const productGroups = useMemo(() => {
    const groups: Record<string, ProductGroup> = {};
    products.forEach((p) => {
      if (!p?.main_sku) return;
      if (!groups[p.main_sku]) {
        groups[p.main_sku] = { main_sku: p.main_sku, model: p.model || '-', variantCount: 0, totalQuantity: 0, colors: [], sizes: [], lowStockCount: 0 };
      }
      groups[p.main_sku].variantCount++;
      groups[p.main_sku].totalQuantity += p.quantity || 0;
      if (p.color && !groups[p.main_sku].colors.find(c => c.name === p.color)) {
        groups[p.main_sku].colors.push({ name: p.color, hex: p.color_hex || '#86868B' });
      }
      if (p.size && !groups[p.main_sku].sizes.includes(p.size)) groups[p.main_sku].sizes.push(p.size);
      if ((p.quantity || 0) <= (p.min_level || 0)) groups[p.main_sku].lowStockCount++;
    });
    return Object.values(groups).sort((a, b) => a.main_sku.localeCompare(b.main_sku));
  }, [products]);

  const filteredGroups = useMemo(() => {
    return productGroups.filter((g) => {
      if (search) {
        const s = search.toLowerCase();
        if (!g.main_sku.toLowerCase().includes(s) && !g.model.toLowerCase().includes(s) && !g.colors.some(c => c.name.toLowerCase().includes(s))) return false;
      }
      if (filterModel && g.model !== filterModel) return false;
      return true;
    });
  }, [productGroups, search, filterModel]);

  const totalProducts = products.length;
  const totalQuantity = products.reduce((sum, p) => sum + (p?.quantity || 0), 0);

  const sortSizes = (sizes: string[]) => {
    const order = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
    return [...sizes].sort((a, b) => {
      const ai = order.indexOf(a), bi = order.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  };

  const toggleSize = (size: string) => {
    setForm(prev => ({ ...prev, sizes: prev.sizes.includes(size) ? prev.sizes.filter(s => s !== size) : [...prev.sizes, size] }));
  };

  const handleSave = async () => {
    if (!form.main_sku || !form.model || !form.color || form.sizes.length === 0) return;
    setSaving(true);
    
    let successCount = 0;
    for (const size of form.sizes) {
      const { error } = await supabase.from('products').insert({
        main_sku: form.main_sku,
        sku: `${form.main_sku}-${form.color.charAt(0).toUpperCase()}-${size}`,
        model: form.model, color: form.color, color_hex: form.color_hex,
        size, cost: form.cost, price: form.price, quantity: 0, min_level: 10,
      });
      if (!error) successCount++;
    }
    
    setIsAddModalOpen(false);
    setForm({ main_sku: '', model: '', color: '', color_hex: '#007AFF', sizes: [], cost: 0, price: 0 });
    setSaving(false);
    refresh();

    if (successCount === form.sizes.length) {
      toast.success('เพิ่มสินค้าสำเร็จ', `สร้าง ${successCount} รายการเรียบร้อยแล้ว`);
    } else if (successCount > 0) {
      toast.warning('เพิ่มสินค้าบางส่วน', `สำเร็จ ${successCount}/${form.sizes.length} รายการ`);
    } else {
      toast.error('เกิดข้อผิดพลาด', 'ไม่สามารถเพิ่มสินค้าได้');
    }
  };

  const handleExport = () => {
    downloadCSV(productsToCSV(products), `products_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-semibold text-[#1D1D1F]">จัดการสินค้า</h1>
            <p className="text-[#86868B] mt-1 text-[15px]">{productGroups.length} กลุ่ม • {totalProducts} SKU • {totalQuantity.toLocaleString()} ตัว</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleExport} title="ส่งออก CSV">
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setIsImportModalOpen(true)} title="นำเข้า CSV">
              <Upload className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={refresh} title="รีเฟรช">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />เพิ่มสินค้า
            </Button>
          </div>
        </div>

        {/* Search & Filter */}
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
              options={[{ value: '', label: 'ทุกรุ่น' }, ...models]}
              value={filterModel}
              onChange={(val) => setFilterModel(val)}
              placeholder="ทุกรุ่น"
              className="w-full sm:w-48"
            />
          </div>
        </Card>

        {error && <div className="p-4 bg-[#FF3B30]/10 border border-[#FF3B30]/20 rounded-xl text-[#FF3B30] text-[14px]">{error}</div>}

        {/* Products Grid */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="w-8 h-8 rounded-full border-2 border-[#E8E8ED] border-t-[#007AFF] animate-spin" />
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-20 h-20 rounded-2xl bg-[#F5F5F7] flex items-center justify-center mb-4">
              <Package className="w-10 h-10 text-[#D2D2D7]" />
            </div>
            <h3 className="text-[17px] font-semibold text-[#1D1D1F] mb-2">ยังไม่มีสินค้า</h3>
            <p className="text-[#86868B] mb-6">เริ่มต้นด้วยการเพิ่มสินค้าใหม่</p>
            <Button variant="primary" onClick={() => setIsAddModalOpen(true)}><Plus className="w-4 h-4 mr-1.5" />เพิ่มสินค้า</Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredGroups.map((g) => (
              <Link key={g.main_sku} href={`/products/${encodeURIComponent(g.main_sku)}`}>
                <Card hover className="h-full group">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-[#007AFF]/10 text-[#007AFF] text-[12px] font-semibold font-mono">{g.main_sku}</span>
                        <h3 className="font-semibold text-[#1D1D1F] mt-2 text-[17px]">{g.model}</h3>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[#D2D2D7] group-hover:text-[#007AFF] transition-colors" />
                    </div>

                    <div className="flex items-center gap-1.5 mb-3">
                      {g.colors.slice(0, 6).map(c => (
                        <div key={c.name} className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: c.hex }} title={c.name} />
                      ))}
                      {g.colors.length > 6 && <span className="text-[12px] text-[#86868B] ml-1">+{g.colors.length - 6}</span>}
                    </div>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {sortSizes(g.sizes).slice(0, 5).map(s => (
                        <span key={s} className="px-2 py-0.5 rounded-md bg-[#F5F5F7] text-[#86868B] text-[12px] font-medium">{s}</span>
                      ))}
                      {g.sizes.length > 5 && <span className="px-2 py-0.5 rounded-md bg-[#F5F5F7] text-[#A1A1A6] text-[12px]">+{g.sizes.length - 5}</span>}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[#F5F5F7]">
                      <div className="flex items-center gap-4 text-[13px]">
                        <span><strong className="text-[#1D1D1F]">{g.variantCount}</strong> <span className="text-[#86868B]">SKU</span></span>
                        <span><strong className="text-[#1D1D1F]">{g.totalQuantity.toLocaleString()}</strong> <span className="text-[#86868B]">ตัว</span></span>
                      </div>
                      {g.lowStockCount > 0 && <Badge variant="warning" size="sm">⚠ {g.lowStockCount}</Badge>}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="เพิ่มสินค้าใหม่" size="lg">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">SKU หลัก <span className="text-[#FF3B30]">*</span></label>
              <input
                type="text" placeholder="เช่น HP001"
                className="w-full h-11 px-4 rounded-xl bg-white border border-[#D2D2D7] text-[15px] text-[#1D1D1F] font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 focus:border-[#007AFF]"
                value={form.main_sku}
                onChange={(e) => setForm(f => ({ ...f, main_sku: e.target.value.toUpperCase() }))}
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">รุ่นเสื้อ <span className="text-[#FF3B30]">*</span></label>
              <input
                type="text" placeholder="เช่น Hiptrack"
                className="w-full h-11 px-4 rounded-xl bg-white border border-[#D2D2D7] text-[15px] text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 focus:border-[#007AFF]"
                value={form.model}
                onChange={(e) => setForm(f => ({ ...f, model: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">สี <span className="text-[#FF3B30]">*</span></label>
            <div className="flex gap-3">
              <input type="color" className="w-11 h-11 rounded-xl border border-[#D2D2D7] cursor-pointer p-1" value={form.color_hex} onChange={(e) => setForm(f => ({ ...f, color_hex: e.target.value }))} />
              <input type="text" placeholder="ชื่อสี เช่น ดำ, ขาว" className="flex-1 h-11 px-4 rounded-xl bg-white border border-[#D2D2D7] text-[15px] text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 focus:border-[#007AFF]" value={form.color} onChange={(e) => setForm(f => ({ ...f, color: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">ไซส์ <span className="text-[#FF3B30]">*</span></label>
            <div className="flex flex-wrap gap-2">
              {SIZES.map(size => (
                <button
                  key={size} type="button" onClick={() => toggleSize(size)}
                  className={`w-14 h-10 rounded-xl border-2 text-[14px] font-semibold transition-all ${form.sizes.includes(size) ? 'bg-[#007AFF] border-[#007AFF] text-white' : 'bg-white border-[#D2D2D7] text-[#1D1D1F] hover:border-[#007AFF]'}`}
                >
                  {size}
                </button>
              ))}
            </div>
            {form.sizes.length > 0 && <p className="mt-2 text-[13px] text-[#007AFF] font-medium">เลือก {form.sizes.length} ไซส์</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">ต้นทุน (บาท)</label>
              <input type="number" placeholder="0" className="w-full h-11 px-4 rounded-xl bg-white border border-[#D2D2D7] text-[15px] text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 focus:border-[#007AFF]" value={form.cost || ''} onChange={(e) => setForm(f => ({ ...f, cost: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">ราคาขาย (บาท)</label>
              <input type="number" placeholder="0" className="w-full h-11 px-4 rounded-xl bg-white border border-[#D2D2D7] text-[15px] text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 focus:border-[#007AFF]" value={form.price || ''} onChange={(e) => setForm(f => ({ ...f, price: Number(e.target.value) }))} />
            </div>
          </div>

          {form.main_sku && form.color && form.sizes.length > 0 && (
            <div className="p-4 bg-[#F5F5F7] rounded-xl">
              <p className="text-[13px] text-[#86868B] mb-2">จะสร้าง {form.sizes.length} รายการ:</p>
              <div className="flex flex-wrap gap-2">
                {sortSizes(form.sizes).map(s => (
                  <span key={s} className="px-3 py-1.5 rounded-lg bg-white border border-[#E8E8ED] text-[13px] font-mono">{form.main_sku}-{form.color.charAt(0).toUpperCase()}-{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <ModalFooter>
          <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>ยกเลิก</Button>
          <Button variant="primary" onClick={handleSave} isLoading={saving} disabled={!form.main_sku || !form.model || !form.color || form.sizes.length === 0}>
            <Check className="w-4 h-4 mr-1.5" />สร้าง {form.sizes.length || 0} รายการ
          </Button>
        </ModalFooter>
      </Modal>

      <ImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onSuccess={refresh} />
    </div>
  );
}
