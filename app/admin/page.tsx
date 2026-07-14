"use client";

import { useEffect, useState } from "react";
import AdminNav from "@/components/AdminNav";

type OrderStatus = "pending" | "processing" | "completed" | "cancelled";
type PaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "refunded";

type Order = {
  orderNumber: string;
  createdAt: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  total: number;
  shippingCarrier?: string | null;
  trackingNumber?: string | null;
  customer?: {
    fullName?: string;
    email?: string;
    phone?: string;
  };
};

type Product = {
  slug: string;
  name: string;
  stock: number;
  isActive: boolean;
};

type MonthlySale = {
  monthKey: string;
  monthLabel: string;
  orderCount: number;
  revenue: number;
  paidRevenue: number;
  averageOrderValue: number;
};

type ProductSale = {
  productId: string;
  slug: string;
  name: string;
  type: string;
  category: string;
  currentStock: number;
  unitsSold: number;
  revenue: number;
  orderCount: number;
};

type TopCustomer = {
  customerId: string;
  fullName: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string;
};

function formatMoney(amount: number) {
  return `$${amount.toLocaleString("es-MX")} MXN`;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getStatusLabel(status: OrderStatus) {
  if (status === "pending") return "Pendiente";
  if (status === "processing") return "En proceso";
  if (status === "completed") return "Completado";
  if (status === "cancelled") return "Cancelado";

  return "Pendiente";
}

function getPaymentStatusLabel(status: PaymentStatus) {
  if (status === "unpaid") return "Sin pagar";
  if (status === "pending") return "Pago pendiente";
  if (status === "paid") return "Pagado";
  if (status === "failed") return "Fallido";
  if (status === "refunded") return "Reembolsado";

  return "Sin pagar";
}

function getStatusClassName(status: OrderStatus) {
  if (status === "pending") return "bg-yellow-100 text-yellow-800";
  if (status === "processing") return "bg-blue-100 text-blue-700";
  if (status === "completed") return "bg-green-100 text-green-700";
  if (status === "cancelled") return "bg-red-100 text-red-700";

  return "bg-gray-100 text-gray-700";
}

function getPaymentStatusClassName(status: PaymentStatus) {
  if (status === "paid") return "bg-green-100 text-green-700";
  if (status === "pending") return "bg-yellow-100 text-yellow-800";
  if (status === "unpaid") return "bg-gray-100 text-gray-700";
  if (status === "failed") return "bg-red-100 text-red-700";
  if (status === "refunded") return "bg-blue-100 text-blue-700";

  return "bg-gray-100 text-gray-700";
}

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [monthlySales, setMonthlySales] = useState<MonthlySale[]>([]);
  const [productSales, setProductSales] = useState<ProductSale[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchAdminData() {
    try {
      setLoading(true);
      setError("");

      const [
        ordersResponse,
        productsResponse,
        monthlySalesResponse,
        productSalesResponse,
        topCustomersResponse,
      ] = await Promise.all([
        fetch("/api/orders"),
        fetch("/api/products"),
        fetch("/api/reports/monthly-sales"),
        fetch("/api/reports/product-sales"),
        fetch("/api/reports/top-customers"),
      ]);

      if (
        !ordersResponse.ok ||
        !productsResponse.ok ||
        !monthlySalesResponse.ok ||
        !productSalesResponse.ok ||
        !topCustomersResponse.ok
      ) {
        throw new Error("Failed to fetch admin data");
      }

      const ordersData = await ordersResponse.json();
      const productsData = await productsResponse.json();
      const monthlySalesData = await monthlySalesResponse.json();
      const productSalesData = await productSalesResponse.json();
      const topCustomersData = await topCustomersResponse.json();

      setOrders(ordersData.orders || []);
      setProducts(productsData.products || []);
      setMonthlySales(monthlySalesData.months || []);
      setProductSales(productSalesData.products || []);
      setTopCustomers(topCustomersData.customers || []);
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

  const unpaidOrders = orders.filter(
    (order) => order.paymentStatus === "unpaid"
  ).length;

  const paidOrders = orders.filter(
    (order) => order.paymentStatus === "paid"
  ).length;

  const missingTrackingOrders = orders.filter(
    (order) =>
      order.status !== "cancelled" &&
      (!order.shippingCarrier || !order.trackingNumber)
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

  const currentMonth = monthlySales[0];

  const estimatedRevenue = orders
    .filter((order) => order.status !== "cancelled")
    .reduce((sum, order) => sum + order.total, 0);

  const paidRevenue = orders
    .filter(
      (order) => order.status !== "cancelled" && order.paymentStatus === "paid"
    )
    .reduce((sum, order) => sum + order.total, 0);

  const recentOrders = orders.slice(0, 5);
  const topProductsPreview = productSales.slice(0, 5);
  const topCustomersPreview = topCustomers.slice(0, 5);

  const quickLinks = [
    {
      title: "Pedidos",
      href: "/admin/orders",
      description: "Ver pedidos, pagos, envío, rastreo y estado.",
    },
    {
      title: "Reportes",
      href: "/admin/reports",
      description: "Analizar ventas mensuales, productos y clientes.",
    },
    {
      title: "Productos",
      href: "/admin/products",
      description: "Administrar catálogo, precios, imágenes y productos.",
    },
    {
      title: "Inventario",
      href: "/admin/inventory",
      description: "Actualizar stock y revisar existencias.",
    },
    {
      title: "Clientes",
      href: "/admin/customers",
      description: "Ver clientes, historial y total gastado.",
    },
    {
      title: "Stock bajo",
      href: "/admin/inventory/low-stock",
      description: "Ver productos con pocas piezas o agotados.",
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
            type="button"
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
            <p className="text-sm font-medium text-gray-500">Óptica OLM</p>

            <h1 className="mt-2 text-4xl font-bold">Panel admin</h1>

            <p className="mt-4 max-w-2xl text-gray-600">
              Revisa ventas, pedidos, pagos, clientes, productos e inventario
              desde un solo lugar.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="/admin/orders"
              className="rounded-full bg-black px-6 py-3 text-center text-white"
            >
              Ver pedidos
            </a>

            <a
              href="/admin/reports"
              className="rounded-full border px-6 py-3 text-center"
            >
              Ver reportes
            </a>
          </div>
        </div>

        <AdminNav />

        <div className="mt-10 grid gap-4 md:grid-cols-4">
          <a
            href="/admin/orders"
            className="rounded-2xl border p-5 transition hover:shadow-sm"
          >
            <p className="text-sm text-gray-600">Pedidos totales</p>
            <p className="mt-2 text-3xl font-bold">{totalOrders}</p>
            <p className="mt-2 text-xs text-gray-500">
              {pendingOrders} pendientes
            </p>
          </a>

          <a
            href="/admin/orders"
            className="rounded-2xl border p-5 transition hover:shadow-sm"
          >
            <p className="text-sm text-gray-600">Ventas estimadas</p>
            <p className="mt-2 text-3xl font-bold">
              {formatMoney(estimatedRevenue)}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Sin contar pedidos cancelados
            </p>
          </a>

          <a
            href="/admin/orders"
            className="rounded-2xl border p-5 transition hover:shadow-sm"
          >
            <p className="text-sm text-gray-600">Pagado</p>
            <p className="mt-2 text-3xl font-bold">{formatMoney(paidRevenue)}</p>
            <p className="mt-2 text-xs text-gray-500">
              {paidOrders} pedidos pagados
            </p>
          </a>

          <a
            href="/admin/inventory/low-stock"
            className="rounded-2xl border p-5 transition hover:shadow-sm"
          >
            <p className="text-sm text-gray-600">Alertas inventario</p>
            <p className="mt-2 text-3xl font-bold">
              {lowStockProducts + outOfStockProducts}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              {lowStockProducts} bajo stock · {outOfStockProducts} agotados
            </p>
          </a>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border p-5">
            <p className="text-sm text-gray-600">Pendientes</p>
            <p className="mt-2 text-3xl font-bold">{pendingOrders}</p>
          </div>

          <div className="rounded-2xl border p-5">
            <p className="text-sm text-gray-600">En proceso</p>
            <p className="mt-2 text-3xl font-bold">{processingOrders}</p>
          </div>

          <div className="rounded-2xl border p-5">
            <p className="text-sm text-gray-600">Sin pagar</p>
            <p className="mt-2 text-3xl font-bold">{unpaidOrders}</p>
          </div>

          <div className="rounded-2xl border p-5">
            <p className="text-sm text-gray-600">Falta rastreo</p>
            <p className="mt-2 text-3xl font-bold">{missingTrackingOrders}</p>
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-8">
            <section className="rounded-2xl border p-6">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-2xl font-semibold">Resumen mensual</h2>

                  <p className="mt-2 text-sm text-gray-600">
                    Información tomada de tus reportes de ventas.
                  </p>
                </div>

                <a href="/admin/reports" className="text-sm underline">
                  Ver reportes
                </a>
              </div>

              {currentMonth ? (
                <div className="mt-6 grid gap-4 md:grid-cols-4">
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">Mes</p>
                    <p className="mt-1 font-semibold">
                      {currentMonth.monthLabel}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">Pedidos</p>
                    <p className="mt-1 text-2xl font-bold">
                      {currentMonth.orderCount}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">Ventas</p>
                    <p className="mt-1 font-semibold">
                      {formatMoney(currentMonth.revenue)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">Promedio</p>
                    <p className="mt-1 font-semibold">
                      {formatMoney(currentMonth.averageOrderValue)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-2xl bg-gray-50 p-5">
                  <p className="text-gray-600">
                    Todavía no hay ventas suficientes para mostrar un resumen
                    mensual.
                  </p>
                </div>
              )}
            </section>

            <section className="rounded-2xl border p-6">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-2xl font-semibold">Pedidos recientes</h2>

                  <p className="mt-2 text-sm text-gray-600">
                    Los últimos pedidos recibidos en la tienda.
                  </p>
                </div>

                <a href="/admin/orders" className="text-sm underline">
                  Ver todos
                </a>
              </div>

              {recentOrders.length === 0 ? (
                <div className="mt-6 rounded-2xl bg-gray-50 p-5">
                  <p className="text-gray-600">Todavía no hay pedidos.</p>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {recentOrders.map((order) => (
                    <a
                      key={order.orderNumber}
                      href={`/admin/orders/${order.orderNumber}`}
                      className="block rounded-2xl bg-gray-50 p-5 transition hover:bg-gray-100"
                    >
                      <div className="flex flex-col justify-between gap-3 md:flex-row">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">
                              {order.orderNumber}
                            </p>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClassName(
                                order.status
                              )}`}
                            >
                              {getStatusLabel(order.status)}
                            </span>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${getPaymentStatusClassName(
                                order.paymentStatus
                              )}`}
                            >
                              {getPaymentStatusLabel(order.paymentStatus)}
                            </span>
                          </div>

                          <p className="mt-2 text-sm text-gray-600">
                            {order.customer?.fullName || "Sin cliente"} ·{" "}
                            {formatDate(order.createdAt)}
                          </p>
                        </div>

                        <p className="font-semibold">{formatMoney(order.total)}</p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border p-6">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-2xl font-semibold">Productos destacados</h2>

                  <p className="mt-2 text-sm text-gray-600">
                    Productos con más unidades vendidas.
                  </p>
                </div>

                <a href="/admin/reports" className="text-sm underline">
                  Ver reporte
                </a>
              </div>

              {topProductsPreview.length === 0 ? (
                <div className="mt-6 rounded-2xl bg-gray-50 p-5">
                  <p className="text-gray-600">
                    Todavía no hay productos vendidos.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {topProductsPreview.map((product) => (
                    <a
                      key={product.slug}
                      href={`/admin/products/${product.slug}/edit`}
                      className="block rounded-2xl bg-gray-50 p-5 transition hover:bg-gray-100"
                    >
                      <div className="flex justify-between gap-4">
                        <div>
                          <p className="font-semibold">{product.name}</p>

                          <p className="mt-1 text-sm text-gray-600">
                            {product.unitsSold} vendidos · Stock actual:{" "}
                            {product.currentStock}
                          </p>
                        </div>

                        <p className="font-semibold">
                          {formatMoney(product.revenue)}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-8">
            <section className="rounded-2xl border p-6">
              <h2 className="text-2xl font-semibold">Inventario</h2>

              <div className="mt-5 space-y-4">
                <div className="flex justify-between">
                  <span>Activos</span>
                  <span className="font-semibold">{activeProducts}</span>
                </div>

                <div className="flex justify-between">
                  <span>Inactivos</span>
                  <span className="font-semibold">{inactiveProducts}</span>
                </div>

                <div className="flex justify-between text-orange-700">
                  <span>Stock bajo</span>
                  <span className="font-semibold">{lowStockProducts}</span>
                </div>

                <div className="flex justify-between text-red-700">
                  <span>Agotados</span>
                  <span className="font-semibold">{outOfStockProducts}</span>
                </div>
              </div>

              <a
                href="/admin/inventory/low-stock"
                className="mt-6 block rounded-full bg-black px-5 py-3 text-center text-white"
              >
                Revisar stock
              </a>
            </section>

            <section className="rounded-2xl border p-6">
              <h2 className="text-2xl font-semibold">Top clientes</h2>

              {topCustomersPreview.length === 0 ? (
                <p className="mt-4 text-gray-600">
                  Todavía no hay clientes con compras.
                </p>
              ) : (
                <div className="mt-5 space-y-4">
                  {topCustomersPreview.map((customer) => (
                    <a
                      key={customer.customerId}
                      href={`/admin/customers/${customer.customerId}`}
                      className="block rounded-2xl bg-gray-50 p-4 transition hover:bg-gray-100"
                    >
                      <p className="font-semibold">{customer.fullName}</p>

                      <p className="mt-1 text-sm text-gray-600">
                        {customer.orderCount} pedidos ·{" "}
                        {formatMoney(customer.totalSpent)}
                      </p>
                    </a>
                  ))}
                </div>
              )}

              <a
                href="/admin/customers"
                className="mt-6 block rounded-full border px-5 py-3 text-center"
              >
                Ver clientes
              </a>
            </section>

            <section className="rounded-2xl border p-6">
              <h2 className="text-2xl font-semibold">Accesos rápidos</h2>

              <div className="mt-5 space-y-3">
                {quickLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="block rounded-2xl bg-gray-50 p-4 transition hover:bg-gray-100"
                  >
                    <p className="font-semibold">{link.title}</p>
                    <p className="mt-1 text-sm text-gray-600">
                      {link.description}
                    </p>
                  </a>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}


