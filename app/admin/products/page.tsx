/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import AdminNav from "@/components/AdminNav";
import { downloadCsv } from "@/lib/csv";

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
  mainImage?: {
    imageUrl: string;
    altText?: string | null;
  } | null;
};

type ProductStatus =
  | "all"
  | "active"
  | "low-stock"
  | "out-of-stock"
  | "inactive";

type ProductTypeFilter = "all" | "eyeglasses" | "sunglasses";

type SortBy =
  | "newest"
  | "name"
  | "price-high"
  | "price-low"
  | "stock-low"
  | "stock-high";

function formatMoney(amount: number) {
  return `$${amount.toLocaleString("es-MX")} MXN`;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getProductTypeLabel(type: Product["type"]) {
  if (type === "eyeglasses") return "Lentes ópticos";
  if (type === "sunglasses") return "Lentes de sol";

  return "Producto";
}

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
  const [typeFilter, setTypeFilter] = useState<ProductTypeFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [loading, setLoading] = useState(true);
  const [savingSlug, setSavingSlug] = useState("");
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
      setProducts(data.products || []);
    } catch (error) {
      console.error(error);
      setError("No pudimos cargar los productos desde PostgreSQL.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleProductActive(product: Product) {
    const action = product.isActive ? "desactivar" : "activar";

    if (!confirm(`¿Seguro que quieres ${action} ${product.name}?`)) {
      return;
    }

    try {
      setSavingSlug(product.slug);

      const response = await fetch(`/api/products/${product.slug}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !product.isActive,
          reason: product.isActive
            ? "Admin deactivated product"
            : "Admin activated product",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "No pudimos actualizar el producto.");
        return;
      }

      setProducts((currentProducts) =>
        currentProducts.map((currentProduct) => {
          if (currentProduct.slug !== product.slug) {
            return currentProduct;
          }

          return {
            ...currentProduct,
            ...data.product,
            mainImage: data.product?.mainImage || currentProduct.mainImage,
          };
        })
      );
    } catch (error) {
      console.error(error);
      alert("No pudimos actualizar el producto.");
    } finally {
      setSavingSlug("");
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    return products
      .filter((product) => {
        const status = getProductStatus(product);

        const matchesStatus =
          statusFilter === "all" || status.key === statusFilter;

        const matchesType =
          typeFilter === "all" || product.type === typeFilter;

        const searchableText = [
          product.name,
          product.slug,
          product.category,
          product.description,
          product.gender,
          product.shape,
          product.frameColor,
          product.type,
          getProductTypeLabel(product.type),
          product.mainImage?.imageUrl,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          normalizedSearchTerm === "" ||
          searchableText.includes(normalizedSearchTerm);

        return matchesStatus && matchesType && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === "name") {
          return a.name.localeCompare(b.name);
        }

        if (sortBy === "price-high") {
          return b.price - a.price;
        }

        if (sortBy === "price-low") {
          return a.price - b.price;
        }

        if (sortBy === "stock-low") {
          return a.stock - b.stock;
        }

        if (sortBy === "stock-high") {
          return b.stock - a.stock;
        }

        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [products, searchTerm, sortBy, statusFilter, typeFilter]);

  const totalProducts = products.length;
  const activeProducts = products.filter((product) => product.isActive).length;
  const inactiveProducts = products.filter((product) => !product.isActive).length;
  const eyeglassesProducts = products.filter(
    (product) => product.type === "eyeglasses"
  ).length;
  const sunglassesProducts = products.filter(
    (product) => product.type === "sunglasses"
  ).length;
  const lowStockProducts = products.filter(
    (product) => product.isActive && product.stock > 0 && product.stock <= 3
  ).length;
  const outOfStockProducts = products.filter(
    (product) => product.isActive && product.stock === 0
  ).length;
  const inventoryValue = products
    .filter((product) => product.isActive)
    .reduce((sum, product) => sum + product.price * product.stock, 0);

  function exportProductsCsv() {
    const rows = [
      [
        "Product ID",
        "Slug",
        "Name",
        "Type",
        "Gender",
        "Shape",
        "Frame Color",
        "Category",
        "Image URL",
        "Price",
        "Price Cents",
        "Currency",
        "Stock",
        "Active",
        "Description",
        "Created At",
        "Updated At",
      ],
      ...filteredProducts.map((product) => [
        product.id,
        product.slug,
        product.name,
        product.type,
        product.gender,
        product.shape,
        product.frameColor,
        product.category,
        product.mainImage?.imageUrl || "",
        product.price,
        product.priceCents,
        product.currency,
        product.stock,
        product.isActive ? "Yes" : "No",
        product.description,
        product.createdAt,
        product.updatedAt,
      ]),
    ];

    downloadCsv("olm-products.csv", rows);
  }

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
            type="button"
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
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <h1 className="text-4xl font-bold">Productos</h1>

            <p className="mt-4 max-w-2xl text-gray-600">
              Administra catálogo, imágenes, precios, stock, tipo de producto y
              estado de publicación.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={exportProductsCsv}
              className="rounded-full border px-6 py-3 text-center text-sm font-medium"
            >
              Descargar CSV
            </button>

            <a
              href="/admin/products/new"
              className="rounded-full bg-black px-6 py-3 text-center text-sm font-medium text-white"
            >
              Agregar producto
            </a>
          </div>
        </div>

        <AdminNav />

        <div className="mt-10 grid gap-4 md:grid-cols-4">
          <button
            type="button"
            onClick={() => {
              setStatusFilter("all");
              setTypeFilter("all");
            }}
            className="rounded-2xl border p-5 text-left transition hover:shadow-sm"
          >
            <p className="text-sm text-gray-600">Productos totales</p>
            <p className="mt-2 text-3xl font-bold">{totalProducts}</p>
            <p className="mt-2 text-xs text-gray-500">
              {activeProducts} activos · {inactiveProducts} inactivos
            </p>
          </button>

          <button
            type="button"
            onClick={() => setTypeFilter("eyeglasses")}
            className="rounded-2xl border p-5 text-left transition hover:shadow-sm"
          >
            <p className="text-sm text-gray-600">Lentes ópticos</p>
            <p className="mt-2 text-3xl font-bold">{eyeglassesProducts}</p>
          </button>

          <button
            type="button"
            onClick={() => setTypeFilter("sunglasses")}
            className="rounded-2xl border p-5 text-left transition hover:shadow-sm"
          >
            <p className="text-sm text-gray-600">Lentes de sol</p>
            <p className="mt-2 text-3xl font-bold">{sunglassesProducts}</p>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("low-stock")}
            className="rounded-2xl border p-5 text-left transition hover:shadow-sm"
          >
            <p className="text-sm text-gray-600">Alertas de stock</p>
            <p className="mt-2 text-3xl font-bold">
              {lowStockProducts + outOfStockProducts}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              {lowStockProducts} bajo stock · {outOfStockProducts} agotados
            </p>
          </button>
        </div>

        <div className="mt-6 rounded-2xl border bg-gray-50 p-5">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <p className="text-sm text-gray-500">Valor estimado inventario</p>
              <p className="mt-1 text-2xl font-bold">
                {formatMoney(inventoryValue)}
              </p>
            </div>

            <a
              href="/admin/inventory"
              className="rounded-full bg-black px-5 py-2 text-center text-sm text-white"
            >
              Administrar inventario
            </a>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto_auto] lg:items-center">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar producto, slug, categoría, color o forma..."
              className="w-full rounded-full border px-5 py-3 text-sm outline-none focus:border-black"
            />

            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value as ProductTypeFilter)
              }
              className="rounded-full border px-5 py-3 text-sm outline-none focus:border-black"
            >
              <option value="all">Todos los tipos</option>
              <option value="eyeglasses">Lentes ópticos</option>
              <option value="sunglasses">Lentes de sol</option>
            </select>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as ProductStatus)
              }
              className="rounded-full border px-5 py-3 text-sm outline-none focus:border-black"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="low-stock">Stock bajo</option>
              <option value="out-of-stock">Agotados</option>
              <option value="inactive">Inactivos</option>
            </select>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortBy)}
              className="rounded-full border px-5 py-3 text-sm outline-none focus:border-black"
            >
              <option value="newest">Más recientes</option>
              <option value="name">Nombre A-Z</option>
              <option value="price-high">Precio mayor</option>
              <option value="price-low">Precio menor</option>
              <option value="stock-low">Stock menor</option>
              <option value="stock-high">Stock mayor</option>
            </select>
          </div>

          <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <p className="text-sm text-gray-600">
              Mostrando {filteredProducts.length} de {products.length} productos
            </p>

            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setTypeFilter("all");
                setSortBy("newest");
              }}
              className="text-left text-sm text-gray-500 underline sm:text-right"
            >
              Limpiar filtros
            </button>
          </div>
        </div>

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
                <article
                  key={product.slug}
                  className="rounded-2xl border p-6 transition hover:shadow-sm"
                >
                  <div className="grid gap-6 md:grid-cols-[160px_1fr_auto]">
                    <a
                      href={`/admin/products/${product.slug}/edit`}
                      className="overflow-hidden rounded-xl border bg-gray-100"
                    >
                      <div className="flex h-36 items-center justify-center">
                        {product.mainImage?.imageUrl ? (
                          <img
                            src={product.mainImage.imageUrl}
                            alt={product.mainImage.altText || product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="px-4 text-center text-xs text-gray-500">
                            Sin imagen
                          </span>
                        )}
                      </div>

                      {product.mainImage?.imageUrl && (
                        <p className="truncate border-t bg-white px-3 py-2 text-xs text-gray-500">
                          {product.mainImage.imageUrl}
                        </p>
                      )}
                    </a>

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

                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                          {getProductTypeLabel(product.type)}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-gray-500">
                        Slug: {product.slug}
                      </p>

                      <p className="mt-3 text-gray-600">
                        {product.description}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-gray-100 px-3 py-1">
                          {product.category}
                        </span>

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

                      <p className="mt-4 text-xs text-gray-500">
                        Creado: {formatDate(product.createdAt)} · Actualizado:{" "}
                        {formatDate(product.updatedAt)}
                      </p>
                    </div>

                    <div className="md:text-right">
                      <p className="text-2xl font-bold">
                        {formatMoney(product.price)}
                      </p>

                      <p className="mt-2 text-sm text-gray-600">
                        Stock:{" "}
                        <span className="font-semibold">{product.stock}</span>
                      </p>

                      <p className="mt-1 text-sm text-gray-600">
                        Valor stock:{" "}
                        <span className="font-semibold">
                          {formatMoney(product.price * product.stock)}
                        </span>
                      </p>

                      <div className="mt-5 flex flex-col gap-2 md:items-end">
                        <a
                          href={`/product/${product.slug}`}
                          target="_blank"
                          className="inline-block rounded-full border px-5 py-2 text-center text-sm"
                        >
                          Ver público
                        </a>

                        <a
                          href={`/admin/products/${product.slug}/edit`}
                          className="inline-block rounded-full bg-black px-5 py-2 text-center text-sm text-white"
                        >
                          Editar
                        </a>

                        <button
                          type="button"
                          onClick={() => toggleProductActive(product)}
                          disabled={savingSlug === product.slug}
                          className={`inline-block rounded-full px-5 py-2 text-center text-sm disabled:cursor-not-allowed disabled:opacity-50 ${
                            product.isActive
                              ? "border border-red-200 text-red-600"
                              : "border border-green-200 text-green-700"
                          }`}
                        >
                          {savingSlug === product.slug
                            ? "Guardando..."
                            : product.isActive
                              ? "Desactivar"
                              : "Activar"}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

