import StripeCheckoutReturn from "@/components/StripeCheckoutReturn";

type StripeReturnPageProps = {
  searchParams: Promise<{
    session_id?: string | string[];
  }>;
};

export default async function StripeReturnPage({
  searchParams,
}: StripeReturnPageProps) {
  const params = await searchParams;
  const sessionId = Array.isArray(params.session_id)
    ? params.session_id[0]
    : params.session_id;

  return (
    <main className="min-h-screen bg-[#f7f3ef] px-6 py-16 text-black">
      <section className="mx-auto max-w-3xl">
        {sessionId ? (
          <StripeCheckoutReturn sessionId={sessionId} />
        ) : (
          <div className="rounded-3xl border bg-white p-10 text-center">
            <h1 className="text-3xl font-semibold">Falta la sesión de pago</h1>
            <p className="mt-3 text-gray-600">
              Regresa al checkout para iniciar un pago seguro.
            </p>
            <a
              href="/checkout"
              className="mt-6 inline-flex rounded-full bg-[var(--brand-espresso)] px-6 py-3 text-white"
            >
              Volver al checkout
            </a>
          </div>
        )}
      </section>
    </main>
  );
}
