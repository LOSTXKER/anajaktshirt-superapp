'use client';

import { useState } from 'react';
import { Card, Button, Input, Modal, useToast } from '@/modules/shared/ui';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Edit, 
  Save,
  Package,
  Palette,
  Printer,
  Scissors,
  Box,
  Truck,
  MoreHorizontal,
  PieChart,
  AlertTriangle
} from 'lucide-react';

interface CostBreakdownProps {
  orderId: string;
  totalRevenue: number; // ยอดขาย
  initialCosts?: {
    material_cost: number;
    design_cost: number;
    printing_cost: number;
    finishing_cost: number;
    packaging_cost: number;
    shipping_cost: number;
    other_cost: number;
  };
  onSave?: (costs: CostData) => void;
}

interface CostData {
  material_cost: number;
  design_cost: number;
  printing_cost: number;
  finishing_cost: number;
  packaging_cost: number;
  shipping_cost: number;
  other_cost: number;
}

const COST_ITEMS = [
  { key: 'material_cost', label: 'วัตถุดิบ', sublabel: 'เสื้อ, หมึก, ผ้า', icon: Package, color: 'text-blue-600', bg: 'bg-blue-100' },
  { key: 'design_cost', label: 'ออกแบบ', sublabel: 'ค่าแรงดีไซเนอร์', icon: Palette, color: 'text-purple-600', bg: 'bg-purple-100' },
  { key: 'printing_cost', label: 'พิมพ์/สกรีน', sublabel: 'ค่าแรง, ค่าเครื่อง', icon: Printer, color: 'text-orange-600', bg: 'bg-orange-100' },
  { key: 'finishing_cost', label: 'ตกแต่ง', sublabel: 'เย็บ, รีด, ปัก', icon: Scissors, color: 'text-pink-600', bg: 'bg-pink-100' },
  { key: 'packaging_cost', label: 'แพ็คของ', sublabel: 'ถุง, กล่อง, Tag', icon: Box, color: 'text-amber-600', bg: 'bg-amber-100' },
  { key: 'shipping_cost', label: 'ขนส่ง', sublabel: 'ต้นทุนขนส่งจริง', icon: Truck, color: 'text-green-600', bg: 'bg-green-100' },
  { key: 'other_cost', label: 'อื่นๆ', sublabel: 'ค่าใช้จ่ายอื่น', icon: MoreHorizontal, color: 'text-gray-600', bg: 'bg-gray-100' },
];

