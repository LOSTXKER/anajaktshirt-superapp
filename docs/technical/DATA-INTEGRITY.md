# 📋 ERP Data Integrity & Future Planning

## หลักการสำคัญ (Core Principles)

### 1. ❌ ห้าม Hard Delete (No Hard Delete Policy)
**ปัญหา:** ถ้าลบสินค้าแบบ Hard Delete แล้ว ออเดอร์เก่าจะไม่มีข้อมูลอ้างอิง
**วิธีแก้:** ใช้ Soft Delete เสมอ - ใส่ `deleted_at` timestamp แทนการลบจริง

```sql
-- ❌ ไม่ทำแบบนี้
DELETE FROM products WHERE id = 'xxx';

-- ✅ ทำแบบนี้
UPDATE products SET deleted_at = NOW(), is_active = false WHERE id = 'xxx';
```

### 2. 📸 Snapshot Data in Orders (Order Immutability)
**ปัญหา:** ถ้าแก้ราคาสินค้า ออเดอร์เก่าจะแสดงราคาผิด
**วิธีแก้:** เก็บ "snapshot" ของข้อมูลสินค้าในตอนสร้างออเดอร์

```
Order Created: 2024-01-15
├── product_id: "abc123" (reference)
├── product_snapshot: {           <-- เก็บข้อมูล ณ เวลานั้น
│     "sku": "GILDAN-WHITE-M",
│     "name": "Gildan 76000 White M",
│     "unit_price": 85.00,
│     "cost": 65.00
│   }
└── quantity: 100

ถึงแม้วันนี้ราคาเปลี่ยนเป็น 90 บาท
แต่ออเดอร์นี้ยังแสดง 85 บาทตามที่ตกลงไว้
```

### 3. 📜 Version History (Optional for Critical Data)
**สำหรับ:** ข้อมูลที่ต้องการดูประวัติการเปลี่ยนแปลงย้อนหลัง
**ตัวอย่าง:** ราคาต้นทุน, ราคาขาย, สเปคสินค้า

---

## 🗂️ Database Schema Changes Required

### Products Table - Add Soft Delete
```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Index for soft delete queries
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active) WHERE is_active = true;
```

### Orders Table (Future)
```sql
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  
  -- Customer Snapshot (ในกรณีลูกค้าเปลี่ยนข้อมูล)
  customer_snapshot JSONB NOT NULL,
  
  status TEXT DEFAULT 'draft',
  subtotal DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,
  
  notes TEXT,
  internal_notes TEXT,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id), -- Reference (nullable if deleted)
  
  -- ⭐ Product Snapshot - ข้อมูล ณ เวลาสร้างออเดอร์
  product_snapshot JSONB NOT NULL,
  -- Contains: sku, main_sku, model, color, size, name
  
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,      -- ราคาขาย ณ ตอนนั้น
  unit_cost DECIMAL(10,2) NOT NULL,       -- ต้นทุน ณ ตอนนั้น
  discount_percent DECIMAL(5,2) DEFAULT 0,
  line_total DECIMAL(12,2) NOT NULL,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Product Price History (Optional)
```sql
CREATE TABLE IF NOT EXISTS product_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  
  old_cost DECIMAL(10,2),
  new_cost DECIMAL(10,2),
  old_price DECIMAL(10,2),
  new_price DECIMAL(10,2),
  
  reason TEXT,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔧 Implementation Checklist

### Phase 1: Foundation (Current Sprint)
- [x] Audit Logs system
- [x] Soft delete for all entities
- [ ] Add `deleted_at` to products table
- [ ] Update delete functions to use soft delete
- [ ] Filter deleted items from normal queries

### Phase 2: Orders Module (Next Sprint)
- [ ] Create orders table with snapshots
- [ ] Create order_items with product snapshots
- [ ] Order creation flow
- [ ] Order status management
- [ ] Stock deduction on order confirmation
- [ ] Invoice generation

