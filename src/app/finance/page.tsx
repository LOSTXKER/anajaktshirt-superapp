'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  FileText,
  Receipt,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Download,
  Send,
  Eye,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Calendar,
  Building,
  CreditCard,
} from 'lucide-react';
import { Button, Card, Input, Modal, Select, useToast } from '@/modules/shared/ui';
import {
  useERPQuotations,
  useERPInvoices,
  useERPFinancialSummary,
  QUOTATION_STATUS_CONFIG,
  INVOICE_STATUS_CONFIG,
} from '@/modules/erp';
import type { Quotation, Invoice } from '@/modules/erp';

// Tabs
const TABS = [
  { key: 'overview', label: 'ภาพรวม', icon: TrendingUp },
  { key: 'quotations', label: 'ใบเสนอราคา', icon: FileText },
  { key: 'invoices', label: 'ใบแจ้งหนี้', icon: Receipt },
];

export default function FinancePage() {
  const { success } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');

  // Data
  const { quotations, loading: quotLoading } = useERPQuotations();
  const { invoices, loading: invLoading } = useERPInvoices();
  const { summary, loading: summaryLoading } = useERPFinancialSummary();

  const loading = quotLoading || invLoading || summaryLoading;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* Header */}
      <div className="bg-white border-b border-[#E8E8ED] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#1D1D1F] flex items-center gap-3">
                <DollarSign className="w-7 h-7 text-[#34C759]" />
                การเงิน
              </h1>
              <p className="text-sm text-[#86868B] mt-0.5">ใบเสนอราคา, ใบแจ้งหนี้, และใบเสร็จ</p>
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                สร้างใบเสนอราคา
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 bg-[#F5F5F7] rounded-xl p-1 w-fit">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'bg-white text-[#1D1D1F] shadow-sm'
                      : 'text-[#86868B] hover:text-[#1D1D1F]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && summary && (
          <div className="space-y-6">
            {/* Revenue Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 bg-white apple-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[#86868B]">รายได้รวม</span>
                  <TrendingUp className="w-4 h-4 text-[#34C759]" />
                </div>
                <p className="text-2xl font-bold text-[#1D1D1F]">{formatCurrency(summary.total_revenue)}</p>
                <p className="text-xs text-[#34C759] mt-1 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" />
                  +{summary.revenue_growth_percent}% จากเดือนก่อน
                </p>
              </Card>

              <Card className="p-4 bg-white apple-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[#86868B]">รับชำระแล้ว</span>
                  <CheckCircle2 className="w-4 h-4 text-[#34C759]" />
                </div>
                <p className="text-2xl font-bold text-[#34C759]">{formatCurrency(summary.total_paid)}</p>
                <p className="text-xs text-[#86868B] mt-1">
                  {summary.total_revenue > 0 ? Math.round((summary.total_paid / summary.total_revenue) * 100) : 0}% ของยอดรวม
                </p>
              </Card>

              <Card className="p-4 bg-white apple-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[#86868B]">รอชำระ</span>
                  <Clock className="w-4 h-4 text-[#FF9500]" />
                </div>
                <p className="text-2xl font-bold text-[#FF9500]">{formatCurrency(summary.total_outstanding)}</p>
                <p className="text-xs text-[#86868B] mt-1">
                  {summary.invoices_pending} ใบแจ้งหนี้
                </p>
              </Card>

              <Card className="p-4 bg-white apple-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[#86868B]">เกินกำหนด</span>
                  <AlertCircle className="w-4 h-4 text-[#FF3B30]" />
                </div>
                <p className="text-2xl font-bold text-[#FF3B30]">{formatCurrency(summary.total_overdue)}</p>
                <p className="text-xs text-[#86868B] mt-1">
                  {summary.invoices_overdue} ใบแจ้งหนี้
                </p>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quotation Stats */}
              <Card className="p-6 bg-white apple-card">
                <h3 className="text-lg font-semibold text-[#1D1D1F] mb-4">ใบเสนอราคา</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-[#F5F5F7] rounded-xl">
                    <p className="text-2xl font-bold text-[#1D1D1F]">{summary.quotations_count}</p>
                    <p className="text-xs text-[#86868B]">ทั้งหมด</p>
                  </div>
                  <div className="text-center p-4 bg-[#FF9500]/10 rounded-xl">
                    <p className="text-2xl font-bold text-[#FF9500]">{summary.quotations_pending}</p>
                    <p className="text-xs text-[#FF9500]">รอตอบรับ</p>
                  </div>
                  <div className="text-center p-4 bg-[#34C759]/10 rounded-xl">
                    <p className="text-2xl font-bold text-[#34C759]">{summary.quotations_count - summary.quotations_pending}</p>
                    <p className="text-xs text-[#34C759]">ยอมรับ/อื่นๆ</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-[#E8E8ED]">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#86868B]">อัตราการแปลง</span>
                    <span className="font-semibold text-[#34C759]">{summary.conversion_rate_percent}%</span>
                  </div>
                </div>
              </Card>

              {/* Invoice Stats */}
              <Card className="p-6 bg-white apple-card">
                <h3 className="text-lg font-semibold text-[#1D1D1F] mb-4">ใบแจ้งหนี้</h3>
                <div className="grid grid-cols-4 gap-3">
                  <div className="text-center p-3 bg-[#F5F5F7] rounded-xl">
                    <p className="text-xl font-bold text-[#1D1D1F]">{summary.invoices_count}</p>
                    <p className="text-xs text-[#86868B]">ทั้งหมด</p>
                  </div>
                  <div className="text-center p-3 bg-[#007AFF]/10 rounded-xl">
                    <p className="text-xl font-bold text-[#007AFF]">{summary.invoices_pending}</p>
                    <p className="text-xs text-[#007AFF]">รอชำระ</p>
                  </div>
                  <div className="text-center p-3 bg-[#34C759]/10 rounded-xl">
                    <p className="text-xl font-bold text-[#34C759]">{summary.invoices_count - summary.invoices_pending - summary.invoices_overdue}</p>
                    <p className="text-xs text-[#34C759]">จ่ายแล้ว</p>
                  </div>
                  <div className="text-center p-3 bg-[#FF3B30]/10 rounded-xl">
                    <p className="text-xl font-bold text-[#FF3B30]">{summary.invoices_overdue}</p>
                    <p className="text-xs text-[#FF3B30]">เกินกำหนด</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-[#E8E8ED]">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#86868B]">รับชำระเดือนนี้</span>
                    <span className="font-semibold text-[#34C759]">{formatCurrency(summary.total_paid)}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Recent Transactions */}
            <Card className="p-6 bg-white apple-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#1D1D1F]">รายการล่าสุด</h3>
                <Button variant="ghost" size="sm">ดูทั้งหมด</Button>
              </div>
              <div className="space-y-3">
                {invoices.slice(0, 5).map((inv) => {
                  const statusConfig = INVOICE_STATUS_CONFIG[inv.status];
                  return (
                    <div key={inv.id} className="flex items-center justify-between p-3 bg-[#F5F5F7] rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                          <Receipt className="w-5 h-5 text-[#007AFF]" />
                        </div>
                        <div>
                          <p className="font-medium text-[#1D1D1F]">{inv.invoice_number}</p>
                          <p className="text-sm text-[#86868B]">{inv.customer_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-[#1D1D1F]">{formatCurrency(inv.total_amount)}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig.color}`}>
                          {statusConfig.label_th}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {/* Quotations Tab */}
        {activeTab === 'quotations' && (
          <div className="space-y-4">
            {/* Search */}
            <Card className="p-4 bg-white apple-card">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="ค้นหาใบเสนอราคา..."
                    className="pl-10"
                  />
                </div>
                <Button variant="secondary">
                  <Filter className="w-4 h-4 mr-2" />
                  ตัวกรอง
                </Button>
              </div>
            </Card>

            {/* Quotations List */}
            <Card className="bg-white apple-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#F5F5F7]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#86868B]">เลขที่</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#86868B]">ลูกค้า</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#86868B]">ยอดรวม</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#86868B]">หมดอายุ</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#86868B]">สถานะ</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-[#86868B]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E8ED]">
                    {quotations.map((quot) => {
                      const statusConfig = QUOTATION_STATUS_CONFIG[quot.status];
                      return (
                        <tr key={quot.id} className="hover:bg-[#F5F5F7]/50">
                          <td className="px-4 py-3">
                            <span className="font-medium text-[#007AFF]">{quot.quotation_number}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-[#1D1D1F]">{quot.customer_name}</p>
                              <p className="text-xs text-[#86868B]">{quot.customer_email}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-semibold text-[#1D1D1F]">
                            {formatCurrency(quot.total_amount)}
                          </td>
                          <td className="px-4 py-3 text-sm text-[#86868B]">
                            {formatDate(quot.valid_until)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                              {statusConfig.label_th}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Send className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <div className="space-y-4">
            {/* Search */}
            <Card className="p-4 bg-white apple-card">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="ค้นหาใบแจ้งหนี้..."
                    className="pl-10"
                  />
                </div>
                <Button variant="secondary">
                  <Filter className="w-4 h-4 mr-2" />
                  ตัวกรอง
                </Button>
              </div>
            </Card>

            {/* Invoices List */}
            <Card className="bg-white apple-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#F5F5F7]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#86868B]">เลขที่</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#86868B]">ออเดอร์</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#86868B]">ลูกค้า</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#86868B]">ยอดรวม</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#86868B]">ชำระแล้ว</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#86868B]">กำหนดชำระ</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#86868B]">สถานะ</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-[#86868B]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E8ED]">
                    {invoices.map((inv) => {
                      const statusConfig = INVOICE_STATUS_CONFIG[inv.status];
                      return (
                        <tr key={inv.id} className="hover:bg-[#F5F5F7]/50">
                          <td className="px-4 py-3">
                            <span className="font-medium text-[#007AFF]">{inv.invoice_number}</span>
                            {inv.is_tax_invoice && (
                              <span className="ml-2 text-xs bg-[#AF52DE]/10 text-[#AF52DE] px-1.5 py-0.5 rounded">
                                TAX
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Link href={`/orders/${inv.order_id}`} className="text-[#007AFF] hover:underline text-sm">
                              {inv.order_number}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-[#1D1D1F]">{inv.customer_name}</p>
                          </td>
                          <td className="px-4 py-3 font-semibold text-[#1D1D1F]">
                            {formatCurrency(inv.total_amount)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={inv.paid_amount === inv.total_amount ? 'text-[#34C759]' : 'text-[#FF9500]'}>
                              {formatCurrency(inv.paid_amount)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-[#86868B]">
                            {formatDate(inv.due_date)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                              {statusConfig.label_th}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

