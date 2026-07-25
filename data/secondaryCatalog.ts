export type AccessoryProduct = {
  slug: string;
  name: string;
  eyebrow: string;
  description: string;
  price: number;
  image: string;
};

export type ContactLensProduct = {
  slug: string;
  name: string;
  brand: string;
  replacement: "Diario" | "Mensual";
  lensType: "Esférico" | "Tórico";
  packSize: string;
  description: string;
  price: number;
  image: string;
};

export const accessoryProducts: AccessoryProduct[] = [
  {
    slug: "estuche-espresso",
    name: "Estuche Espresso",
    eyebrow: "Protección",
    description:
      "Estuche rígido con acabado café para cuidar tus lentes todos los días.",
    price: 349,
    image: "/products/accessories/estuche-espresso.webp",
  },
  {
    slug: "spray-pano-olm",
    name: "Spray + Paño OLM",
    eyebrow: "Cuidado",
    description:
      "Kit compacto para mantener tus micas limpias y listas para usar.",
    price: 189,
    image: "/products/accessories/spray-limpiador.webp",
  },
  {
    slug: "taza-olm",
    name: "Taza OLM",
    eyebrow: "Edición de tienda",
    description:
      "Taza de cerámica con un detalle inspirado en nuestros armazones.",
    price: 299,
    image: "/products/accessories/taza-olm.webp",
  },
];

export const contactLensProducts: ContactLensProduct[] = [
  {
    slug: "luma-daily-30",
    name: "Luma Daily 30",
    brand: "Luma",
    replacement: "Diario",
    lensType: "Esférico",
    packSize: "30 lentes",
    description:
      "Lentes de reemplazo diario pensados para una rutina simple y cómoda.",
    price: 899,
    image: "/products/contacts/luma-daily.webp",
  },
  {
    slug: "vistalens-comfort-6",
    name: "Vistalens Comfort 6",
    brand: "Vistalens",
    replacement: "Mensual",
    lensType: "Esférico",
    packSize: "6 lentes",
    description:
      "Opción mensual para uso cotidiano, sujeta a valoración y adaptación.",
    price: 749,
    image: "/products/contacts/vistalens-comfort.webp",
  },
  {
    slug: "nitida-toric-6",
    name: "Nítida Toric 6",
    brand: "Nítida",
    replacement: "Mensual",
    lensType: "Tórico",
    packSize: "6 lentes",
    description:
      "Diseñados para personas con astigmatismo, con adaptación profesional.",
    price: 1099,
    image: "/products/contacts/nitida-toric.webp",
  },
];
