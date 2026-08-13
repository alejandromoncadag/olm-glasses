import { consumeVerificationToken } from "@/lib/emailVerification";
import { isSameOriginCustomerAuthRequest } from "@/lib/customerPasswordAuth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginCustomerAuthRequest(request)) {
    return Response.json({ error: "No pudimos validar esta solicitud." }, { status: 403 });
  }
  try {
    const body = (await request.json()) as { token?: unknown };
    const success = await consumeVerificationToken(String(body.token || ""));
    if (!success) return Response.json({ error: "El enlace no es válido o ya venció." }, { status: 400 });
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "No pudimos verificar el correo." }, { status: 500 });
  }
}
