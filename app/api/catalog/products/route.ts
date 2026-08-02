import { getCatalogProvider } from "@/lib/catalog";
import { catalogErrorResponse, catalogJson } from "@/lib/catalog/routeResponse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function positiveInteger(value: string | null, fallback: number, maximum: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0
    ? Math.min(parsed, maximum)
    : fallback;
}

export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams;
    const result = await getCatalogProvider().listProducts({
      category: query.get("category") || undefined,
      search: query.get("search") || undefined,
      branchId: query.get("branchId") || undefined,
      limit: positiveInteger(query.get("limit"), 200, 200),
      offset: Math.max(0, Number(query.get("offset") || 0) || 0),
    });

    // Optical components remain in the provider contract but are not normal
    // storefront cards until a dedicated lens-selection experience requests them.
    const products = result.products.filter(
      (product) => product.productType !== "componente_mica"
    );
    return catalogJson({
      products,
      total: products.length,
      source: result.source,
    });
  } catch (error) {
    return catalogErrorResponse(error);
  }
}
