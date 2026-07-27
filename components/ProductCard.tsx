import LikeButton from "@/components/LikeButton";
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
  actionLabel = "Ver modelo",
  isNew = false,
}: ProductCardProps) {
  const isOutOfStock = stock <= 0;

  return (
    <article className="group flex h-full flex-col rounded-[28px] border border-black/10 bg-white p-3 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(0,0,0,0.08)]">
      <div className="relative">
        <div className="absolute right-4 top-4 z-10">
          <LikeButton slug={slug} size="md" />
        </div>

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
            className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[22px]"
            style={{ backgroundColor: color }}
          >
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={imageAltText || name}
                fill
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

      <div className="flex flex-1 flex-col px-2 pb-2 pt-5">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-gray-500">
          {category}
        </p>

        <div className="mt-2 flex items-start justify-between gap-4">
          <a href={href} className="min-w-0">
            <h2 className="text-xl font-semibold tracking-[-0.02em] transition group-hover:underline group-hover:underline-offset-4">
              {name}
            </h2>
          </a>

          <p className="shrink-0 text-lg font-semibold tracking-[-0.02em]">
            ${price.toLocaleString("es-MX")}{" "}
            <span className="text-xs font-medium text-gray-500">MXN</span>
          </p>
        </div>

        <div className="mt-auto flex items-center justify-end gap-4 pt-6">
          <a
            href={href}
            className="rounded-full border border-black/20 px-4 py-2 text-sm font-medium transition hover:border-[var(--brand-espresso)] hover:bg-[var(--brand-espresso)] hover:text-white"
          >
            {actionLabel}
          </a>
        </div>
      </div>
    </article>
  );
}
