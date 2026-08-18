"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

import type { OpticalDraftResponse } from "@/lib/optical/types";
import { useAuth } from "@/hooks/useAuth";
import OpticalPrescriptionAccess from "@/components/OpticalPrescriptionAccess";

function money(value: string, currency: string) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency", currency, minimumFractionDigits: 2,
  }).format(Number(value));
}

function dateTime(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium", timeStyle: "short",
  }).format(new Date(value));
}

function draftStatusLabel(value: string) {
  return {
    pendiente_receta: "Receta pendiente",
    listo_para_pago: "Lista para continuar",
    pendiente_pago: "Pago pendiente",
    cancelado: "Cancelado",
    expirado: "Expirado",
  }[value] || value.replaceAll("_", " ");
}

function prescriptionStatusLabel(method: "later" | "exam", status: "pending" | "provided" | "received_pending_validation" | "exam_requested") {
  if (status === "provided") return "Receta guardada";
  if (status === "received_pending_validation") return "Receta recibida";
  if (status === "exam_requested") return "Examen solicitado";
  return method === "exam" ? "Examen solicitado" : "Receta pendiente";
}

function reservationStatusLabel(status: "activa" | "cancelada" | "expirada") {
  return { activa: "Activa", cancelada: "Cancelada", expirada: "Vencida" }[status];
}

function prescriptionAllowsCart(status: OpticalDraftResponse["prescriptionStatus"]) {
  return ["provided", "received_pending_validation", "pending", "exam_requested"].includes(status);
}

