import { getCommerceOwner } from "@/lib/commerce/identity";
import { fulfillmentErrorResponse, fulfillmentRequest } from "@/lib/fulfillment/serverClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function preview(context: { params: Promise<{ requestId: string }> }) {
  try {
    const { requestId } = await context.params;
    const owner = await getCommerceOwner();
    return Response.json(await fulfillmentRequest(`/requests/${encodeURIComponent(requestId)}/preview`, owner));
  } catch (error) {
    return fulfillmentErrorResponse(error);
  }
}

export async function GET(_request: Request, context: { params: Promise<{ requestId: string }> }) {
  return preview(context);
}

export async function POST(_request: Request, context: { params: Promise<{ requestId: string }> }) {
  return preview(context);
}
