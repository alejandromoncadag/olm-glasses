"use client";

import { useEffect, useState } from "react";

type CartItem = {
  slug: string;
  name: string;
  price: number;
  quantity: number;
};

export default function CartItems() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const savedCart: CartItem[] = JSON.parse(
      localStorage.getItem("olm-cart") || "[]"
    );

    setCartItems(savedCart);
  }, []);

  function removeItem(slug: string) {
    const updatedCart = cartItems.filter((item) => item.slug !== slug);

    setCartItems(updatedCart);
    localStorage.setItem("olm-cart", JSON.stringify(updatedCart));
  }

  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  if (cartItems.length === 0) {
    return (
      <div className="mt-10 rounded-2xl border p-8 text-center">
        <h2 className="text-2xl font-semibold">Tu carrito está vacío</h2>

        <p className="mt-3 text-gray-600">
          Explora nuestra colección y agrega tus lentes favoritos.
        </p>

        <a
          href="/eyeglasses"
          className="mt-6 inline-block rounded-full bg-black px-8 py-3 text-white"
        >
          Ver lentes ópticos
        </a>
      </div>
    );
  }

  return (
    <div className="mt-10 grid gap-8 md:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        {cartItems.map((item) => (
          <div
            key={item.slug}
            className="flex items-center justify-between rounded-2xl border p-5"
          >
            <div>
              <h2 className="text-lg font-semibold">{item.name}</h2>

              <p className="mt-1 text-sm text-gray-600">
                Cantidad: {item.quantity}
              </p>

              <p className="mt-1 text-gray-700">
                ${item.price.toLocaleString("es-MX")} MXN
              </p>
            </div>

            <button
              onClick={() => removeItem(item.slug)}
              className="text-sm font-semibold text-red-600 hover:underline"
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>

      <div className="h-fit rounded-2xl border p-6">
        <h2 className="text-xl font-bold">Resumen</h2>

        <div className="mt-4 flex justify-between border-b pb-4">
          <span>Total</span>
          <span className="font-semibold">
            ${total.toLocaleString("es-MX")} MXN
          </span>
        </div>

        <button className="mt-6 w-full rounded-full bg-black px-8 py-4 text-white">
          Continuar al pago
        </button>
      </div>
    </div>
  );
}

