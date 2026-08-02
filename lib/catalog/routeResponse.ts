import "server-only";

import { NextResponse } from "next/server";
import { CatalogProviderError } from "@/lib/catalog";

export function catalogJson(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export function catalogErrorResponse(error: unknown) {
  if (
    error instanceof CatalogProviderError &&
    error.kind === "http" &&
    error.status === 404
  ) {
    return catalogJson({ error: "Product not found" }, 404);
  }
  if (error instanceof CatalogProviderError) {
    console.error("Catalog route failed", {
      kind: error.kind,
      status: error.status,
    });
  } else {
    console.error("Catalog route failed");
  }
  return catalogJson({ error: "Catalog temporarily unavailable" }, 503);
}
