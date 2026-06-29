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

function getStatusLabel(status: OrderStatus) {
  if (status === "pending") return "Pendiente";
  if (status === "processing") return "En proceso";
  if (status === "completed") return "Completado";
  if (status === "cancelled") return "Cancelado";

  return "Pendiente";
}

function getPaymentStatusLabel(status: PaymentStatus) {
  if (status === "unpaid") return "Sin pagar";
  if (status === "pending") return "Pago pendiente";
  if (status === "paid") return "Pagado";
  if (status === "failed") return "Fallido";
  if (status === "refunded") return "Reembolsado";

  return "Sin pagar";
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

  useEffect(() => {
    if (orderNumber) {
      fetchOrder();
    }
  }, [orderNumber]);

  async function updateOrder(updates: OrderUpdate) {
    if (!orderNumber) return;

    try {
      setSaving(true);

      const response = await fetch(`/api/orders/${orderNumber}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "No pudimos actualizar el pedido.");
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

      alert("Pedido actualizado correctamente.");
    } catch (error) {
      console.error(error);
      alert("No pudimos actualizar el pedido.");
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

  if (error || !order) {
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

  return (
    <main className="min-h-screen bg-white px-6 py-12 text-black">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <h1 className="text-4xl font-bold">Pedido {order.orderNumber}</h1>

            <p className="mt-4 text-gray-600">
              Creado el {formatDate(order.createdAt)}
            </p>
          </div>

          <a
            href="/admin/orders"
            className="rounded-full border px-6 py-3 text-center"
          >
            Regresar a pedidos
          </a>
        </div>

        <AdminNav />

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border p-5">
            <p className="text-sm text-gray-600">Estado del pedido</p>

            <p className="mt-2 text-xl font-semibold">
              {getStatusLabel(order.status)}
            </p>

            <select
              value={order.status}
              onChange={(event) =>
                updateOrder({
                  status: event.target.value as OrderStatus,
                })
              }
              disabled={saving}
              className="mt-4 w-full rounded-xl border px-3 py-2 text-sm"
            >
              <option value="pending">Pendiente</option>
              <option value="processing">En proceso</option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>

          <div className="rounded-2xl border p-5">
            <p className="text-sm text-gray-600">Estado del pago</p>

            <p className="mt-2 text-xl font-semibold">
              {getPaymentStatusLabel(order.paymentStatus)}
            </p>

            <select
              value={order.paymentStatus}
              onChange={(event) =>
                updateOrder({
                  paymentStatus: event.target.value as PaymentStatus,
                })
              }
              disabled={saving}
              className="mt-4 w-full rounded-xl border px-3 py-2 text-sm"
            >
              <option value="unpaid">Sin pagar</option>
              <option value="pending">Pago pendiente</option>
              <option value="paid">Pagado</option>
              <option value="failed">Fallido</option>
              <option value="refunded">Reembolsado</option>
            </select>
          </div>

          <div className="rounded-2xl border p-5">
            <p className="text-sm text-gray-600">Total</p>
            <p className="mt-2 text-3xl font-bold">{formatMoney(order.total)}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border p-6">
            <h2 className="text-2xl font-semibold">Cliente</h2>

            <div className="mt-4 space-y-2 text-gray-700">
              <p>{order.customer.fullName || "Sin nombre"}</p>
              <p>{order.customer.email || "Sin email"}</p>
              <p>{order.customer.phone || "Sin teléfono"}</p>
              <p>
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

            <a
              href={`/admin/customers/${order.customer.id}`}
              className="mt-4 inline-block rounded-full bg-black px-5 py-2 text-sm text-white"
            >
              Ver cliente
            </a>
          </div>

          <div className="rounded-2xl border p-6">
            <h2 className="text-2xl font-semibold">Resumen</h2>

            <div className="mt-4 space-y-3">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatMoney(order.subtotal)}</span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>Envío</span>
                <span>{formatMoney(order.shipping || 0)}</span>
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>{formatMoney(order.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border p-6">
          <h2 className="text-2xl font-semibold">Envío y seguimiento</h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium">Paquetería</span>
              <input
                value={shippingCarrierDraft}
                onChange={(event) => setShippingCarrierDraft(event.target.value)}
                placeholder="Ejemplo: DHL, FedEx, Estafeta"
                className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium">Número de rastreo</span>
              <input
                value={trackingNumberDraft}
                onChange={(event) => setTrackingNumberDraft(event.target.value)}
                placeholder="Ejemplo: 1234567890"
                className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
              />
            </label>
          </div>

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
            onClick={() =>
              updateOrder({
                shippingCarrier: shippingCarrierDraft,
                trackingNumber: trackingNumberDraft,
                customerVisibleNotes: customerVisibleNotesDraft,
              })
            }
            disabled={saving}
            className="mt-5 rounded-full bg-black px-6 py-3 text-white disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {saving ? "Guardando..." : "Guardar envío"}
          </button>
        </div>

        <div className="mt-8 rounded-2xl border p-6">
          <h2 className="text-2xl font-semibold">Productos</h2>

          <div className="mt-5 space-y-4">
            {order.items.map((item, index) => (
              <div
                key={item.id || `${item.productSlug}-${index}`}
                className="rounded-2xl border p-5"
              >
                <div className="flex flex-col justify-between gap-4 md:flex-row">
                  <div>
                    <p className="text-lg font-semibold">{item.productName}</p>

                    <p className="mt-2 text-sm text-gray-600">
                      {item.lensOption}
                    </p>

                    <p className="text-sm text-gray-600">
                      {item.prescriptionMethod}
                    </p>

                    <p className="mt-2 text-sm text-gray-500">
                      Cantidad: {item.quantity}
                    </p>
                  </div>

                  <div className="md:text-right">
                    <p>{formatMoney(item.unitPrice)} c/u</p>
                    <p className="mt-1 font-semibold">
                      {formatMoney(item.lineTotal)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-2xl border p-6">
          <h2 className="text-2xl font-semibold">Notas admin</h2>

          <textarea
            value={adminNotesDraft}
            onChange={(event) => setAdminNotesDraft(event.target.value)}
            rows={5}
            placeholder="Ejemplo: Cliente pidió confirmar por WhatsApp."
            className="mt-4 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
          />

          <button
            onClick={() =>
              updateOrder({
                adminNotes: adminNotesDraft,
              })
            }
            disabled={saving}
            className="mt-4 rounded-full bg-black px-6 py-3 text-white disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {saving ? "Guardando..." : "Guardar notas"}
          </button>
        </div>
      </section>
    </main>
  );
}


