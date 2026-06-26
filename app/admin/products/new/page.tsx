"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNav from "@/components/AdminNav";

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
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  function handleNameChange(value: string) {
    setName(value);

    if (!slug) {
      setSlug(createSlug(value));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSaving(true);

      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug,
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
          imageUrl: imageUrl || undefined,
          imageAltText: imageAltText || name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "No pudimos crear el producto.");
        return;
      }

      alert("Producto creado correctamente.");
      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("No pudimos crear el producto.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-white px-6 py-12 text-black">
      <section className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold">Agregar producto</h1>

        <p className="mt-4 text-gray-600">
          Crea un producto nuevo en PostgreSQL. Más adelante agregaremos carga
          real de imágenes.
        </p>

        <AdminNav />

        <form onSubmit={handleSubmit} className="mt-10 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
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
              <input
                value={slug}
                onChange={(event) => setSlug(createSlug(event.target.value))}
                required
                className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                placeholder="modelo-ejecutivo"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium">Descripción</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
              rows={4}
              className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
              placeholder="Armazón ligero, cómodo y elegante para uso diario."
            />
          </label>

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
                placeholder="1499"
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
                placeholder="negro"
              />
            </label>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium">URL de imagen</span>
              <input
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
                className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                placeholder="/products/modelo-ejecutivo.jpg"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium">Texto alternativo</span>
              <input
                value={imageAltText}
                onChange={(event) => setImageAltText(event.target.value)}
                className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                placeholder="Modelo Ejecutivo"
              />
            </label>
          </div>

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
              {isSaving ? "Guardando..." : "Crear producto"}
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

