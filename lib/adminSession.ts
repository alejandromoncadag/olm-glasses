import crypto from "crypto";

export const ADMIN_SESSION_COOKIE = "olm-admin-session";

export type AdminSession = {
  id: string;
  email: string;
  fullName: string;
  role: "admin";
  adminRole: string;
  expiresAt: number;
};

function getAuthSecret() {
  return process.env.AUTH_SECRET || "local-development-secret-only";
}

function signPayload(payload: string) {
  return crypto
    .createHmac("sha256", getAuthSecret())
    .update(payload)
    .digest("base64url");
}

export function createAdminSessionToken(session: AdminSession) {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  const signature = signPayload(payload);

  return `${payload}.${signature}`;
}

export function verifyAdminSessionToken(token: string | undefined) {
  if (!token) {
    return null;
  }

  const [payload, signature] = token.split(".");

  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = signPayload(payload);

  try {
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    if (!isValid) {
      return null;
    }

    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as AdminSession;

    if (!session.expiresAt || session.expiresAt < Date.now()) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

