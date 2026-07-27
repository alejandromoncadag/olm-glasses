"use client";

import { useEffect } from "react";

import { useAuth } from "@/hooks/useAuth";
import {
  CART_UPDATED_EVENT,
  getCartStorageKey,
  readCart,
  setCartStorageOwner,
  writeCart,
  type CartItem,
} from "@/lib/cart";

function mergeCartItems(localItems: CartItem[], savedItems: CartItem[]) {
  const merged = [...savedItems];

  for (const localItem of localItems) {
    const existingIndex = merged.findIndex(
      (savedItem) => savedItem.slug === localItem.slug
    );

    if (existingIndex === -1) {
      merged.push(localItem);
      continue;
    }

    merged[existingIndex] = {
      ...merged[existingIndex],
      ...localItem,
      quantity: Math.max(
        merged[existingIndex].quantity,
        localItem.quantity
      ),
    };
  }

  return merged;
}

function parseCartResponse(value: unknown): CartItem[] {
  if (
    !value ||
    typeof value !== "object" ||
    !Array.isArray((value as { items?: unknown }).items)
  ) {
    return [];
  }

  return (value as { items: CartItem[] }).items;
}

export default function CartPersistence() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    setCartStorageOwner(
      user
        ? {
            id: user.id,
            role: user.role,
          }
        : null
    );

    if (user?.role !== "customer") return;

    let cancelled = false;
    let ready = false;
    let persistTimeoutId: number | null = null;

    async function saveCart() {
      try {
        await fetch("/api/account/cart", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ items: readCart() }),
        });
      } catch {
        // The local customer-scoped cart remains available if sync fails.
      }
    }

    async function loadAndMergeCart() {
      try {
        const response = await fetch("/api/account/cart", {
          cache: "no-store",
        });

        if (!response.ok || cancelled) {
          ready = true;
          return;
        }

        const savedItems = parseCartResponse(await response.json());

        if (cancelled) return;

        const mergedItems = mergeCartItems(readCart(), savedItems);
        writeCart(mergedItems);
        await saveCart();
      } catch {
        // Keep the local customer-scoped cart usable while offline.
      } finally {
        ready = true;
      }
    }

    function scheduleSave() {
      if (!ready || cancelled) return;

      if (persistTimeoutId !== null) {
        window.clearTimeout(persistTimeoutId);
      }

      persistTimeoutId = window.setTimeout(() => {
        void saveCart();
      }, 150);
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === getCartStorageKey()) {
        scheduleSave();
      }
    }

    window.addEventListener(CART_UPDATED_EVENT, scheduleSave);
    window.addEventListener("storage", handleStorage);
    void loadAndMergeCart();

    return () => {
      cancelled = true;

      if (persistTimeoutId !== null) {
        window.clearTimeout(persistTimeoutId);
      }

      window.removeEventListener(CART_UPDATED_EVENT, scheduleSave);
      window.removeEventListener("storage", handleStorage);
    };
  }, [loading, user]);

  return null;
}
