/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import CroppedImageUploader from "@/components/CroppedImageUploader";

type ProductImage = {
  id: string;
  imageUrl: string;
  altText: string;
  displayOrder: number;
  isMain: boolean;
};

type ProductImageGalleryManagerProps = {
  slug: string;
  images: ProductImage[];
  fallbackAltText: string;
  onImagesChange: (images: ProductImage[]) => void;
};

function sortImages(images: ProductImage[]) {
  return [...images].sort((a, b) => {
    if (a.isMain && !b.isMain) return -1;
    if (!a.isMain && b.isMain) return 1;
    return a.displayOrder - b.displayOrder;
  });
}

export default function ProductImageGalleryManager({
  slug,
  images,
  fallbackAltText,
  onImagesChange,
}: ProductImageGalleryManagerProps) {
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImageAltText, setNewImageAltText] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState("");

  async function addImage() {
    if (!newImageUrl.trim()) {
      setError("Agrega una URL de imagen.");
      return;
    }

    try {
      setIsAdding(true);
      setError("");

      const response = await fetch(`/api/products/${slug}/images`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: newImageUrl.trim(),
          altText: newImageAltText.trim() || fallbackAltText,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "No pudimos agregar la imagen.");
        return;
      }

      const nextImages = images.some((image) => image.id === data.image.id)
        ? images.map((image) =>
            image.id === data.image.id ? data.image : image
          )
        : [...images, data.image];

      onImagesChange(sortImages(nextImages));
      setNewImageUrl("");
      setNewImageAltText("");
    } catch (error) {
      console.error(error);
      setError("No pudimos agregar la imagen.");
    } finally {
      setIsAdding(false);
    }
  }

  async function setMainImage(imageId: string) {
    try {
      setError("");

      const response = await fetch(`/api/products/${slug}/images/${imageId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isMain: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "No pudimos marcar la imagen principal.");
        return;
      }

      onImagesChange(
        sortImages(
          images.map((image) => ({
            ...image,
            isMain: image.id === data.image.id,
          }))
        )
      );
    } catch (error) {
      console.error(error);
      setError("No pudimos marcar la imagen principal.");
    }
  }

  async function deleteImage(image: ProductImage) {
    if (!confirm("¿Seguro que quieres eliminar esta imagen del producto?")) {
      return;
    }

    try {
      setError("");

      const response = await fetch(`/api/products/${slug}/images/${image.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "No pudimos eliminar la imagen.");
        return;
      }

      const remainingImages = images.filter(
        (currentImage) => currentImage.id !== image.id
      );

      if (image.isMain && remainingImages.length > 0) {
        remainingImages[0] = {
          ...remainingImages[0],
          isMain: true,
        };
      }

      onImagesChange(sortImages(remainingImages));
    } catch (error) {
      console.error(error);
      setError("No pudimos eliminar la imagen.");
    }
  }

  return (
    <div className="rounded-2xl border p-5">
      <h2 className="text-xl font-semibold">Galería de imágenes</h2>

      <p className="mt-2 text-sm text-gray-600">
        Agrega varias imágenes y elige cuál será la principal.
      </p>

      <div className="mt-5 rounded-2xl bg-gray-50 p-4">
        <CroppedImageUploader
          onUploadComplete={(result) => {
            setNewImageUrl(result.imageUrl);
            setNewImageAltText(fallbackAltText);
          }}
        />

        <p className="mt-3 text-xs text-gray-500">
          Después de recortar, la URL se llenará abajo. Luego haz clic en
          “Agregar imagen a galería”.
        </p>
      </div>

      <div className="mt-5 grid gap-6 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">URL de imagen</span>
          <input
            value={newImageUrl}
            onChange={(event) => setNewImageUrl(event.target.value)}
            className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
            placeholder="/products/tu-imagen.jpg"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Texto alternativo</span>
          <input
            value={newImageAltText}
            onChange={(event) => setNewImageAltText(event.target.value)}
            className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
            placeholder={fallbackAltText || "Nombre del producto"}
          />
        </label>
      </div>

      <button
        type="button"
        onClick={addImage}
        disabled={isAdding}
        className="mt-5 rounded-full bg-black px-6 py-3 text-sm text-white disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {isAdding ? "Agregando..." : "Agregar imagen a galería"}
      </button>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {images.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed p-6 text-center text-sm text-gray-500">
          Este producto todavía no tiene imágenes.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortImages(images).map((image) => (
            <div key={image.id} className="overflow-hidden rounded-2xl border">
              <div className="relative flex h-44 items-center justify-center bg-gray-100">
                <img
                  src={image.imageUrl}
                  alt={image.altText || fallbackAltText}
                  className="h-full w-full object-cover"
                />

                {image.isMain && (
                  <span className="absolute left-3 top-3 rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
                    Principal
                  </span>
                )}
              </div>

              <div className="space-y-3 p-4">
                <p className="truncate text-xs text-gray-500">
                  {image.imageUrl}
                </p>

                <p className="text-sm text-gray-700">
                  {image.altText || fallbackAltText}
                </p>

                <div className="flex flex-col gap-2">
                  {!image.isMain && (
                    <button
                      type="button"
                      onClick={() => setMainImage(image.id)}
                      className="rounded-full border px-4 py-2 text-sm"
                    >
                      Marcar principal
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => deleteImage(image)}
                    className="rounded-full border border-red-200 px-4 py-2 text-sm text-red-600"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



