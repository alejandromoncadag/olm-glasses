"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";

type Prescription = { prescriptionRef: string; date: string | null; validUntil: string | null; label: string };

export default function OpticalPrescriptionAccess({ draftId, provided, onAttached }: { draftId: string; provided: boolean; onAttached: () => void }) {
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
    setMessage("Receta aprobada seleccionada. El pago sigue pendiente y la producción continúa bloqueada."); onAttached();
  }

  if (provided) return <p className="mt-5 border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">Receta aprobada seleccionada. Esto no confirma el pago ni libera producción.</p>;
  if (loading) return null;
  if (user?.role !== "customer") return <div className="mt-5 border border-black/10 p-4 text-sm"><Link className="underline" href={`/login?redirect_url=${encodeURIComponent(`/optical-order/${draftId}`)}`}>Inicia sesión</Link> para vincular una receta guardada. También puedes conservar la opción de enviarla después.</div>;
  if (!user.emailVerified) return <div className="mt-5 border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Verifica tu correo desde <Link href="/account" className="underline">Mi cuenta</Link> antes de vincular un expediente.</div>;
  if (linkStatus === "not_linked") return <div className="mt-5 border border-black/10 p-4 text-sm">Vincula tu expediente desde <Link href="/account" className="underline">Mi cuenta</Link>. La vinculación por sí sola no completa la receta.</div>;

  return <div className="mt-5 border border-black/10 p-4">
    <h3 className="font-semibold">Usar una receta guardada</h3>
    {items.length === 0 ? <p className="mt-2 text-sm text-gray-600">No hay recetas ópticas aprobadas para uso en línea. Las historias clínicas no se publican automáticamente.</p> : <div className="mt-3 flex flex-col gap-3 sm:flex-row">
      <select value={selected} onChange={(event) => setSelected(event.target.value)} className="min-h-11 flex-1 border border-black/20 bg-white px-3 text-sm">
        <option value="">Selecciona una receta aprobada</option>
        {items.map((item) => <option key={item.prescriptionRef} value={item.prescriptionRef}>{item.label}{item.date ? ` · ${item.date}` : ""}</option>)}
      </select>
      <button type="button" onClick={() => void attach()} disabled={!selected || working} className="bg-[#4a2d23] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{working ? "Guardando…" : "Usar esta receta"}</button>
    </div>}
    {message && <p className="mt-3 text-sm text-gray-700">{message}</p>}
  </div>;
}
