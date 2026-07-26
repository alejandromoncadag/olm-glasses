"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

import { useAuth } from "@/hooks/useAuth";

function getSafeRedirectUrl() {
  const requestedUrl = new URLSearchParams(window.location.search).get(
    "redirect_url"
  );

  if (
    requestedUrl &&
    requestedUrl.startsWith("/") &&
    !requestedUrl.startsWith("//")
  ) {
    return requestedUrl;
  }

  return "/account";
}

export default function CustomerAuthScreen({
  mode,
}: {
  mode: "login" | "signup";
}) {
  const { customerAuthConfigured } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const isSignup = mode === "signup";

  async function continueWithGoogle() {
    setSubmitting(true);
    setError("");

    try {
      await signIn("google", { redirectTo: getSafeRedirectUrl() });
    } catch {
      setError(
        "No pudimos abrir Google en este momento. Intenta de nuevo."
      );
      setSubmitting(false);
    }
  }

  if (!customerAuthConfigured) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-[#d9cfc8] bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#6b4a3f]">
          Cuenta OLM
        </p>
        <h1 className="mt-4 text-3xl font-semibold">
          Falta configurar el acceso con Google
        </h1>
        <p className="mt-4 text-gray-600">
          Auth.js está instalado, pero el propietario de la tienda debe agregar
          el secreto de sesión y las credenciales de Google antes de activar el
          inicio de sesión.
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex rounded-full border border-[#4a2d23] px-6 py-3 text-sm font-medium text-[#4a2d23] transition hover:bg-[#4a2d23] hover:text-white"
        >
          Volver a la tienda
        </Link>
        <p className="mt-6 text-xs text-gray-500">
          El acceso administrativo permanece disponible por separado.
        </p>
        <Link
          href="/admin/login"
          className="mt-2 inline-block text-sm text-[#4a2d23] underline"
        >
          Acceso administrativo
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-xl justify-center">
      <section className="flex min-h-[440px] w-full items-center justify-center rounded-3xl border border-black/10 bg-white p-8 shadow-sm sm:p-12">
        <div className="w-full max-w-sm text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#6b4a3f]">
            Cuenta OLM
          </p>
          <h1 className="mt-4 text-3xl font-semibold">
            {isSignup ? "Crear una cuenta" : "Iniciar sesión"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            {isSignup
              ? "Crea tu cuenta de forma segura con Google."
              : "Si ya creaste una cuenta, usa el mismo correo de Google para entrar."}
          </p>

          {error && (
            <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={() => void continueWithGoogle()}
            disabled={submitting}
            className="mt-7 flex w-full items-center justify-center gap-3 rounded-full border border-black/15 px-5 py-3 text-sm font-medium transition hover:border-[#4a2d23] hover:bg-[#f7f3ee] disabled:cursor-wait disabled:opacity-60"
          >
            <GoogleIcon />
            {submitting
              ? "Abriendo Google…"
              : isSignup
                ? "Crear cuenta con Google"
                : "Iniciar sesión con Google"}
          </button>

          <p className="mt-6 text-xs leading-5 text-gray-500">
            Google verifica tu identidad. Óptica OLM usa tu correo para
            vincular pedidos, citas y favoritos.
          </p>

          <p className="mt-7 text-sm text-gray-600">
            {isSignup ? "¿Ya tienes cuenta?" : "¿Primera vez aquí?"}{" "}
            <Link
              href={isSignup ? "/login" : "/signup"}
              className="font-medium text-[#4a2d23] underline"
            >
              {isSignup ? "Inicia sesión" : "Crear cuenta"}
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.74-.07-1.45-.19-2.13H12v4.03h5.38a4.6 4.6 0 0 1-2 3.02v2.62h3.24c1.9-1.75 2.98-4.33 2.98-7.54Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.98-.9 6.63-2.43l-3.24-2.62c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.7A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.39 13.78A6.02 6.02 0 0 1 6.07 12c0-.62.11-1.22.32-1.78v-2.7H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.48l3.35-2.7Z"
      />
      <path
        fill="#EA4335"
        d="M12 6.09c1.47 0 2.79.5 3.82 1.49l2.87-2.87A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.52l3.35 2.7C7.18 7.85 9.39 6.09 12 6.09Z"
      />
    </svg>
  );
}
