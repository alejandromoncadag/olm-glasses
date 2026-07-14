import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import {
  getAuthenticatedAdmin,
  unauthorizedAdminResponse,
} from "@/lib/requireAdmin";

export const runtime = "nodejs";

function mapMovement(movement: {
  id: string;
  movement_type: string;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason: string | null;
  created_at: string;
  product_id: string;
  product_slug: string;
  product_name: string;
  product_category: string;
  product_type: string;
  product_stock: number;
  product_is_active: boolean;
}) {
  return {
    id: movement.id,
    movementType: movement.movement_type,
    quantity: movement.quantity,
    previousStock: movement.previous_stock,
    newStock: movement.new_stock,
    reason: movement.reason,
    createdAt: movement.created_at,
    product: {
      id: movement.product_id,
      slug: movement.product_slug,
      name: movement.product_name,
      category: movement.product_category,
      type: movement.product_type,
      stock: movement.product_stock,
      isActive: movement.product_is_active,
    },
  };
}

export async function GET(request: NextRequest) {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    return unauthorizedAdminResponse();
  }

  try {
    const searchParams = request.nextUrl.searchParams;

    const limitParam = Number(searchParams.get("limit") || 300);
    const limit =
      Number.isInteger(limitParam) && limitParam > 0 && limitParam <= 500
        ? limitParam
        : 300;

    const result = await pool.query(
      `
        SELECT
          inventory_movements.id,
          inventory_movements.movement_type,
          inventory_movements.quantity,
          inventory_movements.previous_stock,
          inventory_movements.new_stock,
          inventory_movements.reason,
          inventory_movements.created_at,
          products.id AS product_id,
          products.slug AS product_slug,
          products.name AS product_name,
          products.category AS product_category,
          products.type AS product_type,
          products.stock AS product_stock,
          products.is_active AS product_is_active
        FROM inventory_movements
        INNER JOIN products
          ON products.id = inventory_movements.product_id
        ORDER BY inventory_movements.created_at DESC
        LIMIT $1;
      `,
      [limit]
    );

    return NextResponse.json({
      movements: result.rows.map(mapMovement),
    });
  } catch (error) {
    console.error("Error fetching inventory movements:", error);

    return NextResponse.json(
      { error: "Failed to fetch inventory movements" },
      { status: 500 }
    );
  }
}

