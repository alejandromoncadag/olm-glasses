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

  // Guest favorites last only for the current tab. Signed-in favorites are
  // stored per customer in PostgreSQL by the account API.
  localStorage.removeItem(STORAGE_KEY);
  return safeParse<LikedItem[]>(sessionStorage.getItem(STORAGE_KEY), []);
}

export function replaceLikes(likes: LikedItem[]) {
  if (typeof window === "undefined") return;

  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(likes));
  window.dispatchEvent(new Event("olm-likes-change"));
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

  replaceLikes(updated);
}

export function removeLike(slug: string) {
  const updated = getLikes().filter((item) => item.slug !== slug);
  replaceLikes(updated);
}

export function clearLikes() {
  replaceLikes([]);
}
