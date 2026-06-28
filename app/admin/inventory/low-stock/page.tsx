"use client";

import { useEffect, useState } from "react";
import AdminNav from "@/components/AdminNav";
import { downloadCsv } from "@/lib/csv";

type ProductType = "eyeglasses" | "sunglasses";

type Product = {
    id: string;
    slug: string;
    name: string;
    price: number;
    type: ProductType;
    color: string;
    stock: number;
    isActive: boolean;
};

function formatMoney(amount: number) {
    return `$${amount.toLocaleString("es-MX")} MXN`;
}

function getTypeLabel(type: ProductType) {
    if (type === "eyeglasses") return "Lentes ópticos";
    if (type === "sunglasses") return "Lentes de sol";

    return "Producto";
}

export default function AdminLowStockPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [stockLimit, setStockLimit] = useState(3);
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
            setError("No pudimos cargar productos desde PostgreSQL.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchProducts();
    }, []);

    const lowStockProducts = products
        .filter((product) => product.isActive && product.stock <= stockLimit)
        .sort((a, b) => a.stock - b.stock);

    function exportLowStockCsv() {
        const rows = [
            [
                "Product ID",
                "Slug",
                "Name",
                "Type",
                "Color",
                "Price",
                "Stock",
                "Active",
                "Stock Limit",
            ],
            ...lowStockProducts.map((product) => [
                product.id,
                product.slug,
                product.name,
                product.type,
                product.color,
                product.price,
                product.stock,
                product.isActive ? "Yes" : "No",
                stockLimit,
            ]),
        ];

        downloadCsv("olm-low-stock-products.csv", rows);
    }



    if (loading) {
        return (
            <main className="min-h-screen bg-white px-6 py-12 text-black">
                <section className="mx-auto max-w-6xl">
                    <h1 className="text-4xl font-bold">Stock bajo</h1>

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
                    <h1 className="text-4xl font-bold">Stock bajo</h1>

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
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                    <div>
                        <h1 className="text-4xl font-bold">Stock bajo</h1>

                        <p className="mt-4 text-gray-600">
                            Productos activos con pocas piezas disponibles.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                            onClick={exportLowStockCsv}
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

                <div className="mt-10 rounded-2xl border p-6">
                    <label className="text-sm font-medium text-gray-700">
                        Mostrar productos con stock menor o igual a:
                    </label>

                    <input
                        type="number"
                        min="0"
                        value={stockLimit}
                        onChange={(event) => setStockLimit(Number(event.target.value))}
                        className="mt-3 w-full max-w-xs rounded-xl border px-4 py-3 outline-none focus:border-black"
                    />
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border p-5">
                        <p className="text-sm text-gray-600">Productos activos</p>
                        <p className="mt-2 text-3xl font-bold">
                            {products.filter((product) => product.isActive).length}
                        </p>
                    </div>

                    <div className="rounded-2xl border p-5">
                        <p className="text-sm text-gray-600">Con stock bajo</p>
                        <p className="mt-2 text-3xl font-bold">
                            {lowStockProducts.length}
                        </p>
                    </div>

                    <div className="rounded-2xl border p-5">
                        <p className="text-sm text-gray-600">Límite actual</p>
                        <p className="mt-2 text-3xl font-bold">{stockLimit}</p>
                    </div>
                </div>

                {lowStockProducts.length === 0 ? (
                    <div className="mt-10 rounded-2xl border p-8 text-center">
                        <h2 className="text-2xl font-semibold">
                            No hay productos con stock bajo
                        </h2>

                        <p className="mt-3 text-gray-600">
                            Todos los productos activos tienen más de {stockLimit} piezas.
                        </p>
                    </div>
                ) : (
                    <div className="mt-10 overflow-hidden rounded-2xl border">
                        <div className="hidden grid-cols-6 bg-gray-50 px-5 py-3 text-sm font-semibold text-gray-600 md:grid">
                            <span>Producto</span>
                            <span>Tipo</span>
                            <span>Color</span>
                            <span>Precio</span>
                            <span>Stock</span>
                            <span>Acción</span>
                        </div>

                        {lowStockProducts.map((product) => (
                            <div
                                key={product.id}
                                className="grid gap-4 border-t px-5 py-5 text-sm md:grid-cols-6 md:items-center"
                            >
                                <div>
                                    <p className="font-medium">{product.name}</p>
                                    <p className="mt-1 text-xs text-gray-500">{product.slug}</p>
                                </div>

                                <p>{getTypeLabel(product.type)}</p>

                                <p className="text-gray-600">{product.color}</p>

                                <p className="font-medium">{formatMoney(product.price)}</p>

                                <p
                                    className={
                                        product.stock === 0
                                            ? "font-bold text-red-600"
                                            : "font-bold text-yellow-700"
                                    }
                                >
                                    {product.stock}
                                </p>

                                <a
                                    href={`/admin/products/${product.slug}/edit`}
                                    className="w-fit rounded-full bg-black px-4 py-2 text-sm text-white"
                                >
                                    Editar stock
                                </a>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}

