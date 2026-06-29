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

type UpdateProductBody = {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  type?: "eyeglasses" | "sunglasses";
  gender?: "hombre" | "mujer" | "unisex";
  shape?: "redondo" | "cuadrado" | "rectangular" | "aviador";
  frameColor?: string;
  stock?: number;
  isActive?: boolean;
  imageUrl?: string;
  imageAltText?: string;
  reason?: string;
};

function mapProduct(product: {
  id: string;
  slug: string;
  name: string;
  description: string;
  price_cents: number;
  currency: string;
  category: string;
  type: string;
  gender: string;
  shape: string;
  frame_color: string;
  stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}) {
  return {
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
  };
}

async function getProductDetails(slug: string) {
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

  const product = productResult.rows[0];

  if (!product) {
    return null;
  }

  const imagesResult = await pool.query(
    `
      SELECT
        id,
        image_url,
        alt_text,
        display_order,
        is_main
      FROM product_images
      WHERE product_id = $1
      ORDER BY is_main DESC, display_order ASC, created_at ASC;
    `,
    [product.id]
  );

  return {
    ...mapProduct(product),
    images: imagesResult.rows.map((image) => ({
      id: image.id,
      imageUrl: image.image_url,
      altText: image.alt_text,
      displayOrder: image.display_order,
      isMain: image.is_main,
    })),
  };
}

export async function GET(_request: Request, context: RouteContext) {
  const admin = await getAuthenticatedAdmin();

  try {
    const { slug } = await context.params;

    const product = await getProductDetails(slug);

    if (!product || (!admin && !product.isActive)) {



      return NextResponse.json(
        {
          error: "Product not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      product,
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

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await getAuthenticatedAdmin())) {
    return unauthorizedAdminResponse();
  }

  const client = await pool.connect();

  try {
    const { slug } = await context.params;
    const body = (await request.json()) as UpdateProductBody;

    if (body.price !== undefined && body.price < 0) {
      return NextResponse.json(
        {
          error: "Price must be greater than or equal to 0",
        },
        { status: 400 }
      );
    }

    if (
      body.stock !== undefined &&
      (!Number.isInteger(body.stock) || body.stock < 0)
    ) {
      return NextResponse.json(
        {
          error: "Stock must be a whole number greater than or equal to 0",
        },
        { status: 400 }
      );
    }

    await client.query("BEGIN");

    const currentProductResult = await client.query(
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
        FOR UPDATE;
      `,
      [slug]
    );

    const currentProduct = currentProductResult.rows[0];

    if (!currentProduct) {
      await client.query("ROLLBACK");

      return NextResponse.json(
        {
          error: "Product not found",
        },
        { status: 404 }
      );
    }

    const nextName = body.name ?? currentProduct.name;
    const nextDescription = body.description ?? currentProduct.description;
    const nextPriceCents =
      body.price !== undefined
        ? Math.round(body.price * 100)
        : currentProduct.price_cents;
    const nextCategory = body.category ?? currentProduct.category;
    const nextType = body.type ?? currentProduct.type;
    const nextGender = body.gender ?? currentProduct.gender;
    const nextShape = body.shape ?? currentProduct.shape;
    const nextFrameColor = body.frameColor ?? currentProduct.frame_color;
    const nextStock = body.stock ?? currentProduct.stock;
    const nextIsActive = body.isActive ?? currentProduct.is_active;

    await client.query(
      `
        UPDATE products
        SET
          name = $1,
          description = $2,
          price_cents = $3,
          category = $4,
          type = $5::product_type,
          gender = $6::product_gender,
          shape = $7::product_shape,
          frame_color = $8,
          stock = $9,
          is_active = $10
        WHERE id = $11;
      `,
      [
        nextName,
        nextDescription,
        nextPriceCents,
        nextCategory,
        nextType,
        nextGender,
        nextShape,
        nextFrameColor,
        nextStock,
        nextIsActive,
        currentProduct.id,
      ]
    );

    if (nextStock !== currentProduct.stock) {
      await client.query(
        `
          INSERT INTO inventory_movements (
            product_id,
            movement_type,
            quantity,
            previous_stock,
            new_stock,
            reason
          )
          VALUES ($1, 'adjustment', $2, $3, $4, $5);
        `,
        [
          currentProduct.id,
          nextStock - currentProduct.stock,
          currentProduct.stock,
          nextStock,
          body.reason || "Admin product update",
        ]
      );
    }

    if (body.imageUrl !== undefined && body.imageUrl.trim() !== "") {
      await client.query(
        `
          UPDATE product_images
          SET is_main = false
          WHERE product_id = $1;
        `,
        [currentProduct.id]
      );

      await client.query(
        `
          INSERT INTO product_images (
            product_id,
            image_url,
            alt_text,
            display_order,
            is_main
          )
          VALUES ($1, $2, $3, 1, true)
          ON CONFLICT (product_id, image_url)
          DO UPDATE SET
            alt_text = EXCLUDED.alt_text,
            display_order = 1,
            is_main = true;
        `,
        [currentProduct.id, body.imageUrl, body.imageAltText || nextName]
      );
    }

    await client.query("COMMIT");

    const updatedProduct = await getProductDetails(slug);

    return NextResponse.json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Error updating product:", error);

    return NextResponse.json(
      {
        error: "Failed to update product",
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}



