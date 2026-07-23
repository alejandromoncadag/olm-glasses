import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import {
  getAuthenticatedAdmin,
  unauthorizedAdminResponse,
} from "@/lib/requireAdmin";
import { getOptionalAuthenticatedCustomer } from "@/lib/customerAccounts";

export const runtime = "nodejs";

type PaymentMethod = "bank_transfer" | "store_payment" | "cash_on_delivery";
type DeliveryMethod = "shipping" | "pickup";

type OrderItemInput = {
  productSlug: string;
  quantity: number;
  lensOption: string;
  prescriptionMethod: string;
};

type CreateOrderInput = {
  paymentMethod?: PaymentMethod;
  deliveryMethod?: DeliveryMethod;
  customerNotes?: string;
  customer: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  items: OrderItemInput[];
};

type PreparedOrderItem = {
  productId: string;
  productSlug: string;
  productName: string;
  unitPriceCents: number;
  quantity: number;
  lensOption: string;
  prescriptionMethod: string;
  previousStock: number;
  newStock: number;
};

function generateOrderNumber() {
  return `OLM-${Date.now()}`;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function cleanText(value: string | undefined) {
  return String(value || "").trim();
}

function cleanNullableText(value: string | undefined) {
  const cleanedValue = cleanText(value);

  return cleanedValue.length > 0 ? cleanedValue : null;
}

function getValidPaymentMethod(value: string | undefined) {
  const paymentMethod = cleanText(value);

  if (
    paymentMethod === "bank_transfer" ||
    paymentMethod === "store_payment" ||
    paymentMethod === "cash_on_delivery"
  ) {
    return paymentMethod;
  }

  return null;
}

function getValidDeliveryMethod(value: string | undefined) {
  const deliveryMethod = cleanText(value);

  if (deliveryMethod === "shipping" || deliveryMethod === "pickup") {
    return deliveryMethod;
  }

  return null;
}

function validateOrderInput(body: CreateOrderInput) {
  if (!body.customer || !body.items || body.items.length === 0) {
    return "Customer and items are required";
  }

  const paymentMethod = getValidPaymentMethod(body.paymentMethod);
  const deliveryMethod = getValidDeliveryMethod(body.deliveryMethod);

  if (!paymentMethod) {
    return "A valid payment method is required";
  }

  if (!deliveryMethod) {
    return "A valid delivery method is required";
  }

  if (cleanText(body.customerNotes).length > 500) {
    return "Customer notes are too long";
  }

  const customer = {
    fullName: cleanText(body.customer.fullName),
    email: cleanText(body.customer.email).toLowerCase(),
    phone: cleanText(body.customer.phone),
    address: cleanText(body.customer.address),
    city: cleanText(body.customer.city),
    state: cleanText(body.customer.state),
    zipCode: cleanText(body.customer.zipCode),
  };

  if (!customer.fullName || !customer.email || !customer.phone) {
    return "Customer name, email, and phone are required";
  }

  if (deliveryMethod === "shipping") {
    if (
      !customer.address ||
      !customer.city ||
      !customer.state ||
      !customer.zipCode
    ) {
      return "Shipping address fields are required";
    }
  }

  if (!isValidEmail(customer.email)) {
    return "A valid email is required";
  }

  if (body.items.length > 20) {
    return "Too many items in one order";
  }

  for (const item of body.items) {
    if (!cleanText(item.productSlug)) {
      return "Product slug is required";
    }

    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      return "Item quantity must be at least 1";
    }

    if (item.quantity > 10) {
      return "Item quantity is too high";
    }

    if (!cleanText(item.lensOption)) {
      return "Lens option is required";
    }

    if (!cleanText(item.prescriptionMethod)) {
      return "Prescription method is required";
    }
  }

  return null;
}

class CheckoutError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "CheckoutError";
    this.status = status;
  }
}

