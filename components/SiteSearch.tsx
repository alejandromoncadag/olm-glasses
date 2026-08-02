"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

type Product = {
  slug: string;
  name: string;
  description: string;
  category: string;
  price: number;
  isActive: boolean;
  mainImage: { imageUrl: string; altText: string | null } | null;
};

const siteDestinations = [
  { name: "Lentes ópticos", description: "Armazones para graduar", href: "/eyeglasses" },
  { name: "Lentes de sol", description: "Protección solar con estilo", href: "/sunglasses" },
  { name: "Clip-on", description: "Modelos compatibles con clip-on", href: "/clip-ons" },
  { name: "Lentes de contacto", description: "Contactos y cuidado visual", href: "/lentes-de-contacto" },
  { name: "Accesorios", description: "Estuches, limpieza y más", href: "/accessories" },
  { name: "Examen de la vista", description: "Agenda una cita", href: "/eye-exam" },
  { name: "Tiendas", description: "Cuautitlán y Playa del Carmen", href: "/locations" },
  { name: "Rastrear pedido", description: "Consulta el estado de tu compra", href: "/order-status" },
  { name: "Facturación", description: "Solicita tu factura electrónica", href: "/facturacion" },
];

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function SiteSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initialQuery = new URLSearchParams(window.location.search).get("q");
    const queryTimer = initialQuery
      ? window.setTimeout(() => setQuery(initialQuery), 0)
      : null;

    async function loadProducts() {
      try {
        const response = await fetch("/api/catalog/products", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { products: Product[] };
        setProducts(
          data.products.filter(
            (product) =>
              product.isActive &&
              !normalize(product.category).includes("deportiv")
          )
        );
      } finally {
        setLoading(false);
      }
    }

    void loadProducts();

    return () => {
      if (queryTimer !== null) window.clearTimeout(queryTimer);
    };
  }, []);

  const normalizedQuery = normalize(query.trim());
  const productResults = useMemo(
    () =>
      normalizedQuery.length < 1
        ? []
        : products.filter((product) =>
            normalize(
              `${product.name} ${product.description} ${product.category}`
            ).includes(normalizedQuery)
          ),
    [normalizedQuery, products]
  );
  const destinationResults = useMemo(
    () =>
      normalizedQuery.length < 1
        ? siteDestinations
        : siteDestinations.filter((item) =>
            normalize(`${item.name} ${item.description}`).includes(normalizedQuery)
          ),
    [normalizedQuery]
  );

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    router.replace(query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : "/search");
  }

  return (
    <main className="min-h-screen bg-white px-5 py-12 text-black sm:px-6 md:py-16">
      <section className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
          Buscar en Óptica OLM
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] md:text-6xl">
          ¿Qué estás buscando?
        </h1>

        <form onSubmit={submitSearch} className="relative mt-8 max-w-3xl">
          <label htmlFor="site-search" className="sr-only">
            Buscar productos o secciones
          </label>
          <input
            id="site-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoFocus
            placeholder="Busca un modelo, producto o servicio…"
            className="h-16 w-full rounded-full border border-black/20 bg-white pl-7 pr-32 text-base outline-none transition focus:border-[var(--brand-espresso)] focus:ring-4 focus:ring-[#4a2d23]/10"
          />
          <button
            type="submit"
            className="absolute right-2 top-2 h-12 rounded-full bg-[var(--brand-espresso)] px-6 text-sm font-semibold text-white transition hover:bg-black"
          >
            Buscar
          </button>
        </form>

        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_1.7fr]">
          <section>
            <h2 className="text-xl font-semibold">Secciones</h2>
            <div className="mt-5 divide-y divide-black/10 border-y border-black/10">
              {destinationResults.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="group flex items-center justify-between gap-4 py-4"
                >
                  <span>
                    <span className="block font-medium group-hover:underline">
                      {item.name}
                    </span>
                    <span className="mt-1 block text-sm text-gray-500">
                      {item.description}
                    </span>
                  </span>
                  <span aria-hidden>→</span>
                </a>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">Productos</h2>
              {normalizedQuery.length >= 1 && !loading && (
                <span className="text-sm text-gray-500">
                  {productResults.length} resultados
                </span>
              )}
            </div>

            {loading ? (
              <p className="mt-5 text-gray-500">Buscando productos…</p>
            ) : normalizedQuery.length < 1 ? (
              <div className="mt-5 rounded-3xl bg-[#f7f3ee] p-8">
                <p className="font-medium">Busca por nombre o categoría</p>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Por ejemplo: “sol”, “estuche”, “contactos” o el nombre de un
                  modelo.
                </p>
              </div>
            ) : productResults.length === 0 ? (
              <div className="mt-5 rounded-3xl border border-black/10 p-8">
                <p className="font-medium">No encontramos productos.</p>
                <p className="mt-2 text-sm text-gray-600">
                  Prueba otra palabra o usa las secciones de esta página.
                </p>
              </div>
            ) : (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {productResults.map((product) => (
                  <a
                    key={product.slug}
                    href={`/product/${product.slug}`}
                    className="group overflow-hidden rounded-3xl border border-black/10 bg-white transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="aspect-[4/3] bg-[#f7f3ee]">
                      {product.mainImage ? (
                        <Image
                          src={product.mainImage.imageUrl}
                          alt={product.mainImage.altText || product.name}
                          width={640}
                          height={480}
                          unoptimized={
                            product.mainImage.imageUrl.startsWith("http://") ||
                            product.mainImage.imageUrl.startsWith("https://")
                          }
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="p-5">
                      <p className="text-xs uppercase tracking-[0.14em] text-gray-500">
                        {product.category}
                      </p>
                      <div className="mt-2 flex justify-between gap-4">
                        <h3 className="font-semibold group-hover:underline">
                          {product.name}
                        </h3>
                        <p className="shrink-0 font-semibold">
                          ${product.price.toLocaleString("es-MX")}
                        </p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
