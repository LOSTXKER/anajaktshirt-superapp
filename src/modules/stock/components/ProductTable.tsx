'use client';

import { motion } from 'framer-motion';
import { 
  Edit, 
  Trash2, 
  Package, 
  ChevronLeft, 
  ChevronRight,
  ArrowDownToLine,
  ArrowUpFromLine
} from 'lucide-react';
import { Product } from '../types';
import { Button } from '@/modules/shared/ui/Button';
import { Badge } from '@/modules/shared/ui/Badge';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/modules/shared/ui/Card";

interface ProductTableProps {
  products: Product[];
  isLoading: boolean;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  onStockIn?: (product: Product) => void;
  onStockOut?: (product: Product) => void;
}

export function ProductTable({ 
  products, 
  isLoading,
  onEdit,
  onDelete,
  onStockIn,
  onStockOut,
}: ProductTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-[#E8E8ED]"></div>
              <div className="absolute inset-0 rounded-full border-4 border-[#007AFF] border-t-transparent animate-spin"></div>
            </div>
            <p className="mt-4 text-[#86868B] font-medium">กำลังโหลดข้อมูลสต๊อก...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center min-h-[400px] py-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-20 h-20 rounded-2xl bg-[#F5F5F7] flex items-center justify-center mb-6"
            >
              <Package className="w-10 h-10 text-[#86868B]" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <h3 className="text-[20px] font-semibold text-[#1D1D1F] mb-2">ยังไม่มีสินค้า</h3>
              <p className="text-[#86868B] mb-8 max-w-sm mx-auto">
                คุณยังไม่ได้เพิ่มสินค้าในคลัง เริ่มต้นด้วยการเพิ่มสินค้าชิ้นแรก
              </p>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle>รายการสินค้า</CardTitle>
          <CardDescription>
            จัดการสินค้า ดูระดับสต๊อก และแก้ไขข้อมูล
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{products.length} รายการ</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-xl border border-[#E8E8ED] overflow-hidden overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E8E8ED] bg-[#F5F5F7]">
                <th className="px-4 py-3 text-left text-[12px] font-semibold text-[#86868B] uppercase tracking-wider">SKU</th>
                <th className="px-4 py-3 text-left text-[12px] font-semibold text-[#86868B] uppercase tracking-wider">รุ่นเสื้อ</th>
                <th className="px-4 py-3 text-left text-[12px] font-semibold text-[#86868B] uppercase tracking-wider">สี</th>
                <th className="px-4 py-3 text-left text-[12px] font-semibold text-[#86868B] uppercase tracking-wider">ไซส์</th>
                <th className="px-4 py-3 text-right text-[12px] font-semibold text-[#86868B] uppercase tracking-wider">ต้นทุน</th>
                <th className="px-4 py-3 text-right text-[12px] font-semibold text-[#86868B] uppercase tracking-wider">ราคาขาย</th>
                <th className="px-4 py-3 text-right text-[12px] font-semibold text-[#86868B] uppercase tracking-wider">คงเหลือ</th>
                <th className="px-4 py-3 text-center text-[12px] font-semibold text-[#86868B] uppercase tracking-wider">สถานะ</th>
                <th className="px-4 py-3 text-right text-[12px] font-semibold text-[#86868B] uppercase tracking-wider">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F5F7]">
              {products.map((product, index) => {
                const isLowStock = product.quantity <= product.min_level;
                const margin = product.price - product.cost;
                
                return (
                  <motion.tr 
                    key={product.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="group hover:bg-[#F5F5F7]/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <code className="px-2 py-1 rounded-lg bg-[#F5F5F7] text-[#86868B] text-[12px] font-mono">
                        {product.sku}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-[#1D1D1F]">{product.model}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full border border-[#E8E8ED]"
                          style={{ 
                            backgroundColor: getColorCode(product.color)
                          }}
                        />
                        <span className="text-[#1D1D1F]">{product.color}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" size="sm">{product.size}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[#86868B]">
                      ฿{product.cost.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div>
                        <span className="font-mono font-semibold text-[#1D1D1F]">
                          ฿{product.price.toLocaleString()}
                        </span>
                        <span className="block text-[12px] text-[#34C759]">
                          +฿{margin.toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-semibold text-[17px] ${isLowStock ? 'text-[#FF9500]' : 'text-[#1D1D1F]'}`}>
                        {product.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge 
                        variant={isLowStock ? "warning" : "success"} 
                        dot
                        size="sm"
                      >
                        {isLowStock ? "สต๊อกต่ำ" : "ปกติ"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Stock In */}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:bg-[#34C759]/10 hover:text-[#34C759]"
                          title="รับเข้า"
                          onClick={() => onStockIn?.(product)}
                        >
                          <ArrowDownToLine className="h-4 w-4" />
                        </Button>
                        {/* Stock Out */}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:bg-[#FF9500]/10 hover:text-[#FF9500]"
                          title="เบิกออก"
                          onClick={() => onStockOut?.(product)}
                        >
                          <ArrowUpFromLine className="h-4 w-4" />
                        </Button>
                        {/* Edit */}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:bg-[#007AFF]/10 hover:text-[#007AFF]" 
                          title="แก้ไข"
                          onClick={() => onEdit?.(product)}
                        >
                          <Edit className="h-4 w-4 text-[#86868B]" />
                        </Button>
                        {/* Delete */}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:bg-[#FF3B30]/10 hover:text-[#FF3B30]"
                          title="ลบ"
                          onClick={() => onDelete?.(product)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#F5F5F7]">
          <p className="text-[13px] text-[#86868B]">
            แสดง <span className="font-medium text-[#1D1D1F]">1-{products.length}</span> จาก{' '}
            <span className="font-medium text-[#1D1D1F]">{products.length}</span> รายการ
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="min-w-[40px]">1</Button>
            <Button variant="outline" size="sm" disabled>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to get color code for display
function getColorCode(colorName: string): string {
  const colorMap: Record<string, string> = {
    'ขาว': '#ffffff',
    'ดำ': '#1a1a1a',
    'กรม': '#1e3a5f',
    'เทา': '#86868B',
    'แดง': '#FF3B30',
    'น้ำเงิน': '#007AFF',
    'เขียว': '#34C759',
    'เหลือง': '#FFD60A',
    'ชมพู': '#FF2D55',
    'ม่วง': '#AF52DE',
    'ส้ม': '#FF9500',
    'ครีม': '#fef3c7',
  };
  return colorMap[colorName] || '#E8E8ED';
}
