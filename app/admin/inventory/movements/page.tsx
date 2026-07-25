"use client";

import { useEffect, useMemo, useState } from "react";
import AdminNav from "@/components/AdminNav";
import { downloadCsv } from "@/lib/csv";

type Movement = {
  id: string;
  movementType: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string | null;
  createdAt: string;
  product: {
    id: string;
    slug: string;
    name: string;
    category: string;
    type: "eyeglasses" | "sunglasses" | "accessory" | "contact_lenses";
    stock: number;
    isActive: boolean;
  };
};

type MovementFilter =
  | "all"
  | "purchase"
  | "sale"
  | "adjustment"
  | "return";

type ProductTypeFilter =
  | "all"
  | "eyeglasses"
  | "sunglasses"
  | "accessory"
  | "contact_lenses";

function formatDateTime(date: string) {
  return new Date(date).toLocaleString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getMovementLabel(type: string) {
  if (type === "purchase") return "Entrada";
  if (type === "sale") return "Venta";
  if (type === "adjustment") return "Ajuste";
  if (type === "return") return "Devolución";

  return type;
}

function getMovementClassName(type: string) {
  if (type === "purchase") return "bg-green-100 text-green-700";
  if (type === "sale") return "bg-blue-100 text-blue-700";
  if (type === "adjustment") return "bg-yellow-100 text-yellow-800";
  if (type === "return") return "bg-purple-100 text-purple-700";

  return "bg-gray-100 text-gray-700";
}

function getProductTypeLabel(type: Movement["product"]["type"]) {
  if (type === "eyeglasses") return "Lentes ópticos";
  if (type === "sunglasses") return "Lentes de sol";
  if (type === "accessory") return "Accesorio";
  if (type === "contact_lenses") return "Lentes de contacto";

  return "Producto";
}

function getQuantityLabel(quantity: number) {
  if (quantity > 0) return `+${quantity}`;
  return String(quantity);
}

function getQuantityClassName(quantity: number) {
  if (quantity > 0) return "text-green-700";
  if (quantity < 0) return "text-red-600";
  return "text-gray-700";
}

export default function InventoryMovementsPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [movementFilter, setMovementFilter] =
    useState<MovementFilter>("all");
  const [productTypeFilter, setProductTypeFilter] =
    useState<ProductTypeFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchMovements() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/inventory/movements");

      if (!response.ok) {
        throw new Error("Failed to fetch inventory movements");
      }

      const data = await response.json();
      setMovements(data.movements || []);
    } catch (error) {
      console.error(error);
      setError("No pudimos cargar el historial de inventario.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMovements();
  }, []);

  const filteredMovements = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    return movements.filter((movement) => {
      const matchesMovement =
        movementFilter === "all" ||
        movement.movementType === movementFilter;

      const matchesProductType =
        productTypeFilter === "all" ||
        movement.product.type === productTypeFilter;

      const searchableText = [
        movement.product.name,
        movement.product.slug,
        movement.product.category,
        movement.product.type,
        getProductTypeLabel(movement.product.type),
        movement.movementType,
        getMovementLabel(movement.movementType),
        movement.reason,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        normalizedSearchTerm === "" ||
        searchableText.includes(normalizedSearchTerm);

      return matchesMovement && matchesProductType && matchesSearch;
    });
  }, [movementFilter, movements, productTypeFilter, searchTerm]);

  const totalMovements = movements.length;

  const totalIncoming = movements
    .filter((movement) => movement.quantity > 0)
    .reduce((sum, movement) => sum + movement.quantity, 0);

  const totalOutgoing = movements
    .filter((movement) => movement.quantity < 0)
    .reduce((sum, movement) => sum + Math.abs(movement.quantity), 0);

  const adjustmentCount = movements.filter(
    (movement) => movement.movementType === "adjustment"
  ).length;

  const latestMovement = movements[0];

  function exportMovementsCsv() {
    const rows = [
      [
        "Movement ID",
        "Product Name",
        "Product Slug",
        "Product Type",
        "Category",
        "Movement Type",
        "Quantity",
        "Previous Stock",
        "New Stock",
        "Reason",
        "Created At",
      ],
      ...filteredMovements.map((movement) => [
        movement.id,
        movement.product.name,
        movement.product.slug,
        getProductTypeLabel(movement.product.type),
        movement.product.category,
        getMovementLabel(movement.movementType),
        movement.quantity,
        movement.previousStock,
        movement.newStock,
        movement.reason || "",
        formatDateTime(movement.createdAt),
      ]),
    ];

    downloadCsv("olm-inventory-movements.csv", rows);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white px-6 py-12 text-black">
        <section className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-bold">Movimientos de inventario</h1>

          <p className="mt-4 text-gray-600">
            Cargando historial desde PostgreSQL...
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

            <h1 className="mt-4 text-4xl font-bold">
              Movimientos de inventario
            </h1>

            <p className="mt-4 max-w-2xl text-gray-600">
              Revisa entradas, ventas, ajustes y cambios de stock registrados en
              PostgreSQL.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={exportMovementsCsv}
              className="rounded-full border px-6 py-3 text-center"
            >
              Descargar CSV
            </button>

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
              onClick={fetchMovements}
              className="mt-3 rounded-full bg-black px-5 py-2 text-sm text-white"
            >
              Intentar de nuevo
            </button>
          </div>
        )}

        <div className="mt-10 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border p-5">
            <p className="text-sm text-gray-600">Movimientos totales</p>
            <p className="mt-2 text-3xl font-bold">{totalMovements}</p>
          </div>

          <div className="rounded-2xl border p-5">
            <p className="text-sm text-gray-600">Entradas</p>
            <p className="mt-2 text-3xl font-bold text-green-700">
              +{totalIncoming}
            </p>
          </div>

          <div className="rounded-2xl border p-5">
            <p className="text-sm text-gray-600">Salidas</p>
            <p className="mt-2 text-3xl font-bold text-red-600">
              -{totalOutgoing}
            </p>
          </div>

          <div className="rounded-2xl border p-5">
            <p className="text-sm text-gray-600">Ajustes</p>
            <p className="mt-2 text-3xl font-bold">{adjustmentCount}</p>
          </div>
        </div>

        {latestMovement && (
          <div className="mt-6 rounded-2xl border bg-gray-50 p-5">
            <p className="text-sm text-gray-500">Último movimiento</p>

            <div className="mt-2 flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div>
                <p className="text-lg font-semibold">
                  {latestMovement.product.name}
                </p>

                <p className="mt-1 text-sm text-gray-600">
                  {getMovementLabel(latestMovement.movementType)} ·{" "}
                  {getQuantityLabel(latestMovement.quantity)} unidades ·{" "}
                  {formatDateTime(latestMovement.createdAt)}
                </p>
              </div>

              <a
                href={`/admin/products/${latestMovement.product.slug}/edit`}
                className="rounded-full bg-black px-5 py-2 text-center text-sm text-white"
              >
                Ver producto
              </a>
            </div>
          </div>
        )}

        <div className="mt-8 rounded-2xl border p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto] lg:items-center">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar producto, slug, categoría, tipo o razón..."
              className="w-full rounded-full border px-5 py-3 text-sm outline-none focus:border-black"
            />

            <select
              value={movementFilter}
              onChange={(event) =>
                setMovementFilter(event.target.value as MovementFilter)
              }
              className="rounded-full border px-5 py-3 text-sm outline-none focus:border-black"
            >
              <option value="all">Todos los movimientos</option>
              <option value="purchase">Entradas</option>
              <option value="sale">Ventas</option>
              <option value="adjustment">Ajustes</option>
              <option value="return">Devoluciones</option>
            </select>

            <select
              value={productTypeFilter}
              onChange={(event) =>
                setProductTypeFilter(event.target.value as ProductTypeFilter)
              }
              className="rounded-full border px-5 py-3 text-sm outline-none focus:border-black"
            >
              <option value="all">Todos los tipos</option>
              <option value="eyeglasses">Lentes ópticos</option>
              <option value="sunglasses">Lentes de sol</option>
              <option value="accessory">Accesorios</option>
              <option value="contact_lenses">Lentes de contacto</option>
            </select>
          </div>

          <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <p className="text-sm text-gray-600">
              Mostrando {filteredMovements.length} de {movements.length}{" "}
              movimientos
            </p>

            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setMovementFilter("all");
                setProductTypeFilter("all");
              }}
              className="text-left text-sm text-gray-500 underline sm:text-right"
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        {filteredMovements.length === 0 ? (
          <div className="mt-10 rounded-2xl border p-8 text-center">
            <h2 className="text-2xl font-semibold">
              No encontramos movimientos
            </h2>

            <p className="mt-3 text-gray-600">
              Intenta cambiar los filtros o actualiza stock desde inventario.
            </p>
          </div>
        ) : (
          <div className="mt-10 overflow-hidden rounded-2xl border">
            <div className="hidden grid-cols-[1.3fr_1fr_1fr_1fr_1fr] bg-gray-50 px-5 py-3 text-sm font-semibold text-gray-600 lg:grid">
              <span>Producto</span>
              <span>Movimiento</span>
              <span>Cambio</span>
              <span>Stock</span>
              <span>Fecha</span>
            </div>

            {filteredMovements.map((movement) => (
              <article
                key={movement.id}
                className="grid gap-4 border-t px-5 py-5 text-sm lg:grid-cols-[1.3fr_1fr_1fr_1fr_1fr] lg:items-center"
              >
                <div>
                  <a
                    href={`/admin/products/${movement.product.slug}/edit`}
                    className="font-semibold underline"
                  >
                    {movement.product.name}
                  </a>

                  <p className="mt-1 text-xs text-gray-500">
                    {movement.product.slug}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-gray-100 px-3 py-1">
                      {getProductTypeLabel(movement.product.type)}
                    </span>

                    <span className="rounded-full bg-gray-100 px-3 py-1">
                      {movement.product.category}
                    </span>
                  </div>
                </div>

                <div>
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${getMovementClassName(
                      movement.movementType
                    )}`}
                  >
                    {getMovementLabel(movement.movementType)}
                  </span>

                  <p className="mt-2 text-xs text-gray-500">
                    {movement.reason || "Sin razón registrada"}
                  </p>
                </div>

                <p
                  className={`text-lg font-bold ${getQuantityClassName(
                    movement.quantity
                  )}`}
                >
                  {getQuantityLabel(movement.quantity)}
                </p>

                <div>
                  <p className="font-medium">
                    {movement.previousStock} → {movement.newStock}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Actual: {movement.product.stock}
                  </p>
                </div>

                <p className="text-gray-600">
                  {formatDateTime(movement.createdAt)}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

