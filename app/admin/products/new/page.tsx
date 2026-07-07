/* eslint-disable @next/next/no-img-element */
"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNav from "@/components/AdminNav";
import ProductImageUploader from "@/components/ProductImageUploader";

type ProductType = "eyeglasses" | "sunglasses";
type ProductGender = "hombre" | "mujer" | "unisex";
type ProductShape = "redondo" | "cuadrado" | "rectangular" | "aviador";

function createSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatMoney(amount: number) {
  return `$${amount.toLocaleString("es-MX")} MXN`;
}

function getProductTypeLabel(type: ProductType) {
  if (type === "eyeglasses") return "Lentes ópticos";
  if (type === "sunglasses") return "Lentes de sol";

  return "Producto";
}

export default function NewProductPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Lentes ópticos");
  const [type, setType] = useState<ProductType>("eyeglasses");
  const [gender, setGender] = useState<ProductGender>("unisex");
  const [shape, setShape] = useState<ProductShape>("rectangular");
  const [frameColor, setFrameColor] = useState("");
  const [stock, setStock] = useState("0");
  const [imageUrl, setImageUrl] = useState("");
  const [imageAltText, setImageAltText] = useState("");
  const [imagePreviewError, setImagePreviewError] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const numericPrice = Number(price || 0);
  const numericStock = Number(stock || 0);

  const inventoryValue = useMemo(() => {
    if (!Number.isFinite(numericPrice) || !Number.isFinite(numericStock)) {
      return 0;
    }

    return numericPrice * numericStock;
  }, [numericPrice, numericStock]);

  function handleNameChange(value: string) {
    setName(value);
    setErrorMessage("");

    if (!slug) {
      setSlug(createSlug(value));
    }

    if (!imageAltText) {
      setImageAltText(value);
    }
  }

  function handleTypeChange(value: ProductType) {
    setType(value);

    if (value === "eyeglasses" && category === "Lentes de sol") {
      setCategory("Lentes ópticos");
    }

    if (value === "sunglasses" && category === "Lentes ópticos") {
      setCategory("Lentes de sol");
    }
  }

  function handleImageUrlChange(value: string) {
    setImageUrl(value);
    setImagePreviewError(false);
  }

  function validateForm() {
    if (!name.trim()) return "Escribe el nombre del producto.";
    if (!slug.trim()) return "Escribe el slug del producto.";
    if (!description.trim()) return "Escribe la descripción del producto.";
    if (!category.trim()) return "Escribe la categoría del producto.";
    if (!frameColor.trim()) return "Escribe el color del armazón.";

    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      return "El precio debe ser un número mayor o igual a 0.";
    }

    if (
      !Number.isInteger(numericStock) ||
      !Number.isFinite(numericStock) ||
      numericStock < 0
    ) {
      return "El stock debe ser un número entero mayor o igual a 0.";
    }

    return "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage("");

      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug: createSlug(slug),
          name: name.trim(),
          description: description.trim(),
          price: numericPrice,
          category: category.trim(),
          type,
          gender,
          shape,
          frameColor: frameColor.trim(),
          stock: numericStock,
          isActive,
          imageUrl: imageUrl.trim() || undefined,
          imageAltText: imageAltText.trim() || name.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || "No pudimos crear el producto.");
        return;
      }

      const createdSlug = data.product?.slug || createSlug(slug);

      router.push(`/admin/products/${createdSlug}/edit`);
      router.refresh();
    } catch (error) {
      console.error(error);
      setErrorMessage("No pudimos crear el producto.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-white px-6 py-12 text-black">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <a href="/admin/products" className="text-sm text-gray-500 underline">
              ← Regresar a productos
            </a>

            <h1 className="mt-4 text-4xl font-bold">Agregar producto</h1>

            <p className="mt-4 max-w-2xl text-gray-600">
              Crea un producto nuevo, sube su imagen principal y revisa la vista
              previa antes de guardarlo.
            </p>
          </div>

          <a
            href="/admin/products"
            className="rounded-full border px-6 py-3 text-center"
          >
            Cancelar
          </a>
        </div>

        <AdminNav />

        {errorMessage && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-700">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            <div className="space-y-8">
              <section className="rounded-2xl border p-6">
                <h2 className="text-2xl font-semibold">
                  Información principal
                </h2>

                <p className="mt-2 text-sm text-gray-600">
                  Estos datos aparecerán en el catálogo y en la página del
                  producto.
                </p>

                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium">Nombre</span>
                    <input
                      value={name}
                      onChange={(event) => handleNameChange(event.target.value)}
                      required
                      className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                      placeholder="Modelo Ejecutivo"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium">Slug</span>
                    <div className="mt-2 flex gap-2">
                      <input
                        value={slug}
                        onChange={(event) =>
                          setSlug(createSlug(event.target.value))
                        }
                        required
                        className="w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                        placeholder="modelo-ejecutivo"
                      />

                      <button
                        type="button"
                        onClick={() => setSlug(createSlug(name))}
                        className="rounded-xl border px-4 py-3 text-sm"
                      >
                        Generar
                      </button>
                    </div>
                  </label>
                </div>

                <label className="mt-5 block">
                  <span className="text-sm font-medium">Descripción</span>
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    required
                    rows={6}
                    className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                    placeholder="Armazón ligero, cómodo y elegante para uso diario."
                  />
                </label>
              </section>

              <section className="rounded-2xl border p-6">
                <h2 className="text-2xl font-semibold">Precio e inventario</h2>

                <div className="mt-6 grid gap-5 md:grid-cols-3">
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
                      placeholder="1499"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium">Stock inicial</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={stock}
                      onChange={(event) => setStock(event.target.value)}
                      required
                      className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                      placeholder="10"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium">Categoría</span>
                    <input
                      value={category}
                      onChange={(event) => setCategory(event.target.value)}
                      required
                      className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                      placeholder="Lentes ópticos"
                    />
                  </label>
                </div>

                <div className="mt-5 rounded-2xl bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">
                    Valor estimado de inventario
                  </p>

                  <p className="mt-1 text-2xl font-bold">
                    {formatMoney(inventoryValue)}
                  </p>
                </div>
              </section>

              <section className="rounded-2xl border p-6">
                <h2 className="text-2xl font-semibold">Características</h2>

                <div className="mt-6 grid gap-5 md:grid-cols-4">
                  <label className="block">
                    <span className="text-sm font-medium">Tipo</span>
                    <select
                      value={type}
                      onChange={(event) =>
                        handleTypeChange(event.target.value as ProductType)
                      }
                      className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                    >
                      <option value="eyeglasses">Lentes ópticos</option>
                      <option value="sunglasses">Lentes de sol</option>
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
                      placeholder="negro"
                    />
                  </label>
                </div>
              </section>

              <ProductImageUploader
                imageUrl={imageUrl}
                imageAltText={imageAltText}
                fallbackAltText={name}
                onImageUrlChange={handleImageUrlChange}
                onImageAltTextChange={setImageAltText}
              />

              <section className="rounded-2xl border p-6">
                <h2 className="text-2xl font-semibold">Publicación</h2>

                <label className="mt-5 flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(event) => setIsActive(event.target.checked)}
                  />

                  <span className="text-sm font-medium">Producto activo</span>
                </label>

                <p className="mt-2 text-sm text-gray-600">
                  Si está activo, aparecerá en la tienda pública. Si está
                  inactivo, solo aparecerá en admin.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="rounded-full bg-black px-8 py-3 text-white disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    {isSaving ? "Guardando..." : "Crear producto"}
                  </button>

                  <a
                    href="/admin/products"
                    className="rounded-full border px-8 py-3 text-center"
                  >
                    Cancelar
                  </a>
                </div>
              </section>
            </div>

            <aside className="h-fit rounded-2xl border p-6">
              <h2 className="text-2xl font-semibold">Vista previa</h2>

              <div className="mt-5 overflow-hidden rounded-2xl border bg-gray-50">
                <div className="flex h-72 items-center justify-center bg-white">
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
                        : "Sube una imagen o agrega una URL para ver la vista previa."}
                    </div>
                  )}
                </div>

                <div className="border-t bg-white p-5">
                  <p className="text-sm text-gray-500">
                    {getProductTypeLabel(type)}
                  </p>

                  <h3 className="mt-2 text-2xl font-bold">
                    {name || "Nombre del producto"}
                  </h3>

                  <p className="mt-2 text-lg">
                    {formatMoney(Number(price || 0))}
                  </p>

                  <p className="mt-3 text-sm text-gray-600">
                    {description ||
                      "La descripción del producto aparecerá aquí."}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-gray-100 px-3 py-1">
                      {category || "Categoría"}
                    </span>

                    <span className="rounded-full bg-gray-100 px-3 py-1">
                      {gender}
                    </span>

                    <span className="rounded-full bg-gray-100 px-3 py-1">
                      {shape}
                    </span>

                    <span className="rounded-full bg-gray-100 px-3 py-1">
                      {frameColor || "color"}
                    </span>
                  </div>

                  <div className="mt-5 rounded-2xl bg-gray-50 p-4 text-sm">
                    <p>
                      <span className="font-medium">Slug:</span>{" "}
                      {slug || "producto-slug"}
                    </p>

                    <p className="mt-1">
                      <span className="font-medium">Stock:</span>{" "}
                      {stock || "0"}
                    </p>

                    <p className="mt-1">
                      <span className="font-medium">Estado:</span>{" "}
                      {isActive ? "Activo" : "Inactivo"}
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </form>
      </section>
    </main>
  );
}




