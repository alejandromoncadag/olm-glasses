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
            'nomada-clip-on',
            'Nómada Clip-on',
            'Armazón rectangular de acetato con clip-on solar verde. Dos estilos en una sola pieza.',
            239900,
            'MXN',
            'Lentes ópticos con clip-on',
            'eyeglasses',
            'unisex',
            'rectangular',
            'cafe',
            'medium',
            'acetate',
            TRUE,
            10,
            TRUE
        ),
        (
            'brisa-clip-on',
            'Brisa Clip-on',
            'Armazón cuadrado translúcido con clip-on solar ahumado para un cambio de look inmediato.',
            249900,
            'MXN',
            'Lentes ópticos con clip-on',
            'eyeglasses',
            'unisex',
            'cuadrado',
            'transparente',
            'medium',
            'acetate_stainless_steel',
            TRUE,
            10,
            TRUE
        ),
        (
            'centro-clip-on',
            'Centro Clip-on',
            'Armazón redondo de acetato con clip-on solar café, ligero y versátil para todos los días.',
            229900,
            'MXN',
            'Lentes ópticos con clip-on',
            'eyeglasses',
            'unisex',
            'redondo',
            'cafe',
            'small',
            'acetate',
            TRUE,
            10,
            TRUE
        )
    ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        price_cents = EXCLUDED.price_cents,
        category = EXCLUDED.category,
        type = EXCLUDED.type,
        gender = EXCLUDED.gender,
        shape = EXCLUDED.shape,
        frame_color = EXCLUDED.frame_color,
        frame_size = EXCLUDED.frame_size,
        frame_material = EXCLUDED.frame_material,
        clip_on_compatible = EXCLUDED.clip_on_compatible,
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
        WHEN 'nomada-clip-on' THEN '/products/clip-ons/nomada.webp'
        WHEN 'brisa-clip-on' THEN '/products/clip-ons/brisa.webp'
        WHEN 'centro-clip-on' THEN '/products/clip-ons/centro.webp'
    END,
    CASE upserted.slug
        WHEN 'nomada-clip-on' THEN 'Armazón Nómada con clip-on solar verde'
        WHEN 'brisa-clip-on' THEN 'Armazón Brisa con clip-on solar ahumado'
        WHEN 'centro-clip-on' THEN 'Armazón Centro con clip-on solar café'
    END,
    1,
    TRUE
FROM upserted
ON CONFLICT (product_id, image_url) DO UPDATE SET
    alt_text = EXCLUDED.alt_text,
    display_order = EXCLUDED.display_order,
    is_main = EXCLUDED.is_main;

COMMIT;
