import { getCommerceOwner } from "@/lib/commerce/identity";
import { fulfillmentErrorResponse, fulfillmentRequest } from "@/lib/fulfillment/serverClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const owner = await getCommerceOwner();
    return Response.json(await fulfillmentRequest("/pickup-branches", owner));
  } catch (error) {
    return fulfillmentErrorResponse(error);
  }
}
