"use client";

import { ChangeEvent, useState } from "react";

type ProductImageUploaderProps = {
  imageUrl: string;
  imageAltText: string;
  fallbackAltText: string;
  onImageUrlChange: (value: string) => void;
  onImageAltTextChange: (value: string) => void;
};

export default function ProductImageUploader({
  imageUrl,
  imageAltText,
  fallbackAltText,
  onImageUrlChange,
  onImageAltTextChange,
}: ProductImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setIsUploading(true);
      setUploadError("");
      setUploadedFileName("");

      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/admin/product-images", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setUploadError(data.error || "No pudimos subir la imagen.");
        return;
      }

      onImageUrlChange(data.imageUrl);
      onImageAltTextChange(imageAltText || fallbackAltText);
      setUploadedFileName(data.fileName || "");
    } catch (error) {
      console.error(error);
      setUploadError("No pudimos subir la imagen.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="rounded-2xl border p-5">
      <h2 className="text-xl font-semibold">Imagen principal</h2>

      <p className="mt-2 text-sm text-gray-600">
        Sube una imagen desde tu computadora o pega una URL manualmente.
      </p>

      <div className="mt-5 rounded-2xl bg-gray-50 p-4">
        <label className="block">
          <span className="text-sm font-medium">Subir imagen</span>

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            disabled={isUploading}
            className="mt-2 block w-full text-sm"
          />
        </label>

        <p className="mt-2 text-xs text-gray-500">
          Formatos permitidos: JPG, PNG o WEBP. Máximo 5MB.
        </p>

        {isUploading && (
          <p className="mt-3 text-sm text-gray-600">Subiendo imagen...</p>
        )}

        {uploadedFileName && (
          <p className="mt-3 text-sm text-green-700">
            Imagen subida: {uploadedFileName}
          </p>
        )}

        {uploadError && (
          <p className="mt-3 text-sm text-red-600">{uploadError}</p>
        )}
      </div>

      <div className="mt-5 grid gap-6 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">URL de imagen</span>
          <input
            value={imageUrl}
            onChange={(event) => onImageUrlChange(event.target.value)}
            className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
            placeholder="/products/tu-imagen.jpg"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Texto alternativo</span>
          <input
            value={imageAltText}
            onChange={(event) => onImageAltTextChange(event.target.value)}
            className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
            placeholder={fallbackAltText || "Nombre del producto"}
          />
        </label>
      </div>

      {imageUrl && (
        <p className="mt-3 text-xs text-gray-500">
          URL actual: <span className="font-mono">{imageUrl}</span>
        </p>
      )}
    </div>
  );
}

