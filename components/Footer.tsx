import Link from "next/link";
import { locations } from "@/data/locations";
import { createWhatsAppLink } from "@/lib/whatsapp";
import LiveChatButton from "@/components/LiveChatButton";

const footerLinkClass =
  "w-fit transition hover:text-[var(--brand-espresso)] hover:underline hover:underline-offset-4";

function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="currentColor"
    >
      <path d="M13.7 21v-8h2.8l.4-3.1h-3.2V8c0-.9.3-1.5 1.6-1.5H17V3.7c-.7-.1-1.5-.2-2.3-.2-2.4 0-4 1.4-4 4.1v2.3H8V13h2.7v8h3Z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.5L3.5 20.5l1.4-4.2a8.5 8.5 0 1 1 15.6-4.6Z" />
      <path d="M8.2 7.8c.2-.4.4-.4.7-.4h.5c.2 0 .3.1.4.4l.7 1.7c.1.3.1.5-.1.7l-.6.7c-.2.2-.1.4 0 .6.7 1.3 1.7 2.3 3 2.9.2.1.4.1.6-.1l.8-1c.2-.2.4-.3.7-.2l1.8.8c.3.1.4.3.4.5 0 .4-.2 1.4-1 2-.7.6-1.6.8-2.4.6-1-.3-2.3-.8-3.8-2.1-1.8-1.6-3-3.5-3.3-4.7-.3-1.1.1-1.9.5-2.4.4-.4.8-.5 1.1-.5Z" />
    </svg>
  );
}

export default function Footer() {
  const whatsappLocation = locations.find((location) => location.whatsapp);
  const whatsappHref = whatsappLocation?.whatsapp
    ? createWhatsAppLink(
        "Hola, necesito ayuda con Óptica OLM.",
        whatsappLocation.whatsapp
      )
    : null;

  return (
    <footer className="border-t border-black/10 bg-[#f7f3ee] px-6 py-12 text-black">
      <div className="mx-auto grid max-w-7xl gap-10 sm:grid-cols-2 lg:grid-cols-[1.35fr_repeat(4,minmax(0,1fr))]">
        <div>
          <h2 className="text-xl font-bold">Óptica OLM</h2>

          <p className="mt-3 max-w-xs text-sm leading-6 text-gray-600">
            Lentes ópticos y de sol para México, con estilo y precios justos.
          </p>
        </div>

        <div>
          <h3 className="font-semibold">Comprar</h3>

          <div className="mt-4 flex flex-col gap-2.5 text-sm text-gray-600">
            <Link href="/eyeglasses" className={footerLinkClass}>
              Lentes ópticos
            </Link>

            <Link href="/sunglasses" className={footerLinkClass}>
              Lentes de sol
            </Link>

            <Link href="/clip-ons" className={footerLinkClass}>
              Clip-on
            </Link>

            <Link href="/lentes-de-contacto" className={footerLinkClass}>
              Lentes de contacto
            </Link>

            <Link href="/accessories" className={footerLinkClass}>
              Accesorios
            </Link>

            <Link href="/likes" className={footerLinkClass}>
              Mis favoritos
            </Link>

            <Link href="/cart" className={footerLinkClass}>
              Carrito
            </Link>
          </div>
        </div>

        <div>
          <h3 className="font-semibold">Servicios</h3>

          <div className="mt-4 flex flex-col gap-2.5 text-sm text-gray-600">
            <Link href="/eye-exam" className={footerLinkClass}>
              Examen de la vista
            </Link>

            <Link href="/eye-exam/book" className={footerLinkClass}>
              Agendar cita
            </Link>

            <Link href="/locations" className={footerLinkClass}>
              Nuestras tiendas
            </Link>

            <Link href="/facturacion" className={footerLinkClass}>
              Facturación electrónica
            </Link>
          </div>
        </div>

        <div>
          <h3 className="font-semibold">Cuenta</h3>

          <div className="mt-4 flex flex-col gap-2.5 text-sm text-gray-600">
            <Link href="/login" className={footerLinkClass}>
              Iniciar sesión
            </Link>

            <Link href="/signup" className={footerLinkClass}>
              Crear cuenta
            </Link>

            <Link href="/account" className={footerLinkClass}>
              Mi cuenta
            </Link>

            <Link href="/order-status" className={footerLinkClass}>
              Consultar pedido
            </Link>
          </div>
        </div>

        <div>
          <h3 className="font-semibold">Contáctanos</h3>

          <div className="mt-4 flex flex-col gap-2.5 text-sm text-gray-600">
            <a href="mailto:hola@opticaolm.mx" className={footerLinkClass}>
              hola@opticaolm.mx
            </a>

            <a href="tel:+525512345678" className={footerLinkClass}>
              +52 55 1234 5678
            </a>

            <Link href="/locations" className={footerLinkClass}>
              Ver tiendas y ubicaciones
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-12 flex max-w-7xl flex-col gap-5 border-t border-black/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-gray-500">
          © {new Date().getFullYear()} Óptica OLM. Atención a clientes en
          México.
        </p>

        <div className="flex items-center gap-3">
          <LiveChatButton />

          <span className="mr-1 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
            Síguenos
          </span>

          <a
            href="https://www.instagram.com/opticaolm/"
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram de Óptica OLM"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-black/15 bg-white transition hover:border-[var(--brand-espresso)] hover:bg-[var(--brand-espresso)] hover:text-white"
          >
            <InstagramIcon />
          </a>

          <a
            href="https://www.facebook.com/opticaolm"
            target="_blank"
            rel="noreferrer"
            aria-label="Facebook de Óptica OLM"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-black/15 bg-white transition hover:border-[var(--brand-espresso)] hover:bg-[var(--brand-espresso)] hover:text-white"
          >
            <FacebookIcon />
          </a>

          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              aria-label="WhatsApp de Óptica OLM"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-black/15 bg-white transition hover:border-[#2b7a4b] hover:bg-[#2b7a4b] hover:text-white"
            >
              <WhatsAppIcon />
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
