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
  frameSize?: "extra_small" | "small" | "medium" | "large" | "extra_large";
  frameMaterial?:
    | "acetate_stainless_steel"
    | "stainless_steel"
    | "acetate"
    | "acetate_slash_stainless_steel"
    | "titanium"
    | "nylon"
    | "titanium_nylon"
    | "reform";
  clipOnCompatible?: boolean;
  stock: number;
  isActive: boolean;
  mainImage?: {
    imageUrl: string;
    altText?: string | null;
  } | null;
};

