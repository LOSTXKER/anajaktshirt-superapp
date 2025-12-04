-- =============================================
-- SCHEMA UPDATES FOR DESIGN + PAYMENT WORKFLOW
-- =============================================
-- Run this after orders-schema.sql
-- =============================================

-- Add missing columns to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS final_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS balance_due DECIMAL(12,2) DEFAULT 0;

-- Add missing columns to order_mockups
ALTER TABLE order_mockups ADD COLUMN IF NOT EXISTS note TEXT;

-- Rename customer_feedback to feedback if it exists (and feedback doesn't exist yet)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_mockups' AND column_name = 'customer_feedback') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_mockups' AND column_name = 'feedback') THEN
    ALTER TABLE order_mockups RENAME COLUMN customer_feedback TO feedback;
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_mockups' AND column_name = 'feedback') THEN
    ALTER TABLE order_mockups ADD COLUMN feedback TEXT;
  END IF;
END $$;

-- Update order_payments table
ALTER TABLE order_payments ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'full';
ALTER TABLE order_payments ADD COLUMN IF NOT EXISTS payment_date TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE order_payments ADD COLUMN IF NOT EXISTS note TEXT;

-- Handle column renames safely
DO $$ 
BEGIN
  -- verified_by -> confirmed_by
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_payments' AND column_name = 'verified_by') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_payments' AND column_name = 'confirmed_by') THEN
    ALTER TABLE order_payments RENAME COLUMN verified_by TO confirmed_by;
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_payments' AND column_name = 'confirmed_by') THEN
    ALTER TABLE order_payments ADD COLUMN confirmed_by UUID REFERENCES auth.users(id);
  END IF;
  
  -- verified_at -> confirmed_at
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_payments' AND column_name = 'verified_at') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_payments' AND column_name = 'confirmed_at') THEN
    ALTER TABLE order_payments RENAME COLUMN verified_at TO confirmed_at;
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_payments' AND column_name = 'confirmed_at') THEN
    ALTER TABLE order_payments ADD COLUMN confirmed_at TIMESTAMPTZ;
  END IF;
  
  -- notes -> note (singular)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_payments' AND column_name = 'notes') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_payments' AND column_name = 'note') THEN
    ALTER TABLE order_payments RENAME COLUMN notes TO note;
  END IF;
END $$;

-- Update payment status enum to use 'confirmed' instead of 'verified'
-- First update existing data
UPDATE order_payments SET status = 'confirmed' WHERE status = 'verified';

-- Update trigger to also set final_amount
CREATE OR REPLACE FUNCTION update_order_totals()
RETURNS TRIGGER AS $$
DECLARE
  order_row RECORD;
BEGIN
  -- Get order ID (handle both INSERT/UPDATE and DELETE)
  IF TG_OP = 'DELETE' THEN
    order_row.order_id := OLD.order_id;
  ELSE
    order_row.order_id := NEW.order_id;
  END IF;

  UPDATE orders
  SET 
    subtotal = (
      SELECT COALESCE(SUM(total_price), 0)
      FROM order_work_items
      WHERE order_id = order_row.order_id
    ) + (
      SELECT COALESCE(SUM(total_price), 0)
      FROM order_products
      WHERE order_id = order_row.order_id AND order_work_item_id IS NULL
    ),
    updated_at = NOW()
  WHERE id = order_row.order_id;
  
  -- Update total_amount and final_amount
  UPDATE orders
  SET 
    total_amount = subtotal - discount_amount + shipping_cost,
    final_amount = subtotal - discount_amount + shipping_cost,
    balance_due = (subtotal - discount_amount + shipping_cost) - paid_amount,
    updated_at = NOW()
  WHERE id = order_row.order_id;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- DONE!
-- =============================================
SELECT 'Schema updates applied successfully!' as message;

