"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { OnlineOrder } from "@/lib/fulfillment/types";

function money(value: string, currency: string) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency }).format(Number(value));
}

export default function PendingOrderPage({ params }: { params: Promise<{ orderId: string }> }) {
  const [order, setOrder] = useState<OnlineOrder | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    void params.then(({ orderId: value }) => {
      return fetch(`/api/fulfillment/requests/${encodeURIComponent(value)}/order`, { cache: "no-store" })
        .then(async (response) => {
          if (!response.ok) return;
          setOrder((await response.json()) as OnlineOrder);
        })
        .finally(() => setLoading(false));
    });
  }, [params]);
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
          <p>No se ha realizado ningún cobro.</p>
          <p>No se ha creado una venta ni un envío.</p>
          <p>El inventario no se ha descontado permanentemente.</p>
          <p>La integración de pago se habilitará en una fase posterior.</p>
        </div>
      </section>
      <Link href="/" className="mt-6 inline-flex rounded-full border border-stone-300 px-5 py-3 font-semibold">Volver a la tienda</Link>
    </main>
  );
}
