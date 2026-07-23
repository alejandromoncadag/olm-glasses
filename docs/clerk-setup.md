# Clerk customer authentication setup

The application code is ready for Clerk, but the Clerk application and its
credentials must belong to the store owner. Never commit real credentials.

## 1. Create the Clerk application

1. Open <https://dashboard.clerk.com/>.
2. Create an application for Óptica OLM.
3. Copy the Publishable Key and Secret Key from **API keys**.
4. Add them to `.env.local` using the names in `.env.example`.
5. Restart `npm.cmd run dev`.

When the keys are absent, the application shows a safe setup message instead
of starting Clerk's temporary keyless mode.

## 2. Configure sign-in methods

In the Clerk Dashboard, open **User & Authentication**:

- Enable **Email address** and **Email verification code**.
- Enable **Google**. Clerk development credentials can be used locally; use
  store-owned Google OAuth credentials before production.
- Enable **Apple** after the store has an Apple Developer account and the
  required Service ID and private key.
- Enable **Phone number / SMS code** only if the store wants SMS login and has
  reviewed message costs and abuse controls.

The `/login` and `/signup` pages automatically display the methods enabled in
the Clerk Dashboard.

## 3. Configure the customer sync webhook

Create a Clerk webhook endpoint:

```text
https://YOUR_DOMAIN/api/webhooks/clerk
```

Subscribe to:

- `user.created`
- `user.updated`
- `user.deleted`

Copy the endpoint signing secret into `.env.local` as
`CLERK_WEBHOOK_SIGNING_SECRET`.

The application also performs an authenticated on-demand sync whenever a
customer opens the account, favorites, checkout, or booking flows. This means
the account remains usable if a webhook delivery is delayed.

## 4. Google production configuration

For production, create OAuth credentials in Google Cloud:

1. Configure the OAuth consent screen for Óptica OLM.
2. Create a Web application OAuth client.
3. Copy Clerk's authorized redirect URI into Google Cloud exactly.
4. Add the Google Client ID and Client Secret in Clerk.
5. Add the production store domain to both Google and Clerk.

## 5. Verification checklist

- Create a customer with an email code.
- Sign out and sign in with Google using the same verified email.
- Confirm only one PostgreSQL customer record exists.
- Add a favorite while signed out, sign in, and confirm it migrates.
- Save two addresses and select a default.
- Complete a Stripe test payment and confirm the order appears in `/account`.
- Book an eye exam and confirm it appears in `/account`.
- Verify the administrator still signs in at `/admin/login`.
