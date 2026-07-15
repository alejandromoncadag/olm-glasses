import { getLocationBySlug } from "@/data/locations";
import { createWhatsAppLink } from "@/lib/whatsapp";

export const metadata = {
  title: "Lentes de contacto · Óptica OLM",
  description:
    "Conoce las opciones de lentes de contacto y agenda una valoración en Óptica OLM Cuautitlán.",
};

const contactLensTypes = [
  {
    title: "Lentes diarios",
    description:
      "Una opción práctica y cómoda: estrenas un par nuevo cada día y no necesitas una rutina de limpieza.",
  },
  {
    title: "Lentes mensuales",
    description:
      "Diseñados para reutilizarse durante el periodo indicado, con limpieza y almacenamiento adecuados.",
  },
  {
    title: "Lentes tóricos",
    description:
      "Opciones especializadas para corregir el astigmatismo con una adaptación precisa.",
  },
  {
    title: "Lentes multifocales",
    description:
      "Ayudan a ver a distintas distancias y pueden ser una alternativa para personas con presbicia.",
  },
  {
    title: "Lentes cosméticos o de color",
    description:
      "Disponibles según valoración y existencias. La adaptación y la salud de tus ojos siempre van primero.",
  },
];

const cuautitlanLocation = getLocationBySlug("cuautitlan-edomex");
const whatsappHref = cuautitlanLocation?.whatsapp
  ? createWhatsAppLink(
      "Hola, quiero información sobre lentes de contacto en Óptica OLM Cuautitlán.",
      cuautitlanLocation.whatsapp
    )
  : null;

export default function ContactLensesPage() {
  return (
    <main className="min-h-screen bg-white text-black">
      <section className="bg-[#f7f3ee] px-6 py-20 text-center">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-600">
            Lentes de contacto
          </p>
          <h1 className="mt-4 text-5xl font-bold leading-tight md:text-6xl">
            Visión clara con libertad y comodidad
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-700">
            Te ayudamos a encontrar el tipo de lente de contacto adecuado para
            tu graduación, tus ojos y tu rutina. Todo comienza con una
            valoración profesional y una adaptación personalizada.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="/eye-exam/book?location=cuautitlan-edomex"
              className="rounded-full bg-black px-7 py-3.5 font-medium text-white transition hover:bg-black/80"
            >
              Agendar examen de la vista
            </a>

            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-black px-7 py-3.5 font-medium transition hover:bg-black hover:text-white"
              >
                Preguntar por WhatsApp
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="max-w-3xl">
          <p className="text-sm uppercase tracking-[0.25em] text-gray-500">
            Opciones para diferentes necesidades
          </p>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">
            Te orientamos para elegir bien
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-gray-600">
            La graduación de tus lentes de armazón no siempre es igual a la de
            los lentes de contacto. Nuestro equipo revisa tu visión y el ajuste
            antes de recomendar una opción.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {contactLensTypes.map((type) => (
            <article
              key={type.title}
              className="rounded-2xl border border-black/10 bg-white p-6"
            >
              <span
                className="block h-2 w-10 rounded-full bg-black"
                aria-hidden
              />
              <h3 className="mt-5 text-xl font-semibold">{type.title}</h3>
              <p className="mt-3 leading-relaxed text-gray-600">
                {type.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#f7f3ee] px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 md:grid-cols-[0.8fr_1.2fr] md:items-start">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-gray-500">
                Tu primera adaptación
              </p>
              <h2 className="mt-3 text-3xl font-bold md:text-4xl">
                Acompañamiento desde el primer par
              </h2>
              <p className="mt-4 leading-relaxed text-gray-700">
                Además de revisar tu graduación, te enseñamos a colocar, retirar
                y cuidar tus lentes de contacto de forma adecuada.
              </p>
            </div>

            <ol className="grid gap-4">
              {[
                {
                  step: "1",
                  title: "Revisamos tu visión",
                  copy: "Evaluamos tu graduación y conversamos sobre tus necesidades y hábitos.",
                },
                {
                  step: "2",
                  title: "Elegimos el lente adecuado",
                  copy: "Consideramos material, frecuencia de reemplazo, corrección y comodidad.",
                },
                {
                  step: "3",
                  title: "Verificamos el ajuste",
                  copy: "Comprobamos cómo se siente y se comporta el lente antes de definir tu opción.",
                },
              ].map((item) => (
                <li
                  key={item.step}
                  className="flex gap-4 rounded-2xl bg-white p-5"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">
                    {item.step}
                  </span>
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-gray-600">
                      {item.copy}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 text-center">
        <div className="mx-auto max-w-3xl rounded-3xl border border-black/10 px-6 py-12 md:px-12">
          <h2 className="text-3xl font-bold">¿Quieres probarlos?</h2>
          <p className="mx-auto mt-4 max-w-xl text-gray-600">
            Agenda tu examen en Cuautitlán o escríbenos para resolver tus dudas
            sobre disponibilidad, adaptación y cuidado.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <a
              href="/eye-exam/book?location=cuautitlan-edomex"
              className="rounded-full bg-black px-7 py-3.5 font-medium text-white transition hover:bg-black/80"
            >
              Agendar examen de la vista
            </a>
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-black px-7 py-3.5 font-medium transition hover:bg-black hover:text-white"
              >
                WhatsApp Cuautitlán
              </a>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
