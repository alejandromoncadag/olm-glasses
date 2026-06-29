"use client";

import { useEffect, useState } from "react";
import { downloadCsv } from "@/lib/csv";

type OrderStatus = "pending" | "processing" | "completed" | "cancelled";
type PaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "refunded";

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
    fullName?: string;
    email?: string;
    phone?: string;
  };
};

type OrderUpdate = {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
};

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
  if (status === "unpaid") return "bg-gray-100 text-gray-700";
  if (status === "pending") return "bg-yellow-100 text-yellow-800";
  if (status === "paid") return "bg-green-100 text-green-700";
  if (status === "failed") return "bg-red-100 text-red-700";
  if (status === "refunded") return "bg-purple-100 text-purple-700";

  return "bg-gray-100 text-gray-700";
}

function getShippingClassName(order: Order) {
  if (order.shippingCarrier && order.trackingNumber) {
    return "bg-green-100 text-green-700";
  }

  if (order.status === "cancelled") {
    return "bg-gray-100 text-gray-700";
  }

  return "bg-orange-100 text-orange-700";
}

function getShippingLabel(order: Order) {
  if (order.shippingCarrier && order.trackingNumber) {
    return `${order.shippingCarrier} · ${order.trackingNumber}`;
  }

  if (order.shippingCarrier) {
    return `${order.shippingCarrier} · Falta rastreo`;
  }

  if (order.trackingNumber) {
    return `Rastreo: ${order.trackingNumber}`;
  }

  if (order.status === "cancelled") {
    return "Cancelado";
  }

  return "Falta envío";
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(amount: number) {
  return `$${amount.toLocaleString("es-MX")} MXN`;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [shippingFilter, setShippingFilter] = useState<
    "all" | "withTracking" | "missingTracking"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingOrderNumber, setSavingOrderNumber] = useState("");
  const [error, setError] = useState("");

  async function fetchOrders() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/orders");

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error(error);
      setError("No pudimos cargar los pedidos desde PostgreSQL.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
  }, []);

  async function updateOrder(orderNumber: string, updates: OrderUpdate) {
    try {
      setSavingOrderNumber(orderNumber);

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

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.orderNumber === orderNumber
            ? {
                ...order,
                status: data.order.status,
                paymentStatus: data.order.paymentStatus,
                updatedAt: data.order.updatedAt,
              }
            : order
        )
      );
    } catch (error) {
      console.error(error);
      alert("No pudimos actualizar el pedido.");
    } finally {
      setSavingOrderNumber("");
    }
  }

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(
    (order) => order.status === "pending"
  ).length;
  const processingOrders = orders.filter(
    (order) => order.status === "processing"
  ).length;
  const completedOrders = orders.filter(
    (order) => order.status === "completed"
  ).length;
  const missingTrackingOrders = orders.filter(
    (order) =>
      order.status !== "cancelled" &&
      (!order.shippingCarrier || !order.trackingNumber)
  ).length;

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;

    const hasTracking = Boolean(order.shippingCarrier && order.trackingNumber);

    const matchesShipping =
      shippingFilter === "all" ||
      (shippingFilter === "withTracking" && hasTracking) ||
      (shippingFilter === "missingTracking" &&
        order.status !== "cancelled" &&
        !hasTracking);

    const searchableText = [
      order.orderNumber,
      order.customer?.fullName,
      order.customer?.email,
      order.customer?.phone,
      order.status,
      order.paymentStatus,
      order.shippingCarrier,
      order.trackingNumber,
      order.customerVisibleNotes,
      order.adminNotes,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      normalizedSearchTerm === "" ||
      searchableText.includes(normalizedSearchTerm);

    return matchesStatus && matchesShipping && matchesSearch;
  });

  function exportOrdersCsv() {
    const rows = [
      [
        "Order Number",
        "Customer Name",
        "Customer Email",
        "Customer Phone",
        "Status",
        "Payment Status",
        "Shipping Carrier",
        "Tracking Number",
        "Customer Visible Notes",
        "Subtotal",
        "Shipping",
        "Total",
        "Currency",
        "Created At",
      ],
      ...filteredOrders.map((order) => [
        order.orderNumber,
        order.customer?.fullName || "",
        order.customer?.email || "",
        order.customer?.phone || "",
        getStatusLabel(order.status),
        getPaymentStatusLabel(order.paymentStatus),
        order.shippingCarrier || "",
        order.trackingNumber || "",
        order.customerVisibleNotes || "",
        order.subtotal,
        order.shipping || 0,
        order.total,
        order.currency,
        formatDateTime(order.createdAt),
      ]),
    ];

    downloadCsv("olm-orders.csv", rows);
  }

  if (loading) {
    return (
      <div className="rounded-2xl border p-8 text-center">
        <h2 className="text-2xl font-semibold">Cargando pedidos...</h2>

        <p className="mt-3 text-gray-600">
          Estamos leyendo los pedidos desde PostgreSQL.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border p-8 text-center">
        <h2 className="text-2xl font-semibold">No pudimos cargar pedidos</h2>

        <p className="mt-3 text-red-600">{error}</p>

        <button
          onClick={fetchOrders}
          className="mt-6 rounded-full bg-black px-6 py-3 text-white"
        >
          Intentar de nuevo
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-5">
        <div className="rounded-2xl border p-5">
          <p className="text-sm text-gray-600">Pedidos totales</p>
          <p className="mt-2 text-3xl font-bold">{totalOrders}</p>
        </div>

        <div className="rounded-2xl border p-5">
          <p className="text-sm text-gray-600">Pendientes</p>
          <p className="mt-2 text-3xl font-bold">{pendingOrders}</p>
        </div>

        <div className="rounded-2xl border p-5">
          <p className="text-sm text-gray-600">En proceso</p>
          <p className="mt-2 text-3xl font-bold">{processingOrders}</p>
        </div>

        <div className="rounded-2xl border p-5">
          <p className="text-sm text-gray-600">Completados</p>
          <p className="mt-2 text-3xl font-bold">{completedOrders}</p>
        </div>

        <div className="rounded-2xl border p-5">
          <p className="text-sm text-gray-600">Falta rastreo</p>
          <p className="mt-2 text-3xl font-bold">{missingTrackingOrders}</p>
        </div>
      </div>

      <div className="mt-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Buscar por pedido, cliente, email, rastreo..."
          className="w-full rounded-full border px-5 py-2 text-sm outline-none focus:border-black md:max-w-sm"
        />

        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportOrdersCsv}
            className="rounded-full bg-black px-4 py-2 text-sm text-white"
          >
            Descargar CSV
          </button>

          <button
            onClick={() => setStatusFilter("all")}
            className={`rounded-full border px-4 py-2 text-sm ${
              statusFilter === "all" ? "border-black bg-black text-white" : ""
            }`}
          >
            Todos
          </button>

          <button
            onClick={() => setStatusFilter("pending")}
            className={`rounded-full border px-4 py-2 text-sm ${
              statusFilter === "pending"
                ? "border-black bg-black text-white"
                : ""
            }`}
          >
            Pendientes
          </button>

          <button
            onClick={() => setStatusFilter("processing")}
            className={`rounded-full border px-4 py-2 text-sm ${
              statusFilter === "processing"
                ? "border-black bg-black text-white"
                : ""
            }`}
          >
            En proceso
          </button>

          <button
            onClick={() => setStatusFilter("completed")}
            className={`rounded-full border px-4 py-2 text-sm ${
              statusFilter === "completed"
                ? "border-black bg-black text-white"
                : ""
            }`}
          >
            Completados
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => setShippingFilter("all")}
          className={`rounded-full border px-4 py-2 text-sm ${
            shippingFilter === "all" ? "border-black bg-black text-white" : ""
          }`}
        >
          Todos los envíos
        </button>

        <button
          onClick={() => setShippingFilter("missingTracking")}
          className={`rounded-full border px-4 py-2 text-sm ${
            shippingFilter === "missingTracking"
              ? "border-black bg-black text-white"
              : ""
          }`}
        >
          Falta rastreo
        </button>

        <button
          onClick={() => setShippingFilter("withTracking")}
          className={`rounded-full border px-4 py-2 text-sm ${
            shippingFilter === "withTracking"
              ? "border-black bg-black text-white"
              : ""
          }`}
        >
          Con rastreo
        </button>
      </div>

      <p className="mt-4 text-sm text-gray-600">
        Mostrando {filteredOrders.length} de {orders.length} pedidos
      </p>

      {filteredOrders.length === 0 ? (
        <div className="mt-10 rounded-2xl border p-8 text-center">
          <h2 className="text-2xl font-semibold">No encontramos pedidos</h2>

          <p className="mt-3 text-gray-600">
            Intenta cambiar el filtro o buscar con otro texto.
          </p>
        </div>
      ) : (
        <div className="mt-10 space-y-6">
          {filteredOrders.map((order) => (
            <article key={order.orderNumber} className="rounded-2xl border p-6">
              <div className="flex flex-col justify-between gap-4 md:flex-row">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-semibold">
                      {order.orderNumber}
                    </h2>

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
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getShippingClassName(
                        order
                      )}`}
                    >
                      {getShippingLabel(order)}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-gray-500">
                    Pedido creado el {formatDate(order.createdAt)}
                  </p>

                  <div className="mt-4 grid gap-3 text-sm text-gray-700 md:grid-cols-3">
                    <div>
                      <p className="text-gray-500">Cliente</p>
                      <p className="font-medium">
                        {order.customer?.fullName || "Sin nombre"}
                      </p>
                      <p>{order.customer?.email || "Sin email"}</p>
                    </div>

                    <div>
                      <p className="text-gray-500">Envío</p>
                      <p className="font-medium">
                        {order.shippingCarrier || "Sin paquetería"}
                      </p>
                      <p>{order.trackingNumber || "Sin rastreo"}</p>
                    </div>

                    <div>
                      <p className="text-gray-500">Total</p>
                      <p className="font-semibold">{formatMoney(order.total)}</p>
                    </div>
                  </div>

                  {order.customerVisibleNotes && (
                    <div className="mt-4 rounded-xl bg-gray-50 p-3 text-sm text-gray-700">
                      <p className="font-medium text-black">
                        Nota visible para cliente:
                      </p>
                      <p className="mt-1">{order.customerVisibleNotes}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 md:min-w-48 md:items-end">
                  <a
                    href={`/admin/orders/${order.orderNumber}`}
                    className="rounded-full bg-black px-5 py-2 text-center text-sm text-white"
                  >
                    Ver detalle
                  </a>

                  <select
                    value={order.status}
                    disabled={savingOrderNumber === order.orderNumber}
                    onChange={(event) =>
                      updateOrder(order.orderNumber, {
                        status: event.target.value as OrderStatus,
                      })
                    }
                    className="rounded-xl border px-3 py-2 text-sm"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="processing">En proceso</option>
                    <option value="completed">Completado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>

                  <select
                    value={order.paymentStatus}
                    disabled={savingOrderNumber === order.orderNumber}
                    onChange={(event) =>
                      updateOrder(order.orderNumber, {
                        paymentStatus: event.target.value as PaymentStatus,
                      })
                    }
                    className="rounded-xl border px-3 py-2 text-sm"
                  >
                    <option value="unpaid">Sin pagar</option>
                    <option value="pending">Pago pendiente</option>
                    <option value="paid">Pagado</option>
                    <option value="failed">Fallido</option>
                    <option value="refunded">Reembolsado</option>
                  </select>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}




