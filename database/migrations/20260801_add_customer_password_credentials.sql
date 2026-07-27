BEGIN;

CREATE TABLE IF NOT EXISTS customer_password_credentials (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_customer_password_credentials_updated_at
ON customer_password_credentials;

CREATE TRIGGER update_customer_password_credentials_updated_at
BEFORE UPDATE ON customer_password_credentials
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
