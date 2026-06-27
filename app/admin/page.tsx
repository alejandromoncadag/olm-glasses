"use client";

import { useEffect, useState } from "react";
import AdminNav from "@/components/AdminNav";

type OrderStatus = "pending" | "processing" | "completed" | "cancelled";

type Order = {
  orderNumber: string;
  createdAt: string;
  status: OrderStatus;
};

type Product = {
  slug: string;
  name: string;
  stock: number;
  isActive: boolean;
};

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchAdminData() {
    try {
      setLoading(true);
      setError("");

      const [ordersResponse, productsResponse] = await Promise.all([
        fetch("/api/orders"),
        fetch("/api/products"),
      ]);

      if (!ordersResponse.ok || !productsResponse.ok) {
        throw new Error("Failed to fetch admin data");
      }

      const ordersData = await ordersResponse.json();
      const productsData = await productsResponse.json();

      setOrders(ordersData.orders);
      setProducts(productsData.products);
    } catch (error) {
      console.error(error);
      setError("No pudimos cargar el panel admin desde PostgreSQL.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAdminData();
  }, []);

  const totalOrders = orders.length;

  const pendingOrders = orders.filter(
    (order) => order.status === "pending"
  ).length;

  const processingOrders = orders.filter(
    (order) => order.status === "processing"
  ).length;

  const completedOrders = orders.filter(
    (order) => order.status === "completed"
  ).length;

  const activeProducts = products.filter((product) => product.isActive).length;

  const lowStockProducts = products.filter(
    (product) => product.isActive && product.stock > 0 && product.stock <= 3
  ).length;

  const outOfStockProducts = products.filter(
    (product) => product.isActive && product.stock === 0
  ).length;

  if (loading) {
    return (
      <main className="min-h-screen bg-white px-6 py-12 text-black">
        <section className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-bold">Admin</h1>

          <p className="mt-4 text-gray-600">
            Cargando panel admin desde PostgreSQL...
          </p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-white px-6 py-12 text-black">
        <section className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-bold">Admin</h1>

          <p className="mt-4 text-red-600">{error}</p>

          <button
            onClick={fetchAdminData}
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
        <h1 className="text-4xl font-bold">Admin</h1>

        <p className="mt-4 text-gray-600">
          Panel conectado a PostgreSQL para revisar pedidos, productos e
          inventario.
        </p>

        <AdminNav />

        <div className="mt-10 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border p-5">
            <p className="text-sm text-gray-600">Pedidos totales</p>
            <p className="mt-2 text-3xl font-bold">{totalOrders}</p>
          </div>

          <div className="rounded-2xl border p-5">
            <p className="text-sm text-gray-600">Pendientes</p>
            <p className="mt-2 text-3xl font-bold">{pendingOrders}</p>
          </div>

          <div className="rounded-2xl border p-5">
            <p className="text-sm text-gray-600">En proceso</p>
            <p className="mt-2 text-3xl font-bold">{processingOrders}</p>
          </div>

          <div className="rounded-2xl border p-5">
            <p className="text-sm text-gray-600">Completados</p>
            <p className="mt-2 text-3xl font-bold">{completedOrders}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
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

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <a
            href="/admin/orders"
            className="rounded-2xl border p-6 transition hover:shadow-lg"
          >
            <h2 className="text-2xl font-semibold">Pedidos</h2>

            <p className="mt-3 text-gray-600">
              Ver pedidos recibidos, datos del cliente, productos y estado.
            </p>
          </a>

          <a
            href="/admin/products"
            className="rounded-2xl border p-6 transition hover:shadow-lg"
          >
            <h2 className="text-2xl font-semibold">Productos</h2>

            <p className="mt-3 text-gray-600">
              Revisar catálogo, precios, estilos y productos activos.
            </p>
          </a>

          <a
            href="/admin/inventory"
            className="rounded-2xl border p-6 transition hover:shadow-lg"
          >
            <h2 className="text-2xl font-semibold">Inventario</h2>

            <p className="mt-3 text-gray-600">
              Ver stock, productos agotados y productos con stock bajo.
            </p>
          </a>
        </div>
      </section>
    </main>
  );
}

