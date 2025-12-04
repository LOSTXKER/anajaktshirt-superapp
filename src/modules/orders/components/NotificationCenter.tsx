'use client';

import { useState } from 'react';
import { Card, Button, Input, Modal, useToast } from '@/modules/shared/ui';
import {
  Bell,
  Send,
  MessageCircle,
  Mail,
  Smartphone,
  CheckCircle2,
  Clock,
  XCircle,
  Settings,
  History,
  Play,
  AlertCircle,
} from 'lucide-react';
import type { Order, NotificationType } from '../types';

interface NotificationCenterProps {
  order: Order;
  notifications?: NotificationLog[];
  onSendNotification?: (type: NotificationType, channel: string, message: string) => Promise<boolean>;
}

interface NotificationLog {
  id: string;
  type: NotificationType;
  channel: 'line' | 'sms' | 'email';
  recipient: string;
  message: string;
  status: 'pending' | 'sent' | 'failed';
  sent_at: string | null;
  created_at: string;
}

const NOTIFICATION_TEMPLATES: Record<NotificationType, {
  label: string;
  icon: typeof Bell;
  color: string;
  defaultMessage: (order: Order) => string;
}> = {
  order_created: {
    label: 'สร้างออเดอร์',
    icon: Bell,
    color: 'text-blue-600',
    defaultMessage: (o) => `🎉 ออเดอร์ ${o.order_number} ถูกสร้างเรียบร้อยแล้ว\nยอดรวม: ฿${o.total_amount.toLocaleString()}\nขอบคุณที่ใช้บริการ Anajak Shirt`,
  },
  payment_received: {
    label: 'รับชำระเงิน',
    icon: CheckCircle2,
    color: 'text-green-600',
    defaultMessage: (o) => `✅ ได้รับการชำระเงินสำหรับออเดอร์ ${o.order_number} เรียบร้อยแล้ว\nยอดชำระ: ฿${o.paid_amount.toLocaleString()}\nขอบคุณครับ/ค่ะ`,
  },
  design_uploaded: {
    label: 'อัปโหลดแบบ',
    icon: Bell,
    color: 'text-purple-600',
    defaultMessage: (o) => `🎨 งานออกแบบสำหรับออเดอร์ ${o.order_number} พร้อมให้ตรวจสอบแล้ว\nกรุณาตรวจสอบและแจ้งกลับด้วยนะครับ/ค่ะ`,
  },
  mockup_ready: {
    label: 'Mockup พร้อม',
    icon: Bell,
    color: 'text-indigo-600',
    defaultMessage: (o) => `👕 Mockup สำหรับออเดอร์ ${o.order_number} พร้อมให้ตรวจสอบแล้ว\nกรุณาอนุมัติหรือแจ้งแก้ไขได้เลยครับ/ค่ะ`,
  },
  mockup_approved: {
    label: 'อนุมัติ Mockup',
    icon: CheckCircle2,
    color: 'text-green-600',
    defaultMessage: (o) => `✅ Mockup ออเดอร์ ${o.order_number} ได้รับการอนุมัติแล้ว\nเราจะเริ่มผลิตโดยเร็วที่สุด`,
  },
  production_started: {
    label: 'เริ่มผลิต',
    icon: Play,
    color: 'text-orange-600',
    defaultMessage: (o) => `🏭 ออเดอร์ ${o.order_number} เริ่มเข้าสู่กระบวนการผลิตแล้ว\nกำหนดส่ง: ${o.due_date ? new Date(o.due_date).toLocaleDateString('th-TH') : 'ยังไม่ระบุ'}`,
  },
  production_completed: {
    label: 'ผลิตเสร็จ',
    icon: CheckCircle2,
    color: 'text-emerald-600',
    defaultMessage: (o) => `✅ ออเดอร์ ${o.order_number} ผลิตเสร็จเรียบร้อยแล้ว\nกำลังตรวจสอบคุณภาพก่อนจัดส่ง`,
  },
  qc_passed: {
    label: 'ผ่าน QC',
    icon: CheckCircle2,
    color: 'text-green-600',
    defaultMessage: (o) => `✅ ออเดอร์ ${o.order_number} ผ่านการตรวจสอบคุณภาพแล้ว\nพร้อมจัดส่งให้ลูกค้า`,
  },
  ready_to_ship: {
    label: 'พร้อมส่ง',
    icon: Bell,
    color: 'text-cyan-600',
    defaultMessage: (o) => `📦 ออเดอร์ ${o.order_number} พร้อมจัดส่งแล้ว\nกรุณาชำระยอดคงเหลือ (ถ้ามี) เพื่อดำเนินการจัดส่ง`,
  },
  shipped: {
    label: 'จัดส่งแล้ว',
    icon: Send,
    color: 'text-blue-600',
    defaultMessage: (o) => `🚚 ออเดอร์ ${o.order_number} จัดส่งแล้ว!\nTracking: ${o.tracking_number || 'รอแจ้ง'}\nประมาณ 1-3 วันทำการถึงปลายทาง`,
  },
  delivered: {
    label: 'ส่งถึงแล้ว',
    icon: CheckCircle2,
    color: 'text-green-600',
    defaultMessage: (o) => `🎉 ออเดอร์ ${o.order_number} ถึงมือลูกค้าเรียบร้อยแล้ว\nขอบคุณที่ใช้บริการ Anajak Shirt ครับ/ค่ะ`,
  },
  reminder_payment: {
    label: 'เตือนชำระเงิน',
    icon: AlertCircle,
    color: 'text-yellow-600',
    defaultMessage: (o) => `💳 เตือน: ออเดอร์ ${o.order_number} ยังรอการชำระเงิน\nยอดค้างชำระ: ฿${(o.total_amount - o.paid_amount).toLocaleString()}\nกรุณาชำระเงินเพื่อดำเนินการต่อไป`,
  },
  reminder_mockup_approval: {
    label: 'เตือนอนุมัติ',
    icon: AlertCircle,
    color: 'text-yellow-600',
    defaultMessage: (o) => `⏰ เตือน: Mockup ออเดอร์ ${o.order_number} รอการอนุมัติ\nกรุณาตรวจสอบและอนุมัติเพื่อเริ่มผลิต`,
  },
};

