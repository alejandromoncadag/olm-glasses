export const DEFAULT_TYPOGRAPHY_SETTINGS = {
  bodyFontFamily: "Geist",
  headingFontFamily: "Cormorant Garamond",
  logoFontFamily: "Cormorant Garamond",
  monoFontFamily: "Geist Mono",
  useCustomBodyFont: false,
  useCustomHeadingFont: false,
  useCustomLogoFont: false,
  useCustomMonoFont: false,
} as const;

export type TypographySettings = {
  bodyFontFamily: string;
  headingFontFamily: string;
  logoFontFamily: string;
  monoFontFamily: string;
  useCustomBodyFont: boolean;
  useCustomHeadingFont: boolean;
  useCustomLogoFont: boolean;
  useCustomMonoFont: boolean;
  updatedAt?: string | null;
  updatedBy?: string | null;
};

export type TypographyRole = "body" | "heading" | "logo" | "mono";

const GOOGLE_FONT_FAMILY_PATTERN = /^[A-Za-z0-9]+(?:[ -][A-Za-z0-9]+)*$/;
const MAX_FONT_FAMILY_LENGTH = 80;

export function normalizeGoogleFontFamily(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

export function isSafeGoogleFontFamily(value: unknown) {
  const normalized = normalizeGoogleFontFamily(value);

  return (
    normalized.length >= 2 &&
    normalized.length <= MAX_FONT_FAMILY_LENGTH &&
    GOOGLE_FONT_FAMILY_PATTERN.test(normalized)
  );
}

export function validateTypographySettings(value: unknown):
  | { ok: true; settings: TypographySettings }
  | { ok: false; error: string } {
  if (!value || typeof value !== "object") {
    return { ok: false, error: "Los ajustes tipográficos no son válidos." };
  }

  const input = value as Record<string, unknown>;
  const settings: TypographySettings = {
    bodyFontFamily: normalizeGoogleFontFamily(input.bodyFontFamily),
    headingFontFamily: normalizeGoogleFontFamily(input.headingFontFamily),
    logoFontFamily: normalizeGoogleFontFamily(input.logoFontFamily),
    monoFontFamily: normalizeGoogleFontFamily(input.monoFontFamily),
    useCustomBodyFont: input.useCustomBodyFont === true,
    useCustomHeadingFont: input.useCustomHeadingFont === true,
    useCustomLogoFont: input.useCustomLogoFont === true,
    useCustomMonoFont: input.useCustomMonoFont === true,
  };

  const entries: Array<[string, string]> = [
    ["texto normal", settings.bodyFontFamily],
    ["encabezados", settings.headingFontFamily],
    ["logotipo", settings.logoFontFamily],
    ["folios", settings.monoFontFamily],
  ];

  for (const [label, family] of entries) {
    if (!isSafeGoogleFontFamily(family)) {
      return {
        ok: false,
        error: `La fuente de ${label} solo puede contener letras, números, espacios y guiones.`,
      };
    }
  }

  return { ok: true, settings };
}

function getEnabledCustomFamilies(settings: TypographySettings) {
  return [
    settings.useCustomBodyFont ? settings.bodyFontFamily : null,
    settings.useCustomHeadingFont ? settings.headingFontFamily : null,
    settings.useCustomLogoFont ? settings.logoFontFamily : null,
    settings.useCustomMonoFont ? settings.monoFontFamily : null,
  ].filter((family): family is string => Boolean(family));
}

export function buildGoogleFontsStylesheetUrl(settings: TypographySettings) {
  const families = [...new Set(getEnabledCustomFamilies(settings))]
    .filter(isSafeGoogleFontFamily)
    .sort((a, b) => a.localeCompare(b));

  if (families.length === 0) {
    return null;
  }

  const params = new URLSearchParams();

  for (const family of families) {
    params.append("family", family.replace(/ /g, "+"));
  }

  params.set("display", "swap");

  return `https://fonts.googleapis.com/css2?${params.toString().replace(/%2B/g, "+")}`;
}

export function getTypographyCssVariables(settings: TypographySettings) {
  return {
    "--font-body-choice": settings.useCustomBodyFont
      ? `"${settings.bodyFontFamily}", var(--font-geist-sans)`
      : "var(--font-geist-sans)",
    "--font-heading-choice": settings.useCustomHeadingFont
      ? `"${settings.headingFontFamily}", var(--font-cormorant)`
      : "var(--font-cormorant)",
    "--font-logo-choice": settings.useCustomLogoFont
      ? `"${settings.logoFontFamily}", var(--font-cormorant)`
      : "var(--font-cormorant)",
    "--font-mono-choice": settings.useCustomMonoFont
      ? `"${settings.monoFontFamily}", var(--font-geist-mono)`
      : "var(--font-geist-mono)",
  } as const;
}

export function createTypographyCssText(settings: TypographySettings) {
  const variables = getTypographyCssVariables(settings);

  return Object.entries(variables)
    .map(([name, value]) => `${name}: ${value};`)
    .join("\n");
}
