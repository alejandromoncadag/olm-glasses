import { randomUUID } from "node:crypto";

import { getCommerceOwner } from "@/lib/commerce/identity";
import { fulfillmentErrorResponse, fulfillmentRequest } from "@/lib/fulfillment/serverClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ requestId: string }> }) {
  try {
    const { requestId } = await context.params;
    const owner = await getCommerceOwner();
    return Response.json(await fulfillmentRequest(`/requests/${encodeURIComponent(requestId)}/reservation/release`, owner, { method: "POST", idempotencyKey: randomUUID() }));
  } catch (error) {
    return fulfillmentErrorResponse(error);
  }
}
