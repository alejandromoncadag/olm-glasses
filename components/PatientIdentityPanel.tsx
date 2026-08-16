"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type LinkStatus = "loading" | "not_linked" | "linked" | "manual_review" | "no_match";
type Prescription = { prescriptionRef: string; date: string | null; validUntil: string | null; label: string };

export default function PatientIdentityPanel({ emailVerified, hasPhone }: { emailVerified: boolean; hasPhone: boolean }) {
  const [status, setStatus] = useState<LinkStatus>(emailVerified ? "loading" : "not_linked");
  const [attemptId, setAttemptId] = useState("");
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState(false);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  useEffect(() => {
    if (!emailVerified) return;
    fetch("/api/account/patient-link", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json() as { status?: string; error?: string };
        if (!response.ok) throw new Error(data.error || "No pudimos revisar tus recetas.");
        setStatus(data.status === "linked" ? "linked" : "not_linked");
      })
      .catch((error: Error) => { setStatus("not_linked"); setMessage(error.message); });
  }, [emailVerified]);

  useEffect(() => {
    if (!emailVerified || status !== "linked") return;
    fetch("/api/account/prescriptions", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json() as { prescriptions?: Prescription[] };
        if (response.ok) setPrescriptions(data.prescriptions || []);
      })
      .catch(() => setPrescriptions([]));
  }, [emailVerified, status]);

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
    if (!response.ok) { setMessage(data.error || "No pudimos buscar una receta."); return; }
    if (data.status === "match_available" && data.linkAttemptId) {
      setAttemptId(data.linkAttemptId); setMessage("Encontramos una receta disponible. Confirma para agregarla a tu cuenta."); return;
    }
    if (data.status === "manual_review") { setStatus("manual_review"); setMessage("Estamos revisando tus datos. Te avisaremos cuando tu receta esté disponible."); return; }
    if (data.status === "already_linked") { setStatus("linked"); return; }
    setStatus("no_match"); setMessage("No encontramos una receta disponible con los datos de tu cuenta.");
  }

  async function confirmMatch() {
    setWorking(true); setMessage("");
    const response = await fetch("/api/account/patient-link", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ linkAttemptId: attemptId }) });
    const data = await response.json() as { error?: string };
    setWorking(false);
    if (!response.ok) { setMessage(data.error || "No pudimos guardar la receta."); return; }
    setAttemptId(""); setStatus("linked"); setMessage("La receta se agregó a tu cuenta.");
  }

  return (
    <section className="mt-8 border border-black/10 bg-white p-6 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#765b50]">Recetas</p>
      <h2 className="mt-2 text-2xl font-semibold">Tus recetas guardadas</h2>
      {!emailVerified ? <>
        <p className="mt-3 text-sm text-gray-600">Verifica tu correo antes de consultar una receta guardada.</p>
        <button onClick={() => void sendVerification()} disabled={working} className="mt-5 rounded-full bg-[#4a2d23] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Verificar correo</button>
      </> : status === "linked" ? <>
      <p className="mt-3 text-sm text-emerald-800">Estas son las recetas aprobadas disponibles para tus pedidos.</p>
      {prescriptions.length === 0 ? (
        <p className="mt-4 text-sm text-gray-600">No tienes recetas guardadas.</p>
      ) : (
        <div className="mt-4 divide-y divide-black/10 border-y border-black/10">
          {prescriptions.map((prescription) => (
            <div key={prescription.prescriptionRef} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <p className="font-medium">{prescription.label}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {prescription.date ? `Fecha: ${prescription.date}` : "Fecha no disponible"}
                  {prescription.validUntil ? ` · Vigente hasta ${prescription.validUntil}` : ""}
                </p>
              </div>
              <span className="text-xs text-emerald-800">Disponible</span>
            </div>
          ))}
        </div>
      )}
      </> : <>
        <p className="mt-3 text-sm text-gray-600">Busca una receta aprobada asociada a tus datos de cuenta.</p>
        {!hasPhone ? <p className="mt-3 text-sm text-amber-800">Guarda tu teléfono en Datos de contacto antes de continuar.</p> :
          <button onClick={() => void checkMatch()} disabled={working} className="mt-5 rounded-full bg-[#4a2d23] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Buscar receta</button>}
        {attemptId && <button onClick={() => void confirmMatch()} disabled={working} className="ml-3 mt-5 rounded-full border border-[#4a2d23] px-5 py-2.5 text-sm font-semibold text-[#4a2d23] disabled:opacity-50">Confirmar receta</button>}
      </>}
      {message && <p className="mt-4 text-sm text-gray-700">{message}</p>}
      {status === "linked" && <Link href="#pedidos" className="mt-4 inline-block text-sm underline">Revisar mis pedidos</Link>}
    </section>
  );
}
