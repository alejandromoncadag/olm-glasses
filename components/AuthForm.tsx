"use client";

import { useState } from "react";
import { login, signup } from "@/lib/auth";

type Mode = "login" | "signup";

type AuthFormProps = {
  mode: Mode;
};

export default function AuthForm({ mode }: AuthFormProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (mode === "signup" && !fullName.trim()) {
      setError("Tu nombre es obligatorio.");
      return;
    }

    if (!email.includes("@")) {
      setError("Escribe un correo electrónico válido.");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setSubmitting(true);

    const result =
      mode === "login"
        ? login(email, password)
        : signup(fullName, email, password);

    if ("error" in result) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    const redirect =
      new URLSearchParams(window.location.search).get("redirect") || "/account";
    window.location.href = redirect;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-md rounded-2xl border bg-white p-8"
    >
      <h1 className="text-3xl font-bold">
        {mode === "login" ? "Inicia sesión" : "Crea tu cuenta"}
      </h1>

      <p className="mt-2 text-sm text-gray-600">
        {mode === "login"
          ? "Bienvenido de vuelta a Óptica OLM."
          : "Guarda tus favoritos, agenda exámenes y revisa tus pedidos."}
      </p>

      <div className="mt-6 grid gap-4">
        {mode === "signup" && (
          <div>
            <label className="text-sm font-medium">Nombre completo</label>
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
              placeholder="Alejandro Moncada"
              autoComplete="name"
            />
          </div>
        )}

        <div>
          <label className="text-sm font-medium">Correo electrónico</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
            placeholder="correo@email.com"
            autoComplete="email"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
            placeholder="Mínimo 6 caracteres"
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
          />
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-full bg-black px-6 py-3 text-white disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {submitting
            ? "Procesando…"
            : mode === "login"
            ? "Iniciar sesión"
            : "Crear cuenta"}
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-gray-600">
        {mode === "login" ? (
          <>
            ¿Aún no tienes cuenta?{" "}
            <a href="/signup" className="font-medium text-black underline">
              Regístrate
            </a>
          </>
        ) : (
          <>
            ¿Ya tienes cuenta?{" "}
            <a href="/login" className="font-medium text-black underline">
              Inicia sesión
            </a>
          </>
        )}
      </p>
    </form>
  );
}
