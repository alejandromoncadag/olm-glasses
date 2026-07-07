"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
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
  mainImage?: {
    imageUrl: string;
    altText?: string | null;
  } | null;
};

type AlertFilter = "all" | "out-of-stock" | "low-stock" | "inactive-with-stock";

function formatMoney(amount: number) {
  return `$${amount.toLocaleString("es-MX")} MXN`;
}

function getProductTypeLabel(type: Product["type"]) {
  if (type === "eyeglasses") return "Lentes ópticos";
  if (type === "sunglasses") return "Lentes de sol";

  return "Producto";
}

function getAlertStatus(product: Product) {
  if (!product.isActive && product.stock > 0) {
    return {
      key: "inactive-with-stock" as AlertFilter,
      label: "Inactivo con stock",
      className: "bg-gray-100 text-gray-700",
      message: "Este producto tiene stock, pero no aparece en la tienda.",
    };
  }

  if (product.isActive && product.stock === 0) {
    return {
      key: "out-of-stock" as AlertFilter,
      label: "Agotado",
      className: "bg-red-100 text-red-700",
      message: "Este producto está activo, pero ya no tiene unidades.",
    };
  }

  if (product.isActive && product.stock > 0 && product.stock <= 3) {
    return {
      key: "low-stock" as AlertFilter,
      label: "Stock bajo",
      className: "bg-yellow-100 text-yellow-800",
      message: "Quedan pocas unidades. Considera reabastecer pronto.",
    };
  }

  return null;
}

