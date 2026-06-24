import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

type OrderItemInput = {
  productSlug: string;
  quantity: number;
  lensOption: string;
  prescriptionMethod: string;
};

type CreateOrderInput = {
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

function generateOrderNumber() {
  return `OLM-${Date.now()}`;
}

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        orders.id,
        orders.order_number,
        orders.status,
        orders.payment_status,
        orders.subtotal_cents,
        orders.shipping_cents,
        orders.total_cents,
        orders.currency,
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
        subtotal: order.subtotal_cents / 100,
        shipping: order.shipping_cents / 100,
        total: order.total_cents / 100,
        currency: order.currency,
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

  try {
    const body = (await request.json()) as CreateOrderInput;

    if (!body.customer || !body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: "Customer and items are required" },
        { status: 400 }
      );
    }

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
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id;
      `,
      [
        body.customer.fullName,
        body.customer.email,
        body.customer.phone,
        body.customer.address,
        body.customer.city,
        body.customer.state,
        body.customer.zipCode,
      ]
    );

    const customerId = customerResult.rows[0].id;

    let subtotalCents = 0;

    const preparedItems = [];

    for (const item of body.items) {
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
        [item.productSlug]
      );

      if (productResult.rows.length === 0) {
        throw new Error(`Product not found: ${item.productSlug}`);
      }

      const product = productResult.rows[0];

      if (!product.is_active) {
        throw new Error(`Product is inactive: ${item.productSlug}`);
      }

      if (product.stock < item.quantity) {
        throw new Error(`Not enough stock for: ${item.productSlug}`);
      }

      const lineTotalCents = product.price_cents * item.quantity;
      subtotalCents += lineTotalCents;

      preparedItems.push({
        productId: product.id,
        productSlug: product.slug,
        productName: product.name,
        unitPriceCents: product.price_cents,
        quantity: item.quantity,
        lensOption: item.lensOption,
        prescriptionMethod: item.prescriptionMethod,
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
        subtotal_cents,
        shipping_cents,
        total_cents
      ) VALUES ($1, $2, 'pending', 'unpaid', $3, $4, $5)
      RETURNING id, order_number;
      `,
      [
        generateOrderNumber(),
        customerId,
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

    return NextResponse.json(
      {
        order: {
          id: order.id,
          orderNumber: order.order_number,
          subtotal: subtotalCents / 100,
          shipping: shippingCents / 100,
          total: totalCents / 100,
          currency: "MXN",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Error creating order:", error);

    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

