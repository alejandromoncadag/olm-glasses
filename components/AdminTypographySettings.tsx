"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  DEFAULT_TYPOGRAPHY_SETTINGS,
  buildGoogleFontsStylesheetUrl,
  createTypographyCssText,
  getTypographyCssVariables,
  isSafeGoogleFontFamily,
  type TypographySettings,
} from "@/lib/typography";

type FontField = {
  familyKey:
    | "bodyFontFamily"
    | "headingFontFamily"
    | "logoFontFamily"
    | "monoFontFamily";
  enabledKey:
    | "useCustomBodyFont"
    | "useCustomHeadingFont"
    | "useCustomLogoFont"
    | "useCustomMonoFont";
  label: string;
  description: string;
  placeholder: string;
};

const fields: FontField[] = [
  {
    familyKey: "bodyFontFamily",
    enabledKey: "useCustomBodyFont",
    label: "Texto normal",
    description: "Navbar, botones, formularios, filtros, precios y checkout.",
    placeholder: "Montserrat",
  },
  {
    familyKey: "headingFontFamily",
    enabledKey: "useCustomHeadingFont",
    label: "Encabezados",
    description: "Títulos principales, hero y encabezados de secciones.",
    placeholder: "Lora",
  },
  {
    familyKey: "logoFontFamily",
    enabledKey: "useCustomLogoFont",
    label: "Logotipo",
    description: "ÓPTICA OLM y etiquetas especiales de marca.",
    placeholder: "Cormorant Garamond",
  },
  {
    familyKey: "monoFontFamily",
    enabledKey: "useCustomMonoFont",
    label: "Folios y códigos",
    description: "Pedidos, citas, rastreo e identificadores técnicos.",
    placeholder: "Roboto Mono",
  },
];

function validateFamilies(settings: TypographySettings) {
  for (const field of fields) {
    if (!isSafeGoogleFontFamily(settings[field.familyKey])) {
      return `Revisa “${field.label}”. Solo se permiten letras, números, espacios y guiones.`;
    }
  }

  return "";
}

