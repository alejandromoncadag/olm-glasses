import "server-only";

import type { CommerceOwner } from "@/lib/commerce/identity";

export class CommerceUpstreamError extends Error {
  constructor(
    message: string,
    public readonly kind: "configuration" | "transport" | "http" | "schema",
    public readonly status?: number
  ) {
    super(message);
    this.name = "CommerceUpstreamError";
  }
}

function configuration() {
  const baseUrl = (process.env.OPTICAOLM_COMMERCE_API_URL || "")
    .trim()
    .replace(/\/$/, "");
  const token = (process.env.OPTICAOLM_COMMERCE_BEARER_TOKEN || "").trim();
  const timeoutMs = Number(
    process.env.ONLINE_COMMERCE_REQUEST_TIMEOUT_MS || 3000
  );
  if (!baseUrl || !token) {
    throw new CommerceUpstreamError(
      "Authoritative commerce is not configured",
      "configuration"
    );
  }
  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    throw new CommerceUpstreamError("Commerce API URL is invalid", "configuration");
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    !Number.isFinite(timeoutMs) ||
    timeoutMs < 250
  ) {
    throw new CommerceUpstreamError("Commerce configuration is unsafe", "configuration");
  }
  return { baseUrl, token, timeoutMs };
}

export async function commerceRequest(
  path: string,
  owner: CommerceOwner,
  init: {
    method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
    body?: unknown;
    idempotencyKey?: string;
  } = {}
) {
  const { baseUrl, token, timeoutMs } = configuration();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/storefront/commerce/v1${path}`, {
      method: init.method || "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "X-OLM-Owner-Type": owner.ownerType,
        "X-OLM-Owner-Hash": owner.ownerHash,
        ...(init.body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(init.idempotencyKey
          ? { "Idempotency-Key": init.idempotencyKey }
          : {}),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
      redirect: "error",
      signal: controller.signal,
    });
  } catch {
    throw new CommerceUpstreamError("Commerce request failed", "transport");
  } finally {
    clearTimeout(timeout);
  }
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new CommerceUpstreamError(
      "Commerce response is not JSON",
      "schema",
      response.status
    );
  }
  if (!response.ok) {
    const detail =
      payload && typeof payload === "object" && "detail" in payload
        ? String((payload as { detail?: unknown }).detail || "")
        : "";
    throw new CommerceUpstreamError(
      detail || "Commerce request was rejected",
      "http",
      response.status
    );
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new CommerceUpstreamError("Commerce response is invalid", "schema");
  }
  const parsed = payload as Record<string, unknown>;
  if (parsed.schemaVersion !== "1.0") {
    throw new CommerceUpstreamError(
      "Commerce schema version is unsupported",
      "schema"
    );
  }
  return parsed;
}

export function commerceErrorResponse(error: unknown) {
  if (error instanceof CommerceUpstreamError) {
    console.error("Authoritative commerce route failed", {
      kind: error.kind,
      status: error.status,
    });
    return Response.json(
      { error: error.message },
      { status: error.status && error.status < 500 ? error.status : 503 }
    );
  }
  console.error("Authoritative commerce route failed");
  return Response.json(
    { error: "Authoritative commerce is temporarily unavailable" },
    { status: 503 }
  );
}
