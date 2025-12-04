'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Search,
  RefreshCw,
  Plus,
  Phone,
  Mail,
  MapPin,
  Star,
  FileText,
  DollarSign,
  Clock,
  CheckCircle2,
  ChevronRight,
  Tag,
  Truck,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Button, Card, Input, Modal, Select, useToast } from '@/modules/shared/ui';
import {
  useERPSuppliers,
  useERPPurchaseOrders,
  useERPSupplierStats,
} from '@/modules/erp';
import type { Supplier, PurchaseOrder } from '@/modules/erp';

// Category Config
const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  fabric: { label: 'ผ้า/วัตถุดิบ', icon: <Tag className="w-4 h-4" />, color: 'bg-blue-100 text-blue-600' },
  sewing: { label: 'ตัดเย็บ', icon: <Building2 className="w-4 h-4" />, color: 'bg-green-100 text-green-600' },
  printing: { label: 'พิมพ์/สกรีน', icon: <FileText className="w-4 h-4" />, color: 'bg-purple-100 text-purple-600' },
  embroidery: { label: 'ปักโลโก้', icon: <Star className="w-4 h-4" />, color: 'bg-amber-100 text-amber-600' },
  packaging: { label: 'บรรจุภัณฑ์', icon: <Truck className="w-4 h-4" />, color: 'bg-cyan-100 text-cyan-600' },
  labeling: { label: 'ป้าย/แท็ก', icon: <Tag className="w-4 h-4" />, color: 'bg-pink-100 text-pink-600' },
};

