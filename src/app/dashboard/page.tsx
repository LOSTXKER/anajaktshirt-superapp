'use client';

import { useState } from 'react';
import Link from "next/link"
import { 
   Package, 
   Warehouse,
   ArrowUpRight, 
   DollarSign,
   AlertTriangle,
   Calendar,
   ArrowDownToLine,
   ArrowUpFromLine,
   Settings2,
   Plus,
   FileSpreadsheet,
   TrendingUp,
   Factory,
   Users,
   Clock,
   CheckCircle,
   AlertCircle,
   UserPlus,
   Crown,
   Timer
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, StatCard } from "@/modules/shared/ui/Card"
import { Badge } from "@/modules/shared/ui/Badge"
import { Button } from "@/modules/shared/ui/Button"
import { useDashboardData } from "@/modules/dashboard/hooks/useDashboardData"
import { useDashboardStats } from "@/modules/dashboard/hooks/useDashboardStats"
import { StockTransactionModal } from "@/modules/stock/components/StockTransactionModal"
import { useRealtimeProducts } from "@/modules/stock/hooks/useRealtimeProducts"
import { Product } from "@/modules/stock/types"

const typeConfig: Record<string, { label: string; color: string; icon: typeof ArrowDownToLine; bgColor: string }> = {
  IN: { label: 'รับเข้า', color: 'text-[#34C759]', icon: ArrowDownToLine, bgColor: 'bg-[#34C759]/10' },
  OUT: { label: 'เบิกออก', color: 'text-[#FF9500]', icon: ArrowUpFromLine, bgColor: 'bg-[#FF9500]/10' },
  ADJUST: { label: 'ปรับปรุง', color: 'text-[#AF52DE]', icon: Settings2, bgColor: 'bg-[#AF52DE]/10' },
  in: { label: 'รับเข้า', color: 'text-[#34C759]', icon: ArrowDownToLine, bgColor: 'bg-[#34C759]/10' },
  out: { label: 'เบิกออก', color: 'text-[#FF9500]', icon: ArrowUpFromLine, bgColor: 'bg-[#FF9500]/10' },
  adjustment: { label: 'ปรับปรุง', color: 'text-[#AF52DE]', icon: Settings2, bgColor: 'bg-[#AF52DE]/10' },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'รอดำเนินการ', color: 'bg-gray-100 text-gray-700' },
  reserved: { label: 'จองสต๊อกแล้ว', color: 'bg-blue-100 text-blue-700' },
  printing: { label: 'กำลังพิมพ์', color: 'bg-purple-100 text-purple-700' },
  curing: { label: 'อบ/อัด', color: 'bg-orange-100 text-orange-700' },
  packing: { label: 'แพ็คสินค้า', color: 'bg-teal-100 text-teal-700' },
  completed: { label: 'เสร็จสิ้น', color: 'bg-green-100 text-green-700' },
};

const tierConfig: Record<string, { label: string; icon: any; color: string }> = {
  bronze: { label: 'Bronze', icon: Crown, color: 'text-amber-600' },
  silver: { label: 'Silver', icon: Crown, color: 'text-slate-400' },
  gold: { label: 'Gold', icon: Crown, color: 'text-yellow-500' },
  platinum: { label: 'Platinum', icon: Crown, color: 'text-purple-500' },
};

