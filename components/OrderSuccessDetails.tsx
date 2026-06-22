"use client";

import { useEffect, useState } from "react";

type OrderItem = {
  slug: string;
  name: string;
  price: number;
  quantity: number;
  lensOption?: string;
  prescriptionMethod?: string;
};

type LocalOrder = {
  orderNumber: string;
  createdAt: string;
  items: OrderItem[];
  total: number;
  status: "pending" | "processing" | "completed";
};

export default function OrderSuccessDetails() {
  const [order, setOrder] = useState<LocalOrder | null>(null);

  useEffect(() => {
    const savedOrder = localStorage.getItem("olm-latest-order");

    if (savedOrder) {
      setOrder(JSON.parse(savedOrder));
    }
  }, []);

  if (!order) {
    return (
      <p className="mt-6 text-gray-600">
        No encontramos información del pedido.
      </p>
    );
  }

  return (
    <div className="mt-10 rounded-2xl border p-6 text-left">
      <h2 className="text-xl font-semibold">Resumen del pedido</h2>

      <p className="mt-3 text-gray-600">
        Número de pedido:{" "}
        <span className="font-semibold text-black">{order.orderNumber}</span>
      </p>

      <div className="mt-6 space-y-4">
        {order.items.map((item) => (
          <div key={item.slug} className="border-t pt-4">
            <p className="font-medium">{item.name}</p>

            {item.lensOption && (
              <p className="text-sm text-gray-600">
                Tipo de lente: {item.lensOption}
              </p>
            )}

            {item.prescriptionMethod && (
              <p className="text-sm text-gray-600">
                Receta: {item.prescriptionMethod}
              </p>
            )}

            <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-between border-t pt-4 font-semibold">
        <span>Total</span>
        <span>${order.total.toLocaleString("es-MX")} MXN</span>
      </div>
    </div>
  );
}



