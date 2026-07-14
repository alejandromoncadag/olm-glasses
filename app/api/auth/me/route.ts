import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/adminSession";

export const runtime = "nodejs";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
    const session = verifyAdminSessionToken(token);

    if (!session) {
      return NextResponse.json({ user: null });
    }

    const result = await pool.query(
      `
        SELECT
          id,
          full_name,
          email,
          role,
          is_active
        FROM admin_users
        WHERE id = $1
        LIMIT 1;
      `,
      [session.id]
    );

    const admin = result.rows[0];

    if (!admin || !admin.is_active) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        id: admin.id,
        email: admin.email,
        fullName: admin.full_name,
        role: "admin",
        adminRole: admin.role,
      },
    });
  } catch (error) {
    console.error("Error fetching current admin:", error);

    return NextResponse.json(
      { error: "Failed to fetch current user." },
      { status: 500 }
    );
  }
}

