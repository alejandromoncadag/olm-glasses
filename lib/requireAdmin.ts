import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/adminSession";

export type AuthenticatedAdmin = {
  id: string;
  email: string;
  fullName: string;
  role: "admin";
  adminRole: string;
};

export async function getAuthenticatedAdmin(): Promise<AuthenticatedAdmin | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const session = verifyAdminSessionToken(token);

  if (!session) {
    return null;
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
    return null;
  }

  return {
    id: admin.id,
    email: admin.email,
    fullName: admin.full_name,
    role: "admin",
    adminRole: admin.role,
  };
}

export function unauthorizedAdminResponse() {
  return NextResponse.json(
    { error: "Unauthorized admin access." },
    { status: 401 }
  );
}

