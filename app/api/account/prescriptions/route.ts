import { identityErrorResponse, identityRequest, verifiedIdentityContext } from "@/lib/identity/serverClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try { const ctx = await verifiedIdentityContext(); return Response.json(await identityRequest("/prescriptions", ctx.accountHash)); }
  catch (error) { return identityErrorResponse(error); }
}
