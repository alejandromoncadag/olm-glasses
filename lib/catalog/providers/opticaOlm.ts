import "server-only";

import type {
  BranchAvailability,
  CatalogAvailability,
  CatalogAvailabilityItem,
  CatalogBranch,
  CatalogCategory,
  CatalogListOptions,
  CatalogListResult,
  CatalogProduct,
  CatalogProvider,
  StorefrontProductType,
} from "@/lib/catalog/types";
import { CatalogProviderError } from "@/lib/catalog/types";

type UnknownRecord = Record<string, unknown>;

function record(value: unknown, label: string): UnknownRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new CatalogProviderError(`${label} has an invalid schema`, "schema");
  }
  return value as UnknownRecord;
}

function string(value: unknown, label: string): string {
  if (typeof value !== "string") {
    throw new CatalogProviderError(`${label} has an invalid schema`, "schema");
  }
  return value;
}

function nullableString(value: unknown, label: string): string | null {
  if (value === null || value === undefined) return null;
  return string(value, label);
}

function boolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") {
    throw new CatalogProviderError(`${label} has an invalid schema`, "schema");
  }
  return value;
}

function integer(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new CatalogProviderError(`${label} has an invalid schema`, "schema");
  }
  return value;
}

function optionalInteger(value: unknown, label: string): number | null {
  if (value === null || value === undefined) return null;
  return integer(value, label);
}

function array(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new CatalogProviderError(`${label} has an invalid schema`, "schema");
  }
  return value;
}

function storefrontType(category: string): StorefrontProductType {
  const mapping: Record<string, StorefrontProductType> = {
    lentes_opticos: "eyeglasses",
    lentes_de_sol: "sunglasses",
    lentes_de_contacto: "contact_lenses",
    accesorios_y_refacciones: "accessory",
    soluciones_y_cuidado: "accessory",
    examen_de_la_vista: "service",
    micas: "lens_component",
  };
  const mapped = mapping[category];
  if (!mapped) {
    throw new CatalogProviderError("Unsupported catalog category", "schema");
  }
  return mapped;
}

function allowedImageOrigins(baseUrl: string) {
  const origins = new Set<string>();
  origins.add(new URL(baseUrl).origin.toLowerCase());
  for (const raw of (process.env.OPTICAOLM_CATALOG_IMAGE_ORIGINS || "").split(",")) {
    const value = raw.trim();
    if (!value) continue;
    try {
      origins.add(new URL(value).origin.toLowerCase());
    } catch {
      throw new CatalogProviderError(
        "Catalog image origin configuration is invalid",
        "configuration"
      );
    }
  }
  return origins;
}

function safeImageUrl(value: unknown, origins: Set<string>): string {
  const imageUrl = string(value, "image.url");
  let parsed: URL;
  try {
    parsed = new URL(imageUrl);
  } catch {
    throw new CatalogProviderError("Catalog image URL is invalid", "schema");
  }
  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(parsed.pathname);
  } catch {
    throw new CatalogProviderError("Catalog image URL is unsafe", "schema");
  }
  if (
    !["http:", "https:"].includes(parsed.protocol) ||
    Boolean(parsed.username || parsed.password) ||
    !origins.has(parsed.origin.toLowerCase()) ||
    !decodedPath.startsWith("/media/") ||
    decodedPath.includes("\\") ||
    decodedPath.split("/").includes("..")
  ) {
    throw new CatalogProviderError("Catalog image URL is unsafe", "schema");
  }
  return imageUrl;
}

function parseAvailability(value: unknown): CatalogAvailability {
  const item = record(value, "availability");
  const mode = string(item.mode, "availability.mode");
  if (mode !== "branch_stock" && mode !== "not_stock_controlled") {
    throw new CatalogProviderError("Availability mode is invalid", "schema");
  }
  const branches: BranchAvailability[] = array(
    item.branches,
    "availability.branches"
  ).map((branchValue) => {
    const branch = record(branchValue, "availability.branch");
    return {
      branchId: string(branch.branchId, "branch.branchId"),
      branchCode: string(branch.branchCode, "branch.branchCode"),
      branchName: string(branch.branchName, "branch.branchName"),
      availableQuantity: integer(
        branch.availableQuantity,
        "branch.availableQuantity"
      ),
    };
  });
  return {
    mode,
    controlsStock: boolean(item.controlsStock, "availability.controlsStock"),
    availableOnline: boolean(
      item.availableOnline,
      "availability.availableOnline"
    ),
    totalOnlineAvailability: optionalInteger(
      item.totalOnlineAvailability,
      "availability.totalOnlineAvailability"
    ),
    branches,
  };
}

