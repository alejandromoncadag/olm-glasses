import { NextResponse } from "next/server";

import {
  getStripeClient,
  getStripeSessionPaymentReferences,
  getStripeWebhookSecret,
} from "@/lib/stripe";
import {
  completeStripeOrder,
  markStripeOrderPaymentPending,
  releaseStripeOrderReservation,
} from "@/lib/stripeOrders";

export const runtime = "nodejs";

async function retrieveExpandedSession(sessionId: string) {
  return getStripeClient().checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent.payment_method"],
  });
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature" },
      { status: 400 }
    );
  }

  let event;

  try {
    const payload = await request.text();
    event = getStripeClient().webhooks.constructEvent(
      payload,
      signature,
      getStripeWebhookSecret()
    );
  } catch (error) {
    console.error(
      "Stripe webhook signature error:",
      error instanceof Error ? error.message : error
    );

    return NextResponse.json(
      { error: "Invalid Stripe webhook signature" },
      { status: 400 }
    );
  }

  try {
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = await retrieveExpandedSession(event.data.object.id);
      const orderId = session.metadata?.olmOrderId;

      if (orderId) {
        const references = getStripeSessionPaymentReferences(session);

        if (session.payment_status === "paid") {
          await completeStripeOrder(orderId, references);
        } else {
          await markStripeOrderPaymentPending(orderId, references);
        }
      }
    }

    if (
      event.type === "checkout.session.async_payment_failed" ||
      event.type === "checkout.session.expired"
    ) {
      const session = event.data.object;
      const orderId = session.metadata?.olmOrderId;

      if (orderId) {
        await releaseStripeOrderReservation(
          orderId,
          event.type === "checkout.session.expired"
            ? "Stripe checkout expired"
            : "Stripe asynchronous payment failed"
        );
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook processing error:", error);

    return NextResponse.json(
      { error: "Stripe webhook processing failed" },
      { status: 500 }
    );
  }
}
