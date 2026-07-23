# Auth.js customer authentication setup

Customer authentication uses Auth.js with the PostgreSQL adapter and
database-backed sessions. Google is the only customer sign-in provider in the
first version. The existing administrator login remains separate at
`/admin/login`.

Never commit real credentials.

## 1. Apply the database migration

Apply the new migration to each database before enabling customer sign-in:

```text
database/migrations/20260723_add_authjs_tables.sql
```

It creates the Auth.js `users`, `accounts`, `sessions`, and
`verification_token` tables. It also adds `customers.authjs_user_id`, which
links the authentication identity to the existing customer profile.

The migration does not modify the older applied migrations and does not remove
customer profiles, addresses, favorites, orders, or eye-exam bookings.

## 2. Create Google OAuth credentials

In Google Cloud Console:

1. Configure the OAuth consent screen for Óptica OLM.
2. Create an OAuth client with application type **Web application**.
3. Add this local authorized redirect URI:

```text
http://localhost:3000/api/auth/callback/google
```

4. For production, add the equivalent HTTPS URI:

```text
https://YOUR_DOMAIN/api/auth/callback/google
```

5. Keep the Google client ID and secret outside Git.

## 3. Configure local environment variables

Copy the Auth.js variable names from `.env.example` into `.env.local` and
replace the placeholders locally:

```text
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
```

`AUTH_SECRET` must be a long random value. Auth.js can generate one with its
CLI, or an equivalent cryptographically secure generator can be used.

Restart `npm.cmd run dev` after changing local environment variables.

When these three values are absent, the customer login screen shows a safe
configuration message. Guest shopping, guest checkout, and the administrator
login continue to work.

## 4. Verification checklist

- Sign in with a Google account whose email is verified.
- Confirm the account appears in the PostgreSQL `users` table.
- Confirm a database row is created in `sessions` while signed in.
- Confirm the matching `customers` row receives `authjs_user_id`.
- Add a favorite while signed out, sign in, and confirm it moves into the
  customer account.
- Save an address and confirm another customer cannot access it.
- Create a guest order and confirm guest checkout still works.
- Create an authenticated order and confirm it appears in `/account`.
- Book an eye exam while signed in and confirm it appears in `/account`.
- Confirm the administrator still signs in at `/admin/login`.

## Future email login

Email login is intentionally not enabled yet. Auth.js supports passwordless
email sign-in, but it requires an SMTP or transactional email provider and the
`verification_token` table. Add it only after the store chooses and configures
an email-delivery service.
