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
    const favorites = await commerceRequest("/favorites", owner);
    return Response.json({ mode, source: "opticaolm", favorites });
  } catch (error) {
    return commerceErrorResponse(error);
  }
}

export async function DELETE() {
  try {
    if (getCommerceMode() !== "optica") return Response.json({ error: "Authoritative commerce is not active" }, { status: 409 });
    const owner = await getCommerceOwner();
    const favorites = await commerceRequest("/favorites", owner, {
      method: "DELETE",
      idempotencyKey: randomUUID(),
    });
    return Response.json({ mode: "optica", source: "opticaolm", favorites });
  } catch (error) {
    return commerceErrorResponse(error);
  }
}
