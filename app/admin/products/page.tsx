"use client";

import { useEffect, useState } from "react";
import AdminNav from "@/components/AdminNav";

type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  priceCents: number;
  currency: string;
  category: string;
  type: "eyeglasses" | "sunglasses";
  gender: string;
  shape: string;
  frameColor: string;
  stock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type ProductStatus =
  | "all"
  | "active"
  | "low-stock"
  | "out-of-stock"
  | "inactive";

function getProductStatus(product: Product) {
  if (!product.isActive) {
    return {
      key: "inactive" as ProductStatus,
      label: "Inactivo",
      className: "bg-gray-100 text-gray-700",
    };
  }

  if (product.stock === 0) {
    return {
      key: "out-of-stock" as ProductStatus,
      label: "Agotado",
      className: "bg-red-100 text-red-700",
    };
  }

  if (product.stock <= 3) {
    return {
      key: "low-stock" as ProductStatus,
      label: "Stock bajo",
      className: "bg-yellow-100 text-yellow-800",
    };
  }

  return {
    key: "active" as ProductStatus,
    label: "Activo",
    className: "bg-green-100 text-green-700",
  };
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductStatus>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchProducts() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/products");

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await response.json();
      setProducts(data.products);
    } catch (error) {
      console.error(error);
      setError("No pudimos cargar los productos desde PostgreSQL.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  const filteredProducts = products.filter((product) => {
    const status = getProductStatus(product);

    const matchesStatus =
      statusFilter === "all" || status.key === statusFilter;

    const searchableText = [
      product.name,
      product.slug,
      product.category,
      product.description,
      product.gender,
      product.shape,
      product.frameColor,
      product.type,
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      normalizedSearchTerm === "" ||
      searchableText.includes(normalizedSearchTerm);

    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <main className="min-h-screen bg-white px-6 py-12 text-black">
        <section className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-bold">Productos</h1>

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
          <h1 className="text-4xl font-bold">Productos</h1>

          <p className="mt-4 text-red-600">{error}</p>

          <button
            onClick={fetchProducts}
            className="mt-6 rounded-full bg-black px-6 py-3 text-white"
          >
            Intentar de nuevo
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-6 py-12 text-black">
      <section className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold">Productos</h1>

        <p className="mt-4 text-gray-600">
          Catálogo conectado a PostgreSQL. Aquí puedes revisar productos,
          precios, stock y estado.
        </p>

        <AdminNav />

        <div className="mt-8 flex justify-end">
          <a
            href="/admin/products/new"
            className="rounded-full bg-black px-6 py-3 text-sm font-medium text-white"
          >
            Agregar producto
          </a>
        </div>


        <div className="mt-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar producto, categoría, color o forma..."
            className="w-full rounded-full border px-5 py-2 text-sm outline-none focus:border-black md:max-w-sm"
          />

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter("all")}
              className={`rounded-full border px-4 py-2 text-sm ${statusFilter === "all" ? "border-black bg-black text-white" : ""
                }`}
            >
              Todos
            </button>

            <button
              onClick={() => setStatusFilter("active")}
              className={`rounded-full border px-4 py-2 text-sm ${statusFilter === "active"
                ? "border-black bg-black text-white"
                : ""
                }`}
            >
              Activos
            </button>

            <button
              onClick={() => setStatusFilter("low-stock")}
              className={`rounded-full border px-4 py-2 text-sm ${statusFilter === "low-stock"
                ? "border-black bg-black text-white"
                : ""
                }`}
            >
              Stock bajo
            </button>

            <button
              onClick={() => setStatusFilter("out-of-stock")}
              className={`rounded-full border px-4 py-2 text-sm ${statusFilter === "out-of-stock"
                ? "border-black bg-black text-white"
                : ""
                }`}
            >
              Agotados
            </button>

            <button
              onClick={() => setStatusFilter("inactive")}
              className={`rounded-full border px-4 py-2 text-sm ${statusFilter === "inactive"
                ? "border-black bg-black text-white"
                : ""
                }`}
            >
              Inactivos
            </button>
          </div>
        </div>

        <p className="mt-4 text-sm text-gray-600">
          Mostrando {filteredProducts.length} de {products.length} productos
        </p>

        {filteredProducts.length === 0 ? (
          <div className="mt-10 rounded-2xl border p-8 text-center">
            <h2 className="text-2xl font-semibold">
              No encontramos productos
            </h2>

            <p className="mt-3 text-gray-600">
              Intenta cambiar el filtro o buscar con otro texto.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-6">
            {filteredProducts.map((product) => {
              const status = getProductStatus(product);

              return (
                <div
                  key={product.slug}
                  className="rounded-2xl border p-6 transition hover:shadow-sm"
                >
                  <div className="grid gap-6 md:grid-cols-[140px_1fr_auto]">
                    <div className="flex h-32 items-center justify-center rounded-xl bg-gray-100">
                      <span className="text-xs text-gray-500">Imagen</span>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-2xl font-semibold">
                          {product.name}
                        </h2>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-gray-500">
                        {product.category}
                      </p>

                      <p className="mt-3 text-gray-600">
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

                        <span className="rounded-full bg-gray-100 px-3 py-1">
                          {product.type}
                        </span>
                      </div>
                    </div>

                    <div className="md:text-right">
                      <p className="text-2xl font-bold">
                        ${product.price.toLocaleString("es-MX")} MXN
                      </p>

                      <p className="mt-2 text-sm text-gray-600">
                        Stock: {product.stock}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Slug: {product.slug}
                      </p>

                      <div className="mt-5 flex flex-col gap-2 md:items-end">
                        <a
                          href={`/product/${product.slug}`}
                          className="inline-block rounded-full border px-5 py-2 text-center text-sm"
                        >
                          Ver producto
                        </a>

                        <a
                          href={`/admin/products/${product.slug}/edit`}
                          className="inline-block rounded-full bg-black px-5 py-2 text-center text-sm text-white"
                        >
                          Editar
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}


