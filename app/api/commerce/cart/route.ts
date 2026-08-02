import { randomUUID } from "node:crypto";

import { getCommerceOwner } from "@/lib/commerce/identity";
import { getCommerceMode } from "@/lib/commerce/mode";
import { commerceErrorResponse, commerceRequest } from "@/lib/commerce/serverClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const mode = getCommerceMode();
    if (mode !== "optica") return Response.json({ mode, source: "legacy" });
    const owner = await getCommerceOwner();
    const cart = await commerceRequest("/cart", owner);
    return Response.json({ mode, source: "opticaolm", cart });
  } catch (error) {
    return commerceErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const mode = getCommerceMode();
    if (mode !== "optica") return Response.json({ error: "Authoritative commerce is not active" }, { status: 409 });
    const body = (await request.json()) as { productId?: unknown; quantity?: unknown };
    const productId = Number(body.productId);
    const quantity = Number(body.quantity ?? 1);
    if (!Number.isInteger(productId) || productId <= 0 || !Number.isInteger(quantity) || quantity <= 0) {
      return Response.json({ error: "Invalid cart item" }, { status: 400 });
    }
    const owner = await getCommerceOwner();
    const cart = await commerceRequest("/cart/items", owner, {
      method: "POST",
      body: { productId, quantity, configuration: {} },
      idempotencyKey: randomUUID(),
    });
    return Response.json({ mode, source: "opticaolm", cart });
  } catch (error) {
    return commerceErrorResponse(error);
  }
}

export async function DELETE() {
  try {
    const mode = getCommerceMode();
    if (mode !== "optica") return Response.json({ error: "Authoritative commerce is not active" }, { status: 409 });
    const owner = await getCommerceOwner();
    const cart = await commerceRequest("/cart/items", owner, {
      method: "DELETE",
      idempotencyKey: randomUUID(),
    });
    return Response.json({ mode, source: "opticaolm", cart });
  } catch (error) {
    return commerceErrorResponse(error);
  }
}
