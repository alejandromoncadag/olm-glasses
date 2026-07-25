"use client";

import { useEffect } from "react";

export default function ClearCart() {
  useEffect(() => {
    localStorage.removeItem("olm-cart");
    localStorage.removeItem("olm-checkout-customer");
    window.dispatchEvent(new Event("olm-cart-updated"));
  }, []);

  return null;
}

