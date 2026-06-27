"use client";

import { useEffect, useState } from "react";
import ProductGrid from "@/components/ProductGrid";
import type { Product } from "@/types/product";

type ApiProduct = {
  slug: string;
  name: string;
  price: number;
  category: string;
  type: "eyeglasses" | "sunglasses";
  description: string;
  gender: "hombre" | "mujer" | "unisex";
  shape: "redondo" | "cuadrado" | "rectangular" | "aviador";
  frameColor: string;
  stock: number;
  isActive: boolean;
  mainImage: {
    imageUrl: string;
    altText: string | null;
  } | null;
};

function getCardColor(frameColor: string) {
  const color = frameColor.toLowerCase();

  if (color.includes("transparente")) return "#f3f4f6";
  if (color.includes("cafe") || color.includes("café")) return "#8b5e3c";
  if (color.includes("dorado")) return "#d6b35a";
  if (color.includes("negro")) return "#111827";

  return "#f3f4f6";
}

function normalizeFrameColor(frameColor: string): Product["frameColor"] {
  const color = frameColor.toLowerCase();

  if (color.includes("transparente")) return "transparente";
  if (color.includes("cafe") || color.includes("café")) return "cafe";
  if (color.includes("dorado")) return "dorado";

  return "negro";
}

export default function FeaturedProductsFromDb() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/products");

        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const data = await response.json();

        const featuredProducts: Product[] = data.products
          .filter((product: ApiProduct) => product.isActive)
          .slice(0, 3)
          .map((product: ApiProduct) => ({
            slug: product.slug,
            name: product.name,
            price: product.price,
            category: product.category,
            type: product.type,
            color: getCardColor(product.frameColor),
            description: product.description,
            gender: product.gender,
            shape: product.shape,
            frameColor: normalizeFrameColor(product.frameColor),
            stock: product.stock,
            isActive: product.isActive,
            mainImage: product.mainImage,
          }));

        setProducts(featuredProducts);
      } catch (error) {
        console.error(error);
        setError("No pudimos cargar los productos destacados.");
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  if (loading) {
    return <p className="mt-10 text-gray-600">Cargando productos...</p>;
  }

  if (error) {
    return <p className="mt-10 text-red-600">{error}</p>;
  }

  return <ProductGrid products={products} />;
}

