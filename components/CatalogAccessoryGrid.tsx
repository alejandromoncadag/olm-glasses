"use client";

import { useEffect, useState } from "react";
import StorefrontProductCard from "@/components/StorefrontProductCard";

type ApiProduct = {
  slug: string;
  name: string;
  description: string;
  price: number;
  category: string;
  subcategory: string | null;
  type: string;
  isAvailable: boolean;
  purchasableOnline: boolean;
  favoritable: boolean;
  mainImage: { imageUrl: string; altText: string | null } | null;
};

type DisplayProduct = {
  slug: string;
  name: string;
  eyebrow: string;
  description: string;
  price: number;
  image: string;
  availableOnline: boolean;
  purchasableOnline: boolean;
  favoritable: boolean;
};

export default function CatalogAccessoryGrid() {
  const [products, setProducts] = useState<DisplayProduct[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/catalog/products", { cache: "no-store" });
        if (!response.ok) {
          setProducts([]);
          return;
        }
        const payload = (await response.json()) as {
          products: ApiProduct[];
          source: "legacy" | "opticaolm";
        };
        const matches = payload.products
          .filter(
            (product) =>
              product.type === "accessory" ||
              product.category === "accesorios_y_refacciones" ||
              product.category === "soluciones_y_cuidado"
          )
          .map((product) => ({
            slug: product.slug,
            name: product.name,
            eyebrow: product.subcategory || product.category,
            description: product.description,
            price: product.price,
            image: product.mainImage?.imageUrl || "",
            availableOnline: product.isAvailable,
            purchasableOnline: product.purchasableOnline,
            favoritable: product.favoritable,
          }));
        setProducts(matches);
      } catch {
        // Provider mode owns every fallback decision. Never mix in client data.
        setProducts([]);
      } finally {
        setLoaded(true);
      }
    }
    void load();
  }, []);

  return (
    <>
      <div className="mb-8 flex items-end justify-between gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">
            Colección inicial
          </p>
          <h2 className="mt-2 text-3xl font-bold">Nuestros accesorios</h2>
        </div>
        <p className="text-sm text-gray-500">
          {products.length} {products.length === 1 ? "producto" : "productos"}
        </p>
      </div>

      {loaded && products.length === 0 ? (
        <div className="rounded-3xl border border-black/10 p-10 text-center text-gray-600">
          No hay accesorios publicados por el momento.
        </div>
      ) : (
        <div className="grid items-stretch gap-6 md:grid-cols-3">
          {products.map((product, index) => (
            <StorefrontProductCard
              key={product.slug}
              slug={product.slug}
              name={product.name}
              eyebrow={product.eyebrow}
              description={product.description}
              price={product.price}
              image={product.image || null}
              actionLabel="Agregar al carrito"
              priority={index === 0}
              availableOnline={product.availableOnline}
              purchasableOnline={product.purchasableOnline}
              favoritable={product.favoritable}
            />
          ))}
        </div>
      )}
    </>
  );
}
