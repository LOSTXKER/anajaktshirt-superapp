# 📦 Order System Overview

## 🎯 ภาพรวมระบบออเดอร์

ระบบออเดอร์ใหม่ออกแบบมาเพื่อรองรับ:
- งานหลายประเภทในออเดอร์เดียว (DTG, DTF, ปัก, ป้าย, etc.)
- เสื้อตัวเดียวหลายงาน (พิมพ์ + ปัก + ป้าย)
- สถานะแยกแต่ละงาน
- ขั้นตอนออกแบบและ Mockup
- รองรับลูกค้าเรื่องมาก/แก้ไขบ่อย

---

## 📊 Work Types (ประเภทงาน)

### 🖨️ Printing (การพิมพ์)
| Code | ชื่อ | เหมาะกับ |
|------|------|---------|
| `DTG` | สกรีน DTG (Digital) | Cotton, TC, CVC |
| `DTF` | สกรีน DTF (Film Transfer) | ทุกประเภทผ้า |
| `SILKSCREEN` | สกรีนซิลค์สกรีน | Cotton, Polyester |
| `SUBLIMATION` | ซับลิเมชั่น | Polyester 100% |
| `VINYL` | ไวนิล/เฟล็ก | ทุกประเภท |

### 🧵 Embroidery (งานปัก)
| Code | ชื่อ |
|------|------|
| `EMBROIDERY` | งานปัก |
| `EMBROIDERY_BADGE` | ปักตรา/แบดจ์ |

### 📦 Packaging
| Code | ชื่อ |
|------|------|
| `TAG_WOVEN` | ป้ายทอ |
| `TAG_PRINTED` | ป้ายพิมพ์ |
| `TAG_LEATHER` | ป้ายหนัง |
| `HANGTAG` | Hang Tag |
| `PACKAGING_BAG` | ถุงแพค |
| `PACKAGING_BOX` | กล่อง |

### ✂️ Pattern & Sewing
| Code | ชื่อ |
|------|------|
| `PATTERN` | ขึ้นแพทเทิร์น |
| `CUTTING` | ตัดผ้า |
| `SEWING` | เย็บ |

---

## 🔄 Order Status Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     ORDER STATUS FLOW                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  draft ──► quoted ──► awaiting_payment ──► paid                 │
│                                              │                   │
│                                              ▼                   │
│                                         designing                │
│                                              │                   │
│                                              ▼                   │
│                                    awaiting_mockup_approval      │
│                                              │                   │
│                           ┌──────────────────┼───────────────┐   │
│                           │                  │               │   │
│                           ▼                  ▼               ▼   │
│                    awaiting_material     queued      (reject)    │
│                           │                  │           │       │
│                           └──────────────────┤           │       │
│                                              ▼           │       │
│                                        in_production ◄───┘       │
│                                              │                   │
│                                              ▼                   │
│                                         qc_pending               │
│                                              │                   │
│                              ┌───────────────┼───────────────┐   │
│                              │               │               │   │
│                              ▼               ▼               ▼   │
│                         qc_passed       qc_failed ──► rework     │
│                              │                           │       │
│                              ▼                           │       │
│                        ready_to_ship ◄───────────────────┘       │
│                              │                                   │
│                              ▼                                   │
│                          shipped                                 │
│                              │                                   │
│                              ▼                                   │
│                         completed ✅                             │
│                                                                  │
│  [Any] ──► on_hold ──► [Previous]                               │
│  [Any] ──► cancelled                                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema

### Orders (ออเดอร์หลัก)
```sql
orders
├── id, order_number
├── customer_id, customer_snapshot    -- ข้อมูลลูกค้า ณ ตอนสั่ง
├── status, sub_status
├── sale_channel                      -- facebook, line, shopee
├── payment_policy, payment_status
├── subtotal, discount, tax, total
├── delivery_method, tracking_number
├── notes, internal_notes
└── created_at, updated_at, completed_at
```

### Order Work Items (งานแต่ละประเภท)
```sql
order_work_items
├── id, order_id
├── work_type_code                    -- 'DTG', 'EMBROIDERY', etc.
├── status                            -- สถานะแยกแต่ละงาน
├── ordered_quantity, produced_quantity
├── passed_quantity, failed_quantity
├── unit_price, total_price
├── assigned_to                       -- มอบหมายใคร
├── revision_count                    -- นับการแก้ไข
└── estimated_completion, actual_completion
```

### Order Products (สินค้าที่ใช้)
```sql
order_products
├── id, order_id, work_item_id
├── product_id, product_snapshot      -- ข้อมูลสินค้า ณ ตอนสั่ง
├── quantity, unit_price, unit_cost
├── requires_stock, stock_reserved
└── line_total
```

---

## 🎨 ตัวอย่างออเดอร์

### ออเดอร์งานยูนิฟอร์ม
```
Order #1234 - บริษัท ABC
│
├── Work Item 1: DTG หน้า
│   ├── Product: เสื้อยืด Cotton ขาว x 100
│   ├── Design: โลโก้บริษัท A4
│   └── Status: ✅ Completed
│
├── Work Item 2: งานปักอก
│   ├── Product: เสื้อยืด Cotton ขาว x 100
│   ├── Design: โลโก้ 5x5 ซม.
│   └── Status: 🔄 In Production
│
├── Work Item 3: ป้ายทอ
│   ├── Quantity: 100 ชิ้น
│   └── Status: 📦 Delivered
│
└── Work Item 4: ถุงแพค
    ├── Quantity: 100 ถุง
    └── Status: ⏳ Pending
```

---

## 📎 เอกสารที่เกี่ยวข้อง

- [02-DESIGN-WORKFLOW.md](./02-DESIGN-WORKFLOW.md) - ขั้นตอนออกแบบลาย
- [03-EDGE-CASES.md](./03-EDGE-CASES.md) - กรณีพิเศษ/ปัญหา
- [../technical/DATA-INTEGRITY.md](../technical/DATA-INTEGRITY.md) - หลักการเก็บข้อมูล

---

*Last Updated: December 2024*