export function CostBreakdown({ orderId, totalRevenue, initialCosts, onSave }: CostBreakdownProps) {
  const { success, error: showError } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [costs, setCosts] = useState<CostData>(initialCosts || {
    material_cost: 0,
    design_cost: 0,
    printing_cost: 0,
    finishing_cost: 0,
    packaging_cost: 0,
    shipping_cost: 0,
    other_cost: 0,
  });

  // Calculations
  const totalCost = Object.values(costs).reduce((sum, val) => sum + val, 0);
  const grossProfit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const isProfitable = grossProfit >= 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleCostChange = (key: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setCosts(prev => ({ ...prev, [key]: numValue }));
  };

  const handleSave = () => {
    if (onSave) {
      onSave(costs);
    }
    success('บันทึกต้นทุนเรียบร้อย');
    setIsEditing(false);
  };

  // Calculate percentages for pie chart visualization
  const costPercentages = COST_ITEMS.map(item => ({
    ...item,
    value: costs[item.key as keyof CostData],
    percentage: totalCost > 0 ? (costs[item.key as keyof CostData] / totalCost) * 100 : 0,
  })).filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Revenue */}
        <Card className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center gap-2 mb-1 opacity-90">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm">ยอดขาย</span>
          </div>
          <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
        </Card>

        {/* Total Cost */}
        <Card className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="flex items-center gap-2 mb-1 opacity-90">
            <Package className="w-4 h-4" />
            <span className="text-sm">ต้นทุนรวม</span>
          </div>
          <div className="text-2xl font-bold">{formatCurrency(totalCost)}</div>
        </Card>

        {/* Gross Profit */}
        <Card className={`p-4 ${isProfitable ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-red-600'} text-white`}>
          <div className="flex items-center gap-2 mb-1 opacity-90">
            {isProfitable ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span className="text-sm">กำไรขั้นต้น</span>
          </div>
          <div className="text-2xl font-bold">{formatCurrency(grossProfit)}</div>
        </Card>

        {/* Profit Margin */}
        <Card className={`p-4 ${profitMargin >= 30 ? 'bg-gradient-to-br from-green-500 to-green-600' : profitMargin >= 15 ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' : 'bg-gradient-to-br from-red-500 to-red-600'} text-white`}>
          <div className="flex items-center gap-2 mb-1 opacity-90">
            <PieChart className="w-4 h-4" />
            <span className="text-sm">% กำไร</span>
          </div>
          <div className="text-2xl font-bold">{profitMargin.toFixed(1)}%</div>
          <div className="text-xs opacity-75 mt-1">
            {profitMargin >= 30 ? 'ดีมาก' : profitMargin >= 20 ? 'ดี' : profitMargin >= 10 ? 'พอใช้' : 'ต่ำ'}
          </div>
        </Card>
      </div>

      {/* Profit Alert */}
      {!isProfitable && (
        <Card className="p-4 bg-red-50 border-2 border-red-200">
          <div className="flex items-center gap-3 text-red-700">
            <AlertTriangle className="w-6 h-6" />
            <div>
              <p className="font-semibold">ออเดอร์ขาดทุน!</p>
              <p className="text-sm">ต้นทุนสูงกว่ายอดขาย {formatCurrency(Math.abs(grossProfit))} บาท</p>
            </div>
          </div>
        </Card>
      )}

      {/* Cost Breakdown */}
      <Card className="p-6 bg-white border border-[#E8E8ED]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-[#1D1D1F]">รายละเอียดต้นทุน</h3>
          {!isEditing ? (
            <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="w-4 h-4 mr-2" />
              แก้ไข
            </Button>
          ) : (
            <Button size="sm" onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              บันทึก
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {COST_ITEMS.map((item) => {
            const Icon = item.icon;
            const value = costs[item.key as keyof CostData];
            const percentage = totalCost > 0 ? (value / totalCost) * 100 : 0;
            
            return (
              <div key={item.key} className="flex items-center gap-4">
                {/* Icon */}
                <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>

                {/* Label */}
                <div className="w-24 flex-shrink-0">
                  <div className="text-sm font-medium text-[#1D1D1F]">{item.label}</div>
                  <div className="text-xs text-[#86868B]">{item.sublabel}</div>
                </div>

                {/* Progress Bar or Input */}
                <div className="flex-1">
                  {isEditing ? (
                    <Input
                      type="number"
                      value={value || ''}
                      onChange={(e) => handleCostChange(item.key, e.target.value)}
                      placeholder="0"
                      className="text-right"
                    />
                  ) : (
                    <div className="relative">
                      <div className="h-6 bg-[#F5F5F7] rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${item.bg} transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#86868B]">
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Amount */}
                <div className="w-28 text-right flex-shrink-0">
                  <span className="font-medium text-[#1D1D1F]">{formatCurrency(value)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total */}
        <div className="mt-4 pt-4 border-t border-[#E8E8ED]">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[#1D1D1F]">รวมต้นทุนทั้งหมด</span>
            <span className="text-xl font-bold text-[#1D1D1F]">{formatCurrency(totalCost)}</span>
          </div>
        </div>
      </Card>

      {/* Cost Distribution Chart */}
      {costPercentages.length > 0 && !isEditing && (
        <Card className="p-6 bg-white border border-[#E8E8ED]">
          <h3 className="text-lg font-semibold text-[#1D1D1F] mb-4">สัดส่วนต้นทุน</h3>
          
          {/* Simple Bar Chart */}
          <div className="flex h-8 rounded-full overflow-hidden">
            {costPercentages.map((item, index) => (
              <div
                key={item.key}
                className={`${item.bg} transition-all duration-500 flex items-center justify-center`}
                style={{ width: `${item.percentage}%` }}
                title={`${item.label}: ${item.percentage.toFixed(1)}%`}
              >
                {item.percentage > 10 && (
                  <span className={`text-xs font-medium ${item.color}`}>
                    {item.percentage.toFixed(0)}%
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4">
            {costPercentages.map((item) => (
              <div key={item.key} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${item.bg}`} />
                <span className="text-xs text-[#86868B]">{item.label}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export default CostBreakdown;

