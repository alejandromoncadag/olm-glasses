import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

type OrderStatusBody = {
  orderNumber?: string;
  email?: string;
};

function normalizeOrderNumber(orderNumber: string) {
  return orderNumber.trim().toUpperCase();
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as OrderStatusBody;

    const orderNumber = body.orderNumber
      ? normalizeOrderNumber(body.orderNumber)
      : "";

    const email = body.email ? normalizeEmail(body.email) : "";

    if (!orderNumber || !email) {
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
          orders.shipping_carrier,
          orders.tracking_number,
          orders.customer_visible_notes,
          orders.created_at,
          customers.full_name,
          customers.email
        FROM orders
        JOIN customers ON customers.id = orders.customer_id
        WHERE UPPER(orders.order_number) = $1
          AND LOWER(customers.email) = $2
        LIMIT 1;
      `,
      [orderNumber, email]
    );

    const order = orderResult.rows[0];

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const itemsResult = await pool.query(
      `
        SELECT
          order_items.id,
          order_items.product_slug,
          order_items.product_name,
          order_items.unit_price_cents,
          order_items.quantity,
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
        shippingCarrier: order.shipping_carrier,
        trackingNumber: order.tracking_number,
        customerVisibleNotes: order.customer_visible_notes,
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
          lineTotal: (item.unit_price_cents * item.quantity) / 100,
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

