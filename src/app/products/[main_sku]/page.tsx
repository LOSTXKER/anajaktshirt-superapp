'use client';

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, ConfirmDialog, Modal, ModalFooter, useToast } from '@/modules/shared/ui';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Pencil, Trash2, X, Check, Package, AlertTriangle, DollarSign, Download, Upload, Settings2 } from 'lucide-react';
import Link from 'next/link';
import { DeleteConfirmModal } from '@/modules/stock/components/DeleteConfirmModal';
import { Product } from '@/modules/stock/types';
import { createClient } from '@/modules/shared/services/supabase-client';

const DEFAULT_COLOR_HEX = '#86868B';
const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const main_sku = decodeURIComponent(params.main_sku as string);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ 
    color: string;
    color_hex: string;
    size: string; 
    cost: number; 
    price: number;
    min_level: number;
  }>({ color: '', color_hex: DEFAULT_COLOR_HEX, size: '', cost: 0, price: 0, min_level: 10 });
  
  // Bulk edit mode
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [bulkEditData, setBulkEditData] = useState<{
    cost?: number | '';
    price?: number | '';
    min_level?: number | '';
  }>({});
  
  // Add variant modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newVariant, setNewVariant] = useState({ 
    color: '', 
    color_hex: '#007AFF', 
    sizes: [] as string[],
    cost: 0, 
    price: 0 
  });
  
  // Bulk price modal
  const [isBulkPriceModalOpen, setIsBulkPriceModalOpen] = useState(false);
  const [bulkCost, setBulkCost] = useState<number | ''>('');
  const [bulkPrice, setBulkPrice] = useState<number | ''>('');
  const [bulkMinLevel, setBulkMinLevel] = useState<number | ''>('');
  
  // Delete state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Stock adjustment state
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [stockAction, setStockAction] = useState<'adjust' | 'in' | 'out'>('adjust');
  const [stockQuantity, setStockQuantity] = useState<number>(0);
  const [stockReason, setStockReason] = useState('');
  
  // Delete all confirmation
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  
  // Import file ref
  const importFileRef = useRef<HTMLInputElement>(null);
  
  // Toast
  const toast = useToast();

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('main_sku', main_sku)
      .order('color')
      .order('size');
    
    if (data) {
      setProducts(data as Product[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, [main_sku]);

  // Computed values
  const model = products[0]?.model || '-';
  const colors = useMemo(() => [...new Set(products.map(p => p.color).filter(Boolean))], [products]);
  const totalQuantity = products.reduce((sum, p) => sum + (p.quantity || 0), 0);
  const lowStockCount = products.filter(p => (p.quantity || 0) <= (p.min_level || 0)).length;
  const totalCostValue = products.reduce((sum, p) => sum + (p.quantity || 0) * (p.cost || 0), 0);

  // Group products by color
  const productsByColor = useMemo(() => {
    const grouped: Record<string, { hex: string; products: Product[] }> = {};
    products.forEach(p => {
      const color = p.color || 'ไม่ระบุ';
      if (!grouped[color]) {
        grouped[color] = { hex: p.color_hex || DEFAULT_COLOR_HEX, products: [] };
      }
      grouped[color].products.push(p);
    });
    
    const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
    Object.keys(grouped).forEach(color => {
      grouped[color].products.sort((a, b) => {
        const aIdx = sizeOrder.indexOf(a.size || '');
        const bIdx = sizeOrder.indexOf(b.size || '');
        if (aIdx === -1 && bIdx === -1) return (a.size || '').localeCompare(b.size || '');
        if (aIdx === -1) return 1;
        if (bIdx === -1) return -1;
        return aIdx - bIdx;
      });
    });
    
    return grouped;
  }, [products]);

  const isLightColor = (hex: string) => {
    if (!hex || hex.length < 7) return true;
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 155;
  };

  // Edit handlers
  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setEditData({ 
      color: product.color || '', 
      color_hex: product.color_hex || DEFAULT_COLOR_HEX,
      size: product.size || '', 
      cost: product.cost || 0, 
      price: product.price || 0,
      min_level: product.min_level || 10,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (product: Product) => {
    setSaving(true);
    const supabase = createClient();
    
    let newSku = product.sku;
    if (editData.color !== product.color || editData.size !== product.size) {
      const colorCode = editData.color.substring(0, 1).toUpperCase();
      newSku = `${main_sku}-${colorCode}-${editData.size}`;
    }
    
    await supabase
      .from('products')
      .update({ 
        color: editData.color,
        color_hex: editData.color_hex,
        size: editData.size,
        cost: editData.cost, 
        price: editData.price,
        min_level: editData.min_level,
        sku: newSku
      })
      .eq('id', product.id);
    
    setEditingId(null);
    setSaving(false);
    fetchProducts();
    toast.success('บันทึกสำเร็จ', 'อัปเดตข้อมูลสินค้าแล้ว');
  };

  // Bulk select handlers
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map(p => p.id)));
    }
  };

  const handleBulkEdit = async () => {
    if (selectedIds.size === 0) return;
    
    setSaving(true);
    const supabase = createClient();
    
    const updates: any = {};
    if (bulkEditData.cost !== '' && bulkEditData.cost !== undefined) updates.cost = bulkEditData.cost;
    if (bulkEditData.price !== '' && bulkEditData.price !== undefined) updates.price = bulkEditData.price;
    if (bulkEditData.min_level !== '' && bulkEditData.min_level !== undefined) updates.min_level = bulkEditData.min_level;
    
    if (Object.keys(updates).length === 0) {
      setSaving(false);
      return;
    }
    
    await supabase
      .from('products')
      .update(updates)
      .in('id', Array.from(selectedIds));
    
    setSaving(false);
    setIsBulkEditModalOpen(false);
    setBulkEditData({});
    setSelectedIds(new Set());
    setIsBulkMode(false);
    fetchProducts();
    toast.success('แก้ไขสำเร็จ', `อัปเดต ${selectedIds.size} รายการแล้ว`);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    
    setSaving(true);
    const supabase = createClient();
    
    await supabase
      .from('products')
      .delete()
      .in('id', Array.from(selectedIds));
    
    setSaving(false);
    setSelectedIds(new Set());
    setIsBulkMode(false);
    fetchProducts();
    toast.success('ลบสำเร็จ', `ลบ ${selectedIds.size} รายการแล้ว`);
    
    if (selectedIds.size === products.length) {
      router.push('/products');
    }
  };

  const updateColorHexForAll = async (colorName: string, newHex: string) => {
    setSaving(true);
    const supabase = createClient();
    
    await supabase
      .from('products')
      .update({ color_hex: newHex })
      .eq('main_sku', main_sku)
      .eq('color', colorName);
    
    setSaving(false);
    fetchProducts();
  };

  // Toggle size selection
  const toggleSize = (size: string) => {
    setNewVariant(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size) 
        ? prev.sizes.filter(s => s !== size) 
        : [...prev.sizes, size]
    }));
  };

  // Add variant
  const saveNewVariant = async () => {
    if (!newVariant.color || newVariant.sizes.length === 0) return;
    
    setSaving(true);
    const supabase = createClient();
    const colorCode = newVariant.color.substring(0, 1).toUpperCase();
    
    for (const size of newVariant.sizes) {
      await supabase.from('products').insert({
        main_sku,
        sku: `${main_sku}-${colorCode}-${size}`,
        model,
        color: newVariant.color,
        color_hex: newVariant.color_hex,
        size,
        cost: newVariant.cost || products[0]?.cost || 0,
        price: newVariant.price || products[0]?.price || 0,
        quantity: 0,
        min_level: 10,
      });
    }
    
    setIsAddModalOpen(false);
    setNewVariant({ color: '', color_hex: '#007AFF', sizes: [], cost: 0, price: 0 });
    setSaving(false);
    fetchProducts();
  };

  // Delete handler
  const handleDelete = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteSuccess = () => {
    fetchProducts();
    if (products.length <= 1) {
      router.push('/products');
    }
  };

  // Bulk update
  const applyBulkPrices = async () => {
    if (bulkCost === '' && bulkPrice === '' && bulkMinLevel === '') return;
    
    setSaving(true);
    const supabase = createClient();
    
    const updates: any = {};
    if (bulkCost !== '') updates.cost = bulkCost;
    if (bulkPrice !== '') updates.price = bulkPrice;
    if (bulkMinLevel !== '') updates.min_level = bulkMinLevel;
    
    await supabase
      .from('products')
      .update(updates)
      .eq('main_sku', main_sku);
    
    setBulkCost('');
    setBulkPrice('');
    setBulkMinLevel('');
    setSaving(false);
    setIsBulkPriceModalOpen(false);
    fetchProducts();
    toast.success('อัปเดตสำเร็จ', `อัปเดต ${products.length} รายการแล้ว`);
  };

  // Stock adjustment
  const openStockModal = (product: Product, action: 'adjust' | 'in' | 'out') => {
    setStockProduct(product);
    setStockAction(action);
    setStockQuantity(action === 'adjust' ? product.quantity || 0 : 0);
    setStockReason('');
    setIsStockModalOpen(true);
  };

  const handleStockUpdate = async () => {
    if (!stockProduct) return;
    
    setSaving(true);
    const supabase = createClient();
    
    let newQuantity = stockProduct.quantity || 0;
    let transactionType: 'IN' | 'OUT' | 'ADJUST' = 'ADJUST';
    let transactionQty = 0;
    
    if (stockAction === 'adjust') {
      transactionQty = Math.abs(stockQuantity - (stockProduct.quantity || 0));
      transactionType = stockQuantity > (stockProduct.quantity || 0) ? 'IN' : 'OUT';
      newQuantity = stockQuantity;
    } else if (stockAction === 'in') {
      transactionType = 'IN';
      transactionQty = stockQuantity;
      newQuantity = (stockProduct.quantity || 0) + stockQuantity;
    } else if (stockAction === 'out') {
      transactionType = 'OUT';
      transactionQty = stockQuantity;
      newQuantity = Math.max(0, (stockProduct.quantity || 0) - stockQuantity);
    }
    
    // Update product quantity
    await supabase
      .from('products')
      .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
      .eq('id', stockProduct.id);
    
    // Create transaction record
    if (transactionQty > 0) {
      await supabase.from('transactions').insert({
        product_id: stockProduct.id,
        type: transactionType,
        quantity: transactionQty,
        reason: stockReason || (stockAction === 'adjust' ? 'ปรับปรุงสต๊อก' : stockAction === 'in' ? 'นำเข้าสินค้า' : 'เบิกสินค้า'),
        note: `ปรับจาก ${stockProduct.quantity || 0} เป็น ${newQuantity}`,
      });
    }
    
    setSaving(false);
    setIsStockModalOpen(false);
    fetchProducts();
    toast.success('ปรับปรุงสต๊อกสำเร็จ', `${stockProduct.sku}: ${stockProduct.quantity || 0} → ${newQuantity}`);
  };

  // Export stock to CSV
  const handleExport = () => {
    const headers = ['SKU หลัก', 'SKU รอง', 'รุ่น', 'สี', 'ไซส์', 'จำนวน', 'ต้นทุน', 'ราคาขาย', 'สต๊อกขั้นต่ำ'];
    const rows = products.map(p => [
      p.main_sku,
      p.sku,
      p.model,
      p.color,
      p.size,
      p.quantity,
      p.cost,
      p.price,
      p.min_level,
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stock_${main_sku}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('ส่งออกสำเร็จ', `ส่งออก ${products.length} รายการเป็น CSV แล้ว`);
  };

  // Import stock from CSV
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      toast.error('ไฟล์ไม่ถูกต้อง', 'กรุณาใช้ไฟล์ CSV ที่ส่งออกจากระบบ');
      return;
    }
    
    setSaving(true);
    const supabase = createClient();
    
    let updated = 0;
    const errors: string[] = [];
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.replace(/"/g, '').trim());
      if (cols.length < 6) continue;
      
      const [, sku, , , , quantityStr, costStr, priceStr, minLevelStr] = cols;
      const quantity = parseInt(quantityStr, 10);
      const cost = parseFloat(costStr) || undefined;
      const price = parseFloat(priceStr) || undefined;
      const min_level = parseInt(minLevelStr, 10) || undefined;
      
      // Find product by SKU
      const product = products.find(p => p.sku === sku);
      if (!product) {
        errors.push(`แถว ${i + 1}: ไม่พบ SKU "${sku}"`);
        continue;
      }
      
      // Build update object
      const updates: any = { updated_at: new Date().toISOString() };
      let hasChanges = false;
      
      if (!isNaN(quantity) && product.quantity !== quantity) {
        updates.quantity = quantity;
        hasChanges = true;
      }
      if (cost !== undefined && product.cost !== cost) {
        updates.cost = cost;
        hasChanges = true;
      }
      if (price !== undefined && product.price !== price) {
        updates.price = price;
        hasChanges = true;
      }
      if (min_level !== undefined && product.min_level !== min_level) {
        updates.min_level = min_level;
        hasChanges = true;
      }
      
      if (hasChanges) {
        const { error } = await supabase
          .from('products')
          .update(updates)
          .eq('id', product.id);
        
        if (error) {
          errors.push(`${sku}: ${error.message}`);
        } else {
          // Create transaction for quantity change
          if (updates.quantity !== undefined) {
            const diff = updates.quantity - (product.quantity || 0);
            await supabase.from('transactions').insert({
              product_id: product.id,
              type: diff > 0 ? 'IN' : 'OUT',
              quantity: Math.abs(diff),
              reason: 'นำเข้าจากไฟล์ CSV',
              note: `ปรับจาก ${product.quantity || 0} เป็น ${updates.quantity}`,
            });
          }
          updated++;
        }
      }
    }
    
    setSaving(false);
    if (importFileRef.current) importFileRef.current.value = '';
    fetchProducts();
    
    if (errors.length > 0) {
      toast.warning('นำเข้าบางส่วน', `อัปเดต ${updated} รายการ, ข้อผิดพลาด ${errors.length} รายการ`);
    } else if (updated > 0) {
      toast.success('นำเข้าสำเร็จ', `อัปเดต ${updated} รายการแล้ว`);
    } else {
      toast.info('ไม่มีการเปลี่ยนแปลง', 'ข้อมูลสินค้าทั้งหมดเท่าเดิม');
    }
  };

  // Delete all products in this main_sku
  const handleDeleteAll = async () => {
    setSaving(true);
    const supabase = createClient();
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('main_sku', main_sku);
    
    setSaving(false);
    setIsDeleteAllModalOpen(false);
    
    if (error) {
      toast.error('เกิดข้อผิดพลาด', error.message);
    } else {
      toast.success('ลบสินค้าสำเร็จ', `ลบ ${products.length} รายการแล้ว`);
      router.push('/products');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#E8E8ED] border-t-[#007AFF] animate-spin" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex-1 min-h-screen bg-[#F5F5F7] p-6">
        <Link href="/products">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            กลับ
          </Button>
        </Link>
        <Card>
          <CardContent className="flex flex-col items-center justify-center min-h-[300px]">
            <Package className="w-16 h-16 text-[#D2D2D7] mb-4" />
            <p className="text-[#86868B]">ไม่พบสินค้า {main_sku}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen bg-[#F5F5F7]">
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Link href="/products">
              <button className="p-2 rounded-xl hover:bg-white text-[#86868B] hover:text-[#1D1D1F] transition-all">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-3 py-1.5 rounded-lg bg-[#007AFF]/10 text-[#007AFF] text-[14px] font-semibold font-mono">
                  {main_sku}
                </span>
                {lowStockCount > 0 && (
                  <Badge variant="warning" size="sm">⚠️ {lowStockCount} สต๊อกต่ำ</Badge>
                )}
              </div>
              <h1 className="text-[28px] font-semibold text-[#1D1D1F] mt-1">{model}</h1>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap">
            {isBulkMode ? (
              <>
                <Button 
                  variant="primary" 
                  onClick={() => setIsBulkEditModalOpen(true)}
                  disabled={selectedIds.size === 0}
                >
                  <Pencil className="w-4 h-4 mr-1.5" />
                  แก้ไข {selectedIds.size > 0 && `(${selectedIds.size})`}
                </Button>
                <Button 
                  variant="outline" 
                  className="text-[#FF3B30] border-[#FF3B30]/30 hover:bg-[#FF3B30]/10"
                  onClick={handleBulkDelete}
                  disabled={selectedIds.size === 0}
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  ลบ {selectedIds.size > 0 && `(${selectedIds.size})`}
                </Button>
                <Button variant="outline" onClick={() => { setIsBulkMode(false); setSelectedIds(new Set()); }}>
                  <X className="w-4 h-4 mr-1.5" />
                  ยกเลิก
                </Button>
              </>
            ) : (
              <>
                <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  เพิ่มสี/ไซส์
                </Button>
                <Button variant="outline" onClick={() => setIsBulkMode(true)}>
                  <Check className="w-4 h-4 mr-1.5" />
                  เลือกหลายรายการ
                </Button>
                <Button variant="outline" onClick={() => setIsBulkPriceModalOpen(true)}>
                  <DollarSign className="w-4 h-4 mr-1.5" />
                  แก้ราคาทั้งหมด
                </Button>
                <Button variant="outline" onClick={handleExport}>
                  <Download className="w-4 h-4 mr-1.5" />
                  ส่งออก CSV
                </Button>
                <Button variant="outline" onClick={() => importFileRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-1.5" />
                  นำเข้า CSV
                </Button>
                <input
                  ref={importFileRef}
                  type="file"
                  accept=".csv"
                  onChange={handleImport}
                  className="hidden"
                />
                <Button variant="ghost" className="text-[#FF3B30] hover:bg-[#FF3B30]/10" onClick={() => setIsDeleteAllModalOpen(true)}>
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  ลบทั้งหมด
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-5">
              <p className="text-[13px] text-[#86868B] font-medium">จำนวน SKU</p>
              <p className="text-[28px] font-semibold text-[#1D1D1F] mt-1">{products.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-[13px] text-[#86868B] font-medium">สี</p>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-[28px] font-semibold text-[#1D1D1F]">{colors.length}</p>
                <div className="flex -space-x-1">
                  {Object.entries(productsByColor).slice(0, 5).map(([color, { hex }]) => (
                    <div 
                      key={color}
                      className="w-6 h-6 rounded-full border-2 border-white"
                      style={{ backgroundColor: hex }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-[13px] text-[#86868B] font-medium">ในคลัง</p>
              <p className="text-[28px] font-semibold text-[#1D1D1F] mt-1">{totalQuantity.toLocaleString()} <span className="text-[15px] font-normal text-[#86868B]">ตัว</span></p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-[13px] text-[#86868B] font-medium">มูลค่าต้นทุน</p>
              <p className="text-[28px] font-semibold text-[#1D1D1F] mt-1">฿{totalCostValue.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Products by Color - Table Layout */}
        <div className="space-y-6">
          {Object.entries(productsByColor).map(([color, { hex, products: colorProducts }]) => {
            const colorTotalQty = colorProducts.reduce((sum, p) => sum + (p.quantity || 0), 0);
            const colorLowStock = colorProducts.filter(p => (p.quantity || 0) <= (p.min_level || 0)).length;
            
            return (
              <Card key={color}>
                <CardHeader className="pb-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Color picker */}
                      <div className="relative">
                        <input
                          type="color"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          value={hex}
                          onChange={(e) => updateColorHexForAll(color, e.target.value)}
                          title="เปลี่ยนสีแสดงผล"
                        />
                        <div 
                          className="w-10 h-10 rounded-xl border-2 shadow-sm"
                          style={{ 
                            backgroundColor: hex,
                            borderColor: isLightColor(hex) ? '#E8E8ED' : 'transparent'
                          }}
                        />
                      </div>
                      <div>
                        <CardTitle className="text-[17px]">{color}</CardTitle>
                        <p className="text-[13px] text-[#86868B]">{colorProducts.length} ไซส์ • {colorTotalQty.toLocaleString()} ตัว</p>
                      </div>
                    </div>
                    {colorLowStock > 0 && (
                      <Badge variant="warning">{colorLowStock} สต๊อกต่ำ</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#F5F5F7]">
                          {isBulkMode && (
                            <th className="pb-3 w-10">
                              <input
                                type="checkbox"
                                checked={selectedIds.size === products.length}
                                onChange={selectAll}
                                className="w-4 h-4 rounded border-[#D2D2D7] text-[#007AFF] focus:ring-[#007AFF] cursor-pointer"
                              />
                            </th>
                          )}
                          <th className="pb-3 text-left text-[12px] font-semibold text-[#86868B] uppercase tracking-wider">ไซส์</th>
                          <th className="pb-3 text-left text-[12px] font-semibold text-[#86868B] uppercase tracking-wider">SKU</th>
                          <th className="pb-3 text-right text-[12px] font-semibold text-[#86868B] uppercase tracking-wider">ต้นทุน</th>
                          <th className="pb-3 text-right text-[12px] font-semibold text-[#86868B] uppercase tracking-wider">ราคาขาย</th>
                          <th className="pb-3 text-right text-[12px] font-semibold text-[#86868B] uppercase tracking-wider">สต๊อก</th>
                          <th className="pb-3 text-right text-[12px] font-semibold text-[#86868B] uppercase tracking-wider">ขั้นต่ำ</th>
                          <th className="pb-3 text-center text-[12px] font-semibold text-[#86868B] uppercase tracking-wider w-[100px]">จัดการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F5F5F7]">
                        {colorProducts.map(product => {
                          const isEditing = editingId === product.id;
                          const isLowStock = (product.quantity || 0) <= (product.min_level || 0);
                          const isSelected = selectedIds.has(product.id);
                          
                          return (
                            <tr 
                              key={product.id} 
                              className={`group transition-colors ${
                                isSelected
                                  ? 'bg-[#007AFF]/10'
                                  : isEditing 
                                    ? 'bg-[#007AFF]/5' 
                                    : isLowStock 
                                      ? 'bg-[#FF9500]/5' 
                                      : 'hover:bg-[#F5F5F7]/50'
                              }`}
                            >
                              {/* Checkbox */}
                              {isBulkMode && (
                                <td className="py-4 w-10">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleSelect(product.id)}
                                    className="w-4 h-4 rounded border-[#D2D2D7] text-[#007AFF] focus:ring-[#007AFF] cursor-pointer"
                                  />
                                </td>
                              )}
                              
                              {/* Size */}
                              <td className="py-4">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    className="w-16 h-9 px-3 text-center font-semibold rounded-lg bg-white border border-[#007AFF]/30 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                                    value={editData.size}
                                    onChange={(e) => setEditData(d => ({ ...d, size: e.target.value.toUpperCase() }))}
                                  />
                                ) : (
                                  <span className="inline-flex items-center justify-center w-12 h-9 rounded-lg bg-[#F5F5F7] font-semibold text-[15px] text-[#1D1D1F]">
                                    {product.size}
                                  </span>
                                )}
                              </td>
                              
                              {/* SKU */}
                              <td className="py-4">
                                <code className="text-[13px] text-[#86868B] font-mono">{product.sku}</code>
                              </td>
                              
                              {/* Cost */}
                              <td className="py-4 text-right">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    className="w-24 h-9 px-3 text-right rounded-lg bg-white border border-[#E8E8ED] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                                    value={editData.cost}
                                    onChange={(e) => setEditData(d => ({ ...d, cost: Number(e.target.value) }))}
                                  />
                                ) : (
                                  <span className="text-[14px] text-[#86868B]">฿{(product.cost || 0).toLocaleString()}</span>
                                )}
                              </td>
                              
                              {/* Price */}
                              <td className="py-4 text-right">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    className="w-24 h-9 px-3 text-right rounded-lg bg-white border border-[#E8E8ED] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                                    value={editData.price}
                                    onChange={(e) => setEditData(d => ({ ...d, price: Number(e.target.value) }))}
                                  />
                                ) : (
                                  <span className="text-[14px] font-medium text-[#1D1D1F]">฿{(product.price || 0).toLocaleString()}</span>
                                )}
                              </td>
                              
                              {/* Stock */}
                              <td className="py-4 text-right">
                                <button
                                  onClick={() => openStockModal(product, 'adjust')}
                                  className={`inline-flex items-center gap-1.5 font-semibold text-[15px] px-3 py-1.5 rounded-lg hover:bg-[#F5F5F7] transition-colors cursor-pointer ${isLowStock ? 'text-[#FF9500]' : 'text-[#1D1D1F]'}`}
                                  title="คลิกเพื่อปรับจำนวน"
                                >
                                  {product.quantity || 0}
                                  {isLowStock && <AlertTriangle className="w-4 h-4" />}
                                  <Settings2 className="w-3.5 h-3.5 text-[#86868B] opacity-0 group-hover:opacity-100" />
                                </button>
                              </td>
                              
                              {/* Min Level */}
                              <td className="py-4 text-right">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    className="w-20 h-9 px-3 text-right rounded-lg bg-white border border-[#E8E8ED] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                                    value={editData.min_level}
                                    onChange={(e) => setEditData(d => ({ ...d, min_level: Number(e.target.value) }))}
                                  />
                                ) : (
                                  <span className={`text-[14px] ${isLowStock ? 'text-[#FF9500] font-medium' : 'text-[#86868B]'}`}>
                                    {product.min_level || 10}
                                  </span>
                                )}
                              </td>
                              
                              {/* Actions */}
                              <td className="py-4">
                                <div className="flex items-center justify-center gap-1">
                                  {isEditing ? (
                                    <>
                                      <button
                                        onClick={() => saveEdit(product)}
                                        disabled={saving}
                                        className="p-2 rounded-lg bg-[#34C759] text-white hover:bg-[#2DB24C] transition-colors disabled:opacity-50"
                                        title="บันทึก"
                                      >
                                        <Check className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={cancelEdit}
                                        className="p-2 rounded-lg bg-[#F5F5F7] text-[#86868B] hover:bg-[#E8E8ED] transition-colors"
                                        title="ยกเลิก"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => startEdit(product)}
                                        className="p-2 rounded-lg text-[#86868B] hover:bg-[#007AFF]/10 hover:text-[#007AFF] transition-colors opacity-0 group-hover:opacity-100"
                                        title="แก้ไข"
                                      >
                                        <Pencil className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDelete(product)}
                                        className="p-2 rounded-lg text-[#86868B] hover:bg-[#FF3B30]/10 hover:text-[#FF3B30] transition-colors opacity-0 group-hover:opacity-100"
                                        title="ลบ"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Add Variant Modal */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="เพิ่มสี/ไซส์ใหม่"
        description={`เพิ่ม variant ใหม่ให้กับ ${main_sku}`}
        size="md"
      >
        <div className="space-y-5">
          {/* Color */}
          <div>
            <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">
              สี <span className="text-[#FF3B30]">*</span>
            </label>
            <div className="flex gap-3">
              <div className="relative">
                <input 
                  type="color" 
                  className="w-12 h-12 rounded-xl cursor-pointer border-2 border-[#E8E8ED]"
                  value={newVariant.color_hex} 
                  onChange={(e) => setNewVariant(v => ({ ...v, color_hex: e.target.value }))} 
                />
              </div>
              <input 
                type="text" 
                placeholder="ชื่อสี เช่น ดำ, ขาว, กรม" 
                className="flex-1 h-12 px-4 rounded-xl bg-[#F5F5F7] text-[15px] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#007AFF]/30" 
                value={newVariant.color} 
                onChange={(e) => setNewVariant(v => ({ ...v, color: e.target.value }))} 
              />
            </div>
            {/* Existing colors quick pick */}
            {colors.length > 0 && (
              <div className="mt-2">
                <p className="text-[11px] text-[#86868B] mb-1.5">เลือกสีที่มีอยู่:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(productsByColor).map(([colorName, { hex }]) => (
                    <button
                      key={colorName}
                      type="button"
                      onClick={() => setNewVariant(v => ({ ...v, color: colorName, color_hex: hex }))}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[13px] transition-all ${
                        newVariant.color === colorName
                          ? 'border-[#007AFF] bg-[#007AFF]/10 text-[#007AFF]'
                          : 'border-[#E8E8ED] bg-white text-[#1D1D1F] hover:border-[#D2D2D7]'
                      }`}
                    >
                      <span 
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: hex, borderColor: isLightColor(hex) ? '#E8E8ED' : 'transparent' }}
                      />
                      {colorName}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sizes */}
          <div>
            <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">
              ไซส์ <span className="text-[#FF3B30]">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {SIZES.map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSize(size)}
                  className={`w-14 h-11 rounded-xl border-2 text-[14px] font-semibold transition-all ${
                    newVariant.sizes.includes(size)
                      ? 'border-[#007AFF] bg-[#007AFF] text-white'
                      : 'border-[#E8E8ED] bg-white text-[#86868B] hover:border-[#007AFF]/50'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
            {newVariant.sizes.length > 0 && (
              <p className="mt-2 text-[13px] text-[#007AFF] font-medium">
                เลือก {newVariant.sizes.length} ไซส์
              </p>
            )}
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">ต้นทุน (บาท)</label>
              <input 
                type="number" 
                placeholder={products[0]?.cost?.toString() || '0'}
                className="w-full h-12 px-4 rounded-xl bg-[#F5F5F7] text-[15px] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#007AFF]/30" 
                value={newVariant.cost || ''} 
                onChange={(e) => setNewVariant(v => ({ ...v, cost: Number(e.target.value) }))} 
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">ราคาขาย (บาท)</label>
              <input 
                type="number" 
                placeholder={products[0]?.price?.toString() || '0'}
                className="w-full h-12 px-4 rounded-xl bg-[#F5F5F7] text-[15px] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#007AFF]/30" 
                value={newVariant.price || ''} 
                onChange={(e) => setNewVariant(v => ({ ...v, price: Number(e.target.value) }))} 
              />
            </div>
          </div>

          {/* Preview */}
          {newVariant.color && newVariant.sizes.length > 0 && (
            <div className="p-4 bg-[#F5F5F7] rounded-xl">
              <p className="text-[13px] text-[#86868B] mb-2">จะสร้าง {newVariant.sizes.length} รายการ:</p>
              <div className="flex flex-wrap gap-2">
                {newVariant.sizes.map(size => (
                  <span 
                    key={size}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-[#E8E8ED] text-[13px]"
                  >
                    <span 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: newVariant.color_hex }}
                    />
                    {newVariant.color} {size}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <ModalFooter>
          <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>ยกเลิก</Button>
          <Button 
            variant="primary" 
            onClick={saveNewVariant}
            disabled={!newVariant.color || newVariant.sizes.length === 0 || saving}
            isLoading={saving}
          >
            <Check className="w-4 h-4 mr-1.5" />
            สร้าง {newVariant.sizes.length || 0} รายการ
          </Button>
        </ModalFooter>
      </Modal>

      {/* Bulk Price Modal */}
      <Modal
        isOpen={isBulkPriceModalOpen}
        onClose={() => setIsBulkPriceModalOpen(false)}
        title="แก้ไขทั้งหมด"
        description={`อัปเดตข้อมูลสินค้าทั้งหมดใน ${main_sku}`}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">ต้นทุนใหม่ (บาท)</label>
            <input
              type="number"
              placeholder="ไม่เปลี่ยนแปลง"
              className="w-full h-12 px-4 rounded-xl bg-[#F5F5F7] text-[15px] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#007AFF]/30"
              value={bulkCost}
              onChange={(e) => setBulkCost(e.target.value ? Number(e.target.value) : '')}
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">ราคาขายใหม่ (บาท)</label>
            <input
              type="number"
              placeholder="ไม่เปลี่ยนแปลง"
              className="w-full h-12 px-4 rounded-xl bg-[#F5F5F7] text-[15px] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#007AFF]/30"
              value={bulkPrice}
              onChange={(e) => setBulkPrice(e.target.value ? Number(e.target.value) : '')}
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">
              สต๊อกขั้นต่ำใหม่ 
              <span className="text-[#86868B] font-normal ml-1">(สำหรับแจ้งเตือน)</span>
            </label>
            <input
              type="number"
              placeholder="ไม่เปลี่ยนแปลง"
              className="w-full h-12 px-4 rounded-xl bg-[#F5F5F7] text-[15px] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#007AFF]/30"
              value={bulkMinLevel}
              onChange={(e) => setBulkMinLevel(e.target.value ? Number(e.target.value) : '')}
            />
          </div>
          <div className="p-4 bg-[#FF9500]/10 rounded-xl">
            <p className="text-[13px] text-[#FF9500] font-medium">
              ⚠️ การเปลี่ยนแปลงนี้จะมีผลกับสินค้าทั้งหมด {products.length} รายการ
            </p>
          </div>
        </div>

        <ModalFooter>
          <Button variant="outline" onClick={() => setIsBulkPriceModalOpen(false)}>ยกเลิก</Button>
          <Button 
            variant="primary"
            onClick={applyBulkPrices}
            disabled={saving || (bulkCost === '' && bulkPrice === '' && bulkMinLevel === '')}
            isLoading={saving}
          >
            อัปเดตทั้งหมด
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        product={selectedProduct}
        onSuccess={handleDeleteSuccess}
      />

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        title="ปรับปรุงจำนวนสินค้า"
        description={stockProduct ? `${stockProduct.sku} - ${stockProduct.color} ${stockProduct.size}` : ''}
        size="sm"
      >
        <div className="space-y-4">
          {/* Action Type */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'adjust' as const, label: 'ปรับจำนวน', icon: Settings2, color: 'blue' },
              { id: 'in' as const, label: 'เพิ่มสต๊อก', icon: Plus, color: 'green' },
              { id: 'out' as const, label: 'ลดสต๊อก', icon: Trash2, color: 'orange' },
            ].map(action => (
              <button
                key={action.id}
                type="button"
                onClick={() => {
                  setStockAction(action.id);
                  setStockQuantity(action.id === 'adjust' ? (stockProduct?.quantity || 0) : 0);
                }}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  stockAction === action.id
                    ? action.color === 'blue'
                      ? 'border-[#007AFF] bg-[#007AFF]/10 text-[#007AFF]'
                      : action.color === 'green'
                        ? 'border-[#34C759] bg-[#34C759]/10 text-[#34C759]'
                        : 'border-[#FF9500] bg-[#FF9500]/10 text-[#FF9500]'
                    : 'border-[#E8E8ED] bg-white text-[#86868B] hover:border-[#D2D2D7]'
                }`}
              >
                <action.icon className="w-5 h-5 mx-auto mb-1" />
                <p className="text-[12px] font-medium">{action.label}</p>
              </button>
            ))}
          </div>

          {/* Current Stock */}
          <div className="p-4 bg-[#F5F5F7] rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[#86868B]">จำนวนปัจจุบัน</span>
              <span className="text-[20px] font-semibold text-[#1D1D1F]">{stockProduct?.quantity || 0}</span>
            </div>
          </div>

          {/* Quantity Input */}
          <div>
            <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">
              {stockAction === 'adjust' ? 'จำนวนใหม่' : stockAction === 'in' ? 'จำนวนที่เพิ่ม' : 'จำนวนที่ลด'}
            </label>
            <input
              type="number"
              min="0"
              className="w-full h-14 px-4 rounded-xl bg-white border border-[#E8E8ED] text-[24px] font-semibold text-center focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 focus:border-[#007AFF]"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(Math.max(0, Number(e.target.value)))}
            />
          </div>

          {/* Preview */}
          {stockAction !== 'adjust' && stockQuantity > 0 && (
            <div className={`p-4 rounded-xl ${stockAction === 'in' ? 'bg-[#34C759]/10' : 'bg-[#FF9500]/10'}`}>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#86868B]">จำนวนหลังปรับ</span>
                <span className={`text-[20px] font-semibold ${stockAction === 'in' ? 'text-[#34C759]' : 'text-[#FF9500]'}`}>
                  {stockAction === 'in' 
                    ? (stockProduct?.quantity || 0) + stockQuantity
                    : Math.max(0, (stockProduct?.quantity || 0) - stockQuantity)
                  }
                </span>
              </div>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">เหตุผล (ไม่บังคับ)</label>
            <input
              type="text"
              placeholder="เช่น ตรวจนับสต๊อก, รับของเข้า..."
              className="w-full h-12 px-4 rounded-xl bg-[#F5F5F7] text-[15px] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#007AFF]/30"
              value={stockReason}
              onChange={(e) => setStockReason(e.target.value)}
            />
          </div>
        </div>

        <ModalFooter>
          <Button variant="outline" onClick={() => setIsStockModalOpen(false)}>ยกเลิก</Button>
          <Button 
            variant="primary"
            onClick={handleStockUpdate}
            disabled={saving || (stockAction !== 'adjust' && stockQuantity <= 0)}
            isLoading={saving}
          >
            <Check className="w-4 h-4 mr-1.5" />
            บันทึก
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete All Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteAllModalOpen}
        onClose={() => setIsDeleteAllModalOpen(false)}
        onConfirm={handleDeleteAll}
        title={`ลบสินค้าทั้งหมด?`}
        description={`คุณต้องการลบสินค้าทั้งหมด ${products.length} รายการใน ${main_sku} หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้`}
        confirmText="ลบทั้งหมด"
        cancelText="ยกเลิก"
        type="danger"
        isLoading={saving}
      />

      {/* Bulk Edit Modal */}
      <Modal
        isOpen={isBulkEditModalOpen}
        onClose={() => setIsBulkEditModalOpen(false)}
        title="แก้ไขหลายรายการ"
        description={`แก้ไข ${selectedIds.size} รายการที่เลือก`}
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-4 bg-[#007AFF]/10 rounded-xl">
            <p className="text-[14px] text-[#007AFF] font-medium">
              📋 เลือกแล้ว {selectedIds.size} รายการ
            </p>
            <p className="text-[12px] text-[#007AFF]/70 mt-1">
              เฉพาะค่าที่กรอกเท่านั้นจะถูกอัปเดต
            </p>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">ต้นทุนใหม่ (บาท)</label>
            <input
              type="number"
              placeholder="ไม่เปลี่ยนแปลง"
              className="w-full h-12 px-4 rounded-xl bg-[#F5F5F7] text-[15px] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#007AFF]/30"
              value={bulkEditData.cost ?? ''}
              onChange={(e) => setBulkEditData(d => ({ ...d, cost: e.target.value ? Number(e.target.value) : '' }))}
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">ราคาขายใหม่ (บาท)</label>
            <input
              type="number"
              placeholder="ไม่เปลี่ยนแปลง"
              className="w-full h-12 px-4 rounded-xl bg-[#F5F5F7] text-[15px] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#007AFF]/30"
              value={bulkEditData.price ?? ''}
              onChange={(e) => setBulkEditData(d => ({ ...d, price: e.target.value ? Number(e.target.value) : '' }))}
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">
              สต๊อกขั้นต่ำใหม่ 
              <span className="text-[#86868B] font-normal ml-1">(สำหรับแจ้งเตือน)</span>
            </label>
            <input
              type="number"
              placeholder="ไม่เปลี่ยนแปลง"
              className="w-full h-12 px-4 rounded-xl bg-[#F5F5F7] text-[15px] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#007AFF]/30"
              value={bulkEditData.min_level ?? ''}
              onChange={(e) => setBulkEditData(d => ({ ...d, min_level: e.target.value ? Number(e.target.value) : '' }))}
            />
          </div>
        </div>

        <ModalFooter>
          <Button variant="outline" onClick={() => setIsBulkEditModalOpen(false)}>ยกเลิก</Button>
          <Button 
            variant="primary"
            onClick={handleBulkEdit}
            disabled={saving || (bulkEditData.cost === '' && bulkEditData.price === '' && bulkEditData.min_level === '')}
            isLoading={saving}
          >
            อัปเดต {selectedIds.size} รายการ
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
