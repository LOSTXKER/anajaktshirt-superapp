'use client';

import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, useToast } from '@/modules/shared/ui';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  User, 
  Bell, 
  MessageSquare,
  Mail,
  Shield,
  Save,
  Check,
  AlertTriangle,
  Package,
  Factory,
  ShoppingCart,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
  Send,
  Loader2
} from 'lucide-react';
import { createClient } from '@/modules/shared/services/supabase-client';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function SettingsPage() {
  const supabase = createClient();
  const toast = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showToken, setShowToken] = useState(false);
  const [testTargetId, setTestTargetId] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [testing, setTesting] = useState(false);
  
  // Profile state
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
    department: '',
  });
  
  // Notification settings state
  const [notifSettings, setNotifSettings] = useState({
    email_enabled: true,
    line_enabled: false,
    line_user_id: '',
    low_stock_alert: true,
    job_complete_alert: true,
    new_order_alert: true,
  });
  
  // LINE config state (admin only)
  const [lineConfig, setLineConfig] = useState({
    channel_access_token: '',
    channel_secret: '',
    is_active: true,
  });
  
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch profile
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*, role:roles(name, display_name)')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile({
          full_name: profileData.full_name || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
          department: profileData.department || '',
        });
        setIsAdmin(profileData.role?.name === 'super_admin');
      }

      // Fetch notification settings
      const { data: notifData } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (notifData) {
        setNotifSettings({
          email_enabled: notifData.email_enabled ?? true,
          line_enabled: notifData.line_enabled ?? false,
          line_user_id: notifData.line_user_id || '',
          low_stock_alert: notifData.low_stock_alert ?? true,
          job_complete_alert: notifData.job_complete_alert ?? true,
          new_order_alert: notifData.new_order_alert ?? true,
        });
      }

      // Fetch LINE config (admin only)
      const { data: lineData } = await supabase
        .from('line_config')
        .select('*')
        .eq('is_active', true)
        .single();

      if (lineData) {
        setLineConfig({
          channel_access_token: lineData.channel_access_token || '',
          channel_secret: lineData.channel_secret || '',
          is_active: lineData.is_active ?? true,
        });
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          department: profile.department,
        })
        .eq('id', user.id);

      if (error) throw error;
      toast.success('บันทึกสำเร็จ', 'อัปเดตข้อมูลโปรไฟล์แล้ว');
    } catch (err: any) {
      toast.error('เกิดข้อผิดพลาด', err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveNotificationSettings = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if settings exist
      const { data: existing } = await supabase
        .from('notification_settings')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('notification_settings')
          .update(notifSettings)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('notification_settings')
          .insert({ user_id: user.id, ...notifSettings });
        if (error) throw error;
      }

      toast.success('บันทึกสำเร็จ', 'อัปเดตการตั้งค่าแจ้งเตือนแล้ว');
    } catch (err: any) {
      toast.error('เกิดข้อผิดพลาด', err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveLINEConfig = async () => {
    setSaving(true);
    try {
      // Check if config exists
      const { data: existing } = await supabase
        .from('line_config')
        .select('id')
        .single();

      if (existing) {
        const { error } = await supabase
          .from('line_config')
          .update({
            channel_access_token: lineConfig.channel_access_token,
            channel_secret: lineConfig.channel_secret,
            is_active: lineConfig.is_active,
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('line_config')
          .insert(lineConfig);
        if (error) throw error;
      }

      toast.success('บันทึกสำเร็จ', 'อัปเดตการตั้งค่า LINE แล้ว');
    } catch (err: any) {
      toast.error('เกิดข้อผิดพลาด', err.message);
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('คัดลอกแล้ว', 'คัดลอกไปยัง Clipboard แล้ว');
  };

  const testLINEMessage = async () => {
    if (!testTargetId) {
      toast.error('กรุณาระบุ ID', 'ใส่ User ID หรือ Group ID ที่ต้องการทดสอบ');
      return;
    }

    setTesting(true);
    try {
      const response = await fetch('/api/line-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetId: testTargetId,
          message: testMessage || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('ส่งสำเร็จ! 🎉', data.message);
      } else {
        toast.error('ส่งไม่สำเร็จ', data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (err: any) {
      toast.error('เกิดข้อผิดพลาด', err.message);
    } finally {
      setTesting(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'โปรไฟล์', icon: User },
    { id: 'notifications', label: 'การแจ้งเตือน', icon: Bell },
    ...(isAdmin ? [{ id: 'line', label: 'LINE API', icon: MessageSquare }] : []),
  ];

  if (loading) {
    return (
      <div className="flex-1 min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-[#E8E8ED] border-t-[#007AFF] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen bg-[#F5F5F7]">
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#86868B]/10 flex items-center justify-center">
              <Settings className="w-5 h-5 text-[#86868B]" />
            </div>
            <h1 className="text-[28px] font-semibold text-[#1D1D1F]">ตั้งค่า</h1>
          </div>
          <p className="text-[#86868B]">จัดการโปรไฟล์และการตั้งค่าระบบ</p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:w-64 flex-shrink-0"
          >
            <Card>
              <CardContent className="p-2">
                <div className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                          activeTab === tab.id
                            ? 'bg-[#007AFF] text-white'
                            : 'text-[#1D1D1F] hover:bg-[#F5F5F7]'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Content */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="flex-1"
          >
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>ข้อมูลโปรไฟล์</CardTitle>
                    <CardDescription>จัดการข้อมูลส่วนตัวของคุณ</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#007AFF] to-[#5AC8FA] flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                        {profile.full_name.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <h3 className="text-[20px] font-semibold text-[#1D1D1F]">{profile.full_name || 'ผู้ใช้งาน'}</h3>
                        <p className="text-[#86868B]">{profile.email}</p>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">ชื่อ-นามสกุล</label>
                        <input
                          type="text"
                          className="w-full h-11 px-4 rounded-xl bg-white border border-[#D2D2D7] text-[15px] text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 focus:border-[#007AFF]"
                          value={profile.full_name}
                          onChange={(e) => setProfile(p => ({ ...p, full_name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">อีเมล</label>
                        <input
                          type="email"
                          className="w-full h-11 px-4 rounded-xl bg-[#F5F5F7] border border-[#E8E8ED] text-[15px] text-[#86868B] cursor-not-allowed"
                          value={profile.email}
                          disabled
                        />
                      </div>
                      <div>
                        <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">เบอร์โทร</label>
                        <input
                          type="tel"
                          placeholder="08x-xxx-xxxx"
                          className="w-full h-11 px-4 rounded-xl bg-white border border-[#D2D2D7] text-[15px] text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 focus:border-[#007AFF]"
                          value={profile.phone}
                          onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">แผนก</label>
                        <input
                          type="text"
                          placeholder="ฝ่ายผลิต"
                          className="w-full h-11 px-4 rounded-xl bg-white border border-[#D2D2D7] text-[15px] text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 focus:border-[#007AFF]"
                          value={profile.department}
                          onChange={(e) => setProfile(p => ({ ...p, department: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button variant="primary" onClick={saveProfile} isLoading={saving}>
                        <Save className="w-4 h-4 mr-2" />
                        บันทึก
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>ช่องทางการแจ้งเตือน</CardTitle>
                    <CardDescription>เลือกวิธีรับการแจ้งเตือน</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Email */}
                    <div className="flex items-center justify-between p-4 rounded-xl border border-[#E8E8ED]">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-[#007AFF]/10">
                          <Mail className="w-5 h-5 text-[#007AFF]" />
                        </div>
                        <div>
                          <p className="font-medium text-[#1D1D1F]">อีเมล</p>
                          <p className="text-[13px] text-[#86868B]">รับแจ้งเตือนทางอีเมล</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={notifSettings.email_enabled}
                          onChange={(e) => setNotifSettings(s => ({ ...s, email_enabled: e.target.checked }))}
                        />
                        <div className="w-11 h-6 bg-[#E8E8ED] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#34C759]"></div>
                      </label>
                    </div>

                    {/* LINE */}
                    <div className="p-4 rounded-xl border border-[#E8E8ED] space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-xl bg-[#00C300]/10">
                            <MessageSquare className="w-5 h-5 text-[#00C300]" />
                          </div>
                          <div>
                            <p className="font-medium text-[#1D1D1F]">LINE</p>
                            <p className="text-[13px] text-[#86868B]">รับแจ้งเตือนทาง LINE</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={notifSettings.line_enabled}
                            onChange={(e) => setNotifSettings(s => ({ ...s, line_enabled: e.target.checked }))}
                          />
                          <div className="w-11 h-6 bg-[#E8E8ED] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#34C759]"></div>
                        </label>
                      </div>
                      
                      {notifSettings.line_enabled && (
                        <div>
                          <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">
                            LINE User ID / Group ID
                            <span className="text-[#86868B] font-normal ml-2">(U... หรือ C...)</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Uxxxx... หรือ Cxxxx..."
                            className="w-full h-11 px-4 rounded-xl bg-white border border-[#D2D2D7] text-[15px] text-[#1D1D1F] font-mono focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 focus:border-[#007AFF]"
                            value={notifSettings.line_user_id}
                            onChange={(e) => setNotifSettings(s => ({ ...s, line_user_id: e.target.value }))}
                          />
                          <div className="mt-2 p-3 rounded-lg bg-[#F5F5F7] text-[12px] text-[#86868B]">
                            <p className="font-medium text-[#1D1D1F] mb-1">วิธีรับ ID:</p>
                            <p>1. เชิญ Bot เข้ากลุ่ม LINE</p>
                            <p>2. ส่งข้อความอะไรก็ได้ในกลุ่ม</p>
                            <p>3. Bot จะตอบกลับ Group ID มาให้</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>ประเภทการแจ้งเตือน</CardTitle>
                    <CardDescription>เลือกแจ้งเตือนที่ต้องการรับ</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Low Stock */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-[#F5F5F7]">
                      <div className="flex items-center gap-3">
                        <Package className="w-5 h-5 text-[#FF9500]" />
                        <div>
                          <p className="font-medium text-[#1D1D1F]">สต๊อกต่ำ</p>
                          <p className="text-[12px] text-[#86868B]">แจ้งเมื่อสินค้าต่ำกว่าจุดสั่งซื้อ</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={notifSettings.low_stock_alert}
                          onChange={(e) => setNotifSettings(s => ({ ...s, low_stock_alert: e.target.checked }))}
                        />
                        <div className="w-11 h-6 bg-[#D2D2D7] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#34C759]"></div>
                      </label>
                    </div>

                    {/* Job Complete */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-[#F5F5F7]">
                      <div className="flex items-center gap-3">
                        <Factory className="w-5 h-5 text-[#34C759]" />
                        <div>
                          <p className="font-medium text-[#1D1D1F]">งานผลิตเสร็จ</p>
                          <p className="text-[12px] text-[#86868B]">แจ้งเมื่องานผลิตเสร็จสิ้น</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={notifSettings.job_complete_alert}
                          onChange={(e) => setNotifSettings(s => ({ ...s, job_complete_alert: e.target.checked }))}
                        />
                        <div className="w-11 h-6 bg-[#D2D2D7] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#34C759]"></div>
                      </label>
                    </div>

                    {/* New Order */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-[#F5F5F7]">
                      <div className="flex items-center gap-3">
                        <ShoppingCart className="w-5 h-5 text-[#007AFF]" />
                        <div>
                          <p className="font-medium text-[#1D1D1F]">ออเดอร์ใหม่</p>
                          <p className="text-[12px] text-[#86868B]">แจ้งเมื่อมีออเดอร์ใหม่เข้ามา</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={notifSettings.new_order_alert}
                          onChange={(e) => setNotifSettings(s => ({ ...s, new_order_alert: e.target.checked }))}
                        />
                        <div className="w-11 h-6 bg-[#D2D2D7] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#34C759]"></div>
                      </label>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button variant="primary" onClick={saveNotificationSettings} isLoading={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    บันทึกการตั้งค่า
                  </Button>
                </div>
              </div>
            )}

            {/* LINE API Tab (Admin Only) */}
            {activeTab === 'line' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>LINE Messaging API</CardTitle>
                        <CardDescription>ตั้งค่าการเชื่อมต่อ LINE สำหรับส่งแจ้งเตือน</CardDescription>
                      </div>
                      <Badge variant={lineConfig.is_active ? 'success' : 'secondary'} dot>
                        {lineConfig.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Status Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-[#F5F5F7]">
                      <div>
                        <p className="font-medium text-[#1D1D1F]">เปิดใช้งาน LINE Messaging</p>
                        <p className="text-[13px] text-[#86868B]">เปิด/ปิดการส่งแจ้งเตือนผ่าน LINE</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={lineConfig.is_active}
                          onChange={(e) => setLineConfig(c => ({ ...c, is_active: e.target.checked }))}
                        />
                        <div className="w-11 h-6 bg-[#D2D2D7] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#34C759]"></div>
                      </label>
                    </div>

                    {/* Channel Access Token */}
                    <div>
                      <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">
                        Channel Access Token
                      </label>
                      <div className="relative">
                        <input
                          type={showToken ? 'text' : 'password'}
                          placeholder="ใส่ Channel Access Token"
                          className="w-full h-11 px-4 pr-24 rounded-xl bg-white border border-[#D2D2D7] text-[15px] text-[#1D1D1F] font-mono focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 focus:border-[#007AFF]"
                          value={lineConfig.channel_access_token}
                          onChange={(e) => setLineConfig(c => ({ ...c, channel_access_token: e.target.value }))}
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setShowToken(!showToken)}
                            className="p-2 text-[#86868B] hover:text-[#1D1D1F]"
                          >
                            {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(lineConfig.channel_access_token)}
                            className="p-2 text-[#86868B] hover:text-[#1D1D1F]"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Channel Secret */}
                    <div>
                      <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">
                        Channel Secret <span className="text-[#86868B] font-normal">(ไม่บังคับ)</span>
                      </label>
                      <input
                        type="password"
                        placeholder="ใส่ Channel Secret"
                        className="w-full h-11 px-4 rounded-xl bg-white border border-[#D2D2D7] text-[15px] text-[#1D1D1F] font-mono focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 focus:border-[#007AFF]"
                        value={lineConfig.channel_secret}
                        onChange={(e) => setLineConfig(c => ({ ...c, channel_secret: e.target.value }))}
                      />
                    </div>

                    {/* Help Link */}
                    <div className="p-4 rounded-xl bg-[#007AFF]/5 border border-[#007AFF]/20">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-[#007AFF] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-[#1D1D1F]">วิธีรับ Token</p>
                          <p className="text-[13px] text-[#86868B] mt-1">
                            1. ไปที่ LINE Developers Console<br />
                            2. เลือก Messaging API Channel<br />
                            3. กด Issue ที่ Channel access token
                          </p>
                          <a
                            href="https://developers.line.biz/console/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-3 text-[14px] text-[#007AFF] font-medium hover:underline"
                          >
                            ไปที่ LINE Developers Console
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button variant="primary" onClick={saveLINEConfig} isLoading={saving}>
                        <Save className="w-4 h-4 mr-2" />
                        บันทึกการตั้งค่า LINE
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Test Message Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>🧪 ทดสอบส่งข้อความ</CardTitle>
                    <CardDescription>ทดสอบว่าการเชื่อมต่อ LINE ทำงานถูกต้อง</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">
                        User ID / Group ID ที่ต้องการทดสอบ
                      </label>
                      <input
                        type="text"
                        placeholder="Uxxxx... หรือ Cxxxx..."
                        className="w-full h-11 px-4 rounded-xl bg-white border border-[#D2D2D7] text-[15px] text-[#1D1D1F] font-mono focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 focus:border-[#007AFF]"
                        value={testTargetId}
                        onChange={(e) => setTestTargetId(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">
                        ข้อความทดสอบ <span className="text-[#86868B] font-normal">(ไม่ใส่จะใช้ข้อความเริ่มต้น)</span>
                      </label>
                      <textarea
                        placeholder="ข้อความทดสอบ..."
                        className="w-full h-24 px-4 py-3 rounded-xl bg-white border border-[#D2D2D7] text-[15px] text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 focus:border-[#007AFF] resize-none"
                        value={testMessage}
                        onChange={(e) => setTestMessage(e.target.value)}
                      />
                    </div>

                    <Button 
                      variant="primary" 
                      onClick={testLINEMessage} 
                      disabled={testing || !testTargetId}
                      className="w-full"
                    >
                      {testing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          กำลังส่ง...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          ส่งข้อความทดสอบ
                        </>
                      )}
                    </Button>

                    <div className="p-3 rounded-xl bg-[#FF9500]/10 border border-[#FF9500]/20">
                      <p className="text-[13px] text-[#86868B]">
                        <strong className="text-[#FF9500]">💡 หมายเหตุ:</strong> ถ้าส่งไปกลุ่ม ต้องเชิญ Bot เข้ากลุ่มก่อน
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

