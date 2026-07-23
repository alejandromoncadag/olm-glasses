-- Replace public product imagery with original Óptica OLM assets.
-- This migration changes data only; it does not alter the database schema.
BEGIN;

DELETE FROM product_images
USING products
WHERE product_images.product_id = products.id
  AND products.slug IN (
    'modelo-clasico',
    'modelo-moderno',
    'modelo-premium',
    'modelo-test-api',
    'modelslug',
    'sol-clasico',
    'sol-premium',
    'sol-urbano'
  );

INSERT INTO product_images (
  product_id,
  image_url,
  alt_text,
  display_order,
  is_main
)
SELECT
  products.id,
  image_map.image_url,
  image_map.alt_text,
  1,
  TRUE
FROM products
JOIN (
  VALUES
    ('modelo-clasico', '/products/olm/modelo-clasico.webp', 'Armazón redondo negro Modelo Clásico'),
    ('modelo-moderno', '/products/olm/modelo-moderno.webp', 'Armazón cuadrado transparente Modelo Moderno'),
    ('modelo-premium', '/products/olm/modelo-premium.webp', 'Armazón rectangular café Modelo Premium'),
    ('modelo-test-api', '/products/olm/modelo-test-api.webp', 'Armazón rectangular negro Modelo Test API'),
    ('modelslug', '/products/olm/modelo-ejecutivo.webp', 'Lentes de sol cuadrados Modelo ejecutivo'),
    ('sol-clasico', '/products/olm/sol-clasico.webp', 'Lentes de sol aviador dorados Sol Clásico'),
    ('sol-premium', '/products/olm/sol-premium.webp', 'Lentes de sol redondos café Sol Premium'),
    ('sol-urbano', '/products/olm/sol-urbano.webp', 'Lentes de sol cuadrados negros Sol Urbano')
) AS image_map(slug, image_url, alt_text)
  ON products.slug = image_map.slug;

COMMIT;
