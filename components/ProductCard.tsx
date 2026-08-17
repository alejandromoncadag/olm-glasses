import LikeButton from "@/components/LikeButton";
import QuickAddToCartButton from "@/components/QuickAddToCartButton";
import Image from "next/image";

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
  actionLabel?: string;
  isNew?: boolean;
  availableOnline?: boolean;
  purchasableOnline?: boolean;
  favoritable?: boolean;
  visualVariant?: "default" | "optical";
};

export default function ProductCard({
  slug,
  name,
  price,
  color,
  href,
  stock,
  imageUrl,
  imageAltText,
  actionLabel = "Agregar al carrito",
  isNew = false,
  availableOnline,
  purchasableOnline = true,
  favoritable = true,
  visualVariant = "default",
}: ProductCardProps) {
  const isOutOfStock = availableOnline === undefined ? stock <= 0 : !availableOnline;

  return (
    <article className={visualVariant === "optical" ? "group flex h-full flex-col bg-transparent transition duration-300 hover:-translate-y-0.5" : "group flex h-full flex-col rounded-[28px] border border-black/10 bg-white p-3 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(0,0,0,0.08)]"}>
      <div className="relative">
        {favoritable && (
          <div className="absolute right-4 top-4 z-10">
            <LikeButton slug={slug} size={visualVariant === "optical" ? "sm" : "md"} />
          </div>
        )}

        {(isNew || isOutOfStock) && (
          <div className="absolute left-4 top-4 z-10 flex flex-col items-start gap-2">
            {isNew && (
              <span className="rounded-full bg-[var(--brand-espresso)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white shadow-sm">
                Nuevo
              </span>
            )}

            {isOutOfStock && (
              <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-red-700 shadow-sm">
                Agotado
              </span>
            )}
          </div>
        )}

        <a href={href} className="block" aria-label={`Ver ${name}`}>
          <div
            className={visualVariant === "optical" ? "relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-[#f4f1ed]" : "relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[22px]"}
            style={{ backgroundColor: color }}
          >
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={imageAltText || name}
                fill
                unoptimized={imageUrl.startsWith("http://") || imageUrl.startsWith("https://")}
                sizes="(min-width: 1280px) 30vw, (min-width: 640px) 50vw, 100vw"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]"
              />
            ) : (
              <span className="rounded-full bg-white/75 px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-black/55 shadow-sm backdrop-blur-sm">
                Imagen próximamente
              </span>
            )}

          </div>
        </a>
      </div>

      <div className={visualVariant === "optical" ? "flex flex-1 flex-col px-1 pb-2 pt-5" : "flex flex-1 flex-col px-2 pb-2 pt-5"}>
        <div className="flex flex-col gap-2">
          <a href={href} className="min-w-0">
            <h2 className={visualVariant === "optical" ? "text-lg font-medium tracking-[-0.01em] transition group-hover:underline group-hover:underline-offset-4" : "text-xl font-semibold tracking-[-0.02em] transition group-hover:underline group-hover:underline-offset-4"}>
              {name}
            </h2>
          </a>

          <p className={visualVariant === "optical" ? "text-sm font-medium tracking-normal text-[#4b5563]" : "text-lg font-semibold tracking-[-0.02em]"}>
            ${price.toLocaleString("es-MX")}{" "}
            <span className="text-xs font-medium text-gray-500">MXN</span>
          </p>
        </div>

        <div className="mt-auto pt-6">
          {isOutOfStock ? (
            <div className="flex min-h-11 w-full items-center justify-center rounded-full border border-black/15 bg-[#f7f3ee] px-4 text-sm font-semibold text-gray-600">
              Agotado
            </div>
          ) : purchasableOnline ? (
            <QuickAddToCartButton
              slug={slug}
              label={actionLabel}
              className={visualVariant === "optical" ? "w-full rounded-none" : "w-full"}
            />
          ) : (
            <div className="flex min-h-11 w-full items-center justify-center rounded-full border border-black/15 bg-[#f7f3ee] px-4 text-center text-sm font-semibold text-[var(--brand-espresso)]">
              Disponible próximamente en línea
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
