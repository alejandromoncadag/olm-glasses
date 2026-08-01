import Image from "next/image";
import LikeButton from "@/components/LikeButton";
import QuickAddToCartButton from "@/components/QuickAddToCartButton";

type StorefrontProductCardProps = {
  slug: string;
  name: string;
  eyebrow: string;
  description: string;
  price: number;
  image: string;
  details?: string[];
  actionLabel?: string;
  priority?: boolean;
};

export default function StorefrontProductCard({
  slug,
  name,
  price,
  image,
  actionLabel = "Agregar al carrito",
  priority = false,
}: StorefrontProductCardProps) {
  const productHref = `/product/${slug}`;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-black/10 bg-white">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#f4f1ed]">
        <a
          href={productHref}
          aria-label={`Ver ${name}`}
          className="relative block h-full w-full"
        >
          <Image
            src={image}
            alt={name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            loading={priority ? "eager" : "lazy"}
            className="object-cover transition duration-500 group-hover:scale-[1.025]"
          />
        </a>

        <div className="absolute right-4 top-4 z-10">
          <LikeButton slug={slug} size="md" />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex flex-col gap-2">
          <a href={productHref}>
            <h2 className="text-xl font-semibold transition group-hover:underline group-hover:underline-offset-4">
              {name}
            </h2>
          </a>
          <p className="font-semibold">
            ${price.toLocaleString("es-MX")}{" "}
            <span className="text-[10px] font-normal text-gray-500">MXN</span>
          </p>
        </div>

        <div className="mt-auto pt-6">
          <QuickAddToCartButton
            slug={slug}
            label={actionLabel}
            className="w-full"
          />
        </div>
      </div>
    </article>
  );
}
