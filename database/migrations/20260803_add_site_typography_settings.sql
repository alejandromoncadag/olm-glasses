BEGIN;

-- One row controls typography for the current database/environment.
-- Only sanitized Google Font family names are stored; never URLs or CSS.
CREATE TABLE IF NOT EXISTS site_typography_settings (
    id SMALLINT PRIMARY KEY CHECK (id = 1),
    body_font_family VARCHAR(80) NOT NULL DEFAULT 'Geist',
    heading_font_family VARCHAR(80) NOT NULL DEFAULT 'Cormorant Garamond',
    logo_font_family VARCHAR(80) NOT NULL DEFAULT 'Cormorant Garamond',
    mono_font_family VARCHAR(80) NOT NULL DEFAULT 'Geist Mono',
    use_custom_body_font BOOLEAN NOT NULL DEFAULT FALSE,
    use_custom_heading_font BOOLEAN NOT NULL DEFAULT FALSE,
    use_custom_logo_font BOOLEAN NOT NULL DEFAULT FALSE,
    use_custom_mono_font BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by TEXT
);

INSERT INTO site_typography_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

COMMIT;
