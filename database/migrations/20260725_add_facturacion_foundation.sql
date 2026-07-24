BEGIN;

CREATE TABLE IF NOT EXISTS customer_tax_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    rfc TEXT NOT NULL,
    tax_name TEXT NOT NULL,
    fiscal_postal_code TEXT NOT NULL,
    tax_regime TEXT NOT NULL,
    cfdi_use TEXT NOT NULL,
    invoice_email TEXT NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_number TEXT NOT NULL UNIQUE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    order_number TEXT NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_tax_profile_id UUID REFERENCES customer_tax_profiles(id) ON DELETE SET NULL,
    rfc TEXT NOT NULL,
    tax_name TEXT NOT NULL,
    fiscal_postal_code TEXT NOT NULL,
    tax_regime TEXT NOT NULL,
    cfdi_use TEXT NOT NULL,
    invoice_email TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    order_total_cents INTEGER NOT NULL CHECK (order_total_cents >= 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'issued', 'rejected', 'cancelled')
    ),
    admin_notes TEXT,
    rejection_reason TEXT,
    xml_url TEXT,
    pdf_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_tax_profiles_customer_id
ON customer_tax_profiles(customer_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_tax_profiles_one_default
ON customer_tax_profiles(customer_id)
WHERE is_default;

CREATE INDEX IF NOT EXISTS idx_invoice_requests_status
ON invoice_requests(status);

CREATE INDEX IF NOT EXISTS idx_invoice_requests_order_number
ON invoice_requests(order_number);

CREATE INDEX IF NOT EXISTS idx_invoice_requests_customer_id
ON invoice_requests(customer_id);

CREATE INDEX IF NOT EXISTS idx_invoice_requests_rfc
ON invoice_requests(rfc);

CREATE INDEX IF NOT EXISTS idx_invoice_requests_created_at
ON invoice_requests(created_at);

DROP TRIGGER IF EXISTS update_customer_tax_profiles_updated_at ON customer_tax_profiles;
CREATE TRIGGER update_customer_tax_profiles_updated_at
BEFORE UPDATE ON customer_tax_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoice_requests_updated_at ON invoice_requests;
CREATE TRIGGER update_invoice_requests_updated_at
BEFORE UPDATE ON invoice_requests
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
