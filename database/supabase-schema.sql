-- ============================================
-- ANAJAK SUPERAPP - SUPABASE SCHEMA
-- Version: 2.0
-- Compatible with: Supabase (PostgreSQL 15+)
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== ENUMS ====================

DO $$ BEGIN
  CREATE TYPE customer_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_terms AS ENUM ('full', '50_50', '30_70', 'credit_7', 'credit_15', 'credit_30');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'draft', 'quoted', 'awaiting_payment', 'designing', 
    'awaiting_mockup_approval', 'mockup_approved', 'awaiting_material',
    'in_production', 'qc_pending', 'ready_to_ship', 
    'shipped', 'completed', 'cancelled', 'on_hold'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('unpaid', 'partial', 'paid', 'refunded');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE work_item_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE production_mode AS ENUM ('in_house', 'outsource');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE production_job_status AS ENUM (
    'pending', 'queued', 'assigned', 'in_progress', 
    'qc_check', 'qc_passed', 'qc_failed', 'rework', 
    'completed', 'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE work_category AS ENUM ('printing', 'embroidery', 'garment', 'labeling', 'packaging', 'finishing');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE po_status AS ENUM ('draft', 'sent', 'confirmed', 'partial', 'received', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE change_request_status AS ENUM ('pending', 'quoted', 'approved', 'rejected', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE qc_result AS ENUM ('pass', 'fail', 'partial');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE financial_doc_status AS ENUM ('draft', 'pending', 'sent', 'accepted', 'rejected', 'paid', 'partial', 'cancelled', 'overdue');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ==================== CORE TABLES ====================

-- Customers
DROP TABLE IF EXISTS customers CASCADE;
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'individual', -- individual, company, retail
  name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  contact_name VARCHAR(255),
  phone VARCHAR(50),
  mobile VARCHAR(50),
  email VARCHAR(255),
  line_id VARCHAR(100),
  tax_id VARCHAR(50),
  tier customer_tier DEFAULT 'bronze',
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, suspended
  payment_terms payment_terms DEFAULT 'full',
  credit_limit DECIMAL(12,2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0,
  default_address JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
  order_type_code VARCHAR(50) NOT NULL,
  status order_status DEFAULT 'draft',
  priority INTEGER DEFAULT 0,
  order_date TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  sales_channel VARCHAR(50),
  payment_status payment_status DEFAULT 'unpaid',
  paid_amount DECIMAL(12,2) DEFAULT 0,
  total_quantity INTEGER DEFAULT 0,
  pricing JSONB,
  shipping_address JSONB,
  notes TEXT,
  internal_notes TEXT,
  design_free_revisions INTEGER DEFAULT 2,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Work Items
CREATE TABLE IF NOT EXISTS order_work_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  work_type_code VARCHAR(50) NOT NULL,
  position_code VARCHAR(50),
  size_code VARCHAR(50),
  description TEXT,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) DEFAULT 0,
  total_price DECIMAL(12,2) DEFAULT 0,
  status work_item_status DEFAULT 'pending',
  production_mode production_mode DEFAULT 'in_house',
  supplier_id UUID,
  sequence_order INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Work Item Products
CREATE TABLE IF NOT EXISTS order_work_item_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_item_id UUID REFERENCES order_work_items(id) ON DELETE CASCADE,
  product_id UUID,
  product_name VARCHAR(255) NOT NULL,
  color VARCHAR(100),
  size VARCHAR(50),
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) DEFAULT 0,
  total_price DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Payments
CREATE TABLE IF NOT EXISTS order_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  reference_number VARCHAR(100),
  payment_slip_url TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Designs
CREATE TABLE IF NOT EXISTS order_designs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  work_item_id UUID REFERENCES order_work_items(id) ON DELETE SET NULL,
  design_name VARCHAR(255) NOT NULL,
  current_version_id UUID,
  status approval_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Design Versions
