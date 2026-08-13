import { randomUUID } from "node:crypto";

import { getMergeOwners, removeGuestCommerceCookie } from "@/lib/commerce/identity";
import { getCommerceMode } from "@/lib/commerce/mode";
import { commerceErrorResponse, commerceRequest } from "@/lib/commerce/serverClient";
import { claimGuestOpticalDrafts } from "@/lib/identity/serverClient";

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
    let opticalDraftsClaimed = false;
    if (process.env.PHASE_1GE_ENABLED === "true") {
      try {
        await claimGuestOpticalDrafts();
        opticalDraftsClaimed = true;
      } catch {
        // Keep the guest cookie so a verified account can claim optical drafts later.
      }
    }
    if (process.env.PHASE_1GE_ENABLED !== "true" || opticalDraftsClaimed) {
      await removeGuestCommerceCookie();
    }
    return Response.json({ mode, source: "opticaolm", opticalDraftsClaimed, ...result });
  } catch (error) {
    return commerceErrorResponse(error);
  }
}
