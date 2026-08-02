import CommerceCartItems from "@/components/CommerceCartItems";

type CartPageProps = {
  searchParams: Promise<{
    returnTo?: string;
  }>;
};

function getSafeReturnTo(returnTo?: string) {
  if (
    returnTo &&
    returnTo.startsWith("/") &&
    !returnTo.startsWith("//") &&
    !returnTo.startsWith("/cart")
  ) {
    return returnTo;
  }

  return "/eyeglasses";
}

export default async function CartPage({ searchParams }: CartPageProps) {
  const { returnTo } = await searchParams;

  return (
    <main className="min-h-screen bg-white px-6 py-12 text-black">
      <section className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold">Carrito</h1>

        <p className="mt-4 text-gray-600">
          Revisa los productos y cantidades guardados en tu carrito.
        </p>

        <CommerceCartItems returnTo={getSafeReturnTo(returnTo)} />
      </section>
    </main>
  );
}
