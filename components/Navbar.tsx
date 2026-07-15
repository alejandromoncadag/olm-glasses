"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLikes } from "@/hooks/useLikes";
import { logout } from "@/lib/auth";

export default function Navbar() {
  const pathname = usePathname();

  if (pathname === "/tu-estilo") {
    return <QuizHeader />;
  }

  return <StoreNavbar />;
}

function QuizHeader() {
  function handleBack() {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    window.location.href = "/";
  }

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-white/95 backdrop-blur">
      <div className="mx-auto grid h-[72px] max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-5 sm:px-8">
        <button
          type="button"
          onClick={handleBack}
          className="justify-self-start rounded-full px-2 py-2 text-sm font-medium transition hover:bg-gray-100 sm:px-3"
          aria-label="Volver a la página anterior"
        >
          <span aria-hidden>←</span> Volver
        </button>

        <a
          href="/"
          className="text-lg font-bold tracking-[-0.04em] sm:text-xl"
        >
          Óptica OLM
        </a>

        <a
          href="/"
          className="flex h-10 w-10 items-center justify-center justify-self-end rounded-full text-2xl leading-none transition hover:bg-gray-100"
          aria-label="Cerrar quiz y volver al inicio"
        >
          <span aria-hidden>×</span>
        </a>
      </div>
    </header>
  );
}

function StoreNavbar() {
  const { user } = useAuth();
  const { likes } = useLikes();
  const [menuOpen, setMenuOpen] = useState(false);

  const isAdmin = user?.role === "admin";

  async function handleLogout() {
    await logout();
    setMenuOpen(false);
    window.location.href = "/";
  }



  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-white/95 text-black backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <a href="/" className="shrink-0 text-xl font-bold tracking-[-0.04em] sm:text-2xl">
          Óptica OLM
        </a>

        <div className="hidden items-center gap-4 text-xs font-medium text-gray-700 md:flex xl:gap-6 xl:text-sm">
          <a href="/eyeglasses" className="transition hover:text-black">
            Lentes ópticos
          </a>

          <a href="/sunglasses" className="transition hover:text-black">
            Lentes de sol
          </a>

          <a href="/tu-estilo" className="transition hover:text-black">
            Tu estilo
          </a>

          <a
            href="/lentes-de-contacto"
            className="transition hover:text-black"
          >
            Lentes de contacto
          </a>

          <a href="/eye-exam" className="transition hover:text-black">
            Examen de vista
          </a>

          <a href="/locations" className="transition hover:text-black">
            Tiendas
          </a>

          <a href="/order-status" className="transition hover:text-black">
            Consultar pedido
          </a>
        </div>

        <div className="flex items-center gap-1 text-sm font-medium sm:gap-2">
          <a
            href="/likes"
            className="relative flex h-10 items-center gap-2 rounded-full px-2 transition hover:bg-gray-100 sm:px-3"
            aria-label="Favoritos"
          >
            <HeartIcon filled={likes.length > 0} />
            <span className="hidden xl:inline">Favoritos</span>

            {likes.length > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1.5 text-[11px] text-white">
                {likes.length}
              </span>
            )}
          </a>

          <a
            href="/cart"
            className="flex h-10 items-center gap-2 rounded-full px-2 transition hover:bg-gray-100 sm:px-3"
            aria-label="Carrito"
          >
            <BagIcon />
            <span className="hidden xl:inline">Carrito</span>
          </a>

          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="flex h-10 items-center gap-2 rounded-full border border-black/20 px-1.5 pr-2.5 transition hover:border-black sm:pr-3"
                aria-label="Abrir menú de cuenta"
                aria-expanded={menuOpen}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
                  {user.fullName.charAt(0).toUpperCase()}
                </span>

                <span className="hidden xl:inline">
                  {user.fullName.split(" ")[0]}
                </span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-2xl border bg-white p-2 shadow-lg">
                  <a
                    href="/account"
                    className="block rounded-xl px-4 py-2 hover:bg-gray-100"
                  >
                    Mi cuenta
                  </a>

                  <a
                    href="/likes"
                    className="block rounded-xl px-4 py-2 hover:bg-gray-100"
                  >
                    Mis favoritos
                  </a>

                  <a
                    href="/order-status"
                    className="block rounded-xl px-4 py-2 hover:bg-gray-100"
                  >
                    Consultar pedido
                  </a>

                  <a
                    href="/eye-exam"
                    className="block rounded-xl px-4 py-2 hover:bg-gray-100"
                  >
                    Examen de vista
                  </a>

                  {isAdmin && (
                    <a
                      href="/admin"
                      className="block rounded-xl px-4 py-2 hover:bg-gray-100"
                    >
                      Admin
                    </a>
                  )}

                  <button
                    onClick={handleLogout}
                    className="block w-full rounded-xl px-4 py-2 text-left hover:bg-gray-100"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <a
              href="/login"
              className="flex h-10 items-center rounded-full bg-black px-4 text-sm text-white transition hover:bg-black/80"
            >
              <span className="sm:hidden">Cuenta</span>
              <span className="hidden sm:inline">Iniciar sesión</span>
            </a>
          )}
        </div>
      </nav>
    </header>
  );
}

function BagIcon() {
  return (
    <span
      className="relative block h-[17px] w-4 rounded-[3px] border-2 border-current"
      aria-hidden
    >
      <span className="absolute left-1/2 top-[-7px] h-[7px] w-2 -translate-x-1/2 rounded-t-full border-2 border-b-0 border-current" />
    </span>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
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
