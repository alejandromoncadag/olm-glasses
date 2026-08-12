import { opticalPreviewErrorResponse, opticalPreviewRequest } from "@/lib/optical/serverClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const frameProductId = new URL(request.url).searchParams.get("frameProductId") || "";
  if (!/^\d+$/.test(frameProductId) || Number(frameProductId) < 1) {
    return Response.json({ error: "Invalid frame product" }, { status: 400 });
  }
  try {
    const payload = await opticalPreviewRequest(`/options?frame_product_id=${encodeURIComponent(frameProductId)}`);
    return Response.json(payload, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return opticalPreviewErrorResponse(error); }
}
