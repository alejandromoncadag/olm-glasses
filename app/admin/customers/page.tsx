"use client";

import { useEffect, useState } from "react";
import AdminNav from "@/components/AdminNav";
import { downloadCsv } from "@/lib/csv";

type Customer = {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    createdAt: string;
    orderCount: number;
    totalSpent: number;
    lastOrderAt: string | null;
};

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







export default function AdminCustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
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
            setCustomers(data.customers);
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

    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    const filteredCustomers = customers.filter((customer) => {
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
    });

    const totalCustomers = customers.length;

    const customersWithOrders = customers.filter(
        (customer) => customer.orderCount > 0
    ).length;

    const totalRevenue = customers.reduce(
        (sum, customer) => sum + customer.totalSpent,
        0
    );

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
                customer.fullName,
                customer.email,
                customer.phone,
                customer.address,
                customer.city,
                customer.state,
                customer.zipCode,
                customer.country,
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

                        <p className="mt-4 text-gray-600">
                            Clientes registrados por pedidos en PostgreSQL.
                        </p>
                    </div>

                    <button
                        onClick={exportCustomersCsv}
                        className="rounded-full bg-black px-6 py-3 text-white"
                    >
                        Descargar CSV
                    </button>
                </div>

                <AdminNav />




                <div className="mt-10 grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border p-5">
                        <p className="text-sm text-gray-600">Clientes totales</p>
                        <p className="mt-2 text-3xl font-bold">{totalCustomers}</p>
                    </div>

                    <div className="rounded-2xl border p-5">
                        <p className="text-sm text-gray-600">Clientes con pedidos</p>
                        <p className="mt-2 text-3xl font-bold">{customersWithOrders}</p>
                    </div>

                    <div className="rounded-2xl border p-5">
                        <p className="text-sm text-gray-600">Ventas totales</p>
                        <p className="mt-2 text-3xl font-bold">
                            {formatMoney(totalRevenue)}
                        </p>
                    </div>
                </div>

                <div className="mt-8">
                    <input
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Buscar por nombre, email, teléfono o ciudad..."
                        className="w-full rounded-full border px-5 py-3 text-sm outline-none focus:border-black md:max-w-md"
                    />
                </div>

                <p className="mt-4 text-sm text-gray-600">
                    Mostrando {filteredCustomers.length} de {customers.length} clientes
                </p>

                {filteredCustomers.length === 0 ? (
                    <div className="mt-10 rounded-2xl border p-8 text-center">
                        <h2 className="text-2xl font-semibold">
                            No encontramos clientes
                        </h2>

                        <p className="mt-3 text-gray-600">
                            Intenta buscar con otro nombre, email o teléfono.
                        </p>
                    </div>
                ) : (
                    <div className="mt-10 overflow-hidden rounded-2xl border">
                        <div className="hidden grid-cols-5 bg-gray-50 px-5 py-3 text-sm font-semibold text-gray-600 md:grid">
                            <span>Cliente</span>
                            <span>Contacto</span>
                            <span>Ubicación</span>
                            <span>Pedidos</span>
                            <span>Total gastado</span>
                        </div>

                        {filteredCustomers.map((customer) => (
                            <div
                                key={customer.id}
                                className="grid gap-4 border-t px-5 py-5 text-sm md:grid-cols-5 md:items-center"
                            >
                                <div>
                                    <p className="font-medium">{customer.fullName}</p>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Cliente desde {formatDate(customer.createdAt)}
                                    </p>
                                </div>

                                <div className="text-gray-600">
                                    <p>{customer.email}</p>
                                    <p>{customer.phone}</p>
                                </div>

                                <div className="text-gray-600">
                                    <p>{customer.city || "Sin ciudad"}</p>
                                    <p className="text-xs">
                                        {[customer.state, customer.zipCode]
                                            .filter(Boolean)
                                            .join(", ")}
                                    </p>
                                </div>

                                <div>
                                    <p className="font-semibold">{customer.orderCount}</p>
                                    <p className="text-xs text-gray-500">
                                        Último: {formatDate(customer.lastOrderAt)}
                                    </p>
                                </div>

                                <div>
                                    <p className="font-semibold">
                                        {formatMoney(customer.totalSpent)}
                                    </p>

                                    <a
                                        href={`/admin/customers/${customer.id}`}
                                        className="mt-2 inline-block text-xs font-medium underline"
                                    >
                                        Ver detalle
                                    </a>
                                </div>

                            </div>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}

