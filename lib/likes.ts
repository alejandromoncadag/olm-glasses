"use client";

export type LikedItem = {
  slug: string;
  likedAt: string;
};

const STORAGE_KEY = "olm-likes";

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function getLikes(): LikedItem[] {
  if (typeof window === "undefined") return [];
  return safeParse<LikedItem[]>(localStorage.getItem(STORAGE_KEY), []);
}

export function isLiked(slug: string): boolean {
  return getLikes().some((item) => item.slug === slug);
}

export function toggleLike(slug: string) {
  const likes = getLikes();
  const existing = likes.find((item) => item.slug === slug);

  const updated = existing
    ? likes.filter((item) => item.slug !== slug)
    : [...likes, { slug, likedAt: new Date().toISOString() }];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event("olm-likes-change"));
}

export function removeLike(slug: string) {
  const updated = getLikes().filter((item) => item.slug !== slug);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event("olm-likes-change"));
}

export function clearLikes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  window.dispatchEvent(new Event("olm-likes-change"));
}
