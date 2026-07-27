export function isCustomerAuthConfigured() {
  return Boolean(
    process.env.AUTH_SECRET?.trim() && process.env.DATABASE_URL?.trim()
  );
}

export function isGoogleCustomerAuthConfigured() {
  return Boolean(
    isCustomerAuthConfigured() &&
      process.env.AUTH_GOOGLE_ID?.trim() &&
      process.env.AUTH_GOOGLE_SECRET?.trim()
  );
}
