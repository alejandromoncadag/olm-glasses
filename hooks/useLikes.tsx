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

type LikesContextValue = {
  likes: LikedItem[];
  loaded: boolean;
  toggleLike: (slug: string) => Promise<void>;
  removeLike: (slug: string) => Promise<void>;
  clearLikes: () => Promise<void>;
};

const LikesContext = createContext<LikesContextValue | null>(null);

function parseFavorites(data: unknown) {
  if (
    !data ||
    typeof data !== "object" ||
    !Array.isArray((data as { favorites?: unknown }).favorites)
  ) {
    return [];
  }

  return (data as { favorites: Array<{ slug?: unknown; likedAt?: unknown }> })
    .favorites.map((favorite) => ({
      slug: String(favorite.slug || "").trim(),
      likedAt: String(favorite.likedAt || new Date().toISOString()),
    }))
    .filter((favorite) => favorite.slug);
}

export function LikesProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [likes, setLikes] = useState<LikedItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const customerSignedIn = user?.role === "customer";
  const adminSignedIn = user?.role === "admin";

  const loadLikes = useCallback(async () => {
    if (authLoading) return;

    if (adminSignedIn) {
      setLikes([]);
      setLoaded(true);
      return;
    }

    if (!customerSignedIn) {
      setLikes(getLocalLikes());
      setLoaded(true);
      return;
    }

    const localLikes = getLocalLikes();
    const response = await fetch("/api/account/favorites", {
      method: localLikes.length > 0 ? "POST" : "GET",
      headers:
        localLikes.length > 0
          ? {
              "Content-Type": "application/json",
            }
          : undefined,
      body:
        localLikes.length > 0
          ? JSON.stringify({ slugs: localLikes.map((like) => like.slug) })
          : undefined,
    });

    if (!response.ok) {
      setLikes(localLikes);
      setLoaded(true);
      return;
    }

    const nextLikes = parseFavorites(await response.json());
    setLikes(nextLikes);
    setLoaded(true);

    if (localLikes.length > 0) {
      replaceLocalLikes([]);
    }
  }, [adminSignedIn, authLoading, customerSignedIn]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadLikes();
    }, 0);

    function syncGuestLikes() {
      if (adminSignedIn) {
        setLikes([]);
        setLoaded(true);
      } else if (!customerSignedIn) {
        setLikes(getLocalLikes());
        setLoaded(true);
      }
    }

    window.addEventListener("olm-likes-change", syncGuestLikes);
    window.addEventListener("storage", syncGuestLikes);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("olm-likes-change", syncGuestLikes);
      window.removeEventListener("storage", syncGuestLikes);
    };
  }, [adminSignedIn, customerSignedIn, loadLikes]);

  const toggleLike = useCallback(
    async (slug: string) => {
      if (adminSignedIn) return;

      const existing = likes.some((like) => like.slug === slug);
      const previousLikes = likes;
      const nextLikes = existing
        ? likes.filter((like) => like.slug !== slug)
        : [{ slug, likedAt: new Date().toISOString() }, ...likes];

      setLikes(nextLikes);

      if (!customerSignedIn) {
        replaceLocalLikes(nextLikes);
        return;
      }

      const response = await fetch(
        existing
          ? `/api/account/favorites?slug=${encodeURIComponent(slug)}`
          : "/api/account/favorites",
        {
          method: existing ? "DELETE" : "POST",
          headers: existing
            ? undefined
            : {
                "Content-Type": "application/json",
              },
          body: existing ? undefined : JSON.stringify({ slug }),
        }
      );

      if (!response.ok) {
        setLikes(previousLikes);
        return;
      }

      setLikes(parseFavorites(await response.json()));
    },
    [adminSignedIn, customerSignedIn, likes]
  );

  const removeLike = useCallback(
    async (slug: string) => {
      if (!likes.some((like) => like.slug === slug)) return;
      await toggleLike(slug);
    },
    [likes, toggleLike]
  );

  const clearLikes = useCallback(async () => {
    if (adminSignedIn) return;

    const previousLikes = likes;
    setLikes([]);

    if (!customerSignedIn) {
      replaceLocalLikes([]);
      return;
    }

    const response = await fetch("/api/account/favorites", {
      method: "DELETE",
    });

    if (!response.ok) {
      setLikes(previousLikes);
    }
  }, [adminSignedIn, customerSignedIn, likes]);

  const value = useMemo(
    () => ({
      likes,
      loaded,
      toggleLike,
      removeLike,
      clearLikes,
    }),
    [clearLikes, likes, loaded, removeLike, toggleLike]
  );

  return (
    <LikesContext.Provider value={value}>{children}</LikesContext.Provider>
  );
}

export function useLikes() {
  const context = useContext(LikesContext);

  if (!context) {
    throw new Error("useLikes must be used inside LikesProvider");
  }

  return context;
}
