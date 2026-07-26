"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ProductCard from "@/components/ProductCard";
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
  mainImage: { imageUrl: string; altText: string | null } | null;
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

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d={direction === "left" ? "M15 18l-6-6 6-6" : "M9 6l6 6-6 6"}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

export default function FeaturedProductsFromDb() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/products");
        if (!response.ok) throw new Error("Failed to fetch products");

        const data = await response.json();
        const newProducts: Product[] = data.products
          .filter((product: ApiProduct) => product.isActive)
          .slice(0, 8)
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

        setProducts(newProducts);
      } catch (error) {
        console.error(error);
        setError("No pudimos cargar los lentes nuevos.");
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  function moveCarousel(direction: "left" | "right") {
    const carousel = carouselRef.current;
    if (!carousel) return;

    carousel.scrollBy({
      left: direction === "left" ? -carousel.clientWidth * 0.85 : carousel.clientWidth * 0.85,
      behavior: "smooth",
    });
  }

  return (
    <>
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gray-500">
            Recién llegados
          </p>
          <h2 className="mt-2 text-3xl font-bold md:text-4xl">Lentes nuevos</h2>
          <Link href="/eyeglasses" className="mt-3 inline-block text-sm font-semibold underline underline-offset-4">
            Ver todos
          </Link>
        </div>

        <div className="flex gap-2" aria-label="Controles del carrusel">
          <button
            type="button"
            onClick={() => moveCarousel("left")}
            className="grid h-12 w-12 place-items-center rounded-full border border-black/20 transition hover:border-black hover:bg-black hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
            aria-label="Ver lentes anteriores"
          >
            <ArrowIcon direction="left" />
          </button>
          <button
            type="button"
            onClick={() => moveCarousel("right")}
            className="grid h-12 w-12 place-items-center rounded-full border border-black/20 transition hover:border-black hover:bg-black hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
            aria-label="Ver más lentes"
          >
            <ArrowIcon direction="right" />
          </button>
        </div>
      </div>

      {loading && <p className="mt-10 text-gray-600">Cargando lentes nuevos...</p>}
      {error && <p className="mt-10 text-red-600">{error}</p>}

      {!loading && !error && (
        <div
          ref={carouselRef}
          className="product-carousel mt-10 grid snap-x snap-mandatory grid-flow-col auto-cols-[86%] gap-4 overflow-x-auto pb-5 sm:auto-cols-[48%] sm:gap-5 lg:auto-cols-[calc((100%-3.75rem)/4)]"
        >
          {products.map((product) => (
            <div key={product.slug} className="snap-start">
              <ProductCard
                slug={product.slug}
                name={product.name}
                price={product.price}
                category={product.category}
                color={product.color}
                href={"/product/" + product.slug}
                stock={product.stock}
                imageUrl={product.mainImage?.imageUrl}
                imageAltText={product.mainImage?.altText}
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
