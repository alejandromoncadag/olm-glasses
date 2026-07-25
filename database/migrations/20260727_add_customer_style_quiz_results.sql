BEGIN;

CREATE TABLE IF NOT EXISTS customer_style_quiz_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL UNIQUE REFERENCES customers(id) ON DELETE CASCADE,
    answers JSONB NOT NULL,
    recommendation_slugs TEXT[] NOT NULL DEFAULT '{}',
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_style_quiz_results_completed_at
ON customer_style_quiz_results(completed_at DESC);

DROP TRIGGER IF EXISTS update_customer_style_quiz_results_updated_at
ON customer_style_quiz_results;

CREATE TRIGGER update_customer_style_quiz_results_updated_at
BEFORE UPDATE ON customer_style_quiz_results
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

COMMIT;
