"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { OnlineOrder, PaymentSession } from "@/lib/fulfillment/types";

function money(value: string, currency: string) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency }).format(Number(value));
}

export default function PendingOrderPage({ params }: { params: Promise<{ orderId: string }> }) {
  const [order, setOrder] = useState<OnlineOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestId, setRequestId] = useState("");
  const [paymentSession, setPaymentSession] = useState<PaymentSession | null>(null);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  useEffect(() => {
    void params.then(({ orderId: value }) => {
      setRequestId(value);
      return fetch(`/api/fulfillment/requests/${encodeURIComponent(value)}/order`, { cache: "no-store" })
        .then(async (response) => {
          if (!response.ok) return;
          setOrder((await response.json()) as OnlineOrder);
        })
        .finally(() => setLoading(false));
    });
  }, [params]);
  async function preparePaymentSession() {
    if (!requestId || paymentBusy) return;
    setPaymentBusy(true);
    setPaymentError("");
    try {
      const response = await fetch(`/api/fulfillment/requests/${encodeURIComponent(requestId)}/payment-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail = payload.detail;
        const code = typeof detail === "object" && detail ? detail.code : undefined;
        if (code === "PHASE_1FC2A_DISABLED") {
          setPaymentError("Pago en línea todavía no está habilitado.");
        } else {
          setPaymentError(typeof detail === "object" && detail ? detail.message : detail || "No se pudo preparar la sesión de pago.");
        }
        return;
      }
      setPaymentSession(payload as PaymentSession);
    } catch {
      setPaymentError("No se pudo conectar con la sesión de pago.");
    } finally {
      setPaymentBusy(false);
    }
  }
  if (loading) return <main className="mx-auto max-w-3xl px-5 py-16"><p className="text-stone-600">Cargando orden…</p></main>;
  if (!order) {
    return <main className="mx-auto max-w-3xl px-5 py-16"><h1 className="text-3xl font-semibold">Orden no encontrada</h1><p className="mt-3 text-stone-600">No pudimos cargar esta orden con tu sesión actual.</p><Link href="/cart" className="mt-6 inline-flex rounded-full bg-black px-5 py-3 font-semibold text-white">Volver al carrito</Link></main>;
  }
  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <section className="rounded-3xl border border-amber-300 bg-amber-50 p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-800">Orden creada · Pago pendiente</p>
        <h1 className="mt-2 text-3xl font-semibold text-amber-950">Continuaremos con el pago próximamente</h1>
        <p className="mt-3 text-amber-900">Número de orden: <strong>{order.orderId}</strong></p>
        <div className="mt-6 grid gap-2 text-sm text-amber-950">
          <p>Estado: <strong>pending_payment</strong></p>
          <p>Sucursal de preparación: <strong>{String(order.branch.name || order.branchId)}</strong></p>
          <p>Subtotal: <strong>{money(order.subtotal, order.currency)}</strong></p>
          <p>Envío: <strong>{money(order.shipping, order.currency)}</strong></p>
          <p className="text-lg">Total: <strong>{money(order.total, order.currency)}</strong></p>
        </div>
        <div className="mt-6 space-y-1 border-t border-amber-200 pt-4 text-sm text-amber-900">
          {paymentSession ? <>
            <p className="font-semibold">Sesión de pago preparada.</p>
            <p>Proveedor planeado: Conekta.</p>
            <p>Estado: pendiente.</p>
            <p>No se abrió checkout.</p>
            <p>No se realizó ningún cobro.</p>
          </> : <>
            <p className="font-semibold">Pago en línea próximamente.</p>
            <p>Proveedor planeado: Conekta.</p>
            <p>No se han enviado datos de pago.</p>
            <p>No se ha realizado ningún cobro.</p>
          </>}
          <p>No se ha creado una venta ni un envío.</p>
          <p>El inventario no se ha descontado permanentemente.</p>
          <p>La integración de pago se habilitará en una fase posterior.</p>
        </div>
        {paymentError && <p className="mt-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm font-semibold text-red-800">{paymentError}</p>}
        <button type="button" onClick={() => void preparePaymentSession()} disabled={paymentBusy || Boolean(paymentSession)} className="mt-6 rounded-full bg-amber-200 px-5 py-3 font-semibold text-amber-900 disabled:cursor-not-allowed disabled:opacity-70">
          {paymentBusy ? "Preparando sesión de pago..." : paymentSession ? "Sesión de pago preparada" : "Preparar sesión de pago"}
        </button>
      </section>
      <Link href="/" className="mt-6 inline-flex rounded-full border border-stone-300 px-5 py-3 font-semibold">Volver a la tienda</Link>
    </main>
  );
}
