ALTER TYPE product_type ADD VALUE IF NOT EXISTS 'accessory';
ALTER TYPE product_type ADD VALUE IF NOT EXISTS 'contact_lenses';

BEGIN;

WITH upserted AS (
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
        frame_size,
        frame_material,
        clip_on_compatible,
        stock,
        is_active
    )
    VALUES
        (
            'estuche-espresso',
            'Estuche Espresso',
            'Estuche rígido con acabado café para cuidar tus lentes todos los días.',
            34900,
            'MXN',
            'Accesorios',
            'accessory',
            'unisex',
            'rectangular',
            'cafe',
            'medium',
            'acetate',
            FALSE,
            20,
            TRUE
        ),
        (
            'spray-pano-olm',
            'Spray + Paño OLM',
            'Kit compacto para mantener tus micas limpias y listas para usar.',
            18900,
            'MXN',
            'Accesorios',
            'accessory',
            'unisex',
            'rectangular',
            'transparente',
            'medium',
            'acetate',
            FALSE,
            30,
            TRUE
        ),
        (
            'taza-olm',
            'Taza OLM',
            'Taza de cerámica con un detalle inspirado en nuestros armazones.',
            29900,
            'MXN',
            'Accesorios',
            'accessory',
            'unisex',
            'redondo',
            'cafe',
            'medium',
            'acetate',
            FALSE,
            15,
            TRUE
        ),
        (
            'luma-daily-30',
            'Luma Daily 30',
            'Lentes de reemplazo diario pensados para una rutina simple y cómoda. Caja con 30 lentes.',
            89900,
            'MXN',
            'Lentes de contacto · Luma',
            'contact_lenses',
            'unisex',
            'redondo',
            'transparente',
            'medium',
            'nylon',
            FALSE,
            20,
            TRUE
        ),
        (
            'vistalens-comfort-6',
            'Vistalens Comfort 6',
            'Opción mensual para uso cotidiano, sujeta a valoración y adaptación. Caja con 6 lentes.',
            74900,
            'MXN',
            'Lentes de contacto · Vistalens',
            'contact_lenses',
            'unisex',
            'redondo',
            'transparente',
            'medium',
            'nylon',
            FALSE,
            20,
            TRUE
        ),
        (
            'nitida-toric-6',
            'Nítida Toric 6',
            'Lentes mensuales para personas con astigmatismo, con adaptación profesional. Caja con 6 lentes.',
            109900,
            'MXN',
            'Lentes de contacto · Nítida',
            'contact_lenses',
            'unisex',
            'redondo',
            'transparente',
            'medium',
            'nylon',
            FALSE,
            20,
            TRUE
        )
    ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        price_cents = EXCLUDED.price_cents,
        category = EXCLUDED.category,
        type = EXCLUDED.type,
        stock = EXCLUDED.stock,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
    RETURNING id, slug
)
INSERT INTO product_images (
    product_id,
    image_url,
    alt_text,
    display_order,
    is_main
)
SELECT
    upserted.id,
    CASE upserted.slug
        WHEN 'estuche-espresso' THEN '/products/accessories/estuche-espresso.webp'
        WHEN 'spray-pano-olm' THEN '/products/accessories/spray-limpiador.webp'
        WHEN 'taza-olm' THEN '/products/accessories/taza-olm.webp'
        WHEN 'luma-daily-30' THEN '/products/contacts/luma-daily.webp'
        WHEN 'vistalens-comfort-6' THEN '/products/contacts/vistalens-comfort.webp'
        WHEN 'nitida-toric-6' THEN '/products/contacts/nitida-toric.webp'
    END,
    CASE upserted.slug
        WHEN 'estuche-espresso' THEN 'Estuche café para lentes'
        WHEN 'spray-pano-olm' THEN 'Spray limpiador y paño para lentes'
        WHEN 'taza-olm' THEN 'Taza café de Óptica OLM'
        WHEN 'luma-daily-30' THEN 'Caja Luma Daily de lentes de contacto'
        WHEN 'vistalens-comfort-6' THEN 'Caja Vistalens Comfort de lentes de contacto'
        WHEN 'nitida-toric-6' THEN 'Caja Nítida Toric de lentes de contacto'
    END,
    1,
    TRUE
FROM upserted
ON CONFLICT (product_id, image_url) DO UPDATE SET
    alt_text = EXCLUDED.alt_text,
    display_order = EXCLUDED.display_order,
    is_main = EXCLUDED.is_main;

COMMIT;
