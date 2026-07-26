"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import ProductCard from "@/components/ProductCard";
import {
  getSportsProductDetails,
  sportsProductDetails,
} from "@/data/sportsCatalog";

type Product = {
  id: string;
  slug: string;
  name: string;
  price: number;
  category: string;
  type: "eyeglasses" | "sunglasses";
  gender: string;
  frameMaterial: string;
  stock: number;
  isActive: boolean;
  mainImage: { imageUrl: string; altText: string | null } | null;
};

const filterButton =
  "rounded-full border px-4 py-2 text-sm font-medium transition";

export default function SportsCatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [activity, setActivity] = useState("all");
  const [gender, setGender] = useState("all");
  const [lensUse, setLensUse] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch("/api/products");

        if (!response.ok) throw new Error("No se pudieron cargar los productos");

        const data = (await response.json()) as { products: Product[] };
        const sportsSlugs = new Set(
          sportsProductDetails.map((product) => product.slug)
        );

        setProducts(
          data.products.filter(
            (product) => product.isActive && sportsSlugs.has(product.slug)
          )
        );
      } catch {
        setError("No pudimos cargar la colección deportiva.");
      } finally {
        setLoading(false);
      }
    }

    void loadProducts();
  }, []);

  const visibleProducts = useMemo(
    () =>
      products.filter((product) => {
        const details = getSportsProductDetails(product.slug);
        if (!details) return false;

        return (
          (activity === "all" || details.activity === activity) &&
          (gender === "all" || product.gender === gender) &&
          (lensUse === "all" || details.lensUse === lensUse)
        );
      }),
    [activity, gender, lensUse, products]
  );

  function filterClass(active: boolean) {
    return `${filterButton} ${
      active
        ? "border-[var(--brand-espresso)] bg-[var(--brand-espresso)] text-white"
        : "border-black/15 bg-white hover:border-[var(--brand-espresso)]"
    }`;
  }

  return (
    <main className="min-h-screen bg-white text-black">
      <section className="border-b border-black/10 bg-[#efe8df]">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-6 py-16 md:grid-cols-[minmax(0,0.8fr)_minmax(320px,1.2fr)] md:items-center md:px-10 md:py-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gray-500">
              Movimiento OLM
            </p>
            <h1 className="mt-4 text-5xl font-bold tracking-[-0.05em] md:text-7xl">
              Lentes deportivos
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-gray-700 md:text-lg">
              Diseños ligeros para cancha, montaña, ciclismo y running. Elige
              protección solar o un modelo deportivo preparado para graduarse.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              ["/products/sports/court-air.png", "Tenis"],
              ["/products/sports/alpine-shield.png", "Esquí"],
              ["/products/sports/velocity-one.png", "Ciclismo"],
            ].map(([src, label]) => (
              <div
                key={src}
                className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm"
              >
                <Image
                  src={src}
                  alt={`Lentes deportivos para ${label}`}
                  width={520}
                  height={700}
                  className="aspect-[3/4] h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 py-10 sm:px-6 md:py-14">
        <div className="grid gap-10 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)] xl:gap-12">
          <aside className="lg:border-r lg:border-black/10 lg:pr-8">
            <div className="rounded-3xl border border-black/10 bg-[#faf8f5] p-5 lg:sticky lg:top-32 lg:border-0 lg:bg-transparent lg:p-0">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Filtrar por</h2>
                {(activity !== "all" ||
                  gender !== "all" ||
                  lensUse !== "all") && (
                  <button
                    type="button"
                    onClick={() => {
                      setActivity("all");
                      setGender("all");
                      setLensUse("all");
                    }}
                    className="text-xs font-semibold underline underline-offset-4"
                  >
                    Limpiar
                  </button>
                )}
              </div>

              <fieldset className="mt-7 border-t border-black/10 pt-6">
                <legend className="text-sm font-semibold">Actividad</legend>
                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    ["all", "Todas"],
                    ["tenis", "Tenis y pádel"],
                    ["esqui", "Esquí"],
                    ["ciclismo", "Ciclismo y running"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setActivity(value)}
                      className={filterClass(activity === value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="mt-6 border-t border-black/10 pt-6">
                <legend className="text-sm font-semibold">Para quién</legend>
                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    ["all", "Todos"],
                    ["unisex", "Unisex"],
                    ["mujer", "Mujer"],
                    ["hombre", "Hombre"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setGender(value)}
                      className={filterClass(gender === value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="mt-6 border-t border-black/10 pt-6">
                <legend className="text-sm font-semibold">Tipo de lente</legend>
                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    ["all", "Todos"],
                    ["opticos", "Ópticos"],
                    ["sol", "Sol"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setLensUse(value)}
                      className={filterClass(lensUse === value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>
          </aside>

          <div className="min-w-0">
            <div className="flex items-end justify-between gap-4 border-b border-black/10 pb-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                  Rendimiento y comodidad
                </p>
                <h2 className="mt-2 text-3xl font-semibold">Elige tu modelo</h2>
              </div>
              {!loading && !error && (
                <p className="text-sm text-gray-500">
                  {visibleProducts.length}{" "}
                  {visibleProducts.length === 1 ? "modelo" : "modelos"}
                </p>
              )}
            </div>

            {loading ? (
              <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {[0, 1, 2].map((item) => (
                  <div
                    key={item}
                    className="aspect-[3/4] animate-pulse rounded-[28px] bg-gray-100"
                  />
                ))}
              </div>
            ) : error ? (
              <p className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-8 text-red-700">
                {error}
              </p>
            ) : visibleProducts.length === 0 ? (
              <div className="mt-8 rounded-3xl border border-black/10 p-10 text-center">
                <h3 className="text-2xl font-semibold">
                  No hay modelos con estos filtros
                </h3>
                <p className="mt-2 text-gray-600">
                  Cambia una opción para ver el resto de la colección.
                </p>
              </div>
            ) : (
              <div className="mt-8 grid items-stretch gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {visibleProducts.map((product) => {
                  const details = getSportsProductDetails(product.slug);

                  return (
                    <div key={product.slug} className="flex flex-col">
                      <ProductCard
                        slug={product.slug}
                        name={product.name}
                        price={product.price}
                        category={`${details?.activityLabel} · ${details?.materialLabel}`}
                        color="#f7f3ee"
                        href={`/product/${product.slug}`}
                        stock={product.stock}
                        imageUrl={product.mainImage?.imageUrl}
                        imageAltText={product.mainImage?.altText}
                        actionLabel="Seleccionar modelo"
                        isNew
                      />
                      <p className="px-5 pt-3 text-sm leading-6 text-gray-600">
                        {details?.performanceNote}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
