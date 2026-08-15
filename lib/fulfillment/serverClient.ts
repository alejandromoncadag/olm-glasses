import "server-only";

import { createHmac } from "node:crypto";

import type { CommerceOwner } from "@/lib/commerce/identity";

export class FulfillmentUpstreamError extends Error {
  constructor(message: string, public readonly status = 503, public readonly code = "FULFILLMENT_UNAVAILABLE") {
    super(message);
    this.name = "FulfillmentUpstreamError";
  }
}

export function createIdentityAssertion(ownerHash: string, email: string) {
  const token = (process.env.OPTICAOLM_COMMERCE_BEARER_TOKEN || "").trim();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const payload = `${ownerHash}|${email.trim().toLowerCase()}|${timestamp}`;
  return `${timestamp}:${createHmac("sha256", token).update(payload).digest("hex")}`;
}

function configuration() {
  const baseUrl = (process.env.OPTICAOLM_COMMERCE_API_URL || "").trim().replace(/\/$/, "");
  const token = (process.env.OPTICAOLM_COMMERCE_BEARER_TOKEN || "").trim();
  const timeoutMs = Number(process.env.ONLINE_COMMERCE_REQUEST_TIMEOUT_MS || 5000);
  if (!baseUrl || !token) throw new FulfillmentUpstreamError("El servicio de entrega no está configurado.");
  const url = new URL(baseUrl);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || timeoutMs < 250) {
    throw new FulfillmentUpstreamError("La configuración del servicio de entrega no es segura.");
  }
  return { baseUrl, token, timeoutMs };
}

export async function fulfillmentRequest(
  path: string,
  owner: CommerceOwner,
  init: { method?: "GET" | "POST"; body?: unknown; idempotencyKey?: string; identityAssertion?: string } = {}
) {
  const { baseUrl, token, timeoutMs } = configuration();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/storefront/fulfillment/v1${path}`, {
      method: init.method || "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "X-OLM-Owner-Type": owner.ownerType,
        "X-OLM-Owner-Hash": owner.ownerHash,
        ...(init.body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(init.idempotencyKey ? { "Idempotency-Key": init.idempotencyKey } : {}),
        ...(init.identityAssertion ? { "X-OLM-Identity-Assertion": init.identityAssertion } : {}),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
      redirect: "error",
      signal: controller.signal,
    });
  } catch {
    throw new FulfillmentUpstreamError("No pudimos comunicarnos con el servicio de entrega.");
  } finally {
    clearTimeout(timeout);
  }
  const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  if (!response.ok) {
    const detail = payload?.detail as { code?: unknown; message?: unknown } | string | undefined;
    const message = typeof detail === "object" ? String(detail?.message || "") : String(detail || "");
    const code = typeof detail === "object" ? String(detail?.code || "FULFILLMENT_REJECTED") : "FULFILLMENT_REJECTED";
    throw new FulfillmentUpstreamError(message || "La solicitud de entrega fue rechazada.", response.status, code);
  }
  if (!payload || payload.schemaVersion !== "1.0") {
    throw new FulfillmentUpstreamError("La respuesta del servicio de entrega no es compatible.");
  }
  return payload;
}

export function fulfillmentErrorResponse(error: unknown) {
  if (error instanceof FulfillmentUpstreamError) {
    return Response.json({ error: error.message, code: error.code }, { status: error.status < 500 ? error.status : 503 });
  }
  return Response.json({ error: "El servicio de entrega no está disponible." }, { status: 503 });
}
