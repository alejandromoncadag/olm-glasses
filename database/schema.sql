-- OLM Glasses PostgreSQL Schema
-- First database version for products, customers, orders, prescriptions, inventory, and eye exam bookings.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- =========================
-- ENUM TYPES
-- =========================
CREATE TYPE product_type AS ENUM (
    'eyeglasses',
    'sunglasses',
    'accessory',
    'contact_lenses'
);
CREATE TYPE product_gender AS ENUM ('hombre', 'mujer', 'unisex');
CREATE TYPE product_shape AS ENUM (
    'redondo',
    'cuadrado',
    'rectangular',
    'aviador'
);
CREATE TYPE order_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'cancelled'
);
CREATE TYPE payment_status AS ENUM (
    'unpaid',
    'pending',
    'paid',
    'failed',
    'refunded'
);
CREATE TYPE inventory_movement_type AS ENUM (
    'purchase',
    'sale',
    'reservation',
    'release',
    'return',
    'adjustment'
);
CREATE TYPE admin_role AS ENUM ('owner', 'admin', 'staff');
-- =========================
-- PRODUCTS
-- =========================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
    currency TEXT NOT NULL DEFAULT 'MXN',
    category TEXT NOT NULL,
    type product_type NOT NULL,
    gender product_gender NOT NULL,
    shape product_shape NOT NULL,
    frame_color TEXT NOT NULL,
    frame_size TEXT NOT NULL DEFAULT 'medium'
        CHECK (
            frame_size IN (
                'extra_small',
                'small',
                'medium',
                'large',
                'extra_large'
            )
        ),
    frame_material TEXT NOT NULL DEFAULT 'acetate'
        CHECK (
            frame_material IN (
                'acetate_stainless_steel',
                'stainless_steel',
                'acetate',
                'acetate_slash_stainless_steel',
                'titanium',
                'nylon',
                'titanium_nylon',
                'reform'
            )
        ),
    clip_on_compatible BOOLEAN NOT NULL DEFAULT FALSE,
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =========================
-- PRODUCT IMAGES
-- =========================
CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_main BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (product_id, image_url)
);

-- =========================
-- CUSTOMERS
-- =========================
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'México',
    stripe_customer_id TEXT,
    auth_user_id TEXT,
    authjs_user_id TEXT,
    avatar_url TEXT,
    auth_synced_at TIMESTAMPTZ,
    auth_deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- =========================
