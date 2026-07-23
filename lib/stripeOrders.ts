import "server-only";

import { pool } from "@/lib/db";

export type StripeCheckoutItemInput = {
  productSlug: string;
  quantity: number;
  lensOption: string;
  prescriptionMethod: string;
};

export type StripeCheckoutInput = {
  deliveryMethod?: "shipping" | "pickup";
  customerNotes?: string;
  customer?: {
    fullName?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  items?: StripeCheckoutItemInput[];
};

export type ReservedStripeOrder = {
  id: string;
  orderNumber: string;
  customerId: string;
  stripeCustomerId: string | null;
  customer: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  items: Array<{
    productId: string;
    productSlug: string;
    productName: string;
    unitPriceCents: number;
    quantity: number;
    lensOption: string;
    prescriptionMethod: string;
  }>;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  currency: "mxn";
};

export class StripeOrderError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "StripeOrderError";
    this.status = status;
  }
}

function cleanText(value: unknown) {
  return String(value || "").trim();
}

function cleanNullableText(value: unknown) {
  const cleanedValue = cleanText(value);
  return cleanedValue ? cleanedValue : null;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function generateOrderNumber() {
  return `OLM-${Date.now()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
}

function validateInput(input: StripeCheckoutInput) {
  if (!input.customer || !input.items || input.items.length === 0) {
    throw new StripeOrderError("Completa tus datos y agrega productos al carrito.");
  }

  if (input.items.length > 20) {
    throw new StripeOrderError("El pedido tiene demasiados productos.");
  }

  const deliveryMethod = cleanText(input.deliveryMethod);

  if (deliveryMethod !== "shipping" && deliveryMethod !== "pickup") {
    throw new StripeOrderError("Selecciona una forma de entrega válida.");
  }

  const customer = {
    fullName: cleanText(input.customer.fullName),
    email: cleanText(input.customer.email).toLowerCase(),
    phone: cleanText(input.customer.phone),
    address: cleanText(input.customer.address),
    city: cleanText(input.customer.city),
    state: cleanText(input.customer.state),
    zipCode: cleanText(input.customer.zipCode),
  };

  if (!customer.fullName || !customer.email || !customer.phone) {
    throw new StripeOrderError("Nombre, correo y teléfono son obligatorios.");
  }

  if (!isValidEmail(customer.email)) {
    throw new StripeOrderError("Escribe un correo electrónico válido.");
  }

  if (
    deliveryMethod === "shipping" &&
    (!customer.address || !customer.city || !customer.state || !customer.zipCode)
  ) {
    throw new StripeOrderError("Completa la dirección para el envío a domicilio.");
  }

  if (cleanText(input.customerNotes).length > 500) {
    throw new StripeOrderError("La nota del pedido no puede exceder 500 caracteres.");
  }

  for (const item of input.items) {
    if (!cleanText(item.productSlug)) {
      throw new StripeOrderError("No encontramos uno de los productos.");
    }

    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10) {
      throw new StripeOrderError("La cantidad de un producto no es válida.");
    }

    if (!cleanText(item.lensOption) || !cleanText(item.prescriptionMethod)) {
      throw new StripeOrderError("Completa las opciones de tus lentes.");
    }
  }

  return {
    deliveryMethod: deliveryMethod as "shipping" | "pickup",
    customerNotes: cleanNullableText(input.customerNotes),
    customer,
    items: input.items,
  };
}

export async function createReservedStripeOrder(
  input: StripeCheckoutInput
): Promise<ReservedStripeOrder> {
  const validated = validateInput(input);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const customerResult = await client.query(
      `
        INSERT INTO customers (
          full_name,
          email,
          phone,
          address,
          city,
          state,
          zip_code
        )
        VALUES ($1, LOWER($2), $3, $4, $5, $6, $7)
        ON CONFLICT ((LOWER(email)))
        DO UPDATE SET
          full_name = EXCLUDED.full_name,
          phone = EXCLUDED.phone,
          address = EXCLUDED.address,
          city = EXCLUDED.city,
          state = EXCLUDED.state,
          zip_code = EXCLUDED.zip_code
        RETURNING id, stripe_customer_id;
      `,
      [
        validated.customer.fullName,
        validated.customer.email,
        validated.customer.phone,
        validated.customer.address,
        validated.customer.city,
        validated.customer.state,
        validated.customer.zipCode,
      ]
    );

    const customerId = String(customerResult.rows[0].id);
    const stripeCustomerId = customerResult.rows[0].stripe_customer_id
      ? String(customerResult.rows[0].stripe_customer_id)
      : null;
    const preparedItems: ReservedStripeOrder["items"] = [];
    let subtotalCents = 0;

    for (const item of validated.items) {
      const productResult = await client.query(
        `
          SELECT id, slug, name, price_cents, currency, stock, is_active
          FROM products
          WHERE slug = $1
          LIMIT 1
          FOR UPDATE;
        `,
        [cleanText(item.productSlug)]
      );

      const product = productResult.rows[0];

      if (!product) {
        throw new StripeOrderError(
          `Producto no encontrado: ${cleanText(item.productSlug)}`,
          404
        );
      }

      if (!product.is_active) {
        throw new StripeOrderError(`${product.name} ya no está disponible.`);
      }

      if (String(product.currency).toUpperCase() !== "MXN") {
        throw new StripeOrderError(`${product.name} no está disponible en MXN.`);
      }

      if (Number(product.stock) < item.quantity) {
        throw new StripeOrderError(
          `La cantidad solicitada de ${product.name} ya no está disponible.`
        );
      }

      const unitPriceCents = Number(product.price_cents);
      subtotalCents += unitPriceCents * item.quantity;

      preparedItems.push({
        productId: String(product.id),
        productSlug: String(product.slug),
        productName: String(product.name),
        unitPriceCents,
        quantity: item.quantity,
        lensOption: cleanText(item.lensOption),
        prescriptionMethod: cleanText(item.prescriptionMethod),
      });
    }

    const shippingCents = 0;
    const totalCents = subtotalCents + shippingCents;
    const orderResult = await client.query(
      `
        INSERT INTO orders (
          order_number,
          customer_id,
          status,
          payment_status,
          payment_method,
          delivery_method,
          customer_notes,
          subtotal_cents,
          shipping_cents,
          total_cents,
          inventory_reservation_status,
          inventory_reserved_at
        )
        VALUES (
          $1,
          $2,
          'pending',
          'pending',
          'stripe',
          $3,
          $4,
          $5,
          $6,
          $7,
          'active',
          NOW()
        )
        RETURNING id, order_number;
      `,
      [
        generateOrderNumber(),
        customerId,
        validated.deliveryMethod,
        validated.customerNotes,
        subtotalCents,
        shippingCents,
        totalCents,
      ]
    );

    const orderId = String(orderResult.rows[0].id);
    const orderNumber = String(orderResult.rows[0].order_number);

    for (const item of preparedItems) {
      const stockResult = await client.query(
        `
          UPDATE products
          SET stock = stock - $1
          WHERE id = $2
          RETURNING stock + $1 AS previous_stock, stock AS new_stock;
        `,
        [item.quantity, item.productId]
      );

      const stock = stockResult.rows[0];

      await client.query(
        `
          INSERT INTO order_items (
            order_id,
            product_id,
            product_name,
            product_slug,
            unit_price_cents,
            quantity,
            lens_option,
            prescription_method
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
        `,
        [
          orderId,
          item.productId,
          item.productName,
          item.productSlug,
          item.unitPriceCents,
          item.quantity,
          item.lensOption,
          item.prescriptionMethod,
        ]
      );

      await client.query(
        `
          INSERT INTO inventory_movements (
            product_id,
            movement_type,
            quantity,
            previous_stock,
            new_stock,
            reason,
            order_id
          )
          VALUES ($1, 'reservation', $2, $3, $4, $5, $6);
        `,
        [
          item.productId,
          -item.quantity,
          Number(stock.previous_stock),
          Number(stock.new_stock),
          "Stripe checkout reservation",
          orderId,
        ]
      );
    }

    await client.query("COMMIT");

    return {
      id: orderId,
      orderNumber,
      customerId,
      stripeCustomerId,
      customer: validated.customer,
      items: preparedItems,
      subtotalCents,
      shippingCents,
      totalCents,
      currency: "mxn",
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function saveStripeCustomerId(customerId: string, stripeCustomerId: string) {
  await pool.query(
    `
      UPDATE customers
      SET stripe_customer_id = COALESCE(stripe_customer_id, $2)
      WHERE id = $1;
    `,
    [customerId, stripeCustomerId]
  );
}

export async function attachStripeSessionToOrder(
  orderId: string,
  sessionId: string,
  expiresAt: number
) {
  await pool.query(
    `
      UPDATE orders
      SET
        stripe_checkout_session_id = $2,
        stripe_checkout_expires_at = TO_TIMESTAMP($3)
      WHERE id = $1;
    `,
    [orderId, sessionId, expiresAt]
  );
}

type StripePaymentReferences = {
  checkoutSessionId: string;
  paymentIntentId: string | null;
  paymentMethodType: string | null;
};

export async function markStripeOrderPaymentPending(
  orderId: string,
  references: StripePaymentReferences
) {
  await pool.query(
    `
      UPDATE orders
      SET
        payment_status = CASE
          WHEN payment_status = 'paid' THEN payment_status
          ELSE 'pending'
        END,
        stripe_checkout_session_id = $2,
        stripe_payment_intent_id = COALESCE($3, stripe_payment_intent_id),
        stripe_payment_method_type = COALESCE($4, stripe_payment_method_type)
      WHERE id = $1;
    `,
    [
      orderId,
      references.checkoutSessionId,
      references.paymentIntentId,
      references.paymentMethodType,
    ]
  );
}

export async function completeStripeOrder(
  orderId: string,
  references: StripePaymentReferences
) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const orderResult = await client.query(
      `
        SELECT payment_status, inventory_reservation_status
        FROM orders
        WHERE id = $1
        FOR UPDATE;
      `,
      [orderId]
    );

    const order = orderResult.rows[0];

    if (!order) {
      throw new StripeOrderError("Stripe order not found", 404);
    }

    let reservationStatus = String(order.inventory_reservation_status);

    if (reservationStatus === "active") {
      await client.query(
        `
          UPDATE inventory_movements
          SET
            movement_type = 'sale',
            reason = 'Stripe payment confirmed'
          WHERE order_id = $1
            AND movement_type = 'reservation';
        `,
        [orderId]
      );

      reservationStatus = "committed";
    } else if (reservationStatus !== "committed") {
      const itemsResult = await client.query(
        `
          SELECT order_items.product_id, order_items.quantity, products.stock
          FROM order_items
          JOIN products ON products.id = order_items.product_id
          WHERE order_items.order_id = $1
          ORDER BY order_items.id
          FOR UPDATE OF products;
        `,
        [orderId]
      );

      const canReserve = itemsResult.rows.every(
        (item) => Number(item.stock) >= Number(item.quantity)
      );

      if (canReserve) {
        for (const item of itemsResult.rows) {
          const quantity = Number(item.quantity);
          const stockResult = await client.query(
            `
              UPDATE products
              SET stock = stock - $1
              WHERE id = $2
              RETURNING stock + $1 AS previous_stock, stock AS new_stock;
            `,
            [quantity, item.product_id]
          );

          const stock = stockResult.rows[0];

          await client.query(
            `
              INSERT INTO inventory_movements (
                product_id,
                movement_type,
                quantity,
                previous_stock,
                new_stock,
                reason,
                order_id
              )
              VALUES ($1, 'sale', $2, $3, $4, $5, $6);
            `,
            [
              item.product_id,
              -quantity,
              Number(stock.previous_stock),
              Number(stock.new_stock),
              "Stripe payment confirmed after reservation release",
              orderId,
            ]
          );
        }

        reservationStatus = "committed";
      }
    }

    const needsInventoryReview = reservationStatus !== "committed";

    await client.query(
      `
        UPDATE orders
        SET
          payment_status = 'paid',
          status = CASE
            WHEN $5::boolean THEN 'pending'::order_status
            WHEN status IN ('pending', 'cancelled') THEN 'processing'::order_status
            ELSE status
          END,
          stripe_checkout_session_id = $2,
          stripe_payment_intent_id = COALESCE($3, stripe_payment_intent_id),
          stripe_payment_method_type = COALESCE($4, stripe_payment_method_type),
          inventory_reservation_status = $6,
          inventory_committed_at = CASE WHEN $6 = 'committed' THEN NOW() ELSE inventory_committed_at END,
          paid_at = COALESCE(paid_at, NOW()),
          admin_notes = CASE
            WHEN $5::boolean THEN CONCAT_WS(
              E'\n',
              NULLIF(admin_notes, ''),
              'Stripe confirmó el pago, pero el inventario necesita revisión manual.'
            )
            ELSE admin_notes
          END
        WHERE id = $1;
      `,
      [
        orderId,
        references.checkoutSessionId,
        references.paymentIntentId,
        references.paymentMethodType,
        needsInventoryReview,
        reservationStatus,
      ]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function releaseStripeOrderReservation(orderId: string, reason: string) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const orderResult = await client.query(
      `
        SELECT payment_status, inventory_reservation_status
        FROM orders
        WHERE id = $1
        FOR UPDATE;
      `,
      [orderId]
    );

    const order = orderResult.rows[0];

    if (!order || order.payment_status === "paid") {
      await client.query("COMMIT");
      return;
    }

    if (order.inventory_reservation_status === "active") {
      const itemsResult = await client.query(
        `
          SELECT order_items.product_id, order_items.quantity
          FROM order_items
          JOIN products ON products.id = order_items.product_id
          WHERE order_items.order_id = $1
          ORDER BY order_items.id
          FOR UPDATE OF products;
        `,
        [orderId]
      );

      for (const item of itemsResult.rows) {
        const quantity = Number(item.quantity);
        const stockResult = await client.query(
          `
            UPDATE products
            SET stock = stock + $1
            WHERE id = $2
            RETURNING stock - $1 AS previous_stock, stock AS new_stock;
          `,
          [quantity, item.product_id]
        );

        const stock = stockResult.rows[0];

        await client.query(
          `
            INSERT INTO inventory_movements (
              product_id,
              movement_type,
              quantity,
              previous_stock,
              new_stock,
              reason,
              order_id
            )
            VALUES ($1, 'release', $2, $3, $4, $5, $6);
          `,
          [
            item.product_id,
            quantity,
            Number(stock.previous_stock),
            Number(stock.new_stock),
            reason,
            orderId,
          ]
        );
      }
    }

    await client.query(
      `
        UPDATE orders
        SET
          payment_status = 'failed',
          status = 'cancelled',
          inventory_reservation_status = 'released',
          inventory_released_at = COALESCE(inventory_released_at, NOW())
        WHERE id = $1
          AND payment_status <> 'paid';
      `,
      [orderId]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getStripeOrderSummary(checkoutSessionId: string) {
  const result = await pool.query(
    `
      SELECT
        orders.id,
        orders.order_number,
        orders.status,
        orders.payment_status,
        orders.stripe_payment_method_type,
        orders.total_cents,
        orders.currency,
        customers.email
      FROM orders
      JOIN customers ON customers.id = orders.customer_id
      WHERE orders.stripe_checkout_session_id = $1
      LIMIT 1;
    `,
    [checkoutSessionId]
  );

  return result.rows[0] || null;
}
