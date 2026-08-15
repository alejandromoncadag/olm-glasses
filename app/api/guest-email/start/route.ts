import { guestIdentityRequest, identityErrorResponse } from "@/lib/identity/serverClient";
import { getCommerceOwner } from "@/lib/commerce/identity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const owner = await getCommerceOwner();
    if (owner.ownerType === "customer") return Response.json({ schemaVersion: "1.0", status: "not_guest" });
    const body = await request.json();
    return Response.json(await guestIdentityRequest("/guest-email/start", { method: "POST", body }));
  } catch (error) {
    return identityErrorResponse(error);
  }
}
