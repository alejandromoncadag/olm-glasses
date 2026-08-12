import { randomUUID } from "node:crypto";

import { getCommerceOwner } from "@/lib/commerce/identity";
import { opticalDraftRequest, opticalPreviewErrorResponse } from "@/lib/optical/serverClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const owner = await getCommerceOwner();
    const result = await opticalDraftRequest("", owner, {
      method: "POST", body: await request.json(), idempotencyKey: randomUUID(),
    });
    return Response.json(result);
  } catch (error) {
    return opticalPreviewErrorResponse(error);
  }
}
