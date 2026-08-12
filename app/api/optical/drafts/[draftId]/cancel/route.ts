import { randomUUID } from "node:crypto";

import { getCommerceOwner } from "@/lib/commerce/identity";
import { opticalDraftRequest, opticalPreviewErrorResponse } from "@/lib/optical/serverClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ draftId: string }> }) {
  try {
    const owner = await getCommerceOwner();
    const { draftId } = await context.params;
    return Response.json(await opticalDraftRequest(`/${encodeURIComponent(draftId)}/cancel`, owner, {
      method: "POST", idempotencyKey: randomUUID(),
    }));
  } catch (error) {
    return opticalPreviewErrorResponse(error);
  }
}
