import { NextResponse } from "next/server";

import {
  attachStripeSessionToOrder,
  createReservedStripeOrder,
  releaseStripeOrderReservation,
  saveStripeCustomerId,
  StripeCheckoutInput,
  StripeOrderError,
} from "@/lib/stripeOrders";
import { getStripeClient } from "@/lib/stripe";

export const runtime = "nodejs";

function getBaseUrl(request: Request) {
  const configuredUrl = process.env.APP_URL?.trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  const requestUrl = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProtocol = request.headers.get("x-forwarded-proto");

  if (forwardedHost) {
    return `${forwardedProtocol || "https"}://${forwardedHost}`;
  }

  return requestUrl.origin;
}

export async function POST(request: Request) {
  let orderId: string | null = null;

  try {
    const stripe = getStripeClient();
    const input = (await request.json()) as StripeCheckoutInput;
    const order = await createReservedStripeOrder(input);
    orderId = order.id;

    let stripeCustomerId = order.stripeCustomerId;

    if (!stripeCustomerId) {
      const stripeCustomer = await stripe.customers.create(
        {
          name: order.customer.fullName,
          email: order.customer.email,
          phone: order.customer.phone,
          address:
            input.deliveryMethod === "shipping"
              ? {
                  line1: order.customer.address,
                  city: order.customer.city,
                  state: order.customer.state,
                  postal_code: order.customer.zipCode,
                  country: "MX",
                }
              : undefined,
          metadata: {
            olmCustomerId: order.customerId,
          },
        },
        {
          idempotencyKey: `olm-customer-${order.customerId}`,
        }
      );

      stripeCustomerId = stripeCustomer.id;
      await saveStripeCustomerId(order.customerId, stripeCustomerId);
    }

    const baseUrl = getBaseUrl(request);
    const expiresAt = Math.floor(Date.now() / 1000) + 30 * 60;
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        customer: stripeCustomerId,
        client_reference_id: order.id,
        locale: "es",
        payment_method_types: ["card", "oxxo", "customer_balance"],
        payment_method_options: {
          oxxo: {
            expires_after_days: 2,
          },
          customer_balance: {
            funding_type: "bank_transfer",
            bank_transfer: {
              type: "mx_bank_transfer",
            },
          },
        },
        line_items: order.items.map((item) => ({
          quantity: item.quantity,
          price_data: {
            currency: order.currency,
            unit_amount: item.unitPriceCents,
            product_data: {
              name: item.productName,
              description: `${item.lensOption} · ${item.prescriptionMethod}`,
              metadata: {
                productId: item.productId,
                productSlug: item.productSlug,
              },
            },
          },
        })),
        metadata: {
          olmOrderId: order.id,
          olmOrderNumber: order.orderNumber,
        },
        payment_intent_data: {
          metadata: {
            olmOrderId: order.id,
            olmOrderNumber: order.orderNumber,
          },
        },
        success_url: `${baseUrl}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/checkout?payment=cancelled&order=${encodeURIComponent(
          order.orderNumber
        )}`,
        expires_at: expiresAt,
        submit_type: "pay",
      },
      {
        idempotencyKey: `olm-checkout-${order.id}`,
      }
    );

    if (!session.url) {
      throw new Error("Stripe did not return a Checkout URL");
    }

    await attachStripeSessionToOrder(order.id, session.id, expiresAt);

    return NextResponse.json(
      {
        checkoutUrl: session.url,
        orderNumber: order.orderNumber,
      },
      { status: 201 }
    );
  } catch (error) {
    if (orderId) {
      try {
        await releaseStripeOrderReservation(
          orderId,
          "Stripe checkout could not be created"
        );
      } catch (releaseError) {
        console.error("Could not release Stripe reservation:", releaseError);
      }
    }

    console.error(
      "Stripe Checkout error:",
      error instanceof Error ? error.message : error
    );

    if (error instanceof StripeOrderError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    if (
      error instanceof Error &&
      error.message === "STRIPE_SECRET_KEY is not configured"
    ) {
      return NextResponse.json(
        { error: "Stripe todavía no está configurado en este ambiente." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "No pudimos iniciar el pago seguro. Intenta de nuevo." },
      { status: 502 }
    );
  }
}
