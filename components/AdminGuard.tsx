"use client";

import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

type AdminGuardProps = {
  children: ReactNode;
};

export default function AdminGuard({ children }: AdminGuardProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="min-h-screen bg-white px-6 py-20 text-black">
        <section className="mx-auto max-w-3xl rounded-2xl border p-8 text-center">
          <h1 className="text-3xl font-bold">Área administrativa</h1>

          <p className="mt-4 text-gray-600">Verificando acceso...</p>
        </section>
      </main>
    );
  }

  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }

    return (
      <main className="min-h-screen bg-white px-6 py-20 text-black">
        <section className="mx-auto max-w-3xl rounded-2xl border p-8 text-center">
          <h1 className="text-3xl font-bold">Área administrativa</h1>

          <p className="mt-4 text-gray-600">Redirigiendo a iniciar sesión...</p>
        </section>
      </main>
    );
  }

  if (user.role !== "admin") {
    return (
      <main className="min-h-screen bg-white px-6 py-20 text-black">
        <section className="mx-auto max-w-3xl rounded-2xl border p-8 text-center">
          <h1 className="text-3xl font-bold">Acceso no autorizado</h1>

          <p className="mt-4 text-gray-600">
            Esta sección es solo para administradores.
          </p>

          <a
            href="/"
            className="mt-6 inline-block rounded-full bg-black px-6 py-3 text-white"
          >
            Regresar al inicio
          </a>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}