export default function AdminTypographySettings() {
  const [settings, setSettings] = useState<TypographySettings>({
    ...DEFAULT_TYPOGRAPHY_SETTINGS,
  });
  const [previewSettings, setPreviewSettings] =
    useState<TypographySettings>(settings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        const response = await fetch("/api/admin/typography", {
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "No pudimos cargar la tipografía.");
        }

        if (active) {
          setSettings(data.settings);
          setPreviewSettings(data.settings);
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "No pudimos cargar la tipografía."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      active = false;
    };
  }, []);

  const previewUrl = useMemo(
    () => buildGoogleFontsStylesheetUrl(previewSettings),
    [previewSettings]
  );
  const previewVariables = useMemo(
    () => getTypographyCssVariables(previewSettings),
    [previewSettings]
  );

  function updateFamily(field: FontField, value: string) {
    setSettings((current) => ({
      ...current,
      [field.familyKey]: value,
    }));
    setMessage("");
  }

  function updateEnabled(field: FontField, value: boolean) {
    setSettings((current) => ({
      ...current,
      [field.enabledKey]: value,
    }));
    setMessage("");
  }

  function preview() {
    const validationError = validateFamilies(settings);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setMessage("Vista previa actualizada. Aún no se ha guardado.");
    setPreviewSettings({ ...settings });
  }

  async function save() {
    const validationError = validateFamilies(settings);

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await fetch("/api/admin/typography", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No pudimos guardar la tipografía.");
      }

      setSettings(data.settings);
      setPreviewSettings(data.settings);
      setMessage("Tipografía guardada permanentemente en PostgreSQL.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "No pudimos guardar la tipografía."
      );
    } finally {
      setSaving(false);
    }
  }

  async function reset() {
    if (
      !window.confirm(
        "¿Restaurar Geist, Cormorant Garamond y Geist Mono como fuentes OLM?"
      )
    ) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await fetch("/api/admin/typography", {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No pudimos restaurar las fuentes.");
      }

      setSettings(data.settings);
      setPreviewSettings(data.settings);
      setMessage("Fuentes OLM predeterminadas restauradas.");
    } catch (resetError) {
      setError(
        resetError instanceof Error
          ? resetError.message
          : "No pudimos restaurar las fuentes."
      );
    } finally {
      setSaving(false);
    }
  }

  async function copyCss() {
    const validationError = validateFamilies(settings);

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      await navigator.clipboard.writeText(createTypographyCssText(settings));
      setError("");
      setMessage("Variables CSS copiadas.");
    } catch {
      setError("El navegador no permitió copiar las variables CSS.");
    }
  }

  if (loading) {
    return (
      <div className="border border-black/10 bg-white p-7 text-sm text-black/60">
        Cargando ajustes desde PostgreSQL...
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]">
      {previewUrl ? (
        <link rel="stylesheet" href={previewUrl} data-olm-admin-preview-fonts />
      ) : null}

      <section className="border border-black/10 bg-white p-6 sm:p-8">
        <div className="flex items-start justify-between gap-5">
          <div>
            <h2 className="text-xl font-semibold">Fuentes activas</h2>
            <p className="mt-2 text-sm leading-6 text-black/55">
              Escribe únicamente el nombre de una familia publicada en Google
              Fonts. No pegues enlaces, código CSS ni etiquetas.
            </p>
          </div>
          <a
            href="/typography-guide"
            target="_blank"
            className="shrink-0 border border-black/15 px-3 py-2 text-xs font-semibold transition hover:bg-[#2d1f1a] hover:text-white"
          >
            Guía completa
          </a>
        </div>

        <div className="mt-7 space-y-7">
          {fields.map((field) => (
            <fieldset key={field.familyKey} className="border-t border-black/10 pt-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <legend className="text-sm font-semibold">{field.label}</legend>
                  <p className="mt-1 text-xs leading-5 text-black/50">
                    {field.description}
                  </p>
                </div>
                <label className="flex shrink-0 items-center gap-2 text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={settings[field.enabledKey]}
                    onChange={(event) =>
                      updateEnabled(field, event.target.checked)
                    }
                    className="h-4 w-4 accent-[#2d1f1a]"
                  />
                  Usar personalizada
                </label>
              </div>
              <input
                value={settings[field.familyKey]}
                onChange={(event) => updateFamily(field, event.target.value)}
                placeholder={field.placeholder}
                maxLength={80}
                autoComplete="off"
                spellCheck={false}
                className="mt-4 h-12 w-full border border-black/20 px-4 text-sm outline-none transition focus:border-[#2d1f1a]"
              />
            </fieldset>
          ))}
        </div>

        <div className="mt-7 border border-amber-300 bg-amber-50 p-4 text-xs leading-5 text-amber-950">
          Las fuentes personalizadas dependen de la disponibilidad de Google
          Fonts y de la conexión del visitante. Si una fuente no carga, el sitio
          usa automáticamente Geist o la fuente OLM predeterminada.
        </div>

        {error ? (
          <p role="alert" className="mt-5 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        {message ? (
          <p role="status" className="mt-5 border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            {message}
          </p>
        ) : null}

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={preview}
            className="border border-[#2d1f1a] px-5 py-3 text-sm font-semibold transition hover:bg-[#2d1f1a] hover:text-white"
          >
            Vista previa
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="border border-[#2d1f1a] bg-[#2d1f1a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white hover:text-[#2d1f1a] disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar fuentes del sitio"}
          </button>
          <button
            type="button"
            onClick={copyCss}
            className="border border-black/15 px-5 py-3 text-sm font-semibold transition hover:border-[#2d1f1a]"
          >
            Copiar ajustes CSS
          </button>
          <button
            type="button"
            onClick={reset}
            disabled={saving}
            className="border border-red-200 px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
          >
            Restaurar fuentes OLM
          </button>
        </div>

        <p className="mt-5 text-xs leading-5 text-black/45">
          Guardar modifica permanentemente la apariencia del sitio para clientes
          en esta base de datos y este entorno. No modifica archivos de código.
        </p>
      </section>

      <section
        className="border border-black/10 bg-[#eeece7] p-5 sm:p-8"
        style={previewVariables as CSSProperties}
      >
        <div className="bg-white p-6 sm:p-9">
          <p
            className="text-xs uppercase tracking-[0.22em] text-[#76594d]"
            style={{ fontFamily: "var(--font-logo-choice)" }}
          >
            Óptica OLM
          </p>
          <h2
            className="mt-6 text-5xl leading-[0.94] sm:text-6xl"
            style={{ fontFamily: "var(--font-heading-choice)" }}
          >
            Lentes modernos para todos los días
          </h2>
          <p
            className="mt-6 max-w-xl text-base leading-7 text-black/60"
            style={{ fontFamily: "var(--font-body-choice)" }}
          >
            Compra lentes ópticos y de sol en México con atención personalizada,
            materiales seleccionados y precios claros.
          </p>
          <button
            type="button"
            className="mt-7 border border-[#2d1f1a] px-6 py-3 text-sm font-semibold transition hover:bg-[#2d1f1a] hover:text-white"
            style={{ fontFamily: "var(--font-body-choice)" }}
          >
            Seleccionar modelo
          </button>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <article className="bg-white p-6">
            <p
              className="text-xs uppercase tracking-[0.15em] text-black/45"
              style={{ fontFamily: "var(--font-body-choice)" }}
            >
              Lentes ópticos
            </p>
            <h3
              className="mt-3 text-3xl"
              style={{ fontFamily: "var(--font-heading-choice)" }}
            >
              Modelo Ámbar
            </h3>
            <p
              className="mt-3 text-lg font-semibold"
              style={{ fontFamily: "var(--font-body-choice)" }}
            >
              $1,899 MXN
            </p>
          </article>

          <article className="bg-[#2d1f1a] p-6 text-white">
            <p
              className="text-xs uppercase tracking-[0.15em] text-white/55"
              style={{ fontFamily: "var(--font-body-choice)" }}
            >
              Folio de cita
            </p>
            <p
              className="mt-5 text-lg"
              style={{ fontFamily: "var(--font-mono-choice)" }}
            >
              EX-1B274B39CE3BAE6D
            </p>
            <p
              className="mt-2 text-sm text-white/70"
              style={{ fontFamily: "var(--font-mono-choice)" }}
            >
              OLM-2026-004812
            </p>
          </article>
        </div>

        <label
          className="mt-4 block bg-white p-6 text-sm font-semibold"
          style={{ fontFamily: "var(--font-body-choice)" }}
        >
          Correo electrónico
          <input
            type="email"
            placeholder="cliente@ejemplo.com"
            className="mt-3 h-12 w-full border border-black/20 px-4 font-normal outline-none focus:border-[#2d1f1a]"
            style={{ fontFamily: "var(--font-body-choice)" }}
          />
        </label>
      </section>
    </div>
  );
}
