import { guestIdentityRequest, identityErrorResponse } from "@/lib/identity/serverClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return Response.json(await guestIdentityRequest("/guest-email/confirm", { method: "POST", body }));
  } catch (error) {
    return identityErrorResponse(error);
  }
}
