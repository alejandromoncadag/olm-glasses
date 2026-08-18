"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import CheckoutFlow from "@/components/CheckoutFlow";

export default function CheckoutEntry() {
  const { user, loading } = useAuth();
  const [guest, setGuest] = useState(false);

  if (loading) return <p className="rounded-2xl border border-[#d9cfc8] p-6 text-sm text-stone-600">Cargando checkout…</p>;
  if (user || guest) return <CheckoutFlow />;

  return <section className="mx-auto max-w-xl border border-[#d9cfc8] bg-[#faf8f5] p-7 text-center sm:p-10">
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#765b50]">Checkout</p>
    <h2 className="mt-3 font-[Georgia,'Times_New_Roman',serif] text-3xl text-[#2d1f1a]">¿Cómo quieres continuar?</h2>
    <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-stone-600">Puedes iniciar sesión para usar tus datos guardados o continuar como invitado, sin crear una cuenta.</p>
    <div className="mt-7 grid gap-3 sm:grid-cols-2">
      <Link href="/login?redirect_url=%2Fcheckout" className="bg-[#2d1f1a] px-5 py-4 text-sm font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#1f1511]">Iniciar sesión</Link>
      <button type="button" onClick={() => setGuest(true)} className="border border-[#2d1f1a] px-5 py-4 text-sm font-semibold uppercase tracking-[0.12em] text-[#2d1f1a] transition hover:bg-white">Continuar como invitado</button>
    </div>
  </section>;
}
