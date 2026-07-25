/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { writeCart, type CartItem } from "@/lib/cart";

type ApiProduct = {
  slug: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  isActive: boolean;
  mainImage?: {
    imageUrl: string;
    altText?: string | null;
  } | null;
};

function getProductFromCartItem(item: CartItem, products: ApiProduct[]) {
  const sortedProducts = [...products].sort(
    (a, b) => b.slug.length - a.slug.length
  );

  return sortedProducts.find(
    (product) =>
      item.slug === product.slug || item.slug.startsWith(`${product.slug}-`)
  );
}

function formatMoney(amount: number) {
  return `$${amount.toLocaleString("es-MX")} MXN`;
}

export default function CartItems() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedCart = localStorage.getItem("olm-cart");

    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error("Could not read cart:", error);
        localStorage.removeItem("olm-cart");
      }
    }
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoadingProducts(true);
        setError("");

        const response = await fetch("/api/products");

        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const data = await response.json();
        setProducts(data.products || []);
      } catch (error) {
        console.error(error);
        setError("No pudimos cargar el stock desde PostgreSQL.");
      } finally {
        setLoadingProducts(false);
      }
    }

    fetchProducts();
  }, []);

  function saveCart(updatedCart: CartItem[]) {
    setCartItems(updatedCart);
    writeCart(updatedCart);
  }

  function getTotalQuantityForProduct(productSlug: string) {
    return cartItems
      .filter(
        (item) =>
          item.slug === productSlug || item.slug.startsWith(`${productSlug}-`)
      )
      .reduce((sum, item) => sum + item.quantity, 0);
  }

  function increaseQuantity(itemSlug: string) {
    const item = cartItems.find((cartItem) => cartItem.slug === itemSlug);

    if (!item) return;

    const product = getProductFromCartItem(item, products);

    if (!product) {
      alert("No pudimos encontrar este producto.");
      return;
    }

    const totalQuantityForProduct = getTotalQuantityForProduct(product.slug);

    if (totalQuantityForProduct >= product.stock) {
      alert("No hay más piezas disponibles de este producto.");
      return;
    }

    const updatedCart = cartItems.map((cartItem) =>
      cartItem.slug === itemSlug
        ? { ...cartItem, quantity: cartItem.quantity + 1 }
        : cartItem
    );

    saveCart(updatedCart);
  }

  function decreaseQuantity(itemSlug: string) {
    const updatedCart = cartItems
      .map((cartItem) =>
        cartItem.slug === itemSlug
          ? { ...cartItem, quantity: cartItem.quantity - 1 }
          : cartItem
      )
      .filter((cartItem) => cartItem.quantity > 0);

    saveCart(updatedCart);
  }

  function removeItem(itemSlug: string) {
    const updatedCart = cartItems.filter(
      (cartItem) => cartItem.slug !== itemSlug
    );

    saveCart(updatedCart);
  }

  function clearCart() {
    if (!confirm("¿Seguro que quieres vaciar el carrito?")) {
      return;
    }

    saveCart([]);
  }

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const hasInvalidItems = cartItems.some((item) => {
    const product = getProductFromCartItem(item, products);

    if (!product) return true;
    if (!product.isActive) return true;
    if (product.stock <= 0) return true;
    if (item.quantity > product.stock) return true;

    return false;
  });

  if (loadingProducts) {
    return (
      <div className="mt-10 rounded-2xl border p-8 text-center">
        <h2 className="text-2xl font-semibold">Cargando carrito...</h2>

        <p className="mt-3 text-gray-600">
          Estamos revisando el stock desde PostgreSQL.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-10 rounded-2xl border p-8 text-center">
        <h2 className="text-2xl font-semibold">No pudimos cargar el carrito</h2>

        <p className="mt-3 text-red-600">{error}</p>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="mt-10 rounded-2xl border p-10 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-3xl">
          🛒
        </div>

        <h2 className="mt-6 text-2xl font-semibold">Tu carrito está vacío</h2>

        <p className="mx-auto mt-3 max-w-md text-gray-600">
          Agrega unos lentes para continuar con tu compra.
        </p>

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
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

  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-4">
        {cartItems.map((item) => {
          const product = getProductFromCartItem(item, products);
          const productStock = product?.stock ?? 0;
          const isUnavailable =
            !product || !product.isActive || productStock <= 0;
          const lineTotal = item.price * item.quantity;

          return (
            <div key={item.slug} className="rounded-2xl border p-5">
              <div className="grid gap-5 md:grid-cols-[140px_1fr_auto]">
                <a
                  href={product ? `/product/${product.slug}` : "#"}
                  className="flex h-36 items-center justify-center overflow-hidden rounded-2xl bg-gray-100"
                >
                  {product?.mainImage?.imageUrl ? (
                    <img
                      src={product.mainImage.imageUrl}
                      alt={product.mainImage.altText || item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="px-4 text-center text-xs text-gray-500">
                      Imagen del producto
                    </span>
                  )}
                </a>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold">{item.name}</h2>

                    {isUnavailable && (
                      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                        No disponible
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-sm text-gray-600">
                    {item.lensOption}
                  </p>

                  {item.prescriptionMethod !== "No aplica" && (
                    <p className="text-sm text-gray-600">
                      {item.prescriptionMethod}
                    </p>
                  )}

                  <p className="mt-3 text-sm text-gray-500">
                    Stock disponible: {productStock}
                  </p>

                  {product && item.quantity > product.stock && (
                    <p className="mt-2 text-sm font-medium text-red-600">
                      La cantidad en tu carrito supera el stock disponible.
                    </p>
                  )}

                  {!product && (
                    <p className="mt-2 text-sm font-medium text-red-600">
                      No encontramos este producto en el catálogo.
                    </p>
                  )}
                </div>

                <div className="md:text-right">
                  <p className="font-semibold">{formatMoney(item.price)}</p>

                  <p className="mt-1 text-sm text-gray-500">
                    Total: {formatMoney(lineTotal)}
                  </p>

                  <div className="mt-4 flex items-center justify-start gap-3 md:justify-end">
                    <button
                      type="button"
                      onClick={() => decreaseQuantity(item.slug)}
                      className="flex h-9 w-9 items-center justify-center rounded-full border text-lg"
                    >
                      -
                    </button>

                    <span className="min-w-8 text-center font-medium">
                      {item.quantity}
                    </span>

                    <button
                      type="button"
                      onClick={() => increaseQuantity(item.slug)}
                      disabled={isUnavailable}
                      className="flex h-9 w-9 items-center justify-center rounded-full border text-lg disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.slug)}
                    className="mt-4 text-sm text-gray-500 underline hover:text-red-600"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        <div className="flex flex-col justify-between gap-3 sm:flex-row">
          <a href="/eyeglasses" className="text-sm text-gray-600 underline">
            Continuar comprando
          </a>

          <button
            type="button"
            onClick={clearCart}
            className="text-left text-sm text-gray-500 underline hover:text-red-600 sm:text-right"
          >
            Vaciar carrito
          </button>
        </div>
      </div>

      <aside className="h-fit rounded-2xl border p-6">
        <h2 className="text-2xl font-semibold">Resumen</h2>

        <p className="mt-2 text-sm text-gray-500">
          {totalItems} {totalItems === 1 ? "producto" : "productos"} en tu
          carrito
        </p>

        <div className="mt-6 space-y-4">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatMoney(subtotal)}</span>
          </div>

          <div className="flex justify-between text-gray-600">
            <span>Envío</span>
            <span>Se calcula después</span>
          </div>
        </div>

        <div className="mt-6 border-t pt-6">
          <div className="flex justify-between text-lg font-semibold">
            <span>Total estimado</span>
            <span>{formatMoney(subtotal)}</span>
          </div>
        </div>

        {hasInvalidItems ? (
          <div className="mt-6">
            <button
              disabled
              className="w-full cursor-not-allowed rounded-full bg-gray-300 px-6 py-3 text-center text-white"
            >
              Continuar al checkout
            </button>

            <p className="mt-3 text-sm text-red-600">
              Revisa tu carrito antes de continuar. Hay productos no disponibles
              o cantidades mayores al stock.
            </p>
          </div>
        ) : (
          <a
            href="/checkout"
            className="mt-6 block rounded-full bg-black px-6 py-3 text-center text-white"
          >
            Continuar al checkout
          </a>
        )}

        <p className="mt-4 text-center text-xs text-gray-500">
          Pago en pesos mexicanos. Tu pedido se confirmará antes del pago final.
        </p>
      </aside>
    </div>
  );
}

