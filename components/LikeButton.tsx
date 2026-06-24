"use client";

import { useEffect, useState } from "react";
import { isLiked, toggleLike } from "@/lib/likes";

type LikeButtonProps = {
  slug: string;
  size?: "sm" | "md" | "lg";
  variant?: "icon" | "full";
};

export default function LikeButton({
  slug,
  size = "md",
  variant = "icon",
}: LikeButtonProps) {
  const [liked, setLiked] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLiked(isLiked(slug));
    setMounted(true);

    function sync() {
      setLiked(isLiked(slug));
    }

    window.addEventListener("olm-likes-change", sync);
    return () => window.removeEventListener("olm-likes-change", sync);
  }, [slug]);

  function handleClick(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    toggleLike(slug);
  }

  const dimensions = size === "sm" ? 16 : size === "lg" ? 22 : 18;

  if (variant === "full") {
    return (
      <button
        onClick={handleClick}
        className={`flex items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm font-medium transition ${
          liked
            ? "border-red-500 bg-red-50 text-red-600"
            : "border-black hover:bg-gray-50"
        }`}
        aria-pressed={liked}
        aria-label={liked ? "Quitar de favoritos" : "Agregar a favoritos"}
      >
        <Heart filled={mounted && liked} size={dimensions} />
        {liked ? "Guardado en favoritos" : "Agregar a favoritos"}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`flex h-9 w-9 items-center justify-center rounded-full border bg-white shadow-sm transition ${
        liked
          ? "border-red-500 text-red-500"
          : "border-gray-200 text-gray-700 hover:border-black"
      }`}
      aria-pressed={liked}
      aria-label={liked ? "Quitar de favoritos" : "Agregar a favoritos"}
    >
      <Heart filled={mounted && liked} size={dimensions} />
    </button>
  );
}

function Heart({ filled, size }: { filled: boolean; size: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
