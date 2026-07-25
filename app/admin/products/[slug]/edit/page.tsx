/* eslint-disable @next/next/no-img-element */
"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminNav from "@/components/AdminNav";
import ProductImageGalleryManager from "@/components/ProductImageGalleryManager";

type ProductType =
  | "eyeglasses"
  | "sunglasses"
  | "accessory"
  | "contact_lenses";
type ProductGender = "hombre" | "mujer" | "unisex";
type ProductShape = "redondo" | "cuadrado" | "rectangular" | "aviador";
type ProductFrameSize =
  | "extra_small"
  | "small"
  | "medium"
  | "large"
  | "extra_large";
type ProductFrameMaterial =
  | "acetate_stainless_steel"
  | "stainless_steel"
  | "acetate"
  | "acetate_slash_stainless_steel"
  | "titanium"
  | "nylon"
  | "titanium_nylon"
  | "reform";

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
  frameSize: ProductFrameSize;
  frameMaterial: ProductFrameMaterial;
  clipOnCompatible: boolean;
  stock: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  images: ProductImage[];
};

function formatMoney(amount: number) {
  return `$${amount.toLocaleString("es-MX")} MXN`;
}

function formatDate(date?: string) {
  if (!date) return "Sin fecha";

  return new Date(date).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getProductTypeLabel(type: ProductType) {
  if (type === "eyeglasses") return "Lentes ópticos";
  if (type === "sunglasses") return "Lentes de sol";
  if (type === "accessory") return "Accesorio";
  if (type === "contact_lenses") return "Lentes de contacto";

  return "Producto";
}

function getFrameMaterialLabel(material: ProductFrameMaterial) {
  const labels: Record<ProductFrameMaterial, string> = {
    acetate_stainless_steel: "Acetato + Acero Inoxidable",
    stainless_steel: "Acero Inoxidable",
    acetate: "Acetato",
    acetate_slash_stainless_steel: "Acetato/Acero Inoxidable",
    titanium: "Titanio",
    nylon: "Nylon",
    titanium_nylon: "Titanio + Nylon",
    reform: "ReForm",
  };

  return labels[material];
}

function getStockLabel(stock: number, isActive: boolean) {
  if (!isActive) return "Inactivo";
  if (stock === 0) return "Agotado";
  if (stock <= 3) return "Stock bajo";

  return "Disponible";
}

function getStockClassName(stock: number, isActive: boolean) {
  if (!isActive) return "bg-gray-100 text-gray-700";
  if (stock === 0) return "bg-red-100 text-red-700";
  if (stock <= 3) return "bg-yellow-100 text-yellow-800";

  return "bg-green-100 text-green-700";
}

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();

  const slugParam = params.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;

  const [product, setProduct] = useState<Product | null>(null);

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [formMessage, setFormMessage] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState<ProductType>("eyeglasses");
  const [gender, setGender] = useState<ProductGender>("unisex");
  const [shape, setShape] = useState<ProductShape>("rectangular");
  const [frameColor, setFrameColor] = useState("");
  const [frameSize, setFrameSize] = useState<ProductFrameSize>("medium");
  const [frameMaterial, setFrameMaterial] =
    useState<ProductFrameMaterial>("acetate");
  const [clipOnCompatible, setClipOnCompatible] = useState(false);
  const [stock, setStock] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [images, setImages] = useState<ProductImage[]>([]);

  const numericPrice = Number(price || 0);
  const numericStock = Number(stock || 0);

  const inventoryValue = useMemo(() => {
    if (!Number.isFinite(numericPrice) || !Number.isFinite(numericStock)) {
      return 0;
    }

    return numericPrice * numericStock;
  }, [numericPrice, numericStock]);

  const mainImage = images.find((image) => image.isMain) || images[0];

  async function fetchProduct() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/products/${slug}`);

      if (!response.ok) {
        throw new Error("Failed to fetch product");
      }

      const data = await response.json();
      const fetchedProduct: Product = data.product;

      setProduct(fetchedProduct);
      setName(fetchedProduct.name);
      setDescription(fetchedProduct.description);
      setPrice(String(fetchedProduct.price));
      setCategory(fetchedProduct.category);
      setType(fetchedProduct.type);
      setGender(fetchedProduct.gender);
      setShape(fetchedProduct.shape);
      setFrameColor(fetchedProduct.frameColor);
      setFrameSize(fetchedProduct.frameSize);
      setFrameMaterial(fetchedProduct.frameMaterial);
      setClipOnCompatible(fetchedProduct.clipOnCompatible);
      setStock(String(fetchedProduct.stock));
      setIsActive(fetchedProduct.isActive);
      setImages(fetchedProduct.images || []);
    } catch (error) {
      console.error(error);
      setError("No pudimos cargar el producto desde PostgreSQL.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  function validateForm() {
    if (!name.trim()) return "Escribe el nombre del producto.";
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
      setFormMessage(validationError);
      return;
    }

    try {
      setIsSaving(true);
      setFormMessage("");

      const response = await fetch(`/api/products/${slug}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          price: numericPrice,
          category: category.trim(),
          type,
          gender,
          shape,
          frameColor: frameColor.trim(),
          frameSize,
          frameMaterial,
          clipOnCompatible,
          stock: numericStock,
          isActive,
          reason: "Admin product edit",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setFormMessage(data.error || "No pudimos actualizar el producto.");
        return;
      }

      setProduct(data.product);
      setImages(data.product?.images || images);
      setFormMessage("Producto actualizado correctamente.");
      router.refresh();
    } catch (error) {
      console.error(error);
      setFormMessage("No pudimos actualizar el producto.");
    } finally {
      setIsSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white px-6 py-12 text-black">
        <section className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-bold">Editar producto</h1>

          <p className="mt-4 text-gray-600">
            Cargando producto desde PostgreSQL...
          </p>
        </section>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="min-h-screen bg-white px-6 py-12 text-black">
        <section className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-bold">Editar producto</h1>

          <p className="mt-4 text-red-600">
            {error || "No encontramos este producto."}
          </p>

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
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <a href="/admin/products" className="text-sm text-gray-500 underline">
              ← Regresar a productos
            </a>

            <h1 className="mt-4 text-4xl font-bold">Editar producto</h1>

            <p className="mt-4 max-w-2xl text-gray-600">
              Actualiza la información del producto, controla su inventario y
              administra su galería de imágenes.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href={`/product/${slug}`}
              target="_blank"
              className="rounded-full border px-6 py-3 text-center"
            >
              Ver público
            </a>

            <a
              href="/admin/products"
              className="rounded-full bg-black px-6 py-3 text-center text-white"
            >
              Productos
            </a>
          </div>
        </div>

        <AdminNav />

        {formMessage && (
          <div
            className={`mt-8 rounded-2xl border p-4 ${
              formMessage.includes("correctamente")
                ? "border-green-200 bg-green-50"
                : "border-red-200 bg-red-50"
            }`}
          >
            <p
              className={`text-sm font-medium ${
                formMessage.includes("correctamente")
                  ? "text-green-700"
                  : "text-red-700"
              }`}
            >
              {formMessage}
            </p>
          </div>
        )}

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border p-5">
            <p className="text-sm text-gray-600">Precio</p>
            <p className="mt-2 text-2xl font-bold">
              {formatMoney(numericPrice)}
            </p>
          </div>

          <div className="rounded-2xl border p-5">
            <p className="text-sm text-gray-600">Stock</p>
            <p className="mt-2 text-2xl font-bold">{numericStock}</p>
          </div>

          <div className="rounded-2xl border p-5">
            <p className="text-sm text-gray-600">Valor inventario</p>
            <p className="mt-2 text-2xl font-bold">
              {formatMoney(inventoryValue)}
            </p>
          </div>

          <div className="rounded-2xl border p-5">
            <p className="text-sm text-gray-600">Estado</p>
            <span
              className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-semibold ${getStockClassName(
                numericStock,
                isActive
              )}`}
            >
              {getStockLabel(numericStock, isActive)}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            <div className="space-y-8">
              <section className="rounded-2xl border p-6">
                <h2 className="text-2xl font-semibold">
                  Información principal
                </h2>

                <p className="mt-2 text-sm text-gray-600">
                  Slug actual:{" "}
                  <span className="font-mono text-black">{slug}</span>
                </p>

                <div className="mt-6 grid gap-5 md:grid-cols-2">
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
                    <span className="text-sm font-medium">Categoría</span>
                    <input
                      value={category}
                      onChange={(event) => setCategory(event.target.value)}
                      required
                      className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                    />
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
                  />
                </label>
              </section>

              <section className="rounded-2xl border p-6">
                <h2 className="text-2xl font-semibold">Precio e inventario</h2>

                <div className="mt-6 grid gap-5 md:grid-cols-2">
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
                </div>

                <div className="mt-5 rounded-2xl bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">
                    Al guardar, si cambias el stock, se creará un movimiento de
                    inventario.
                  </p>

                  <p className="mt-2 text-sm">
                    Valor estimado:{" "}
                    <span className="font-semibold">
                      {formatMoney(inventoryValue)}
                    </span>
                  </p>
                </div>
              </section>

              <section className="rounded-2xl border p-6">
                <h2 className="text-2xl font-semibold">Características</h2>

                <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                  <label className="block">
                    <span className="text-sm font-medium">Tipo</span>
                    <select
                      value={type}
                      onChange={(event) =>
                        setType(event.target.value as ProductType)
                      }
                      className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                    >
                      <option value="eyeglasses">Lentes ópticos</option>
                      <option value="sunglasses">Lentes de sol</option>
                      <option value="accessory">Accesorio</option>
                      <option value="contact_lenses">
                        Lentes de contacto
                      </option>
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

                  <label className="block">
                    <span className="text-sm font-medium">Tamaño</span>
                    <select
                      value={frameSize}
                      onChange={(event) =>
                        setFrameSize(event.target.value as ProductFrameSize)
                      }
                      className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                    >
                      <option value="extra_small">Extra chico</option>
                      <option value="small">Chico</option>
                      <option value="medium">Mediano</option>
                      <option value="large">Grande</option>
                      <option value="extra_large">Extra grande</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium">Material</span>
                    <select
                      value={frameMaterial}
                      onChange={(event) =>
                        setFrameMaterial(
                          event.target.value as ProductFrameMaterial
                        )
                      }
                      className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                    >
                      <option value="acetate_stainless_steel">
                        Acetato + Acero Inoxidable
                      </option>
                      <option value="stainless_steel">
                        Acero Inoxidable
                      </option>
                      <option value="acetate">Acetato</option>
                      <option value="acetate_slash_stainless_steel">
                        Acetato/Acero Inoxidable
                      </option>
                      <option value="titanium">Titanio</option>
                      <option value="nylon">Nylon</option>
                      <option value="titanium_nylon">Titanio + Nylon</option>
                      <option value="reform">ReForm</option>
                    </select>
                  </label>

                  <label className="flex items-center gap-3 rounded-xl border px-4 py-3 md:self-end">
                    <input
                      type="checkbox"
                      checked={clipOnCompatible}
                      onChange={(event) =>
                        setClipOnCompatible(event.target.checked)
                      }
                    />
                    <span className="text-sm font-medium">
                      Compatible con clip-on
                    </span>
                  </label>
                </div>
              </section>

              <ProductImageGalleryManager
                slug={slug || ""}
                images={images}
                fallbackAltText={name}
                onImagesChange={setImages}
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
                  Si está activo, aparece en la tienda pública. Si está
                  inactivo, solo aparece en admin.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
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
              </section>
            </div>

            <aside className="h-fit rounded-2xl border p-6">
              <h2 className="text-2xl font-semibold">Vista previa</h2>

              <div className="mt-5 overflow-hidden rounded-2xl border bg-gray-50">
                <div className="flex h-72 items-center justify-center bg-white">
                  {mainImage ? (
                    <img
                      src={mainImage.imageUrl}
                      alt={mainImage.altText || name}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="px-6 text-center text-sm text-gray-500">
                      Este producto no tiene imagen principal.
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

                  <p className="mt-2 text-lg">{formatMoney(numericPrice)}</p>

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

                    <span className="rounded-full bg-gray-100 px-3 py-1">
                      {frameSize}
                    </span>

                    <span className="rounded-full bg-gray-100 px-3 py-1">
                      {getFrameMaterialLabel(frameMaterial)}
                    </span>

                    {clipOnCompatible && (
                      <span className="rounded-full bg-gray-100 px-3 py-1">
                        clip-on
                      </span>
                    )}
                  </div>

                  <div className="mt-5 rounded-2xl bg-gray-50 p-4 text-sm">
                    <p>
                      <span className="font-medium">Slug:</span> {slug}
                    </p>

                    <p className="mt-1">
                      <span className="font-medium">Stock:</span>{" "}
                      {stock || "0"}
                    </p>

                    <p className="mt-1">
                      <span className="font-medium">Estado:</span>{" "}
                      {isActive ? "Activo" : "Inactivo"}
                    </p>

                    <p className="mt-1">
                      <span className="font-medium">Imágenes:</span>{" "}
                      {images.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
                <p>
                  Creado:{" "}
                  <span className="font-medium text-black">
                    {formatDate(product.createdAt)}
                  </span>
                </p>

                <p className="mt-1">
                  Actualizado:{" "}
                  <span className="font-medium text-black">
                    {formatDate(product.updatedAt)}
                  </span>
                </p>
              </div>
            </aside>
          </div>
        </form>
      </section>
    </main>
  );
}


