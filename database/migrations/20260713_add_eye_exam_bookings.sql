CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS eye_exam_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_number TEXT NOT NULL,
    location_slug TEXT NOT NULL,
    location_name TEXT NOT NULL,
    service_name TEXT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TEXT NOT NULL CHECK (
        appointment_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
    ),
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'confirmed', 'cancelled', 'completed')
    ),
    google_calendar_event_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT eye_exam_bookings_booking_number_key UNIQUE (booking_number)
);

CREATE INDEX IF NOT EXISTS idx_eye_exam_bookings_customer_email
ON eye_exam_bookings(customer_email);

CREATE INDEX IF NOT EXISTS idx_eye_exam_bookings_location_date
ON eye_exam_bookings(location_slug, appointment_date);

CREATE INDEX IF NOT EXISTS idx_eye_exam_bookings_status
ON eye_exam_bookings(status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_eye_exam_bookings_active_slot
ON eye_exam_bookings(location_slug, appointment_date, appointment_time)
WHERE status IN ('pending', 'confirmed');

CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_eye_exam_bookings_updated_at ON eye_exam_bookings;

CREATE TRIGGER update_eye_exam_bookings_updated_at BEFORE
UPDATE ON eye_exam_bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
