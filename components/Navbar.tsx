export default function Navbar() {
  return (
    <header className="border-b bg-white text-black">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <a href="/" className="text-2xl font-bold">
          Óptica OLM
        </a>

        <div className="flex items-center gap-8 text-sm font-medium">
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
      </nav>
    </header>
  );
}
