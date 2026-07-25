"use client";

import { useEffect, useState } from "react";
import {
  CART_STORAGE_KEY,
  CART_UPDATED_EVENT,
  getCartCount,
} from "@/lib/cart";

export function useCartCount() {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    function syncCartCount() {
      setCartCount(getCartCount());
    }

    const timeoutId = window.setTimeout(syncCartCount, 0);

    function handleStorage(event: StorageEvent) {
      if (event.key === CART_STORAGE_KEY) {
        syncCartCount();
      }
    }

    window.addEventListener(CART_UPDATED_EVENT, syncCartCount);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener(CART_UPDATED_EVENT, syncCartCount);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return cartCount;
}
