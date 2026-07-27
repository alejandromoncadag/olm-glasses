"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

type DashboardMetricProps = {
  href: string;
  label: string;
  value: string;
  detail: string;
  icon: "orders" | "sales" | "paid" | "inventory";
  tone: "espresso" | "sage" | "sand" | "clay";
};

const metricTones = {
  espresso: {
    icon: "bg-[#2d1f1a] text-white",
    accent: "bg-[#2d1f1a]",
  },
  sage: {
    icon: "bg-[#dfe8dc] text-[#36533c]",
    accent: "bg-[#78907a]",
  },
  sand: {
    icon: "bg-[#f3e4c9] text-[#765c2e]",
    accent: "bg-[#c59b58]",
  },
  clay: {
    icon: "bg-[#eadbd3] text-[#7a4638]",
    accent: "bg-[#a66755]",
  },
} as const;

function DashboardIcon({
  name,
}: {
  name: DashboardMetricProps["icon"];
}) {
  if (name === "orders") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M5 7.5h14v12H5zM8 4.5h8v3H8zM8.5 12h7M8.5 15.5h4.5" />
      </svg>
    );
  }

  if (name === "sales") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M4 19.5h16M6.5 16V11M12 16V6.5M17.5 16V9" />
      </svg>
    );
  }

  if (name === "paid") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M14.8 8.8c-.7-.6-1.6-.9-2.7-.9-1.6 0-2.8.8-2.8 2 0 3.1 5.7 1.3 5.7 4.3 0 1.2-1.2 2.1-2.9 2.1-1.2 0-2.3-.4-3.1-1.1M12 6.3v11.4" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="m4.5 8 7.5-4 7.5 4v8L12 20l-7.5-4zM4.5 8l7.5 4 7.5-4M12 12v8" />
    </svg>
  );
}

