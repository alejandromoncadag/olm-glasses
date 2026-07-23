# Stripe setup for OLM Glasses

The application uses Stripe-hosted Checkout so payment card data never passes
through the OLM server.

## 1. Create the Stripe account

Create or activate a Stripe account registered for the Mexican OLM business.
Complete Stripe's business, representative, tax, and payout-bank verification.

In **Settings → Payment methods**, enable the methods available to the account:

- Cards
- OXXO
- Mexico bank transfers (SPEI)
- Apple Pay and Google Pay, when eligible

Stripe can hide a method when the account, currency, order, or customer is not
eligible for it.

## 2. Configure local environment variables

Copy the variable names from `.env.example` into `.env.local` and replace the
placeholders with Stripe **test-mode** values. Never commit `.env.local`.

- `APP_URL` is `http://localhost:3000` locally and the HTTPS store URL in
  production.
- `STRIPE_SECRET_KEY` comes from **Developers → API keys**.
- `STRIPE_WEBHOOK_SECRET` is the signing secret for the webhook endpoint.

## 3. Configure webhooks

The local webhook destination is:

`http://localhost:3000/api/stripe/webhook`

For local testing, the Stripe CLI can forward Stripe test events to that URL.
For production, create an HTTPS webhook endpoint in the Stripe Dashboard using:

`https://YOUR_STORE_DOMAIN/api/stripe/webhook`

Subscribe to these Checkout events:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`

Use the signing secret from the matching local or production endpoint. Local
and production webhook secrets are different.

## 4. Test before live payments

Use Stripe test mode first. Verify:

1. A successful card payment marks the order paid and processing.
2. OXXO and SPEI orders remain payment-pending until Stripe confirms them.
3. Failed or expired checkouts release their inventory reservation.
4. Repeated webhook delivery does not deduct inventory twice.
5. Admin order views display Stripe as the payment method.

Only switch to live keys after the full test checklist passes and the production
webhook returns successful responses.
