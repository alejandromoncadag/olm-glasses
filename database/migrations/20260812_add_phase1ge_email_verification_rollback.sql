BEGIN;

CREATE SCHEMA IF NOT EXISTS phase1ge_rollback;
ALTER TABLE IF EXISTS customer_email_verification_events
    SET SCHEMA phase1ge_rollback;
ALTER TABLE IF EXISTS customer_email_verification_outbox
    SET SCHEMA phase1ge_rollback;
ALTER TABLE IF EXISTS customer_email_verification_tokens
    SET SCHEMA phase1ge_rollback;

COMMIT;
