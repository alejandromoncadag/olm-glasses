"use client";

import { useEffect, useState } from "react";
import AdminNav from "@/components/AdminNav";
import { downloadCsv } from "@/lib/csv";

type MovementType = "purchase" | "sale" | "return" | "adjustment";

type InventoryMovement = {
    id: string;
    movementType: MovementType;
    quantity: number;
    previousStock: number;
    newStock: number;
    reason: string | null;
    orderId: string | null;
    orderNumber: string | null;
    createdAt: string;
    product: {
        slug: string;
        name: string;
    };
};

function getMovementLabel(type: MovementType) {
    if (type === "purchase") return "Compra / entrada";
    if (type === "sale") return "Venta";
    if (type === "return") return "Devolución";
    if (type === "adjustment") return "Ajuste";

    return "Movimiento";
}

function getMovementClassName(type: MovementType) {
    if (type === "purchase") return "bg-green-100 text-green-700";
    if (type === "sale") return "bg-blue-100 text-blue-700";
    if (type === "return") return "bg-purple-100 text-purple-700";
    if (type === "adjustment") return "bg-yellow-100 text-yellow-800";

    return "bg-gray-100 text-gray-700";
}

function formatDate(date: string) {
    return new Date(date).toLocaleString("es-MX", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}







export default function AdminInventoryMovementsPage() {
    const [movements, setMovements] = useState<InventoryMovement[]>([]);
    const [movementFilter, setMovementFilter] = useState<"all" | MovementType>(
        "all"
    );
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    async function fetchMovements() {
        try {
            setLoading(true);
            setError("");

            const response = await fetch("/api/inventory-movements");

            if (!response.ok) {
                throw new Error("Failed to fetch inventory movements");
            }

            const data = await response.json();
            setMovements(data.inventoryMovements);
        } catch (error) {
            console.error(error);
            setError("No pudimos cargar los movimientos de inventario.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchMovements();
    }, []);

    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    const filteredMovements = movements.filter((movement) => {
        const matchesType =
            movementFilter === "all" || movement.movementType === movementFilter;

        const searchableText = [
            movement.product.name,
            movement.product.slug,
            movement.reason,
            movement.orderId,
            movement.orderNumber,
            movement.movementType,
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        const matchesSearch =
            normalizedSearchTerm === "" ||
            searchableText.includes(normalizedSearchTerm);

        return matchesType && matchesSearch;
    });

    const totalSales = movements.filter(
        (movement) => movement.movementType === "sale"
    ).length;

    const totalAdjustments = movements.filter(
        (movement) => movement.movementType === "adjustment"
    ).length;

    const totalPurchases = movements.filter(
        (movement) => movement.movementType === "purchase"
    ).length;


    function exportInventoryMovementsCsv() {
        const rows = [
            [
                "Date",
                "Product Name",
                "Product Slug",
                "Movement Type",
                "Quantity",
                "Previous Stock",
                "New Stock",
                "Reason",
                "Order Number",
                "Order ID",
            ],
            ...filteredMovements.map((movement) => [
                formatDate(movement.createdAt),
                movement.product.name,
                movement.product.slug,
                getMovementLabel(movement.movementType),
                movement.quantity,
                movement.previousStock,
                movement.newStock,
                movement.reason || "",
                movement.orderNumber || "",
                movement.orderId || "",
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
                        Cargando movimientos desde PostgreSQL...
                    </p>
                </section>
            </main>
        );
    }

    if (error) {
        return (
            <main className="min-h-screen bg-white px-6 py-12 text-black">
                <section className="mx-auto max-w-6xl">
                    <h1 className="text-4xl font-bold">Movimientos de inventario</h1>

                    <p className="mt-4 text-red-600">{error}</p>

                    <button
                        onClick={fetchMovements}
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
                        <h1 className="text-4xl font-bold">Movimientos de inventario</h1>

                        <p className="mt-4 text-gray-600">
                            Historial de ventas, ajustes, entradas y cambios de stock desde
                            PostgreSQL.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                            onClick={exportInventoryMovementsCsv}
                            className="rounded-full bg-black px-6 py-3 text-center text-white"
                        >
                            Descargar CSV
                        </button>

                        <a
                            href="/admin/inventory"
                            className="rounded-full border px-6 py-3 text-center"
                        >
                            Regresar a inventario
                        </a>
                    </div>


                </div>

                <AdminNav />

                <div className="mt-10 grid gap-4 md:grid-cols-4">
                    <div className="rounded-2xl border p-5">
                        <p className="text-sm text-gray-600">Movimientos totales</p>
                        <p className="mt-2 text-3xl font-bold">{movements.length}</p>
                    </div>

                    <div className="rounded-2xl border p-5">
                        <p className="text-sm text-gray-600">Ventas</p>
                        <p className="mt-2 text-3xl font-bold">{totalSales}</p>
                    </div>

                    <div className="rounded-2xl border p-5">
                        <p className="text-sm text-gray-600">Ajustes</p>
                        <p className="mt-2 text-3xl font-bold">{totalAdjustments}</p>
                    </div>

                    <div className="rounded-2xl border p-5">
                        <p className="text-sm text-gray-600">Entradas</p>
                        <p className="mt-2 text-3xl font-bold">{totalPurchases}</p>
                    </div>
                </div>

                <div className="mt-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <input
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Buscar por producto, slug, razón u orden..."
                        className="w-full rounded-full border px-5 py-2 text-sm outline-none focus:border-black md:max-w-sm"
                    />

                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setMovementFilter("all")}
                            className={`rounded-full border px-4 py-2 text-sm ${movementFilter === "all"
                                ? "border-black bg-black text-white"
                                : ""
                                }`}
                        >
                            Todos
                        </button>

                        <button
                            onClick={() => setMovementFilter("sale")}
                            className={`rounded-full border px-4 py-2 text-sm ${movementFilter === "sale"
                                ? "border-black bg-black text-white"
                                : ""
                                }`}
                        >
                            Ventas
                        </button>

                        <button
                            onClick={() => setMovementFilter("adjustment")}
                            className={`rounded-full border px-4 py-2 text-sm ${movementFilter === "adjustment"
                                ? "border-black bg-black text-white"
                                : ""
                                }`}
                        >
                            Ajustes
                        </button>

                        <button
                            onClick={() => setMovementFilter("purchase")}
                            className={`rounded-full border px-4 py-2 text-sm ${movementFilter === "purchase"
                                ? "border-black bg-black text-white"
                                : ""
                                }`}
                        >
                            Entradas
                        </button>

                        <button
                            onClick={() => setMovementFilter("return")}
                            className={`rounded-full border px-4 py-2 text-sm ${movementFilter === "return"
                                ? "border-black bg-black text-white"
                                : ""
                                }`}
                        >
                            Devoluciones
                        </button>
                    </div>
                </div>

                <p className="mt-4 text-sm text-gray-600">
                    Mostrando {filteredMovements.length} de {movements.length} movimientos
                </p>

                {filteredMovements.length === 0 ? (
                    <div className="mt-10 rounded-2xl border p-8 text-center">
                        <h2 className="text-2xl font-semibold">
                            No encontramos movimientos
                        </h2>

                        <p className="mt-3 text-gray-600">
                            Intenta cambiar el filtro o buscar otro producto.
                        </p>
                    </div>
                ) : (
                    <div className="mt-10 overflow-hidden rounded-2xl border">
                        <div className="hidden grid-cols-6 bg-gray-50 px-5 py-3 text-sm font-semibold text-gray-600 md:grid">
                            <span>Fecha</span>
                            <span>Producto</span>
                            <span>Tipo</span>
                            <span>Cantidad</span>
                            <span>Stock</span>
                            <span>Razón</span>
                        </div>

                        {filteredMovements.map((movement) => (
                            <div
                                key={movement.id}
                                className="grid gap-4 border-t px-5 py-5 text-sm md:grid-cols-6 md:items-center"
                            >
                                <p className="text-gray-600">{formatDate(movement.createdAt)}</p>

                                <div>
                                    <p className="font-medium">{movement.product.name}</p>
                                    <p className="mt-1 text-xs text-gray-500">
                                        {movement.product.slug}
                                    </p>
                                </div>

                                <span
                                    className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${getMovementClassName(
                                        movement.movementType
                                    )}`}
                                >
                                    {getMovementLabel(movement.movementType)}
                                </span>

                                <p
                                    className={
                                        movement.quantity < 0
                                            ? "font-semibold text-red-600"
                                            : "font-semibold text-green-700"
                                    }
                                >
                                    {movement.quantity > 0
                                        ? `+${movement.quantity}`
                                        : movement.quantity}
                                </p>

                                <p>
                                    {movement.previousStock} → {movement.newStock}
                                </p>

                                <div>
                                    <p className="text-gray-600">
                                        {movement.reason || "Sin razón"}
                                    </p>

                                    {movement.orderNumber && (
                                        <a
                                            href={`/admin/orders/${movement.orderNumber}`}
                                            className="mt-1 block text-xs font-medium underline"
                                        >
                                            Pedido: {movement.orderNumber}
                                        </a>
                                    )}

                                    {!movement.orderNumber && movement.orderId && (
                                        <p className="mt-1 text-xs text-gray-500">
                                            Orden ID: {movement.orderId}
                                        </p>
                                    )}


                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}

