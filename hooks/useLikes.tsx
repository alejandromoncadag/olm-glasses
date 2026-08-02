"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "@/hooks/useAuth";
import {
  getLikes as getLocalLikes,
  replaceLikes as replaceLocalLikes,
  type LikedItem,
} from "@/lib/likes";

type LikesMode = "legacy" | "shadow" | "optica";

type LikesContextValue = {
  likes: LikedItem[];
  loaded: boolean;
  mode: LikesMode;
  toggleLike: (slug: string) => Promise<void>;
  removeLike: (slug: string) => Promise<void>;
  clearLikes: () => Promise<void>;
};

const LikesContext = createContext<LikesContextValue | null>(null);

function parseLegacyFavorites(data: unknown) {
  if (!data || typeof data !== "object" || !Array.isArray((data as { favorites?: unknown }).favorites)) return [];
  return (data as { favorites: Array<{ slug?: unknown; likedAt?: unknown }> }).favorites
    .map((favorite) => ({
      slug: String(favorite.slug || "").trim(),
      likedAt: String(favorite.likedAt || new Date().toISOString()),
      source: "legacy" as const,
    }))
    .filter((favorite) => favorite.slug);
}

function parseAuthoritativeFavorites(data: unknown): LikedItem[] {
  if (!data || typeof data !== "object" || !Array.isArray((data as { favorites?: unknown }).favorites)) return [];
  return (data as { favorites: Array<Record<string, unknown>> }).favorites
    .map((favorite) => ({
      slug: String(favorite.slug || "").trim(),
      likedAt: String(favorite.likedAt || new Date().toISOString()),
      source: "opticaolm" as const,
      productId: String(favorite.productId || "").trim(),
      sku: String(favorite.sku || "").trim(),
      name: String(favorite.name || "Producto").trim(),
      available: favorite.available === true,
      unavailableReason: favorite.unavailableReason ? String(favorite.unavailableReason) : null,
      description: favorite.description ? String(favorite.description) : null,
      category: favorite.category ? String(favorite.category) : null,
      price: favorite.price === null || favorite.price === undefined ? null : String(favorite.price),
      currency: favorite.currency ? String(favorite.currency) : null,
      image:
        favorite.image && typeof favorite.image === "object"
          ? {
              url: String((favorite.image as { url?: unknown }).url || ""),
              altText: String((favorite.image as { altText?: unknown }).altText || favorite.name || "Producto"),
            }
          : null,
    }))
    .filter((favorite) => favorite.slug && favorite.productId);
}

