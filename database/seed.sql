-- OLM Glasses Seed Data
-- Test products for development.

INSERT INTO products (
  slug,
  name,
  description,
  price_cents,
  currency,
  category,
  type,
  gender,
  shape,
  frame_color,
  stock,
  is_active
) VALUES
(
  'modelo-clasico',
  'Modelo Clásico',
  'Un armazón clásico, ligero y cómodo para uso diario.',
  149900,
  'MXN',
  'Lentes ópticos',
  'eyeglasses',
  'unisex',
  'redondo',
  'negro',
  10,
  TRUE
),
(
  'modelo-moderno',
  'Modelo Moderno',
  'Diseño moderno con un estilo limpio y elegante.',
  179900,
  'MXN',
  'Lentes ópticos',
  'eyeglasses',
  'hombre',
  'cuadrado',
  'transparente',
  10,
  TRUE
),
(
  'modelo-premium',
  'Modelo Premium',
  'Armazón premium con acabados de alta calidad.',
  219900,
  'MXN',
  'Lentes ópticos',
  'eyeglasses',
  'mujer',
  'rectangular',
  'cafe',
  10,
  TRUE
),
(
  'sol-clasico',
  'Sol Clásico',
  'Lentes de sol clásicos para todos los días.',
  159900,
  'MXN',
  'Lentes de sol',
  'sunglasses',
  'unisex',
  'aviador',
  'dorado',
  10,
  TRUE
),
(
  'sol-urbano',
  'Sol Urbano',
  'Estilo urbano con protección y diseño moderno.',
  189900,
  'MXN',
  'Lentes de sol',
  'sunglasses',
  'hombre',
  'cuadrado',
  'negro',
  10,
  TRUE
),
(
  'sol-premium',
  'Sol Premium',
  'Lentes de sol premium con diseño elegante.',
  229900,
  'MXN',
  'Lentes de sol',
  'sunglasses',
  'mujer',
  'redondo',
  'cafe',
  10,
  TRUE
)
ON CONFLICT (slug) DO NOTHING;

-- Original Óptica OLM product images.

INSERT INTO product_images (
  product_id,
  image_url,
  alt_text,
  display_order,
  is_main
)
SELECT
  id,
  '/products/olm/modelo-clasico.webp',
  'Modelo Clásico',
  1,
  TRUE
FROM products
WHERE slug = 'modelo-clasico'
ON CONFLICT DO NOTHING;

INSERT INTO product_images (
  product_id,
  image_url,
  alt_text,
  display_order,
  is_main
)
SELECT
  id,
  '/products/olm/modelo-moderno.webp',
  'Modelo Moderno',
  1,
  TRUE
FROM products
WHERE slug = 'modelo-moderno'
ON CONFLICT DO NOTHING;

INSERT INTO product_images (
  product_id,
  image_url,
  alt_text,
  display_order,
  is_main
)
SELECT
  id,
  '/products/olm/modelo-premium.webp',
  'Modelo Premium',
  1,
  TRUE
FROM products
WHERE slug = 'modelo-premium'
ON CONFLICT DO NOTHING;

INSERT INTO product_images (
  product_id,
  image_url,
  alt_text,
  display_order,
  is_main
)
SELECT
  id,
  '/products/olm/sol-clasico.webp',
  'Sol Clásico',
  1,
  TRUE
FROM products
WHERE slug = 'sol-clasico'
ON CONFLICT DO NOTHING;

INSERT INTO product_images (
  product_id,
  image_url,
  alt_text,
  display_order,
  is_main
)
SELECT
  id,
  '/products/olm/sol-urbano.webp',
  'Sol Urbano',
  1,
  TRUE
FROM products
WHERE slug = 'sol-urbano'
ON CONFLICT DO NOTHING;

INSERT INTO product_images (
  product_id,
  image_url,
  alt_text,
  display_order,
  is_main
)
SELECT
  id,
  '/products/olm/sol-premium.webp',
  'Sol Premium',
  1,
  TRUE
FROM products
WHERE slug = 'sol-premium'
ON CONFLICT DO NOTHING;

-- Test admin user.

INSERT INTO admin_users (
  full_name,
  email,
  role,
  is_active
) VALUES (
  'Alejandro Moncada',
  'admin@olmglasses.com',
  'owner',
  TRUE
)
ON CONFLICT (email) DO NOTHING;

