"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

type AdminGuardProps = {
  children: React.ReactNode;
};

export default function AdminGuard({ children }: AdminGuardProps) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const isPublicAdminRoute = pathname === "/admin/login";

  useEffect(() => {
    if (isPublicAdminRoute || loading) {
      return;
    }

    if (!user) {
      const currentPath = window.location.pathname + window.location.search;
      const redirectUrl = `/admin/login?redirect=${encodeURIComponent(currentPath)}`;

      window.location.href = redirectUrl;
    }
  }, [isPublicAdminRoute, user, loading]);

  if (isPublicAdminRoute) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <p className="text-sm text-neutral-600">Verificando acceso...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <p className="text-sm text-neutral-600">Redirigiendo al login...</p>
      </main>
    );
  }

  if (user.role !== "admin") {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm font-semibold text-red-700">
            Acceso denegado
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-neutral-950">
            Esta página es solo para administradores.
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            Inicia sesión con una cuenta de administrador para continuar.
          </p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}