CREATE TABLE IF NOT EXISTS design_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  design_id UUID REFERENCES order_designs(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  file_url TEXT,
  file_name VARCHAR(255),
  thumbnail_url TEXT,
  status approval_status DEFAULT 'pending',
  is_paid_revision BOOLEAN DEFAULT FALSE,
  revision_fee DECIMAL(10,2) DEFAULT 0,
  feedback TEXT,
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Mockups
CREATE TABLE IF NOT EXISTS order_mockups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  design_version_id UUID REFERENCES design_versions(id) ON DELETE SET NULL,
  version_number INTEGER DEFAULT 1,
  images JSONB DEFAULT '[]',
  status approval_status DEFAULT 'pending',
  customer_feedback TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== PRODUCTION TABLES ====================

-- Production Stations
CREATE TABLE IF NOT EXISTS production_stations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  work_type_codes TEXT[] DEFAULT '{}',
  capacity_per_day INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT TRUE,
  current_job_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Production Jobs
CREATE TABLE IF NOT EXISTS production_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_number VARCHAR(50) UNIQUE NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  work_item_id UUID REFERENCES order_work_items(id) ON DELETE CASCADE,
  work_type_code VARCHAR(50) NOT NULL,
  status production_job_status DEFAULT 'pending',
  priority INTEGER DEFAULT 0,
  station_id UUID REFERENCES production_stations(id) ON DELETE SET NULL,
  assigned_to UUID,
  total_qty INTEGER DEFAULT 0,
  completed_qty INTEGER DEFAULT 0,
  defect_qty INTEGER DEFAULT 0,
  due_date TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  description TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== SUPPLIER TABLES ====================

-- Suppliers
DROP TABLE IF EXISTS suppliers CASCADE;
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  name_th VARCHAR(255),
  contact_name VARCHAR(255),
  contact_phone VARCHAR(50),
  contact_email VARCHAR(255),
  contact_line VARCHAR(100),
  address JSONB,
  status VARCHAR(50) DEFAULT 'active',
  service_types TEXT[] DEFAULT '{}',
  payment_terms VARCHAR(50),
  credit_limit DECIMAL(12,2) DEFAULT 0,
  lead_time_days INTEGER DEFAULT 7,
  min_order_amount DECIMAL(12,2) DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE RESTRICT,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  status po_status DEFAULT 'draft',
  total_amount DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  expected_date TIMESTAMPTZ,
  received_date TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase Order Items
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) DEFAULT 0,
  total_price DECIMAL(12,2) DEFAULT 0,
  received_qty INTEGER DEFAULT 0,
  work_item_id UUID REFERENCES order_work_items(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== CHANGE REQUEST TABLES ====================

CREATE TABLE IF NOT EXISTS change_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_number VARCHAR(50) UNIQUE NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status change_request_status DEFAULT 'pending',
  current_phase VARCHAR(50),
  requested_by UUID,
  quoted_fee DECIMAL(10,2) DEFAULT 0,
  approved_fee DECIMAL(10,2) DEFAULT 0,
  impact_assessment JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== QC TABLES ====================

CREATE TABLE IF NOT EXISTS qc_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  production_job_id UUID REFERENCES production_jobs(id) ON DELETE SET NULL,
  stage VARCHAR(50) NOT NULL,
  checked_qty INTEGER DEFAULT 0,
  passed_qty INTEGER DEFAULT 0,
  failed_qty INTEGER DEFAULT 0,
  overall_result qc_result DEFAULT 'pass',
  checkpoints JSONB DEFAULT '[]',
  defects_found JSONB DEFAULT '[]',
  notes TEXT,
  checked_by UUID,
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== FINANCIAL TABLES ====================

CREATE TABLE IF NOT EXISTS quotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_number VARCHAR(50) UNIQUE NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
  status financial_doc_status DEFAULT 'draft',
  issue_date TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  total_amount DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  net_amount DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  grand_total DECIMAL(12,2) DEFAULT 0,
  items JSONB DEFAULT '[]',
  notes TEXT,
  terms_and_conditions TEXT,
  sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejected_reason TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE RESTRICT,
  customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
  status financial_doc_status DEFAULT 'pending',
  issue_date TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  total_amount DECIMAL(12,2) DEFAULT 0,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  outstanding_amount DECIMAL(12,2) DEFAULT 0,
  items JSONB DEFAULT '[]',
  notes TEXT,
  payment_terms TEXT,
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receipt_number VARCHAR(50) UNIQUE NOT NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE RESTRICT,
  order_id UUID REFERENCES orders(id) ON DELETE RESTRICT,
  customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  amount DECIMAL(12,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  reference_number VARCHAR(100),
  notes TEXT,
  received_by UUID,
  payment_slip_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== CONFIG TABLES ====================

CREATE TABLE IF NOT EXISTS work_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  category work_category NOT NULL,
  base_price DECIMAL(10,2) DEFAULT 0,
  requires_design BOOLEAN DEFAULT FALSE,
  default_production_mode production_mode DEFAULT 'in_house',
  estimated_days INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  lead_time_min INTEGER DEFAULT 3,
  lead_time_max INTEGER DEFAULT 7,
  features_included TEXT[] DEFAULT '{}',
  features_excluded TEXT[] DEFAULT '{}',
  workflow_steps TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products (เสื้อเปล่า) - Extended for Stock Module
DROP TABLE IF EXISTS products CASCADE;
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  name_th VARCHAR(255),
  category VARCHAR(100),
  type VARCHAR(50), -- blank, custom, etc.
  brand VARCHAR(100),
  model VARCHAR(100),
  description TEXT,
  base_price DECIMAL(10,2) DEFAULT 0,
  sale_price DECIMAL(10,2) DEFAULT 0,
  cost_price DECIMAL(10,2) DEFAULT 0,
  colors TEXT[], -- Available colors
  sizes TEXT[], -- Available sizes
  min_qty INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  in_stock BOOLEAN DEFAULT TRUE,
  stock_qty INTEGER DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock Transactions (ประวัติรับเข้า/เบิกออก)
DO $$ BEGIN
  CREATE TYPE transaction_type AS ENUM ('IN', 'OUT', 'ADJUST');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type transaction_type NOT NULL,
  quantity INTEGER NOT NULL,
  reason_category VARCHAR(50),      -- หมวดหมู่สาเหตุ
  reason VARCHAR(255),              -- สาเหตุการเบิก
  note TEXT,
  ref_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock Reservations (จองของสำหรับ Job)
DO $$ BEGIN
  CREATE TYPE reservation_status AS ENUM ('reserved', 'used', 'released');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS stock_reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES production_jobs(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  status reservation_status DEFAULT 'reserved',
  reserved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reserved_at TIMESTAMPTZ DEFAULT NOW(),
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== USER TABLES ====================

-- Roles with Permissions
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]',
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Profiles (Extended)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  department VARCHAR(100),
  phone VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Legacy profiles table (for backward compatibility)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  role VARCHAR(50) DEFAULT 'staff',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  link VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  details TEXT,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== INDEXES ====================

DROP INDEX IF EXISTS idx_orders_customer_id;
DROP INDEX IF EXISTS idx_orders_status;
DROP INDEX IF EXISTS idx_orders_order_date;
DROP INDEX IF EXISTS idx_orders_due_date;
DROP INDEX IF EXISTS idx_work_items_order_id;
DROP INDEX IF EXISTS idx_work_items_status;
DROP INDEX IF EXISTS idx_payments_order_id;
DROP INDEX IF EXISTS idx_production_jobs_order_id;
DROP INDEX IF EXISTS idx_production_jobs_status;
DROP INDEX IF EXISTS idx_production_jobs_station_id;
DROP INDEX IF EXISTS idx_purchase_orders_supplier_id;
DROP INDEX IF EXISTS idx_purchase_orders_order_id;
DROP INDEX IF EXISTS idx_qc_records_order_id;
DROP INDEX IF EXISTS idx_qc_records_production_job_id;
DROP INDEX IF EXISTS idx_notifications_user_id;
DROP INDEX IF EXISTS idx_notifications_is_read;
DROP INDEX IF EXISTS idx_notifications_created_at;
DROP INDEX IF EXISTS idx_products_model;
-- DROP INDEX IF EXISTS idx_products_deleted_at; -- Removed: products no longer has soft delete
DROP INDEX IF EXISTS idx_transactions_product_id;
DROP INDEX IF EXISTS idx_transactions_created_at;
DROP INDEX IF EXISTS idx_reservations_job_id;
DROP INDEX IF EXISTS idx_reservations_product_id;

CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_date ON orders(order_date);
CREATE INDEX idx_orders_due_date ON orders(due_date);

CREATE INDEX idx_work_items_order_id ON order_work_items(order_id);
CREATE INDEX idx_work_items_status ON order_work_items(status);

CREATE INDEX idx_payments_order_id ON order_payments(order_id);

CREATE INDEX idx_production_jobs_order_id ON production_jobs(order_id);
CREATE INDEX idx_production_jobs_status ON production_jobs(status);
CREATE INDEX idx_production_jobs_station_id ON production_jobs(station_id);

CREATE INDEX idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_order_id ON purchase_orders(order_id);

CREATE INDEX idx_qc_records_order_id ON qc_records(order_id);
CREATE INDEX idx_qc_records_production_job_id ON qc_records(production_job_id);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Audit Logs Indexes
DROP INDEX IF EXISTS idx_audit_logs_user_id;
DROP INDEX IF EXISTS idx_audit_logs_entity_type;
DROP INDEX IF EXISTS idx_audit_logs_created_at;

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

CREATE INDEX idx_products_model ON products(model);
-- CREATE INDEX idx_products_deleted_at ON products(deleted_at); -- Removed: products no longer has soft delete
CREATE INDEX idx_transactions_product_id ON transactions(product_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_reservations_job_id ON stock_reservations(job_id);
CREATE INDEX idx_reservations_product_id ON stock_reservations(product_id);

-- ==================== ROW LEVEL SECURITY ====================

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_work_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_reservations ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (Allow all for authenticated users)
-- In production, you should create more specific policies

-- Drop existing policies first
DROP POLICY IF EXISTS "Allow all for authenticated users" ON customers;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON orders;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON order_work_items;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON order_payments;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON production_jobs;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON suppliers;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON purchase_orders;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Allow authenticated users to view audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Allow authenticated users to insert audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON roles;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON products;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON transactions;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON stock_reservations;

-- Create policies
CREATE POLICY "Allow all for authenticated users" ON customers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON orders FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON order_work_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON order_payments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON production_jobs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON suppliers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON purchase_orders FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Allow authenticated users to view audit logs" ON audit_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert audit logs" ON audit_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON roles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON user_profiles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON products FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON transactions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON stock_reservations FOR ALL USING (auth.role() = 'authenticated');

-- ==================== TRIGGERS ====================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_customers_updated_at ON customers;
DROP TRIGGER IF EXISTS tr_orders_updated_at ON orders;
DROP TRIGGER IF EXISTS tr_work_items_updated_at ON order_work_items;
DROP TRIGGER IF EXISTS tr_payments_updated_at ON order_payments;
DROP TRIGGER IF EXISTS tr_production_jobs_updated_at ON production_jobs;
DROP TRIGGER IF EXISTS tr_suppliers_updated_at ON suppliers;
DROP TRIGGER IF EXISTS tr_purchase_orders_updated_at ON purchase_orders;
DROP TRIGGER IF EXISTS tr_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS tr_products_updated_at ON products;

CREATE TRIGGER tr_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_work_items_updated_at BEFORE UPDATE ON order_work_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_payments_updated_at BEFORE UPDATE ON order_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_production_jobs_updated_at BEFORE UPDATE ON production_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create legacy profile
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Create user_profile with default role
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url, role_id)
  SELECT 
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    r.id
  FROM public.roles r
  WHERE r.name = 'staff'
  LIMIT 1;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ==================== SEED DATA ====================

-- Insert default work types
INSERT INTO work_types (code, name, category, base_price, requires_design, default_production_mode, estimated_days) VALUES
('dtf_printing', 'สกรีน DTF', 'printing', 20, true, 'in_house', 1),
('dtg_printing', 'สกรีน DTG', 'printing', 35, true, 'in_house', 1),
('silkscreen', 'สกรีนซิลค์สกรีน', 'printing', 15, true, 'outsource', 2),
('sublimation', 'สกรีนซับลิเมชั่น', 'printing', 25, true, 'outsource', 2),
('embroidery', 'ปักคอมพิวเตอร์', 'embroidery', 50, true, 'outsource', 3),
('cutting', 'ตัดผ้า', 'garment', 30, false, 'outsource', 2),
('sewing', 'เย็บประกอบ', 'garment', 80, false, 'outsource', 5),
('labeling', 'ติดป้าย/แท็ก', 'labeling', 5, false, 'in_house', 1),
('folding', 'พับเสื้อ', 'finishing', 3, false, 'in_house', 1),
('packing', 'บรรจุถุง', 'packaging', 5, false, 'in_house', 1)
ON CONFLICT (code) DO NOTHING;

-- Insert default order types
INSERT INTO order_types (code, name, description, lead_time_min, lead_time_max, features_included, features_excluded, workflow_steps) VALUES
('ready_made', 'เสื้อสำเร็จรูป + สกรีน', 'เลือกเสื้อจาก Stock แล้วสกรีน/ปัก', 3, 5, 
  ARRAY['เลือกเสื้อจาก Stock', 'สกรีน/ปัก', 'ออกแบบลาย'], 
  ARRAY['ตัดเย็บ'],
  ARRAY['เลือกเสื้อ', 'กำหนดงานสกรีน', 'อนุมัติ Design', 'ผลิต', 'QC', 'ส่งมอบ']),
('custom_sewing', 'ตัดเย็บตามแบบ', 'ตัดเย็บเสื้อใหม่ + สกรีน/ปัก', 7, 14, 
  ARRAY['เลือก Pattern', 'เลือกผ้า/สั่งผ้า', 'ตัดเย็บ (Outsource)', 'สกรีน/ปัก'], 
  ARRAY[]::text[],
  ARRAY['เลือก Pattern', 'สั่งผ้า', 'ตัดเย็บ', 'สกรีน/ปัก', 'QC', 'ส่งมอบ']),
('full_custom', 'ออกแบบ+ตัดเย็บ+สกรีน', 'ออกแบบตั้งแต่ Pattern + ตัดเย็บ + สกรีน', 14, 30, 
  ARRAY['ออกแบบ Pattern', 'เลือกผ้า/สั่งผ้า', 'ตัดเย็บ (Outsource)', 'สกรีน/ปัก'], 
  ARRAY[]::text[],
  ARRAY['ออกแบบ', 'อนุมัติ Design', 'สั่งผ้า', 'ตัดเย็บ', 'สกรีน/ปัก', 'QC', 'ส่งมอบ']),
('print_only', 'รับสกรีนอย่างเดียว', 'ลูกค้านำเสื้อมาเอง + สกรีน/ปัก', 1, 3, 
  ARRAY['ลูกค้านำเสื้อมา', 'สกรีน/ปัก', 'ออกแบบลาย'], 
  ARRAY['ตัดเย็บ'],
  ARRAY['รับเสื้อ', 'กำหนดงานสกรีน', 'อนุมัติ Design', 'ผลิต', 'QC', 'ส่งมอบ'])
ON CONFLICT (code) DO NOTHING;

-- Insert default production stations
INSERT INTO production_stations (name, code, work_type_codes, capacity_per_day) VALUES
('สถานี DTF 1', 'DTF-01', ARRAY['dtf_printing'], 200),
('สถานี DTF 2', 'DTF-02', ARRAY['dtf_printing'], 200),
('สถานี QC', 'QC-01', ARRAY['qc'], 500),
('สถานี แพ็ค', 'PACK-01', ARRAY['folding', 'packing', 'labeling'], 300)
ON CONFLICT (code) DO NOTHING;

-- Insert default roles
INSERT INTO roles (name, display_name, description, permissions, is_system) VALUES
('super_admin', 'Super Admin', 'ผู้ดูแลระบบสูงสุด - มีสิทธิ์ทุกอย่าง', '["*"]', true),
('admin', 'Admin', 'ผู้ดูแลระบบ - จัดการผู้ใช้และตั้งค่าระบบ', '["orders:*", "production:*", "stock:*", "suppliers:*", "customers:*", "reports:view", "settings:view"]', true),
('manager', 'Manager', 'ผู้จัดการ - ดูรายงานและอนุมัติ', '["orders:*", "production:view", "stock:view", "suppliers:view", "customers:view", "reports:*"]', true),
('sales', 'Sales', 'พนักงานขาย - จัดการออเดอร์และลูกค้า', '["orders:*", "customers:*", "stock:view"]', true),
('production', 'Production', 'พนักงานผลิต - จัดการงานผลิต', '["production:*", "stock:view", "orders:view"]', true),
('warehouse', 'Warehouse', 'พนักงานคลัง - จัดการสต๊อก', '["stock:*", "orders:view"]', true),
('designer', 'Designer', 'นักออกแบบ - จัดการงาน Design', '["orders:view", "orders:design"]', true),
('staff', 'Staff', 'พนักงานทั่วไป - ดูข้อมูลพื้นฐาน', '["orders:view", "stock:view"]', false)
ON CONFLICT (name) DO NOTHING;

COMMENT ON SCHEMA public IS 'Anajak Superapp ERP Schema v2.0';

