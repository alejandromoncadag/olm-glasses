import { NextResponse } from "next/server";

import { getOptionalAuthenticatedCustomer } from "@/lib/customerAccounts";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

async function listFavorites(customerId: string) {
  const result = await pool.query(
    `
      SELECT
        products.slug,
        customer_favorites.created_at
      FROM customer_favorites
      JOIN products ON products.id = customer_favorites.product_id
      WHERE customer_favorites.customer_id = $1
        AND products.is_active = TRUE
      ORDER BY customer_favorites.created_at DESC
    `,
    [customerId]
  );

  return result.rows.map((favorite) => ({
    slug: favorite.slug,
    likedAt: favorite.created_at,
  }));
}

export async function GET() {
  const customer = await getOptionalAuthenticatedCustomer();

  if (!customer) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  return NextResponse.json({
    favorites: await listFavorites(customer.customerId),
  });
}

export async function POST(request: Request) {
  const customer = await getOptionalAuthenticatedCustomer();

  if (!customer) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = await request.json();
  const requestedSlugs = Array.isArray(body.slugs)
    ? body.slugs
    : body.slug
      ? [body.slug]
      : [];
  const slugs = Array.from(
    new Set(
      requestedSlugs
        .map((slug: unknown) => String(slug || "").trim())
        .filter(Boolean)
    )
  ).slice(0, 50);

  if (slugs.length === 0) {
    return NextResponse.json(
      { error: "Selecciona al menos un producto." },
      { status: 400 }
    );
  }

  await pool.query(
    `
      INSERT INTO customer_favorites (customer_id, product_id)
      SELECT $1, products.id
      FROM products
      WHERE products.slug = ANY($2::text[])
        AND products.is_active = TRUE
      ON CONFLICT (customer_id, product_id) DO NOTHING
    `,
    [customer.customerId, slugs]
  );

  return NextResponse.json({
    favorites: await listFavorites(customer.customerId),
  });
}

export async function DELETE(request: Request) {
  const customer = await getOptionalAuthenticatedCustomer();

  if (!customer) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const slug = new URL(request.url).searchParams.get("slug")?.trim();

  if (slug) {
    await pool.query(
      `
        DELETE FROM customer_favorites
        WHERE customer_id = $1
          AND product_id = (
            SELECT id FROM products WHERE slug = $2 LIMIT 1
          )
      `,
      [customer.customerId, slug]
    );
  } else {
    await pool.query(
      `DELETE FROM customer_favorites WHERE customer_id = $1`,
      [customer.customerId]
    );
  }

  return NextResponse.json({
    favorites: await listFavorites(customer.customerId),
  });
}
