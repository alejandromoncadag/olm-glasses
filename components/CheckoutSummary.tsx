"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type CartItem = {
    slug: string;
    name: string;
    price: number;
    quantity: number;
    lensOption?: string;
    prescriptionMethod?: string;
};

type CheckoutCustomer = {
    fullName: string;
    email: string;
    phone: string;
    address: string;
};

type LocalOrder = {
    orderNumber: string;
    createdAt: string;
    customer: CheckoutCustomer;
    items: CartItem[];
    subtotal: number;
    shipping: number;
    total: number;
    status: "pending";
};



export default function CheckoutSummary() {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const router = useRouter();

    useEffect(() => {
        const savedCart: CartItem[] = JSON.parse(
            localStorage.getItem("olm-cart") || "[]"
        );

        setCartItems(savedCart);
    }, []);

    const subtotal = cartItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    const shipping = subtotal > 0 ? 0 : 0;
    const total = subtotal + shipping;




    function handleContinuePayment() {
        const savedCustomer = localStorage.getItem("olm-checkout-customer");

        if (!savedCustomer) {
            alert("Por favor completa tus datos antes de continuar.");
            return;
        }

        const customer: CheckoutCustomer = JSON.parse(savedCustomer);

        if (
            !customer.fullName ||
            !customer.email ||
            !customer.phone ||
            !customer.address
        ) {
            alert("Por favor completa todos los campos del checkout.");
            return;
        }

        const orderNumber = `OLM-${Date.now()}`;

        const newOrder: LocalOrder = {
            orderNumber,
            createdAt: new Date().toISOString(),
            customer,
            items: cartItems,
            subtotal,
            shipping,
            total,
            status: "pending",
        };

        const existingOrders: LocalOrder[] = JSON.parse(
            localStorage.getItem("olm-orders") || "[]"
        );

        const updatedOrders = [newOrder, ...existingOrders];

        localStorage.setItem("olm-orders", JSON.stringify(updatedOrders));
        localStorage.setItem("olm-latest-order", JSON.stringify(newOrder));

        router.push("/order-success");
    }


    return (
        <aside className="h-fit rounded-2xl border p-6">
            <h2 className="text-xl font-bold">Resumen de compra</h2>

            <div className="mt-4 space-y-4">
                {cartItems.length === 0 ? (
                    <p className="text-sm text-gray-600">Tu carrito está vacío.</p>
                ) : (
                    cartItems.map((item) => (
                        <div key={item.slug} className="flex justify-between gap-4 text-sm">

                            <div>
                                <p className="font-medium">{item.name}</p>
                                {item.lensOption && (
                                    <p className="text-gray-500">Tipo de lente: {item.lensOption}</p>
                                )}
                                {item.prescriptionMethod && (
                                    <p className="text-gray-500">Receta: {item.prescriptionMethod}</p>
                                )}

                                <p className="text-gray-500">Cantidad: {item.quantity}</p>
                            </div>

                            <p className="font-medium">
                                ${(item.price * item.quantity).toLocaleString("es-MX")} MXN
                            </p>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-6 space-y-3 border-t pt-4 text-sm">
                <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toLocaleString("es-MX")} MXN</span>
                </div>

                <div className="flex justify-between">
                    <span>Envío</span>
                    <span>{shipping === 0 ? "Gratis" : `$${shipping} MXN`}</span>
                </div>

                <div className="flex justify-between border-t pt-3 text-base font-semibold">
                    <span>Total</span>
                    <span>${total.toLocaleString("es-MX")} MXN</span>
                </div>
            </div>

            {cartItems.length === 0 ? (
                <button
                    disabled
                    className="mt-6 w-full rounded-full bg-gray-300 px-8 py-4 text-white"
                >
                    Continuar con pago
                </button>
            ) : (
                <button
                    onClick={handleContinuePayment}
                    className="mt-6 w-full rounded-full bg-black px-8 py-4 text-white"
                >
                    Continuar con pago
                </button>

            )}

            <p className="mt-4 text-center text-xs text-gray-500">
                Próximamente conectaremos Mercado Pago.
            </p>
        </aside>
    );
}


