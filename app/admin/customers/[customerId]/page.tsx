"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AdminNav from "@/components/AdminNav";

type OrderStatus = "pending" | "processing" | "completed" | "cancelled";
type PaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "refunded";

type CustomerOrder = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  shipping: number;
  total: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
};

type Customer = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  createdAt: string;
  updatedAt: string;
  orders: CustomerOrder[];
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
    if (customerId) {
      fetchCustomer();
    }
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

          <a
            href="/admin/customers"
            className="mt-6 inline-block rounded-full bg-black px-6 py-3 text-white"
          >
            Regresar a clientes
          </a>
        </section>
      </main>
    );
  }

  const totalSpent = customer.orders.reduce(
    (sum, order) => sum + order.total,
    0
  );

  return (
    <main className="min-h-screen bg-white px-6 py-12 text-black">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <h1 className="text-4xl font-bold">{customer.fullName}</h1>

            <p className="mt-4 text-gray-600">
              Cliente desde {formatDate(customer.createdAt)}
            </p>
          </div>

          <a
            href="/admin/customers"
            className="rounded-full border px-6 py-3 text-center"
          >
            Regresar a clientes
          </a>
        </div>

        <AdminNav />

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border p-5">
            <p className="text-sm text-gray-600">Pedidos</p>
            <p className="mt-2 text-3xl font-bold">
              {customer.orders.length}
            </p>
          </div>

          <div className="rounded-2xl border p-5">
            <p className="text-sm text-gray-600">Total gastado</p>
            <p className="mt-2 text-3xl font-bold">
              {formatMoney(totalSpent)}
            </p>
          </div>

          <div className="rounded-2xl border p-5">
            <p className="text-sm text-gray-600">Último pedido</p>
            <p className="mt-2 text-lg font-semibold">
              {customer.orders[0]
                ? formatDate(customer.orders[0].createdAt)
                : "Sin pedidos"}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border p-6">
            <h2 className="text-2xl font-semibold">Contacto</h2>

            <div className="mt-4 space-y-2 text-gray-700">
              <p>{customer.email || "Sin email"}</p>
              <p>{customer.phone || "Sin teléfono"}</p>
            </div>
          </div>

          <div className="rounded-2xl border p-6">
            <h2 className="text-2xl font-semibold">Dirección</h2>

            <div className="mt-4 space-y-2 text-gray-700">
              <p>{customer.address || "Sin dirección"}</p>
              <p>
                {[customer.city, customer.state, customer.zipCode]
                  .filter(Boolean)
                  .join(", ") || "Sin ubicación"}
              </p>
              <p>{customer.country || "México"}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border p-6">
          <h2 className="text-2xl font-semibold">Historial de pedidos</h2>

          {customer.orders.length === 0 ? (
            <p className="mt-4 text-gray-600">
              Este cliente todavía no tiene pedidos.
            </p>
          ) : (
            <div className="mt-5 space-y-4">
              {customer.orders.map((order) => (
                <div key={order.id} className="rounded-2xl border p-5">
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                      <a
                        href={`/admin/orders/${order.orderNumber}`}
                        className="text-lg font-semibold underline"
                      >
                        {order.orderNumber}
                      </a>

                      <p className="mt-1 text-sm text-gray-600">
                        {formatDate(order.createdAt)}
                      </p>

                      <p className="mt-2 text-sm text-gray-600">
                        Estado: {getStatusLabel(order.status)} · Pago:{" "}
                        {getPaymentStatusLabel(order.paymentStatus)}
                      </p>
                    </div>

                    <div className="md:text-right">
                      <p className="text-xl font-bold">
                        {formatMoney(order.total)}
                      </p>

                      <a
                        href={`/admin/orders/${order.orderNumber}`}
                        className="mt-2 inline-block rounded-full bg-black px-4 py-2 text-sm text-white"
                      >
                        Ver pedido
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

