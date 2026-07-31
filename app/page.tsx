import Image from "next/image";
import Link from "next/link";
import FeaturedProductsFromDb from "@/components/FeaturedProductsFromDb";
import HomeLocationFinder from "@/components/HomeLocationFinder";
import { locations } from "@/data/locations";

const servicePromises = [
  {
    number: "01",
    title: "Envío gratis",
    copy: "En compras desde $1,500 MXN.",
  },
  {
    number: "02",
    title: "Examen incluido",
    copy: "Al comprar tu armazón en tienda.",
  },
  {
    number: "03",
    title: "30 días para decidir",
    copy: "Cambia o devuelve sin complicaciones.",
  },
];

const outlineButton =
  "border border-[var(--brand-espresso)] bg-white/55 px-7 py-3 text-[var(--brand-espresso)] backdrop-blur-sm transition-colors duration-200 hover:bg-[var(--brand-espresso)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-espresso)]";

export default function Home() {
  return (
    <main className="editorial-sharp bg-white text-black">
      <section className="relative isolate min-h-[760px] overflow-hidden sm:min-h-[680px]">
        <Image
          src="/images/home-hero-eyewear.png"
          alt="Armazones ópticos OLM en tonos oliva y carey"
          fill
          preload
          quality={100}
          sizes="100vw"
          className="z-0 object-cover object-[70%_center] sm:object-[64%_center] lg:object-center"
        />

        <div className="absolute inset-0 z-10 bg-[linear-gradient(90deg,rgba(247,243,238,0.95)_0%,rgba(247,243,238,0.76)_35%,rgba(247,243,238,0.12)_64%,rgba(247,243,238,0)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 z-10 h-52 bg-gradient-to-t from-[#f7f3ee]/90 via-[#f7f3ee]/35 to-transparent" />

        <div className="relative z-20 mx-auto flex min-h-[760px] max-w-7xl items-center px-5 pb-44 pt-16 sm:min-h-[680px] sm:px-8 sm:pb-40 sm:pt-20">
          <div className="max-w-xl text-left">
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.3em]">
              Óptica OLM
            </p>
            <h1 className="text-5xl leading-[0.94] sm:text-6xl md:text-7xl">
              Lentes modernos para todos los días
            </h1>
            <p className="mt-7 max-w-lg text-base leading-relaxed text-gray-700 md:text-lg">
              Compra lentes ópticos y de sol en México con estilo, calidad y precios en pesos mexicanos.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/eyeglasses"
                className={outlineButton}
              >
                Ver lentes
              </Link>
              <Link href="/sunglasses" className={outlineButton}>Ver solares</Link>
              <Link href="/eye-exam/book" className={outlineButton}>Agendar examen</Link>
            </div>
          </div>
        </div>

        <div
          className="absolute inset-x-0 bottom-0 z-20"
          aria-label="Beneficios de comprar en Óptica OLM"
        >
          <div className="mx-auto grid max-w-7xl divide-y divide-black/15 border-t border-black/20 px-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-8">
          {servicePromises.map((promise) => (
            <article
              key={promise.number}
              className="flex gap-4 py-5 sm:px-6 sm:py-6 lg:px-9"
            >
              <span className="text-xs font-semibold tracking-[0.16em] text-black/40">
                {promise.number}
              </span>
              <div>
                <h2 className="font-sans text-sm font-bold uppercase tracking-[0.12em]">
                  {promise.title}
                </h2>
                <p className="mt-1 text-sm leading-6 text-black/60">{promise.copy}</p>
              </div>
            </article>
          ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-6 sm:py-16">
        <FeaturedProductsFromDb />
      </section>

      <section className="bg-[#f7f3ee] px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-gray-600">Examen de la vista</p>
            <h2 className="mt-3 text-4xl">Tu examen en menos de un minuto</h2>
            <p className="mt-4 text-gray-700">
              Agenda con un optometrista certificado. Gratis si compras tu armazón el mismo día.
            </p>
            <Link href="/eye-exam/book" className="mt-6 inline-block border border-[var(--brand-espresso)] bg-transparent px-6 py-3 font-medium text-[var(--brand-espresso)] transition hover:bg-[var(--brand-espresso)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-espresso)]">
              Reservar mi cita
            </Link>
          </div>

          <div className="relative min-h-80 overflow-hidden border border-black/10 bg-white md:min-h-96">
            <video
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              aria-label="Examen de la vista con equipo de optometría"
              className="absolute inset-0 h-full w-full object-cover"
            >
              <source src="/videos/eye-exam.mp4" type="video/mp4" />
              Tu navegador no puede reproducir este video.
            </video>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gray-500">Cerca de ti</p>
          <h2 className="mt-2 text-3xl md:text-4xl">Visítanos en tienda</h2>
          <p className="mt-4 leading-relaxed text-gray-600">
            Conoce nuestros espacios, pruébate cualquier modelo y recibe atención personalizada.
          </p>
        </div>

        <HomeLocationFinder locations={locations} />
      </section>
    </main>
  );
}
