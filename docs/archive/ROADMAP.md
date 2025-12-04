# 🗺️ Anajak Superapp - Development Roadmap

## ✅ Completed Features

### Phase 1: Foundation (Done)
- [x] Project setup (Next.js + Supabase)
- [x] Authentication system
- [x] Sidebar navigation
- [x] User roles & permissions
- [x] Dashboard (basic)

### Phase 2: Stock Management (Done)
- [x] Products CRUD
- [x] Stock transactions (IN/OUT/ADJUST)
- [x] Transaction history
- [x] Low stock alerts
- [x] Bulk import (CSV)
- [x] Real-time updates
- [x] Stock reservation for production

### Phase 3: Production Module (Done)
- [x] Production jobs management
- [x] Job status tracking
- [x] Progress updates
- [x] Stock reservation link

### Phase 4: CRM Module (Done)
- [x] Customer management
- [x] Customer tiers
- [x] Contact management

### Phase 5: Tools & Utilities (Done)
- [x] DTG Price Calculator
- [x] Audit logs system
- [x] Notification system (LINE API)
- [x] Settings page

### Phase 6: Data Integrity (Current)
- [x] Soft delete implementation
- [x] Price history tracking
- [x] Database schema for Orders
- [x] Documentation (ERP-DATA-INTEGRITY.md)

---

## 🚧 Next Priority Features

### Phase 7: Orders Module ⭐ HIGH PRIORITY
**Why:** เป็นหัวใจหลักของระบบ ERP - ต้องมีก่อนจะทำระบบอื่น

#### 7.1 Order Management
- [ ] Create order
- [ ] Order items with product snapshots
- [ ] Order status workflow
- [ ] Stock deduction on confirm
- [ ] Order history

#### 7.2 Quotation System
- [ ] Create quotation
- [ ] Convert quotation to order
- [ ] Quote validity tracking
- [ ] PDF export

#### 7.3 Invoice System
- [ ] Auto-generate invoice from order
- [ ] Payment tracking
- [ ] Receipt generation
- [ ] VAT calculation

### Phase 8: Reports Module
- [ ] Sales reports (by period, customer, product)
- [ ] Stock reports (valuation, movement)
- [ ] Production reports (efficiency, defects)
- [ ] Profit margin reports
- [ ] Export to Excel/PDF

### Phase 9: Advanced CRM
- [ ] Customer interaction history
- [ ] Follow-up reminders
- [ ] Customer lifetime value
- [ ] Loyalty programs
- [ ] Communication templates

### Phase 10: Supplier Management
- [ ] Supplier database
- [ ] Purchase orders
- [ ] Supplier price comparison
- [ ] Order history per supplier

---

## 🔮 Future Considerations

### Mobile App
- [ ] React Native app
- [ ] Production status updates
- [ ] Stock checking
- [ ] Push notifications

### Integrations
- [ ] LINE LIFF for customer orders
- [ ] Shopee/Lazada stock sync
- [ ] Accounting software integration
- [ ] Shipping providers API

### Advanced Features
- [ ] Inventory forecasting
- [ ] Auto-reorder suggestions
- [ ] Machine learning for demand prediction
- [ ] Multi-branch support
- [ ] Multi-currency support

---

## ⚠️ Critical Reminders

### Before Going Live
1. **Database Migration**
   - Run `schema.sql` additions for soft delete
   - Add indexes for performance

2. **Test All Soft Deletes**
   - Products ✅
   - Customers (needs update)
   - Orders (when implemented)

3. **Backup Strategy**
   - Set up automatic backups
   - Test restore procedure

### When Building Orders Module
1. **ALWAYS use Product Snapshots**
   ```typescript
   // ❌ Wrong
   order_item.product_name = product.model;
   
   // ✅ Correct
   order_item.product_snapshot = {
     sku: product.sku,
     name: `${product.model} ${product.color} ${product.size}`,
     // ... other fields
   };
   order_item.unit_price = product.price; // Lock price
   ```

2. **Never Trust Current Product Data**
   - Display order history using snapshots
   - Calculate totals from snapshot prices
   - Keep product_id for reference only

3. **Stock Deduction Rules**
   - Only deduct when order is "confirmed"
   - Use transaction system
   - Handle reserved vs available stock

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Dec 2024 | Initial release with Stock, Production, CRM |
| 1.1.0 | Dec 2024 | Added Audit Logs, DTG Calculator |
| 1.2.0 | Dec 2024 | Added Soft Delete, Price History, Orders schema |

---

## 📞 Contact & Support

- **Development Team:** Anajak Team
- **Project Repository:** /anajaktshirt-superapp-master
- **Documentation:** /docs folder

---

*Last Updated: December 2024*