export default function DashboardPage() {
  const { stats: stockStats, loading: stockLoading } = useDashboardStats();
  const { stats: fullStats, loading: fullLoading } = useDashboardData();
  const { products, refresh } = useRealtimeProducts();
  
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [transactionType, setTransactionType] = useState<'IN' | 'OUT'>('IN');

  const handleLowStockAction = (item: any) => {
    setSelectedProduct(item as Product);
    setTransactionType('IN');
    setIsTransactionModalOpen(true);
  };

  const loading = stockLoading || fullLoading;

  return (
    <div className="flex-1 min-h-screen bg-[#F5F5F7]">
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-semibold text-[#1D1D1F]">แดชบอร์ด</h1>
            <p className="text-[#86868B] mt-1 text-[15px]">ยินดีต้อนรับ! ภาพรวมโรงงานของคุณวันนี้</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-[#34C759]/10 text-[#34C759] text-[13px] font-medium">
              <span className="w-2 h-2 rounded-full bg-[#34C759] animate-pulse" />
              ออนไลน์
            </div>
            <div className="px-3 py-2 rounded-full bg-white text-[#86868B] text-[13px] font-medium shadow-sm">
              <Calendar className="w-4 h-4 inline mr-1.5" />
              {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Link href="/stock">
            <Button variant="primary" className="gap-2">
              <ArrowDownToLine className="w-4 h-4" />
              รับเข้าสต๊อก
            </Button>
          </Link>
          <Link href="/production">
            <Button variant="outline" className="gap-2">
              <Factory className="w-4 h-4" />
              สร้างงานผลิต
            </Button>
          </Link>
          <Link href="/crm">
            <Button variant="outline" className="gap-2">
              <UserPlus className="w-4 h-4" />
              เพิ่มลูกค้า
            </Button>
          </Link>
        </div>

        {/* Stats Grid - Row 1: Stock */}
        <div>
          <h2 className="text-[16px] font-semibold text-[#1D1D1F] mb-4 flex items-center gap-2">
            <Warehouse className="w-5 h-5 text-[#007AFF]" />
            สต๊อกสินค้า
          </h2>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="รายการสินค้า"
              value={loading ? '—' : stockStats.totalProducts.toString()}
              subtitle="SKU ในระบบ"
              icon={<Package className="w-5 h-5" />}
              variant="blue"
            />
            
            <StatCard
              title="จำนวนรวม"
              value={loading ? '—' : stockStats.totalQuantity.toLocaleString()}
              subtitle="ตัวในคลัง"
              icon={<Warehouse className="w-5 h-5" />}
              variant="green"
            />

            <StatCard
              title="มูลค่าต้นทุน"
              value={loading ? '—' : `฿${stockStats.totalCostValue.toLocaleString()}`}
              subtitle="มูลค่าสต๊อก"
              icon={<DollarSign className="w-5 h-5" />}
              variant="purple"
            />
            
            <StatCard
              title="สต๊อกต่ำ"
              value={loading ? '—' : stockStats.lowStockCount.toString()}
              subtitle={stockStats.lowStockCount > 0 ? "ต้องดำเนินการ" : "ปกติ"}
              icon={<AlertTriangle className="w-5 h-5" />}
              variant={stockStats.lowStockCount > 0 ? "orange" : "default"}
            />
          </div>
        </div>

        {/* Stats Grid - Row 2: Production */}
        <div>
          <h2 className="text-[16px] font-semibold text-[#1D1D1F] mb-4 flex items-center gap-2">
            <Factory className="w-5 h-5 text-[#FF9500]" />
            งานผลิต
          </h2>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="งานทั้งหมด"
              value={loading ? '—' : fullStats.totalActiveJobs.toString()}
              subtitle="งานที่กำลังดำเนินการ"
              icon={<Factory className="w-5 h-5" />}
              variant="blue"
            />
            
            <StatCard
              title="รอดำเนินการ"
              value={loading ? '—' : fullStats.pendingJobs.toString()}
              subtitle="รอเริ่มงาน"
              icon={<Clock className="w-5 h-5" />}
              variant="default"
            />

            <StatCard
              title="กำลังผลิต"
              value={loading ? '—' : fullStats.inProgressJobs.toString()}
              subtitle="กำลังดำเนินการ"
              icon={<Timer className="w-5 h-5" />}
              variant="purple"
            />
            
            <StatCard
              title="เลยกำหนด"
              value={loading ? '—' : fullStats.overdueJobs.toString()}
              subtitle={fullStats.overdueJobs > 0 ? "ต้องเร่งดำเนินการ" : "ตรงเวลา"}
              icon={<AlertCircle className="w-5 h-5" />}
              variant={fullStats.overdueJobs > 0 ? "orange" : "green"}
            />
          </div>
        </div>

        {/* Stats Grid - Row 3: CRM */}
        <div>
          <h2 className="text-[16px] font-semibold text-[#1D1D1F] mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#AF52DE]" />
            ลูกค้าสัมพันธ์
          </h2>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="ลูกค้าทั้งหมด"
              value={loading ? '—' : fullStats.totalCustomers.toString()}
              subtitle="รายในระบบ"
              icon={<Users className="w-5 h-5" />}
              variant="purple"
            />
            
            <StatCard
              title="ลูกค้าใหม่"
              value={loading ? '—' : fullStats.newCustomersThisMonth.toString()}
              subtitle="เดือนนี้"
              icon={<UserPlus className="w-5 h-5" />}
              variant="green"
            />

            <StatCard
              title="ลูกค้า Active"
              value={loading ? '—' : fullStats.activeCustomers.toString()}
              subtitle="กำลังใช้งาน"
              icon={<CheckCircle className="w-5 h-5" />}
              variant="blue"
            />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Products by Model Chart */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>สต๊อกตามรุ่นเสื้อ</CardTitle>
                  <CardDescription>จำนวนเสื้อในแต่ละรุ่น</CardDescription>
                </div>
                <Link href="/products">
                  <Button variant="ghost" size="sm" className="text-[#007AFF]">
                    ดูทั้งหมด
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-[250px]">
                    <div className="w-8 h-8 rounded-full border-2 border-[#E8E8ED] border-t-[#007AFF] animate-spin" />
                  </div>
                ) : stockStats.productsByModel.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[250px] text-[#86868B]">
                    <Package className="w-12 h-12 text-[#D2D2D7] mb-4" />
                    <p className="font-medium">ยังไม่มีข้อมูลสินค้า</p>
                    <Link href="/products">
                      <Button variant="outline" size="sm" className="mt-4">
                        เพิ่มสินค้าแรก
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stockStats.productsByModel.slice(0, 5).map((model, index) => (
                      <div key={model.model} className="flex items-center gap-4">
                        <div className="w-24 text-[14px] font-medium text-[#1D1D1F] truncate">
                          {model.model}
                        </div>
                        <div className="flex-1 h-10 bg-[#F5F5F7] rounded-lg overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#007AFF] to-[#5AC8FA] rounded-lg flex items-center px-3 transition-all duration-500"
                            style={{ width: `${Math.max(15, (model.quantity / stockStats.totalQuantity) * 100)}%` }}
                          >
                            <span className="text-[13px] font-semibold text-[#1D1D1F] whitespace-nowrap">
                              {model.quantity.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <Badge variant="secondary" size="sm">
                          {model.count} SKU
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Deadlines */}
          <div>
            <Card className="h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Timer className="w-5 h-5 text-[#FF9500]" />
                  <CardTitle>งานใกล้ครบกำหนด</CardTitle>
                </div>
                <CardDescription>งานผลิตที่ต้องเสร็จใน 7 วัน</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <div className="flex items-center justify-center h-[200px]">
                    <div className="w-8 h-8 rounded-full border-2 border-[#E8E8ED] border-t-[#FF9500] animate-spin" />
                  </div>
                ) : fullStats.upcomingDeadlines.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[200px] text-[#86868B]">
                    <div className="w-16 h-16 rounded-full bg-[#34C759]/10 flex items-center justify-center mb-4">
                      <CheckCircle className="w-8 h-8 text-[#34C759]" />
                    </div>
                    <p className="font-medium text-[#34C759]">ไม่มีงานเร่งด่วน</p>
                  </div>
                ) : (
                  fullStats.upcomingDeadlines.map((job: any) => {
                    const status = statusConfig[job.status] || statusConfig.pending;
                    const dueDate = new Date(job.due_date);
                    const today = new Date();
                    const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    const isOverdue = daysLeft < 0;

                    return (
                      <Link 
                        key={job.id} 
                        href="/production"
                        className="group flex items-center gap-3 p-3 rounded-xl hover:bg-[#F5F5F7] border border-[#E8E8ED] transition-all"
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-[14px] ${
                          isOverdue ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {isOverdue ? 'OD' : `D${daysLeft}`}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[#1D1D1F] text-[14px] truncate">
                            {job.job_number}
                          </p>
                          <p className="text-[12px] text-[#86868B] truncate">
                            {job.customer_name}
                          </p>
                        </div>
                        <Badge className={status.color} size="sm">
                          {status.label}
                        </Badge>
                      </Link>
                    );
                  })
                )}
                <Link href="/production">
                  <Button variant="ghost" className="w-full text-[#007AFF]">
                    ดูงานผลิตทั้งหมด
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Transactions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle>ความเคลื่อนไหวสต๊อก</CardTitle>
                <CardDescription>รายการ In/Out ล่าสุด</CardDescription>
              </div>
              <Link href="/stock/history">
                <Button variant="ghost" size="sm" className="text-[#007AFF]">
                  ดูทั้งหมด
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-[200px]">
                  <div className="w-8 h-8 rounded-full border-2 border-[#E8E8ED] border-t-[#007AFF] animate-spin" />
                </div>
              ) : fullStats.recentTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[200px] text-[#86868B]">
                  <TrendingUp className="w-12 h-12 text-[#D2D2D7] mb-4" />
                  <p className="font-medium">ยังไม่มีความเคลื่อนไหว</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {fullStats.recentTransactions.slice(0, 5).map((tx: any) => {
                    const config = typeConfig[tx.type] || typeConfig.in;
                    const TypeIcon = config.icon;
                    const date = new Date(tx.created_at);

                    return (
                      <div
                        key={tx.id}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F5F5F7] transition-colors"
                      >
                        <div className={`p-2 rounded-lg ${config.bgColor}`}>
                          <TypeIcon className={`w-4 h-4 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[#1D1D1F] text-[14px] truncate">
                            {tx.products?.name || tx.product?.model}
                          </p>
                          <p className="text-[12px] text-[#86868B]">
                            {date.toLocaleDateString('th-TH', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold text-[18px] ${config.color}`}>
                            {tx.type === 'in' || tx.type === 'IN' ? '+' : tx.type === 'out' || tx.type === 'OUT' ? '-' : '±'}
                            {Math.abs(tx.quantity)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Alerts */}
          <Card className={stockStats.lowStockCount > 0 ? "border border-[#FF9500]/20 bg-gradient-to-br from-[#FF9500]/5 to-white" : ""}>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`w-5 h-5 ${stockStats.lowStockCount > 0 ? 'text-[#FF9500]' : 'text-[#86868B]'}`} />
                  <CardTitle>แจ้งเตือนสต๊อกต่ำ</CardTitle>
                </div>
                <CardDescription>สินค้าที่ต่ำกว่าจุดสั่งซื้อ</CardDescription>
              </div>
              {stockStats.lowStockCount > 0 && (
                <Badge variant="warning">{stockStats.lowStockCount} รายการ</Badge>
              )}
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-[200px]">
                  <div className="w-8 h-8 rounded-full border-2 border-[#E8E8ED] border-t-[#FF9500] animate-spin" />
                </div>
              ) : stockStats.lowStockItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[200px] text-[#86868B]">
                  <div className="w-16 h-16 rounded-full bg-[#34C759]/10 flex items-center justify-center mb-4">
                    <Package className="w-8 h-8 text-[#34C759]" />
                  </div>
                  <p className="font-medium text-[#34C759]">สต๊อกปกติทุกรายการ</p>
                  <p className="text-[13px] text-[#86868B] mt-1">ไม่มีสินค้าที่ต้องสั่งซื้อเพิ่ม</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stockStats.lowStockItems.slice(0, 4).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white border border-[#FF9500]/10"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#FF9500]/10 flex items-center justify-center font-semibold text-[#FF9500]">
                        {item.size}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[#1D1D1F] text-[14px] truncate">
                          {item.model} {item.color}
                        </p>
                        <p className="text-[12px] text-[#86868B]">ขั้นต่ำ: {item.min_level}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-[#FF9500]">{item.quantity}</p>
                        <button 
                          onClick={() => handleLowStockAction(item)}
                          className="text-[12px] text-[#007AFF] hover:underline font-medium"
                        >
                          เติมสต๊อก
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Customers */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#AF52DE]" />
                  <CardTitle>ลูกค้าล่าสุด</CardTitle>
                </div>
                <CardDescription>ลูกค้าที่เพิ่มเข้ามาใหม่</CardDescription>
              </div>
              <Link href="/crm">
                <Button variant="ghost" size="sm" className="text-[#007AFF]">
                  ดูทั้งหมด
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-[200px]">
                  <div className="w-8 h-8 rounded-full border-2 border-[#E8E8ED] border-t-[#AF52DE] animate-spin" />
                </div>
              ) : fullStats.recentCustomers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[200px] text-[#86868B]">
                  <Users className="w-12 h-12 text-[#D2D2D7] mb-4" />
                  <p className="font-medium">ยังไม่มีลูกค้า</p>
                  <Link href="/crm">
                    <Button variant="outline" size="sm" className="mt-4">
                      เพิ่มลูกค้าแรก
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {fullStats.recentCustomers.map((customer: any) => {
                    const tier = tierConfig[customer.tier] || tierConfig.bronze;
                    const TierIcon = tier.icon;

                    return (
                      <Link
                        key={customer.id}
                        href="/crm"
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F5F5F7] transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#AF52DE] to-[#5E5CE6] flex items-center justify-center">
                          <span className="text-[#1D1D1F] font-semibold text-[14px]">
                            {customer.name?.charAt(0)?.toUpperCase() || 'C'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[#1D1D1F] text-[14px] truncate">
                            {customer.name}
                          </p>
                          <p className="text-[12px] text-[#86868B]">
                            {customer.code}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <TierIcon className={`w-4 h-4 ${tier.color}`} />
                          <span className={`text-[12px] font-medium ${tier.color}`}>
                            {tier.label}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Transaction Modal */}
      <StockTransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        product={selectedProduct}
        onSuccess={refresh}
        defaultType={transactionType}
      />
    </div>
  )
}
