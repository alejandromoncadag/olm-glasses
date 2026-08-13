import { randomUUID } from "node:crypto";

import { identityErrorResponse, identityRequest, verifiedIdentityContext } from "@/lib/identity/serverClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try { const ctx = await verifiedIdentityContext(); return Response.json(await identityRequest("/patient-links/current", ctx.accountHash)); }
  catch (error) { return identityErrorResponse(error); }
}

export async function POST() {
  try {
    const ctx = await verifiedIdentityContext();
    if (!ctx.customer.phone) return Response.json({ error: "Agrega tu teléfono antes de buscar tu expediente." }, { status: 400 });
    return Response.json(await identityRequest("/patient-links/candidate-check", ctx.accountHash, {
      method: "POST", body: { email: ctx.customer.email, phone: ctx.customer.phone, fullName: ctx.customer.fullName, emailVerifiedAt: ctx.customer.emailVerified },
    }));
  } catch (error) { return identityErrorResponse(error); }
}

export async function PATCH(request: Request) {
  try {
    const ctx = await verifiedIdentityContext();
    const body = await request.json();
    return Response.json(await identityRequest("/patient-links/confirm", ctx.accountHash, { method: "POST", body: { linkAttemptId: body.linkAttemptId }, idempotencyKey: randomUUID() }));
  } catch (error) { return identityErrorResponse(error); }
}

export async function DELETE() {
  try { const ctx = await verifiedIdentityContext(); return Response.json(await identityRequest("/patient-links/revoke", ctx.accountHash, { method: "POST", idempotencyKey: randomUUID() })); }
  catch (error) { return identityErrorResponse(error); }
}
