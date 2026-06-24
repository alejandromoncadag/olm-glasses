"use client";

import { useEffect, useState } from "react";
import { getLikes, type LikedItem } from "@/lib/likes";

export function useLikes() {
  const [likes, setLikes] = useState<LikedItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLikes(getLikes());
    setLoaded(true);

    function update() {
      setLikes(getLikes());
    }

    window.addEventListener("olm-likes-change", update);
    window.addEventListener("storage", update);

    return () => {
      window.removeEventListener("olm-likes-change", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  return { likes, loaded };
}
