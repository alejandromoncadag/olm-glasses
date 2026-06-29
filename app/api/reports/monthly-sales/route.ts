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
        TO_CHAR(DATE_TRUNC('month', orders.created_at), 'YYYY-MM') AS month_key,
        TO_CHAR(DATE_TRUNC('month', orders.created_at), 'Mon YYYY') AS month_label,
        COUNT(orders.id)::int AS order_count,
        COALESCE(SUM(orders.total_cents), 0)::int AS revenue_cents,
        COALESCE(
          SUM(
            CASE
              WHEN orders.payment_status::text = 'paid'
              THEN orders.total_cents
              ELSE 0
            END
          ),
          0
        )::int AS paid_revenue_cents,
        COALESCE(AVG(orders.total_cents), 0)::int AS average_order_cents
      FROM orders
      WHERE orders.status::text != 'cancelled'
      GROUP BY DATE_TRUNC('month', orders.created_at)
      ORDER BY DATE_TRUNC('month', orders.created_at) DESC
      LIMIT 12;
    `);

        return NextResponse.json({
            months: result.rows.map((month) => ({
                monthKey: month.month_key,
                monthLabel: month.month_label,
                orderCount: month.order_count,
                revenue: month.revenue_cents / 100,
                paidRevenue: month.paid_revenue_cents / 100,
                averageOrderValue: month.average_order_cents / 100,
            })),
        });
    } catch (error) {
        console.error("Error fetching monthly sales report:", error);

        return NextResponse.json(
            { error: "Failed to fetch monthly sales report" },
            { status: 500 }
        );
    }
}

