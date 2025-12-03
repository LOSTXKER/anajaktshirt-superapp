import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// API สำหรับทดสอบส่งข้อความ LINE
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetId, message } = body;

    if (!targetId) {
      return NextResponse.json({ success: false, error: 'กรุณาระบุ User ID หรือ Group ID' }, { status: 400 });
    }

    // ดึง LINE Config จาก Database
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: lineConfig, error: configError } = await supabase
      .from('line_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (configError || !lineConfig) {
      return NextResponse.json({ 
        success: false, 
        error: 'ไม่พบการตั้งค่า LINE หรือยังไม่ได้เปิดใช้งาน' 
      }, { status: 400 });
    }

    if (!lineConfig.channel_access_token) {
      return NextResponse.json({ 
        success: false, 
        error: 'ยังไม่ได้ตั้งค่า Channel Access Token' 
      }, { status: 400 });
    }

    // ส่งข้อความทดสอบ
    const testMessage = message || `🧪 ทดสอบจาก Anajak Superapp\n\n✅ การเชื่อมต่อสำเร็จ!\n⏰ ${new Date().toLocaleString('th-TH')}`;

    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lineConfig.channel_access_token}`,
      },
      body: JSON.stringify({
        to: targetId,
        messages: [
          {
            type: 'text',
            text: testMessage,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('LINE API Error:', errorData);
      
      // แปล Error message
      let errorMessage = 'ไม่สามารถส่งข้อความได้';
      if (errorData.message?.includes('Invalid reply token')) {
        errorMessage = 'Token ไม่ถูกต้อง';
      } else if (errorData.message?.includes('not found')) {
        errorMessage = 'ไม่พบ User/Group ID นี้ (ตรวจสอบว่า Bot อยู่ในกลุ่มหรือเป็นเพื่อนกับ User)';
      } else if (errorData.details?.[0]?.message) {
        errorMessage = errorData.details[0].message;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
      
      return NextResponse.json({ 
        success: false, 
        error: errorMessage,
        details: errorData
      }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'ส่งข้อความทดสอบสำเร็จ! ตรวจสอบ LINE ได้เลย' 
    });

  } catch (error: any) {
    console.error('Test LINE Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'เกิดข้อผิดพลาด' 
    }, { status: 500 });
  }
}

