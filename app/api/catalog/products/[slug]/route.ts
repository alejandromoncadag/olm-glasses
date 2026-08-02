import { getCatalogProvider } from "@/lib/catalog";
import { catalogErrorResponse, catalogJson } from "@/lib/catalog/routeResponse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const branchId = new URL(request.url).searchParams.get("branchId") || undefined;
    const product = await getCatalogProvider().getProduct(slug, branchId);
    if (!product || product.productType === "componente_mica") {
      return catalogJson({ error: "Product not found" }, 404);
    }
    return catalogJson({ product, source: product.source });
  } catch (error) {
    return catalogErrorResponse(error);
  }
}
