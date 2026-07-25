"use client";

import { useState } from "react";
import { readCart, writeCart, type CartItem } from "@/lib/cart";

type AddToCartButtonProps = {
  product: {
    slug: string;
    name: string;
    price: number;
  };
};

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const [added, setAdded] = useState(false);

  function handleAddToCart() {
    const currentCart = readCart();

    const existingItem = currentCart.find((item) => item.slug === product.slug);

    let updatedCart: CartItem[];

    if (existingItem) {
      updatedCart = currentCart.map((item) =>
        item.slug === product.slug
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      updatedCart = [
        ...currentCart,
        {
          slug: product.slug,
          name: product.name,
          price: product.price,
          quantity: 1,
          lensOption: "Producto",
          prescriptionMethod: "No aplica",
        },
      ];
    }

    writeCart(updatedCart);

    setAdded(true);
    window.location.href = "/checkout";
  }

  return (
    <button
      onClick={handleAddToCart}
      className="mt-8 w-full rounded-full bg-black px-8 py-4 text-white"
    >
      {added ? "Agregado al carrito" : "Agregar al carrito"}
    </button>
  );
}

