# 🏭 Production Tracking System

## 📊 ภาพรวม

ระบบติดตามการผลิตแยกตามประเภทงาน แต่ละงานมี:
- **สถานะการผลิตของตัวเอง**
- **คิวงาน + มอบหมายงาน**
- **เช็คพอยท์คุณภาพ**
- **บันทึกเวลา + ผู้รับผิดชอบ**

---

## 🎯 Production Flow หลัก

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PRODUCTION TRACKING FLOW                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│   Order Created                                                               │
│        │                                                                      │
│        ▼                                                                      │
│   ┌─────────────────────────────────────────┐                                │
│   │        Work Items Breakdown              │                                │
│   │  (แยกงานตามประเภท)                         │                                │
│   ├─────────────────────────────────────────┤                                │
│   │ • DTG หน้า          → Production Queue  │                                │
│   │ • ปักอก             → Production Queue  │                                │
│   │ • ป้ายทอ            → Outsource Queue   │                                │
│   │ • ตัดเย็บ           → Production Queue  │                                │
│   └─────────────────────────────────────────┘                                │
│        │                                                                      │
│        ▼                                                                      │
│   ┌─────────────────────────────────────────────────────────────┐            │
│   │                   PRODUCTION QUEUES                           │            │
│   ├─────────────────────────────────────────────────────────────┤            │
│   │                                                               │            │
│   │  [DTG Queue]    [Silkscreen]   [Embroidery]   [Sewing]       │            │
│   │   ├─ Job 1       ├─ Job 5       ├─ Job 3       ├─ Job 7      │            │
│   │   ├─ Job 2       ├─ Job 6       └─ Job 8       └─ Job 9      │            │
│   │   └─ Job 4                                                    │            │
│   │                                                               │            │
│   │  [Outsource Queue]                                            │            │
│   │   ├─ ป้ายทอ (Supplier A)                                      │            │
│   │   └─ กระดุม (Supplier B)                                      │            │
│   │                                                               │            │
│   └─────────────────────────────────────────────────────────────┘            │
│        │                                                                      │
│        ▼                                                                      │
│   ┌─────────────────────────────────────────┐                                │
│   │         Production Stations              │                                │
│   │  (สถานี/เครื่องจักร)                        │                                │
│   ├─────────────────────────────────────────┤                                │
│   │ DTG #1:    ▓▓▓▓▓░░░░░ 50%    (Job #123) │                                │
│   │ DTG #2:    ▓▓▓▓▓▓▓▓░░ 80%    (Job #124) │                                │
│   │ ปัก #1:    ▓▓▓░░░░░░░ 30%    (Job #125) │                                │
│   │ เย็บ #1:   ░░░░░░░░░░ Idle               │                                │
│   └─────────────────────────────────────────┘                                │
│        │                                                                      │
│        ▼                                                                      │
│   ┌─────────────────────────────────────────┐                                │
│   │          Quality Checkpoints             │                                │
│   ├─────────────────────────────────────────┤                                │
│   │ ✅ After Print  - ตรวจสีถูก ลายชัด        │                                │
│   │ ✅ After Sewing - ตรวจรอยเย็บ ขนาดตรง     │                                │
│   │ ✅ Final QC     - ตรวจรวม + แพ็ค          │                                │
│   └─────────────────────────────────────────┘                                │
│        │                                                                      │
│        ▼                                                                      │
│   Assembly → Final QC → Packing → Shipped                                    │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Work Item Production Status

### Status Flow แต่ละงาน

