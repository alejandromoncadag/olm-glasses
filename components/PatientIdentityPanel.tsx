"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type LinkStatus = "loading" | "not_linked" | "linked" | "manual_review" | "no_match";

export default function PatientIdentityPanel({ emailVerified, hasPhone }: { emailVerified: boolean; hasPhone: boolean }) {
  const [status, setStatus] = useState<LinkStatus>(emailVerified ? "loading" : "not_linked");
  const [attemptId, setAttemptId] = useState("");
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!emailVerified) return;
    fetch("/api/account/patient-link", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json() as { status?: string; error?: string };
        if (!response.ok) throw new Error(data.error || "No pudimos revisar la vinculación.");
        setStatus(data.status === "linked" ? "linked" : "not_linked");
      })
      .catch((error: Error) => { setStatus("not_linked"); setMessage(error.message); });
  }, [emailVerified]);

  async function sendVerification() {
    setWorking(true); setMessage("");
    const response = await fetch("/api/customer-auth/email-verification/request", { method: "POST" });
    const data = await response.json() as { error?: string; devVerificationUrl?: string };
    setWorking(false);
    if (!response.ok) { setMessage(data.error || "No pudimos enviar la verificación."); return; }
    if (data.devVerificationUrl) { window.location.assign(data.devVerificationUrl); return; }
    setMessage("Enlace de verificación preparado. Revisa tu correo.");
  }

  async function checkMatch() {
    setWorking(true); setMessage("");
    const response = await fetch("/api/account/patient-link", { method: "POST" });
    const data = await response.json() as { status?: string; linkAttemptId?: string; error?: string };
    setWorking(false);
    if (!response.ok) { setMessage(data.error || "No pudimos buscar tu expediente."); return; }
    if (data.status === "match_available" && data.linkAttemptId) {
      setAttemptId(data.linkAttemptId); setMessage("Encontramos una coincidencia compatible. Confirma para vincularla."); return;
    }
    if (data.status === "manual_review") { setStatus("manual_review"); setMessage("Necesitamos revisar la coincidencia manualmente. No se mostraron datos clínicos."); return; }
    if (data.status === "already_linked") { setStatus("linked"); return; }
    setStatus("no_match"); setMessage("No encontramos una coincidencia exacta con correo, teléfono y nombre.");
  }

  async function confirmMatch() {
    setWorking(true); setMessage("");
    const response = await fetch("/api/account/patient-link", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ linkAttemptId: attemptId }) });
    const data = await response.json() as { error?: string };
    setWorking(false);
    if (!response.ok) { setMessage(data.error || "No pudimos confirmar la vinculación."); return; }
    setAttemptId(""); setStatus("linked"); setMessage("Tu cuenta quedó vinculada de forma segura.");
  }

  return (
    <section className="mt-8 border border-black/10 bg-white p-6 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#765b50]">Expediente y recetas</p>
      <h2 className="mt-2 text-2xl font-semibold">Vinculación segura</h2>
      {!emailVerified ? <>
        <p className="mt-3 text-sm text-gray-600">Verifica tu correo antes de buscar un expediente. Nunca vinculamos usando solamente el correo.</p>
        <button onClick={() => void sendVerification()} disabled={working} className="mt-5 rounded-full bg-[#4a2d23] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Enviar verificación</button>
      </> : status === "linked" ? <>
        <p className="mt-3 text-sm text-emerald-800">Cuenta vinculada. Solo las recetas ópticas aprobadas expresamente podrán aparecer en tus pedidos.</p>
      </> : <>
        <p className="mt-3 text-sm text-gray-600">Buscaremos una coincidencia exacta usando correo verificado, teléfono y nombre compatible.</p>
        {!hasPhone ? <p className="mt-3 text-sm text-amber-800">Guarda tu teléfono en Datos de contacto antes de continuar.</p> :
          <button onClick={() => void checkMatch()} disabled={working} className="mt-5 rounded-full bg-[#4a2d23] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Buscar mi expediente</button>}
        {attemptId && <button onClick={() => void confirmMatch()} disabled={working} className="ml-3 mt-5 rounded-full border border-[#4a2d23] px-5 py-2.5 text-sm font-semibold text-[#4a2d23] disabled:opacity-50">Confirmar vinculación</button>}
      </>}
      {message && <p className="mt-4 text-sm text-gray-700">{message}</p>}
      {status === "linked" && <Link href="#pedidos" className="mt-4 inline-block text-sm underline">Revisar mis pedidos</Link>}
    </section>
  );
}
