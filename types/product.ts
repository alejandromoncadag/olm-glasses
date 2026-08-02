export type Product = {
  slug: string;
  name: string;
  price: number;
  category: string;
  type: "eyeglasses" | "sunglasses" | "accessory" | "contact_lenses";
  color: string;
  description: string;
  gender: "hombre" | "mujer" | "unisex" | null;
  shape: "redondo" | "cuadrado" | "rectangular" | "aviador" | null;
  frameColor: "negro" | "transparente" | "cafe" | "dorado" | null;
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
  isAvailable?: boolean;
  purchasableOnline?: boolean;
  favoritable?: boolean;
  mainImage?: {
    imageUrl: string;
    altText?: string | null;
  } | null;
};

