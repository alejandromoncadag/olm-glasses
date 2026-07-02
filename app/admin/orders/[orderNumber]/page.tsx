"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AdminNav from "@/components/AdminNav";

type OrderStatus = "pending" | "processing" | "completed" | "cancelled";
type PaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "refunded";

type OrderItem = {
  id?: string;
  productSlug: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  lensOption: string;
  prescriptionMethod: string;
};

type Order = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  shipping: number;
  total: number;
  currency: string;
  adminNotes?: string | null;
  shippingCarrier?: string | null;
  trackingNumber?: string | null;
  customerVisibleNotes?: string | null;
  createdAt: string;
  updatedAt?: string;
  customer: {
    id: string;
    fullName?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  items: OrderItem[];
};

type OrderUpdate = {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  adminNotes?: string;
  shippingCarrier?: string;
  trackingNumber?: string;
  customerVisibleNotes?: string;
};

function formatMoney(amount: number) {
  return `$${amount.toLocaleString("es-MX")} MXN`;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateTime(date?: string) {
  if (!date) return "Sin actualizar";

  return new Date(date).toLocaleString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusLabel(status: OrderStatus) {
  if (status === "pending") return "Pendiente";
  if (status === "processing") return "En proceso";
  if (status === "completed") return "Completado";
  if (status === "cancelled") return "Cancelado";

  return "Pendiente";
}

function getStatusClassName(status: OrderStatus) {
  if (status === "pending") return "bg-yellow-100 text-yellow-800";
  if (status === "processing") return "bg-blue-100 text-blue-700";
  if (status === "completed") return "bg-green-100 text-green-700";
  if (status === "cancelled") return "bg-red-100 text-red-700";

  return "bg-gray-100 text-gray-700";
}

function getPaymentStatusLabel(status: PaymentStatus) {
  if (status === "unpaid") return "Sin pagar";
  if (status === "pending") return "Pago pendiente";
  if (status === "paid") return "Pagado";
  if (status === "failed") return "Fallido";
  if (status === "refunded") return "Reembolsado";

  return "Sin pagar";
}

function getPaymentStatusClassName(status: PaymentStatus) {
  if (status === "paid") return "bg-green-100 text-green-700";
  if (status === "pending") return "bg-yellow-100 text-yellow-800";
  if (status === "unpaid") return "bg-gray-100 text-gray-700";
  if (status === "failed") return "bg-red-100 text-red-700";
  if (status === "refunded") return "bg-blue-100 text-blue-700";

  return "bg-gray-100 text-gray-700";
}

export default function AdminOrderDetailPage() {
  const params = useParams();

  const orderNumberParam = params.orderNumber;
  const orderNumber = Array.isArray(orderNumberParam)
    ? orderNumberParam[0]
    : orderNumberParam;

  const [order, setOrder] = useState<Order | null>(null);
  const [adminNotesDraft, setAdminNotesDraft] = useState("");
  const [shippingCarrierDraft, setShippingCarrierDraft] = useState("");
  const [trackingNumberDraft, setTrackingNumberDraft] = useState("");
  const [customerVisibleNotesDraft, setCustomerVisibleNotesDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [copied, setCopied] = useState<"order" | "email" | "tracking" | "">("");

  useEffect(() => {
    async function fetchOrder() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/orders/${orderNumber}`);

        if (!response.ok) {
          throw new Error("Failed to fetch order");
        }

        const data = await response.json();

        setOrder(data.order);
        setAdminNotesDraft(data.order.adminNotes || "");
        setShippingCarrierDraft(data.order.shippingCarrier || "");
        setTrackingNumberDraft(data.order.trackingNumber || "");
        setCustomerVisibleNotesDraft(data.order.customerVisibleNotes || "");
      } catch (error) {
        console.error(error);
        setError("No pudimos cargar este pedido desde PostgreSQL.");
      } finally {
        setLoading(false);
      }
    }

    if (orderNumber) {
      fetchOrder();
    }
  }, [orderNumber]);

  async function copyText(value: string | undefined, type: "order" | "email" | "tracking") {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopied(type);

      setTimeout(() => {
        setCopied("");
      }, 2000);
    } catch (error) {
      console.error("Could not copy text:", error);
    }
  }

  async function updateOrder(updates: OrderUpdate, message = "Pedido actualizado.") {
    if (!orderNumber) return;

    try {
      setSaving(true);
      setSuccessMessage("");
      setError("");

      const response = await fetch(`/api/orders/${orderNumber}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "No pudimos actualizar el pedido.");
        return;
      }

      setOrder((currentOrder) =>
        currentOrder
          ? {
              ...currentOrder,
              status: data.order.status,
              paymentStatus: data.order.paymentStatus,
              adminNotes: data.order.adminNotes,
              shippingCarrier: data.order.shippingCarrier,
              trackingNumber: data.order.trackingNumber,
              customerVisibleNotes: data.order.customerVisibleNotes,
              updatedAt: data.order.updatedAt,
            }
          : currentOrder
      );

      setSuccessMessage(message);
    } catch (error) {
      console.error(error);
      setError("No pudimos actualizar el pedido.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white px-6 py-12 text-black">
        <section className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-bold">Detalle del pedido</h1>
          <p className="mt-4 text-gray-600">
            Cargando pedido desde PostgreSQL...
          </p>
        </section>
      </main>
    );
  }

  if (error && !order) {
    return (
      <main className="min-h-screen bg-white px-6 py-12 text-black">
        <section className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-bold">Pedido no encontrado</h1>

          <p className="mt-4 text-red-600">{error}</p>

          <a
            href="/admin/orders"
            className="mt-6 inline-block rounded-full bg-black px-6 py-3 text-white"
          >
            Regresar a pedidos
          </a>
        </section>
      </main>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <main className="min-h-screen bg-white px-6 py-12 text-black">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <a href="/admin/orders" className="text-sm text-gray-500 underline">
              ← Regresar a pedidos
            </a>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <h1 className="text-4xl font-bold">Pedido {order.orderNumber}</h1>

              <button
                type="button"
                onClick={() => copyText(order.orderNumber, "order")}
                className="rounded-full border px-4 py-2 text-sm"
              >
                {copied === "order" ? "Copiado" : "Copiar"}
              </button>
            </div>

            <p className="mt-3 text-gray-600">
              Creado el {formatDate(order.createdAt)}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Última actualización: {formatDateTime(order.updatedAt)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 md:justify-end">
            <span
              className={`rounded-full px-4 py-2 text-sm font-semibold ${getStatusClassName(
                order.status
              )}`}
            >
              {getStatusLabel(order.status)}
            </span>

            <span
              className={`rounded-full px-4 py-2 text-sm font-semibold ${getPaymentStatusClassName(
                order.paymentStatus
              )}`}
            >
              {getPaymentStatusLabel(order.paymentStatus)}
            </span>
          </div>
        </div>

        <AdminNav />

        {successMessage && (
          <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-medium text-green-700">
              {successMessage}
            </p>
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
        )}

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <section className="rounded-2xl border p-5">
            <p className="text-sm text-gray-600">Estado del pedido</p>

            <p className="mt-2 text-xl font-semibold">
              {getStatusLabel(order.status)}
            </p>

            <select
              value={order.status}
              onChange={(event) =>
                updateOrder(
                  {
                    status: event.target.value as OrderStatus,
                  },
                  "Estado del pedido actualizado."
                )
              }
              disabled={saving}
              className="mt-4 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-black"
            >
              <option value="pending">Pendiente</option>
              <option value="processing">En proceso</option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </section>

          <section className="rounded-2xl border p-5">
            <p className="text-sm text-gray-600">Estado del pago</p>

            <p className="mt-2 text-xl font-semibold">
              {getPaymentStatusLabel(order.paymentStatus)}
            </p>

            <select
              value={order.paymentStatus}
              onChange={(event) =>
                updateOrder(
                  {
                    paymentStatus: event.target.value as PaymentStatus,
                  },
                  "Estado del pago actualizado."
                )
              }
              disabled={saving}
              className="mt-4 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-black"
            >
              <option value="unpaid">Sin pagar</option>
              <option value="pending">Pago pendiente</option>
              <option value="paid">Pagado</option>
              <option value="failed">Fallido</option>
              <option value="refunded">Reembolsado</option>
            </select>
          </section>

          <section className="rounded-2xl border p-5">
            <p className="text-sm text-gray-600">Total</p>
            <p className="mt-2 text-3xl font-bold">{formatMoney(order.total)}</p>

            <p className="mt-3 text-sm text-gray-500">
              {order.items.length}{" "}
              {order.items.length === 1 ? "producto" : "productos"}
            </p>
          </section>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-8">
            <section className="rounded-2xl border p-6">
              <h2 className="text-2xl font-semibold">Cliente</h2>

              <div className="mt-5 grid gap-4 text-sm md:grid-cols-2">
                <div>
                  <p className="text-gray-500">Nombre</p>
                  <p className="mt-1 font-medium">
                    {order.customer.fullName || "Sin nombre"}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">Email</p>

                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <p className="font-medium">
                      {order.customer.email || "Sin email"}
                    </p>

                    {order.customer.email && (
                      <button
                        type="button"
                        onClick={() => copyText(order.customer.email, "email")}
                        className="rounded-full border px-3 py-1 text-xs"
                      >
                        {copied === "email" ? "Copiado" : "Copiar"}
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-gray-500">Teléfono</p>
                  <p className="mt-1 font-medium">
                    {order.customer.phone || "Sin teléfono"}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">Ciudad</p>
                  <p className="mt-1 font-medium">
                    {order.customer.city || "Sin ciudad"}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <p className="text-gray-500">Dirección</p>
                  <p className="mt-1 font-medium">
                    {[
                      order.customer.address,
                      order.customer.city,
                      order.customer.state,
                      order.customer.zipCode,
                    ]
                      .filter(Boolean)
                      .join(", ") || "Sin dirección"}
                  </p>
                </div>
              </div>

              <a
                href={`/admin/customers/${order.customer.id}`}
                className="mt-5 inline-block rounded-full bg-black px-5 py-2 text-sm text-white"
              >
                Ver cliente
              </a>
            </section>

            <section className="rounded-2xl border p-6">
              <h2 className="text-2xl font-semibold">Envío y seguimiento</h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium">Paquetería</span>
                  <input
                    value={shippingCarrierDraft}
                    onChange={(event) =>
                      setShippingCarrierDraft(event.target.value)
                    }
                    placeholder="Ejemplo: DHL, FedEx, Estafeta"
                    className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium">Número de rastreo</span>
                  <input
                    value={trackingNumberDraft}
                    onChange={(event) =>
                      setTrackingNumberDraft(event.target.value)
                    }
                    placeholder="Ejemplo: 1234567890"
                    className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                  />
                </label>
              </div>

              {trackingNumberDraft && (
                <button
                  type="button"
                  onClick={() => copyText(trackingNumberDraft, "tracking")}
                  className="mt-3 rounded-full border px-4 py-2 text-sm"
                >
                  {copied === "tracking" ? "Rastreo copiado" : "Copiar rastreo"}
                </button>
              )}

              <label className="mt-5 block">
                <span className="text-sm font-medium">
                  Nota visible para el cliente
                </span>

                <textarea
                  value={customerVisibleNotesDraft}
                  onChange={(event) =>
                    setCustomerVisibleNotesDraft(event.target.value)
                  }
                  rows={4}
                  placeholder="Ejemplo: Tu pedido ya fue enviado. Te compartimos el número de rastreo."
                  className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                />
              </label>

              <button
                type="button"
                onClick={() =>
                  updateOrder(
                    {
                      shippingCarrier: shippingCarrierDraft,
                      trackingNumber: trackingNumberDraft,
                      customerVisibleNotes: customerVisibleNotesDraft,
                    },
                    "Información de envío guardada."
                  )
                }
                disabled={saving}
                className="mt-5 rounded-full bg-black px-6 py-3 text-white disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {saving ? "Guardando..." : "Guardar envío"}
              </button>
            </section>

            <section className="rounded-2xl border p-6">
              <h2 className="text-2xl font-semibold">Productos</h2>

              <div className="mt-5 space-y-4">
                {order.items.map((item, index) => (
                  <div
                    key={item.id || `${item.productSlug}-${index}`}
                    className="rounded-2xl bg-gray-50 p-5"
                  >
                    <div className="flex flex-col justify-between gap-4 md:flex-row">
                      <div>
                        <p className="text-lg font-semibold">
                          {item.productName}
                        </p>

                        <p className="mt-2 text-sm text-gray-600">
                          {item.lensOption}
                        </p>

                        <p className="text-sm text-gray-600">
                          {item.prescriptionMethod}
                        </p>

                        <p className="mt-2 text-sm text-gray-500">
                          Cantidad: {item.quantity}
                        </p>

                        <a
                          href={`/product/${item.productSlug}`}
                          className="mt-3 inline-block text-sm text-gray-500 underline"
                          target="_blank"
                        >
                          Ver producto
                        </a>
                      </div>

                      <div className="md:text-right">
                        <p className="text-sm text-gray-600">
                          {formatMoney(item.unitPrice)} c/u
                        </p>

                        <p className="mt-1 text-lg font-semibold">
                          {formatMoney(item.lineTotal)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border p-6">
              <h2 className="text-2xl font-semibold">Notas admin</h2>

              <p className="mt-2 text-sm text-gray-600">
                Estas notas son internas. El cliente no las ve.
              </p>

              <textarea
                value={adminNotesDraft}
                onChange={(event) => setAdminNotesDraft(event.target.value)}
                rows={5}
                placeholder="Ejemplo: Cliente pidió confirmar por WhatsApp."
                className="mt-4 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
              />

              <button
                type="button"
                onClick={() =>
                  updateOrder(
                    {
                      adminNotes: adminNotesDraft,
                    },
                    "Notas admin guardadas."
                  )
                }
                disabled={saving}
                className="mt-4 rounded-full bg-black px-6 py-3 text-white disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {saving ? "Guardando..." : "Guardar notas"}
              </button>
            </section>
          </div>

          <aside className="h-fit rounded-2xl border p-6">
            <h2 className="text-2xl font-semibold">Resumen</h2>

            <div className="mt-6 space-y-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatMoney(order.subtotal)}</span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>Envío</span>
                <span>
                  {order.shipping ? formatMoney(order.shipping) : "Por confirmar"}
                </span>
              </div>
            </div>

            <div className="mt-6 border-t pt-6">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>{formatMoney(order.total)}</span>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-gray-50 p-5">
              <h3 className="font-semibold">Vista del cliente</h3>

              <p className="mt-3 text-sm text-gray-600">
                El cliente puede consultar este pedido usando su número de
                pedido y email en la página de estado.
              </p>

              <a
                href="/order-status"
                target="_blank"
                className="mt-4 inline-block rounded-full border px-5 py-2 text-sm"
              >
                Abrir estado de pedido
              </a>
            </div>

            <div className="mt-6 rounded-2xl bg-gray-50 p-5">
              <h3 className="font-semibold">Información visible</h3>

              <div className="mt-4 space-y-3 text-sm text-gray-600">
                <p>
                  <span className="font-medium text-black">Paquetería:</span>{" "}
                  {order.shippingCarrier || "Por confirmar"}
                </p>

                <p>
                  <span className="font-medium text-black">Rastreo:</span>{" "}
                  {order.trackingNumber || "Por confirmar"}
                </p>

                <p>
                  <span className="font-medium text-black">Nota:</span>{" "}
                  {order.customerVisibleNotes || "Sin nota visible"}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}


