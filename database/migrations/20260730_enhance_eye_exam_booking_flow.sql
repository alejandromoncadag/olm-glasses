BEGIN;

ALTER TABLE eye_exam_bookings
ADD COLUMN IF NOT EXISTS patient_age_group TEXT
    CHECK (patient_age_group IN ('adult', 'child')),
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS patient_details JSONB NOT NULL DEFAULT '{}'::JSONB,
ADD COLUMN IF NOT EXISTS manage_token_hash TEXT,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rescheduled_from_booking_id UUID
    REFERENCES eye_exam_bookings(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_eye_exam_bookings_manage_token_hash
ON eye_exam_bookings(manage_token_hash)
WHERE manage_token_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_eye_exam_bookings_rescheduled_from
ON eye_exam_bookings(rescheduled_from_booking_id)
WHERE rescheduled_from_booking_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS appointment_email_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES eye_exam_bookings(id) ON DELETE SET NULL,
    recipient_email TEXT NOT NULL,
    email_type TEXT NOT NULL CHECK (
        email_type IN (
            'confirmation',
            'cancellation',
            'reschedule_confirmation'
        )
    ),
    subject TEXT NOT NULL,
    html_body TEXT NOT NULL,
    text_body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'sent', 'failed')
    ),
    attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    provider_message_id TEXT,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_appointment_email_outbox_status_created
ON appointment_email_outbox(status, created_at);

CREATE INDEX IF NOT EXISTS idx_appointment_email_outbox_booking
ON appointment_email_outbox(booking_id);

COMMIT;