function parseProduct(value: unknown, origins: Set<string>): CatalogProduct {
  const item = record(value, "product");
  if (item.publishedOnline !== true) {
    throw new CatalogProviderError("Unpublished product in public response", "schema");
  }
  const sellingPrice = record(item.sellingPrice, "sellingPrice");
  const amount = string(sellingPrice.amount, "sellingPrice.amount");
  if (!/^\d+(?:\.\d{1,2})?$/.test(amount)) {
    throw new CatalogProviderError("Selling price is invalid", "schema");
  }
  const price = Number(amount);
  if (!Number.isFinite(price) || price < 0) {
    throw new CatalogProviderError("Selling price is invalid", "schema");
  }
  const category = string(item.category, "product.category");
  const productType = string(item.productType, "product.productType");
  if (!["producto_fisico", "componente_mica", "servicio"].includes(productType)) {
    throw new CatalogProviderError("Product type is invalid", "schema");
  }
  const images = array(item.images, "product.images").map((imageValue) => {
    const image = record(imageValue, "image");
    return {
      id: string(image.imageId, "image.imageId"),
      imageUrl: safeImageUrl(image.url, origins),
      altText: nullableString(image.altText, "image.altText"),
      displayOrder: integer(image.displayOrder, "image.displayOrder"),
      isMain: boolean(image.isPrimary, "image.isPrimary"),
      mimeType: nullableString(image.mimeType, "image.mimeType"),
      width: optionalInteger(image.width, "image.width"),
      height: optionalInteger(image.height, "image.height"),
    };
  });
  const availability = parseAvailability(item.availability);
  const id = string(item.productId, "product.productId");
  const upstreamPurchasable = boolean(
    item.purchasableOnline,
    "product.purchasableOnline"
  );
  const upstreamFavoritable = boolean(
    item.favoritable,
    "product.favoritable"
  );
  const authoritativeCommerceActive =
    (process.env.ONLINE_COMMERCE_MODE || "legacy").trim().toLowerCase() ===
    "optica";
  return {
    id: `opticaolm:${id}`,
    productId: id,
    sku: string(item.sku, "product.sku"),
    slug: string(item.slug, "product.slug"),
    name: string(item.name, "product.name"),
    description: nullableString(item.description, "product.description") || "",
    price,
    priceCents: Math.round(price * 100),
    currency: string(sellingPrice.currency, "sellingPrice.currency"),
    category,
    subcategory: nullableString(item.subcategory, "product.subcategory"),
    productType: productType as CatalogProduct["productType"],
    type: storefrontType(category),
    gender: null,
    shape: null,
    frameColor: null,
    frameSize: null,
    frameMaterial: null,
    clipOnCompatible:
      category === "lentes_opticos" &&
      nullableString(item.subcategory, "product.subcategory") === "clip_on",
    stock: availability.totalOnlineAvailability || 0,
    isAvailable: availability.availableOnline,
    isActive: true,
    createdAt: string(item.createdAt, "product.createdAt"),
    updatedAt: string(item.updatedAt, "product.updatedAt"),
    mainImage: images.length
      ? {
          imageUrl: (images.find((image) => image.isMain) || images[0]).imageUrl,
          altText: (images.find((image) => image.isMain) || images[0]).altText,
        }
      : null,
    images,
    availability,
    publishedOnline: true,
    source: "opticaolm",
    purchasableOnline: authoritativeCommerceActive && upstreamPurchasable,
    favoritable: authoritativeCommerceActive && upstreamFavoritable,
    maximumQuantityPerLine: optionalInteger(
      item.maximumQuantityPerLine,
      "product.maximumQuantityPerLine"
    ),
  };
}

export class OpticaOlmCatalogProvider implements CatalogProvider {
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly timeoutMs: number;
  private readonly origins: Set<string>;

  constructor() {
    this.baseUrl = (process.env.OPTICAOLM_CATALOG_API_URL || "").trim().replace(/\/$/, "");
    this.token = (process.env.OPTICAOLM_CATALOG_BEARER_TOKEN || "").trim();
    this.timeoutMs = Number(process.env.CATALOG_REQUEST_TIMEOUT_MS || 3000);
    if (!this.baseUrl || !this.token) {
      throw new CatalogProviderError(
        "OPTICAOLM catalog provider is not configured",
        "configuration"
      );
    }
    try {
      const parsedBaseUrl = new URL(this.baseUrl);
      if (
        !["http:", "https:"].includes(parsedBaseUrl.protocol) ||
        parsedBaseUrl.username ||
        parsedBaseUrl.password
      ) {
        throw new Error("Unsafe URL");
      }
    } catch {
      throw new CatalogProviderError("Catalog API URL is invalid", "configuration");
    }
    if (!Number.isFinite(this.timeoutMs) || this.timeoutMs < 250) {
      throw new CatalogProviderError("Catalog timeout is invalid", "configuration");
    }
    this.origins = allowedImageOrigins(this.baseUrl);
  }

