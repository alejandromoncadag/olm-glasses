import { randomUUID } from "node:crypto";

import { getCommerceOwner } from "@/lib/commerce/identity";
import { getCommerceMode } from "@/lib/commerce/mode";
import { commerceErrorResponse, commerceRequest } from "@/lib/commerce/serverClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ itemId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    if (getCommerceMode() !== "optica") return Response.json({ error: "Authoritative commerce is not active" }, { status: 409 });
    const itemId = Number((await context.params).itemId);
    if (!Number.isInteger(itemId) || itemId <= 0) return Response.json({ error: "Invalid cart item" }, { status: 400 });
    const owner = await getCommerceOwner();
    const cart = await commerceRequest(`/cart/items/${itemId}/acknowledge-price`, owner, {
      method: "POST",
      idempotencyKey: randomUUID(),
    });
    return Response.json({ mode: "optica", source: "opticaolm", cart });
  } catch (error) {
    return commerceErrorResponse(error);
  }
}
