"use client";

import { FormEvent, useEffect, useState } from "react";

import type {
  CheckoutPreview,
  FulfillmentOption,
  FulfillmentRequest,
  PickupBranch,
} from "@/lib/fulfillment/types";

function money(value: string, currency = "MXN") {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
  }).format(Number(value));
}

function deliveryEstimate(option: FulfillmentOption) {
  return option.minimumDeliveryDays === option.maximumDeliveryDays
    ? `${option.maximumDeliveryDays} días`
    : `${option.minimumDeliveryDays}-${option.maximumDeliveryDays} días`;
}

function dateTime(value: string) {
  return new Date(value).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const statusLabels: Record<FulfillmentRequest["status"], string> = {
  pending: "Esperando cotizaciones",
  quoted: "Opciones disponibles",
  selected: "Opción seleccionada",
  expired: "Solicitud vencida",
  unavailable: "Disponibilidad cambió",
  cancelled: "Solicitud cancelada",
};

type FormValues = {
  fullName: string;
  email: string;
  phone: string;
  street: string;
  exteriorNumber: string;
  interiorNumber: string;
  neighborhood: string;
  postalCode: string;
  city: string;
  state: string;
  references: string;
  pickupBranchId: string;
};

const initialForm: FormValues = {
  fullName: "",
  email: "",
  phone: "",
  street: "",
  exteriorNumber: "",
  interiorNumber: "",
  neighborhood: "",
  postalCode: "",
  city: "",
  state: "",
  references: "",
  pickupBranchId: "",
};

function diagnostic(action: string, requestId: string, reason: unknown) {
  console.error("Fulfillment UI request failed", {
    action,
    requestId,
    message: reason instanceof Error ? reason.message : "Unknown error",
  });
}

function isCheckoutPreview(value: unknown): value is CheckoutPreview {
  if (!value || typeof value !== "object") return false;
  const preview = value as Partial<CheckoutPreview>;
  return Boolean(
    preview.previewId &&
      preview.requestId &&
      preview.fulfillment?.optionId &&
      preview.subtotal &&
      preview.shipping &&
      preview.total
  );
}

async function responsePayload(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
    code?: string;
  };
  if (!response.ok) {
    throw new Error(payload.error || fallback);
  }
  return payload as unknown;
}

async function fetchPreview(requestId: string) {
  const response = await fetch(
    `/api/fulfillment/requests/${encodeURIComponent(requestId)}/preview`,
    { method: "POST", cache: "no-store" }
  );
  const payload = await responsePayload(
    response,
    "No pudimos cargar la previsualización del checkout."
  );
  if (!isCheckoutPreview(payload)) {
    throw new Error("La previsualización recibida no es válida.");
  }
  return payload;
}

function CheckoutPreviewPanel({ preview }: { preview: CheckoutPreview }) {
  const option = preview.fulfillment;
  return (
    <section className="mt-6 overflow-hidden rounded-3xl border border-emerald-300 bg-emerald-50">
      <div className="border-b border-emerald-200 px-5 py-4 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-800">
          Checkout preview only
        </p>
        <h4 className="mt-2 text-2xl font-semibold text-emerald-950">
          {option.carrierName} · {option.serviceLevel}
        </h4>
        <p className="mt-1 text-sm text-emerald-900">
          {option.branchName} · Entrega estimada en {deliveryEstimate(option)}
        </p>
        <p className="mt-2 text-xs text-emerald-800">
          Cotización vigente hasta {dateTime(preview.expiresAt)}
        </p>
      </div>

      <dl className="divide-y divide-emerald-200 px-5 sm:px-6">
        <div className="flex items-center justify-between py-3 text-sm">
          <dt>Subtotal de productos</dt>
          <dd className="font-semibold">
            {money(preview.subtotal, preview.currency)}
          </dd>
        </div>
        <div className="flex items-center justify-between py-3 text-sm">
          <dt>Envío</dt>
          <dd className="font-semibold">
            {money(preview.shipping, preview.currency)}
          </dd>
        </div>
        <div className="flex items-center justify-between py-4 text-lg">
          <dt className="font-semibold">Total estimado</dt>
          <dd className="text-xl font-bold">
            {money(preview.total, preview.currency)}
          </dd>
        </div>
      </dl>

      <div className="space-y-1 bg-white/70 px-5 py-4 text-sm text-emerald-950 sm:px-6">
        <p className="font-semibold">Inventory is not reserved.</p>
        <p className="font-semibold">No order or payment has been created.</p>
        <p className="pt-2 text-emerald-800">
          Puedes elegir otra cotización mientras siga activa. El checkout final
          estará disponible en una fase posterior.
        </p>
        <a
          href="/cart"
          className="mt-3 inline-flex rounded-full border border-emerald-900 px-4 py-2 font-semibold"
        >
          Volver al carrito
        </a>
      </div>
    </section>
  );
}

