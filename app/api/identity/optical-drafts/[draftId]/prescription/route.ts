import { randomUUID } from "node:crypto";

import { identityErrorResponse, identityRequest, identityUploadRequest, verifiedIdentityContext } from "@/lib/identity/serverClient";

export const runtime = "nodejs";
export async function POST(request: Request, context: { params: Promise<{ draftId: string }> }) {
  try {
    const ctx = await verifiedIdentityContext(); const { draftId } = await context.params;
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
      const max = 10 * 1024 * 1024; const length = request.headers.get("content-length");
      if (length && (!/^\d+$/.test(length) || Number(length) > max)) return Response.json({ error: "La receta debe pesar 10 MB o menos." }, { status: 413 });
      if (!request.body) return Response.json({ error: "Selecciona un archivo de receta." }, { status: 400 });
      const chunks: Uint8Array[] = []; let total = 0; const reader = request.body.getReader();
      while (true) { const part = await reader.read(); if (part.done) break; total += part.value.byteLength; if (total > max) return Response.json({ error: "La receta debe pesar 10 MB o menos." }, { status: 413 }); chunks.push(part.value); }
      const bytes = new Uint8Array(total); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
      return Response.json(await identityUploadRequest(`/optical-drafts/${encodeURIComponent(draftId)}/prescription-upload`, ctx.accountHash, bytes, request.headers.get("x-filename") || "receta", request.headers.get("content-type") || "", randomUUID()));
    }
    const body = await request.json();
    return Response.json(await identityRequest(`/optical-drafts/${encodeURIComponent(draftId)}/prescription`, ctx.accountHash, { method: "POST", body: { prescriptionRef: body.prescriptionRef }, idempotencyKey: randomUUID() }));
  } catch (error) { return identityErrorResponse(error); }
}
