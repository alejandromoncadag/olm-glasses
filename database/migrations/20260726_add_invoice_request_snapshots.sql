BEGIN;

ALTER TABLE invoice_requests
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS purchase_email TEXT,
ADD COLUMN IF NOT EXISTS order_date TIMESTAMPTZ;

UPDATE invoice_requests AS invoice_request
SET
    customer_name = COALESCE(invoice_request.customer_name, customer.full_name),
    purchase_email = COALESCE(invoice_request.purchase_email, customer.email),
    order_date = COALESCE(invoice_request.order_date, orders.created_at)
FROM orders
JOIN customers AS customer ON customer.id = orders.customer_id
WHERE invoice_request.order_id = orders.id
  AND (
      invoice_request.customer_name IS NULL
      OR invoice_request.purchase_email IS NULL
      OR invoice_request.order_date IS NULL
  );

COMMIT;
