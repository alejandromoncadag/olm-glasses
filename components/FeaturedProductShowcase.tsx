"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./FeaturedProductShowcase.module.css";

export type FeaturedShowcaseProduct = {
  slug: string;
  name: string;
  price: number;
  category: string;
  subcategory: string | null;
  clipOnCompatible: boolean | null;
  color: string;
  stock: number;
  isAvailable: boolean;
  purchasableOnline: boolean;
  favoritable: boolean;
  mainImage: { imageUrl: string; altText: string | null } | null;
};

type CategoryId = (typeof categoryTabs)[number]["id"];

type FeaturedProductShowcaseProps = {
  products: FeaturedShowcaseProduct[];
  initialCategory?: CategoryId;
  eyebrow?: string;
  title?: string;
  showTabs?: boolean;
  appearance?: "default" | "new-arrivals";
};

const categoryTabs = [
  { id: "opticos", label: "Ópticos", matches: ["lentes_opticos", "lentes ópticos", "opticos"] },
  { id: "solares", label: "Solares", matches: ["lentes_de_sol", "lentes de sol", "solares"] },
  { id: "clip-on", label: "Clip-on", matches: ["clip_on", "clip-on", "clip on"] },
  { id: "contactos", label: "Contactos", matches: ["lentes_de_contacto", "lentes de contacto", "contacto"] },
] as const;

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d={direction === "left" ? "M15 18l-6-6 6-6" : "M9 6l6 6-6 6"}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

