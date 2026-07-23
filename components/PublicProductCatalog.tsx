"use client";

import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";

type ProductType = "eyeglasses" | "sunglasses";

type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  category: string;
  type: ProductType;
  gender: string;
  shape: string;
  frameColor: string;
  stock: number;
  isActive: boolean;
  mainImage: {
    imageUrl: string;
    altText: string | null;
  } | null;
};

type PublicProductCatalogProps = {
  type: ProductType;
  title: string;
  description: string;
};

function getCardColor(frameColor: string) {
  const color = frameColor.toLowerCase();

  if (color.includes("cafe") || color.includes("café")) return "#f1e9e2";
  if (color.includes("dorado")) return "#f2ead7";
  if (color.includes("transparente")) return "#f5f5f3";

  return "#efefed";
}

export default function PublicProductCatalog({
  type,
  title,
  description,
}: PublicProductCatalogProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [shapeFilter, setShapeFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/products");

        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const data = await response.json();

        const activeProducts = data.products.filter(
          (product: Product) => product.type === type && product.isActive
        );

        setProducts(activeProducts);
      } catch (error) {
        console.error(error);
        setError("No pudimos cargar los productos desde PostgreSQL.");
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [type]);

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      normalizedSearchTerm === "" ||
      [
        product.name,
        product.description,
        product.category,
        product.gender,
        product.shape,
        product.frameColor,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearchTerm);

    const matchesGender =
      genderFilter === "all" || product.gender === genderFilter;

    const matchesShape =
      shapeFilter === "all" || product.shape === shapeFilter;

    return matchesSearch && matchesGender && matchesShape;
  });

  return (
    <main className="min-h-screen bg-white text-black">
      <section className="bg-[#f7f3ee] px-6 py-14 text-center md:py-20">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gray-500">
            Colección OLM
          </p>
          <h1 className="mt-3 text-5xl font-bold tracking-[-0.04em] md:text-6xl">
            {title}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-gray-600">
            {description}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        <div className="rounded-3xl border border-black/10 bg-[#fafafa] p-4 md:p-5">
          <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr]">
            <label>
              <span className="sr-only">Buscar productos</span>
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por modelo, color o forma..."
                className="h-12 w-full rounded-full border border-black/15 bg-white px-5 text-sm outline-none transition placeholder:text-gray-400 focus:border-black"
              />
            </label>

            <label>
              <span className="sr-only">Filtrar por género</span>
              <select
                value={genderFilter}
                onChange={(event) => setGenderFilter(event.target.value)}
                className="h-12 w-full rounded-full border border-black/15 bg-white px-5 text-sm outline-none transition focus:border-black"
              >
                <option value="all">Todos los géneros</option>
                <option value="unisex">Unisex</option>
                <option value="hombre">Hombre</option>
                <option value="mujer">Mujer</option>
              </select>
            </label>

            <label>
              <span className="sr-only">Filtrar por forma</span>
              <select
                value={shapeFilter}
                onChange={(event) => setShapeFilter(event.target.value)}
                className="h-12 w-full rounded-full border border-black/15 bg-white px-5 text-sm outline-none transition focus:border-black"
              >
                <option value="all">Todas las formas</option>
                <option value="rectangular">Rectangular</option>
                <option value="cuadrado">Cuadrado</option>
                <option value="redondo">Redondo</option>
                <option value="aviador">Aviador</option>
              </select>
            </label>
          </div>
        </div>

        {loading ? (
          <div className="mt-12 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-[28px] border border-black/10 p-3"
              >
                <div className="aspect-[4/3] rounded-[22px] bg-gray-100" />
                <div className="space-y-3 px-2 py-5">
                  <div className="h-3 w-24 rounded bg-gray-100" />
                  <div className="h-6 w-2/3 rounded bg-gray-100" />
                  <div className="h-4 w-full rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="mt-12 rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
            {error}
          </div>
        ) : (
          <>
            <div className="mt-8 flex items-center justify-between gap-4">
              <p className="text-sm text-gray-600">
                {filteredProducts.length}{" "}
                {filteredProducts.length === 1 ? "modelo" : "modelos"}
              </p>
              <p className="text-sm text-gray-500">
                Mostrando {filteredProducts.length} de {products.length}
              </p>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="mt-10 rounded-3xl border border-black/10 bg-[#fafafa] p-10 text-center">
                <h2 className="text-2xl font-semibold">
                  No encontramos productos
                </h2>
                <p className="mt-3 text-gray-600">
                  Intenta cambiar los filtros o buscar con otro texto.
                </p>
              </div>
            ) : (
              <div className="mt-8 grid items-stretch gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.slug}
                    slug={product.slug}
                    name={product.name}
                    price={product.price}
                    category={product.category}
                    color={getCardColor(product.frameColor)}
                    href={`/product/${product.slug}`}
                    stock={product.stock}
                    imageUrl={product.mainImage?.imageUrl}
                    imageAltText={product.mainImage?.altText}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
