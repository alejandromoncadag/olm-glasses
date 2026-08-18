"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";

type Prescription = { prescriptionRef: string; date: string | null; validUntil: string | null; label: string };
type PrescriptionMethod = "later" | "exam";
type PrescriptionStatus = "pending" | "provided" | "received_pending_validation" | "exam_requested";

export default function OpticalPrescriptionAccess({ draftId, provided, prescriptionStatus = provided ? "provided" : "pending", prescriptionMethod, onAttached }: { draftId: string; provided: boolean; prescriptionStatus?: PrescriptionStatus; prescriptionMethod: PrescriptionMethod; onAttached: (status?: PrescriptionStatus) => void }) {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<Prescription[]>([]);
  const [selected, setSelected] = useState("");
  const [linkStatus, setLinkStatus] = useState("");
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (loading || user?.role !== "customer" || !user.emailVerified || provided) return;
    fetch("/api/account/prescriptions", { cache: "no-store" }).then(async (response) => {
      const data = await response.json() as { linkStatus?: string; prescriptions?: Prescription[]; error?: string };
      if (!response.ok) throw new Error(data.error || "No pudimos consultar tus recetas.");
      setLinkStatus(data.linkStatus || "not_linked"); setItems(data.prescriptions || []);
    }).catch((error: Error) => setMessage(error.message));
  }, [loading, provided, user]);

  async function attach() {
    if (!selected) return;
    setWorking(true); setMessage("");
    const response = await fetch(`/api/identity/optical-drafts/${encodeURIComponent(draftId)}/prescription`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prescriptionRef: selected }),
    });
    const data = await response.json() as { error?: string };
    setWorking(false);
    if (!response.ok) { setMessage(data.error || "No pudimos usar la receta."); return; }
    setMessage("Receta guardada."); onAttached("provided");
  }

  async function upload(file: File | undefined) {
    if (!file) return;
    setWorking(true); setMessage("");
    const response = await fetch(`/api/identity/optical-drafts/${encodeURIComponent(draftId)}/prescription`, {
      method: "POST", headers: { "Content-Type": file.type, "X-Filename": file.name }, body: file,
    });
    const data = await response.json() as { error?: string };
    setWorking(false);
    if (!response.ok) { setMessage(data.error || "No pudimos recibir la receta."); return; }
    setMessage("Receta recibida, pendiente de validación."); onAttached("received_pending_validation");
  }

  const statusLabel = prescriptionStatus === "provided" ? "Receta guardada" : prescriptionStatus === "received_pending_validation" ? "Receta recibida" : prescriptionStatus === "exam_requested" || prescriptionMethod === "exam" ? "Examen solicitado" : "Receta pendiente";

  return <div className="mt-5 border border-black/10 p-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3 className="font-semibold">Receta</h3>
      <span className={`px-3 py-1 text-xs font-semibold ${provided ? "bg-emerald-100 text-emerald-900" : prescriptionMethod === "exam" ? "bg-amber-100 text-amber-900" : "bg-[#f4efe9] text-[#4a2d23]"}`}>{statusLabel}</span>
    </div>
    <p className="mt-2 text-sm text-gray-600">Elige cómo quieres completar la receta de esta configuración.</p>
    <div className="mt-4 grid gap-2 sm:grid-cols-2">
      <div className={`border p-3 text-sm ${provided ? "border-emerald-300 bg-emerald-50" : "border-black/10"}`}>
        <p className="font-medium">Usar receta guardada</p>
        <p className="mt-1 text-xs text-gray-600">Selecciona una receta aprobada vinculada a tu cuenta.</p>
      </div>
      <label className="cursor-pointer border border-black/10 p-3 text-sm">
        <p className="font-medium">Subir receta</p>
        <p className="mt-1 text-xs text-gray-600">PDF, JPG, PNG o WEBP · máximo 10 MB.</p>
        <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="mt-3 block w-full text-xs" disabled={working || prescriptionStatus === "provided"} onChange={(event) => void upload(event.target.files?.[0])} />
      </label>
      <div className={`border p-3 text-sm ${prescriptionMethod === "later" && !provided ? "border-[#4a2d23] bg-[#f7f3ee]" : "border-black/10"}`}>
        <p className="font-medium">Enviar receta después</p>
        <p className="mt-1 text-xs text-gray-600">Tu configuración permanece pendiente de receta.</p>
      </div>
      <div className={`border p-3 text-sm ${prescriptionMethod === "exam" ? "border-amber-300 bg-amber-50" : "border-black/10"}`}>
        <p className="font-medium">Solicitar examen</p>
        <p className="mt-1 text-xs text-gray-600">Registramos que necesitas coordinar un examen de la vista.</p>
      </div>
    </div>
    {loading ? <p className="mt-4 text-sm text-gray-600">Cargando recetas guardadas…</p> : user?.role !== "customer" ? <p className="mt-4 text-sm"> <Link className="underline" href={`/login?redirect_url=${encodeURIComponent(`/optical-order/${draftId}`)}`}>Inicia sesión</Link> para usar una receta guardada.</p> : !user.emailVerified ? <p className="mt-4 text-sm text-amber-900">Verifica tu correo desde <Link href="/account" className="underline">Mi cuenta</Link> antes de usar una receta guardada.</p> : linkStatus === "not_linked" ? <p className="mt-4 text-sm">Vincula una receta aprobada desde <Link href="/account#recetas" className="underline">Mi cuenta</Link>.</p> : items.length === 0 ? <p className="mt-4 text-sm text-gray-600">No hay recetas aprobadas disponibles.</p> : <div className="mt-4 flex flex-col gap-3 sm:flex-row">
      <select value={selected} onChange={(event) => setSelected(event.target.value)} className="min-h-11 flex-1 border border-black/20 bg-white px-3 text-sm">
        <option value="">Selecciona una receta aprobada</option>
        {items.map((item) => <option key={item.prescriptionRef} value={item.prescriptionRef}>{item.label}{item.date ? ` · ${item.date}` : ""}</option>)}
      </select>
      <button type="button" onClick={() => void attach()} disabled={!selected || working || prescriptionStatus === "provided"} className="bg-[#4a2d23] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{working ? "Guardando…" : "Usar esta receta"}</button>
    </div>}
    {message && <p className="mt-3 text-sm text-gray-700">{message}</p>}
  </div>;
}
