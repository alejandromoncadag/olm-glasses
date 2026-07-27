import { NextResponse } from "next/server";

import { getOptionalAuthenticatedCustomer } from "@/lib/customerAccounts";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

type StoredCartItem = {
  slug: string;
  name: string;
  price: number;
  quantity: number;
  lensOption: string;
  prescriptionMethod: string;
};

function cleanText(value: unknown, maxLength: number) {
  return String(value || "").trim().slice(0, maxLength);
}

function parseItems(value: unknown): StoredCartItem[] | null {
  if (!Array.isArray(value) || value.length > 50) return null;

  const items: StoredCartItem[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object") return null;

    const candidate = item as Record<string, unknown>;
    const slug = cleanText(candidate.slug, 240);
    const name = cleanText(candidate.name, 240);
    const price = Number(candidate.price);
    const quantity = Number(candidate.quantity);
    const lensOption = cleanText(candidate.lensOption, 240);
    const prescriptionMethod = cleanText(
      candidate.prescriptionMethod,
      240
    );

    if (
      !slug ||
      !name ||
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 99
    ) {
      return null;
    }

    items.push({
      slug,
      name,
      price,
      quantity,
      lensOption,
      prescriptionMethod,
    });
  }

  return items;
}

export async function GET() {
  const customer = await getOptionalAuthenticatedCustomer();

  if (!customer) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const result = await pool.query(
    `
      SELECT items
      FROM customer_carts
      WHERE customer_id = $1
      LIMIT 1
    `,
    [customer.customerId]
  );

  return NextResponse.json({
    items: result.rows[0]?.items || [],
  });
}

export async function PUT(request: Request) {
  const customer = await getOptionalAuthenticatedCustomer();

  if (!customer) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const items = parseItems(body?.items);

  if (!items) {
    return NextResponse.json(
      { error: "El carrito no tiene un formato válido." },
      { status: 400 }
    );
  }

  await pool.query(
    `
      INSERT INTO customer_carts (customer_id, items)
      VALUES ($1, $2::jsonb)
      ON CONFLICT (customer_id)
      DO UPDATE SET
        items = EXCLUDED.items,
        updated_at = NOW()
    `,
    [customer.customerId, JSON.stringify(items)]
  );

  return NextResponse.json({ items });
}

export async function DELETE() {
  const customer = await getOptionalAuthenticatedCustomer();

  if (!customer) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  await pool.query(
    `DELETE FROM customer_carts WHERE customer_id = $1`,
    [customer.customerId]
  );

  return NextResponse.json({ items: [] });
}