export default function OpticalDraftPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams<{ draftId: string }>();
  const draftId = Array.isArray(params.draftId) ? params.draftId[0] : params.draftId;
  const [draft, setDraft] = useState<OpticalDraftResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const attachKey = useRef<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        let response = await fetch(`/api/optical/drafts/${encodeURIComponent(draftId)}`, {
          cache: "no-store", signal: controller.signal,
        });
        if (response.status === 404 && !authLoading && user?.role === "customer") {
          const claim = await fetch(`/api/identity/optical-drafts/${encodeURIComponent(draftId)}/claim`, { method: "POST", signal: controller.signal });
          if (claim.ok) response = await fetch(`/api/optical/drafts/${encodeURIComponent(draftId)}`, { cache: "no-store", signal: controller.signal });
        }
        const payload = (await response.json()) as OpticalDraftResponse & { error?: string };
        if (!response.ok) throw new Error(payload.error || "No pudimos abrir este pedido.");
        setDraft(payload);
      } catch (loadError) {
        if ((loadError as Error).name !== "AbortError") setError((loadError as Error).message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [authLoading, draftId, user?.role]);

  async function cancelDraft() {
    if (!draft || !window.confirm("¿Seguro que quieres cancelar este pedido óptico temporal?")) return;
    setCancelling(true);
    setError("");
    try {
      const response = await fetch(`/api/optical/drafts/${encodeURIComponent(draftId)}/cancel`, { method: "POST" });
      const payload = (await response.json()) as OpticalDraftResponse & { error?: string };
      if (!response.ok) throw new Error(payload.error || "No pudimos cancelar el pedido.");
      setDraft(payload);
    } catch (cancelError) {
      setError((cancelError as Error).message);
    } finally {
      setCancelling(false);
    }
  }

  async function continueToCart() {
    if (!draft || !active || !prescriptionAllowsCart(draft.prescriptionStatus) || addingToCart) return;
    setAddingToCart(true);
    setError("");
    try {
      if (!attachKey.current) attachKey.current = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${draftId}-cart-attach`;
      const response = await fetch(`/api/optical/drafts/${encodeURIComponent(draftId)}/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": attachKey.current },
        body: JSON.stringify({ previewFingerprint: draft.previewFingerprint, configuredTotal: draft.configuredTotal }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string; details?: { message?: string } };
      if (!response.ok) throw new Error(payload.details?.message || payload.error || "La reserva óptica ya no está disponible. Revisa tu configuración.");
      window.location.assign("/cart");
    } catch (attachError) {
      setError((attachError as Error).message);
      setAddingToCart(false);
    }
  }

  if (loading) return <main className="min-h-screen bg-[#f7f3ee] p-8"><p>Cargando pedido óptico…</p></main>;
  if (error && !draft) return <main className="min-h-screen bg-[#f7f3ee] p-8"><h1 className="text-3xl">No pudimos abrir este pedido</h1><p className="mt-3 text-red-700">{error}</p></main>;
  if (!draft) return null;

  const active = draft.reservation.status === "activa";
  const config = draft.configuration;
  return (
    <main className="min-h-screen bg-[#f7f3ee] px-5 py-12 text-[#2d1f1a] sm:px-8">
      <section className="mx-auto max-w-3xl border border-black/10 bg-white p-6 shadow-sm sm:p-10">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#765b50]">Configuración óptica reservada</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-[Georgia,'Times_New_Roman',serif] text-4xl">Resumen de tus micas</h1>
          <span className={`px-3 py-2 text-xs font-semibold ${active ? "bg-emerald-100 text-emerald-900" : "bg-gray-200 text-gray-700"}`}>
            {draftStatusLabel(draft.status)}
          </span>
        </div>

        <div className="mt-8 divide-y divide-black/10 border-y border-black/15">
          <Line label="Armazón" value={config.frame.name} amount={money(config.frame.price, draft.currency)} />
          <Line label="Tipo de mica" value={config.lensDesign.name} amount={`+${money(config.lensDesign.adjustment, draft.currency)}`} />
          <Line label="Tratamiento" value={config.treatment?.name || "Sin tratamiento"} amount={`+${money(config.treatment?.adjustment || "0", draft.currency)}`} />
          <Line label="Variante/color" value={config.variant?.name || "No aplica"} />
          <Line label="Sucursal" value={draft.branch.name} />
          <Line label="Método de receta" value={draft.prescriptionMethod === "exam" ? "Solicitar examen" : "Enviar receta después"} />
          <Line label="Estado de receta" value={prescriptionStatusLabel(draft.prescriptionMethod, draft.prescriptionStatus)} />
          <Line label="Reserva activa hasta" value={active ? dateTime(draft.reservation.expiresAt) : reservationStatusLabel(draft.reservation.status)} />
        </div>

        <div className="mt-8 flex items-end justify-between border bg-[#2d1f1a] p-6 text-white">
          <span className="text-xs uppercase tracking-[0.16em]">Total configurado</span>
          <strong className="font-[Georgia,'Times_New_Roman',serif] text-3xl">{money(draft.configuredTotal, draft.currency)}</strong>
        </div>
        <p className="mt-4 text-sm leading-6 text-gray-600">
          Tu armazón está reservado temporalmente. La configuración ya fue registrada en el flujo óptico interno; todavía no se ha realizado el pago ni se ha creado una venta.
        </p>
        {active && <OpticalPrescriptionAccess draftId={draftId} provided={draft.prescriptionStatus === "provided"} prescriptionStatus={draft.prescriptionStatus} prescriptionMethod={draft.prescriptionMethod} onAttached={(status) => setDraft((current) => current ? { ...current, prescriptionStatus: status || "provided", status: status === "provided" ? "listo_para_pago" : "pendiente_receta" } : current)} />}
        {error && <p className="mt-4 border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <div className="mt-7 flex flex-wrap gap-3">
          <a href="/eyeglasses" className="border border-black/20 px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em]">Seguir viendo</a>
          {active && prescriptionAllowsCart(draft.prescriptionStatus) && (
            <div className="w-full border border-[#d9cfc8] bg-[#f7f3ee] p-4">
              <p className="text-sm font-semibold text-[#2d1f1a]">Continuar al checkout</p>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                Tu configuración se agregará al carrito normal, junto con cualquier otro producto. Desde ahí podrás continuar con envío o recolección.
              </p>
              <button type="button" disabled={addingToCart} onClick={continueToCart} className="mt-4 h-11 bg-[#2d1f1a] px-5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#1f1511] disabled:cursor-wait disabled:opacity-60">
                {addingToCart ? "Preparando carrito…" : "Continuar con este pedido"}
              </button>
            </div>
          )}
          {active && (
            <button type="button" disabled={cancelling} onClick={cancelDraft} className="border border-red-300 px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-red-800 disabled:opacity-50">
              {cancelling ? "Cancelando…" : "Cancelar pedido temporal"}
            </button>
          )}
        </div>
      </section>
    </main>
  );
}

function Line({ label, value, amount }: { label: string; value: string; amount?: string }) {
  return <div className="grid gap-2 py-5 sm:grid-cols-[130px_1fr_auto]"><span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#765b50]">{label}</span><span>{value}</span>{amount && <strong>{amount}</strong>}</div>;
}
