export type Product = {
  slug: string;
  name: string;
  price: number;
  category: string;
  type: "eyeglasses" | "sunglasses";
  color: string;
  description: string;
  gender: "hombre" | "mujer" | "unisex";
  shape: "redondo" | "cuadrado" | "rectangular" | "aviador";
  frameColor: "negro" | "transparente" | "cafe" | "dorado";
  stock: number;
  isActive: boolean;
  mainImage?: {
    imageUrl: string;
    altText?: string | null;
  } | null;
};