export function LikesProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [likes, setLikes] = useState<LikedItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [mode, setMode] = useState<LikesMode>("legacy");
  const customerSignedIn = user?.role === "customer";
  const adminSignedIn = user?.role === "admin";

  const loadLegacyLikes = useCallback(async () => {
    if (!customerSignedIn) {
      const local = getLocalLikes().map((like) => ({ ...like, source: "legacy" as const }));
      setLikes(local);
      return;
    }
    const localLikes = getLocalLikes();
    const response = await fetch("/api/account/favorites", {
      method: localLikes.length > 0 ? "POST" : "GET",
      headers: localLikes.length > 0 ? { "Content-Type": "application/json" } : undefined,
      body: localLikes.length > 0 ? JSON.stringify({ slugs: localLikes.map((like) => like.slug) }) : undefined,
    });
    if (!response.ok) {
      setLikes(localLikes.map((like) => ({ ...like, source: "legacy" as const })));
      return;
    }
    setLikes(parseLegacyFavorites(await response.json()));
    if (localLikes.length > 0) replaceLocalLikes([]);
  }, [customerSignedIn]);

  const loadLikes = useCallback(async () => {
    if (authLoading) return;
    if (adminSignedIn) {
      setLikes([]);
      setLoaded(true);
      return;
    }
    try {
      const response = await fetch("/api/commerce/favorites", { cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as {
        mode?: LikesMode;
        favorites?: unknown;
      };
      if (!response.ok) {
        setLikes([]);
        setLoaded(true);
        return;
      }
      if (payload.mode === "optica") {
        setMode("optica");
        setLikes(parseAuthoritativeFavorites(payload.favorites));
        setLoaded(true);
        return;
      }
      setMode(payload.mode === "shadow" ? "shadow" : "legacy");
      await loadLegacyLikes();
    } finally {
      setLoaded(true);
    }
  }, [adminSignedIn, authLoading, loadLegacyLikes]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadLikes(), 0);
    function reloadAfterMerge() {
      void loadLikes();
    }
    function syncLegacyGuestLikes() {
      if ((mode === "legacy" || mode === "shadow") && !customerSignedIn && !adminSignedIn) {
        setLikes(getLocalLikes().map((like) => ({ ...like, source: "legacy" as const })));
      }
    }
    window.addEventListener("olm-commerce-merged", reloadAfterMerge);
    window.addEventListener("olm-likes-change", syncLegacyGuestLikes);
    window.addEventListener("storage", syncLegacyGuestLikes);
    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("olm-commerce-merged", reloadAfterMerge);
      window.removeEventListener("olm-likes-change", syncLegacyGuestLikes);
      window.removeEventListener("storage", syncLegacyGuestLikes);
    };
  }, [adminSignedIn, customerSignedIn, loadLikes, mode]);

  const toggleLike = useCallback(async (slug: string) => {
    if (adminSignedIn) return;
    const existing = likes.find((like) => like.slug === slug);
    if (mode === "optica") {
      let productId = existing?.productId;
      if (!productId) {
        const productResponse = await fetch(`/api/catalog/products/${encodeURIComponent(slug)}`, { cache: "no-store" });
        const productPayload = (await productResponse.json().catch(() => ({}))) as {
          product?: { productId?: string; source?: string; favoritable?: boolean };
        };
        if (!productResponse.ok || productPayload.product?.source !== "opticaolm" || !productPayload.product.favoritable || !productPayload.product.productId) return;
        productId = productPayload.product.productId;
      }
      const response = await fetch(`/api/commerce/favorites/${encodeURIComponent(productId)}`, {
        method: existing ? "DELETE" : "PUT",
      });
      const payload = (await response.json().catch(() => ({}))) as { favorites?: unknown };
      if (response.ok) setLikes(parseAuthoritativeFavorites(payload.favorites));
      return;
    }

    const previous = likes;
    const next = existing
      ? likes.filter((like) => like.slug !== slug)
      : [{ slug, likedAt: new Date().toISOString(), source: "legacy" as const }, ...likes];
    setLikes(next);
    if (!customerSignedIn) {
      replaceLocalLikes(next);
      return;
    }
    const response = await fetch(existing ? `/api/account/favorites?slug=${encodeURIComponent(slug)}` : "/api/account/favorites", {
      method: existing ? "DELETE" : "POST",
      headers: existing ? undefined : { "Content-Type": "application/json" },
      body: existing ? undefined : JSON.stringify({ slug }),
    });
    if (!response.ok) setLikes(previous);
    else setLikes(parseLegacyFavorites(await response.json()));
  }, [adminSignedIn, customerSignedIn, likes, mode]);

  const removeLike = useCallback(async (slug: string) => {
    if (likes.some((like) => like.slug === slug)) await toggleLike(slug);
  }, [likes, toggleLike]);

  const clearLikes = useCallback(async () => {
    if (adminSignedIn) return;
    const previous = likes;
    setLikes([]);
    if (mode === "optica") {
      const response = await fetch("/api/commerce/favorites", { method: "DELETE" });
      const payload = (await response.json().catch(() => ({}))) as { favorites?: unknown };
      if (response.ok) setLikes(parseAuthoritativeFavorites(payload.favorites));
      else setLikes(previous);
      return;
    }
    if (!customerSignedIn) {
      replaceLocalLikes([]);
      return;
    }
    const response = await fetch("/api/account/favorites", { method: "DELETE" });
    if (!response.ok) setLikes(previous);
  }, [adminSignedIn, customerSignedIn, likes, mode]);

  const value = useMemo(() => ({ likes, loaded, mode, toggleLike, removeLike, clearLikes }), [clearLikes, likes, loaded, mode, removeLike, toggleLike]);
  return <LikesContext.Provider value={value}>{children}</LikesContext.Provider>;
}

export function useLikes() {
  const context = useContext(LikesContext);
  if (!context) throw new Error("useLikes must be used inside LikesProvider");
  return context;
}
