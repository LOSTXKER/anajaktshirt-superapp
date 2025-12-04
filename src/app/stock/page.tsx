'use client';

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, useToast } from '@/modules/shared/ui';
import { useState, useMemo } from 'react';
import { 
  Package, 
  Search, 
  ArrowDownToLine, 
  ArrowUpFromLine,
  AlertTriangle,
  Shirt,
} from 'lucide-react';
import { useProducts } from '@/modules/stock/hooks/useProducts';
import { Product } from '@/modules/stock/types';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('th-TH', { 
    style: 'currency', 
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function StockPage() {
  const { products, loading, refresh } = useProducts();
  const toast = useToast();
  
  // Search & filter
  const [search, setSearch] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

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
      // Search filter
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
      
      // Model filter
      if (modelFilter && p.model !== modelFilter) return false;
      
      // Category filter
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1D1D1F] mb-2 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#007AFF] to-[#5AC8FA] flex items-center justify-center">
            <Package className="w-6 h-6 text-white" />
          </div>
          คลังสินค้า
        </h1>
        <p className="text-[#86868B]">จัดการสินค้าและสต็อกเสื้อเปล่า</p>
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
            {/* Search */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาด้วย Code, ชื่อ, รุ่น, แบรนด์..."
                className="pl-10 bg-[#F5F5F7] border-0"
              />
            </div>

            {/* Model Filter */}
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

            {/* Category Filter */}
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#86868B] uppercase">สี</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#86868B] uppercase">ไซส์</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[#86868B] uppercase">จำนวน</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[#86868B] uppercase">ราคาทุน</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[#86868B] uppercase">ราคาขาย</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[#86868B] uppercase">สถานะ</th>
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
                      <div className="flex flex-wrap gap-1">
                        {product.colors.length > 0 ? (
                          product.colors.slice(0, 3).map((color, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {color}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-[#86868B]">-</span>
                        )}
                        {product.colors.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{product.colors.length - 3}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {product.sizes.length > 0 ? (
                          product.sizes.slice(0, 3).map((size, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {size}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-[#86868B]">-</span>
                        )}
                        {product.sizes.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{product.sizes.length - 3}
                          </Badge>
                        )}
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
                      <span className="text-sm text-[#86868B]">{formatCurrency(product.cost_price)}</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-sm font-medium text-[#1D1D1F]">{formatCurrency(product.sale_price)}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {getStockBadge(product)}
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
    </div>
  );
}
