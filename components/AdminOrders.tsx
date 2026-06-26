"use client";

import { useEffect, useState } from "react";

type OrderStatus = "pending" | "processing" | "completed" | "cancelled";
type PaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "refunded";

type OrderItem = {
  id: string;
  productName: string;
  productSlug: string;
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
    fullName: string;
    email: string;
    phone: string;
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

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
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

      const detailedOrders: Order[] = await Promise.all(
        data.orders.map(async (order: Order) => {
          const detailResponse = await fetch(`/api/orders/${order.orderNumber}`);

          if (!detailResponse.ok) {
            return {
              ...order,
              items: [],
            };
          }

          const detailData = await detailResponse.json();
          return detailData.order;
        })
      );

      setOrders(detailedOrders);
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

  async function updateOrderStatus(orderNumber: string, status: OrderStatus) {
    try {
      const response = await fetch(`/api/orders/${orderNumber}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update order");
      }

      const data = await response.json();

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
    } catch (error) {
      console.error(error);
      alert("No pudimos actualizar el estado del pedido.");
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
      order.customer.fullName,
      order.customer.email,
      order.customer.phone,
      order.customer.address,
      order.customer.city,
      order.customer.state,
      order.customer.zipCode,
      order.items.map((item) => item.productName).join(" "),
    ]
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
        <h2 className="text-2xl font-semibold">Error al cargar pedidos</h2>

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

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border p-8 text-center">
        <h2 className="text-2xl font-semibold">No hay pedidos todavía</h2>

        <p className="mt-3 text-gray-600">
          Cuando se cree un pedido en PostgreSQL, aparecerá aquí.
        </p>

        <a
          href="/eyeglasses"
          className="mt-6 inline-block rounded-full bg-black px-6 py-3 text-white"
        >
          Crear pedido de prueba
        </a>
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
          placeholder="Buscar pedido, cliente, email o producto..."
          className="w-full rounded-full border px-5 py-2 text-sm outline-none focus:border-black md:max-w-sm"
        />

        <div className="flex flex-wrap gap-2">
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

          <button
            onClick={() => setStatusFilter("cancelled")}
            className={`rounded-full border px-4 py-2 text-sm ${
              statusFilter === "cancelled"
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
        <div className="mt-8 rounded-2xl border p-8 text-center">
          <h2 className="text-2xl font-semibold">No encontramos pedidos</h2>

          <p className="mt-3 text-gray-600">
            Intenta cambiar el filtro o buscar con otro texto.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {filteredOrders.map((order) => (
            <div key={order.orderNumber} className="rounded-2xl border p-6">
              <div className="flex flex-col justify-between gap-4 border-b pb-5 md:flex-row">
                <div>
                  <p className="text-sm text-gray-500">Pedido</p>

                  <h2 className="mt-1 text-2xl font-semibold">
                    {order.orderNumber}
                  </h2>

                  <p className="mt-2 text-sm text-gray-600">
                    {formatDate(order.createdAt)}
                  </p>

                  <p className="mt-2 text-sm text-gray-600">
                    Pago: {getPaymentStatusLabel(order.paymentStatus)}
                  </p>
                </div>

                <div className="flex flex-col gap-3 md:items-end">
                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${getStatusClassName(
                      order.status
                    )}`}
                  >
                    {getStatusLabel(order.status)}
                  </span>

                  <select
                    value={order.status}
                    onChange={(event) =>
                      updateOrderStatus(
                        order.orderNumber,
                        event.target.value as OrderStatus
                      )
                    }
                    className="rounded-xl border px-3 py-2 text-sm"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="processing">En proceso</option>
                    <option value="completed">Completado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div>
                  <h3 className="font-semibold">Cliente</h3>

                  <div className="mt-3 rounded-2xl bg-gray-50 p-4 text-sm text-gray-700">
                    <p>
                      <span className="font-medium">Nombre:</span>{" "}
                      {order.customer.fullName || "Sin nombre"}
                    </p>

                    <p className="mt-2">
                      <span className="font-medium">Email:</span>{" "}
                      {order.customer.email || "Sin email"}
                    </p>

                    <p className="mt-2">
                      <span className="font-medium">Teléfono:</span>{" "}
                      {order.customer.phone || "Sin teléfono"}
                    </p>

                    <p className="mt-2">
                      <span className="font-medium">Dirección:</span>{" "}
                      {order.customer.address || "Sin dirección"}
                    </p>

                    <p className="mt-2">
                      <span className="font-medium">Ciudad:</span>{" "}
                      {order.customer.city || "Sin ciudad"},{" "}
                      {order.customer.state || "Sin estado"}{" "}
                      {order.customer.zipCode || ""}
                    </p>
                  </div>

                  {order.adminNotes && (
                    <div className="mt-4 rounded-2xl border p-4 text-sm text-gray-700">
                      <p className="font-medium">Notas admin</p>
                      <p className="mt-2">{order.adminNotes}</p>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold">Productos</h3>

                  <div className="mt-3 space-y-3">
                    {order.items.length === 0 ? (
                      <div className="rounded-2xl border p-4 text-sm text-gray-600">
                        No hay productos cargados para este pedido.
                      </div>
                    ) : (
                      order.items.map((item) => (
                        <div key={item.id} className="rounded-2xl border p-4">
                          <div className="flex justify-between gap-4">
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

                            <p className="font-semibold">
                              ${item.lineTotal.toLocaleString("es-MX")} MXN
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-5 rounded-2xl bg-gray-50 p-4">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>${order.subtotal.toLocaleString("es-MX")} MXN</span>
                    </div>

                    <div className="mt-3 flex justify-between text-gray-600">
                      <span>Envío</span>
                      <span>${order.shipping.toLocaleString("es-MX")} MXN</span>
                    </div>

                    <div className="mt-3 flex justify-between font-semibold">
                      <span>Total</span>
                      <span>${order.total.toLocaleString("es-MX")} MXN</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

