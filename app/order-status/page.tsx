"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { createWhatsAppLink } from "@/lib/whatsapp";

type OrderStatus = "pending" | "processing" | "completed" | "cancelled";
type PaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "refunded";
type PaymentMethod =
  | "stripe"
  | "bank_transfer"
  | "store_payment"
  | "cash_on_delivery";
type DeliveryMethod = "shipping" | "pickup";

type OrderItem = {
  id: string;
  productSlug: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  lensOption: string;
  prescriptionMethod: string;
};

type Order = {
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  deliveryMethod?: DeliveryMethod;
  customerNotes?: string | null;
  subtotal: number;
  shipping: number;
  total: number;
  currency: string;
  shippingCarrier?: string | null;
  trackingNumber?: string | null;
  customerVisibleNotes?: string | null;
  createdAt: string;
  customer: {
    fullName: string;
    email: string;
  };
  items: OrderItem[];
};

function formatMoney(amount: number) {
  return `$${amount.toLocaleString("es-MX")} MXN`;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getStatusLabel(status: OrderStatus) {
  if (status === "pending") return "Pedido recibido";
  if (status === "processing") return "En proceso";
  if (status === "completed") return "Completado";
  if (status === "cancelled") return "Cancelado";

  return "Pedido recibido";
}

function getStatusClassName(status: OrderStatus) {
  if (status === "pending") return "bg-yellow-100 text-yellow-800";
  if (status === "processing") return "bg-blue-100 text-blue-700";
  if (status === "completed") return "bg-green-100 text-green-700";
  if (status === "cancelled") return "bg-red-100 text-red-700";

  return "bg-gray-100 text-gray-700";
}

function getPaymentStatusLabel(status: PaymentStatus) {
  if (status === "unpaid") return "Pago por confirmar";
  if (status === "pending") return "Pago pendiente";
  if (status === "paid") return "Pagado";
  if (status === "failed") return "Pago fallido";
  if (status === "refunded") return "Reembolsado";

  return "Pago por confirmar";
}

function getPaymentStatusClassName(status: PaymentStatus) {
  if (status === "paid") return "bg-green-100 text-green-700";
  if (status === "pending") return "bg-yellow-100 text-yellow-800";
  if (status === "unpaid") return "bg-gray-100 text-gray-700";
  if (status === "failed") return "bg-red-100 text-red-700";
  if (status === "refunded") return "bg-blue-100 text-blue-700";

  return "bg-gray-100 text-gray-700";
}

function getPaymentMethodLabel(method?: PaymentMethod) {
  if (method === "stripe") return "Stripe · pago en línea";
  if (method === "bank_transfer") return "Transferencia bancaria";
  if (method === "store_payment") return "Pago en tienda";
  if (method === "cash_on_delivery") return "Pago contra entrega";

  return "Por confirmar";
}

function getDeliveryMethodLabel(method?: DeliveryMethod) {
  if (method === "shipping") return "Envío a domicilio";
  if (method === "pickup") return "Recoger en tienda";

  return "Por confirmar";
}

function isShippingPending(method?: DeliveryMethod, shipping = 0) {
  return method === "shipping" && shipping <= 0;
}

function getShippingLabel(method?: DeliveryMethod, shipping = 0) {
  if (method === "pickup") return "Sin costo · recoger en tienda";

  return shipping > 0 ? formatMoney(shipping) : "Por confirmar";
}

function getTotalLabel(method?: DeliveryMethod, shipping = 0) {
  if (isShippingPending(method, shipping)) {
    return "Total estimado";
  }

  return "Total";
}

function getDeliveryInstructions(method?: DeliveryMethod, shipping = 0) {
  if (method === "shipping" && shipping <= 0) {
    return "Óptica OLM está revisando el costo de envío. El total final se confirmará antes del pago.";
  }

  if (method === "shipping" && shipping > 0) {
    return "El costo de envío ya fue confirmado. El total mostrado es el total final del pedido.";
  }

  if (method === "pickup") {
    return "Óptica OLM te avisará cuando el pedido esté listo para recoger en tienda.";
  }

  return "Óptica OLM te contactará para confirmar la forma de entrega.";
}

function getPaymentMessage(
  paymentMethod?: PaymentMethod,
  deliveryMethod?: DeliveryMethod,
  shipping = 0
) {
  if (isShippingPending(deliveryMethod, shipping)) {
    return "Espera a que Óptica OLM confirme el costo de envío y el total final antes de pagar.";
  }

  if (paymentMethod === "bank_transfer") {
    return "Puedes realizar el pago cuando Óptica OLM te comparta los datos bancarios.";
  }

  if (paymentMethod === "store_payment") {
    return "Podrás pagar en tienda cuando confirmes o recojas tu pedido.";
  }

  if (paymentMethod === "cash_on_delivery") {
    return "Óptica OLM confirmará si el pago contra entrega está disponible para tu zona.";
  }

  return "Óptica OLM te contactará para confirmar la forma de pago.";
}

function getProgressStep(status: OrderStatus) {
  if (status === "pending") return 1;
  if (status === "processing") return 2;
  if (status === "completed") return 3;
  if (status === "cancelled") return 0;

  return 1;
}

export default function OrderStatusPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<"order" | "tracking" | "">("");

  useEffect(() => {
    const savedOrder = localStorage.getItem("olm-latest-order");

    if (!savedOrder) {
      return;
    }

    try {
      const parsedOrder = JSON.parse(savedOrder);

      const timeoutId = window.setTimeout(() => {
        if (parsedOrder.orderNumber) {
          setOrderNumber(parsedOrder.orderNumber);
        }

        if (parsedOrder.customer?.email) {
          setEmail(parsedOrder.customer.email);
        }
      }, 0);

      return () => window.clearTimeout(timeoutId);
    } catch (error) {
      console.error("Could not read latest order from localStorage:", error);
    }
  }, []);

  async function copyText(value: string, type: "order" | "tracking") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(type);

      setTimeout(() => {
        setCopied("");
      }, 2000);
    } catch (error) {
      console.error("Could not copy text:", error);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSearching(true);
      setError("");
      setOrder(null);

      const response = await fetch("/api/order-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderNumber: orderNumber.trim(),
          email: email.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          "No encontramos un pedido con ese número y email. Revisa los datos e intenta de nuevo."
        );
        return;
      }

      setOrder(data.order);
    } catch (error) {
      console.error(error);
      setError("No pudimos buscar el pedido. Intenta de nuevo.");
    } finally {
      setIsSearching(false);
    }
  }

  const progressStep = order ? getProgressStep(order.status) : 0;
  const customerNotes = String(order?.customerNotes || "").trim();
  const shippingPending = order
    ? isShippingPending(order.deliveryMethod, order.shipping)
    : false;

  return (
    <main className="min-h-screen bg-white px-6 py-12 text-black">
      <section className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm text-gray-500 underline">
          ← Regresar a la tienda
        </Link>

        <div className="mt-6 rounded-3xl border bg-gradient-to-b from-gray-50 to-white p-8">
          <h1 className="text-4xl font-bold">Consultar pedido</h1>

          <p className="mt-4 max-w-2xl text-gray-600">
            Ingresa tu número de pedido y email para revisar el estado de tu
            compra, pago y seguimiento de entrega.
          </p>

          <form onSubmit={handleSubmit} className="mt-8">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium">Número de pedido</span>
                <input
                  value={orderNumber}
                  onChange={(event) => setOrderNumber(event.target.value)}
                  required
                  placeholder="OLM-123456789"
                  className="mt-2 w-full rounded-xl border bg-white px-4 py-3 outline-none focus:border-black"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  placeholder="tu@email.com"
                  className="mt-2 w-full rounded-xl border bg-white px-4 py-3 outline-none focus:border-black"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={isSearching}
              className="mt-6 rounded-full bg-black px-8 py-3 text-white disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {isSearching ? "Buscando..." : "Consultar pedido"}
            </button>

            {error && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-medium text-red-700">{error}</p>
              </div>
            )}
          </form>
        </div>

        {order && (
          <div className="mt-10">
            <div className="rounded-3xl border p-8">
              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
                <div>
                  <p className="text-sm text-gray-500">Pedido</p>

                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <h2 className="text-3xl font-bold">{order.orderNumber}</h2>

                    <button
                      type="button"
                      onClick={() => copyText(order.orderNumber, "order")}
                      className="rounded-full border px-4 py-2 text-sm"
                    >
                      {copied === "order" ? "Copiado" : "Copiar"}
                    </button>
                  </div>

                  <p className="mt-2 text-sm text-gray-600">
                    Creado el {formatDate(order.createdAt)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 md:justify-end">
                  <span
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${getStatusClassName(
                      order.status
                    )}`}
                  >
                    {getStatusLabel(order.status)}
                  </span>

                  <span
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${getPaymentStatusClassName(
                      order.paymentStatus
                    )}`}
                  >
                    {getPaymentStatusLabel(order.paymentStatus)}
                  </span>

                  <span className="rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700">
                    {getPaymentMethodLabel(order.paymentMethod)}
                  </span>

                  <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
                    {getDeliveryMethodLabel(order.deliveryMethod)}
                  </span>
                </div>
              </div>

              {shippingPending && (
                <div className="mt-8 rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
                  <h3 className="font-semibold text-yellow-900">
                    Envío por confirmar
                  </h3>

                  <p className="mt-2 text-sm text-yellow-800">
                    El costo de envío todavía no está confirmado. El total que
                    ves ahora es estimado y puede cambiar.
                  </p>

                  <p className="mt-2 text-sm font-medium text-yellow-900">
                    Espera la confirmación final de Óptica OLM antes de pagar.
                  </p>
                </div>
              )}

              {order.status === "cancelled" ? (
                <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5">
                  <h3 className="font-semibold text-red-800">
                    Este pedido fue cancelado
                  </h3>

                  <p className="mt-2 text-sm text-red-700">
                    Contáctanos si tienes preguntas sobre este pedido.
                  </p>
                </div>
              ) : (
                <div className="mt-8 rounded-2xl bg-gray-50 p-5">
                  <h3 className="font-semibold">Progreso del pedido</h3>

                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    {[
                      { step: 1, title: "Recibido", text: "Pedido creado" },
                      { step: 2, title: "En proceso", text: "Preparando pedido" },
                      { step: 3, title: "Completado", text: "Pedido finalizado" },
                    ].map((item) => (
                      <div
                        key={item.step}
                        className={`rounded-2xl border p-4 ${
                          progressStep >= item.step
                            ? "border-black bg-white"
                            : "bg-white text-gray-400"
                        }`}
                      >
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                            progressStep >= item.step
                              ? "bg-black text-white"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {item.step}
                        </div>

                        <p className="mt-3 font-semibold">{item.title}</p>
                        <p className="mt-1 text-sm">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
              <div className="space-y-8">
                <section className="rounded-2xl border p-6">
                  <h3 className="text-2xl font-semibold">Cliente</h3>

                  <div className="mt-5 grid gap-4 text-sm md:grid-cols-2">
                    <div>
                      <p className="text-gray-500">Nombre</p>
                      <p className="mt-1 font-medium">
                        {order.customer.fullName}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-500">Email</p>
                      <p className="mt-1 font-medium">{order.customer.email}</p>
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
                  <h3 className="text-2xl font-semibold text-blue-950">
                    Entrega
                  </h3>

                  <p className="mt-3 font-medium text-blue-950">
                    {getDeliveryMethodLabel(order.deliveryMethod)}
                  </p>

                  <p className="mt-2 text-sm text-blue-900">
                    {getDeliveryInstructions(
                      order.deliveryMethod,
                      order.shipping
                    )}
                  </p>

                  <p className="mt-3 text-sm text-blue-900">
                    Envío:{" "}
                    <span className="font-semibold">
                      {getShippingLabel(order.deliveryMethod, order.shipping)}
                    </span>
                  </p>
                </section>

                {customerNotes && (
                  <section className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
                    <h3 className="text-2xl font-semibold text-blue-950">
                      Nota de tu pedido
                    </h3>

                    <p className="mt-3 text-sm text-blue-900">
                      {customerNotes}
                    </p>
                  </section>
                )}

                <section className="rounded-2xl border p-6">
                  <h3 className="text-2xl font-semibold">Envío y seguimiento</h3>

                  <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                    {order.deliveryMethod === "pickup" ? (
                      <div>
                        <p className="text-sm text-blue-700">Entrega</p>
                        <p className="mt-1 font-semibold text-blue-950">
                          Recoger en tienda
                        </p>

                        <p className="mt-3 text-sm text-blue-900">
                          No hay número de rastreo porque seleccionaste recoger
                          en tienda.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="mb-5 rounded-2xl bg-white p-4">
                          <p className="text-sm font-medium text-blue-950">
                            Costo de envío
                          </p>

                          <p className="mt-2 text-sm text-blue-900">
                            {getShippingLabel(
                              order.deliveryMethod,
                              order.shipping
                            )}
                          </p>

                          {shippingPending && (
                            <p className="mt-2 text-sm text-yellow-700">
                              Óptica OLM confirmará el costo de envío antes del
                              pago.
                            </p>
                          )}
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
                          <div>
                            <p className="text-sm text-blue-700">Paquetería</p>
                            <p className="mt-1 font-semibold text-blue-950">
                              {order.shippingCarrier || "Por confirmar"}
                            </p>
                          </div>

                          <div>
                            <p className="text-sm text-blue-700">
                              Número de rastreo
                            </p>

                            {order.trackingNumber ? (
                              <div className="mt-1 flex flex-wrap items-center gap-3">
                                <p className="font-semibold text-blue-950">
                                  {order.trackingNumber}
                                </p>

                                <button
                                  type="button"
                                  onClick={() =>
                                    copyText(
                                      order.trackingNumber || "",
                                      "tracking"
                                    )
                                  }
                                  className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs text-blue-950"
                                >
                                  {copied === "tracking"
                                    ? "Copiado"
                                    : "Copiar"}
                                </button>
                              </div>
                            ) : (
                              <p className="mt-1 font-semibold text-blue-950">
                                Por confirmar
                              </p>
                            )}
                          </div>
                        </div>

                        {order.customerVisibleNotes ? (
                          <div className="mt-5 rounded-2xl bg-white p-4">
                            <p className="text-sm font-medium text-blue-950">
                              Nota sobre tu pedido
                            </p>

                            <p className="mt-2 text-sm text-blue-900">
                              {order.customerVisibleNotes}
                            </p>
                          </div>
                        ) : (
                          <p className="mt-5 text-sm text-blue-900">
                            Cuando el pedido tenga guía de envío, aparecerá
                            aquí.
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </section>

                <section className="rounded-2xl border p-6">
                  <h3 className="text-2xl font-semibold">Productos</h3>

                  <div className="mt-5 space-y-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="rounded-2xl bg-gray-50 p-5">
                        <div className="flex flex-col justify-between gap-4 md:flex-row">
                          <div>
                            <p className="text-lg font-semibold">
                              {item.productName}
                            </p>

                            <p className="mt-1 text-sm text-gray-600">
                              {item.lensOption}
                            </p>

                            <p className="text-sm text-gray-600">
                              {item.prescriptionMethod}
                            </p>

                            <p className="mt-2 text-sm text-gray-500">
                              Cantidad: {item.quantity}
                            </p>
                          </div>

                          <div className="md:text-right">
                            <p className="text-sm text-gray-600">
                              {formatMoney(item.unitPrice)} c/u
                            </p>

                            <p className="mt-1 text-lg font-semibold">
                              {formatMoney(item.lineTotal)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <aside className="h-fit rounded-2xl border p-6">
                <h3 className="text-2xl font-semibold">Resumen</h3>

                <div className="mt-6 space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatMoney(order.subtotal)}</span>
                  </div>

                  <div className="flex justify-between text-gray-600">
                    <span>Entrega</span>
                    <span className="text-right">
                      {getDeliveryMethodLabel(order.deliveryMethod)}
                    </span>
                  </div>

                  <div className="flex justify-between text-gray-600">
                    <span>Envío</span>
                    <span className="text-right">
                      {getShippingLabel(order.deliveryMethod, order.shipping)}
                    </span>
                  </div>

                  <div className="flex justify-between text-gray-600">
                    <span>Forma de pago</span>
                    <span className="text-right">
                      {getPaymentMethodLabel(order.paymentMethod)}
                    </span>
                  </div>
                </div>

                {customerNotes && (
                  <div className="mt-6 rounded-2xl bg-gray-50 p-4">
                    <p className="text-sm font-medium">Nota del pedido</p>
                    <p className="mt-2 text-sm text-gray-600">
                      {customerNotes}
                    </p>
                  </div>
                )}

                <div className="mt-6 border-t pt-6">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>
                      {getTotalLabel(order.deliveryMethod, order.shipping)}
                    </span>
                    <span>{formatMoney(order.total)}</span>
                  </div>

                  {shippingPending && (
                    <p className="mt-3 text-sm text-yellow-700">
                      El total final puede cambiar cuando se confirme el envío.
                    </p>
                  )}
                </div>

                <div className="mt-6 rounded-2xl bg-gray-50 p-5">
                  <h4 className="font-semibold">¿Qué sigue?</h4>

                  <p className="mt-3 text-sm text-gray-600">
                    {shippingPending
                      ? "Óptica OLM revisará tu dirección, confirmará el costo de envío y después confirmará el pago."
                      : "Óptica OLM revisará tus datos y te contactará para confirmar pago, graduación y entrega."}
                  </p>

                  <p className="mt-4 text-sm text-gray-600">
                    {getPaymentMessage(
                      order.paymentMethod,
                      order.deliveryMethod,
                      order.shipping
                    )}
                  </p>
                </div>

                <div className="mt-6 flex flex-col gap-3">
                  <a
                    href="/eyeglasses"
                    className="rounded-full bg-black px-6 py-3 text-center text-white"
                  >
                    Seguir comprando
                  </a>

                  <a
                    href={createWhatsAppLink(
                      `Hola, tengo una pregunta sobre mi pedido ${order.orderNumber}.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-black px-6 py-3 text-center transition hover:bg-black hover:text-white"
                  >
                    Preguntar por WhatsApp
                  </a>

                  <Link href="/" className="rounded-full border px-6 py-3 text-center">
                    Ir al inicio
                  </Link>
                </div>
              </aside>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}


