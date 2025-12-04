-- ============================================
-- SUPABASE CLEAN UP SCRIPT
-- ใช้สำหรับลบ Tables, Triggers, Functions ทั้งหมด
-- ⚠️ WARNING: จะลบข้อมูลทั้งหมด!
-- ============================================

-- Drop all triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS tr_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS tr_purchase_orders_updated_at ON purchase_orders;
DROP TRIGGER IF EXISTS tr_suppliers_updated_at ON suppliers;
DROP TRIGGER IF EXISTS tr_production_jobs_updated_at ON production_jobs;
DROP TRIGGER IF EXISTS tr_payments_updated_at ON order_payments;
DROP TRIGGER IF EXISTS tr_work_items_updated_at ON order_work_items;
DROP TRIGGER IF EXISTS tr_orders_updated_at ON orders;
DROP TRIGGER IF EXISTS tr_customers_updated_at ON customers;

-- Drop all functions
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS update_updated_at();

-- Drop all tables (in reverse order to handle foreign keys)
DROP TABLE IF EXISTS qc_records CASCADE;
DROP TABLE IF EXISTS change_requests CASCADE;
DROP TABLE IF EXISTS purchase_order_items CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS production_jobs CASCADE;
DROP TABLE IF EXISTS production_stations CASCADE;
DROP TABLE IF EXISTS order_mockups CASCADE;
DROP TABLE IF EXISTS design_versions CASCADE;
DROP TABLE IF EXISTS order_designs CASCADE;
DROP TABLE IF EXISTS order_payments CASCADE;
DROP TABLE IF EXISTS order_work_item_products CASCADE;
DROP TABLE IF EXISTS order_work_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS order_types CASCADE;
DROP TABLE IF EXISTS work_types CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS receipts CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS quotations CASCADE;

-- Drop all custom types (ENUMs)
DROP TYPE IF EXISTS financial_doc_status CASCADE;
DROP TYPE IF EXISTS qc_result CASCADE;
DROP TYPE IF EXISTS change_request_status CASCADE;
DROP TYPE IF EXISTS po_status CASCADE;
DROP TYPE IF EXISTS approval_status CASCADE;
DROP TYPE IF EXISTS work_category CASCADE;
DROP TYPE IF EXISTS production_job_status CASCADE;
DROP TYPE IF EXISTS production_mode CASCADE;
DROP TYPE IF EXISTS work_item_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS customer_tier CASCADE;

-- Drop all policies
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON purchase_orders;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON suppliers;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON production_jobs;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON order_payments;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON order_work_items;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON orders;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON customers;

-- Reset complete!
-- You can now run supabase-schema.sql to recreate everything fresh

SELECT 'All tables, triggers, functions, types, and policies have been dropped!' as status;

