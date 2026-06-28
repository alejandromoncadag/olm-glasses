"use client";

import { useEffect, useState } from "react";
import AdminNav from "@/components/AdminNav";
import { downloadCsv } from "@/lib/csv";

type OrderStatus = "pending" | "processing" | "completed" | "cancelled";
type PaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "refunded";

type Order = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  shipping: number;
  total: number;
  currency: string;
  createdAt: string;
  customer: {
    fullName?: string;
    email?: string;
    phone?: string;
  };
};

type ProductSalesReport = {
  productId: string;
  slug: string;
  name: string;
  type: "eyeglasses" | "sunglasses";
  category: string;
  currentStock: number;
  unitsSold: number;
  revenue: number;
  orderCount: number;
};

type TopCustomerReport = {
  customerId: string;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
};

type MonthlySalesReport = {
  monthKey: string;
  monthLabel: string;
  orderCount: number;
  revenue: number;
  paidRevenue: number;
  averageOrderValue: number;
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

function formatOptionalDate(date: string | null) {
  if (!date) return "Sin pedidos";

  return formatDate(date);
}

function isWithinLastDays(date: string, days: number) {
  const createdAt = new Date(date).getTime();
  const now = Date.now();
  const diffInDays = (now - createdAt) / (1000 * 60 * 60 * 24);

  return diffInDays <= days;
}

function getProductTypeLabel(type: "eyeglasses" | "sunglasses") {
  if (type === "eyeglasses") return "Lentes ópticos";
  if (type === "sunglasses") return "Lentes de sol";

  return "Producto";
}

export default function AdminReportsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [productSales, setProductSales] = useState<ProductSalesReport[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomerReport[]>([]);
  const [monthlySales, setMonthlySales] = useState<MonthlySalesReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchReports() {
    try {
      setLoading(true);
      setError("");

      const [
        ordersResponse,
        productSalesResponse,
        topCustomersResponse,
        monthlySalesResponse,
      ] = await Promise.all([
        fetch("/api/orders"),
        fetch("/api/reports/product-sales"),
        fetch("/api/reports/top-customers"),
        fetch("/api/reports/monthly-sales"),
      ]);

      if (!ordersResponse.ok) {
        throw new Error("Failed to fetch orders");
      }

      const ordersData = await ordersResponse.json();
      setOrders(ordersData.orders || []);

      if (productSalesResponse.ok) {
        const productSalesData = await productSalesResponse.json();
        setProductSales(productSalesData.products || []);
      } else {
        console.error("Product sales report failed");
        setProductSales([]);
      }

      if (topCustomersResponse.ok) {
        const topCustomersData = await topCustomersResponse.json();
        setTopCustomers(topCustomersData.customers || []);
      } else {
        console.error("Top customers report failed");
        setTopCustomers([]);
      }

      if (monthlySalesResponse.ok) {
        const monthlySalesData = await monthlySalesResponse.json();
        setMonthlySales(monthlySalesData.months || []);
      } else {
        console.error("Monthly sales report failed");
        setMonthlySales([]);
      }
    } catch (error) {
      console.error(error);
      setError("No pudimos cargar los reportes desde PostgreSQL.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReports();
  }, []);

  const totalOrders = orders.length;

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

  const paidOrders = orders.filter((order) => order.paymentStatus === "paid");

  const paidRevenue = paidOrders.reduce((sum, order) => sum + order.total, 0);

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

  const last7DaysOrders = orders.filter((order) =>
    isWithinLastDays(order.createdAt, 7)
  );

  const last7DaysRevenue = last7DaysOrders.reduce(
    (sum, order) => sum + order.total,
    0
  );

  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const recentOrders = [...orders]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  const totalUnitsSold = productSales.reduce(
    (sum, product) => sum + product.unitsSold,
    0
  );

  const productSalesRevenue = productSales.reduce(
    (sum, product) => sum + product.revenue,
    0
  );

  const topCustomersRevenue = topCustomers.reduce(
    (sum, customer) => sum + customer.totalSpent,
    0
  );

  const topCustomersOrderCount = topCustomers.reduce(
    (sum, customer) => sum + customer.orderCount,
    0
  );

  function exportMonthlySalesReport() {
    const rows = [
      [
        "Month",
        "Month Key",
        "Order Count",
        "Revenue",
        "Paid Revenue",
        "Average Order Value",
      ],
      ...monthlySales.map((month) => [
        month.monthLabel,
        month.monthKey,
        month.orderCount,
        month.revenue,
        month.paidRevenue,
        month.averageOrderValue,
      ]),
    ];

    downloadCsv("olm-monthly-sales-report.csv", rows);
  }

  function exportTopCustomersReport() {
    const rows = [
      [
        "Customer ID",
        "Full Name",
        "Email",
        "Phone",
        "City",
        "State",
        "Order Count",
        "Total Spent",
        "Last Order At",
      ],
      ...topCustomers.map((customer) => [
        customer.customerId,
        customer.fullName,
        customer.email,
        customer.phone,
        customer.city,
        customer.state,
        customer.orderCount,
        customer.totalSpent,
        formatOptionalDate(customer.lastOrderAt),
      ]),
    ];

    downloadCsv("olm-top-customers-report.csv", rows);
  }

  function exportProductSalesReport() {
    const rows = [
      [
        "Product ID",
        "Slug",
        "Name",
        "Type",
        "Category",
        "Current Stock",
        "Units Sold",
        "Revenue",
        "Order Count",
      ],
      ...productSales.map((product) => [
        product.productId,
        product.slug,
        product.name,
        product.type,
        product.category,
        product.currentStock,
        product.unitsSold,
        product.revenue,
        product.orderCount,
      ]),
    ];

    downloadCsv("olm-product-sales-report.csv", rows);
  }

  function exportOrdersReport() {
    const rows = [
      [
        "Order Number",
        "Customer Name",
        "Customer Email",
        "Customer Phone",
        "Status",
        "Payment Status",
        "Subtotal",
        "Shipping",
        "Total",
        "Currency",
        "Created At",
      ],
      ...orders.map((order) => [
        order.orderNumber,
        order.customer?.fullName || "",
        order.customer?.email || "",
        order.customer?.phone || "",
        order.status,
        order.paymentStatus,
        order.subtotal,
        order.shipping,
        order.total,
        order.currency,
        formatDate(order.createdAt),
      ]),
    ];

    downloadCsv("olm-orders-report.csv", rows);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white px-6 py-12 text-black">
        <section className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-bold">Reportes</h1>

          <p className="mt-4 text-gray-600">
            Cargando reportes desde PostgreSQL...
          </p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-white px-6 py-12 text-black">
        <section className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-bold">Reportes</h1>

          <p className="mt-4 text-red-600">{error}</p>

          <button
            onClick={fetchReports}
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
            <h1 className="text-4xl font-bold">Reportes</h1>

            <p className="mt-4 text-gray-600">
              Resumen general de pedidos, ventas, productos y clientes.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={exportMonthlySalesReport}
              className="rounded-full border px-6 py-3 text-center"
            >
              CSV mensual
            </button>

            <button
              onClick={exportTopCustomersReport}
              className="rounded-full border px-6 py-3 text-center"
            >
              CSV clientes
            </button>

            <button
              onClick={exportProductSalesReport}
              className="rounded-full border px-6 py-3 text-center"
            >
              CSV productos
            </button>

            <button
              onClick={exportOrdersReport}
              className="rounded-full bg-black px-6 py-3 text-center text-white"
            >
              CSV pedidos
            </button>
          </div>
        </div>

        <AdminNav />

        <div className="mt-10 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border p-5">
            <p className="text-sm text-gray-600">Pedidos totales</p>
            <p className="mt-2 text-3xl font-bold">{totalOrders}</p>
          </div>

          <div className="rounded-2xl border p-5">
            <p className="text-sm text-gray-600">Ventas totales</p>
            <p className="mt-2 text-3xl font-bold">
              {formatMoney(totalRevenue)}
            </p>
          </div>

          <div className="rounded-2xl border p-5">
            <p className="text-sm text-gray-600">Ventas pagadas</p>
            <p className="mt-2 text-3xl font-bold">
              {formatMoney(paidRevenue)}
            </p>
          </div>

          <div className="rounded-2xl border p-5">
            <p className="text-sm text-gray-600">Ticket promedio</p>
            <p className="mt-2 text-3xl font-bold">
              {formatMoney(averageOrderValue)}
            </p>
          </div>
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
            <p className="text-sm text-gray-600">Completados</p>
            <p className="mt-2 text-3xl font-bold">{completedOrders}</p>
          </div>

          <div className="rounded-2xl border p-5">
            <p className="text-sm text-gray-600">Cancelados</p>
            <p className="mt-2 text-3xl font-bold">{cancelledOrders}</p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border p-6">
          <h2 className="text-2xl font-semibold">Últimos 7 días</h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-gray-50 p-5">
              <p className="text-sm text-gray-600">Pedidos nuevos</p>
              <p className="mt-2 text-3xl font-bold">
                {last7DaysOrders.length}
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 p-5">
              <p className="text-sm text-gray-600">Ventas últimos 7 días</p>
              <p className="mt-2 text-3xl font-bold">
                {formatMoney(last7DaysRevenue)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border p-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-semibold">Ventas mensuales</h2>

              <p className="mt-2 text-sm text-gray-600">
                Resumen de pedidos y ventas por mes.
              </p>
            </div>

            <button
              onClick={exportMonthlySalesReport}
              className="rounded-full bg-black px-5 py-2 text-center text-sm text-white"
            >
              Descargar CSV
            </button>
          </div>

          {monthlySales.length === 0 ? (
            <p className="mt-4 text-gray-600">
              Todavía no hay ventas mensuales.
            </p>
          ) : (
            <div className="mt-5 overflow-hidden rounded-2xl border">
              <div className="hidden grid-cols-5 bg-gray-50 px-5 py-3 text-sm font-semibold text-gray-600 md:grid">
                <span>Mes</span>
                <span>Pedidos</span>
                <span>Ventas</span>
                <span>Ventas pagadas</span>
                <span>Ticket promedio</span>
              </div>

              {monthlySales.map((month) => (
                <div
                  key={month.monthKey}
                  className="grid gap-4 border-t px-5 py-5 text-sm md:grid-cols-5 md:items-center"
                >
                  <p className="font-medium">{month.monthLabel}</p>

                  <p className="font-semibold">{month.orderCount}</p>

                  <p className="font-semibold">{formatMoney(month.revenue)}</p>

                  <p className="font-semibold">
                    {formatMoney(month.paidRevenue)}
                  </p>

                  <p className="text-gray-700">
                    {formatMoney(month.averageOrderValue)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 rounded-2xl border p-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-semibold">Mejores clientes</h2>

              <p className="mt-2 text-sm text-gray-600">
                {topCustomersOrderCount} pedidos ·{" "}
                {formatMoney(topCustomersRevenue)}
              </p>
            </div>

            <a
              href="/admin/customers"
              className="rounded-full bg-black px-5 py-2 text-center text-sm text-white"
            >
              Ver clientes
            </a>
          </div>

          {topCustomers.length === 0 ? (
            <p className="mt-4 text-gray-600">
              Todavía no hay clientes con pedidos.
            </p>
          ) : (
            <div className="mt-5 overflow-hidden rounded-2xl border">
              <div className="hidden grid-cols-6 bg-gray-50 px-5 py-3 text-sm font-semibold text-gray-600 md:grid">
                <span>Cliente</span>
                <span>Email</span>
                <span>Teléfono</span>
                <span>Ubicación</span>
                <span>Pedidos</span>
                <span>Total</span>
              </div>

              {topCustomers.map((customer) => (
                <div
                  key={customer.customerId}
                  className="grid gap-4 border-t px-5 py-5 text-sm md:grid-cols-6 md:items-center"
                >
                  <div>
                    <a
                      href={`/admin/customers/${customer.customerId}`}
                      className="font-medium underline"
                    >
                      {customer.fullName || "Sin nombre"}
                    </a>

                    <p className="mt-1 text-xs text-gray-500">
                      Último: {formatOptionalDate(customer.lastOrderAt)}
                    </p>
                  </div>

                  <p className="text-gray-600">
                    {customer.email || "Sin email"}
                  </p>

                  <p className="text-gray-600">
                    {customer.phone || "Sin teléfono"}
                  </p>

                  <p className="text-gray-600">
                    {[customer.city, customer.state]
                      .filter(Boolean)
                      .join(", ") || "Sin ubicación"}
                  </p>

                  <p className="font-semibold">{customer.orderCount}</p>

                  <p className="font-semibold">
                    {formatMoney(customer.totalSpent)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 rounded-2xl border p-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-semibold">
                Productos más vendidos
              </h2>

              <p className="mt-2 text-sm text-gray-600">
                {totalUnitsSold} unidades vendidas ·{" "}
                {formatMoney(productSalesRevenue)}
              </p>
            </div>

            <a
              href="/admin/products"
              className="rounded-full bg-black px-5 py-2 text-center text-sm text-white"
            >
              Ver productos
            </a>
          </div>

          {productSales.length === 0 ? (
            <p className="mt-4 text-gray-600">
              Todavía no hay ventas de productos.
            </p>
          ) : (
            <div className="mt-5 overflow-hidden rounded-2xl border">
              <div className="hidden grid-cols-6 bg-gray-50 px-5 py-3 text-sm font-semibold text-gray-600 md:grid">
                <span>Producto</span>
                <span>Tipo</span>
                <span>Categoría</span>
                <span>Unidades</span>
                <span>Ventas</span>
                <span>Stock</span>
              </div>

              {productSales.map((product) => (
                <div
                  key={product.productId}
                  className="grid gap-4 border-t px-5 py-5 text-sm md:grid-cols-6 md:items-center"
                >
                  <div>
                    <a
                      href={`/admin/products/${product.slug}/edit`}
                      className="font-medium underline"
                    >
                      {product.name}
                    </a>

                    <p className="mt-1 text-xs text-gray-500">
                      {product.slug}
                    </p>
                  </div>

                  <p>{getProductTypeLabel(product.type)}</p>

                  <p className="text-gray-600">{product.category}</p>

                  <p className="font-semibold">{product.unitsSold}</p>

                  <p className="font-semibold">
                    {formatMoney(product.revenue)}
                  </p>

                  <p
                    className={
                      product.currentStock <= 3
                        ? "font-bold text-yellow-700"
                        : "font-medium"
                    }
                  >
                    {product.currentStock}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 rounded-2xl border p-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <h2 className="text-2xl font-semibold">Pedidos recientes</h2>

            <a
              href="/admin/orders"
              className="rounded-full bg-black px-5 py-2 text-sm text-white"
            >
              Ver todos
            </a>
          </div>

          {recentOrders.length === 0 ? (
            <p className="mt-4 text-gray-600">Todavía no hay pedidos.</p>
          ) : (
            <div className="mt-5 space-y-4">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col justify-between gap-4 rounded-2xl border p-5 md:flex-row md:items-center"
                >
                  <div>
                    <a
                      href={`/admin/orders/${order.orderNumber}`}
                      className="font-semibold underline"
                    >
                      {order.orderNumber}
                    </a>

                    <p className="mt-1 text-sm text-gray-600">
                      {order.customer?.fullName || "Sin nombre"} ·{" "}
                      {formatDate(order.createdAt)}
                    </p>
                  </div>

                  <div className="md:text-right">
                    <p className="font-bold">{formatMoney(order.total)}</p>

                    <p className="mt-1 text-xs text-gray-500">
                      {order.status} · {order.paymentStatus}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

