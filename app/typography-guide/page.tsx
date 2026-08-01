import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guía tipográfica interna · Óptica OLM",
  description: "Vista interna de los roles tipográficos de Óptica OLM.",
};

const roleCards = [
  {
    variable: "--font-logo-choice",
    helper: ".font-olm-logo",
    use: "Logotipo y etiquetas especiales de marca",
  },
  {
    variable: "--font-heading-choice",
    helper: ".font-olm-heading",
    use: "Títulos y encabezados del sitio para clientes",
  },
  {
    variable: "--font-body-choice",
    helper: ".font-olm-body",
    use: "Texto, navegación, botones, formularios y administración",
  },
  {
    variable: "--font-mono-choice",
    helper: ".font-olm-mono",
    use: "Folios, pedidos, rastreo e identificadores técnicos",
  },
];

export default function TypographyGuidePage() {
  return (
    <main className="font-olm-body bg-[#f6f2ed] px-5 py-14 text-[#241a16] sm:px-8 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="border border-black/15 bg-white px-6 py-8 sm:px-10 sm:py-12">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#76594d]">
            Herramienta interna de diseño
          </p>
          <h1 className="font-olm-heading mt-4 text-5xl leading-none sm:text-7xl">
            Guía tipográfica OLM
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-7 text-black/65">
            Esta página permite revisar los cuatro roles tipográficos antes de
            cambiar el estilo del sitio. Las fuentes activas se guardan desde
            el panel protegido de tipografía y se aplican mediante la sección
            “OLM FONT SWITCHBOARD” de app/globals.css.
          </p>
          <a
            href="/admin/typography"
            className="mt-6 inline-block border border-[#2d1f1a] px-5 py-3 text-sm font-semibold transition hover:bg-[#2d1f1a] hover:text-white"
          >
            Abrir panel de tipografía
          </a>
        </div>

        <section className="mt-6 grid gap-px border border-black/15 bg-black/15 sm:grid-cols-2 lg:grid-cols-4">
          {roleCards.map((role) => (
            <article key={role.variable} className="bg-white p-6">
              <p className="font-olm-mono text-xs text-[#76594d]">
                {role.variable}
              </p>
              <p className="mt-4 text-sm font-semibold">{role.helper}</p>
              <p className="mt-2 text-sm leading-6 text-black/60">{role.use}</p>
            </article>
          ))}
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
          <section className="border border-black/15 bg-white p-7 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">
              Logo / marca
            </p>
            <p className="font-olm-logo mt-8 text-4xl font-semibold uppercase tracking-[0.18em] sm:text-6xl">
              Óptica OLM
            </p>
            <p className="mt-4 text-sm text-black/55">
              Clase: <code className="font-olm-mono">.font-olm-logo</code>
            </p>
          </section>

          <section className="border border-black/15 bg-[#2d1f1a] p-7 text-white sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
              Folios / números técnicos
            </p>
            <p className="font-olm-mono mt-8 text-xl sm:text-2xl">
              EX-1B274B39CE3BAE6D
            </p>
            <p className="font-olm-mono mt-3 text-sm text-white/70">
              Pedido OLM-2026-004812
            </p>
            <p className="font-olm-mono mt-2 text-sm text-white/70">
              Rastreo MX-QRO-77225
            </p>
          </section>
        </div>

        <section className="mt-6 border border-black/15 bg-white p-7 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">
            Títulos para clientes
          </p>
          <h2 className="font-olm-heading mt-6 max-w-4xl text-5xl leading-[0.95] sm:text-7xl">
            Lentes modernos para todos los días
          </h2>
          <h3 className="font-olm-heading mt-10 text-3xl sm:text-4xl">
            Encuentra tu armazón ideal
          </h3>
          <p className="mt-4 max-w-2xl leading-7 text-black/65">
            Los títulos emplean la fuente editorial. Los párrafos continúan en
            la fuente de interfaz para conservar claridad y contraste.
          </p>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="border border-black/15 bg-white p-7 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">
              Texto, botón y formulario
            </p>
            <p className="mt-6 max-w-xl leading-7 text-black/70">
              Compra lentes ópticos y de sol en México con atención
              personalizada, materiales seleccionados y precios claros.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                className="border border-[#2d1f1a] bg-[#2d1f1a] px-6 py-3 text-sm font-semibold text-white transition hover:bg-white hover:text-[#2d1f1a]"
              >
                Seleccionar modelo
              </button>
              <button
                type="button"
                className="border border-[#2d1f1a] bg-white px-6 py-3 text-sm font-semibold text-[#2d1f1a] transition hover:bg-[#2d1f1a] hover:text-white"
              >
                Agendar examen
              </button>
            </div>
            <label className="mt-8 block max-w-md text-sm font-semibold">
              Correo electrónico
              <input
                type="email"
                placeholder="cliente@ejemplo.com"
                className="mt-2 h-12 w-full border border-black/20 px-4 font-normal outline-none focus:border-[#2d1f1a]"
              />
            </label>
          </section>

          <section className="border border-black/15 bg-white p-7 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">
              Ejemplo de tarjeta de producto
            </p>
            <div className="mt-6 border border-black/15">
              <div className="grid min-h-56 place-items-center bg-[#f3f1ee] px-8">
                <div className="h-16 w-52 rounded-[50%] border-[7px] border-[#6f513f] opacity-85" />
              </div>
              <div className="p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">
                  Lentes ópticos
                </p>
                <div className="mt-2 flex items-start justify-between gap-4">
                  <h3 className="font-olm-heading text-3xl">Modelo Ámbar</h3>
                  <p className="text-lg font-semibold">$1,899 MXN</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-black/60">
                  Armazón ligero para uso diario con acabado carey.
                </p>
                <button
                  type="button"
                  className="mt-6 w-full border border-[#2d1f1a] px-5 py-3 text-sm font-semibold transition hover:bg-[#2d1f1a] hover:text-white"
                >
                  Ver modelo
                </button>
              </div>
            </div>
          </section>
        </div>

        <section className="font-olm-admin mt-6 border border-black/15 bg-[#eceff1] p-7 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">
            Comprobación de administración
          </p>
          <h2 className="mt-5 text-3xl font-semibold">Panel administrativo</h2>
          <p className="mt-3 max-w-2xl leading-7 text-black/65">
            Incluso los encabezados administrativos permanecen en la fuente de
            interfaz. El estilo editorial se reserva para la experiencia del
            cliente.
          </p>
        </section>
      </div>
    </main>
  );
}
