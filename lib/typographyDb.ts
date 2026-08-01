import { pool } from "@/lib/db";
import {
  DEFAULT_TYPOGRAPHY_SETTINGS,
  type TypographySettings,
} from "@/lib/typography";

type TypographyRow = {
  body_font_family: string;
  heading_font_family: string;
  logo_font_family: string;
  mono_font_family: string;
  use_custom_body_font: boolean;
  use_custom_heading_font: boolean;
  use_custom_logo_font: boolean;
  use_custom_mono_font: boolean;
  updated_at: Date | string | null;
  updated_by: string | null;
};

function mapRow(row: TypographyRow): TypographySettings {
  return {
    bodyFontFamily: row.body_font_family,
    headingFontFamily: row.heading_font_family,
    logoFontFamily: row.logo_font_family,
    monoFontFamily: row.mono_font_family,
    useCustomBodyFont: row.use_custom_body_font,
    useCustomHeadingFont: row.use_custom_heading_font,
    useCustomLogoFont: row.use_custom_logo_font,
    useCustomMonoFont: row.use_custom_mono_font,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    updatedBy: row.updated_by,
  };
}

export async function getTypographySettings(): Promise<TypographySettings> {
  try {
    const result = await pool.query<TypographyRow>(`
      SELECT
        body_font_family,
        heading_font_family,
        logo_font_family,
        mono_font_family,
        use_custom_body_font,
        use_custom_heading_font,
        use_custom_logo_font,
        use_custom_mono_font,
        updated_at,
        updated_by
      FROM site_typography_settings
      WHERE id = 1
      LIMIT 1;
    `);

    return result.rows[0]
      ? mapRow(result.rows[0])
      : { ...DEFAULT_TYPOGRAPHY_SETTINGS };
  } catch (error) {
    console.error("Unable to load site typography settings:", error);
    return { ...DEFAULT_TYPOGRAPHY_SETTINGS };
  }
}

export async function saveTypographySettings(
  settings: TypographySettings,
  updatedBy: string
) {
  const result = await pool.query<TypographyRow>(
    `
      INSERT INTO site_typography_settings (
        id,
        body_font_family,
        heading_font_family,
        logo_font_family,
        mono_font_family,
        use_custom_body_font,
        use_custom_heading_font,
        use_custom_logo_font,
        use_custom_mono_font,
        updated_at,
        updated_by
      )
      VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9)
      ON CONFLICT (id) DO UPDATE SET
        body_font_family = EXCLUDED.body_font_family,
        heading_font_family = EXCLUDED.heading_font_family,
        logo_font_family = EXCLUDED.logo_font_family,
        mono_font_family = EXCLUDED.mono_font_family,
        use_custom_body_font = EXCLUDED.use_custom_body_font,
        use_custom_heading_font = EXCLUDED.use_custom_heading_font,
        use_custom_logo_font = EXCLUDED.use_custom_logo_font,
        use_custom_mono_font = EXCLUDED.use_custom_mono_font,
        updated_at = NOW(),
        updated_by = EXCLUDED.updated_by
      RETURNING *;
    `,
    [
      settings.bodyFontFamily,
      settings.headingFontFamily,
      settings.logoFontFamily,
      settings.monoFontFamily,
      settings.useCustomBodyFont,
      settings.useCustomHeadingFont,
      settings.useCustomLogoFont,
      settings.useCustomMonoFont,
      updatedBy,
    ]
  );

  return mapRow(result.rows[0]);
}

export async function resetTypographySettings(updatedBy: string) {
  return saveTypographySettings(
    { ...DEFAULT_TYPOGRAPHY_SETTINGS },
    updatedBy
  );
}