-- AUTH.JS
-- =========================
CREATE TABLE users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name TEXT,
    email TEXT,
    "emailVerified" TIMESTAMPTZ,
    image TEXT
);
CREATE TABLE accounts (
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
    UNIQUE (provider, "providerAccountId")
);
CREATE TABLE sessions (
    id BIGSERIAL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL UNIQUE,
    "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires TIMESTAMPTZ NOT NULL
);
CREATE TABLE verification_token (
    identifier TEXT NOT NULL,
    expires TIMESTAMPTZ NOT NULL,
    token TEXT NOT NULL,
    PRIMARY KEY (identifier, token)
);
ALTER TABLE customers
ADD CONSTRAINT customers_authjs_user_id_fkey
FOREIGN KEY (authjs_user_id)
REFERENCES users(id)
ON DELETE SET NULL;
-- =========================
-- CUSTOMER ADDRESSES
-- =========================
CREATE TABLE customer_addresses (
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
-- =========================
-- CUSTOMER TAX PROFILES
-- =========================
CREATE TABLE customer_tax_profiles (
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
-- =========================
-- CUSTOMER FAVORITES
-- =========================
CREATE TABLE customer_favorites (
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (customer_id, product_id)
);
-- =========================
-- CUSTOMER STYLE QUIZ RESULTS
-- =========================
CREATE TABLE customer_style_quiz_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL UNIQUE REFERENCES customers(id) ON DELETE CASCADE,
    answers JSONB NOT NULL,
    recommendation_slugs TEXT[] NOT NULL DEFAULT '{}',
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- =========================
-- ORDERS
-- =========================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES customers(id),
    status order_status NOT NULL DEFAULT 'pending',
    payment_status payment_status NOT NULL DEFAULT 'unpaid',
    subtotal_cents INTEGER NOT NULL CHECK (subtotal_cents >= 0),
    shipping_cents INTEGER NOT NULL DEFAULT 0 CHECK (shipping_cents >= 0),
    total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
    currency TEXT NOT NULL DEFAULT 'MXN',
    payment_method TEXT NOT NULL DEFAULT 'bank_transfer',
    delivery_method TEXT NOT NULL DEFAULT 'shipping',
    customer_notes TEXT,
    admin_notes TEXT,
    shipping_carrier TEXT,
    tracking_number TEXT,
    customer_visible_notes TEXT,
    stripe_checkout_session_id TEXT,
    stripe_payment_intent_id TEXT,
    stripe_payment_method_type TEXT,
    stripe_checkout_expires_at TIMESTAMPTZ,
    inventory_reservation_status TEXT NOT NULL DEFAULT 'none' CHECK (
        inventory_reservation_status IN ('none', 'active', 'committed', 'released')
    ),
    inventory_reserved_at TIMESTAMPTZ,
    inventory_committed_at TIMESTAMPTZ,
    inventory_released_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- =========================
-- INVOICE REQUESTS
-- =========================
CREATE TABLE invoice_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_number TEXT NOT NULL UNIQUE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    order_number TEXT NOT NULL,
    customer_name TEXT,
    purchase_email TEXT,
    order_date TIMESTAMPTZ,
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
-- =========================
-- ORDER ITEMS
-- =========================
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE
    SET NULL,
        product_name TEXT NOT NULL,
        product_slug TEXT NOT NULL,
        unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        lens_option TEXT NOT NULL,
        prescription_method TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- =========================
-- PRESCRIPTIONS
-- =========================
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    prescription_method TEXT NOT NULL,
    file_url TEXT,
    notes TEXT,
    right_sphere TEXT,
    right_cylinder TEXT,
    right_axis TEXT,
    left_sphere TEXT,
    left_cylinder TEXT,
    left_axis TEXT,
    pd TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- =========================
-- INVENTORY MOVEMENTS
-- =========================
CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    movement_type inventory_movement_type NOT NULL,
    quantity INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL CHECK (previous_stock >= 0),
    new_stock INTEGER NOT NULL CHECK (new_stock >= 0),
    reason TEXT,
    order_id UUID REFERENCES orders(id) ON DELETE
    SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- =========================
-- ADMIN USERS
-- =========================
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role admin_role NOT NULL DEFAULT 'staff',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- =========================
-- EYE EXAM BOOKINGS
-- =========================
CREATE TABLE eye_exam_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    booking_number TEXT NOT NULL,
    location_slug TEXT NOT NULL,
    location_name TEXT NOT NULL,
    service_name TEXT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TEXT NOT NULL CHECK (
        appointment_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
    ),
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    patient_age_group TEXT CHECK (
        patient_age_group IN ('adult', 'child')
    ),
    date_of_birth DATE,
    patient_details JSONB NOT NULL DEFAULT '{}'::JSONB,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'confirmed', 'cancelled', 'completed')
    ),
    manage_token_hash TEXT,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMPTZ,
    rescheduled_from_booking_id UUID REFERENCES eye_exam_bookings(id) ON DELETE
    SET NULL,
    google_calendar_event_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT eye_exam_bookings_booking_number_key UNIQUE (booking_number)
);
-- =========================
-- INDEXES
-- =========================
CREATE INDEX idx_products_type ON products(type);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_stock ON products(stock);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE UNIQUE INDEX idx_customers_stripe_customer_id ON customers(stripe_customer_id)
WHERE stripe_customer_id IS NOT NULL;
CREATE UNIQUE INDEX idx_customers_auth_user_id ON customers(auth_user_id)
WHERE auth_user_id IS NOT NULL;
CREATE UNIQUE INDEX idx_customers_authjs_user_id ON customers(authjs_user_id)
WHERE authjs_user_id IS NOT NULL;
CREATE UNIQUE INDEX idx_authjs_users_email_lower ON users(LOWER(email))
WHERE email IS NOT NULL;
CREATE INDEX idx_authjs_accounts_user_id ON accounts("userId");
CREATE INDEX idx_authjs_sessions_user_id ON sessions("userId");
CREATE INDEX idx_customer_addresses_customer_id ON customer_addresses(customer_id);
CREATE UNIQUE INDEX idx_customer_addresses_one_default ON customer_addresses(customer_id)
WHERE is_default;
CREATE INDEX idx_customer_tax_profiles_customer_id ON customer_tax_profiles(customer_id);
CREATE UNIQUE INDEX idx_customer_tax_profiles_one_default ON customer_tax_profiles(customer_id)
WHERE is_default;
CREATE INDEX idx_customer_favorites_product_id ON customer_favorites(product_id);
CREATE INDEX idx_customer_style_quiz_results_completed_at
ON customer_style_quiz_results(completed_at DESC);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE UNIQUE INDEX idx_orders_stripe_checkout_session_id ON orders(stripe_checkout_session_id)
WHERE stripe_checkout_session_id IS NOT NULL;
CREATE UNIQUE INDEX idx_orders_stripe_payment_intent_id ON orders(stripe_payment_intent_id)
WHERE stripe_payment_intent_id IS NOT NULL;
CREATE INDEX idx_orders_inventory_reservation_status ON orders(inventory_reservation_status);
CREATE INDEX idx_invoice_requests_status ON invoice_requests(status);
CREATE INDEX idx_invoice_requests_order_number ON invoice_requests(order_number);
CREATE INDEX idx_invoice_requests_customer_id ON invoice_requests(customer_id);
CREATE INDEX idx_invoice_requests_rfc ON invoice_requests(rfc);
CREATE INDEX idx_invoice_requests_created_at ON invoice_requests(created_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_prescriptions_order_item_id ON prescriptions(order_item_id);
CREATE INDEX idx_inventory_movements_product_id ON inventory_movements(product_id);
CREATE INDEX idx_inventory_movements_order_id ON inventory_movements(order_id);
CREATE INDEX idx_eye_exam_bookings_customer_email ON eye_exam_bookings(customer_email);
CREATE INDEX idx_eye_exam_bookings_customer_id ON eye_exam_bookings(customer_id);
CREATE INDEX idx_eye_exam_bookings_location_date ON eye_exam_bookings(location_slug, appointment_date);
CREATE INDEX idx_eye_exam_bookings_status ON eye_exam_bookings(status);
CREATE UNIQUE INDEX idx_eye_exam_bookings_manage_token_hash
ON eye_exam_bookings(manage_token_hash)
WHERE manage_token_hash IS NOT NULL;
CREATE INDEX idx_eye_exam_bookings_rescheduled_from
ON eye_exam_bookings(rescheduled_from_booking_id)
WHERE rescheduled_from_booking_id IS NOT NULL;
CREATE UNIQUE INDEX idx_eye_exam_bookings_active_slot ON eye_exam_bookings(
    location_slug,
    appointment_date,
    appointment_time
) WHERE status IN ('pending', 'confirmed');
-- =========================
-- APPOINTMENT EMAIL OUTBOX
-- =========================
CREATE TABLE appointment_email_outbox (
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
CREATE INDEX idx_appointment_email_outbox_status_created
ON appointment_email_outbox(status, created_at);
CREATE INDEX idx_appointment_email_outbox_booking
ON appointment_email_outbox(booking_id);
-- =========================
-- UPDATED_AT TRIGGER
-- =========================
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER update_products_updated_at BEFORE
UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE
UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_addresses_updated_at BEFORE
UPDATE ON customer_addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_tax_profiles_updated_at BEFORE
UPDATE ON customer_tax_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_style_quiz_results_updated_at BEFORE
UPDATE ON customer_style_quiz_results FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE
UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoice_requests_updated_at BEFORE
UPDATE ON invoice_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prescriptions_updated_at BEFORE
UPDATE ON prescriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_users_updated_at BEFORE
UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_eye_exam_bookings_updated_at BEFORE
UPDATE ON eye_exam_bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
