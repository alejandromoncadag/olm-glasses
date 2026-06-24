export default function Footer() {
  return (
    <footer className="border-t bg-white px-6 py-12 text-black">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-4">
        <div>
          <h2 className="text-xl font-bold">Óptica OLM</h2>
          <p className="mt-3 text-sm text-gray-600">
            Lentes ópticos y de sol para México, con estilo y precios justos.
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
            <a href="/likes" className="hover:underline">
              Mis favoritos
            </a>
            <a href="/cart" className="hover:underline">
              Carrito
            </a>
          </div>
        </div>

        <div>
          <h3 className="font-semibold">Servicios</h3>
          <div className="mt-3 flex flex-col gap-2 text-sm text-gray-600">
            <a href="/eye-exam" className="hover:underline">
              Examen de la vista
            </a>
            <a href="/eye-exam/book" className="hover:underline">
              Agendar cita
            </a>
            <a href="/locations" className="hover:underline">
              Nuestras tiendas
            </a>
          </div>
        </div>

        <div>
          <h3 className="font-semibold">Cuenta</h3>
          <div className="mt-3 flex flex-col gap-2 text-sm text-gray-600">
            <a href="/login" className="hover:underline">
              Iniciar sesión
            </a>
            <a href="/signup" className="hover:underline">
              Crear cuenta
            </a>
            <a href="/account" className="hover:underline">
              Mi cuenta
            </a>
          </div>
        </div>
      </div>

      <p className="mx-auto mt-10 max-w-6xl text-xs text-gray-500">
        © {new Date().getFullYear()} Óptica OLM. Atención a clientes en México.
      </p>
    </footer>
  );
}
