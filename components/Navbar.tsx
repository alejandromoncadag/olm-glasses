"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLikes } from "@/hooks/useLikes";
import { useCartCount } from "@/hooks/useCartCount";

const storeNavItems = [
  { href: "/eyeglasses", label: "Ópticos" },
  { href: "/sunglasses", label: "Sol" },
  { href: "/deportivos", label: "Deportivos" },
  { href: "/clip-ons", label: "Clip-on" },
  { href: "/lentes-de-contacto", label: "Contactos" },
  { href: "/accessories", label: "Accesorios" },
  { href: "/tu-estilo", label: "Tu estilo" },
  { href: "/eye-exam", label: "Examen" },
  { href: "/locations", label: "Tiendas" },
  { href: "/order-status", label: "Pedido" },
];

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

        <Link
          href="/"
          className="text-lg font-bold tracking-[-0.04em] sm:text-xl"
        >
          Óptica OLM
        </Link>

        <Link
          href="/"
          className="flex h-10 w-10 items-center justify-center justify-self-end rounded-full text-2xl leading-none transition hover:bg-gray-100"
          aria-label="Cerrar quiz y volver al inicio"
        >
          <span aria-hidden>×</span>
        </Link>
      </div>
    </header>
  );
}

function StoreNavbar() {
  const { user, loading, logout } = useAuth();
  const { likes } = useLikes();
  const cartCount = useCartCount();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = user?.role === "admin";

  async function handleLogout() {
    await logout();
    setMenuOpen(false);
    setMobileMenuOpen(false);
    window.location.href = "/";
  }

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-white/95 text-black backdrop-blur">
      <div className="bg-[#2d1f1a] text-white">
        <div className="mx-auto grid h-10 max-w-7xl grid-cols-1 items-center gap-2 px-4 sm:grid-cols-[1fr_auto_1fr] sm:px-6">
          <p className="hidden truncate text-xs font-medium uppercase tracking-[0.12em] sm:block">
            Diseño premium, precios justos
          </p>

          <Link
            href="/"
            className="justify-self-center whitespace-nowrap text-sm font-bold uppercase tracking-[0.28em] sm:tracking-[0.3em]"
            aria-label="Óptica OLM, inicio"
          >
            Óptica OLM
          </Link>

          <p className="hidden justify-self-end whitespace-nowrap text-xs font-semibold uppercase tracking-[0.12em] sm:block">
            20% en tu primera compra
          </p>
        </div>
      </div>
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3 sm:px-6">

        <div className="hidden items-center gap-0 whitespace-nowrap text-[11px] font-medium text-gray-700 lg:flex xl:gap-1 xl:text-xs">
          {storeNavItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-full px-2 py-2 transition hover:bg-gray-100 hover:text-black xl:px-2.5"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-0.5 text-sm font-medium sm:gap-1">
          <a
            href="/search"
            className="flex h-10 items-center gap-2 whitespace-nowrap rounded-full px-2 transition hover:bg-gray-100 sm:px-2.5"
            aria-label="Buscar en Óptica OLM"
          >
            <SearchIcon />
            <span className="hidden xl:inline">Buscar</span>
          </a>

          <a
            href="/likes"
            className="relative flex h-10 items-center gap-2 whitespace-nowrap rounded-full px-2 transition hover:bg-gray-100 sm:px-2.5"
            aria-label={
              likes.length > 0
                ? `Favoritos, ${likes.length} ${likes.length === 1 ? "producto" : "productos"}`
                : "Favoritos"
            }
          >
            <span className="relative flex h-6 w-6 shrink-0 items-center justify-center">
              <HeartIcon filled={false} />

              {likes.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--brand-espresso)] px-1 text-[9px] font-semibold leading-none text-white ring-2 ring-white">
                  {likes.length > 99 ? "99+" : likes.length}
                </span>
              )}
            </span>
            <span className="hidden xl:inline">Favoritos</span>
          </a>

          <a
            href="/cart"
            className="relative flex h-10 items-center gap-2 whitespace-nowrap rounded-full px-2 transition hover:bg-gray-100 sm:px-2.5"
            aria-label={
              cartCount > 0
                ? `Carrito, ${cartCount} ${cartCount === 1 ? "producto" : "productos"}`
                : "Carrito"
            }
          >
            <span className="relative flex h-6 w-6 shrink-0 items-center justify-center">
              <BagIcon />

              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--brand-espresso)] px-1 text-[9px] font-semibold leading-none text-white ring-2 ring-white">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </span>
            <span className="hidden xl:inline">Carrito</span>
          </a>

          {loading ? (
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-gray-400"
              aria-label="Comprobando sesión"
            >
              <AccountIcon />
            </span>
          ) : user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen((open) => !open);
                  setMobileMenuOpen(false);
                }}
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
            <Link
              href="/login"
              className="flex h-10 items-center gap-2 whitespace-nowrap rounded-full px-2 text-sm text-black transition hover:bg-gray-100 sm:px-2.5"
              aria-label="Iniciar sesión"
            >
              <AccountIcon />
              <span className="hidden xl:inline">Cuenta</span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen((open) => !open);
              setMenuOpen(false);
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-gray-100 lg:hidden"
            aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            <MenuIcon open={mobileMenuOpen} />
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div
          id="mobile-navigation"
          className="border-t border-black/10 bg-white px-4 py-3 lg:hidden sm:px-6"
        >
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-1 sm:grid-cols-4">
            {storeNavItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="whitespace-nowrap rounded-xl px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-black"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

function AccountIcon() {
  return (
    <span
      className="relative block h-[18px] w-[18px] rounded-full border-2 border-current"
      aria-hidden
    >
      <span className="absolute left-1/2 top-[3px] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-current" />
      <span className="absolute bottom-[2px] left-1/2 h-1.5 w-2.5 -translate-x-1/2 rounded-t-full bg-current" />
    </span>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <span className="relative block h-4 w-5" aria-hidden>
      <span
        className={`absolute left-0 top-0.5 h-0.5 w-5 rounded-full bg-current transition ${
          open ? "translate-y-[6px] rotate-45" : ""
        }`}
      />
      <span
        className={`absolute left-0 top-[7px] h-0.5 w-5 rounded-full bg-current transition ${
          open ? "opacity-0" : ""
        }`}
      />
      <span
        className={`absolute bottom-0.5 left-0 h-0.5 w-5 rounded-full bg-current transition ${
          open ? "-translate-y-[6px] -rotate-45" : ""
        }`}
      />
    </span>
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

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="19"
      height="19"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}
