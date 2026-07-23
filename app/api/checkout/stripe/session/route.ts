import { NextResponse } from "next/server";

import {
  getStripeClient,
  getStripeSessionPaymentReferences,
} from "@/lib/stripe";
import {
  completeStripeOrder,
  getStripeOrderSummary,
  markStripeOrderPaymentPending,
} from "@/lib/stripeOrders";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("session_id")?.trim();

  if (!sessionId || !sessionId.startsWith("cs_")) {
    return NextResponse.json(
      { error: "Stripe session is required" },
      { status: 400 }
    );
  }

  try {
    const session = await getStripeClient().checkout.sessions.retrieve(
      sessionId,
      {
        expand: ["payment_intent.payment_method"],
      }
    );
    const orderId = session.metadata?.olmOrderId;

    if (!orderId) {
      return NextResponse.json(
        { error: "This payment is not linked to an OLM order" },
        { status: 404 }
      );
    }

    const references = getStripeSessionPaymentReferences(session);

    if (session.payment_status === "paid") {
      await completeStripeOrder(orderId, references);
    } else if (session.status === "complete") {
      await markStripeOrderPaymentPending(orderId, references);
    }

    const order = await getStripeOrderSummary(sessionId);

    if (!order) {
      return NextResponse.json(
        { error: "OLM order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      checkoutStatus: session.status,
      paymentStatus: order.payment_status,
      paymentMethodType:
        order.stripe_payment_method_type || references.paymentMethodType,
      order: {
        orderNumber: order.order_number,
        status: order.status,
        total: Number(order.total_cents) / 100,
        currency: order.currency,
        email: order.email,
      },
    });
  } catch (error) {
    console.error(
      "Stripe session lookup error:",
      error instanceof Error ? error.message : error
    );

    return NextResponse.json(
      { error: "No pudimos confirmar el estado del pago." },
      { status: 502 }
    );
  }
}
