"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLikes } from "@/hooks/useLikes";
import { logout } from "@/lib/auth";

export default function Navbar() {
  const { user } = useAuth();
  const { likes } = useLikes();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    setMenuOpen(false);
    window.location.href = "/";
  }

  return (
    <header className="border-b bg-white text-black">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <a href="/" className="text-2xl font-bold">
          Óptica OLM
        </a>

        <div className="hidden items-center gap-7 text-sm font-medium md:flex">
          <a href="/eyeglasses" className="hover:underline">
            Lentes ópticos
          </a>
          <a href="/sunglasses" className="hover:underline">
            Lentes de sol
          </a>
          <a href="/eye-exam" className="hover:underline">
            Examen de vista
          </a>
          <a href="/locations" className="hover:underline">
            Tiendas
          </a>
        </div>

        <div className="flex items-center gap-5 text-sm font-medium">
          <a
            href="/likes"
            className="relative flex items-center gap-1.5 hover:underline"
            aria-label="Favoritos"
          >
            <HeartIcon filled={likes.length > 0} />
            <span className="hidden sm:inline">Favoritos</span>
            {likes.length > 0 && (
              <span className="ml-1 rounded-full bg-black px-2 py-0.5 text-xs text-white">
                {likes.length}
              </span>
            )}
          </a>

          <a href="/cart" className="hover:underline">
            Carrito
          </a>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((open) => !open)}
                className="flex items-center gap-2 rounded-full border border-black px-3 py-1.5"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-xs text-white">
                  {user.fullName.charAt(0).toUpperCase()}
                </span>
                <span className="hidden sm:inline">
                  {user.fullName.split(" ")[0]}
                </span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border bg-white p-2 shadow-lg">
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
                    href="/eye-exam"
                    className="block rounded-xl px-4 py-2 hover:bg-gray-100"
                  >
                    Examen de vista
                  </a>
                  <a
                    href="/admin/orders"
                    className="block rounded-xl px-4 py-2 hover:bg-gray-100"
                  >
                    Admin
                  </a>
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
              className="rounded-full bg-black px-4 py-2 text-white"
            >
              Iniciar sesión
            </a>
          )}
        </div>
      </nav>
    </header>
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
