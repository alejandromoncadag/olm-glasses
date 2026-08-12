import { opticalPreviewErrorResponse, opticalPreviewRequest } from "@/lib/optical/serverClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = await opticalPreviewRequest("/preview", { method: "POST", body });
    return Response.json(payload, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return opticalPreviewErrorResponse(error); }
}
