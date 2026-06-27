"use client";

import { useEffect, useState } from "react";

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
  createdAt: string;
  updatedAt?: string;
  customer: {
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

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatMoney(amount: number) {
  return `$${amount.toLocaleString("es-MX")} MXN`;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adminNotesDrafts, setAdminNotesDrafts] = useState<
    Record<string, string>
  >({});

  async function fetchOrders() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/orders");

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await response.json();

      const detailedOrders: Order[] = await Promise.all(
        data.orders.map(async (order: Order) => {
          try {
            const detailResponse = await fetch(
              `/api/orders/${order.orderNumber}`
            );

            if (!detailResponse.ok) {
              return {
                ...order,
                items: order.items || [],
              };
            }

            const detailData = await detailResponse.json();
            return detailData.order;
          } catch {
            return {
              ...order,
              items: order.items || [],
            };
          }
        })
      );

      setOrders(detailedOrders);

      setAdminNotesDrafts(
        Object.fromEntries(
          detailedOrders.map((order) => [
            order.orderNumber,
            order.adminNotes || "",
          ])
        )
      );
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

  async function updateOrder(
    orderNumber: string,
    updates: {
      status?: OrderStatus;
      paymentStatus?: PaymentStatus;
      adminNotes?: string;
    }
  ) {
    try {
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
              adminNotes: data.order.adminNotes,
              updatedAt: data.order.updatedAt,
            }
            : order
        )
      );

      if (updates.adminNotes !== undefined) {
        alert("Notas guardadas correctamente.");
      }
    } catch (error) {
      console.error(error);
      alert("No pudimos actualizar el pedido.");
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

  const cancelledOrders = orders.filter(
    (order) => order.status === "cancelled"
  ).length;

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;

    const searchableText = [
      order.orderNumber,
      order.customer?.fullName,
      order.customer?.email,
      order.customer?.phone,
      order.customer?.address,
      order.customer?.city,
      order.customer?.state,
      order.customer?.zipCode,
      order.adminNotes,
      ...order.items.map((item) => item.productName),
      ...order.items.map((item) => item.productSlug),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      normalizedSearchTerm === "" ||
      searchableText.includes(normalizedSearchTerm);

    return matchesStatus && matchesSearch;
  });

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
          <p className="text-sm text-gray-600">Cancelados</p>
          <p className="mt-2 text-3xl font-bold">{cancelledOrders}</p>
        </div>
      </div>

      <div className="mt-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Buscar por pedido, cliente, email o producto..."
          className="w-full rounded-full border px-5 py-2 text-sm outline-none focus:border-black md:max-w-sm"
        />

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter("all")}
            className={`rounded-full border px-4 py-2 text-sm ${statusFilter === "all" ? "border-black bg-black text-white" : ""
              }`}
          >
            Todos
          </button>

          <button
            onClick={() => setStatusFilter("pending")}
            className={`rounded-full border px-4 py-2 text-sm ${statusFilter === "pending"
                ? "border-black bg-black text-white"
                : ""
              }`}
          >
            Pendientes
          </button>

          <button
            onClick={() => setStatusFilter("processing")}
            className={`rounded-full border px-4 py-2 text-sm ${statusFilter === "processing"
                ? "border-black bg-black text-white"
                : ""
              }`}
          >
            En proceso
          </button>

          <button
            onClick={() => setStatusFilter("completed")}
            className={`rounded-full border px-4 py-2 text-sm ${statusFilter === "completed"
                ? "border-black bg-black text-white"
                : ""
              }`}
          >
            Completados
          </button>

          <button
            onClick={() => setStatusFilter("cancelled")}
            className={`rounded-full border px-4 py-2 text-sm ${statusFilter === "cancelled"
                ? "border-black bg-black text-white"
                : ""
              }`}
          >
            Cancelados
          </button>
        </div>
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
                  </div>

                  <p className="mt-2 text-sm text-gray-500">
                    Pedido creado el {formatDate(order.createdAt)}
                  </p>
                </div>

                <div className="flex flex-col gap-3 md:items-end">

                  <a
                    href={`/admin/orders/${order.orderNumber}`}
                    className="rounded-full bg-black px-5 py-2 text-center text-sm text-white"
                  >
                    Ver detalle
                  </a>
                  
                  <select
                    value={order.status}

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

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl bg-gray-50 p-5">
                  <h3 className="font-semibold">Cliente</h3>

                  <div className="mt-3 space-y-1 text-sm text-gray-600">
                    <p>{order.customer?.fullName || "Sin nombre"}</p>
                    <p>{order.customer?.email || "Sin email"}</p>
                    <p>{order.customer?.phone || "Sin teléfono"}</p>
                    <p>
                      {[
                        order.customer?.address,
                        order.customer?.city,
                        order.customer?.state,
                        order.customer?.zipCode,
                      ]
                        .filter(Boolean)
                        .join(", ") || "Sin dirección"}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-gray-50 p-5">
                  <h3 className="font-semibold">Totales</h3>

                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{formatMoney(order.subtotal)}</span>
                    </div>

                    <div className="flex justify-between text-gray-600">
                      <span>Envío</span>
                      <span>{formatMoney(order.shipping || 0)}</span>
                    </div>

                    <div className="border-t pt-2">
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span>{formatMoney(order.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold">Productos</h3>

                <div className="mt-3 space-y-3">
                  {order.items.length === 0 ? (
                    <p className="text-sm text-gray-600">
                      Este pedido no tiene productos registrados.
                    </p>
                  ) : (
                    order.items.map((item, index) => (
                      <div
                        key={item.id || `${item.productSlug}-${index}`}
                        className="rounded-2xl border p-4"
                      >
                        <div className="flex flex-col justify-between gap-3 md:flex-row">
                          <div>
                            <p className="font-medium">{item.productName}</p>

                            <p className="mt-1 text-sm text-gray-600">
                              {item.lensOption}
                            </p>

                            <p className="text-sm text-gray-600">
                              {item.prescriptionMethod}
                            </p>

                            <p className="mt-2 text-sm text-gray-500">
                              Cantidad: {item.quantity}
                            </p>
                          </div>

                          <div className="text-sm md:text-right">
                            <p>{formatMoney(item.unitPrice)} c/u</p>
                            <p className="mt-1 font-semibold">
                              {formatMoney(item.lineTotal)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-6 rounded-2xl border p-4 text-sm text-gray-700">
                <p className="font-medium">Notas admin</p>

                <textarea
                  value={adminNotesDrafts[order.orderNumber] || ""}
                  onChange={(event) =>
                    setAdminNotesDrafts((currentDrafts) => ({
                      ...currentDrafts,
                      [order.orderNumber]: event.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="Ejemplo: Cliente pidió confirmar por WhatsApp."
                  className="mt-3 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-black"
                />

                <button
                  onClick={() =>
                    updateOrder(order.orderNumber, {
                      adminNotes: adminNotesDrafts[order.orderNumber] || "",
                    })
                  }
                  className="mt-3 rounded-full bg-black px-4 py-2 text-sm text-white"
                >
                  Guardar notas
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}