  private async request(path: string): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        cache: "no-store",
        redirect: "error",
        signal: controller.signal,
      });
    } catch {
      throw new CatalogProviderError("Catalog request failed", "transport");
    } finally {
      clearTimeout(timeout);
    }

    if (response.status >= 500) {
      throw new CatalogProviderError(
        "Catalog upstream is unavailable",
        "upstream",
        response.status
      );
    }
    if (!response.ok) {
      throw new CatalogProviderError(
        "Catalog request was rejected",
        "http",
        response.status
      );
    }
    try {
      return await response.json();
    } catch {
      throw new CatalogProviderError("Catalog response is not JSON", "schema");
    }
  }

  async listProducts(options: CatalogListOptions = {}): Promise<CatalogListResult> {
    const query = new URLSearchParams();
    if (options.category) query.set("category", options.category);
    if (options.search) query.set("search", options.search);
    if (options.branchId) query.set("branch_id", options.branchId);
    query.set("limit", String(options.limit || 200));
    query.set("offset", String(options.offset || 0));
    const payload = record(
      await this.request(`/public/catalog/v1/products?${query.toString()}`),
      "product list"
    );
    if (payload.schemaVersion !== "1.0") {
      throw new CatalogProviderError("Catalog schema version is unsupported", "schema");
    }
    const products = array(payload.products, "products").map((item) =>
      parseProduct(item, this.origins)
    );
    return {
      products,
      total: integer(payload.total, "total"),
      source: "opticaolm",
    };
  }

  async getProduct(slug: string, branchId?: string): Promise<CatalogProduct | null> {
    const query = branchId ? `?branch_id=${encodeURIComponent(branchId)}` : "";
    try {
      const payload = record(
        await this.request(
          `/public/catalog/v1/products/${encodeURIComponent(slug)}${query}`
        ),
        "product detail"
      );
      if (payload.schemaVersion !== "1.0") {
        throw new CatalogProviderError("Catalog schema version is unsupported", "schema");
      }
      return parseProduct(payload.product, this.origins);
    } catch (error) {
      if (
        error instanceof CatalogProviderError &&
        error.kind === "http" &&
        error.status === 404
      ) {
        return null;
      }
      throw error;
    }
  }

  async listCategories(): Promise<CatalogCategory[]> {
    const payload = record(
      await this.request("/public/catalog/v1/categories"),
      "category list"
    );
    if (payload.schemaVersion !== "1.0") {
      throw new CatalogProviderError("Catalog schema version is unsupported", "schema");
    }
    return array(payload.categories, "categories").map((value) => {
      const item = record(value, "category");
      return {
        code: string(item.code, "category.code"),
        productCount: integer(item.productCount, "category.productCount"),
      };
    });
  }

  async listBranches(): Promise<CatalogBranch[]> {
    const payload = record(
      await this.request("/public/catalog/v1/branches"),
      "branch list"
    );
    if (payload.schemaVersion !== "1.0") {
      throw new CatalogProviderError("Catalog schema version is unsupported", "schema");
    }
    return array(payload.branches, "branches").map((value) => {
      const item = record(value, "branch");
      return {
        branchId: string(item.branchId, "branch.branchId"),
        code: string(item.code, "branch.code"),
        name: string(item.name, "branch.name"),
      };
    });
  }

  async getAvailability(
    productIds: string[],
    branchId?: string
  ): Promise<CatalogAvailabilityItem[]> {
    const query = new URLSearchParams();
    for (const productId of productIds) query.append("product_id", productId);
    if (branchId) query.set("branch_id", branchId);
    const payload = record(
      await this.request(`/public/catalog/v1/availability?${query.toString()}`),
      "availability list"
    );
    if (payload.schemaVersion !== "1.0") {
      throw new CatalogProviderError("Catalog schema version is unsupported", "schema");
    }
    return array(payload.products, "products").map((value) => {
      const item = record(value, "availability product");
      return {
        productId: string(item.productId, "availability.productId"),
        sku: string(item.sku, "availability.sku"),
        availability: parseAvailability(item.availability),
      };
    });
  }
}
