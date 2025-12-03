'use client';

import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Dropdown, Modal, ModalFooter, useToast } from '@/modules/shared/ui';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Search,
  Mail,
  Phone,
  Star,
  TrendingUp,
  UserPlus,
  MessageSquare,
  ChevronRight,
  Building2,
  User,
  Check,
  MapPin
} from 'lucide-react';
import { useCustomers, useCustomerStats } from '@/modules/crm/hooks/useCustomers';
import { useCustomerMutations } from '@/modules/crm/hooks/useCustomerMutations';
import { 
  CUSTOMER_TIER_CONFIG, 
  CUSTOMER_STATUS_CONFIG,
  PAYMENT_TERMS_CONFIG,
  PROVINCES,
  Customer,
  CustomerTier,
  CustomerType,
  PaymentTerms
} from '@/modules/crm/types';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function CRMPage() {
  const { customers, loading, refresh } = useCustomers();
  const { stats } = useCustomerStats();
  const { createCustomer, updateCustomer, loading: mutating } = useCustomerMutations();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [form, setForm] = useState({
    name: '',
    type: 'company' as CustomerType,
    contact_name: '',
    email: '',
    phone: '',
    line_id: '',
    address: '',
    district: '',
    province: '',
    postal_code: '',
    tax_id: '',
    credit_limit: 0,
    payment_terms: 'cash' as PaymentTerms,
    notes: '',
  });

  const filteredCustomers = customers.filter(customer => {
    if (search) {
      const s = search.toLowerCase();
      if (!customer.name.toLowerCase().includes(s) && 
          !customer.code.toLowerCase().includes(s) &&
          !(customer.contact_name?.toLowerCase().includes(s))) {
        return false;
      }
    }
    if (tierFilter && customer.tier !== tierFilter) return false;
    return true;
  });

  const handleCreate = async () => {
    if (!form.name) return;
    
    const result = await createCustomer(form);
    
    if (result.success) {
      toast.success('เพิ่มลูกค้าสำเร็จ', `เพิ่ม ${form.name} เรียบร้อยแล้ว`);
      setIsAddModalOpen(false);
      setForm({
        name: '',
        type: 'company',
        contact_name: '',
        email: '',
        phone: '',
        line_id: '',
        address: '',
        district: '',
        province: '',
        postal_code: '',
        tax_id: '',
        credit_limit: 0,
        payment_terms: 'cash',
        notes: '',
      });
      refresh();
    } else {
      toast.error('เกิดข้อผิดพลาด', result.error || 'ไม่สามารถเพิ่มลูกค้าได้');
    }
  };

  const openDetailModal = (customer: any) => {
    setSelectedCustomer(customer);
    setIsDetailModalOpen(true);
  };

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
              <div className="w-10 h-10 rounded-xl bg-[#5AC8FA]/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-[#5AC8FA]" />
              </div>
              <h1 className="text-[28px] font-semibold text-[#1D1D1F]">ลูกค้าสัมพันธ์</h1>
            </div>
            <p className="text-[#86868B]">จัดการลูกค้า ติดตามการสื่อสาร และขยายธุรกิจ</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <Mail className="w-4 h-4" />
              ส่งแคมเปญ
            </Button>
            <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              เพิ่มลูกค้า
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          <motion.div variants={item}>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[13px] font-medium text-[#86868B]">ลูกค้าทั้งหมด</p>
                    <p className="text-[28px] font-semibold text-[#1D1D1F] mt-1">{stats.total}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#007AFF]/10">
                    <Users className="w-5 h-5 text-[#007AFF]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={item}>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[13px] font-medium text-[#86868B]">ใช้งานอยู่</p>
                    <p className="text-[28px] font-semibold text-[#1D1D1F] mt-1">{stats.active}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#34C759]/10">
                    <TrendingUp className="w-5 h-5 text-[#34C759]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={item}>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[13px] font-medium text-[#86868B]">ลูกค้าใหม่เดือนนี้</p>
                    <p className="text-[28px] font-semibold text-[#1D1D1F] mt-1">{stats.newThisMonth}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#5AC8FA]/10">
                    <UserPlus className="w-5 h-5 text-[#5AC8FA]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={item}>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[13px] font-medium text-[#86868B]">ยอดรวมทั้งหมด</p>
                    <p className="text-[28px] font-semibold text-[#1D1D1F] mt-1">฿{stats.totalRevenue.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#AF52DE]/10">
                    <TrendingUp className="w-5 h-5 text-[#AF52DE]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Tier breakdown */}
        <Card className="!p-4">
          <div className="flex items-center gap-6">
            <span className="text-[13px] text-[#86868B]">ลูกค้าตามระดับ:</span>
            <div className="flex items-center gap-4">
              {Object.entries(stats.byTier).map(([tier, count]) => {
                const config = CUSTOMER_TIER_CONFIG[tier as CustomerTier];
                return (
                  <div key={tier} className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${config.bgColor}`} />
                    <span className="text-[13px] text-[#1D1D1F]">{config.label}: <strong>{count}</strong></span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Filters */}
        <Card className="!p-4 !shadow-none border border-[#E8E8ED]">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B] z-10" />
              <input
                type="text"
                placeholder="ค้นหาลูกค้า..."
                className="w-full h-11 pl-11 pr-4 rounded-xl bg-[#F5F5F7] text-[15px] text-[#1D1D1F] border-0 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#007AFF]/30 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Dropdown
              options={[
                { value: '', label: 'ทุกระดับ' },
                { value: 'platinum', label: '💎 แพลทินัม' },
                { value: 'gold', label: '🥇 ทอง' },
                { value: 'silver', label: '🥈 เงิน' },
                { value: 'bronze', label: '🥉 ทองแดง' },
              ]}
              value={tierFilter}
              onChange={setTierFilter}
              placeholder="ทุกระดับ"
              className="w-full sm:w-44"
            />
          </div>
        </Card>

        {/* Customer List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle>รายชื่อลูกค้า</CardTitle>
              <CardDescription>จัดการและดูข้อมูลลูกค้าทั้งหมด</CardDescription>
            </div>
            <Badge variant="secondary">{filteredCustomers.length} ลูกค้า</Badge>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center min-h-[300px]">
                <div className="w-10 h-10 rounded-full border-4 border-[#E8E8ED] border-t-[#007AFF] animate-spin" />
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
                <Users className="w-12 h-12 text-[#D2D2D7] mb-3" />
                <p className="font-medium text-[#1D1D1F]">ยังไม่มีลูกค้า</p>
                <p className="text-[13px] text-[#86868B] mb-4">เริ่มเพิ่มลูกค้าใหม่</p>
                <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  เพิ่มลูกค้า
                </Button>
              </div>
            ) : (
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-4"
              >
                {filteredCustomers.map((customer) => {
                  const tierConfig = CUSTOMER_TIER_CONFIG[customer.tier];
                  const statusConfig = CUSTOMER_STATUS_CONFIG[customer.status];
                  
                  return (
                    <motion.div 
                      key={customer.id}
                      variants={item}
                      onClick={() => openDetailModal(customer)}
                      className="group flex items-center gap-4 p-4 rounded-xl border border-[#E8E8ED] hover:border-[#D2D2D7] hover:shadow-md transition-all bg-white cursor-pointer"
                    >
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#00D4FF] flex items-center justify-center text-white font-bold shadow-lg shadow-[#007AFF]/20">
                        {customer.name.charAt(0)}
                      </div>
                      
                      {/* Main Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-[#1D1D1F]">{customer.name}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${tierConfig.bgColor} ${tierConfig.color}`}>
                            {tierConfig.label}
                          </span>
                          {customer.status !== 'active' && (
                            <Badge variant="secondary" size="sm">{statusConfig.label}</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[13px] text-[#86868B]">
                          <span className="font-mono">{customer.code}</span>
                          {customer.contact_name && (
                            <>
                              <span>•</span>
                              <span>{customer.contact_name}</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Contact Info */}
                      <div className="hidden md:flex items-center gap-6">
                        {customer.email && (
                          <div className="flex items-center gap-2 text-[#86868B]">
                            <Mail className="w-4 h-4" />
                            <span className="text-[13px]">{customer.email}</span>
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center gap-2 text-[#86868B]">
                            <Phone className="w-4 h-4" />
                            <span className="text-[13px]">{customer.phone}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Stats */}
                      <div className="hidden lg:flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-[13px] font-medium text-[#86868B]">ออเดอร์</p>
                          <p className="text-[17px] font-semibold text-[#1D1D1F]">{customer.total_orders}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[13px] font-medium text-[#86868B]">ยอดรวม</p>
                          <p className="text-[17px] font-semibold text-[#1D1D1F]">฿{customer.total_spent.toLocaleString()}</p>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                          <Star className="w-4 h-4 text-[#86868B]" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                          <ChevronRight className="w-4 h-4 text-[#86868B]" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Customer Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="เพิ่มลูกค้าใหม่"
        size="lg"
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {/* Customer Type */}
          <div>
            <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">ประเภทลูกค้า</label>
            <div className="flex gap-3">
              <button
                onClick={() => setForm(f => ({ ...f, type: 'company' }))}
                className={`flex-1 p-3 rounded-xl border-2 flex items-center gap-3 transition-all ${
                  form.type === 'company' ? 'border-[#007AFF] bg-[#007AFF]/10' : 'border-[#E8E8ED]'
                }`}
              >
                <Building2 className={`w-5 h-5 ${form.type === 'company' ? 'text-[#007AFF]' : 'text-[#86868B]'}`} />
                <span className={`font-medium ${form.type === 'company' ? 'text-[#007AFF]' : 'text-[#1D1D1F]'}`}>บริษัท/ร้านค้า</span>
              </button>
              <button
                onClick={() => setForm(f => ({ ...f, type: 'individual' }))}
                className={`flex-1 p-3 rounded-xl border-2 flex items-center gap-3 transition-all ${
                  form.type === 'individual' ? 'border-[#007AFF] bg-[#007AFF]/10' : 'border-[#E8E8ED]'
                }`}
              >
                <User className={`w-5 h-5 ${form.type === 'individual' ? 'text-[#007AFF]' : 'text-[#86868B]'}`} />
                <span className={`font-medium ${form.type === 'individual' ? 'text-[#007AFF]' : 'text-[#1D1D1F]'}`}>บุคคลทั่วไป</span>
              </button>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">
              {form.type === 'company' ? 'ชื่อบริษัท/ร้านค้า' : 'ชื่อ-นามสกุล'} <span className="text-[#FF3B30]">*</span>
            </label>
            <input
              type="text"
              placeholder={form.type === 'company' ? 'บริษัท ABC จำกัด' : 'คุณสมชาย ใจดี'}
              className="w-full h-11 px-4 rounded-xl bg-white border border-[#D2D2D7] text-[15px] text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 focus:border-[#007AFF]"
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">ผู้ติดต่อ</label>
              <input
                type="text"
                placeholder="คุณสมชาย"
                className="w-full h-11 px-4 rounded-xl bg-white border border-[#D2D2D7] text-[15px] text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 focus:border-[#007AFF]"
                value={form.contact_name}
                onChange={(e) => setForm(f => ({ ...f, contact_name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">เบอร์โทร</label>
              <input
                type="tel"
                placeholder="08x-xxx-xxxx"
                className="w-full h-11 px-4 rounded-xl bg-white border border-[#D2D2D7] text-[15px] text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 focus:border-[#007AFF]"
                value={form.phone}
                onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">อีเมล</label>
              <input
                type="email"
                placeholder="email@example.com"
                className="w-full h-11 px-4 rounded-xl bg-white border border-[#D2D2D7] text-[15px] text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 focus:border-[#007AFF]"
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">LINE ID</label>
              <input
                type="text"
                placeholder="@lineid"
                className="w-full h-11 px-4 rounded-xl bg-white border border-[#D2D2D7] text-[15px] text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 focus:border-[#007AFF]"
                value={form.line_id}
                onChange={(e) => setForm(f => ({ ...f, line_id: e.target.value }))}
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">ที่อยู่</label>
            <textarea
              placeholder="123/45 ถนน..."
              className="w-full h-20 px-4 py-3 rounded-xl bg-white border border-[#D2D2D7] text-[15px] text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 focus:border-[#007AFF] resize-none"
              value={form.address}
              onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">เขต/อำเภอ</label>
              <input
                type="text"
                placeholder="บางรัก"
                className="w-full h-11 px-4 rounded-xl bg-white border border-[#D2D2D7] text-[15px] text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 focus:border-[#007AFF]"
                value={form.district}
                onChange={(e) => setForm(f => ({ ...f, district: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">จังหวัด</label>
              <Dropdown
                options={[{ value: '', label: 'เลือกจังหวัด' }, ...PROVINCES.map(p => ({ value: p, label: p }))]}
                value={form.province}
                onChange={(val) => setForm(f => ({ ...f, province: val }))}
                placeholder="เลือกจังหวัด"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">รหัสไปรษณีย์</label>
              <input
                type="text"
                placeholder="10500"
                className="w-full h-11 px-4 rounded-xl bg-white border border-[#D2D2D7] text-[15px] text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 focus:border-[#007AFF]"
                value={form.postal_code}
                onChange={(e) => setForm(f => ({ ...f, postal_code: e.target.value }))}
              />
            </div>
          </div>

          {/* Business Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">เลขประจำตัวผู้เสียภาษี</label>
              <input
                type="text"
                placeholder="0123456789012"
                className="w-full h-11 px-4 rounded-xl bg-white border border-[#D2D2D7] text-[15px] text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 focus:border-[#007AFF]"
                value={form.tax_id}
                onChange={(e) => setForm(f => ({ ...f, tax_id: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">เงื่อนไขการชำระเงิน</label>
              <Dropdown
                options={Object.entries(PAYMENT_TERMS_CONFIG).map(([key, val]) => ({ value: key, label: val.label }))}
                value={form.payment_terms}
                onChange={(val) => setForm(f => ({ ...f, payment_terms: val as PaymentTerms }))}
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">วงเงินเครดิต (บาท)</label>
            <input
              type="number"
              min="0"
              placeholder="0"
              className="w-full h-11 px-4 rounded-xl bg-white border border-[#D2D2D7] text-[15px] text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 focus:border-[#007AFF]"
              value={form.credit_limit || ''}
              onChange={(e) => setForm(f => ({ ...f, credit_limit: parseFloat(e.target.value) || 0 }))}
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">หมายเหตุ</label>
            <textarea
              placeholder="รายละเอียดเพิ่มเติม..."
              className="w-full h-20 px-4 py-3 rounded-xl bg-white border border-[#D2D2D7] text-[15px] text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 focus:border-[#007AFF] resize-none"
              value={form.notes}
              onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>
        </div>

        <ModalFooter>
          <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>ยกเลิก</Button>
          <Button 
            variant="primary" 
            onClick={handleCreate}
            isLoading={mutating}
            disabled={!form.name}
          >
            <Check className="w-4 h-4 mr-1.5" />
            เพิ่มลูกค้า
          </Button>
        </ModalFooter>
      </Modal>

      {/* Customer Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedCustomer?.name || 'รายละเอียดลูกค้า'}
        size="lg"
      >
        {selectedCustomer && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-[#F5F5F7]">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#00D4FF] flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {selectedCustomer.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-[20px] font-semibold text-[#1D1D1F]">{selectedCustomer.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${CUSTOMER_TIER_CONFIG[selectedCustomer.tier].bgColor} ${CUSTOMER_TIER_CONFIG[selectedCustomer.tier].color}`}>
                    {CUSTOMER_TIER_CONFIG[selectedCustomer.tier].label}
                  </span>
                </div>
                <p className="text-[#86868B] font-mono">{selectedCustomer.code}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#007AFF]/10 text-center">
                <p className="text-[24px] font-bold text-[#007AFF]">{selectedCustomer.total_orders}</p>
                <p className="text-[13px] text-[#86868B]">ออเดอร์ทั้งหมด</p>
              </div>
              <div className="p-4 rounded-xl bg-[#34C759]/10 text-center">
                <p className="text-[24px] font-bold text-[#34C759]">฿{selectedCustomer.total_spent.toLocaleString()}</p>
                <p className="text-[13px] text-[#86868B]">ยอดซื้อรวม</p>
              </div>
              <div className="p-4 rounded-xl bg-[#AF52DE]/10 text-center">
                <p className="text-[24px] font-bold text-[#AF52DE]">฿{selectedCustomer.credit_limit.toLocaleString()}</p>
                <p className="text-[13px] text-[#86868B]">วงเงินเครดิต</p>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              <h4 className="font-semibold text-[#1D1D1F]">ข้อมูลติดต่อ</h4>
              <div className="grid grid-cols-2 gap-3">
                {selectedCustomer.contact_name && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F5F5F7]">
                    <User className="w-4 h-4 text-[#86868B]" />
                    <span className="text-[14px] text-[#1D1D1F]">{selectedCustomer.contact_name}</span>
                  </div>
                )}
                {selectedCustomer.phone && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F5F5F7]">
                    <Phone className="w-4 h-4 text-[#86868B]" />
                    <span className="text-[14px] text-[#1D1D1F]">{selectedCustomer.phone}</span>
                  </div>
                )}
                {selectedCustomer.email && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F5F5F7]">
                    <Mail className="w-4 h-4 text-[#86868B]" />
                    <span className="text-[14px] text-[#1D1D1F]">{selectedCustomer.email}</span>
                  </div>
                )}
                {selectedCustomer.line_id && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F5F5F7]">
                    <MessageSquare className="w-4 h-4 text-[#86868B]" />
                    <span className="text-[14px] text-[#1D1D1F]">{selectedCustomer.line_id}</span>
                  </div>
                )}
              </div>
              {(selectedCustomer.address || selectedCustomer.province) && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-[#F5F5F7]">
                  <MapPin className="w-4 h-4 text-[#86868B] mt-0.5" />
                  <span className="text-[14px] text-[#1D1D1F]">
                    {[selectedCustomer.address, selectedCustomer.district, selectedCustomer.province, selectedCustomer.postal_code].filter(Boolean).join(' ')}
                  </span>
                </div>
              )}
            </div>

            {/* Payment Terms */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-[#E8E8ED]">
              <span className="text-[#86868B]">เงื่อนไขการชำระเงิน</span>
              <Badge variant="secondary">{PAYMENT_TERMS_CONFIG[selectedCustomer.payment_terms].label}</Badge>
            </div>

            {selectedCustomer.notes && (
              <div className="p-4 rounded-xl bg-[#FFF9E6] border border-[#FFE066]">
                <p className="text-[13px] text-[#86868B] mb-1">หมายเหตุ</p>
                <p className="text-[14px] text-[#1D1D1F]">{selectedCustomer.notes}</p>
              </div>
            )}
          </div>
        )}

        <ModalFooter>
          <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>ปิด</Button>
          <Button variant="primary">
            <Plus className="w-4 h-4 mr-1.5" />
            สร้างงานใหม่
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
