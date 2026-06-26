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

type ProductFromApi = {
  slug: string;
  stock: number;
  isActive: boolean;
};

type OrderSuccessItem = {
  slug: string;
  name: string;
  price: number;
  quantity: number;
  lensOption: string;
  prescriptionMethod: string;
};

type OrderSuccessData = {
  orderNumber: string;
  createdAt: string;
  status: "pending" | "processing" | "completed" | "cancelled";
  customer: CheckoutCustomer;
  items: OrderSuccessItem[];
  subtotal: number;
  total: number;
};

function generateFallbackOrderNumber() {
  return `OLM-${Date.now()}`;
}

function findProductFromCartItem(
  item: CartItem,
  products: ProductFromApi[]
) {
  const sortedProducts = [...products].sort(
    (a, b) => b.slug.length - a.slug.length
  );

  return sortedProducts.find(
    (product) =>
      item.slug === product.slug || item.slug.startsWith(`${product.slug}-`)
  );
}

function cartHasInvalidItems(
  cartItems: CartItem[],
  products: ProductFromApi[]
) {
  return cartItems.some((item) => {
    const product = findProductFromCartItem(item, products);

    if (!product) return true;
    if (!product.isActive) return true;
    if (product.stock <= 0) return true;
    if (item.quantity > product.stock) return true;

    return false;
  });
}

export default function CheckoutSummary() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

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

  async function handlePlaceOrder() {
    try {
      setIsPlacingOrder(true);

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

      const productsResponse = await fetch("/api/products");

      if (!productsResponse.ok) {
        throw new Error("Failed to fetch products");
      }

      const productsData = await productsResponse.json();
      const products: ProductFromApi[] = productsData.products;

      if (cartHasInvalidItems(latestCartItems, products)) {
        alert(
          "Tu carrito tiene productos agotados o cantidades mayores al stock disponible."
        );
        window.location.href = "/cart";
        return;
      }

      const apiItems = latestCartItems.map((item) => {
        const product = findProductFromCartItem(item, products);

        if (!product) {
          throw new Error(`No encontramos el producto: ${item.name}`);
        }

        return {
          productSlug: product.slug,
          quantity: item.quantity,
          lensOption: item.lensOption,
          prescriptionMethod: item.prescriptionMethod,
        };
      });

      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer: {
            fullName: customer.fullName,
            email: customer.email,
            phone: customer.phone,
            address: customer.address,
            city: customer.city,
            state: customer.state,
            zipCode: customer.zipCode,
          },
          items: apiItems,
        }),
      });

      if (!orderResponse.ok) {
        throw new Error("Failed to create order");
      }

      const orderData = await orderResponse.json();
      const orderNumber =
        orderData.order?.orderNumber || generateFallbackOrderNumber();

      const detailResponse = await fetch(`/api/orders/${orderNumber}`);

      if (!detailResponse.ok) {
        throw new Error("Failed to fetch created order");
      }

      const detailData = await detailResponse.json();
      const createdOrder = detailData.order;

      const orderForSuccessPage: OrderSuccessData = {
        orderNumber: createdOrder.orderNumber,
        createdAt: createdOrder.createdAt,
        status: createdOrder.status,
        customer,
        subtotal: createdOrder.subtotal,
        total: createdOrder.total,
        items: createdOrder.items.map(
          (item: {
            productSlug: string;
            productName: string;
            unitPrice: number;
            quantity: number;
            lensOption: string;
            prescriptionMethod: string;
          }) => ({
            slug: item.productSlug,
            name: item.productName,
            price: item.unitPrice,
            quantity: item.quantity,
            lensOption: item.lensOption,
            prescriptionMethod: item.prescriptionMethod,
          })
        ),
      };

      localStorage.setItem(
        "olm-latest-order",
        JSON.stringify(orderForSuccessPage)
      );

      window.location.href = "/order-success";
    } catch (error) {
      console.error(error);
      alert("No pudimos crear el pedido. Intenta de nuevo.");
    } finally {
      setIsPlacingOrder(false);
    }
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
        {cartItems.map((item) => (
          <div key={item.slug} className="border-b pb-4">
            <div className="flex justify-between gap-4">
              <div>
                <p className="font-medium">{item.name}</p>

                <p className="mt-1 text-sm text-gray-600">
                  {item.lensOption}
                </p>

                <p className="text-sm text-gray-600">
                  {item.prescriptionMethod}
                </p>

                <p className="mt-1 text-sm text-gray-600">
                  Cantidad: {item.quantity}
                </p>
              </div>

              <p className="font-medium">
                ${(item.price * item.quantity).toLocaleString("es-MX")} MXN
              </p>
            </div>
          </div>
        ))}
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
        disabled={isPlacingOrder}
        className="mt-6 w-full rounded-full bg-black px-6 py-3 text-white disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {isPlacingOrder ? "Creando pedido..." : "Finalizar pedido"}
      </button>

      <p className="mt-3 text-sm text-gray-500">
        Pedido conectado a PostgreSQL. Más adelante conectaremos Mercado Pago.
      </p>
    </aside>
  );
}

