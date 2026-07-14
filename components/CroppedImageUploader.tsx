/* eslint-disable @next/next/no-img-element */
"use client";

import { ChangeEvent, useState } from "react";
import Cropper, { Area } from "react-easy-crop";

const OUTPUT_SIZE = 1200;

type UploadResult = {
  imageUrl: string;
  fileName: string;
  originalWidth: number;
  originalHeight: number;
  outputWidth: number;
  outputHeight: number;
};

type CroppedImageUploaderProps = {
  onUploadComplete: (result: UploadResult) => void;
};

type ImageMode = "fit" | "crop";

function createImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function getImageDimensions(src: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };

    image.onerror = reject;
    image.src = src;
  });
}

function getOutputType(file: File) {
  if (file.type === "image/png") return "image/png";
  if (file.type === "image/webp") return "image/webp";

  return "image/jpeg";
}

function getOutputExtension(file: File) {
  if (file.type === "image/png") return ".png";
  if (file.type === "image/webp") return ".webp";

  return ".jpg";
}

async function createCroppedImageFile(
  imageSrc: string,
  croppedAreaPixels: Area,
  originalFile: File
) {
  const image = await createImage(imageSrc);

  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not create image canvas");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

  context.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE
  );

  const outputType = getOutputType(originalFile);
  const outputExtension = getOutputExtension(originalFile);
  const baseName = originalFile.name.replace(/\.[^/.]+$/, "");

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error("Could not crop image"));
          return;
        }

        resolve(result);
      },
      outputType,
      0.92
    );
  });

  return new File([blob], `${baseName}-cropped${outputExtension}`, {
    type: outputType,
  });
}

async function createFittedImageFile(imageSrc: string, originalFile: File) {
  const image = await createImage(imageSrc);

  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not create image canvas");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

  const scale = Math.min(
    OUTPUT_SIZE / image.naturalWidth,
    OUTPUT_SIZE / image.naturalHeight
  );

  const drawnWidth = image.naturalWidth * scale;
  const drawnHeight = image.naturalHeight * scale;

  const x = (OUTPUT_SIZE - drawnWidth) / 2;
  const y = (OUTPUT_SIZE - drawnHeight) / 2;

  context.drawImage(image, x, y, drawnWidth, drawnHeight);

  const outputType = getOutputType(originalFile);
  const outputExtension = getOutputExtension(originalFile);
  const baseName = originalFile.name.replace(/\.[^/.]+$/, "");

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error("Could not create fitted image"));
          return;
        }

        resolve(result);
      },
      outputType,
      0.92
    );
  });

  return new File([blob], `${baseName}-fitted${outputExtension}`, {
    type: outputType,
  });
}

export default function CroppedImageUploader({
  onUploadComplete,
}: CroppedImageUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState("");
  const [imageMode, setImageMode] = useState<ImageMode>("fit");

  const [originalDimensions, setOriginalDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setError("Solo puedes subir imágenes JPG, PNG o WEBP.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);

    try {
      const dimensions = await getImageDimensions(objectUrl);

      setSelectedFile(file);
      setImageSrc(objectUrl);
      setOriginalDimensions(dimensions);
      setImageMode("fit");
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      setError("");
    } catch (error) {
      console.error(error);
      URL.revokeObjectURL(objectUrl);
      setError("No pudimos leer esta imagen.");
    } finally {
      event.target.value = "";
    }
  }

  function closeEditor() {
    if (imageSrc) {
      URL.revokeObjectURL(imageSrc);
    }

    setSelectedFile(null);
    setImageSrc("");
    setOriginalDimensions(null);
    setImageMode("fit");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  }

  async function uploadFinalImage() {
    if (!selectedFile || !imageSrc) {
      setError("Selecciona una imagen primero.");
      return;
    }

    if (imageMode === "crop" && !croppedAreaPixels) {
      setError("Ajusta el recorte primero.");
      return;
    }

    try {
      setIsUploading(true);
      setError("");

      const finalFile =
        imageMode === "fit"
          ? await createFittedImageFile(imageSrc, selectedFile)
          : await createCroppedImageFile(
              imageSrc,
              croppedAreaPixels as Area,
              selectedFile
            );

      const formData = new FormData();
      formData.append("image", finalFile);

      const response = await fetch("/api/admin/product-images", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "No pudimos subir la imagen.");
        return;
      }

      onUploadComplete({
        imageUrl: data.imageUrl,
        fileName: data.fileName,
        originalWidth: originalDimensions?.width || 0,
        originalHeight: originalDimensions?.height || 0,
        outputWidth: OUTPUT_SIZE,
        outputHeight: OUTPUT_SIZE,
      });

      closeEditor();
    } catch (error) {
      console.error(error);
      setError("No pudimos procesar o subir la imagen.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div>
      <label className="block">
        <span className="text-sm font-medium">Subir imagen</span>

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="mt-2 block w-full text-sm"
        />
      </label>

      <p className="mt-2 text-xs text-gray-500">
        La imagen final se guardará en {OUTPUT_SIZE} x {OUTPUT_SIZE} px.
      </p>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {imageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white p-6 text-black">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
              <div>
                <h2 className="text-2xl font-bold">Ajustar imagen</h2>

                <p className="mt-2 text-sm text-gray-600">
                  Puedes mantener toda la imagen con espacio blanco o recortar
                  para acercar el producto.
                </p>

                {originalDimensions && (
                  <p className="mt-2 text-sm text-gray-500">
                    Original: {originalDimensions.width} x{" "}
                    {originalDimensions.height} px · Final: {OUTPUT_SIZE} x{" "}
                    {OUTPUT_SIZE} px
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={closeEditor}
                className="rounded-full border px-5 py-2 text-sm"
              >
                Cancelar
              </button>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setImageMode("fit")}
                className={`rounded-full border px-5 py-2 text-sm ${
                  imageMode === "fit" ? "border-black bg-black text-white" : ""
                }`}
              >
                Ajustar completa
              </button>

              <button
                type="button"
                onClick={() => setImageMode("crop")}
                className={`rounded-full border px-5 py-2 text-sm ${
                  imageMode === "crop" ? "border-black bg-black text-white" : ""
                }`}
              >
                Recortar
              </button>
            </div>

            {imageMode === "fit" ? (
              <div className="mt-6 flex h-[460px] items-center justify-center rounded-2xl bg-gray-100 p-4">
                <div className="flex aspect-square h-full items-center justify-center bg-white shadow">
                  <img
                    src={imageSrc}
                    alt="Vista previa ajustada"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="relative mt-6 h-[460px] overflow-hidden rounded-2xl bg-black">
                  <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    objectFit="contain"
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={(_croppedArea, nextCroppedAreaPixels) =>
                      setCroppedAreaPixels(nextCroppedAreaPixels)
                    }
                  />
                </div>

                <div className="mt-6">
                  <label className="block">
                    <span className="text-sm font-medium">Zoom</span>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.05"
                      value={zoom}
                      onChange={(event) => setZoom(Number(event.target.value))}
                      className="mt-2 w-full"
                    />
                  </label>
                </div>
              </>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={uploadFinalImage}
                disabled={isUploading}
                className="rounded-full bg-black px-6 py-3 text-white disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {isUploading ? "Subiendo..." : "Guardar imagen"}
              </button>

              <button
                type="button"
                onClick={closeEditor}
                className="rounded-full border px-6 py-3"
              >
                Cancelar
              </button>
            </div>

            <p className="mt-4 text-xs text-gray-500">
              Para lentes normalmente usa “Ajustar completa”. Usa “Recortar”
              cuando haya demasiado fondo o borde alrededor del producto.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

