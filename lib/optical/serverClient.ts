import "server-only";

export class OpticalPreviewUpstreamError extends Error {
  constructor(
    message: string,
    public readonly kind: "configuration" | "transport" | "http" | "schema",
    public readonly status?: number,
    public readonly safeDetails?: Record<string, unknown>
  ) {
    super(message);
    this.name = "OpticalPreviewUpstreamError";
  }
}

type OpticalOwner = { ownerType: "guest" | "customer"; ownerHash: string };

function settings() {
  const baseUrl = (process.env.OPTICAOLM_CATALOG_API_URL || "").trim().replace(/\/$/, "");
  const token = (process.env.OPTICAOLM_CATALOG_BEARER_TOKEN || "").trim();
  const timeoutMs = Number(process.env.CATALOG_REQUEST_TIMEOUT_MS || 3000);
  let url: URL;
  try { url = new URL(baseUrl); } catch {
    throw new OpticalPreviewUpstreamError("Optical preview URL is invalid", "configuration");
  }
  if (!baseUrl || !token || !["http:", "https:"].includes(url.protocol) || url.username || url.password || !Number.isFinite(timeoutMs) || timeoutMs < 250) {
    throw new OpticalPreviewUpstreamError("Optical preview is not configured", "configuration");
  }
  return { baseUrl, token, timeoutMs };
}

export async function opticalPreviewRequest(
  path: string,
  init: { method?: "GET" | "POST"; body?: unknown } = {}
): Promise<Record<string, unknown>> {
  const { baseUrl, token, timeoutMs } = settings();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/storefront/optical/v1${path}`, {
      method: init.method || "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...(init.body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
      redirect: "error",
      signal: controller.signal,
    });
  } catch {
    throw new OpticalPreviewUpstreamError("Optical preview request failed", "transport");
  } finally { clearTimeout(timeout); }
  let payload: unknown;
  try { payload = await response.json(); } catch {
    throw new OpticalPreviewUpstreamError("Optical preview response is not JSON", "schema", response.status);
  }
  if (!response.ok) {
    const detail = payload && typeof payload === "object" && "detail" in payload
      ? String((payload as { detail?: unknown }).detail || "") : "";
    throw new OpticalPreviewUpstreamError(detail || "Optical preview was rejected", "http", response.status);
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new OpticalPreviewUpstreamError("Optical preview response is invalid", "schema");
  }
  const parsed = payload as Record<string, unknown>;
  if (parsed.schemaVersion !== "1.0") {
    throw new OpticalPreviewUpstreamError("Optical preview schema is unsupported", "schema");
  }
  return parsed;
}

export async function opticalDraftRequest(
  path: string,
  owner: OpticalOwner,
  init: { method?: "GET" | "POST"; body?: unknown; idempotencyKey?: string } = {}
): Promise<Record<string, unknown>> {
  const { baseUrl, token, timeoutMs } = settings();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/storefront/optical/v1/drafts${path}`, {
      method: init.method || "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "X-OLM-Owner-Type": owner.ownerType,
        "X-OLM-Owner-Hash": owner.ownerHash,
        ...(init.body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(init.idempotencyKey ? { "Idempotency-Key": init.idempotencyKey } : {}),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
      redirect: "error",
      signal: controller.signal,
    });
  } catch {
    throw new OpticalPreviewUpstreamError("Optical draft request failed", "transport");
  } finally {
    clearTimeout(timeout);
  }
  let payload: unknown;
  try { payload = await response.json(); } catch {
    throw new OpticalPreviewUpstreamError("Optical draft response is not JSON", "schema", response.status);
  }
  if (!response.ok) {
    let message = "Optical draft was rejected";
    let safeDetails: Record<string, unknown> | undefined;
    if (payload && typeof payload === "object" && "detail" in payload) {
      const detail = (payload as { detail?: unknown }).detail;
      if (typeof detail === "string") message = detail;
      else if (detail && typeof detail === "object" && "message" in detail) {
        message = String((detail as { message?: unknown }).message || message);
        const candidate = (detail as { details?: unknown }).details;
        if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
          safeDetails = candidate as Record<string, unknown>;
        }
      }
    }
    throw new OpticalPreviewUpstreamError(message, "http", response.status, safeDetails);
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload) || (payload as { schemaVersion?: unknown }).schemaVersion !== "1.0") {
    throw new OpticalPreviewUpstreamError("Optical draft response is invalid", "schema", response.status);
  }
  return payload as Record<string, unknown>;
}

export function opticalPreviewErrorResponse(error: unknown) {
  if (error instanceof OpticalPreviewUpstreamError) {
    return Response.json(
      { error: error.message, ...(error.safeDetails ? { details: error.safeDetails } : {}) },
      { status: error.kind === "http" && error.status ? error.status : 502 }
    );
  }
  return Response.json({ error: "Optical preview unavailable" }, { status: 500 });
}
