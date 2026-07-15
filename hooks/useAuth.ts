"use client";

import { useEffect, useState } from "react";
import {
  clearCurrentUser,
  getBackendAdminUser,
  getCurrentUser,
  storeCurrentUser,
  type User,
} from "@/lib/auth";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshUser() {
    setLoading(true);

    const localUser = getCurrentUser();

    if (localUser?.role === "admin") {
      const backendAdminUser = await getBackendAdminUser();

      if (backendAdminUser) {
        storeCurrentUser(backendAdminUser);
        setUser(backendAdminUser);
      } else {
        clearCurrentUser();
        setUser(null);
      }

      setLoading(false);
      return;
    }

    setUser(localUser);

    const backendAdminUser = await getBackendAdminUser();

    if (backendAdminUser) {
      storeCurrentUser(backendAdminUser);
      setUser(backendAdminUser);
    }

    setLoading(false);
  }

  useEffect(() => {
    refreshUser();

    function update() {
      refreshUser();
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
