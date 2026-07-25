"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useLikes } from "@/hooks/useLikes";
import { readCart, writeCart } from "@/lib/cart";

type ApiProduct = {
  slug: string;
  name: string;
  price: number;
  category: string;
  type: "eyeglasses" | "sunglasses" | "accessory" | "contact_lenses";
  frameColor: string;
  stock: number;
  isActive: boolean;
  mainImage: {
    imageUrl: string;
    altText: string | null;
  } | null;
};

type LikedProduct = {
  product: ApiProduct;
  likedAt: string;
};

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function getCardColor(frameColor: string) {
  const color = frameColor.toLowerCase();

  if (color.includes("transparente")) return "#f3f4f6";
  if (color.includes("cafe") || color.includes("café")) return "#8b5e3c";
  if (color.includes("dorado")) return "#d6b35a";
  if (color.includes("negro")) return "#111827";

  return "#f3f4f6";
}

export default function LikesGrid() {
  const { likes, loaded, clearLikes, removeLike } = useLikes();
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoadingProducts(true);
        setError("");

        const response = await fetch("/api/products");

        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const data = await response.json();
        setProducts(data.products);
      } catch (error) {
        console.error(error);
        setError("No pudimos cargar tus favoritos desde PostgreSQL.");
      } finally {
        setLoadingProducts(false);
      }
    }

    fetchProducts();
  }, []);

  if (!loaded || loadingProducts) {
    return <p className="mt-8 text-gray-600">Cargando favoritos…</p>;
  }

  if (error) {
    return <p className="mt-8 text-red-600">{error}</p>;
  }

  const likedProducts: LikedProduct[] = likes
    .map((like) => {
      const product = products.find((item) => item.slug === like.slug);

      if (!product || !product.isActive) {
        return null;
      }

      return {
        product,
        likedAt: like.likedAt,
      };
    })
    .filter((item): item is LikedProduct => item !== null);

  if (likedProducts.length === 0) {
    return (
      <div className="mt-12 rounded-3xl border bg-white p-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f7f3ee]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </div>

        <h2 className="mt-6 text-2xl font-semibold">
          Aún no tienes favoritos
        </h2>

        <p className="mt-3 text-gray-600">
          Toca el corazón en cualquier modelo para guardarlo aquí.
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <a
            href="/eyeglasses"
            className="rounded-full bg-black px-6 py-3 text-white"
          >
            Ver lentes ópticos
          </a>

          <a
            href="/sunglasses"
            className="rounded-full border border-black px-6 py-3"
          >
            Ver lentes de sol
          </a>
        </div>
      </div>
    );
  }

  function addAllToCart() {
    const cart = readCart();
    let added = 0;

    likedProducts.forEach(({ product }) => {
      if (product.stock <= 0 || !product.isActive) return;

      const isEyewear =
        product.type === "eyeglasses" || product.type === "sunglasses";
      const slug = isEyewear
        ? `${product.slug}-single-vision-upload-later`
        : product.slug;

      const exists = cart.find((item: { slug: string }) => item.slug === slug);

      if (exists) {
        exists.quantity += 1;
      } else {
        cart.push({
          slug,
          name: product.name,
          price: product.price,
          quantity: 1,
          lensOption:
            product.type === "contact_lenses"
              ? "Lentes de contacto"
              : product.type === "accessory"
                ? "Accesorio"
                : "Graduación sencilla",
          prescriptionMethod:
            product.type === "contact_lenses"
              ? "Graduación por confirmar"
              : product.type === "accessory"
                ? "No aplica"
                : "Subir receta después",
        });
      }

      added += 1;
    });

    writeCart(cart);

    if (added === 0) {
      alert("No hay productos disponibles para agregar.");
      return;
    }

    window.location.href = "/checkout";
  }

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-gray-600">
          {likedProducts.length}{" "}
          {likedProducts.length === 1 ? "modelo guardado" : "modelos guardados"}
        </p>

        <div className="flex gap-3">
          <button
            onClick={addAllToCart}
            className="rounded-full bg-black px-5 py-2 text-sm text-white"
          >
            Agregar todo al carrito
          </button>

          <button
            onClick={() => {
              if (confirm("¿Quitar todos los favoritos?")) void clearLikes();
            }}
            className="rounded-full border border-black px-5 py-2 text-sm"
          >
            Vaciar lista
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {likedProducts.map(({ product, likedAt }) => {
          const isOutOfStock = product.stock <= 0;

          return (
            <div
              key={product.slug}
              className="overflow-hidden rounded-2xl border bg-white"
            >
              <a href={`/product/${product.slug}`} className="block">
                <div
                  className="relative flex h-52 items-center justify-center overflow-hidden"
                  style={{ backgroundColor: getCardColor(product.frameColor) }}
                >
                  {product.mainImage ? (
                    <Image
                      src={product.mainImage.imageUrl}
                      alt={product.mainImage.altText || product.name}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-sm text-gray-500">
                      Imagen del producto
                    </span>
                  )}

                  {isOutOfStock && (
                    <span className="absolute left-3 top-3 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                      Agotado
                    </span>
                  )}
                </div>
              </a>

              <div className="p-5">
                <p className="text-xs uppercase tracking-widest text-gray-500">
                  {product.category}
                </p>

                <h3 className="mt-1 text-lg font-semibold">{product.name}</h3>

                <p className="mt-1 text-gray-700">
                  ${product.price.toLocaleString("es-MX")} MXN
                </p>

                <p className="mt-2 text-xs text-gray-500">
                  Guardado el {formatDate(likedAt)}
                </p>

                <div className="mt-4 flex gap-2">
                  <a
                    href={`/product/${product.slug}`}
                    className="flex-1 rounded-full bg-black px-4 py-2 text-center text-sm text-white"
                  >
                    Ver detalle
                  </a>

                  <button
                    onClick={() => void removeLike(product.slug)}
                    className="rounded-full border px-4 py-2 text-sm hover:border-black"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

