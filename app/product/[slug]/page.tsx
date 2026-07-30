/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import LikeButton from "@/components/LikeButton";
import ProductPurchasePanel from "@/components/ProductPurchasePanel";
import QuickAddToCartButton from "@/components/QuickAddToCartButton";
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
  type: "eyeglasses" | "sunglasses" | "accessory" | "contact_lenses";
  gender: string;
  shape: string;
  frameColor: string;
  frameSize: string;
  frameMaterial: string;
  clipOnCompatible: boolean;
  stock: number;
  isActive: boolean;
  images: ProductImage[];
};

function formatProductValue(value: string) {
  if (!value) return "Por confirmar";
  const labels: Record<string, string> = {
    extra_small: "Extra chico",
    small: "Chico",
    medium: "Mediano",
    large: "Grande",
    extra_large: "Extra grande",
    acetate_stainless_steel: "Acetato + Acero Inoxidable",
    stainless_steel: "Acero Inoxidable",
    acetate: "Acetato",
    acetate_slash_stainless_steel: "Acetato/Acero Inoxidable",
    titanium: "Titanio",
    nylon: "Nylon",
    titanium_nylon: "Titanio + Nylon",
    reform: "ReForm",
  };

  return labels[value] || value.charAt(0).toUpperCase() + value.slice(1);
}

