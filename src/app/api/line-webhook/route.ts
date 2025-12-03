import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// LINE Webhook handler - ใช้รับ Group ID
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('=== LINE Webhook Event ===');
    console.log(JSON.stringify(body, null, 2));
    
    // วน loop ดู events
    for (const event of body.events || []) {
      const source = event.source;
      
      // ถ้าเป็นข้อความจากกลุ่ม
      if (source?.type === 'group') {
        console.log('📢 GROUP ID:', source.groupId);
        
        // ตอบกลับ Group ID
        const lineConfig = await getLineConfig();
        if (lineConfig) {
          await replyMessage(
            lineConfig.channel_access_token,
            event.replyToken,
            `✅ Group ID ของกลุ่มนี้คือ:\n\n${source.groupId}\n\nคัดลอกไปใส่ในหน้า Settings ได้เลย!`
          );
        }
      }
      
      // ถ้าเป็นข้อความจาก User
      if (source?.type === 'user') {
        console.log('👤 USER ID:', source.userId);
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ดึง LINE Config จาก Database
async function getLineConfig() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const { data } = await supabase
    .from('line_config')
    .select('*')
    .eq('is_active', true)
    .single();
    
  return data;
}

// ตอบกลับข้อความ
async function replyMessage(token: string, replyToken: string, message: string) {
  await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: 'text', text: message }],
    }),
  });
}

// Verify webhook (LINE จะเรียกเพื่อ verify)
export async function GET() {
  return NextResponse.json({ status: 'OK' });
}

