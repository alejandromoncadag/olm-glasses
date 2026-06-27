import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

type OrderStatusBody = {
  orderNumber?: string;
  email?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as OrderStatusBody;

    if (!body.orderNumber || !body.email) {
      return NextResponse.json(
        { error: "Order number and email are required" },
        { status: 400 }
      );
    }

    const orderResult = await pool.query(
      `
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
          customers.email
        FROM orders
        JOIN customers ON customers.id = orders.customer_id
        WHERE orders.order_number = $1
          AND LOWER(customers.email) = LOWER($2)
        LIMIT 1;
      `,
      [body.orderNumber.trim(), body.email.trim()]
    );

    const order = orderResult.rows[0];

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    const itemsResult = await pool.query(
      `
        SELECT
          order_items.id,
          order_items.product_slug,
          order_items.product_name,
          order_items.unit_price_cents,
          order_items.quantity,
          order_items.line_total_cents,
          order_items.lens_option,
          order_items.prescription_method
        FROM order_items
        WHERE order_items.order_id = $1
        ORDER BY order_items.created_at ASC;
      `,
      [order.id]
    );

    return NextResponse.json({
      order: {
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
        },
        items: itemsResult.rows.map((item) => ({
          id: item.id,
          productSlug: item.product_slug,
          productName: item.product_name,
          unitPrice: item.unit_price_cents / 100,
          quantity: item.quantity,
          lineTotal: item.line_total_cents / 100,
          lensOption: item.lens_option,
          prescriptionMethod: item.prescription_method,
        })),
      },
    });
  } catch (error) {
    console.error("Error checking order status:", error);

    return NextResponse.json(
      { error: "Failed to check order status" },
      { status: 500 }
    );
  }
}

