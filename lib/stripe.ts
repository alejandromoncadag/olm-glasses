import "server-only";

import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, {
      appInfo: {
        name: "OLM Glasses",
        version: "0.1.0",
      },
    });
  }

  return stripeClient;
}

export function getStripeWebhookSecret() {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }

  return webhookSecret;
}

export function getStripeSessionPaymentReferences(
  session: Stripe.Checkout.Session
) {
  const paymentIntent = session.payment_intent;
  let paymentIntentId: string | null = null;
  let paymentMethodType: string | null = null;

  if (typeof paymentIntent === "string") {
    paymentIntentId = paymentIntent;
  } else if (paymentIntent) {
    paymentIntentId = paymentIntent.id;

    const paymentMethod = paymentIntent.payment_method;

    if (paymentMethod && typeof paymentMethod !== "string") {
      paymentMethodType = paymentMethod.type;
    }
  }

  return {
    checkoutSessionId: session.id,
    paymentIntentId,
    paymentMethodType,
  };
}
