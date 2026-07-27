"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { clearCart } from "@/lib/cart";

type CheckoutResult = {
  checkoutStatus: "open" | "complete" | "expired";
  paymentStatus: "unpaid" | "pending" | "paid" | "failed" | "refunded";
  paymentMethodType: string | null;
  order: {
    orderNumber: string;
    status: string;
    total: number;
    currency: string;
    email: string;
  };
};

function formatMoney(amount: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount);
}

function getPaymentMethodLabel(type: string | null) {
  if (type === "card") return "Tarjeta";
  if (type === "oxxo") return "OXXO";
  if (type === "customer_balance") return "Transferencia SPEI";
  return "Stripe";
}

export default function StripeCheckoutReturn({ sessionId }: { sessionId: string }) {
  const [result, setResult] = useState<CheckoutResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadCheckoutResult() {
      try {
        const response = await fetch(
          `/api/checkout/stripe/session?session_id=${encodeURIComponent(sessionId)}`,
          { cache: "no-store" }
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            typeof data.error === "string"
              ? data.error
              : "No pudimos confirmar el pago."
          );
        }

        if (cancelled) return;

        setResult(data as CheckoutResult);

        if (data.checkoutStatus === "complete") {
          clearCart();
          localStorage.removeItem("olm-checkout-customer");
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "No pudimos confirmar el pago."
          );
        }
      }
    }

    loadCheckoutResult();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (errorMessage) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
        <h1 className="text-3xl font-semibold text-red-900">
          No pudimos confirmar el pago
        </h1>
        <p className="mt-3 text-red-800">{errorMessage}</p>
        <Link
          href="/order-status"
          className="mt-6 inline-flex rounded-full border border-red-300 px-6 py-3 font-medium text-red-900"
        >
          Revisar mi pedido
        </Link>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="rounded-3xl border p-8 text-center">
        <p className="text-sm uppercase tracking-[0.22em] text-gray-500">
          Stripe
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Confirmando tu pago...</h1>
        <p className="mt-3 text-gray-600">Esto puede tardar unos segundos.</p>
      </div>
    );
  }

  const isPaid = result.paymentStatus === "paid";
  const isPending = result.checkoutStatus === "complete" && !isPaid;

  return (
    <div className="rounded-3xl border bg-white p-8 shadow-sm md:p-12">
      <p className="text-sm uppercase tracking-[0.22em] text-gray-500">
        Pedido {result.order.orderNumber}
      </p>

      <h1 className="mt-4 text-4xl font-semibold">
        {isPaid
          ? "Pago confirmado"
          : isPending
            ? "Pedido recibido · pago pendiente"
            : "Tu checkout sigue abierto"}
      </h1>

      <p className="mt-4 max-w-2xl text-gray-600">
        {isPaid
          ? "Gracias por tu compra. Ya podemos comenzar a preparar tus lentes."
          : isPending
            ? "Completa el pago con las instrucciones de OXXO o SPEI que generó Stripe. Te avisaremos cuando se confirme."
            : "Regresa a Stripe para terminar el pago o vuelve al checkout para intentarlo nuevamente."}
      </p>

      <div className="mt-8 grid gap-4 rounded-2xl bg-[#f7f3ef] p-6 sm:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-500">Total</p>
          <p className="mt-2 font-semibold">{formatMoney(result.order.total)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-500">Método</p>
          <p className="mt-2 font-semibold">
            {getPaymentMethodLabel(result.paymentMethodType)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-500">Estado</p>
          <p className="mt-2 font-semibold">
            {isPaid ? "Pagado" : "Pendiente"}
          </p>
        </div>
      </div>

      <p className="mt-6 text-sm text-gray-500">
        La confirmación y los datos del pedido se enviarán a {result.order.email}.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/order-status"
          className="rounded-full bg-[var(--brand-espresso)] px-6 py-3 text-center font-medium text-white transition hover:bg-[#2a1710]"
        >
          Ver estado del pedido
        </Link>
        <Link
          href="/"
          className="rounded-full border border-[var(--brand-espresso)] px-6 py-3 text-center font-medium text-[var(--brand-espresso)] transition hover:bg-[var(--brand-espresso)] hover:text-white"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
