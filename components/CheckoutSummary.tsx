"use client";

import { useEffect, useState } from "react";
import { products } from "@/data/products";

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
  status: "pending";
  customer: CheckoutCustomer;
  items: CartItem[];
  subtotal: number;
  total: number;
};

function getProductFromCartItem(item: CartItem) {
  return products.find((product) => item.slug.startsWith(`${product.slug}-`));
}

function cartHasInvalidItems(cartItems: CartItem[]) {
  return cartItems.some((item) => {
    const product = getProductFromCartItem(item);

    if (!product) return true;
    if (!product.isActive) return true;
    if (product.stock <= 0) return true;
    if (item.quantity > product.stock) return true;

    return false;
  });
}

function generateOrderNumber() {
  return `OLM-${Date.now()}`;
}

export default function CheckoutSummary() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const savedCart = localStorage.getItem("olm-cart");

    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const total = subtotal;

  function handlePlaceOrder() {
    const savedCart = localStorage.getItem("olm-cart");
    const savedCustomer = localStorage.getItem("olm-checkout-customer");

    const latestCartItems: CartItem[] = savedCart ? JSON.parse(savedCart) : [];
    const customer: CheckoutCustomer = savedCustomer
      ? JSON.parse(savedCustomer)
      : {};

    if (latestCartItems.length === 0) {
      alert("Tu carrito está vacío.");
      window.location.href = "/cart";
      return;
    }

    if (cartHasInvalidItems(latestCartItems)) {
      alert(
        "Tu carrito tiene productos agotados o cantidades mayores al stock disponible."
      );
      window.location.href = "/cart";
      return;
    }

    if (
      !customer.fullName ||
      !customer.email ||
      !customer.phone ||
      !customer.address ||
      !customer.city ||
      !customer.state ||
      !customer.zipCode
    ) {
      alert("Completa tus datos de envío antes de continuar.");
      return;
    }

    const order: Order = {
      orderNumber: generateOrderNumber(),
      createdAt: new Date().toISOString(),
      status: "pending",
      customer,
      items: latestCartItems,
      subtotal,
      total,
    };

    const existingOrders: Order[] = JSON.parse(
      localStorage.getItem("olm-orders") || "[]"
    );

    const updatedOrders = [order, ...existingOrders];

    localStorage.setItem("olm-orders", JSON.stringify(updatedOrders));
    localStorage.setItem("olm-latest-order", JSON.stringify(order));

    window.location.href = "/order-success";
  }

  if (cartItems.length === 0) {
    return (
      <aside className="rounded-2xl border p-6">
        <h2 className="text-2xl font-semibold">Resumen</h2>

        <p className="mt-4 text-gray-600">Tu carrito está vacío.</p>

        <a
          href="/eyeglasses"
          className="mt-6 block rounded-full bg-black px-6 py-3 text-center text-white"
        >
          Ver lentes
        </a>
      </aside>
    );
  }

  return (
    <aside className="h-fit rounded-2xl border p-6">
      <h2 className="text-2xl font-semibold">Resumen</h2>

      <div className="mt-6 space-y-4">
        {cartItems.map((item) => {
          const product = getProductFromCartItem(item);
          const isInvalid =
            !product ||
            !product.isActive ||
            product.stock <= 0 ||
            item.quantity > product.stock;

          return (
            <div key={item.slug} className="border-b pb-4">
              <div className="flex justify-between gap-4">
                <div>
                  <p className="font-medium">{item.name}</p>

                  <p className="mt-1 text-sm text-gray-600">
                    {item.lensOption}
                  </p>

                  <p className="text-sm text-gray-600">
                    Cantidad: {item.quantity}
                  </p>

                  {isInvalid && (
                    <p className="mt-2 text-sm font-medium text-red-600">
                      Revisa disponibilidad de este producto.
                    </p>
                  )}
                </div>

                <p className="font-medium">
                  ${(item.price * item.quantity).toLocaleString("es-MX")} MXN
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex justify-between">
        <span>Subtotal</span>
        <span>${subtotal.toLocaleString("es-MX")} MXN</span>
      </div>

      <div className="mt-4 flex justify-between text-gray-600">
        <span>Envío</span>
        <span>Se calcula después</span>
      </div>

      <div className="mt-6 border-t pt-6">
        <div className="flex justify-between text-lg font-semibold">
          <span>Total</span>
          <span>${total.toLocaleString("es-MX")} MXN</span>
        </div>
      </div>

      <button
        onClick={handlePlaceOrder}
        className="mt-6 w-full rounded-full bg-black px-6 py-3 text-white"
      >
        Finalizar pedido
      </button>

      <p className="mt-3 text-sm text-gray-500">
        Pago temporal. Más adelante conectaremos Mercado Pago.
      </p>
    </aside>
  );
}


