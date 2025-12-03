// Notification Types

export type NotificationType = 'low_stock' | 'job_complete' | 'new_order' | 'system' | 'reminder';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, any>;
  is_read: boolean;
  sent_via: string[];
  created_at: string;
}

export interface NotificationSettings {
  id: string;
  user_id: string;
  email_enabled: boolean;
  line_enabled: boolean;
  line_user_id: string | null; // LINE User ID from LINE Login
  low_stock_alert: boolean;
  job_complete_alert: boolean;
  new_order_alert: boolean;
  created_at: string;
  updated_at: string;
}

export interface LINEConfig {
  id: string;
  channel_access_token: string;
  channel_secret: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const NOTIFICATION_TYPE_CONFIG: Record<NotificationType, { label: string; icon: string; color: string; bgColor: string }> = {
  low_stock: { label: 'สต๊อกต่ำ', icon: '📦', color: 'text-[#FF9500]', bgColor: 'bg-[#FF9500]/10' },
  job_complete: { label: 'งานเสร็จ', icon: '✅', color: 'text-[#34C759]', bgColor: 'bg-[#34C759]/10' },
  new_order: { label: 'ออเดอร์ใหม่', icon: '🛒', color: 'text-[#007AFF]', bgColor: 'bg-[#007AFF]/10' },
  system: { label: 'ระบบ', icon: '⚙️', color: 'text-[#86868B]', bgColor: 'bg-[#86868B]/10' },
  reminder: { label: 'แจ้งเตือน', icon: '🔔', color: 'text-[#AF52DE]', bgColor: 'bg-[#AF52DE]/10' },
};

