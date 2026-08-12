"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import type { OpticalDraftResponse } from "@/lib/optical/types";

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

export default function OpticalDraftPage() {
  const params = useParams<{ draftId: string }>();
  const draftId = Array.isArray(params.draftId) ? params.draftId[0] : params.draftId;
  const [draft, setDraft] = useState<OpticalDraftResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/optical/drafts/${encodeURIComponent(draftId)}`, {
          cache: "no-store", signal: controller.signal,
        });
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
  }, [draftId]);

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

  if (loading) return <main className="min-h-screen bg-[#f7f3ee] p-8"><p>Cargando pedido óptico…</p></main>;
  if (error && !draft) return <main className="min-h-screen bg-[#f7f3ee] p-8"><h1 className="text-3xl">No pudimos abrir este pedido</h1><p className="mt-3 text-red-700">{error}</p></main>;
  if (!draft) return null;

  const active = draft.reservation.status === "activa";
  const config = draft.configuration;
  return (
    <main className="min-h-screen bg-[#f7f3ee] px-5 py-12 text-[#2d1f1a] sm:px-8">
      <section className="mx-auto max-w-3xl border border-black/10 bg-white p-6 shadow-sm sm:p-10">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#765b50]">Pedido óptico temporal</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-[Georgia,'Times_New_Roman',serif] text-4xl">Resumen de tus micas</h1>
          <span className={`px-3 py-2 text-xs font-semibold ${active ? "bg-emerald-100 text-emerald-900" : "bg-gray-200 text-gray-700"}`}>
            {draft.status.replaceAll("_", " ")}
          </span>
        </div>

        <div className="mt-8 divide-y divide-black/10 border-y border-black/15">
          <Line label="Armazón" value={config.frame.name} amount={money(config.frame.price, draft.currency)} />
          <Line label="Diseño" value={config.lensDesign.name} amount={`+${money(config.lensDesign.adjustment, draft.currency)}`} />
          <Line label="Tratamiento" value={config.treatment?.name || "Sin tratamiento"} amount={`+${money(config.treatment?.adjustment || "0", draft.currency)}`} />
          {config.variant && <Line label="Variante" value={config.variant.name} />}
          <Line label="Sucursal" value={draft.branch.name} />
          <Line label="Receta" value={draft.prescriptionMethod === "exam" ? "Examen de la vista pendiente" : "Se enviará después"} />
          <Line label="Reserva" value={active ? `Vence ${dateTime(draft.reservation.expiresAt)}` : draft.reservation.status} />
        </div>

        <div className="mt-8 flex items-end justify-between border bg-[#2d1f1a] p-6 text-white">
          <span className="text-xs uppercase tracking-[0.16em]">Total configurado</span>
          <strong className="font-[Georgia,'Times_New_Roman',serif] text-3xl">{money(draft.configuredTotal, draft.currency)}</strong>
        </div>
        <p className="mt-4 text-sm leading-6 text-gray-600">
          Este pedido reserva únicamente el armazón. Todavía no se creó una venta, un pago ni una orden de laboratorio.
        </p>
        {error && <p className="mt-4 border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <div className="mt-7 flex flex-wrap gap-3">
          <a href="/eyeglasses" className="border border-black/20 px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em]">Seguir viendo</a>
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
