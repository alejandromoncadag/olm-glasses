import { claimGuestOpticalDrafts, identityErrorResponse } from "@/lib/identity/serverClient";

export const runtime = "nodejs";
export async function POST(_request: Request, context: { params: Promise<{ draftId: string }> }) {
  try { const { draftId } = await context.params; return Response.json(await claimGuestOpticalDrafts(draftId)); }
  catch (error) { return identityErrorResponse(error); }
}
