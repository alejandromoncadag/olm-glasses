import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import {
  getAuthenticatedAdmin,
  unauthorizedAdminResponse,
} from "@/lib/requireAdmin";

export const runtime = "nodejs";

const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];

function createSafeFileName(originalName: string) {
  const extension = path.extname(originalName).toLowerCase();

  const baseName = path
    .basename(originalName, extension)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${baseName || "product"}-${Date.now()}${extension}`;
}

export async function POST(request: Request) {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    return unauthorizedAdminResponse();
  }

  try {
    const formData = await request.formData();
    const image = formData.get("image");

    if (!(image instanceof File)) {
      return NextResponse.json(
        { error: "Image file is required" },
        { status: 400 }
      );
    }

    if (!allowedImageTypes.includes(image.type)) {
      return NextResponse.json(
        { error: "Only JPG, PNG, and WEBP images are allowed" },
        { status: 400 }
      );
    }

    const maxSizeInBytes = 5 * 1024 * 1024;

    if (image.size > maxSizeInBytes) {
      return NextResponse.json(
        { error: "Image must be smaller than 5MB" },
        { status: 400 }
      );
    }

    const productsDirectory = path.join(process.cwd(), "public", "products");
    await mkdir(productsDirectory, { recursive: true });

    const fileName = createSafeFileName(image.name);
    const filePath = path.join(productsDirectory, fileName);

    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await writeFile(filePath, buffer);

    return NextResponse.json(
      {
        imageUrl: `/products/${fileName}`,
        fileName,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error uploading product image:", error);

    return NextResponse.json(
      { error: "Failed to upload product image" },
      { status: 500 }
    );
  }
}

