/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import LikeButton from "@/components/LikeButton";
import ProductPurchasePanel from "@/components/ProductPurchasePanel";
import { createWhatsAppLink } from "@/lib/whatsapp";

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

  const collectionHref =
    product.type === "sunglasses" ? "/sunglasses" : "/eyeglasses";

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 md:py-12">
        <a
          href={collectionHref}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-black"
        >
          <span aria-hidden="true">←</span>
          Volver a la colección
        </a>

        <section className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(380px,0.92fr)] lg:gap-16">
          <div className="min-w-0 lg:sticky lg:top-28 lg:self-start">
            <div className="relative flex aspect-[4/3] min-h-[320px] items-center justify-center overflow-hidden rounded-[2rem] bg-[#f4f3f0] sm:aspect-square lg:aspect-[4/3]">
              {selectedImage ? (
                <button
                  type="button"
                  onClick={() => setIsImageModalOpen(true)}
                  className="h-full w-full cursor-zoom-in p-6 sm:p-10"
                  aria-label="Ver imagen en grande"
                >
                  <img
                    src={selectedImage.imageUrl}
                    alt={selectedImage.altText || product.name}
                    className="h-full w-full object-contain transition duration-500 hover:scale-[1.02]"
                  />
                </button>
              ) : (
                <span className="text-sm text-gray-500">
                  Imagen principal del producto
                </span>
              )}

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={goToPreviousImage}
                    className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-2xl shadow-sm ring-1 ring-black/5 transition hover:bg-white sm:left-5"
                    aria-label="Imagen anterior"
                  >
                    ‹
                  </button>

                  <button
                    type="button"
                    onClick={goToNextImage}
                    className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-2xl shadow-sm ring-1 ring-black/5 transition hover:bg-white sm:right-5"
                    aria-label="Siguiente imagen"
                  >
                    ›
                  </button>

                  <div className="absolute bottom-4 right-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm ring-1 ring-black/5">
                    {selectedImageIndex + 1} / {images.length}
                  </div>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-[#f4f3f0] p-2 transition sm:h-24 sm:w-24 ${
                      selectedImageIndex === index
                        ? "border-black ring-1 ring-black"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                    aria-label={`Ver imagen ${index + 1}`}
                  >
                    <img
                      src={image.imageUrl}
                      alt={image.altText || product.name}
                      className="h-full w-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}

            {selectedImage && (
              <p className="mt-3 text-xs text-gray-500">
                Selecciona la imagen para verla en detalle.
              </p>
            )}
          </div>

          <div className="lg:pt-2">
            <div className="border-b border-gray-200 pb-7">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">
                {product.category || product.type || "Armazón"}
              </p>

              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
                {product.name}
              </h1>

              <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <p className="text-2xl font-semibold tracking-tight">
                  ${product.price.toLocaleString("es-MX")}
                </p>
                <span className="text-sm text-gray-500">MXN · precio base</span>
              </div>

              <p className="mt-5 max-w-xl leading-7 text-gray-600">
                {product.description || "Armazón disponible en Óptica OLM."}
              </p>

              <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-gray-700">
                {product.gender && (
                  <span className="rounded-full bg-[#f4f3f0] px-3 py-2">
                    {product.gender}
                  </span>
                )}
                {product.shape && (
                  <span className="rounded-full bg-[#f4f3f0] px-3 py-2">
                    {product.shape}
                  </span>
                )}
                {product.frameColor && (
                  <span className="rounded-full bg-[#f4f3f0] px-3 py-2">
                    {product.frameColor}
                  </span>
                )}
                <span className="rounded-full bg-[#f4f3f0] px-3 py-2">
                  {product.stock} disponibles
                </span>
              </div>

              <div className="mt-5">
                <LikeButton slug={product.slug} variant="full" />
              </div>
            </div>

            {!product.isActive || product.stock === 0 ? (
              <div className="mt-8 rounded-3xl border border-gray-200 bg-[#faf9f7] p-6">
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

            <div className="mt-6 divide-y divide-gray-200 rounded-3xl border border-gray-200 px-5">
              <div className="flex items-center gap-4 py-4">
                <span className="h-2 w-2 shrink-0 rounded-full bg-black" />
                <p className="text-sm font-medium">Recoger en tienda disponible</p>
              </div>
              <div className="flex items-center gap-4 py-4">
                <span className="h-2 w-2 shrink-0 rounded-full bg-black" />
                <p className="text-sm font-medium">Envío a domicilio por confirmar</p>
              </div>
              <div className="flex items-center gap-4 py-4">
                <span className="h-2 w-2 shrink-0 rounded-full bg-black" />
                <p className="text-sm font-medium">Examen de la vista disponible</p>
              </div>
            </div>

            <a
              href={createWhatsAppLink(
                `Hola, quiero más información sobre el armazón ${product.name}.`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 block rounded-2xl border border-[#25D366] px-6 py-3.5 text-center font-semibold text-[#128C4B] transition hover:bg-[#eafff1]"
            >
              Preguntar por WhatsApp
            </a>

            <p className="mt-4 text-center text-xs leading-5 text-gray-500">
              Pago seguro en pesos mexicanos.
            </p>
          </div>
        </section>
      </div>

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
