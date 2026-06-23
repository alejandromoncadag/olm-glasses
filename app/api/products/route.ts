import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        id,
        slug,
        name,
        description,
        price_cents,
        currency,
        category,
        type,
        gender,
        shape,
        frame_color,
        stock,
        is_active,
        created_at,
        updated_at
      FROM products
      ORDER BY created_at DESC;
    `);

    const products = result.rows.map((product) => ({
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      price: product.price_cents / 100,
      priceCents: product.price_cents,
      currency: product.currency,
      category: product.category,
      type: product.type,
      gender: product.gender,
      shape: product.shape,
      frameColor: product.frame_color,
      stock: product.stock,
      isActive: product.is_active,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
    }));

    return NextResponse.json({
      products,
    });
  } catch (error) {
    console.error("Error fetching products:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch products",
      },
      { status: 500 }
    );
  }
}