function getProductDescription(product: Product) {
  const description = product.description?.trim();
  const isPlaceholder =
    !description || /\btest\b|creado desde api|para prueba/i.test(description);

  if (!isPlaceholder) return description;

  if (product.type === "accessory") {
    return "Un accesorio práctico de Óptica OLM para acompañar y cuidar tus lentes todos los días.";
  }

  if (product.type === "contact_lenses") {
    return "Lentes de contacto para una visión cómoda y clara. Confirma tu graduación antes de finalizar la compra.";
  }

  const use =
    product.type === "sunglasses" ? "para días de sol" : "para uso diario";

  return `Un armazón cómodo y versátil, pensado ${use} y listo para personalizarse con la opción de lente que mejor se adapte a ti.`;
}

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

  const isSportsProduct = product.category.toLowerCase().includes("deportivos");
  const collectionHref =
    isSportsProduct
      ? "/deportivos"
      : product.type === "sunglasses"
      ? "/sunglasses"
      : product.type === "accessory"
        ? "/accessories"
        : product.type === "contact_lenses"
          ? "/lentes-de-contacto"
          : "/eyeglasses";
  const productDescription = getProductDescription(product);
  const productTypeLabel =
    product.type === "sunglasses"
      ? "Lentes de sol"
      : product.type === "accessory"
        ? "Accesorio"
        : product.type === "contact_lenses"
          ? "Lentes de contacto"
          : "Lentes ópticos";
  const isEyewear =
    product.type === "eyeglasses" || product.type === "sunglasses";

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
                {productDescription}
              </p>

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
            ) : isEyewear ? (
              <ProductPurchasePanel
                product={{
                  slug: product.slug,
                  name: product.name,
                  price: product.price,
                  stock: product.stock,
                }}
              />
            ) : (
              <div className="mt-8 rounded-3xl bg-[#f4f3f0] p-5 sm:p-6">
                <div className="flex items-end justify-between gap-4 border-b border-black/10 pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                      Total
                    </p>
                    <p className="mt-1 text-2xl font-semibold tracking-tight">
                      ${product.price.toLocaleString("es-MX")} MXN
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-6 text-gray-600">
                  {product.type === "contact_lenses"
                    ? "Agrega el producto y revisa tu carrito. Confirmaremos tu graduación antes de procesar el pedido."
                    : "Agrega el producto y revisa tu carrito antes de continuar al checkout."}
                </p>

                <QuickAddToCartButton
                  slug={product.slug}
                  label="Agregar al carrito y continuar"
                  className="mt-5 h-12 w-full"
                />
              </div>
            )}

            <section className="mt-8 rounded-[1.75rem] bg-[#f7f3ee] p-6 sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                Servicio Óptica OLM
              </p>
              <h2 className="mt-2 text-xl font-semibold">Incluido con tu compra</h2>
              <div className="mt-5 divide-y divide-black/10">
                {(product.type === "accessory"
                  ? [
                      "Pago seguro en pesos mexicanos",
                      "Entrega a domicilio o recolección",
                      "Atención en tiendas Óptica OLM",
                    ]
                  : product.type === "contact_lenses"
                    ? [
                        "Confirmación de graduación",
                        "Orientación para tu adaptación",
                        "Entrega a domicilio o recolección",
                      ]
                    : [
                        "Ajuste de armazón en tienda",
                        "Examen incluido al comprar en tienda",
                        "Acompañamiento para enviar tu receta",
                      ]
                ).map((benefit) => (
                  <div key={benefit} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-black/20 text-xs" aria-hidden="true">
                      ✓
                    </span>
                    <p className="text-sm font-medium">{benefit}</p>
                  </div>
                ))}
              </div>
            </section>

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

        <section className="mt-20 border-t border-black/15 pt-12 md:mt-28 md:pt-16">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">
                Conoce el modelo
              </p>
              <h2 className="mt-3 max-w-lg text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                Diseñado para acompañarte todos los días.
              </h2>
              <p className="mt-5 max-w-xl leading-7 text-gray-600">
                {productDescription}{" "}
                {isEyewear
                  ? "Puedes elegir el tipo de lente y su tratamiento antes de revisar la selección y agregarla al carrito."
                  : "Puedes agregarlo al carrito, revisar tu selección y después continuar al checkout."}
              </p>
            </div>

            <div className="grid gap-8 rounded-[2rem] bg-[#f7f3ee] p-6 sm:grid-cols-2 sm:p-8">
              <div>
                <h3 className="text-lg font-semibold">
                  {isEyewear ? "Detalles del armazón" : "Detalles del producto"}
                </h3>
                <dl className="mt-5 divide-y divide-black/10 text-sm">
                  <div className="flex justify-between gap-6 py-3 first:pt-0">
                    <dt className="text-gray-500">Tipo</dt>
                    <dd className="text-right font-medium">{productTypeLabel}</dd>
                  </div>
                  {isEyewear && (
                    <>
                      <div className="flex justify-between gap-6 py-3">
                        <dt className="text-gray-500">Forma</dt>
                        <dd className="text-right font-medium">
                          {formatProductValue(product.shape)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-6 py-3">
                        <dt className="text-gray-500">Color</dt>
                        <dd className="text-right font-medium">
                          {formatProductValue(product.frameColor)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-6 py-3">
                        <dt className="text-gray-500">Tamaño</dt>
                        <dd className="text-right font-medium">
                          {formatProductValue(product.frameSize)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-6 py-3">
                        <dt className="text-gray-500">Material</dt>
                        <dd className="text-right font-medium">
                          {formatProductValue(product.frameMaterial)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-6 py-3">
                        <dt className="text-gray-500">Clip-on</dt>
                        <dd className="text-right font-medium">
                          {product.clipOnCompatible
                            ? "Compatible"
                            : "No compatible"}
                        </dd>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between gap-6 py-3 last:pb-0">
                    <dt className="text-gray-500">Colección</dt>
                    <dd className="text-right font-medium">{formatProductValue(product.category)}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="text-lg font-semibold">Tu compra, a tu manera</h3>
                <ul className="mt-5 space-y-4 text-sm leading-6 text-gray-600">
                  {(isEyewear
                    ? [
                        "Elige entre graduación sencilla, mica transparente o lentes de sol.",
                        "Envía tu receta después o solicita apoyo por WhatsApp.",
                        "Recoge en tienda y recibe ayuda con el ajuste de tu armazón.",
                      ]
                    : product.type === "contact_lenses"
                      ? [
                          "Agrega las cajas que necesitas.",
                          "Confirma tu graduación con nuestro equipo.",
                          "Elige entrega a domicilio o recolección.",
                        ]
                      : [
                          "Agrega la cantidad que necesitas.",
                          "Elige entrega a domicilio o recolección.",
                          "Paga en línea o selecciona pago en tienda.",
                        ]
                  ).map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-black" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
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
