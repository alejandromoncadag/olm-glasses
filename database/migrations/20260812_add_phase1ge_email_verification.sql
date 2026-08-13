BEGIN;

CREATE TABLE customer_email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id),
    token_hash CHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ NULL,
    invalidated_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT customer_email_verification_token_state_check CHECK (
        NOT (consumed_at IS NOT NULL AND invalidated_at IS NOT NULL)
    )
);

CREATE INDEX customer_email_verification_user_idx
    ON customer_email_verification_tokens (user_id, created_at DESC);

CREATE TABLE customer_email_verification_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verification_id UUID NOT NULL
        REFERENCES customer_email_verification_tokens(id),
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    html_body TEXT NOT NULL,
    text_body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued',
    attempt_count INTEGER NOT NULL DEFAULT 0,
    sent_at TIMESTAMPTZ NULL,
    last_error TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT customer_email_verification_outbox_status_check CHECK (
        status IN ('queued', 'sent', 'failed')
    ),
    CONSTRAINT customer_email_verification_outbox_attempt_check CHECK (
        attempt_count >= 0
    )
);

CREATE INDEX customer_email_verification_outbox_queue_idx
    ON customer_email_verification_outbox (status, created_at);

CREATE TABLE customer_email_verification_events (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    event_type TEXT NOT NULL,
    provider TEXT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT customer_email_verification_events_json_check CHECK (
        jsonb_typeof(metadata) = 'object'
    )
);

CREATE INDEX customer_email_verification_events_user_idx
    ON customer_email_verification_events (user_id, created_at DESC);

COMMIT;
