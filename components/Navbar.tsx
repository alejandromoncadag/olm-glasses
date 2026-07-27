"use client";

import { useEffect, useMemo, useState } from "react";
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

type SearchProduct = {
  slug: string;
  name: string;
  category: string;
  description: string;
  price: number;
  isActive: boolean;
};

function normalizeSearchValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

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
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const { likes } = useLikes();
  const cartCount = useCartCount();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchProducts, setSearchProducts] = useState<SearchProduct[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const isAdmin = user?.role === "admin";
  const isAdminArea = pathname.startsWith("/admin");
  const utilityControlClass =
    "group relative flex h-11 items-center gap-2 whitespace-nowrap rounded-full px-2 text-[13px] font-medium text-[#2d1f1a] transition duration-200 hover:bg-[#f4efe9] hover:text-[var(--brand-espresso)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-espresso)] sm:px-2.5";

  useEffect(() => {
    if (!searchOpen || searchProducts.length > 0 || searchLoading) return;

    async function loadSearchProducts() {
      try {
        setSearchLoading(true);
        const response = await fetch("/api/products");
        if (!response.ok) return;
        const data = (await response.json()) as { products: SearchProduct[] };
        setSearchProducts(
          data.products.filter((product) => product.isActive)
        );
      } finally {
        setSearchLoading(false);
      }
    }

    void loadSearchProducts();
  }, [searchLoading, searchOpen, searchProducts.length]);

  const searchMatches = useMemo(() => {
    const normalizedQuery = normalizeSearchValue(searchQuery.trim());
    if (!normalizedQuery) return [];

    return searchProducts
      .filter((product) =>
        normalizeSearchValue(
          `${product.name} ${product.category} ${product.description}`
        ).includes(normalizedQuery)
      )
      .slice(0, 6);
  }, [searchProducts, searchQuery]);

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
        <div
          className={
            isAdminArea
              ? "hidden"
              : "hidden items-center gap-0 whitespace-nowrap text-[11px] font-medium text-gray-700 lg:flex xl:gap-1 xl:text-xs"
          }
        >
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
          <button
            type="button"
            onClick={() => {
              setSearchOpen((open) => !open);
              setMenuOpen(false);
              setMobileMenuOpen(false);
            }}
            className={isAdminArea ? "hidden" : utilityControlClass}
            aria-label="Buscar en Óptica OLM"
            aria-expanded={searchOpen}
            aria-controls="navbar-search-panel"
          >
            <SearchIcon />
            <span className="hidden xl:inline">Buscar</span>
          </button>

          <a
            href="/likes"
            className={isAdminArea ? "hidden" : utilityControlClass}
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
            className={isAdminArea ? "hidden" : utilityControlClass}
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
              className={`${utilityControlClass} text-gray-400`}
              aria-label="Comprobando sesión"
            >
              <AccountIcon />
              <span className="hidden xl:inline">Cuenta</span>
            </span>
          ) : user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen((open) => !open);
                  setMobileMenuOpen(false);
                }}
                className={utilityControlClass}
                aria-label="Abrir menú de cuenta"
                aria-expanded={menuOpen}
              >
                <AccountIcon />
                <span className="hidden xl:inline">
                  {user.fullName.split(" ")[0]}
                </span>
                <ChevronDownIcon />
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
              className={utilityControlClass}
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
              setSearchOpen(false);
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

      {searchOpen && (
        <div
          id="navbar-search-panel"
          className="absolute inset-x-0 top-full border-y border-black/10 bg-white shadow-[0_24px_60px_rgba(45,31,26,0.14)]"
        >
          <div className="mx-auto max-w-4xl px-5 py-6 sm:px-8">
            <form action="/search" className="relative">
              <label htmlFor="navbar-product-search" className="sr-only">
                Buscar productos
              </label>
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                <SearchIcon />
              </span>
              <input
                id="navbar-product-search"
                name="q"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                autoFocus
                autoComplete="off"
                placeholder="Busca un modelo o producto, por ejemplo Luma…"
                className="h-14 w-full rounded-2xl border border-black/15 bg-[#faf8f5] pl-12 pr-28 text-base outline-none transition focus:border-[var(--brand-espresso)] focus:ring-4 focus:ring-[#4a2d23]/10"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 h-10 rounded-full bg-[var(--brand-espresso)] px-5 text-sm font-semibold text-white transition hover:bg-black"
              >
                Ver todo
              </button>
            </form>

            {searchQuery.trim() ? (
              <div className="mt-4">
                {searchLoading ? (
                  <p className="py-4 text-sm text-gray-500">
                    Buscando productos…
                  </p>
                ) : searchMatches.length > 0 ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {searchMatches.map((product) => (
                      <a
                        key={product.slug}
                        href={`/product/${product.slug}`}
                        onClick={() => setSearchOpen(false)}
                        className="flex items-center justify-between gap-4 rounded-2xl border border-transparent bg-[#faf8f5] px-4 py-3 transition hover:border-black/10 hover:bg-[#f2ede8]"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-semibold">
                            {product.name}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-gray-500">
                            {product.category}
                          </span>
                        </span>
                        <span className="shrink-0 text-sm font-semibold">
                          ${product.price.toLocaleString("es-MX")}
                        </span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-2xl bg-[#faf8f5] px-4 py-5 text-sm text-gray-600">
                    No encontramos productos con “{searchQuery.trim()}”.
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  ["/eyeglasses", "Lentes ópticos"],
                  ["/sunglasses", "Lentes de sol"],
                  ["/deportivos", "Deportivos"],
                  ["/lentes-de-contacto", "Contactos"],
                  ["/accessories", "Accesorios"],
                ].map(([href, label]) => (
                  <a
                    key={href}
                    href={href}
                    onClick={() => setSearchOpen(false)}
                    className="rounded-full border border-black/10 px-4 py-2 text-sm transition hover:border-[var(--brand-espresso)] hover:bg-[#f7f3ee]"
                  >
                    {label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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
    <svg
      viewBox="0 0 24 24"
      width="21"
      height="21"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9.25" />
      <circle cx="12" cy="9" r="3" />
      <path d="M6.8 19.1c.9-2.8 2.7-4.2 5.2-4.2s4.3 1.4 5.2 4.2" />
    </svg>
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
    <svg
      viewBox="0 0 24 24"
      width="21"
      height="21"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5.4 8.2h13.2l.8 12H4.6l.8-12Z" />
      <path d="M8.5 9V6.7a3.5 3.5 0 0 1 7 0V9" />
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 20.4 4.8 13.5a5 5 0 0 1-.6-6.4A4.7 4.7 0 0 1 12 8a4.7 4.7 0 0 1 7.8-.9 5 5 0 0 1-.6 6.4L12 20.4Z" />
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
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="10.7" cy="10.7" r="6.7" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="hidden xl:block"
      aria-hidden
    >
      <path d="m7 10 5 5 5-5" />
    </svg>
  );
}
