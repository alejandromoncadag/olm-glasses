import LikesGrid from "@/components/LikesGrid";

export const metadata = {
  title: "Mis favoritos · Óptica OLM",
};

export default function LikesPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-12 text-black">
      <section className="mx-auto max-w-6xl">
        <p className="text-sm uppercase tracking-[0.3em] text-gray-500">
          Tu lista
        </p>
        <h1 className="mt-3 text-4xl font-bold">Mis favoritos</h1>
        <p className="mt-4 max-w-2xl text-gray-600">
          Aquí se guardan los modelos que te gustaron. Compáralos, agrégalos al
          carrito o pruébalos en tienda.
        </p>

        <LikesGrid />
      </section>
    </main>
  );
}
