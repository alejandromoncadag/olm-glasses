import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
} from "@/lib/adminSession";

export const runtime = "nodejs";

const SESSION_DURATION_SECONDS = 60 * 60 * 8;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email = String(body.email || "")
      .trim()
      .toLowerCase();

    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
        SELECT
          id,
          full_name,
          email,
          role,
          password_hash
        FROM admin_users
        WHERE email = $1
          AND is_active = true
        LIMIT 1;
      `,
      [email]
    );

    const admin = result.rows[0];

    if (!admin || !verifyPassword(password, admin.password_hash)) {
      return NextResponse.json(
        { error: "Correo o contraseña incorrectos." },
        { status: 401 }
      );
    }

    const token = createAdminSessionToken({
      id: admin.id,
      email: admin.email,
      fullName: admin.full_name,
      role: "admin",
      adminRole: admin.role,
      expiresAt: Date.now() + SESSION_DURATION_SECONDS * 1000,
    });

    const response = NextResponse.json({
      user: {
        id: admin.id,
        email: admin.email,
        fullName: admin.full_name,
        role: "admin",
        adminRole: admin.role,
      },
    });

    response.cookies.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_DURATION_SECONDS,
    });

    return response;
  } catch (error) {
    console.error("Error logging in admin:", error);

    return NextResponse.json(
      { error: "Failed to log in admin." },
      { status: 500 }
    );
  }
}

