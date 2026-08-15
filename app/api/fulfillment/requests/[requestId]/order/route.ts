import { randomUUID } from "node:crypto";

import { getCommerceOwner } from "@/lib/commerce/identity";
import { fulfillmentErrorResponse, fulfillmentRequest, createIdentityAssertion } from "@/lib/fulfillment/serverClient";
import { getOptionalAuthenticatedCustomer } from "@/lib/customerAccounts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ requestId: string }> }) {
  try {
    const { requestId } = await context.params;
    const owner = await getCommerceOwner();
    return Response.json(await fulfillmentRequest(`/requests/${encodeURIComponent(requestId)}/order`, owner));
  } catch (error) {
    return fulfillmentErrorResponse(error);
  }
}

export async function POST(_request: Request, context: { params: Promise<{ requestId: string }> }) {
  try {
    const { requestId } = await context.params;
    const owner = await getCommerceOwner();
    const customer = await getOptionalAuthenticatedCustomer();
    const identityAssertion = customer?.emailVerified ? createIdentityAssertion(owner.ownerHash, customer.email) : undefined;
    return Response.json(await fulfillmentRequest(`/requests/${encodeURIComponent(requestId)}/order`, owner, { method: "POST", idempotencyKey: randomUUID(), identityAssertion }));
  } catch (error) {
    return fulfillmentErrorResponse(error);
  }
}
