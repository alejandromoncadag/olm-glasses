import InvoiceRequestFlow from "@/components/InvoiceRequestFlow";

export const metadata = {
  title: "Facturación electrónica · Óptica OLM",
  description:
    "Solicita la factura de tu compra de Óptica OLM con tu número de pedido y datos fiscales.",
};

export default function FacturacionPage() {
  return (
    <main className="min-h-screen bg-[#f7f3ee] px-5 py-14 text-black sm:px-6 sm:py-20">
      <InvoiceRequestFlow />
    </main>
  );
}
