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

async function readApiError(response: Response) {
  try {
    const data = await response.json();

    if (typeof data.error === "string" && data.error.trim()) {
      return data.error;
    }

    return "No pudimos crear el pedido. Intenta de nuevo.";
  } catch {
    return "No pudimos crear el pedido. Intenta de nuevo.";
  }
}

export default function CheckoutSummary() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
      setErrorMessage("");

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
        setErrorMessage("Completa tus datos de envío antes de continuar.");
        return;
      }

      const productsResponse = await fetch("/api/products");

      if (!productsResponse.ok) {
        throw new Error("Failed to fetch products");
      }

      const productsData = await productsResponse.json();
      const products: ProductFromApi[] = productsData.products;

      if (cartHasInvalidItems(latestCartItems, products)) {
        setErrorMessage(
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
        const apiError = await readApiError(orderResponse);
        setErrorMessage(apiError);
        return;
      }

      const orderData = await orderResponse.json();
      const createdOrder = orderData.order;

      const orderNumber =
        createdOrder?.orderNumber || generateFallbackOrderNumber();

      const orderForSuccessPage: OrderSuccessData = {
        orderNumber,
        createdAt: new Date().toISOString(),
        status: "pending",
        customer,
        subtotal: createdOrder?.subtotal ?? subtotal,
        total: createdOrder?.total ?? total,
        items: latestCartItems.map((item) => ({
          slug: item.slug,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          lensOption: item.lensOption,
          prescriptionMethod: item.prescriptionMethod,
        })),
      };

      localStorage.setItem(
        "olm-latest-order",
        JSON.stringify(orderForSuccessPage)
      );

      window.location.href = "/order-success";
    } catch (error) {
      console.error(error);
      setErrorMessage("No pudimos crear el pedido. Intenta de nuevo.");
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

      {errorMessage && (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">{errorMessage}</p>
        </div>
      )}

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

