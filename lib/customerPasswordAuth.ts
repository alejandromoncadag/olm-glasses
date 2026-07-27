import "server-only";

import crypto from "crypto";
import type { PoolClient } from "pg";

const PASSWORD_HASH_PREFIX = "scrypt-v1";
const PASSWORD_KEY_LENGTH = 64;
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

type PasswordRecord = {
  user_id: string;
  password_hash: string;
};

function derivePasswordKey(password: string, salt: string) {
  return new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(
      password,
      salt,
      PASSWORD_KEY_LENGTH,
      {
        N: 16384,
        r: 8,
        p: 1,
        maxmem: 64 * 1024 * 1024,
      },
      (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(derivedKey);
      }
    );
  });
}

export function normalizeCustomerEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

export function isValidCustomerEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

export function validateCustomerPassword(password: string) {
  if (password.length < 10) {
    return "La contraseña debe tener al menos 10 caracteres.";
  }

  if (password.length > 128) {
    return "La contraseña es demasiado larga.";
  }

  return null;
}

export async function hashCustomerPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = await derivePasswordKey(password, salt);

  return `${PASSWORD_HASH_PREFIX}:${salt}:${hash.toString("hex")}`;
}

export async function verifyCustomerPassword(
  password: string,
  storedHash: string | null
) {
  if (!storedHash) return false;

  const [prefix, salt, encodedHash] = storedHash.split(":");
  if (prefix !== PASSWORD_HASH_PREFIX || !salt || !encodedHash) return false;

  try {
    const expectedHash = Buffer.from(encodedHash, "hex");
    const candidateHash = await derivePasswordKey(password, salt);

    return (
      expectedHash.length === candidateHash.length &&
      crypto.timingSafeEqual(expectedHash, candidateHash)
    );
  } catch {
    return false;
  }
}

export async function findPasswordRecord(
  client: PoolClient,
  email: string
) {
  const result = await client.query<PasswordRecord>(
    `
      SELECT
        users.id AS user_id,
        customer_password_credentials.password_hash
      FROM users
      INNER JOIN customer_password_credentials
        ON customer_password_credentials.user_id = users.id
      WHERE LOWER(users.email) = LOWER($1)
      LIMIT 1
    `,
    [email]
  );

  return result.rows[0] || null;
}

export async function createDatabaseCustomerSession(
  client: PoolClient,
  userId: string
) {
  const sessionToken = crypto.randomBytes(32).toString("hex");
  const expires = new Date(
    Date.now() + SESSION_MAX_AGE_SECONDS * 1000
  );

  await client.query(
    `
      INSERT INTO sessions ("sessionToken", "userId", expires)
      VALUES ($1, $2, $3)
    `,
    [sessionToken, userId, expires]
  );

  return { sessionToken, expires };
}

export function getCustomerSessionCookie(
  requestUrl: string,
  sessionToken: string,
  expires: Date
) {
  const secure = new URL(requestUrl).protocol === "https:";

  return {
    name: `${secure ? "__Secure-" : ""}authjs.session-token`,
    value: sessionToken,
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      path: "/",
      secure,
      expires,
      maxAge: SESSION_MAX_AGE_SECONDS,
    },
  };
}

export function isSameOriginCustomerAuthRequest(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return process.env.NODE_ENV !== "production";

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
