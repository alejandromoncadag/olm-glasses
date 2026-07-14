"use client";

import { usePathname } from "next/navigation";

const navItems = [
  {
    label: "Admin",
    href: "/admin",
  },
  {
    label: "Reportes",
    href: "/admin/reports",
  },
  {
    label: "Pedidos",
    href: "/admin/orders",
  },
  {
    label: "Clientes",
    href: "/admin/customers",
  },
  {
    label: "Productos",
    href: "/admin/products",
  },
  {
    label: "Inventario",
    href: "/admin/inventory",
  },
  {
    label: "Stock bajo",
    href: "/admin/inventory/low-stock",
  },
  {
    label: "Movimientos",
    href: "/admin/inventory/movements",
  },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === "/admin";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="mt-8 flex flex-wrap gap-3">
      {navItems.map((item) => {
        const isActive = isActivePath(pathname, item.href);

        return (
          <a
            key={item.href}
            href={item.href}
            className={`rounded-full border border-black px-6 py-2 text-sm transition ${
              isActive
                ? "bg-black text-white"
                : "bg-white text-black hover:bg-black hover:text-white"
            }`}
          >
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}



