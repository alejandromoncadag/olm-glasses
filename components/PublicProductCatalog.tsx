"use client";

import { useEffect, useState } from "react";
import LikeButton from "@/components/LikeButton";

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
    altText: string;
  } | null;
};

type PublicProductCatalogProps = {
  type: ProductType;
  title: string;
  description: string;
};

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

  if (loading) {
    return (
      <main className="min-h-screen bg-white px-6 py-12 text-black">
        <section className="mx-auto max-w-6xl">
          <h1 className="text-5xl font-bold">{title}</h1>

          <p className="mt-4 text-gray-600">
            Cargando productos desde PostgreSQL...
          </p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-white px-6 py-12 text-black">
        <section className="mx-auto max-w-6xl">
          <h1 className="text-5xl font-bold">{title}</h1>

          <p className="mt-4 text-red-600">{error}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-6 py-12 text-black">
      <section className="mx-auto max-w-6xl">
        <h1 className="text-5xl font-bold">{title}</h1>

        <p className="mt-4 max-w-2xl text-gray-600">{description}</p>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por modelo, color o forma..."
            className="rounded-full border px-5 py-3 text-sm outline-none focus:border-black"
          />

          <select
            value={genderFilter}
            onChange={(event) => setGenderFilter(event.target.value)}
            className="rounded-full border px-5 py-3 text-sm outline-none focus:border-black"
          >
            <option value="all">Todos los géneros</option>
            <option value="unisex">Unisex</option>
            <option value="hombre">Hombre</option>
            <option value="mujer">Mujer</option>
          </select>

          <select
            value={shapeFilter}
            onChange={(event) => setShapeFilter(event.target.value)}
            className="rounded-full border px-5 py-3 text-sm outline-none focus:border-black"
          >
            <option value="all">Todas las formas</option>
            <option value="rectangular">Rectangular</option>
            <option value="cuadrado">Cuadrado</option>
            <option value="redondo">Redondo</option>
            <option value="aviador">Aviador</option>
          </select>
        </div>

        <p className="mt-5 text-sm text-gray-600">
          Mostrando {filteredProducts.length} de {products.length} productos
        </p>

        {filteredProducts.length === 0 ? (
          <div className="mt-10 rounded-2xl border p-8 text-center">
            <h2 className="text-2xl font-semibold">
              No encontramos productos
            </h2>

            <p className="mt-3 text-gray-600">
              Intenta cambiar los filtros o buscar con otro texto.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <article
                key={product.slug}
                className="group rounded-3xl border p-5 transition hover:shadow-lg"
              >
                <a href={`/product/${product.slug}`}>
                  <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-gray-100">
                    {product.mainImage ? (
                      <img
                        src={product.mainImage.imageUrl}
                        alt={product.mainImage.altText || product.name}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    ) : (
                      <span className="text-gray-500">Imagen</span>
                    )}
                  </div>
                </a>

                <div className="mt-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-500">{product.category}</p>

                    <a href={`/product/${product.slug}`}>
                      <h2 className="mt-1 text-xl font-semibold">
                        {product.name}
                      </h2>
                    </a>
                  </div>

                  <LikeButton slug={product.slug} />
                </div>

                <p className="mt-3 line-clamp-2 text-sm text-gray-600">
                  {product.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-gray-100 px-3 py-1">
                    {product.gender}
                  </span>

                  <span className="rounded-full bg-gray-100 px-3 py-1">
                    {product.shape}
                  </span>

                  <span className="rounded-full bg-gray-100 px-3 py-1">
                    {product.frameColor}
                  </span>
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <p className="text-lg font-semibold">
                    ${product.price.toLocaleString("es-MX")} MXN
                  </p>

                  <a
                    href={`/product/${product.slug}`}
                    className="rounded-full bg-black px-5 py-2 text-sm text-white"
                  >
                    Ver producto
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

