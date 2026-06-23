import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;

    const productResult = await pool.query(
      `
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
      WHERE slug = $1
      LIMIT 1;
      `,
      [slug]
    );

    if (productResult.rows.length === 0) {
      return NextResponse.json(
        {
          error: "Product not found",
        },
        { status: 404 }
      );
    }

    const product = productResult.rows[0];

    const imageResult = await pool.query(
      `
      SELECT
        id,
        image_url,
        alt_text,
        display_order,
        is_main
      FROM product_images
      WHERE product_id = $1
      ORDER BY display_order ASC;
      `,
      [product.id]
    );

    return NextResponse.json({
      product: {
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
        images: imageResult.rows.map((image) => ({
          id: image.id,
          imageUrl: image.image_url,
          altText: image.alt_text,
          displayOrder: image.display_order,
          isMain: image.is_main,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching product:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch product",
      },
      { status: 500 }
    );
  }
}

