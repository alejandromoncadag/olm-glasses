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
  const [products, setProducts] = useState<Product[]>([]);
  const [editedStock, setEditedStock] = useState<Record<string, number>>({});
  const [editedActive, setEditedActive] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<InventoryStatus>("all");
  const [loading, setLoading] = useState(true);
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
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
      const dbProducts: Product[] = data.products;

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

      const nextStock = editedStock[product.slug];
      const nextIsActive = editedActive[product.slug];

      if (!Number.isInteger(nextStock) || nextStock < 0) {
        alert("El stock debe ser un número entero mayor o igual a 0.");
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

      if (!response.ok) {
        throw new Error("Failed to update product");
      }

      const data = await response.json();

      setProducts((currentProducts) =>
        currentProducts.map((currentProduct) =>
          currentProduct.slug === product.slug
            ? data.product
            : currentProduct
        )
      );

      alert("Inventario actualizado correctamente.");
    } catch (error) {
      console.error(error);
      alert("No pudimos actualizar el inventario.");
    } finally {
      setSavingSlug(null);
    }
  }

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

  if (error) {
    return (
      <main className="min-h-screen bg-white px-6 py-12 text-black">
        <section className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-bold">Inventario</h1>

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
        <h1 className="text-4xl font-bold">Inventario</h1>

        <p className="mt-4 text-gray-600">
          Inventario conectado a PostgreSQL. Aquí puedes actualizar stock y
          disponibilidad.
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
            <div className="hidden grid-cols-5 bg-gray-50 px-5 py-3 text-sm font-semibold text-gray-600 md:grid">
              <span>Producto</span>
              <span>Categoría</span>
              <span>Stock</span>
              <span>Estado</span>
              <span>Acción</span>
            </div>

            {filteredProducts.map((product) => {
              const status = getInventoryStatus(product);

              return (
                <div
                  key={product.slug}
                  className="grid gap-4 border-t px-5 py-5 text-sm md:grid-cols-5 md:items-center"
                >
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {product.slug}
                    </p>
                  </div>

                  <p className="text-gray-600">{product.category}</p>

                  <input
                    type="number"
                    min="0"
                    value={editedStock[product.slug] ?? product.stock}
                    onChange={(event) =>
                      setEditedStock((currentStock) => ({
                        ...currentStock,
                        [product.slug]: Number(event.target.value),
                      }))
                    }
                    className="w-24 rounded-xl border px-3 py-2"
                  />

                  <div className="space-y-3">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${status.className}`}
                    >
                      {status.label}
                    </span>

                    <label className="flex items-center gap-2 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        checked={editedActive[product.slug] ?? product.isActive}
                        onChange={(event) =>
                          setEditedActive((currentActive) => ({
                            ...currentActive,
                            [product.slug]: event.target.checked,
                          }))
                        }
                      />
                      Activo
                    </label>
                  </div>

                  <button
                    onClick={() => saveProduct(product)}
                    disabled={savingSlug === product.slug}
                    className="w-fit rounded-full bg-black px-5 py-2 text-sm text-white disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    {savingSlug === product.slug ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8">
          <a
            href="/api/inventory-movements"
            target="_blank"
            className="text-sm font-medium underline"
          >
            Ver historial de movimientos de inventario
          </a>
        </div>
      </section>
    </main>
  );
}


