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

function getStatusLabel(status: OrderStatus) {
  if (status === "pending") return "Pendiente";
  if (status === "processing") return "En proceso";
  if (status === "completed") return "Completado";
  if (status === "cancelled") return "Cancelado";

  return "Pendiente";
}

function getPaymentStatusLabel(status?: string) {
  if (status === "unpaid") return "Sin pagar";
  if (status === "pending") return "Pago pendiente";
  if (status === "paid") return "Pagado";
  if (status === "failed") return "Pago fallido";
  if (status === "refunded") return "Reembolsado";

  return "Por confirmar";
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
    async function loadOrder() {
      try {
        const savedOrder = localStorage.getItem("olm-latest-order");

        if (!savedOrder) {
          setOrder(null);
          return;
        }

        const parsedOrder = JSON.parse(savedOrder) as Order;

        const response = await fetch(`/api/orders/${parsedOrder.orderNumber}`);

        if (!response.ok) {
          setOrder(parsedOrder);
          return;
        }

        const data = await response.json();
        setOrder(data.order);
      } catch (error) {
        console.error(error);

        const savedOrder = localStorage.getItem("olm-latest-order");

        if (savedOrder) {
          setOrder(JSON.parse(savedOrder));
        } else {
          setOrder(null);
        }
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border p-8 text-center">
        <h2 className="text-2xl font-semibold">Cargando pedido...</h2>

        <p className="mt-3 text-gray-600">
          Estamos leyendo los detalles desde PostgreSQL.
        </p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-2xl border p-8 text-center">
        <h2 className="text-2xl font-semibold">
          No encontramos un pedido reciente
        </h2>

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
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
          ✓
        </div>

        <h1 className="mt-6 text-4xl font-bold">Pedido recibido</h1>

        <p className="mt-3 text-gray-600">
          Gracias por tu compra. Hemos guardado tu pedido en PostgreSQL.
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

      <div className="mt-8">
        <h2 className="text-2xl font-semibold">Resumen del pedido</h2>

        <div className="mt-4 space-y-4">
          {order.items.map((item, index) => (
            <div key={item.id || index} className="rounded-2xl border p-5">
              <div className="flex justify-between gap-4">
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

                <p className="font-semibold">
                  ${getItemTotal(item).toLocaleString("es-MX")} MXN
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 rounded-2xl border p-5">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>${order.subtotal.toLocaleString("es-MX")} MXN</span>
        </div>

        <div className="mt-3 flex justify-between text-gray-600">
          <span>Envío</span>
          <span>
            {order.shipping !== undefined
              ? `$${order.shipping.toLocaleString("es-MX")} MXN`
              : "Por confirmar"}
          </span>
        </div>

        <div className="mt-5 border-t pt-5">
          <div className="flex justify-between text-lg font-semibold">
            <span>Total</span>
            <span>${order.total.toLocaleString("es-MX")} MXN</span>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl bg-gray-50 p-5">
        <h2 className="text-xl font-semibold">Próximos pasos</h2>

        <p className="mt-3 text-gray-600">
          Revisaremos tu pedido y te contactaremos para confirmar disponibilidad,
          graduación y forma de pago.
        </p>

        <p className="mt-3 text-gray-600">
          Si elegiste enviar tu receta después, podrás mandarla por WhatsApp.
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





