"use client";

import { useEffect, useState } from "react";
import {
  CART_UPDATED_EVENT,
  getCartCount,
  getCartStorageKey,
} from "@/lib/cart";
import { useAuth } from "@/hooks/useAuth";

export function useCartCount() {
  const { user, loading } = useAuth();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    function syncCartCount(event?: Event) {
      const authoritativeCount =
        event instanceof CustomEvent && event.detail?.authoritative === true
          ? Number(event.detail.count)
          : null;
      if (authoritativeCount !== null && Number.isFinite(authoritativeCount)) {
        setCartCount(loading || user?.role === "admin" ? 0 : authoritativeCount);
        return;
      }
      setCartCount(
        loading || user?.role === "admin" ? 0 : getCartCount()
      );
    }

    const timeoutId = window.setTimeout(syncCartCount, 0);

    function handleStorage(event: StorageEvent) {
      if (event.key === getCartStorageKey()) {
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
  }, [loading, user]);

  return cartCount;
}
