import "server-only";

import { pool } from "@/lib/db";
import type {
  CatalogAvailabilityItem,
  CatalogBranch,
  CatalogCategory,
  CatalogListOptions,
  CatalogListResult,
  CatalogProduct,
  CatalogProvider,
  StorefrontProductType,
} from "@/lib/catalog/types";

type LegacyRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price_cents: number;
  currency: string;
  category: string;
  type: StorefrontProductType;
  gender: string;
  shape: string;
  frame_color: string;
  frame_size: string;
  frame_material: string;
  clip_on_compatible: boolean;
  stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  main_image_url: string | null;
  main_image_alt: string | null;
};

function mapLegacy(row: LegacyRow): CatalogProduct {
  const images = row.main_image_url
    ? [
        {
          id: `legacy:${row.id}:main`,
          imageUrl: row.main_image_url,
          altText: row.main_image_alt,
          displayOrder: 0,
          isMain: true,
        },
      ]
    : [];
  return {
    id: row.id,
    productId: null,
    sku: null,
    slug: row.slug,
    name: row.name,
    description: row.description,
    price: Number(row.price_cents) / 100,
    priceCents: Number(row.price_cents),
    currency: row.currency,
    category: row.category,
    subcategory: null,
    productType: "producto_fisico",
    type: row.type,
    gender: row.gender,
    shape: row.shape,
    frameColor: row.frame_color,
    frameSize: row.frame_size,
    frameMaterial: row.frame_material,
    clipOnCompatible: row.clip_on_compatible,
    stock: Number(row.stock),
    isAvailable: row.is_active && Number(row.stock) > 0,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    mainImage: row.main_image_url
      ? { imageUrl: row.main_image_url, altText: row.main_image_alt }
      : null,
    images,
    availability: {
      mode: "branch_stock",
      controlsStock: true,
      availableOnline: row.is_active && Number(row.stock) > 0,
      totalOnlineAvailability: Number(row.stock),
      branches: [],
    },
    publishedOnline: row.is_active,
    source: "legacy",
    purchasableOnline: true,
    favoritable: true,
    maximumQuantityPerLine: null,
  };
}

const BASE_SELECT = `
  SELECT products.id, products.slug, products.name, products.description,
         products.price_cents, products.currency, products.category,
         products.type, products.gender, products.shape, products.frame_color,
         products.frame_size, products.frame_material,
         products.clip_on_compatible, products.stock, products.is_active,
         products.created_at, products.updated_at,
         main_image.image_url AS main_image_url,
         main_image.alt_text AS main_image_alt
  FROM products
  LEFT JOIN LATERAL (
    SELECT image_url, alt_text
    FROM product_images
    WHERE product_images.product_id = products.id
    ORDER BY is_main DESC, display_order ASC, created_at ASC
    LIMIT 1
  ) AS main_image ON TRUE
`;

export class LegacyOlmCatalogProvider implements CatalogProvider {
  async listProducts(options: CatalogListOptions = {}): Promise<CatalogListResult> {
    const where = ["products.is_active = true"];
    const params: unknown[] = [];
    if (options.category) {
      params.push(options.category);
      where.push(`products.category = $${params.length}`);
    }
    if (options.search) {
      params.push(`%${options.search}%`);
      where.push(
        `(products.name ILIKE $${params.length} OR products.description ILIKE $${params.length})`
      );
    }
    const result = await pool.query<LegacyRow>(
      `${BASE_SELECT}
       WHERE ${where.join(" AND ")}
       ORDER BY products.created_at DESC`,
      params
    );
    return {
      products: result.rows.map(mapLegacy),
      total: result.rows.length,
      source: "legacy",
    };
  }

  async getProduct(slug: string, branchId?: string): Promise<CatalogProduct | null> {
    void branchId;
    const result = await pool.query<LegacyRow>(
      `${BASE_SELECT}
       WHERE products.slug = $1 AND products.is_active = true
       LIMIT 1`,
      [slug]
    );
    if (!result.rows[0]) return null;
    const product = mapLegacy(result.rows[0]);
    const images = await pool.query<{
      id: string;
      image_url: string;
      alt_text: string | null;
      display_order: number;
      is_main: boolean;
    }>(
      `SELECT id, image_url, alt_text, display_order, is_main
       FROM product_images
       WHERE product_id = $1
       ORDER BY is_main DESC, display_order, created_at`,
      [result.rows[0].id]
    );
    product.images = images.rows.map((image) => ({
      id: image.id,
      imageUrl: image.image_url,
      altText: image.alt_text,
      displayOrder: Number(image.display_order),
      isMain: image.is_main,
    }));
    return product;
  }

  async listCategories(): Promise<CatalogCategory[]> {
    const result = await pool.query<{ category: string; total: number }>(
      `SELECT category, COUNT(*)::int AS total
       FROM products
       WHERE is_active = true
       GROUP BY category
       ORDER BY category`
    );
    return result.rows.map((row) => ({
      code: row.category,
      productCount: Number(row.total),
    }));
  }

  async listBranches(): Promise<CatalogBranch[]> {
    return [];
  }

  async getAvailability(
    productIds: string[],
    branchId?: string
  ): Promise<CatalogAvailabilityItem[]> {
    void branchId;
    const result = await this.listProducts();
    const requested = new Set(productIds);
    return result.products
      .filter((product) => requested.has(product.id))
      .map((product) => ({
        productId: product.id,
        sku: product.slug,
        availability: product.availability,
      }));
  }
}
