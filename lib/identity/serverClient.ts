import "server-only";

import { randomUUID } from "node:crypto";

import { getOptionalAuthenticatedCustomer } from "@/lib/customerAccounts";
import { getCommerceOwner, getMergeOwners } from "@/lib/commerce/identity";

export class IdentityUpstreamError extends Error {
  constructor(message: string, public status = 502) {
    super(message); this.name = "IdentityUpstreamError";
  }
}

function settings() {
  if (process.env.PHASE_1GE_ENABLED !== "true") throw new IdentityUpstreamError("La vinculación de paciente está deshabilitada.", 503);
  const baseUrl = (process.env.OPTICAOLM_IDENTITY_API_URL || process.env.OPTICAOLM_CATALOG_API_URL || "").trim().replace(/\/$/, "");
  const token = (process.env.OPTICAOLM_IDENTITY_BEARER_TOKEN || "").trim();
  const timeoutMs = Number(process.env.ONLINE_IDENTITY_REQUEST_TIMEOUT_MS || 3000);
  let url: URL;
  try { url = new URL(baseUrl); } catch { throw new IdentityUpstreamError("La conexión de identidad no está configurada.", 503); }
  if (!token || !["http:", "https:"].includes(url.protocol) || url.username || url.password || !Number.isFinite(timeoutMs)) {
    throw new IdentityUpstreamError("La conexión de identidad no está configurada.", 503);
  }
  return { baseUrl, token, timeoutMs };
}

export async function verifiedIdentityContext() {
  const customer = await getOptionalAuthenticatedCustomer();
  if (!customer) throw new IdentityUpstreamError("Inicia sesión para continuar.", 401);
  if (!customer.emailVerified) throw new IdentityUpstreamError("Verifica tu correo antes de vincular datos de paciente.", 403);
  const owner = await getCommerceOwner();
  if (owner.ownerType !== "customer") throw new IdentityUpstreamError("La cuenta no está disponible.", 401);
  return { customer, accountHash: owner.ownerHash };
}

export async function identityRequest(
  path: string,
  accountHash: string,
  init: { method?: "GET" | "POST"; body?: unknown; guestHash?: string; idempotencyKey?: string } = {}
) {
  const { baseUrl, token, timeoutMs } = settings();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/storefront/identity/v1${path}`, {
      method: init.method || "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "X-OLM-Account-Hash": accountHash,
        "X-OLM-Email-Verified": "true",
        ...(init.guestHash ? { "X-OLM-Guest-Owner-Hash": init.guestHash } : {}),
        ...(init.idempotencyKey ? { "Idempotency-Key": init.idempotencyKey } : {}),
        ...(init.body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store", redirect: "error", signal: controller.signal,
    });
  } catch { throw new IdentityUpstreamError("No pudimos conectar con el servicio de identidad."); }
  finally { clearTimeout(timeout); }
  let payload: unknown;
  try { payload = await response.json(); } catch { throw new IdentityUpstreamError("La respuesta de identidad no es válida."); }
  if (!response.ok) {
    let message = "No pudimos completar la vinculación.";
    if (payload && typeof payload === "object" && "detail" in payload) {
      const detail = (payload as { detail?: unknown }).detail;
      if (typeof detail === "string") message = detail;
      else if (detail && typeof detail === "object" && "message" in detail) message = String((detail as { message?: unknown }).message || message);
    }
    throw new IdentityUpstreamError(message, response.status);
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new IdentityUpstreamError("La respuesta de identidad no es válida.");
  return payload as Record<string, unknown>;
}

export async function guestIdentityRequest(
  path: string,
  init: { method?: "GET" | "POST"; body?: unknown } = {}
) {
  const { baseUrl, token, timeoutMs } = settings();
  const owner = await getCommerceOwner();
  if (owner.ownerType !== "guest") throw new IdentityUpstreamError("La verificación de invitado no está disponible para cuentas autenticadas.", 400);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/storefront/identity/v1${path}`, {
      method: init.method || "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "X-OLM-Owner-Type": "guest",
        "X-OLM-Owner-Hash": owner.ownerHash,
        ...(init.body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store", redirect: "error", signal: controller.signal,
    });
  } catch { throw new IdentityUpstreamError("No pudimos conectar con el servicio de identidad."); }
  finally { clearTimeout(timeout); }
  let payload: unknown;
  try { payload = await response.json(); } catch { throw new IdentityUpstreamError("La respuesta de identidad no es válida."); }
  if (!response.ok) {
    const detail = payload && typeof payload === "object" && "detail" in payload ? (payload as { detail?: unknown }).detail : null;
    const message = detail && typeof detail === "object" && "message" in detail ? String((detail as { message?: unknown }).message || "No pudimos completar la verificación.") : String(detail || "No pudimos completar la verificación.");
    throw new IdentityUpstreamError(message, response.status);
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new IdentityUpstreamError("La respuesta de identidad no es válida.");
  return payload as Record<string, unknown>;
}

export function identityErrorResponse(error: unknown) {
  return Response.json({ error: error instanceof Error ? error.message : "No pudimos completar la acción." }, { status: error instanceof IdentityUpstreamError ? error.status : 500 });
}

export async function claimGuestOpticalDrafts(draftId?: string) {
  const context = await verifiedIdentityContext();
  const owners = await getMergeOwners();
  if (!owners?.guestOwnerHash) return { claimed: 0 };
  return identityRequest(
    draftId ? `/optical-drafts/${encodeURIComponent(draftId)}/claim` : "/optical-drafts/claim",
    context.accountHash,
    { method: "POST", guestHash: owners.guestOwnerHash, idempotencyKey: randomUUID() }
  );
}
