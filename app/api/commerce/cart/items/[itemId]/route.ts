import { randomUUID } from "node:crypto";

import { getCommerceOwner } from "@/lib/commerce/identity";
import { getCommerceMode } from "@/lib/commerce/mode";
import { commerceErrorResponse, commerceRequest } from "@/lib/commerce/serverClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ itemId: string }> };

function parseItemId(value: string) {
  const itemId = Number(value);
  return Number.isInteger(itemId) && itemId > 0 ? itemId : null;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    if (getCommerceMode() !== "optica") return Response.json({ error: "Authoritative commerce is not active" }, { status: 409 });
    const itemId = parseItemId((await context.params).itemId);
    const quantity = Number(((await request.json()) as { quantity?: unknown }).quantity);
    if (!itemId || !Number.isInteger(quantity) || quantity <= 0) return Response.json({ error: "Invalid cart update" }, { status: 400 });
    const owner = await getCommerceOwner();
    const cart = await commerceRequest(`/cart/items/${itemId}`, owner, {
      method: "PATCH",
      body: { quantity },
      idempotencyKey: randomUUID(),
    });
    return Response.json({ mode: "optica", source: "opticaolm", cart });
  } catch (error) {
    return commerceErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    if (getCommerceMode() !== "optica") return Response.json({ error: "Authoritative commerce is not active" }, { status: 409 });
    const itemId = parseItemId((await context.params).itemId);
    if (!itemId) return Response.json({ error: "Invalid cart item" }, { status: 400 });
    const owner = await getCommerceOwner();
    const cart = await commerceRequest(`/cart/items/${itemId}`, owner, {
      method: "DELETE",
      idempotencyKey: randomUUID(),
    });
    return Response.json({ mode: "optica", source: "opticaolm", cart });
  } catch (error) {
    return commerceErrorResponse(error);
  }
}
