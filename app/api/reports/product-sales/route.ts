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
        COALESCE(
          MAX(products.id::text),
          MAX(order_items.product_id::text),
          order_items.product_slug
        ) AS product_id,
        order_items.product_slug AS product_slug,
        MAX(order_items.product_name) AS product_name,
        COALESCE(MAX(products.type::text), 'eyeglasses') AS product_type,
        COALESCE(MAX(products.category), 'Sin categoría') AS product_category,
        COALESCE(MAX(products.stock), 0)::int AS current_stock,
        COALESCE(SUM(order_items.quantity), 0)::int AS units_sold,
        COALESCE(
          SUM(order_items.unit_price_cents * order_items.quantity),
          0
        )::int AS revenue_cents,
        COUNT(DISTINCT orders.id)::int AS order_count
      FROM order_items
      JOIN orders ON orders.id = order_items.order_id
      LEFT JOIN products
        ON products.id = order_items.product_id
        OR products.slug = order_items.product_slug
      WHERE orders.status::text != 'cancelled'
      GROUP BY order_items.product_slug
      ORDER BY units_sold DESC, revenue_cents DESC
      LIMIT 10;
    `);

        return NextResponse.json({
            products: result.rows.map((product) => ({
                productId: product.product_id,
                slug: product.product_slug,
                name: product.product_name,
                type: product.product_type,
                category: product.product_category,
                currentStock: product.current_stock,
                unitsSold: product.units_sold,
                revenue: product.revenue_cents / 100,
                orderCount: product.order_count,
            })),
        });
    } catch (error) {
        console.error("Error fetching product sales report:", error);

        return NextResponse.json(
            { error: "Failed to fetch product sales report" },
            { status: 500 }
        );
    }
}




