"use client";

import { useEffect, useState } from "react";

type OrderStatus = "pending" | "processing" | "completed" | "cancelled";

type OrderItem = {
  id?: string;
  productName?: string;
  productSlug?: string;
  name?: string;
  slug?: string;
  unitPrice?: number;
  price?: number;
  quantity: number;
  lineTotal?: number;
  lensOption: string;
  prescriptionMethod: string;
};

type Order = {
  id?: string;
  orderNumber: string;
  createdAt: string;
  status: OrderStatus;
  paymentStatus?: string;
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
  subtotal: number;
  shipping?: number;
  total: number;
  currency?: string;
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

function getStatusClassName(status: OrderStatus) {
  if (status === "pending") return "bg-yellow-100 text-yellow-800";
  if (status === "processing") return "bg-blue-100 text-blue-700";
  if (status === "completed") return "bg-green-100 text-green-700";
  if (status === "cancelled") return "bg-red-100 text-red-700";

  return "bg-gray-100 text-gray-700";
}

function getPaymentStatusLabel(status?: string) {
  if (status === "unpaid") return "Pago por confirmar";
  if (status === "pending") return "Pago pendiente";
  if (status === "paid") return "Pagado";
  if (status === "failed") return "Pago fallido";
  if (status === "refunded") return "Reembolsado";

  return "Pago por confirmar";
}

function getItemName(item: OrderItem) {
  return item.productName || item.name || "Producto";
}

function getItemPrice(item: OrderItem) {
  return item.unitPrice ?? item.price ?? 0;
}

function getItemTotal(item: OrderItem) {
  return item.lineTotal ?? getItemPrice(item) * item.quantity;
}

export default function OrderSuccessDetails() {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const savedOrder = localStorage.getItem("olm-latest-order");

      if (!savedOrder) {
        setOrder(null);
        return;
      }

      const parsedOrder = JSON.parse(savedOrder) as Order;
      setOrder(parsedOrder);
    } catch (error) {
      console.error("Could not load latest order:", error);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, []);

  async function copyOrderNumber() {
    if (!order?.orderNumber) {
      return;
    }

    try {
      await navigator.clipboard.writeText(order.orderNumber);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Could not copy order number:", error);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border p-8 text-center">
        <h2 className="text-2xl font-semibold">Cargando pedido...</h2>

        <p className="mt-3 text-gray-600">
          Estamos preparando el resumen de tu compra.
        </p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-2xl border p-8 text-center">
        <h1 className="text-3xl font-bold">No encontramos un pedido reciente</h1>

        <p className="mx-auto mt-3 max-w-md text-gray-600">
          Puedes regresar a la tienda y hacer una nueva compra.
        </p>

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href="/eyeglasses"
            className="rounded-full bg-black px-6 py-3 text-white"
          >
            Ver lentes ópticos
          </a>

          <a href="/sunglasses" className="rounded-full border px-6 py-3">
            Ver lentes de sol
          </a>
        </div>
      </div>
    );
  }

  const formattedDate = formatDate(order.createdAt);
  const shipping = order.shipping ?? 0;

  return (
    <div>
      <div className="rounded-3xl border bg-gradient-to-b from-green-50 to-white p-8 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl text-green-700">
          ✓
        </div>

        <h1 className="mt-8 text-4xl font-bold">Pedido recibido</h1>

        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
          Gracias por comprar en Óptica OLM. Hemos recibido tu pedido y pronto
          te contactaremos para confirmar los detalles.
        </p>

        <div className="mx-auto mt-8 max-w-xl rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Número de pedido</p>

          <div className="mt-2 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <p className="text-2xl font-bold">{order.orderNumber}</p>

            <button
              type="button"
              onClick={copyOrderNumber}
              className="rounded-full border px-4 py-2 text-sm"
            >
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>

          <p className="mt-3 text-sm text-gray-500">
            Guarda este número para consultar tu pedido.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-4">
        <div className="rounded-2xl border p-5">
          <p className="text-sm text-gray-500">Fecha</p>
          <p className="mt-1 font-semibold">{formattedDate}</p>
        </div>

        <div className="rounded-2xl border p-5">
          <p className="text-sm text-gray-500">Estado</p>
          <span
            className={`mt-2 inline-block rounded-full px-3 py-1 text-sm font-semibold ${getStatusClassName(
              order.status
            )}`}
          >
            {getStatusLabel(order.status)}
          </span>
        </div>

        <div className="rounded-2xl border p-5">
          <p className="text-sm text-gray-500">Pago</p>
          <p className="mt-1 font-semibold">
            {getPaymentStatusLabel(order.paymentStatus)}
          </p>
        </div>

        <div className="rounded-2xl border p-5">
          <p className="text-sm text-gray-500">Total</p>
          <p className="mt-1 text-xl font-bold">{formatMoney(order.total)}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <section className="rounded-2xl border p-6">
            <h2 className="text-2xl font-semibold">Datos del cliente</h2>

            <div className="mt-5 grid gap-4 text-sm md:grid-cols-2">
              <div>
                <p className="text-gray-500">Nombre</p>
                <p className="mt-1 font-medium">
                  {order.customer.fullName || "Por confirmar"}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Email</p>
                <p className="mt-1 font-medium">
                  {order.customer.email || "Por confirmar"}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Teléfono</p>
                <p className="mt-1 font-medium">
                  {order.customer.phone || "Por confirmar"}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Ciudad</p>
                <p className="mt-1 font-medium">
                  {order.customer.city || "Por confirmar"}
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
                    .join(", ") || "Por confirmar"}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border p-6">
            <h2 className="text-2xl font-semibold">Productos</h2>

            <div className="mt-5 space-y-4">
              {order.items.map((item, index) => (
                <div key={item.id || index} className="rounded-2xl bg-gray-50 p-5">
                  <div className="flex flex-col justify-between gap-4 md:flex-row">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {getItemName(item)}
                      </h3>

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
                      <p className="text-sm text-gray-600">
                        {formatMoney(getItemPrice(item))} c/u
                      </p>

                      <p className="mt-1 text-lg font-semibold">
                        {formatMoney(getItemTotal(item))}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
              <span>{shipping ? formatMoney(shipping) : "Por confirmar"}</span>
            </div>
          </div>

          <div className="mt-6 border-t pt-6">
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span>{formatMoney(order.total)}</span>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-gray-50 p-5">
            <h3 className="font-semibold">Próximos pasos</h3>

            <ol className="mt-4 space-y-3 text-sm text-gray-600">
              <li>1. Revisaremos tu pedido.</li>
              <li>2. Confirmaremos tu información de envío y graduación.</li>
              <li>3. Te enviaremos instrucciones de pago.</li>
            </ol>

            <p className="mt-4 text-xs text-gray-500">
              Próximamente conectaremos Mercado Pago para pagar directamente en
              línea.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <a
              href="/order-status"
              className="rounded-full bg-black px-6 py-3 text-center text-white"
            >
              Consultar pedido
            </a>

            <a
              href="/eyeglasses"
              className="rounded-full border px-6 py-3 text-center"
            >
              Seguir comprando
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}

