"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    label: "Inicio",
    href: "/admin",
    number: "01",
  },
  {
    label: "Reportes",
    href: "/admin/reports",
    number: "02",
  },
  {
    label: "Pedidos",
    href: "/admin/orders",
    number: "03",
  },
  {
    label: "Facturación",
    href: "/admin/facturacion",
    number: "04",
  },
  {
    label: "Exámenes",
    href: "/admin/eye-exams",
    number: "05",
  },
  {
    label: "Clientes",
    href: "/admin/customers",
    number: "06",
  },
  {
    label: "Productos",
    href: "/admin/products",
    number: "07",
  },
  {
    label: "Inventario",
    href: "/admin/inventory",
    number: "08",
  },
  {
    label: "Stock bajo",
    href: "/admin/inventory/low-stock",
    number: "09",
  },
  {
    label: "Movimientos",
    href: "/admin/inventory/movements",
    number: "10",
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
    <nav
      className="mt-6 overflow-hidden rounded-2xl border border-black/8 bg-white shadow-[0_12px_35px_rgba(45,31,26,0.06)]"
      aria-label="Secciones administrativas"
    >
      <div className="flex gap-1 overflow-x-auto p-2">
        {navItems.map((item) => {
          const isActive = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`group flex min-w-max items-center gap-2 rounded-xl px-3.5 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-[#2d1f1a] text-white shadow-sm"
                  : "text-[#625750] hover:bg-[#f5f1eb] hover:text-[#2d1f1a]"
              }`}
            >
              <span
                className={`text-[9px] font-bold tracking-[0.12em] ${
                  isActive
                    ? "text-white/55"
                    : "text-[#a89c94] group-hover:text-[#6f5d53]"
                }`}
                aria-hidden
              >
                {item.number}
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}


