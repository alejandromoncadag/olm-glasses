-- Add Stripe Checkout references and a reversible inventory reservation lifecycle.

ALTER TYPE inventory_movement_type ADD VALUE IF NOT EXISTS 'reservation';
ALTER TYPE inventory_movement_type ADD VALUE IF NOT EXISTS 'release';

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_stripe_customer_id
ON customers(stripe_customer_id)
WHERE stripe_customer_id IS NOT NULL;

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'bank_transfer',
ADD COLUMN IF NOT EXISTS delivery_method TEXT NOT NULL DEFAULT 'shipping',
ADD COLUMN IF NOT EXISTS shipping_carrier TEXT,
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS customer_visible_notes TEXT,
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_payment_method_type TEXT,
ADD COLUMN IF NOT EXISTS stripe_checkout_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS inventory_reservation_status TEXT NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS inventory_reserved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS inventory_committed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS inventory_released_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'orders_inventory_reservation_status_check'
  ) THEN
    ALTER TABLE orders
    ADD CONSTRAINT orders_inventory_reservation_status_check
    CHECK (inventory_reservation_status IN ('none', 'active', 'committed', 'released'));
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_stripe_checkout_session_id
ON orders(stripe_checkout_session_id)
WHERE stripe_checkout_session_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_stripe_payment_intent_id
ON orders(stripe_payment_intent_id)
WHERE stripe_payment_intent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_inventory_reservation_status
ON orders(inventory_reservation_status);
