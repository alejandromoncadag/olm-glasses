BEGIN;

CREATE TABLE IF NOT EXISTS customer_carts (
    customer_id UUID PRIMARY KEY REFERENCES customers(id) ON DELETE CASCADE,
    items JSONB NOT NULL DEFAULT '[]'::JSONB
        CHECK (JSONB_TYPEOF(items) = 'array'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_customer_carts_updated_at ON customer_carts;
CREATE TRIGGER update_customer_carts_updated_at
BEFORE UPDATE ON customer_carts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
