import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import {
  getAuthenticatedAdmin,
  unauthorizedAdminResponse,
} from "@/lib/requireAdmin";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

type AddProductImageBody = {
  imageUrl?: string;
  altText?: string;
};

function cleanText(value: string | undefined) {
  return String(value || "").trim();
}

export async function POST(request: Request, context: RouteContext) {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    return unauthorizedAdminResponse();
  }

  const client = await pool.connect();

  try {
    const { slug } = await context.params;
    const body = (await request.json()) as AddProductImageBody;

    const imageUrl = cleanText(body.imageUrl);
    const altText = cleanText(body.altText);

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    await client.query("BEGIN");

    const productResult = await client.query(
      `
        SELECT id, name
        FROM products
        WHERE slug = $1
        LIMIT 1;
      `,
      [slug]
    );

    const product = productResult.rows[0];

    if (!product) {
      await client.query("ROLLBACK");

      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const imageStatsResult = await client.query(
      `
        SELECT
          COUNT(*)::int AS image_count,
          COALESCE(MAX(display_order), 0) + 1 AS next_display_order
        FROM product_images
        WHERE product_id = $1;
      `,
      [product.id]
    );

    const imageStats = imageStatsResult.rows[0];
    const isFirstImage = imageStats.image_count === 0;
    const displayOrder = imageStats.next_display_order;

    const imageResult = await client.query(
      `
        INSERT INTO product_images (
          product_id,
          image_url,
          alt_text,
          display_order,
          is_main
        )
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (product_id, image_url)
        DO UPDATE SET
          alt_text = EXCLUDED.alt_text
        RETURNING
          id,
          image_url,
          alt_text,
          display_order,
          is_main,
          created_at;
      `,
      [
        product.id,
        imageUrl,
        altText || product.name,
        displayOrder,
        isFirstImage,
      ]
    );

    await client.query("COMMIT");

    const image = imageResult.rows[0];

    return NextResponse.json(
      {
        image: {
          id: image.id,
          imageUrl: image.image_url,
          altText: image.alt_text,
          displayOrder: image.display_order,
          isMain: image.is_main,
          createdAt: image.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Error adding product image:", error);

    return NextResponse.json(
      { error: "Failed to add product image" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}


