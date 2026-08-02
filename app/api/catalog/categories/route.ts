import { getCatalogProvider } from "@/lib/catalog";
import { catalogErrorResponse, catalogJson } from "@/lib/catalog/routeResponse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await getCatalogProvider().listCategories();
    return catalogJson({ categories });
  } catch (error) {
    return catalogErrorResponse(error);
  }
}
