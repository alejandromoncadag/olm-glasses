import ContactLensCatalog from "@/components/ContactLensCatalog";
import { contactLensProducts } from "@/data/secondaryCatalog";

export const metadata = {
  title: "Lentes de contacto · Óptica OLM",
  description:
    "Compra lentes de contacto diarios, mensuales y tóricos con orientación de Óptica OLM.",
};

export default function ContactLensesPage() {
  return (
    <main className="min-h-screen bg-white text-black">
      <section className="border-b border-black/10 bg-[#eef5f2] px-6 py-14 md:py-20">
        <div className="mx-auto max-w-[1440px]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gray-500">
            Comodidad y visión clara
          </p>
          <h1 className="mt-3 text-5xl font-bold tracking-[-0.04em] md:text-7xl">
            Lentes de contacto
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-gray-600">
            Elige tu marca y tipo de reemplazo. Confirma tu graduación antes de
            comprar.
          </p>
        </div>
      </section>

      <ContactLensCatalog products={contactLensProducts} />
    </main>
  );
}
