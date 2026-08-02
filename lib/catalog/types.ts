export type CatalogMode = "legacy" | "shadow" | "optica";
export type CatalogSource = "legacy" | "opticaolm";

export type StorefrontProductType =
  | "eyeglasses"
  | "sunglasses"
  | "accessory"
  | "contact_lenses"
  | "service"
  | "lens_component";

export type CatalogImage = {
  id: string;
  imageUrl: string;
  altText: string | null;
  displayOrder: number;
  isMain: boolean;
  mimeType?: string | null;
  width?: number | null;
  height?: number | null;
};

export type BranchAvailability = {
  branchId: string;
  branchCode: string;
  branchName: string;
  availableQuantity: number;
};

export type CatalogAvailability = {
  mode: "branch_stock" | "not_stock_controlled";
  controlsStock: boolean;
  availableOnline: boolean;
  totalOnlineAvailability: number | null;
  branches: BranchAvailability[];
};

export type CatalogProduct = {
  id: string;
  productId: string | null;
  sku: string | null;
  slug: string;
  name: string;
  description: string;
  price: number;
  priceCents: number;
  currency: string;
  category: string;
  subcategory: string | null;
  productType: "producto_fisico" | "componente_mica" | "servicio";
  type: StorefrontProductType;
  gender: string | null;
  shape: string | null;
  frameColor: string | null;
  frameSize: string | null;
  frameMaterial: string | null;
  clipOnCompatible: boolean | null;
  stock: number;
  isAvailable: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  mainImage: { imageUrl: string; altText: string | null } | null;
  images: CatalogImage[];
  availability: CatalogAvailability;
  publishedOnline: boolean;
  source: CatalogSource;
  purchasableOnline: boolean;
  favoritable: boolean;
  maximumQuantityPerLine: number | null;
};

export type CatalogListOptions = {
  category?: string;
  search?: string;
  branchId?: string;
  limit?: number;
  offset?: number;
};

export type CatalogListResult = {
  products: CatalogProduct[];
  total: number;
  source: CatalogSource;
};

export type CatalogCategory = {
  code: string;
  productCount: number;
};

export type CatalogBranch = {
  branchId: string;
  code: string;
  name: string;
};

export type CatalogAvailabilityItem = {
  productId: string;
  sku: string;
  availability: CatalogAvailability;
};

export interface CatalogProvider {
  listProducts(options?: CatalogListOptions): Promise<CatalogListResult>;
  getProduct(slug: string, branchId?: string): Promise<CatalogProduct | null>;
  listCategories(): Promise<CatalogCategory[]>;
  listBranches(): Promise<CatalogBranch[]>;
  getAvailability(
    productIds: string[],
    branchId?: string
  ): Promise<CatalogAvailabilityItem[]>;
}

export class CatalogProviderError extends Error {
  constructor(
    message: string,
    public readonly kind:
      | "configuration"
      | "transport"
      | "upstream"
      | "http"
      | "schema",
    public readonly status?: number
  ) {
    super(message);
    this.name = "CatalogProviderError";
  }

  get allowsLegacyFallback() {
    return this.kind === "transport" || this.kind === "upstream";
  }
}
