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

type InventoryStatus =
  | "all"
  | "available"
  | "low-stock"
  | "out-of-stock"
  | "inactive";

type TypeFilter = "all" | "eyeglasses" | "sunglasses";

type SortBy = "name" | "stock-low" | "stock-high" | "value-high";

function formatMoney(amount: number) {
  return `$${amount.toLocaleString("es-MX")} MXN`;
}

function getProductTypeLabel(type: Product["type"]) {
  if (type === "eyeglasses") return "Lentes ópticos";
  if (type === "sunglasses") return "Lentes de sol";

  return "Producto";
}

function getInventoryStatus(product: Product) {
  if (!product.isActive) {
    return {
      key: "inactive" as InventoryStatus,
      label: "Inactivo",
      className: "bg-gray-100 text-gray-700",
    };
  }

  if (product.stock === 0) {
    return {
      key: "out-of-stock" as InventoryStatus,
      label: "Agotado",
      className: "bg-red-100 text-red-700",
    };
  }

  if (product.stock <= 3) {
    return {
      key: "low-stock" as InventoryStatus,
      label: "Stock bajo",
      className: "bg-yellow-100 text-yellow-800",
    };
  }

  return {
    key: "available" as InventoryStatus,
    label: "Disponible",
    className: "bg-green-100 text-green-700",
  };
}

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editedStock, setEditedStock] = useState<Record<string, number>>({});
  const [editedActive, setEditedActive] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<InventoryStatus>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("stock-low");
  const [loading, setLoading] = useState(true);
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function fetchProducts() {
    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      const response = await fetch("/api/products");

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await response.json();
      const dbProducts: Product[] = data.products || [];

      setProducts(dbProducts);

      const stockValues: Record<string, number> = {};
      const activeValues: Record<string, boolean> = {};

      dbProducts.forEach((product) => {
        stockValues[product.slug] = product.stock;
        activeValues[product.slug] = product.isActive;
      });

      setEditedStock(stockValues);
      setEditedActive(activeValues);
    } catch (error) {
      console.error(error);
      setError("No pudimos cargar el inventario desde PostgreSQL.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  async function saveProduct(product: Product) {
    try {
      setSavingSlug(product.slug);
      setSuccessMessage("");
      setError("");

      const nextStock = editedStock[product.slug];
      const nextIsActive = editedActive[product.slug];

      if (!Number.isInteger(nextStock) || nextStock < 0) {
        setError("El stock debe ser un número entero mayor o igual a 0.");
        return;
      }

      const response = await fetch(`/api/products/${product.slug}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stock: nextStock,
          isActive: nextIsActive,
          reason: "Admin inventory update",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "No pudimos actualizar el inventario.");
        return;
      }

      setProducts((currentProducts) =>
        currentProducts.map((currentProduct) =>
          currentProduct.slug === product.slug
            ? {
                ...currentProduct,
                ...data.product,
                mainImage: data.product?.mainImage || currentProduct.mainImage,
              }
            : currentProduct
        )
      );

      setSuccessMessage(`Inventario actualizado: ${product.name}`);
    } catch (error) {
      console.error(error);
      setError("No pudimos actualizar el inventario.");
    } finally {
      setSavingSlug(null);
    }
  }

  const filteredProducts = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    return products
      .filter((product) => {
        const status = getInventoryStatus(product);

        const matchesStatus =
          statusFilter === "all" || status.key === statusFilter;

        const matchesType = typeFilter === "all" || product.type === typeFilter;

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
        if (sortBy === "stock-low") return a.stock - b.stock;
        if (sortBy === "stock-high") return b.stock - a.stock;
        if (sortBy === "value-high") {
          return b.price * b.stock - a.price * a.stock;
        }

        return a.name.localeCompare(b.name);
      });
  }, [products, searchTerm, sortBy, statusFilter, typeFilter]);

  const totalStock = products.reduce((sum, product) => sum + product.stock, 0);

  const activeProducts = products.filter((product) => product.isActive).length;

  const inactiveProducts = products.filter((product) => !product.isActive).length;

  const lowStockProducts = products.filter(
    (product) => product.isActive && product.stock > 0 && product.stock <= 3
  ).length;

  const outOfStockProducts = products.filter(
    (product) => product.isActive && product.stock === 0
  ).length;

  const inventoryValue = products
    .filter((product) => product.isActive)
    .reduce((sum, product) => sum + product.stock * product.price, 0);

  if (loading) {
    return (
      <main className="min-h-screen bg-white px-6 py-12 text-black">
        <section className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-bold">Inventario</h1>

          <p className="mt-4 text-gray-600">
            Cargando inventario desde PostgreSQL...
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
            <h1 className="text-4xl font-bold">Inventario</h1>

            <p className="mt-4 max-w-2xl text-gray-600">
              Controla stock, disponibilidad y alertas de inventario de todos
              los productos.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="/admin/products"
              className="rounded-full border px-6 py-3 text-center"
            >
              Ver productos
            </a>

            <a
              href="/admin/products/new"
              className="rounded-full bg-black px-6 py-3 text-center text-white"
            >
              Agregar producto
            </a>
          </div>
        </div>

        <AdminNav />

        {error && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-medium text-green-700">
              {successMessage}
            </p>
          </div>
        )}

        <div className="mt-10 grid gap-4 md:grid-cols-5">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className="rounded-2xl border p-5 text-left transition hover:shadow-sm"
          >
            <p className="text-sm text-gray-600">Stock total</p>
            <p className="mt-2 text-3xl font-bold">{totalStock}</p>
            <p className="mt-2 text-xs text-gray-500">
              {products.length} productos
            </p>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("available")}
            className="rounded-2xl border p-5 text-left transition hover:shadow-sm"
          >
            <p className="text-sm text-gray-600">Activos</p>
            <p className="mt-2 text-3xl font-bold">{activeProducts}</p>
            <p className="mt-2 text-xs text-gray-500">
              {inactiveProducts} inactivos
            </p>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("low-stock")}
            className="rounded-2xl border p-5 text-left transition hover:shadow-sm"
          >
            <p className="text-sm text-gray-600">Stock bajo</p>
            <p className="mt-2 text-3xl font-bold">{lowStockProducts}</p>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("out-of-stock")}
            className="rounded-2xl border p-5 text-left transition hover:shadow-sm"
          >
            <p className="text-sm text-gray-600">Agotados</p>
            <p className="mt-2 text-3xl font-bold">{outOfStockProducts}</p>
          </button>

          <div className="rounded-2xl border p-5">
            <p className="text-sm text-gray-600">Valor inventario</p>
            <p className="mt-2 text-2xl font-bold">
              {formatMoney(inventoryValue)}
            </p>
            <p className="mt-2 text-xs text-gray-500">Solo productos activos</p>
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
              onChange={(event) => setTypeFilter(event.target.value as TypeFilter)}
              className="rounded-full border px-5 py-3 text-sm outline-none focus:border-black"
            >
              <option value="all">Todos los tipos</option>
              <option value="eyeglasses">Lentes ópticos</option>
              <option value="sunglasses">Lentes de sol</option>
            </select>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as InventoryStatus)
              }
              className="rounded-full border px-5 py-3 text-sm outline-none focus:border-black"
            >
              <option value="all">Todos los estados</option>
              <option value="available">Disponibles</option>
              <option value="low-stock">Stock bajo</option>
              <option value="out-of-stock">Agotados</option>
              <option value="inactive">Inactivos</option>
            </select>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortBy)}
              className="rounded-full border px-5 py-3 text-sm outline-none focus:border-black"
            >
              <option value="stock-low">Stock menor</option>
              <option value="stock-high">Stock mayor</option>
              <option value="value-high">Mayor valor</option>
              <option value="name">Nombre A-Z</option>
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
                setSortBy("stock-low");
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
          <div className="mt-10 space-y-4">
            {filteredProducts.map((product) => {
              const status = getInventoryStatus(product);
              const nextStock = editedStock[product.slug] ?? product.stock;
              const nextIsActive =
                editedActive[product.slug] ?? product.isActive;

              const hasChanges =
                nextStock !== product.stock || nextIsActive !== product.isActive;

              return (
                <article key={product.slug} className="rounded-2xl border p-5">
                  <div className="grid gap-5 lg:grid-cols-[90px_1fr_180px_180px_auto] lg:items-center">
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
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-gray-500">
                        {product.slug}
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
                      <p className="text-sm text-gray-500">Stock</p>

                      <input
                        type="number"
                        min="0"
                        value={nextStock}
                        onChange={(event) =>
                          setEditedStock((currentStock) => ({
                            ...currentStock,
                            [product.slug]: Number(event.target.value),
                          }))
                        }
                        className="mt-2 w-28 rounded-xl border px-3 py-2 outline-none focus:border-black"
                      />

                      <p className="mt-2 text-xs text-gray-500">
                        Actual: {product.stock}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Estado</p>

                      <label className="mt-3 flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={nextIsActive}
                          onChange={(event) =>
                            setEditedActive((currentActive) => ({
                              ...currentActive,
                              [product.slug]: event.target.checked,
                            }))
                          }
                        />

                        Activo
                      </label>

                      <p className="mt-2 text-xs text-gray-500">
                        Valor: {formatMoney(product.price * nextStock)}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 lg:items-end">
                      <button
                        type="button"
                        onClick={() => saveProduct(product)}
                        disabled={savingSlug === product.slug || !hasChanges}
                        className="rounded-full bg-black px-5 py-2 text-sm text-white disabled:cursor-not-allowed disabled:bg-gray-300"
                      >
                        {savingSlug === product.slug
                          ? "Guardando..."
                          : hasChanges
                            ? "Guardar"
                            : "Sin cambios"}
                      </button>

                      <a
                        href={`/admin/products/${product.slug}/edit`}
                        className="rounded-full border px-5 py-2 text-center text-sm"
                      >
                        Editar
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



