-- =============================================
-- SCHEMA UPDATES V2: Order-Production Integration
-- =============================================
-- Run after: production-tracking-schema.sql
-- =============================================

-- Add customer info fields to production_jobs
ALTER TABLE production_jobs 
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS product_description TEXT;

-- Add completed quantity alias (maps to passed_qty for backward compat)
-- This is just for clarity - passed_qty is the "completed" count

-- Ensure foreign keys exist (if orders table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
    -- Add FK to orders if not exists
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'production_jobs_order_id_fkey'
    ) THEN
      ALTER TABLE production_jobs 
      ADD CONSTRAINT production_jobs_order_id_fkey 
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_work_items') THEN
    -- Add FK to order_work_items if not exists
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'production_jobs_order_work_item_id_fkey'
    ) THEN
      ALTER TABLE production_jobs 
      ADD CONSTRAINT production_jobs_order_work_item_id_fkey 
      FOREIGN KEY (order_work_item_id) REFERENCES order_work_items(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- Create view for order production status
CREATE OR REPLACE VIEW order_production_status AS
SELECT 
  o.id as order_id,
  o.order_number,
  COUNT(pj.id) as total_jobs,
  COUNT(CASE WHEN pj.status = 'completed' THEN 1 END) as completed_jobs,
  COUNT(CASE WHEN pj.status IN ('in_progress', 'qc_check') THEN 1 END) as in_progress_jobs,
  COUNT(CASE WHEN pj.status IN ('pending', 'queued', 'assigned') THEN 1 END) as pending_jobs,
  COUNT(CASE WHEN pj.status = 'qc_failed' THEN 1 END) as failed_jobs,
  CASE 
    WHEN COUNT(pj.id) = 0 THEN 'no_production'
    WHEN COUNT(CASE WHEN pj.status = 'completed' THEN 1 END) = COUNT(pj.id) THEN 'all_completed'
    WHEN COUNT(CASE WHEN pj.status IN ('in_progress', 'qc_check') THEN 1 END) > 0 THEN 'in_progress'
    ELSE 'pending'
  END as production_status
FROM orders o
LEFT JOIN production_jobs pj ON pj.order_id = o.id
GROUP BY o.id, o.order_number;

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_production_jobs_order_id ON production_jobs(order_id);
CREATE INDEX IF NOT EXISTS idx_production_jobs_order_work_item_id ON production_jobs(order_work_item_id);
CREATE INDEX IF NOT EXISTS idx_production_jobs_status ON production_jobs(status);

-- Policy for production_jobs (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can manage production_jobs'
  ) THEN
    ALTER TABLE production_jobs ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Authenticated users can manage production_jobs" ON production_jobs
      FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;

