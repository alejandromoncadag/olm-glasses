export default function AdminNav() {
  return (
    <nav className="mt-8 flex flex-wrap gap-3">
      <a
        href="/admin"
        className="rounded-full border border-black px-6 py-2 text-sm hover:bg-black hover:text-white"
      >
        Admin
      </a>

      <a
        href="/admin/reports"
        className="rounded-full border border-black px-6 py-2 text-sm hover:bg-black hover:text-white"
      >
        Reportes
      </a>

      <a
        href="/admin/orders"
        className="rounded-full border border-black px-6 py-2 text-sm hover:bg-black hover:text-white"
      >
        Pedidos
      </a>

      <a
        href="/admin/customers"
        className="rounded-full border border-black px-6 py-2 text-sm hover:bg-black hover:text-white"
      >
        Clientes
      </a>



      <a
        href="/admin/products"
        className="rounded-full border border-black px-6 py-2 text-sm hover:bg-black hover:text-white"
      >
        Productos
      </a>

      <a
        href="/admin/inventory"
        className="rounded-full border border-black px-6 py-2 text-sm hover:bg-black hover:text-white"
      >
        Inventario
      </a>

      <a
        href="/admin/inventory/low-stock"
        className="rounded-full border border-black px-6 py-2 text-sm hover:bg-black hover:text-white"
      >
        Stock bajo
      </a>


      <a
        href="/admin/inventory/movements"
        className="rounded-full border border-black px-6 py-2 text-sm hover:bg-black hover:text-white"
      >
        Movimientos
      </a>
    </nav>
  );
}





