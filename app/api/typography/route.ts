import { NextResponse } from "next/server";
import { getTypographySettings } from "@/lib/typographyDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getTypographySettings();
  const publicSettings = {
    bodyFontFamily: settings.bodyFontFamily,
    headingFontFamily: settings.headingFontFamily,
    logoFontFamily: settings.logoFontFamily,
    monoFontFamily: settings.monoFontFamily,
    useCustomBodyFont: settings.useCustomBodyFont,
    useCustomHeadingFont: settings.useCustomHeadingFont,
    useCustomLogoFont: settings.useCustomLogoFont,
    useCustomMonoFont: settings.useCustomMonoFont,
  };

  return NextResponse.json(
    { settings: publicSettings },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
