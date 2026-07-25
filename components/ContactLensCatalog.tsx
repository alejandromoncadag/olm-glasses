"use client";

import { useMemo, useState } from "react";
import StorefrontProductCard from "@/components/StorefrontProductCard";
import type { ContactLensProduct } from "@/data/secondaryCatalog";
import { createWhatsAppLink } from "@/lib/whatsapp";

type ContactLensCatalogProps = {
  products: ContactLensProduct[];
};

const MAX_PRICE = 2000;

function FilterButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`w-full rounded-xl border px-3 py-2.5 text-left text-sm transition ${
        active
          ? "border-[var(--brand-espresso)] bg-[#f2ede8] font-semibold text-[var(--brand-espresso)]"
          : "border-black/10 bg-white text-gray-700 hover:border-[var(--brand-espresso)]"
      }`}
    >
      {children}
    </button>
  );
}

export default function ContactLensCatalog({
  products,
}: ContactLensCatalogProps) {
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("all");
  const [replacement, setReplacement] = useState("all");
  const [lensType, setLensType] = useState("all");
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE);

  const brands = Array.from(new Set(products.map((product) => product.brand)));
  const normalizedSearch = search.trim().toLowerCase();

  const visibleProducts = useMemo(
    () =>
      products.filter((product) => {
        const matchesSearch =
          normalizedSearch === "" ||
          [product.name, product.brand, product.replacement, product.lensType]
            .join(" ")
            .toLowerCase()
            .includes(normalizedSearch);

        return (
          matchesSearch &&
          (brand === "all" || product.brand === brand) &&
          (replacement === "all" || product.replacement === replacement) &&
          (lensType === "all" || product.lensType === lensType) &&
          product.price <= maxPrice
        );
      }),
    [brand, lensType, maxPrice, normalizedSearch, products, replacement]
  );

  const hasFilters =
    search.trim() !== "" ||
    brand !== "all" ||
    replacement !== "all" ||
    lensType !== "all" ||
    maxPrice !== MAX_PRICE;

  function resetFilters() {
    setSearch("");
    setBrand("all");
    setReplacement("all");
    setLensType("all");
    setMaxPrice(MAX_PRICE);
  }

  const filters = (
    <div>
      <div className="border-b border-black/10 pb-6">
        <label className="block">
          <span className="text-sm font-semibold">Buscar</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Marca o tipo de lente"
            className="mt-3 h-11 w-full rounded-full border border-black/15 px-4 text-sm outline-none transition focus:border-[var(--brand-espresso)]"
          />
        </label>
      </div>

      <div className="border-b border-black/10 py-6">
        <h3 className="text-sm font-semibold">Marca</h3>
        <div className="mt-3 space-y-2">
          <FilterButton active={brand === "all"} onClick={() => setBrand("all")}>
            Todas las marcas
          </FilterButton>
          {brands.map((option) => (
            <FilterButton
              key={option}
              active={brand === option}
              onClick={() => setBrand(option)}
            >
              {option}
            </FilterButton>
          ))}
        </div>
      </div>

      <div className="border-b border-black/10 py-6">
        <h3 className="text-sm font-semibold">Reemplazo</h3>
        <div className="mt-3 space-y-2">
          {["all", "Diario", "Mensual"].map((option) => (
            <FilterButton
              key={option}
              active={replacement === option}
              onClick={() => setReplacement(option)}
            >
              {option === "all" ? "Todos" : option}
            </FilterButton>
          ))}
        </div>
      </div>

      <div className="border-b border-black/10 py-6">
        <h3 className="text-sm font-semibold">Tipo de lente</h3>
        <div className="mt-3 space-y-2">
          {["all", "Esférico", "Tórico"].map((option) => (
            <FilterButton
              key={option}
              active={lensType === option}
              onClick={() => setLensType(option)}
            >
              {option === "all" ? "Todos" : option}
            </FilterButton>
          ))}
        </div>
      </div>

      <div className="border-b border-black/10 py-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">Precio</h3>
          <span className="text-xs font-semibold text-[var(--brand-espresso)]">
            Hasta ${maxPrice.toLocaleString("es-MX")}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max={MAX_PRICE}
          step="50"
          value={maxPrice}
          onChange={(event) => setMaxPrice(Number(event.target.value))}
          className="mt-4 w-full accent-[var(--brand-espresso)]"
          aria-label="Precio máximo de lentes de contacto"
        />
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={resetFilters}
          className="mt-6 w-full rounded-full border border-black/20 px-4 py-2.5 text-sm font-semibold transition hover:bg-[var(--brand-espresso)] hover:text-white"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );

  return (
    <section className="mx-auto max-w-[1440px] px-5 py-10 sm:px-6 md:py-14">
      <div className="grid gap-10 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)] xl:gap-12">
        <aside className="hidden border-r border-black/10 pr-8 lg:block">
          <h2 className="mb-7 text-lg font-semibold">Filtrar por</h2>
          {filters}
        </aside>

        <div className="min-w-0">
          <details className="mb-8 rounded-2xl border border-black/10 bg-[#fafafa] p-4 lg:hidden">
            <summary className="cursor-pointer list-none text-sm font-semibold">
              Filtros
              {hasFilters && (
                <span className="ml-2 rounded-full bg-[var(--brand-espresso)] px-2 py-0.5 text-xs text-white">
                  Activos
                </span>
              )}
            </summary>
            <div className="mt-6 border-t border-black/10 pt-6">{filters}</div>
          </details>

          <div className="flex items-center justify-between border-b border-black/10 pb-5">
            <p className="text-sm text-gray-600">
              {visibleProducts.length}{" "}
              {visibleProducts.length === 1 ? "producto" : "productos"}
            </p>
            <a
              href="/eye-exam/book"
              className="text-sm font-semibold underline underline-offset-4"
            >
              ¿Necesitas una adaptación?
            </a>
          </div>

          {visibleProducts.length === 0 ? (
            <div className="mt-8 rounded-3xl bg-[#f7f3ee] p-10 text-center">
              <h2 className="text-2xl font-semibold">No encontramos productos</h2>
              <p className="mt-2 text-gray-600">
                Cambia los filtros para ver otras opciones.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-5 rounded-full border border-black/20 px-5 py-2.5 text-sm font-semibold"
              >
                Ver todos
              </button>
            </div>
          ) : (
            <div className="mt-8 grid items-stretch gap-6 md:grid-cols-2 xl:grid-cols-3">
              {visibleProducts.map((product, index) => (
                <StorefrontProductCard
                  key={product.slug}
                  name={product.name}
                  eyebrow={product.brand}
                  description={product.description}
                  price={product.price}
                  image={product.image}
                  details={[
                    product.packSize,
                    product.replacement,
                    product.lensType,
                  ]}
                  actionHref={createWhatsAppLink(
                    `Hola, quiero comprar ${product.name} y confirmar mi graduación y disponibilidad.`
                  )}
                  actionLabel="Seleccionar producto"
                  priority={index === 0}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
