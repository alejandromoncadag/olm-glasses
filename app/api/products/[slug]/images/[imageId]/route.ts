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
    imageId: string;
  }>;
};

type UpdateProductImageBody = {
  altText?: string;
  displayOrder?: number;
  isMain?: boolean;
};

function hasField(object: object, field: string) {
  return Object.prototype.hasOwnProperty.call(object, field);
}

function cleanNullableText(value: string | undefined) {
  if (value === undefined) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    return unauthorizedAdminResponse();
  }

  const client = await pool.connect();

  try {
    const { slug, imageId } = await context.params;
    const body = (await request.json()) as UpdateProductImageBody;

    if (
      body.displayOrder !== undefined &&
      (!Number.isInteger(body.displayOrder) || body.displayOrder < 0)
    ) {
      return NextResponse.json(
        { error: "Display order must be a whole number 0 or greater" },
        { status: 400 }
      );
    }

    await client.query("BEGIN");

    const productResult = await client.query(
      `
        SELECT id
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

    const imageCheckResult = await client.query(
      `
        SELECT id
        FROM product_images
        WHERE id = $1
          AND product_id = $2
        LIMIT 1;
      `,
      [imageId, product.id]
    );

    if (!imageCheckResult.rows[0]) {
      await client.query("ROLLBACK");

      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    if (body.isMain === true) {
      await client.query(
        `
          UPDATE product_images
          SET is_main = false
          WHERE product_id = $1;
        `,
        [product.id]
      );
    }

    const hasAltText = hasField(body, "altText");
    const hasDisplayOrder = hasField(body, "displayOrder");
    const hasIsMain = hasField(body, "isMain");

    const imageResult = await client.query(
      `
        UPDATE product_images
        SET
          alt_text = CASE WHEN $1::boolean THEN $2::text ELSE alt_text END,
          display_order = CASE WHEN $3::boolean THEN $4::int ELSE display_order END,
          is_main = CASE WHEN $5::boolean THEN $6::boolean ELSE is_main END
        WHERE id = $7
          AND product_id = $8
        RETURNING
          id,
          image_url,
          alt_text,
          display_order,
          is_main,
          created_at;
      `,
      [
        hasAltText,
        cleanNullableText(body.altText),
        hasDisplayOrder,
        body.displayOrder ?? null,
        hasIsMain,
        body.isMain ?? null,
        imageId,
        product.id,
      ]
    );

    await client.query("COMMIT");

    const image = imageResult.rows[0];

    return NextResponse.json({
      image: {
        id: image.id,
        imageUrl: image.image_url,
        altText: image.alt_text,
        displayOrder: image.display_order,
        isMain: image.is_main,
        createdAt: image.created_at,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Error updating product image:", error);

    return NextResponse.json(
      { error: "Failed to update product image" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    return unauthorizedAdminResponse();
  }

  const client = await pool.connect();

  try {
    const { slug, imageId } = await context.params;

    await client.query("BEGIN");

    const productResult = await client.query(
      `
        SELECT id
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

    const deletedImageResult = await client.query(
      `
        DELETE FROM product_images
        WHERE id = $1
          AND product_id = $2
        RETURNING id, is_main;
      `,
      [imageId, product.id]
    );

    const deletedImage = deletedImageResult.rows[0];

    if (!deletedImage) {
      await client.query("ROLLBACK");

      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    if (deletedImage.is_main) {
      await client.query(
        `
          UPDATE product_images
          SET is_main = true
          WHERE id = (
            SELECT id
            FROM product_images
            WHERE product_id = $1
            ORDER BY display_order ASC, created_at ASC
            LIMIT 1
          );
        `,
        [product.id]
      );
    }

    await client.query("COMMIT");

    return NextResponse.json({
      message: "Image deleted successfully",
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Error deleting product image:", error);

    return NextResponse.json(
      { error: "Failed to delete product image" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}


