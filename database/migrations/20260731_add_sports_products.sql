BEGIN;

WITH upserted AS (
    INSERT INTO products (
        slug, name, description, price_cents, currency, category, type,
        gender, shape, frame_color, frame_size, frame_material,
        clip_on_compatible, stock, is_active
    )
    VALUES
        (
            'court-air', 'Court Air',
            'Armazón deportivo ligero y estable para tenis y pádel, listo para personalizarse con graduación.',
            249900, 'MXN', 'Deportivos · Tenis y pádel', 'eyeglasses',
            'unisex', 'rectangular', 'marfil', 'medium', 'nylon',
            FALSE, 12, TRUE
        ),
        (
            'alpine-shield', 'Alpine Shield',
            'Lentes de sol envolventes para montaña y esquí, con cobertura amplia contra viento y luz intensa.',
            329900, 'MXN', 'Deportivos · Esquí y montaña', 'sunglasses',
            'hombre', 'aviador', 'espresso', 'large', 'titanium_nylon',
            FALSE, 10, TRUE
        ),
        (
            'velocity-one', 'Velocity One',
            'Lentes de sol aerodinámicos para ciclismo y running, con ajuste ligero y agarre cómodo.',
            289900, 'MXN', 'Deportivos · Ciclismo y running', 'sunglasses',
            'mujer', 'rectangular', 'berry', 'medium', 'reform',
            FALSE, 14, TRUE
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
        stock = EXCLUDED.stock,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
    RETURNING id, slug
)
INSERT INTO product_images (
    product_id, image_url, alt_text, display_order, is_main
)
SELECT
    upserted.id,
    CASE upserted.slug
        WHEN 'court-air' THEN '/products/sports/court-air.png'
        WHEN 'alpine-shield' THEN '/products/sports/alpine-shield.png'
        WHEN 'velocity-one' THEN '/products/sports/velocity-one.png'
    END,
    CASE upserted.slug
        WHEN 'court-air' THEN 'Lentes deportivos Court Air para tenis'
        WHEN 'alpine-shield' THEN 'Lentes de sol deportivos Alpine Shield'
        WHEN 'velocity-one' THEN 'Lentes deportivos Velocity One para ciclismo'
    END,
    1,
    TRUE
FROM upserted
ON CONFLICT (product_id, image_url) DO UPDATE SET
    alt_text = EXCLUDED.alt_text,
    display_order = EXCLUDED.display_order,
    is_main = EXCLUDED.is_main;

COMMIT;
