"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AdminNav from "@/components/AdminNav";

type OrderStatus = "pending" | "processing" | "completed" | "cancelled";
type PaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "refunded";
type PaymentMethod =
  | "stripe"
  | "bank_transfer"
  | "store_payment"
  | "cash_on_delivery";
type DeliveryMethod = "shipping" | "pickup";

type CustomerOrder = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  deliveryMethod?: DeliveryMethod;
  customerNotes?: string | null;
  subtotal: number;
  shipping: number;
  total: number;
  currency: string;
  shippingCarrier?: string | null;
  trackingNumber?: string | null;
  customerVisibleNotes?: string | null;
  createdAt: string;
  updatedAt: string;
};

type Customer = {
  id: string;
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
  createdAt: string;
  updatedAt: string;
  orders: CustomerOrder[];
};

function formatMoney(amount: number) {
  return `$${amount.toLocaleString("es-MX")} MXN`;
}

function formatDate(date: string | null | undefined) {
  if (!date) return "Sin fecha";

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

function getPaymentMethodLabel(method?: PaymentMethod) {
  if (method === "stripe") return "Stripe";
  if (method === "bank_transfer") return "Transferencia bancaria";
  if (method === "store_payment") return "Pago en tienda";
  if (method === "cash_on_delivery") return "Pago contra entrega";

  return "Por confirmar";
}

function getPaymentMethodClassName(method?: PaymentMethod) {
  if (method === "stripe") return "bg-[#efe5de] text-[#3b241c]";
  if (method === "bank_transfer") return "bg-blue-100 text-blue-700";
  if (method === "store_payment") return "bg-purple-100 text-purple-700";
  if (method === "cash_on_delivery") return "bg-orange-100 text-orange-700";

  return "bg-gray-100 text-gray-700";
}

function getDeliveryMethodLabel(method?: DeliveryMethod) {
  if (method === "shipping") return "Envío a domicilio";
  if (method === "pickup") return "Recoger en tienda";

  return "Por confirmar";
}

function getDeliveryMethodClassName(method?: DeliveryMethod) {
  if (method === "shipping") return "bg-blue-100 text-blue-700";
  if (method === "pickup") return "bg-green-100 text-green-700";

  return "bg-gray-100 text-gray-700";
}

function getCustomerName(customer: Customer) {
  return customer.fullName || "Sin nombre";
}

function getCustomerAddress(customer: Customer) {
  return (
    [customer.address, customer.city, customer.state, customer.zipCode]
      .filter(Boolean)
      .join(", ") || "Sin dirección"
  );
}

function getOrderCustomerNotes(order: CustomerOrder) {
  return String(order.customerNotes || "").trim();
}

function getShippingLabel(order: CustomerOrder) {
  if (order.deliveryMethod === "pickup") {
    return "Sin costo · recoger en tienda";
  }

  return order.shipping ? formatMoney(order.shipping) : "Por confirmar";
}

function getCarrierLabel(order: CustomerOrder) {
  if (order.deliveryMethod === "pickup") {
    return "No aplica";
  }

  return order.shippingCarrier || "Por confirmar";
}

function getTrackingLabel(order: CustomerOrder) {
  if (order.deliveryMethod === "pickup") {
    return "No aplica";
  }

  return order.trackingNumber || "Por confirmar";
}

export default function AdminCustomerDetailPage() {
  const params = useParams();

  const customerIdParam = params.customerId;
  const customerId = Array.isArray(customerIdParam)
    ? customerIdParam[0]
    : customerIdParam;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchCustomer() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/customers/${customerId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch customer");
      }

      const data = await response.json();
      setCustomer(data.customer);
    } catch (error) {
      console.error(error);
      setError("No pudimos cargar este cliente desde PostgreSQL.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!customerId) return;

    const timeoutId = window.setTimeout(() => {
      void fetchCustomer();
    }, 0);

    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-white px-6 py-12 text-black">
        <section className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-bold">Detalle del cliente</h1>

          <p className="mt-4 text-gray-600">
            Cargando cliente desde PostgreSQL...
          </p>
        </section>
      </main>
    );
  }

  if (error || !customer) {
    return (
      <main className="min-h-screen bg-white px-6 py-12 text-black">
        <section className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-bold">Cliente no encontrado</h1>

          <p className="mt-4 text-red-600">{error}</p>

          <Link
            href="/admin/customers"
            className="mt-6 inline-block rounded-full bg-black px-6 py-3 text-white"
          >
            Regresar a clientes
          </Link>
        </section>
      </main>
    );
  }

  const validOrders = customer.orders.filter(
    (order) => order.status !== "cancelled"
  );

  const totalSpent = validOrders.reduce((sum, order) => sum + order.total, 0);

  const paidOrders = validOrders.filter(
    (order) => order.paymentStatus === "paid"
  );

  const paidTotal = paidOrders.reduce((sum, order) => sum + order.total, 0);

  const pendingOrders = customer.orders.filter(
    (order) => order.status === "pending"
  ).length;

  const pickupOrders = customer.orders.filter(
    (order) => order.deliveryMethod === "pickup"
  ).length;

  const ordersWithNotes = customer.orders.filter((order) =>
    getOrderCustomerNotes(order)
  ).length;

  return (
    <main className="min-h-screen bg-white px-6 py-12 text-black">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <Link href="/admin/customers" className="text-sm text-gray-500 underline">
              ← Regresar a clientes
            </Link>

            <h1 className="mt-4 text-4xl font-bold">
              {getCustomerName(customer)}
            </h1>

            <p className="mt-4 text-gray-600">
              Cliente desde {formatDate(customer.createdAt)}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href={`mailto:${customer.email || ""}`}
              className="rounded-full border px-6 py-3 text-center"
            >
              Enviar email
            </a>

            <Link
              href="/admin/customers"
              className="rounded-full bg-black px-6 py-3 text-center text-white"
            >
              Clientes
            </Link>
          </div>
        </div>

        <AdminNav />

        <div className="mt-10 grid gap-4 md:grid-cols-5">
          <div className="rounded-2xl border p-5">
            <p className="text-sm text-gray-600">Pedidos totales</p>
            <p className="mt-2 text-3xl font-bold">{customer.orders.length}</p>
            <p className="mt-2 text-xs text-gray-500">
              {pendingOrders} pendientes
            </p>
          </div>

          <div className="rounded-2xl border p-5">
            <p className="text-sm text-gray-600">Total gastado</p>
            <p className="mt-2 text-3xl font-bold">{formatMoney(totalSpent)}</p>
            <p className="mt-2 text-xs text-gray-500">
              No incluye pedidos cancelados
            </p>
          </div>

          <div className="rounded-2xl border p-5">
            <p className="text-sm text-gray-600">Pagado</p>
            <p className="mt-2 text-3xl font-bold">{formatMoney(paidTotal)}</p>
            <p className="mt-2 text-xs text-gray-500">
              {paidOrders.length} pedidos pagados
            </p>
          </div>

          <div className="rounded-2xl border p-5">
            <p className="text-sm text-gray-600">Recogen tienda</p>
            <p className="mt-2 text-3xl font-bold">{pickupOrders}</p>
            <p className="mt-2 text-xs text-gray-500">
              Pedidos con pickup
            </p>
          </div>

          <div className="rounded-2xl border p-5">
            <p className="text-sm text-gray-600">Con nota</p>
            <p className="mt-2 text-3xl font-bold">{ordersWithNotes}</p>
            <p className="mt-2 text-xs text-gray-500">
              Notas de checkout
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <section className="rounded-2xl border p-6">
              <h2 className="text-2xl font-semibold">Información del cliente</h2>

              <div className="mt-5 grid gap-5 text-sm md:grid-cols-2">
                <div>
                  <p className="text-gray-500">Nombre</p>
                  <p className="mt-1 font-medium">
                    {customer.fullName || "Sin nombre"}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="mt-1 font-medium">
                    {customer.email || "Sin email"}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">Teléfono</p>
                  <p className="mt-1 font-medium">
                    {customer.phone || "Sin teléfono"}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">País</p>
                  <p className="mt-1 font-medium">
                    {customer.country || "México"}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <p className="text-gray-500">Dirección guardada</p>
                  <p className="mt-1 font-medium">
                    {getCustomerAddress(customer)}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border p-6">
              <h2 className="text-2xl font-semibold">Historial de pedidos</h2>

              {customer.orders.length === 0 ? (
                <div className="mt-5 rounded-2xl bg-gray-50 p-5">
                  <p className="text-gray-600">
                    Este cliente todavía no tiene pedidos.
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  {customer.orders.map((order) => {
                    const customerNotes = getOrderCustomerNotes(order);

                    return (
                      <article
                        key={order.id}
                        className="rounded-2xl bg-gray-50 p-5"
                      >
                        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <a
                                href={`/admin/orders/${order.orderNumber}`}
                                className="text-lg font-semibold underline"
                              >
                                {order.orderNumber}
                              </a>

                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClassName(
                                  order.status
                                )}`}
                              >
                                {getStatusLabel(order.status)}
                              </span>

                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${getPaymentStatusClassName(
                                  order.paymentStatus
                                )}`}
                              >
                                {getPaymentStatusLabel(order.paymentStatus)}
                              </span>

                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${getPaymentMethodClassName(
                                  order.paymentMethod
                                )}`}
                              >
                                {getPaymentMethodLabel(order.paymentMethod)}
                              </span>

                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${getDeliveryMethodClassName(
                                  order.deliveryMethod
                                )}`}
                              >
                                {getDeliveryMethodLabel(order.deliveryMethod)}
                              </span>
                            </div>

                            <p className="mt-2 text-sm text-gray-600">
                              {formatDate(order.createdAt)}
                            </p>

                            <div className="mt-4 grid gap-3 text-sm text-gray-600 md:grid-cols-3">
                              <div>
                                <p className="text-gray-500">Pago</p>
                                <p className="font-medium text-black">
                                  {getPaymentStatusLabel(order.paymentStatus)}
                                </p>
                                <p>{getPaymentMethodLabel(order.paymentMethod)}</p>
                              </div>

                              <div>
                                <p className="text-gray-500">Entrega</p>
                                <p className="font-medium text-black">
                                  {getDeliveryMethodLabel(order.deliveryMethod)}
                                </p>
                                <p>{getShippingLabel(order)}</p>
                              </div>

                              <div>
                                <p className="text-gray-500">Rastreo</p>
                                <p className="font-medium text-black">
                                  {getCarrierLabel(order)}
                                </p>
                                <p>{getTrackingLabel(order)}</p>
                              </div>
                            </div>

                            {customerNotes && (
                              <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">
                                <p className="font-medium text-blue-950">
                                  Nota del cliente:
                                </p>
                                <p className="mt-1">{customerNotes}</p>
                              </div>
                            )}

                            {order.customerVisibleNotes && (
                              <div className="mt-3 rounded-xl bg-white p-3 text-sm text-gray-700">
                                <p className="font-medium text-black">
                                  Nota visible:
                                </p>
                                <p className="mt-1">
                                  {order.customerVisibleNotes}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="md:text-right">
                            <p className="text-xl font-bold">
                              {formatMoney(order.total)}
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                              Envío: {getShippingLabel(order)}
                            </p>

                            <a
                              href={`/admin/orders/${order.orderNumber}`}
                              className="mt-4 inline-block rounded-full bg-black px-4 py-2 text-sm text-white"
                            >
                              Ver pedido
                            </a>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border p-6">
              <h2 className="text-2xl font-semibold">Contacto rápido</h2>

              <div className="mt-5 space-y-4 text-sm">
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="mt-1 font-medium">
                    {customer.email || "Sin email"}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">Teléfono</p>
                  <p className="mt-1 font-medium">
                    {customer.phone || "Sin teléfono"}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <a
                  href={`mailto:${customer.email || ""}`}
                  className="rounded-full bg-black px-5 py-3 text-center text-white"
                >
                  Enviar email
                </a>

                <Link
                  href="/admin/orders"
                  className="rounded-full border px-5 py-3 text-center"
                >
                  Ver pedidos
                </Link>
              </div>
            </section>

            <section className="rounded-2xl border p-6">
              <h2 className="text-2xl font-semibold">Resumen</h2>

              <div className="mt-5 space-y-4">
                <div className="flex justify-between">
                  <span>Pedidos activos</span>
                  <span className="font-semibold">{validOrders.length}</span>
                </div>

                <div className="flex justify-between">
                  <span>Pedidos cancelados</span>
                  <span className="font-semibold">
                    {customer.orders.length - validOrders.length}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Recogen tienda</span>
                  <span className="font-semibold">{pickupOrders}</span>
                </div>

                <div className="flex justify-between">
                  <span>Pedidos con nota</span>
                  <span className="font-semibold">{ordersWithNotes}</span>
                </div>

                <div className="flex justify-between">
                  <span>Total gastado</span>
                  <span className="font-semibold">{formatMoney(totalSpent)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Total pagado</span>
                  <span className="font-semibold">{formatMoney(paidTotal)}</span>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}

