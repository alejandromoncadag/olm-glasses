import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    customerId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { customerId } = await context.params;

    const customerResult = await pool.query(
      `
        SELECT
          customers.id,
          customers.full_name,
          customers.email,
          customers.phone,
          customers.address,
          customers.city,
          customers.state,
          customers.zip_code,
          customers.country,
          customers.created_at,
          customers.updated_at
        FROM customers
        WHERE customers.id = $1
        LIMIT 1;
      `,
      [customerId]
    );

    const customer = customerResult.rows[0];

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    const ordersResult = await pool.query(
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
          orders.updated_at
        FROM orders
        WHERE orders.customer_id = $1
        ORDER BY orders.created_at DESC;
      `,
      [customerId]
    );

    return NextResponse.json({
      customer: {
        id: customer.id,
        fullName: customer.full_name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        zipCode: customer.zip_code,
        country: customer.country,
        createdAt: customer.created_at,
        updatedAt: customer.updated_at,
        orders: ordersResult.rows.map((order) => ({
          id: order.id,
          orderNumber: order.order_number,
          status: order.status,
          paymentStatus: order.payment_status,
          subtotal: order.subtotal_cents / 100,
          shipping: order.shipping_cents / 100,
          total: order.total_cents / 100,
          currency: order.currency,
          createdAt: order.created_at,
          updatedAt: order.updated_at,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching customer:", error);

    return NextResponse.json(
      { error: "Failed to fetch customer" },
      { status: 500 }
    );
  }
}

