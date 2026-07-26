"use client";

import { useState } from "react";
import { addSimpleProductToCart } from "@/lib/cart";

type ApiProduct = {
  slug: string;
  name: string;
  price: number;
  stock: number;
  type: "accessory" | "contact_lenses";
  isActive: boolean;
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

      const response = await fetch(`/api/products/${encodeURIComponent(slug)}`);

      if (!response.ok) {
        throw new Error("Product not found");
      }

      const data = (await response.json()) as { product?: ApiProduct };
      const product = data.product;

      if (
        !product ||
        !product.isActive ||
        product.stock <= 0 ||
        (product.type !== "accessory" &&
          product.type !== "contact_lenses")
      ) {
        alert("Este producto no está disponible.");
        return;
      }

      if (!addSimpleProductToCart(product)) {
        alert("No hay más piezas disponibles de este producto.");
        return;
      }

      window.location.href = "/cart";
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
