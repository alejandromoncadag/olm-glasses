import ContactLensCatalog from "@/components/ContactLensCatalog";

export const metadata = {
  title: "Lentes de contacto · Óptica OLM",
  description:
    "Compra lentes de contacto diarios, mensuales y tóricos con orientación de Óptica OLM.",
};

export default function ContactLensesPage() {
  return (
    <main className="min-h-screen bg-[#f7f3ee] text-[#171717]">
      <section className="border-b border-[#d9cfc8] bg-[#f7f3ee]">
        <div className="mx-auto max-w-[1440px] px-5 pb-10 pt-16 sm:px-6 md:pb-14 md:pt-24">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gray-500">CONTACTOS</p>
          <h1 className="mt-4 text-4xl font-medium tracking-[-0.03em] md:text-6xl">Lentes de contacto</h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-gray-700 md:text-lg">Elige tu marca y tipo de reemplazo. Confirma tu graduación antes de comprar.</p>
        </div>
      </section>

      <ContactLensCatalog />
    </main>
  );
}
