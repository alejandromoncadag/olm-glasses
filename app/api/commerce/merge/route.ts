import { randomUUID } from "node:crypto";

import { getMergeOwners, removeGuestCommerceCookie } from "@/lib/commerce/identity";
import { getCommerceMode } from "@/lib/commerce/mode";
import { commerceErrorResponse, commerceRequest } from "@/lib/commerce/serverClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const mode = getCommerceMode();
    if (mode !== "optica") return Response.json({ mode, source: "legacy", merged: false });
    const owners = await getMergeOwners();
    if (!owners) return Response.json({ error: "Customer authentication is required" }, { status: 401 });
    if (!owners.guestOwnerHash) return Response.json({ mode, source: "opticaolm", merged: false });
    const result = await commerceRequest("/merge", owners.customer, {
      method: "POST",
      body: { guestOwnerHash: owners.guestOwnerHash },
      idempotencyKey: randomUUID(),
    });
    await removeGuestCommerceCookie();
    return Response.json({ mode, source: "opticaolm", ...result });
  } catch (error) {
    return commerceErrorResponse(error);
  }
}