export function FulfillmentRequestCard({
  request,
}: {
  request: FulfillmentRequest;
}) {
  const [busy, setBusy] = useState("");
  const [previewBusy, setPreviewBusy] = useState(false);
  const [error, setError] = useState("");
  const [selectedOptionId, setSelectedOptionId] = useState(
    request.selectedOptionId || ""
  );
  const [preview, setPreview] = useState<CheckoutPreview | null>(null);

  useEffect(() => {
    if (request.status !== "selected") return;
    let active = true;
    setPreviewBusy(true);
    setError("");
    void fetchPreview(request.requestId)
      .then((payload) => {
        if (!active) return;
        setPreview(payload);
        setSelectedOptionId(payload.fulfillment.optionId);
      })
      .catch((reason) => {
        if (!active) return;
        diagnostic("load_preview", request.requestId, reason);
        setError(
          reason instanceof Error
            ? reason.message
            : "No pudimos cargar la previsualización del checkout."
        );
      })
      .finally(() => {
        if (active) setPreviewBusy(false);
      });
    return () => {
      active = false;
    };
  }, [request.requestId, request.status]);

  async function select(optionId: string) {
    setBusy(optionId);
    setError("");
    try {
      const response = await fetch(
        `/api/fulfillment/requests/${encodeURIComponent(request.requestId)}/select`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ optionId }),
        }
      );
      const selectedPayload = await responsePayload(
        response,
        "No pudimos seleccionar esta opción."
      );
      setSelectedOptionId(optionId);
      if (isCheckoutPreview(selectedPayload)) {
        setPreview(selectedPayload);
      }

      try {
        const refreshedPreview = await fetchPreview(request.requestId);
        setPreview(refreshedPreview);
        setSelectedOptionId(refreshedPreview.fulfillment.optionId);
      } catch (reason) {
        diagnostic("refresh_preview_after_selection", request.requestId, reason);
        setError(
          "La opción se guardó, pero no pudimos actualizar la previsualización. Recarga la página para intentarlo nuevamente."
        );
      }
    } catch (reason) {
      diagnostic("select_option", request.requestId, reason);
      setError(
        reason instanceof Error
          ? reason.message
          : "No pudimos seleccionar esta opción."
      );
    } finally {
      setBusy("");
    }
  }

  const displayStatus = selectedOptionId ? "selected" : request.status;

  return (
    <article className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Solicitud {request.requestId.slice(0, 8)}
          </p>
          <h3 className="mt-1 text-xl font-semibold">
            {statusLabels[displayStatus]}
          </h3>
        </div>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold">
          {request.method === "pickup"
            ? "Recoger en sucursal"
            : "Envío a domicilio"}
        </span>
      </div>

      {request.options.length === 0 ? (
        <p className="mt-5 text-sm text-stone-600">
          La óptica está preparando opciones. Revisa esta página antes de{" "}
          {dateTime(request.expiresAt)}.
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {request.options.map((option) => {
            const selected = selectedOptionId === option.optionId;
            const badges = [
              request.ranking?.recommendedOptionId === option.optionId
                ? "Recomendada"
                : "",
              request.ranking?.cheapestOptionId === option.optionId
                ? "Más económica"
                : "",
              request.ranking?.fastestOptionId === option.optionId
                ? "Más rápida"
                : "",
            ].filter(Boolean);
            return (
              <div
                key={option.optionId}
                className={`rounded-2xl border p-4 transition ${
                  selected
                    ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500"
                    : "border-stone-200"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold">
                      {option.carrierName} · {option.serviceLevel}
                    </p>
                    <p className="mt-1 text-sm text-stone-600">
                      {option.branchName} · {deliveryEstimate(option)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selected && (
                        <span className="rounded-full bg-emerald-700 px-2.5 py-1 text-xs font-semibold text-white">
                          Opción elegida
                        </span>
                      )}
                      {badges.map((badge) => (
                        <span
                          key={badge}
                          className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900"
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">
                      {money(option.amount, option.currency)}
                    </p>
                    <button
                      type="button"
                      disabled={Boolean(busy) || selected}
                      onClick={() => void select(option.optionId)}
                      className="mt-2 rounded-full bg-black px-4 py-2 text-sm font-semibold text-white disabled:bg-stone-300"
                    >
                      {busy === option.optionId
                        ? "Validando…"
                        : selected
                          ? "Seleccionada"
                          : "Elegir"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {previewBusy && (
        <p className="mt-5 text-sm text-stone-600">
          Cargando previsualización del checkout…
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {preview && <CheckoutPreviewPanel preview={preview} />}
    </article>
  );
}

export default function ShippingRequestFlow() {
  const [method, setMethod] = useState<"shipping" | "pickup">("shipping");
  const [form, setForm] = useState(initialForm);
  const [branches, setBranches] = useState<PickupBranch[]>([]);
  const [request, setRequest] = useState<FulfillmentRequest | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (method !== "pickup" || branches.length) return;
    void fetch("/api/fulfillment/pickup-branches", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await responsePayload(
          response,
          "No pudimos cargar las sucursales."
        )) as { branches?: PickupBranch[] };
        setBranches(payload.branches || []);
      })
      .catch((reason) => {
        diagnostic("load_pickup_branches", "new-request", reason);
        setError(
          reason instanceof Error
            ? reason.message
            : "No pudimos cargar las sucursales."
        );
      });
  }, [method, branches.length]);

  function update(name: keyof FormValues, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const contact = {
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
    };
    const body =
      method === "pickup"
        ? { method, contact, pickupBranchId: Number(form.pickupBranchId) }
        : {
            method,
            contact,
            address: {
              street: form.street,
              exteriorNumber: form.exteriorNumber,
              interiorNumber: form.interiorNumber || null,
              neighborhood: form.neighborhood,
              postalCode: form.postalCode,
              city: form.city,
              state: form.state,
              country: "México",
              references: form.references || null,
            },
          };
    try {
      const response = await fetch("/api/fulfillment/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await responsePayload(
        response,
        "No pudimos crear la solicitud."
      );
      setRequest(payload as FulfillmentRequest);
    } catch (reason) {
      diagnostic("create_request", "new-request", reason);
      setError(
        reason instanceof Error
          ? reason.message
          : "No pudimos crear la solicitud."
      );
    } finally {
      setBusy(false);
    }
  }

  if (request) return <FulfillmentRequestCard request={request} />;

  const inputClass =
    "mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-black outline-none focus:border-black";

  return (
    <form onSubmit={submit} className="mt-5 space-y-5">
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-stone-100 p-1">
        <button
          type="button"
          onClick={() => setMethod("shipping")}
          className={`rounded-xl px-3 py-2 text-sm font-semibold ${
            method === "shipping" ? "bg-white shadow-sm" : "text-stone-600"
          }`}
        >
          Envío
        </button>
        <button
          type="button"
          onClick={() => setMethod("pickup")}
          className={`rounded-xl px-3 py-2 text-sm font-semibold ${
            method === "pickup" ? "bg-white shadow-sm" : "text-stone-600"
          }`}
        >
          Recoger
        </button>
      </div>

      <div className="grid gap-3">
        <label className="text-sm">
          Nombre completo
          <input
            required
            className={inputClass}
            value={form.fullName}
            onChange={(event) => update("fullName", event.target.value)}
          />
        </label>
        <label className="text-sm">
          Correo
          <input
            required
            type="email"
            className={inputClass}
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
          />
        </label>
        <label className="text-sm">
          Teléfono
          <input
            required
            className={inputClass}
            value={form.phone}
            onChange={(event) => update("phone", event.target.value)}
          />
        </label>
      </div>

      {method === "pickup" ? (
        <label className="text-sm">
          Sucursal
          <select
            required
            className={inputClass}
            value={form.pickupBranchId}
            onChange={(event) => update("pickupBranchId", event.target.value)}
          >
            <option value="">Seleccionar</option>
            {branches.map((branch) => (
              <option key={branch.branchId} value={branch.branchId}>
                {branch.name} · {branch.city}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm sm:col-span-2">
            Calle
            <input
              required
              className={inputClass}
              value={form.street}
              onChange={(event) => update("street", event.target.value)}
            />
          </label>
          <label className="text-sm">
            Número exterior
            <input
              required
              className={inputClass}
              value={form.exteriorNumber}
              onChange={(event) => update("exteriorNumber", event.target.value)}
            />
          </label>
          <label className="text-sm">
            Interior
            <input
              className={inputClass}
              value={form.interiorNumber}
              onChange={(event) => update("interiorNumber", event.target.value)}
            />
          </label>
          <label className="text-sm sm:col-span-2">
            Colonia
            <input
              required
              className={inputClass}
              value={form.neighborhood}
              onChange={(event) => update("neighborhood", event.target.value)}
            />
          </label>
          <label className="text-sm">
            Código postal
            <input
              required
              className={inputClass}
              value={form.postalCode}
              onChange={(event) => update("postalCode", event.target.value)}
            />
          </label>
          <label className="text-sm">
            Ciudad
            <input
              required
              className={inputClass}
              value={form.city}
              onChange={(event) => update("city", event.target.value)}
            />
          </label>
          <label className="text-sm sm:col-span-2">
            Estado
            <input
              required
              className={inputClass}
              value={form.state}
              onChange={(event) => update("state", event.target.value)}
            />
          </label>
          <label className="text-sm sm:col-span-2">
            Referencias
            <input
              className={inputClass}
              value={form.references}
              onChange={(event) => update("references", event.target.value)}
            />
          </label>
        </div>
      )}

      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <button
        disabled={busy}
        className="w-full rounded-full bg-black px-5 py-3 font-semibold text-white disabled:bg-stone-300"
      >
        {busy
          ? "Validando carrito…"
          : method === "pickup"
            ? "Validar sucursal"
            : "Solicitar cotizaciones"}
      </button>
      <a
        href="/shipping"
        className="block text-center text-sm text-stone-600 underline"
      >
        Consultar solicitudes anteriores
      </a>
    </form>
  );
}
