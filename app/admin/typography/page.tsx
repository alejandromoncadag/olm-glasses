import AdminNav from "@/components/AdminNav";
import AdminTypographySettings from "@/components/AdminTypographySettings";

export const metadata = {
  title: "Tipografía · Admin OLM",
};

export default function AdminTypographyPage() {
  return (
    <main className="min-h-screen bg-[#f7f6f3] px-5 py-10 text-[#211b18] sm:px-8 sm:py-14">
      <section className="mx-auto max-w-7xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#80675b]">
          Apariencia del sitio
        </p>
        <h1 className="mt-3 text-4xl font-semibold">Tipografía</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-black/60">
          Prueba familias de Google Fonts y guarda la combinación activa para
          este entorno. Los cambios guardados se aplican al sitio para clientes;
          el panel administrativo siempre permanece en Geist.
        </p>

        <AdminNav />

        <div className="mt-8">
          <AdminTypographySettings />
        </div>
      </section>
    </main>
  );
}
