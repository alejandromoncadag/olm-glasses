/* eslint-disable @next/next/no-img-element */
"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminNav from "@/components/AdminNav";
import ProductImageUploader from "@/components/ProductImageUploader";

type ProductType = "eyeglasses" | "sunglasses";
type ProductGender = "hombre" | "mujer" | "unisex";
type ProductShape = "redondo" | "cuadrado" | "rectangular" | "aviador";

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
  category: string;
  type: ProductType;
  gender: ProductGender;
  shape: ProductShape;
  frameColor: string;
  stock: number;
  isActive: boolean;
  images: ProductImage[];
};

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();

  const slugParam = params.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState<ProductType>("eyeglasses");
  const [gender, setGender] = useState<ProductGender>("unisex");
  const [shape, setShape] = useState<ProductShape>("rectangular");
  const [frameColor, setFrameColor] = useState("");
  const [stock, setStock] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageAltText, setImageAltText] = useState("");
  const [imagePreviewError, setImagePreviewError] = useState(false);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/products/${slug}`);

        if (!response.ok) {
          throw new Error("Failed to fetch product");
        }

        const data = await response.json();
        const product: Product = data.product;

        const mainImage =
          product.images.find((image) => image.isMain) || product.images[0];

        setName(product.name);
        setDescription(product.description);
        setPrice(String(product.price));
        setCategory(product.category);
        setType(product.type);
        setGender(product.gender);
        setShape(product.shape);
        setFrameColor(product.frameColor);
        setStock(String(product.stock));
        setIsActive(product.isActive);
        setImageUrl(mainImage?.imageUrl || "");
        setImageAltText(mainImage?.altText || product.name);
        setImagePreviewError(false);
      } catch (error) {
        console.error(error);
        setError("No pudimos cargar el producto desde PostgreSQL.");
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  function handleImageUrlChange(value: string) {
    setImageUrl(value);
    setImagePreviewError(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSaving(true);

      const response = await fetch(`/api/products/${slug}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          price: Number(price),
          category,
          type,
          gender,
          shape,
          frameColor,
          stock: Number(stock),
          isActive,
          imageUrl: imageUrl.trim() || undefined,
          imageAltText: imageAltText.trim() || name,
          reason: "Admin product edit",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "No pudimos actualizar el producto.");
        return;
      }

      alert("Producto actualizado correctamente.");
      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("No pudimos actualizar el producto.");
    } finally {
      setIsSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white px-6 py-12 text-black">
        <section className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold">Editar producto</h1>
          <p className="mt-4 text-gray-600">
            Cargando producto desde PostgreSQL...
          </p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-white px-6 py-12 text-black">
        <section className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold">Editar producto</h1>
          <p className="mt-4 text-red-600">{error}</p>

          <a
            href="/admin/products"
            className="mt-6 inline-block rounded-full bg-black px-6 py-3 text-white"
          >
            Regresar a productos
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-6 py-12 text-black">
      <section className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold">Editar producto</h1>

        <p className="mt-4 text-gray-600">
          Actualiza la información del producto en PostgreSQL.
        </p>

        <AdminNav />

        <div className="mt-8 rounded-2xl bg-gray-50 p-5">
          <p className="text-sm text-gray-500">Slug del producto</p>
          <p className="mt-1 font-semibold">{slug}</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-10 space-y-8">
          <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <label className="block">
                <span className="text-sm font-medium">Nombre</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium">Descripción</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  required
                  rows={7}
                  className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                />
              </label>
            </div>

            <div className="rounded-2xl border bg-gray-50 p-5">
              <p className="text-sm font-medium">Vista previa</p>

              <div className="mt-4 flex h-72 items-center justify-center overflow-hidden rounded-2xl bg-white">
                {imageUrl && !imagePreviewError ? (
                  <img
                    src={imageUrl}
                    alt={imageAltText || name || "Vista previa del producto"}
                    onError={() => setImagePreviewError(true)}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="px-6 text-center text-sm text-gray-500">
                    {imageUrl
                      ? "No pudimos cargar esta imagen. Revisa la URL."
                      : "Agrega una URL de imagen para ver la vista previa."}
                  </div>
                )}
              </div>

              <p className="mt-3 text-xs text-gray-500">
                Ejemplo: <span className="font-mono">/products/tu-imagen.jpg</span>
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <label className="block">
              <span className="text-sm font-medium">Precio MXN</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                required
                className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium">Stock</span>
              <input
                type="number"
                min="0"
                step="1"
                value={stock}
                onChange={(event) => setStock(event.target.value)}
                required
                className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium">Categoría</span>
              <input
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                required
                className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
              />
            </label>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            <label className="block">
              <span className="text-sm font-medium">Tipo</span>
              <select
                value={type}
                onChange={(event) => setType(event.target.value as ProductType)}
                className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
              >
                <option value="eyeglasses">Eyeglasses</option>
                <option value="sunglasses">Sunglasses</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium">Género</span>
              <select
                value={gender}
                onChange={(event) =>
                  setGender(event.target.value as ProductGender)
                }
                className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
              >
                <option value="unisex">Unisex</option>
                <option value="hombre">Hombre</option>
                <option value="mujer">Mujer</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium">Forma</span>
              <select
                value={shape}
                onChange={(event) =>
                  setShape(event.target.value as ProductShape)
                }
                className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
              >
                <option value="rectangular">Rectangular</option>
                <option value="cuadrado">Cuadrado</option>
                <option value="redondo">Redondo</option>
                <option value="aviador">Aviador</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium">Color</span>
              <input
                value={frameColor}
                onChange={(event) => setFrameColor(event.target.value)}
                required
                className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
              />
            </label>
          </div>


          <ProductImageUploader
            imageUrl={imageUrl}
            imageAltText={imageAltText}
            fallbackAltText={name}
            onImageUrlChange={handleImageUrlChange}
            onImageAltTextChange={setImageAltText}
          />


          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
            />
            <span className="text-sm font-medium">Producto activo</span>
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-full bg-black px-8 py-3 text-white disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {isSaving ? "Guardando..." : "Guardar cambios"}
            </button>

            <a
              href="/admin/products"
              className="rounded-full border px-8 py-3 text-center"
            >
              Cancelar
            </a>
          </div>
        </form>
      </section>
    </main>
  );
}

