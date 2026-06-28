import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        inventory_movements.id,
        inventory_movements.movement_type,
        inventory_movements.quantity,
        inventory_movements.previous_stock,
        inventory_movements.new_stock,
        inventory_movements.reason,
        inventory_movements.order_id,
        inventory_movements.created_at,
        products.slug AS product_slug,
        products.name AS product_name,
        orders.order_number
      FROM inventory_movements
      JOIN products ON products.id = inventory_movements.product_id
      LEFT JOIN orders ON orders.id = inventory_movements.order_id
      ORDER BY inventory_movements.created_at DESC;
    `);

    return NextResponse.json({
      inventoryMovements: result.rows.map((movement) => ({
        id: movement.id,
        movementType: movement.movement_type,
        quantity: movement.quantity,
        previousStock: movement.previous_stock,
        newStock: movement.new_stock,
        reason: movement.reason,
        orderId: movement.order_id,
        orderNumber: movement.order_number,
        createdAt: movement.created_at,
        product: {
          slug: movement.product_slug,
          name: movement.product_name,
        },
      })),
    });
  } catch (error) {
    console.error("Error fetching inventory movements:", error);

    return NextResponse.json(
      { error: "Failed to fetch inventory movements" },
      { status: 500 }
    );
  }
}