function DashboardMetric({
  href,
  label,
  value,
  detail,
  icon,
  tone,
}: DashboardMetricProps) {
  const colors = metricTones[tone];

  return (
    <a
      href={href}
      className="group relative overflow-hidden rounded-3xl border border-black/8 bg-white p-5 shadow-[0_16px_40px_rgba(45,31,26,0.06)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_48px_rgba(45,31,26,0.1)]"
    >
      <span className={`absolute inset-x-0 top-0 h-1 ${colors.accent}`} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#82766f]">
            {label}
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#211814]">
            {value}
          </p>
          <p className="mt-2 text-xs leading-5 text-[#82766f]">{detail}</p>
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${colors.icon}`}>
          <DashboardIcon name={icon} />
        </span>
      </div>
    </a>
  );
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
    const timeoutId = window.setTimeout(() => {
      void fetchAdminData();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  const totalOrders = orders.length;

  const pendingOrders = orders.filter(
    (order) => order.status === "pending"
  ).length;

  const processingOrders = orders.filter(
    (order) => order.status === "processing"
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
      <main className="min-h-screen bg-[#f5f1eb] px-4 py-8 text-[#211814] sm:px-6 sm:py-10">
        <section className="mx-auto max-w-7xl">
          <div className="animate-pulse rounded-[2rem] bg-[#2d1f1a] p-8 text-white sm:p-10">
            <div className="h-3 w-32 rounded-full bg-white/25" />
            <div className="mt-5 h-10 w-72 max-w-full rounded-xl bg-white/20" />
            <div className="mt-4 h-4 w-96 max-w-full rounded-full bg-white/15" />
          </div>
          <p className="mt-6 text-sm text-[#776b64]">
            Cargando información operativa desde PostgreSQL...
          </p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#f5f1eb] px-4 py-8 text-[#211814] sm:px-6 sm:py-10">
        <section className="mx-auto max-w-7xl">
          <h1 className="text-4xl font-semibold tracking-[-0.04em]">
            No pudimos cargar el panel
          </h1>

          <p className="mt-4 text-red-600">{error}</p>

          <button
            type="button"
            onClick={fetchAdminData}
            className="mt-6 rounded-full bg-[#2d1f1a] px-6 py-3 text-white transition hover:bg-black"
          >
            Intentar de nuevo
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f1eb] px-4 py-8 text-[#211814] sm:px-6 sm:py-10">
      <section className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#2d1f1a] px-6 py-8 text-white shadow-[0_24px_70px_rgba(45,31,26,0.18)] sm:px-10 sm:py-10">
          <div className="absolute -right-20 -top-32 h-72 w-72 rounded-full border border-white/10" />
          <div className="absolute -right-5 -top-14 h-48 w-48 rounded-full border border-white/10" />
          <div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#d8c9bd]">
                Centro operativo · Óptica OLM
              </p>
              <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
                Resumen de la tienda
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-white/65">
                Ventas, pedidos, clientes e inventario conectados a PostgreSQL
                en un solo espacio.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/admin/orders"
                className="rounded-full bg-white px-5 py-3 text-center text-sm font-semibold text-[#2d1f1a] transition hover:bg-[#f3e8df]"
              >
                Revisar pedidos
              </Link>
              <Link
                href="/admin/reports"
                className="rounded-full border border-white/30 px-5 py-3 text-center text-sm font-semibold text-white transition hover:border-white hover:bg-white/10"
              >
                Abrir reportes
              </Link>
            </div>
          </div>
        </div>

        <AdminNav />

        <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardMetric
            href="/admin/orders"
            label="Pedidos totales"
            value={String(totalOrders)}
            detail={`${pendingOrders} pendientes · ${processingOrders} en proceso`}
            icon="orders"
            tone="espresso"
          />
          <DashboardMetric
            href="/admin/orders"
            label="Ventas registradas"
            value={formatMoney(estimatedRevenue)}
            detail="Sin contar pedidos cancelados"
            icon="sales"
            tone="sand"
          />
          <DashboardMetric
            href="/admin/orders"
            label="Ingresos pagados"
            value={formatMoney(paidRevenue)}
            detail={`${paidOrders} ${paidOrders === 1 ? "pedido confirmado" : "pedidos confirmados"}`}
            icon="paid"
            tone="sage"
          />
          <DashboardMetric
            href="/admin/inventory/low-stock"
            label="Alertas de inventario"
            value={String(lowStockProducts + outOfStockProducts)}
            detail={`${lowStockProducts} con stock bajo · ${outOfStockProducts} agotados`}
            icon="inventory"
            tone="clay"
          />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center justify-between rounded-2xl border border-black/8 bg-white px-5 py-4">
            <div>
              <p className="text-xs font-medium text-[#82766f]">Pendientes</p>
              <p className="mt-1 text-2xl font-semibold">{pendingOrders}</p>
            </div>
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-black/8 bg-white px-5 py-4">
            <div>
              <p className="text-xs font-medium text-[#82766f]">En proceso</p>
              <p className="mt-1 text-2xl font-semibold">{processingOrders}</p>
            </div>
            <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-black/8 bg-white px-5 py-4">
            <div>
              <p className="text-xs font-medium text-[#82766f]">Sin pagar</p>
              <p className="mt-1 text-2xl font-semibold">{unpaidOrders}</p>
            </div>
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-black/8 bg-white px-5 py-4">
            <div>
              <p className="text-xs font-medium text-[#82766f]">Falta rastreo</p>
              <p className="mt-1 text-2xl font-semibold">{missingTrackingOrders}</p>
            </div>
            <span className="h-2.5 w-2.5 rounded-full bg-[#a66755]" />
          </div>
        </div>

        <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_360px]">
          <div className="space-y-8">
            <section className="rounded-3xl border border-black/8 bg-white p-6 shadow-[0_16px_40px_rgba(45,31,26,0.05)] sm:p-7">
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
                    <p className="text-[#776b64]">
                    Todavía no hay ventas suficientes para mostrar un resumen
                    mensual.
                  </p>
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-black/8 bg-white p-6 shadow-[0_16px_40px_rgba(45,31,26,0.05)] sm:p-7">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-2xl font-semibold">Pedidos recientes</h2>

                  <p className="mt-2 text-sm text-gray-600">
                    Los últimos pedidos recibidos en la tienda.
                  </p>
                </div>

                <Link href="/admin/orders" className="text-sm underline">
                  Ver todos
                </Link>
              </div>

              {recentOrders.length === 0 ? (
                <div className="mt-6 rounded-2xl bg-gray-50 p-5">
                  <p className="text-gray-600">Todavía no hay pedidos.</p>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {recentOrders.map((order) => (
                    <Link
                      key={order.orderNumber}
                      href={`/admin/orders/${order.orderNumber}`}
                      className="block rounded-2xl border border-transparent bg-[#f8f5f1] p-5 transition hover:border-[#d8ccc4] hover:bg-white"
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
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-black/8 bg-white p-6 shadow-[0_16px_40px_rgba(45,31,26,0.05)] sm:p-7">
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
                      className="block rounded-2xl border border-transparent bg-[#f8f5f1] p-5 transition hover:border-[#d8ccc4] hover:bg-white"
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

          <aside className="space-y-6">
            <section className="rounded-3xl border border-black/8 bg-[#2d1f1a] p-6 text-white shadow-[0_16px_40px_rgba(45,31,26,0.12)]">
              <h2 className="text-2xl font-semibold">Inventario</h2>

              <div className="mt-5 space-y-4">
                <div className="flex justify-between text-white/75">
                  <span>Activos</span>
                  <span className="font-semibold">{activeProducts}</span>
                </div>

                <div className="flex justify-between text-white/75">
                  <span>Inactivos</span>
                  <span className="font-semibold">{inactiveProducts}</span>
                </div>

                <div className="flex justify-between text-[#f0c98c]">
                  <span>Stock bajo</span>
                  <span className="font-semibold">{lowStockProducts}</span>
                </div>

                <div className="flex justify-between text-[#efaaa0]">
                  <span>Agotados</span>
                  <span className="font-semibold">{outOfStockProducts}</span>
                </div>
              </div>

              <a
                href="/admin/inventory/low-stock"
                className="mt-6 block rounded-full bg-white px-5 py-3 text-center text-sm font-semibold text-[#2d1f1a] transition hover:bg-[#f3e8df]"
              >
                Revisar stock
              </a>
            </section>

            <section className="rounded-3xl border border-black/8 bg-white p-6 shadow-[0_16px_40px_rgba(45,31,26,0.05)]">
              <h2 className="text-2xl font-semibold">Top clientes</h2>

              {topCustomersPreview.length === 0 ? (
                <p className="mt-4 text-gray-600">
                  Todavía no hay clientes con compras.
                </p>
              ) : (
                <div className="mt-5 space-y-4">
                  {topCustomersPreview.map((customer) => (
                    <Link
                      key={customer.customerId}
                      href={`/admin/customers/${customer.customerId}`}
                      className="block rounded-2xl bg-[#f8f5f1] p-4 transition hover:bg-[#efe8e1]"
                    >
                      <p className="font-semibold">{customer.fullName}</p>

                      <p className="mt-1 text-sm text-gray-600">
                        {customer.orderCount} pedidos ·{" "}
                        {formatMoney(customer.totalSpent)}
                      </p>
                    </Link>
                  ))}
                </div>
              )}

              <Link
                href="/admin/customers"
                className="mt-6 block rounded-full border px-5 py-3 text-center"
              >
                Ver clientes
              </Link>
            </section>

            <section className="rounded-3xl border border-black/8 bg-white p-6 shadow-[0_16px_40px_rgba(45,31,26,0.05)]">
              <h2 className="text-2xl font-semibold">Accesos rápidos</h2>

              <div className="mt-5 space-y-3">
                {quickLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="block rounded-2xl border border-black/5 bg-[#f8f5f1] p-4 transition hover:border-[#cdbfb6] hover:bg-white"
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