export async function GET() {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    return unauthorizedAdminResponse();
  }

  try {
    const result = await pool.query(`
      SELECT
        orders.id,
        orders.order_number,
        orders.status,
        orders.payment_status,
        orders.payment_method,
        orders.delivery_method,
        orders.customer_notes,
        orders.subtotal_cents,
        orders.shipping_cents,
        orders.total_cents,
        orders.currency,
        orders.shipping_carrier,
        orders.tracking_number,
        orders.customer_visible_notes,
        orders.created_at,
        customers.full_name,
        customers.email,
        customers.phone
      FROM orders
      JOIN customers ON customers.id = orders.customer_id
      ORDER BY orders.created_at DESC;
    `);

    return NextResponse.json({
      orders: result.rows.map((order) => ({
        id: order.id,
        orderNumber: order.order_number,
        status: order.status,
        paymentStatus: order.payment_status,
        paymentMethod: order.payment_method,
        deliveryMethod: order.delivery_method,
        customerNotes: order.customer_notes,
        subtotal: order.subtotal_cents / 100,
        shipping: order.shipping_cents / 100,
        total: order.total_cents / 100,
        currency: order.currency,
        shippingCarrier: order.shipping_carrier,
        trackingNumber: order.tracking_number,
        customerVisibleNotes: order.customer_visible_notes,
        createdAt: order.created_at,
        customer: {
          fullName: order.full_name,
          email: order.email,
          phone: order.phone,
        },
      })),
    });
  } catch (error) {
    console.error("Error fetching orders:", error);

    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const client = await pool.connect();
  let transactionStarted = false;

  try {
    const body = (await request.json()) as CreateOrderInput;
    const authenticatedCustomer = await getOptionalAuthenticatedCustomer();

    if (authenticatedCustomer && body.customer) {
      body.customer.email = authenticatedCustomer.email;
      body.customer.fullName =
        body.customer.fullName || authenticatedCustomer.fullName;
    }

    const validationError = validateOrderInput(body);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const paymentMethod = getValidPaymentMethod(body.paymentMethod);
    const deliveryMethod = getValidDeliveryMethod(body.deliveryMethod);

    if (!paymentMethod) {
      return NextResponse.json(
        { error: "A valid payment method is required" },
        { status: 400 }
      );
    }

    if (!deliveryMethod) {
      return NextResponse.json(
        { error: "A valid delivery method is required" },
        { status: 400 }
      );
    }

    const customerNotes = cleanNullableText(body.customerNotes);

    const customer = {
      fullName: cleanText(body.customer.fullName),
      email: cleanText(body.customer.email).toLowerCase(),
      phone: cleanText(body.customer.phone),
      address: cleanText(body.customer.address),
      city: cleanText(body.customer.city),
      state: cleanText(body.customer.state),
      zipCode: cleanText(body.customer.zipCode),
    };

    await client.query("BEGIN");
    transactionStarted = true;

    const customerResult = authenticatedCustomer
      ? await client.query(
          `
      UPDATE customers
      SET
        full_name = $2,
        email = LOWER($3),
        phone = $4,
        address = $5,
        city = $6,
        state = $7,
        zip_code = $8
      WHERE id = $1
      RETURNING id;
      `,
          [
            authenticatedCustomer.customerId,
            customer.fullName,
            customer.email,
            customer.phone,
            customer.address,
            customer.city,
            customer.state,
            customer.zipCode,
          ]
        )
      : await client.query(
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
      WHERE customers.authjs_user_id IS NULL
      RETURNING id;
      `,
          [
            customer.fullName,
            customer.email,
            customer.phone,
            customer.address,
            customer.city,
            customer.state,
            customer.zipCode,
          ]
        );

    if (customerResult.rows.length === 0) {
      throw new CheckoutError(
        "Este correo pertenece a una cuenta. Inicia sesión para continuar.",
        409
      );
    }

    const customerId = customerResult.rows[0].id;

    if (
      authenticatedCustomer &&
      deliveryMethod === "shipping" &&
      customer.address
    ) {
      const hasAddressResult = await client.query(
        `
          SELECT EXISTS(
            SELECT 1
            FROM customer_addresses
            WHERE customer_id = $1
              AND LOWER(address_line_1) = LOWER($2)
              AND LOWER(city) = LOWER($3)
              AND LOWER(state) = LOWER($4)
              AND postal_code = $5
          ) AS exists
        `,
        [
          customerId,
          customer.address,
          customer.city,
          customer.state,
          customer.zipCode,
        ]
      );

      if (!hasAddressResult.rows[0].exists) {
        const hasDefaultResult = await client.query(
          `
            SELECT EXISTS(
              SELECT 1
              FROM customer_addresses
              WHERE customer_id = $1 AND is_default = TRUE
            ) AS exists
          `,
          [customerId]
        );

        await client.query(
          `
            INSERT INTO customer_addresses (
              customer_id,
              label,
              recipient_name,
              phone,
              address_line_1,
              city,
              state,
              postal_code,
              country,
              is_default
            )
            VALUES ($1, 'Casa', $2, $3, $4, $5, $6, $7, 'México', $8)
          `,
          [
            customerId,
            customer.fullName,
            customer.phone,
            customer.address,
            customer.city,
            customer.state,
            customer.zipCode,
            !hasDefaultResult.rows[0].exists,
          ]
        );
      }
    }

    let subtotalCents = 0;
    const preparedItems: PreparedOrderItem[] = [];

    for (const item of body.items) {
      const productSlug = item.productSlug.trim();

      const productResult = await client.query(
        `
        SELECT
          id,
          slug,
          name,
          price_cents,
          stock,
          is_active
        FROM products
        WHERE slug = $1
        LIMIT 1;
        `,
        [productSlug]
      );

      if (productResult.rows.length === 0) {
        throw new CheckoutError(`Producto no encontrado: ${productSlug}`, 404);
      }

      const product = productResult.rows[0];

      if (!product.is_active) {
        throw new CheckoutError(`${product.name} ya no está disponible.`, 400);
      }

      if (product.stock < item.quantity) {
        throw new CheckoutError(
          `La cantidad solicitada de ${product.name} no está disponible.`,
          400
        );
      }

      const lineTotalCents = product.price_cents * item.quantity;
      subtotalCents += lineTotalCents;

      preparedItems.push({
        productId: product.id,
        productSlug: product.slug,
        productName: product.name,
        unitPriceCents: product.price_cents,
        quantity: item.quantity,
        lensOption: item.lensOption.trim(),
        prescriptionMethod: item.prescriptionMethod.trim(),
        previousStock: product.stock,
        newStock: product.stock - item.quantity,
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
        total_cents
      ) VALUES ($1, $2, 'pending', 'unpaid', $3, $4, $5, $6, $7, $8)
      RETURNING id, order_number;
      `,
      [
        generateOrderNumber(),
        customerId,
        paymentMethod,
        deliveryMethod,
        customerNotes,
        subtotalCents,
        shippingCents,
        totalCents,
      ]
    );

    const order = orderResult.rows[0];

    for (const item of preparedItems) {
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
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
        `,
        [
          order.id,
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
        UPDATE products
        SET stock = $1
        WHERE id = $2;
        `,
        [item.newStock, item.productId]
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
        ) VALUES ($1, 'sale', $2, $3, $4, $5, $6);
        `,
        [
          item.productId,
          -item.quantity,
          item.previousStock,
          item.newStock,
          "Customer order",
          order.id,
        ]
      );
    }

    await client.query("COMMIT");
    transactionStarted = false;

    return NextResponse.json(
      {
        order: {
          id: order.id,
          orderNumber: order.order_number,
          subtotal: subtotalCents / 100,
          shipping: shippingCents / 100,
          total: totalCents / 100,
          currency: "MXN",
          paymentMethod,
          deliveryMethod,
          customerNotes,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (transactionStarted) {
      await client.query("ROLLBACK");
    }

    console.error("Error creating order:", error);

    if (error instanceof CheckoutError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}


