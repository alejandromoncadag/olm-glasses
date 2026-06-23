"use client";

import { useEffect, useState } from "react";

type CartItem = {
  slug: string;
  name: string;
  price: number;
  quantity: number;
  lensOption: string;
  prescriptionMethod: string;
};

type CheckoutCustomer = {
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
};

type Order = {
  orderNumber: string;
  createdAt: string;
  status: "pending" | "processing" | "completed";
  customer: CheckoutCustomer;
  items: CartItem[];
  subtotal: number;
  total: number;
};

function getStatusLabel(status: Order["status"]) {
  if (status === "pending") return "Pendiente";
  if (status === "processing") return "En proceso";
  if (status === "completed") return "Completado";

  return "Pendiente";
}

export default function OrderSuccessDetails() {
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const savedOrder = localStorage.getItem("olm-latest-order");

    if (savedOrder) {
      setOrder(JSON.parse(savedOrder));
    }
  }, []);

  if (!order) {
    return (
      <div className="rounded-2xl border p-8 text-center">
        <h2 className="text-2xl font-semibold">No encontramos un pedido reciente</h2>

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
          Gracias por tu compra. Hemos guardado tu pedido correctamente.
        </p>
      </div>

      <div className="mt-8 rounded-2xl bg-gray-50 p-5">
        <div className="grid gap-4 md:grid-cols-3">
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
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold">Resumen del pedido</h2>

        <div className="mt-4 space-y-4">
          {order.items.map((item) => (
            <div key={item.slug} className="rounded-2xl border p-5">
              <div className="flex justify-between gap-4">
                <div>
                  <h3 className="font-semibold">{item.name}</h3>

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
                  ${(item.price * item.quantity).toLocaleString("es-MX")} MXN
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
          <span>Por confirmar</span>
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
          href="/admin/orders"
          className="rounded-full border px-6 py-3 text-center"
        >
          Ver pedido en admin
        </a>
      </div>
    </div>
  );
}




