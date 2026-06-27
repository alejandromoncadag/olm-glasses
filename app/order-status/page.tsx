"use client";

import { FormEvent, useState } from "react";

type OrderStatus = "pending" | "processing" | "completed" | "cancelled";
type PaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "refunded";

type OrderItem = {
  id: string;
  productSlug: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  lensOption: string;
  prescriptionMethod: string;
};

type Order = {
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  shipping: number;
  total: number;
  currency: string;
  createdAt: string;
  customer: {
    fullName: string;
    email: string;
  };
  items: OrderItem[];
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
  if (status === "pending") return "Pedido recibido";
  if (status === "processing") return "En proceso";
  if (status === "completed") return "Completado";
  if (status === "cancelled") return "Cancelado";

  return "Pedido recibido";
}

function getPaymentStatusLabel(status: PaymentStatus) {
  if (status === "unpaid") return "Pago por confirmar";
  if (status === "pending") return "Pago pendiente";
  if (status === "paid") return "Pagado";
  if (status === "failed") return "Pago fallido";
  if (status === "refunded") return "Reembolsado";

  return "Pago por confirmar";
}

export default function OrderStatusPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSearching(true);
      setError("");
      setOrder(null);

      const response = await fetch("/api/order-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderNumber,
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          "No encontramos un pedido con ese número y email. Revisa los datos e intenta de nuevo."
        );
        return;
      }

      setOrder(data.order);
    } catch (error) {
      console.error(error);
      setError("No pudimos buscar el pedido. Intenta de nuevo.");
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <main className="min-h-screen bg-white px-6 py-12 text-black">
      <section className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold">Consultar pedido</h1>

        <p className="mt-4 text-gray-600">
          Ingresa tu número de pedido y email para revisar el estado de tu
          compra.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 rounded-2xl border p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium">Número de pedido</span>
              <input
                value={orderNumber}
                onChange={(event) => setOrderNumber(event.target.value)}
                required
                placeholder="OLM-123456789"
                className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="tu@email.com"
                className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className="mt-6 rounded-full bg-black px-8 py-3 text-white disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {isSearching ? "Buscando..." : "Consultar pedido"}
          </button>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        </form>

        {order && (
          <div className="mt-10 rounded-2xl border p-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row">
              <div>
                <h2 className="text-2xl font-semibold">
                  Pedido {order.orderNumber}
                </h2>

                <p className="mt-2 text-sm text-gray-600">
                  Creado el {formatDate(order.createdAt)}
                </p>
              </div>

              <div className="md:text-right">
                <p className="font-semibold">{getStatusLabel(order.status)}</p>
                <p className="mt-1 text-sm text-gray-600">
                  {getPaymentStatusLabel(order.paymentStatus)}
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-2xl bg-gray-50 p-5">
              <h3 className="font-semibold">Cliente</h3>

              <p className="mt-2 text-gray-700">{order.customer.fullName}</p>
              <p className="text-gray-600">{order.customer.email}</p>
            </div>

            <div className="mt-8">
              <h3 className="text-xl font-semibold">Productos</h3>

              <div className="mt-4 space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="rounded-2xl border p-5">
                    <div className="flex flex-col justify-between gap-4 md:flex-row">
                      <div>
                        <p className="font-semibold">{item.productName}</p>
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

            <div className="mt-8 rounded-2xl border p-5">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatMoney(order.subtotal)}</span>
              </div>

              <div className="mt-3 flex justify-between text-gray-600">
                <span>Envío</span>
                <span>{formatMoney(order.shipping || 0)}</span>
              </div>

              <div className="mt-5 border-t pt-5">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>{formatMoney(order.total)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

