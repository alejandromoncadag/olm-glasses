import { auth } from "@/auth";
import { createVerificationRequest } from "@/lib/emailVerification";
import { isSameOriginCustomerAuthRequest } from "@/lib/customerPasswordAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOriginCustomerAuthRequest(request)) {
    return Response.json({ error: "No pudimos validar esta solicitud." }, { status: 403 });
  }
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return Response.json({ error: "Inicia sesión para verificar tu correo." }, { status: 401 });
  }
  if (session.user.emailVerified) {
    return Response.json({ success: true, alreadyVerified: true });
  }
  try {
    const result = await createVerificationRequest(session.user.id, session.user.email, session.user.name || "cliente OLM");
    if (result.rateLimited) {
      return Response.json({ error: "Solicitaste varios enlaces. Intenta de nuevo más tarde." }, { status: 429 });
    }
    return Response.json({ success: true, ...result });
  } catch {
    return Response.json({ error: "No pudimos preparar el correo de verificación." }, { status: 500 });
  }
}
