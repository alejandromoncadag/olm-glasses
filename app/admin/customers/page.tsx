"use client";

import { useEffect, useMemo, useState } from "react";
import AdminNav from "@/components/AdminNav";
import { downloadCsv } from "@/lib/csv";

type Customer = {
  id: string;
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
};

type OrderFilter = "all" | "withOrders" | "withoutOrders";
type SortBy = "newest" | "totalSpent" | "orderCount" | "lastOrder";

function formatMoney(amount: number) {
  return `$${amount.toLocaleString("es-MX")} MXN`;
}

function formatDate(date: string | null) {
  if (!date) return "Sin pedidos";

  return new Date(date).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getCustomerName(customer: Customer) {
  return customer.fullName || "Sin nombre";
}

function getCustomerLocation(customer: Customer) {
  return (
    [customer.city, customer.state, customer.zipCode].filter(Boolean).join(", ") ||
    "Sin ubicación"
  );
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [orderFilter, setOrderFilter] = useState<OrderFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchCustomers() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/customers");

      if (!response.ok) {
        throw new Error("Failed to fetch customers");
      }

      const data = await response.json();
      setCustomers(data.customers || []);
    } catch (error) {
      console.error(error);
      setError("No pudimos cargar los clientes desde PostgreSQL.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    return customers
      .filter((customer) => {
        if (orderFilter === "withOrders" && customer.orderCount === 0) {
          return false;
        }

        if (orderFilter === "withoutOrders" && customer.orderCount > 0) {
          return false;
        }

        const searchableText = [
          customer.fullName,
          customer.email,
          customer.phone,
          customer.address,
          customer.city,
          customer.state,
          customer.zipCode,
          customer.country,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return (
          normalizedSearchTerm === "" ||
          searchableText.includes(normalizedSearchTerm)
        );
      })
      .sort((a, b) => {
        if (sortBy === "totalSpent") {
          return b.totalSpent - a.totalSpent;
        }

        if (sortBy === "orderCount") {
          return b.orderCount - a.orderCount;
        }

        if (sortBy === "lastOrder") {
          const dateA = a.lastOrderAt ? new Date(a.lastOrderAt).getTime() : 0;
          const dateB = b.lastOrderAt ? new Date(b.lastOrderAt).getTime() : 0;

          return dateB - dateA;
        }

        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [customers, orderFilter, searchTerm, sortBy]);

  const totalCustomers = customers.length;

  const customersWithOrders = customers.filter(
    (customer) => customer.orderCount > 0
  ).length;

  const customersWithoutOrders = totalCustomers - customersWithOrders;

  const totalRevenue = customers.reduce(
    (sum, customer) => sum + customer.totalSpent,
    0
  );

  const averageCustomerValue =
    customersWithOrders > 0 ? totalRevenue / customersWithOrders : 0;

  const topCustomer = [...customers].sort(
    (a, b) => b.totalSpent - a.totalSpent
  )[0];

  function exportCustomersCsv() {
    const rows = [
      [
        "Customer ID",
        "Full Name",
        "Email",
        "Phone",
        "Address",
        "City",
        "State",
        "Zip Code",
        "Country",
        "Order Count",
        "Total Spent",
        "Last Order At",
        "Created At",
      ],
      ...filteredCustomers.map((customer) => [
        customer.id,
        customer.fullName || "",
        customer.email || "",
        customer.phone || "",
        customer.address || "",
        customer.city || "",
        customer.state || "",
        customer.zipCode || "",
        customer.country || "",
        customer.orderCount,
        customer.totalSpent,
        customer.lastOrderAt ? formatDate(customer.lastOrderAt) : "",
        formatDate(customer.createdAt),
      ]),
    ];

    downloadCsv("olm-customers.csv", rows);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white px-6 py-12 text-black">
        <section className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-bold">Clientes</h1>

          <p className="mt-4 text-gray-600">
            Cargando clientes desde PostgreSQL...
          </p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-white px-6 py-12 text-black">
        <section className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-bold">Clientes</h1>

          <p className="mt-4 text-red-600">{error}</p>

          <button
            type="button"
            onClick={fetchCustomers}
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
            <h1 className="text-4xl font-bold">Clientes</h1>

            <p className="mt-4 max-w-2xl text-gray-600">
              Revisa clientes registrados por pedidos, total gastado, contacto y
              última compra.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={exportCustomersCsv}
              className="rounded-full bg-black px-6 py-3 text-white"
            >
              Descargar CSV
            </button>

            <a
              href="/admin/orders"
              className="rounded-full border px-6 py-3 text-center"
            >
              Ver pedidos
            </a>
          </div>
        </div>

        <AdminNav />

        <div className="mt-10 grid gap-4 md:grid-cols-5">
          <div className="rounded-2xl border p-5">
            <p className="text-sm text-gray-600">Clientes totales</p>
            <p className="mt-2 text-3xl font-bold">{totalCustomers}</p>
          </div>

          <div className="rounded-2xl border p-5">
            <p className="text-sm text-gray-600">Con pedidos</p>
            <p className="mt-2 text-3xl font-bold">{customersWithOrders}</p>
          </div>

          <div className="rounded-2xl border p-5">
            <p className="text-sm text-gray-600">Sin pedidos activos</p>
            <p className="mt-2 text-3xl font-bold">{customersWithoutOrders}</p>
          </div>

          <div className="rounded-2xl border p-5">
            <p className="text-sm text-gray-600">Ventas clientes</p>
            <p className="mt-2 text-3xl font-bold">{formatMoney(totalRevenue)}</p>
          </div>

          <div className="rounded-2xl border p-5">
            <p className="text-sm text-gray-600">Promedio cliente</p>
            <p className="mt-2 text-3xl font-bold">
              {formatMoney(averageCustomerValue)}
            </p>
          </div>
        </div>

        {topCustomer && topCustomer.totalSpent > 0 && (
          <div className="mt-6 rounded-2xl border bg-gray-50 p-5">
            <p className="text-sm text-gray-500">Mejor cliente</p>

            <div className="mt-2 flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div>
                <p className="text-xl font-semibold">
                  {getCustomerName(topCustomer)}
                </p>

                <p className="mt-1 text-sm text-gray-600">
                  {topCustomer.orderCount} pedidos ·{" "}
                  {formatMoney(topCustomer.totalSpent)}
                </p>
              </div>

              <a
                href={`/admin/customers/${topCustomer.id}`}
                className="rounded-full bg-black px-5 py-2 text-center text-sm text-white"
              >
                Ver cliente
              </a>
            </div>
          </div>
        )}

        <div className="mt-8 rounded-2xl border p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto] lg:items-center">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por nombre, email, teléfono, ciudad..."
              className="w-full rounded-full border px-5 py-3 text-sm outline-none focus:border-black"
            />

            <select
              value={orderFilter}
              onChange={(event) =>
                setOrderFilter(event.target.value as OrderFilter)
              }
              className="rounded-full border px-5 py-3 text-sm outline-none focus:border-black"
            >
              <option value="all">Todos los clientes</option>
              <option value="withOrders">Con pedidos</option>
              <option value="withoutOrders">Sin pedidos activos</option>
            </select>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortBy)}
              className="rounded-full border px-5 py-3 text-sm outline-none focus:border-black"
            >
              <option value="newest">Más recientes</option>
              <option value="totalSpent">Mayor gasto</option>
              <option value="orderCount">Más pedidos</option>
              <option value="lastOrder">Última compra</option>
            </select>
          </div>

          <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <p className="text-sm text-gray-600">
              Mostrando {filteredCustomers.length} de {customers.length} clientes
            </p>

            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setOrderFilter("all");
                setSortBy("newest");
              }}
              className="text-left text-sm text-gray-500 underline sm:text-right"
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="mt-10 rounded-2xl border p-8 text-center">
            <h2 className="text-2xl font-semibold">No encontramos clientes</h2>

            <p className="mt-3 text-gray-600">
              Intenta buscar con otro nombre, email o teléfono.
            </p>
          </div>
        ) : (
          <div className="mt-10 space-y-4">
            {filteredCustomers.map((customer) => (
              <article key={customer.id} className="rounded-2xl border p-6">
                <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr_1fr_auto] lg:items-center">
                  <div>
                    <h2 className="text-xl font-semibold">
                      {getCustomerName(customer)}
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      Cliente desde {formatDate(customer.createdAt)}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {customer.orderCount > 0 ? (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                          Con pedidos
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                          Sin pedidos activos
                        </span>
                      )}

                      {customer.totalSpent > 0 && (
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                          Cliente comprador
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-sm">
                    <p className="text-gray-500">Contacto</p>
                    <p className="mt-1 font-medium">
                      {customer.email || "Sin email"}
                    </p>
                    <p className="text-gray-600">
                      {customer.phone || "Sin teléfono"}
                    </p>
                  </div>

                  <div className="text-sm">
                    <p className="text-gray-500">Ubicación</p>
                    <p className="mt-1 font-medium">
                      {getCustomerLocation(customer)}
                    </p>
                    <p className="text-gray-600">
                      {customer.country || "Sin país"}
                    </p>
                  </div>

                  <div className="lg:text-right">
                    <p className="text-sm text-gray-500">Total gastado</p>
                    <p className="mt-1 text-xl font-bold">
                      {formatMoney(customer.totalSpent)}
                    </p>

                    <p className="mt-2 text-sm text-gray-600">
                      {customer.orderCount}{" "}
                      {customer.orderCount === 1 ? "pedido" : "pedidos"}
                    </p>

                    <p className="text-xs text-gray-500">
                      Último: {formatDate(customer.lastOrderAt)}
                    </p>

                    <a
                      href={`/admin/customers/${customer.id}`}
                      className="mt-4 inline-block rounded-full bg-black px-5 py-2 text-sm text-white"
                    >
                      Ver detalle
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

