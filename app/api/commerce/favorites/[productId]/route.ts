import { randomUUID } from "node:crypto";

import { getCommerceOwner } from "@/lib/commerce/identity";
import { getCommerceMode } from "@/lib/commerce/mode";
import { commerceErrorResponse, commerceRequest } from "@/lib/commerce/serverClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ productId: string }> };

async function parseProductId(context: RouteContext) {
  const productId = Number((await context.params).productId);
  return Number.isInteger(productId) && productId > 0 ? productId : null;
}

export async function PUT(_request: Request, context: RouteContext) {
  try {
    if (getCommerceMode() !== "optica") return Response.json({ error: "Authoritative commerce is not active" }, { status: 409 });
    const productId = await parseProductId(context);
    if (!productId) return Response.json({ error: "Invalid product" }, { status: 400 });
    const owner = await getCommerceOwner();
    const favorites = await commerceRequest(`/favorites/${productId}`, owner, {
      method: "PUT",
      idempotencyKey: randomUUID(),
    });
    return Response.json({ mode: "optica", source: "opticaolm", favorites });
  } catch (error) {
    return commerceErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    if (getCommerceMode() !== "optica") return Response.json({ error: "Authoritative commerce is not active" }, { status: 409 });
    const productId = await parseProductId(context);
    if (!productId) return Response.json({ error: "Invalid product" }, { status: 400 });
    const owner = await getCommerceOwner();
    const favorites = await commerceRequest(`/favorites/${productId}`, owner, {
      method: "DELETE",
      idempotencyKey: randomUUID(),
    });
    return Response.json({ mode: "optica", source: "opticaolm", favorites });
  } catch (error) {
    return commerceErrorResponse(error);
  }
}
