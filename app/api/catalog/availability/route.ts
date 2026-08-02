import { getCatalogProvider } from "@/lib/catalog";
import { catalogErrorResponse, catalogJson } from "@/lib/catalog/routeResponse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams;
    const productIds = Array.from(
      new Set(query.getAll("productId").map((value) => value.trim()).filter(Boolean))
    );
    if (!productIds.length || productIds.length > 100) {
      return catalogJson(
        { error: "Provide between 1 and 100 productId values" },
        400
      );
    }
    const products = await getCatalogProvider().getAvailability(
      productIds,
      query.get("branchId") || undefined
    );
    return catalogJson({ products });
  } catch (error) {
    return catalogErrorResponse(error);
  }
}
