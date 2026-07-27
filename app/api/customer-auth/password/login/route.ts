import { NextResponse } from "next/server";

import {
  createDatabaseCustomerSession,
  findPasswordRecord,
  getCustomerSessionCookie,
  isSameOriginCustomerAuthRequest,
  isValidCustomerEmail,
  normalizeCustomerEmail,
  verifyCustomerPassword,
} from "@/lib/customerPasswordAuth";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

const INVALID_CREDENTIALS_MESSAGE =
  "El correo o la contraseña no son correctos.";

export async function POST(request: Request) {
  if (!isSameOriginCustomerAuthRequest(request)) {
    return NextResponse.json(
      { error: "No pudimos validar esta solicitud." },
      { status: 403 }
    );
  }

  const client = await pool.connect();

  try {
    const body = await request.json();
    const email = normalizeCustomerEmail(body.email);
    const password = String(body.password || "");

    if (!isValidCustomerEmail(email) || !password) {
      return NextResponse.json(
        { error: INVALID_CREDENTIALS_MESSAGE },
        { status: 401 }
      );
    }

    const passwordRecord = await findPasswordRecord(client, email);
    const passwordMatches = await verifyCustomerPassword(
      password,
      passwordRecord?.password_hash || null
    );

    if (!passwordRecord || !passwordMatches) {
      return NextResponse.json(
        { error: INVALID_CREDENTIALS_MESSAGE },
        { status: 401 }
      );
    }

    await client.query("BEGIN");
    await client.query(`DELETE FROM sessions WHERE expires <= NOW()`);
    const session = await createDatabaseCustomerSession(
      client,
      passwordRecord.user_id
    );
    await client.query("COMMIT");

    const response = NextResponse.json({ success: true });
    const cookie = getCustomerSessionCookie(
      request.url,
      session.sessionToken,
      session.expires
    );
    response.cookies.set(cookie.name, cookie.value, cookie.options);

    return response;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // The transaction may not have started.
    }

    console.error(
      "Customer password login error:",
      error instanceof Error ? error.message : error
    );

    return NextResponse.json(
      { error: "No pudimos iniciar sesión. Intenta de nuevo." },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
