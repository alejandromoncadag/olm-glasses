"use client";

import { useEffect, useState } from "react";
import { products } from "@/data/products";
import AdminNav from "@/components/AdminNav";

type OrderStatus = "pending" | "processing" | "completed";

type Order = {
  orderNumber: string;
  createdAt: string;
  status: OrderStatus;
};

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const savedOrders = localStorage.getItem("olm-orders");

    if (savedOrders) {
      setOrders(JSON.parse(savedOrders));
    }
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

  return (
    <main className="min-h-screen bg-white px-6 py-12 text-black">
      <section className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold">Admin</h1>

        <p className="mt-4 text-gray-600">
          Panel temporal para revisar pedidos, productos e inventario.
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