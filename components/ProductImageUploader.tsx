"use client";

import { useState } from "react";
import CroppedImageUploader from "@/components/CroppedImageUploader";

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
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadedDimensions, setUploadedDimensions] = useState("");

  return (
    <div className="rounded-2xl border p-5">
      <h2 className="text-xl font-semibold">Imagen principal</h2>

      <p className="mt-2 text-sm text-gray-600">
        Sube una imagen, recorta los bordes y guárdala como imagen principal.
      </p>

      <div className="mt-5 rounded-2xl bg-gray-50 p-4">
        <CroppedImageUploader
          onUploadComplete={(result) => {
            onImageUrlChange(result.imageUrl);
            onImageAltTextChange(imageAltText || fallbackAltText);
            setUploadedFileName(result.fileName);
            setUploadedDimensions(
              `${result.outputWidth} x ${result.outputHeight} px`
            );
          }}
        />

        {uploadedFileName && (
          <p className="mt-3 text-sm text-green-700">
            Imagen subida: {uploadedFileName}
          </p>
        )}

        {uploadedDimensions && (
          <p className="mt-1 text-xs text-gray-500">
            Dimensión final: {uploadedDimensions}
          </p>
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



