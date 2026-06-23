"use client";

import { useState } from "react";
import { products } from "@/data/products";
import type { Product } from "@/types/product";
import AdminNav from "@/components/AdminNav";

type InventoryStatus =
  | "all"
  | "available"
  | "low-stock"
  | "out-of-stock"
  | "inactive";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<InventoryStatus>("all");

  const totalStock = products.reduce((sum, product) => sum + product.stock, 0);

  const activeProducts = products.filter((product) => product.isActive).length;

  const lowStockProducts = products.filter(
    (product) => product.isActive && product.stock > 0 && product.stock <= 3
  ).length;

  const outOfStockProducts = products.filter(
    (product) => product.isActive && product.stock === 0
  ).length;

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  const filteredProducts = products.filter((product) => {
    const status = getInventoryStatus(product);

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

  return (
    <main className="min-h-screen bg-white px-6 py-12 text-black">
      <section className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold">Inventario</h1>

        <p className="mt-4 text-gray-600">
          Vista temporal del inventario de productos.
        </p>

        <AdminNav />

        <div className="mt-10 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border p-5">
            <p className="text-sm text-gray-600">Stock total</p>
            <p className="mt-2 text-3xl font-bold">{totalStock}</p>
          </div>

          <div className="rounded-2xl border p-5">
            <p className="text-sm text-gray-600">Productos activos</p>
            <p className="mt-2 text-3xl font-bold">{activeProducts}</p>
          </div>

          <div className="rounded-2xl border p-5">
            <p className="text-sm text-gray-600">Stock bajo</p>
            <p className="mt-2 text-3xl font-bold">{lowStockProducts}</p>
          </div>

          <div className="rounded-2xl border p-5">
            <p className="text-sm text-gray-600">Agotados</p>
            <p className="mt-2 text-3xl font-bold">{outOfStockProducts}</p>
          </div>
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
              className={`rounded-full border px-4 py-2 text-sm ${
                statusFilter === "all" ? "border-black bg-black text-white" : ""
              }`}
            >
              Todos
            </button>

            <button
              onClick={() => setStatusFilter("available")}
              className={`rounded-full border px-4 py-2 text-sm ${
                statusFilter === "available"
                  ? "border-black bg-black text-white"
                  : ""
              }`}
            >
              Disponibles
            </button>

            <button
              onClick={() => setStatusFilter("low-stock")}
              className={`rounded-full border px-4 py-2 text-sm ${
                statusFilter === "low-stock"
                  ? "border-black bg-black text-white"
                  : ""
              }`}
            >
              Stock bajo
            </button>

            <button
              onClick={() => setStatusFilter("out-of-stock")}
              className={`rounded-full border px-4 py-2 text-sm ${
                statusFilter === "out-of-stock"
                  ? "border-black bg-black text-white"
                  : ""
              }`}
            >
              Agotados
            </button>

            <button
              onClick={() => setStatusFilter("inactive")}
              className={`rounded-full border px-4 py-2 text-sm ${
                statusFilter === "inactive"
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
          <div className="mt-10 overflow-hidden rounded-2xl border">
            <div className="grid grid-cols-4 bg-gray-50 px-5 py-3 text-sm font-semibold text-gray-600">
              <span>Producto</span>
              <span>Categoría</span>
              <span>Stock</span>
              <span>Estado</span>
            </div>

            {filteredProducts.map((product) => {
              const status = getInventoryStatus(product);

              return (
                <div
                  key={product.slug}
                  className="grid grid-cols-4 border-t px-5 py-4 text-sm"
                >
                  <span className="font-medium">{product.name}</span>

                  <span className="text-gray-600">{product.category}</span>

                  <span>{product.stock}</span>

                  <span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}


