import { claimGuestOpticalDrafts, identityErrorResponse } from "@/lib/identity/serverClient";

export const runtime = "nodejs";
export async function POST() {
  try { return Response.json(await claimGuestOpticalDrafts()); }
  catch (error) { return identityErrorResponse(error); }
}