const CHANNEL_CONFIG = {
  line: { label: 'LINE', icon: MessageCircle, color: 'text-green-500', bg: 'bg-green-100' },
  sms: { label: 'SMS', icon: Smartphone, color: 'text-blue-500', bg: 'bg-blue-100' },
  email: { label: 'Email', icon: Mail, color: 'text-purple-500', bg: 'bg-purple-100' },
};

export function NotificationCenter({ order, notifications = [], onSendNotification }: NotificationCenterProps) {
  const { success, error: showError } = useToast();
  const [selectedType, setSelectedType] = useState<NotificationType | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<'line' | 'sms' | 'email'>('line');
  const [customMessage, setCustomMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const handleTypeSelect = (type: NotificationType) => {
    setSelectedType(type);
    setCustomMessage(NOTIFICATION_TEMPLATES[type].defaultMessage(order));
  };

  const handleSend = async () => {
    if (!selectedType) return;
    
    setSending(true);
    try {
      if (onSendNotification) {
        const result = await onSendNotification(selectedType, selectedChannel, customMessage);
        if (result) {
          success('ส่งการแจ้งเตือนเรียบร้อย');
          setSelectedType(null);
          setCustomMessage('');
        } else {
          showError('ไม่สามารถส่งการแจ้งเตือนได้');
        }
      } else {
        // Mock send
        await new Promise(resolve => setTimeout(resolve, 1000));
        success('ส่งการแจ้งเตือนเรียบร้อย (Demo)');
        setSelectedType(null);
        setCustomMessage('');
      }
    } catch (err) {
      showError('เกิดข้อผิดพลาด');
    } finally {
      setSending(false);
    }
  };

  const getRecipient = () => {
    switch (selectedChannel) {
      case 'line':
        return order.customer_line_id || 'ไม่มี LINE ID';
      case 'sms':
        return order.customer_phone || 'ไม่มีเบอร์โทร';
      case 'email':
        return order.customer_email || 'ไม่มี Email';
    }
  };

  const canSend = () => {
    switch (selectedChannel) {
      case 'line':
        return !!order.customer_line_id;
      case 'sms':
        return !!order.customer_phone;
      case 'email':
        return !!order.customer_email;
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Send Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(['order_created', 'payment_received', 'shipped', 'reminder_payment'] as NotificationType[]).map((type) => {
          const template = NOTIFICATION_TEMPLATES[type];
          const Icon = template.icon;
          
          return (
            <button
              key={type}
              onClick={() => handleTypeSelect(type)}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedType === type
                  ? 'bg-blue-50 border-blue-500 text-blue-600'
                  : 'bg-white border-[#E8E8ED] hover:border-[#007AFF] text-[#86868B] hover:text-[#007AFF]'
              }`}
            >
              <Icon className={`w-6 h-6 mx-auto mb-2 ${template.color}`} />
              <p className="text-sm font-medium">{template.label}</p>
            </button>
          );
        })}
      </div>

      {/* All Notification Types */}
      <Card className="p-6 bg-white border border-[#E8E8ED]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#1D1D1F]">แจ้งเตือนลูกค้า</h3>
          <Button variant="secondary" size="sm" onClick={() => setShowHistory(true)}>
            <History className="w-4 h-4 mr-2" />
            ประวัติ
          </Button>
        </div>

        {/* Notification Type Grid */}
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-6">
          {(Object.keys(NOTIFICATION_TEMPLATES) as NotificationType[]).map((type) => {
            const template = NOTIFICATION_TEMPLATES[type];
            const Icon = template.icon;
            const isSelected = selectedType === type;
            
            return (
              <button
                key={type}
                onClick={() => handleTypeSelect(type)}
                className={`p-3 rounded-lg text-center transition-all ${
                  isSelected
                    ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-500'
                    : 'bg-[#F5F5F7] text-[#86868B] hover:bg-[#E8E8ED]'
                }`}
              >
                <Icon className={`w-5 h-5 mx-auto mb-1 ${isSelected ? '' : template.color}`} />
                <p className="text-xs font-medium truncate">{template.label}</p>
              </button>
            );
          })}
        </div>

        {/* Channel Selection */}
        {selectedType && (
          <>
            <div className="mb-4">
              <p className="text-sm text-[#86868B] mb-2">ช่องทางส่ง</p>
              <div className="flex gap-2">
                {(Object.keys(CHANNEL_CONFIG) as Array<keyof typeof CHANNEL_CONFIG>).map((channel) => {
                  const config = CHANNEL_CONFIG[channel];
                  const Icon = config.icon;
                  const isSelected = selectedChannel === channel;
                  
                  return (
                    <button
                      key={channel}
                      onClick={() => setSelectedChannel(channel)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                        isSelected
                          ? `${config.bg} ${config.color} ring-2 ring-offset-2 ring-current`
                          : 'bg-white border border-[#E8E8ED] text-[#86868B] hover:border-[#007AFF]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recipient */}
            <div className="mb-4 p-3 bg-[#F5F5F7] rounded-lg">
              <p className="text-sm text-[#86868B]">ผู้รับ</p>
              <p className={`font-medium ${canSend() ? 'text-[#1D1D1F]' : 'text-red-500'}`}>
                {getRecipient()}
              </p>
            </div>

            {/* Message Editor */}
            <div className="mb-4">
              <p className="text-sm text-[#86868B] mb-2">ข้อความ</p>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 bg-[#F5F5F7] border border-[#E8E8ED] rounded-xl text-[#1D1D1F] resize-none focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                placeholder="พิมพ์ข้อความ..."
              />
              <p className="text-xs text-[#86868B] mt-1">{customMessage.length} ตัวอักษร</p>
            </div>

            {/* Send Button */}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setSelectedType(null)}>
                ยกเลิก
              </Button>
              <Button 
                onClick={handleSend} 
                disabled={!canSend() || sending || !customMessage.trim()}
              >
                {sending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    กำลังส่ง...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    ส่งการแจ้งเตือน
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </Card>

      {/* Notification History Modal */}
      <Modal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        title="ประวัติการแจ้งเตือน"
        size="lg"
      >
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-[#86868B]">
              <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>ยังไม่มีประวัติการแจ้งเตือน</p>
            </div>
          ) : (
            notifications.map((notif) => {
              const template = NOTIFICATION_TEMPLATES[notif.type];
              const channelConfig = CHANNEL_CONFIG[notif.channel];
              const ChannelIcon = channelConfig.icon;
              
              return (
                <div key={notif.id} className="p-4 bg-[#F5F5F7] rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`${template.color} font-medium`}>{template.label}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${channelConfig.bg} ${channelConfig.color}`}>
                        <ChannelIcon className="w-3 h-3 inline mr-1" />
                        {channelConfig.label}
                      </span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      notif.status === 'sent' ? 'bg-green-100 text-green-600' :
                      notif.status === 'failed' ? 'bg-red-100 text-red-600' :
                      'bg-yellow-100 text-yellow-600'
                    }`}>
                      {notif.status === 'sent' ? 'ส่งแล้ว' :
                       notif.status === 'failed' ? 'ล้มเหลว' : 'รอส่ง'}
                    </span>
                  </div>
                  <p className="text-sm text-[#1D1D1F] whitespace-pre-wrap">{notif.message}</p>
                  <div className="flex items-center justify-between mt-2 text-xs text-[#86868B]">
                    <span>ถึง: {notif.recipient}</span>
                    <span>{new Date(notif.created_at).toLocaleString('th-TH')}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Modal>
    </div>
  );
}

export default NotificationCenter;

