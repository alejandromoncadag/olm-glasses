import { randomUUID } from "node:crypto";

import { getCommerceOwner } from "@/lib/commerce/identity";
import { opticalDraftRequest, opticalPreviewErrorResponse } from "@/lib/optical/serverClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ draftId: string }> }) {
  try {
    const owner = await getCommerceOwner();
    const { draftId } = await context.params;
    const idempotencyKey = request.headers.get("Idempotency-Key")?.trim() || randomUUID();
    if (new URL(request.url).searchParams.get("refreshReservation") === "1") {
      return Response.json(await opticalDraftRequest(`/${encodeURIComponent(draftId)}/refresh-reservation`, owner, {
        method: "POST", idempotencyKey,
      }));
    }
    const body = (await request.json().catch(() => null)) as { previewFingerprint?: unknown; configuredTotal?: unknown } | null;
    if (typeof body?.previewFingerprint !== "string" || !/^[0-9a-f]{64}$/.test(body.previewFingerprint) || typeof body.configuredTotal !== "string" || !/^\d+(?:\.\d{1,2})?$/.test(body.configuredTotal)) {
      return Response.json({ error: "La configuración óptica no es válida." }, { status: 400 });
    }
    return Response.json(await opticalDraftRequest(`/${encodeURIComponent(draftId)}/cart`, owner, {
      method: "POST",
      body: { previewFingerprint: body.previewFingerprint, configuredTotal: body.configuredTotal },
      idempotencyKey,
    }));
  } catch (error) {
    return opticalPreviewErrorResponse(error);
  }
}
