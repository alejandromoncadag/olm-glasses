/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import LikeButton from "@/components/LikeButton";
import ProductPurchasePanel from "@/components/ProductPurchasePanel";

type ProductImage = {
  id: string;
  imageUrl: string;
  altText: string;
  displayOrder: number;
  isMain: boolean;
};

type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  priceCents: number;
  currency: string;
  category: string;
  type: "eyeglasses" | "sunglasses";
  gender: string;
  shape: string;
  frameColor: string;
  stock: number;
  isActive: boolean;
  images: ProductImage[];
};

export default function ProductPage() {
  const params = useParams();

  const slugParam = params.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/products/${slug}`);

        if (!response.ok) {
          throw new Error("Product not found");
        }

        const data = await response.json();

        setProduct(data.product);
        setSelectedImageIndex(0);
        setIsImageModalOpen(false);
      } catch (error) {
        console.error(error);
        setError("No encontramos este producto.");
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  useEffect(() => {
    if (!isImageModalOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      const imageCount = product?.images?.length || 0;

      if (event.key === "Escape") {
        setIsImageModalOpen(false);
      }

      if (event.key === "ArrowLeft" && imageCount > 1) {
        setSelectedImageIndex((currentIndex) =>
          currentIndex === 0 ? imageCount - 1 : currentIndex - 1
        );
      }

      if (event.key === "ArrowRight" && imageCount > 1) {
        setSelectedImageIndex((currentIndex) =>
          currentIndex === imageCount - 1 ? 0 : currentIndex + 1
        );
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isImageModalOpen, product]);

  if (loading) {
    return (
      <main className="min-h-screen bg-white px-6 py-12 text-black">
        <section className="mx-auto max-w-6xl">
          <p className="text-gray-600">Cargando producto...</p>
        </section>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="min-h-screen bg-white px-6 py-12 text-black">
        <section className="mx-auto max-w-6xl text-center">
          <h1 className="text-4xl font-bold">Producto no encontrado</h1>

          <p className="mt-4 text-gray-600">
            Este producto no existe o ya no está disponible.
          </p>

          <a
            href="/eyeglasses"
            className="mt-6 inline-block rounded-full bg-black px-6 py-3 text-white"
          >
            Ver lentes
          </a>
        </section>
      </main>
    );
  }

  const images = product.images || [];
  const selectedImage = images[selectedImageIndex] || images[0];

  function goToPreviousImage() {
    if (images.length <= 1) {
      return;
    }

    setSelectedImageIndex((currentIndex) =>
      currentIndex === 0 ? images.length - 1 : currentIndex - 1
    );
  }

  function goToNextImage() {
    if (images.length <= 1) {
      return;
    }

    setSelectedImageIndex((currentIndex) =>
      currentIndex === images.length - 1 ? 0 : currentIndex + 1
    );
  }

  return (
    <main className="min-h-screen bg-white px-6 py-12 text-black">
      <section className="mx-auto grid max-w-6xl gap-12 md:grid-cols-2">
        <div>
          <div className="relative flex h-[450px] items-center justify-center overflow-hidden rounded-3xl bg-gray-100">
            {selectedImage ? (
              <button
                type="button"
                onClick={() => setIsImageModalOpen(true)}
                className="h-full w-full cursor-zoom-in"
                aria-label="Ver imagen en grande"
              >
                <img
                  src={selectedImage.imageUrl}
                  alt={selectedImage.altText || product.name}
                  className="h-full w-full object-contain"
                />
              </button>
            ) : (
              <span className="text-gray-500">
                Imagen principal del producto
              </span>
            )}

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goToPreviousImage}
                  className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl shadow transition hover:bg-white"
                  aria-label="Imagen anterior"
                >
                  ‹
                </button>

                <button
                  type="button"
                  onClick={goToNextImage}
                  className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl shadow transition hover:bg-white"
                  aria-label="Siguiente imagen"
                >
                  ›
                </button>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-4 py-1 text-sm shadow">
                  {selectedImageIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-4">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setSelectedImageIndex(index)}
                  className={`flex h-24 items-center justify-center overflow-hidden rounded-2xl border bg-gray-100 transition ${selectedImageIndex === index
                      ? "border-black ring-2 ring-black"
                      : "border-transparent hover:border-gray-400"
                    }`}
                >
                  <img
                    src={image.imageUrl}
                    alt={image.altText || product.name}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-gray-500">
            {product.category}
          </p>

          <h1 className="mt-3 text-5xl font-bold">{product.name}</h1>

          <p className="mt-4 text-2xl">
            Desde ${product.price.toLocaleString("es-MX")} MXN
          </p>

          <p className="mt-6 max-w-md text-gray-600">
            {product.description}
          </p>

          <div className="mt-6 flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-gray-100 px-3 py-1">
              {product.gender}
            </span>

            <span className="rounded-full bg-gray-100 px-3 py-1">
              {product.shape}
            </span>

            <span className="rounded-full bg-gray-100 px-3 py-1">
              {product.frameColor}
            </span>

            <span className="rounded-full bg-gray-100 px-3 py-1">
              Stock: {product.stock}
            </span>
          </div>

          <div className="mt-6">
            <LikeButton slug={product.slug} variant="full" />
          </div>

          {!product.isActive || product.stock === 0 ? (
            <div className="mt-8 rounded-2xl border p-6">
              <h2 className="text-xl font-semibold">Producto no disponible</h2>

              <p className="mt-2 text-gray-600">
                Este producto está agotado o inactivo.
              </p>
            </div>
          ) : (
            <ProductPurchasePanel
              product={{
                slug: product.slug,
                name: product.name,
                price: product.price,
                stock: product.stock,
              }}
            />
          )}

          <p className="mt-4 text-center text-sm text-gray-500">
            Pago seguro en pesos mexicanos.
          </p>
        </div>
      </section>

      {isImageModalOpen && selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-6">
          <button
            type="button"
            onClick={() => setIsImageModalOpen(false)}
            className="absolute right-6 top-6 rounded-full bg-white px-5 py-2 text-sm font-semibold text-black"
          >
            Cerrar
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={goToPreviousImage}
                className="absolute left-6 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-3xl text-black"
                aria-label="Imagen anterior"
              >
                ‹
              </button>

              <button
                type="button"
                onClick={goToNextImage}
                className="absolute right-6 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-3xl text-black"
                aria-label="Siguiente imagen"
              >
                ›
              </button>
            </>
          )}

          <img
            src={selectedImage.imageUrl}
            alt={selectedImage.altText || product.name}
            className="max-h-[85vh] max-w-[90vw] object-contain"
          />

          {images.length > 1 && (
            <div className="absolute bottom-6 rounded-full bg-white px-4 py-2 text-sm text-black">
              {selectedImageIndex + 1} / {images.length}
            </div>
          )}
        </div>
      )}
    </main>
  );
}

