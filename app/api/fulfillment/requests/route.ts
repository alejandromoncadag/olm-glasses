import { randomUUID } from "node:crypto";

import { getCommerceOwner } from "@/lib/commerce/identity";
import { fulfillmentErrorResponse, fulfillmentRequest } from "@/lib/fulfillment/serverClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const owner = await getCommerceOwner();
    return Response.json(await fulfillmentRequest("/requests", owner));
  } catch (error) {
    return fulfillmentErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const owner = await getCommerceOwner();
    return Response.json(await fulfillmentRequest("/requests", owner, { method: "POST", body, idempotencyKey: randomUUID() }));
  } catch (error) {
    return fulfillmentErrorResponse(error);
  }
}
