/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProductPurchasePanel from "@/components/ProductPurchasePanel";

type ConfigurableProduct = {
  productId: string | null;
  slug: string;
  name: string;
  price: number;
  stock: number;
  availability: {
    branches: Array<{
      branchId: string;
      branchCode: string;
      branchName: string;
      availableQuantity: number;
    }>;
  };
  isActive: boolean;
  source: "legacy" | "opticaolm";
  type: "eyeglasses" | "sunglasses" | "accessory" | "contact_lenses";
  images: Array<{
    id: string;
    imageUrl: string;
    altText: string | null;
  }>;
};

export default function ConfigureProductPage() {
  const params = useParams();
  const slugParam = params.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
  const [product, setProduct] = useState<ConfigurableProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/catalog/products/${encodeURIComponent(slug || "")}`);
        if (!response.ok) throw new Error("Product not found");

        const data = (await response.json()) as {
          product?: ConfigurableProduct;
        };
        const nextProduct = data.product;

        if (
          !nextProduct ||
          nextProduct.source !== "opticaolm" ||
          !nextProduct.productId ||
          !nextProduct.isActive ||
          (nextProduct.type !== "eyeglasses" &&
            nextProduct.type !== "sunglasses")
        ) {
          throw new Error("Product is not configurable");
        }

        setProduct(nextProduct);
      } catch (loadError) {
        console.error(loadError);
        setError("No pudimos abrir la selección de micas para este producto.");
      } finally {
        setLoading(false);
      }
    }

    if (slug) loadProduct();
  }, [slug]);

  if (loading) {
    return (
      <main className="min-h-screen bg-white px-6 py-16">
        <p className="mx-auto max-w-7xl text-sm text-gray-600">
          Preparando tus opciones…
        </p>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="min-h-screen bg-white px-6 py-16 text-center">
        <h1 className="text-3xl">No pudimos abrir este configurador</h1>
        <p className="mt-3 text-gray-600">{error}</p>
        <a
          href={slug ? `/product/${slug}` : "/eyeglasses"}
          className="mt-6 inline-flex border border-black px-5 py-3 text-sm font-semibold"
        >
          Volver al producto
        </a>
      </main>
    );
  }

  const mainImage = product.images?.[0];
  const backHref = `/product/${product.slug}`;

  return (
    <main className="min-h-screen bg-white text-black">
      <section className="mx-auto grid min-h-[calc(100vh-140px)] max-w-[1600px] lg:grid-cols-[minmax(420px,0.95fr)_minmax(520px,1.05fr)]">
        <div className="relative border-b border-black/10 bg-[#f5f5f3] p-6 lg:sticky lg:top-0 lg:h-[calc(100vh-140px)] lg:border-b-0 lg:border-r lg:p-10">
          <a
            href={backHref}
            className="relative z-10 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-gray-600 transition hover:text-black"
          >
            <span aria-hidden="true">←</span>
            Volver al producto
          </a>

          <div className="mt-8 flex h-[calc(100%-60px)] min-h-[360px] items-center justify-center">
            {mainImage ? (
              <img
                src={mainImage.imageUrl}
                alt={mainImage.altText || product.name}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <p className="text-sm text-gray-500">Imagen próximamente</p>
            )}
          </div>
        </div>

        <div className="min-w-0 px-5 pb-16 sm:px-8 lg:px-12 xl:px-16">
          <div className="border-b border-black/10 py-7">
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#765b50]">
              Configura tu modelo
            </p>
            <h1 className="mt-2 text-3xl">{product.name}</h1>
          </div>

          <ProductPurchasePanel
            product={{
              productId: product.productId!,
              slug: product.slug,
              name: product.name,
              price: product.price,
              stock: product.stock,
              branches: product.availability.branches,
            }}
          />
        </div>
      </section>
    </main>
  );
}
