# 🗄️ Supabase Setup Guide

## ขั้นตอนการ Setup Supabase สำหรับ Anajak Superapp

### 1. สร้าง Supabase Project

1. ไปที่ [Supabase Dashboard](https://supabase.com/dashboard)
2. คลิก **New Project**
3. ตั้งชื่อ Project: `anajak-superapp`
4. ตั้ง Password สำหรับ Database
5. เลือก Region: `Southeast Asia (Singapore)` (ใกล้ไทยที่สุด)
6. รอสร้าง Project (~2 นาที)

### 2. รัน Database Schema

1. ไปที่ **SQL Editor** ใน Supabase Dashboard
2. คลิก **New Query**
3. Copy เนื้อหาจากไฟล์ `database/supabase-schema.sql`
4. คลิก **Run** เพื่อสร้าง Tables ทั้งหมด

### 3. ตั้งค่า Environment Variables

1. ไปที่ **Project Settings > API**
2. Copy ค่าต่อไปนี้:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

3. สร้างไฟล์ `.env.local` ใน root project:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Setup Storage (สำหรับไฟล์ Design/Mockup)

1. ไปที่ **Storage** ใน Supabase Dashboard
2. สร้าง Bucket ใหม่:
   - **designs** - สำหรับไฟล์ออกแบบ
   - **mockups** - สำหรับรูป Mockup
   - **payment-slips** - สำหรับสลิปชำระเงิน

3. ตั้งค่า Policies สำหรับแต่ละ Bucket:
   - **Select**: Allow authenticated users
   - **Insert**: Allow authenticated users
   - **Update**: Allow authenticated users
   - **Delete**: Allow owner only

### 5. Setup Authentication

1. ไปที่ **Authentication > Providers**
2. เปิดใช้งาน Provider ที่ต้องการ:
   - ✅ Email
   - ✅ Google (optional)
   - ✅ LINE (ต้อง setup LINE Login)

3. ตั้งค่า Site URL:
   - **Site URL**: `http://localhost:3000`
   - **Redirect URLs**: `http://localhost:3000/auth/callback`

### 6. ทดสอบการเชื่อมต่อ

1. รัน `npm run dev`
2. ไปที่ `/settings`
3. ดูว่า "Data Source" เป็น "Supabase" หรือไม่
4. ถ้ายังเป็น "Mock" ให้เช็ค Environment Variables

---

## 📦 Structure

```
src/
├── lib/supabase/
│   ├── client.ts      # Browser client
│   ├── server.ts      # Server client
│   ├── types.ts       # Database types
│   └── index.ts       # Exports
│
├── modules/erp/
│   ├── repositories/
│   │   └── supabase/  # Supabase implementations
│   │       ├── orderRepository.ts
│   │       ├── productionRepository.ts
│   │       ├── supplierRepository.ts
│   │       └── configRepository.ts
│   │
│   └── components/
│       └── ERPProvider.tsx  # Supports both Mock & Supabase
```

---

## 🔄 สลับระหว่าง Mock และ Supabase

### ใช้ Mock (Default - ไม่ต้อง setup อะไร)
```typescript
// ไม่ต้องตั้งค่า environment variables
// ระบบจะใช้ localStorage อัตโนมัติ
```

### ใช้ Supabase
```typescript
// ตั้งค่า environment variables ให้ครบ
// ระบบจะเปลี่ยนไปใช้ Supabase อัตโนมัติ
```

### สลับ Manual
```typescript
import { useERP } from '@/modules/erp';

function MyComponent() {
  const { dataSource, switchDataSource, isSupabaseConfigured } = useERP();
  
  return (
    <div>
      <p>Current: {dataSource}</p>
      {isSupabaseConfigured && (
        <button onClick={() => switchDataSource('supabase')}>
          Switch to Supabase
        </button>
      )}
    </div>
  );
}
```

---

## 🔒 Security Best Practices

1. **ไม่ commit `.env.local`** - มันอยู่ใน `.gitignore` แล้ว
2. **ใช้ RLS (Row Level Security)** - Schema มี RLS เปิดอยู่แล้ว
3. **ไม่ expose Service Role Key** - ใช้แค่ใน Server-side
4. **ใช้ HTTPS** - ใน Production

---

## 🚀 Deploy to Production

1. ตั้งค่า Environment Variables ใน Vercel/Hosting:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

2. Update Site URL ใน Supabase:
   - **Site URL**: `https://your-domain.com`
   - **Redirect URLs**: `https://your-domain.com/auth/callback`

3. Deploy!

---

## ❓ Troubleshooting

### "Supabase not configured"
- เช็คว่า `.env.local` มี environment variables ครบ
- Restart dev server หลังเพิ่ม env vars

### "Permission denied"
- เช็ค RLS Policies ใน Supabase Dashboard
- เช็คว่า User ได้ Login แล้ว

### "Table not found"
- รัน SQL Schema ใน SQL Editor อีกครั้ง
- เช็คว่ารันสำเร็จทุก Query

### ข้อมูลไม่แสดง
- ดู Console ว่ามี Error อะไร
- เช็คว่า Data Source เป็น Supabase
- ลอง Refresh หน้า

---

## 📞 Support

หากมีปัญหาเพิ่มเติม:
1. ดู Supabase Logs ใน Dashboard
2. ดู Browser Console
3. ดู Network Tab ใน DevTools

