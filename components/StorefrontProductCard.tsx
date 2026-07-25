import Image from "next/image";

type StorefrontProductCardProps = {
  name: string;
  eyebrow: string;
  description: string;
  price: number;
  image: string;
  details?: string[];
  actionHref: string;
  actionLabel?: string;
  priority?: boolean;
};

export default function StorefrontProductCard({
  name,
  eyebrow,
  description,
  price,
  image,
  details = [],
  actionHref,
  actionLabel = "Consultar disponibilidad",
  priority = false,
}: StorefrontProductCardProps) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-black/10 bg-white">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#f4f1ed]">
        <Image
          src={image}
          alt={name}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          loading={priority ? "eager" : "lazy"}
          className="object-cover transition duration-500 group-hover:scale-[1.025]"
        />
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">
          {eyebrow}
        </p>

        <div className="mt-2 flex items-start justify-between gap-4">
          <h2 className="text-xl font-semibold">{name}</h2>
          <p className="shrink-0 font-semibold">
            ${price.toLocaleString("es-MX")}{" "}
            <span className="text-[10px] font-normal text-gray-500">MXN</span>
          </p>
        </div>

        {details.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {details.map((detail) => (
              <span
                key={detail}
                className="rounded-full bg-[#f4f1ed] px-3 py-1 text-xs text-gray-700"
              >
                {detail}
              </span>
            ))}
          </div>
        )}

        <p className="mt-4 text-sm leading-6 text-gray-600">{description}</p>

        <a
          href={actionHref}
          target={actionHref.startsWith("https://") ? "_blank" : undefined}
          rel={
            actionHref.startsWith("https://") ? "noopener noreferrer" : undefined
          }
          className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-full border border-[var(--brand-espresso)] px-5 text-sm font-semibold text-[var(--brand-espresso)] transition hover:bg-[var(--brand-espresso)] hover:text-white"
        >
          {actionLabel}
        </a>
      </div>
    </article>
  );
}
