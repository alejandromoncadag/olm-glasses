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
  { href: "/clip-ons", label: "Clip-on" },
  { href: "/lentes-de-contacto", label: "Contactos" },
  { href: "/accessories", label: "Accesorios" },
  { href: "/tu-estilo", label: "Tu estilo" },
  { href: "/eye-exam", label: "Examen" },
  { href: "/locations", label: "Tiendas" },
  { href: "/order-status", label: "Pedido" },
];

const storeAnnouncements = [
  "Envío gratis en compras desde $1,500 MXN",
  "Examen incluido al comprar tu armazón en tienda",
  "30 días para decidir: cambia o devuelve sin complicaciones",
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
          className="font-olm-logo text-lg font-semibold uppercase tracking-[0.16em] sm:text-xl"
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
  const [navVisible, setNavVisible] = useState(true);

  const isAdmin = user?.role === "admin";
  const isAdminArea = pathname.startsWith("/admin");
  const utilityControlClass =
    "group relative flex h-11 items-center gap-1.5 whitespace-nowrap rounded-full px-1.5 text-[13px] font-medium text-[#2d1f1a] transition duration-200 hover:bg-[#f4efe9] hover:text-[var(--brand-espresso)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-espresso)] sm:px-2 2xl:gap-2 2xl:px-2.5";

  useEffect(() => {
    if (!searchOpen || searchProducts.length > 0 || searchLoading) return;

    async function loadSearchProducts() {
      try {
        setSearchLoading(true);
        const response = await fetch("/api/catalog/products", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { products: SearchProduct[] };
        setSearchProducts(
          data.products.filter(
            (product) =>
              product.isActive &&
              !normalizeSearchValue(product.category).includes("deportiv")
          )
        );
      } finally {
        setSearchLoading(false);
      }
    }

    void loadSearchProducts();
  }, [searchLoading, searchOpen, searchProducts.length]);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let lastToggleAt = 0;
    const directionThreshold = 12;
    const toggleCooldown = 350;

    function setVisibility(nextVisible: boolean) {
      setNavVisible((previousVisible) => {
        if (previousVisible === nextVisible) return previousVisible;
        lastToggleAt = performance.now();
        return nextVisible;
      });
    }

    function handleScroll() {
      const currentScrollY = window.scrollY;
      const now = performance.now();

      if (currentScrollY < 24) {
        setVisibility(true);
      } else if (now - lastToggleAt >= toggleCooldown) {
        if (currentScrollY > lastScrollY + directionThreshold) {
          setVisibility(false);
        } else if (currentScrollY < lastScrollY - directionThreshold) {
          setVisibility(true);
        }
      }
      lastScrollY = currentScrollY;
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
      {isAdminArea ? (
        <div className="bg-[#2d1f1a] text-white">
          <div className="mx-auto flex h-10 max-w-7xl items-center justify-center px-4">
            <Link
              href="/admin"
              className="font-olm-logo whitespace-nowrap text-base font-semibold uppercase tracking-[0.22em]"
            >
              Óptica OLM
            </Link>
          </div>
        </div>
      ) : (
        <AnnouncementRotator />
      )}

      <div
        className={`overflow-hidden transition-[max-height] duration-300 ease-out ${navVisible ? "max-h-24" : "max-h-0"}`}
      >
        <nav
          className={`mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 transition-[opacity,transform] duration-300 ease-out sm:px-6 xl:gap-6 ${navVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}`}
        >
        {!isAdminArea && (
          <div className="flex min-w-0 items-center gap-5 xl:gap-7">
            <Link
              href="/"
              className="font-olm-logo shrink-0 whitespace-nowrap text-sm font-semibold uppercase tracking-[0.18em] sm:text-base xl:text-lg"
              aria-label="Óptica OLM, inicio"
            >
              Óptica OLM
            </Link>

            <div className="hidden items-center gap-0 whitespace-nowrap text-[11px] font-medium text-gray-700 xl:flex 2xl:gap-1 2xl:text-xs">
              {storeNavItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="whitespace-nowrap px-1.5 py-2 transition hover:text-[var(--brand-espresso)] 2xl:px-2.5"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-1 text-sm font-medium sm:gap-1.5">
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
            <MaterialIcon name="search" />
            <span className="hidden 2xl:inline">Buscar</span>
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
              <MaterialIcon name="favorite" filled={likes.length > 0} />

              {likes.length > 0 && (
                <span className="absolute -right-1.5 -top-1.5 z-10 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border border-white bg-[var(--brand-espresso)] px-1 text-[10px] font-bold leading-none text-white shadow-sm">
                  {likes.length > 99 ? "99+" : likes.length}
                </span>
              )}
            </span>
            <span className="hidden 2xl:inline">Favoritos</span>
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
              <MaterialIcon name="shopping_bag" filled={cartCount > 0} />

              {cartCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 z-10 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border border-white bg-[var(--brand-espresso)] px-1 text-[10px] font-bold leading-none text-white shadow-sm">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </span>
            <span className="hidden 2xl:inline">Carrito</span>
          </a>

          {loading ? (
            <span
              className={`${utilityControlClass} text-gray-400`}
              aria-label="Comprobando sesión"
            >
              <MaterialIcon name="account_circle" />
              <span className="hidden 2xl:inline">Cuenta</span>
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
                <MaterialIcon name="account_circle" />
                <span className="hidden 2xl:inline">
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
              <MaterialIcon name="account_circle" />
              <span className="hidden 2xl:inline">Cuenta</span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen((open) => !open);
              setMenuOpen(false);
              setSearchOpen(false);
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-gray-100 xl:hidden"
            aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            <MenuIcon open={mobileMenuOpen} />
          </button>
        </div>
        </nav>
      </div>

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
                <MaterialIcon name="search" />
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
          className="border-t border-black/10 bg-white px-4 py-3 xl:hidden sm:px-6"
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

function AnnouncementRotator() {
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let transitionTimeout: number | undefined;
    const intervalId = window.setInterval(() => {
      setVisible(false);
      transitionTimeout = window.setTimeout(() => {
        setAnnouncementIndex(
          (currentIndex) => (currentIndex + 1) % storeAnnouncements.length
        );
        setVisible(true);
      }, 350);
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
      if (transitionTimeout) window.clearTimeout(transitionTimeout);
    };
  }, []);

  return (
    <div className="relative h-10 overflow-hidden bg-[#2d1f1a] text-white" aria-live="polite">
      <video
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        src="/videos/cafe.mp4"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      />
      <div className="relative z-10 mx-auto grid h-10 max-w-[56rem] grid-cols-[2rem_minmax(0,1fr)_2rem] items-center gap-10 px-5 text-center sm:gap-[50px]">
        <button type="button" onClick={() => setAnnouncementIndex((currentIndex) => (currentIndex - 1 + storeAnnouncements.length) % storeAnnouncements.length)} className="justify-self-center text-lg leading-none opacity-80 transition hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" aria-label="Anuncio anterior">‹</button>
        <p
          className={`max-w-[min(72vw,48rem)] truncate text-[10px] font-semibold uppercase tracking-[0.12em] transition-opacity duration-300 sm:text-xs ${
            visible ? "opacity-100" : "opacity-0"
          }`}
        >
          {storeAnnouncements[announcementIndex]}
        </p>
        <button type="button" onClick={() => setAnnouncementIndex((currentIndex) => (currentIndex + 1) % storeAnnouncements.length)} className="justify-self-center text-lg leading-none opacity-80 transition hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" aria-label="Siguiente anuncio">›</button>
      </div>
    </div>
  );
}

function MaterialIcon({
  name,
  filled = false,
}: {
  name: "account_circle" | "favorite" | "search" | "shopping_bag";
  filled?: boolean;
}) {
  return (
    <span
      className="material-symbols-outlined select-none text-[22px] leading-none"
      style={{
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 300, 'GRAD' 0, 'opsz' 24`,
      }}
      aria-hidden
    >
      {name}
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
      className="hidden 2xl:block"
      aria-hidden
    >
      <path d="m7 10 5 5 5-5" />
    </svg>
  );
}
