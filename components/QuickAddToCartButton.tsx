"use client";

import { useState } from "react";
import { addSimpleProductToCart, CART_UPDATED_EVENT } from "@/lib/cart";

type ApiProduct = {
  slug: string;
  name: string;
  price: number;
  stock: number;
  type: "eyeglasses" | "sunglasses" | "accessory" | "contact_lenses";
  isActive: boolean;
  productId?: string | null;
  source?: "legacy" | "opticaolm";
  purchasableOnline?: boolean;
};

type QuickAddToCartButtonProps = {
  slug: string;
  className?: string;
  label?: string;
};

export default function QuickAddToCartButton({
  slug,
  className = "",
  label = "Agregar al carrito",
}: QuickAddToCartButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleAddToCart() {
    try {
      setLoading(true);

      const response = await fetch(`/api/catalog/products/${encodeURIComponent(slug)}`);

      if (!response.ok) {
        throw new Error("Product not found");
      }

      const data = (await response.json()) as { product?: ApiProduct };
      const product = data.product;

      if (!product || !product.isActive || product.stock <= 0) {
        alert("Este producto no está disponible.");
        return;
      }

      if (product.source === "opticaolm") {
        if (!product.purchasableOnline || !product.productId) {
          alert("Este producto todavía no está habilitado para compra en línea.");
          return;
        }
        const cartResponse = await fetch("/api/commerce/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product.productId, quantity: 1 }),
        });
        if (!cartResponse.ok) {
          const errorPayload = (await cartResponse.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(errorPayload.error || "Authoritative cart rejected the item");
        }
        const cartPayload = (await cartResponse.json()) as {
          mode?: string;
          cart?: { itemCount?: number };
        };
        if (cartPayload.mode !== "optica") {
          throw new Error("Authoritative cart is not active");
        }
        window.dispatchEvent(
          new CustomEvent(CART_UPDATED_EVENT, {
            detail: {
              authoritative: true,
              count: Number(cartPayload.cart?.itemCount || 0),
            },
          })
        );
        const returnTo = `${window.location.pathname}${window.location.search}`;
        window.location.href = `/cart?returnTo=${encodeURIComponent(returnTo)}`;
        return;
      }

      if (!addSimpleProductToCart(product)) {
        alert("No hay más piezas disponibles de este producto.");
        return;
      }

      const returnTo = `${window.location.pathname}${window.location.search}`;
      window.location.href = `/cart?returnTo=${encodeURIComponent(returnTo)}`;
    } catch (error) {
      console.error(error);
      alert("No pudimos agregar el producto. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleAddToCart}
      disabled={loading}
      className={`inline-flex h-11 items-center justify-center rounded-full bg-[var(--brand-espresso)] px-5 text-sm font-semibold text-white transition hover:bg-[#1f1511] disabled:cursor-wait disabled:opacity-60 ${className}`}
    >
      {loading ? "Agregando…" : label}
    </button>
  );
}