export default function FeaturedProductShowcase({
  products,
  initialCategory = "opticos",
  eyebrow = "Recién llegados",
  title = "Productos nuevos",
  showTabs = true,
  appearance = "default",
}: FeaturedProductShowcaseProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryId>(initialCategory);
  const [activeIndex, setActiveIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const isNewArrivals = appearance === "new-arrivals";

  const categoryProducts = useMemo(() => {
    const tab = categoryTabs.find((item) => item.id === activeCategory);
    if (!tab) return products;
    return products.filter((product) => {
      const category = product.category.toLowerCase().replace(/-/g, "_");
      const subcategory = (product.subcategory || "").toLowerCase().replace(/-/g, "_");
      const isClipOn = product.clipOnCompatible === true || subcategory === "clip_on";
      const matchesTab =
        tab.id === "clip-on"
          ? isClipOn
          : tab.id === "opticos"
            ? !isClipOn && tab.matches.some((match) => category.includes(match.replace(/-/g, "_")))
            : tab.matches.some((match) => category.includes(match.replace(/-/g, "_")));
      return matchesTab && product.isAvailable && product.stock > 0;
    });
  }, [activeCategory, products]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  const normalizedActiveIndex = categoryProducts.length
    ? Math.min(activeIndex, categoryProducts.length - 1)
    : 0;
  const activeProduct = categoryProducts[normalizedActiveIndex];
  const visibleProducts = useMemo(() => {
    if (!activeProduct || categoryProducts.length === 1) {
      return activeProduct ? [{ product: activeProduct, offset: 0 }] : [];
    }
    return [
      { product: categoryProducts[(normalizedActiveIndex - 1 + categoryProducts.length) % categoryProducts.length], offset: -1 },
      { product: activeProduct, offset: 0 },
      { product: categoryProducts[(normalizedActiveIndex + 1) % categoryProducts.length], offset: 1 },
    ];
  }, [normalizedActiveIndex, activeProduct, categoryProducts]);

  function move(direction: "previous" | "next") {
    if (categoryProducts.length < 2) return;
    setActiveIndex((index) =>
      direction === "next"
        ? (index + 1) % categoryProducts.length
        : (index - 1 + categoryProducts.length) % categoryProducts.length,
    );
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      move("previous");
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      move("next");
    }
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    touchStartX.current = event.clientX;
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (touchStartX.current === null) return;
    const distance = event.clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(distance) >= 45) move(distance < 0 ? "next" : "previous");
  }

  return (
    <section
      className={`relative outline-none ${isNewArrivals ? styles.newArrivals : ""}`}
      aria-label="Productos destacados"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div
        className={
          isNewArrivals
            ? `mx-auto max-w-7xl px-5 py-7 sm:px-6 sm:py-8 ${styles.newArrivalsContent}`
            : undefined
        }
      >
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gray-500">{eyebrow}</p>
          <h2 className="mt-2 text-3xl md:text-4xl">{title}</h2>
          <Link href="/eyeglasses" className={`mt-4 inline-flex h-10 items-center justify-center px-5 text-[11px] font-semibold uppercase tracking-[0.14em] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-espresso)] ${isNewArrivals ? styles.talaveraButton : "bg-[var(--brand-espresso)] text-white transition hover:bg-[#1f1511]"}`}>
            <span className="relative z-10">Ver todos</span>
          </Link>
        </div>
        <div className="flex gap-2" aria-label="Controles del carrusel">
          <button type="button" onClick={() => move("previous")} className="grid h-10 w-10 place-items-center bg-transparent text-[var(--brand-espresso)] transition hover:bg-[#f3eee9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-espresso)] disabled:cursor-not-allowed disabled:opacity-40" aria-label="Producto anterior" disabled={categoryProducts.length < 2}>
            <ArrowIcon direction="left" />
          </button>
          <button type="button" onClick={() => move("next")} className="grid h-10 w-10 place-items-center bg-transparent text-[var(--brand-espresso)] transition hover:bg-[#f3eee9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-espresso)] disabled:cursor-not-allowed disabled:opacity-40" aria-label="Siguiente producto" disabled={categoryProducts.length < 2}>
            <ArrowIcon direction="right" />
          </button>
        </div>
      </div>

      {showTabs && (
        <div className="mt-5 flex flex-wrap gap-x-7 gap-y-3 border-b border-black/10" role="tablist" aria-label="Categorías de productos">
          {categoryTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeCategory === tab.id}
              onClick={() => {
                setActiveCategory(tab.id);
                setActiveIndex(0);
              }}
              className={`border-b-2 pb-2 text-sm font-semibold uppercase tracking-[0.12em] transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-espresso)] ${activeCategory === tab.id ? "border-[var(--brand-espresso)] text-[var(--brand-espresso)]" : "border-transparent text-gray-500 hover:text-[var(--brand-espresso)]"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div
        className={`relative mt-3 overflow-visible touch-pan-y ${
          isNewArrivals ? "min-h-[325px] sm:min-h-[380px]" : "min-h-[220px] sm:min-h-[255px]"
        }`}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          touchStartX.current = null;
        }}
      >
        {categoryProducts.length === 0 ? (
          <div className="flex min-h-[170px] items-center justify-center px-6 text-center">
            <p className="text-sm text-gray-500">Fuera de stock, lo sentimos!</p>
          </div>
        ) : (
          visibleProducts.map(({ product, offset }) => {
          const isActive = offset === 0;
          const image = product.mainImage;
          return (
            <article
              key={`${product.slug}-${offset}`}
              aria-hidden={!isActive}
              className={`absolute left-1/2 top-0 ${isActive ? "w-[clamp(170px,38vw,280px)]" : "w-[clamp(100px,20vw,170px)]"}`}
              style={{
                transform: `translate3d(calc(-50% + ${offset} * clamp(110px, 25vw, 285px)), 0, 0) scale(${isActive ? 1 : 0.72})`,
                opacity: isActive ? 1 : 0.55,
                filter: "none",
                zIndex: isActive ? 2 : 1,
                transition: reducedMotion ? "none" : "transform 560ms cubic-bezier(.22,.61,.36,1), opacity 420ms ease, filter 420ms ease",
                pointerEvents: isActive ? "auto" : "none",
              }}
            >
              <div className="relative overflow-visible">
                <Link href={`/product/${product.slug}`} className="block" aria-label={`Ver ${product.name}`}>
                  <div className="relative aspect-[5/4]">
                    {image ? (
                      <Image src={image.imageUrl} alt={image.altText || product.name} fill priority={isActive && activeIndex === 0} loading={isActive && activeIndex === 0 ? "eager" : "lazy"} unoptimized={image.imageUrl.startsWith("http://") || image.imageUrl.startsWith("https://")} sizes={isActive ? "(min-width: 1280px) 38vw, (min-width: 640px) 48vw, 70vw" : "24vw"} className="object-contain p-2 sm:p-3" />
                    ) : (
                      <div className="grid h-full place-items-center text-xs font-semibold uppercase tracking-[0.16em] text-black/50">Imagen próximamente</div>
                    )}
                  </div>
                </Link>
              </div>

              <div className={`px-1 pt-2 text-center ${isActive ? "" : "opacity-60"}`}>
                  <Link href={`/product/${product.slug}`} className="inline-block"><h3 className="line-clamp-2 text-sm font-semibold tracking-[-0.01em] hover:underline hover:underline-offset-4 sm:text-base">{product.name}</h3></Link>
                  <p className="mt-1 text-sm font-semibold">${product.price.toLocaleString("es-MX")} <span className="text-[10px] font-medium text-gray-500">MXN</span></p>
                  {isNewArrivals && isActive ? (
                    <Link
                      href={`/product/${product.slug}`}
                      className={`mt-3 inline-flex h-9 items-center justify-center px-4 text-[10px] font-semibold uppercase tracking-[0.14em] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-espresso)] ${styles.talaveraButton}`}
                    >
                      <span className="relative z-10">Comprar</span>
                    </Link>
                  ) : null}
                </div>
            </article>
          );
          })
        )}
      </div>
      {activeProduct && (
        <p className="sr-only" aria-live="polite">Producto activo: {activeProduct.name}, {activeIndex + 1} de {categoryProducts.length}.</p>
      )}
      </div>
    </section>
  );
}
