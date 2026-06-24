import { locations } from "@/data/locations";

export const metadata = {
  title: "Examen de la vista · Óptica OLM",
};

const services = [
  {
    title: "Examen completo de la vista",
    duration: "30 min",
    price: "$400 MXN",
    description:
      "Revisión completa con optometrista certificado: agudeza visual, refracción y salud ocular.",
  },
  {
    title: "Examen + asesoría de armazón",
    duration: "45 min",
    price: "$400 MXN",
    description:
      "Combina tu examen con una asesoría personalizada para encontrar el armazón ideal para tu rostro.",
  },
  {
    title: "Examen para niños",
    duration: "30 min",
    price: "$350 MXN",
    description:
      "Examen adaptado para los más pequeños, con un optometrista pediátrico.",
  },
];

export default function EyeExamPage() {
  return (
    <main className="min-h-screen bg-white text-black">
      <section className="bg-[#f7f3ee] px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-gray-600">
              Examen de la vista
            </p>
            <h1 className="mt-3 text-5xl font-bold md:text-6xl">
              Tu cita en menos de un minuto
            </h1>
            <p className="mt-5 max-w-xl text-lg text-gray-700">
              Reserva un examen con un optometrista certificado en nuestra
              tienda. Sin tarjeta, sin compromiso. Si compras un armazón el
              mismo día, el examen es{" "}
              <span className="font-semibold">gratis</span>.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/eye-exam/book"
                className="rounded-full bg-black px-8 py-4 text-white"
              >
                Agendar mi cita
              </a>
              <a
                href="/locations"
                className="rounded-full border border-black px-8 py-4"
              >
                Ver tiendas
              </a>
            </div>
          </div>

          <div className="flex h-80 items-center justify-center rounded-3xl bg-white">
            <span className="text-gray-500">Foto del optometrista</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-3xl font-bold">Cómo funciona</h2>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            {
              step: "1",
              title: "Elige tu tienda",
              copy: "Selecciona la sucursal más cercana a ti.",
            },
            {
              step: "2",
              title: "Elige día y hora",
              copy: "Reserva en línea en bloques de 30 minutos.",
            },
            {
              step: "3",
              title: "Llega y relájate",
              copy: "Nuestro optometrista te atiende y, si quieres, sales con tus lentes ese mismo día.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-2xl border bg-white p-6"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">
                {item.step}
              </span>
              <h3 className="mt-4 text-xl font-semibold">{item.title}</h3>
              <p className="mt-2 text-gray-600">{item.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-3xl font-bold">Tipos de examen</h2>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {services.map((service) => (
            <div
              key={service.title}
              className="rounded-2xl border bg-white p-6"
            >
              <p className="text-xs uppercase tracking-widest text-gray-500">
                {service.duration} · {service.price}
              </p>
              <h3 className="mt-2 text-xl font-semibold">{service.title}</h3>
              <p className="mt-3 text-gray-600">{service.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-3xl font-bold">Dónde hacerlo</h2>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {locations.map((location) => (
            <a
              key={location.slug}
              href={`/eye-exam/book?location=${location.slug}`}
              className="rounded-2xl border bg-white p-6 transition hover:shadow-lg"
            >
              <p className="text-xs uppercase tracking-widest text-gray-500">
                {location.city}
              </p>
              <h3 className="mt-1 text-xl font-semibold">{location.name}</h3>
              <p className="mt-2 text-gray-600">{location.address}</p>
              <p className="mt-3 text-sm font-medium text-black underline">
                Reservar aquí →
              </p>
            </a>
          ))}
        </div>
      </section>

      <section className="bg-[#f7f3ee] px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold">¿Listo?</h2>
          <p className="mt-4 text-gray-700">
            Toma menos tiempo agendar que terminar este café.
          </p>
          <a
            href="/eye-exam/book"
            className="mt-8 inline-block rounded-full bg-black px-8 py-4 text-white"
          >
            Agendar mi cita
          </a>
        </div>
      </section>
    </main>
  );
}
