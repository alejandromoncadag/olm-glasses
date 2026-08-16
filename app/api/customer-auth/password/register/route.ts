import crypto from "crypto";
import { NextResponse } from "next/server";

import {
  createDatabaseCustomerSession,
  getCustomerSessionCookie,
  hashCustomerPassword,
  isSameOriginCustomerAuthRequest,
  isValidCustomerEmail,
  normalizeCustomerEmail,
  validateCustomerPassword,
} from "@/lib/customerPasswordAuth";
import { pool } from "@/lib/db";
import { createVerificationRequest } from "@/lib/emailVerification";

export const runtime = "nodejs";

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
    const firstName = String(body.firstName || "").trim();
    const lastName = String(body.lastName || "").trim();
    const fullName = `${firstName} ${lastName}`.trim();
    const email = normalizeCustomerEmail(body.email);
    const password = String(body.password || "");

    if (
      firstName.length < 1 ||
      firstName.length > 60 ||
      lastName.length < 1 ||
      lastName.length > 60 ||
      fullName.length > 120
    ) {
      return NextResponse.json(
        { error: "Escribe tu nombre y apellido." },
        { status: 400 }
      );
    }

    if (!isValidCustomerEmail(email)) {
      return NextResponse.json(
        { error: "Escribe un correo válido." },
        { status: 400 }
      );
    }

    const passwordError = validateCustomerPassword(password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    await client.query("BEGIN");

    const existingResult = await client.query(
      `
        SELECT
          EXISTS(
            SELECT 1 FROM users WHERE LOWER(email) = LOWER($1)
          ) AS has_user,
          EXISTS(
            SELECT 1 FROM customers WHERE LOWER(email) = LOWER($1)
          ) AS has_customer
      `,
      [email]
    );

    const existing = existingResult.rows[0];

    if (existing?.has_user || existing?.has_customer) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        {
          error:
            "Este correo ya está registrado. Inicia sesión con tu contraseña o con Google.",
        },
        { status: 409 }
      );
    }

    const userId = crypto.randomUUID();
    const passwordHash = await hashCustomerPassword(password);

    await client.query(
      `
        INSERT INTO users (id, name, email, "emailVerified", image)
        VALUES ($1, $2, LOWER($3), NULL, NULL)
      `,
      [userId, fullName, email]
    );

    await client.query(
      `
        INSERT INTO customer_password_credentials (
          user_id,
          password_hash
        )
        VALUES ($1, $2)
      `,
      [userId, passwordHash]
    );

    await client.query(
      `
        INSERT INTO customers (
          full_name,
          email,
          phone,
          address,
          city,
          state,
          zip_code,
          country,
          authjs_user_id,
          avatar_url
        )
        VALUES ($1, LOWER($2), '', '', '', '', '', 'México', $3, NULL)
      `,
      [fullName, email, userId]
    );

    const session = await createDatabaseCustomerSession(client, userId);
    await client.query("COMMIT");

    let verification: { devVerificationUrl: string | null; deliveryStatus: "sent" | "failed" } = { devVerificationUrl: null, deliveryStatus: "failed" };
    try {
      verification = await createVerificationRequest(userId, email, fullName);
    } catch {
      // The account remains valid and unverified; the customer can request a new link.
    }

    const response = NextResponse.json(
      {
        success: true,
        verificationRequired: true,
        ...(verification.deliveryStatus === "failed" ? { verificationEmailFailed: true } : {}),
        ...(verification.devVerificationUrl
          ? { devVerificationUrl: verification.devVerificationUrl }
          : {}),
      },
      { status: 201 }
    );
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

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      return NextResponse.json(
        { error: "Este correo ya está registrado." },
        { status: 409 }
      );
    }

    console.error(
      "Customer password registration error:",
      error instanceof Error ? error.message : error
    );

    return NextResponse.json(
      { error: "No pudimos crear tu cuenta. Intenta de nuevo." },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
