import "server-only";

import { createHmac, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

import { getOptionalAuthenticatedCustomer } from "@/lib/customerAccounts";

const GUEST_COOKIE = "olm-authoritative-commerce";
const GUEST_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export type CommerceOwner = {
  ownerType: "guest" | "customer";
  ownerHash: string;
};

function identitySecret() {
  const secret = (process.env.ONLINE_COMMERCE_IDENTITY_SECRET || "").trim();
  if (secret.length < 32) {
    throw new Error("ONLINE_COMMERCE_IDENTITY_SECRET is not configured safely");
  }
  return secret;
}

function hashIdentity(kind: "guest" | "customer", raw: string) {
  return createHmac("sha256", identitySecret())
    .update(`${kind}:${raw}`)
    .digest("hex");
}

async function existingGuestToken() {
  return (await cookies()).get(GUEST_COOKIE)?.value || null;
}

async function ensureGuestToken() {
  const cookieStore = await cookies();
  const existing = cookieStore.get(GUEST_COOKIE)?.value;
  if (existing) return existing;
  const token = randomBytes(32).toString("base64url");
  cookieStore.set(GUEST_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: GUEST_MAX_AGE_SECONDS,
    path: "/",
    priority: "high",
  });
  return token;
}

export async function getCommerceOwner(): Promise<CommerceOwner> {
  const customer = await getOptionalAuthenticatedCustomer();
  if (customer) {
    return {
      ownerType: "customer",
      ownerHash: hashIdentity("customer", customer.authUserId),
    };
  }
  const token = await ensureGuestToken();
  return { ownerType: "guest", ownerHash: hashIdentity("guest", token) };
}

export async function getMergeOwners() {
  const customer = await getOptionalAuthenticatedCustomer();
  if (!customer) return null;
  const guestToken = await existingGuestToken();
  return {
    customer: {
      ownerType: "customer" as const,
      ownerHash: hashIdentity("customer", customer.authUserId),
    },
    guestOwnerHash: guestToken ? hashIdentity("guest", guestToken) : null,
  };
}

export async function removeGuestCommerceCookie() {
  (await cookies()).delete(GUEST_COOKIE);
}
