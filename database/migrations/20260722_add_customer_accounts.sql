BEGIN;

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS auth_user_id TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS auth_synced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS auth_deleted_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_auth_user_id
ON customers(auth_user_id)
WHERE auth_user_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS customer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    label TEXT NOT NULL DEFAULT 'Casa',
    recipient_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address_line_1 TEXT NOT NULL,
    address_line_2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'México',
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_id
ON customer_addresses(customer_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_addresses_one_default
ON customer_addresses(customer_id)
WHERE is_default;

CREATE TABLE IF NOT EXISTS customer_favorites (
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (customer_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_customer_favorites_product_id
ON customer_favorites(product_id);

ALTER TABLE eye_exam_bookings
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_eye_exam_bookings_customer_id
ON eye_exam_bookings(customer_id);

UPDATE eye_exam_bookings AS booking
SET customer_id = customer.id
FROM customers AS customer
WHERE booking.customer_id IS NULL
  AND LOWER(booking.customer_email) = LOWER(customer.email);

CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_customer_addresses_updated_at ON customer_addresses;
CREATE TRIGGER update_customer_addresses_updated_at
BEFORE UPDATE ON customer_addresses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
