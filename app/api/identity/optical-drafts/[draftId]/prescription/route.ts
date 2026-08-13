import { randomUUID } from "node:crypto";

import { identityErrorResponse, identityRequest, verifiedIdentityContext } from "@/lib/identity/serverClient";

export const runtime = "nodejs";
export async function POST(request: Request, context: { params: Promise<{ draftId: string }> }) {
  try {
    const ctx = await verifiedIdentityContext(); const { draftId } = await context.params; const body = await request.json();
    return Response.json(await identityRequest(`/optical-drafts/${encodeURIComponent(draftId)}/prescription`, ctx.accountHash, { method: "POST", body: { prescriptionRef: body.prescriptionRef }, idempotencyKey: randomUUID() }));
  } catch (error) { return identityErrorResponse(error); }
}
