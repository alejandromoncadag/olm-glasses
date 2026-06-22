"use client";

import { useEffect, useState } from "react";

type OrderStatus = "pending" | "processing" | "completed";

type OrderItem = {
    slug: string;
    name: string;
    price: number;
    quantity: number;
    lensOption?: string;
    prescriptionMethod?: string;
};

type Customer = {
    fullName: string;
    email: string;
    phone: string;
    address: string;
};

type LocalOrder = {
    orderNumber: string;
    createdAt: string;
    customer: Customer;
    items: OrderItem[];
    subtotal: number;
    shipping: number;
    total: number;
    status: OrderStatus;
};

function getStatusLabel(status: OrderStatus) {
    if (status === "pending") return "Pendiente";
    if (status === "processing") return "En proceso";
    return "Completado";
}

export default function AdminOrders() {
    const [orders, setOrders] = useState<LocalOrder[]>([]);

    useEffect(() => {
        const savedOrders: LocalOrder[] = JSON.parse(
            localStorage.getItem("olm-orders") || "[]"
        );

        setOrders(savedOrders);
    }, []);

    function clearOrders() {
        const confirmed = confirm(
            "¿Seguro que quieres borrar todos los pedidos temporales?"
        );

        if (!confirmed) return;

        localStorage.removeItem("olm-orders");
        localStorage.removeItem("olm-latest-order");
        setOrders([]);
    }

    function updateOrderStatus(orderNumber: string, status: OrderStatus) {
        const updatedOrders = orders.map((order) =>
            order.orderNumber === orderNumber ? { ...order, status } : order
        );

        setOrders(updatedOrders);
        localStorage.setItem("olm-orders", JSON.stringify(updatedOrders));

        const latestOrder = localStorage.getItem("olm-latest-order");

        if (latestOrder) {
            const parsedLatestOrder: LocalOrder = JSON.parse(latestOrder);

            if (parsedLatestOrder.orderNumber === orderNumber) {
                localStorage.setItem(
                    "olm-latest-order",
                    JSON.stringify({ ...parsedLatestOrder, status })
                );
            }
        }
    }

    const pendingOrders = orders.filter((order) => order.status === "pending").length;
    const processingOrders = orders.filter(
        (order) => order.status === "processing"
    ).length;
    const completedOrders = orders.filter(
        (order) => order.status === "completed"
    ).length;



    if (orders.length === 0) {
        return (
            <div className="mt-10 rounded-2xl border p-8 text-center">
                <h2 className="text-2xl font-semibold">No hay pedidos todavía</h2>
                <p className="mt-3 text-gray-600">
                    Cuando un cliente complete el checkout, el pedido aparecerá aquí.
                </p>
            </div>
        );
    }

    return (
        <div className="mt-10">
            <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-2xl border p-5">
                    <p className="text-sm text-gray-600">Total pedidos</p>
                    <p className="mt-2 text-3xl font-bold">{orders.length}</p>
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

            <div className="mb-6 mt-6 flex justify-end">


                <button
                    onClick={clearOrders}
                    className="rounded-full border border-red-600 px-5 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                    Borrar pedidos de prueba
                </button>
            </div>

            <div className="space-y-6">
                {orders.map((order) => (
                    <div key={order.orderNumber} className="rounded-2xl border p-6">
                        <div className="flex flex-col justify-between gap-4 border-b pb-4 md:flex-row">
                            <div>
                                <h2 className="text-xl font-bold">{order.orderNumber}</h2>
                                <p className="mt-1 text-sm text-gray-600">
                                    {new Date(order.createdAt).toLocaleString("es-MX")}
                                </p>
                            </div>

                            <div className="text-left md:text-right">
                                <p className="text-sm text-gray-600">Total</p>
                                <p className="text-lg font-semibold">
                                    ${order.total.toLocaleString("es-MX")} MXN
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 grid gap-6 md:grid-cols-2">
                            <div>
                                <h3 className="font-semibold">Cliente</h3>
                                <div className="mt-2 text-sm text-gray-600">
                                    <p>{order.customer.fullName}</p>
                                    <p>{order.customer.email}</p>
                                    <p>{order.customer.phone}</p>
                                    <p>{order.customer.address}</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold">Productos</h3>
                                <div className="mt-2 space-y-3 text-sm text-gray-600">
                                    {order.items.map((item) => (
                                        <div key={item.slug}>
                                            <p className="font-medium text-black">{item.name}</p>

                                            {item.lensOption && <p>Lente: {item.lensOption}</p>}

                                            {item.prescriptionMethod && (
                                                <p>Receta: {item.prescriptionMethod}</p>
                                            )}

                                            <p>Cantidad: {item.quantity}</p>
                                            <p>
                                                ${(item.price * item.quantity).toLocaleString("es-MX")}{" "}
                                                MXN
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 flex flex-wrap items-center gap-3">
                            <span className="text-sm font-semibold">Estado:</span>

                            <select
                                value={order.status}
                                onChange={(event) =>
                                    updateOrderStatus(
                                        order.orderNumber,
                                        event.target.value as OrderStatus
                                    )
                                }
                                className="rounded-full border px-4 py-2 text-sm"
                            >
                                <option value="pending">Pendiente</option>
                                <option value="processing">En proceso</option>
                                <option value="completed">Completado</option>
                            </select>

                            <span className="rounded-full bg-yellow-100 px-4 py-2 text-sm font-medium text-yellow-800">
                                {getStatusLabel(order.status)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}




