import { createClient } from '@/modules/shared/services/supabase-client';
import { NotificationType } from '../types';

interface CreateNotificationInput {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
}

interface LINEConfig {
  channel_access_token: string;
  channel_secret: string | null;
  is_active: boolean;
}

// Notification service
export class NotificationService {
  private supabase = createClient();

  async create(input: CreateNotificationInput): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .insert({
          user_id: input.user_id,
          type: input.type,
          title: input.title,
          message: input.message,
          data: input.data || {},
          sent_via: ['app'],
        });

      if (error) throw error;

      // Check user's notification settings and send via LINE
      const { data: settings } = await this.supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', input.user_id)
        .single();

      if (settings?.line_enabled && settings?.line_user_id) {
        await this.sendLINEMessage(settings.line_user_id, input.title, input.message);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async createForAllAdmins(
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, any>
  ): Promise<void> {
    try {
      // Get all admin users
      const { data: admins } = await this.supabase
        .from('user_profiles')
        .select('id')
        .eq('is_active', true);

      if (admins) {
        for (const admin of admins) {
          await this.create({
            user_id: admin.id,
            type,
            title,
            message,
            data,
          });
        }
      }
    } catch (err) {
      console.error('Error creating notifications for admins:', err);
    }
  }

  async sendLowStockAlert(
    productName: string,
    currentQty: number,
    minLevel: number
  ): Promise<void> {
    await this.createForAllAdmins(
      'low_stock',
      '⚠️ สต๊อกต่ำ',
      `${productName} เหลือ ${currentQty} ชิ้น (ต่ำกว่า ${minLevel})`,
      { productName, currentQty, minLevel }
    );
  }

  async sendJobCompleteAlert(
    userId: string,
    jobNumber: string,
    customerName: string
  ): Promise<void> {
    await this.create({
      user_id: userId,
      type: 'job_complete',
      title: '✅ งานผลิตเสร็จแล้ว',
      message: `งาน ${jobNumber} ของลูกค้า ${customerName} ผลิตเสร็จแล้ว`,
      data: { jobNumber, customerName },
    });
  }

  async sendNewOrderAlert(
    userId: string,
    jobNumber: string,
    customerName: string,
    totalPrice: number
  ): Promise<void> {
    await this.create({
      user_id: userId,
      type: 'new_order',
      title: '🛒 ออเดอร์ใหม่',
      message: `รับออเดอร์ ${jobNumber} จาก ${customerName} มูลค่า ฿${totalPrice.toLocaleString()}`,
      data: { jobNumber, customerName, totalPrice },
    });
  }

  // Get LINE Config from database
  private async getLINEConfig(): Promise<LINEConfig | null> {
    try {
      const { data } = await this.supabase
        .from('line_config')
        .select('*')
        .eq('is_active', true)
        .single();
      
      return data;
    } catch {
      return null;
    }
  }

  // Send message via LINE Messaging API
  private async sendLINEMessage(lineUserId: string, title: string, message: string): Promise<void> {
    try {
      const config = await this.getLINEConfig();
      if (!config) {
        console.error('LINE config not found or inactive');
        return;
      }

      const response = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.channel_access_token}`,
        },
        body: JSON.stringify({
          to: lineUserId,
          messages: [
            {
              type: 'text',
              text: `📢 ${title}\n\n${message}`,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('LINE Messaging API error:', errorData);
      }
    } catch (err) {
      console.error('Error sending LINE message:', err);
    }
  }

  // Send Flex Message (Rich message) via LINE
  async sendLINEFlexMessage(
    lineUserId: string, 
    altText: string, 
    contents: any
  ): Promise<void> {
    try {
      const config = await this.getLINEConfig();
      if (!config) return;

      const response = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.channel_access_token}`,
        },
        body: JSON.stringify({
          to: lineUserId,
          messages: [
            {
              type: 'flex',
              altText,
              contents,
            },
          ],
        }),
      });

      if (!response.ok) {
        console.error('LINE Flex Message error:', await response.json());
      }
    } catch (err) {
      console.error('Error sending LINE flex message:', err);
    }
  }

  // Broadcast message to all users who enabled LINE
  async broadcastLINEMessage(title: string, message: string): Promise<void> {
    try {
      const { data: users } = await this.supabase
        .from('notification_settings')
        .select('line_user_id')
        .eq('line_enabled', true)
        .not('line_user_id', 'is', null);

      if (users) {
        for (const user of users) {
          if (user.line_user_id) {
            await this.sendLINEMessage(user.line_user_id, title, message);
          }
        }
      }
    } catch (err) {
      console.error('Error broadcasting LINE message:', err);
    }
  }
}

export const notificationService = new NotificationService();
