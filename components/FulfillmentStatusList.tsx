"use client";

import { useEffect, useState } from "react";

import { FulfillmentRequestCard } from "@/components/ShippingRequestFlow";
import type { FulfillmentRequest } from "@/lib/fulfillment/types";

export default function FulfillmentStatusList() {
  const [requests, setRequests] = useState<FulfillmentRequest[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    void fetch("/api/fulfillment/requests", { cache: "no-store" }).then(async (response) => {
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "No pudimos cargar las solicitudes.");
      setRequests(payload.requests || []);
    }).catch((reason) => setError(reason instanceof Error ? reason.message : String(reason))).finally(() => setLoading(false));
  }, []);
  if (loading) return <p className="mt-10 text-stone-600">Cargando solicitudes…</p>;
  if (error) return <p className="mt-10 rounded-2xl bg-red-50 p-5 text-red-700">{error}</p>;
  if (!requests.length) return <div className="mt-10 rounded-3xl border border-stone-200 p-8"><h2 className="text-2xl font-semibold">Aún no hay solicitudes</h2><p className="mt-2 text-stone-600">Crea una desde tu carrito cuando esté listo.</p><a href="/cart" className="mt-5 inline-flex rounded-full bg-black px-5 py-3 text-white">Ir al carrito</a></div>;
  return <div className="mt-10 space-y-5">{requests.map((request) => <FulfillmentRequestCard key={request.requestId} request={request} />)}</div>;
}
