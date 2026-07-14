import LikeButton from "@/components/LikeButton";

type ProductCardProps = {
  slug: string;
  name: string;
  price: number;
  category: string;
  color: string;
  href: string;
  stock: number;
  imageUrl?: string | null;
  imageAltText?: string | null;
};

export default function ProductCard({
  slug,
  name,
  price,
  category,
  color,
  href,
  stock,
  imageUrl,
  imageAltText,
}: ProductCardProps) {
  const isOutOfStock = stock <= 0;

  return (
    <div className="group relative">
      <div className="absolute right-4 top-4 z-10">
        <LikeButton slug={slug} size="md" />
      </div>

      <a
        href={href}
        className="block rounded-2xl border bg-white p-6 transition hover:shadow-lg"
      >
        <div
          className="relative flex h-48 items-center justify-center overflow-hidden rounded-xl"
          style={{ backgroundColor: color }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={imageAltText || name}
              className="h-full w-full object-cover transition group-hover:scale-105"
            />
          ) : (
            <span className="text-sm text-gray-500">Imagen del producto</span>
          )}

          {isOutOfStock && (
            <span className="absolute left-3 top-3 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
              Agotado
            </span>
          )}
        </div>

        <p className="mt-4 text-sm text-gray-500">{category}</p>

        <h2 className="mt-1 text-xl font-semibold group-hover:underline">
          {name}
        </h2>

        <p className="mt-2 text-gray-700">
          ${price.toLocaleString("es-MX")} MXN
        </p>

        {!isOutOfStock && (
          <p className="mt-2 text-sm text-gray-500">{stock} disponibles</p>
        )}
      </a>
    </div>
  );
}


