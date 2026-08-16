import Image from "next/image";
import Link from "next/link";
import FeaturedProductsFromDb from "@/components/FeaturedProductsFromDb";
import HomeLocationFinder from "@/components/HomeLocationFinder";
import { locations } from "@/data/locations";

const outlineButton =
  "border border-[var(--brand-espresso)] bg-white/55 px-7 py-3 text-[var(--brand-espresso)] backdrop-blur-sm transition-colors duration-200 hover:bg-[var(--brand-espresso)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-espresso)]";

export default function Home() {
  return (
    <main className="editorial-sharp bg-white text-black">
      <section className="relative isolate min-h-[680px] overflow-hidden">
        <Image
          src="/images/intro.png"
          alt="Armazones ópticos OLM en tonos oliva y carey"
          fill
          preload
          quality={100}
          sizes="100vw"
          className="z-0 object-cover object-[70%_center] sm:object-[64%_center] lg:object-center"
        />

        <div className="absolute inset-0 z-10 bg-[linear-gradient(90deg,rgba(247,243,238,0.95)_0%,rgba(247,243,238,0.76)_35%,rgba(247,243,238,0.12)_64%,rgba(247,243,238,0)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 z-10 h-40 bg-gradient-to-t from-[#f7f3ee]/75 via-[#f7f3ee]/20 to-transparent" />

        <div className="relative z-20 mx-auto flex min-h-[680px] max-w-7xl items-center px-5 py-20 sm:px-8">
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

      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-6 sm:py-16">
        <FeaturedProductsFromDb />
      </section>

      <section className="relative isolate overflow-hidden bg-[#edf4f5] px-6 py-20 sm:py-24">
        <video
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          src="/videos/beige.mp4"
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        />
        <div className="relative z-10 mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gray-500">Tu diseño, tus lentes</p>
          <h2 className="mt-3 max-w-3xl text-4xl sm:text-5xl">Customiza tus lentes</h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-gray-700">Elige tu armazón, tus micas y los tratamientos que necesitas en un proceso claro, paso a paso.</p>
          <div className="mt-10 grid gap-6 md:grid-cols-4">
            {[
              ["01", "Elige el armazón"],
              ["02", "Elige las micas"],
              ["03", "Agrega tratamiento o tinte"],
              ["04", "Completa tu compra"],
            ].map(([number, title]) => <div key={number} className="border-t border-black/20 pt-4"><p className="text-sm font-semibold text-gray-500">{number}</p><p className="mt-3 text-lg font-semibold">{title}</p></div>)}
          </div>
          <Link href="/customiza-tus-lentes" className="mt-10 inline-flex h-12 items-center justify-center bg-[var(--brand-espresso)] px-7 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#1f1511]">Empezar a personalizar</Link>
        </div>
      </section>

      {/*
       * Image-ready editorial banners. Upload the files named in the CSS URLs
       * to public/images when the final photography is ready; the neutral
       * background remains visible until then.
       */}
      <section
        className="relative isolate min-h-[380px] overflow-hidden bg-[#30221d] bg-cover bg-center sm:min-h-[500px] sm:bg-fixed"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(24, 16, 12, 0.78), rgba(24, 16, 12, 0.16)), url('/images/sol.png')",
        }}
        aria-label="Lentes con prescripción"
      >
        <div className="relative z-10 mx-auto flex min-h-[380px] max-w-7xl items-end px-6 py-10 sm:min-h-[500px] sm:px-10 sm:py-14">
          <div className="max-w-2xl text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/75">Prescripción OLM</p>
            <h2 className="mt-3 max-w-xl text-4xl leading-[0.98] sm:text-6xl">Tu visión, a tu manera</h2>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/sunglasses"
                className="inline-flex min-h-12 items-center justify-center border border-white/80 bg-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--brand-espresso)] transition hover:bg-[var(--brand-espresso)] hover:text-white"
              >
                Comprar solares con prescripción
              </Link>
              <Link
                href="/eyeglasses"
                className="inline-flex min-h-12 items-center justify-center border border-white/80 bg-white/10 px-6 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-white hover:text-[var(--brand-espresso)]"
              >
                Comprar ópticos con prescripción
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <FeaturedProductsFromDb
            initialCategory="opticos"
            eyebrow="Colección óptica"
            title="Modelos ópticos"
            showTabs={false}
          />
        </div>
      </section>

      <section
        className="relative isolate min-h-[380px] overflow-hidden bg-[#e6d8cb] bg-cover bg-center sm:min-h-[500px] sm:bg-fixed"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(24, 16, 12, 0.62), rgba(24, 16, 12, 0.08)), url('/images/opticos.png')",
        }}
        aria-label="Lentes solares"
      >
        <div className="relative z-10 mx-auto flex min-h-[380px] max-w-7xl items-end px-6 py-10 sm:min-h-[500px] sm:px-10 sm:py-14">
          <div className="max-w-xl text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/80">Colección solar</p>
            <h2 className="mt-3 text-4xl leading-[0.98] sm:text-6xl">Lentes solares para tus días</h2>
            <Link
              href="/sunglasses"
              className="mt-8 inline-flex min-h-12 items-center justify-center border border-white/80 bg-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--brand-espresso)] transition hover:bg-[var(--brand-espresso)] hover:text-white"
            >
              Comprar lentes solares
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[#f7f3ee] px-5 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <FeaturedProductsFromDb
            initialCategory="solares"
            eyebrow="Colección solar"
            title="Lentes solares"
            showTabs={false}
          />
        </div>
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
