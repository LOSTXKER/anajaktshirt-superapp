'use client';

import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Dropdown, Modal, ModalFooter, useToast } from '@/modules/shared/ui';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Search,
  Shield,
  Mail,
  Phone,
  MoreHorizontal,
  UserCog,
  Check,
  X,
  ChevronDown
} from 'lucide-react';
import { useUsers } from '@/modules/users/hooks/useUsers';
import { useUserMutations } from '@/modules/users/hooks/useUserMutations';
import { DEPARTMENTS } from '@/modules/users/types';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function UsersPage() {
  const { users, roles, loading, refresh } = useUsers();
  const { createUser, updateUser, toggleUserStatus, loading: mutating } = useUserMutations();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Form state
  const [form, setForm] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    department: '',
    role_id: '',
  });

  const filteredUsers = users.filter(user => {
    if (search) {
      const s = search.toLowerCase();
      if (!user.email.toLowerCase().includes(s) && 
          !user.full_name.toLowerCase().includes(s)) {
        return false;
      }
    }
    if (roleFilter && user.role_id !== roleFilter) return false;
    return true;
  });

  const handleCreate = async () => {
    if (!form.email || !form.password || !form.full_name) return;
    
    const result = await createUser(form);
    
    if (result.success) {
      toast.success('สร้างผู้ใช้สำเร็จ', `เพิ่ม ${form.full_name} เรียบร้อยแล้ว`);
      setIsAddModalOpen(false);
      setForm({ email: '', password: '', full_name: '', phone: '', department: '', role_id: '' });
      refresh();
    } else {
      toast.error('เกิดข้อผิดพลาด', result.error || 'ไม่สามารถสร้างผู้ใช้ได้');
    }
  };

  const handleUpdate = async () => {
    if (!selectedUser) return;
    
    const result = await updateUser(selectedUser.id, {
      full_name: form.full_name,
      phone: form.phone || undefined,
      department: form.department || undefined,
      role_id: form.role_id || undefined,
    });
    
    if (result.success) {
      toast.success('อัปเดตสำเร็จ', 'บันทึกข้อมูลเรียบร้อยแล้ว');
      setIsEditModalOpen(false);
      setSelectedUser(null);
      refresh();
    } else {
      toast.error('เกิดข้อผิดพลาด', result.error || 'ไม่สามารถอัปเดตได้');
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    const result = await toggleUserStatus(userId, !currentStatus);
    
    if (result.success) {
      toast.success('อัปเดตสถานะ', currentStatus ? 'ปิดใช้งานแล้ว' : 'เปิดใช้งานแล้ว');
      refresh();
    } else {
      toast.error('เกิดข้อผิดพลาด', result.error || 'ไม่สามารถอัปเดตสถานะได้');
    }
  };

  const openEditModal = (user: any) => {
    setSelectedUser(user);
    setForm({
      email: user.email,
      password: '',
      full_name: user.full_name,
      phone: user.phone || '',
      department: user.department || '',
      role_id: user.role_id || '',
    });
    setIsEditModalOpen(true);
  };

  const getRoleBadgeVariant = (roleName: string) => {
    switch (roleName) {
      case 'super_admin': return 'destructive';
      case 'stock_admin': return 'info';
      case 'production_admin': return 'warning';
      case 'sales_admin': return 'success';
      default: return 'secondary';
    }
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
              <div className="w-10 h-10 rounded-xl bg-[#AF52DE]/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-[#AF52DE]" />
              </div>
              <h1 className="text-[28px] font-semibold text-[#1D1D1F]">จัดการผู้ใช้</h1>
            </div>
            <p className="text-[#86868B]">จัดการบัญชีผู้ใช้และกำหนดสิทธิ์การเข้าถึง</p>
          </div>
          <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            เพิ่มผู้ใช้
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-4 md:grid-cols-4"
        >
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-[#007AFF]/10">
                  <Users className="w-5 h-5 text-[#007AFF]" />
                </div>
                <div>
                  <p className="text-[28px] font-semibold text-[#1D1D1F]">{users.length}</p>
                  <p className="text-[13px] text-[#86868B]">ผู้ใช้ทั้งหมด</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-[#34C759]/10">
                  <Check className="w-5 h-5 text-[#34C759]" />
                </div>
                <div>
                  <p className="text-[28px] font-semibold text-[#1D1D1F]">{users.filter(u => u.is_active).length}</p>
                  <p className="text-[13px] text-[#86868B]">ใช้งานอยู่</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-[#FF3B30]/10">
                  <Shield className="w-5 h-5 text-[#FF3B30]" />
                </div>
                <div>
                  <p className="text-[28px] font-semibold text-[#1D1D1F]">{users.filter(u => u.role?.name === 'super_admin').length}</p>
                  <p className="text-[13px] text-[#86868B]">ผู้ดูแลระบบ</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-[#AF52DE]/10">
                  <UserCog className="w-5 h-5 text-[#AF52DE]" />
                </div>
                <div>
                  <p className="text-[28px] font-semibold text-[#1D1D1F]">{roles.length}</p>
                  <p className="text-[13px] text-[#86868B]">บทบาท</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters */}
        <Card className="!p-4 !shadow-none border border-[#E8E8ED]">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B] z-10" />
              <input
                type="text"
                placeholder="ค้นหาชื่อ, อีเมล..."
                className="w-full h-11 pl-11 pr-4 rounded-xl bg-[#F5F5F7] text-[15px] text-[#1D1D1F] border-0 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#007AFF]/30 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Dropdown
              options={[
                { value: '', label: 'ทุกบทบาท' },
                ...roles.map(r => ({ value: r.id, label: r.display_name }))
              ]}
              value={roleFilter}
              onChange={setRoleFilter}
              placeholder="ทุกบทบาท"
              className="w-full sm:w-48"
            />
          </div>
        </Card>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>รายชื่อผู้ใช้</CardTitle>
            <CardDescription>จัดการบัญชีผู้ใช้งานในระบบ</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center min-h-[300px]">
                <div className="w-10 h-10 rounded-full border-4 border-[#E8E8ED] border-t-[#007AFF] animate-spin" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
                <Users className="w-12 h-12 text-[#D2D2D7] mb-3" />
                <p className="font-medium text-[#1D1D1F]">ไม่พบผู้ใช้</p>
                <p className="text-[13px] text-[#86868B]">ยังไม่มีผู้ใช้ในระบบ</p>
              </div>
            ) : (
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-3"
              >
                {filteredUsers.map((user) => (
                  <motion.div
                    key={user.id}
                    variants={item}
                    className="flex items-center gap-4 p-4 rounded-xl border border-[#E8E8ED] hover:border-[#D2D2D7] hover:shadow-sm transition-all bg-white"
                  >
                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-[#1D1D1F] font-bold shadow-lg ${
                      user.is_active ? 'bg-gradient-to-br from-[#007AFF] to-[#5AC8FA]' : 'bg-[#86868B]'
                    }`}>
                      {user.full_name.charAt(0).toUpperCase()}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-[#1D1D1F]">{user.full_name}</h3>
                        {user.role && (
                          <Badge variant={getRoleBadgeVariant(user.role.name)} size="sm">
                            {user.role.display_name}
                          </Badge>
                        )}
                        {!user.is_active && (
                          <Badge variant="secondary" size="sm">ปิดใช้งาน</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-[13px] text-[#86868B]">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" />
                          {user.email}
                        </span>
                        {user.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" />
                            {user.phone}
                          </span>
                        )}
                        {user.department && (
                          <span className="hidden sm:inline">
                            {DEPARTMENTS.find(d => d.value === user.department)?.label || user.department}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(user)}
                      >
                        แก้ไข
                      </Button>
                      <Button
                        variant={user.is_active ? 'ghost' : 'primary'}
                        size="sm"
                        onClick={() => handleToggleStatus(user.id, user.is_active)}
                      >
                        {user.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="เพิ่มผู้ใช้ใหม่"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">
                อีเมล <span className="text-[#FF3B30]">*</span>
              </label>
              <input
                type="email"
                placeholder="email@example.com"
                className="w-full h-11 px-4 rounded-xl bg-white border border-[#D2D2D7] text-[15px] text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 focus:border-[#007AFF]"
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">
                รหัสผ่าน <span className="text-[#FF3B30]">*</span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full h-11 px-4 rounded-xl bg-white border border-[#D2D2D7] text-[15px] text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 focus:border-[#007AFF]"
                value={form.password}
                onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">
              ชื่อ-นามสกุล <span className="text-[#FF3B30]">*</span>
            </label>
            <input
              type="text"
              placeholder="ชื่อ นามสกุล"
              className="w-full h-11 px-4 rounded-xl bg-white border border-[#D2D2D7] text-[15px] text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 focus:border-[#007AFF]"
              value={form.full_name}
              onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">แผนก</label>
              <Dropdown
                options={[{ value: '', label: 'เลือกแผนก' }, ...DEPARTMENTS]}
                value={form.department}
                onChange={(val) => setForm(f => ({ ...f, department: val }))}
                placeholder="เลือกแผนก"
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">บทบาท</label>
            <Dropdown
              options={[{ value: '', label: 'เลือกบทบาท' }, ...roles.map(r => ({ value: r.id, label: r.display_name }))]}
              value={form.role_id}
              onChange={(val) => setForm(f => ({ ...f, role_id: val }))}
              placeholder="เลือกบทบาท"
              className="w-full"
            />
          </div>
        </div>

        <ModalFooter>
          <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>ยกเลิก</Button>
          <Button 
            variant="primary" 
            onClick={handleCreate}
            isLoading={mutating}
            disabled={!form.email || !form.password || !form.full_name}
          >
            <Check className="w-4 h-4 mr-1.5" />
            สร้างผู้ใช้
          </Button>
        </ModalFooter>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="แก้ไขข้อมูลผู้ใช้"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">อีเมล</label>
            <input
              type="email"
              className="w-full h-11 px-4 rounded-xl bg-[#F5F5F7] border border-[#E8E8ED] text-[15px] text-[#86868B] cursor-not-allowed"
              value={form.email}
              disabled
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">
              ชื่อ-นามสกุล <span className="text-[#FF3B30]">*</span>
            </label>
            <input
              type="text"
              className="w-full h-11 px-4 rounded-xl bg-white border border-[#D2D2D7] text-[15px] text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 focus:border-[#007AFF]"
              value={form.full_name}
              onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">แผนก</label>
              <Dropdown
                options={[{ value: '', label: 'เลือกแผนก' }, ...DEPARTMENTS]}
                value={form.department}
                onChange={(val) => setForm(f => ({ ...f, department: val }))}
                placeholder="เลือกแผนก"
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">บทบาท</label>
            <Dropdown
              options={[{ value: '', label: 'เลือกบทบาท' }, ...roles.map(r => ({ value: r.id, label: r.display_name }))]}
              value={form.role_id}
              onChange={(val) => setForm(f => ({ ...f, role_id: val }))}
              placeholder="เลือกบทบาท"
              className="w-full"
            />
          </div>
        </div>

        <ModalFooter>
          <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>ยกเลิก</Button>
          <Button 
            variant="primary" 
            onClick={handleUpdate}
            isLoading={mutating}
          >
            <Check className="w-4 h-4 mr-1.5" />
            บันทึก
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

