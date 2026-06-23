export default function AdminNav() {
  return (
    <nav className="mt-8 flex flex-wrap gap-3">
      <a
        href="/admin"
        className="rounded-full border px-5 py-2 text-sm font-medium transition hover:border-black"
      >
        Admin
      </a>

      <a
        href="/admin/orders"
        className="rounded-full border px-5 py-2 text-sm font-medium transition hover:border-black"
      >
        Pedidos
      </a>

      <a
        href="/admin/products"
        className="rounded-full border px-5 py-2 text-sm font-medium transition hover:border-black"
      >
        Productos
      </a>

      <a
        href="/admin/inventory"
        className="rounded-full border px-5 py-2 text-sm font-medium transition hover:border-black"
      >
        Inventario
      </a>
    </nav>
  );
}

