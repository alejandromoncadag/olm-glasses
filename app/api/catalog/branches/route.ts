import { getCatalogProvider } from "@/lib/catalog";
import { catalogErrorResponse, catalogJson } from "@/lib/catalog/routeResponse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const branches = await getCatalogProvider().listBranches();
    return catalogJson({ branches });
  } catch (error) {
    return catalogErrorResponse(error);
  }
}
