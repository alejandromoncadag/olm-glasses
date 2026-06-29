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

function getStatusLabel(status: OrderStatus) {
  if (status === "pending") return "Pedido recibido";
  if (status === "processing") return "En proceso";
  if (status === "completed") return "Completado";
  if (status === "cancelled") return "Cancelado";

  return "Pedido recibido";
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

        <p className="mt-3 text-gray-600">
          Puedes regresar a la tienda y hacer una nueva compra.
        </p>

        <a
          href="/eyeglasses"
          className="mt-6 inline-block rounded-full bg-black px-6 py-3 text-white"
        >
          Ver lentes
        </a>
      </div>
    );
  }

  const formattedDate = new Date(order.createdAt).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="rounded-2xl border p-8">
      <div className="text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-3xl">
          ✓
        </div>

        <h1 className="mt-8 text-4xl font-bold">Pedido recibido</h1>

        <p className="mt-4 text-lg text-gray-600">
          Gracias por comprar en Óptica OLM. Hemos recibido tu pedido y pronto
          te contactaremos para confirmar los detalles.
        </p>
      </div>

      <div className="mt-8 rounded-2xl bg-gray-50 p-5">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <p className="text-sm text-gray-500">Número de pedido</p>
            <p className="mt-1 font-semibold">{order.orderNumber}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Fecha</p>
            <p className="mt-1 font-semibold">{formattedDate}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Estado</p>
            <p className="mt-1 font-semibold">{getStatusLabel(order.status)}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Pago</p>
            <p className="mt-1 font-semibold">
              {getPaymentStatusLabel(order.paymentStatus)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border p-5">
        <h2 className="text-xl font-semibold">Cliente</h2>

        <div className="mt-4 grid gap-3 text-sm text-gray-700 md:grid-cols-2">
          <p>
            <span className="font-medium text-black">Nombre:</span>{" "}
            {order.customer.fullName || "Por confirmar"}
          </p>

          <p>
            <span className="font-medium text-black">Email:</span>{" "}
            {order.customer.email || "Por confirmar"}
          </p>

          <p>
            <span className="font-medium text-black">Teléfono:</span>{" "}
            {order.customer.phone || "Por confirmar"}
          </p>

          <p>
            <span className="font-medium text-black">Ciudad:</span>{" "}
            {order.customer.city || "Por confirmar"}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold">Resumen del pedido</h2>

        <div className="mt-4 space-y-4">
          {order.items.map((item, index) => (
            <div key={item.id || index} className="rounded-2xl border p-5">
              <div className="flex flex-col justify-between gap-4 md:flex-row">
                <div>
                  <h3 className="font-semibold">{getItemName(item)}</h3>

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

                  <p className="mt-1 font-semibold">
                    {formatMoney(getItemTotal(item))}
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
          <span>
            {order.shipping !== undefined
              ? formatMoney(order.shipping)
              : "Por confirmar"}
          </span>
        </div>

        <div className="mt-5 border-t pt-5">
          <div className="flex justify-between text-lg font-semibold">
            <span>Total</span>
            <span>{formatMoney(order.total)}</span>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl bg-gray-50 p-5">
        <h2 className="text-xl font-semibold">Próximos pasos</h2>

        <ul className="mt-4 space-y-3 text-gray-600">
          <li>1. Revisaremos tu pedido.</li>
          <li>2. Confirmaremos tu información de envío y graduación.</li>
          <li>3. Te enviaremos instrucciones de pago.</li>
        </ul>

        <p className="mt-4 text-sm text-gray-500">
          Próximamente conectaremos Mercado Pago para pagar directamente en línea.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <a
          href="/eyeglasses"
          className="rounded-full bg-black px-6 py-3 text-center text-white"
        >
          Seguir comprando
        </a>

        <a
          href="/order-status"
          className="rounded-full border px-6 py-3 text-center"
        >
          Consultar pedido
        </a>
      </div>
    </div>
  );
}





