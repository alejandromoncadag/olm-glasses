BEGIN;

ALTER TABLE products
DROP CONSTRAINT IF EXISTS products_frame_material_check;

UPDATE products
SET frame_material = CASE frame_material
    WHEN 'metal' THEN 'stainless_steel'
    WHEN 'mixed' THEN 'acetate_stainless_steel'
    ELSE frame_material
END;

ALTER TABLE products
ADD CONSTRAINT products_frame_material_check
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
);

COMMIT;
