"use client";

import { useState } from "react";

type CartItem = {
  slug: string;
  name: string;
  price: number;
  quantity: number;
};

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
    const currentCart: CartItem[] = JSON.parse(
      localStorage.getItem("olm-cart") || "[]"
    );

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
        },
      ];
    }

    localStorage.setItem("olm-cart", JSON.stringify(updatedCart));

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 1500);
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

