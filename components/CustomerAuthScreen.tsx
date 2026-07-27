"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { FormEvent, useState } from "react";

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
  googleAuthConfigured,
}: {
  mode: "login" | "signup";
  googleAuthConfigured: boolean;
}) {
  const { customerAuthConfigured } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [error, setError] = useState("");
  const isSignup = mode === "signup";

  async function continueWithGoogle() {
    setGoogleSubmitting(true);
    setError("");

    try {
      await signIn("google", { redirectTo: getSafeRedirectUrl() });
    } catch {
      setError("No pudimos abrir Google en este momento. Intenta de nuevo.");
      setGoogleSubmitting(false);
    }
  }

  async function submitPasswordAccess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (isSignup && password !== passwordConfirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        `/api/customer-auth/password/${isSignup ? "register" : "login"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            fullName: isSignup ? fullName : undefined,
            email,
            password,
          }),
        }
      );
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error || "No pudimos completar el acceso.");
        setSubmitting(false);
        return;
      }

      window.location.assign(getSafeRedirectUrl());
    } catch {
      setError("No pudimos conectar con el servidor. Intenta de nuevo.");
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
          Falta configurar el acceso de clientes
        </h1>
        <p className="mt-4 text-gray-600">
          Auth.js necesita el secreto de sesión y la conexión segura con
          PostgreSQL antes de activar el inicio de sesión.
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
      <section className="flex w-full items-center justify-center rounded-3xl border border-black/10 bg-white p-7 shadow-sm sm:p-12">
        <div className="w-full max-w-sm">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#6b4a3f]">
              Cuenta OLM
            </p>
            <h1 className="mt-4 text-3xl font-semibold">
              {isSignup ? "Crear una cuenta" : "Iniciar sesión"}
            </h1>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              {isSignup
                ? "Crea una contraseña o continúa con Google."
                : "Entra con tu correo y contraseña, o continúa con Google."}
            </p>
          </div>

          {error && (
            <p
              role="alert"
              className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <form
            onSubmit={(event) => void submitPasswordAccess(event)}
            className="mt-7 space-y-4"
          >
            {isSignup && (
              <label className="block">
                <span className="mb-2 block text-sm font-medium">
                  Nombre completo
                </span>
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={120}
                  className="h-12 w-full rounded-2xl border border-black/15 px-4 outline-none transition focus:border-[#4a2d23] focus:ring-4 focus:ring-[#4a2d23]/10"
                />
              </label>
            )}

            <label className="block">
              <span className="mb-2 block text-sm font-medium">
                Correo electrónico
              </span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                maxLength={254}
                className="h-12 w-full rounded-2xl border border-black/15 px-4 outline-none transition focus:border-[#4a2d23] focus:ring-4 focus:ring-[#4a2d23]/10"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium">Contraseña</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={isSignup ? "new-password" : "current-password"}
                required
                minLength={10}
                maxLength={128}
                className="h-12 w-full rounded-2xl border border-black/15 px-4 outline-none transition focus:border-[#4a2d23] focus:ring-4 focus:ring-[#4a2d23]/10"
              />
              {isSignup && (
                <span className="mt-2 block text-xs text-gray-500">
                  Usa al menos 10 caracteres.
                </span>
              )}
            </label>

            {isSignup && (
              <label className="block">
                <span className="mb-2 block text-sm font-medium">
                  Confirmar contraseña
                </span>
                <input
                  type="password"
                  value={passwordConfirmation}
                  onChange={(event) =>
                    setPasswordConfirmation(event.target.value)
                  }
                  autoComplete="new-password"
                  required
                  minLength={10}
                  maxLength={128}
                  className="h-12 w-full rounded-2xl border border-black/15 px-4 outline-none transition focus:border-[#4a2d23] focus:ring-4 focus:ring-[#4a2d23]/10"
                />
              </label>
            )}

            <button
              type="submit"
              disabled={submitting || googleSubmitting}
              className="w-full rounded-full bg-[#4a2d23] px-5 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-wait disabled:opacity-60"
            >
              {submitting
                ? "Procesando…"
                : isSignup
                  ? "Crear cuenta"
                  : "Iniciar sesión"}
            </button>
          </form>

          {googleAuthConfigured && (
            <>
              <div className="my-6 flex items-center gap-4 text-xs uppercase tracking-[0.18em] text-gray-400">
                <span className="h-px flex-1 bg-black/10" />
                o
                <span className="h-px flex-1 bg-black/10" />
              </div>

              <button
                type="button"
                onClick={() => void continueWithGoogle()}
                disabled={submitting || googleSubmitting}
                className="flex w-full items-center justify-center gap-3 rounded-full border border-black/15 px-5 py-3 text-sm font-medium transition hover:border-[#4a2d23] hover:bg-[#f7f3ee] disabled:cursor-wait disabled:opacity-60"
              >
                <GoogleIcon />
                {googleSubmitting
                  ? "Abriendo Google…"
                  : isSignup
                    ? "Crear cuenta con Google"
                    : "Iniciar sesión con Google"}
              </button>
            </>
          )}

          <p className="mt-6 text-xs leading-5 text-gray-500">
            Si tu cuenta se creó con Google, continúa usando Google. No
            vinculamos una contraseña a un correo existente sin verificarlo.
          </p>

          <p className="mt-7 text-center text-sm text-gray-600">
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
