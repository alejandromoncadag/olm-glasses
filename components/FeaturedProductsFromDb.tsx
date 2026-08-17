"use client";

import { useEffect, useState } from "react";
import FeaturedProductShowcase, {
  type FeaturedShowcaseProduct,
} from "@/components/FeaturedProductShowcase";

type ApiProduct = {
  slug: string;
  name: string;
  price: number;
  category: string;
  subcategory: string | null;
  clipOnCompatible: boolean | null;
  frameColor: string | null;
  stock: number;
  isAvailable: boolean;
  isActive: boolean;
  purchasableOnline: boolean;
  favoritable: boolean;
  mainImage: { imageUrl: string; altText: string | null } | null;
};

type FeaturedProductsFromDbProps = {
  initialCategory?: "opticos" | "solares";
  eyebrow?: string;
  title?: string;
  showTabs?: boolean;
  appearance?: "default" | "new-arrivals";
};

function getCardColor(frameColor: string | null) {
  const color = (frameColor || "").toLowerCase();
  if (color.includes("transparente")) return "#f3f4f6";
  if (color.includes("cafe") || color.includes("café")) return "#8b5e3c";
  if (color.includes("dorado")) return "#d6b35a";
  if (color.includes("negro")) return "#111827";
  return "#f3f4f6";
}

export default function FeaturedProductsFromDb({
  initialCategory,
  eyebrow,
  title,
  showTabs,
  appearance,
}: FeaturedProductsFromDbProps) {
  const [products, setProducts] = useState<FeaturedShowcaseProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        setError("");
        const response = await fetch("/api/catalog/products", { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to fetch products");

        const data = await response.json();
        const nextProducts: FeaturedShowcaseProduct[] = (data.products || [])
          .filter(
            (product: ApiProduct) =>
              product.isActive &&
              !product.category.toLowerCase().includes("deportiv"),
          )
          .map((product: ApiProduct) => ({
            slug: product.slug,
            name: product.name,
            price: product.price,
            category: product.category,
            subcategory: product.subcategory,
            clipOnCompatible: product.clipOnCompatible,
            color: getCardColor(product.frameColor),
            stock: product.stock,
            isAvailable: product.isAvailable,
            purchasableOnline: product.purchasableOnline,
            favoritable: product.favoritable,
            mainImage: product.mainImage,
          }));

        setProducts(nextProducts);
      } catch (fetchError) {
        console.error(fetchError);
        setError("No pudimos cargar los productos nuevos.");
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  if (loading) return <p className="mt-10 text-gray-600">Cargando productos nuevos...</p>;
  if (error) return <p className="mt-10 text-red-600">{error}</p>;

  return (
    <FeaturedProductShowcase
      products={products}
      initialCategory={initialCategory}
    eyebrow={eyebrow}
    title={title}
    showTabs={showTabs}
    appearance={appearance}
  />
);
}
