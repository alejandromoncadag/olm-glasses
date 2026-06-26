import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

type CreateProductBody = {
  slug?: string;
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
  main_image_url: string | null;
  main_image_alt: string | null;
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
    mainImage: product.main_image_url
      ? {
          imageUrl: product.main_image_url,
          altText: product.main_image_alt,
        }
      : null,
  };
}

async function getProductBySlug(slug: string) {
  const result = await pool.query(
    `
      SELECT
        products.id,
        products.slug,
        products.name,
        products.description,
        products.price_cents,
        products.currency,
        products.category,
        products.type,
        products.gender,
        products.shape,
        products.frame_color,
        products.stock,
        products.is_active,
        products.created_at,
        products.updated_at,
        main_image.image_url AS main_image_url,
        main_image.alt_text AS main_image_alt
      FROM products
      LEFT JOIN LATERAL (
        SELECT
          image_url,
          alt_text
        FROM product_images
        WHERE product_images.product_id = products.id
        ORDER BY is_main DESC, display_order ASC, created_at ASC
        LIMIT 1
      ) AS main_image ON TRUE
      WHERE products.slug = $1
      LIMIT 1;
    `,
    [slug]
  );

  return result.rows[0] ? mapProduct(result.rows[0]) : null;
}

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        products.id,
        products.slug,
        products.name,
        products.description,
        products.price_cents,
        products.currency,
        products.category,
        products.type,
        products.gender,
        products.shape,
        products.frame_color,
        products.stock,
        products.is_active,
        products.created_at,
        products.updated_at,
        main_image.image_url AS main_image_url,
        main_image.alt_text AS main_image_alt
      FROM products
      LEFT JOIN LATERAL (
        SELECT
          image_url,
          alt_text
        FROM product_images
        WHERE product_images.product_id = products.id
        ORDER BY is_main DESC, display_order ASC, created_at ASC
        LIMIT 1
      ) AS main_image ON TRUE
      ORDER BY products.created_at DESC;
    `);

    return NextResponse.json({
      products: result.rows.map(mapProduct),
    });
  } catch (error) {
    console.error("Error fetching products:", error);

    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const client = await pool.connect();

  try {
    const body = (await request.json()) as CreateProductBody;

    if (
      !body.slug ||
      !body.name ||
      !body.description ||
      body.price === undefined ||
      !body.category ||
      !body.type ||
      !body.gender ||
      !body.shape ||
      !body.frameColor
    ) {
      return NextResponse.json(
        { error: "Missing required product fields" },
        { status: 400 }
      );
    }

    if (body.price < 0) {
      return NextResponse.json(
        { error: "Price must be greater than or equal to 0" },
        { status: 400 }
      );
    }

    const stock = body.stock ?? 0;

    if (!Number.isInteger(stock) || stock < 0) {
      return NextResponse.json(
        { error: "Stock must be a whole number greater than or equal to 0" },
        { status: 400 }
      );
    }

    const priceCents = Math.round(body.price * 100);
    const isActive = body.isActive ?? true;

    await client.query("BEGIN");

    const productResult = await client.query(
      `
        INSERT INTO products (
          slug,
          name,
          description,
          price_cents,
          category,
          type,
          gender,
          shape,
          frame_color,
          stock,
          is_active
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6::product_type,
          $7::product_gender,
          $8::product_shape,
          $9,
          $10,
          $11
        )
        RETURNING id, slug;
      `,
      [
        body.slug,
        body.name,
        body.description,
        priceCents,
        body.category,
        body.type,
        body.gender,
        body.shape,
        body.frameColor,
        stock,
        isActive,
      ]
    );

    const product = productResult.rows[0];

    if (body.imageUrl) {
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
          ON CONFLICT DO NOTHING;
        `,
        [product.id, body.imageUrl, body.imageAltText || body.name]
      );
    }

    if (stock > 0) {
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
          VALUES ($1, 'purchase', $2, 0, $2, $3);
        `,
        [product.id, stock, "Initial product stock"]
      );
    }

    await client.query("COMMIT");

    const createdProduct = await getProductBySlug(product.slug);

    return NextResponse.json(
      {
        message: "Product created successfully",
        product: createdProduct,
      },
      { status: 201 }
    );
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Error creating product:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      return NextResponse.json(
        { error: "A product with this slug already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}


