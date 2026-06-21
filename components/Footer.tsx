export default function Footer() {
  return (
    <footer className="border-t bg-white px-6 py-10 text-black">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
        <div>
          <h2 className="text-xl font-bold">Óptica OLM</h2>
          <p className="mt-3 text-sm text-gray-600">
            Lentes ópticos y de sol para México.
          </p>
        </div>

        <div>
          <h3 className="font-semibold">Comprar</h3>
          <div className="mt-3 flex flex-col gap-2 text-sm text-gray-600">
            <a href="/eyeglasses" className="hover:underline">
              Lentes ópticos
            </a>
            <a href="/sunglasses" className="hover:underline">
              Lentes de sol
            </a>
            <a href="/cart" className="hover:underline">
              Carrito
            </a>
          </div>
        </div>

        <div>
          <h3 className="font-semibold">Contacto</h3>
          <p className="mt-3 text-sm text-gray-600">
            Atención a clientes en México.
          </p>
        </div>
      </div>
    </footer>
  );
}

