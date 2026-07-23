BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name TEXT,
    email TEXT,
    "emailVerified" TIMESTAMPTZ,
    image TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_authjs_users_email_lower
ON users(LOWER(email))
WHERE email IS NOT NULL;

CREATE TABLE IF NOT EXISTS accounts (
    id BIGSERIAL PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at BIGINT,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    CONSTRAINT accounts_provider_provider_account_id_key
        UNIQUE (provider, "providerAccountId")
);

CREATE INDEX IF NOT EXISTS idx_authjs_accounts_user_id
ON accounts("userId");

CREATE TABLE IF NOT EXISTS sessions (
    id BIGSERIAL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL UNIQUE,
    "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_authjs_sessions_user_id
ON sessions("userId");

CREATE TABLE IF NOT EXISTS verification_token (
    identifier TEXT NOT NULL,
    expires TIMESTAMPTZ NOT NULL,
    token TEXT NOT NULL,
    PRIMARY KEY (identifier, token)
);

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS authjs_user_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_authjs_user_id
ON customers(authjs_user_id)
WHERE authjs_user_id IS NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'customers_authjs_user_id_fkey'
    ) THEN
        ALTER TABLE customers
        ADD CONSTRAINT customers_authjs_user_id_fkey
        FOREIGN KEY (authjs_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL;
    END IF;
END
$$;

COMMIT;
