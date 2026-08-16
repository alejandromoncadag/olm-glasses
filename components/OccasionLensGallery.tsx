import Image from "next/image";

const occasions = [
  { src: "/images/reunion.png", label: "Reuniones", alt: "Lentes para reuniones" },
  { src: "/images/noche_fiesta.png", label: "Noche de Fiesta", alt: "Lentes para una noche de fiesta" },
  { src: "/images/playa.png", label: "Playa", alt: "Lentes para la playa" },
  { src: "/images/conducir.png", label: "Viajes en coche", alt: "Lentes para viajes en coche" },
  { src: "/images/deporte.png", label: "Deporte", alt: "Lentes para deporte" },
  { src: "/images/leer.png", label: "Pasatiempos", alt: "Lentes para pasatiempos" },
];

export default function OccasionLensGallery() {
  return (
    <section aria-labelledby="occasion-lens-title">
      <div className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">Elige tu ocasión</p>
        <h2 id="occasion-lens-title" className="mt-2 text-3xl sm:text-4xl">Lentes para cada momento</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {occasions.map((occasion) => (
          <article key={occasion.src} className="group min-w-0">
            <div className="relative aspect-[3/4] overflow-hidden bg-[#f7f3ee]">
              <Image
                src={occasion.src}
                alt={occasion.alt}
                fill
                sizes="(min-width: 1024px) 16.666vw, (min-width: 640px) 33.333vw, 50vw"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-black/10" />
              <p className="pointer-events-none absolute inset-0 flex items-center justify-center px-2 text-center text-xs font-semibold uppercase tracking-[0.1em] text-white drop-shadow-sm sm:text-sm">
                {occasion.label}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