### Phase 3: Financial Module (Future)
- [ ] Quotations (ใบเสนอราคา)
- [ ] Invoices (ใบแจ้งหนี้)
- [ ] Receipts (ใบเสร็จ)
- [ ] Payment tracking
- [ ] Credit management

### Phase 4: Advanced Features (Future)
- [ ] Price history tracking
- [ ] Cost history tracking
- [ ] Supplier price comparison
- [ ] Profit margin reports
- [ ] Inventory valuation (FIFO/Average)

---

## 📌 Best Practices for ERP

### 1. Never Delete, Always Archive
```typescript
// ❌ Bad
await supabase.from('products').delete().eq('id', id);

// ✅ Good
await supabase.from('products').update({ 
  deleted_at: new Date().toISOString(),
  is_active: false 
}).eq('id', id);
```

### 2. Always Snapshot in Transactions
```typescript
// Creating order item
const orderItem = {
  product_id: product.id,
  product_snapshot: {
    sku: product.sku,
    main_sku: product.main_sku,
    model: product.model,
    color: product.color,
    size: product.size,
    name: `${product.model} ${product.color} ${product.size}`,
  },
  unit_price: product.price,  // Lock the price
  unit_cost: product.cost,    // Lock the cost
  quantity: qty,
};
```

### 3. Reference + Snapshot Pattern
```
┌─────────────────────────────────────────────────────────┐
│  order_items                                            │
├─────────────────────────────────────────────────────────┤
│  product_id: UUID (Foreign Key)                         │
│  ↳ ใช้ JOIN เพื่อดูข้อมูลปัจจุบัน (ถ้ายังมี)              │
│                                                         │
│  product_snapshot: JSONB                                │
│  ↳ ใช้แสดงผลในออเดอร์ (ไม่เปลี่ยนแปลง)                  │
└─────────────────────────────────────────────────────────┘
```

### 4. Query Patterns

```sql
-- ดูสินค้าที่ยังใช้งาน
SELECT * FROM products WHERE deleted_at IS NULL;

-- ดูออเดอร์พร้อมข้อมูลสินค้า ณ ตอนสั่ง
SELECT 
  o.*,
  oi.product_snapshot->>'sku' as ordered_sku,
  oi.product_snapshot->>'name' as ordered_product_name,
  oi.unit_price as ordered_price,
  p.price as current_price  -- ราคาปัจจุบัน (อาจต่างกัน)
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
LEFT JOIN products p ON p.id = oi.product_id;  -- LEFT JOIN เพราะสินค้าอาจถูกลบ
```

---

## ⚠️ Important Reminders

1. **ก่อน Production:**
   - Run migration เพิ่ม `deleted_at` column
   - Update ทุก delete function เป็น soft delete
   - Update ทุก query ให้ filter `deleted_at IS NULL`

2. **เมื่อสร้าง Orders Module:**
   - ต้องเก็บ snapshot ทุกครั้ง
   - ห้ามใช้ JOIN เพื่อแสดงราคาในออเดอร์
   - ใช้ `product_snapshot` เท่านั้น

3. **Reports:**
   - รายงานกำไร ใช้ข้อมูลจาก snapshot
   - รายงานสต๊อก ใช้ข้อมูลปัจจุบัน
   - รายงานราคา ดูได้ทั้ง historical และ current

---

## 🎯 Summary

| Action | ก่อนทำ Orders | หลังทำ Orders |
|--------|--------------|---------------|
| ลบสินค้า | Soft delete | Soft delete |
| แก้ราคา | บันทึก audit log | ไม่กระทบออเดอร์เก่า |
| ดูออเดอร์ | - | แสดง snapshot |
| Reports | ใช้ข้อมูลปัจจุบัน | ใช้ snapshot + ปัจจุบัน |

---

*Last Updated: December 2024*
*Author: Anajak Development Team*

