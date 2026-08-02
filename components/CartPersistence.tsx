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

function mergeLegacyCartItems(localItems: CartItem[], savedItems: CartItem[]) {
  const merged = [...savedItems];
  for (const localItem of localItems) {
    const existing = merged.findIndex((item) => item.slug === localItem.slug);
    if (existing < 0) merged.push(localItem);
    else merged[existing] = {
      ...merged[existing],
      ...localItem,
      quantity: Math.max(merged[existing].quantity, localItem.quantity),
    };
  }
  return merged;
}

function parseLegacyCart(value: unknown): CartItem[] {
  if (!value || typeof value !== "object" || !Array.isArray((value as { items?: unknown }).items)) return [];
  return (value as { items: CartItem[] }).items;
}

function announceAuthoritativeCount(count: number) {
  window.dispatchEvent(
    new CustomEvent(CART_UPDATED_EVENT, {
      detail: { authoritative: true, count },
    })
  );
}

export default function CartPersistence() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user?.role === "admin") {
      announceAuthoritativeCount(0);
      return;
    }

    let cancelled = false;
    let legacyCleanup: (() => void) | null = null;

    async function initializeLegacyPersistence() {
      setCartStorageOwner(
        user ? { id: user.id, role: user.role } : null
      );
      if (user?.role !== "customer") return;

      let ready = false;
      let persistTimeoutId: number | null = null;
      async function saveCart() {
        try {
          await fetch("/api/account/cart", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: readCart() }),
          });
        } catch {
          // Legacy browser persistence remains available if sync fails.
        }
      }
      try {
        const response = await fetch("/api/account/cart", { cache: "no-store" });
        if (response.ok && !cancelled) {
          const saved = parseLegacyCart(await response.json());
          writeCart(mergeLegacyCartItems(readCart(), saved));
          await saveCart();
        }
      } finally {
        ready = true;
      }
      function scheduleSave() {
        if (!ready || cancelled) return;
        if (persistTimeoutId !== null) window.clearTimeout(persistTimeoutId);
        persistTimeoutId = window.setTimeout(() => void saveCart(), 150);
      }
      function handleStorage(event: StorageEvent) {
        if (event.key === getCartStorageKey()) scheduleSave();
      }
      window.addEventListener(CART_UPDATED_EVENT, scheduleSave);
      window.addEventListener("storage", handleStorage);
      legacyCleanup = () => {
        if (persistTimeoutId !== null) window.clearTimeout(persistTimeoutId);
        window.removeEventListener(CART_UPDATED_EVENT, scheduleSave);
        window.removeEventListener("storage", handleStorage);
      };
    }

    async function initialize() {
      try {
        const response = await fetch("/api/commerce/cart", { cache: "no-store" });
        const payload = (await response.json().catch(() => ({}))) as {
          mode?: "legacy" | "shadow" | "optica";
          cart?: { itemCount?: number };
        };
        if (response.ok && (payload.mode === "legacy" || payload.mode === "shadow")) {
          await initializeLegacyPersistence();
          return;
        }
        if (!response.ok || payload.mode !== "optica") {
          announceAuthoritativeCount(0);
          return;
        }

        if (user?.role === "customer") {
          const mergeResponse = await fetch("/api/commerce/merge", { method: "POST" });
          if (mergeResponse.ok) {
            window.dispatchEvent(new Event("olm-commerce-merged"));
          }
          const refreshed = await fetch("/api/commerce/cart", { cache: "no-store" });
          const refreshedPayload = (await refreshed.json().catch(() => ({}))) as {
            cart?: { itemCount?: number };
          };
          if (!cancelled && refreshed.ok) {
            announceAuthoritativeCount(Number(refreshedPayload.cart?.itemCount || 0));
          }
          return;
        }

        if (!cancelled) announceAuthoritativeCount(Number(payload.cart?.itemCount || 0));
      } catch {
        // Never mix the legacy browser cart into an authoritative cart after
        // an authoritative request failure. The cart page will show the error.
        announceAuthoritativeCount(0);
      }
    }

    void initialize();
    return () => {
      cancelled = true;
      legacyCleanup?.();
    };
  }, [loading, user]);

  return null;
}
