"use client";

import Link from "next/link";
import { useState } from "react";

export default function VerifyEmailScreen({ token }: { token: string }) {
  const [state, setState] = useState<"idle" | "working" | "done" | "error">("idle");
  const [message, setMessage] = useState(token ? "Confirma tu correo para continuar." : "Revisa tu correo y abre el enlace de verificación.");

  async function verify() {
    if (!token) return;
    setState("working");
    const response = await fetch("/api/customer-auth/email-verification/confirm", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setState("error"); setMessage(payload.error || "No pudimos verificar el correo."); return;
    }
    setState("done");
    setMessage("Tu correo quedó verificado. Ya puedes revisar la vinculación de paciente.");
  }

  return (
    <main className="min-h-screen bg-[#f7f3ee] px-6 py-20 text-[#2d1f1a]">
      <section className="mx-auto max-w-xl border border-black/10 bg-white p-8 text-center shadow-sm sm:p-12">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#765b50]">Cuenta OLM</p>
        <h1 className="mt-4 text-4xl font-semibold">Verificación de correo</h1>
        <p className={`mt-5 text-sm leading-6 ${state === "error" ? "text-red-700" : "text-gray-600"}`}>{message}</p>
        {token && state !== "done" && <button type="button" onClick={() => void verify()} disabled={state === "working"} className="mt-7 rounded-full bg-[#4a2d23] px-7 py-3 text-sm font-semibold text-white disabled:opacity-50">{state === "working" ? "Verificando…" : "Verificar mi correo"}</button>}
        <div className="mt-7"><Link href="/account" className="text-sm underline">Ir a mi cuenta</Link></div>
      </section>
    </main>
  );
}
