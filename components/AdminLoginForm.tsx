"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/hooks/useAuth";
import { loginAdmin } from "@/lib/auth";

export default function AdminLoginForm() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const result = await loginAdmin(email, password);

    if ("error" in result) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    await refresh();
    window.dispatchEvent(new Event("olm-auth-change"));
    router.replace("/admin");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-md rounded-3xl border bg-white p-8 shadow-sm"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#6b4a3f]">
        Uso interno
      </p>
      <h1 className="mt-3 text-3xl font-semibold">Acceso administrativo</h1>
      <p className="mt-3 text-sm text-gray-600">
        Este acceso es únicamente para el equipo de Óptica OLM.
      </p>

      <label className="mt-8 block">
        <span className="text-sm font-medium">Correo</span>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-[#4a2d23]"
        />
      </label>

      <label className="mt-5 block">
        <span className="text-sm font-medium">Contraseña</span>
        <input
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-[#4a2d23]"
        />
      </label>

      {error && (
        <p className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-7 w-full rounded-full bg-[#4a2d23] px-6 py-3 text-white transition hover:bg-[#2d1f1a] disabled:opacity-50"
      >
        {submitting ? "Comprobando…" : "Entrar al panel"}
      </button>

      <Link
        href="/login"
        className="mt-6 block text-center text-sm text-[#4a2d23] underline"
      >
        Volver al acceso de clientes
      </Link>
    </form>
  );
}