export default function LowStockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [alertFilter, setAlertFilter] = useState<AlertFilter>("all");
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
      setProducts(data.products || []);
    } catch (error) {
      console.error(error);
      setError("No pudimos cargar las alertas de inventario.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  const alertProducts = useMemo(() => {
    return products.filter((product) => getAlertStatus(product));
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    return alertProducts
      .filter((product) => {
        const alert = getAlertStatus(product);

        if (!alert) return false;

        const matchesAlert =
          alertFilter === "all" || alert.key === alertFilter;

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
          alert.label,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          normalizedSearchTerm === "" ||
          searchableText.includes(normalizedSearchTerm);

        return matchesAlert && matchesSearch;
      })
      .sort((a, b) => {
        const alertA = getAlertStatus(a);
        const alertB = getAlertStatus(b);

        const priority = {
          "out-of-stock": 1,
          "low-stock": 2,
          "inactive-with-stock": 3,
          all: 4,
        };

        return (
          priority[alertA?.key || "all"] - priority[alertB?.key || "all"] ||
          a.stock - b.stock
        );
      });
  }, [alertFilter, alertProducts, searchTerm]);

  const outOfStockCount = products.filter(
    (product) => product.isActive && product.stock === 0
  ).length;

  const lowStockCount = products.filter(
    (product) => product.isActive && product.stock > 0 && product.stock <= 3
  ).length;

  const inactiveWithStockCount = products.filter(
    (product) => !product.isActive && product.stock > 0
  ).length;

  const totalAlertValue = alertProducts.reduce(
    (sum, product) => sum + product.price * product.stock,
    0
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-white px-6 py-12 text-black">
        <section className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-bold">Stock bajo</h1>

          <p className="mt-4 text-gray-600">
            Cargando alertas de inventario...
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-6 py-12 text-black">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <a href="/admin/inventory" className="text-sm text-gray-500 underline">
              ← Regresar a inventario
            </a>

            <h1 className="mt-4 text-4xl font-bold">Stock bajo</h1>

            <p className="mt-4 max-w-2xl text-gray-600">
              Revisa productos agotados, productos con pocas unidades y
              productos inactivos que todavía tienen inventario.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="/admin/inventory/movements"
              className="rounded-full border px-6 py-3 text-center"
            >
              Ver movimientos
            </a>

            <a
              href="/admin/inventory"
              className="rounded-full bg-black px-6 py-3 text-center text-white"
            >
              Inventario
            </a>
          </div>
        </div>

        <AdminNav />

        {error && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-700">{error}</p>

            <button
              type="button"
              onClick={fetchProducts}
              className="mt-3 rounded-full bg-black px-5 py-2 text-sm text-white"
            >
              Intentar de nuevo
            </button>
          </div>
        )}

        <div className="mt-10 grid gap-4 md:grid-cols-4">
          <button
            type="button"
            onClick={() => setAlertFilter("all")}
            className="rounded-2xl border p-5 text-left transition hover:shadow-sm"
          >
            <p className="text-sm text-gray-600">Alertas totales</p>
            <p className="mt-2 text-3xl font-bold">{alertProducts.length}</p>
          </button>

          <button
            type="button"
            onClick={() => setAlertFilter("out-of-stock")}
            className="rounded-2xl border p-5 text-left transition hover:shadow-sm"
          >
            <p className="text-sm text-gray-600">Agotados</p>
            <p className="mt-2 text-3xl font-bold">{outOfStockCount}</p>
          </button>

          <button
            type="button"
            onClick={() => setAlertFilter("low-stock")}
            className="rounded-2xl border p-5 text-left transition hover:shadow-sm"
          >
            <p className="text-sm text-gray-600">Stock bajo</p>
            <p className="mt-2 text-3xl font-bold">{lowStockCount}</p>
          </button>

          <button
            type="button"
            onClick={() => setAlertFilter("inactive-with-stock")}
            className="rounded-2xl border p-5 text-left transition hover:shadow-sm"
          >
            <p className="text-sm text-gray-600">Inactivos con stock</p>
            <p className="mt-2 text-3xl font-bold">{inactiveWithStockCount}</p>
          </button>
        </div>

        <div className="mt-6 rounded-2xl border bg-gray-50 p-5">
          <p className="text-sm text-gray-500">Valor en productos con alerta</p>
          <p className="mt-1 text-2xl font-bold">
            {formatMoney(totalAlertValue)}
          </p>
        </div>

        <div className="mt-8 rounded-2xl border p-5">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar producto, slug, categoría, color o forma..."
              className="w-full rounded-full border px-5 py-3 text-sm outline-none focus:border-black"
            />

            <select
              value={alertFilter}
              onChange={(event) =>
                setAlertFilter(event.target.value as AlertFilter)
              }
              className="rounded-full border px-5 py-3 text-sm outline-none focus:border-black"
            >
              <option value="all">Todas las alertas</option>
              <option value="out-of-stock">Agotados</option>
              <option value="low-stock">Stock bajo</option>
              <option value="inactive-with-stock">Inactivos con stock</option>
            </select>
          </div>

          <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <p className="text-sm text-gray-600">
              Mostrando {filteredProducts.length} de {alertProducts.length}{" "}
              productos con alerta
            </p>

            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setAlertFilter("all");
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
              No hay alertas de inventario
            </h2>

            <p className="mt-3 text-gray-600">
              Todo tu inventario se ve bien con los filtros actuales.
            </p>

            <a
              href="/admin/inventory"
              className="mt-5 inline-block rounded-full bg-black px-6 py-3 text-white"
            >
              Ver inventario
            </a>
          </div>
        ) : (
          <div className="mt-10 space-y-4">
            {filteredProducts.map((product) => {
              const alert = getAlertStatus(product);

              if (!alert) return null;

              return (
                <article key={product.slug} className="rounded-2xl border p-5">
                  <div className="grid gap-5 lg:grid-cols-[100px_1fr_180px_auto] lg:items-center">
                    <a
                      href={`/admin/products/${product.slug}/edit`}
                      className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border bg-gray-50"
                    >
                      {product.mainImage?.imageUrl ? (
                        <img
                          src={product.mainImage.imageUrl}
                          alt={product.mainImage.altText || product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="px-2 text-center text-xs text-gray-500">
                          Sin imagen
                        </span>
                      )}
                    </a>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-semibold">
                          {product.name}
                        </h2>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${alert.className}`}
                        >
                          {alert.label}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-gray-500">
                        {product.slug}
                      </p>

                      <p className="mt-3 text-sm text-gray-600">
                        {alert.message}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-gray-100 px-3 py-1">
                          {getProductTypeLabel(product.type)}
                        </span>

                        <span className="rounded-full bg-gray-100 px-3 py-1">
                          {product.category}
                        </span>

                        <span className="rounded-full bg-gray-100 px-3 py-1">
                          {product.frameColor}
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Stock actual</p>
                      <p className="mt-1 text-3xl font-bold">{product.stock}</p>

                      <p className="mt-2 text-sm text-gray-600">
                        Valor: {formatMoney(product.price * product.stock)}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {product.isActive ? "Activo" : "Inactivo"}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 lg:items-end">
                      <a
                        href={`/admin/products/${product.slug}/edit`}
                        className="rounded-full bg-black px-5 py-2 text-center text-sm text-white"
                      >
                        Editar producto
                      </a>

                      <a
                        href="/admin/inventory"
                        className="rounded-full border px-5 py-2 text-center text-sm"
                      >
                        Ajustar stock
                      </a>
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

