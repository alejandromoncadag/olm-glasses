"use client";

import { useEffect, useState } from "react";
import { getCurrentUser, type User } from "@/lib/auth";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getCurrentUser());
    setLoading(false);

    function update() {
      setUser(getCurrentUser());
    }

    window.addEventListener("olm-auth-change", update);
    window.addEventListener("storage", update);

    return () => {
      window.removeEventListener("olm-auth-change", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  return { user, loading };
}
