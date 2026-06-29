import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import {
  getAuthenticatedAdmin,
  unauthorizedAdminResponse,
} from "@/lib/requireAdmin";

export const runtime = "nodejs";

export async function GET() {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    return unauthorizedAdminResponse();
  }

  try {
    const result = await pool.query(`
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
        COUNT(orders.id)::int AS order_count,
        COALESCE(SUM(orders.total_cents), 0)::int AS total_spent_cents,
        MAX(orders.created_at) AS last_order_at
      FROM customers
      LEFT JOIN orders ON orders.customer_id = customers.id
      GROUP BY customers.id
      ORDER BY customers.created_at DESC;
    `);

    return NextResponse.json({
      customers: result.rows.map((customer) => ({
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
        orderCount: customer.order_count,
        totalSpent: customer.total_spent_cents / 100,
        lastOrderAt: customer.last_order_at,
      })),
    });
  } catch (error) {
    console.error("Error fetching customers:", error);

    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}