```
┌────────────────────────────────────────────────────────────────────┐
│                  WORK ITEM STATUS FLOW                              │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  pending ─► queued ─► assigned ─► in_progress ─► completed         │
│               │                       │                             │
│               │                       ▼                             │
│               │              ┌─── qc_check ───┐                    │
│               │              │                 │                    │
│               │              ▼                 ▼                    │
│               │          qc_passed        qc_failed                │
│               │              │                 │                    │
│               │              │                 ▼                    │
│               │              │             rework ─────────────┐   │
│               │              │                                 │   │
│               │              ▼                                 │   │
│               │          completed ◄───────────────────────────┘   │
│               │                                                     │
│               ▼                                                     │
│        ┌── outsourced ───────────────────────┐                     │
│        │                                      │                     │
│        ▼                                      ▼                     │
│   po_created ─► po_sent ─► producing ─► shipped ─► received        │
│                                                       │             │
│                                                       ▼             │
│                                                   qc_check          │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

### Status Definitions

| Status | คำอธิบาย | ใครทำ |
|--------|---------|-------|
| `pending` | รองานออกแบบ/วัสดุ | - |
| `queued` | เข้าคิวรอผลิต | Auto |
| `assigned` | มอบหมายให้ช่างแล้ว | Admin |
| `in_progress` | กำลังผลิต | Worker |
| `qc_check` | รอตรวจคุณภาพ | QC Team |
| `qc_passed` | ผ่าน QC | QC Team |
| `qc_failed` | ไม่ผ่าน QC | QC Team |
| `rework` | แก้ไข/ทำใหม่ | Worker |
| `completed` | เสร็จสมบูรณ์ | Auto |
| `outsourced` | ส่งผลิตภายนอก | Admin |

---

## 🏭 Production Departments/Stations

### Station Types

```sql
-- ประเภทสถานีงาน
CREATE TABLE production_stations (
  id UUID PRIMARY KEY,
  code TEXT UNIQUE,           -- 'DTG-1', 'EMB-1', 'SEW-1'
  name TEXT,                  -- 'เครื่อง DTG ตัว 1'
  department TEXT,            -- 'printing', 'embroidery', 'sewing'
  work_type_codes TEXT[],     -- ['DTG', 'DTF'] งานที่รับได้
  
  -- Capacity
  capacity_per_day INTEGER,   -- 100 ตัว/วัน
  current_load INTEGER,       -- งานในคิว
  
  -- Status
  status TEXT,                -- 'active', 'maintenance', 'offline'
  current_job_id UUID,        -- งานที่กำลังทำ
  
  -- Worker
  assigned_worker_id UUID REFERENCES user_profiles(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Example Stations
INSERT INTO production_stations (code, name, department, work_type_codes, capacity_per_day) VALUES
('DTG-1', 'เครื่อง DTG ตัว 1', 'printing', ARRAY['DTG'], 150),
('DTG-2', 'เครื่อง DTG ตัว 2', 'printing', ARRAY['DTG'], 150),
('DTF-1', 'เครื่อง DTF', 'printing', ARRAY['DTF'], 200),
('SILK-1', 'ซิลค์สกรีน Line 1', 'printing', ARRAY['SILKSCREEN'], 300),
('EMB-1', 'เครื่องปัก 1', 'embroidery', ARRAY['EMBROIDERY', 'EMBROIDERY_BADGE'], 50),
('EMB-2', 'เครื่องปัก 2', 'embroidery', ARRAY['EMBROIDERY', 'EMBROIDERY_BADGE'], 50),
('SEW-1', 'เย็บ Line 1', 'sewing', ARRAY['SEWING'], 80),
('CUT-1', 'ตัดผ้า', 'cutting', ARRAY['CUTTING'], 200);
```

---

## 📝 Production Jobs (งานผลิตแต่ละรายการ)

### Database Schema

```sql
-- Production Jobs (แยกจาก order_work_items เพื่อ track การผลิตจริง)
CREATE TABLE production_jobs (
  id UUID PRIMARY KEY,
  
  -- Link to Order
  order_id UUID REFERENCES orders(id),
  order_work_item_id UUID REFERENCES order_work_items(id),
  
  -- Job Info
  job_number TEXT UNIQUE,     -- 'PJ-2024-0001'
  work_type_code TEXT,        -- 'DTG', 'EMBROIDERY'
  
  -- Quantity
  ordered_qty INTEGER,        -- สั่ง 100 ตัว
  produced_qty INTEGER DEFAULT 0,  -- ผลิตแล้ว 80 ตัว
  passed_qty INTEGER DEFAULT 0,    -- ผ่าน QC 75 ตัว
  failed_qty INTEGER DEFAULT 0,    -- ไม่ผ่าน 5 ตัว
  
  -- Status
  status TEXT DEFAULT 'pending',
  priority INTEGER DEFAULT 0,      -- 0 = normal, 1 = rush, 2 = urgent
  
  -- Assignment
  station_id UUID REFERENCES production_stations(id),
  assigned_to UUID REFERENCES user_profiles(id),
  assigned_at TIMESTAMPTZ,
  
  -- Timing
  estimated_hours DECIMAL(5,2),
  actual_hours DECIMAL(5,2),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  due_date DATE,
  
  -- QC
  qc_status TEXT,             -- 'pending', 'passed', 'failed', 'partial'
  qc_notes TEXT,
  qc_by UUID REFERENCES user_profiles(id),
  qc_at TIMESTAMPTZ,
  
  -- Rework
  is_rework BOOLEAN DEFAULT false,
  rework_reason TEXT,
  original_job_id UUID REFERENCES production_jobs(id),
  rework_count INTEGER DEFAULT 0,
  
  -- Files
  design_file_url TEXT,
  production_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Production Job Logs (บันทึกการเปลี่ยนสถานะ)
CREATE TABLE production_job_logs (
  id UUID PRIMARY KEY,
  job_id UUID REFERENCES production_jobs(id),
  
  action TEXT,                -- 'started', 'paused', 'completed', 'qc_passed'
  from_status TEXT,
  to_status TEXT,
  
  produced_qty INTEGER,       -- จำนวนที่ทำในรอบนี้
  
  notes TEXT,
  performed_by UUID REFERENCES user_profiles(id),
  performed_at TIMESTAMPTZ DEFAULT NOW()
);

-- QC Checkpoints
CREATE TABLE qc_checkpoints (
  id UUID PRIMARY KEY,
  job_id UUID REFERENCES production_jobs(id),
  
  checkpoint_name TEXT,       -- 'color_check', 'alignment', 'size_accuracy'
  passed BOOLEAN,
  notes TEXT,
  photo_urls TEXT[],
  
  checked_by UUID REFERENCES user_profiles(id),
  checked_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔄 Outsource Tracking (งานจ้างภายนอก)

### สำหรับงานที่ไม่ผลิตเอง

```sql
-- Outsource Jobs
CREATE TABLE outsource_jobs (
  id UUID PRIMARY KEY,
  
  -- Link to Production
  production_job_id UUID REFERENCES production_jobs(id),
  order_id UUID REFERENCES orders(id),
  
  -- Supplier
  supplier_id UUID REFERENCES suppliers(id),
  supplier_name TEXT,         -- Snapshot
  supplier_contact TEXT,
  
  -- Job Info
  work_type_code TEXT,        -- 'TAG_WOVEN', 'EMBROIDERY'
  description TEXT,
  quantity INTEGER,
  unit_price DECIMAL(10,2),
  total_price DECIMAL(12,2),
  
  -- Status
  status TEXT DEFAULT 'draft',
  -- draft → sent → confirmed → producing → shipped → received → qc_check → completed
  
  -- PO Info
  po_number TEXT,
  po_sent_at TIMESTAMPTZ,
  po_confirmed_at TIMESTAMPTZ,
  
  -- Delivery
  expected_delivery DATE,
  actual_delivery DATE,
  tracking_number TEXT,
  
  -- Receiving
  received_qty INTEGER,
  received_by UUID REFERENCES user_profiles(id),
  received_at TIMESTAMPTZ,
  
  -- QC
  qc_status TEXT,
  qc_passed_qty INTEGER,
  qc_failed_qty INTEGER,
  qc_notes TEXT,
  
  -- Files
  design_file_url TEXT,
  po_file_url TEXT,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Outsource Logs
CREATE TABLE outsource_logs (
  id UUID PRIMARY KEY,
  outsource_job_id UUID REFERENCES outsource_jobs(id),
  
  action TEXT,
  from_status TEXT,
  to_status TEXT,
  notes TEXT,
  
  performed_by UUID REFERENCES user_profiles(id),
  performed_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 📊 UI: Production Dashboard

### หน้า Dashboard หลัก

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🏭 Production Dashboard                                     [Today's Date]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  📊 Overview                                                          │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │  Total Jobs: 45       In Progress: 12       Completed Today: 8       │  │
│  │  Rush Jobs: 3 🔥      QC Pending: 5         Outsource Waiting: 2     │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  🖨️ Production Stations                                              │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │                                                                       │  │
│  │  DTG #1    [▓▓▓▓▓▓▓░░░] 70%  Job #1234  👤 สมชาย                     │  │
│  │  DTG #2    [▓▓▓▓░░░░░░] 40%  Job #1235  👤 สมหญิง                    │  │
│  │  EMB #1    [▓▓▓▓▓▓▓▓▓░] 90%  Job #1236  👤 สมศรี   ⚡ Rush           │  │
│  │  SEW #1    [░░░░░░░░░░] Idle                                          │  │
│  │                                                                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌────────────────────────────┐  ┌──────────────────────────────────────┐  │
│  │  📋 Queue by Type          │  │  ⏰ Due Today                         │  │
│  ├────────────────────────────┤  ├──────────────────────────────────────┤  │
│  │  DTG:        8 jobs        │  │  • Job #1234 - DTG 50 ตัว (14:00)   │  │
│  │  Silkscreen: 3 jobs        │  │  • Job #1237 - ปัก 20 ตัว (16:00)    │  │
│  │  Embroidery: 5 jobs        │  │  • Job #1238 - ป้ายทอ (17:00)       │  │
│  │  Sewing:     2 jobs        │  │                                      │  │
│  │  Outsource:  4 pending     │  │                                      │  │
│  └────────────────────────────┘  └──────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### หน้า Job Detail

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Job #PJ-2024-0001                                        Status: 🔄 In Progress │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ Order: #ORD-2024-0123     Customer: บริษัท ABC                          ││
│  │ Work Type: DTG            Station: DTG #1                               ││
│  │ Worker: สมชาย             Due: 20 ธ.ค. 2024                              ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  Progress                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ Ordered: 100 ตัว                                                        ││
│  │ Produced: [▓▓▓▓▓▓▓▓░░] 80/100                                           ││
│  │ QC Passed: 75                                                           ││
│  │ QC Failed: 5                                                            ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌──────────────────────┐  ┌────────────────────────────────────────────────┐│
│  │ Design File          │  │ Production Log                                 ││
│  │ ┌──────────────────┐ │  ├────────────────────────────────────────────────┤│
│  │ │   [Preview]      │ │  │ 14:30 - สมชาย produced 20 pcs                  ││
│  │ │   DTG-design.png │ │  │ 12:00 - สมชาย produced 30 pcs                  ││
│  │ └──────────────────┘ │  │ 10:00 - สมชาย started job                      ││
│  │  📥 Download         │  │ 09:30 - Assigned to สมชาย                      ││
│  └──────────────────────┘  │ 09:00 - Job queued                             ││
│                             └────────────────────────────────────────────────┘│
│                                                                              │
│  Actions                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  [📝 Log Progress]  [✅ Mark Complete]  [❌ Report Issue]  [🔄 Rework]  ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📱 Worker App Features

สำหรับพนักงานผลิตใช้บนมือถือ/Tablet:

```
┌────────────────────────────────────────┐
│  👤 สมชาย - DTG Operator               │
│  Station: DTG #1                       │
├────────────────────────────────────────┤
│                                        │
│  📌 Current Job: #PJ-2024-0001         │
│  ┌────────────────────────────────────┐│
│  │ Order: บริษัท ABC                  ││
│  │ Type: DTG หน้าอก                   ││
│  │ Qty: 100 ตัว                       ││
│  │ Done: 80/100                       ││
│  │                                    ││
│  │ [🖼️ ดูลาย]  [📝 บันทึก]           ││
│  └────────────────────────────────────┘│
│                                        │
│  ⚡ Quick Actions                      │
│  ┌────────────────────────────────────┐│
│  │ [➕ บันทึกจำนวน]                   ││
│  │                                    ││
│  │ จำนวนที่ทำเสร็จ: [    10    ] ตัว  ││
│  │                                    ││
│  │ หมายเหตุ:                         ││
│  │ [________________________]         ││
│  │                                    ││
│  │       [💾 บันทึก]                  ││
│  └────────────────────────────────────┘│
│                                        │
│  📋 My Queue (งานถัดไป)                │
│  ┌────────────────────────────────────┐│
│  │ 1. Job #1237 - DTG 50 ตัว         ││
│  │ 2. Job #1238 - DTG 80 ตัว  🔥     ││
│  │ 3. Job #1239 - DTG 30 ตัว         ││
│  └────────────────────────────────────┘│
│                                        │
└────────────────────────────────────────┘
```

---

## 🔔 Notifications

| Event | แจ้งใคร | ช่องทาง |
|-------|---------|---------|
| งานเข้าคิว | Worker | App + LINE |
| งานเร่งด่วน | Worker + Manager | App + LINE |
| งานเสร็จ | QC Team | App |
| QC ไม่ผ่าน | Worker + Manager | App + LINE |
| วัสดุจาก Supplier มาถึง | Admin + Worker | App + LINE |
| งานเลยกำหนด | Manager | App + LINE |

---

## 📈 Reports

### Production Reports
- Daily/Weekly/Monthly production volume
- Worker productivity (ชิ้น/ชม.)
- Machine utilization (%)
- QC pass/fail rate
- On-time completion rate
- Rework rate

### Outsource Reports
- Supplier on-time delivery rate
- Supplier quality rate
- Cost per supplier
- Lead time analysis

---

*Last Updated: December 2024*

