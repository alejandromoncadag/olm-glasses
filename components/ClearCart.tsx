"use client";

import { useEffect } from "react";
import { clearCart } from "@/lib/cart";

export default function ClearCart() {
  useEffect(() => {
    clearCart();
    localStorage.removeItem("olm-checkout-customer");
  }, []);

  return null;
}

