import { NextResponse } from "next/server";
import {
  getAuthenticatedAdmin,
  unauthorizedAdminResponse,
} from "@/lib/requireAdmin";
import {
  getTypographySettings,
  resetTypographySettings,
  saveTypographySettings,
} from "@/lib/typographyDb";
import { validateTypographySettings } from "@/lib/typography";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    return unauthorizedAdminResponse();
  }

  return NextResponse.json({ settings: await getTypographySettings() });
}

export async function PUT(request: Request) {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    return unauthorizedAdminResponse();
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "El contenido enviado no es JSON válido." },
      { status: 400 }
    );
  }

  const validation = validateTypographySettings(payload);

  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    const settings = await saveTypographySettings(
      validation.settings,
      admin.id
    );

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Unable to save site typography settings:", error);
    return NextResponse.json(
      { error: "No pudimos guardar la tipografía en PostgreSQL." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    return unauthorizedAdminResponse();
  }

  try {
    const settings = await resetTypographySettings(admin.id);
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Unable to reset site typography settings:", error);
    return NextResponse.json(
      { error: "No pudimos restaurar la tipografía predeterminada." },
      { status: 500 }
    );
  }
}
