BEGIN;

ALTER TABLE products
ADD COLUMN IF NOT EXISTS frame_size TEXT NOT NULL DEFAULT 'medium'
    CHECK (
        frame_size IN (
            'extra_small',
            'small',
            'medium',
            'large',
            'extra_large'
        )
    ),
ADD COLUMN IF NOT EXISTS frame_material TEXT NOT NULL DEFAULT 'acetate'
    CHECK (
        frame_material IN (
            'acetate',
            'metal',
            'mixed',
            'titanium',
            'nylon'
        )
    ),
ADD COLUMN IF NOT EXISTS clip_on_compatible BOOLEAN NOT NULL DEFAULT FALSE;

COMMIT;
