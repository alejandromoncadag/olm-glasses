"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  buildGoogleFontsStylesheetUrl,
  getTypographyCssVariables,
  type TypographySettings,
} from "@/lib/typography";

const CUSTOM_FONT_LINK_ID = "olm-custom-google-fonts";

function clearRuntimeTypography() {
  const root = document.documentElement;

  root.style.removeProperty("--font-body-choice");
  root.style.removeProperty("--font-heading-choice");
  root.style.removeProperty("--font-logo-choice");
  root.style.removeProperty("--font-mono-choice");
  document.getElementById(CUSTOM_FONT_LINK_ID)?.remove();
}

function applyRuntimeTypography(settings: TypographySettings) {
  const variables = getTypographyCssVariables(settings);
  const stylesheetUrl = buildGoogleFontsStylesheetUrl(settings);

  for (const [name, value] of Object.entries(variables)) {
    document.documentElement.style.setProperty(name, value);
  }

  document.getElementById(CUSTOM_FONT_LINK_ID)?.remove();

  if (stylesheetUrl) {
    const link = document.createElement("link");
    link.id = CUSTOM_FONT_LINK_ID;
    link.rel = "stylesheet";
    link.href = stylesheetUrl;
    document.head.appendChild(link);
  }
}

export default function TypographyRuntime() {
  const pathname = usePathname();

  useEffect(() => {
    let active = true;

    if (pathname.startsWith("/admin")) {
      clearRuntimeTypography();
      return;
    }

    async function loadSettings() {
      try {
        const response = await fetch("/api/typography", { cache: "no-store" });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {
          settings?: TypographySettings;
        };

        if (active && data.settings) {
          applyRuntimeTypography(data.settings);
        }
      } catch (error) {
        console.error("Unable to apply saved typography:", error);
      }
    }

    loadSettings();

    return () => {
      active = false;
    };
  }, [pathname]);

  return null;
}
