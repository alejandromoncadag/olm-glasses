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

  const mainImage =
    product.images.find((image) => image.isMain) || product.images[0];

  return (
    <main className="min-h-screen bg-white px-6 py-12 text-black">
      <section className="mx-auto grid max-w-6xl gap-12 md:grid-cols-2">
        <div>
          <div className="flex h-[450px] items-center justify-center overflow-hidden rounded-3xl bg-gray-100">
            {mainImage ? (
              <img
                src={mainImage.imageUrl}
                alt={mainImage.altText || product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-gray-500">
                Imagen principal del producto
              </span>
            )}
          </div>

          {product.images.length > 1 && (
            <div className="mt-4 grid grid-cols-3 gap-4">
              {product.images.map((image) => (
                <div
                  key={image.id}
                  className="flex h-28 items-center justify-center overflow-hidden rounded-2xl bg-gray-100"
                >
                  <img
                    src={image.imageUrl}
                    alt={image.altText || product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
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
    </main>
  );
}

