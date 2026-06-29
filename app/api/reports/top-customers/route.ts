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
        customers.id AS customer_id,
        customers.full_name,
        customers.email,
        customers.phone,
        customers.city,
        customers.state,
        COUNT(orders.id)::int AS order_count,
        COALESCE(SUM(orders.total_cents), 0)::int AS total_spent_cents,
        MAX(orders.created_at) AS last_order_at
      FROM customers
      LEFT JOIN orders
        ON orders.customer_id = customers.id
        AND orders.status != 'cancelled'
      GROUP BY
        customers.id,
        customers.full_name,
        customers.email,
        customers.phone,
        customers.city,
        customers.state
      HAVING COUNT(orders.id) > 0
      ORDER BY total_spent_cents DESC, order_count DESC, last_order_at DESC
      LIMIT 10;
    `);

        return NextResponse.json({
            customers: result.rows.map((customer) => ({
                customerId: customer.customer_id,
                fullName: customer.full_name,
                email: customer.email,
                phone: customer.phone,
                city: customer.city,
                state: customer.state,
                orderCount: customer.order_count,
                totalSpent: customer.total_spent_cents / 100,
                lastOrderAt: customer.last_order_at,
            })),
        });
    } catch (error) {
        console.error("Error fetching top customers report:", error);

        return NextResponse.json(
            { error: "Failed to fetch top customers report" },
            { status: 500 }
        );
    }
}

