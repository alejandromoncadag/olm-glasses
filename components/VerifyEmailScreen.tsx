"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function VerifyEmailScreen({ token, deliveryFailed = false }: { token: string; deliveryFailed?: boolean }) {
  const [state, setState] = useState<"idle" | "working" | "done" | "error">(token ? "working" : "idle");
  const [message, setMessage] = useState(deliveryFailed ? "No pudimos enviar el correo de verificación. Solicita un nuevo enlace desde tu cuenta." : token ? "Verificando tu correo…" : "Revisa tu correo y abre el enlace de verificación.");
  const attempted = useRef(false);

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
    setMessage("Tu correo quedó verificado correctamente. Ya puedes continuar con tu cuenta.");
  }

  useEffect(() => {
    if (token && !attempted.current) {
      attempted.current = true;
      void verify();
    }
  }, [token]);

  return (
    <main className="min-h-screen bg-[#f7f3ee] px-6 py-20 text-[#2d1f1a]">
      <section className="mx-auto max-w-xl border border-black/10 bg-white p-8 text-center shadow-sm sm:p-12">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#765b50]">Cuenta OLM</p>
        <h1 className="mt-4 text-4xl font-semibold">{state === "done" ? "Correo verificado" : "Verificación de correo"}</h1>
        <p className={`mt-5 text-sm leading-6 ${state === "error" ? "text-red-700" : "text-gray-600"}`}>{message}</p>
        {token && state === "error" && <button type="button" onClick={() => void verify()} className="mt-7 rounded-full bg-[#4a2d23] px-7 py-3 text-sm font-semibold text-white">Reintentar</button>}
        {state === "done" && <div className="mt-7"><Link href="/account" className="inline-flex bg-[#4a2d23] px-7 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white">Ir a mi cuenta</Link></div>}
        {state !== "done" && <div className="mt-7"><Link href="/account" className="text-sm underline">Ir a mi cuenta</Link></div>}
      </section>
    </main>
  );
}