// PO Status Config
const PO_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  draft: { label: 'ร่าง', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  pending: { label: 'รอยืนยัน', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  confirmed: { label: 'ยืนยันแล้ว', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  in_progress: { label: 'กำลังผลิต', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  shipped: { label: 'จัดส่งแล้ว', color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
  received: { label: 'รับแล้ว', color: 'text-green-600', bgColor: 'bg-green-100' },
  completed: { label: 'เสร็จสิ้น', color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  cancelled: { label: 'ยกเลิก', color: 'text-red-600', bgColor: 'bg-red-100' },
};

export default function SuppliersPage() {
  const { success } = useToast();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'suppliers' | 'po'>('suppliers');

  // Data hooks
  const { suppliers, loading: loadingSuppliers, refetch: refetchSuppliers } = useERPSuppliers({
    category: categoryFilter || undefined,
    search: searchTerm || undefined,
  });

  const { purchaseOrders, loading: loadingPOs, refetch: refetchPOs } = useERPPurchaseOrders();
  const { stats, refetch: refetchStats } = useERPSupplierStats();

  // Selected supplier modal
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const loading = loadingSuppliers || loadingPOs;

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* Header */}
      <div className="bg-white border-b border-[#E8E8ED] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#1D1D1F] flex items-center gap-3">
                <Building2 className="w-7 h-7 text-[#5856D6]" />
                Suppliers / Outsource
              </h1>
              <p className="text-sm text-[#86868B] mt-0.5">จัดการ Suppliers และใบสั่งซื้อ</p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => { refetchSuppliers(); refetchPOs(); refetchStats(); }}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                รีเฟรช
              </Button>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                เพิ่ม Supplier
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="p-4 bg-white apple-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F5F5F7] flex items-center justify-center">
                <Building2 className="w-5 h-5 text-[#86868B]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1D1D1F]">{stats?.total_suppliers || 0}</p>
                <p className="text-xs text-[#86868B]">Suppliers ทั้งหมด</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white apple-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F5F5F7] flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-[#86868B]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#34C759]">{stats?.active_suppliers || 0}</p>
                <p className="text-xs text-[#86868B]">Active</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white apple-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F5F5F7] flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#86868B]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1D1D1F]">{stats?.total_po || 0}</p>
                <p className="text-xs text-[#86868B]">PO ทั้งหมด</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white apple-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F5F5F7] flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#86868B]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#FF9500]">{stats?.pending_po || 0}</p>
                <p className="text-xs text-[#86868B]">PO รอดำเนินการ</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white apple-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F5F5F7] flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-[#86868B]" />
              </div>
              <div>
                <p className="text-xl font-bold text-[#FF3B30]">{formatCurrency(stats?.total_amount_pending || 0)}</p>
                <p className="text-xs text-[#86868B]">ยอดค้างชำระ</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'suppliers'
                ? 'bg-[#007AFF] text-white'
                : 'bg-white text-[#86868B] hover:bg-[#F5F5F7] border border-[#E8E8ED]'
            }`}
          >
            <Building2 className="w-4 h-4 inline mr-2" />
            Suppliers ({suppliers.length})
          </button>
          <button
            onClick={() => setActiveTab('po')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'po'
                ? 'bg-[#007AFF] text-white'
                : 'bg-white text-[#86868B] hover:bg-[#F5F5F7] border border-[#E8E8ED]'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Purchase Orders ({purchaseOrders.length})
          </button>
        </div>

        {/* Suppliers Tab */}
        {activeTab === 'suppliers' && (
          <>
            {/* Filters */}
            <Card className="p-4 bg-white apple-card mb-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="ค้นหาชื่อ Supplier, รหัส..."
                      className="pl-10"
                    />
                  </div>
                </div>

                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full lg:w-48"
                >
                  <option value="">หมวดหมู่ทั้งหมด</option>
                  {Object.entries(CATEGORY_CONFIG).map(([code, config]) => (
                    <option key={code} value={code}>{config.label}</option>
                  ))}
                </Select>
              </div>
            </Card>

            {/* Suppliers Grid */}
            {loadingSuppliers ? (
              <div className="text-center py-12 text-[#86868B]">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                กำลังโหลด...
              </div>
            ) : suppliers.length === 0 ? (
              <Card className="p-12 bg-white apple-card text-center">
                <Building2 className="w-12 h-12 mx-auto mb-2 text-[#86868B] opacity-50" />
                <p className="text-[#1D1D1F] font-medium">ไม่พบ Supplier</p>
                <p className="text-sm text-[#86868B] mt-1">เพิ่ม Supplier ใหม่เพื่อเริ่มต้น</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suppliers.map((supplier) => (
                  <Card
                    key={supplier.id}
                    className="p-4 bg-white apple-card hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setSelectedSupplier(supplier)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-[#1D1D1F] font-medium">{supplier.name}</h3>
                        <p className="text-xs text-[#86868B]">{supplier.code}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        supplier.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-[#86868B]'
                      }`}>
                        {supplier.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {/* Categories */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {supplier.categories?.map((cat) => {
                        const config = CATEGORY_CONFIG[cat];
                        return config ? (
                          <span key={cat} className={`px-2 py-0.5 rounded-full text-xs ${config.color}`}>
                            {config.label}
                          </span>
                        ) : null;
                      })}
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-1.5 text-sm">
                      {supplier.contact_name && (
                        <div className="flex items-center gap-2 text-[#86868B]">
                          <Building2 className="w-3.5 h-3.5" />
                          <span>{supplier.contact_name}</span>
                        </div>
                      )}
                      {supplier.phone && (
                        <div className="flex items-center gap-2 text-[#86868B]">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{supplier.phone}</span>
                        </div>
                      )}
                      {supplier.email && (
                        <div className="flex items-center gap-2 text-[#86868B]">
                          <Mail className="w-3.5 h-3.5" />
                          <span className="truncate">{supplier.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Rating & Stats */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#E8E8ED]">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-[#FF9500] fill-[#FF9500]" />
                        <span className="text-sm font-medium text-[#1D1D1F]">
                          {supplier.rating?.toFixed(1) || '-'}
                        </span>
                      </div>
                      <div className="text-xs text-[#86868B]">
                        {supplier.total_orders || 0} ออเดอร์
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Purchase Orders Tab */}
        {activeTab === 'po' && (
          <Card className="bg-white apple-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E8E8ED] bg-[#F5F5F7]">
                    <th className="text-left py-3 px-4 text-xs font-medium text-[#86868B] uppercase tracking-wider">PO</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-[#86868B] uppercase tracking-wider">Supplier</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-[#86868B] uppercase tracking-wider">Order</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-[#86868B] uppercase tracking-wider">สถานะ</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-[#86868B] uppercase tracking-wider">ยอดเงิน</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-[#86868B] uppercase tracking-wider">กำหนดส่ง</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-[#86868B] uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E8ED]">
                  {loadingPOs ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[#86868B]">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                        กำลังโหลด...
                      </td>
                    </tr>
                  ) : purchaseOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[#86868B]">
                        <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-[#1D1D1F] font-medium">ไม่พบใบสั่งซื้อ</p>
                      </td>
                    </tr>
                  ) : (
                    purchaseOrders.map((po) => {
                      const statusConfig = PO_STATUS_CONFIG[po.status] || PO_STATUS_CONFIG.draft;
                      const isOverdue = po.expected_date && new Date(po.expected_date) < new Date() && !['received', 'completed', 'cancelled'].includes(po.status);

                      return (
                        <tr key={po.id} className="hover:bg-[#F5F5F7]/50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="text-[#1D1D1F] font-medium">{po.po_number}</div>
                            <div className="text-xs text-[#86868B]">{formatDate(po.po_date)}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-[#1D1D1F]">{po.supplier_snapshot?.name}</div>
                            <div className="text-xs text-[#86868B]">{po.supplier_snapshot?.contact_name}</div>
                          </td>
                          <td className="py-3 px-4">
                            {po.order_number ? (
                              <Link
                                href={`/orders/${po.order_id}`}
                                className="text-[#007AFF] hover:underline text-sm"
                              >
                                {po.order_number}
                              </Link>
                            ) : (
                              <span className="text-[#86868B] text-sm">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                              {statusConfig.label}
                            </span>
                            {isOverdue && (
                              <span className="ml-2 text-xs text-[#FF3B30]">
                                <AlertCircle className="w-3 h-3 inline" /> เกินกำหนด
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="text-[#1D1D1F] font-medium">{formatCurrency(po.total_amount)}</div>
                            <div className={`text-xs ${
                              po.payment_status === 'paid' ? 'text-[#34C759]' :
                              po.payment_status === 'partial' ? 'text-[#FF9500]' :
                              'text-[#86868B]'
                            }`}>
                              {po.payment_status === 'paid' ? 'ชำระแล้ว' :
                               po.payment_status === 'partial' ? `ชำระ ${formatCurrency(po.paid_amount)}` :
                               'ยังไม่ชำระ'}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className={`text-sm ${isOverdue ? 'text-[#FF3B30] font-medium' : 'text-[#1D1D1F]'}`}>
                              {formatDate(po.expected_date)}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button variant="ghost" size="sm" className="text-[#86868B] hover:text-[#1D1D1F] p-1.5">
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Supplier Detail Modal */}
      <Modal
        isOpen={!!selectedSupplier}
        onClose={() => setSelectedSupplier(null)}
        title={selectedSupplier?.name || 'Supplier'}
        size="lg"
      >
        {selectedSupplier && (
          <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[#86868B]">{selectedSupplier.code}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedSupplier.categories?.map((cat) => {
                    const config = CATEGORY_CONFIG[cat];
                    return config ? (
                      <span key={cat} className={`px-2 py-0.5 rounded-full text-xs ${config.color}`}>
                        {config.label}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 text-[#FF9500] fill-[#FF9500]" />
                <span className="text-lg font-bold text-[#1D1D1F]">
                  {selectedSupplier.rating?.toFixed(1) || '-'}
                </span>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-[#F5F5F7] rounded-xl p-4 space-y-3">
              <h4 className="text-sm font-medium text-[#86868B]">ข้อมูลติดต่อ</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {selectedSupplier.contact_name && (
                  <div>
                    <span className="text-[#86868B]">ผู้ติดต่อ:</span>
                    <span className="text-[#1D1D1F] ml-2">{selectedSupplier.contact_name}</span>
                  </div>
                )}
                {selectedSupplier.phone && (
                  <div>
                    <span className="text-[#86868B]">โทร:</span>
                    <span className="text-[#1D1D1F] ml-2">{selectedSupplier.phone}</span>
                  </div>
                )}
                {selectedSupplier.email && (
                  <div className="col-span-2">
                    <span className="text-[#86868B]">อีเมล:</span>
                    <span className="text-[#1D1D1F] ml-2">{selectedSupplier.email}</span>
                  </div>
                )}
                {selectedSupplier.line_id && (
                  <div>
                    <span className="text-[#86868B]">LINE:</span>
                    <span className="text-[#1D1D1F] ml-2">{selectedSupplier.line_id}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Address */}
            {selectedSupplier.address && (
              <div className="bg-[#F5F5F7] rounded-xl p-4">
                <h4 className="text-sm font-medium text-[#86868B] mb-2">ที่อยู่</h4>
                <p className="text-sm text-[#1D1D1F]">
                  {selectedSupplier.address}
                  {selectedSupplier.province && `, ${selectedSupplier.province}`}
                  {selectedSupplier.postal_code && ` ${selectedSupplier.postal_code}`}
                </p>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#F5F5F7] rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-[#1D1D1F]">{selectedSupplier.total_orders || 0}</p>
                <p className="text-xs text-[#86868B]">ออเดอร์ทั้งหมด</p>
              </div>
              <div className="bg-[#F5F5F7] rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-[#1D1D1F]">{selectedSupplier.on_time_rate || 0}%</p>
                <p className="text-xs text-[#86868B]">ส่งทันเวลา</p>
              </div>
              <div className="bg-[#F5F5F7] rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-[#1D1D1F]">{selectedSupplier.quality_rate || 0}%</p>
                <p className="text-xs text-[#86868B]">คุณภาพผ่าน</p>
              </div>
            </div>

            {/* Notes */}
            {selectedSupplier.notes && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                <p className="text-sm text-yellow-800">{selectedSupplier.notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t border-[#E8E8ED]">
              <Button variant="secondary" onClick={() => setSelectedSupplier(null)} className="flex-1">
                ปิด
              </Button>
              <Button className="flex-1">
                <Plus className="w-4 h-4 mr-2" />
                สร้าง PO
              </Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}

