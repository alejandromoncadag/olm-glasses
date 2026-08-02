import "server-only";

import {
  CatalogProviderError,
  type CatalogAvailabilityItem,
  type CatalogBranch,
  type CatalogCategory,
  type CatalogListOptions,
  type CatalogListResult,
  type CatalogMode,
  type CatalogProduct,
  type CatalogProvider,
} from "@/lib/catalog/types";
import { LegacyOlmCatalogProvider } from "@/lib/catalog/providers/legacyOlm";
import { OpticaOlmCatalogProvider } from "@/lib/catalog/providers/opticaOlm";

function modeFromEnvironment(): CatalogMode {
  const value = (process.env.CATALOG_MODE || "legacy").trim().toLowerCase();
  if (value !== "legacy" && value !== "shadow" && value !== "optica") {
    throw new CatalogProviderError("CATALOG_MODE is invalid", "configuration");
  }
  return value;
}

function fallbackEnabled() {
  return /^(1|true|yes)$/i.test(
    (process.env.CATALOG_LEGACY_FALLBACK_ENABLED || "false").trim()
  );
}

function safeShadowWarning(error: unknown) {
  if (error instanceof CatalogProviderError) {
    console.warn("OPTICAOLM catalog shadow check failed", {
      kind: error.kind,
      status: error.status,
    });
    return;
  }
  console.warn("OPTICAOLM catalog shadow check failed");
}

class ConfiguredCatalogProvider implements CatalogProvider {
  private readonly legacy = new LegacyOlmCatalogProvider();

  private optica() {
    return new OpticaOlmCatalogProvider();
  }

  private async select<T>(
    legacyRequest: () => Promise<T>,
    opticaRequest: (provider: OpticaOlmCatalogProvider) => Promise<T>
  ): Promise<T> {
    const mode = modeFromEnvironment();
    if (mode === "legacy") return legacyRequest();
    if (mode === "shadow") {
      try {
        const provider = this.optica();
        void opticaRequest(provider).catch(safeShadowWarning);
      } catch (error) {
        safeShadowWarning(error);
      }
      return legacyRequest();
    }
    try {
      return await opticaRequest(this.optica());
    } catch (error) {
      if (
        fallbackEnabled() &&
        error instanceof CatalogProviderError &&
        error.allowsLegacyFallback
      ) {
        return legacyRequest();
      }
      throw error;
    }
  }

  listProducts(options?: CatalogListOptions): Promise<CatalogListResult> {
    return this.select(
      () => this.legacy.listProducts(options),
      (provider) => provider.listProducts(options)
    );
  }

  getProduct(slug: string, branchId?: string): Promise<CatalogProduct | null> {
    return this.select(
      () => this.legacy.getProduct(slug, branchId),
      (provider) => provider.getProduct(slug, branchId)
    );
  }

  listCategories(): Promise<CatalogCategory[]> {
    return this.select(
      () => this.legacy.listCategories(),
      (provider) => provider.listCategories()
    );
  }

  listBranches(): Promise<CatalogBranch[]> {
    return this.select(
      () => this.legacy.listBranches(),
      (provider) => provider.listBranches()
    );
  }

  getAvailability(
    productIds: string[],
    branchId?: string
  ): Promise<CatalogAvailabilityItem[]> {
    return this.select(
      () => this.legacy.getAvailability(productIds, branchId),
      (provider) => provider.getAvailability(productIds, branchId)
    );
  }
}

export function getCatalogProvider(): CatalogProvider {
  return new ConfiguredCatalogProvider();
}

export { CatalogProviderError } from "@/lib/catalog/types";
