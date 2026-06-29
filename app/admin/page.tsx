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

      setOrders(ordersData.orders || []);
      setProducts(productsData.products || []);
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

  const cancelledOrders = orders.filter(
    (order) => order.status === "cancelled"
  ).length;

  const activeProducts = products.filter((product) => product.isActive).length;

  const inactiveProducts = products.filter(
    (product) => !product.isActive
  ).length;

  const lowStockProducts = products.filter(
    (product) => product.isActive && product.stock > 0 && product.stock <= 3
  ).length;

  const outOfStockProducts = products.filter(
    (product) => product.isActive && product.stock === 0
  ).length;

  const quickLinks = [
    {
      title: "Reportes",
      href: "/admin/reports",
      description:
        "Ver ventas mensuales, mejores clientes, productos más vendidos y exportar CSV.",
    },
    {
      title: "Pedidos",
      href: "/admin/orders",
      description:
        "Ver pedidos recibidos, datos del cliente, productos, pagos y estado.",
    },
    {
      title: "Clientes",
      href: "/admin/customers",
      description:
        "Revisar clientes, historial de pedidos, total gastado y datos de contacto.",
    },
    {
      title: "Productos",
      href: "/admin/products",
      description:
        "Administrar catálogo, precios, estilos, stock y productos activos.",
    },
    {
      title: "Inventario",
      href: "/admin/inventory",
      description:
        "Actualizar stock, activar/desactivar productos y revisar existencias.",
    },
    {
      title: "Stock bajo",
      href: "/admin/inventory/low-stock",
      description:
        "Ver productos activos con pocas piezas disponibles o agotados.",
    },
    {
      title: "Movimientos",
      href: "/admin/inventory/movements",
      description:
        "Revisar historial de ventas, ajustes, entradas y cambios de inventario.",
    },
  ];

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
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <h1 className="text-4xl font-bold">Admin</h1>

            <p className="mt-4 text-gray-600">
              Panel conectado a PostgreSQL para revisar pedidos, clientes,
              productos, inventario y reportes.
            </p>
          </div>

          <a
            href="/admin/reports"
            className="rounded-full bg-black px-6 py-3 text-center text-white"
          >
            Ver reportes
          </a>
        </div>

        <AdminNav />

        <div className="mt-10 grid gap-4 md:grid-cols-5">
          <a
            href="/admin/orders"
            className="rounded-2xl border p-5 transition hover:shadow-sm"
          >
            <p className="text-sm text-gray-600">Pedidos totales</p>
            <p className="mt-2 text-3xl font-bold">{totalOrders}</p>
          </a>

          <a
            href="/admin/orders"
            className="rounded-2xl border p-5 transition hover:shadow-sm"
          >
            <p className="text-sm text-gray-600">Pendientes</p>
            <p className="mt-2 text-3xl font-bold">{pendingOrders}</p>
          </a>

          <a
            href="/admin/orders"
            className="rounded-2xl border p-5 transition hover:shadow-sm"
          >
            <p className="text-sm text-gray-600">En proceso</p>
            <p className="mt-2 text-3xl font-bold">{processingOrders}</p>
          </a>

          <a
            href="/admin/orders"
            className="rounded-2xl border p-5 transition hover:shadow-sm"
          >
            <p className="text-sm text-gray-600">Completados</p>
            <p className="mt-2 text-3xl font-bold">{completedOrders}</p>
          </a>

          <a
            href="/admin/orders"
            className="rounded-2xl border p-5 transition hover:shadow-sm"
          >
            <p className="text-sm text-gray-600">Cancelados</p>
            <p className="mt-2 text-3xl font-bold">{cancelledOrders}</p>
          </a>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <a
            href="/admin/products"
            className="rounded-2xl border p-5 transition hover:shadow-sm"
          >
            <p className="text-sm text-gray-600">Productos activos</p>
            <p className="mt-2 text-3xl font-bold">{activeProducts}</p>
          </a>

          <a
            href="/admin/products"
            className="rounded-2xl border p-5 transition hover:shadow-sm"
          >
            <p className="text-sm text-gray-600">Productos inactivos</p>
            <p className="mt-2 text-3xl font-bold">{inactiveProducts}</p>
          </a>

          <a
            href="/admin/inventory/low-stock"
            className="rounded-2xl border p-5 transition hover:shadow-sm"
          >
            <p className="text-sm text-gray-600">Stock bajo</p>
            <p className="mt-2 text-3xl font-bold">{lowStockProducts}</p>
          </a>

          <a
            href="/admin/inventory/low-stock"
            className="rounded-2xl border p-5 transition hover:shadow-sm"
          >
            <p className="text-sm text-gray-600">Agotados</p>
            <p className="mt-2 text-3xl font-bold">{outOfStockProducts}</p>
          </a>
        </div>

        <div className="mt-10">
          <h2 className="text-2xl font-semibold">Accesos rápidos</h2>

          <p className="mt-2 text-gray-600">
            Entra directo a las secciones principales del administrador.
          </p>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {quickLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-2xl border p-6 transition hover:shadow-lg"
              >
                <h3 className="text-2xl font-semibold">{link.title}</h3>

                <p className="mt-3 text-gray-600">{link.description}</p>

                <span className="mt-5 inline-block text-sm font-medium underline">
                  Abrir
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

