"use client";

import { useEffect, useState } from "react";
import { products } from "@/data/products";

type CartItem = {
    slug: string;
    name: string;
    price: number;
    quantity: number;
    lensOption: string;
    prescriptionMethod: string;
};

function getProductFromCartItem(item: CartItem) {
    return products.find((product) => item.slug.startsWith(`${product.slug}-`));
}

export default function CartItems() {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);

    useEffect(() => {
        const savedCart = localStorage.getItem("olm-cart");

        if (savedCart) {
            setCartItems(JSON.parse(savedCart));
        }
    }, []);

    function saveCart(updatedCart: CartItem[]) {
        setCartItems(updatedCart);
        localStorage.setItem("olm-cart", JSON.stringify(updatedCart));
    }

    function getTotalQuantityForProduct(productSlug: string) {
        return cartItems
            .filter((item) => item.slug.startsWith(`${productSlug}-`))
            .reduce((sum, item) => sum + item.quantity, 0);
    }

    function increaseQuantity(itemSlug: string) {
        const item = cartItems.find((cartItem) => cartItem.slug === itemSlug);

        if (!item) return;

        const product = getProductFromCartItem(item);

        if (!product) {
            alert("No pudimos encontrar este producto.");
            return;
        }

        const totalQuantityForProduct = getTotalQuantityForProduct(product.slug);

        if (totalQuantityForProduct >= product.stock) {
            alert("No hay más piezas disponibles de este producto.");
            return;
        }

        const updatedCart = cartItems.map((cartItem) =>
            cartItem.slug === itemSlug
                ? { ...cartItem, quantity: cartItem.quantity + 1 }
                : cartItem
        );

        saveCart(updatedCart);
    }

    function decreaseQuantity(itemSlug: string) {
        const updatedCart = cartItems
            .map((cartItem) =>
                cartItem.slug === itemSlug
                    ? { ...cartItem, quantity: cartItem.quantity - 1 }
                    : cartItem
            )
            .filter((cartItem) => cartItem.quantity > 0);

        saveCart(updatedCart);
    }

    function removeItem(itemSlug: string) {
        const updatedCart = cartItems.filter((cartItem) => cartItem.slug !== itemSlug);
        saveCart(updatedCart);
    }

    function clearCart() {
        saveCart([]);
    }

    const subtotal = cartItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    const hasInvalidItems = cartItems.some((item) => {
        const product = getProductFromCartItem(item);

        if (!product) return true;
        if (!product.isActive) return true;
        if (product.stock <= 0) return true;
        if (item.quantity > product.stock) return true;

        return false;
    });



    if (cartItems.length === 0) {
        return (
            <div className="rounded-2xl border p-8 text-center">
                <h2 className="text-2xl font-semibold">Tu carrito está vacío</h2>

                <p className="mt-3 text-gray-600">
                    Agrega unos lentes para continuar con tu compra.
                </p>

                <a
                    href="/eyeglasses"
                    className="mt-6 inline-block rounded-full bg-black px-6 py-3 text-white"
                >
                    Ver lentes
                </a>
            </div>
        );
    }

    return (
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-4">
                {cartItems.map((item) => {
                    const product = getProductFromCartItem(item);
                    const productStock = product?.stock ?? 0;
                    const isUnavailable = !product || !product.isActive || productStock <= 0;

                    return (
                        <div key={item.slug} className="rounded-2xl border p-5">
                            <div className="flex justify-between gap-6">
                                <div>
                                    <h2 className="text-xl font-semibold">{item.name}</h2>

                                    <p className="mt-2 text-sm text-gray-600">
                                        {item.lensOption}
                                    </p>

                                    <p className="text-sm text-gray-600">
                                        {item.prescriptionMethod}
                                    </p>

                                    <p className="mt-2 text-sm text-gray-500">
                                        Stock disponible: {productStock}
                                    </p>

                                    {isUnavailable && (
                                        <p className="mt-2 text-sm font-medium text-red-600">
                                            Este producto ya no está disponible.
                                        </p>
                                    )}

                                    {product && item.quantity > product.stock && (
                                        <p className="mt-2 text-sm font-medium text-red-600">
                                            La cantidad en tu carrito supera el stock disponible.
                                        </p>
                                    )}
                                </div>

                                <div className="text-right">
                                    <p className="font-semibold">
                                        ${item.price.toLocaleString("es-MX")} MXN
                                    </p>

                                    <div className="mt-4 flex items-center gap-3">
                                        <button
                                            onClick={() => decreaseQuantity(item.slug)}
                                            className="flex h-8 w-8 items-center justify-center rounded-full border"
                                        >
                                            -
                                        </button>

                                        <span>{item.quantity}</span>

                                        <button
                                            onClick={() => increaseQuantity(item.slug)}
                                            disabled={isUnavailable}
                                            className="flex h-8 w-8 items-center justify-center rounded-full border disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                                        >
                                            +
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => removeItem(item.slug)}
                                        className="mt-4 text-sm text-gray-500 underline"
                                    >
                                        Quitar
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}

                <button onClick={clearCart} className="text-sm text-gray-500 underline">
                    Vaciar carrito
                </button>
            </div>

            <aside className="h-fit rounded-2xl border p-6">
                <h2 className="text-2xl font-semibold">Resumen</h2>

                <div className="mt-6 flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toLocaleString("es-MX")} MXN</span>
                </div>

                <div className="mt-4 flex justify-between text-gray-600">
                    <span>Envío</span>
                    <span>Se calcula después</span>
                </div>

                <div className="mt-6 border-t pt-6">
                    <div className="flex justify-between text-lg font-semibold">
                        <span>Total</span>
                        <span>${subtotal.toLocaleString("es-MX")} MXN</span>
                    </div>
                </div>

                {hasInvalidItems ? (
                    <div className="mt-6">
                        <button
                            disabled
                            className="w-full cursor-not-allowed rounded-full bg-gray-300 px-6 py-3 text-center text-white"
                        >
                            Continuar al checkout
                        </button>

                        <p className="mt-3 text-sm text-red-600">
                            Revisa tu carrito antes de continuar. Hay productos no disponibles o
                            cantidades mayores al stock.
                        </p>
                    </div>
                ) : (
                    <a
                        href="/checkout"
                        className="mt-6 block rounded-full bg-black px-6 py-3 text-center text-white"
                    >
                        Continuar al checkout
                    </a>
                )}
            </aside>
        </div>
    );
}

